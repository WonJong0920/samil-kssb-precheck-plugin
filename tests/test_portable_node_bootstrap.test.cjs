"use strict";
/* Portable Node bootstrap(prepare_portable_node.ps1) mock 테스트 — node:test (Cycle 2N-4F).
 *
 * 실행: node --test tests/test_portable_node_bootstrap.test.cjs
 *
 * **실제 네트워크 0**: -SourceRoot에 로컬 fixture 디렉터리를 주고, 성공 zip은 테스트 시점에
 * 실제 node.exe(process.execPath 복사)로 임시 생성한다(바이너리 커밋 없음 · 다운로드 없음).
 * 검증 대상(C2N4E-OBS-02): 무승인 게이트 / 이중 hash(불일치 2종) / SHASUMS 파싱 실패 /
 * 해제 실패 / cleanup / 공식 remote override fail-fast / 성공 경로(마커·로그·자가 버전 확인).
 */

const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const PS1 = path.join(REPO, "src", "intake", "runners", "prepare_portable_node.ps1");
const VER = process.version.slice(1); // 실행 중 Node의 실제 버전 — 자가 버전 확인이 통과하도록
const ZIP_NAME = `node-v${VER}-win-x64.zip`;
const IS_WIN = process.platform === "win32";
const REAL_NODE_WIN_X64_SHA256 = "edaca9bd58ec8e92037dac4e877d52f6b8f430b81c18b57e264b4e2fb111cd56";

test("2N-4G: official remote repo-pinned hash is recorded; live download is evidence-only", { skip: !IS_WIN }, () => {
  const ps1 = fs.readFileSync(PS1, "utf8");
  const m = ps1.match(/\$PINNED_ZIP_SHA256_CONST = "([0-9a-f]{64})"/);
  assert.ok(m, "repo-pinned hash constant must be recorded after 2N-4G evidence");
  assert.equal(m[1], REAL_NODE_WIN_X64_SHA256);
});

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function runPs1(args) {
  const proc = spawnSync("powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS1, ...args],
    { encoding: "utf8", timeout: 120000 });
  return { status: proc.status, out: (proc.stdout || "") + (proc.stderr || "") };
}

// ---- fixture: 성공용 zip(실제 node.exe 동봉)을 임시 생성(1회) -------------------
let FIX; // { dir, zip, hash }

before(() => {
  if (!IS_WIN) return;
  const dir = tmpdir("kssb-pnode-fix-");
  const payload = path.join(dir, `node-v${VER}-win-x64`);
  fs.mkdirSync(payload, { recursive: true });
  fs.copyFileSync(process.execPath, path.join(payload, "node.exe"));
  fs.writeFileSync(path.join(payload, "npm.cmd"), "@echo off\r\necho stub\r\n");
  const zip = path.join(dir, ZIP_NAME);
  const z = spawnSync("powershell.exe",
    ["-NoProfile", "-Command",
      `Compress-Archive -Path "${payload}" -DestinationPath "${zip}" -Force`],
    { encoding: "utf8", timeout: 180000 });
  assert.equal(z.status, 0, "fixture zip build failed: " + (z.stderr || ""));
  const hash = sha256(zip);
  fs.writeFileSync(path.join(dir, "SHASUMS256.txt"),
    `${hash}  ${ZIP_NAME}\n0123456789abcdef  other-file.tar.gz\n`);
  FIX = { dir, zip, hash };
});

test("무승인 호출 → 승인 안내 + exit 5 + 파일 생성 0", { skip: !IS_WIN }, () => {
  const tc = path.join(tmpdir("kssb-pnode-"), "tc"); // 미생성 상태로 전달
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER]);
  assert.equal(r.status, 5);
  assert.ok(r.out.includes("-ApproveRuntime"));
  assert.ok(r.out.includes("nodejs.org"));
  assert.ok(r.out.includes("SHA-256"));
  assert.ok(!fs.existsSync(tc), "unapproved call must not create files");
});

// (CLD2N4G-MIN-01 dedupe) "공식 원격 + override 거부" 시나리오는 아래 단일 테스트로 유지한다.
// **주의(CLD2N4G-OBS-02)**: pin 상수가 기록된 현재, "공식 원격 + override 없음 + -ApproveRuntime" 조합은
// 실제 다운로드를 수행한다 — 이 suite에 그 케이스를 추가하지 말 것(실 네트워크 금지, evidence 사이클 전용).

test("비공식 원격 SourceRoot → 네트워크·파일 생성 전 fail-fast exit 7 (C2N4F-MAJ-02)", { skip: !IS_WIN }, () => {
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER,
    "-SourceRoot", `https://mirror.example.com/dist/v${VER}/`,
    "-PinnedZipSha256", FIX.hash, "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(r.out.includes("nodejs.org/dist"), "official-only message expected");
  assert.ok(!fs.existsSync(tc), "guard must precede any file creation");
});

test("공식 원격 + -PinnedZipSha256 override → 거부 exit 7 (repo-pinned provenance 보호)", { skip: !IS_WIN }, () => {
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER,
    "-SourceRoot", `https://nodejs.org/dist/v${VER}/`,
    "-PinnedZipSha256", FIX.hash, "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(!fs.existsSync(tc), "guard must precede any file creation");
});

test("성공 경로: 이중 hash 통과 → 배치·버전 자가 확인·마커·로그 (exit 0)", { skip: !IS_WIN }, () => {
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER, "-SourceRoot", FIX.dir,
    "-PinnedZipSha256", FIX.hash, "-ApproveRuntime"]);
  assert.equal(r.status, 0, r.out);
  const dest = path.join(tc, `node@v${VER}-win-x64`);
  assert.ok(fs.existsSync(path.join(dest, "node.exe")));
  assert.ok(fs.existsSync(path.join(dest, "npm.cmd")));
  // 승인 marker(runtime kind) — 유효 JSON(BOM 없음)
  const approvals = JSON.parse(fs.readFileSync(path.join(tc, "approvals.json"), "utf8"));
  assert.ok(approvals.runtime[`node@v${VER}-win-x64`]);
  // prep log: started → ok, provider/source 기록, key 정렬 유효 JSONL
  const lines = fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8").trim().split("\n");
  const first = JSON.parse(lines[0]);
  const last = JSON.parse(lines[lines.length - 1]);
  assert.equal(first.status, "started");
  assert.equal(last.status, "ok");
  assert.equal(last.provider, "nodejs-portable");
  assert.ok(last.source.includes("kssb-pnode-fix-")); // 테스트 fixture 출처가 로그에 남는다
  assert.match(last.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
});

test("repo-pinned hash 불일치 → 해제 금지·정리·exit 7", { skip: !IS_WIN }, () => {
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER, "-SourceRoot", FIX.dir,
    "-PinnedZipSha256", "0".repeat(64), "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(!fs.existsSync(path.join(tc, `node@v${VER}-win-x64`)), "dest must not exist");
  const log = fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8");
  assert.ok(log.includes("failed pinned-hash-mismatch"));
});

test("SHASUMS256.txt 불일치 → 해제 금지·exit 7 (pin은 통과해도 교차 실패)", { skip: !IS_WIN }, () => {
  const dir = tmpdir("kssb-pnode-bad-");
  fs.copyFileSync(FIX.zip, path.join(dir, ZIP_NAME));
  fs.writeFileSync(path.join(dir, "SHASUMS256.txt"), `${"f".repeat(64)}  ${ZIP_NAME}\n`);
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER, "-SourceRoot", dir,
    "-PinnedZipSha256", FIX.hash, "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(!fs.existsSync(path.join(tc, `node@v${VER}-win-x64`)));
  assert.ok(fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8")
    .includes("failed shasums-mismatch"));
});

test("SHASUMS256.txt 파싱 실패(해당 행 없음) → exit 7", { skip: !IS_WIN }, () => {
  const dir = tmpdir("kssb-pnode-noline-");
  fs.copyFileSync(FIX.zip, path.join(dir, ZIP_NAME));
  fs.writeFileSync(path.join(dir, "SHASUMS256.txt"), "not a shasums file\n");
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER, "-SourceRoot", dir,
    "-PinnedZipSha256", FIX.hash, "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8")
    .includes("failed shasums-parse"));
});

test("손상 zip(hash는 일치) → 해제 실패·부분 정리·exit 7", { skip: !IS_WIN }, () => {
  const dir = tmpdir("kssb-pnode-corrupt-");
  const corrupt = path.join(dir, ZIP_NAME);
  fs.writeFileSync(corrupt, "this is not a zip archive");
  const h = sha256(corrupt); // hash 검증은 통과하도록 손상 바이트 기준으로 기록
  fs.writeFileSync(path.join(dir, "SHASUMS256.txt"), `${h}  ${ZIP_NAME}\n`);
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER, "-SourceRoot", dir,
    "-PinnedZipSha256", h, "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(!fs.existsSync(path.join(tc, `node@v${VER}-win-x64`)));
  assert.ok(fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8")
    .includes("failed extract"));
});

test("다운로드 실패(fixture에 파일 없음) → exit 7 + failed download 기록", { skip: !IS_WIN }, () => {
  const dir = tmpdir("kssb-pnode-empty-"); // zip/SHASUMS 없음
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER, "-SourceRoot", dir,
    "-PinnedZipSha256", FIX.hash, "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8")
    .includes("failed download"));
});

test("버전 자가 확인 실패(가짜 node.exe) → 배치 정리·exit 7", { skip: !IS_WIN }, () => {
  // 텍스트 node.exe가 든 zip — hash 검증은 통과, & node.exe --version 실패 → version-check 실패
  const dir = tmpdir("kssb-pnode-fakeexe-");
  const payload = path.join(dir, `node-v${VER}-win-x64`);
  fs.mkdirSync(payload, { recursive: true });
  fs.writeFileSync(path.join(payload, "node.exe"), "not a real executable");
  fs.writeFileSync(path.join(payload, "npm.cmd"), "@echo off\r\n");
  const zip = path.join(dir, ZIP_NAME);
  const z = spawnSync("powershell.exe", ["-NoProfile", "-Command",
    `Compress-Archive -Path "${payload}" -DestinationPath "${zip}" -Force`],
    { encoding: "utf8", timeout: 60000 });
  assert.equal(z.status, 0);
  const h = sha256(zip);
  fs.writeFileSync(path.join(dir, "SHASUMS256.txt"), `${h}  ${ZIP_NAME}\n`);
  const tc = path.join(tmpdir("kssb-pnode-"), "tc");
  const r = runPs1(["-ToolCache", tc, "-PinVersion", VER, "-SourceRoot", dir,
    "-PinnedZipSha256", h, "-ApproveRuntime"]);
  assert.equal(r.status, 7);
  assert.ok(!fs.existsSync(path.join(tc, `node@v${VER}-win-x64`)),
    "failed dest must be cleaned up");
  assert.ok(fs.readFileSync(path.join(tc, "prep_egress_log.jsonl"), "utf8")
    .includes("failed version-check"));
});
