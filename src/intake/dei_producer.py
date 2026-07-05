"""Samil KSSB Precheck - Optional Intake -> DEI-candidate Producer (Cycle 2L-2, L1).

이 모듈은 **plugin core 밖의 선택적(opt-in) 인테이크 어댑터**다. 이미 로컬에서 추출된
문서 인테이크 산출물(Kordoc 등이 만든 JSON, 본 모듈이 직접 실행하지 않음)을 받아,
Cycle 2L-1에서 동결한 **DEI-candidate 계약**(문서 수준 중간 산출물)으로 결정적으로 정규화한다.

경계(무엇을 하지 않는가) — Cycle 2L-1/2I-3B 설계 및 Codex Review에 정합:
- **판정을 만들지 않는다.** `judgment_code`/`judgment_label`을 생성하지 않으며, DEI 필드
  (`extraction_quality`/`needs_ocr`/priority)는 **검수 트리아지 신호**일 뿐 KSSB 판단이 아니다.
- **원문을 합성하지 않는다.** 블록 텍스트/표는 입력 인테이크 산출물의 원문을 그대로 전달한다
  (요약·수치 추정·이미지 의미 해석 금지).
- **findings 스키마를 만들지 않는다.** DEI는 findings가 아니며, renderer/validator에 직접 유입되지 않는다.
  Skill이 DEI를 **근거 재료로만** 읽어 기존 findings 스키마 필드로 산출한다.
- **OCR/모델/네트워크를 실행하지 않는다.** 인테이크 도구 실행은 본 모듈 밖(사용자 로컬)이며,
  본 모듈은 이미 만들어진 인테이크 dict/JSON만 변환한다. 새 의존성 없음(표준 라이브러리만).
- **실패를 명시한다.** 파싱 실패(`success: false`)·필수 키 누락은 조용히 부분 산출하지 않고 예외를 던진다.

입력 — **최소 인테이크 계약(malformed 거부, C2L2-MAJ-01)**. 관측된 Kordoc `--format json` 형태 기준:
  필수: `success == true`, `metadata.pageCount`(int>=1), `blocks`(list, 스캔 전용이면 빈 list 허용),
        `pageQuality`(비어 있지 않은 list — 페이지 구조 신호), `qualitySummary`(object).
  선택: `outline`(list), `warnings`(list). (존재하면 list여야 함.)
  블록: `{type,text|table,pageNumber,bbox?}`, pageQuality: `{page,textChars,puaRatio,
        replacementCharRatio,needsOcr}`, qualitySummary: `{needsOcr,ocrCandidatePages}`.
  **"유효하지만 근거 빈약"(예: 스캔 전용, blocks=[]) vs "malformed"(구조 결여)**는 위 필수 신호로 구분한다.

L2 provisional additive 입력(Cycle 2L-4B — Codex review pending, 선택·하위 호환):
  `ocr_text`: out-of-band runner(예: tesseract.js, Gate D-proven 경로)가 이미 만든 OCR 산출물.
    필수 provenance: provider/provider_version/model/model_sha256/no_egress_verified/output_sha256 +
    pages[{page,text,text_sha256}]. **text_sha256/output_sha256은 실제 무결성 검증**(2L-4C —
    canonical 규칙은 `canonical_ocr_output_sha256()`, mismatch는 IntakeError; model_sha256은 presence-only 유지).
    **OCR 페이지는 인테이크의 needsOcr 대상과 일치해야 하며(불일치 fail-fast),
    기존 blocks에 섞이지 않고 별도 `ocr_supplement` 섹션**(extraction_quality="low" 고정)으로만 합류한다.
  `aux_signals`: stdlib 보조 스캐너(aux_structure_scanner.py)의 문서 수준 카운트. `aux_structure` 섹션으로
    합류하고, gap 비교(image_detection_gap/table_count_mismatch 등)는 review_priority_hints에만 추가된다.
  두 입력이 없으면 산출은 기존 L1과 동일(additive — DEI_VERSION "1" 유지).

출력: DEI-candidate dict (Cycle 2L-1 §2 + 2L-4A optional 섹션). 결정적(동일 입력 -> 동일 출력).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

DEI_VERSION = "1"

# extraction_quality 임계값(문서화된 결정적 상수 — 통계적 신뢰도가 아니라 휴리스틱 표식).
_LOW_TEXT_CHARS = 30          # 페이지 텍스트 글자수 하한
_HIGH_TEXT_CHARS = 200        # 이 이상이면 텍스트 충실
_BAD_RATIO = 0.10             # PUA/replacement 문자 비율 상한


class IntakeError(ValueError):
    """인테이크 산출물이 유효하지 않거나 파싱 실패를 나타낼 때."""


def _validate_intake_contract(intake: Any) -> dict:
    """최소 인테이크 계약을 강제한다. 위반 시 IntakeError로 실패(조용한 빈 DEI 금지, C2L2-MAJ-01).

    **유효(허용)**: 성공 파싱 + 페이지 구조가 있는 문서. `blocks`가 비어 있어도(스캔 전용 등 근거 빈약 문서)
    `pageQuality`/`qualitySummary`/`metadata.pageCount` 신호로 **"유효하지만 근거 빈약"을 malformed와 구분**한다.
    **무효(거부)**: dict 아님 · `success` 누락/≠true · `metadata.pageCount` 없음/<1 · `blocks` 비-list ·
    `pageQuality` 비-list/빈 list · `qualitySummary` 비-dict · (존재 시) `outline`/`warnings` 비-list.
    """
    if not isinstance(intake, dict):
        raise IntakeError("intake must be a dict/JSON object")
    if "success" not in intake:
        raise IntakeError("intake missing required 'success' flag (malformed / not an intake artifact)")
    if intake.get("success") is not True:
        raise IntakeError("intake 'success' must be exactly true (parse failure or unknown state refused)")
    meta = intake.get("metadata")
    page_count = meta.get("pageCount") if isinstance(meta, dict) else None
    if not isinstance(page_count, int) or isinstance(page_count, bool) or page_count < 1:
        raise IntakeError("intake requires metadata.pageCount as int >= 1")
    if not isinstance(intake.get("blocks"), list):
        raise IntakeError("intake requires 'blocks' as a list (may be empty for scanned-only)")
    page_quality = intake.get("pageQuality")
    if not isinstance(page_quality, list) or len(page_quality) < 1:
        raise IntakeError("intake requires non-empty 'pageQuality' (per-page document structure)")
    if not isinstance(intake.get("qualitySummary"), dict):
        raise IntakeError("intake requires 'qualitySummary' object")
    for opt in ("outline", "warnings"):
        if opt in intake and not isinstance(intake[opt], list):
            raise IntakeError(f"intake '{opt}' must be a list when present")
    return intake


def _int(v: Any, default: int = 0) -> int:
    return v if isinstance(v, bool) is False and isinstance(v, int) else default


# ---- L2 provisional additive 계약(2L-4B) -------------------------------------

_OCR_REQUIRED_STR = ("provider", "provider_version", "model", "model_sha256", "output_sha256")


def _sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def canonical_ocr_output_sha256(ocr: dict) -> str:
    """ocr_text artifact의 canonical output hash (2L-4C, C2L4B-MIN-01).

    규칙: **top-level `output_sha256` 필드만 제외**한 dict를
    `json.dumps(..., sort_keys=True, ensure_ascii=False, separators=(",", ":"))`로
    직렬화(UTF-8)한 바이트의 SHA-256. `sort_keys`로 key 순서에 독립적이고,
    compact separator·ensure_ascii=False로 결정적이다(표준 라이브러리만 사용).
    runner가 산출물을 만들 때도 동일 규칙으로 `output_sha256`을 계산해야 한다.
    """
    body = {k: v for k, v in ocr.items() if k != "output_sha256"}
    blob = json.dumps(body, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()
_AUX_COUNT_KEYS = (
    "image_resource_count", "image_relationship_count", "image_instance_count",
    "table_tag_count", "table_top_level_count", "nested_table_count",
    "heading_style_candidate_count", "heading_recovery_candidate",
    "caption_candidate_count", "chart_relationship_count",
)
_DOC_LEVEL_HINT = "doc-level"  # 문서 수준 신호의 location_hint(페이지 특정 불가)


def _validate_ocr_text_contract(ocr: Any, allowed_pages: set[int]) -> dict:
    """ocr_text.json 최소 계약 강제(provenance 필수·페이지 정합·**hash 무결성**, 위반 시 IntakeError fail-fast).

    provenance가 없으면 Gate D 계열 증거(no-egress·결정성)와 연결할 수 없으므로 거부한다.
    OCR 페이지가 인테이크의 needsOcr 대상(ocrCandidatePages ∪ pageQuality.needsOcr) 밖이면
    조용히 합치지 않고 실패한다(텍스트 레이어 원문과의 혼동 방지).

    hash 무결성(2L-4C, C2L4B-MIN-01 — presence-only에서 격상):
    - `pages[].text_sha256` = 해당 `text`(UTF-8)의 SHA-256과 일치해야 한다.
    - `output_sha256` = `canonical_ocr_output_sha256()` 규칙(top-level output_sha256 제외,
      sort_keys canonical JSON)의 값과 일치해야 한다.
    - `model_sha256`은 외부 모델 파일의 runner-제공 provenance라 ingest가 재계산할 수 없으므로
      presence-only를 유지한다(문서화된 한계).
    """
    if not isinstance(ocr, dict):
        raise IntakeError("ocr_text must be a dict/JSON object")
    for k in _OCR_REQUIRED_STR:
        v = ocr.get(k)
        if not isinstance(v, str) or not v.strip():
            raise IntakeError(f"ocr_text requires non-empty string '{k}' (provenance)")
    if not isinstance(ocr.get("no_egress_verified"), bool):
        raise IntakeError("ocr_text requires boolean 'no_egress_verified' (provenance)")
    pages = ocr.get("pages")
    if not isinstance(pages, list) or not pages:
        raise IntakeError("ocr_text requires non-empty 'pages' list")
    for p in pages:
        if not isinstance(p, dict):
            raise IntakeError("ocr_text pages entries must be objects")
        page = p.get("page")
        if not isinstance(page, int) or isinstance(page, bool) or page < 1:
            raise IntakeError("ocr_text page must be int >= 1")
        if not isinstance(p.get("text"), str):
            raise IntakeError("ocr_text page requires string 'text'")
        sha = p.get("text_sha256")
        if not isinstance(sha, str) or not sha.strip():
            raise IntakeError("ocr_text page requires non-empty 'text_sha256'")
        computed = _sha256_text(p["text"])
        if sha.strip().lower() != computed:
            raise IntakeError(
                f"ocr_text page {page} text_sha256 mismatch (integrity check failed)")
        if page not in allowed_pages:
            raise IntakeError(
                f"ocr_text page {page} is not an OCR-needed page of this intake (page mismatch)")
    expected_output = canonical_ocr_output_sha256(ocr)
    if str(ocr["output_sha256"]).strip().lower() != expected_output:
        raise IntakeError("ocr_text output_sha256 mismatch (canonical output integrity check failed)")
    return ocr


def _validate_aux_signals_contract(aux: Any) -> dict:
    """aux_signals.json 최소 계약 강제(위반 시 IntakeError fail-fast)."""
    if not isinstance(aux, dict):
        raise IntakeError("aux_signals must be a dict/JSON object")
    if aux.get("doc_format") not in ("hwpx", "docx"):
        raise IntakeError("aux_signals requires doc_format in {'hwpx','docx'}")
    for k in _AUX_COUNT_KEYS:
        v = aux.get(k)
        if not isinstance(v, int) or isinstance(v, bool) or v < 0:
            raise IntakeError(f"aux_signals requires int >= 0 for '{k}'")
    rr = aux.get("review_required_reason", [])
    if not isinstance(rr, list) or not all(isinstance(r, str) for r in rr):
        raise IntakeError("aux_signals 'review_required_reason' must be a list of strings")
    return aux


def _section_for_page(page: int, outline: list) -> str:
    """해당 페이지 이하에서 가장 가까운 앞선 heading 경로(결정적 근접 매칭)."""
    best_text = ""
    best_page = -1
    for o in outline:
        if not isinstance(o, dict):
            continue
        op = _int(o.get("pageNumber"), 0)
        text = str(o.get("text", "")).strip()
        if not text:
            continue
        if op <= page and op >= best_page:
            best_page = op
            best_text = text
    return best_text


def page_or_section_hint(page: int, section_path: str = "") -> str:
    """findings-side 위치 힌트(자유텍스트, **bbox 제외** — 숨은 스키마화 방지).

    Skill이 evidence_anchor.page_or_section에 넣을 사람 읽기용 최소 표기.
    형식: 'p.<page> · <section_path>' (section 없으면 'p.<page>').
    """
    base = f"p.{int(page)}"
    section_path = (section_path or "").strip()
    return f"{base} · {section_path}" if section_path else base


def _dei_location_hint(page: int, section_path: str, bbox: Any) -> str:
    """DEI 문서수준 위치 힌트(**bbox 포함 가능** — 검수 하이라이트용, findings로 전이 금지)."""
    hint = page_or_section_hint(page, section_path)
    if isinstance(bbox, dict):
        x = bbox.get("x")
        y = bbox.get("y")
        if isinstance(x, (int, float)) and isinstance(y, (int, float)):
            hint += f" · bbox≈(x{int(x)},y{int(y)})"
    return hint


def _extraction_quality(pq: dict, needs_ocr: bool) -> str:
    """pageQuality 항목 -> high|medium|low (결정적 휴리스틱, 판정 아님)."""
    if needs_ocr:
        return "low"
    chars = _int(pq.get("textChars"), 0)
    pua = pq.get("puaRatio")
    repl = pq.get("replacementCharRatio")
    pua = pua if isinstance(pua, (int, float)) else 0.0
    repl = repl if isinstance(repl, (int, float)) else 0.0
    if chars < _LOW_TEXT_CHARS or pua > _BAD_RATIO or repl > _BAD_RATIO:
        return "low"
    if chars >= _HIGH_TEXT_CHARS:
        return "high"
    return "medium"


def _table_to_md(table: dict) -> str:
    """표 셀 텍스트를 결정적 마크다운 파이프 행으로(원문 셀 텍스트 그대로, 합성 없음)."""
    rows = table.get("cells")
    if not isinstance(rows, list):
        return ""
    lines = []
    for row in rows:
        if not isinstance(row, list):
            continue
        cells = [str((c or {}).get("text", "")).replace("\n", " ").strip() if isinstance(c, dict) else ""
                 for c in row]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def _pq_by_page(page_quality: list) -> dict:
    out = {}
    for pq in page_quality:
        if isinstance(pq, dict):
            out[_int(pq.get("page"), 0)] = pq
    return out


def build_dei_candidate(intake: Any, source_id: str, source_title: str = "",
                        ocr_text: Any = None, aux_signals: Any = None) -> dict:
    """인테이크 산출물 -> DEI-candidate dict. 결정적. 판정 미생성. 원문 보존.

    L2 provisional additive(2L-4B): `ocr_text`/`aux_signals`가 주어지면 각각 optional
    `ocr_supplement`/`aux_structure` 섹션과 review_priority_hints 항목으로만 합류한다.
    없으면 산출은 기존 L1과 동일(하위 호환 — 기존 필수 구조·의미 불변).
    """
    if not source_id or not str(source_id).strip():
        raise IntakeError("source_id is required (maps to findings source_documents.source_id)")
    data = _validate_intake_contract(intake)

    blocks_in = data.get("blocks") if isinstance(data.get("blocks"), list) else []
    outline = data.get("outline") if isinstance(data.get("outline"), list) else []
    warnings = data.get("warnings") if isinstance(data.get("warnings"), list) else []
    page_quality = data.get("pageQuality") if isinstance(data.get("pageQuality"), list) else []
    metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
    summary = data.get("qualitySummary") if isinstance(data.get("qualitySummary"), dict) else {}
    pq_by_page = _pq_by_page(page_quality)

    # per-page warnings (code 기준)
    warn_by_page: dict[int, list[str]] = {}
    for w in warnings:
        if isinstance(w, dict):
            wp = _int(w.get("page"), 0)
            code = str(w.get("code") or w.get("message") or "").strip()
            if code:
                warn_by_page.setdefault(wp, []).append(code)

    ocr_pages = [p for p in (summary.get("ocrCandidatePages") or []) if isinstance(p, int)]
    low_text_pages = sorted({p for p, pq in pq_by_page.items()
                             if _int(pq.get("textChars"), 0) < _LOW_TEXT_CHARS})

    # blocks (입력 순서 보존)
    out_blocks = []
    for idx, b in enumerate(blocks_in):
        if not isinstance(b, dict):
            continue
        page = _int(b.get("pageNumber"), 0)
        btype = str(b.get("type") or "unknown").strip() or "unknown"
        if btype not in ("heading", "paragraph", "table", "image"):
            btype = "unknown"
        if isinstance(b.get("table"), dict):
            text_or_md = _table_to_md(b["table"])
            if btype == "unknown":
                btype = "table"
        else:
            text_or_md = str(b.get("text", ""))
        section = _section_for_page(page, outline)
        pq = pq_by_page.get(page, {})
        needs_ocr_block = bool(pq.get("needsOcr")) or (page in ocr_pages)
        out_blocks.append({
            "block_id": str(b.get("block_id") or f"b{idx}-p{page}"),
            "page": page,
            "block_type": btype,
            "text_or_table_md": text_or_md,
            "location_hint": _dei_location_hint(page, section, b.get("bbox")),
            "extraction_quality": _extraction_quality(pq, needs_ocr_block),
            "needs_ocr": needs_ocr_block,
            "warnings": list(warn_by_page.get(page, [])),
        })

    # review_priority_hints (결정적 정렬: page, reason)
    hints: list[dict] = []
    for p in ocr_pages:
        hints.append({"location_hint": page_or_section_hint(p, _section_for_page(p, outline)),
                      "reason": "needs_ocr", "priority": "high"})
    for p in low_text_pages:
        if p not in ocr_pages:
            hints.append({"location_hint": page_or_section_hint(p, _section_for_page(p, outline)),
                          "reason": "low_text", "priority": "medium"})
    for p in sorted(warn_by_page):
        if any(c == "SKIPPED_IMAGE" for c in warn_by_page[p]) and p not in ocr_pages:
            hints.append({"location_hint": page_or_section_hint(p, _section_for_page(p, outline)),
                          "reason": "skipped_image", "priority": "medium"})

    dei: dict = {
        "dei_version": DEI_VERSION,
        "source_id": str(source_id),
        "source_title": str(source_title or ""),
        "doc_quality": {
            "page_count": _int(metadata.get("pageCount"), 0),
            "needs_ocr": bool(summary.get("needsOcr", False)),
            "ocr_candidate_pages": sorted(ocr_pages),
            "low_text_pages": low_text_pages,
        },
        "blocks": out_blocks,
        "review_priority_hints": hints,
    }

    # ---- L2 provisional additive 병합(2L-4B, optional) ----
    if ocr_text is not None:
        needs_ocr_pages = {p for p, pq in pq_by_page.items() if bool(pq.get("needsOcr"))}
        allowed = needs_ocr_pages | set(ocr_pages)
        ocr = _validate_ocr_text_contract(ocr_text, allowed)
        # OCR 텍스트는 blocks에 섞지 않는다 — 출처가 구분되는 별도 섹션으로만.
        # extraction_quality는 "low" 고정: OCR 산출은 정확도 미보증(Gate D 한계 명시 계승).
        dei["ocr_supplement"] = {
            "provider": ocr["provider"],
            "provider_version": ocr["provider_version"],
            "model": ocr["model"],
            "model_sha256": ocr["model_sha256"],
            "no_egress_verified": ocr["no_egress_verified"],
            "output_sha256": ocr["output_sha256"],
            "pages": [
                {
                    "page": p["page"],
                    "text": p["text"],
                    "text_sha256": p["text_sha256"],
                    "extraction_quality": "low",
                    "location_hint": page_or_section_hint(p["page"],
                                                          _section_for_page(p["page"], outline)),
                }
                for p in sorted(ocr["pages"], key=lambda x: x["page"])
            ],
        }

    if aux_signals is not None:
        aux = _validate_aux_signals_contract(aux_signals)
        dei["aux_structure"] = {
            "aux_signals_version": str(aux.get("aux_signals_version", "")),
            "doc_format": aux["doc_format"],
            **{k: aux[k] for k in _AUX_COUNT_KEYS},
        }
        # gap 비교는 검수 신호(hint)로만 — 판정/anchor로 매핑하지 않는다.
        intake_image_blocks = sum(1 for bl in out_blocks if bl["block_type"] == "image")
        intake_table_blocks = sum(1 for bl in out_blocks if bl["block_type"] == "table")
        if aux["image_instance_count"] > 0 and intake_image_blocks == 0:
            hints.append({"location_hint": _DOC_LEVEL_HINT,
                          "reason": "image_detection_gap", "priority": "medium"})
        if aux["table_top_level_count"] != intake_table_blocks:
            hints.append({"location_hint": _DOC_LEVEL_HINT,
                          "reason": "table_count_mismatch", "priority": "medium"})
        for r in sorted(set(aux.get("review_required_reason", []))):
            hints.append({"location_hint": _DOC_LEVEL_HINT, "reason": r, "priority": "medium"})

    hints.sort(key=lambda h: (h["location_hint"], h["reason"]))
    return dei


def load_intake(path: str | Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _main(argv: list[str] | None = None) -> int:
    """내부/디버그 전용 진입점(사용자-facing CLI 아님).

    이미 만들어진 인테이크 JSON을 DEI-candidate JSON으로 변환해 출력만 한다.
    OCR/네트워크/외부 도구를 실행하지 않는다.
    """
    ap = argparse.ArgumentParser(description="[internal] intake JSON -> DEI-candidate JSON (no execution)")
    ap.add_argument("intake_json", help="already-extracted intake JSON path (produced out-of-band)")
    ap.add_argument("--source-id", required=True)
    ap.add_argument("--source-title", default="")
    ap.add_argument("--ocr-text", default="",
                    help="[optional] out-of-band OCR artifact JSON path (ocr_text contract)")
    ap.add_argument("--aux-signals", default="",
                    help="[optional] aux structure signals JSON path (aux_signals contract)")
    ns = ap.parse_args(argv)
    try:
        dei = build_dei_candidate(
            load_intake(ns.intake_json), ns.source_id, ns.source_title,
            ocr_text=load_intake(ns.ocr_text) if ns.ocr_text else None,
            aux_signals=load_intake(ns.aux_signals) if ns.aux_signals else None,
        )
    except IntakeError as e:
        print(f"IntakeError: {e}", file=sys.stderr)
        return 2
    print(json.dumps(dei, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
