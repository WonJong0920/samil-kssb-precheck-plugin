/**
 * Samil KSSB Precheck - Findings Report Renderer (Node port, Cycle 2N-6 Phase 2 N2 — HTML/Markdown만).
 *
 * `kssb_report_renderer.py`(Python reference)의 **HTML/Markdown 경로 충실 이식**이다.
 * 섹션 구성·표기 문구·escape 규칙을 Python과 동일하게 유지한다(구조 비교는
 * `tests/test_delivery_node_parity.test.cjs`가 동일 findings로 대조).
 *
 * 경계 — Python reference와 동일:
 * - 렌더러는 findings를 **재판정하지 않는다.** judgment_code/judgment_label을 그대로 소비하고,
 *   evidence/missing_info/questions/recommendations를 생성·변경하지 않는다.
 *   정렬·표기·표 생성·escape·sanitize·파일명 정리·안전한 오류 메시지만 수행한다.
 * - 외부 의존성 0 (Node 내장 모듈만).
 *
 * 의도된 차이(문서화 — N2 완료 보고서 참조):
 * - **DOCX는 이식하지 않았다(N4 대상)** — placeholder도 만들지 않는다(오해 방지).
 *   renderReport()의 출력 형식은 HTML → Markdown이며 primary는 HTML이다.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// 상수 / 고정 순서 (재판정 아님 — 표기 순서와 표시 라벨 매핑만. Python과 동일)
// ---------------------------------------------------------------------------

const AREA_ORDER = ["governance", "strategy", "risk_management", "metrics_and_targets"];

const JUDGMENT_CODE_ORDER = [
  "evidence_confirmed",
  "partial_evidence_needs_supplement",
  "not_verifiable",
  "conflict_or_interpretation_needed",
  "out_of_scope_or_not_applicable",
];

const PRIORITY_LABEL = { high: "상", medium: "중", low: "하" };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const FILENAME_SUFFIX = "_KSSB_공시근거_사전검토보고서";

// XML 1.0 금지 제어문자(\t,\n,\r 허용) — Python `_XML_INVALID_RE`와 동일.
const _XML_INVALID_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

class RenderError extends Error {}

// ---------------------------------------------------------------------------
// 안전한 필드 접근 (누락 필드 안전 처리 — 내용 보강 금지)
// ---------------------------------------------------------------------------

function _s(v) {
  if (v === null || v === undefined) return "";
  // Python reference의 str(True)/str(False) 표기와 동일하게 유지(출력 동등성 — 예: "수행=True").
  if (v === true) return "True";
  if (v === false) return "False";
  return String(v);
}

function _list(v) {
  return Array.isArray(v) ? v : [];
}

function _dict(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function _sanitizeXmlText(s) {
  return s.replace(_XML_INVALID_RE, "");
}

function sanitizeFilenameBase(name) {
  let n = _sanitizeXmlText(_s(name)).trim();
  n = n.replace(/[\\/:*?"<>|]/g, " ");
  n = n.replace(/[()\[\]{}]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  n = n.replace(/ /g, "_");
  n = n.replace(/^[._]+|[._]+$/g, "");
  if (!n) n = "KSSB_사전검토";
  return n.slice(0, 80);
}

function _judgmentCountRows(items) {
  const labelByCode = new Map();
  const countByCode = new Map();
  for (const it of items) {
    const code = _s(it.judgment_code);
    const label = _s(it.judgment_label) || code || "(판정 없음)";
    countByCode.set(code, (countByCode.get(code) || 0) + 1);
    if (!labelByCode.has(code)) labelByCode.set(code, label);
  }
  const rows = [];
  const seen = new Set();
  for (const code of JUDGMENT_CODE_ORDER) {
    if (countByCode.has(code)) {
      rows.push([labelByCode.get(code), countByCode.get(code)]);
      seen.add(code);
    }
  }
  for (const [code, cnt] of countByCode.entries()) {
    if (!seen.has(code)) rows.push([labelByCode.get(code) || code || "(판정 없음)", cnt]);
  }
  return rows;
}

function _orderedAreas(areas) {
  const indexed = areas.map((a, i) => [i, a]);
  indexed.sort((x, y) => {
    const ka = AREA_ORDER.indexOf(_s(_dict(x[1]).area_id));
    const kb = AREA_ORDER.indexOf(_s(_dict(y[1]).area_id));
    const ia = ka === -1 ? AREA_ORDER.length : ka;
    const ib = kb === -1 ? AREA_ORDER.length : kb;
    return ia !== ib ? ia - ib : x[0] - y[0];
  });
  return indexed.map(([, a]) => a);
}

function _allItems(areas) {
  const out = [];
  for (const a of _orderedAreas(areas)) {
    for (const it of _list(_dict(a).items)) out.push(_dict(it));
  }
  return out;
}

function _collectQuestions(areas) {
  const rows = [];
  for (const a of _orderedAreas(areas)) {
    const areaName = _s(_dict(a).area_name);
    _list(_dict(a).items).forEach((itRaw, order) => {
      const it = _dict(itRaw);
      const itemId = _s(it.item_id);
      const title = _s(it.requirement_title);
      for (const qRaw of _list(it.customer_questions)) {
        const q = _dict(qRaw);
        rows.push({
          area_name: areaName,
          item_id: itemId,
          requirement_title: title,
          input_order: order,
          question: _s(q.question),
          reason: _s(q.reason),
          related_evidence: _s(q.related_evidence),
          priority: _s(q.priority),
          requested_material: _s(q.requested_material),
          follow_up_action: _s(q.follow_up_action),
        });
      }
    });
  }
  rows.sort((a, b) => {
    const pa = Object.prototype.hasOwnProperty.call(PRIORITY_ORDER, a.priority) ? PRIORITY_ORDER[a.priority] : 99;
    const pb = Object.prototype.hasOwnProperty.call(PRIORITY_ORDER, b.priority) ? PRIORITY_ORDER[b.priority] : 99;
    return pa - pb;
  });
  return rows;
}

function _priorityDisplay(code) {
  const label = PRIORITY_LABEL[code];
  return label ? `${label}(${code})` : (code || "-");
}

function _validateRenderable(findings) {
  if (findings === null || typeof findings !== "object" || Array.isArray(findings)) {
    throw new RenderError("findings 최상위가 객체(JSON object)가 아닙니다.");
  }
  if (!(findings.report_meta !== null && typeof findings.report_meta === "object" && !Array.isArray(findings.report_meta))) {
    throw new RenderError("report_meta 객체가 없습니다.");
  }
  if (!Array.isArray(findings.kssb_areas) || findings.kssb_areas.length === 0) {
    throw new RenderError("kssb_areas 배열이 비어 있거나 없습니다.");
  }
}

// ===========================================================================
// HTML (Python render_html과 동일 섹션·문구)
// ===========================================================================

function _h(v) {
  return _sanitizeXmlText(_s(v))
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function renderHtml(findings) {
  _validateRenderable(findings);
  const meta = _dict(findings.report_meta);
  const areas = _list(findings.kssb_areas);
  const sources = _list(findings.source_documents);
  const items = _allItems(areas);

  const title = _s(meta.report_title) || "KSSB 공시근거 사전검토 보고서 (초안)";
  const parts = [];
  parts.push("<!DOCTYPE html>");
  parts.push('<html lang="ko"><head><meta charset="utf-8">');
  parts.push(`<title>${_h(title)}</title>`);
  parts.push(
    "<style>"
    + "body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;"
    + "line-height:1.55;color:#1a1a1a;max-width:960px;margin:24px auto;padding:0 16px;}"
    + "h1{font-size:1.7em;} h2{font-size:1.3em;margin-top:1.6em;border-bottom:1px solid #ccc;padding-bottom:4px;}"
    + "h3{font-size:1.08em;margin-top:1.2em;}"
    + "table{border-collapse:collapse;width:100%;margin:8px 0;}"
    + "th,td{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top;font-size:0.94em;}"
    + "th{background:#f2f2f2;}"
    + ".disclaimer,.boundary{background:#fbf6e9;border:1px solid #e5d9b0;padding:10px 12px;border-radius:4px;}"
    + ".boundary{background:#eef4fb;border-color:#b8d0e8;}"
    + ".quote{color:#333;background:#f7f7f7;border-left:3px solid #bbb;padding:4px 8px;margin:4px 0;}"
    + ".loc{color:#666;font-size:0.88em;} .muted{color:#666;}"
    + "</style></head><body>"
  );

  // 1. 표지 및 고지
  parts.push(`<h1>${_h(title)}</h1>`);
  if (meta.generated_for) parts.push(`<p><strong>검토 대상:</strong> ${_h(meta.generated_for)}</p>`);
  if (meta.review_purpose) parts.push(`<p><strong>검토 목적:</strong> ${_h(meta.review_purpose)}</p>`);
  parts.push(`<p><strong>검토 모드(review_mode):</strong> ${_h(meta.review_mode)}</p>`);
  if (meta.created_at) parts.push(`<p><strong>생성 시각:</strong> ${_h(meta.created_at)}</p>`);
  const disclaimer = _s(meta.disclaimer);
  if (disclaimer) parts.push(`<div class="disclaimer"><strong>고지:</strong> ${_h(disclaimer)}</div>`);

  // 2. 검토 개요
  parts.push("<h2>1. 검토 개요</h2>");
  parts.push("<p>검토 범위: KSSB 4대 영역(거버넌스·전략·위험관리·지표 및 목표) MVP. "
    + "본 문서는 구조화 findings를 재판정 없이 형식 변환한 컨설턴트 검수용 초안이다.</p>");
  if (sources.length) {
    parts.push("<h3>검토 대상 자료 (source_documents)</h3>");
    parts.push("<table><tr><th>source_id</th><th>제목</th><th>유형</th>"
      + "<th>출처 모드</th><th>기간/발행</th><th>비고</th></tr>");
    for (const sRaw of sources) {
      const sdoc = _dict(sRaw);
      parts.push(
        "<tr>"
        + `<td>${_h(sdoc.source_id)}</td>`
        + `<td>${_h(sdoc.title)}</td>`
        + `<td>${_h(sdoc.document_type)}</td>`
        + `<td>${_h(sdoc.source_mode)}</td>`
        + `<td>${_h(sdoc.date_or_period)}</td>`
        + `<td>${_h(sdoc.notes)}</td>`
        + "</tr>"
      );
    }
    parts.push("</table>");
  }

  // 3. 상태 요약
  parts.push("<h2>2. 상태 요약</h2>");
  parts.push(`<p>총 검토 항목: ${items.length}건</p>`);
  parts.push("<table><tr><th>판정 라벨</th><th>항목 수</th></tr>");
  for (const [label, cnt] of _judgmentCountRows(items)) {
    parts.push(`<tr><td>${_h(label)}</td><td>${cnt}</td></tr>`);
  }
  parts.push("</table>");
  parts.push("<h3>항목-판정 요약</h3>");
  parts.push("<table><tr><th>영역</th><th>공시요구</th><th>판정</th><th>항목ID</th></tr>");
  for (const aRaw of _orderedAreas(areas)) {
    const a = _dict(aRaw);
    const areaName = _s(a.area_name);
    for (const itRaw of _list(a.items)) {
      const it = _dict(itRaw);
      parts.push(
        "<tr>"
        + `<td>${_h(areaName)}</td>`
        + `<td>${_h(it.requirement_title)}</td>`
        + `<td>${_h(it.judgment_label)}</td>`
        + `<td class='loc'>${_h(it.item_id)}</td>`
        + "</tr>"
      );
    }
  }
  parts.push("</table>");

  // 4. 영역별 항목 결과와 근거
  parts.push("<h2>3. 영역별 항목 결과와 근거</h2>");
  for (const aRaw of _orderedAreas(areas)) {
    const a = _dict(aRaw);
    parts.push(`<h3>${_h(a.area_name)}</h3>`);
    for (const itRaw of _list(a.items)) {
      const it = _dict(itRaw);
      parts.push(`<p><strong>${_h(it.requirement_title)}</strong> `
        + `<span class='loc'>(항목ID: ${_h(it.item_id)})</span></p>`);
      if (it.requirement_description) parts.push(`<p class='muted'>${_h(it.requirement_description)}</p>`);
      parts.push(`<p><strong>판정:</strong> ${_h(it.judgment_label)}</p>`);
      const anchors = _list(it.evidence_anchors);
      if (anchors.length) {
        parts.push("<p><strong>판단 근거(원문 인용·위치):</strong></p>");
        for (const ancRaw of anchors) {
          const anc = _dict(ancRaw);
          const loc = _s(anc.page_or_section);
          parts.push(`<div class="quote">“${_h(anc.quote)}”</div>`);
          const src = _h(anc.source_id);
          const locLine = `<strong>출처:</strong> ${src}` + (loc ? ` · <strong>위치:</strong> ${_h(loc)}` : "");
          parts.push(`<p class="loc">${locLine}</p>`);
          if (anc.relevance_note) parts.push(`<p class="muted">근거 설명: ${_h(anc.relevance_note)}</p>`);
        }
      } else {
        parts.push("<p class='muted'>근거 앵커 없음.</p>");
      }
      const missing = _list(it.missing_info).map(_s).filter((m) => m);
      if (missing.length) {
        parts.push("<p><strong>부족 정보 / 판정 사유:</strong></p><ul>");
        for (const m of missing) parts.push(`<li>${_h(m)}</li>`);
        parts.push("</ul>");
      }
      if (it.human_review_required) {
        parts.push(`<p><strong>사람 검수 필요:</strong> ${_h(_s(it.human_review_note))}</p>`);
      }
    }
  }

  // 5. 고객 확인 질문 및 요청자료
  parts.push("<h2>4. 고객 확인 질문 및 요청자료</h2>");
  const questions = _collectQuestions(areas);
  if (questions.length) {
    parts.push("<p class='muted'>우선순위(상→하) 순. 각 질문은 질문사유·관련근거와 함께 "
      + "고객에게 요청할 구체 자료(요청자료)와 자료 수령 후 후속조치를 제시합니다.</p>");
    parts.push("<table><tr><th>항목ID</th><th>항목명</th><th>질문</th><th>질문사유</th>"
      + "<th>관련근거</th><th>우선순위</th><th>요청자료</th><th>후속조치</th></tr>");
    for (const q of questions) {
      parts.push(
        "<tr>"
        + `<td>${_h(q.item_id)}</td>`
        + `<td>${_h(q.requirement_title)}</td>`
        + `<td>${_h(q.question)}</td>`
        + `<td>${_h(q.reason)}</td>`
        + `<td>${_h(q.related_evidence)}</td>`
        + `<td>${_h(_priorityDisplay(q.priority))}</td>`
        + `<td>${_h(q.requested_material)}</td>`
        + `<td>${_h(q.follow_up_action)}</td>`
        + "</tr>"
      );
    }
    parts.push("</table>");
  } else {
    parts.push("<p class='muted'>고객 확인 질문이 없습니다.</p>");
  }

  // 6. 보완 권고
  parts.push("<h2>5. 보완 권고</h2>");
  const recs = [];
  for (const aRaw of _orderedAreas(areas)) {
    for (const itRaw of _list(_dict(aRaw).items)) {
      const it = _dict(itRaw);
      for (const r of _list(it.recommendations)) {
        if (_s(r)) recs.push([_s(it.item_id), _s(it.requirement_title), _s(r)]);
      }
    }
  }
  if (recs.length) {
    parts.push("<ul>");
    for (const [itemId, rtitle, r] of recs) {
      parts.push(`<li><strong>[${_h(itemId)}] ${_h(rtitle)}</strong> — ${_h(r)}</li>`);
    }
    parts.push("</ul>");
  } else {
    parts.push("<p class='muted'>등록된 보완 권고가 없습니다.</p>");
  }

  // 7. 한계와 사람 검수 안내
  parts.push("<h2>6. 한계와 사람 검수 안내</h2>");
  const limits = _list(findings.overall_limitations).map(_s).filter((x) => x);
  if (limits.length) {
    parts.push("<p><strong>전체 한계:</strong></p><ul>");
    for (const x of limits) parts.push(`<li>${_h(x)}</li>`);
    parts.push("</ul>");
  }
  const hrItems = items.filter((it) => it.human_review_required);
  if (hrItems.length) {
    parts.push("<p><strong>사람 검수 대상 항목:</strong></p><ul>");
    for (const it of hrItems) {
      parts.push(`<li>[${_h(it.item_id)}] ${_h(it.requirement_title)} — ${_h(it.human_review_note)}</li>`);
    }
    parts.push("</ul>");
  }
  const ptc = _dict(findings.prohibited_terms_check);
  if (Object.keys(ptc).length) {
    const found = _list(ptc.prohibited_terms_found).map(_s).filter((x) => x);
    parts.push(
      "<p><strong>금지 표현 점검(prohibited_terms_check):</strong> "
      + `수행=${_h(ptc.performed)}, 고지문 존재=${_h(ptc.disclaimer_present)}, `
      + `발견된 금지 표현=${_h(found.length === 0 ? "없음" : found.join(", "))}.</p>`
    );
    if (ptc.notes) parts.push(`<p class='muted'>${_h(ptc.notes)}</p>`);
  }
  const boundary = _s(findings.human_review_boundary);
  if (boundary) parts.push(`<div class="boundary"><strong>사람 검수 경계:</strong> ${_h(boundary)}</div>`);

  parts.push("</body></html>");
  return parts.join("");
}

// ===========================================================================
// Markdown (Python render_markdown과 동일 섹션·문구)
// ===========================================================================

function _md(v) {
  const text = _sanitizeXmlText(_s(v));
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r/g, " ").replace(/\n/g, " ");
}

function renderMarkdown(findings) {
  _validateRenderable(findings);
  const meta = _dict(findings.report_meta);
  const areas = _list(findings.kssb_areas);
  const sources = _list(findings.source_documents);
  const items = _allItems(areas);
  const title = _s(meta.report_title) || "KSSB 공시근거 사전검토 보고서 (초안)";
  const out = [`# ${_md(title)}`, ""];

  if (meta.generated_for) out.push(`- **검토 대상**: ${_md(meta.generated_for)}`);
  if (meta.review_purpose) out.push(`- **검토 목적**: ${_md(meta.review_purpose)}`);
  out.push(`- **검토 모드(review_mode)**: ${_md(meta.review_mode)}`);
  if (meta.created_at) out.push(`- **생성 시각**: ${_md(meta.created_at)}`);
  if (meta.disclaimer) {
    out.push("");
    out.push(`> **고지**: ${_md(meta.disclaimer)}`);
  }
  out.push("");

  out.push("## 1. 검토 개요");
  out.push("검토 범위: KSSB 4대 영역(거버넌스·전략·위험관리·지표 및 목표) MVP. "
    + "본 문서는 구조화 findings를 재판정 없이 형식 변환한 컨설턴트 검수용 초안이다.");
  if (sources.length) {
    out.push("");
    out.push("### 검토 대상 자료 (source_documents)");
    out.push("| source_id | 제목 | 유형 | 출처 모드 | 기간/발행 |");
    out.push("|---|---|---|---|---|");
    for (const sRaw of sources) {
      const s = _dict(sRaw);
      out.push(`| ${_md(s.source_id)} | ${_md(s.title)} | ${_md(s.document_type)} `
        + `| ${_md(s.source_mode)} | ${_md(s.date_or_period)} |`);
    }
  }
  out.push("");

  out.push("## 2. 상태 요약");
  out.push(`총 검토 항목: ${items.length}건`);
  out.push("");
  out.push("| 판정 라벨 | 항목 수 |");
  out.push("|---|---|");
  for (const [label, cnt] of _judgmentCountRows(items)) {
    out.push(`| ${_md(label)} | ${cnt} |`);
  }
  out.push("");
  out.push("### 항목-판정 요약");
  out.push("| 영역 | 공시요구 | 판정 | 항목ID |");
  out.push("|---|---|---|---|");
  for (const aRaw of _orderedAreas(areas)) {
    const a = _dict(aRaw);
    const areaName = _s(a.area_name);
    for (const itRaw of _list(a.items)) {
      const it = _dict(itRaw);
      out.push(`| ${_md(areaName)} | ${_md(it.requirement_title)} | ${_md(it.judgment_label)} `
        + `| ${_md(it.item_id)} |`);
    }
  }
  out.push("");

  out.push("## 3. 영역별 항목 결과와 근거");
  for (const aRaw of _orderedAreas(areas)) {
    const a = _dict(aRaw);
    out.push(`### ${_md(a.area_name)}`);
    for (const itRaw of _list(a.items)) {
      const it = _dict(itRaw);
      out.push(`#### ${_md(it.requirement_title)} (항목ID: ${_md(it.item_id)})`);
      if (it.requirement_description) out.push(_md(it.requirement_description));
      out.push(`- **판정**: ${_md(it.judgment_label)}`);
      const anchors = _list(it.evidence_anchors);
      if (anchors.length) {
        out.push("- **판단 근거(원문 인용·위치)**:");
        for (const ancRaw of anchors) {
          const anc = _dict(ancRaw);
          const loc = _s(anc.page_or_section);
          out.push(`  - 인용: “${_md(anc.quote)}”`);
          const srcLine = `    - 출처: ${_md(anc.source_id)}` + (loc ? ` · 위치: ${_md(loc)}` : "");
          out.push(srcLine);
          if (anc.relevance_note) out.push(`    - 근거 설명: ${_md(anc.relevance_note)}`);
        }
      } else {
        out.push("- 근거 앵커 없음.");
      }
      for (const m of _list(it.missing_info)) {
        if (_s(m)) out.push(`  - 부족 정보/사유: ${_md(m)}`);
      }
      if (it.human_review_required) {
        out.push(`- **사람 검수 필요**: ${_md(it.human_review_note)}`);
      }
    }
    out.push("");
  }

  out.push("## 4. 고객 확인 질문 및 요청자료");
  const questions = _collectQuestions(areas);
  if (questions.length) {
    out.push("우선순위(상→하) 순. 각 질문은 질문사유·관련근거와 함께 요청자료와 후속조치를 제시합니다.");
    out.push("");
    out.push("| 항목ID | 항목명 | 질문 | 질문사유 | 관련근거 | 우선순위 | 요청자료 | 후속조치 |");
    out.push("|---|---|---|---|---|---|---|---|");
    for (const q of questions) {
      out.push(`| ${_md(q.item_id)} | ${_md(q.requirement_title)} | ${_md(q.question)} `
        + `| ${_md(q.reason)} | ${_md(q.related_evidence)} | ${_md(_priorityDisplay(q.priority))} `
        + `| ${_md(q.requested_material)} | ${_md(q.follow_up_action)} |`);
    }
  } else {
    out.push("고객 확인 질문이 없습니다.");
  }
  out.push("");

  out.push("## 5. 보완 권고");
  let anyRec = false;
  for (const aRaw of _orderedAreas(areas)) {
    for (const itRaw of _list(_dict(aRaw).items)) {
      const it = _dict(itRaw);
      for (const r of _list(it.recommendations)) {
        if (_s(r)) {
          anyRec = true;
          out.push(`- **[${_md(it.item_id)}] ${_md(it.requirement_title)}**: ${_md(r)}`);
        }
      }
    }
  }
  if (!anyRec) out.push("등록된 보완 권고가 없습니다.");
  out.push("");

  out.push("## 6. 한계와 사람 검수 안내");
  for (const x of _list(findings.overall_limitations)) {
    if (_s(x)) out.push(`- ${_md(x)}`);
  }
  const hrItems = items.filter((it) => it.human_review_required);
  if (hrItems.length) {
    out.push("- **사람 검수 대상 항목**:");
    for (const it of hrItems) {
      out.push(`  - [${_md(it.item_id)}] ${_md(it.requirement_title)} — ${_md(it.human_review_note)}`);
    }
  }
  const ptc = _dict(findings.prohibited_terms_check);
  if (Object.keys(ptc).length) {
    const found = _list(ptc.prohibited_terms_found).map(_s).filter((x) => x);
    out.push(`- 금지 표현 점검: 수행=${_md(ptc.performed)}, 고지문 존재=${_md(ptc.disclaimer_present)}, `
      + `발견=${found.length === 0 ? "없음" : _md(found.join(", "))}.`);
    if (ptc.notes) out.push(`  - ${_md(ptc.notes)}`);
  }
  const boundary = _s(findings.human_review_boundary);
  if (boundary) {
    out.push("");
    out.push(`> **사람 검수 경계**: ${_md(boundary)}`);
  }
  out.push("");
  return out.join("\n");
}

// ===========================================================================
// 공개 진입점 (HTML → Markdown. DOCX는 N4 — 미구현·placeholder 없음)
// ===========================================================================

function _baseName(findings, override) {
  if (override) return sanitizeFilenameBase(override);
  const meta = _dict(findings.report_meta);
  return sanitizeFilenameBase(_s(meta.generated_for) || _s(meta.report_title));
}

/**
 * findings를 HTML/Markdown 대표 문서로 변환한다(동일 findings 단일 소스, 재판정 없음).
 * 반환: {"html", "markdown", "primary", "primary_format"} — primary는 HTML.
 * DOCX는 이 Node 경로에서 생성되지 않는다(N4 대상 — 값/키를 만들지 않는다).
 */
function renderReport(findings, outDir, options = {}) {
  const { baseName = null } = options;
  _validateRenderable(findings);
  fs.mkdirSync(outDir, { recursive: true });
  const base = _baseName(findings, baseName);
  const stem = `${base}${FILENAME_SUFFIX}`;

  const result = { html: null, markdown: null, primary: null, primary_format: null };

  const htmlPath = path.join(outDir, `${stem}.html`);
  fs.writeFileSync(htmlPath, renderHtml(findings), "utf-8");
  result.html = htmlPath;

  const mdPath = path.join(outDir, `${stem}.md`);
  fs.writeFileSync(mdPath, renderMarkdown(findings), "utf-8");
  result.markdown = mdPath;

  result.primary = result.html;
  result.primary_format = "html";
  return result;
}

function loadFindings(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

module.exports = {
  AREA_ORDER, JUDGMENT_CODE_ORDER, PRIORITY_LABEL, FILENAME_SUFFIX,
  RenderError, sanitizeFilenameBase, renderHtml, renderMarkdown, renderReport, loadFindings,
};
