"use strict";
/* Page-set OCR Runner(pdf_ocr_runner.cjs) 테스트 — node:test 내장 러너(Cycle 2N-4L).
 *
 * 실행: node --test tests/test_pdf_ocr_runner.test.cjs
 *
 * 증명 대상(Gate B ACCEPT WITH CONDITIONS 조건의 코드 반영):
 * - pin/hash 상수(패키지 5종·skia native·traineddata 2종)와 무결성 검증의 fail-fast(조건 2·3).
 * - 승인 분리(설치/실행)·무승인 side-effect 0·두 출처(npm + raw.githubusercontent.com) 고지(조건 4).
 * - selected_pages 계약(needsOcr ∪ ocrCandidatePages, user-range 부분집합 제한, cap 초과 거절).
 * - nethook provenance(요약 실관측+egress 0에만 verified)·evidence 모드 통제 실패(조건 5).
 * - 원자적 ocr_text.json 방출·기존 ingest 계약 형태·additive confidence(조건 8·9).
 * - Node canonical hash의 Python golden parity(상수는 dei_producer.canonical_ocr_output_sha256으로
 *   사전 계산 — tests/test_ocr_canonical_hash_parity.py가 동일 상수를 Python 쪽에서 재검증).
 * - scratch cleanup·raster 파일 미생성(조건 7 — exec는 PNG를 디스크에 쓰지 않음, 소스 검사).
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");

const O = require("../src/intake/runners/pdf_ocr_runner.cjs");
const R = require("../src/intake/runners/hwp_assisted_runner.cjs");

const REPO = path.resolve(__dirname, "..");

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function makeDoc(dir, name) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, "dummy");
  return p;
}

function sha(s) {
  return crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
}

/** paginated intake fixture — needsOcr 페이지를 지정해 생성. */
function makeIntake(dir, needsOcrPages, totalPages = 5, candidates = null) {
  const pageQuality = [];
  for (let p = 1; p <= totalPages; p++) {
    pageQuality.push({ page: p, textChars: needsOcrPages.includes(p) ? 0 : 140,
      puaRatio: 0, replacementCharRatio: 0, needsOcr: needsOcrPages.includes(p) });
  }
  const intake = {
    fileType: "pdf",
    metadata: { pageCount: totalPages },
    blocks: [{ type: "paragraph", text: "본문", pageNumber: 1 }],
    pageQuality,
    qualitySummary: {
      needsOcr: needsOcrPages.length > 0,
      ocrCandidatePages: candidates === null ? needsOcrPages : candidates,
    },
  };
  const p = path.join(dir, "doc.intake.json");
  fs.writeFileSync(p, JSON.stringify(intake), "utf8");
  return p;
}

function mockExec(rc = 0, output = "", onCall = null) {
  const calls = [];
  const fn = (cmd, envExtra) => {
    calls.push({ cmd, envExtra });
    if (onCall) onCall(cmd, envExtra);
    return [rc, output];
  };
  return { calls, fn };
}

const OK_SUMMARY = "[NETHOOK-SUMMARY] mode=block observedTotal=0 egressAttempts=0 workersCreated=2";
const VERIFY_OK = () => ({ ok: true, installed: true, problems: [] });
const VERIFY_MISSING = () => ({ ok: false, installed: false, problems: ["not installed"] });

function mockWhich(name) {
  if (name === "npm") return "C:\\fake\\node\\npm.CMD";
  if (name === "node") return "C:\\fake\\node\\node.exe";
  return null;
}

/** exec mock — run 명령이면 config를 읽어 결과 파일을 기록(성공 시뮬레이션). */
function mockRunExec(pages, rc = 0, output = OK_SUMMARY) {
  return mockExec(rc, output, (cmd) => {
    const configPath = cmd[cmd.length - 1];
    if (!String(configPath).endsWith("exec_config.json")) return;
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (rc === 0) {
      fs.writeFileSync(config.resultPath,
        JSON.stringify({ dpi: config.dpi, pages }), "utf8");
    }
  });
}

async function runMain(argv, opts) {
  const lines = [];
  const errs = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => lines.push(a.join(" "));
  console.error = (...a) => errs.push(a.join(" "));
  let rc;
  let thrown = null;
  try {
    rc = await O.main(argv, opts);
  } catch (e) {
    thrown = e;
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return { rc, out: lines.join("\n"), err: errs.join("\n"), thrown };
}

// ---- 1. pin/hash 상수 (Gate B 조건 2 — evidence 기록값과 일치) ---------------------

test("pin: Gate B가 지정한 5종 exact pin + native/traineddata hash 상수", () => {
  assert.equal(O.OCR_PINS["tesseract.js"], "7.0.0");
  assert.equal(O.OCR_PINS["tesseract.js-core"], "7.0.0");
  assert.equal(O.OCR_PINS["pdfjs-dist"], "4.10.38");
  assert.equal(O.OCR_PINS["@napi-rs/canvas"], "0.1.100");
  assert.equal(O.OCR_PINS["@napi-rs/canvas-win32-x64-msvc"], "0.1.100");
  assert.equal(O.SKIA_NATIVE_SHA256,
    "0f76fb0648fbff832856f6ce202059fc3fa38be7ad925300e96935906ea11132");
  assert.equal(O.TRAINEDDATA.eng.sha256,
    "7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2");
  assert.equal(O.TRAINEDDATA.kor.sha256,
    "6b85e11d9bbf07863b97b3523b1b112844c43e713df8b66418a081fd1060b3b2");
});

test("pin: Kordoc pin과 pdfjs-dist 버전이 일치(기존 결정 계승 확인)", () => {
  assert.equal(O.OCR_PINS["pdfjs-dist"], R.PDFJS_VERSION);
});

// ---- 2. canonical hash — Python golden parity --------------------------------------

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

// 아래 상수는 dei_producer.canonical_ocr_output_sha256(Python)로 사전 계산한 golden 값이다.
// tests/test_ocr_canonical_hash_parity.py가 동일 fixture·동일 상수를 Python 쪽에서 재검증한다.
const GOLDEN = {
  F1: "e3f153d0c0f5d0df77de755531e1e5054170ab13a0dac1ce9d72e8b097e906f6",
  F2: "8859db66eb2309494e6ac6f00ddb4f5e6b0c68d36be4f1853d8d9f6621229a07",
  F3: "7b0be74bfde38d3f5a2bbd7d839a611264f90d8492e5f63ed52577764e1fb199",
};

test("canonical hash: Python golden parity(F1 기본·output_sha256 제외)", () => {
  assert.equal(O.canonicalOcrOutputSha256(F1), GOLDEN.F1);
});

test("canonical hash: Python golden parity(F2 한국어·제어문자·float confidence)", () => {
  assert.equal(O.canonicalOcrOutputSha256(F2), GOLDEN.F2);
});

test("canonical hash: Python golden parity(F3 key 정렬·null·nested)", () => {
  assert.equal(O.canonicalOcrOutputSha256(F3), GOLDEN.F3);
});

test("canonical hash: key 순서 독립(재배열 동일 hash)", () => {
  const shuffled = { pages: F1.pages, no_egress_verified: true, model_sha256: "abc",
    provider_version: "7.0.0", model: "tessdata_fast kor+eng",
    provider: "tesseract.js", output_sha256: "DIFFERENT" };
  assert.equal(O.canonicalOcrOutputSha256(shuffled), GOLDEN.F1);
});

// ---- 3. selected_pages 계약 ---------------------------------------------------------

test("selectPages: mixed — needsOcr ∪ ocrCandidatePages만 선택", () => {
  const intake = { pageQuality: [
    { page: 1, needsOcr: false }, { page: 2, needsOcr: true }, { page: 3, needsOcr: false }],
    qualitySummary: { ocrCandidatePages: [3] } };
  const sel = O.selectPages(intake, null);
  assert.deepEqual(sel.selected, [2, 3]);
});

test("selectPages: scan-only — 전 페이지 needsOcr → all pages", () => {
  const intake = { pageQuality: [1, 2, 3].map((p) => ({ page: p, needsOcr: true })),
    qualitySummary: { ocrCandidatePages: [1, 2, 3] } };
  assert.deepEqual(O.selectPages(intake, null).selected, [1, 2, 3]);
});

test("selectPages: user-range 부분집합 허용 / 밖이면 outside 오류(임의 확대 금지)", () => {
  const intake = { pageQuality: [1, 2, 3, 4].map((p) => ({ page: p, needsOcr: p !== 1 })),
    qualitySummary: { ocrCandidatePages: [] } };
  assert.deepEqual(O.selectPages(intake, "2,4").selected, [2, 4]);
  const bad = O.selectPages(intake, "1-3");
  assert.equal(bad.error, "outside");
  assert.deepEqual(bad.outside, [1]);
});

test("parsePageRange: 형식·경계", () => {
  assert.deepEqual(O.parsePageRange("3,5-7"), [3, 5, 6, 7]);
  assert.equal(O.parsePageRange("0"), null);
  assert.equal(O.parsePageRange("5-3"), null);
  assert.equal(O.parsePageRange("a,b"), null);
});

// ---- 4. verifyOcrRuntime — fail-fast 방향 검증 --------------------------------------

test("verifyOcrRuntime: 미설치/버전 불일치/native hash 불일치/traineddata 불일치 전부 검출", () => {
  const tc = tmpdir("kssb-ocr-tc-");
  assert.equal(O.verifyOcrRuntime(tc).ok, false);
  // 가짜 런타임 구성: 버전은 맞추되 hash가 다른 native/traineddata → mismatch 검출돼야 한다
  const prefix = O.ocrRuntimePrefix(tc);
  for (const [name, ver] of Object.entries(O.OCR_PINS)) {
    const dir = path.join(prefix, "node_modules", ...name.split("/"));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, version: ver }));
  }
  fs.writeFileSync(path.join(prefix, O.SKIA_NATIVE_RELPATH), "fake native");
  fs.mkdirSync(O.traineddataDir(tc), { recursive: true });
  for (const lang of O.OCR_LANGS) {
    fs.writeFileSync(path.join(O.traineddataDir(tc), `${lang}.traineddata`), "fake");
  }
  const v = O.verifyOcrRuntime(tc);
  assert.equal(v.ok, false);
  assert.ok(v.problems.some((p) => p.includes("native binary hash mismatch")));
  assert.ok(v.problems.some((p) => p.includes("traineddata hash mismatch: kor")));
  // 버전 불일치도 검출
  fs.writeFileSync(path.join(prefix, "node_modules", "pdfjs-dist", "package.json"),
    JSON.stringify({ name: "pdfjs-dist", version: "9.9.9" }));
  assert.ok(O.verifyOcrRuntime(tc).problems.some((p) => p.includes("version mismatch: pdfjs-dist")));
});

// ---- 5. 게이트: 무승인 설치/실행 금지 + 두 출처 고지 --------------------------------

test("무플래그(미설치) → 설치 승인 문구(두 출처·SHA-256·저장소 밖) + exit 5, side-effect 0", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1, 2]);
  const tc = path.join(dir, "tc");
  const { calls, fn } = mockExec();
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"), "--tool-cache", tc],
    { which: mockWhich, execFn: fn, fetchFn: async () => { throw new Error("no network in test"); } });
  assert.equal(r.rc, R.EXIT_INSTALL_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes(R.NPM_SOURCE));                       // 출처 1: npm
  assert.ok(r.out.includes(O.TRAINEDDATA_SOURCE_HOST));          // 출처 2: traineddata(분리 고지)
  assert.ok(r.out.includes("SHA-256"));
  assert.ok(r.out.includes("저장소 밖"));
  assert.ok(r.out.includes("no-egress"));
  assert.ok(r.out.includes("--approve-install"));
  assert.ok(r.out.includes("거부해도"));
  assert.ok(!fs.existsSync(tc), "unapproved 경로가 tool-cache를 만들면 안 된다");
});

test("기설치(검증 통과) + 실행 미승인 → exit 6 + bounded 한도·검수 경계 고지, exec 0", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1, 3]);
  const { calls, fn } = mockExec();
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--tool-cache", path.join(dir, "tc")],
    { which: mockWhich, execFn: fn, verifyFn: VERIFY_OK });
  assert.equal(r.rc, R.EXIT_RUN_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("실행 승인이 필요합니다"));
  assert.ok(r.out.includes("2페이지"));
  assert.ok(r.out.includes("페이지 상한"));
  assert.ok(r.out.includes("검수용 보조 재료"));
  assert.ok(r.out.includes("--approve-run"));
});

test("check 모드 → 계획만(대상 페이지·도구 상태), exec 0, exit 0", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [2, 4]);
  const { calls, fn } = mockExec();
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--tool-cache", path.join(dir, "tc"), "--check"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("plan 모드"));
  assert.ok(r.out.includes("[2, 4]"));
  assert.ok(r.out.includes("설치/검증 필요"));
});

// ---- 6. 범위·경계 -------------------------------------------------------------------

test("비-PDF → exit 3 / intake 없음 → exit 3 / malformed --pages → exit 2", async () => {
  const dir = tmpdir("kssb-ocr-");
  const { fn } = mockExec();
  const doc = makeDoc(dir, "doc.hwp");
  let r = await runMain([doc, "--intake", "x.json", "--out-dir", path.join(dir, "out")],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OUT_OF_SCOPE);
  const pdf = makeDoc(dir, "doc.pdf");
  r = await runMain([pdf, "--intake", path.join(dir, "none.json"), "--out-dir", path.join(dir, "out")],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OUT_OF_SCOPE);
  assert.ok(r.out.includes("구조 보강 판독을 먼저"));
  const intake = makeIntake(dir, [1]);
  r = await runMain([pdf, "--intake", intake, "--out-dir", path.join(dir, "out"), "--pages", "x-y"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_USAGE);
});

test("OCR 대상 0페이지 → 정중한 불필요 안내 exit 0(artifact 없음)", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "text.pdf");
  const intake = makeIntake(dir, []);
  const { calls, fn } = mockExec();
  const out = path.join(dir, "out");
  const r = await runMain([doc, "--intake", intake, "--out-dir", out], { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("대상 페이지가 없습니다"));
  assert.ok(!fs.existsSync(path.join(out, "text.ocr_text.json")));
});

test("user-range가 needsOcr 밖 → 정중 거절 exit 3(계약 보호)", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "mixed.pdf");
  const intake = makeIntake(dir, [2, 3]);
  const { fn } = mockExec();
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--pages", "1-3"], { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OUT_OF_SCOPE);
  assert.ok(r.out.includes("대상이 아닌 페이지"));
  assert.ok(r.out.includes("1"));
});

test("page cap 초과 → 정중 거절 exit 3 / --max-pages로 명시 상향 가능", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "big.pdf");
  const pages = Array.from({ length: 60 }, (_, i) => i + 1);
  const intake = makeIntake(dir, pages, 60);
  const { fn } = mockExec();
  let r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out")],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OUT_OF_SCOPE);
  assert.ok(r.out.includes("상한"));
  r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--max-pages", "60", "--tool-cache", path.join(dir, "tc")],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_INSTALL_APPROVAL_REQUIRED); // cap 통과 → 다음 게이트(설치 승인)
});

// ---- 7. 설치 흐름(승인 후) — mock 실측 ----------------------------------------------

test("설치 승인 → npm exec 1회(pin 3종·--omit=optional 없음) + traineddata 실패 시 정리·exit 7", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1]);
  const tc = path.join(dir, "tc");
  const { calls, fn } = mockExec(0, "");
  // fetch가 잘못된 바이트를 주는 상황 — hash mismatch는 fail-fast + prefix 정리
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--tool-cache", tc, "--approve-install"],
    { which: mockWhich, execFn: fn, fetchFn: async () => Buffer.from("wrong bytes") });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.equal(calls.length, 1);
  const cmd = calls[0].cmd;
  assert.equal(cmd[0], "C:\\fake\\node\\npm.CMD");
  assert.ok(cmd.includes(`tesseract.js@${O.OCR_PINS["tesseract.js"]}`));
  assert.ok(cmd.includes(`pdfjs-dist@${O.OCR_PINS["pdfjs-dist"]}`));
  assert.ok(cmd.includes(`@napi-rs/canvas@${O.OCR_PINS["@napi-rs/canvas"]}`));
  assert.ok(!cmd.includes("--omit=optional"), "OCR 경로는 optional(rasterizer)이 필수 — 의도된 차이");
  assert.ok(!cmd.includes("-g") && !cmd.includes("npx"));
  assert.ok(r.out.includes("hash mismatch"));
  assert.ok(!fs.existsSync(O.ocrRuntimePrefix(tc)), "hash mismatch 후 부분 설치가 정리돼야 한다");
  // prep egress에 두 출처가 분리 기록
  const prep = fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8");
  assert.ok(prep.includes(R.NPM_SOURCE));
  assert.ok(prep.includes(O.TRAINEDDATA_SOURCE_HOST));
  assert.ok(prep.includes("failed hash-mismatch"));
});

test("npm 설치 실패(rc≠0) → prefix 정리 + baseline 안내 exit 7", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1]);
  const tc = path.join(dir, "tc");
  const { fn } = mockExec(1, "network error");
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--tool-cache", tc, "--approve-install"],
    { which: mockWhich, execFn: fn, fetchFn: async () => Buffer.from("x") });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("기본 텍스트 기반 검토로 계속"));
  assert.ok(fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8").includes("failed rc=1"));
});

test("설치돼 있으나 무결성 불일치 → 사용 거부·정리 후 재승인 안내(조건 3)", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1]);
  const tc = path.join(dir, "tc");
  const prefix = O.ocrRuntimePrefix(tc);
  fs.mkdirSync(prefix, { recursive: true });
  fs.writeFileSync(path.join(prefix, "junk.txt"), "drifted runtime");
  const { calls, fn } = mockExec();
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--tool-cache", tc], { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_INSTALL_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("일치하지 않아 사용하지 않습니다"));
  assert.ok(!fs.existsSync(prefix), "불일치 런타임은 정리돼야 한다");
});

// ---- 8. 실행 흐름 — 원자적 artifact·provenance·evidence 모드 ------------------------

test("승인 실행(성공) → nethook 명령 구성 + 원자적 ocr_text.json + 계약 형태 + run_log verified", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "지속가능 보고서 (스캔).pdf");
  const intake = makeIntake(dir, [2, 5]);
  const tc = path.join(dir, "tc");
  const out = path.join(dir, "out");
  const { calls, fn } = mockRunExec([
    { page: 5, text: "온실가스 배출량", confidence: 91.234, ink_ratio: 0.041, blank: false },
    { page: 2, text: "", confidence: null, ink_ratio: 0.0001, blank: true },
  ]);
  const before = fs.readdirSync(os.tmpdir()).filter((d) => d.startsWith("kssb-ocr-")).length;
  const r = await runMain([doc, "--intake", intake, "--out-dir", out, "--tool-cache", tc,
    "--approve-run", "--evidence-mode"],
    { which: mockWhich, execFn: fn, verifyFn: VERIFY_OK });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls.length, 1);
  const cmd = calls[0].cmd;
  assert.equal(cmd[0], process.execPath);
  assert.equal(cmd[1], "--require");
  assert.ok(cmd[2].endsWith("nethook.cjs"));
  assert.ok(cmd[3].endsWith("pdf_ocr_exec.mjs"));
  assert.equal(calls[0].envExtra.NETHOOK_MODE, "block");
  // artifact: 계약 형태 + 페이지 정렬 + 실제 text hash + additive confidence + self-consistent output hash
  const artifact = JSON.parse(
    fs.readFileSync(path.join(out, "지속가능 보고서 (스캔).ocr_text.json"), "utf8"));
  assert.equal(artifact.provider, "tesseract.js");
  assert.equal(artifact.provider_version, "7.0.0");
  assert.ok(artifact.model.includes("tessdata_fast"));
  assert.equal(artifact.model_sha256, O.modelSha256());
  assert.equal(artifact.no_egress_verified, true);
  assert.deepEqual(artifact.pages.map((p) => p.page), [2, 5]); // 정렬됨
  assert.equal(artifact.pages[1].text, "온실가스 배출량");
  assert.equal(artifact.pages[1].text_sha256, sha("온실가스 배출량"));
  assert.equal(artifact.pages[1].confidence, 91.23); // additive — 반올림 2자리
  assert.equal(artifact.pages[0].blank_raster, true);
  assert.equal(artifact.output_sha256, O.canonicalOcrOutputSha256(artifact));
  // 임시 파일 잔존 없음(원자적 방출) + scratch 정리
  assert.ok(!fs.readdirSync(out).some((f) => f.includes(".tmp-")));
  const after = fs.readdirSync(os.tmpdir()).filter((d) => d.startsWith("kssb-ocr-")).length;
  assert.ok(after <= before, "scratch가 정리돼야 한다");
  // run_log: OCR provider provenance
  const runLog = fs.readFileSync(path.join(tc, "run_log.jsonl"), "utf8").trim().split("\n");
  const entry = JSON.parse(runLog[runLog.length - 1]);
  assert.equal(entry.provider, "tesseract.js");
  assert.equal(entry.no_egress_verified, true);
  // 완료 안내: 검수 경계 + provider명 미노출(§7)
  const completion = r.out.split("■ 문자 인식 완료")[1] || "";
  assert.ok(!/tesseract/i.test(completion), "provider name leaked in completion output");
  assert.ok(completion.includes("검수용 보조 재료"));
  assert.ok(completion.includes("단독으로 사용되지"));
});

test("evidence 모드 훅 미관측 → 통제된 실패 exit 7 + 정직 로그 + artifact 없음", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1]);
  const tc = path.join(dir, "tc");
  const out = path.join(dir, "out");
  const { fn } = mockRunExec([{ page: 1, text: "x", confidence: 90, ink_ratio: 0.04, blank: false }],
    0, "no hook output");
  const r = await runMain([doc, "--intake", intake, "--out-dir", out, "--tool-cache", tc,
    "--approve-run", "--evidence-mode"],
    { which: mockWhich, execFn: fn, verifyFn: VERIFY_OK });
  assert.equal(r.thrown, null);
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("evidence 모드"));
  assert.ok(!fs.existsSync(path.join(out, "scan.ocr_text.json")));
  const entry = JSON.parse(fs.readFileSync(path.join(tc, "run_log.jsonl"), "utf8").trim().split("\n").pop());
  assert.equal(entry.no_egress_verified, false);
  assert.equal(entry.hook_observed, false);
});

test("blank guard(exec rc=3) → exit 7 + 백지 안내 + artifact 없음(부분 산출물 금지)", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1]);
  const out = path.join(dir, "out");
  const { fn } = mockRunExec([], 3, OK_SUMMARY);
  const r = await runMain([doc, "--intake", intake, "--out-dir", out,
    "--tool-cache", path.join(dir, "tc"), "--approve-run"],
    { which: mockWhich, execFn: fn, verifyFn: VERIFY_OK });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("백지 렌더"));
  assert.ok(r.out.includes("기본 텍스트 기반 검토로 계속"));
  assert.ok(!fs.existsSync(path.join(out, "scan.ocr_text.json")));
});

test("timeout(exec rc=4) → exit 7 + 부분 결과 미방출 안내", async () => {
  const dir = tmpdir("kssb-ocr-");
  const doc = makeDoc(dir, "scan.pdf");
  const intake = makeIntake(dir, [1]);
  const { fn } = mockRunExec([], 4, OK_SUMMARY);
  const r = await runMain([doc, "--intake", intake, "--out-dir", path.join(dir, "out"),
    "--tool-cache", path.join(dir, "tc"), "--approve-run"],
    { which: mockWhich, execFn: fn, verifyFn: VERIFY_OK });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("제한시간"));
  assert.ok(r.out.includes("부분 결과는 남기지 않습니다"));
});

// ---- 9. 산출물이 기존 ingest 페이지 정합과 구조적으로 일치 --------------------------

test("산출 페이지는 항상 allowed 집합의 부분집합(ingest fail-fast와 무충돌 보장)", () => {
  const intake = { pageQuality: [1, 2, 3, 4, 5].map((p) => ({ page: p, needsOcr: p % 2 === 0 })),
    qualitySummary: { ocrCandidatePages: [5] } };
  const sel = O.selectPages(intake, null);
  const allowed = O.allowedOcrPages(intake);
  for (const p of sel.selected) assert.ok(allowed.has(p));
  assert.deepEqual(sel.selected, [2, 4, 5]);
});

// ---- 10. 경계: require/import 표면 --------------------------------------------------

test("경계: runner require는 node: 내장 + 기존 runner 모듈만 / core 미참조", () => {
  const src = fs.readFileSync(
    path.join(REPO, "src", "intake", "runners", "pdf_ocr_runner.cjs"), "utf8");
  for (const banned of ["kssb_findings_validator", "kssb_report_renderer", "kssb_report_delivery"]) {
    assert.ok(!src.includes(banned), banned);
  }
  const requires = [...src.matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(requires.length > 0);
  for (const req of requires) {
    assert.ok(req.startsWith("node:") || req === "./hwp_assisted_runner.cjs",
      `unexpected require: ${req}`);
  }
});

test("경계: exec 스크립트는 raster 이미지를 디스크에 쓰지 않는다(Buffer 직행 — 소스 검사)", () => {
  const src = fs.readFileSync(
    path.join(REPO, "src", "intake", "runners", "pdf_ocr_exec.mjs"), "utf8");
  // 정적 import는 node: 내장만, 런타임 로드는 tool-cache prefix 경유만
  const staticImports = [...src.matchAll(/^import .* from "([^"]+)";$/gm)].map((m) => m[1]);
  for (const im of staticImports) assert.ok(im.startsWith("node:"), `non-builtin import: ${im}`);
  // PNG를 파일로 저장하는 경로가 없어야 한다(scratch 기록은 JSON 체크포인트/결과만)
  assert.ok(!/writeFileSync\([^)]*\.png/i.test(src), "raster PNG must not be written to disk");
  assert.ok(src.includes("canvas.encode"), "buffer-only raster expected");
});

test("경계: repo에 package.json/node_modules 미생성(이 스위트 실행 후)", () => {
  assert.ok(!fs.existsSync(path.join(REPO, "package.json")));
  assert.ok(!fs.existsSync(path.join(REPO, "node_modules")));
});
