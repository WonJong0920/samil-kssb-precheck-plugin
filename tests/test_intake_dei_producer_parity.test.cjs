"use strict";
/**
 * Node ↔ Python DEI producer parity 테스트 (2N-6 Phase 2 N3).
 *
 * dei_producer.py(reference — 무변경)를 기준으로, 동일 합성 fixture를 파일로 쓰고
 * 양쪽 CLI를 실행해 대조한다:
 * - 성공 케이스: exit 0 + **stdout 전문 일치**(개행 정규화 CRLF↔LF만 — DEI 출력 도메인이
 *   str/int/bool뿐이라 byte parity 가능. json.dumps(sort_keys, indent=2, ensure_ascii=False) 동등).
 * - 거부 케이스: exit 2 + **IntakeError stderr 메시지 전문 일치**.
 * - 인자 오류: 양쪽 exit 2(메시지는 argparse/자체 파서로 상이 — exit만 대조, 문서화된 차이).
 *
 * Python 미탐지 시 해당 테스트는 명시적 skip(사유 출력 — 개발기 reference 대조용).
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
const DEI_PY = path.join(REPO, "src", "intake", "dei_producer.py");
const D = require(DEI_CJS);

const PY_ENV = { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" };

function findPython() {
  const candidates = [];
  if (process.env.SAMIL_PARITY_PY) candidates.push(process.env.SAMIL_PARITY_PY);
  if (process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, "Python", "pythoncore-3.14-64", "python.exe"));
    candidates.push(path.join(process.env.LOCALAPPDATA, "Python", "pythoncore-3.13-64", "python.exe"));
  }
  candidates.push("python3", "python");
  for (const c of candidates) {
    try {
      const r = spawnSync(c, ["--version"], { encoding: "utf-8", timeout: 15000 });
      if (r.status === 0 && `${r.stdout}${r.stderr}`.includes("Python 3")) return c;
    } catch { /* 다음 후보 */ }
  }
  return null;
}

const PY = findPython();

function sha(text) {
  return crypto.createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
}

// ---- 합성 fixture(Python/Node 스위트와 동일 형태) --------------------------------------

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
      { type: "heading", text: "거버넌스", pageNumber: 2, bbox: { page: 2, x: 37, y: 627 } },
      { type: "paragraph", text: "기후 관련 위험 및 기회에 관한 관리·감독 기구를 둔다.",
        pageNumber: 2, bbox: { page: 2, x: 37, y: 600 } },
      { type: "table", table: { rows: 2, cols: 2,
        cells: [[{ text: "지표" }, { text: "값" }], [{ text: "배출량" }, { text: "100" }]] },
        pageNumber: 3, bbox: { page: 3, x: 10, y: 20 } },
    ],
    warnings: [{ page: 4, message: "1개 이미지 영역 텍스트 없음", code: "SKIPPED_IMAGE" }],
    pageQuality: [
      { page: 2, textChars: 300, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 3, textChars: 250, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 4, textChars: 10, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 5, textChars: 5, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: true },
    ],
    qualitySummary: { needsOcr: false, ocrCandidatePages: [5] },
  };
}

function scannedIntake() {
  return {
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
}

// 혼합 변형 — fallback 경로 심층 parity(비-dict 블록·type 누락/비허용·code 없는 warning·
// message fallback·block_id 기본값·table 셀 결손·빈 outline text).
function mixedFallbackIntake() {
  return {
    success: true,
    fileType: "pdf",
    metadata: { pageCount: 4 },
    outline: [
      { level: 1, text: "", pageNumber: 1 },
      { level: 1, text: "섹션A", pageNumber: 2 },
    ],
    blocks: [
      "stray-entry",
      { text: "type 없는 블록", pageNumber: 2 },
      { type: "chart", text: "허용 밖 type", pageNumber: 3 },
      { type: "unknown", pageNumber: 3,
        table: { cells: [[{ text: "a\nb" }, null], "notalist", [[], { text: " c " }]] } },
      { type: "paragraph" },
      { type: "image", text: "img.png", pageNumber: 4, block_id: "explicit-id" },
    ],
    warnings: [
      { page: 2, message: "메시지만 있음" },
      { page: 3, code: "" },
      { code: "NO_PAGE_CODE" },
      { page: 4, code: "SKIPPED_IMAGE" },
    ],
    pageQuality: [
      { page: 2, textChars: 250, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 3, textChars: 40, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
      { page: 4, textChars: 10, puaRatio: 0.0, replacementCharRatio: 0.0, needsOcr: false },
    ],
    qualitySummary: { needsOcr: false, ocrCandidatePages: [] },
  };
}

function sampleOcrText() {
  const text = "스캔 페이지 OCR 텍스트";
  const ocr = {
    provider: "tesseract.js",
    provider_version: "7.0.0",
    model: "tessdata_fast kor+eng",
    model_sha256: "6b85e11d9bbf0786",
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
    review_required_reason: ["heading_styles_defined_but_unused", "another_reason"],
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

// ---- 실행 헬퍼 -------------------------------------------------------------------------

let tmpRoot = null;
let seq = 0;
test.before(() => { tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "n3-dei-parity-")); });
test.after(() => { if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true }); });

function writeJson(obj) {
  seq += 1;
  const p = path.join(tmpRoot, `f${seq}.json`);
  fs.writeFileSync(p, JSON.stringify(obj), "utf-8");
  return p;
}

function runBoth(cliArgs) {
  const rp = spawnSync(PY, [DEI_PY, ...cliArgs],
    { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 120000 });
  const rn = spawnSync(process.execPath, [DEI_CJS, ...cliArgs],
    { cwd: REPO, encoding: "utf-8", timeout: 120000 });
  return { rp, rn };
}

function buildArgs({ intake, sourceId = "doc-1", sourceTitle = null, ocr = null, aux = null }) {
  const args = [writeJson(intake), "--source-id", sourceId];
  if (sourceTitle !== null) args.push("--source-title", sourceTitle);
  if (ocr !== null) args.push("--ocr-text", writeJson(ocr));
  if (aux !== null) args.push("--aux-signals", writeJson(aux));
  return args;
}

function assertSuccessParity(spec) {
  const { rp, rn } = runBoth(buildArgs(spec));
  assert.strictEqual(rp.status, 0, `Python exit != 0: ${rp.stderr}`);
  assert.strictEqual(rn.status, 0, `Node exit != 0: ${rn.stderr}`);
  assert.strictEqual(norm(rn.stdout), norm(rp.stdout), "DEI stdout 전문 불일치");
}

function assertRejectParity(spec) {
  const { rp, rn } = runBoth(buildArgs(spec));
  assert.strictEqual(rp.status, 2, `Python exit != 2: ${rp.stdout}${rp.stderr}`);
  assert.strictEqual(rn.status, 2, `Node exit != 2: ${rn.stdout}${rn.stderr}`);
  assert.strictEqual(norm(rn.stderr), norm(rp.stderr), "IntakeError stderr 전문 불일치");
  assert.ok(norm(rp.stderr).startsWith("IntakeError: "));
}

// ---- 전제 ------------------------------------------------------------------------------

test("전제: Python reference 실행 파일 존재", (t) => {
  if (!PY) { t.skip("Python 3 미탐지(SAMIL_PARITY_PY로 지정 가능)"); return; }
  assert.ok(PY);
});

// ---- 성공 케이스: stdout 전문 parity ----------------------------------------------------

const SUCCESS_CASES = [
  ["paginated 기본(sample)", () => ({ intake: sampleIntake(), sourceTitle: "Sample" })],
  ["paginated + ocr_text + aux_signals 병합", () => ({
    intake: sampleIntake(), sourceTitle: "Sample", ocr: sampleOcrText(), aux: sampleAuxSignals() })],
  ["스캔 전용(blocks=[] 근거 빈약)", () => ({ intake: scannedIntake(), sourceId: "scan-1" })],
  ["혼합 변형(fallback 경로 심층)", () => ({ intake: mixedFallbackIntake(), sourceId: "mix-1" })],
  ["document-level HWP", () => ({ intake: sampleHwpIntake(), sourceId: "hwp-1", sourceTitle: "HWP Sample" })],
  ["document-level DOCX(pageCount 부재)", () => ({ intake: sampleDocxIntake(), sourceId: "docx-1" })],
  ["document-level DOCX + PUA/빈 텍스트 블록", () => {
    const corrupted = sampleDocxIntake();
    corrupted.blocks.push({ type: "paragraph", text: "x" });
    corrupted.blocks.push({ type: "image", text: "" });
    return { intake: corrupted, sourceId: "docx-2" };
  }],
  ["document-level HWP + aux_signals(table mismatch)", () => {
    const aux = sampleAuxSignals();
    aux.table_top_level_count = 27;
    return { intake: sampleHwpIntake(), sourceId: "hwp-1", aux };
  }],
  ["비-ASCII·특수문자 source-title escape", () => ({
    intake: sampleIntake(), sourceTitle: '샘플 "보고서" & <데이터>\\경로아님' })],
  ["OCR 대문자 hex + key 재배열 artifact 수용", () => {
    const upper = sampleOcrText();
    upper.pages[0].text_sha256 = upper.pages[0].text_sha256.toUpperCase();
    upper.output_sha256 = D.canonicalOcrOutputSha256(upper).toUpperCase();
    const reordered = {};
    for (const k of Object.keys(upper).reverse()) reordered[k] = upper[k];
    return { intake: sampleIntake(), ocr: reordered };
  }],
];

for (const [name, build] of SUCCESS_CASES) {
  test(`성공 parity: ${name}`, (t) => {
    if (!PY) { t.skip("Python 미탐지 — skip"); return; }
    assertSuccessParity(build());
  });
}

test("성공 parity: Node CLI 결정성(동일 인자 2회 stdout 동일)", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const args = buildArgs({ intake: sampleIntake(), sourceTitle: "Sample" });
  const r1 = spawnSync(process.execPath, [DEI_CJS, ...args], { cwd: REPO, encoding: "utf-8", timeout: 120000 });
  const r2 = spawnSync(process.execPath, [DEI_CJS, ...args], { cwd: REPO, encoding: "utf-8", timeout: 120000 });
  assert.strictEqual(r1.status, 0);
  assert.strictEqual(r1.stdout, r2.stdout);
});

// ---- 거부 케이스: exit 2 + IntakeError 메시지 전문 parity -------------------------------

function without(key) {
  const s = sampleIntake();
  delete s[key];
  return s;
}

const REJECT_CASES = [
  ["success=false", () => ({ intake: { success: false } })],
  ["빈 객체 {}", () => ({ intake: {} })],
  ["success 비-true(문자열)", () => ({ intake: { ...sampleIntake(), success: "true" } })],
  ["metadata 누락", () => ({ intake: without("metadata") })],
  ["pageCount<1", () => ({ intake: { ...sampleIntake(), metadata: { pageCount: 0 } } })],
  ["pageCount 비-int(문자열)", () => ({ intake: { ...sampleIntake(), metadata: { pageCount: "5" } } })],
  ["blocks 비-list", () => ({ intake: { ...sampleIntake(), blocks: {} } })],
  ["pageQuality 누락", () => ({ intake: without("pageQuality") })],
  ["pageQuality 빈 list", () => ({ intake: { ...sampleIntake(), pageQuality: [] } })],
  ["qualitySummary 누락", () => ({ intake: without("qualitySummary") })],
  ["outline 비-list(존재 시)", () => ({ intake: { ...sampleIntake(), outline: {} } })],
  ["warnings 비-list(존재 시)", () => ({ intake: { ...sampleIntake(), warnings: {} } })],
  ["source_id 빈 문자열", () => ({ intake: sampleIntake(), sourceId: "" })],
  ["source_id 공백만", () => ({ intake: sampleIntake(), sourceId: "   " })],
  ["document-level: 빈 blocks", () => {
    const hw = sampleHwpIntake(); hw.blocks = []; return { intake: hw, sourceId: "hwp-1" };
  }],
  ["document-level: 내용 없는 blocks", () => {
    const hw = sampleHwpIntake(); hw.blocks = [{ type: "paragraph", text: "   " }];
    return { intake: hw, sourceId: "hwp-1" };
  }],
  ["document-level: metadata 누락", () => {
    const hw = sampleHwpIntake(); delete hw.metadata; return { intake: hw, sourceId: "hwp-1" };
  }],
  ["document-level: success=false", () => {
    const hw = sampleHwpIntake(); hw.success = false; return { intake: hw, sourceId: "hwp-1" };
  }],
  ["document-level: pageQuality 존재 시 paginated 계약(빈 list 거부)", () => {
    const hw = sampleHwpIntake(); hw.pageQuality = []; return { intake: hw, sourceId: "hwp-1" };
  }],
  ["document-level: ocr_text 명시 거부", () => ({
    intake: sampleHwpIntake(), sourceId: "hwp-1", ocr: sampleOcrText() })],
  ["OCR 페이지 불일치(needsOcr 밖 page 2)", () => {
    const bad = sampleOcrText();
    bad.pages = [{ page: 2, text: "x", text_sha256: sha("x") }];
    bad.output_sha256 = D.canonicalOcrOutputSha256(bad);
    return { intake: sampleIntake(), ocr: bad };
  }],
  ["OCR provider 누락", () => {
    const o = sampleOcrText(); delete o.provider; return { intake: sampleIntake(), ocr: o };
  }],
  ["OCR model_sha256 누락", () => {
    const o = sampleOcrText(); delete o.model_sha256; return { intake: sampleIntake(), ocr: o };
  }],
  ["OCR output_sha256 누락", () => {
    const o = sampleOcrText(); delete o.output_sha256; return { intake: sampleIntake(), ocr: o };
  }],
  ["OCR no_egress_verified 비-bool", () => {
    const o = sampleOcrText(); o.no_egress_verified = "yes"; return { intake: sampleIntake(), ocr: o };
  }],
  ["OCR pages 빈 list", () => {
    const o = sampleOcrText(); o.pages = []; return { intake: sampleIntake(), ocr: o };
  }],
  ["OCR page text_sha256 누락", () => {
    const o = sampleOcrText(); o.pages = [{ page: 5, text: "x" }];
    return { intake: sampleIntake(), ocr: o };
  }],
  ["OCR text 변조(text_sha256 불일치)", () => {
    const o = sampleOcrText();
    o.pages[0].text = "변조된 OCR 텍스트";
    o.output_sha256 = D.canonicalOcrOutputSha256(o);
    return { intake: sampleIntake(), ocr: o };
  }],
  ["OCR output_sha256 불일치", () => {
    const o = sampleOcrText(); o.output_sha256 = "0".repeat(64);
    return { intake: sampleIntake(), ocr: o };
  }],
  ["aux doc_format 비허용(pdf)", () => {
    const a = sampleAuxSignals(); a.doc_format = "pdf"; return { intake: sampleIntake(), aux: a };
  }],
  ["aux 음수 카운트", () => {
    const a = sampleAuxSignals(); a.image_instance_count = -1;
    return { intake: sampleIntake(), aux: a };
  }],
  ["aux 필수 카운트 누락", () => {
    const a = sampleAuxSignals(); delete a.table_top_level_count;
    return { intake: sampleIntake(), aux: a };
  }],
  ["aux review_required_reason 비-list", () => {
    const a = sampleAuxSignals(); a.review_required_reason = "not-a-list";
    return { intake: sampleIntake(), aux: a };
  }],
];

for (const [name, build] of REJECT_CASES) {
  test(`거부 parity: ${name}`, (t) => {
    if (!PY) { t.skip("Python 미탐지 — skip"); return; }
    assertRejectParity(build());
  });
}

// ---- 인자 오류: exit 2 동등(메시지는 argparse/자체 파서 상이 — 문서화된 차이) --------------

test("인자 오류 parity: --source-id 누락 -> 양쪽 exit 2", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const p = writeJson(sampleIntake());
  const { rp, rn } = runBoth([p]);
  assert.strictEqual(rp.status, 2);
  assert.strictEqual(rn.status, 2);
});
