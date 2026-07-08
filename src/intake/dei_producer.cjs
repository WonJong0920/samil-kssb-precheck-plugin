"use strict";
/**
 * Samil KSSB Precheck — Optional Intake → DEI-candidate Producer (Node 이식, 2N-6 Phase 2 N3).
 *
 * `dei_producer.py`(reference — 무변경 보존)의 충실 이식이다. 이미 로컬에서 추출된
 * 문서 인테이크 산출물(Kordoc `--format json` 등 — 본 모듈이 직접 실행하지 않음)을 받아
 * DEI-candidate 계약(문서 수준 중간 산출물)으로 **결정적으로** 정규화한다.
 * 검증 규칙·오류 메시지·필드 구성·정렬 순서·CLI 출력(json.dumps sort_keys/indent=2 동등)까지
 * Python reference와 동일하며, parity는 tests/test_intake_dei_producer_parity.test.cjs가
 * Python CLI 실측 대조로 증명한다.
 *
 * 경계(무엇을 하지 않는가) — Python reference와 동일:
 * - **판정을 만들지 않는다.** judgment_code/judgment_label 미생성. DEI 필드
 *   (extraction_quality/needs_ocr/priority)는 검수 트리아지 신호일 뿐 KSSB 판단이 아니다.
 * - **원문을 합성하지 않는다.** 블록 텍스트/표는 입력 인테이크 산출물의 원문 그대로.
 * - **findings 스키마를 만들지 않는다.** DEI는 findings가 아니며 renderer/validator에
 *   직접 유입되지 않는다(Skill이 근거 재료로만 소비).
 * - **OCR/모델/네트워크/외부 도구를 실행하지 않는다.** 이미 만들어진 JSON만 변환.
 * - **실패를 명시한다.** malformed/필수 키 누락은 조용한 부분 산출 없이 IntakeError.
 * - 내장 모듈만 사용(외부 npm 의존성·package.json 없음). runner 모듈도 require하지 않는다
 *   (ingest 독립성 — canonical hash는 동일 규칙을 자체 구현하고 golden parity로 결속).
 *
 * 계약 상세(최소 인테이크 계약·document-level 변형·ocr_text/aux_signals additive)는
 * `dei_producer.py`의 모듈 docstring과 `src/intake/README.md`를 기준으로 한다.
 *
 * 알려진 non-goal(병리 입력에서의 Python 미세 차이 — 계약 밖, 정상 JSON 입력에는 영향 없음):
 * - JSON 파일의 `5.0` 같은 정수값 float: Python은 float로 구분해 거부/기본값 처리하지만
 *   JS는 JSON.parse가 5로 읽어 정수로 수용한다(JS 수 체계의 한계 — runner와 동일 제약).
 * - 리스트 자리에 든 bool/비-list 등 비정형 타입의 미세 동작(Python bool⊂int 등)은
 *   재현하지 않는다 — 계약 검증이 먼저 거부하거나 결과가 동일하다.
 */

const crypto = require("node:crypto");
const fs = require("node:fs");

const DEI_VERSION = "1";

// extraction_quality 임계값(문서화된 결정적 상수 — 통계적 신뢰도가 아니라 휴리스틱 표식).
const _LOW_TEXT_CHARS = 30; // 페이지 텍스트 글자수 하한
const _HIGH_TEXT_CHARS = 200; // 이 이상이면 텍스트 충실
const _BAD_RATIO = 0.10; // PUA/replacement 문자 비율 상한

// 관측된 Kordoc HWP-계열 fileType(2N-4 실측). 이 밖의 값은 paginated 계약으로 처리.
const _DOC_LEVEL_FILETYPES = ["hwp", "hwpx", "docx"];

const _OCR_REQUIRED_STR = ["provider", "provider_version", "model", "model_sha256", "output_sha256"];

const _AUX_COUNT_KEYS = [
  "image_resource_count", "image_relationship_count", "image_instance_count",
  "table_tag_count", "table_top_level_count", "nested_table_count",
  "heading_style_candidate_count", "heading_recovery_candidate",
  "caption_candidate_count", "chart_relationship_count",
];

const _DOC_LEVEL_HINT = "doc-level"; // 문서 수준 신호의 location_hint(페이지 특정 불가)

const _BLOCK_TYPES = ["heading", "paragraph", "table", "image"];

/** 인테이크 산출물이 유효하지 않거나 파싱 실패를 나타낼 때(Python IntakeError 대응). */
class IntakeError extends Error {
  constructor(message) {
    super(message);
    this.name = "IntakeError";
  }
}

// ---------------------------------------------------------------------------
// Python 의미 대응 헬퍼(이식 충실성 — dict.get / truthiness / str() / sorted())
// ---------------------------------------------------------------------------

function _isDict(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function _get(o, k, dflt = undefined) {
  return _isDict(o) && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : dflt;
}

// Python truthiness(bool()) 대응 — JS와 달리 빈 list/dict는 falsy.
function _pyTruthy(v) {
  if (v === null || v === undefined || v === false) return false;
  if (v === true) return true;
  if (typeof v === "number") return v !== 0 && !Number.isNaN(v);
  if (typeof v === "string") return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return Boolean(v);
}

// Python `a or b` 대응.
function _pyOr(a, b) {
  return _pyTruthy(a) ? a : b;
}

// Python str() 대응(JSON 스칼라 범위 — dict/list의 repr 표기는 계약 밖).
function _pyStr(v) {
  if (typeof v === "string") return v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null || v === undefined) return "None";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : JSON.stringify(v);
  return JSON.stringify(v);
}

// Python `_int(v, default)` 대응(bool 제외 int만 통과).
function _int(v, dflt = 0) {
  return typeof v === "number" && Number.isInteger(v) ? v : dflt;
}

function _isInt(v) {
  return typeof v === "number" && Number.isInteger(v);
}

// 코드포인트 기준 정렬(Python sorted()와 동일 순서 보장 — BMP 밖 문자 포함).
function _cpCompare(a, b) {
  const ai = [...a], bi = [...b];
  const n = Math.min(ai.length, bi.length);
  for (let i = 0; i < n; i++) {
    const d = ai[i].codePointAt(0) - bi[i].codePointAt(0);
    if (d !== 0) return d;
  }
  return ai.length - bi.length;
}

// hints.sort(key=(location_hint, reason)) 대응 — stable sort(우선순위는 키가 아님).
function _hintCompare(a, b) {
  const lh = _cpCompare(a.location_hint, b.location_hint);
  if (lh !== 0) return lh;
  return _cpCompare(a.reason, b.reason);
}

// ---------------------------------------------------------------------------
// 계약 검증(위반 시 IntakeError — 오류 메시지는 Python reference와 동일 문자열)
// ---------------------------------------------------------------------------

function _validateIntakeContract(intake) {
  if (!_isDict(intake)) throw new IntakeError("intake must be a dict/JSON object");
  if (!Object.prototype.hasOwnProperty.call(intake, "success")) {
    throw new IntakeError("intake missing required 'success' flag (malformed / not an intake artifact)");
  }
  if (intake.success !== true) {
    throw new IntakeError("intake 'success' must be exactly true (parse failure or unknown state refused)");
  }
  const meta = _get(intake, "metadata");
  const pageCount = _isDict(meta) ? _get(meta, "pageCount") : null;
  if (!_isInt(pageCount) || pageCount < 1) {
    throw new IntakeError("intake requires metadata.pageCount as int >= 1");
  }
  if (!Array.isArray(_get(intake, "blocks"))) {
    throw new IntakeError("intake requires 'blocks' as a list (may be empty for scanned-only)");
  }
  const pageQuality = _get(intake, "pageQuality");
  if (!Array.isArray(pageQuality) || pageQuality.length < 1) {
    throw new IntakeError("intake requires non-empty 'pageQuality' (per-page document structure)");
  }
  if (!_isDict(_get(intake, "qualitySummary"))) {
    throw new IntakeError("intake requires 'qualitySummary' object");
  }
  for (const opt of ["outline", "warnings"]) {
    if (Object.prototype.hasOwnProperty.call(intake, opt) && !Array.isArray(intake[opt])) {
      throw new IntakeError(`intake '${opt}' must be a list when present`);
    }
  }
  return intake;
}

/**
 * document-level 변형 분기 조건(관측 기반 — 자동 완화가 아니라 명시 변형 선택).
 * fileType이 HWP-계열이고 pageQuality/qualitySummary가 모두 부재할 때만 true.
 */
function isDocumentLevelIntake(intake) {
  return _isDict(intake)
    && _DOC_LEVEL_FILETYPES.includes(_get(intake, "fileType"))
    && !Object.prototype.hasOwnProperty.call(intake, "pageQuality")
    && !Object.prototype.hasOwnProperty.call(intake, "qualitySummary");
}

function _validateDocumentLevelContract(intake) {
  if (!_isDict(intake)) throw new IntakeError("intake must be a dict/JSON object");
  if (!Object.prototype.hasOwnProperty.call(intake, "success")) {
    throw new IntakeError("intake missing required 'success' flag (malformed / not an intake artifact)");
  }
  if (intake.success !== true) {
    throw new IntakeError("intake 'success' must be exactly true (parse failure or unknown state refused)");
  }
  if (!_isDict(_get(intake, "metadata"))) {
    throw new IntakeError("document-level intake requires 'metadata' object");
  }
  const blocks = _get(intake, "blocks");
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new IntakeError(
      "document-level intake requires non-empty 'blocks' "
      + "(no pageQuality signal exists to distinguish evidence-poor from malformed)");
  }
  const hasContent = blocks.some((b) => _isDict(b) && (
    (typeof _get(b, "text") === "string" && b.text.trim()) || _isDict(_get(b, "table"))));
  if (!hasContent) {
    throw new IntakeError("document-level intake requires at least one block with text or table content");
  }
  for (const opt of ["outline", "warnings"]) {
    if (Object.prototype.hasOwnProperty.call(intake, opt) && !Array.isArray(intake[opt])) {
      throw new IntakeError(`intake '${opt}' must be a list when present`);
    }
  }
  return intake;
}

// ---------------------------------------------------------------------------
// 품질 휴리스틱(결정적 — 판정 아님)
// ---------------------------------------------------------------------------

// 블록 텍스트의 [PUA 비율, replacement 문자 비율] — 원문에서 결정적으로 계산(합성 아님).
// 코드포인트 단위로 센다(Python len()/문자 반복과 동일).
function _badCharRatios(text) {
  if (!text) return [0.0, 0.0];
  let total = 0, pua = 0, repl = 0;
  for (const ch of text) {
    total += 1;
    const cp = ch.codePointAt(0);
    if (cp >= 0xE000 && cp <= 0xF8FF) pua += 1;
    if (ch === "�") repl += 1;
  }
  return [pua / total, repl / total];
}

// document-level 블록 품질 — 블록 자체 텍스트에서만 계산(페이지 신호 부재, 상한 medium).
function _blockExtractionQuality(text) {
  if (!text.trim()) return "low";
  const [pua, repl] = _badCharRatios(text);
  if (pua > _BAD_RATIO || repl > _BAD_RATIO) return "low";
  return "medium";
}

// pageQuality 항목 -> high|medium|low (결정적 휴리스틱, 판정 아님).
function _extractionQuality(pq, needsOcr) {
  if (needsOcr) return "low";
  const chars = _int(_get(pq, "textChars"), 0);
  let pua = _get(pq, "puaRatio");
  let repl = _get(pq, "replacementCharRatio");
  pua = typeof pua === "number" ? pua : 0.0;
  repl = typeof repl === "number" ? repl : 0.0;
  if (chars < _LOW_TEXT_CHARS || pua > _BAD_RATIO || repl > _BAD_RATIO) return "low";
  if (chars >= _HIGH_TEXT_CHARS) return "high";
  return "medium";
}

// ---------------------------------------------------------------------------
// 위치 힌트(findings-side는 bbox 제외 — 숨은 스키마화 방지)
// ---------------------------------------------------------------------------

/** document-level 위치 힌트(자유텍스트, bbox·페이지 좌표 없음). */
function docLevelHint(sectionPath = "") {
  const s = String(sectionPath || "").trim();
  return s ? `${_DOC_LEVEL_HINT} · ${s}` : _DOC_LEVEL_HINT;
}

/** findings-side 위치 힌트: 'p.<page> · <section_path>' (section 없으면 'p.<page>'). */
function pageOrSectionHint(page, sectionPath = "") {
  const base = `p.${Math.trunc(Number(page))}`;
  const s = String(sectionPath || "").trim();
  return s ? `${base} · ${s}` : base;
}

// DEI 문서수준 위치 힌트(bbox 포함 가능 — 검수 하이라이트용, findings로 전이 금지).
function _deiLocationHint(page, sectionPath, bbox) {
  let hint = pageOrSectionHint(page, sectionPath);
  if (_isDict(bbox)) {
    const x = _get(bbox, "x");
    const y = _get(bbox, "y");
    if (typeof x === "number" && typeof y === "number") {
      hint += ` · bbox≈(x${Math.trunc(x)},y${Math.trunc(y)})`;
    }
  }
  return hint;
}

// 해당 페이지 이하에서 가장 가까운 앞선 heading 경로(결정적 근접 매칭).
function _sectionForPage(page, outline) {
  let bestText = "";
  let bestPage = -1;
  for (const o of outline) {
    if (!_isDict(o)) continue;
    const op = _int(_get(o, "pageNumber"), 0);
    const text = _pyStr(_get(o, "text", "")).trim();
    if (!text) continue;
    if (op <= page && op >= bestPage) {
      bestPage = op;
      bestText = text;
    }
  }
  return bestText;
}

// ---------------------------------------------------------------------------
// canonical hash (Python canonical_ocr_output_sha256과 parity — 규칙의 single source는
// dei_producer.py이며, runner(pdf_ocr_runner.cjs)와 동일 fixture·golden 상수로 결속된다)
// ---------------------------------------------------------------------------

function _sha256Text(text) {
  return crypto.createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

// Python json.dumps(sort_keys=True, ensure_ascii=False, separators=(",", ":")) 대응.
// key는 이 계약에서 ASCII만 사용한다(비-ASCII key 정렬은 parity 미보장 — 계약 밖).
function _pyJsonCompact(v) {
  if (v === null) return "null";
  if (v === true) return "true";
  if (v === false) return "false";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new IntakeError("non-finite number in ocr_text");
    return Number.isInteger(v) ? String(v) : JSON.stringify(v);
  }
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(_pyJsonCompact).join(",")}]`;
  if (typeof v === "object") {
    const keys = Object.keys(v).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${_pyJsonCompact(v[k])}`).join(",")}}`;
  }
  throw new IntakeError("unsupported type in ocr_text canonicalization");
}

/**
 * ocr_text artifact의 canonical output hash (2L-4C 규칙의 충실 이식).
 * top-level `output_sha256` 필드만 제외한 body를 canonical JSON으로 직렬화(UTF-8)한
 * 바이트의 SHA-256. key 순서 독립·compact separator — Python/Node runner와 동일.
 */
function canonicalOcrOutputSha256(ocr) {
  const body = {};
  for (const k of Object.keys(ocr)) {
    if (k !== "output_sha256") body[k] = ocr[k];
  }
  return crypto.createHash("sha256").update(Buffer.from(_pyJsonCompact(body), "utf8")).digest("hex");
}

// ---------------------------------------------------------------------------
// L2 additive 계약 검증(ocr_text / aux_signals — 위반 시 IntakeError fail-fast)
// ---------------------------------------------------------------------------

function _validateOcrTextContract(ocr, allowedPages) {
  if (!_isDict(ocr)) throw new IntakeError("ocr_text must be a dict/JSON object");
  for (const k of _OCR_REQUIRED_STR) {
    const v = _get(ocr, k);
    if (typeof v !== "string" || !v.trim()) {
      throw new IntakeError(`ocr_text requires non-empty string '${k}' (provenance)`);
    }
  }
  if (typeof _get(ocr, "no_egress_verified") !== "boolean") {
    throw new IntakeError("ocr_text requires boolean 'no_egress_verified' (provenance)");
  }
  const pages = _get(ocr, "pages");
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new IntakeError("ocr_text requires non-empty 'pages' list");
  }
  for (const p of pages) {
    if (!_isDict(p)) throw new IntakeError("ocr_text pages entries must be objects");
    const page = _get(p, "page");
    if (!_isInt(page) || page < 1) {
      throw new IntakeError("ocr_text page must be int >= 1");
    }
    if (typeof _get(p, "text") !== "string") {
      throw new IntakeError("ocr_text page requires string 'text'");
    }
    const sha = _get(p, "text_sha256");
    if (typeof sha !== "string" || !sha.trim()) {
      throw new IntakeError("ocr_text page requires non-empty 'text_sha256'");
    }
    const computed = _sha256Text(p.text);
    if (sha.trim().toLowerCase() !== computed) {
      throw new IntakeError(`ocr_text page ${page} text_sha256 mismatch (integrity check failed)`);
    }
    if (!allowedPages.has(page)) {
      throw new IntakeError(`ocr_text page ${page} is not an OCR-needed page of this intake (page mismatch)`);
    }
  }
  const expectedOutput = canonicalOcrOutputSha256(ocr);
  if (_pyStr(ocr.output_sha256).trim().toLowerCase() !== expectedOutput) {
    throw new IntakeError("ocr_text output_sha256 mismatch (canonical output integrity check failed)");
  }
  return ocr;
}

function _validateAuxSignalsContract(aux) {
  if (!_isDict(aux)) throw new IntakeError("aux_signals must be a dict/JSON object");
  const df = _get(aux, "doc_format");
  if (df !== "hwpx" && df !== "docx") {
    throw new IntakeError("aux_signals requires doc_format in {'hwpx','docx'}");
  }
  for (const k of _AUX_COUNT_KEYS) {
    const v = _get(aux, k);
    if (!_isInt(v) || v < 0) {
      throw new IntakeError(`aux_signals requires int >= 0 for '${k}'`);
    }
  }
  const rr = _get(aux, "review_required_reason", []);
  if (!Array.isArray(rr) || !rr.every((r) => typeof r === "string")) {
    throw new IntakeError("aux_signals 'review_required_reason' must be a list of strings");
  }
  return aux;
}

// ---------------------------------------------------------------------------
// 블록 정규화 재료
// ---------------------------------------------------------------------------

// 표 셀 텍스트를 결정적 마크다운 파이프 행으로(원문 셀 텍스트 그대로, 합성 없음).
function _tableToMd(table) {
  const rows = _get(table, "cells");
  if (!Array.isArray(rows)) return "";
  const lines = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => (_isDict(c)
      ? _pyStr(_get(c, "text", "")).split("\n").join(" ").trim()
      : ""));
    lines.push("| " + cells.join(" | ") + " |");
  }
  return lines.join("\n");
}

function _pqByPage(pageQuality) {
  const out = new Map();
  for (const pq of pageQuality) {
    if (_isDict(pq)) out.set(_int(_get(pq, "page"), 0), pq);
  }
  return out;
}

// ---------------------------------------------------------------------------
// aux_signals additive 병합(paginated/document-level 공용 — 판정/anchor 매핑 금지)
// ---------------------------------------------------------------------------

function _mergeAuxSignals(dei, hints, outBlocks, auxSignals) {
  if (auxSignals === null || auxSignals === undefined) return;
  const aux = _validateAuxSignalsContract(auxSignals);
  const auxStructure = {
    aux_signals_version: _pyStr(_get(aux, "aux_signals_version", "")),
    doc_format: aux.doc_format,
  };
  for (const k of _AUX_COUNT_KEYS) auxStructure[k] = aux[k];
  dei.aux_structure = auxStructure;
  // gap 비교는 검수 신호(hint)로만 — 판정/anchor로 매핑하지 않는다.
  const intakeImageBlocks = outBlocks.filter((bl) => bl.block_type === "image").length;
  const intakeTableBlocks = outBlocks.filter((bl) => bl.block_type === "table").length;
  if (aux.image_instance_count > 0 && intakeImageBlocks === 0) {
    hints.push({ location_hint: _DOC_LEVEL_HINT, reason: "image_detection_gap", priority: "medium" });
  }
  if (aux.table_top_level_count !== intakeTableBlocks) {
    hints.push({ location_hint: _DOC_LEVEL_HINT, reason: "table_count_mismatch", priority: "medium" });
  }
  const reasons = [...new Set(_get(aux, "review_required_reason", []))].sort(_cpCompare);
  for (const r of reasons) {
    hints.push({ location_hint: _DOC_LEVEL_HINT, reason: r, priority: "medium" });
  }
}

// ---------------------------------------------------------------------------
// document-level 변형 빌더(2N-4B — 비페이지 포맷, 없는 신호를 합성하지 않는다)
// ---------------------------------------------------------------------------

function _buildDocumentLevelDei(intake, sourceId, sourceTitle = "", ocrText = null, auxSignals = null) {
  const data = _validateDocumentLevelContract(intake);
  if (ocrText !== null && ocrText !== undefined) {
    throw new IntakeError(
      "ocr_text is not supported for document-level (non-paginated) intake "
      + "(no needsOcr page signal exists to align OCR pages against)");
  }

  const blocksIn = data.blocks;
  const metadata = data.metadata;

  const pageCountRaw = _get(metadata, "pageCount");
  let pageCount, pageCountBasis;
  if (_isInt(pageCountRaw) && pageCountRaw >= 1) {
    pageCount = pageCountRaw;
    pageCountBasis = "provider_reported";
  } else {
    pageCount = 0;
    pageCountBasis = "not_reported";
  }

  const outBlocks = [];
  let currentSection = "";
  for (let idx = 0; idx < blocksIn.length; idx++) {
    const b = blocksIn[idx];
    if (!_isDict(b)) continue;
    const page = _int(_get(b, "pageNumber"), 0);
    let btype = _pyStr(_pyOr(_get(b, "type"), "unknown")).trim() || "unknown";
    if (!_BLOCK_TYPES.includes(btype)) btype = "unknown";
    let textOrMd;
    if (_isDict(_get(b, "table"))) {
      textOrMd = _tableToMd(b.table);
      if (btype === "unknown") btype = "table";
    } else {
      textOrMd = _pyStr(_get(b, "text", ""));
    }
    if (btype === "heading" && textOrMd.trim()) currentSection = textOrMd.trim();
    outBlocks.push({
      block_id: _pyStr(_pyOr(_get(b, "block_id"), `b${idx}-doc`)),
      page, // provider 원시값 통과(1 또는 0) — 위치 힌트에는 쓰지 않는다
      block_type: btype,
      text_or_table_md: textOrMd,
      location_hint: docLevelHint(currentSection),
      extraction_quality: _blockExtractionQuality(textOrMd),
      needs_ocr: false,
      warnings: [],
    });
  }

  // 페이지 품질 신호 부재는 검수 신호로만 남긴다(판정·anchor 아님).
  const hints = [{
    location_hint: _DOC_LEVEL_HINT,
    reason: "page_quality_signal_unavailable",
    priority: "medium",
  }];

  const dei = {
    dei_version: DEI_VERSION,
    source_id: _pyStr(sourceId),
    source_title: _pyStr(_pyOr(sourceTitle, "")),
    doc_quality: {
      page_count: pageCount,
      needs_ocr: false,
      ocr_candidate_pages: [],
      low_text_pages: [],
      // additive(2N-4B): 비페이지 포맷 명시 — 부재 필드는 paginated L1을 뜻한다.
      pagination: "document_level",
      page_count_basis: pageCountBasis,
      quality_signal: "not_reported",
    },
    blocks: outBlocks,
    review_priority_hints: hints,
  };

  _mergeAuxSignals(dei, hints, outBlocks, auxSignals);
  hints.sort(_hintCompare);
  return dei;
}

// ---------------------------------------------------------------------------
// 메인 빌더
// ---------------------------------------------------------------------------

/**
 * 인테이크 산출물 -> DEI-candidate. 결정적. 판정 미생성. 원문 보존.
 * Python `build_dei_candidate(intake, source_id, source_title, ocr_text, aux_signals)` 대응 —
 * optional 인자는 `{ ocrText, auxSignals }`로 받는다.
 */
function buildDeiCandidate(intake, sourceId, sourceTitle = "", { ocrText = null, auxSignals = null } = {}) {
  if (!_pyTruthy(sourceId) || !_pyStr(sourceId).trim()) {
    throw new IntakeError("source_id is required (maps to findings source_documents.source_id)");
  }
  if (isDocumentLevelIntake(intake)) {
    return _buildDocumentLevelDei(intake, sourceId, sourceTitle, ocrText, auxSignals);
  }
  const data = _validateIntakeContract(intake);

  const blocksIn = Array.isArray(_get(data, "blocks")) ? data.blocks : [];
  const outline = Array.isArray(_get(data, "outline")) ? data.outline : [];
  const warnings = Array.isArray(_get(data, "warnings")) ? data.warnings : [];
  const pageQuality = Array.isArray(_get(data, "pageQuality")) ? data.pageQuality : [];
  const metadata = _isDict(_get(data, "metadata")) ? data.metadata : {};
  const summary = _isDict(_get(data, "qualitySummary")) ? data.qualitySummary : {};
  const pqByPage = _pqByPage(pageQuality);

  // per-page warnings (code 기준)
  const warnByPage = new Map();
  for (const w of warnings) {
    if (_isDict(w)) {
      const wp = _int(_get(w, "page"), 0);
      const code = _pyStr(_pyOr(_get(w, "code"), _pyOr(_get(w, "message"), ""))).trim();
      if (code) {
        if (!warnByPage.has(wp)) warnByPage.set(wp, []);
        warnByPage.get(wp).push(code);
      }
    }
  }

  const summaryOcr = _pyOr(_get(summary, "ocrCandidatePages"), []);
  const ocrPages = (Array.isArray(summaryOcr) ? summaryOcr : []).filter(_isInt);
  const lowTextSet = new Set();
  for (const [p, pq] of pqByPage) {
    if (_int(_get(pq, "textChars"), 0) < _LOW_TEXT_CHARS) lowTextSet.add(p);
  }
  const lowTextPages = [...lowTextSet].sort((a, b) => a - b);

  // blocks (입력 순서 보존)
  const outBlocks = [];
  for (let idx = 0; idx < blocksIn.length; idx++) {
    const b = blocksIn[idx];
    if (!_isDict(b)) continue;
    const page = _int(_get(b, "pageNumber"), 0);
    let btype = _pyStr(_pyOr(_get(b, "type"), "unknown")).trim() || "unknown";
    if (!_BLOCK_TYPES.includes(btype)) btype = "unknown";
    let textOrMd;
    if (_isDict(_get(b, "table"))) {
      textOrMd = _tableToMd(b.table);
      if (btype === "unknown") btype = "table";
    } else {
      textOrMd = _pyStr(_get(b, "text", ""));
    }
    const section = _sectionForPage(page, outline);
    const pq = pqByPage.get(page) || {};
    const needsOcrBlock = _pyTruthy(_get(pq, "needsOcr")) || ocrPages.includes(page);
    outBlocks.push({
      block_id: _pyStr(_pyOr(_get(b, "block_id"), `b${idx}-p${page}`)),
      page,
      block_type: btype,
      text_or_table_md: textOrMd,
      location_hint: _deiLocationHint(page, section, _get(b, "bbox")),
      extraction_quality: _extractionQuality(pq, needsOcrBlock),
      needs_ocr: needsOcrBlock,
      warnings: [...(warnByPage.get(page) || [])],
    });
  }

  // review_priority_hints (결정적 정렬: location_hint, reason — 마지막에 일괄 정렬)
  const hints = [];
  for (const p of ocrPages) {
    hints.push({
      location_hint: pageOrSectionHint(p, _sectionForPage(p, outline)),
      reason: "needs_ocr", priority: "high",
    });
  }
  for (const p of lowTextPages) {
    if (!ocrPages.includes(p)) {
      hints.push({
        location_hint: pageOrSectionHint(p, _sectionForPage(p, outline)),
        reason: "low_text", priority: "medium",
      });
    }
  }
  const warnPagesSorted = [...warnByPage.keys()].sort((a, b) => a - b);
  for (const p of warnPagesSorted) {
    if (warnByPage.get(p).some((c) => c === "SKIPPED_IMAGE") && !ocrPages.includes(p)) {
      hints.push({
        location_hint: pageOrSectionHint(p, _sectionForPage(p, outline)),
        reason: "skipped_image", priority: "medium",
      });
    }
  }

  const dei = {
    dei_version: DEI_VERSION,
    source_id: _pyStr(sourceId),
    source_title: _pyStr(_pyOr(sourceTitle, "")),
    doc_quality: {
      page_count: _int(_get(metadata, "pageCount"), 0),
      needs_ocr: _pyTruthy(_get(summary, "needsOcr", false)),
      ocr_candidate_pages: [...ocrPages].sort((a, b) => a - b),
      low_text_pages: lowTextPages,
    },
    blocks: outBlocks,
    review_priority_hints: hints,
  };

  // ---- L2 ingest additive 병합(optional) ----
  if (ocrText !== null && ocrText !== undefined) {
    const needsOcrPages = new Set();
    for (const [p, pq] of pqByPage) {
      if (_pyTruthy(_get(pq, "needsOcr"))) needsOcrPages.add(p);
    }
    const allowed = new Set([...needsOcrPages, ...ocrPages]);
    const ocr = _validateOcrTextContract(ocrText, allowed);
    // OCR 텍스트는 blocks에 섞지 않는다 — 출처가 구분되는 별도 섹션으로만.
    // extraction_quality는 "low" 고정: OCR 산출은 정확도 미보증(Gate D 한계 명시 계승).
    dei.ocr_supplement = {
      provider: ocr.provider,
      provider_version: ocr.provider_version,
      model: ocr.model,
      model_sha256: ocr.model_sha256,
      no_egress_verified: ocr.no_egress_verified,
      output_sha256: ocr.output_sha256,
      pages: [...ocr.pages].sort((a, b) => a.page - b.page).map((p) => ({
        page: p.page,
        text: p.text,
        text_sha256: p.text_sha256,
        extraction_quality: "low",
        location_hint: pageOrSectionHint(p.page, _sectionForPage(p.page, outline)),
      })),
    };
  }

  _mergeAuxSignals(dei, hints, outBlocks, auxSignals);

  hints.sort(_hintCompare);
  return dei;
}

function loadIntake(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// ---------------------------------------------------------------------------
// CLI 출력 직렬화 — Python json.dumps(ensure_ascii=False, indent=2, sort_keys=True) 동등.
// DEI 출력 도메인은 str/int/bool/list/dict뿐이며 key는 전부 ASCII다(정렬 동일성 근거).
// ---------------------------------------------------------------------------

function _pyJsonIndent(v, level = 0) {
  if (v === null) return "null";
  if (v === true) return "true";
  if (v === false) return "false";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new IntakeError("non-finite number in DEI output");
    return Number.isInteger(v) ? String(v) : JSON.stringify(v);
  }
  if (typeof v === "string") return JSON.stringify(v);
  const pad = "  ".repeat(level + 1);
  const padEnd = "  ".repeat(level);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return "[\n" + v.map((x) => pad + _pyJsonIndent(x, level + 1)).join(",\n") + "\n" + padEnd + "]";
  }
  if (typeof v === "object") {
    const keys = Object.keys(v).sort();
    if (keys.length === 0) return "{}";
    return "{\n"
      + keys.map((k) => `${pad}${JSON.stringify(k)}: ${_pyJsonIndent(v[k], level + 1)}`).join(",\n")
      + "\n" + padEnd + "}";
  }
  throw new IntakeError("unsupported type in DEI output serialization");
}

// ---------------------------------------------------------------------------
// CLI (내부/디버그 전용 진입점 — 사용자-facing CLI 아님. Python _main과 동일 계약:
// exit 0=성공(DEI JSON stdout) / 2=IntakeError·인자 오류 / 1=입력 로드 등 그 밖의 실패.
// Python reference는 로드 실패 시 traceback+exit 1 — Node는 같은 exit 1에 통제된 안내만
// 출력한다(stack·경로 미노출, 더 보수적 — 기능 동일).)
// ---------------------------------------------------------------------------

const _USAGE = "usage: node dei_producer.cjs <intake_json> --source-id <id> "
  + "[--source-title <title>] [--ocr-text <path>] [--aux-signals <path>]";

function main(argv) {
  const args = { intakeJson: null, sourceId: null, sourceTitle: "", ocrText: "", auxSignals: "" };
  const valueFlags = {
    "--source-id": "sourceId",
    "--source-title": "sourceTitle",
    "--ocr-text": "ocrText",
    "--aux-signals": "auxSignals",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (Object.prototype.hasOwnProperty.call(valueFlags, a)) {
      i += 1;
      if (i >= argv.length) {
        process.stderr.write(`옵션 값 누락: ${a}\n${_USAGE}\n`);
        return 2;
      }
      args[valueFlags[a]] = argv[i];
    } else if (a === "-h" || a === "--help") {
      process.stdout.write(_USAGE + "\n");
      return 0;
    } else if (a.startsWith("-")) {
      process.stderr.write(`알 수 없는 옵션: ${a}\n${_USAGE}\n`);
      return 2;
    } else if (args.intakeJson === null) {
      args.intakeJson = a;
    } else {
      process.stderr.write(`인자가 너무 많습니다: ${a}\n${_USAGE}\n`);
      return 2;
    }
  }
  if (args.intakeJson === null || args.sourceId === null) {
    process.stderr.write(`필수 인자 누락: <intake_json>과 --source-id가 필요합니다.\n${_USAGE}\n`);
    return 2;
  }

  let intake, ocr = null, aux = null;
  try {
    intake = loadIntake(args.intakeJson);
    if (args.ocrText) ocr = loadIntake(args.ocrText);
    if (args.auxSignals) aux = loadIntake(args.auxSignals);
  } catch {
    process.stderr.write("[error] 입력 JSON을 읽거나 파싱하지 못했습니다. 파일 경로와 JSON 형식을 확인해 주십시오.\n");
    return 1;
  }

  let dei;
  try {
    dei = buildDeiCandidate(intake, args.sourceId, args.sourceTitle, { ocrText: ocr, auxSignals: aux });
  } catch (e) {
    if (e instanceof IntakeError) {
      process.stderr.write(`IntakeError: ${e.message}\n`);
      return 2;
    }
    throw e;
  }
  process.stdout.write(_pyJsonIndent(dei) + "\n");
  return 0;
}

module.exports = {
  DEI_VERSION,
  IntakeError,
  isDocumentLevelIntake,
  docLevelHint,
  pageOrSectionHint,
  canonicalOcrOutputSha256,
  buildDeiCandidate,
  loadIntake,
  main,
};

if (require.main === module) {
  let code;
  try {
    code = main(process.argv.slice(2));
  } catch {
    // 예기치 못한 내부 실패의 통제된 안내(stack·경로 미노출 — 내부/디버그 CLI에도 동일 원칙).
    process.stderr.write("[error] DEI 변환 중 예기치 못한 문제가 발생해 중단했습니다.\n");
    code = 1;
  }
  process.exit(code);
}
