/**
 * Samil KSSB Precheck - Lightweight Findings Validator / Guardrail (Node port, Cycle 2N-6 Phase 2 N1).
 *
 * `kssb_findings_validator.py`(Python reference — golden parity 기준)의 **충실 이식**이다.
 * 검증 규칙·이슈 코드·severity·location·검출 순서를 Python 구현과 동일하게 유지한다
 * (parity는 `tests/test_findings_validator_parity.test.cjs`가 동일 fixture로 대조).
 *
 * 경계(무엇을 하지 않는가) — Python reference와 동일:
 * - findings를 **고치지 않고, 판정·근거·질문·권고를 새로 만들지 않는다**(detect-only).
 * - 렌더러 재판정을 유발하지 않는다. Source-bound Analysis를 약화하지 않는다.
 * - 외부 의존성 0 (Node 내장 모듈만 — package.json/node_modules 없음).
 *
 * Python과의 의도된 차이(문서화 — 완료 보고서/README 참조):
 * - Python의 선택적 `jsonschema` 검증(설치 시에만)은 Node에 존재하지 않는다. 기본 실행 시
 *   Python의 "jsonschema 미설치 fallback"과 동일한 의미의 info 이슈(`schema.optional_skipped`)를
 *   보고한다(방식 A — 표준 라이브러리 검증만 제공, fallback 경로와 parity). `--no-jsonschema`는
 *   Python과 동일하게 이 info 자체를 생략한다.
 * - (additive, 기본 꺼짐) `--source-text <파일>`이 명시 제공된 경우에만 quote 실재성 보조 점검을
 *   수행한다(공백 정규화 substring — warning). 사람 검수·독립 표본 확인을 대체하지 않는다.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// 계약 상수 (findings_schema_contract.md — Python reference와 동일)
// ---------------------------------------------------------------------------

const MODE_TO_SOURCE_MODE = Object.freeze({
  customer_provided_materials: "customer_provided",
  public_materials_validation: "public",
});

const _SHARED = {
  partial_evidence_needs_supplement: "일부 근거 확인, 보완 필요",
  conflict_or_interpretation_needed: "상충 또는 해석 필요",
  out_of_scope_or_not_applicable: "검토 범위 외 또는 적용대상 아님",
};
const EXPECTED_LABEL = Object.freeze({
  customer_provided_materials: Object.freeze({
    evidence_confirmed: "제공자료상 근거 확인",
    not_verifiable: "제공자료로 확인 불가",
    ..._SHARED,
  }),
  public_materials_validation: Object.freeze({
    evidence_confirmed: "공개자료상 근거 확인",
    not_verifiable: "공개자료로 확인 불가",
    ..._SHARED,
  }),
});

const VALID_JUDGMENT_CODES = new Set([
  "evidence_confirmed", "partial_evidence_needs_supplement", "not_verifiable",
  "conflict_or_interpretation_needed", "out_of_scope_or_not_applicable",
]);
const VALID_PRIORITIES = new Set(["high", "medium", "low"]);
const CUSTOMER_QUESTION_FIELDS = Object.freeze([
  "question", "reason", "related_evidence", "priority", "requested_material", "follow_up_action",
]);

const PROHIBITED_SCAN_EXCLUDED_KEYS = new Set([
  "disclaimer", "human_review_boundary", "overall_limitations", "notes",
]);

// 내부 경로 노출 스캔 패턴 — Python `_PATH_PATTERNS`와 동일 정규식(IGNORECASE).
const _PATH_PATTERNS = [
  String.raw`[A-Za-z]:[\\/]`,
  String.raw`/Users/`, String.raw`Users[\\]`,
  String.raw`/home/`,
  String.raw`\.codex`, String.raw`\.claude`,
  String.raw`AppData`,
  String.raw`sandbox`,
  String.raw`plugins?[\\/]cache`, String.raw`plugin[\\/]cache`,
  String.raw`/tmp/`, String.raw`/var/folders/`,
  String.raw`[\\/]Temp[\\/]`,
  String.raw`%(?:TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)%`,
  String.raw`node_modules`,
];
const _PATH_RE = new RegExp(_PATH_PATTERNS.join("|"), "i");

// prohibited_terms.md를 읽지 못할 때의 백업 목록(파일이 우선) — Python과 동일.
const _FALLBACK_PROHIBITED = Object.freeze([
  "audit trail", "감사 추적", "감사용", "인증 의견", "준수 확정", "적합 판정",
  "제3자 검증 완료", "컴플라이언스 확정", "자동 감사", "감사 의견",
]);

// ---------------------------------------------------------------------------
// Issue / 헬퍼
// ---------------------------------------------------------------------------

class Issue {
  constructor(severity, code, location, message) {
    this.severity = severity; // "error" | "warning" | "info"
    this.code = code;
    this.location = location;
    this.message = message;
  }
  asDict() {
    return { severity: this.severity, code: this.code, location: this.location, message: this.message };
  }
  toString() {
    return `[${this.severity}] ${this.code} @ ${this.location}: ${this.message}`;
  }
}

function _s(v) {
  return v === null || v === undefined ? "" : String(v);
}

function _isNonemptyStr(v) {
  return typeof v === "string" && v.trim() !== "";
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

/** (location, value, leafKey)로 모든 문자열 리프를 순회 — Python `_walk_strings`와 동일 순서. */
function* _walkStrings(node, p, key) {
  if (node !== null && typeof node === "object" && !Array.isArray(node)) {
    for (const [k, v] of Object.entries(node)) {
      yield* _walkStrings(v, p ? `${p}.${k}` : k, k);
    }
  } else if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      yield* _walkStrings(node[i], `${p}[${i}]`, key);
    }
  } else if (typeof node === "string") {
    yield [p, node, key];
  }
}

function loadProhibitedTerms(termsPath) {
  let p = termsPath;
  if (!p) {
    p = path.join(__dirname, "..", "skills", "samil-kssb-precheck", "prohibited_terms.md");
  }
  let text;
  try {
    text = fs.readFileSync(p, "utf-8");
  } catch (e) {
    return { terms: [..._FALLBACK_PROHIBITED], warn: `prohibited_terms.md 로드 실패(${p}); 백업 목록 사용` };
  }
  const terms = [];
  let inSection = false;
  let extraLine = "";
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      inSection = line.trim() === "## 금지 표현";
      continue;
    }
    if (inSection) {
      const m = line.match(/^\s*-\s+(.+?)\s*$/);
      if (m) terms.push(m[1].trim());
      else if (line.includes("판정명으로")) extraLine = line;
    }
  }
  for (const m of extraLine.matchAll(/"([^"]+)"/g)) {
    if (m[1].includes(" ")) terms.push(m[1].trim());
  }
  const uniq = [...new Set(terms.filter((t) => t))].sort(_cpCompare);
  return { terms: uniq, warn: null };
}

// ---------------------------------------------------------------------------
// 개별 검증 규칙 (Python reference와 동일 순서·코드)
// ---------------------------------------------------------------------------

function _checkStructure(f, issues) {
  const meta = f.report_meta;
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
    issues.push(new Issue("error", "structure.report_meta", "report_meta", "report_meta 객체가 없습니다."));
  } else {
    for (const req of ["report_title", "review_mode", "disclaimer"]) {
      if (!_isNonemptyStr(meta[req])) {
        issues.push(new Issue("error", "structure.report_meta_field", `report_meta.${req}`,
          `report_meta.${req}가 비어 있거나 없습니다.`));
      }
    }
  }
  if (!_isNonemptyStr(f.human_review_boundary)) {
    issues.push(new Issue("error", "structure.human_review_boundary", "human_review_boundary",
      "human_review_boundary가 비어 있거나 없습니다."));
  }
  if (!Array.isArray(f.source_documents) || f.source_documents.length === 0) {
    issues.push(new Issue("error", "structure.source_documents", "source_documents",
      "source_documents 배열이 비어 있거나 없습니다."));
  }
  if (!Array.isArray(f.kssb_areas) || f.kssb_areas.length === 0) {
    issues.push(new Issue("error", "structure.kssb_areas", "kssb_areas",
      "kssb_areas 배열이 비어 있거나 없습니다."));
  }
}

function _isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function _checkSourceModes(f, reviewMode, issues) {
  const expected = MODE_TO_SOURCE_MODE[reviewMode];
  const docs = Array.isArray(f.source_documents) ? f.source_documents : [];
  docs.forEach((sd, i) => {
    if (!_isPlainObject(sd)) {
      issues.push(new Issue("error", "source_doc.type", `source_documents[${i}]`, "객체가 아닙니다."));
      return;
    }
    const loc = `source_documents[${i}]`;
    if (!_isNonemptyStr(sd.source_id)) {
      issues.push(new Issue("error", "source_doc.source_id", `${loc}.source_id`, "source_id가 비어 있거나 없습니다."));
    }
    if (!_isNonemptyStr(sd.title)) {
      issues.push(new Issue("error", "source_doc.title", `${loc}.title`, "title이 비어 있거나 없습니다(필수)."));
    }
    const sm = _s(sd.source_mode);
    if (!sm) {
      issues.push(new Issue("error", "source_doc.source_mode", `${loc}.source_mode`,
        "source_mode가 비어 있거나 없습니다(필수)."));
    } else if (expected && sm !== expected) {
      issues.push(new Issue("error", "mode.source_mode_mismatch", `${loc}.source_mode`,
        `review_mode='${reviewMode}'는 source_mode='${expected}'를 기대하지만 '${sm}'.`));
    }
  });
}

function _checkAreaStructure(f, issues) {
  const areas = Array.isArray(f.kssb_areas) ? f.kssb_areas : [];
  areas.forEach((area, ai) => {
    const loc = `kssb_areas[${ai}]`;
    if (!_isPlainObject(area)) {
      issues.push(new Issue("error", "area.type", loc, "객체가 아닙니다."));
      return;
    }
    if (!_isNonemptyStr(area.area_id)) {
      issues.push(new Issue("error", "area.area_id", `${loc}.area_id`, "area_id가 비어 있거나 없습니다(필수)."));
    }
    if (!_isNonemptyStr(area.area_name)) {
      issues.push(new Issue("error", "area.area_name", `${loc}.area_name`, "area_name이 비어 있거나 없습니다(필수)."));
    }
    const items = area.items;
    if (!Array.isArray(items) || items.length < 1) {
      issues.push(new Issue("error", "area.items", `${loc}.items`,
        "items 배열이 비어 있거나 없습니다(최소 1개 필수)."));
    } else {
      items.forEach((item, ii) => {
        if (!_isPlainObject(item)) {
          issues.push(new Issue("error", "item.type", `${loc}.items[${ii}]`, "객체가 아닙니다."));
        }
      });
    }
  });
}

function* _iterItems(f) {
  const areas = Array.isArray(f.kssb_areas) ? f.kssb_areas : [];
  for (let ai = 0; ai < areas.length; ai++) {
    const area = areas[ai];
    if (!_isPlainObject(area)) continue;
    const items = Array.isArray(area.items) ? area.items : [];
    for (let ii = 0; ii < items.length; ii++) {
      if (_isPlainObject(items[ii])) {
        yield [`kssb_areas[${ai}].items[${ii}]`, items[ii]];
      }
    }
  }
}

function _checkQuoteReuse(f, issues) {
  const itemIdsByQuote = new Map();
  const firstLocByQuote = new Map();
  for (const [loc, item] of _iterItems(f)) {
    const itemId = _s(item.item_id) || loc;
    const anchors = Array.isArray(item.evidence_anchors) ? item.evidence_anchors : [];
    for (const a of anchors) {
      if (!_isPlainObject(a)) continue;
      const quote = _s(a.quote).trim();
      if (!quote) continue;
      if (!itemIdsByQuote.has(quote)) itemIdsByQuote.set(quote, new Set());
      itemIdsByQuote.get(quote).add(itemId);
      if (!firstLocByQuote.has(quote)) firstLocByQuote.set(quote, loc);
    }
  }
  const quotes = [...itemIdsByQuote.keys()].sort(_cpCompare);
  for (const quote of quotes) {
    const itemIds = itemIdsByQuote.get(quote);
    if (itemIds.size > 1) {
      const ids = [...itemIds].sort(_cpCompare).join(", ");
      issues.push(new Issue(
        "warning", "evidence.duplicate_quote_reuse", firstLocByQuote.get(quote),
        `동일 인용이 서로 다른 항목(${ids})의 근거로 재사용되었습니다. 항목별 적합 인용인지 검수가 필요합니다.`));
    }
  }
}

function _checkItems(f, reviewMode, sourceIds, issues) {
  const labelMap = EXPECTED_LABEL[reviewMode] || {};
  for (const [loc, item] of _iterItems(f)) {
    const code = _s(item.judgment_code);
    const label = _s(item.judgment_label);
    for (const req of ["item_id", "requirement_title", "judgment_label"]) {
      if (!_isNonemptyStr(item[req])) {
        issues.push(new Issue("error", "item.field", `${loc}.${req}`, `${req}가 비어 있거나 없습니다.`));
      }
    }
    if (!VALID_JUDGMENT_CODES.has(code)) {
      issues.push(new Issue("error", "item.judgment_code", `${loc}.judgment_code`,
        `알 수 없는 judgment_code: '${code}'.`));
    }
    if (Object.prototype.hasOwnProperty.call(EXPECTED_LABEL, reviewMode)
        && Object.prototype.hasOwnProperty.call(labelMap, code)) {
      if (label !== labelMap[code]) {
        issues.push(new Issue("error", "mode.label_mismatch", `${loc}.judgment_label`,
          `review_mode='${reviewMode}', judgment_code='${code}'는 `
          + `judgment_label='${labelMap[code]}'를 기대하지만 '${label}'.`));
      }
    }
    const anchors = item.evidence_anchors || [];
    const missing = item.missing_info || [];
    const questions = item.customer_questions || [];
    if (code === "evidence_confirmed" || code === "partial_evidence_needs_supplement") {
      if (!(Array.isArray(anchors) && anchors.length >= 1)) {
        issues.push(new Issue("error", "sourcebound.anchors", `${loc}.evidence_anchors`,
          `'${code}' 판정은 evidence_anchors ≥ 1이 필요합니다.`));
      }
    }
    if (code === "not_verifiable") {
      if (!(Array.isArray(missing) && missing.length >= 1)) {
        issues.push(new Issue("error", "sourcebound.missing_info", `${loc}.missing_info`,
          "'not_verifiable' 판정은 missing_info ≥ 1이 필요합니다."));
      }
      if (!(Array.isArray(questions) && questions.length >= 1)) {
        issues.push(new Issue("error", "sourcebound.questions", `${loc}.customer_questions`,
          "'not_verifiable' 판정은 customer_questions ≥ 1이 필요합니다."));
      }
    }
    if (code === "conflict_or_interpretation_needed") {
      if (item.human_review_required !== true) {
        issues.push(new Issue("error", "sourcebound.human_review", `${loc}.human_review_required`,
          "'conflict_or_interpretation_needed' 판정은 human_review_required=true가 필요합니다."));
      }
      if (!_isNonemptyStr(item.human_review_note)) {
        issues.push(new Issue("error", "sourcebound.human_review_note", `${loc}.human_review_note`,
          "'conflict_or_interpretation_needed' 판정은 human_review_note가 필요합니다."));
      }
    }
    if (code === "out_of_scope_or_not_applicable") {
      if (!(Array.isArray(missing) && missing.length >= 1)) {
        issues.push(new Issue("error", "sourcebound.out_of_scope", `${loc}.missing_info`,
          "'out_of_scope_or_not_applicable' 판정은 적용 제외 사유(missing_info) ≥ 1이 필요합니다."));
      }
    }
    if (Array.isArray(anchors)) {
      anchors.forEach((anc, j) => {
        if (!_isPlainObject(anc)) return;
        const aloc = `${loc}.evidence_anchors[${j}]`;
        if (!_isNonemptyStr(anc.quote)) {
          issues.push(new Issue("error", "anchor.quote_empty", `${aloc}.quote`,
            "evidence quote가 비어 있습니다(빈 인용 금지)."));
        }
        const sid = _s(anc.source_id);
        if (!sid) {
          issues.push(new Issue("error", "anchor.source_id_empty", `${aloc}.source_id`,
            "evidence source_id가 비어 있습니다."));
        } else if (!sourceIds.has(sid)) {
          issues.push(new Issue("error", "anchor.source_id_ref", `${aloc}.source_id`,
            `source_id='${sid}'가 source_documents에 없습니다(cross-reference 실패).`));
        }
      });
    }
    if (Array.isArray(questions)) {
      questions.forEach((q, j) => {
        if (!_isPlainObject(q)) {
          issues.push(new Issue("error", "question.type", `${loc}.customer_questions[${j}]`, "객체가 아닙니다."));
          return;
        }
        const qloc = `${loc}.customer_questions[${j}]`;
        for (const fld of CUSTOMER_QUESTION_FIELDS) {
          if (!_isNonemptyStr(q[fld])) {
            issues.push(new Issue("error", "question.field", `${qloc}.${fld}`,
              `customer_question.${fld}가 비어 있거나 없습니다.`));
          }
        }
        const pr = _s(q.priority);
        if (pr && !VALID_PRIORITIES.has(pr)) {
          issues.push(new Issue("error", "question.priority", `${qloc}.priority`,
            `priority는 high/medium/low여야 하는데 '${pr}'.`));
        }
      });
    }
  }
}

function _checkProhibitedAndPaths(f, prohibited, issues) {
  const prohibitedLower = prohibited.map((t) => [t, t.toLowerCase()]);
  for (const [location, value, key] of _walkStrings(f, "", null)) {
    const m = _PATH_RE.exec(value);
    if (m) {
      issues.push(new Issue("error", "path.internal_exposure", location,
        `내부 경로로 보이는 토큰 '${m[0]}'이 값에 포함됨.`));
    }
    if (key !== null && PROHIBITED_SCAN_EXCLUDED_KEYS.has(key)) continue;
    const vlow = value.toLowerCase();
    for (const [term, tlow] of prohibitedLower) {
      if (vlow.includes(tlow)) {
        issues.push(new Issue("error", "prohibited.term", location,
          `금지 표현 '${term}'이 분석 콘텐츠 필드에 포함됨.`));
      }
    }
  }
}

// (additive, 기본 꺼짐) quote 실재성 보조 점검 — 원문 텍스트가 명시 제공된 경우에만 실행.
// 공백·줄바꿈 정규화(연속 공백 ↔ 공백 1개) substring 검사(Phase 1 §9·2N-5R 검증 방식과 동일 규칙).
// 미발견은 warning(검출·검수 유도) — 사람 검수·독립 표본 확인(blackbox §3-(b))을 대체하지 않는다.
function _normalizeWs(s) {
  return s.replace(/\s+/g, " ").trim();
}

function _checkQuoteReality(f, sourceTexts, issues) {
  const normTexts = sourceTexts.map(_normalizeWs);
  for (const [loc, item] of _iterItems(f)) {
    const anchors = Array.isArray(item.evidence_anchors) ? item.evidence_anchors : [];
    anchors.forEach((anc, j) => {
      if (!_isPlainObject(anc)) return;
      const quote = _s(anc.quote).trim();
      if (!quote) return; // 빈 quote는 anchor.quote_empty가 별도 처리
      const nq = _normalizeWs(quote);
      const found = normTexts.some((t) => t.includes(nq));
      if (!found) {
        issues.push(new Issue("warning", "quote.source_not_found", `${loc}.evidence_anchors[${j}].quote`,
          "인용을 제공된 원문 텍스트에서 재발견하지 못했습니다(공백 정규화 기준). "
          + "원문 대조·인용 수정 또는 판정 재검토가 필요합니다(사람 검수를 대체하지 않음)."));
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 공개 진입점
// ---------------------------------------------------------------------------

/**
 * findings를 검증하고 Issue 배열을 반환한다(detect-only, findings 미변경).
 * options:
 *  - prohibitedTermsPath: prohibited_terms.md 경로 재정의(테스트용)
 *  - useJsonschema: true(기본)면 Python의 "jsonschema 미설치 fallback"과 동일 의미의 info 이슈를
 *    추가한다(Node에는 선택적 jsonschema 검증이 없음 — 방식 A). false면 Python `--no-jsonschema`처럼 생략.
 *  - sourceTexts: (additive, 기본 없음) 원문 텍스트 문자열 배열 — 제공 시에만 quote 실재성 보조 점검(warning).
 */
function validateFindings(findings, options = {}) {
  const { prohibitedTermsPath = null, useJsonschema = true, sourceTexts = null } = options;
  const issues = [];
  if (!_isPlainObject(findings)) {
    issues.push(new Issue("error", "structure.root", "(root)", "findings 최상위가 JSON 객체가 아닙니다."));
    return issues;
  }

  _checkStructure(findings, issues);

  const meta = _isPlainObject(findings.report_meta) ? findings.report_meta : {};
  const reviewMode = _s(meta.review_mode);
  if (reviewMode && !Object.prototype.hasOwnProperty.call(MODE_TO_SOURCE_MODE, reviewMode)) {
    issues.push(new Issue("error", "mode.review_mode", "report_meta.review_mode",
      `알 수 없는 review_mode: '${reviewMode}'.`));
  }

  const sourceIds = new Set();
  const docs = Array.isArray(findings.source_documents) ? findings.source_documents : [];
  for (const sd of docs) {
    if (_isPlainObject(sd) && _s(sd.source_id)) sourceIds.add(_s(sd.source_id));
  }

  _checkSourceModes(findings, reviewMode, issues);
  _checkAreaStructure(findings, issues);
  _checkItems(findings, reviewMode, sourceIds, issues);
  _checkQuoteReuse(findings, issues);

  const { terms, warn } = loadProhibitedTerms(prohibitedTermsPath);
  if (warn) issues.push(new Issue("warning", "prohibited.list_load", "(prohibited_terms)", warn));
  _checkProhibitedAndPaths(findings, terms, issues);

  if (Array.isArray(sourceTexts) && sourceTexts.length > 0) {
    _checkQuoteReality(findings, sourceTexts, issues);
  }

  if (useJsonschema) {
    // 방식 A: Node에는 선택적 jsonschema 검증이 없다 — Python의 미설치 fallback과 동일 의미의 info.
    issues.push(new Issue("info", "schema.optional_skipped", "(schema)",
      "선택적 JSON Schema 검증은 Node 구현에 포함되지 않음 — 표준 라이브러리 검증만 수행"
      + "(Python reference의 jsonschema 미설치 fallback과 동등 범위)."));
  }

  return issues;
}

function loadFindings(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = "사용법: node kssb_findings_validator.cjs <findings.json> "
  + "[--json] [--no-jsonschema] [--warnings-as-errors] [--source-text <원문.txt> ...]";

function main(argv) {
  const args = { findings: null, json: false, noJsonschema: false, warningsAsErrors: false, sourceTextPaths: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--no-jsonschema") args.noJsonschema = true;
    else if (a === "--warnings-as-errors") args.warningsAsErrors = true;
    else if (a === "--source-text") {
      const v = argv[++i];
      if (!v) { console.error(USAGE); return 2; }
      args.sourceTextPaths.push(v);
    } else if (!a.startsWith("-") && args.findings === null) args.findings = a;
    else { console.error(USAGE); return 2; }
  }
  if (!args.findings) { console.error(USAGE); return 2; }

  let findings;
  try {
    findings = loadFindings(args.findings);
  } catch (e) {
    console.error(`[error] findings 로드 실패: ${e.message}`);
    return 2;
  }

  const sourceTexts = [];
  const preIssues = [];
  for (const p of args.sourceTextPaths) {
    try {
      sourceTexts.push(fs.readFileSync(p, "utf-8"));
    } catch (e) {
      preIssues.push(new Issue("warning", "quote.source_text_load", p,
        `원문 텍스트 로드 실패 — quote 실재성 보조 점검에서 제외: ${e.message}`));
    }
  }

  const issues = [
    ...preIssues,
    ...validateFindings(findings, {
      useJsonschema: !args.noJsonschema,
      sourceTexts: sourceTexts.length > 0 ? sourceTexts : null,
    }),
  ];
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (args.json) {
    console.log(JSON.stringify(issues.map((i) => i.asDict()), null, 2));
  } else {
    for (const i of issues) console.log(i.toString());
    console.log(`\n요약: error ${errors.length}건, warning ${warnings.length}건, `
      + `info ${issues.length - errors.length - warnings.length}건.`);
  }

  if (errors.length > 0 || (args.warningsAsErrors && warnings.length > 0)) return 1;
  return 0;
}

module.exports = {
  MODE_TO_SOURCE_MODE, EXPECTED_LABEL, VALID_JUDGMENT_CODES, VALID_PRIORITIES,
  CUSTOMER_QUESTION_FIELDS, PROHIBITED_SCAN_EXCLUDED_KEYS,
  Issue, validateFindings, loadFindings, loadProhibitedTerms, main,
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
