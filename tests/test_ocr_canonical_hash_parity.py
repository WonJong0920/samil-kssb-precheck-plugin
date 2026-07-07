"""OCR canonical hash Node/Python golden parity + writer-shaped artifact ingest 테스트 (Cycle 2N-4L).

Gate B 조건 8의 Python 측 절반:
- canonical 규칙의 single source는 dei_producer.canonical_ocr_output_sha256이다.
- 아래 GOLDEN 상수는 이 Python 함수로 계산한 값이며, Node 구현(pdf_ocr_runner.cjs의
  canonicalOcrOutputSha256)은 tests/test_pdf_ocr_runner.test.cjs에서 **동일 fixture·동일 상수**로
  검증된다 → 두 테스트가 함께 green이면 Node/Python parity가 성립한다(교차 spawn 불요 —
  Codex 환경의 bare python 불가 제약 회피).
- 추가로 2N-4L runner가 방출하는 형태(additive confidence/ink_ratio/blank_raster/model_files/
  dpi/langs 포함)의 ocr_text가 기존 ingest 계약을 그대로 통과해 ocr_supplement로만 합류함을 증명.

실행: PYTHONUTF8=1 python tests/test_ocr_canonical_hash_parity.py
종료 코드: 모든 점검 PASS면 0, 하나라도 실패면 1.
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "src" / "intake"))

from dei_producer import (  # noqa: E402
    build_dei_candidate,
    canonical_ocr_output_sha256,
)

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


def sha_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


# ---- 1. golden parity fixture (Node 테스트와 문자 그대로 동일해야 한다) ----------

F1 = {
    "provider": "tesseract.js", "provider_version": "7.0.0",
    "model": "tessdata_fast kor+eng", "model_sha256": "abc",
    "no_egress_verified": True, "output_sha256": "SHOULD_BE_EXCLUDED",
    "pages": [{"page": 1, "text": "hello",
               "text_sha256": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"}],
}
F2 = {
    "provider": "p", "provider_version": "1", "model": "m", "model_sha256": "x",
    "no_egress_verified": False,
    "pages": [
        {"page": 3, "text": "한글 \"인용\"\n\t줄바꿈과 제어문자", "text_sha256": "t",
         "confidence": 92, "ink_ratio": 0.0345},
        {"page": 7, "text": "scope 1 & 2 <emissions>", "text_sha256": "u", "confidence": 91.5},
    ],
    "langs": ["kor", "eng"], "dpi": 300,
}
F3 = {"z_last": [1, 2, {"b": 2, "a": 1}], "a_first": None,
      "nested": {"y": True, "x": False}, "provider": "p", "output_sha256": ""}

GOLDEN = {
    "F1": "e3f153d0c0f5d0df77de755531e1e5054170ab13a0dac1ce9d72e8b097e906f6",
    "F2": "8859db66eb2309494e6ac6f00ddb4f5e6b0c68d36be4f1853d8d9f6621229a07",
    "F3": "7b0be74bfde38d3f5a2bbd7d839a611264f90d8492e5f63ed52577764e1fb199",
}

check("golden F1 (기본 계약·output_sha256 제외)",
      canonical_ocr_output_sha256(F1) == GOLDEN["F1"])
check("golden F2 (한국어·제어문자·float confidence·additive keys)",
      canonical_ocr_output_sha256(F2) == GOLDEN["F2"])
check("golden F3 (key 정렬·null·nested)",
      canonical_ocr_output_sha256(F3) == GOLDEN["F3"])

# key 순서 재배열에도 동일(정렬 규칙)
F1_shuffled = {
    "pages": F1["pages"], "no_egress_verified": True, "model_sha256": "abc",
    "provider_version": "7.0.0", "model": "tessdata_fast kor+eng",
    "provider": "tesseract.js", "output_sha256": "DIFFERENT",
}
check("golden F1 key 순서 독립", canonical_ocr_output_sha256(F1_shuffled) == GOLDEN["F1"])

# ---- 2. 2N-4L runner 방출 형태의 artifact가 기존 ingest 계약을 통과 ---------------

INTAKE = {
    "success": True,
    "fileType": "pdf",
    "metadata": {"pageCount": 5, "title": "스캔 표본"},
    "blocks": [
        {"type": "paragraph", "text": "텍스트 레이어 본문", "pageNumber": 1},
    ],
    "pageQuality": [
        {"page": 1, "textChars": 140, "puaRatio": 0, "replacementCharRatio": 0, "needsOcr": False},
        {"page": 2, "textChars": 0, "puaRatio": 0, "replacementCharRatio": 0, "needsOcr": True},
        {"page": 3, "textChars": 120, "puaRatio": 0, "replacementCharRatio": 0, "needsOcr": False},
        {"page": 4, "textChars": 0, "puaRatio": 0, "replacementCharRatio": 0, "needsOcr": True},
        {"page": 5, "textChars": 0, "puaRatio": 0, "replacementCharRatio": 0, "needsOcr": True},
    ],
    "qualitySummary": {"needsOcr": True, "ocrCandidatePages": [2, 4, 5]},
}

_TXT_P2 = "온실가스 배출량 스코프 1 및 2"
_TXT_P4 = ""  # blank_raster 페이지 — 빈 텍스트도 계약상 유효
_TXT_P5 = "이사회는 기후 관련 위험을 감독한다"

WRITER_SHAPED_OCR = {
    "provider": "tesseract.js",
    "provider_version": "7.0.0",
    "model": "tessdata_fast kor+eng",
    "model_sha256": "f" * 64,  # presence-only(문서화된 한계) — runner는 pin 요약 hash를 기록
    "model_files": {"eng": "e" * 64, "kor": "k" * 64},  # additive
    "no_egress_verified": True,
    "dpi": 300,          # additive
    "langs": ["kor", "eng"],  # additive
    "pages": [
        {"page": 2, "text": _TXT_P2, "text_sha256": sha_text(_TXT_P2),
         "confidence": 91.23, "ink_ratio": 0.041, "blank_raster": False},
        {"page": 4, "text": _TXT_P4, "text_sha256": sha_text(_TXT_P4),
         "confidence": None, "ink_ratio": 0.0001, "blank_raster": True},
        {"page": 5, "text": _TXT_P5, "text_sha256": sha_text(_TXT_P5),
         "confidence": 88.0, "ink_ratio": 0.038, "blank_raster": False},
    ],
}
WRITER_SHAPED_OCR["output_sha256"] = canonical_ocr_output_sha256(WRITER_SHAPED_OCR)

dei = build_dei_candidate(INTAKE, source_id="t-2n4l", ocr_text=WRITER_SHAPED_OCR)

check("writer 형태 artifact가 ingest 계약 통과(additive 필드 무해)",
      "ocr_supplement" in dei)
sup = dei.get("ocr_supplement", {})
check("ocr_supplement provenance 보존",
      sup.get("provider") == "tesseract.js" and sup.get("no_egress_verified") is True)
check("ocr_supplement 페이지 정렬 + extraction_quality=low 고정",
      [p.get("page") for p in sup.get("pages", [])] == [2, 4, 5]
      and all(p.get("extraction_quality") == "low" for p in sup.get("pages", [])))
check("OCR 텍스트가 일반 blocks에 미혼입(ocr_supplement 전용)",
      all(_TXT_P2 not in str(b.get("text", "")) for b in dei.get("blocks", [])))
check("confidence는 additive metadata로만 존재(ocr_supplement에 승격 필드 없음)",
      all("confidence" not in p for p in sup.get("pages", [])))

# ---- 3. 무결성 fail-fast 방향(계약 보호가 살아있는지) ------------------------------

try:
    bad = dict(WRITER_SHAPED_OCR)
    bad["output_sha256"] = "0" * 64
    build_dei_candidate(INTAKE, source_id="t-2n4l", ocr_text=bad)
    check("output_sha256 변조 거부", False)
except Exception as e:  # IntakeError
    check("output_sha256 변조 거부", "output_sha256 mismatch" in str(e))

try:
    outside = dict(WRITER_SHAPED_OCR)
    outside["pages"] = [{"page": 1, "text": "x", "text_sha256": sha_text("x")}]
    outside["output_sha256"] = canonical_ocr_output_sha256(outside)
    build_dei_candidate(INTAKE, source_id="t-2n4l", ocr_text=outside)
    check("needsOcr 밖 페이지 거부(부분집합 제한과 정합)", False)
except Exception as e:
    check("needsOcr 밖 페이지 거부(부분집합 제한과 정합)", "page mismatch" in str(e))

# ---- 결과 --------------------------------------------------------------------------

passed = sum(1 for _, ok, _ in _results if ok)
total = len(_results)
print(f"\n{passed}/{total} checks passed")
sys.exit(0 if passed == total else 1)
