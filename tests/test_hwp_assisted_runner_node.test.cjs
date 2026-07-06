"use strict";
/* Node runner(hwp_assisted_runner.cjs) 테스트 — node:test 내장 러너(외부 의존성 0, Cycle 2N-4D).
 *
 * 실행: node --test tests/test_hwp_assisted_runner_node.test.cjs
 * (Codex 환경에서 Node로 직접 실행 가능 — Python 불가 환경의 검증 공백 축소가 목적)
 *
 * 증명 대상(Python runner 테스트와 parity):
 * - 무승인 설치/실행 금지(승인 플래그 없으면 exec 호출 0 + 한국어 승인 문구 + 상태 코드).
 * - 설치↔실행 승인 분리(U3), check 모드 무실행, builder pin/--omit=optional/global·npx 부재.
 * - provenance 정책(요약 실관측+egress 0에만 no_egress_verified=true, evidence 모드 실패).
 * - Windows npm 해석(PATHEXT — npm.cmd 선택, npm.ps1 배제), 한국어/공백/괄호 파일명.
 * - Python runner와의 상수 parity(버전 pin·exit code·artifact 규약 — .py 소스 텍스트 대조).
 * - v1 차이: aux_signals 미생성. 완료 안내에 provider명 미노출(§7).
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const R = require("../src/intake/runners/hwp_assisted_runner.cjs");

const REPO = path.resolve(__dirname, "..");
const PY_SRC = fs.readFileSync(
  path.join(REPO, "src", "intake", "runners", "hwp_assisted_runner.py"), "utf8");

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function makeDoc(dir, name) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, "dummy");
  return p;
}

/** exec 호출을 기록하는 mock. 반환값은 [rc, output]. */
function mockExec(rc = 0, output = "") {
  const calls = [];
  const fn = (cmd, envExtra) => {
    calls.push({ cmd, envExtra });
    return [rc, output];
  };
  return { calls, fn };
}

const OK_SUMMARY = "[NETHOOK-SUMMARY] mode=block observedTotal=3 egressAttempts=0 workersCreated=0";

function mockWhich(name) {
  if (name === "npm") return "C:\\fake\\node\\npm.CMD";
  if (name === "node") return "C:\\fake\\node\\node.exe";
  return null;
}

/** console.log/console.error 캡처 하에 main 실행. */
function runMain(argv, opts) {
  const lines = [];
  const errs = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => lines.push(a.join(" "));
  console.error = (...a) => errs.push(a.join(" "));
  let rc;
  let thrown = null;
  try {
    rc = R.main(argv, opts);
  } catch (e) {
    thrown = e;
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return { rc, out: lines.join("\n"), err: errs.join("\n"), thrown };
}

function preinstallKordoc(toolCache) {
  const pkgDir = path.join(R.kordocPrefix(toolCache), "node_modules", "kordoc");
  fs.mkdirSync(path.join(pkgDir, "dist"), { recursive: true });
  fs.writeFileSync(path.join(pkgDir, "package.json"),
    JSON.stringify({ name: "kordoc", version: R.KORDOC_VERSION }), "utf8");
  fs.writeFileSync(path.join(pkgDir, "dist", "cli.js"), "// stub", "utf8");
}

// ---- 1. Python runner와의 상수 parity (소스 텍스트 대조 — Python 실행 불필요) ----

test("parity: KORDOC/PDFJS 버전 pin이 Python runner와 동일", () => {
  assert.equal(PY_SRC.match(/KORDOC_VERSION = "([^"]+)"/)[1], R.KORDOC_VERSION);
  assert.equal(PY_SRC.match(/PDFJS_VERSION = "([^"]+)"/)[1], R.PDFJS_VERSION);
});

test("parity: exit code가 Python runner와 동일", () => {
  for (const [name, val] of [
    ["EXIT_OUT_OF_SCOPE", R.EXIT_OUT_OF_SCOPE],
    ["EXIT_NODE_MISSING", R.EXIT_NODE_MISSING],
    ["EXIT_INSTALL_APPROVAL_REQUIRED", R.EXIT_INSTALL_APPROVAL_REQUIRED],
    ["EXIT_RUN_APPROVAL_REQUIRED", R.EXIT_RUN_APPROVAL_REQUIRED],
    ["EXIT_RUN_FAILED", R.EXIT_RUN_FAILED],
  ]) {
    const m = PY_SRC.match(new RegExp(`${name} = (\\d+)`));
    assert.ok(m, `${name} not found in .py`);
    assert.equal(parseInt(m[1], 10), val, name);
  }
});

test("parity: nethook 요약 정규식 핵심(egressAttempts 캡처)이 양쪽 소스에 존재", () => {
  assert.ok(PY_SRC.includes("egressAttempts=(\\d+)"));
  assert.ok(R.NETHOOK_SUMMARY_RE.source.includes("egressAttempts=(\\d+)"));
});

test("parity: artifact 규약(.intake.json)과 확장자 집합이 동일", () => {
  assert.ok(PY_SRC.includes('.intake.json'));
  for (const ext of [".hwp", ".hwpx", ".docx"]) {
    assert.ok(R.SUPPORTED_EXTENSIONS.has(ext), ext);
    assert.ok(PY_SRC.includes(`"${ext}"`), `${ext} in .py`);
  }
});

// ---- 2. 게이트: 무승인 설치/실행 금지 -------------------------------------------

test("범위 밖 확장자 → exit 3, exec 호출 0", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.pdf");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out")], { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OUT_OF_SCOPE);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("범위 밖"));
});

test("out-dir 누락 → usage exit 2", () => {
  const r = runMain(["x.hwp"], { which: mockWhich, execFn: mockExec().fn });
  assert.equal(r.rc, R.EXIT_USAGE);
  assert.ok(r.err.includes("사용법"));
});

test("알 수 없는 플래그 → usage exit 2", () => {
  const r = runMain(["x.hwp", "--out-dir", "o", "--bogus"], { which: mockWhich, execFn: mockExec().fn });
  assert.equal(r.rc, R.EXIT_USAGE);
});

test("npm 부재 → exit 4 + 안내, exec 호출 0", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", path.join(dir, "tc")],
    { which: () => null, execFn: fn });
  assert.equal(r.rc, R.EXIT_NODE_MISSING);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("Node.js/npm이 확인되지 않았습니다"));
  assert.ok(r.out.includes("nodejs.org"));
});

test("무플래그(설치 필요) → 설치 승인 문구 + exit 5, exec 호출 0", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_INSTALL_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  // U5: 승인 대화에는 provider명·버전·위치·경계 고지 명시
  assert.ok(r.out.includes("Kordoc " + R.KORDOC_VERSION));
  assert.ok(r.out.includes(R.NPM_SOURCE));
  assert.ok(r.out.includes("저장소 밖"));
  assert.ok(r.out.includes("no-egress"));
  assert.ok(r.out.includes("--approve-install"));
});

test("check 모드 → 계획 표시만, exec 호출 0, exit 0", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", path.join(dir, "tc"), "--check"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("plan 모드"));
  assert.ok(r.out.includes("--omit=optional"));
  assert.ok(r.out.includes("--approve-run"));
});

test("설치 승인만 → 설치 exec 1회 후 실행 승인 대기 exit 6 (U3 분리)", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  const { calls, fn } = mockExec(0, "");
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-install"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_APPROVAL_REQUIRED);
  assert.equal(calls.length, 1); // 설치만 — 실행 exec 없음
  const cmd = calls[0].cmd;
  assert.equal(cmd[0], "C:\\fake\\node\\npm.CMD"); // 탐지된 npm 경로 사용(AVR-04)
  assert.ok(cmd.includes("--omit=optional"));
  assert.ok(cmd.includes("--prefix"));
  assert.ok(cmd.includes(`kordoc@${R.KORDOC_VERSION}`));
  assert.ok(cmd.includes(`pdfjs-dist@${R.PDFJS_VERSION}`));
  assert.ok(!cmd.includes("-g") && !cmd.includes("npx"));
  // marker/로그 생성 확인
  const approvals = JSON.parse(fs.readFileSync(path.join(tc, "approvals.json"), "utf8"));
  assert.ok(approvals.install[`kordoc@${R.KORDOC_VERSION}`]);
  const prep = fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8").trim().split("\n");
  assert.equal(prep.length, 2);
  const started = JSON.parse(prep[0]);
  const ok = JSON.parse(prep[1]);
  assert.equal(started.status, "started");
  assert.equal(ok.status, "ok");
  assert.equal(started.provider, "kordoc");
  assert.equal(started.source, R.NPM_SOURCE);
  assert.match(started.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
});

test("설치 실패(rc≠0) → exit 7 + prep log에 failed 기록", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  const { fn } = mockExec(1, "network error");
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-install"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  const prep = fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8");
  assert.ok(prep.includes("failed rc=1"));
});

test("기설치 상태 + 실행 미승인 → exit 6, exec 호출 0", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("실행 승인이 필요합니다"));
});

// ---- 3. 실행·provenance ---------------------------------------------------------

test("승인 실행(성공) → run 명령 훅 구성 + provenance true + run_log + exit 0", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { calls, fn } = mockExec(0, OK_SUMMARY);
  const out = path.join(dir, "out");
  const r = runMain([doc, "--out-dir", out, "--tool-cache", tc, "--approve-run", "--evidence-mode"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls.length, 1);
  const cmd = calls[0].cmd;
  assert.equal(cmd[0], "C:\\fake\\node\\node.exe");
  assert.equal(cmd[1], "--require");
  assert.ok(cmd[2].endsWith("nethook.cjs"));
  assert.ok(cmd[3].endsWith(path.join("kordoc", "dist", "cli.js")));
  assert.ok(cmd.includes("--format") && cmd.includes("json") && cmd.includes("--silent"));
  assert.equal(calls[0].envExtra.NETHOOK_MODE, "block");
  const runLog = fs.readFileSync(path.join(tc, "run_log.jsonl"), "utf8").trim().split("\n");
  const entry = JSON.parse(runLog[runLog.length - 1]);
  assert.equal(entry.no_egress_verified, true);
  assert.equal(entry.hook_observed, true);
  assert.equal(entry.egress_attempts, 0);
});

test("완료 안내에 provider명 미노출(§7) + intake 파일명 안내", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { fn } = mockExec(0, OK_SUMMARY);
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-run"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  const completion = r.out.split("■ 판독 완료")[1] || "";
  assert.ok(!/kordoc/i.test(completion), "provider name leaked in completion output");
  assert.ok(completion.includes("doc.intake.json"));
  assert.ok(completion.includes("컨설턴트 검수"));
});

test("provenance 4상태(AVR-04 정책 유지)", () => {
  const p1 = R.buildRunProvenance(OK_SUMMARY);
  assert.equal(p1.no_egress_verified, true);
  const p2 = R.buildRunProvenance("[NETHOOK-SUMMARY] mode=block observedTotal=5 egressAttempts=2 workersCreated=0");
  assert.equal(p2.no_egress_verified, false);
  assert.equal(p2.egress_attempts, 2);
  const p3 = R.buildRunProvenance("no summary at all");
  assert.equal(p3.hook_observed, false);
  assert.equal(p3.no_egress_verified, false);
  assert.throws(() => R.buildRunProvenance("no summary", true), R.RunnerError);
});

test("evidence 모드 훅 미관측 → 통제된 실패 exit 7 + 정직한 로그(성공 위장·stack 노출 금지, C2N4D-MAJ-01)", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { fn } = mockExec(0, "no hook output");
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-run", "--evidence-mode"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.thrown, null); // 더 이상 예외가 CLI로 새지 않는다
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("evidence 모드"));
  assert.ok(r.out.includes("기본 텍스트 기반 검토로 계속하십시오"));
  // 정직한 provenance가 run_log에 남는다(no_egress_verified=false)
  const runLog = fs.readFileSync(path.join(tc, "run_log.jsonl"), "utf8").trim().split("\n");
  const entry = JSON.parse(runLog[runLog.length - 1]);
  assert.equal(entry.no_egress_verified, false);
  assert.equal(entry.hook_observed, false);
});

test("CLI subprocess: evidence 모드 실패 → exit 7, stack/로컬 경로 미노출 (C2N4D-MAJ-01)", () => {
  const dir = tmpdir("kssb-node-cli-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  // fake cli.js: nethook(block)이 차단하는 원격 DNS 시도 — 원본 호출 전 throw라 외부 트래픽 0.
  // 요약에 egressAttempts>=1이 찍혀 evidence 모드가 실패해야 하는 케이스.
  fs.writeFileSync(
    path.join(R.kordocPrefix(tc), "node_modules", "kordoc", "dist", "cli.js"),
    'try { require("node:dns").lookup("blocked.invalid", () => {}); } catch (e) {}\n',
    "utf8");
  const { spawnSync } = require("node:child_process");
  const runner = path.join(REPO, "src", "intake", "runners", "hwp_assisted_runner.cjs");
  const proc = spawnSync(process.execPath,
    [runner, doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc,
      "--approve-run", "--evidence-mode"],
    { encoding: "utf8" });
  const all = (proc.stdout || "") + (proc.stderr || "");
  assert.equal(proc.status, R.EXIT_RUN_FAILED); // 문서화된 7 — uncaught exit 1 아님
  assert.ok(all.includes("evidence 모드"));
  assert.ok(!all.includes("RunnerError"), "error class name leaked");
  assert.ok(!/\n\s+at /.test(all), "stack trace leaked");
  assert.ok(!all.includes("hwp_assisted_runner.cjs:"), "code location leaked");
  assert.ok(!all.includes(REPO), "local repo path leaked");
  // 정직한 provenance 기록: hook 관측 + egress>=1 + verified=false
  const runLog = fs.readFileSync(path.join(tc, "run_log.jsonl"), "utf8").trim().split("\n");
  const entry = JSON.parse(runLog[runLog.length - 1]);
  assert.equal(entry.no_egress_verified, false);
  assert.equal(entry.hook_observed, true);
  assert.ok(entry.egress_attempts >= 1);
});

test("check 모드: 설치 명령이 resolved npm 경로로 표시 — bare npm 금지 (C2N4D-MIN-01)", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const { fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", path.join(dir, "tc"), "--check"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.ok(r.out.includes("npm.CMD install"), "resolved npm path not displayed");
  assert.ok(!r.out.includes("npm install --prefix") || r.out.includes("npm.CMD install --prefix"));
  assert.ok(!/설치 명령\(승인 후 실행\): npm install/.test(r.out), "bare npm displayed");
});

test("실행 실패(rc≠0) → exit 7 (provenance는 기록됨)", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { fn } = mockExec(3, OK_SUMMARY);
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-run"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(fs.existsSync(path.join(tc, "run_log.jsonl")));
});

// ---- 4. Windows/한국어/경로 ------------------------------------------------------

test("한국어·공백·괄호 파일명 artifact 규약 보존", () => {
  const paths = R.artifactPaths("C:\\docs\\한글 문서 사본 (검증).hwpx", "C:\\out");
  assert.equal(path.basename(paths.intake), "한글 문서 사본 (검증).intake.json");
});

test("v1: aux_signals 미생성 + 건너뜀 안내(HWPX/DOCX)", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "문서.hwpx");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { fn } = mockExec(0, OK_SUMMARY);
  const out = path.join(dir, "out");
  const r = runMain([doc, "--out-dir", out, "--tool-cache", tc, "--approve-run"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.ok(r.out.includes("보조 구조 신호는 이 실행기 버전에서 생성하지 않습니다"));
  assert.ok(!fs.existsSync(path.join(out, "문서.aux_signals.json")));
  assert.ok(!Object.keys(R.artifactPaths(doc, out)).includes("aux_signals"));
});

test("repo 내부 out-dir → 경고 출력", () => {
  const dir = tmpdir("kssb-node-");
  fs.mkdirSync(path.join(dir, ".git"));
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  const { fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "inside"), "--tool-cache", tc],
    { which: mockWhich, execFn: fn });
  assert.ok(r.out.includes("저장소 내부로 보입니다"));
});

test("which(): PATHEXT로 npm.cmd 선택, npm.ps1 배제(P0/AVR-04)", () => {
  const dir = tmpdir("kssb-which-");
  fs.writeFileSync(path.join(dir, "npm.ps1"), "# ps1");
  fs.writeFileSync(path.join(dir, "npm.cmd"), "@echo off");
  const env = { PATH: dir, PATHEXT: ".COM;.EXE;.BAT;.CMD" };
  const resolved = R.which("npm", env);
  if (process.platform === "win32") {
    assert.ok(resolved && resolved.toLowerCase().endsWith("npm.cmd"));
    assert.ok(!resolved.toLowerCase().endsWith(".ps1"));
  } else {
    assert.ok(resolved === null || !resolved.endsWith(".ps1"));
  }
});

test("detectNode: node는 process.execPath로 자기 보장(문서화된 차이)", () => {
  const d = R.detectNode(() => null, tmpdir("kssb-node-tc-")); // portable 부재 임시 tool-cache
  assert.equal(d.node, process.execPath);
  assert.equal(d.npm, null);
  assert.equal(d.source, "missing");
});

// ---- 4b. portable Node 탐지 계층(2N-4F — 2N-4E §2 우선순위) ----------------------

function makePortable(tc) {
  const dir = R.portableNodeDir(tc);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "node.exe"), "fake");
  fs.writeFileSync(path.join(dir, "npm.cmd"), "fake");
  return dir;
}

test("detectNode: 시스템 Node/npm 우선(portable 존재해도 시스템 선택)", () => {
  const tc = tmpdir("kssb-node-tc-");
  makePortable(tc);
  const d = R.detectNode(mockWhich, tc);
  assert.equal(d.source, "system");
  assert.equal(d.npm, "C:\\fake\\node\\npm.CMD");
});

const PROBE_OK = () => `v${R.PORTABLE_NODE_VERSION}`; // 버전 실측 일치 mock(2N-4F-A)

test("detectNode: 시스템 부재 + 버전 실측 일치 → tool-cache portable 차선(절대 경로)", () => {
  const tc = tmpdir("kssb-node-tc-");
  const dir = makePortable(tc);
  const d = R.detectNode(() => null, tc, PROBE_OK);
  assert.equal(d.source, "portable");
  assert.equal(d.node, path.join(dir, "node.exe"));
  assert.equal(d.npm, path.join(dir, "npm.cmd"));
});

test("detectNode: portable 불완전(npm.cmd 없음) → missing(혼용 금지)", () => {
  const tc = tmpdir("kssb-node-tc-");
  const dir = R.portableNodeDir(tc);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "node.exe"), "fake"); // npm.cmd 없음
  const d = R.detectNode(() => null, tc, PROBE_OK);
  assert.equal(d.source, "missing");
});

// ---- 4c. portable 버전 실측 검증(C2N4F-MAJ-01 — 파일 존재만으로 인정 금지) --------

test("detectNode: 버전 불일치 → missing(손상/드리프트 상태로 취급)", () => {
  const tc = tmpdir("kssb-node-tc-");
  makePortable(tc);
  const d = R.detectNode(() => null, tc, () => "v99.0.0");
  assert.equal(d.source, "missing");
});

test("detectNode: 버전 명령 실패(null/예외) → missing", () => {
  const tc = tmpdir("kssb-node-tc-");
  makePortable(tc);
  assert.equal(R.detectNode(() => null, tc, () => null).source, "missing");
  assert.equal(R.detectNode(() => null, tc, () => { throw new Error("probe fail"); }).source,
    "missing");
});

test("portableNodeVersionProbe: 실제 node.exe → 실측 버전 / 가짜 exe → null", () => {
  assert.equal(R.portableNodeVersionProbe(process.execPath), process.version);
  const tc = tmpdir("kssb-node-tc-");
  const fake = path.join(tc, "node.exe");
  fs.writeFileSync(fake, "not a real executable");
  assert.equal(R.portableNodeVersionProbe(fake), null);
});

test("실행 흐름: portable 탐지(버전 일치) 시 run 명령의 node가 portable 절대 경로", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const pdir = makePortable(tc);
  const { calls, fn } = mockExec(0, OK_SUMMARY);
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-run"],
    { which: () => null, execFn: fn, probeFn: PROBE_OK });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls[0].cmd[0], path.join(pdir, "node.exe"));
});

test("실행 흐름: portable 버전 불일치 → missing으로 수렴(exit 4, exec 0)", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  makePortable(tc);
  const { calls, fn } = mockExec(0, OK_SUMMARY);
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-run"],
    { which: () => null, execFn: fn, probeFn: () => "v99.0.0" });
  assert.equal(r.rc, R.EXIT_NODE_MISSING);
  assert.equal(calls.length, 0);
});

test("Node/npm 부재 안내에 B안 승인 절차 표시(무단 설치 없음)", () => {
  const dir = tmpdir("kssb-node-");
  const doc = makeDoc(dir, "doc.hwp");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", path.join(dir, "tc")],
    { which: () => null, execFn: fn });
  assert.equal(r.rc, R.EXIT_NODE_MISSING);
  assert.equal(calls.length, 0); // 무단 설치/실행 없음
  assert.ok(r.out.includes("prepare_portable_node.ps1"));
  assert.ok(r.out.includes("-ApproveRuntime"));
  assert.ok(r.out.includes("SHA-256"));
  assert.ok(r.out.includes("폴더 삭제"));
});

test("parity: portable pin이 bootstrap ps1 기본값과 동일 + v24 계열", () => {
  const ps1 = fs.readFileSync(
    path.join(REPO, "src", "intake", "runners", "prepare_portable_node.ps1"), "utf8");
  const m = ps1.match(/\$PinVersion = "([^"]+)"/);
  assert.ok(m, "PinVersion default not found in ps1");
  assert.equal(m[1], R.PORTABLE_NODE_VERSION);
  assert.ok(R.PORTABLE_NODE_VERSION.startsWith("24."), "pin must stay in v24 LTS line (user decision 2)");
  // fail-closed: 실 다운로드용 기대 hash 상수는 아직 미기록이어야 한다(2N-4G에서 기록)
  assert.match(ps1, /\$PINNED_ZIP_SHA256_CONST = ""/);
});

// ---- 5. 기록 형식·경계 ------------------------------------------------------------

test("prep/run 로그 라인은 key 정렬 + 유효 JSON", () => {
  const line = R.sortedFlatJson({ zebra: 1, alpha: "가", mid: true });
  assert.equal(line, '{"alpha": "가", "mid": true, "zebra": 1}');
  assert.deepEqual(JSON.parse(line), { alpha: "가", mid: true, zebra: 1 });
});

test("checkKordoc: 버전 불일치 → version_ok=false(pin 드리프트 감지)", () => {
  const tc = tmpdir("kssb-node-");
  const pkgDir = path.join(R.kordocPrefix(tc), "node_modules", "kordoc");
  fs.mkdirSync(path.join(pkgDir, "dist"), { recursive: true });
  fs.writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify({ version: "9.9.9" }));
  const kd = R.checkKordoc(tc);
  assert.equal(kd.installed, true);
  assert.equal(kd.version_ok, false);
});

test("경계: core(validator/renderer/delivery) 미참조 + require는 Node 내장 모듈만", () => {
  const src = fs.readFileSync(
    path.join(REPO, "src", "intake", "runners", "hwp_assisted_runner.cjs"), "utf8");
  for (const banned of ["kssb_findings_validator", "kssb_report_renderer", "kssb_report_delivery"]) {
    assert.ok(!src.includes(banned), banned);
  }
  // 외부 의존성 0: require 대상은 node: 접두 내장 모듈뿐(주석의 범위-밖 고지 단어는 검사 대상 아님)
  const requires = [...src.matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(requires.length > 0);
  for (const r of requires) {
    assert.ok(r.startsWith("node:"), `non-builtin require: ${r}`);
  }
});

test("기본 tool-cache는 repo 밖 사용자 홈 하위(U1)", () => {
  const tc = R.defaultToolCache();
  assert.ok(tc.startsWith(os.homedir()));
  assert.ok(tc.includes(".samil-kssb-precheck"));
});
