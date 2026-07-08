"use strict";
/**
 * Node ↔ Python findings validator golden parity 테스트 (2N-6 Phase 2 N1).
 *
 * Python reference(`src/validators/kssb_findings_validator.py`)를 golden으로 삼아, 동일 fixture
 * 파일에 대해 두 CLI를 각각 실행(`--json --no-jsonschema` — 표준 라이브러리 fallback 경로, 방식 A)하고
 * 다음을 **순서 포함** 대조한다: exit code · 이슈 개수 · 각 이슈의 (severity, code, location, message).
 *
 * message 비교 예외(문서화 — 완료 보고서 참조): `schema.*` 코드와 `prohibited.list_load`(경로 포함)만
 * 메시지 문구 비교에서 제외한다(의미 동일·표기 상이). 그 외 전 메시지는 완전 일치를 요구한다.
 *
 * Python 실행 파일 탐색: env `SAMIL_PARITY_PY` → `%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe`
 * → PATH의 `python`(버전 실측). 없으면 스위트를 skip 처리하되 사유를 출력한다(개발기 reference 대조용 —
 * 최종 사용자 런타임 요건 아님).
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const VALIDATOR_CJS = path.join(REPO, "src", "validators", "kssb_findings_validator.cjs");
const VALIDATOR_PY = path.join(REPO, "src", "validators", "kssb_findings_validator.py");
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
    } catch { /* 후보 없음 — 다음 */ }
  }
  return null;
}

const PY = findPython();

function base() {
  return JSON.parse(fs.readFileSync(EXAMPLE, "utf-8"));
}

// --- fixture 정의: Python 테스트(tests/test_findings_validator.py)의 변형 + 경계 확장 ---
const FIXTURES = [
  ["valid_base", (f) => f],
  ["anchor_source_id_ref", (f) => { f.kssb_areas[0].items[0].evidence_anchors[0].source_id = "does-not-exist"; return f; }],
  ["anchor_source_id_empty", (f) => { f.kssb_areas[0].items[0].evidence_anchors[0].source_id = ""; return f; }],
  ["mode_source_mode_mismatch", (f) => { f.source_documents[0].source_mode = "customer_provided"; return f; }],
  ["mode_label_mismatch", (f) => { f.kssb_areas[0].items[0].judgment_label = "제공자료상 근거 확인"; return f; }],
  ["anchor_quote_empty", (f) => { f.kssb_areas[0].items[0].evidence_anchors[0].quote = ""; return f; }],
  ["question_field_missing", (f) => { delete f.kssb_areas[1].items[0].customer_questions[0].follow_up_action; return f; }],
  ["notverifiable_questions_removed", (f) => {
    for (const a of f.kssb_areas) for (const it of a.items) {
      if (it.judgment_code === "not_verifiable") it.customer_questions = [];
    }
    return f;
  }],
  ["notverifiable_missing_info_removed", (f) => {
    for (const a of f.kssb_areas) for (const it of a.items) {
      if (it.judgment_code === "not_verifiable") it.missing_info = [];
    }
    return f;
  }],
  ["conflict_human_review_false", (f) => {
    for (const a of f.kssb_areas) for (const it of a.items) {
      if (it.judgment_code === "conflict_or_interpretation_needed") it.human_review_required = false;
    }
    return f;
  }],
  ["conflict_note_empty", (f) => {
    for (const a of f.kssb_areas) for (const it of a.items) {
      if (it.judgment_code === "conflict_or_interpretation_needed") it.human_review_note = "";
    }
    return f;
  }],
  ["out_of_scope_missing_info_removed", (f) => {
    for (const a of f.kssb_areas) for (const it of a.items) {
      if (it.judgment_code === "out_of_scope_or_not_applicable") it.missing_info = [];
    }
    return f;
  }],
  ["prohibited_in_recommendations", (f) => { f.kssb_areas[0].items[0].recommendations = ["준수 확정 판정을 부여함"]; return f; }],
  ["path_windows", (f) => { f.kssb_areas[0].items[0].evidence_anchors[0].page_or_section = "C:\\Users\\me\\report.pdf"; return f; }],
  ["path_home", (f) => { f.kssb_areas[0].items[0].evidence_anchors[0].page_or_section = "/home/alice/reports/hfg.pdf"; return f; }],
  ["path_var_folders", (f) => { f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = "/var/folders/xy/abc123/T/extract.txt 참조"; return f; }],
  ["path_temp_env", (f) => { f.source_documents[0].notes = "%TEMP%\\sm_extract.txt"; return f; }],
  ["path_userprofile_env", (f) => { f.source_documents[0].notes = "%USERPROFILE%\\Desktop\\report.pdf"; return f; }],
  ["path_temp_dir", (f) => { f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = "D:\\work\\Temp\\out.md"; return f; }],
  ["sourcedoc_title_missing", (f) => { delete f.source_documents[0].title; return f; }],
  ["sourcedoc_source_mode_missing", (f) => { delete f.source_documents[0].source_mode; return f; }],
  ["area_id_missing", (f) => { delete f.kssb_areas[0].area_id; return f; }],
  ["area_name_missing", (f) => { delete f.kssb_areas[0].area_name; return f; }],
  ["area_items_missing", (f) => { delete f.kssb_areas[0].items; return f; }],
  ["item_judgment_label_missing", (f) => { delete f.kssb_areas[0].items[0].judgment_label; return f; }],
  ["duplicate_quote_reuse", (f) => {
    const anchored = [];
    for (const a of f.kssb_areas) for (const it of a.items) {
      if (Array.isArray(it.evidence_anchors) && it.evidence_anchors.length) anchored.push(it);
    }
    anchored[1].evidence_anchors[0].quote = anchored[0].evidence_anchors[0].quote;
    return f;
  }],
  ["unknown_review_mode", (f) => { f.report_meta.review_mode = "unknown_mode"; return f; }],
  ["unknown_judgment_code", (f) => { f.kssb_areas[0].items[0].judgment_code = "approved"; return f; }],
  ["invalid_priority", (f) => { f.kssb_areas[1].items[0].customer_questions[0].priority = "urgent"; return f; }],
  ["multi_error_combo", (f) => {
    delete f.source_documents[0].title;
    f.kssb_areas[0].items[0].judgment_label = "제공자료상 근거 확인";
    f.kssb_areas[3].items[0].evidence_anchors[0].quote = "";
    f.kssb_areas[0].items[0].recommendations = ["자동 감사 결과 적합 판정"];
    f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = "C:\\tmp\\x AppData 참조";
    return f;
  }],
];

// message 비교 제외 코드(의미 동일·표기 상이 — 완료 보고서에 기록).
const MSG_EXEMPT = (code) => code.startsWith("schema.") || code === "prohibited.list_load";

function runPy(file, flags) {
  return spawnSync(PY, [VALIDATOR_PY, file, ...flags], { cwd: REPO, encoding: "utf-8", env: PY_ENV, timeout: 60000 });
}
function runNode(file, flags) {
  return spawnSync(process.execPath, [VALIDATOR_CJS, file, ...flags], { cwd: REPO, encoding: "utf-8", timeout: 60000 });
}

function summarize(issues) {
  const c = { error: 0, warning: 0, info: 0 };
  for (const i of issues) c[i.severity] = (c[i.severity] || 0) + 1;
  return c;
}

let tmpDir = null;
test.before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "n1-parity-"));
});
test.after(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("parity 전제: Python reference 실행 파일 존재", (t) => {
  if (!PY) {
    t.skip("Python 3 실행 파일을 찾지 못함(SAMIL_PARITY_PY로 지정 가능) — parity는 개발기 reference 대조용");
    return;
  }
  assert.ok(PY);
});

for (const [name, mutate] of FIXTURES) {
  test(`parity(--no-jsonschema): ${name}`, (t) => {
    if (!PY) { t.skip("Python 미탐지 — skip"); return; }
    const f = mutate(base());
    const file = path.join(tmpDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(f, null, 1), "utf-8");

    const rp = runPy(file, ["--json", "--no-jsonschema"]);
    const rn = runNode(file, ["--json", "--no-jsonschema"]);
    assert.strictEqual(rn.status, rp.status, `exit code 불일치 (py=${rp.status}, node=${rn.status})`);
    const ip = JSON.parse(rp.stdout);
    const inn = JSON.parse(rn.stdout);
    assert.strictEqual(inn.length, ip.length,
      `이슈 개수 불일치 (py=${ip.length}, node=${inn.length})\npy=${JSON.stringify(ip, null, 1)}\nnode=${JSON.stringify(inn, null, 1)}`);
    assert.deepStrictEqual(summarize(inn), summarize(ip), "severity 분포 불일치");
    for (let i = 0; i < ip.length; i++) {
      assert.strictEqual(inn[i].severity, ip[i].severity, `#${i} severity`);
      assert.strictEqual(inn[i].code, ip[i].code, `#${i} code`);
      assert.strictEqual(inn[i].location, ip[i].location, `#${i} location`);
      if (!MSG_EXEMPT(ip[i].code)) {
        assert.strictEqual(inn[i].message, ip[i].message, `#${i} message (code=${ip[i].code})`);
      }
    }
  });
}

test("parity(기본 모드): valid example — info 의미 동등(schema.optional_skipped)", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const rp = runPy(EXAMPLE, ["--json"]);
  const rn = runNode(EXAMPLE, ["--json"]);
  assert.strictEqual(rn.status, 0);
  const inn = JSON.parse(rn.stdout);
  assert.strictEqual(inn.length, 1);
  assert.strictEqual(inn[0].code, "schema.optional_skipped");
  const ip = JSON.parse(rp.stdout);
  if (ip.some((i) => i.code === "schema.optional_skipped")) {
    // Python도 jsonschema 미설치 fallback → 완전 동등(개수·코드·위치)
    assert.strictEqual(rp.status, 0);
    assert.strictEqual(ip.length, 1);
    assert.strictEqual(ip[0].location, inn[0].location);
  } else {
    // Python에 jsonschema가 설치된 환경 — valid example은 schema-valid이므로 error 0이어야 함
    assert.strictEqual(rp.status, 0);
    assert.strictEqual(ip.filter((i) => i.severity === "error").length, 0);
    t.diagnostic("Python 환경에 jsonschema 설치됨 — 기본 모드 info 대신 실제 스키마 검증 경로(방식 A 범위 밖)");
  }
});

test("parity: --warnings-as-errors exit code (duplicate quote fixture)", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const f = FIXTURES.find(([n]) => n === "duplicate_quote_reuse")[1](base());
  const file = path.join(tmpDir, "warn_exit.json");
  fs.writeFileSync(file, JSON.stringify(f), "utf-8");
  assert.strictEqual(runPy(file, ["--no-jsonschema"]).status, 0);
  assert.strictEqual(runNode(file, ["--no-jsonschema"]).status, 0);
  assert.strictEqual(runPy(file, ["--no-jsonschema", "--warnings-as-errors"]).status, 1);
  assert.strictEqual(runNode(file, ["--no-jsonschema", "--warnings-as-errors"]).status, 1);
});

test("parity: 로드 실패 exit 2 / root 비객체 structure.root", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const missing = path.join(tmpDir, "no-such.json");
  assert.strictEqual(runPy(missing, []).status, 2);
  assert.strictEqual(runNode(missing, []).status, 2);

  const rootArr = path.join(tmpDir, "root_array.json");
  fs.writeFileSync(rootArr, "[]", "utf-8");
  const rp = runPy(rootArr, ["--json", "--no-jsonschema"]);
  const rn = runNode(rootArr, ["--json", "--no-jsonschema"]);
  assert.strictEqual(rp.status, 1);
  assert.strictEqual(rn.status, 1);
  const ip = JSON.parse(rp.stdout);
  const inn = JSON.parse(rn.stdout);
  assert.strictEqual(ip.length, 1);
  assert.strictEqual(inn.length, 1);
  assert.strictEqual(inn[0].code, ip[0].code);
  assert.strictEqual(inn[0].message, ip[0].message);
});

test("parity: 텍스트 출력 요약 라인 동일(valid example, --no-jsonschema)", (t) => {
  if (!PY) { t.skip("Python 미탐지 — skip"); return; }
  const rp = runPy(EXAMPLE, ["--no-jsonschema"]);
  const rn = runNode(EXAMPLE, ["--no-jsonschema"]);
  const lastP = rp.stdout.trim().split(/\r?\n/).pop();
  const lastN = rn.stdout.trim().split(/\r?\n/).pop();
  assert.strictEqual(lastN, lastP); // "요약: error 0건, warning 0건, info 0건."
});
