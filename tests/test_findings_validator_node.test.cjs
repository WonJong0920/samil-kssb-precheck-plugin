"use strict";
/**
 * Node findings validator 테스트 (2N-6 Phase 2 N1).
 *
 * Python reference 테스트(tests/test_findings_validator.py — 30 체크)의 fixture 변형을 동일하게
 * 재현해 Node 구현을 검증하고, CLI 계약(exit code·--json·--warnings-as-errors·로드 실패 2)과
 * additive quote 실재성 보조 점검(기본 꺼짐)을 추가로 검증한다.
 * 외부 의존성 0 — node:test 내장 러너. Python↔Node 동시 대조는 parity 스위트가 담당.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const V = require(path.join(REPO, "src", "validators", "kssb_findings_validator.cjs"));
const VALIDATOR_CJS = path.join(REPO, "src", "validators", "kssb_findings_validator.cjs");
const EXAMPLE = path.join(REPO, "src", "schemas", "kssb_findings_example.json");

function base() {
  return JSON.parse(fs.readFileSync(EXAMPLE, "utf-8"));
}

function codes(f) {
  return new Set(V.validateFindings(f).filter((i) => i.severity === "error").map((i) => i.code));
}

function codesFallback(f) {
  return new Set(V.validateFindings(f, { useJsonschema: false })
    .filter((i) => i.severity === "error").map((i) => i.code));
}

function warningCodes(f) {
  return new Set(V.validateFindings(f).filter((i) => i.severity === "warning").map((i) => i.code));
}

// --- Python 테스트 1~11 미러 ---

test("valid example → error 0건", () => {
  assert.deepStrictEqual([...codes(base())], []);
});

test("source_id cross-ref 검출", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].source_id = "does-not-exist";
  assert.ok(codes(f).has("anchor.source_id_ref"));
});

test("source_mode ↔ review_mode 불일치 검출", () => {
  const f = base();
  f.source_documents[0].source_mode = "customer_provided";
  assert.ok(codes(f).has("mode.source_mode_mismatch"));
});

test("judgment_label ↔ mode 불일치 검출", () => {
  const f = base();
  f.kssb_areas[0].items[0].judgment_label = "제공자료상 근거 확인";
  assert.ok(codes(f).has("mode.label_mismatch"));
});

test("빈 quote 검출", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = "";
  assert.ok(codes(f).has("anchor.quote_empty"));
});

test("customer_question 누락 필드 검출", () => {
  const f = base();
  delete f.kssb_areas[1].items[0].customer_questions[0].follow_up_action;
  assert.ok(codes(f).has("question.field"));
});

test("not_verifiable → questions 규칙 검출", () => {
  const f = base();
  for (const a of f.kssb_areas) for (const it of a.items) {
    if (it.judgment_code === "not_verifiable") it.customer_questions = [];
  }
  assert.ok(codes(f).has("sourcebound.questions"));
});

test("conflict → human_review 규칙 검출", () => {
  const f = base();
  for (const a of f.kssb_areas) for (const it of a.items) {
    if (it.judgment_code === "conflict_or_interpretation_needed") it.human_review_required = false;
  }
  assert.ok(codes(f).has("sourcebound.human_review"));
});

test("금지 표현(분석 필드) 검출", () => {
  const f = base();
  f.kssb_areas[0].items[0].recommendations = ["준수 확정 판정을 부여함"];
  assert.ok(codes(f).has("prohibited.term"));
});

test("고지 필드 negation 오탐 없음", () => {
  assert.ok(!codes(base()).has("prohibited.term"));
});

test("내부 경로 노출 검출", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].page_or_section = "C:\\Users\\me\\report.pdf";
  assert.ok(codes(f).has("path.internal_exposure"));
});

// --- Python 테스트 0'/12~17 미러 (fallback 모드 required 구조) ---

test("valid example fallback(no-jsonschema) → error 0건 + info 없음", () => {
  const issues = V.validateFindings(base(), { useJsonschema: false });
  assert.deepStrictEqual(issues.filter((i) => i.severity === "error"), []);
  assert.ok(!issues.some((i) => i.code === "schema.optional_skipped"));
});

test("기본 모드에서는 schema.optional_skipped info 1건(Python fallback 동등 의미)", () => {
  const infos = V.validateFindings(base()).filter((i) => i.severity === "info");
  assert.strictEqual(infos.length, 1);
  assert.strictEqual(infos[0].code, "schema.optional_skipped");
  assert.strictEqual(infos[0].location, "(schema)");
});

test("source_doc.title 누락 검출(fallback)", () => {
  const f = base();
  delete f.source_documents[0].title;
  assert.ok(codesFallback(f).has("source_doc.title"));
});

test("source_doc.source_mode 누락 검출(fallback)", () => {
  const f = base();
  delete f.source_documents[0].source_mode;
  assert.ok(codesFallback(f).has("source_doc.source_mode"));
});

test("area.area_id 누락 검출(fallback)", () => {
  const f = base();
  delete f.kssb_areas[0].area_id;
  assert.ok(codesFallback(f).has("area.area_id"));
});

test("area.area_name 누락 검출(fallback)", () => {
  const f = base();
  delete f.kssb_areas[0].area_name;
  assert.ok(codesFallback(f).has("area.area_name"));
});

test("area.items 누락 검출(fallback)", () => {
  const f = base();
  delete f.kssb_areas[0].items;
  assert.ok(codesFallback(f).has("area.items"));
});

test("judgment_label 누락 검출(fallback)", () => {
  const f = base();
  delete f.kssb_areas[0].items[0].judgment_label;
  assert.ok(codesFallback(f).has("item.field"));
});

// --- Python 테스트 18/24 미러 (detect-only) ---

test("detect-only: 검증이 findings를 변경하지 않음", () => {
  const f = base();
  const snapshot = JSON.stringify(f);
  V.validateFindings(f);
  assert.strictEqual(JSON.stringify(f), snapshot);
});

test("detect-only: 경로 포함 입력도 미변경", () => {
  const f = base();
  f.source_documents[0].notes = "/home/bob/x.pdf";
  const snapshot = JSON.stringify(f);
  V.validateFindings(f);
  assert.strictEqual(JSON.stringify(f), snapshot);
});

// --- Python 테스트 19~23 미러 (경로 노출 확장) ---

test("경로 노출 검출: /home/<user>/", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].page_or_section = "/home/alice/reports/hfg.pdf";
  assert.ok(codes(f).has("path.internal_exposure"));
});

test("경로 노출 검출: /var/folders/", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = "/var/folders/xy/abc123/T/extract.txt 참조";
  assert.ok(codes(f).has("path.internal_exposure"));
});

test("경로 노출 검출: %TEMP% / %USERPROFILE%", () => {
  let f = base();
  f.source_documents[0].notes = "%TEMP%\\sm_extract.txt";
  assert.ok(codes(f).has("path.internal_exposure"));
  f = base();
  f.source_documents[0].notes = "%USERPROFILE%\\Desktop\\report.pdf";
  assert.ok(codes(f).has("path.internal_exposure"));
});

test("경로 노출 검출: \\Temp\\", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = "D:\\work\\Temp\\out.md";
  assert.ok(codes(f).has("path.internal_exposure"));
});

test("valid example 확장 후에도 error 0 유지(오탐 없음)", () => {
  assert.deepStrictEqual([...codes(base())], []);
});

// --- Python 테스트 25~26 미러 (중복 인용 재사용) ---

test("동일 인용 재사용 → warning(error 아님)", () => {
  const f = base();
  const anchored = [];
  for (const a of f.kssb_areas) for (const it of a.items) {
    if (Array.isArray(it.evidence_anchors) && it.evidence_anchors.length) anchored.push(it);
  }
  assert.ok(anchored.length >= 2, `anchored=${anchored.length}`);
  anchored[1].evidence_anchors[0].quote = anchored[0].evidence_anchors[0].quote;
  assert.ok(warningCodes(f).has("evidence.duplicate_quote_reuse"));
  assert.ok(!codes(f).has("evidence.duplicate_quote_reuse"));
});

test("valid example 중복 인용 warning 없음", () => {
  assert.ok(!warningCodes(base()).has("evidence.duplicate_quote_reuse"));
});

// --- Node 추가: Phase 3-B v1 detect-only warnings (R1 within-item quote / R2 missing_info blank) ---

const R1_MSG = "동일 항목 안에서 같은 인용이 여러 evidence_anchors에 반복 사용되었습니다. 중복 근거인지 사람 검수가 필요합니다.";
const R2_MSG = "missing_info에 공백문자만 있는 항목이 있습니다. 실제 부족 정보 문구를 쓰거나 제거해야 합니다.";

function issuesByCode(f, code) {
  return V.validateFindings(f).filter((i) => i.code === code);
}
function firstAnchoredItem(f) {
  for (let ai = 0; ai < f.kssb_areas.length; ai++) {
    const items = f.kssb_areas[ai].items;
    for (let ii = 0; ii < items.length; ii++) {
      const anchors = items[ii].evidence_anchors;
      if (Array.isArray(anchors) && anchors.length >= 1
          && typeof anchors[0].quote === "string" && anchors[0].quote.trim()) {
        return { it: items[ii], loc: `kssb_areas[${ai}].items[${ii}]` };
      }
    }
  }
  return null;
}
function firstMissingInfoItem(f) {
  for (let ai = 0; ai < f.kssb_areas.length; ai++) {
    const items = f.kssb_areas[ai].items;
    for (let ii = 0; ii < items.length; ii++) {
      if (Array.isArray(items[ii].missing_info) && items[ii].missing_info.length >= 1) {
        return { it: items[ii], loc: `kssb_areas[${ai}].items[${ii}]` };
      }
    }
  }
  return null;
}

test("R1: valid example → within-item 중복 quote warning 없음", () => {
  assert.ok(!warningCodes(base()).has("evidence.duplicate_quote_within_item"));
});

test("R1: 같은 item 내 동일 quote 2회 → warning 1건(첫 anchor 위치·문구·warning-only)", () => {
  const f = base();
  const { it, loc } = firstAnchoredItem(f);
  const a0 = it.evidence_anchors[0];
  it.evidence_anchors.push({ source_id: a0.source_id, quote: a0.quote, page_or_section: "p.2", relevance_note: "재인용" });
  const w = issuesByCode(f, "evidence.duplicate_quote_within_item");
  assert.strictEqual(w.length, 1);
  assert.strictEqual(w[0].severity, "warning");
  assert.strictEqual(w[0].code, "evidence.duplicate_quote_within_item");
  assert.strictEqual(w[0].location, `${loc}.evidence_anchors[0].quote`);
  assert.strictEqual(w[0].message, R1_MSG);
  assert.strictEqual([...codes(f)].length, 0); // warning-only, 신규 error 없음
});

test("R1: 같은 item 내 동일 quote 3회 → warning 여전히 1건(item+quote당 1건)", () => {
  const f = base();
  const { it } = firstAnchoredItem(f);
  const a0 = it.evidence_anchors[0];
  it.evidence_anchors.push({ source_id: a0.source_id, quote: a0.quote, page_or_section: "p.2" });
  it.evidence_anchors.push({ source_id: a0.source_id, quote: a0.quote, page_or_section: "p.3" });
  assert.strictEqual(issuesByCode(f, "evidence.duplicate_quote_within_item").length, 1);
});

test("R1: 한 item 내 서로 다른 두 quote가 각각 반복 → warning 2건(첫 등장순)", () => {
  const f = base();
  const { it, loc } = firstAnchoredItem(f);
  const a0 = it.evidence_anchors[0];
  const qA = a0.quote;
  const qB = `${qA} (B 변형)`;
  it.evidence_anchors = [
    { source_id: a0.source_id, quote: qA },
    { source_id: a0.source_id, quote: qA },
    { source_id: a0.source_id, quote: qB },
    { source_id: a0.source_id, quote: qB },
  ];
  const w = issuesByCode(f, "evidence.duplicate_quote_within_item");
  assert.strictEqual(w.length, 2);
  assert.strictEqual(w[0].location, `${loc}.evidence_anchors[0].quote`);
  assert.strictEqual(w[1].location, `${loc}.evidence_anchors[2].quote`);
});

test("R1: within-item 반복이면서 cross-item은 아니면 duplicate_quote_reuse는 없음", () => {
  const f = base();
  const { it } = firstAnchoredItem(f);
  const a0 = it.evidence_anchors[0];
  it.evidence_anchors.push({ source_id: a0.source_id, quote: a0.quote });
  assert.ok(warningCodes(f).has("evidence.duplicate_quote_within_item"));
  assert.ok(!warningCodes(f).has("evidence.duplicate_quote_reuse"));
});

test("R2: valid example → missing_info.blank_item warning 없음", () => {
  assert.ok(!warningCodes(base()).has("missing_info.blank_item"));
});

test("R2: missing_info 공백문자만 원소 → warning 1건(정확 위치·문구·warning-only)", () => {
  const f = base();
  const mi = firstMissingInfoItem(f);
  assert.ok(mi, "missing_info 있는 item 필요");
  const j = mi.it.missing_info.length;
  mi.it.missing_info.push("   ");
  const w = issuesByCode(f, "missing_info.blank_item");
  assert.strictEqual(w.length, 1);
  assert.strictEqual(w[0].severity, "warning");
  assert.strictEqual(w[0].code, "missing_info.blank_item");
  assert.strictEqual(w[0].location, `${mi.loc}.missing_info[${j}]`);
  assert.strictEqual(w[0].message, R2_MSG);
  assert.strictEqual([...codes(f)].length, 0); // warning-only
});

test("R2: 빈 문자열/탭/줄바꿈만 있는 원소도 검출", () => {
  for (const blank of ["", "\t", "\n", " \t \n "]) {
    const f = base();
    const mi = firstMissingInfoItem(f);
    mi.it.missing_info.push(blank);
    assert.strictEqual(issuesByCode(f, "missing_info.blank_item").length, 1, `blank=${JSON.stringify(blank)}`);
  }
});

test("R2: missing_info=[]는 R2 아님(기존 sourcebound가 담당)", () => {
  const f = base();
  let touched = false;
  for (const a of f.kssb_areas) for (const it of a.items) {
    if (it.judgment_code === "not_verifiable") { it.missing_info = []; touched = true; }
  }
  assert.ok(touched, "not_verifiable item 필요");
  const issues = V.validateFindings(f);
  assert.ok(!issues.some((i) => i.code === "missing_info.blank_item"));
  assert.ok(issues.some((i) => i.code === "sourcebound.missing_info")); // 기존 규칙이 담당
});

test("R2: string 아닌 원소는 v1 대상 아님", () => {
  const f = base();
  const mi = firstMissingInfoItem(f);
  mi.it.missing_info.push(123, null, {});
  assert.ok(!warningCodes(f).has("missing_info.blank_item"));
});

test("detect-only: R1/R2 트리거 findings도 검증이 원본을 변경하지 않음", () => {
  const f = base();
  const { it } = firstAnchoredItem(f);
  const a0 = it.evidence_anchors[0];
  it.evidence_anchors.push({ source_id: a0.source_id, quote: a0.quote });
  const mi = firstMissingInfoItem(f);
  mi.it.missing_info.push("   ");
  const snapshot = JSON.stringify(f);
  V.validateFindings(f);
  assert.strictEqual(JSON.stringify(f), snapshot);
});

// --- Node 추가: 구조/모드 경계 ---

test("root가 객체 아님 → structure.root 단독 error", () => {
  const issues = V.validateFindings([]);
  assert.strictEqual(issues.length, 1);
  assert.strictEqual(issues[0].code, "structure.root");
});

test("알 수 없는 review_mode / judgment_code / priority 검출", () => {
  let f = base();
  f.report_meta.review_mode = "unknown_mode";
  assert.ok(codes(f).has("mode.review_mode"));
  f = base();
  f.kssb_areas[0].items[0].judgment_code = "approved";
  assert.ok(codes(f).has("item.judgment_code"));
  f = base();
  f.kssb_areas[1].items[0].customer_questions[0].priority = "urgent";
  assert.ok(codes(f).has("question.priority"));
});

test("prohibited_terms.md 파싱: 백업 목록 아닌 파일 기반 + 로드 실패 시 warning", () => {
  const { terms, warn } = V.loadProhibitedTerms(null);
  assert.strictEqual(warn, null);
  assert.ok(terms.includes("준수 확정"));
  assert.ok(terms.some((t) => t.includes("감사 의견"))); // 판정명 라인 다어절
  const missing = V.loadProhibitedTerms(path.join(os.tmpdir(), "does-not-exist-terms.md"));
  assert.ok(missing.warn && missing.warn.includes("백업 목록 사용"));
  assert.ok(missing.terms.includes("준수 확정"));
});

// --- Node 추가: CLI 계약 ---

function runCli(args, cwd = REPO) {
  return spawnSync(process.execPath, [VALIDATOR_CJS, ...args], { cwd, encoding: "utf-8" });
}

test("CLI: valid example → exit 0, 요약 출력", () => {
  const r = runCli([EXAMPLE]);
  assert.strictEqual(r.status, 0);
  assert.ok(r.stdout.includes("요약: error 0건, warning 0건, info 1건."));
});

test("CLI: --json → 파싱 가능한 JSON 배열(severity/code/location/message 키)", () => {
  const r = runCli([EXAMPLE, "--json"]);
  assert.strictEqual(r.status, 0);
  const arr = JSON.parse(r.stdout);
  assert.ok(Array.isArray(arr));
  assert.strictEqual(arr.length, 1); // info schema.optional_skipped
  assert.deepStrictEqual(Object.keys(arr[0]), ["severity", "code", "location", "message"]);
});

test("CLI: --no-jsonschema → 이슈 0건, exit 0", () => {
  const r = runCli([EXAMPLE, "--json", "--no-jsonschema"]);
  assert.strictEqual(r.status, 0);
  assert.deepStrictEqual(JSON.parse(r.stdout), []);
});

test("CLI: error 있는 findings → exit 1", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = "";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "n1-vald-"));
  try {
    const fp = path.join(tmp, "bad.json");
    fs.writeFileSync(fp, JSON.stringify(f), "utf-8");
    const r = runCli([fp]);
    assert.strictEqual(r.status, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("CLI: --warnings-as-errors → warning만 있어도 exit 1", () => {
  const f = base();
  const anchored = [];
  for (const a of f.kssb_areas) for (const it of a.items) {
    if (Array.isArray(it.evidence_anchors) && it.evidence_anchors.length) anchored.push(it);
  }
  anchored[1].evidence_anchors[0].quote = anchored[0].evidence_anchors[0].quote;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "n1-vald-"));
  try {
    const fp = path.join(tmp, "warn.json");
    fs.writeFileSync(fp, JSON.stringify(f), "utf-8");
    assert.strictEqual(runCli([fp]).status, 0);
    assert.strictEqual(runCli([fp, "--warnings-as-errors"]).status, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("CLI: findings 로드 실패 → exit 2 + stderr 안내", () => {
  const r = runCli([path.join(os.tmpdir(), "no-such-findings.json")]);
  assert.strictEqual(r.status, 2);
  assert.ok(r.stderr.includes("findings 로드 실패"));
});

test("CLI: 인자 없음/알 수 없는 플래그 → exit 2 + usage", () => {
  assert.strictEqual(runCli([]).status, 2);
  assert.strictEqual(runCli([EXAMPLE, "--bogus"]).status, 2);
});

// --- Node 추가: quote 실재성 보조 점검(additive, 기본 꺼짐) ---

test("quote check: 기본(원문 미제공)에는 실행되지 않음", () => {
  const issues = V.validateFindings(base());
  assert.ok(!issues.some((i) => i.code === "quote.source_not_found"));
});

test("quote check: 원문에 전 인용 존재 → warning 없음(공백 정규화 포함)", () => {
  const f = base();
  const quotes = [];
  for (const a of f.kssb_areas) for (const it of a.items) {
    for (const anc of it.evidence_anchors || []) quotes.push(anc.quote);
  }
  const sourceText = "머리말\n" + quotes.map((q) => q.replace(/ /g, "  \n")).join("\n중간\n") + "\n꼬리";
  const issues = V.validateFindings(f, { sourceTexts: [sourceText] });
  assert.ok(!issues.some((i) => i.code === "quote.source_not_found"));
});

test("quote check: 원문에 없는 인용 → warning(quote.source_not_found), error 아님", () => {
  const f = base();
  const issues = V.validateFindings(f, { sourceTexts: ["전혀 다른 원문 텍스트입니다."] });
  const hits = issues.filter((i) => i.code === "quote.source_not_found");
  assert.ok(hits.length >= 1);
  assert.ok(hits.every((i) => i.severity === "warning"));
  // 기존 parity 결과(error 0)를 깨지 않는다
  assert.strictEqual(issues.filter((i) => i.severity === "error").length, 0);
});

test("quote check CLI: --source-text 부재 파일 → warning으로 보고(quote.source_text_load), 검증은 계속", () => {
  const r = runCli([EXAMPLE, "--json", "--source-text", path.join(os.tmpdir(), "no-src.txt")]);
  assert.strictEqual(r.status, 0);
  const arr = JSON.parse(r.stdout);
  assert.ok(arr.some((i) => i.code === "quote.source_text_load" && i.severity === "warning"));
});

test("detect-only: quote check 경로도 findings 미변경", () => {
  const f = base();
  const snapshot = JSON.stringify(f);
  V.validateFindings(f, { sourceTexts: ["아무 원문"] });
  assert.strictEqual(JSON.stringify(f), snapshot);
});
