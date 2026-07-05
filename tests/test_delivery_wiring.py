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
    # 7'. (2M-5) findings에 human_review_boundary가 있으면 같은 취지의 일반 문구를 중복 출력하지 않음
    if findings.get("human_review_boundary"):
        check("사람 검수 안내 중복 없음(boundary 존재 시 일반 문구 생략)",
              "본 산출물은 컨설턴트 검수용 초안입니다. 최종 판단은 컨설턴트가 수행합니다." not in us)

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

    # 13. 표현 품질(2I-2): 한글 공시요구 제목 우선 + 항목ID 보조 표기, 원문 인용·출처/위치 라벨
    first_item = findings["kssb_areas"][0]["items"][0]
    title0 = first_item["requirement_title"]
    id0 = first_item["item_id"]
    check("Markdown 한글 공시요구 제목 우선(항목ID 보조)",
          f"#### {title0} (항목ID: {id0})" in md_text)
    check("Markdown 근거 인용/출처 라벨", ("- 인용: " in md_text) and ("출처: " in md_text))
    # 위치 단서: page_or_section이 있는 앵커는 '위치:'로 표기
    has_loc = any(anc.get("page_or_section") for a in findings["kssb_areas"]
                  for it in a["items"] for anc in it.get("evidence_anchors", []))
    if has_loc:
        check("Markdown 위치 단서 표기", "위치: " in md_text)

    # 14. MIN-02: 강제 DOCX 실패 시 fallback (primary=html, html/markdown 존재, docx_error 기록)
    orig = R._docx_bytes
    R._docx_bytes = lambda findings: (_ for _ in ()).throw(RuntimeError("forced docx failure"))
    try:
        fdir = Path(tempfile.mkdtemp(prefix="kssb_docxfail_"))
        fres = D.deliver(findings, fdir)
        fout = fres["outputs"]
        check("강제 DOCX 실패 → docx None", fout.get("docx") is None)
        check("강제 DOCX 실패 → docx_error 기록", bool(fout.get("docx_error")))
        check("강제 DOCX 실패 → primary=html", fout.get("primary_format") == "html")
        check("강제 DOCX 실패 → HTML/Markdown 존재",
              bool(fout.get("html")) and Path(fout["html"]).exists()
              and bool(fout.get("markdown")) and Path(fout["markdown"]).exists())
        check("강제 DOCX 실패 → user_summary fallback 안내",
              "fallback" in fres["user_summary"] or "제한" in fres["user_summary"])
        check("강제 DOCX 실패 → user_summary 절대경로/계정 비노출",
              re.search(r"[A-Za-z]:[\\/][Uu]sers[\\/]|/(?:home|Users)/[^/\s]", fres["user_summary"]) is None)
        import shutil as _sh
        _sh.rmtree(fdir, ignore_errors=True)
    finally:
        R._docx_bytes = orig

    import shutil
    shutil.rmtree(out_dir, ignore_errors=True)

    failed = [r for r in _results if not r[1]]
    print(f"\n총 {len(_results)}건 중 실패 {len(failed)}건")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
