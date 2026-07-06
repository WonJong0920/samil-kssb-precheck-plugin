"""Samil KSSB Precheck - HWP-first Assisted Runner (Cycle 2N-2, source-only skeleton).

**경계(2N-1A scope decision · Codex 2N-1 조건 계승)**:
- 이 모듈은 **plugin core가 아니며 Skill entrypoint도 아니다.** core(schema/validator/renderer/delivery)는
  이 모듈의 존재를 모른다(참조 금지). Skill이 사용자 승인 절차를 **중개**할 때만 안내되는 보조 도구다.
- **무승인 실행 금지**: 설치/실행은 명시적 승인 플래그(`--approve-install`/`--approve-run`) 없이는
  절대 수행되지 않는다. 승인 없는 호출은 한국어 승인 안내문을 출력하고 종료한다.
- **HWP-first 범위**: Kordoc 기반 HWP/HWPX/DOCX 구조·텍스트 경로만. **OCR·tesseract.js·traineddata·
  rasterizer·portable Node는 범위 밖**(gated — 이 모듈은 해당 승인 대화를 표시하지 않는다).
- **설치 위치**: repo 밖 tool-cache(`<사용자 홈>/.samil-kssb-precheck/tools/`)에만 `npm --prefix`로 설치.
  repo 루트 package.json·npm global·npx·repo 내부 node_modules는 사용하지 않는다.
  **`--omit=optional` 필수**(RH-B2 — native optional 재유입 방지).
- **egress 분리**: 설치(준비)는 egress 허용·`prep_egress_log.jsonl` 기록. 파싱(실행)은 nethook
  (no-egress 훅) preload 하에 수행하며, **`no_egress_verified=true`는 훅 요약이 실제 관측되고
  egress 시도 0인 실행에만** 기록된다(훅 미관측 실행은 false — evidence 모드에서는 실패 처리).
- **artifact**: `--out-dir` 필수. 파일명 규약 `<문서stem>.intake.json` / `<문서stem>.aux_signals.json`.
  OCR 산출물(`.ocr_text.json`)은 HWP-first 범위 밖이라 생성하지 않는다. provider명·로컬 경로는
  사용자-facing 산출물로 흘러가지 않는다(§7 — provider명은 승인 대화와 내부 로그에만).

표준 라이브러리만 사용한다(같은 intake 계층의 aux_structure_scanner만 선택적 import).
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Callable

KORDOC_VERSION = "3.13.0"
PDFJS_VERSION = "4.10.38"
NPM_SOURCE = "registry.npmjs.org"

# HWP-first 지원 확장자(스캔/이미지 OCR 계열은 범위 밖).
SUPPORTED_EXTENSIONS = {".hwp", ".hwpx", ".docx"}

# 종료 코드(승인 대기·범위 밖 등은 오류가 아니라 상태다).
EXIT_OK = 0
EXIT_USAGE = 2
EXIT_OUT_OF_SCOPE = 3
EXIT_NODE_MISSING = 4
EXIT_INSTALL_APPROVAL_REQUIRED = 5
EXIT_RUN_APPROVAL_REQUIRED = 6
EXIT_RUN_FAILED = 7

_NETHOOK_SUMMARY_RE = re.compile(r"\[NETHOOK-SUMMARY\].*?egressAttempts=(\d+)")


class RunnerError(RuntimeError):
    """runner 정책 위반·실행 실패."""


def _utf8_stdout() -> None:
    """Windows 콘솔에서 한국어 출력 보장(가능한 경우에만 — 실패해도 치명적이지 않음)."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
        except Exception:
            pass


# ---- 경로/탐지 ---------------------------------------------------------------

def default_tool_cache() -> Path:
    """repo 밖 전용 tool-cache 기본 경로(U1). 호출만으로 디렉터리를 만들지 않는다."""
    return Path.home() / ".samil-kssb-precheck" / "tools"


def kordoc_prefix(tool_cache: Path) -> Path:
    """버전 디렉터리 — pin 드리프트를 경로 수준에서 감지(U1/Version Strategy)."""
    return Path(tool_cache) / f"kordoc@{KORDOC_VERSION}"


def kordoc_cli_path(tool_cache: Path) -> Path:
    return kordoc_prefix(tool_cache) / "node_modules" / "kordoc" / "dist" / "cli.js"


def nethook_path() -> Path:
    return Path(__file__).resolve().parent / "nethook.cjs"


def detect_node(which: Callable[[str], str | None] = shutil.which) -> dict:
    """시스템 Node/npm 탐지(U2-A). portable Node 설치는 제안하지 않는다(범위 밖)."""
    return {"node": which("node"), "npm": which("npm")}


def check_kordoc(tool_cache: Path) -> dict:
    """tool-cache 내 Kordoc 설치·pin 일치 확인(전역/PATH의 임의 버전은 신뢰하지 않는다)."""
    pkg = kordoc_prefix(tool_cache) / "node_modules" / "kordoc" / "package.json"
    if not pkg.is_file():
        return {"installed": False, "version_ok": False, "cli": None}
    try:
        version = json.loads(pkg.read_text(encoding="utf-8")).get("version")
    except Exception:
        return {"installed": True, "version_ok": False, "cli": None}
    cli = kordoc_cli_path(tool_cache)
    return {"installed": True, "version_ok": version == KORDOC_VERSION,
            "cli": cli if cli.is_file() else None}


def is_inside_repo(path: Path) -> bool:
    """경로가 git repo 내부인지(중간 산출물의 repo 낙하 방지 안내용)."""
    p = Path(path).resolve()
    for candidate in (p, *p.parents):
        if (candidate / ".git").exists():
            return True
    return False


# ---- 명령 빌더 (실행하지 않음 — 실행은 승인 게이트 뒤에서만) --------------------

def build_install_command(tool_cache: Path) -> list[str]:
    """Kordoc 설치 명령(U1 pin·`--omit=optional` 필수). npm global/npx/repo 설치 아님."""
    prefix = kordoc_prefix(tool_cache)
    return [
        "npm", "install",
        "--prefix", str(prefix),
        "--omit=optional",          # RH-B2: native optional 재유입 방지(필수)
        "--no-audit", "--no-fund",
        f"kordoc@{KORDOC_VERSION}",
        f"pdfjs-dist@{PDFJS_VERSION}",
    ]


def build_run_command(node_exe: str, input_path: Path, out_file: Path,
                      tool_cache: Path) -> tuple[list[str], dict]:
    """Kordoc 파싱 명령 + 환경. 실행은 항상 no-egress 훅(preload) 하에서만 구성한다."""
    cmd = [
        node_exe, "--require", str(nethook_path()),
        str(kordoc_cli_path(tool_cache)),
        str(input_path),
        "--format", "json",
        "-o", str(out_file),
        "--silent",
    ]
    env_extra = {"NETHOOK_MODE": "block"}
    return cmd, env_extra


# ---- 승인 문구 (한국어 — U5: 승인 대화에는 provider명 명시) ---------------------

def install_approval_message(tool_cache: Path) -> str:
    prefix = kordoc_prefix(tool_cache)
    return (
        "■ 로컬 판독 도구 설치 승인이 필요합니다\n"
        f"  - 설치 대상: Kordoc {KORDOC_VERSION} (+ pdfjs-dist {PDFJS_VERSION})\n"
        f"  - 출처: 공식 npm registry ({NPM_SOURCE})\n"
        f"  - 설치 위치: 로컬 전용 폴더 {prefix} (이 저장소 밖 — 삭제는 폴더 제거로 완결)\n"
        "  - 준비(설치) 단계에서만 네트워크 통신이 발생하며, 문서 분석 실행 단계는\n"
        "    네트워크 차단(no-egress) 훅 아래에서 수행됩니다.\n"
        "  - 설치를 거부해도 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.\n"
        "  → 동의하시면 --approve-install 플래그와 함께 다시 실행하십시오."
    )


def run_approval_message(input_name: str) -> str:
    return (
        "■ 문서 판독 실행 승인이 필요합니다\n"
        f"  - 대상 문서: {input_name}\n"
        "  - 실행은 네트워크 차단(no-egress) 훅 아래에서 로컬로만 수행됩니다.\n"
        "  - 산출물은 지정한 --out-dir 폴더에만 생성됩니다.\n"
        "  - 거부해도 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.\n"
        "  → 동의하시면 --approve-run 플래그와 함께 다시 실행하십시오."
    )


def node_missing_message() -> str:
    """U2-A: 설치 안내 + baseline 수렴. portable Node는 제안하지 않는다(범위 밖)."""
    return (
        "■ Node.js/npm이 확인되지 않았습니다\n"
        "  - 보조 판독 경로(HWP/HWPX/DOCX 구조 판독)에는 Node.js 실행 환경이 필요합니다.\n"
        "  - Node.js는 공식 사이트(nodejs.org)에서 직접 설치하실 수 있습니다(이 도구가 대신 설치하지 않습니다).\n"
        "  - 지금은 기본 텍스트 기반 검토로 계속 진행합니다. 판독 불가 구간은 확인 불가로 표시되고\n"
        "    고객 확인 질문으로 연결됩니다."
    )


def out_of_scope_message(ext: str) -> str:
    return (
        f"■ 이 파일 형식({ext})은 현재 보조 판독 경로의 범위 밖입니다\n"
        "  - 이 경로는 HWP/HWPX/DOCX 문서만 다룹니다(스캔/이미지 문서의 OCR은 별도 단계 예정).\n"
        "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다."
    )


# ---- 준비 egress 기록 ----------------------------------------------------------

def append_prep_egress(tool_cache: Path, action: str, status: str,
                       command_summary: str, provider: str = "kordoc",
                       version: str = KORDOC_VERSION, source: str = NPM_SOURCE,
                       now: Callable[[], float] = time.time) -> Path:
    """준비 단계 egress 기록(내부 전용 — 사용자-facing 산출물로 전이 금지)."""
    tool_cache = Path(tool_cache)
    tool_cache.mkdir(parents=True, exist_ok=True)
    log = tool_cache / "prep_egress_log.jsonl"
    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now())),
        "action": action,
        "provider": provider,
        "version": version,
        "source": source,
        "command_summary": command_summary,
        "status": status,
    }
    with log.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + "\n")
    return log


def record_approval(tool_cache: Path, kind: str, target: str,
                    now: Callable[[], float] = time.time) -> Path:
    """승인 marker(U3 — tool-cache 내부에만 기록)."""
    tool_cache = Path(tool_cache)
    tool_cache.mkdir(parents=True, exist_ok=True)
    path = tool_cache / "approvals.json"
    data: dict[str, Any] = {}
    if path.is_file():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            data = {}
    data.setdefault(kind, {})[target] = time.strftime(
        "%Y-%m-%dT%H:%M:%SZ", time.gmtime(now()))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True),
                    encoding="utf-8")
    return path


# ---- artifact / provenance -----------------------------------------------------

def artifact_paths(input_path: Path, out_dir: Path) -> dict:
    """파일명 규약(한국어·공백 파일명 보존). OCR 산출물은 HWP-first 범위 밖."""
    stem = Path(input_path).stem
    out = Path(out_dir)
    return {
        "intake": out / f"{stem}.intake.json",
        "aux_signals": out / f"{stem}.aux_signals.json",
    }


def build_run_provenance(child_output: str, evidence_mode: bool = False) -> dict:
    """실행 provenance. `no_egress_verified`는 **훅 요약이 실제 관측되고 egress 0**일 때만 true.

    훅 미관측 실행은 false로 정직하게 기록하고, evidence 모드에서는 실패 처리한다
    (AVR-04 — 무근거 no-egress 주장 방지).
    """
    m = _NETHOOK_SUMMARY_RE.search(child_output or "")
    hook_observed = m is not None
    egress_attempts = int(m.group(1)) if m else None
    verified = bool(hook_observed and egress_attempts == 0)
    if evidence_mode and not verified:
        raise RunnerError(
            "evidence 모드: no-egress 훅 요약이 관측되지 않았거나 egress 시도가 있어 실패 처리합니다.")
    return {
        "provider": "kordoc",
        "provider_version": KORDOC_VERSION,
        "hook_observed": hook_observed,
        "egress_attempts": egress_attempts,
        "no_egress_verified": verified,
    }


def append_run_log(tool_cache: Path, provenance: dict, input_name: str,
                   now: Callable[[], float] = time.time) -> Path:
    """실행 provenance는 tool-cache 내부 로그에만(사용자-facing 산출물 아님)."""
    tool_cache = Path(tool_cache)
    tool_cache.mkdir(parents=True, exist_ok=True)
    log = tool_cache / "run_log.jsonl"
    entry = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now())),
             "input": input_name, **provenance}
    with log.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + "\n")
    return log


# ---- 실행 오케스트레이션 (승인 게이트 뒤에서만 exec_fn 호출) ---------------------

def _default_exec(cmd: list[str], env_extra: dict) -> tuple[int, str]:
    import os
    env = dict(os.environ)
    env.update(env_extra or {})
    proc = subprocess.run(cmd, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", env=env)
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def main(argv: list[str] | None = None,
         which: Callable[[str], str | None] = shutil.which,
         exec_fn: Callable[[list[str], dict], tuple[int, str]] = _default_exec) -> int:
    _utf8_stdout()
    ap = argparse.ArgumentParser(
        prog="hwp_assisted_runner",
        description="[opt-in] HWP-first 보조 판독 runner — 승인 없이 설치/실행하지 않음")
    ap.add_argument("input", help="대상 문서 경로(HWP/HWPX/DOCX)")
    ap.add_argument("--out-dir", required=True, help="산출물 폴더(필수 — repo 밖 권장)")
    ap.add_argument("--tool-cache", default=str(default_tool_cache()),
                    help="도구 캐시 폴더(기본: 사용자 홈 하위, repo 밖)")
    ap.add_argument("--check", action="store_true",
                    help="plan 모드 — 설치·실행 없이 필요한 작업과 승인 문구만 표시")
    ap.add_argument("--approve-install", action="store_true",
                    help="Kordoc 설치 승인(명시적 동의)")
    ap.add_argument("--approve-run", action="store_true",
                    help="문서 판독 실행 승인(명시적 동의)")
    ap.add_argument("--evidence-mode", action="store_true",
                    help="검증 모드 — 훅 미관측 실행을 실패 처리")
    ns = ap.parse_args(argv)

    input_path = Path(ns.input)
    tool_cache = Path(ns.tool_cache)
    out_dir = Path(ns.out_dir)

    # 1) HWP-first 범위 확인
    ext = input_path.suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        print(out_of_scope_message(ext or "(확장자 없음)"))
        return EXIT_OUT_OF_SCOPE

    # 2) out-dir 안내(강제는 .gitignore 방어와 이중화)
    if is_inside_repo(out_dir):
        print("주의: --out-dir이 git 저장소 내부로 보입니다. 산출물은 저장소 밖 폴더를 권장합니다.")

    # 3) 시스템 Node 확인(U2-A). portable Node는 제안하지 않는다.
    node = detect_node(which)
    if not node["node"] or not node["npm"]:
        print(node_missing_message())
        return EXIT_NODE_MISSING

    kd = check_kordoc(tool_cache)
    install_needed = not (kd["installed"] and kd["version_ok"] and kd["cli"])

    # 4) check/plan 모드 — 설치·실행 없이 계획만
    if ns.check:
        print("■ 점검 결과(plan 모드 — 설치/실행 없음)")
        print(f"  - Node/npm: 확인됨")
        print(f"  - Kordoc {KORDOC_VERSION}: {'설치 필요' if install_needed else '준비됨'}")
        if install_needed:
            print(f"  - 설치 명령(승인 후 실행): {' '.join(build_install_command(tool_cache))}")
            print(install_approval_message(tool_cache))
        print(run_approval_message(input_path.name))
        return EXIT_OK

    # 5) 설치 승인 게이트 — 무승인 설치 금지
    if install_needed:
        if not ns.approve_install:
            print(install_approval_message(tool_cache))
            return EXIT_INSTALL_APPROVAL_REQUIRED
        cmd = build_install_command(tool_cache)
        record_approval(tool_cache, "install", f"kordoc@{KORDOC_VERSION}")
        append_prep_egress(tool_cache, action="install", status="started",
                           command_summary=" ".join(cmd[:6]) + " ...")
        rc, _output = exec_fn(cmd, {})
        append_prep_egress(tool_cache, action="install",
                           status="ok" if rc == 0 else f"failed rc={rc}",
                           command_summary=" ".join(cmd[:6]) + " ...")
        if rc != 0:
            print("설치에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도하거나, 기본 텍스트 기반 검토로 계속하십시오.")
            return EXIT_RUN_FAILED

    # 6) 실행 승인 게이트 — 무승인 실행 금지
    if not ns.approve_run:
        print(run_approval_message(input_path.name))
        return EXIT_RUN_APPROVAL_REQUIRED

    out_dir.mkdir(parents=True, exist_ok=True)
    record_approval(tool_cache, "run", input_path.name)
    paths = artifact_paths(input_path, out_dir)
    cmd, env_extra = build_run_command(node["node"], input_path, paths["intake"], tool_cache)
    rc, output = exec_fn(cmd, env_extra)
    provenance = build_run_provenance(output, evidence_mode=ns.evidence_mode)
    append_run_log(tool_cache, provenance, input_path.name)
    if rc != 0:
        print("문서 판독 실행에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.")
        return EXIT_RUN_FAILED

    # 7) HWPX/DOCX면 stdlib 보조 스캐너로 aux_signals 생성(in-process 허용 구성요소)
    if ext in (".hwpx", ".docx"):
        try:
            sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
            import aux_structure_scanner as A  # intake 계층 내부 import(core 아님)
            aux = A.build_aux_signals(input_path)
            paths["aux_signals"].write_text(
                json.dumps(aux, ensure_ascii=False, indent=1, sort_keys=True),
                encoding="utf-8")
        except Exception as e:  # aux는 보조 신호 — 실패해도 intake 산출은 유효
            print(f"보조 구조 신호 생성은 건너뜁니다(사유 유형: {type(e).__name__}).")

    print("■ 판독 완료 — 산출물이 지정한 폴더에 생성되었습니다.")
    print(f"  - {paths['intake'].name}")
    if paths["aux_signals"].exists():
        print(f"  - {paths['aux_signals'].name}")
    print("  - 이 산출물은 검토 재료(초안 입력)이며, 최종 판단은 컨설턴트 검수를 따릅니다.")
    return EXIT_OK


if __name__ == "__main__":
    raise SystemExit(main())
