"use strict";
/**
 * Node ↔ Python delivery/renderer 비교 테스트 (2N-6 Phase 2 N2).
 *
 * Python renderer/delivery(transitional reference — 무변경)를 기준으로, 동일 findings에 대해:
 * ① renderer 수준 — Python `kssb_report_renderer.py --html-only` 산출 HTML/MD와 Node 산출을
 *    **개행 정규화 후 전문 비교**(N2 이식은 문구·섹션까지 동일 설계) + 구조 불변식(섹션/항목/근거/질문 수,
 *    judgment label 보존) 재확인 — 전문 비교가 미래에 완화되어도 불변식이 경계를 지킨다.
 * ② delivery 수준 — 정상 findings에서 양쪽 exit 0·preflight error 0 요약. **D94 의도된 차이**:
 *    error findings에서 Python(reference)은 경고 후 생성 계속, Node는 hard stop(exit 4·산출물 0)을
 *    **명시적으로 기록**한다(divergence 은폐 금지 — D94/D92 정책).
 *
 * Python 미탐지 시 해당 테스트는 명시적 skip(사유 출력 — 개발기 reference 대조용).
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const R = require(path.join(REPO, "src", "renderers", "kssb_report_renderer.cjs"));
const DELIVERY_CJS = path.join(REPO, "src", "renderers", "kssb_report_delivery.cjs");
const RENDERER_PY = path.join(REPO, "src", "renderers", "kssb_report_renderer.py");
const DELIVERY_PY = path.join(REPO, "src", "renderers", "kssb_report_delivery.py");
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

function base() {
  return JSON.parse(fs.readFileSync(EXAMPLE, "utf-8"));
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
}

function mdInvariants(md) {
  const items = (md.match(/^#### /gm) || []).length;
  const anchors = (md.match(/^ {2}- 인용: /gm) || []).length;
  const headings = (md.match(/^## .+$/gm) || []).map((s) => s.trim());
  const qSection = md.split("## 4. 고객 확인 질문 및 요청자료")[1].split("## 5.")[0];
  const qRows = qSection.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| 항목ID") && !l.startsWith("|---")).length;
  const labels = (md.match(/^- \*\*판정\*\*: .+$/gm) || []).map((s) => s.replace("- **판정**: ", "").trim()).sort();
  return { items, anchors, headings, qRows, labels };
}

let tmpRoot = null;
test.before(() => { tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "n2-parity-")); });
test.after(() => { if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true }); });

test("전제: Python reference 실행 파일 존재", (t) => {
  if (!PY) { t.skip("Python 3 미탐지(SAMIL_PARITY_PY로 지정 가능)"); return; }
  assert.ok(PY);
});

test("renderer parity: 동일 findings → HTML/MD 전문 일치(개행 정규화) + 파일명 동일", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const pyDir = path.join(tmpRoot, "py_render");
  const ndDir = path.join(tmpRoot, "node_render");
  const rp = spawnSync(PY, [RENDERER_PY, EXAMPLE, "-o", pyDir, "--html-only"],
    { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 120000 });
  assert.strictEqual(rp.status, 0, rp.stderr);
  const out = R.renderReport(base(), ndDir);

  const pyFiles = fs.readdirSync(pyDir).sort();
  const ndFiles = fs.readdirSync(ndDir).sort();
  assert.deepStrictEqual(ndFiles, pyFiles, "산출 파일명 집합 동일(HTML/MD)");

  for (const name of ndFiles) {
    const pyText = norm(fs.readFileSync(path.join(pyDir, name), "utf-8"));
    const ndText = norm(fs.readFileSync(path.join(ndDir, name), "utf-8"));
    assert.strictEqual(ndText, pyText, `전문 불일치: ${name}`);
  }
  assert.ok(out.html.endsWith(".html"));
});

test("renderer parity: 변형 findings(중복 질문·미기재 필드)에서도 전문 일치", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const f = base();
  // 표기 경로를 폭넓게 지나도록 변형: 선택 필드 제거·질문 우선순위 섞기(재판정 아님 — 입력 변형)
  delete f.report_meta.created_at;
  delete f.source_documents[1].notes;
  f.kssb_areas[1].items[0].customer_questions[0].priority = "low";
  const file = path.join(tmpRoot, "variant.json");
  fs.writeFileSync(file, JSON.stringify(f, null, 1), "utf-8");

  const pyDir = path.join(tmpRoot, "py_render_v");
  const ndDir = path.join(tmpRoot, "node_render_v");
  const rp = spawnSync(PY, [RENDERER_PY, file, "-o", pyDir, "--html-only"],
    { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 120000 });
  assert.strictEqual(rp.status, 0, rp.stderr);
  R.renderReport(JSON.parse(fs.readFileSync(file, "utf-8")), ndDir);

  const pyFiles = fs.readdirSync(pyDir).sort();
  const ndFiles = fs.readdirSync(ndDir).sort();
  assert.deepStrictEqual(ndFiles, pyFiles);
  for (const name of ndFiles) {
    assert.strictEqual(
      norm(fs.readFileSync(path.join(ndDir, name), "utf-8")),
      norm(fs.readFileSync(path.join(pyDir, name), "utf-8")),
      `전문 불일치: ${name}`);
  }
});

test("구조 불변식: 섹션/항목/근거/질문 수·judgment label이 Python MD와 동일", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const pyDir = path.join(tmpRoot, "py_render_inv");
  spawnSync(PY, [RENDERER_PY, EXAMPLE, "-o", pyDir, "--html-only"],
    { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 120000 });
  const pyMd = norm(fs.readFileSync(path.join(pyDir, fs.readdirSync(pyDir).find((n) => n.endsWith(".md"))), "utf-8"));
  const ndMd = R.renderMarkdown(base());
  assert.deepStrictEqual(mdInvariants(ndMd), mdInvariants(pyMd));
});

test("delivery parity: 정상 findings — 양쪽 exit 0·preflight error 0 요약", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const pyDir = path.join(tmpRoot, "py_deliv");
  const ndDir = path.join(tmpRoot, "node_deliv");
  const rp = spawnSync(PY, [DELIVERY_PY, EXAMPLE, "-o", pyDir, "--html-only"],
    { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 120000 });
  const rn = spawnSync(process.execPath, [DELIVERY_CJS, EXAMPLE, "-o", ndDir],
    { cwd: REPO, encoding: "utf-8", timeout: 120000 });
  assert.strictEqual(rp.status, 0, rp.stderr);
  assert.strictEqual(rn.status, 0, rn.stderr);
  assert.ok(rp.stdout.includes("error 0건"));
  assert.ok(rn.stdout.includes("error 0건"));
  // 생성 파일명(HTML/MD) 동일 — Python은 --html-only로 DOCX 생략, Node는 원래 미생성
  const pyFiles = fs.readdirSync(pyDir).filter((n) => !n.endsWith(".docx")).sort();
  const ndFiles = fs.readdirSync(ndDir).sort();
  assert.deepStrictEqual(ndFiles, pyFiles);
});

test("D94 의도된 차이 기록: error findings — Python(reference)은 생성 계속, Node는 hard stop", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = ""; // preflight error
  const file = path.join(tmpRoot, "bad.json");
  fs.writeFileSync(file, JSON.stringify(f), "utf-8");

  // Python reference(무변경 — D92 ③): error가 있어도 경고 문구와 함께 생성 계속(exit 0)
  const pyDir = path.join(tmpRoot, "py_deliv_bad");
  const rp = spawnSync(PY, [DELIVERY_PY, file, "-o", pyDir, "--html-only"],
    { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 120000 });
  assert.strictEqual(rp.status, 0, "Python reference는 정책상 무변경(생성 계속)");
  assert.ok(rp.stdout.includes("error 1건"));
  assert.ok(fs.readdirSync(pyDir).length >= 1, "Python은 산출물 생성(reference 동작)");

  // Node(N2 — D94 구현): hard stop, 산출물 0, exit 4
  const ndDir = path.join(tmpRoot, "node_deliv_bad");
  const rn = spawnSync(process.execPath, [DELIVERY_CJS, file, "-o", ndDir],
    { cwd: REPO, encoding: "utf-8", timeout: 120000 });
  assert.strictEqual(rn.status, 4);
  assert.ok(!fs.existsSync(ndDir));
  assert.ok(rn.stdout.includes("보고서 생성을 중단했습니다"));
});
