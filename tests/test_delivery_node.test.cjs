"use strict";
/**
 * Node delivery + HTML/Markdown renderer 테스트 (2N-6 Phase 2 N2, N4에서 DOCX 반영 갱신).
 *
 * 핵심 검증: ① renderer가 findings를 재판정 없이 형식 변환(섹션·판정 라벨·근거·질문·경계 보존,
 * escape·결정성) ② delivery가 N1 Node validator를 preflight로 소비 ③ **D94 hard stop** —
 * error ≥ 1이면 산출물 0 + 통제된 종료(exit 4) + sanitized 안내 ④ 사용자-facing 출력에
 * raw 이슈 위치·로컬 경로·stack trace 미노출 ⑤ 대표 문서 DOCX → HTML → Markdown(N4). 외부 의존성 0.
 *
 * (N4 갱신) DOCX 자체의 구조·parity·결정성·ZIP/XML safety는 tests/test_docx_writer_node*.test.cjs가
 * 담당한다. 이 파일은 delivery 배선에서 DOCX가 대표 문서로 나오고 D94에서 DOCX도 차단됨만 확인한다.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO = path.resolve(__dirname, "..");
const R = require(path.join(REPO, "src", "renderers", "kssb_report_renderer.cjs"));
const D = require(path.join(REPO, "src", "renderers", "kssb_report_delivery.cjs"));
const DELIVERY_CJS = path.join(REPO, "src", "renderers", "kssb_report_delivery.cjs");
const EXAMPLE = path.join(REPO, "src", "schemas", "kssb_findings_example.json");

function base() {
  return JSON.parse(fs.readFileSync(EXAMPLE, "utf-8"));
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "n2-delivery-"));
}

function runCli(args, cwd = REPO) {
  return spawnSync(process.execPath, [DELIVERY_CJS, ...args], { cwd, encoding: "utf-8" });
}

// 사용자-facing 출력 누출 검사(공통): 로컬 경로·홈·stack·raw 이슈 위치 토큰.
function assertNoLeak(text) {
  assert.ok(!/[A-Za-z]:[\\/]Users[\\/]/i.test(text), "사용자 홈 경로 노출");
  assert.ok(!text.includes("AppData"), "AppData 노출");
  assert.ok(!text.includes(os.tmpdir()), "임시 폴더 절대경로 노출");
  assert.ok(!/\n\s+at /.test(text), "stack trace 노출");
  assert.ok(!text.includes("kssb_areas["), "raw 이슈 location 노출");
  assert.ok(!text.includes("schema.optional_skipped"), "내부 info 코드 노출");
}

// --- renderer: 형식 변환·보존 ---

test("renderer: HTML에 제목·고지·6개 섹션·판정 라벨·인용·질문·경계가 보존된다", () => {
  const f = base();
  const html = R.renderHtml(f);
  assert.ok(html.includes("KSSB 공시근거 사전검토 보고서 (초안)"));
  assert.ok(html.includes("고지:"));
  for (const h of ["1. 검토 개요", "2. 상태 요약", "3. 영역별 항목 결과와 근거",
    "4. 고객 확인 질문 및 요청자료", "5. 보완 권고", "6. 한계와 사람 검수 안내"]) {
    assert.ok(html.includes(`<h2>${h}</h2>`), `섹션 누락: ${h}`);
  }
  // 판정 라벨·인용·질문·경계 원문 보존(재판정 없음)
  assert.ok(html.includes("공개자료상 근거 확인"));
  assert.ok(html.includes("상충 또는 해석 필요"));
  assert.ok(html.includes("이사회는 지속가능성 관련 위험과 기회에 대한 최종 감독 책임을 지며"));
  assert.ok(html.includes("Scope 3 배출량은 산정하지 않았다."));
  assert.ok(html.includes("사람 검수 경계:"));
  assert.ok(html.includes("컨설턴트 검수용 초안"));
});

test("renderer: Markdown에 동일 섹션·표·경계가 보존된다", () => {
  const md = R.renderMarkdown(base());
  for (const h of ["## 1. 검토 개요", "## 2. 상태 요약", "## 3. 영역별 항목 결과와 근거",
    "## 4. 고객 확인 질문 및 요청자료", "## 5. 보완 권고", "## 6. 한계와 사람 검수 안내"]) {
    assert.ok(md.includes(h), `섹션 누락: ${h}`);
  }
  assert.ok(md.includes("| 판정 라벨 | 항목 수 |"));
  assert.ok(md.includes("> **사람 검수 경계**:"));
});

test("renderer: 재판정 없음 — 항목/판정/근거/질문 수가 입력과 동일", () => {
  const f = base();
  const md = R.renderMarkdown(f);
  let items = 0, anchors = 0, questions = 0;
  for (const a of f.kssb_areas) {
    for (const it of a.items) {
      items += 1;
      anchors += (it.evidence_anchors || []).length;
      questions += (it.customer_questions || []).length;
    }
  }
  assert.strictEqual((md.match(/^#### /gm) || []).length, items, "항목 수");
  assert.strictEqual((md.match(/^ {2}- 인용: /gm) || []).length, anchors, "근거 앵커 수");
  // 질문 표의 데이터 행 수 = 질문 수(헤더/구분선 제외)
  const qSection = md.split("## 4. 고객 확인 질문 및 요청자료")[1].split("## 5.")[0];
  const qRows = qSection.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| 항목ID") && !l.startsWith("|---"));
  assert.strictEqual(qRows.length, questions, "질문 행 수");
  assert.ok(md.includes(`총 검토 항목: ${items}건`));
});

test("renderer: HTML escape — 주입 문자열이 이스케이프된다", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].relevance_note = '<script>alert("x")</script>';
  const html = R.renderHtml(f);
  assert.ok(!html.includes("<script>alert"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("renderer: 결정성 — 동일 findings는 동일 출력", () => {
  assert.strictEqual(R.renderHtml(base()), R.renderHtml(base()));
  assert.strictEqual(R.renderMarkdown(base()), R.renderMarkdown(base()));
});

test("renderer: 파일명 sanitize — 경로 구분자·금지 문자 제거", () => {
  assert.strictEqual(R.sanitizeFilenameBase("A/B\\C:D*E?F\"G<H>I|J"), "A_B_C_D_E_F_G_H_I_J");
  assert.strictEqual(R.sanitizeFilenameBase("  "), "KSSB_사전검토");
});

test("renderer: renderReport — DOCX/HTML/MD 3종 생성, primary=docx (N4)", () => {
  const dir = tmpdir();
  try {
    const out = R.renderReport(base(), dir);
    assert.strictEqual(out.primary_format, "docx");
    assert.ok(fs.existsSync(out.docx) && out.docx.endsWith(".docx"));
    assert.ok(fs.existsSync(out.html) && out.html.endsWith(".html"));
    assert.ok(fs.existsSync(out.markdown) && out.markdown.endsWith(".md"));
    assert.ok(out.docx.includes(R.FILENAME_SUFFIX));
    assert.strictEqual(out.docx_error, null);
    const files = fs.readdirSync(dir);
    assert.strictEqual(files.length, 3, `생성 파일: ${files}`);
    assert.strictEqual(files.filter((n) => n.endsWith(".docx")).length, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("renderer: renderReport({preferDocx:false}) — HTML/MD만, primary=html (내부/검증용)", () => {
  const dir = tmpdir();
  try {
    const out = R.renderReport(base(), dir, { preferDocx: false });
    assert.strictEqual(out.primary_format, "html");
    assert.strictEqual(out.docx, null);
    const files = fs.readdirSync(dir);
    assert.strictEqual(files.length, 2, `생성 파일: ${files}`);
    assert.ok(!files.some((n) => n.endsWith(".docx")));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("renderer: 렌더 불가 구조 → RenderError", () => {
  assert.throws(() => R.renderHtml({ report_meta: {} }), R.RenderError);
  assert.throws(() => R.renderMarkdown([]), R.RenderError);
});

// --- delivery: 성공 경로 ---

test("delivery API: 성공 — preflight error 0·산출물 생성·요약 sanitized", () => {
  const dir = tmpdir();
  try {
    const result = D.deliver(base(), dir);
    assert.strictEqual(result.hard_stop, false);
    assert.strictEqual(result.preflight.counts.error, 0);
    assert.ok(fs.existsSync(result.outputs.docx));
    assert.ok(fs.existsSync(result.outputs.html));
    assert.ok(fs.existsSync(result.outputs.markdown));
    assert.ok(result.user_summary.includes("● 대표 문서"));
    assert.ok(result.user_summary.includes("error 0건"));
    // N4: 대표 문서는 DOCX(우선순위 DOCX → HTML → Markdown)
    assert.ok(result.user_summary.includes("형식: docx"));
    assert.ok(result.user_summary.includes("우선순위 DOCX → HTML → Markdown"));
    assertNoLeak(result.user_summary);
    // repo 밖 out-dir → 표시 경로는 파일명만
    assert.ok(result.user_summary.includes(path.basename(result.outputs.primary)));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("delivery API: warning(중복 인용)은 생성을 막지 않고 건수만 요약에 표시", () => {
  const f = base();
  const anchored = [];
  for (const a of f.kssb_areas) for (const it of a.items) {
    if (Array.isArray(it.evidence_anchors) && it.evidence_anchors.length) anchored.push(it);
  }
  anchored[1].evidence_anchors[0].quote = anchored[0].evidence_anchors[0].quote;
  const dir = tmpdir();
  try {
    const result = D.deliver(f, dir);
    assert.strictEqual(result.hard_stop, false);
    assert.ok(result.preflight.counts.warning >= 1);
    assert.ok(fs.existsSync(result.outputs.html));
    assert.ok(result.user_summary.includes(`warning ${result.preflight.counts.warning}건`));
    // raw warning 메시지·코드는 사용자 요약에 없음
    assert.ok(!result.user_summary.includes("duplicate_quote_reuse"));
    assertNoLeak(result.user_summary);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("delivery API: info(schema.optional_skipped)는 요약 문구에 노출되지 않음", () => {
  const dir = tmpdir();
  try {
    const result = D.deliver(base(), dir);
    assert.ok(result.preflight.issues.some((i) => i.code === "schema.optional_skipped"));
    assertNoLeak(result.user_summary);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- delivery: D94 hard stop ---

test("D94: preflight error ≥ 1 → hard_stop=true·산출물 0·out-dir 미생성", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = ""; // anchor.quote_empty (error)
  const parent = tmpdir();
  const dir = path.join(parent, "should-not-exist");
  try {
    const result = D.deliver(f, dir);
    assert.strictEqual(result.hard_stop, true);
    assert.deepStrictEqual(result.outputs, {});
    assert.ok(!fs.existsSync(dir), "hard stop 시 out-dir도 만들지 않음");
    assert.ok(result.user_summary.includes("보고서 생성을 중단했습니다"));
    assert.ok(result.user_summary.includes("보완한 뒤 다시 생성"));
    // 상세 이슈는 내부 반환값에만 — 요약에는 raw location/코드 없음
    assert.ok(result.preflight.issues.some((i) => i.code === "anchor.quote_empty"));
    assert.ok(!result.user_summary.includes("anchor.quote_empty"));
    assertNoLeak(result.user_summary);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("D94: findings 원본은 hard stop 경로에서도 미변경(detect-only 유지)", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = "";
  const snapshot = JSON.stringify(f);
  const parent = tmpdir();
  try {
    D.deliver(f, path.join(parent, "x"));
    assert.strictEqual(JSON.stringify(f), snapshot);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

// --- CLI 계약 ---

test("CLI: 성공 → exit 0, stdout=사용자 요약만(누출 0), 파일 생성", () => {
  const dir = tmpdir();
  try {
    const r = runCli([EXAMPLE, "-o", dir]);
    assert.strictEqual(r.status, 0);
    assert.ok(r.stdout.includes("● 대표 문서"));
    assert.ok(r.stdout.includes("error 0건"));
    assertNoLeak(r.stdout);
    assert.strictEqual(r.stderr.trim(), "", "성공 시 stderr 출력 없음(비-debug)");
    const files = fs.readdirSync(dir);
    assert.strictEqual(files.length, 3);
    assert.ok(files.every((n) => n.endsWith(".html") || n.endsWith(".md") || n.endsWith(".docx")));
    assert.ok(files.some((n) => n.endsWith(".docx")));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: D94 hard stop → exit 4·산출물 0·stdout sanitized·상세는 --debug stderr에만", () => {
  const f = base();
  f.kssb_areas[0].items[0].evidence_anchors[0].quote = "";
  const parent = tmpdir();
  try {
    const fp = path.join(parent, "bad.json");
    fs.writeFileSync(fp, JSON.stringify(f), "utf-8");
    const dir = path.join(parent, "out");

    const r = runCli([fp, "-o", dir]);
    assert.strictEqual(r.status, 4, `exit=${r.status} stdout=${r.stdout} stderr=${r.stderr}`);
    assert.ok(!fs.existsSync(dir), "hard stop 시 산출물/폴더 없음");
    assert.ok(r.stdout.includes("보고서 생성을 중단했습니다"));
    assert.ok(!r.stdout.includes("anchor.quote_empty"));
    assertNoLeak(r.stdout);

    const rd = runCli([fp, "-o", dir, "--debug"]);
    assert.strictEqual(rd.status, 4);
    assert.ok(rd.stderr.includes("anchor.quote_empty"), "--debug stderr에 상세 이슈");
    assert.ok(!fs.existsSync(dir));
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("CLI: findings 로드 실패 → exit 2 / root 비객체 → exit 3(전달 불가)", () => {
  const r2 = runCli([path.join(os.tmpdir(), "no-such-findings.json")]);
  assert.strictEqual(r2.status, 2);
  assert.ok(r2.stderr.includes("findings 로드 실패"));

  const parent = tmpdir();
  try {
    const fp = path.join(parent, "root_array.json");
    fs.writeFileSync(fp, "[]", "utf-8");
    const r3 = runCli([fp, "-o", path.join(parent, "out")]);
    assert.strictEqual(r3.status, 3);
    assert.ok(r3.stderr.includes("전달 불가"));
    assert.ok(!/\n\s+at /.test(r3.stderr), "stack trace 미노출");
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("CLI: 인자 없음/알 수 없는 플래그 → exit 2 + usage", () => {
  assert.strictEqual(runCli([]).status, 2);
  assert.strictEqual(runCli([EXAMPLE, "--bogus"]).status, 2);
});

// --- 생성 산출물 no-overclaim / leak 스캔 ---

test("산출물 스캔: 과장·provider명·내부 경로·내부 용어 0건(negation 경계 문맥만 허용)", () => {
  const dir = tmpdir();
  try {
    const out = R.renderReport(base(), dir);
    const html = fs.readFileSync(out.html, "utf-8");
    const md = fs.readFileSync(out.markdown, "utf-8");
    for (const text of [html, md]) {
      for (const tok of ["OCR 지원 완료", "support complete", "provider finalization", "product complete",
        "kordoc", "tesseract", "tool-cache", "node_modules", "AppData", "Traceback", "RunnerError",
        "2N-5", "2N-6", "Cycle 2"]) {
        assert.ok(!text.toLowerCase().includes(tok.toLowerCase()), `과장/누출 토큰: ${tok}`);
      }
      // 감사/인증/준수 계열은 negation 경계 문맥의 라인에서만 허용
      for (const line of text.split(/\r?\n|<\/p>|<\/div>|<\/li>/)) {
        if (/(준수 확정|감사의견|감사 의견|인증)/.test(line)) {
          assert.ok(/(아니다|아닙니다|않는다|않습니다|대체하지)/.test(line),
            `negation 없는 감사/인증/준수 표현: ${line.slice(0, 120)}`);
        }
      }
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
