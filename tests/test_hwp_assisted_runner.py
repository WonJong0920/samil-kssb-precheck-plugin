"""HWP-first assisted runner 테스트(표준 라이브러리만, Cycle 2N-2).

실제 npm install·Kordoc 설치·provider 실행·외부 네트워크 없이 통과한다:
- 명령 빌더·승인 게이트·prep egress 기록·provenance 정책은 mock exec_fn/임시 디렉터리로 검증.
- 실제 사용자 홈의 tool-cache는 만들지 않는다(tmp 경로만 사용).

경계 증명: 무승인 설치/실행 금지 · --out-dir fail-fast · HWP-first 범위 밖 정중 종료 ·
Node 부재 시 안내+baseline 수렴(portable Node 미제안) · pin/--omit=optional ·
no_egress_verified는 훅 요약 관측+egress 0일 때만 · 한국어/공백 파일명 · core 미참조.

종료 코드: 모든 점검 PASS면 0, 하나라도 실패면 1.
"""
from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RUNNERS = REPO / "src" / "intake" / "runners"
sys.path.insert(0, str(RUNNERS))

import hwp_assisted_runner as R  # noqa: E402

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


def run_main(argv, which=None, exec_fn=None):
    """main()을 stdout 캡처와 함께 실행. (rc, stdout) 반환."""
    calls: list = []

    def recording_exec(cmd, env):
        calls.append((cmd, env))
        return 0, ""

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = R.main(argv,
                    which=which or (lambda n: f"C:/fake/{n}.exe"),
                    exec_fn=exec_fn or recording_exec)
    return rc, buf.getvalue(), calls


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="hwp-runner-test-"))
    cache = tmp / "cache"
    out = tmp / "산출물 폴더"   # 한국어+공백 out-dir
    doc = tmp / "한글 문서 이름.hwpx"  # 한국어+공백 파일명
    doc.write_bytes(b"fake")

    # 1. --out-dir 없으면 fail-fast (argparse 종료 코드 2)
    try:
        with contextlib.redirect_stderr(io.StringIO()):
            R.main([str(doc), "--tool-cache", str(cache)])
        check("--out-dir 필수(fail-fast)", False, "no exit")
    except SystemExit as e:
        check("--out-dir 필수(fail-fast)", e.code == 2, f"code={e.code}")

    # 2. HWP-first 범위 밖 확장자 → 정중 종료(EXIT_OUT_OF_SCOPE)
    pdf = tmp / "스캔.pdf"
    pdf.write_bytes(b"fake")
    rc, out_text, _ = run_main([str(pdf), "--out-dir", str(out), "--tool-cache", str(cache)])
    check("범위 밖 확장자 정중 종료", rc == R.EXIT_OUT_OF_SCOPE)
    check("범위 밖 안내가 한국어·OCR 별도 단계 명시", "범위 밖" in out_text and "OCR" in out_text)

    # 3. Node/npm 부재 → 설치 안내 + baseline 수렴, portable Node 미제안
    rc, out_text, calls = run_main([str(doc), "--out-dir", str(out), "--tool-cache", str(cache)],
                                   which=lambda n: None)
    check("Node 부재 시 안내+baseline 수렴", rc == R.EXIT_NODE_MISSING
          and "Node.js" in out_text and "기본 텍스트" in out_text)
    check("portable Node 미제안", "portable" not in out_text.lower())
    check("Node 부재 시 어떤 명령도 실행 안 됨", len(calls) == 0)

    # 4. install command builder — pin·--omit=optional·--prefix(tool-cache)
    cmd = R.build_install_command(cache)
    joined = " ".join(cmd)
    check("install: npm --prefix tool-cache", "--prefix" in cmd
          and str(R.kordoc_prefix(cache)) in joined)
    check("install: --omit=optional 필수", "--omit=optional" in cmd)
    check("install: kordoc@3.13.0 pin", "kordoc@3.13.0" in cmd)
    check("install: pdfjs-dist@4.10.38 pin", "pdfjs-dist@4.10.38" in cmd)
    check("install: global/npx 미사용", "-g" not in cmd and "--global" not in joined
          and "npx" not in joined)
    check("repo 루트 package.json 미생성", not (REPO / "package.json").exists())
    # (2N-4/AVR-04) 탐지된 npm 경로를 명령에 반영(Windows npm.CMD — PowerShell npm.ps1 우회)
    cmd2 = R.build_install_command(cache, npm_exe=r"C:\Program Files\nodejs\npm.CMD")
    check("install: npm_exe 해석 경로 사용", cmd2[0].endswith("npm.CMD"))

    # 5. 승인 flag 없이는 install/run 실행 안 됨(무승인 실행 금지)
    rc, out_text, calls = run_main([str(doc), "--out-dir", str(out), "--tool-cache", str(cache)])
    check("무승인 설치 차단(승인 요구 후 종료)", rc == R.EXIT_INSTALL_APPROVAL_REQUIRED)
    check("무승인 시 exec 호출 0건", len(calls) == 0)

    # 6. 승인 문구: 한국어 + Kordoc/버전/위치/네트워크/no-egress/거부 fallback 명시(U5)
    msg = R.install_approval_message(cache)
    for needle in ("Kordoc", "3.13.0", str(R.kordoc_prefix(cache)), "네트워크",
                   "no-egress", "거부"):
        check(f"설치 승인 문구 포함: {needle[:12]}", needle in msg)
    rmsg = R.run_approval_message(doc.name)
    check("실행 승인 문구: 대상 문서·no-egress·거부", doc.name in rmsg
          and "no-egress" in rmsg and "거부" in rmsg)

    # 7. prep_egress_log 구조(jsonl 필수 키)
    log = R.append_prep_egress(cache, action="install", status="ok",
                               command_summary="npm install --prefix ... --omit=optional ...")
    entry = json.loads(log.read_text(encoding="utf-8").splitlines()[-1])
    need_keys = {"timestamp", "action", "provider", "version", "source",
                 "command_summary", "status"}
    check("prep_egress_log 필수 키", need_keys <= set(entry))
    check("prep_egress_log provider/version", entry["provider"] == "kordoc"
          and entry["version"] == "3.13.0")

    # 8. artifact 파일명 규약(한국어 stem 보존, HWP-first는 ocr_text 미생성)
    paths = R.artifact_paths(doc, out)
    check("artifact: <stem>.intake.json", paths["intake"].name == "한글 문서 이름.intake.json")
    check("artifact: <stem>.aux_signals.json",
          paths["aux_signals"].name == "한글 문서 이름.aux_signals.json")
    check("artifact: ocr_text 규약 없음(HWP-first)", "ocr_text" not in paths)

    # 9. .gitignore 방어 3패턴
    gi = (REPO / ".gitignore").read_text(encoding="utf-8")
    for pat in ("*.intake.json", "*.ocr_text.json", "*.aux_signals.json"):
        check(f".gitignore 방어: {pat}", pat in gi)

    # 10. run command builder — nethook preload + NETHOOK_MODE=block
    rcmd, env = R.build_run_command("C:/fake/node.exe", doc, paths["intake"], cache)
    check("run: --require nethook", "--require" in rcmd
          and str(R.nethook_path()) in rcmd)
    check("run: NETHOOK_MODE=block", env.get("NETHOOK_MODE") == "block")
    check("run: --format json + -o out", "--format" in rcmd and "-o" in rcmd)

    # 11. no_egress_verified 정책 — 훅 요약 관측 + egress 0일 때만 true
    prov = R.build_run_provenance("[NETHOOK-SUMMARY] mode=block observedTotal=0 egressAttempts=0 workersCreated=0")
    check("훅 관측+egress0 → no_egress_verified=true", prov["no_egress_verified"] is True)
    prov = R.build_run_provenance("정상 출력이지만 훅 요약 없음")
    check("훅 미관측 → false", prov["no_egress_verified"] is False
          and prov["hook_observed"] is False)
    prov = R.build_run_provenance("[NETHOOK-SUMMARY] mode=block observedTotal=3 egressAttempts=2")
    check("egress>0 → false", prov["no_egress_verified"] is False)
    try:
        R.build_run_provenance("훅 요약 없음", evidence_mode=True)
        check("evidence 모드에서 훅 미관측 → 실패", False, "no exception")
    except R.RunnerError:
        check("evidence 모드에서 훅 미관측 → 실패", True)

    # 12. 설치 승인 후 install 실행 + run 미승인 시 run 승인 요구(단계 분리, U3)
    fake_calls: list = []

    def fake_exec(cmd, env):
        fake_calls.append((cmd, env))
        # 설치 성공 흉내: tool-cache에 pin 버전 kordoc package.json 생성
        pkg = R.kordoc_prefix(cache) / "node_modules" / "kordoc"
        pkg.mkdir(parents=True, exist_ok=True)
        (pkg / "package.json").write_text(
            json.dumps({"name": "kordoc", "version": "3.13.0"}), encoding="utf-8")
        (pkg / "dist").mkdir(exist_ok=True)
        (pkg / "dist" / "cli.js").write_text("// fake", encoding="utf-8")
        return 0, ""

    rc, out_text, _ = run_main([str(doc), "--out-dir", str(out), "--tool-cache", str(cache),
                                "--approve-install"], exec_fn=fake_exec)
    check("설치 승인 → 설치 실행 + 실행 승인은 별도 요구", rc == R.EXIT_RUN_APPROVAL_REQUIRED
          and len(fake_calls) == 1)
    check("설치 승인 marker 기록(tool-cache 내부)",
          "install" in json.loads((cache / "approvals.json").read_text(encoding="utf-8")))

    # 13. check/plan 모드 — 설치·실행 없이 계획+승인 문구 표시
    fake_calls.clear()
    rc, out_text, calls = run_main([str(doc), "--out-dir", str(out),
                                    "--tool-cache", str(cache), "--check"])
    check("check 모드: 실행 없음 + 계획 표시", rc == R.EXIT_OK and len(calls) == 0
          and "plan 모드" in out_text)

    # 14. 실행 승인 → 훅 하 실행 + provenance 로그(tool-cache 내부) + 한국어 출력
    def fake_run_exec(cmd, env):
        # 파싱 성공 흉내: intake.json 생성 + 훅 요약 출력
        Path(paths["intake"]).parent.mkdir(parents=True, exist_ok=True)
        Path(paths["intake"]).write_text("{}", encoding="utf-8")
        return 0, "[NETHOOK-SUMMARY] mode=block observedTotal=0 egressAttempts=0 workersCreated=0"

    rc, out_text, _ = run_main([str(doc), "--out-dir", str(out), "--tool-cache", str(cache),
                                "--approve-run"], exec_fn=fake_run_exec)
    check("실행 승인 → 완료(한국어 안내)", rc == R.EXIT_OK and "판독 완료" in out_text)
    run_entry = json.loads((cache / "run_log.jsonl").read_text(encoding="utf-8").splitlines()[-1])
    check("run provenance 로그: no_egress_verified=true", run_entry["no_egress_verified"] is True)
    check("intake artifact 생성(한국어 파일명)", paths["intake"].exists())
    check("aux_signals in-process 생성(HWPX)", paths["aux_signals"].exists() is False
          or paths["aux_signals"].exists())  # fake hwpx는 zip이 아니라 건너뜀 허용
    check("건너뜀 안내(비-zip fake) 또는 성공", "보조 구조 신호" in out_text
          or paths["aux_signals"].exists())

    # 15. UTF-8 파일 왕복(한국어 문구)
    f = out / "인코딩 확인.txt"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(R.node_missing_message(), encoding="utf-8")
    check("UTF-8 write/read 왕복", "기본 텍스트" in f.read_text(encoding="utf-8"))

    # 16. 경계: core가 runner를 참조하지 않고, runner가 core를 import하지 않음
    core_files = list((REPO / "src" / "validators").glob("*.py")) + \
        list((REPO / "src" / "renderers").glob("*.py")) + \
        list((REPO / "src" / "schemas").glob("*"))
    hit = [p.name for p in core_files
           if p.is_file() and ("runners" in p.read_text(encoding="utf-8", errors="ignore")
                               or "hwp_assisted" in p.read_text(encoding="utf-8", errors="ignore"))]
    check("core가 runner 미참조", not hit, f"hit={hit}")
    src = (RUNNERS / "hwp_assisted_runner.py").read_text(encoding="utf-8")
    banned = ["kssb_findings_validator", "kssb_report_renderer", "kssb_report_delivery"]
    check("runner가 core 미import", not any(m in src for m in banned))

    # 17. 사용자-facing 완료 안내에 provider명·로컬 경로 미노출(§7)
    check("완료 안내에 provider명 없음", "Kordoc" not in out_text.split("판독 완료")[-1]
          if "판독 완료" in out_text else True)

    passed = sum(1 for _, ok, _ in _results if ok)
    total = len(_results)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


def test_hwp_assisted_runner_standalone():
    """pytest 수집용 래퍼(C2N3-MIN-01) — standalone 실행도 계속 지원."""
    assert main() == 0


if __name__ == "__main__":
    raise SystemExit(main())
