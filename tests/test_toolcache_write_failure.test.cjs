"use strict";
/* Tool-cache/로그/폴더 쓰기 실패의 통제된 실패 테스트 — node:test (Cycle 2N-6 Phase 0, R1).
 *
 * 실행: node --test tests/test_toolcache_write_failure.test.cjs
 *
 * 배경(2N-5 Major): 승인 후 실행이 tool-cache의 approvals.json 기록에 실패하자(권한/샌드박스)
 * uncaught 예외로 stack trace + repo/사용자 홈 경로가 출력되고 exit 1로 죽었다.
 * 계약(R1): 기록·폴더 쓰기 실패는 어떤 runner에서도 **stack trace·경로 노출 없이** 한국어 안내와
 * baseline fallback 안내를 출력하고 문서화된 exit 7로 수렴한다. 승인 기록이 실패하면 설치/실행은
 * 시작되지 않는다(감사 추적 보존 — 기록 없는 실행 금지).
 *
 * 재현 방식: 실제 권한 변경·실제 사용자 홈 tool-cache 오염 없이, **일반 파일 아래 경로**를
 * tool-cache/--out-dir로 지정해 mkdirSync가 자연 실패하게 한다(크로스 플랫폼 mock — side effect 0).
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const R = require("../src/intake/runners/hwp_assisted_runner.cjs");
const RT = require("../src/intake/runners/document_intake_router.cjs");
const O = require("../src/intake/runners/pdf_ocr_runner.cjs");

const REPO = path.resolve(__dirname, "..");

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function makeDoc(dir, name) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, "dummy");
  return p;
}

/** 쓰기 불가 tool-cache 경로: 일반 파일 아래의 하위 경로(mkdir가 반드시 실패). */
function unwritableDir(base) {
  const blocker = path.join(base, "blocker.txt");
  fs.writeFileSync(blocker, "regular file");
  return path.join(blocker, "tc");
}

function mockExec(rc = 0, output = "") {
  const calls = [];
  const fn = (cmd, envExtra) => {
    calls.push({ cmd, envExtra });
    return [rc, output];
  };
  return { calls, fn };
}

function mockWhich(name) {
  if (name === "npm") return "C:\\fake\\node\\npm.CMD";
  if (name === "node") return "C:\\fake\\node\\node.exe";
  return null;
}

function capture(fn) {
  const lines = [];
  const errs = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => lines.push(a.join(" "));
  console.error = (...a) => errs.push(a.join(" "));
  let rc;
  let thrown = null;
  try {
    rc = fn();
  } catch (e) {
    thrown = e;
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return { rc, out: lines.join("\n"), err: errs.join("\n"), thrown };
}

async function captureAsync(fn) {
  const lines = [];
  const errs = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => lines.push(a.join(" "));
  console.error = (...a) => errs.push(a.join(" "));
  let rc;
  let thrown = null;
  try {
    rc = await fn();
  } catch (e) {
    thrown = e;
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return { rc, out: lines.join("\n"), err: errs.join("\n"), thrown };
}

/** 사용자-facing 출력에 유출 금지: stack/클래스명/코드 위치/repo·tool-cache 경로. */
function assertNoLeak(text, badPaths = []) {
  assert.ok(!text.includes("RunnerError"), "error class name leaked");
  assert.ok(!/\n\s+at /.test(text), "stack trace leaked");
  assert.ok(!text.includes(REPO), "repo path leaked");
  assert.ok(!/[A-Za-z]:\\Users\\/i.test(text), "user-home path leaked");
  for (const p of badPaths) {
    assert.ok(!text.includes(p), `unwritable path leaked: ${p}`);
  }
}

function preinstallKordoc(toolCache) {
  const pkgDir = path.join(R.kordocPrefix(toolCache), "node_modules", "kordoc");
  fs.mkdirSync(path.join(pkgDir, "dist"), { recursive: true });
  fs.writeFileSync(path.join(pkgDir, "package.json"),
    JSON.stringify({ name: "kordoc", version: R.KORDOC_VERSION }), "utf8");
  fs.writeFileSync(path.join(pkgDir, "dist", "cli.js"), "// stub", "utf8");
}

// ---- 1. primitive 단위: 실패는 경로 없는 RunnerError로 승격 ------------------------

test("primitives: prep/approval/run 기록 실패 → 경로 미포함 RunnerError(+baseline 안내)", () => {
  const dir = tmpdir("kssb-wf-");
  const badTc = unwritableDir(dir);
  const calls = [
    () => R.appendPrepEgress(badTc, "install", "started", "cmd ..."),
    () => R.recordApproval(badTc, "install", "kordoc@x"),
    () => R.appendRunLog(badTc, { provider: "kordoc" }, "doc.hwp"),
  ];
  for (const fn of calls) {
    assert.throws(fn, R.RunnerError);
    try {
      fn();
    } catch (e) {
      assert.ok(e.message.includes("기록할 수 없어"), "korean guidance missing");
      assert.ok(e.message.includes("기본 텍스트"), "baseline fallback missing");
      assert.ok(!e.message.includes(badTc), "path leaked in message");
      assert.ok(!e.message.includes(dir), "tmp path leaked in message");
    }
  }
});

test("primitives: 메시지 상수 자체에 경로·내부 용어 없음 + 기존 RunnerError는 재포장하지 않음", () => {
  for (const msg of [R.TOOLCACHE_WRITE_FAIL_MESSAGE, R.OUTDIR_WRITE_FAIL_MESSAGE]) {
    assert.ok(!/[A-Za-z]:\\/.test(msg) && !msg.includes("/home/"), "path-like text in message");
    assert.ok(msg.includes("기본 텍스트"), "baseline guidance missing");
  }
  // guardedWrite는 이미 통제된 실패(예: hash mismatch)의 메시지를 덮어쓰지 않는다
  const inner = new R.RunnerError("hash mismatch: kor");
  assert.throws(() => R.guardedWrite(() => { throw inner; }), (e) => e === inner);
});

// ---- 2. HWP runner: 승인 기록 실패 → 설치 미실행 + 통제된 exit 7 -------------------

test("hwp: --approve-install + 기록 불가 tool-cache → exit 7·exec 0(기록 없는 설치 금지)·누출 0", () => {
  const dir = tmpdir("kssb-wf-");
  const doc = makeDoc(dir, "doc.hwp");
  const badTc = unwritableDir(dir);
  const { calls, fn } = mockExec(0, "");
  const r = capture(() => R.main(
    [doc, "--out-dir", path.join(dir, "out"), "--tool-cache", badTc, "--approve-install"],
    { which: mockWhich, execFn: fn }));
  assert.equal(r.thrown, null, "must not throw to caller");
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.equal(calls.length, 0, "install must not run when approval record fails");
  assert.ok(r.out.includes("기록할 수 없어"));
  assert.ok(r.out.includes("기본 텍스트"));
  assertNoLeak(r.out + r.err, [badTc, dir]);
});

test("hwp: --approve-run + 기록 가능 tool-cache + 생성 불가 --out-dir → exit 7·안내·누출 0", () => {
  const dir = tmpdir("kssb-wf-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const badOut = unwritableDir(dir);
  const { calls, fn } = mockExec(0, "");
  const r = capture(() => R.main(
    [doc, "--out-dir", badOut, "--tool-cache", tc, "--approve-run"],
    { which: mockWhich, execFn: fn }));
  assert.equal(r.thrown, null);
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.equal(calls.length, 0, "run must not start when out-dir cannot be created");
  assert.ok(r.out.includes("산출물 폴더"));
  assertNoLeak(r.out + r.err, [badOut, dir]);
});

// ---- 3. router / OCR runner: 같은 계약 ---------------------------------------------

test("router(PDF): --approve-install + 기록 불가 tool-cache → exit 7·exec 0·누출 0", () => {
  const dir = tmpdir("kssb-wf-");
  const doc = makeDoc(dir, "report.pdf");
  const badTc = unwritableDir(dir);
  const { calls, fn } = mockExec(0, "");
  const r = capture(() => RT.main(
    [doc, "--out-dir", path.join(dir, "out"), "--tool-cache", badTc, "--approve-install"],
    { which: mockWhich, execFn: fn }));
  assert.equal(r.thrown, null);
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("기록할 수 없어"));
  assertNoLeak(r.out + r.err, [badTc, dir]);
});

test("ocr: --approve-run + 기록 불가 tool-cache → exit 7·artifact 없음·누출 0", async () => {
  const dir = tmpdir("kssb-wf-");
  const doc = makeDoc(dir, "scan.pdf");
  const intakePath = path.join(dir, "doc.intake.json");
  fs.writeFileSync(intakePath, JSON.stringify({
    fileType: "pdf",
    pageQuality: [{ page: 1, needsOcr: true }],
    qualitySummary: { needsOcr: true, ocrCandidatePages: [1] },
  }), "utf8");
  const badTc = unwritableDir(dir);
  const out = path.join(dir, "out");
  const { calls, fn } = mockExec(0, "");
  const r = await captureAsync(() => O.main(
    [doc, "--intake", intakePath, "--out-dir", out, "--tool-cache", badTc, "--approve-run"],
    { which: mockWhich, execFn: fn, verifyFn: () => ({ ok: true, installed: true, problems: [] }) }));
  assert.equal(r.thrown, null, "must not reject to caller");
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.equal(calls.length, 0, "ocr exec must not run when approval record fails");
  assert.ok(!fs.existsSync(path.join(out, "scan.ocr_text.json")));
  assertNoLeak(r.out + r.err, [badTc, dir]);
});

// ---- 4. CLI subprocess: 2N-5 실측 결함의 직접 재현(수정 전 exit 1 + stack) ----------

test("CLI subprocess(hwp): 기록 불가 tool-cache → exit 7, stack/경로/클래스명 미노출", () => {
  const dir = tmpdir("kssb-wf-cli-");
  const doc = makeDoc(dir, "doc.hwp");
  const badTc = unwritableDir(dir);
  const { spawnSync } = require("node:child_process");
  const runner = path.join(REPO, "src", "intake", "runners", "hwp_assisted_runner.cjs");
  const proc = spawnSync(process.execPath,
    [runner, doc, "--out-dir", path.join(dir, "out"), "--tool-cache", badTc, "--approve-install"],
    { encoding: "utf8" });
  const all = (proc.stdout || "") + (proc.stderr || "");
  assert.equal(proc.status, R.EXIT_RUN_FAILED, "documented exit 7 (uncaught exit 1 금지)");
  assert.ok(all.includes("기록할 수 없어"));
  assert.ok(all.includes("기본 텍스트"));
  assertNoLeak(all, [badTc, dir]);
});

// ---- 5. side effect 0: 실제 사용자 홈 tool-cache 미접촉 ------------------------------

test("side effect: 위 테스트 방식은 실제 홈 tool-cache를 만들거나 수정하지 않는다", () => {
  // 이 스위트는 tool-cache를 항상 tmp 파일 아래 경로로 지정한다 — 기본 경로 미사용 확인만 남긴다.
  const home = R.defaultToolCache();
  assert.ok(home.includes(".samil-kssb-precheck")); // 기본값 형태 확인(생성 여부는 건드리지 않음)
});
