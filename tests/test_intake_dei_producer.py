"""L1 intake -> DEI-candidate producer 테스트(표준 라이브러리만, Cycle 2L-2).

경계·결정성 증명:
- 결정적(동일 입력 -> 동일 출력).
- DEI가 judgment field를 만들지 않는다.
- 원문 발췌가 합성되지 않는다(원문 그대로 전달).
- needs_ocr / low_text / skipped_image 신호가 review_priority_hints로 이어진다.
- findings-side 위치 힌트는 bbox를 포함하지 않는다(숨은 스키마화 방지).
- 파싱 실패/필수값 누락은 조용히 부분 산출하지 않고 예외.
- 이 모듈이 core(validator/renderer/delivery)를 import 하지 않는다(직접 유입 방지).

종료 코드: 모든 점검 PASS면 0, 하나라도 실패면 1.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
INTAKE_DIR = REPO / "src" / "intake"
sys.path.insert(0, str(INTAKE_DIR))

import dei_producer as D  # noqa: E402

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


# 합성 인테이크 산출물(실제 PDF/Kordoc 출력을 repo에 넣지 않고 최소 형태로 재현).
def sample_intake() -> dict:
    return {
        "success": True,
        "fileType": "pdf",
        "metadata": {"pageCount": 5},
        "outline": [
            {"level": 1, "text": "II. 기후", "pageNumber": 2},
            {"level": 2, "text": "거버넌스", "pageNumber": 2},
        ],
        "blocks": [
            {"type": "heading", "text": "거버넌스", "pageNumber": 2,
             "bbox": {"page": 2, "x": 37, "y": 627}},
            {"type": "paragraph", "text": "기후 관련 위험 및 기회에 관한 관리·감독 기구를 둔다.",
             "pageNumber": 2, "bbox": {"page": 2, "x": 37, "y": 600}},
            {"type": "table", "table": {"rows": 2, "cols": 2,
             "cells": [[{"text": "지표"}, {"text": "값"}], [{"text": "배출량"}, {"text": "100"}]]},
             "pageNumber": 3, "bbox": {"page": 3, "x": 10, "y": 20}},
        ],
        "warnings": [
            {"page": 4, "message": "1개 이미지 영역 텍스트 없음", "code": "SKIPPED_IMAGE"},
        ],
        "pageQuality": [
            {"page": 2, "textChars": 300, "puaRatio": 0.0, "replacementCharRatio": 0.0, "needsOcr": False},
            {"page": 3, "textChars": 250, "puaRatio": 0.0, "replacementCharRatio": 0.0, "needsOcr": False},
            {"page": 4, "textChars": 10, "puaRatio": 0.0, "replacementCharRatio": 0.0, "needsOcr": False},
            {"page": 5, "textChars": 5, "puaRatio": 0.0, "replacementCharRatio": 0.0, "needsOcr": True},
        ],
        "qualitySummary": {"needsOcr": False, "ocrCandidatePages": [5]},
    }


# 판정으로 오인될 수 있는 키(DEI에 절대 없어야 함).
_JUDGMENT_KEYS = {
    "judgment_code", "judgment_label", "evidence_confirmed",
    "partial_evidence_needs_supplement", "not_verifiable",
    "conflict_or_interpretation_needed", "out_of_scope_or_not_applicable",
    "customer_questions", "missing_info", "recommendations",
}


def _all_keys(node) -> set[str]:
    keys: set[str] = set()
    if isinstance(node, dict):
        for k, v in node.items():
            keys.add(k)
            keys |= _all_keys(v)
    elif isinstance(node, list):
        for v in node:
            keys |= _all_keys(v)
    return keys


def main() -> int:
    intake = sample_intake()
    dei = D.build_dei_candidate(intake, source_id="doc-1", source_title="Sample")

    # 1. 결정성: 동일 입력 2회 -> 직렬화 동일
    a = json.dumps(D.build_dei_candidate(sample_intake(), "doc-1", "Sample"), sort_keys=True, ensure_ascii=False)
    b = json.dumps(D.build_dei_candidate(sample_intake(), "doc-1", "Sample"), sort_keys=True, ensure_ascii=False)
    check("결정성(동일 입력->동일 출력)", a == b)

    # 2. judgment field 미생성
    leaked = _all_keys(dei) & _JUDGMENT_KEYS
    check("judgment field 미생성", not leaked, f"leaked={sorted(leaked)}")

    # 3. 원문 발췌 보존(합성 없음): paragraph 원문이 그대로 존재
    para = next((bl for bl in dei["blocks"] if bl["block_type"] == "paragraph"), {})
    check("원문 발췌 보존", para.get("text_or_table_md") == intake["blocks"][1]["text"])

    # 4. 표 셀 원문 보존(합성 없음)
    tbl = next((bl for bl in dei["blocks"] if bl["block_type"] == "table"), {})
    check("표 원문 셀 보존", "배출량" in tbl.get("text_or_table_md", "") and "100" in tbl.get("text_or_table_md", ""))

    # 5. needs_ocr 신호 -> review_priority_hints(high)
    reasons = {(h["reason"], h["priority"]) for h in dei["review_priority_hints"]}
    check("needs_ocr -> priority hint", ("needs_ocr", "high") in reasons)

    # 6. low_text 신호 -> hint(medium)  (page 4: 10 chars, page 5는 needs_ocr로 별도)
    check("low_text -> priority hint", ("low_text", "medium") in reasons)

    # 7. skipped_image 신호 -> hint(medium)
    check("skipped_image -> priority hint", ("skipped_image", "medium") in reasons)

    # 8. doc_quality 신호 반영
    dq = dei["doc_quality"]
    check("doc_quality.ocr_candidate_pages", dq["ocr_candidate_pages"] == [5])
    check("doc_quality.low_text_pages 포함", 4 in dq["low_text_pages"] and 5 in dq["low_text_pages"])

    # 9. findings-side 힌트는 bbox 미포함 / DEI location_hint는 bbox 포함
    fs = D.page_or_section_hint(2, "거버넌스")
    check("findings 힌트 bbox 미포함", "bbox" not in fs and fs.startswith("p.2"))
    check("DEI location_hint bbox 포함", any("bbox" in bl["location_hint"] for bl in dei["blocks"]))

    # 10. 파싱 실패/필수값 누락 -> 예외(조용한 부분 산출 금지)
    def expect_intake_error(name: str, intake, source_id: str = "doc-1") -> None:
        try:
            D.build_dei_candidate(intake, source_id)
            check(name, False, "no exception (returned DEI)")
        except D.IntakeError:
            check(name, True)

    expect_intake_error("parse 실패(success=false) 예외", {"success": False})
    expect_intake_error("source_id 누락 예외", sample_intake(), "")

    # 10b. malformed intake contract -> IntakeError (C2L2-MAJ-01 negative tests)
    def without(key):
        s = sample_intake()
        s.pop(key, None)
        return s

    def with_override(**kw):
        s = sample_intake()
        s.update(kw)
        return s

    expect_intake_error("빈 객체 {} 거부", {})
    expect_intake_error("success 키 누락 거부", without("success"))
    expect_intake_error("success 비-true(문자열) 거부", with_override(success="true"))
    expect_intake_error("metadata 누락 거부", without("metadata"))
    expect_intake_error("pageCount<1 거부", with_override(metadata={"pageCount": 0}))
    expect_intake_error("pageCount 비-int 거부", with_override(metadata={"pageCount": "5"}))
    expect_intake_error("blocks 비-list 거부", with_override(blocks={}))
    expect_intake_error("pageQuality 누락 거부", without("pageQuality"))
    expect_intake_error("pageQuality 빈 list 거부", with_override(pageQuality=[]))
    expect_intake_error("qualitySummary 누락 거부", without("qualitySummary"))
    expect_intake_error("outline 비-list(존재 시) 거부", with_override(outline={}))

    # 10c. valid but evidence-poor (scanned-only): blocks=[] 이지만 pageQuality/qualitySummary 존재 -> 허용
    scanned = {
        "success": True,
        "fileType": "pdf",
        "metadata": {"pageCount": 3},
        "outline": [],
        "blocks": [],
        "warnings": [],
        "pageQuality": [
            {"page": 1, "textChars": 2, "puaRatio": 0.0, "replacementCharRatio": 0.0, "needsOcr": True},
            {"page": 2, "textChars": 3, "puaRatio": 0.0, "replacementCharRatio": 0.0, "needsOcr": True},
            {"page": 3, "textChars": 1, "puaRatio": 0.0, "replacementCharRatio": 0.0, "needsOcr": True},
        ],
        "qualitySummary": {"needsOcr": True, "ocrCandidatePages": [1, 2, 3]},
    }
    try:
        sdei = D.build_dei_candidate(scanned, "scan-1")
        sreasons = {h["reason"] for h in sdei["review_priority_hints"]}
        check("스캔 전용(근거 빈약) 허용", sdei["blocks"] == [] and "needs_ocr" in sreasons)
    except D.IntakeError as e:
        check("스캔 전용(근거 빈약) 허용", False, f"unexpected IntakeError: {e}")

    # 11. 경계: 이 모듈이 core(validator/renderer/delivery)를 import 하지 않는다
    src = (INTAKE_DIR / "dei_producer.py").read_text(encoding="utf-8")
    banned = ["kssb_findings_validator", "kssb_report_renderer", "kssb_report_delivery"]
    hit = [m for m in banned if ("import " + m) in src or ("import " + m.split("_")[0]) == ("import " + m)]
    check("core 미import(직접 유입 방지)", not any(m in src for m in banned), f"hit={[m for m in banned if m in src]}")

    # ---- 12. L2 provisional additive 병합(2L-4B) --------------------------------

    def sample_ocr_text() -> dict:
        return {
            "provider": "tesseract.js",
            "provider_version": "7.0.0",
            "model": "tessdata_fast kor+eng",
            "model_sha256": "6b85e11d9bbf0786",
            "no_egress_verified": True,
            "output_sha256": "546926ecbb43ea02",
            "pages": [{"page": 5, "text": "스캔 페이지 OCR 텍스트", "text_sha256": "abc123"}],
        }

    def sample_aux_signals() -> dict:
        return {
            "aux_signals_version": "1",
            "doc_format": "docx",
            "image_resource_count": 14,
            "image_relationship_count": 71,
            "image_instance_count": 70,
            "table_tag_count": 30,
            "table_top_level_count": 25,
            "nested_table_count": 5,
            "heading_style_candidate_count": 6,
            "heading_recovery_candidate": 0,
            "caption_candidate_count": 164,
            "chart_relationship_count": 0,
            "review_required_reason": ["heading_styles_defined_but_unused"],
        }

    # 12a. 하위 호환: 새 인자 없으면 optional 섹션 부재 + DEI_VERSION "1" 유지
    base = D.build_dei_candidate(sample_intake(), "doc-1", "Sample")
    check("하위 호환(ocr/aux 없음 -> 섹션 부재)",
          "ocr_supplement" not in base and "aux_structure" not in base)
    check("DEI_VERSION '1' 유지", base["dei_version"] == "1")

    # 12b. OCR 병합: ocr_supplement로만 합류, blocks 불변, extraction_quality=low 고정
    merged = D.build_dei_candidate(sample_intake(), "doc-1", "Sample",
                                   ocr_text=sample_ocr_text(), aux_signals=sample_aux_signals())
    check("ocr_supplement 섹션 생성", "ocr_supplement" in merged)
    check("OCR blocks 불변(미혼입)",
          json.dumps(merged["blocks"], sort_keys=True, ensure_ascii=False)
          == json.dumps(base["blocks"], sort_keys=True, ensure_ascii=False))
    check("OCR 텍스트가 blocks에 없음",
          all("스캔 페이지 OCR 텍스트" not in bl["text_or_table_md"] for bl in merged["blocks"]))
    sup = merged["ocr_supplement"]
    check("OCR provenance 보존",
          sup["provider"] == "tesseract.js" and sup["no_egress_verified"] is True
          and sup["model_sha256"] == "6b85e11d9bbf0786")
    check("OCR extraction_quality=low 고정",
          all(p["extraction_quality"] == "low" for p in sup["pages"]))

    # 12c. aux 병합: aux_structure 섹션 + gap 플래그는 hint로만
    check("aux_structure 섹션 생성",
          merged.get("aux_structure", {}).get("table_top_level_count") == 25)
    mreasons = {h["reason"] for h in merged["review_priority_hints"]}
    check("image_detection_gap hint 생성(aux 70 vs intake image 0)",
          "image_detection_gap" in mreasons)
    check("table_count_mismatch hint 생성(aux 25 vs intake table 1)",
          "table_count_mismatch" in mreasons)
    check("aux review_required_reason -> hint",
          "heading_styles_defined_but_unused" in mreasons)
    check("gap이 판정으로 미변환(judgment 키 부재)",
          not (_all_keys(merged) & _JUDGMENT_KEYS))

    # 12d. 결정성(병합 포함)
    m1 = json.dumps(D.build_dei_candidate(sample_intake(), "doc-1", "Sample",
                                          ocr_text=sample_ocr_text(),
                                          aux_signals=sample_aux_signals()),
                    sort_keys=True, ensure_ascii=False)
    m2 = json.dumps(D.build_dei_candidate(sample_intake(), "doc-1", "Sample",
                                          ocr_text=sample_ocr_text(),
                                          aux_signals=sample_aux_signals()),
                    sort_keys=True, ensure_ascii=False)
    check("결정성(병합 포함)", m1 == m2)

    # 12e. OCR 페이지 불일치 fail-fast (page 2는 needsOcr 대상 아님)
    bad_page = sample_ocr_text()
    bad_page["pages"] = [{"page": 2, "text": "x", "text_sha256": "h"}]

    def expect_merge_error(name: str, ocr=None, aux=None) -> None:
        try:
            D.build_dei_candidate(sample_intake(), "doc-1", ocr_text=ocr, aux_signals=aux)
            check(name, False, "no exception")
        except D.IntakeError:
            check(name, True)

    expect_merge_error("OCR 페이지 불일치 거부", ocr=bad_page)

    # 12f. OCR provenance 누락/파손 fail-fast
    for missing in ("provider", "model_sha256", "output_sha256"):
        o = sample_ocr_text()
        o.pop(missing)
        expect_merge_error(f"OCR {missing} 누락 거부", ocr=o)
    o = sample_ocr_text()
    o["no_egress_verified"] = "yes"
    expect_merge_error("OCR no_egress_verified 비-bool 거부", ocr=o)
    o = sample_ocr_text()
    o["pages"] = []
    expect_merge_error("OCR pages 빈 list 거부", ocr=o)
    o = sample_ocr_text()
    o["pages"] = [{"page": 5, "text": "x"}]
    expect_merge_error("OCR text_sha256 누락 거부", ocr=o)

    # 12g. aux malformed fail-fast
    a = sample_aux_signals()
    a["doc_format"] = "pdf"
    expect_merge_error("aux doc_format 비허용 거부", aux=a)
    a = sample_aux_signals()
    a["image_instance_count"] = -1
    expect_merge_error("aux 음수 카운트 거부", aux=a)
    a = sample_aux_signals()
    a.pop("table_top_level_count")
    expect_merge_error("aux 필수 카운트 누락 거부", aux=a)
    a = sample_aux_signals()
    a["review_required_reason"] = "not-a-list"
    expect_merge_error("aux review_required_reason 비-list 거부", aux=a)

    passed = sum(1 for _, ok, _ in _results if ok)
    total = len(_results)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
