/**
 * Samil KSSB Precheck - Findings Report Renderer (Node port, Cycle 2N-6 Phase 2 N2 HTML/Markdown + N4 DOCX).
 *
 * `kssb_report_renderer.py`(Python reference)의 **HTML/Markdown/DOCX 경로 충실 이식**이다.
 * 섹션 구성·표기 문구·escape 규칙을 Python과 동일하게 유지한다(구조·전문 비교는
 * `tests/test_delivery_node_parity.test.cjs`(HTML/MD)와 `tests/test_docx_writer_node.test.cjs`·
 * `tests/test_docx_writer_node_parity.test.cjs`(DOCX)가 동일 findings로 대조).
 *
 * 경계 — Python reference와 동일:
 * - 렌더러는 findings를 **재판정하지 않는다.** judgment_code/judgment_label을 그대로 소비하고,
 *   evidence/missing_info/questions/recommendations를 생성·변경하지 않는다.
 *   정렬·표기·표 생성·escape·sanitize·파일명 정리·안전한 오류 메시지만 수행한다.
 * - 외부 의존성 0 (Node 내장 모듈만 — zlib으로 결정적 DOCX(OOXML zip) 수동 조립).
 *
 * DOCX(N4):
 * - Python `build_document_xml`/`_docx_bytes`의 충실 이식 — 동일 OOXML 파트·문구·스타일.
 * - **결정성**: ZIP 엔트리 순서·타임스탬프(1980-01-01)·core.xml 날짜를 고정하고 DEFLATE(level 9)를
 *   사용한다. 동일 findings면 Node가 매번 동일 바이트를 낸다.
 * - **parity 기준**: 각 OOXML 파트의 **압축 해제 콘텐츠가 Python과 byte-identical**(구조+콘텐츠 parity).
 *   압축 스트림은 큰 파트에서 zlib 구현 차로 달라질 수 있어 컨테이너 전체 byte parity는 목표가 아니다.
 * - renderReport()의 대표 문서 우선순위는 **DOCX → HTML → Markdown**이다.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

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

// 결정성을 위한 고정 ZIP 타임스탬프(1980-01-01, ZIP 최소 유효값)와 고정 W3CDTF — Python과 동일.
// DOS date/time 인코딩: 1980-01-01 00:00:00 → date=0x0021, time=0x0000.
const _FIXED_DOS_DATE = 0x0021;
const _FIXED_DOS_TIME = 0x0000;
const _FIXED_W3CDTF = "2024-01-01T00:00:00Z";

const _W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

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
// DOCX (stdlib zlib OOXML 수동 조립 — 재판정 없음. Python build_document_xml/_docx_bytes 이식)
// ===========================================================================

// DOCX 텍스트 삽입 경로 공통 escape: 금지 제어문자 제거 → XML escape.
// Python `_esc`와 동일 — HTML의 `_h`와 달리 작은따옴표(')는 이스케이프하지 않는다.
function _escDocx(s) {
  const text = _sanitizeXmlText(_s(s));
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _run(text, bold = false) {
  const rpr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  return `<w:r>${rpr}<w:t xml:space="preserve">${_escDocx(text)}</w:t></w:r>`;
}

function _p(runs, style = null) {
  const rr = typeof runs === "string" ? [_run(runs)] : runs;
  const ppr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${ppr}${rr.join("")}</w:p>`;
}

function _titlePara(text) {
  return _p([_run(text, true)], "Title");
}

function _h1(text) {
  return _p(text, "Heading1");
}

function _h2docx(text) {
  return _p(text, "Heading2");
}

function _labelPara(label, value) {
  return _p([_run(label, true), _run(value)]);
}

function _cell(text, width, bold = false) {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr>`
    + `${_p([_run(text, bold)])}</w:tc>`;
}

function _tableDocx(header, rows, colWidths) {
  const borders = "<w:tblBorders>"
    + '<w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
    + '<w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
    + '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
    + '<w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
    + '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
    + '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
    + "</w:tblBorders>";
  const total = colWidths.reduce((a, b) => a + b, 0);
  const grid = colWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const out = [`<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${borders}</w:tblPr>`
    + `<w:tblGrid>${grid}</w:tblGrid>`];
  out.push("<w:tr>" + header.map((h, i) => _cell(h, colWidths[i], true)).join("") + "</w:tr>");
  for (const row of rows) {
    let cells = "";
    for (let i = 0; i < colWidths.length; i++) {
      cells += _cell(i < row.length ? row[i] : "", colWidths[i]);
    }
    out.push(`<w:tr>${cells}</w:tr>`);
  }
  out.push("</w:tbl>");
  // 표 뒤에는 빈 문단(Word 호환).
  out.push("<w:p/>");
  return out.join("");
}

function buildDocumentXml(findings) {
  _validateRenderable(findings);
  const meta = _dict(findings.report_meta);
  const areas = _list(findings.kssb_areas);
  const sources = _list(findings.source_documents);
  const items = _allItems(areas);
  const parts = [];

  const title = _s(meta.report_title) || "KSSB 공시근거 사전검토 보고서 (초안)";

  // 1. 표지 및 고지
  parts.push(_titlePara(title));
  if (meta.generated_for) parts.push(_labelPara("검토 대상: ", _s(meta.generated_for)));
  if (meta.review_purpose) parts.push(_labelPara("검토 목적: ", _s(meta.review_purpose)));
  parts.push(_labelPara("검토 모드(review_mode): ", _s(meta.review_mode)));
  if (meta.created_at) parts.push(_labelPara("생성 시각: ", _s(meta.created_at)));
  if (meta.disclaimer) parts.push(_labelPara("고지: ", _s(meta.disclaimer)));

  // 2. 검토 개요
  parts.push(_h1("1. 검토 개요"));
  parts.push(_p("검토 범위: KSSB 4대 영역(거버넌스·전략·위험관리·지표 및 목표) MVP. "
    + "본 문서는 구조화 findings를 재판정 없이 형식 변환한 컨설턴트 검수용 초안이다."));
  if (sources.length) {
    parts.push(_h2docx("검토 대상 자료 (source_documents)"));
    const rows = sources.map((sRaw) => {
      const s = _dict(sRaw);
      return [_s(s.source_id), _s(s.title), _s(s.document_type), _s(s.source_mode), _s(s.date_or_period)];
    });
    parts.push(_tableDocx(["source_id", "제목", "유형", "출처 모드", "기간/발행"],
      rows, [1400, 2800, 1800, 1600, 1600]));
  }

  // 3. 상태 요약
  parts.push(_h1("2. 상태 요약"));
  parts.push(_labelPara("총 검토 항목: ", `${items.length}건`));
  parts.push(_tableDocx(["판정 라벨", "항목 수"],
    _judgmentCountRows(items).map(([label, cnt]) => [label, String(cnt)]),
    [6400, 2800]));
  parts.push(_h2docx("항목-판정 요약"));
  const itRows = [];
  for (const aRaw of _orderedAreas(areas)) {
    const a = _dict(aRaw);
    const areaName = _s(a.area_name);
    for (const itRaw of _list(a.items)) {
      const it = _dict(itRaw);
      itRows.push([areaName, _s(it.requirement_title), _s(it.judgment_label), _s(it.item_id)]);
    }
  }
  parts.push(_tableDocx(["영역", "공시요구", "판정", "항목ID"], itRows, [1600, 3800, 2400, 1400]));

  // 4. 영역별 항목 결과와 근거
  parts.push(_h1("3. 영역별 항목 결과와 근거"));
  for (const aRaw of _orderedAreas(areas)) {
    const a = _dict(aRaw);
    parts.push(_h2docx(_s(a.area_name)));
    for (const itRaw of _list(a.items)) {
      const it = _dict(itRaw);
      // 한글 공시요구 제목을 우선, 내부 항목ID는 보조 식별자로.
      parts.push(_p([_run(_s(it.requirement_title), true),
        _run(`  (항목ID: ${_s(it.item_id)})`)]));
      if (it.requirement_description) parts.push(_p(_s(it.requirement_description)));
      parts.push(_labelPara("판정: ", _s(it.judgment_label)));
      const anchors = _list(it.evidence_anchors);
      if (anchors.length) {
        parts.push(_p([_run("판단 근거(원문 인용·위치):", true)]));
        for (const ancRaw of anchors) {
          const anc = _dict(ancRaw);
          const loc = _s(anc.page_or_section);
          parts.push(_p(`  · 인용: “${_s(anc.quote)}”`));
          const srcLine = `    출처: ${_s(anc.source_id)}` + (loc ? ` · 위치: ${loc}` : "");
          parts.push(_p(srcLine));
          if (anc.relevance_note) parts.push(_p(`    근거 설명: ${_s(anc.relevance_note)}`));
        }
      } else {
        parts.push(_p("근거 앵커 없음."));
      }
      for (const m of _list(it.missing_info)) {
        if (_s(m)) parts.push(_p(`  · 부족 정보/사유: ${_s(m)}`));
      }
      if (it.human_review_required) {
        parts.push(_labelPara("사람 검수 필요: ", _s(it.human_review_note)));
      }
    }
  }

  // 5. 고객 확인 질문 및 요청자료
  parts.push(_h1("4. 고객 확인 질문 및 요청자료"));
  const questions = _collectQuestions(areas);
  if (questions.length) {
    parts.push(_p("우선순위(상→하) 순. 각 질문은 질문사유·관련근거와 함께 요청자료와 후속조치를 제시합니다."));
    const qRows = questions.map((q) => [q.item_id, q.requirement_title, q.question, q.reason,
      q.related_evidence, _priorityDisplay(q.priority), q.requested_material, q.follow_up_action]);
    parts.push(_tableDocx(
      ["항목ID", "항목명", "질문", "질문사유", "관련근거", "우선순위", "요청자료", "후속조치"],
      qRows, [900, 1300, 1600, 1300, 1200, 800, 1300, 1400]));
  } else {
    parts.push(_p("고객 확인 질문이 없습니다."));
  }

  // 6. 보완 권고
  parts.push(_h1("5. 보완 권고"));
  let anyRec = false;
  for (const aRaw of _orderedAreas(areas)) {
    for (const itRaw of _list(_dict(aRaw).items)) {
      const it = _dict(itRaw);
      for (const r of _list(it.recommendations)) {
        if (_s(r)) {
          anyRec = true;
          parts.push(_p([_run(`[${_s(it.item_id)}] ${_s(it.requirement_title)}: `, true), _run(_s(r))]));
        }
      }
    }
  }
  if (!anyRec) parts.push(_p("등록된 보완 권고가 없습니다."));

  // 7. 한계와 사람 검수 안내
  parts.push(_h1("6. 한계와 사람 검수 안내"));
  for (const x of _list(findings.overall_limitations)) {
    if (_s(x)) parts.push(_p(`- ${_s(x)}`));
  }
  const hrItems = items.filter((it) => it.human_review_required);
  if (hrItems.length) {
    parts.push(_p([_run("사람 검수 대상 항목:", true)]));
    for (const it of hrItems) {
      parts.push(_p(`  · [${_s(it.item_id)}] ${_s(it.requirement_title)} — ${_s(it.human_review_note)}`));
    }
  }
  const ptc = _dict(findings.prohibited_terms_check);
  if (Object.keys(ptc).length) {
    const found = _list(ptc.prohibited_terms_found).map(_s).filter((x) => x);
    parts.push(_labelPara("금지 표현 점검: ",
      `수행=${_s(ptc.performed)}, 고지문 존재=${_s(ptc.disclaimer_present)}, `
      + `발견=${found.length === 0 ? "없음" : found.join(", ")}.`));
    if (ptc.notes) parts.push(_p(_s(ptc.notes)));
  }
  if (findings.human_review_boundary) {
    parts.push(_labelPara("사람 검수 경계: ", _s(findings.human_review_boundary)));
  }

  const body = parts.join("");
  const sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
    + '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" '
    + 'w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + `<w:document xmlns:w="${_W}"><w:body>${body}${sect}</w:body></w:document>`;
}

function _contentTypes() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    + '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
    + "</Types>";
}

function _rootRels() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
    + "</Relationships>";
}

function _documentRels() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
    + "</Relationships>";
}

function _styles() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + `<w:styles xmlns:w="${_W}">`
    + '<w:docDefaults><w:rPrDefault><w:rPr>'
    + '<w:rFonts w:ascii="Malgun Gothic" w:eastAsia="Malgun Gothic" w:hAnsi="Malgun Gothic"/>'
    + '<w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults>'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/>'
    + '<w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/>'
    + '<w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>'
    + '<w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/>'
    + '<w:pPr><w:spacing w:before="200" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr>'
    + '<w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>'
    + "</w:styles>";
}

function _settings() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + `<w:settings xmlns:w="${_W}"/>`;
}

function _app() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">'
    + "<Application>samil-kssb-precheck-renderer</Application></Properties>";
}

function _core(title) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + "<cp:coreProperties "
    + 'xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
    + 'xmlns:dc="http://purl.org/dc/elements/1.1/" '
    + 'xmlns:dcterms="http://purl.org/dc/terms/" '
    + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    + `<dc:title>${_escDocx(title)}</dc:title>`
    + "<dc:creator>samil-kssb-precheck-renderer</dc:creator>"
    + `<dcterms:created xsi:type="dcterms:W3CDTF">${_FIXED_W3CDTF}</dcterms:created>`
    + `<dcterms:modified xsi:type="dcterms:W3CDTF">${_FIXED_W3CDTF}</dcterms:modified>`
    + "</cp:coreProperties>";
}

// ---- 결정적 최소 ZIP 조립(고정 타임스탬프·엔트리 순서·DEFLATE level 9) ----------------
// Python zipfile(BytesIO, ZIP_DEFLATED, compresslevel=9, date_time 고정, external_attr=0o644<<16)의
// 컨테이너 레이아웃을 그대로 재현한다: version=20·host=0(FAT)·extra field 없음·data descriptor 없음.
// **결정성**: 동일 findings면 Node가 매번 동일 바이트를 낸다(타임스탬프·엔트리 순서·압축 파라미터 고정).
// **Python과의 관계**: 각 엔트리의 압축 해제 콘텐츠(XML)는 Python과 byte-identical(콘텐츠 parity의 근거).
// 단 압축 스트림은 큰 파트(word/document.xml)에서 Node/Python zlib 구현 차로 달라질 수 있어
// **컨테이너 전체 byte parity는 보장하지 않는다**(허용 차이 — 문서화). 검증은 구조+콘텐츠+결정성 parity.

function buildDeterministicZip(entries) {
  // entries: [{ name, bytes(Buffer) }] — 입력 순서를 그대로 보존(엔트리 순서 결정성).
  const localChunks = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf-8");
    const crc = zlib.crc32(e.bytes) >>> 0;
    const compressed = zlib.deflateRawSync(e.bytes, { level: 9 });
    const csize = compressed.length;
    const usize = e.bytes.length;

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); // local file header signature
    lh.writeUInt16LE(20, 4); // version needed to extract (2.0)
    lh.writeUInt16LE(0, 6); // general purpose bit flag
    lh.writeUInt16LE(8, 8); // compression method: DEFLATE
    lh.writeUInt16LE(_FIXED_DOS_TIME, 10);
    lh.writeUInt16LE(_FIXED_DOS_DATE, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(csize, 18);
    lh.writeUInt32LE(usize, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28); // extra field length
    localChunks.push(lh, nameBuf, compressed);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); // central directory header signature
    ch.writeUInt16LE(20, 4); // version made by (host=0/FAT, version 2.0)
    ch.writeUInt16LE(20, 6); // version needed to extract
    ch.writeUInt16LE(0, 8); // general purpose bit flag
    ch.writeUInt16LE(8, 10); // compression method
    ch.writeUInt16LE(_FIXED_DOS_TIME, 12);
    ch.writeUInt16LE(_FIXED_DOS_DATE, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(csize, 20);
    ch.writeUInt32LE(usize, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30); // extra field length
    ch.writeUInt16LE(0, 32); // file comment length
    ch.writeUInt16LE(0, 34); // disk number start
    ch.writeUInt16LE(0, 36); // internal file attributes
    ch.writeUInt32LE(0x01a40000, 38); // external file attributes (0o644 << 16)
    ch.writeUInt32LE(offset, 42); // relative offset of local header
    central.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + compressed.length;
  }

  const centralStart = offset;
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // number of this disk
  eocd.writeUInt16LE(0, 6); // disk where central directory starts
  eocd.writeUInt16LE(entries.length, 8); // central dir records on this disk
  eocd.writeUInt16LE(entries.length, 10); // total central dir records
  eocd.writeUInt32LE(centralBuf.length, 12); // size of central directory
  eocd.writeUInt32LE(centralStart, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localChunks, centralBuf, eocd]);
}

/** DOCX 바이트를 결정적으로 조립한다(엔트리 순서·타임스탬프 고정 — Python `_docx_bytes` 이식). */
function docxBytes(findings) {
  const meta = _dict(findings.report_meta);
  const title = _s(meta.report_title) || "KSSB 공시근거 사전검토 보고서 (초안)";
  const entries = [
    ["[Content_Types].xml", _contentTypes()],
    ["_rels/.rels", _rootRels()],
    ["docProps/core.xml", _core(title)],
    ["docProps/app.xml", _app()],
    ["word/_rels/document.xml.rels", _documentRels()],
    ["word/styles.xml", _styles()],
    ["word/settings.xml", _settings()],
    ["word/document.xml", buildDocumentXml(findings)],
  ].map(([name, data]) => ({ name, bytes: Buffer.from(data, "utf-8") }));
  return buildDeterministicZip(entries);
}

// ===========================================================================
// 공개 진입점 (DOCX → HTML → Markdown. Python render_report 이식)
// ===========================================================================

function _baseName(findings, override) {
  if (override) return sanitizeFilenameBase(override);
  const meta = _dict(findings.report_meta);
  return sanitizeFilenameBase(_s(meta.generated_for) || _s(meta.report_title));
}

/**
 * findings를 대표 문서로 변환한다(동일 findings 단일 소스, 재판정 없음).
 * 반환: {"docx", "html", "markdown", "primary", "primary_format", "docx_error"}.
 * - 우선순위: DOCX → HTML → Markdown. DOCX 조립 실패 시에도 HTML/Markdown fallback은 항상 생성한다.
 * - options.preferDocx=false(또는 htmlOnly)면 DOCX를 생략한다(내부/검증용).
 */
function renderReport(findings, outDir, options = {}) {
  const { baseName = null, preferDocx = true } = options;
  _validateRenderable(findings);
  fs.mkdirSync(outDir, { recursive: true });
  const base = _baseName(findings, baseName);
  const stem = `${base}${FILENAME_SUFFIX}`;

  const result = { docx: null, html: null, markdown: null, primary: null, primary_format: null, docx_error: null };

  // HTML·Markdown fallback은 동일 findings 단일 소스에서 항상 생성(재판정 없음).
  const htmlPath = path.join(outDir, `${stem}.html`);
  fs.writeFileSync(htmlPath, renderHtml(findings), "utf-8");
  result.html = htmlPath;

  const mdPath = path.join(outDir, `${stem}.md`);
  fs.writeFileSync(mdPath, renderMarkdown(findings), "utf-8");
  result.markdown = mdPath;

  if (preferDocx) {
    try {
      const data = docxBytes(findings);
      const docxPath = path.join(outDir, `${stem}.docx`);
      fs.writeFileSync(docxPath, data);
      result.docx = docxPath;
    } catch (exc) {
      // DOCX 실패 시 HTML/Markdown fallback으로 계속(사용자-facing에는 상세 미노출 — 값에만).
      result.docx_error = `${exc && exc.name ? exc.name : "Error"}: ${exc && exc.message ? exc.message : exc}`;
    }
  }

  // 대표 문서 선정(우선순위 DOCX → HTML → Markdown).
  for (const fmt of ["docx", "html", "markdown"]) {
    if (result[fmt]) {
      result.primary = result[fmt];
      result.primary_format = fmt;
      break;
    }
  }
  return result;
}

function loadFindings(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

module.exports = {
  AREA_ORDER, JUDGMENT_CODE_ORDER, PRIORITY_LABEL, FILENAME_SUFFIX,
  RenderError, sanitizeFilenameBase, renderHtml, renderMarkdown,
  buildDocumentXml, docxBytes, buildDeterministicZip, renderReport, loadFindings,
};
