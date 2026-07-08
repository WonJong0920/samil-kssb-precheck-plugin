"use strict";
/**
 * Node ↔ Python DOCX writer parity 테스트 (2N-6 Phase 2 N4).
 *
 * Python `kssb_report_renderer._docx_bytes`(transitional reference — 무변경)를 기준으로,
 * 동일 findings에 대해 양쪽 DOCX를 만들고 **압축 해제 후 구조·콘텐츠 parity**를 대조한다.
 *
 * parity 기준(정의 — 완료 보고서와 동일):
 * - 구조 parity: 동일한 8개 파트가 동일 순서.
 * - 콘텐츠 parity: 각 파트의 **압축 해제 콘텐츠가 byte-identical**(문구·XML·스타일 동일).
 * - **컨테이너 전체 byte parity는 목표가 아니다**: 큰 파트(word/document.xml)에서 Node/Python zlib
 *   DEFLATE 스트림이 달라질 수 있다(허용 차이 — 압축 컨테이너 봉투 차이, 콘텐츠 동일성으로 상쇄).
 * - 결정성: Node와 Python 각각 동일 입력 → 동일 출력.
 *
 * Python 미탐지 시 해당 테스트는 명시적 skip(개발기 reference 대조용).
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const R = require(path.join(REPO, "src", "renderers", "kssb_report_renderer.cjs"));
const EXAMPLE = path.join(REPO, "src", "schemas", "kssb_findings_example.json");

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

let tmpRoot = null;
let seq = 0;
test.before(() => { tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "n4-docx-parity-")); });
test.after(() => { if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true }); });

function base() {
  return JSON.parse(fs.readFileSync(EXAMPLE, "utf-8"));
}

// 최소 ZIP 리더(로컬 헤더 순차 파싱 — data descriptor/extra field 없음 가정).
function unzipEntries(buf) {
  const entries = [];
  let off = 0;
  while (off + 4 <= buf.length && buf.readUInt32LE(off) === 0x04034b50) {
    const method = buf.readUInt16LE(off + 8);
    const csize = buf.readUInt32LE(off + 18);
    const nlen = buf.readUInt16LE(off + 26);
    const elen = buf.readUInt16LE(off + 28);
    const name = buf.subarray(off + 30, off + 30 + nlen).toString("utf-8");
    const dataStart = off + 30 + nlen + elen;
    const comp = buf.subarray(dataStart, dataStart + csize);
    const content = method === 8 ? zlib.inflateRawSync(comp) : Buffer.from(comp);
    entries.push({ name, content });
    off = dataStart + csize;
  }
  return entries;
}

// Python `_docx_bytes(findings)` 산출을 파일로 받는다(reference 무변경 — import만).
function pythonDocx(findingsPath, outPath) {
  const code = [
    "import sys, json",
    `sys.path.insert(0, r'${path.join(REPO, "src", "renderers").replace(/\\/g, "\\\\")}')`,
    "import kssb_report_renderer as R",
    `f = json.load(open(r'${findingsPath.replace(/\\/g, "\\\\")}', encoding='utf-8'))`,
    `open(r'${outPath.replace(/\\/g, "\\\\")}', 'wb').write(R._docx_bytes(f))`,
  ].join("\n");
  const r = spawnSync(PY, ["-c", code], { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 120000 });
  return r;
}

function writeFindings(obj) {
  seq += 1;
  const p = path.join(tmpRoot, `f${seq}.json`);
  fs.writeFileSync(p, JSON.stringify(obj), "utf-8");
  return p;
}

function assertContentParity(findings) {
  const fp = writeFindings(findings);
  const pyOut = path.join(tmpRoot, `py${seq}.docx`);
  const rp = pythonDocx(fp, pyOut);
  assert.strictEqual(rp.status, 0, `Python 생성 실패: ${rp.stderr}`);

  const pyEntries = unzipEntries(fs.readFileSync(pyOut));
  const ndEntries = unzipEntries(R.docxBytes(findings));

  // 구조 parity: 이름·순서 동일
  assert.deepStrictEqual(ndEntries.map((e) => e.name), pyEntries.map((e) => e.name),
    "파트 이름/순서 동일");
  // 콘텐츠 parity: 각 파트 압축 해제 콘텐츠 byte-identical
  for (let i = 0; i < pyEntries.length; i++) {
    assert.ok(ndEntries[i].content.equals(pyEntries[i].content),
      `콘텐츠 불일치: ${pyEntries[i].name}`);
  }
}

// ---- 전제 ----

test("전제: Python reference 실행 파일 존재", (t) => {
  if (!PY) { t.skip("Python 3 미탐지(SAMIL_PARITY_PY로 지정 가능)"); return; }
  assert.ok(PY);
});

// ---- 콘텐츠 parity(파트별 압축 해제 byte-identical) ----

test("DOCX parity: 공식 예시 — 8개 파트 압축 해제 콘텐츠 byte-identical", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  assertContentParity(base());
});

test("DOCX parity: 변형(선택 필드 제거·질문 우선순위 변경·escape 문자)", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const f = base();
  delete f.report_meta.created_at;
  if (f.source_documents && f.source_documents[1]) delete f.source_documents[1].notes;
  f.kssb_areas[1].items[0].customer_questions[0].priority = "low";
  f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = '주입 <b>&"\' 테스트';
  assertContentParity(f);
});

test("DOCX parity: 금지 제어문자 포함 findings에서도 파트 콘텐츠 동일(sanitize 동등)", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = "제어\x00문자\x07포함\x1F인용";
  assertContentParity(f);
});

// ---- 구조 불변식(전문 대조가 완화돼도 경계 유지) ----

test("DOCX 구조 불변식: [Content_Types].xml first·word/document.xml 존재·파트 수 8", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const fp = writeFindings(base());
  const pyOut = path.join(tmpRoot, "py_inv.docx");
  assert.strictEqual(pythonDocx(fp, pyOut).status, 0);
  const py = unzipEntries(fs.readFileSync(pyOut));
  const nd = unzipEntries(R.docxBytes(base()));
  assert.strictEqual(nd.length, 8);
  assert.strictEqual(py.length, 8);
  assert.strictEqual(nd[0].name, "[Content_Types].xml");
  assert.ok(nd.some((e) => e.name === "word/document.xml"));
});

// ---- 결정성 parity ----

test("결정성 parity: Node·Python 각각 반복 실행 동일(콘텐츠 기준)", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  // Node는 컨테이너까지 결정적, Python도 콘텐츠 결정적 — 파트 콘텐츠 재실행 동일.
  const fp = writeFindings(base());
  const a = path.join(tmpRoot, "det_a.docx");
  const b = path.join(tmpRoot, "det_b.docx");
  assert.strictEqual(pythonDocx(fp, a).status, 0);
  assert.strictEqual(pythonDocx(fp, b).status, 0);
  assert.ok(fs.readFileSync(a).equals(fs.readFileSync(b)), "Python 반복 동일");
  assert.ok(R.docxBytes(base()).equals(R.docxBytes(base())), "Node 반복 동일");
});

// ---- 허용 차이 명시 기록: 컨테이너 봉투(압축 스트림)는 다를 수 있음 ----

test("허용 차이 기록: 콘텐츠는 동일하나 컨테이너 전체 byte parity는 보장 대상 아님", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const fp = writeFindings(base());
  const pyOut = path.join(tmpRoot, "py_diff.docx");
  assert.strictEqual(pythonDocx(fp, pyOut).status, 0);
  const py = fs.readFileSync(pyOut);
  const nd = R.docxBytes(base());
  // 콘텐츠는 파트별로 동일함이 위에서 증명됨. 컨테이너 전체 바이트는 같을 수도, 다를 수도 있다
  // (zlib 구현 차 — 큰 파트에서 압축 스트림 상이 가능). 어느 쪽이든 콘텐츠 parity가 gate다.
  // 이 테스트는 "동일해야 한다"고 강제하지 않는다(환경 의존 — 은폐 없이 명시 기록).
  const containerEqual = py.equals(nd);
  assert.ok(containerEqual === true || containerEqual === false,
    "컨테이너 byte 동일 여부는 관측값(강제 아님)");
});
