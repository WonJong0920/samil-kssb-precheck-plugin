"use strict";
/**
 * Trace manifest delivery-terminal stage 테스트 (Cycle C — opt-in, 기본 off).
 *
 * 검증 축(설계·design review 기준):
 * - 기본 실행에서는 run_manifest.json 미생성 / opt-in일 때만 생성.
 * - manifest의 output basename/bytes/sha256이 실제 생성 파일과 일치.
 * - findings canonical-JSON hash·self-hash 재현 가능(self 필드 제외 규칙).
 * - 동일 입력 2회 deterministic core 동일.
 * - manifest 문자열에 로컬 절대경로·계정명·tmpdir·stack 부재.
 * - 판정·품질·감사/인증류 금지 필드 부재(field allowlist).
 * - D94 hard stop 시 manifest 미생성.
 * - manifest write 실패가 delivery 성공을 깨지 않고 안전한 manifest_error만 남김.
 * - 기본 delivery 출력·user_summary가 manifest on/off 무관하게 불변(무회귀).
 * 외부 의존성 0.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const D = require(path.join(REPO, "src", "renderers", "kssb_report_delivery.cjs"));
const R = require(path.join(REPO, "src", "renderers", "kssb_report_renderer.cjs"));
const DELIVERY_CJS = path.join(REPO, "src", "renderers", "kssb_report_delivery.cjs");
const EXAMPLE = path.join(REPO, "src", "schemas", "kssb_findings_example.json");

function base() {
  return JSON.parse(fs.readFileSync(EXAMPLE, "utf-8"));
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cc-manifest-"));
}

function manifestPath(dir) {
  return path.join(dir, "run_manifest.json");
}

function readManifest(dir) {
  return JSON.parse(fs.readFileSync(manifestPath(dir), "utf-8"));
}

// 금지 필드(판정·품질·감사/인증처럼 보이는 것) — manifest 어디에도 key로 존재하면 안 된다.
const FORBIDDEN_KEYS = new Set([
  "status", "verdict", "pass", "quality", "score", "grade",
  "compliance", "assurance", "audit_opinion", "certified",
]);

function allKeys(node, acc = new Set()) {
  if (Array.isArray(node)) node.forEach((v) => allKeys(v, acc));
  else if (node !== null && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) { acc.add(k); allKeys(v, acc); }
  }
  return acc;
}

function assertNoLeak(text) {
  assert.ok(!/[A-Za-z]:[\\/]Users[\\/]/i.test(text), "사용자 홈 경로 노출");
  assert.ok(!text.includes("AppData"), "AppData 노출");
  assert.ok(!text.includes(os.tmpdir()), "임시 폴더 절대경로 노출");
  assert.ok(!/\bat \b.*:\d+:\d+/.test(text) && !/\n\s+at /.test(text), "stack trace 노출");
}

// ---- opt-in / default-off ----

test("기본 실행(manifest 미지정) → run_manifest.json 미생성 + 반환 manifest null", () => {
  const dir = tmpdir();
  try {
    const r = D.deliver(base(), dir);
    assert.ok(!fs.existsSync(manifestPath(dir)), "기본에서 manifest 파일 없음");
    assert.strictEqual(r.manifest, null);
    assert.strictEqual(r.manifest_error, null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("opt-in(manifest:true) → run_manifest.json 생성 + 반환에 filename·self-hash", () => {
  const dir = tmpdir();
  try {
    const r = D.deliver(base(), dir, { manifest: true });
    assert.ok(fs.existsSync(manifestPath(dir)));
    assert.strictEqual(r.manifest.filename, "run_manifest.json");
    assert.match(r.manifest.manifest_sha256, /^[0-9a-f]{64}$/);
    assert.strictEqual(r.manifest_error, null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("CLI --manifest → 생성 / 미지정 → 미생성 (exit 0 불변)", () => {
  const dir = tmpdir();
  const dir2 = tmpdir();
  try {
    const rOn = spawnSync(process.execPath, [DELIVERY_CJS, EXAMPLE, "-o", dir, "--manifest"],
      { cwd: REPO, encoding: "utf-8" });
    assert.strictEqual(rOn.status, 0, rOn.stderr);
    assert.ok(fs.existsSync(manifestPath(dir)));
    const rOff = spawnSync(process.execPath, [DELIVERY_CJS, EXAMPLE, "-o", dir2],
      { cwd: REPO, encoding: "utf-8" });
    assert.strictEqual(rOff.status, 0);
    assert.ok(!fs.existsSync(manifestPath(dir2)));
    // 사용자 stdout에 manifest 언급 없음(대표 문서로 승격 안 함)
    assert.ok(!rOn.stdout.includes("run_manifest"));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(dir2, { recursive: true, force: true }); }
});

// ---- output provenance 정합 ----

test("manifest output basename/bytes/sha256이 실제 생성 파일과 일치", () => {
  const dir = tmpdir();
  try {
    const r = D.deliver(base(), dir, { manifest: true });
    const m = readManifest(dir);
    assert.ok(Array.isArray(m.outputs) && m.outputs.length === 3);
    for (const entry of m.outputs) {
      const p = r.outputs[entry.format];
      assert.ok(p, `output ${entry.format} 경로 존재`);
      assert.strictEqual(entry.filename, path.basename(p));
      const bytes = fs.readFileSync(p);
      assert.strictEqual(entry.bytes, bytes.length);
      assert.strictEqual(entry.sha256, crypto.createHash("sha256").update(bytes).digest("hex"));
      assert.strictEqual(entry.primary, r.outputs.primary === p);
    }
    // primary_format·docx_generated 정합
    assert.strictEqual(m.primary_format, r.outputs.primary_format);
    assert.strictEqual(m.docx_generated, Boolean(r.outputs.docx));
    // input count 정합
    assert.strictEqual(m.input.area_count, base().kssb_areas.length);
    let items = 0; for (const a of base().kssb_areas) items += (a.items || []).length;
    assert.strictEqual(m.input.item_count, items);
    assert.strictEqual(m.input.source_count, (base().source_documents || []).length);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ---- hash 재현 / self-hash 규칙 ----

test("findings canonical-JSON hash 재현 가능(파일 재직렬화와 무관)", () => {
  const dir = tmpdir();
  try {
    D.deliver(base(), dir, { manifest: true });
    const m = readManifest(dir);
    const expected = D.sha256Hex(Buffer.from(D.canonicalJson(base()), "utf-8"));
    assert.strictEqual(m.input.findings_sha256, expected);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("self-hash: manifest_sha256을 제외한 canonical core로 재계산 시 일치(자기 필드 제외 규칙)", () => {
  const dir = tmpdir();
  try {
    D.deliver(base(), dir, { manifest: true });
    const m = readManifest(dir);
    const core = { ...m };
    delete core.manifest_sha256;
    const recomputed = D.sha256Hex(Buffer.from(D.canonicalJson(core), "utf-8"));
    assert.strictEqual(recomputed, m.manifest_sha256, "self-hash는 자기 필드 제외 canonical core로 재현");
    // manifest_sha256 값을 바꿔도 core 재계산 결과는 불변(자기 참조 배제 확인)
    const tampered = { ...m, manifest_sha256: "0".repeat(64) };
    const coreT = { ...tampered }; delete coreT.manifest_sha256;
    assert.strictEqual(D.sha256Hex(Buffer.from(D.canonicalJson(coreT), "utf-8")), m.manifest_sha256);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("결정성: 동일 findings 2회 → deterministic core(=self-hash) 및 파일 바이트 동일", () => {
  const d1 = tmpdir();
  const d2 = tmpdir();
  try {
    D.deliver(base(), d1, { manifest: true });
    D.deliver(base(), d2, { manifest: true });
    const m1 = readManifest(d1);
    const m2 = readManifest(d2);
    assert.strictEqual(m1.manifest_sha256, m2.manifest_sha256);
    assert.ok(fs.readFileSync(manifestPath(d1)).equals(fs.readFileSync(manifestPath(d2))),
      "manifest 파일 바이트 동일(timestamp 미포함)");
    // buildTraceManifest 직접 호출 2회도 동일(순수성)
    const r = D.deliver(base(), d1, { manifest: true });
    const a = D.buildTraceManifest(base(), r.outputs, r.preflight.counts, r.preflight.issues);
    const b = D.buildTraceManifest(base(), r.outputs, r.preflight.counts, r.preflight.issues);
    assert.deepStrictEqual(a, b);
  } finally { fs.rmSync(d1, { recursive: true, force: true }); fs.rmSync(d2, { recursive: true, force: true }); }
});

// ---- 누출 / no-judgment ----

test("누출 없음: manifest 문자열에 로컬 절대경로·계정명·tmpdir·stack 부재", () => {
  const dir = tmpdir();
  try {
    D.deliver(base(), dir, { manifest: true });
    const text = fs.readFileSync(manifestPath(dir), "utf-8");
    assertNoLeak(text);
    // 산출물은 basename만(경로 구분자 포함 파일 경로 아님)
    const m = JSON.parse(text);
    for (const o of m.outputs) assert.ok(!o.filename.includes("/") && !o.filename.includes("\\"));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("no-judgment: 판정·품질·감사/인증류 금지 필드가 manifest에 없음", () => {
  const dir = tmpdir();
  try {
    D.deliver(base(), dir, { manifest: true });
    const m = readManifest(dir);
    const keys = [...allKeys(m)].map((k) => k.toLowerCase());
    for (const k of keys) assert.ok(!FORBIDDEN_KEYS.has(k), `금지 필드 존재: ${k}`);
    // preflight issues는 code·severity만(message/location 원문 미포함)
    for (const i of m.preflight.issues) {
      assert.deepStrictEqual(Object.keys(i).sort(), ["code", "severity"]);
    }
    // 문자열 스캔: PASS/합격류 판정 어휘 부재
    const s = JSON.stringify(m);
    assert.ok(!/"(status|verdict)"\s*:/.test(s));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ---- D94 hard stop ----

test("D94 hard stop → manifest:true여도 run_manifest.json 미생성 + 반환 manifest null", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = ""; // anchor.quote_empty (error)
  const parent = tmpdir();
  const dir = path.join(parent, "out");
  try {
    const r = D.deliver(f, dir, { manifest: true });
    assert.strictEqual(r.hard_stop, true);
    assert.strictEqual(r.manifest, null);
    assert.strictEqual(r.manifest_error, null);
    assert.ok(!fs.existsSync(dir), "hard stop 시 out-dir 미생성 → manifest도 없음");
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});

// ---- 실패 처리 ----

test("manifest write 실패 → delivery 성공 유지 + 안전한 manifest_error(경로·stack 없음)", () => {
  const dir = tmpdir();
  const realWrite = fs.writeFileSync;
  try {
    // 대표 문서 렌더는 통과시키고 run_manifest.json 쓰기에서만 예외를 던지도록 mock.
    fs.writeFileSync = function (p, ...rest) {
      if (String(p).endsWith("run_manifest.json")) {
        const e = new Error("EACCES: permission denied, open 'C:\\Users\\secret\\run_manifest.json'");
        e.stack = "Error: EACCES\n    at Object.writeFileSync (node:fs:1)";
        throw e;
      }
      return realWrite.call(fs, p, ...rest);
    };
    const r = D.deliver(base(), dir, { manifest: true });
    assert.strictEqual(r.hard_stop, false, "manifest 실패해도 delivery는 성공");
    assert.ok(fs.existsSync(r.outputs.docx), "대표 문서는 정상 생성");
    assert.strictEqual(r.manifest, null);
    assert.strictEqual(r.manifest_error, "manifest_generation_failed");
    // manifest_error에 경로·stack·계정명·원본 예외 메시지 없음
    assertNoLeak(r.manifest_error);
    assert.ok(!r.manifest_error.includes("EACCES") && !r.manifest_error.includes("secret"));
    assert.ok(!fs.existsSync(manifestPath(dir)));
  } finally {
    fs.writeFileSync = realWrite;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---- 무회귀: 기본 출력·user_summary 불변 ----

test("무회귀: manifest on/off에서 기본 delivery 출력·user_summary 불변", () => {
  const dOff = tmpdir();
  const dOn = tmpdir();
  try {
    const rOff = D.deliver(base(), dOff);
    const rOn = D.deliver(base(), dOn, { manifest: true });
    // user_summary는 manifest 여부와 무관하게 동일
    assert.strictEqual(rOn.user_summary, rOff.user_summary, "user_summary 불변");
    assert.ok(!rOn.user_summary.includes("run_manifest"), "user_summary에 manifest 미언급");
    // 대표 문서 3종은 양쪽 동일 파일명, manifest off dir엔 run_manifest.json 없음
    const offFiles = fs.readdirSync(dOff).sort();
    const onFiles = fs.readdirSync(dOn).filter((n) => n !== "run_manifest.json").sort();
    assert.deepStrictEqual(onFiles, offFiles, "보고서 산출물 집합 동일");
    assert.ok(!offFiles.includes("run_manifest.json"));
    // manifest on dir엔 정확히 +1(run_manifest.json)만 추가
    assert.strictEqual(fs.readdirSync(dOn).length, offFiles.length + 1);
  } finally { fs.rmSync(dOff, { recursive: true, force: true }); fs.rmSync(dOn, { recursive: true, force: true }); }
});
