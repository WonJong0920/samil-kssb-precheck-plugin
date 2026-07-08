"use strict";
/**
 * Node DEI producer 테스트 (2N-6 Phase 2 N3 — dei_producer.cjs).
 *
 * tests/test_intake_dei_producer.py(Python reference 스위트)의 점검 전량을 동일 합성
 * fixture로 미러링하고, Node 전용 계약(canonical hash golden — runner 구현과 3중 결속,
 * CLI exit/출력, core·runner 미require 경계)을 추가로 강제한다.
 *
 * 경계·결정성 증명(Python 스위트와 동일 축):
 * - 결정적(동일 입력 -> 동일 출력) / judgment field 미생성 / 원문 보존(합성 없음)
 * - needs_ocr·low_text·skipped_image -> review_priority_hints 라우팅
 * - findings-side 힌트 bbox 미포함(숨은 스키마화 방지)
 * - malformed 입력은 조용한 부분 산출 없이 IntakeError
 * - 이 모듈이 core(validator/renderer/delivery)·runner를 require하지 않는다
 */
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const DEI_CJS = path.join(REPO, "src", "intake", "dei_producer.cjs");
const D = require(DEI_CJS);
const O = require(path.join(REPO, "src", "intake", "runners", "pdf_ocr_runner.cjs"));

function sha(text) {
  return crypto.createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

function canon(v) {
  return JSON.stringify(sortDeep(v));
}

function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v !== null && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
}

// 합성 인테이크 산출물(Python 테스트와 문자 그대로 동일 — 실제 PDF/Kordoc 출력 미포함).
function sampleIntake() {
  return {
    success: true,
    fileType: "pdf",
    metadata: { pageCount: 5 },
    outline: [
      { level: 1, text: "II. 기후", pageNumber: 2 },
      { level: 2, text: "거버넌스", pageNumber: 2 },
    ],
    blocks: [
      { type: "heading", text: "거버넌스", pageNumber: 2,
        bbox: { page: 2, x: 37, y: 627 } },
      { type: "paragraph", text: "기후 관련 위험 및 기회에 관한 관리·감독 기구를 둔다.",
        pageNumber: 2, bbox: { page: 2, x: 37, y: 600 } },
      { type: "table", table: { rows: 2, cols: 2,
        cells: [[{ text: "지표" }, { text: "값" }], [{ text: "배출량" }, { text: "100" }]] },
        pageNumber: 3, bbox: { page: 3, x: 10, y: 20 } },
    ],
    warnings: [
      { page: 4, message: "1개 이미지 영역 텍스트 없음", code: "SKIPPED_IMAGE" },
    ],
    pageQuality: [
      { page: 2, textChars: 300, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 3, textChars: 250, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 4, textChars: 10, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 5, textChars: 5, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: true },
    ],
    qualitySummary: { needsOcr: false, ocrCandidatePages: [5] },
  };
}

function sampleOcrText() {
  const text = "스캔 페이지 OCR 텍스트";
  const ocr = {
    provider: "tesseract.js",
    provider_version: "7.0.0",
    model: "tessdata_fast kor+eng",
    model_sha256: "6b85e11d9bbf0786", // 외부 모델 provenance — presence-only(재계산 불가)
    no_egress_verified: true,
    pages: [{ page: 5, text, text_sha256: sha(text) }],
  };
  ocr.output_sha256 = D.canonicalOcrOutputSha256(ocr);
  return ocr;
}

function sampleAuxSignals() {
  return {
    aux_signals_version: "1",
    doc_format: "docx",
    image_resource_count: 14,
    image_relationship_count: 71,
    image_instance_count: 70,
    table_tag_count: 30,
    table_top_level_count: 25,
    nested_table_count: 5,
    heading_style_candidate_count: 6,
    heading_recovery_candidate: 0,
    caption_candidate_count: 164,
    chart_relationship_count: 0,
    review_required_reason: ["heading_styles_defined_but_unused"],
  };
}

function sampleHwpIntake() {
  return {
    success: true,
    fileType: "hwp",
    metadata: { version: "5.x", pageCount: 1 },
    outline: [{ level: 1, text: "지속가능경영 개요", pageNumber: 1 }],
    blocks: [
      { type: "heading", text: "지속가능경영 개요", pageNumber: 1, level: 1 },
      { type: "paragraph", text: "기후 관련 위험 및 기회를 관리한다.", pageNumber: 1 },
      { type: "image", text: "image_001.bmp", pageNumber: 1,
        imageData: { filename: "image_001.bmp", data: "Qk12nwAAFAKEBASE64" } },
      { type: "heading", text: "온실가스 배출", pageNumber: 1, level: 1 },
      { type: "table", pageNumber: 1, table: { rows: 2, cols: 2, hasHeader: true,
        cells: [[{ text: "지표" }, { text: "값" }], [{ text: "배출량" }, { text: "100" }]] } },
    ],
    images: [{ filename: "image_001.bmp", data: "Qk12nwAAFAKEBASE64" }],
    markdown: "# 지속가능경영 개요\n...",
  };
}

function sampleDocxIntake() {
  return {
    success: true,
    fileType: "docx",
    metadata: { author: "user", createdAt: "2021-04-04T03:28:43.146" },
    blocks: [
      { type: "paragraph", text: "기후 관련 위험 및 기회를 관리한다." },
      { type: "table", table: { rows: 1, cols: 1, hasHeader: false,
        cells: [[{ text: "배출량 100" }]] } },
    ],
    images: [],
    markdown: "...",
  };
}

// 판정으로 오인될 수 있는 키(DEI에 절대 없어야 함 — Python 스위트와 동일 목록).
const JUDGMENT_KEYS = new Set([
  "judgment_code", "judgment_label", "evidence_confirmed",
  "partial_evidence_needs_supplement", "not_verifiable",
  "conflict_or_interpretation_needed", "out_of_scope_or_not_applicable",
  "customer_questions", "missing_info", "recommendations",
]);

function allKeys(node, acc = new Set()) {
  if (Array.isArray(node)) {
    for (const v of node) allKeys(v, acc);
  } else if (node !== null && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      acc.add(k);
      allKeys(v, acc);
    }
  }
  return acc;
}

function expectIntakeError(fn) {
  assert.throws(fn, (e) => e instanceof D.IntakeError, "IntakeError가 발생해야 함");
}

// ---- 1~2. 결정성 / judgment 미생성 --------------------------------------------------

test("결정성: 동일 입력 -> 동일 출력", () => {
  const a = canon(D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample"));
  const b = canon(D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample"));
  assert.strictEqual(a, b);
});

test("judgment field 미생성", () => {
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  const leaked = [...allKeys(dei)].filter((k) => JUDGMENT_KEYS.has(k));
  assert.deepStrictEqual(leaked, []);
});

// ---- 3~4. 원문 보존 ------------------------------------------------------------------

test("원문 발췌 보존(합성 없음)", () => {
  const intake = sampleIntake();
  const dei = D.buildDeiCandidate(intake, "doc-1", "Sample");
  const para = dei.blocks.find((bl) => bl.block_type === "paragraph");
  assert.strictEqual(para.text_or_table_md, intake.blocks[1].text);
});

test("표 원문 셀 보존", () => {
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  const tbl = dei.blocks.find((bl) => bl.block_type === "table");
  assert.ok(tbl.text_or_table_md.includes("배출량"));
  assert.ok(tbl.text_or_table_md.includes("100"));
});

// ---- 5~8. hint / doc_quality 신호 ----------------------------------------------------

test("needs_ocr -> priority hint(high)", () => {
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  assert.ok(dei.review_priority_hints.some((h) => h.reason === "needs_ocr" && h.priority === "high"));
});

test("low_text -> priority hint(medium)", () => {
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  assert.ok(dei.review_priority_hints.some((h) => h.reason === "low_text" && h.priority === "medium"));
});

test("skipped_image -> priority hint(medium)", () => {
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  assert.ok(dei.review_priority_hints.some((h) => h.reason === "skipped_image" && h.priority === "medium"));
});

test("doc_quality: ocr_candidate_pages / low_text_pages", () => {
  const dq = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample").doc_quality;
  assert.deepStrictEqual(dq.ocr_candidate_pages, [5]);
  assert.ok(dq.low_text_pages.includes(4) && dq.low_text_pages.includes(5));
});

test("findings 힌트 bbox 미포함 / DEI location_hint bbox 포함", () => {
  const fsHint = D.pageOrSectionHint(2, "거버넌스");
  assert.ok(!fsHint.includes("bbox") && fsHint.startsWith("p.2"));
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  assert.ok(dei.blocks.some((bl) => bl.location_hint.includes("bbox")));
});

// ---- 10/10b. malformed 계약 거부(조용한 부분 산출 금지) --------------------------------

function without(key) {
  const s = sampleIntake();
  delete s[key];
  return s;
}

const MALFORMED = [
  ["parse 실패(success=false)", { success: false }, "doc-1"],
  ["source_id 누락", sampleIntake(), ""],
  ["빈 객체 {}", {}, "doc-1"],
  ["success 키 누락", without("success"), "doc-1"],
  ["success 비-true(문자열)", { ...sampleIntake(), success: "true" }, "doc-1"],
  ["metadata 누락", without("metadata"), "doc-1"],
  ["pageCount<1", { ...sampleIntake(), metadata: { pageCount: 0 } }, "doc-1"],
  ["pageCount 비-int", { ...sampleIntake(), metadata: { pageCount: "5" } }, "doc-1"],
  ["blocks 비-list", { ...sampleIntake(), blocks: {} }, "doc-1"],
  ["pageQuality 누락", without("pageQuality"), "doc-1"],
  ["pageQuality 빈 list", { ...sampleIntake(), pageQuality: [] }, "doc-1"],
  ["qualitySummary 누락", without("qualitySummary"), "doc-1"],
  ["outline 비-list(존재 시)", { ...sampleIntake(), outline: {} }, "doc-1"],
];

for (const [name, intake, sourceId] of MALFORMED) {
  test(`malformed 거부: ${name}`, () => {
    expectIntakeError(() => D.buildDeiCandidate(intake, sourceId));
  });
}

// ---- 10c. 유효하지만 근거 빈약(스캔 전용) 허용 -----------------------------------------

test("스캔 전용(blocks=[] + pageQuality 존재) 허용", () => {
  const scanned = {
    success: true,
    fileType: "pdf",
    metadata: { pageCount: 3 },
    outline: [],
    blocks: [],
    warnings: [],
    pageQuality: [
      { page: 1, textChars: 2, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: true },
      { page: 2, textChars: 3, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: true },
      { page: 3, textChars: 1, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: true },
    ],
    qualitySummary: { needsOcr: true, ocrCandidatePages: [1, 2, 3] },
  };
  const dei = D.buildDeiCandidate(scanned, "scan-1");
  assert.deepStrictEqual(dei.blocks, []);
  assert.ok(dei.review_priority_hints.some((h) => h.reason === "needs_ocr"));
});

// ---- 11. 경계: core·runner 미require -------------------------------------------------

test("core 미require(직접 유입 방지) + runner 미require(ingest 독립성)", () => {
  const src = fs.readFileSync(DEI_CJS, "utf-8");
  const banned = [
    "kssb_findings_validator", "kssb_report_renderer", "kssb_report_delivery",
    "pdf_ocr_runner", "hwp_assisted_runner", "document_intake_router", "nethook",
  ];
  for (const m of banned) {
    const re = new RegExp(String.raw`require\([^)]*${m}`);
    assert.ok(!re.test(src), `dei_producer.cjs가 ${m}를 require하면 안 됨`);
  }
  // require는 내장 모듈만(node: prefix) — 외부/상대 모듈 의존 없음.
  const requires = [...src.matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(requires.length > 0);
  assert.ok(requires.every((r) => r.startsWith("node:")), `내장 모듈 외 require 발견: ${requires}`);
});

// ---- 12a~12d. L2 additive 병합(하위 호환·ocr_supplement·aux_structure) -----------------

test("하위 호환: ocr/aux 없으면 optional 섹션 부재 + DEI_VERSION '1' 유지", () => {
  const base = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  assert.ok(!("ocr_supplement" in base) && !("aux_structure" in base));
  assert.strictEqual(base.dei_version, "1");
});

test("OCR 병합: ocr_supplement로만 합류, blocks 불변, low 고정, provenance 보존", () => {
  const base = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample");
  const merged = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample",
    { ocrText: sampleOcrText(), auxSignals: sampleAuxSignals() });
  assert.ok("ocr_supplement" in merged);
  assert.strictEqual(canon(merged.blocks), canon(base.blocks), "blocks 불변(미혼입)");
  assert.ok(merged.blocks.every((bl) => !bl.text_or_table_md.includes("스캔 페이지 OCR 텍스트")));
  const sup = merged.ocr_supplement;
  assert.strictEqual(sup.provider, "tesseract.js");
  assert.strictEqual(sup.no_egress_verified, true);
  assert.strictEqual(sup.model_sha256, "6b85e11d9bbf0786");
  assert.ok(sup.pages.every((p) => p.extraction_quality === "low"));
});

test("aux 병합: aux_structure 섹션 + gap 플래그는 hint로만(판정 미변환)", () => {
  const merged = D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample",
    { ocrText: sampleOcrText(), auxSignals: sampleAuxSignals() });
  assert.strictEqual(merged.aux_structure.table_top_level_count, 25);
  const reasons = new Set(merged.review_priority_hints.map((h) => h.reason));
  assert.ok(reasons.has("image_detection_gap"), "aux 70 vs intake image 0");
  assert.ok(reasons.has("table_count_mismatch"), "aux 25 vs intake table 1");
  assert.ok(reasons.has("heading_styles_defined_but_unused"));
  const leaked = [...allKeys(merged)].filter((k) => JUDGMENT_KEYS.has(k));
  assert.deepStrictEqual(leaked, []);
});

test("결정성(병합 포함)", () => {
  const m1 = canon(D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample",
    { ocrText: sampleOcrText(), auxSignals: sampleAuxSignals() }));
  const m2 = canon(D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample",
    { ocrText: sampleOcrText(), auxSignals: sampleAuxSignals() }));
  assert.strictEqual(m1, m2);
});

// ---- 12e~12g. OCR/aux fail-fast ------------------------------------------------------

test("OCR 페이지 불일치 거부(page 2는 needsOcr 대상 아님)", () => {
  const bad = sampleOcrText();
  bad.pages = [{ page: 2, text: "x", text_sha256: sha("x") }];
  bad.output_sha256 = D.canonicalOcrOutputSha256(bad);
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: bad }));
});

for (const missing of ["provider", "model_sha256", "output_sha256"]) {
  test(`OCR ${missing} 누락 거부`, () => {
    const o = sampleOcrText();
    delete o[missing];
    expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: o }));
  });
}

test("OCR no_egress_verified 비-bool 거부", () => {
  const o = sampleOcrText();
  o.no_egress_verified = "yes";
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: o }));
});

test("OCR pages 빈 list 거부", () => {
  const o = sampleOcrText();
  o.pages = [];
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: o }));
});

test("OCR text_sha256 누락 거부", () => {
  const o = sampleOcrText();
  o.pages = [{ page: 5, text: "x" }];
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: o }));
});

test("aux malformed 거부 4종(doc_format·음수·필수 누락·비-list)", () => {
  let a = sampleAuxSignals();
  a.doc_format = "pdf";
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { auxSignals: a }));
  a = sampleAuxSignals();
  a.image_instance_count = -1;
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { auxSignals: a }));
  a = sampleAuxSignals();
  delete a.table_top_level_count;
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { auxSignals: a }));
  a = sampleAuxSignals();
  a.review_required_reason = "not-a-list";
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { auxSignals: a }));
});

// ---- 12h. OCR hash 무결성(presence-only가 아니라 실제 검증) ----------------------------

test("OCR hash 무결성: 정상 artifact PASS", () => {
  const ok = D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: sampleOcrText() });
  assert.ok("ocr_supplement" in ok);
});

test("OCR text 변조(text_sha256 불일치) 거부", () => {
  const tampered = sampleOcrText();
  tampered.pages[0].text = "변조된 OCR 텍스트"; // hash는 그대로
  tampered.output_sha256 = D.canonicalOcrOutputSha256(tampered); // output은 재계산해도
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: tampered }));
});

test("OCR output_sha256 불일치 거부", () => {
  const wrong = sampleOcrText();
  wrong.output_sha256 = "0".repeat(64);
  expectIntakeError(() => D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: wrong }));
});

test("canonical hash key-order 독립 + 재배열 artifact 병합 PASS", () => {
  const base = sampleOcrText();
  const reordered = {};
  for (const k of Object.keys(base).reverse()) reordered[k] = base[k];
  assert.strictEqual(D.canonicalOcrOutputSha256(reordered), D.canonicalOcrOutputSha256(base));
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: reordered });
  assert.ok("ocr_supplement" in dei);
});

test("대문자 hex hash 허용(정규화 비교)", () => {
  const upper = sampleOcrText();
  upper.pages[0].text_sha256 = upper.pages[0].text_sha256.toUpperCase();
  upper.output_sha256 = D.canonicalOcrOutputSha256(upper).toUpperCase();
  const dei = D.buildDeiCandidate(sampleIntake(), "doc-1", "", { ocrText: upper });
  assert.ok("ocr_supplement" in dei);
});

// ---- canonical hash golden (Python 사전 계산값 — runner·Python 스위트와 동일 상수) ------

// tests/test_ocr_canonical_hash_parity.py / tests/test_pdf_ocr_runner.test.cjs와
// 문자 그대로 동일한 fixture·GOLDEN 상수다(3중 결속 — 규칙의 single source는 dei_producer.py).
const F1 = {
  provider: "tesseract.js", provider_version: "7.0.0",
  model: "tessdata_fast kor+eng", model_sha256: "abc",
  no_egress_verified: true, output_sha256: "SHOULD_BE_EXCLUDED",
  pages: [{ page: 1, text: "hello",
    text_sha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" }],
};
const F2 = {
  provider: "p", provider_version: "1", model: "m", model_sha256: "x",
  no_egress_verified: false,
  pages: [
    { page: 3, text: "한글 \"인용\"\n\t줄바꿈과 제어문자", text_sha256: "t",
      confidence: 92, ink_ratio: 0.0345 },
    { page: 7, text: "scope 1 & 2 <emissions>", text_sha256: "u", confidence: 91.5 },
  ],
  langs: ["kor", "eng"], dpi: 300,
};
const F3 = { z_last: [1, 2, { b: 2, a: 1 }], a_first: null,
  nested: { y: true, x: false }, provider: "p", output_sha256: "" };

const GOLDEN = {
  F1: "e3f153d0c0f5d0df77de755531e1e5054170ab13a0dac1ce9d72e8b097e906f6",
  F2: "8859db66eb2309494e6ac6f00ddb4f5e6b0c68d36be4f1853d8d9f6621229a07",
  F3: "7b0be74bfde38d3f5a2bbd7d839a611264f90d8492e5f63ed52577764e1fb199",
};

test("canonical hash: Python golden parity(F1/F2/F3)", () => {
  assert.strictEqual(D.canonicalOcrOutputSha256(F1), GOLDEN.F1);
  assert.strictEqual(D.canonicalOcrOutputSha256(F2), GOLDEN.F2);
  assert.strictEqual(D.canonicalOcrOutputSha256(F3), GOLDEN.F3);
});

test("canonical hash: runner(pdf_ocr_runner.cjs) 구현과 동일값(구현 이중화의 결속)", () => {
  for (const f of [F1, F2, F3, sampleOcrText()]) {
    assert.strictEqual(D.canonicalOcrOutputSha256(f), O.canonicalOcrOutputSha256(f));
  }
});

// ---- 13. document-level 변형 계약(비페이지 포맷) ---------------------------------------

test("document-level: HWP 수용 + pagination/quality_signal 명시 + DEI_VERSION 유지", () => {
  const hdei = D.buildDeiCandidate(sampleHwpIntake(), "hwp-1", "HWP Sample");
  assert.strictEqual(hdei.doc_quality.pagination, "document_level");
  assert.strictEqual(hdei.doc_quality.quality_signal, "not_reported");
  assert.strictEqual(hdei.dei_version, "1");
});

test("paginated 경로 불변(additive 키 부재)", () => {
  const pdq = D.buildDeiCandidate(sampleIntake(), "doc-1").doc_quality;
  assert.ok(!("pagination" in pdq) && !("page_count_basis" in pdq) && !("quality_signal" in pdq));
});

test("document-level: page_count provider 보고값 통과 vs 부재 시 0 + not_reported", () => {
  const hdq = D.buildDeiCandidate(sampleHwpIntake(), "hwp-1").doc_quality;
  assert.strictEqual(hdq.page_count, 1);
  assert.strictEqual(hdq.page_count_basis, "provider_reported");
  const ddq = D.buildDeiCandidate(sampleDocxIntake(), "docx-1").doc_quality;
  assert.strictEqual(ddq.page_count, 0);
  assert.strictEqual(ddq.page_count_basis, "not_reported");
});

test("document-level: p.<n> 미사용 + heading 문서 순서 기반 섹션 추적", () => {
  const hdei = D.buildDeiCandidate(sampleHwpIntake(), "hwp-1");
  assert.ok(hdei.blocks.every((bl) => !bl.location_hint.startsWith("p.")));
  const para = hdei.blocks.find((bl) => bl.block_type === "paragraph");
  const tbl = hdei.blocks.find((bl) => bl.block_type === "table");
  assert.ok(para.location_hint.includes("지속가능경영 개요"));
  assert.ok(tbl.location_hint.includes("온실가스 배출"));
});

test("document-level: 섹션 없으면 doc-level + docLevelHint 형식", () => {
  const ddei = D.buildDeiCandidate(sampleDocxIntake(), "docx-1");
  assert.ok(ddei.blocks.every((bl) => bl.location_hint === "doc-level"));
  assert.strictEqual(D.docLevelHint("거버넌스"), "doc-level · 거버넌스");
  assert.strictEqual(D.docLevelHint(""), "doc-level");
});

test("document-level: 이미지 base64 미유입(파일명 텍스트만)", () => {
  const hdei = D.buildDeiCandidate(sampleHwpIntake(), "hwp-1");
  assert.ok(!JSON.stringify(hdei).includes("Qk12nwAAFAKEBASE64"));
  const img = hdei.blocks.find((bl) => bl.block_type === "image");
  assert.strictEqual(img.text_or_table_md, "image_001.bmp");
});

test("document-level: extraction_quality 보수 상한 medium / PUA·빈 텍스트 low", () => {
  const hdei = D.buildDeiCandidate(sampleHwpIntake(), "hwp-1");
  const para = hdei.blocks.find((bl) => bl.block_type === "paragraph");
  const tbl = hdei.blocks.find((bl) => bl.block_type === "table");
  assert.strictEqual(para.extraction_quality, "medium");
  assert.strictEqual(tbl.extraction_quality, "medium");
  const corrupted = sampleDocxIntake();
  // PUA 3자 + 정상 1자 -> 비율 0.75 > _BAD_RATIO(0.10)
  corrupted.blocks.push({ type: "paragraph", text: "x" });
  corrupted.blocks.push({ type: "image", text: "" });
  const cblocks = D.buildDeiCandidate(corrupted, "docx-2").blocks;
  assert.strictEqual(cblocks[2].extraction_quality, "low");
  assert.strictEqual(cblocks[3].extraction_quality, "low");
});

test("document-level: 품질 신호 부재 hint + judgment 키 부재", () => {
  const hdei = D.buildDeiCandidate(sampleHwpIntake(), "hwp-1");
  assert.ok(hdei.review_priority_hints.some(
    (h) => h.reason === "page_quality_signal_unavailable" && h.priority === "medium"));
  const leaked = [...allKeys(hdei)].filter((k) => JUDGMENT_KEYS.has(k));
  assert.deepStrictEqual(leaked, []);
});

test("document-level: fail-fast 유지(변형이 기존 계약을 느슨하게 하지 않음)", () => {
  // fileType=pdf 또는 fileType 부재 + pageQuality 누락은 여전히 거부(paginated 계약)
  expectIntakeError(() => D.buildDeiCandidate({ ...without("pageQuality"), fileType: "pdf" }, "doc-1"));
  expectIntakeError(() => D.buildDeiCandidate(without("pageQuality"), "doc-1"));
  let hw = sampleHwpIntake();
  hw.blocks = [];
  expectIntakeError(() => D.buildDeiCandidate(hw, "hwp-1"));
  hw = sampleHwpIntake();
  hw.success = false;
  expectIntakeError(() => D.buildDeiCandidate(hw, "hwp-1"));
  hw = sampleHwpIntake();
  delete hw.metadata;
  expectIntakeError(() => D.buildDeiCandidate(hw, "hwp-1"));
  hw = sampleHwpIntake();
  hw.blocks = [{ type: "paragraph", text: "   " }];
  expectIntakeError(() => D.buildDeiCandidate(hw, "hwp-1"));
  // HWP-계열이라도 pageQuality가 존재하면 paginated 계약 적용(신호가 있으면 엄격한 쪽)
  hw = sampleHwpIntake();
  hw.pageQuality = [];
  expectIntakeError(() => D.buildDeiCandidate(hw, "hwp-1"));
});

test("document-level: ocr_text 명시 거부(needsOcr 정합 기준 없음)", () => {
  expectIntakeError(() => D.buildDeiCandidate(sampleHwpIntake(), "hwp-1", "", { ocrText: sampleOcrText() }));
});

test("document-level: aux_signals 병합 + table_count_mismatch hint", () => {
  const aux = sampleAuxSignals();
  aux.table_top_level_count = 27; // intake table 1 vs aux 27 -> mismatch hint
  const hmerged = D.buildDeiCandidate(sampleHwpIntake(), "hwp-1", "", { auxSignals: aux });
  assert.strictEqual(hmerged.aux_structure.table_top_level_count, 27);
  assert.ok(hmerged.review_priority_hints.some((h) => h.reason === "table_count_mismatch"));
});

test("document-level: 결정성", () => {
  const h1 = canon(D.buildDeiCandidate(sampleHwpIntake(), "hwp-1"));
  const h2 = canon(D.buildDeiCandidate(sampleHwpIntake(), "hwp-1"));
  assert.strictEqual(h1, h2);
});

// ---- CLI 계약(내부/디버그 전용 — Python _main과 동일 exit 의미) -------------------------

let tmpRoot = null;
test.before(() => { tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "n3-dei-node-")); });
test.after(() => { if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true }); });

function writeJson(name, obj) {
  const p = path.join(tmpRoot, name);
  fs.writeFileSync(p, JSON.stringify(obj), "utf-8");
  return p;
}

function runCli(args) {
  return spawnSync(process.execPath, [DEI_CJS, ...args],
    { cwd: REPO, encoding: "utf-8", timeout: 60000 });
}

test("CLI: 성공 -> exit 0 + DEI JSON stdout(API 결과와 동일 내용)", () => {
  const p = writeJson("cli_ok.json", sampleIntake());
  const r = runCli([p, "--source-id", "doc-1", "--source-title", "Sample"]);
  assert.strictEqual(r.status, 0, r.stderr);
  const parsed = JSON.parse(r.stdout);
  assert.strictEqual(canon(parsed), canon(D.buildDeiCandidate(sampleIntake(), "doc-1", "Sample")));
  assert.ok(r.stdout.startsWith('{\n  "blocks"'), "sort_keys 직렬화(첫 키 blocks)");
});

test("CLI: --ocr-text/--aux-signals 로드 경로 -> ocr_supplement/aux_structure 합류", () => {
  const p = writeJson("cli_merge.json", sampleIntake());
  const po = writeJson("cli_ocr.json", sampleOcrText());
  const pa = writeJson("cli_aux.json", sampleAuxSignals());
  const r = runCli([p, "--source-id", "doc-1", "--ocr-text", po, "--aux-signals", pa]);
  assert.strictEqual(r.status, 0, r.stderr);
  const parsed = JSON.parse(r.stdout);
  assert.ok(parsed.ocr_supplement && parsed.aux_structure);
});

test("CLI: 결정성(동일 인자 2회 -> stdout 동일)", () => {
  const p = writeJson("cli_det.json", sampleHwpIntake());
  const r1 = runCli([p, "--source-id", "hwp-1"]);
  const r2 = runCli([p, "--source-id", "hwp-1"]);
  assert.strictEqual(r1.status, 0);
  assert.strictEqual(r1.stdout, r2.stdout);
});

test("CLI: IntakeError -> exit 2 + 'IntakeError: ' stderr", () => {
  const p = writeJson("cli_bad.json", { success: false });
  const r = runCli([p, "--source-id", "doc-1"]);
  assert.strictEqual(r.status, 2);
  assert.ok(r.stderr.startsWith("IntakeError: "), r.stderr);
});

test("CLI: --source-id 누락 -> exit 2 / 알 수 없는 옵션 -> exit 2", () => {
  const p = writeJson("cli_args.json", sampleIntake());
  assert.strictEqual(runCli([p]).status, 2);
  assert.strictEqual(runCli([p, "--source-id", "doc-1", "--bogus"]).status, 2);
});

test("CLI: 입력 파일 로드 실패 -> exit 1 + 통제된 안내(stack 미노출)", () => {
  const r = runCli([path.join(tmpRoot, "no_such_file.json"), "--source-id", "doc-1"]);
  assert.strictEqual(r.status, 1);
  assert.ok(r.stderr.includes("읽거나 파싱하지 못했습니다"));
  assert.ok(!r.stderr.includes("at "), "stack trace 미노출");
  assert.ok(!/[A-Za-z]:[\\/]/.test(r.stderr), "로컬 절대경로 미노출");
});
