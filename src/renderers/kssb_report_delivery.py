"""Samil KSSB Precheck - Delivery Orchestrator (Cycle 2I-1).

findings → validator preflight(detect-only) → renderer(재판정 없음) → **사용자-facing 전달 요약**을 잇는
얇은 내부 배선기다. 핵심 목적은 **사용자-facing 최종 보고**와 **내부 실행 로그/디버그 출력을 분리**하고,
대표 문서 파일을 보장하며, 로컬 절대경로·계정명·임시경로가 사용자 결과에 노출되지 않도록 하는 것이다.

경계:
- **재판정 없음**: 이 배선기는 판정·근거·질문·권고를 만들지 않는다. validator는 detect-only로 위험 신호만 점검하고,
  renderer는 findings를 형식 변환만 한다. 확인 불가를 미공시/부적합으로 단정하지 않는다.
- **Skill-first**: 사용자 진입점은 Skill이며, 이 배선기는 Skill 워크플로우가 사용하는 내부 구성요소다(사용자-facing Python CLI 아님).
- **로그 분리**: `deliver()`는 (a) 안전한 사용자-facing 요약 문자열과 (b) 내부 상세(전체 경로·validator 이슈·docx 오류)를
  **분리해서** 반환한다. CLI는 사용자 요약만 stdout에, 내부 상세는 `--debug` 시에만 stderr에 출력한다.

의존성: Python 표준 라이브러리만 사용한다. 같은 폴더의 renderer와 validators 패키지를 로컬 import한다.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

# 로컬 모듈 경로(같은 repo 내부 구성요소).
_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))
_VALIDATORS = _HERE.parent / "validators"
if str(_VALIDATORS) not in sys.path:
    sys.path.insert(0, str(_VALIDATORS))

import kssb_report_renderer as R  # noqa: E402
import kssb_findings_validator as V  # noqa: E402

# 사용자-facing 요약에서 로컬 절대경로/계정명을 제거하는 방어 정규식(2차 안전망).
_LOCAL_PATH_RE = re.compile(
    r"([A-Za-z]:[\\/][Uu]sers[\\/][^\\/\s]+|/(?:home|Users)/[^/\s]+|[A-Za-z]:[\\/][^\s]*)"
)


def _display_path(path: str | Path | None) -> str:
    """사용자-facing 표시용 경로: repo(cwd) 하위면 상대경로, 아니면 파일명만. 절대경로·계정명 비노출."""
    if not path:
        return ""
    p = Path(path)
    try:
        rel = p.resolve().relative_to(Path.cwd().resolve())
        return rel.as_posix()
    except Exception:  # noqa: BLE001 - repo 밖이면 파일명만 노출
        return p.name


def _redact(text: str) -> str:
    """혹시 남은 로컬 절대경로/계정명을 placeholder로 치환(사용자-facing 2차 방어)."""
    return _LOCAL_PATH_RE.sub("[REDACTED_LOCAL_PATH]", text)


def _issue_counts(issues: list) -> dict:
    counts = {"error": 0, "warning": 0, "info": 0}
    for i in issues:
        sev = getattr(i, "severity", "info")
        counts[sev] = counts.get(sev, 0) + 1
    return counts


def build_user_summary(findings: dict, outputs: dict, preflight_counts: dict) -> str:
    """사용자-facing 전달 요약(안전). 로그·절대경로·계정명·validator raw 출력 없음."""
    meta = R._dict(findings.get("report_meta"))
    title = R._s(meta.get("report_title")) or "KSSB 공시근거 사전검토 보고서 (초안)"

    primary = outputs.get("primary")
    primary_fmt = outputs.get("primary_format")
    lines: list[str] = []
    lines.append(f"■ {title}")
    lines.append("")
    lines.append("● 대표 문서")
    if primary:
        lines.append(f"  - 파일명: {Path(primary).name}")
        lines.append(f"  - 위치(표시 경로): {_display_path(primary)}")
        lines.append(f"  - 형식: {primary_fmt} (우선순위 DOCX → HTML → Markdown)")
    else:
        lines.append("  - (대표 문서 생성 실패)")
    # fallback 안내
    fbs = []
    for fmt in ("docx", "html", "markdown"):
        p = outputs.get(fmt)
        if p and p != primary:
            fbs.append(f"{fmt}: {Path(p).name}")
    if fbs:
        lines.append(f"  - fallback: {', '.join(fbs)}")
    if outputs.get("docx_error"):
        lines.append("  - 참고: DOCX 생성이 제한되어 fallback(HTML/Markdown)을 대표 문서로 사용했습니다.")

    lines.append("")
    lines.append("● 검토 전 자체 점검(preflight)")
    lines.append(f"  - 구조/정합 점검 결과: error {preflight_counts.get('error', 0)}건, "
                 f"warning {preflight_counts.get('warning', 0)}건 (세부는 내부 점검 기록으로 분리)")
    if preflight_counts.get("error", 0) > 0:
        lines.append("  - error가 있으면 findings를 먼저 보완한 뒤 다시 생성하는 것을 권장합니다.")

    # 사람 검수 필요 항목 수
    hr = 0
    for a in R._list(findings.get("kssb_areas")):
        for it in R._list(R._dict(a).get("items")):
            if R._dict(it).get("human_review_required"):
                hr += 1
    lines.append("")
    lines.append("● 사람 검수 안내")
    # findings의 human_review_boundary가 있으면 그 문구만 쓴다(같은 취지의 일반 문구 중복 출력 방지).
    boundary = R._s(findings.get("human_review_boundary"))
    if boundary:
        lines.append(f"  - {boundary}")
    else:
        lines.append("  - 본 산출물은 컨설턴트 검수용 초안입니다. 최종 판단은 컨설턴트가 수행합니다.")
    if hr:
        lines.append(f"  - 사람 검수 대상(상충·해석 필요 등) 항목: {hr}건")

    lines.append("")
    lines.append("● 경계 고지")
    disclaimer = R._s(meta.get("disclaimer"))
    if disclaimer:
        lines.append(f"  - {disclaimer}")
    else:
        lines.append("  - 본 도구는 감사·인증·준수 판단을 대체하지 않으며, 확인 불가 항목을 미공시로 단정하지 않습니다.")

    return _redact("\n".join(lines))


def deliver(findings: dict, out_dir: str | Path, base_name: str | None = None,
            prefer_docx: bool = True) -> dict:
    """findings를 전달 산출물로 배선한다.

    반환:
      {
        "user_summary": <안전한 사용자-facing 요약 문자열>,
        "outputs": <render_report 결과(내부: 전체 경로 포함)>,
        "preflight": {"counts": {...}, "issues": [ {severity,code,location,message}, ... ]},  # 내부
        "internal_notes": [...]  # 내부(디버그)
      }
    - user_summary만 사용자에게 노출한다. outputs/preflight/internal_notes는 내부용이다.
    """
    if not isinstance(findings, dict):
        raise R.RenderError("findings 최상위가 JSON 객체가 아닙니다.")

    # 1) preflight 검증(detect-only): findings를 변경하지 않는다.
    issues = V.validate_findings(findings)
    counts = _issue_counts(issues)

    # 2) 대표 문서 렌더(재판정 없음). DOCX → HTML → Markdown 보장.
    outputs = R.render_report(findings, out_dir, base_name=base_name, prefer_docx=prefer_docx)

    # 3) 사용자-facing 요약(안전) 생성.
    user_summary = build_user_summary(findings, outputs, counts)

    internal_notes: list[str] = []
    if outputs.get("docx_error"):
        internal_notes.append(f"docx_error: {outputs['docx_error']}")
    internal_notes.append(f"preflight: {counts}")

    return {
        "user_summary": user_summary,
        "outputs": outputs,
        "preflight": {"counts": counts, "issues": [i.as_dict() for i in issues]},
        "internal_notes": internal_notes,
    }


def _main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Samil KSSB Precheck 전달 배선기(내부 구성요소). findings → preflight → 대표 문서 → "
                    "사용자-facing 요약. stdout=사용자 요약, --debug 시 stderr=내부 상세.")
    parser.add_argument("findings", help="findings JSON 경로")
    parser.add_argument("-o", "--out-dir", default=".", help="출력 디렉터리(기본: 현재 디렉터리)")
    parser.add_argument("--base-name", default=None, help="파일명 base 재정의")
    parser.add_argument("--html-only", action="store_true", help="DOCX 생략(HTML/Markdown만)")
    parser.add_argument("--debug", action="store_true", help="내부 상세(전체 경로·validator 이슈)를 stderr로 출력")
    args = parser.parse_args(argv)

    try:
        findings = R.load_findings(args.findings)
    except (OSError, ValueError) as exc:
        print(f"[error] findings 로드 실패: {exc}", file=sys.stderr)
        return 2

    try:
        result = deliver(findings, args.out_dir, base_name=args.base_name,
                         prefer_docx=not args.html_only)
    except R.RenderError as exc:
        print(f"[error] 전달 불가: {exc}", file=sys.stderr)
        return 3

    # 사용자-facing 요약만 stdout으로.
    print(result["user_summary"])

    # 내부 상세는 --debug 시에만 stderr로(사용자-facing과 분리).
    if args.debug:
        print("---- internal (debug) ----", file=sys.stderr)
        print(json.dumps({"outputs": result["outputs"], "preflight": result["preflight"],
                          "internal_notes": result["internal_notes"]},
                         ensure_ascii=False, indent=2), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
