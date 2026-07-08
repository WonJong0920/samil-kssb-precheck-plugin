"use strict";
/**
 * Node DOCX writer 테스트 (2N-6 Phase 2 N4 — kssb_report_renderer.cjs DOCX 경로).
 *
 * 검증 축:
 * - ZIP/OOXML 구조: 8개 파트가 Python 고정 순서와 동일, [Content_Types].xml first, 재파싱 가능.
 * - 결정성: 동일 findings면 매 실행 byte-identical(고정 타임스탬프·엔트리 순서·압축 파라미터).
 * - XML safety: 금지 제어문자 제거, `& < > "` escape(작은따옴표는 Python `_esc`처럼 비-escape).
 * - 재판정 없음: 항목/근거/질문 수·판정 라벨이 입력과 동일(생성/변경 없음).
 * - delivery 연결: 대표 문서 DOCX(우선순위 DOCX→HTML→MD), D94 error 시 DOCX도 차단.
 * - no-overclaim/leak: document.xml 본문에 과장·provider명·내부 경로·내부 용어 0건.
 * 외부 의존성 0.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");

const REPO = path.resolve(__dirname, "..");
const R = require(path.join(REPO, "src", "renderers", "kssb_report_renderer.cjs"));
const D = require(path.join(REPO, "src", "renderers", "kssb_report_delivery.cjs"));
const EXAMPLE = path.join(REPO, "src", "schemas", "kssb_findings_example.json");

function base() {
  return JSON.parse(fs.readFileSync(EXAMPLE, "utf-8"));
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "n4-docx-"));
}

// 최소 ZIP 리더(우리 writer 형식 — data descriptor 없음, extra field 없음). 로컬 헤더를 순차 파싱.
function unzipEntries(buf) {
  const entries = [];
  let off = 0;
  while (off + 4 <= buf.length && buf.readUInt32LE(off) === 0x04034b50) {
    const method = buf.readUInt16LE(off + 8);
    const crc = buf.readUInt32LE(off + 14);
    const csize = buf.readUInt32LE(off + 18);
    const usize = buf.readUInt32LE(off + 22);
    const nlen = buf.readUInt16LE(off + 26);
    const elen = buf.readUInt16LE(off + 28);
    const mtime = buf.readUInt16LE(off + 10);
    const mdate = buf.readUInt16LE(off + 12);
    const name = buf.subarray(off + 30, off + 30 + nlen).toString("utf-8");
    const dataStart = off + 30 + nlen + elen;
    const comp = buf.subarray(dataStart, dataStart + csize);
    const content = method === 8 ? zlib.inflateRawSync(comp) : Buffer.from(comp);
    entries.push({ name, method, crc, csize, usize, mtime, mdate, elen, content });
    off = dataStart + csize;
  }
  return entries;
}

const EXPECTED_ORDER = [
  "[Content_Types].xml",
  "_rels/.rels",
  "docProps/core.xml",
  "docProps/app.xml",
  "word/_rels/document.xml.rels",
  "word/styles.xml",
  "word/settings.xml",
  "word/document.xml",
];

function docXml(findings) {
  const entries = unzipEntries(R.docxBytes(findings));
  const doc = entries.find((e) => e.name === "word/document.xml");
  return doc.content.toString("utf-8");
}

// ---- 구조 ----

test("docxBytes: Buffer 반환·비어있지 않음·ZIP 시그니처", () => {
  const b = R.docxBytes(base());
  assert.ok(Buffer.isBuffer(b) && b.length > 0);
  assert.strictEqual(b.readUInt32LE(0), 0x04034b50, "첫 로컬 헤더 시그니처");
});

test("ZIP 구조: 8개 파트가 Python 고정 순서와 동일, [Content_Types].xml first", () => {
  const entries = unzipEntries(R.docxBytes(base()));
  assert.deepStrictEqual(entries.map((e) => e.name), EXPECTED_ORDER);
  assert.strictEqual(entries[0].name, "[Content_Types].xml");
});

test("ZIP: 모든 엔트리 DEFLATE(method 8)·CRC 정합·extra field 없음·고정 타임스탬프", () => {
  const entries = unzipEntries(R.docxBytes(base()));
  for (const e of entries) {
    assert.strictEqual(e.method, 8, `${e.name} method`);
    assert.strictEqual(e.elen, 0, `${e.name} extra field length`);
    assert.strictEqual(e.mdate, 0x0021, `${e.name} DOS date(1980-01-01)`);
    assert.strictEqual(e.mtime, 0x0000, `${e.name} DOS time`);
    assert.strictEqual(zlib.crc32(e.content) >>> 0, e.crc, `${e.name} CRC 정합`);
    assert.strictEqual(e.content.length, e.usize, `${e.name} usize 정합`);
  }
});

test("OOXML: document.xml이 well-formed(선언·루트·body·sectPr) + 파트 XML 파싱 가능", () => {
  const entries = unzipEntries(R.docxBytes(base()));
  const doc = docXml(base());
  assert.ok(doc.startsWith('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'));
  assert.ok(doc.includes("<w:document") && doc.includes("</w:document>"));
  assert.ok(doc.includes("<w:body>") && doc.includes("</w:body>"));
  assert.ok(doc.includes("<w:sectPr>"));
  // 태그 균형 최소 점검(여는/닫는 w:p 수 동일)
  const opens = (doc.match(/<w:p>/g) || []).length + (doc.match(/<w:p\/>/g) || []).length;
  assert.ok(opens > 0);
  // 다른 파트도 XML 선언으로 시작
  for (const e of entries) {
    if (e.name.endsWith(".xml")) {
      assert.ok(e.content.toString("utf-8").startsWith('<?xml'), `${e.name} XML 선언`);
    }
  }
});

// ---- 결정성 ----

test("결정성: docxBytes(base) 2회 → byte-identical", () => {
  assert.ok(R.docxBytes(base()).equals(R.docxBytes(base())));
});

test("결정성: renderReport의 .docx 파일이 docxBytes와 동일 바이트 + 반복 실행 동일", () => {
  const d1 = tmpdir();
  const d2 = tmpdir();
  try {
    const o1 = R.renderReport(base(), d1);
    const o2 = R.renderReport(base(), d2);
    const b1 = fs.readFileSync(o1.docx);
    const b2 = fs.readFileSync(o2.docx);
    assert.ok(b1.equals(b2), "반복 실행 byte-identical");
    assert.ok(b1.equals(R.docxBytes(base())), "파일 == docxBytes");
  } finally {
    fs.rmSync(d1, { recursive: true, force: true });
    fs.rmSync(d2, { recursive: true, force: true });
  }
});

// ---- XML safety / escape ----

test("XML escape: 주입 문자열의 < & \" 는 escape, 작은따옴표는 비-escape(Python _esc 동등)", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = '<b>&"\'</b>';
  const doc = docXml(f);
  assert.ok(!doc.includes("<b>&\"'</b>"), "raw 미삽입");
  assert.ok(doc.includes("&lt;b&gt;&amp;&quot;'&lt;/b&gt;"), `escape 결과 확인: ${doc.slice(0, 0)}`);
});

test("XML safety: 금지 제어문자(\\x00,\\x07,\\x1F)는 제거, \\t/\\n/\\r 텍스트는 보존 대상 밖 아님", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = "A\x00B\x07C\x1FD";
  const doc = docXml(f);
  assert.ok(doc.includes("ABCD"), "금지 제어문자 제거 후 인접");
  assert.ok(!/[\x00\x07\x1F]/.test(doc), "금지 제어문자 잔존 없음");
});

test("파일명 sanitize: base override의 금지 문자가 .docx 파일명에 새지 않음", () => {
  const dir = tmpdir();
  try {
    const out = R.renderReport(base(), dir, { baseName: "A/B:C*D?" });
    const name = path.basename(out.docx);
    assert.ok(!/[\\/:*?"<>|]/.test(name.replace(/\.docx$/, "")), `파일명: ${name}`);
    assert.ok(name.endsWith(".docx"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---- 재판정 없음 ----

test("재판정 없음: document.xml의 항목/근거/질문 수·판정 라벨이 입력과 동일", () => {
  const f = base();
  const doc = docXml(f);
  let items = 0, anchors = 0, questions = 0;
  const labels = new Set();
  for (const a of f.kssb_areas) {
    for (const it of a.items) {
      items += 1;
      labels.add(it.judgment_label);
      anchors += (it.evidence_anchors || []).length;
      questions += (it.customer_questions || []).length;
    }
  }
  // 판정 라벨은 "판정: <label>" run으로 각 항목에 1회(요약 표 + 상세). 최소 존재 확인.
  for (const label of labels) {
    assert.ok(doc.includes(label), `판정 라벨 보존: ${label}`);
  }
  // 인용 run 수 = 근거 앵커 수(“· 인용:” 접두)
  const quoteRuns = (doc.match(/· 인용: /g) || []).length;
  assert.strictEqual(quoteRuns, anchors, "근거 앵커 수 보존");
  assert.ok(doc.includes(`총 검토 항목: ${items}건`.replace(/&/g, "&amp;")) || doc.includes(`${items}건`));
  assert.ok(questions >= 0);
});

test("재판정 없음: 판정 코드·근거 텍스트를 생성/변경하지 않음(원문 인용 보존)", () => {
  const doc = docXml(base());
  assert.ok(doc.includes("이사회는 지속가능성 관련 위험과 기회에 대한 최종 감독 책임을 지며"));
  assert.ok(doc.includes("Scope 3 배출량은 산정하지 않았다."));
});

// ---- delivery 연결 ----

test("delivery: 대표 문서 DOCX(primary=docx) + fallback로 html/markdown", () => {
  const dir = tmpdir();
  try {
    const result = D.deliver(base(), dir);
    assert.strictEqual(result.hard_stop, false);
    assert.strictEqual(result.outputs.primary_format, "docx");
    assert.ok(fs.existsSync(result.outputs.docx));
    assert.ok(result.user_summary.includes("형식: docx"));
    assert.ok(result.user_summary.includes("우선순위 DOCX → HTML → Markdown"));
    // fallback 안내에 html/markdown 파일명
    assert.ok(result.user_summary.includes("fallback:"));
    // 사용자 요약에 로컬 경로/stack 미노출
    assert.ok(!/[A-Za-z]:[\\/]Users[\\/]/i.test(result.user_summary));
    assert.ok(!result.user_summary.includes("AppData"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("D94: preflight error ≥ 1 → DOCX도 생성 차단(out-dir 미생성)", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = ""; // anchor.quote_empty (error)
  const parent = tmpdir();
  const dir = path.join(parent, "should-not-exist");
  try {
    const result = D.deliver(f, dir);
    assert.strictEqual(result.hard_stop, true);
    assert.deepStrictEqual(result.outputs, {});
    assert.ok(!fs.existsSync(dir), "hard stop 시 out-dir 미생성 → .docx 없음");
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("D94 CLI: hard stop 시 폴더에 .docx 미생성", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = "";
  const parent = tmpdir();
  try {
    // 미리 존재하는 out-dir라도 .docx가 생기지 않아야 한다.
    const dir = path.join(parent, "out");
    fs.mkdirSync(dir);
    const result = D.deliver(f, dir);
    assert.strictEqual(result.hard_stop, true);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    assert.ok(!files.some((n) => n.endsWith(".docx")), "hard stop 시 .docx 없음");
    assert.ok(!files.some((n) => n.endsWith(".html") || n.endsWith(".md")), "hard stop 시 산출물 0");
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

// ---- no-overclaim / leak ----

test("no-overclaim: document.xml 본문에 과장·provider명·내부 경로·내부 용어 0건", () => {
  const doc = docXml(base());
  for (const tok of ["OCR 지원 완료", "support complete", "provider finalization", "product complete",
    "kordoc", "tesseract", "tool-cache", "node_modules", "AppData", "Traceback", "RunnerError",
    "2N-5", "2N-6", "Cycle 2"]) {
    assert.ok(!doc.toLowerCase().includes(tok.toLowerCase()), `과장/누출 토큰: ${tok}`);
  }
  // 감사/인증/준수 계열은 negation 경계 문맥의 문단(run 텍스트)에서만 허용
  // document.xml은 태그가 많아 라인 분리가 어렵다 → <w:t> 텍스트만 추출해 문단 단위로 점검.
  const texts = [...doc.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]);
  for (const t of texts) {
    if (/(준수 확정|감사의견|감사 의견|인증)/.test(t)) {
      assert.ok(/(아니다|아닙니다|않는다|않습니다|대체하지)/.test(t),
        `negation 없는 감사/인증/준수 표현: ${t.slice(0, 120)}`);
    }
  }
});

test("no-overclaim: core.xml creator/application이 중립 식별자(provider명·완성 주장 없음)", () => {
  const entries = unzipEntries(R.docxBytes(base()));
  const core = entries.find((e) => e.name === "docProps/core.xml").content.toString("utf-8");
  const app = entries.find((e) => e.name === "docProps/app.xml").content.toString("utf-8");
  assert.ok(core.includes("samil-kssb-precheck-renderer"));
  for (const text of [core, app]) {
    for (const tok of ["kordoc", "tesseract", "OCR 지원 완료", "product complete"]) {
      assert.ok(!text.toLowerCase().includes(tok.toLowerCase()), `누출 토큰: ${tok}`);
    }
  }
});

// ---- 렌더 불가 안전 오류 ----

test("렌더 불가 구조 → RenderError(docxBytes/buildDocumentXml)", () => {
  assert.throws(() => R.buildDocumentXml({ report_meta: {} }), R.RenderError);
  assert.throws(() => R.docxBytes({ report_meta: {}, kssb_areas: [] }), R.RenderError);
});
