"""Cycle 2I-1 전달 배선 end-to-end 스모크(표준 라이브러리만).

findings example → deliver(preflight + render) → 대표 문서(DOCX/HTML/Markdown) 생성 확인 +
사용자-facing 요약의 안전 불변식(로컬 절대경로/계정명 비노출, 경계·사람 검수 고지 포함, 재판정 없음) 점검.
출력은 repo 밖 임시 폴더에 생성한다(repo 오염 없음).

종료 코드: 모든 점검 PASS면 0, 실패면 1.
"""
from __future__ import annotations

import copy
import json
import re
import sys
import tempfile
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "src" / "renderers"))
sys.path.insert(0, str(REPO / "src" / "validators"))

import kssb_report_delivery as D  # noqa: E402
import kssb_report_renderer as R  # noqa: E402

EXAMPLE = REPO / "src" / "schemas" / "kssb_findings_example.json"

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


def main() -> int:
    findings = json.loads(EXAMPLE.read_text(encoding="utf-8"))
    snapshot = json.dumps(findings, ensure_ascii=False, sort_keys=True)

    out_dir = Path(tempfile.mkdtemp(prefix="kssb_deliver_"))
    result = D.deliver(findings, out_dir)
    outputs = result["outputs"]

    # 1. 대표 문서(DOCX/HTML/Markdown) 생성
    for fmt in ("docx", "html", "markdown"):
        p = outputs.get(fmt)
        check(f"{fmt} 생성", bool(p) and Path(p).exists(), Path(p).name if p else "None")

    # 2. primary = DOCX (우선순위)
    check("primary=docx", outputs.get("primary_format") == "docx", str(outputs.get("primary_format")))

    # 3. 파일명 규칙(대표 문서명 계약)
    for fmt, ext in (("docx", ".docx"), ("html", ".html"), ("markdown", ".md")):
        p = outputs.get(fmt)
        if p:
            check(f"{fmt} 파일명 규칙", Path(p).name.endswith(f"_KSSB_공시근거_사전검토보고서{ext}"), Path(p).name)

    # 4. DOCX zip/OOXML 유효
    docx = outputs.get("docx")
    if docx:
        with zipfile.ZipFile(docx) as zf:
            check("DOCX zip 무결성", zf.testzip() is None)
            check("DOCX word/document.xml 포함", "word/document.xml" in zf.namelist())

    # 5. Markdown 핵심 섹션 포함
    md_text = Path(outputs["markdown"]).read_text(encoding="utf-8")
    for needle in ("## 1. 검토 개요", "## 2. 상태 요약", "## 4. 고객 확인 질문 및 요청자료", "사람 검수"):
        check(f"Markdown 포함: {needle}", needle in md_text)

    # 6. 사용자-facing 요약: 로컬 절대경로/계정명 비노출
    us = result["user_summary"]
    leak = re.search(r"[A-Za-z]:[\\/][Uu]sers[\\/]|/(?:home|Users)/[^/\s]", us)
    check("user_summary 로컬 절대경로/계정 비노출", leak is None, leak.group(0) if leak else "")
    # 임시폴더 절대경로도 노출되지 않아야 함(파일명/표시경로만)
    check("user_summary에 out_dir 절대경로 없음", str(out_dir) not in us)

    # 7. 사용자-facing 요약: 대표 문서 파일명·경계·사람 검수 고지 포함
    check("user_summary 대표 문서 파일명", Path(outputs["primary"]).name in us)
    check("user_summary 사람 검수 고지", "사람 검수" in us or "컨설턴트" in us)
    check("user_summary 경계 고지(감사/인증/준수 대체 아님)",
          ("감사" in us and "대체" in us) or "감사·인증·준수" in us)

    # 8. 재판정 금지(간접): 출력 판정 라벨 = 입력 판정 라벨
    input_labels = {it.get("judgment_label", "") for a in findings.get("kssb_areas", []) for it in a.get("items", [])}
    schema = json.loads((REPO / "src" / "schemas" / "kssb_findings.schema.json").read_text(encoding="utf-8"))
    enum = set(schema["definitions"]["finding_item"]["properties"]["judgment_label"]["enum"])
    labels_in_md = {lbl for lbl in enum if lbl and lbl in md_text}
    check("재판정 없음(출력 라벨=입력 라벨)", labels_in_md == {lbl for lbl in input_labels if lbl})

    # 9. detect-only: deliver가 findings를 변경하지 않음
    check("detect-only(입력 findings 미변경)",
          json.dumps(findings, ensure_ascii=False, sort_keys=True) == snapshot)

    # 10. preflight는 내부에 분리 보관(사용자 요약에 raw 이슈 미노출)
    check("preflight 내부 분리", isinstance(result["preflight"]["issues"], list))
    check("user_summary에 validator location 코드 미노출", "kssb_areas[" not in us)

    # 11. 결정성: Markdown 2회 동일
    check("Markdown 결정성", R.render_markdown(findings) == R.render_markdown(findings))

    # 12. 금지 확정 표현이 대표 문서에 없음(negation 문맥 제외 판정명)
    banned = ["준수 확정 판정", "적합 판정", "인증 의견", "감사 의견", "적정 의견"]
    check("대표 문서에 금지 판정명 없음", not any(b in md_text for b in banned))

    import shutil
    shutil.rmtree(out_dir, ignore_errors=True)

    failed = [r for r in _results if not r[1]]
    print(f"\n총 {len(_results)}건 중 실패 {len(failed)}건")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
