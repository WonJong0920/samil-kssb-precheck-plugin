"use strict";
/* Document Intake Router(document_intake_router.cjs) 테스트 — node:test 내장 러너(Cycle 2N-4J).
 *
 * 실행: node --test tests/test_document_intake_router.test.cjs
 *
 * 증명 대상:
 * - family 판별과 라우팅 소유권(PDF / HWP-계열 / 범위 밖) — HWP-계열과 PDF 의미 붕괴 방지
 *   (C2N4I-OBS-02 / C2N4I4M-OBS-01).
 * - HWP/HWPX/DOCX는 기존 runner로 무변경 위임(기존 문구·exit code 그대로 — 회귀 방지).
 * - PDF Kordoc-first 경로: 무승인 설치/실행 금지(exec 0 + side-effect 0), 승인 분리(U3),
 *   unavailable/declined/failed 전부 baseline fallback 문구로 수렴(실패 은폐 없음).
 * - 실행 시 no-egress 훅 구성·provenance 정책·evidence 모드 통제된 실패(C2N4D-MAJ-01 계승).
 * - 2N-4J 범위: OCR/tesseract/rasterizer 실행 표면 없음(require 경계 스캔).
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const RT = require("../src/intake/runners/document_intake_router.cjs");
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
    rc = RT.main(argv, opts);
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

// ---- 1. family 판별·라우팅 소유권 -------------------------------------------------

test("detectFamily: PDF(대소문자)/HWP-계열/범위 밖 구분", () => {
  assert.equal(RT.detectFamily("a.pdf").family, RT.FAMILY_PDF);
  assert.equal(RT.detectFamily("a.PDF").family, RT.FAMILY_PDF);
  for (const ext of [".hwp", ".hwpx", ".docx"]) {
    assert.equal(RT.detectFamily(`a${ext}`).family, RT.FAMILY_HWP, ext);
  }
  assert.equal(RT.detectFamily("a.txt").family, RT.FAMILY_OUT_OF_SCOPE);
  assert.equal(RT.detectFamily("noext").family, RT.FAMILY_OUT_OF_SCOPE);
});

test("경계: PDF 라우팅 추가가 기존 runner의 HWP-first 집합을 바꾸지 않는다(의미 붕괴 방지)", () => {
  // 기존 runner는 계속 HWP/HWPX/DOCX만 소유한다 — PDF는 router 소유(별도 경로).
  assert.deepEqual([...R.SUPPORTED_EXTENSIONS].sort(), [".docx", ".hwp", ".hwpx"]);
  assert.ok(!R.SUPPORTED_EXTENSIONS.has(".pdf"));
  assert.ok(RT.PDF_EXTENSIONS.has(".pdf") && RT.PDF_EXTENSIONS.size === 1);
});

test("기존 runner 직접 호출 시 PDF는 여전히 범위 밖 exit 3(기존 동작 보존 — 소유권은 router)", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "doc.pdf");
  const { calls, fn } = mockExec();
  const lines = [];
  const orig = console.log;
  console.log = (...a) => lines.push(a.join(" "));
  let rc;
  try {
    rc = R.main([doc, "--out-dir", path.join(dir, "out")], { which: mockWhich, execFn: fn });
  } finally {
    console.log = orig;
  }
  assert.equal(rc, R.EXIT_OUT_OF_SCOPE);
  assert.equal(calls.length, 0);
});

test("usage: out-dir 누락 → exit 2 + router 사용법", () => {
  const r = runMain(["x.pdf"], { which: mockWhich, execFn: mockExec().fn });
  assert.equal(r.rc, R.EXIT_USAGE);
  assert.ok(r.err.includes("사용법"));
  assert.ok(r.err.includes("PDF/HWP/HWPX/DOCX"));
});

test("범위 밖 확장자 → exit 3 + 기본 검토 계속 안내, exec 호출 0", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "doc.txt");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out")], { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OUT_OF_SCOPE);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("범위 밖"));
  assert.ok(r.out.includes("기본 텍스트 기반 검토"));
});

// ---- 2. HWP-계열 위임(기존 경로 회귀 방지) ----------------------------------------

test("위임: .hwp 무플래그(설치 필요) → 기존 runner의 HWP 승인 문구 + exit 5, exec 0", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "doc.hwp");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", path.join(dir, "tc")],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_INSTALL_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  // 기존 runner 고유 문구(PDF 경로 문구가 아니어야 한다 — 의미 분리)
  assert.ok(r.out.includes("■ 로컬 판독 도구 설치 승인이 필요합니다"));
  assert.ok(!r.out.includes("PDF 구조 보강"));
});

test("위임: .docx --check → 기존 plan 모드 exit 0", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "doc.docx");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", path.join(dir, "tc"), "--check"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("plan 모드"));
});

test("위임: .hwpx 승인 실행(성공) → 기존 runner 전체 흐름(aux 건너뜀 안내 포함)", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "문서.hwpx");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { fn } = mockExec(0, OK_SUMMARY);
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-run"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.ok(r.out.includes("보조 구조 신호는 이 실행기 버전에서 생성하지 않습니다"));
});

// ---- 3. PDF 경로: unavailable / declined → baseline fallback ----------------------

test("PDF unavailable(Node/npm 부재) → exit 4 + baseline 수렴 안내 + B안 절차, side-effect 0", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc],
    { which: () => null, execFn: fn });
  assert.equal(r.rc, R.EXIT_NODE_MISSING);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("PDF 구조 보강 판독을 건너뜁니다"));
  assert.ok(r.out.includes("기본 텍스트 기반 검토로 계속"));
  assert.ok(r.out.includes("prepare_portable_node.ps1"));
  assert.ok(r.out.includes("-ApproveRuntime"));
  assert.ok(!fs.existsSync(tc), "unavailable 경로가 tool-cache를 만들면 안 된다");
});

test("PDF declined(설치 미승인) → exit 5 + 목적·출처·거부 안내, exec 0 + side-effect 0", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_INSTALL_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  // U5: 승인 대화에 provider명·버전·위치·경계 명시 + enhanced intake 목적
  assert.ok(r.out.includes("PDF 구조 보강 판독 도구 설치 승인"));
  assert.ok(r.out.includes("표·섹션·페이지 위치·도표 주변 맥락"));
  assert.ok(r.out.includes(`Kordoc ${R.KORDOC_VERSION}`));
  assert.ok(r.out.includes(R.NPM_SOURCE));
  assert.ok(r.out.includes("저장소 밖"));
  assert.ok(r.out.includes("no-egress"));
  assert.ok(r.out.includes("거부해도") || r.out.includes("거부하여도"));
  assert.ok(r.out.includes("--approve-install"));
  assert.ok(!fs.existsSync(tc), "declined 경로가 tool-cache를 만들면 안 된다");
});

test("PDF declined(실행 미승인, 기설치) → exit 6 + OCR 미실행 고지, exec 0", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_APPROVAL_REQUIRED);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("PDF 구조 보강 판독 실행 승인"));
  assert.ok(r.out.includes("OCR은 실행되지 않습니다"));
  assert.ok(r.out.includes("기본 텍스트 기반 검토"));
});

test("PDF --check → 계획 표시만(권장 경로·resolved npm 표시), exec 0, exit 0", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const { calls, fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", path.join(dir, "tc"), "--check"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_OK);
  assert.equal(calls.length, 0);
  assert.ok(r.out.includes("plan 모드"));
  assert.ok(r.out.includes("권장·승인 기반 선택 경로"));
  assert.ok(r.out.includes("npm.CMD install"), "resolved npm path not displayed");
  assert.ok(!/설치 명령\(승인 후 실행\): npm install/.test(r.out), "bare npm displayed");
  assert.ok(r.out.includes("--approve-run"));
});

// ---- 4. PDF 경로: 승인 분리·실행·provenance ---------------------------------------

test("PDF 설치 승인만 → 설치 exec 1회(pin·--omit=optional·resolved npm) 후 실행 승인 대기 exit 6", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  const { calls, fn } = mockExec(0, "");
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-install"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_APPROVAL_REQUIRED);
  assert.equal(calls.length, 1);
  const cmd = calls[0].cmd;
  assert.equal(cmd[0], "C:\\fake\\node\\npm.CMD");
  assert.ok(cmd.includes("--omit=optional"));
  assert.ok(cmd.includes(`kordoc@${R.KORDOC_VERSION}`));
  assert.ok(cmd.includes(`pdfjs-dist@${R.PDFJS_VERSION}`));
  assert.ok(!cmd.includes("-g") && !cmd.includes("npx"));
  const approvals = JSON.parse(fs.readFileSync(path.join(tc, "approvals.json"), "utf8"));
  assert.ok(approvals.install[`kordoc@${R.KORDOC_VERSION}`]);
  const prep = fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8").trim().split("\n");
  assert.equal(prep.length, 2);
  assert.equal(JSON.parse(prep[0]).status, "started");
  assert.equal(JSON.parse(prep[1]).status, "ok");
});

test("PDF 설치 실패(failed) → exit 7 + prep failed 기록 + baseline 안내", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  const { fn } = mockExec(1, "network error");
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-install"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("기본 텍스트 기반 검토로 계속"));
  assert.ok(fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8").includes("failed rc=1"));
});

test("PDF 승인 실행(성공) → nethook 구성·provenance true·완료 안내(OCR 경계·§7 provider 미노출)", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "지속가능 보고서 (2025).pdf");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { calls, fn } = mockExec(0, OK_SUMMARY);
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc,
    "--approve-run", "--evidence-mode"], { which: mockWhich, execFn: fn });
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
  // 완료 안내(§7): provider명 미노출 + 한국어 파일명 artifact 규약 + OCR 미실행 경계
  const completion = r.out.split("■ 판독 완료")[1] || "";
  assert.ok(!/kordoc/i.test(completion), "provider name leaked in completion output");
  assert.ok(completion.includes("지속가능 보고서 (2025).intake.json"));
  assert.ok(completion.includes("컨설턴트 검수"));
  assert.ok(completion.includes("OCR은"));
  assert.ok(completion.includes("실행되지 않습니다"));
});

test("PDF 실행 실패(rc≠0, failed) → exit 7 + baseline 수렴 + provenance 기록", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { fn } = mockExec(3, OK_SUMMARY);
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc, "--approve-run"],
    { which: mockWhich, execFn: fn });
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("기본 텍스트 기반 검토로 계속하십시오"));
  assert.ok(fs.existsSync(path.join(tc, "run_log.jsonl")));
});

test("PDF evidence 모드 훅 미관측 → 통제된 실패 exit 7 + 정직한 로그(예외 미유출)", () => {
  const dir = tmpdir("kssb-rt-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  const { fn } = mockExec(0, "no hook output");
  const r = runMain([doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc,
    "--approve-run", "--evidence-mode"], { which: mockWhich, execFn: fn });
  assert.equal(r.thrown, null);
  assert.equal(r.rc, R.EXIT_RUN_FAILED);
  assert.ok(r.out.includes("evidence 모드"));
  assert.ok(r.out.includes("기본 텍스트 기반 검토로 계속하십시오"));
  const runLog = fs.readFileSync(path.join(tc, "run_log.jsonl"), "utf8").trim().split("\n");
  const entry = JSON.parse(runLog[runLog.length - 1]);
  assert.equal(entry.no_egress_verified, false);
  assert.equal(entry.hook_observed, false);
});

test("CLI subprocess: PDF evidence 모드 실패 → exit 7, stack/로컬 경로 미노출", () => {
  const dir = tmpdir("kssb-rt-cli-");
  const doc = makeDoc(dir, "report.pdf");
  const tc = path.join(dir, "tc");
  preinstallKordoc(tc);
  // fake cli.js: nethook(block)이 차단하는 원격 DNS 시도 — 원본 호출 전 throw라 외부 트래픽 0.
  fs.writeFileSync(
    path.join(R.kordocPrefix(tc), "node_modules", "kordoc", "dist", "cli.js"),
    'try { require("node:dns").lookup("blocked.invalid", () => {}); } catch (e) {}\n',
    "utf8");
  const { spawnSync } = require("node:child_process");
  const router = path.join(REPO, "src", "intake", "runners", "document_intake_router.cjs");
  const proc = spawnSync(process.execPath,
    [router, doc, "--out-dir", path.join(dir, "out"), "--tool-cache", tc,
      "--approve-run", "--evidence-mode"],
    { encoding: "utf8" });
  const all = (proc.stdout || "") + (proc.stderr || "");
  assert.equal(proc.status, R.EXIT_RUN_FAILED);
  assert.ok(all.includes("evidence 모드"));
  assert.ok(!all.includes("RunnerError"), "error class name leaked");
  assert.ok(!/\n\s+at /.test(all), "stack trace leaked");
  assert.ok(!all.includes("document_intake_router.cjs:"), "code location leaked");
  assert.ok(!all.includes(REPO), "local repo path leaked");
  const runLog = fs.readFileSync(path.join(tc, "run_log.jsonl"), "utf8").trim().split("\n");
  const entry = JSON.parse(runLog[runLog.length - 1]);
  assert.equal(entry.no_egress_verified, false);
  assert.ok(entry.egress_attempts >= 1);
});

test("PDF repo 내부 out-dir → 경고 출력(이중 방어 유지)", () => {
  const dir = tmpdir("kssb-rt-");
  fs.mkdirSync(path.join(dir, ".git"));
  const doc = makeDoc(dir, "report.pdf");
  const { fn } = mockExec();
  const r = runMain([doc, "--out-dir", path.join(dir, "inside"), "--tool-cache", path.join(dir, "tc")],
    { which: mockWhich, execFn: fn });
  assert.ok(r.out.includes("저장소 내부로 보입니다"));
});

// ---- 5. 경계: 2N-4J 범위(OCR 실행 표면 없음)·core 미참조 --------------------------

test("경계: router의 require는 node: 내장 + 기존 runner 모듈만(OCR/rasterizer/외부 의존 0)", () => {
  const src = fs.readFileSync(
    path.join(REPO, "src", "intake", "runners", "document_intake_router.cjs"), "utf8");
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

test("경계: router는 자체 버전 pin·자체 게이트 상수를 두지 않는다(기존 runner 단일 소스)", () => {
  const src = fs.readFileSync(
    path.join(REPO, "src", "intake", "runners", "document_intake_router.cjs"), "utf8");
  // 게이트·pin·provenance는 R.* 재사용만 — 독자 정의 금지(드리프트 방지)
  assert.ok(!/KORDOC_VERSION\s*=\s*"/.test(src), "own kordoc pin defined");
  assert.ok(!/EXIT_[A-Z_]+\s*=\s*\d/.test(src), "own exit codes defined");
  assert.ok(!/NETHOOK_SUMMARY_RE\s*=/.test(src), "own summary regex defined");
});
