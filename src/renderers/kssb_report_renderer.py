"""Samil KSSB Precheck - Findings Report Renderer (Cycle 2C, minimal).

구조화 findings(`src/schemas/kssb_findings.schema.json`)를 입력으로 받아, **재판정 없이**
대표 DOCX와 HTML fallback으로 형식 변환하는 최소 렌더러다.

포지셔닝:
- 이 모듈은 사용자-facing Python CLI가 아니라, Skill `samil-kssb-precheck` 워크플로우가 사용하는
  **내부 형식 변환기**다. 사용자는 Skill 하나만 의식하며, 렌더러는 findings → 대표 문서 단계를 담당한다.
- 렌더러는 findings를 **재판정하지 않는다.** judgment_code/judgment_label을 그대로 소비하고,
  evidence_anchors/quote/missing_info/customer_questions/recommendations를 **생성하거나 변경하지 않는다.**
  정렬·표기·표 생성·escape·sanitize·파일명 정리·안전한 오류 메시지만 수행한다.

의존성:
- Python 표준 라이브러리만 사용한다(json, re, html, zipfile, argparse, pathlib, sys, datetime).
- 외부 패키지(python-docx 등)를 추가하지 않는다.

결정성(동일 findings = 동일 출력):
- ZIP 엔트리 순서를 고정하고, 모든 ZIP 엔트리 date_time을 고정값으로 둔다.
- core.xml의 created/modified를 고정 상수로 둔다.
- 영역·판정 순서를 스키마 enum 순으로 고정한다.

설계 참고: 기존 참고 엔진의 stdlib OOXML 조립·XML sanitizer·Word open failure 회피 경험을
설계 근거로만 계승했으며, 코드를 복사하지 않고 이 스키마에 맞게 신규 구현했다.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import zipfile
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# 상수 / 고정 순서 (재판정 아님 — 표기 순서와 표시 라벨 매핑만)
# ---------------------------------------------------------------------------

# KSSB 4대 영역 고정 순서(스키마 enum 순). 알 수 없는 영역은 입력 순서로 뒤에 붙인다.
AREA_ORDER = ["governance", "strategy", "risk_management", "metrics_and_targets"]

# judgment_code 고정 순서(상태 요약 정렬용). 렌더러는 code를 재계산하지 않고 표시 순서만 정한다.
JUDGMENT_CODE_ORDER = [
    "evidence_confirmed",
    "partial_evidence_needs_supplement",
    "not_verifiable",
    "conflict_or_interpretation_needed",
    "out_of_scope_or_not_applicable",
]

# 우선순위 코드 → 문서 표기(상/중/하). 표기 변환일 뿐 판정이 아니다.
PRIORITY_LABEL = {"high": "상", "medium": "중", "low": "하"}
PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}

# 대표 문서 파일명 접미(계약: <보고서명>_KSSB_공시근거_사전검토보고서.docx / .html)
FILENAME_SUFFIX = "_KSSB_공시근거_사전검토보고서"

# 결정성을 위한 고정 ZIP 타임스탬프(1980-01-01, ZIP 최소 유효값)와 고정 W3CDTF.
_FIXED_DT = (1980, 1, 1, 0, 0, 0)
_FIXED_W3CDTF = "2024-01-01T00:00:00Z"

_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

# XML 1.0에서 허용되지 않는 제어문자(\t,\n,\r은 허용). 텍스트에 유입되면 Word가 DOCX를 열지 못하므로
# XML 삽입 전에 제거한다. 특정 문구가 아니라 '금지 제어문자'라는 일반 규칙이다.
_XML_INVALID_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")


class RenderError(Exception):
    """findings 구조가 렌더 불가한 경우의 안전한 오류(내용을 지어내지 않는다)."""


# ---------------------------------------------------------------------------
# 안전한 필드 접근 (누락 필드에 대한 안전한 처리 — 내용 보강 금지)
# ---------------------------------------------------------------------------

def _s(value: Any) -> str:
    """값을 문자열로 안전 변환. None/누락은 빈 문자열."""
    return "" if value is None else str(value)


def _list(value: Any) -> list:
    return value if isinstance(value, list) else []


def _dict(value: Any) -> dict:
    return value if isinstance(value, dict) else {}


def _sanitize_xml_text(s: str) -> str:
    """XML 1.0 금지 제어문자를 제거한다(\\t,\\n,\\r 및 일반 문자는 보존)."""
    return _XML_INVALID_RE.sub("", s)


def sanitize_filename_base(name: str) -> str:
    """파일명 base를 안전하게 정리한다.

    - 경로 구분자/금지 문자 제거, 공백은 밑줄로, 앞뒤 정리, 길이 제한.
    - 내부 경로/드라이브가 파일명으로 새어나가지 않도록 방어한다.
    """
    name = _sanitize_xml_text(_s(name)).strip()
    # 경로 구분자와 Windows 금지 문자 제거
    name = re.sub(r'[\\/:*?"<>|]', " ", name)
    # 괄호류는 제거, 연속 공백은 하나로
    name = re.sub(r"[()\[\]{}]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    name = name.replace(" ", "_")
    name = name.strip("._")
    if not name:
        name = "KSSB_사전검토"
    return name[:80]


def _judgment_count_rows(items: list[dict]) -> list[tuple[str, int]]:
    """판정 라벨별 항목 수를 judgment_code 고정 순서로 집계한다(라벨은 findings 값을 그대로 사용)."""
    # code -> (대표 label, count). 라벨은 입력 findings의 judgment_label을 그대로 사용(재판정 아님).
    label_by_code: dict[str, str] = {}
    count_by_code: dict[str, int] = {}
    for it in items:
        code = _s(it.get("judgment_code"))
        label = _s(it.get("judgment_label")) or code or "(판정 없음)"
        count_by_code[code] = count_by_code.get(code, 0) + 1
        label_by_code.setdefault(code, label)
    rows: list[tuple[str, int]] = []
    seen = set()
    for code in JUDGMENT_CODE_ORDER:
        if code in count_by_code:
            rows.append((label_by_code[code], count_by_code[code]))
            seen.add(code)
    # 스키마 밖 코드가 있으면 뒤에 붙인다(입력 보존).
    for code, cnt in count_by_code.items():
        if code not in seen:
            rows.append((label_by_code.get(code, code or "(판정 없음)"), cnt))
    return rows


def _ordered_areas(areas: list[dict]) -> list[dict]:
    """영역을 스키마 enum 순으로 정렬한다(알 수 없는 영역은 입력 순서로 뒤에)."""
    def key(a: dict) -> tuple[int, int]:
        aid = _s(a.get("area_id"))
        idx = AREA_ORDER.index(aid) if aid in AREA_ORDER else len(AREA_ORDER)
        return (idx, 0)
    # stable sort로 입력 순서 보존
    indexed = list(enumerate(areas))
    indexed.sort(key=lambda pair: (key(pair[1])[0], pair[0]))
    return [a for _, a in indexed]


def _all_items(areas: list[dict]) -> list[dict]:
    out: list[dict] = []
    for a in _ordered_areas(areas):
        for it in _list(a.get("items")):
            out.append(_dict(it))
    return out


def _collect_questions(areas: list[dict]) -> list[dict]:
    """모든 항목의 customer_questions를 상위 항목ID·항목명과 함께 수집, 우선순위 순 정렬."""
    rows: list[dict] = []
    for a in _ordered_areas(areas):
        area_name = _s(a.get("area_name"))
        for order, it in enumerate(_list(a.get("items"))):
            it = _dict(it)
            item_id = _s(it.get("item_id"))
            title = _s(it.get("requirement_title"))
            for q in _list(it.get("customer_questions")):
                q = _dict(q)
                rows.append({
                    "area_name": area_name,
                    "item_id": item_id,
                    "requirement_title": title,
                    "input_order": order,
                    "question": _s(q.get("question")),
                    "reason": _s(q.get("reason")),
                    "related_evidence": _s(q.get("related_evidence")),
                    "priority": _s(q.get("priority")),
                    "requested_material": _s(q.get("requested_material")),
                    "follow_up_action": _s(q.get("follow_up_action")),
                })
    rows.sort(key=lambda r: PRIORITY_ORDER.get(r["priority"], 99))
    return rows


def _priority_display(code: str) -> str:
    label = PRIORITY_LABEL.get(code)
    return f"{label}({code})" if label else (code or "-")


def _validate_findings(findings: dict) -> None:
    """렌더 가능한 최소 구조만 확인한다(재판정·검증 아님, 안전한 오류 메시지용)."""
    if not isinstance(findings, dict):
        raise RenderError("findings 최상위가 객체(JSON object)가 아닙니다.")
    if not isinstance(findings.get("report_meta"), dict):
        raise RenderError("report_meta 객체가 없습니다.")
    if not isinstance(findings.get("kssb_areas"), list) or not findings["kssb_areas"]:
        raise RenderError("kssb_areas 배열이 비어 있거나 없습니다.")


# ===========================================================================
# HTML fallback (동일 findings 단일 소스에서 파생 — 재판정 없음)
# ===========================================================================

def _h(value: Any) -> str:
    """HTML escape (제어문자 제거 후)."""
    return html.escape(_sanitize_xml_text(_s(value)), quote=True)


def render_html(findings: dict) -> str:
    _validate_findings(findings)
    meta = _dict(findings.get("report_meta"))
    areas = _list(findings.get("kssb_areas"))
    sources = _list(findings.get("source_documents"))
    items = _all_items(areas)

    title = _s(meta.get("report_title")) or "KSSB 공시근거 사전검토 보고서 (초안)"
    parts: list[str] = []
    parts.append("<!DOCTYPE html>")
    parts.append('<html lang="ko"><head><meta charset="utf-8">')
    parts.append(f"<title>{_h(title)}</title>")
    parts.append(
        "<style>"
        "body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;"
        "line-height:1.55;color:#1a1a1a;max-width:960px;margin:24px auto;padding:0 16px;}"
        "h1{font-size:1.7em;} h2{font-size:1.3em;margin-top:1.6em;border-bottom:1px solid #ccc;padding-bottom:4px;}"
        "h3{font-size:1.08em;margin-top:1.2em;}"
        "table{border-collapse:collapse;width:100%;margin:8px 0;}"
        "th,td{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top;font-size:0.94em;}"
        "th{background:#f2f2f2;}"
        ".disclaimer,.boundary{background:#fbf6e9;border:1px solid #e5d9b0;padding:10px 12px;border-radius:4px;}"
        ".boundary{background:#eef4fb;border-color:#b8d0e8;}"
        ".quote{color:#333;background:#f7f7f7;border-left:3px solid #bbb;padding:4px 8px;margin:4px 0;}"
        ".loc{color:#666;font-size:0.88em;} .muted{color:#666;}"
        "</style></head><body>"
    )

    # 1. 표지 및 고지
    parts.append(f"<h1>{_h(title)}</h1>")
    if meta.get("generated_for"):
        parts.append(f"<p><strong>검토 대상:</strong> {_h(meta.get('generated_for'))}</p>")
    if meta.get("review_purpose"):
        parts.append(f"<p><strong>검토 목적:</strong> {_h(meta.get('review_purpose'))}</p>")
    parts.append(f"<p><strong>검토 모드(review_mode):</strong> {_h(meta.get('review_mode'))}</p>")
    if meta.get("created_at"):
        parts.append(f"<p><strong>생성 시각:</strong> {_h(meta.get('created_at'))}</p>")
    disclaimer = _s(meta.get("disclaimer"))
    if disclaimer:
        parts.append(f'<div class="disclaimer"><strong>고지:</strong> {_h(disclaimer)}</div>')

    # 2. 검토 개요 (검토 대상 자료)
    parts.append("<h2>1. 검토 개요</h2>")
    parts.append("<p>검토 범위: KSSB 4대 영역(거버넌스·전략·위험관리·지표 및 목표) MVP. "
                 "본 문서는 구조화 findings를 재판정 없이 형식 변환한 컨설턴트 검수용 초안이다.</p>")
    if sources:
        parts.append("<h3>검토 대상 자료 (source_documents)</h3>")
        parts.append("<table><tr><th>source_id</th><th>제목</th><th>유형</th>"
                     "<th>출처 모드</th><th>기간/발행</th><th>비고</th></tr>")
        for sdoc in sources:
            sdoc = _dict(sdoc)
            parts.append(
                "<tr>"
                f"<td>{_h(sdoc.get('source_id'))}</td>"
                f"<td>{_h(sdoc.get('title'))}</td>"
                f"<td>{_h(sdoc.get('document_type'))}</td>"
                f"<td>{_h(sdoc.get('source_mode'))}</td>"
                f"<td>{_h(sdoc.get('date_or_period'))}</td>"
                f"<td>{_h(sdoc.get('notes'))}</td>"
                "</tr>"
            )
        parts.append("</table>")

    # 3. 상태 요약
    parts.append("<h2>2. 상태 요약</h2>")
    parts.append(f"<p>총 검토 항목: {len(items)}건</p>")
    parts.append("<table><tr><th>판정 라벨</th><th>항목 수</th></tr>")
    for label, cnt in _judgment_count_rows(items):
        parts.append(f"<tr><td>{_h(label)}</td><td>{cnt}</td></tr>")
    parts.append("</table>")
    parts.append("<h3>항목-판정 요약</h3>")
    parts.append("<table><tr><th>항목ID</th><th>영역</th><th>공시요구</th><th>판정</th></tr>")
    for a in _ordered_areas(areas):
        area_name = _s(a.get("area_name"))
        for it in _list(a.get("items")):
            it = _dict(it)
            parts.append(
                "<tr>"
                f"<td>{_h(it.get('item_id'))}</td>"
                f"<td>{_h(area_name)}</td>"
                f"<td>{_h(it.get('requirement_title'))}</td>"
                f"<td>{_h(it.get('judgment_label'))}</td>"
                "</tr>"
            )
    parts.append("</table>")

    # 4. 영역별 항목 결과와 근거
    parts.append("<h2>3. 영역별 항목 결과와 근거</h2>")
    for a in _ordered_areas(areas):
        a = _dict(a)
        parts.append(f"<h3>{_h(a.get('area_name'))} ({_h(a.get('area_id'))})</h3>")
        for it in _list(a.get("items")):
            it = _dict(it)
            parts.append(f"<p><strong>[{_h(it.get('item_id'))}] {_h(it.get('requirement_title'))}</strong></p>")
            if it.get("requirement_description"):
                parts.append(f"<p class='muted'>{_h(it.get('requirement_description'))}</p>")
            parts.append(f"<p><strong>판정:</strong> {_h(it.get('judgment_label'))}</p>")
            anchors = _list(it.get("evidence_anchors"))
            if anchors:
                parts.append("<p><strong>판단 근거(근거 앵커):</strong></p>")
                for anc in anchors:
                    anc = _dict(anc)
                    loc = _s(anc.get("page_or_section"))
                    loc_html = f'<span class="loc">[{_h(anc.get("source_id"))}{(" · " + _h(loc)) if loc else ""}]</span> '
                    parts.append(f'<div class="quote">{loc_html}“{_h(anc.get("quote"))}”</div>')
                    if anc.get("relevance_note"):
                        parts.append(f'<p class="muted">근거 설명: {_h(anc.get("relevance_note"))}</p>')
            else:
                parts.append("<p class='muted'>근거 앵커 없음.</p>")
            missing = [_s(m) for m in _list(it.get("missing_info")) if _s(m)]
            if missing:
                parts.append("<p><strong>부족 정보 / 판정 사유:</strong></p><ul>")
                for m in missing:
                    parts.append(f"<li>{_h(m)}</li>")
                parts.append("</ul>")
            if it.get("human_review_required"):
                note = _s(it.get("human_review_note"))
                parts.append(f'<p><strong>사람 검수 필요:</strong> {_h(note)}</p>')

    # 5. 고객 확인 질문 및 요청자료
    parts.append("<h2>4. 고객 확인 질문 및 요청자료</h2>")
    questions = _collect_questions(areas)
    if questions:
        parts.append("<table><tr><th>항목ID</th><th>항목명</th><th>질문</th><th>질문사유</th>"
                     "<th>관련근거</th><th>우선순위</th><th>요청자료</th><th>후속조치</th></tr>")
        for q in questions:
            parts.append(
                "<tr>"
                f"<td>{_h(q['item_id'])}</td>"
                f"<td>{_h(q['requirement_title'])}</td>"
                f"<td>{_h(q['question'])}</td>"
                f"<td>{_h(q['reason'])}</td>"
                f"<td>{_h(q['related_evidence'])}</td>"
                f"<td>{_h(_priority_display(q['priority']))}</td>"
                f"<td>{_h(q['requested_material'])}</td>"
                f"<td>{_h(q['follow_up_action'])}</td>"
                "</tr>"
            )
        parts.append("</table>")
    else:
        parts.append("<p class='muted'>고객 확인 질문이 없습니다.</p>")

    # 6. 보완 권고
    parts.append("<h2>5. 보완 권고</h2>")
    recs: list[tuple[str, str, str]] = []
    for a in _ordered_areas(areas):
        for it in _list(a.get("items")):
            it = _dict(it)
            for r in _list(it.get("recommendations")):
                if _s(r):
                    recs.append((_s(it.get("item_id")), _s(it.get("requirement_title")), _s(r)))
    if recs:
        parts.append("<ul>")
        for item_id, rtitle, r in recs:
            parts.append(f"<li><strong>[{_h(item_id)}] {_h(rtitle)}</strong> — {_h(r)}</li>")
        parts.append("</ul>")
    else:
        parts.append("<p class='muted'>등록된 보완 권고가 없습니다.</p>")

    # 7. 한계와 사람 검수 안내
    parts.append("<h2>6. 한계와 사람 검수 안내</h2>")
    limits = [_s(x) for x in _list(findings.get("overall_limitations")) if _s(x)]
    if limits:
        parts.append("<p><strong>전체 한계:</strong></p><ul>")
        for x in limits:
            parts.append(f"<li>{_h(x)}</li>")
        parts.append("</ul>")
    hr_items = [it for it in items if it.get("human_review_required")]
    if hr_items:
        parts.append("<p><strong>사람 검수 대상 항목:</strong></p><ul>")
        for it in hr_items:
            parts.append(f"<li>[{_h(it.get('item_id'))}] {_h(it.get('requirement_title'))} — {_h(it.get('human_review_note'))}</li>")
        parts.append("</ul>")
    ptc = _dict(findings.get("prohibited_terms_check"))
    if ptc:
        found = [_s(x) for x in _list(ptc.get("prohibited_terms_found")) if _s(x)]
        parts.append(
            "<p><strong>금지 표현 점검(prohibited_terms_check):</strong> "
            f"수행={_h(ptc.get('performed'))}, 고지문 존재={_h(ptc.get('disclaimer_present'))}, "
            f"발견된 금지 표현={_h('없음' if not found else ', '.join(found))}.</p>"
        )
        if ptc.get("notes"):
            parts.append(f"<p class='muted'>{_h(ptc.get('notes'))}</p>")
    boundary = _s(findings.get("human_review_boundary"))
    if boundary:
        parts.append(f'<div class="boundary"><strong>사람 검수 경계:</strong> {_h(boundary)}</div>')

    parts.append("</body></html>")
    return "".join(parts)


# ===========================================================================
# DOCX (stdlib zipfile OOXML — 재판정 없음)
# ===========================================================================

def _esc(s: Any) -> str:
    """DOCX 텍스트 삽입 경로 공통 escape: 금지 제어문자 제거 → XML escape."""
    text = _sanitize_xml_text(_s(s))
    return (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def _run(text: str, bold: bool = False) -> str:
    rpr = "<w:rPr><w:b/></w:rPr>" if bold else ""
    return f'<w:r>{rpr}<w:t xml:space="preserve">{_esc(text)}</w:t></w:r>'


def _p(runs: Any, style: str | None = None) -> str:
    if isinstance(runs, str):
        runs = [_run(runs)]
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return f"<w:p>{ppr}{''.join(runs)}</w:p>"


def _title(text: str) -> str:
    return _p([_run(text, bold=True)], "Title")


def _h1(text: str) -> str:
    return _p(text, "Heading1")


def _h2(text: str) -> str:
    return _p(text, "Heading2")


def _label(label: str, value: str) -> str:
    return _p([_run(label, bold=True), _run(value)])


def _cell(text: str, widths: int, bold: bool = False) -> str:
    return (f'<w:tc><w:tcPr><w:tcW w:w="{widths}" w:type="dxa"/></w:tcPr>'
            f'{_p([_run(text, bold=bold)])}</w:tc>')


def _table(header: list[str], rows: list[list[str]], col_widths: list[int]) -> str:
    borders = ("<w:tblBorders>"
               '<w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
               '<w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
               '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
               '<w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
               '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
               '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
               "</w:tblBorders>")
    total = sum(col_widths)
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in col_widths)
    out = [f'<w:tbl><w:tblPr><w:tblW w:w="{total}" w:type="dxa"/>{borders}</w:tblPr>'
           f"<w:tblGrid>{grid}</w:tblGrid>"]
    out.append("<w:tr>" + "".join(_cell(h, col_widths[i], bold=True)
                                  for i, h in enumerate(header)) + "</w:tr>")
    for row in rows:
        cells = "".join(_cell(row[i] if i < len(row) else "", col_widths[i])
                        for i in range(len(col_widths)))
        out.append(f"<w:tr>{cells}</w:tr>")
    out.append("</w:tbl>")
    # 표 뒤에는 빈 문단(Word 호환)
    out.append("<w:p/>")
    return "".join(out)


def build_document_xml(findings: dict) -> str:
    _validate_findings(findings)
    meta = _dict(findings.get("report_meta"))
    areas = _list(findings.get("kssb_areas"))
    sources = _list(findings.get("source_documents"))
    items = _all_items(areas)
    parts: list[str] = []

    title = _s(meta.get("report_title")) or "KSSB 공시근거 사전검토 보고서 (초안)"

    # 1. 표지 및 고지
    parts.append(_title(title))
    if meta.get("generated_for"):
        parts.append(_label("검토 대상: ", _s(meta.get("generated_for"))))
    if meta.get("review_purpose"):
        parts.append(_label("검토 목적: ", _s(meta.get("review_purpose"))))
    parts.append(_label("검토 모드(review_mode): ", _s(meta.get("review_mode"))))
    if meta.get("created_at"):
        parts.append(_label("생성 시각: ", _s(meta.get("created_at"))))
    if meta.get("disclaimer"):
        parts.append(_label("고지: ", _s(meta.get("disclaimer"))))

    # 2. 검토 개요
    parts.append(_h1("1. 검토 개요"))
    parts.append(_p("검토 범위: KSSB 4대 영역(거버넌스·전략·위험관리·지표 및 목표) MVP. "
                    "본 문서는 구조화 findings를 재판정 없이 형식 변환한 컨설턴트 검수용 초안이다."))
    if sources:
        parts.append(_h2("검토 대상 자료 (source_documents)"))
        rows = [[_s(_dict(s).get("source_id")), _s(_dict(s).get("title")),
                 _s(_dict(s).get("document_type")), _s(_dict(s).get("source_mode")),
                 _s(_dict(s).get("date_or_period"))] for s in sources]
        parts.append(_table(["source_id", "제목", "유형", "출처 모드", "기간/발행"],
                            rows, [1400, 2800, 1800, 1600, 1600]))

    # 3. 상태 요약
    parts.append(_h1("2. 상태 요약"))
    parts.append(_label("총 검토 항목: ", f"{len(items)}건"))
    parts.append(_table(["판정 라벨", "항목 수"],
                        [[label, str(cnt)] for label, cnt in _judgment_count_rows(items)],
                        [6400, 2800]))
    parts.append(_h2("항목-판정 요약"))
    it_rows: list[list[str]] = []
    for a in _ordered_areas(areas):
        area_name = _s(a.get("area_name"))
        for it in _list(a.get("items")):
            it = _dict(it)
            it_rows.append([_s(it.get("item_id")), area_name,
                            _s(it.get("requirement_title")), _s(it.get("judgment_label"))])
    parts.append(_table(["항목ID", "영역", "공시요구", "판정"], it_rows, [1400, 1600, 3800, 2400]))

    # 4. 영역별 항목 결과와 근거
    parts.append(_h1("3. 영역별 항목 결과와 근거"))
    for a in _ordered_areas(areas):
        a = _dict(a)
        parts.append(_h2(f"{_s(a.get('area_name'))} ({_s(a.get('area_id'))})"))
        for it in _list(a.get("items")):
            it = _dict(it)
            parts.append(_p([_run(f"[{_s(it.get('item_id'))}] {_s(it.get('requirement_title'))}", bold=True)]))
            if it.get("requirement_description"):
                parts.append(_p(_s(it.get("requirement_description"))))
            parts.append(_label("판정: ", _s(it.get("judgment_label"))))
            anchors = _list(it.get("evidence_anchors"))
            if anchors:
                parts.append(_p([_run("판단 근거(근거 앵커):", bold=True)]))
                for anc in anchors:
                    anc = _dict(anc)
                    loc = _s(anc.get("page_or_section"))
                    prefix = f"[{_s(anc.get('source_id'))}" + (f" · {loc}]" if loc else "]")
                    parts.append(_p(f"  · {prefix} “{_s(anc.get('quote'))}”"))
                    if anc.get("relevance_note"):
                        parts.append(_p(f"    근거 설명: {_s(anc.get('relevance_note'))}"))
            else:
                parts.append(_p("근거 앵커 없음."))
            for m in _list(it.get("missing_info")):
                if _s(m):
                    parts.append(_p(f"  · 부족 정보/사유: {_s(m)}"))
            if it.get("human_review_required"):
                parts.append(_label("사람 검수 필요: ", _s(it.get("human_review_note"))))

    # 5. 고객 확인 질문 및 요청자료
    parts.append(_h1("4. 고객 확인 질문 및 요청자료"))
    questions = _collect_questions(areas)
    if questions:
        q_rows = [[q["item_id"], q["requirement_title"], q["question"], q["reason"],
                   q["related_evidence"], _priority_display(q["priority"]),
                   q["requested_material"], q["follow_up_action"]] for q in questions]
        parts.append(_table(
            ["항목ID", "항목명", "질문", "질문사유", "관련근거", "우선순위", "요청자료", "후속조치"],
            q_rows, [900, 1300, 1600, 1300, 1200, 800, 1300, 1400]))
    else:
        parts.append(_p("고객 확인 질문이 없습니다."))

    # 6. 보완 권고
    parts.append(_h1("5. 보완 권고"))
    any_rec = False
    for a in _ordered_areas(areas):
        for it in _list(a.get("items")):
            it = _dict(it)
            for r in _list(it.get("recommendations")):
                if _s(r):
                    any_rec = True
                    parts.append(_p([_run(f"[{_s(it.get('item_id'))}] {_s(it.get('requirement_title'))}: ", bold=True),
                                     _run(_s(r))]))
    if not any_rec:
        parts.append(_p("등록된 보완 권고가 없습니다."))

    # 7. 한계와 사람 검수 안내
    parts.append(_h1("6. 한계와 사람 검수 안내"))
    for x in _list(findings.get("overall_limitations")):
        if _s(x):
            parts.append(_p(f"- {_s(x)}"))
    hr_items = [it for it in items if it.get("human_review_required")]
    if hr_items:
        parts.append(_p([_run("사람 검수 대상 항목:", bold=True)]))
        for it in hr_items:
            parts.append(_p(f"  · [{_s(it.get('item_id'))}] {_s(it.get('requirement_title'))} — {_s(it.get('human_review_note'))}"))
    ptc = _dict(findings.get("prohibited_terms_check"))
    if ptc:
        found = [_s(x) for x in _list(ptc.get("prohibited_terms_found")) if _s(x)]
        parts.append(_label("금지 표현 점검: ",
                            f"수행={_s(ptc.get('performed'))}, 고지문 존재={_s(ptc.get('disclaimer_present'))}, "
                            f"발견={'없음' if not found else ', '.join(found)}."))
        if ptc.get("notes"):
            parts.append(_p(_s(ptc.get("notes"))))
    if findings.get("human_review_boundary"):
        parts.append(_label("사람 검수 경계: ", _s(findings.get("human_review_boundary"))))

    body = "".join(parts)
    sect = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" '
            'w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>')
    return (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            f'<w:document xmlns:w="{_W}"><w:body>{body}{sect}</w:body></w:document>')


def _content_types() -> str:
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
            '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
            '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
            '</Types>')


def _root_rels() -> str:
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
            '</Relationships>')


def _document_rels() -> str:
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
            '</Relationships>')


def _styles() -> str:
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            f'<w:styles xmlns:w="{_W}">'
            '<w:docDefaults><w:rPrDefault><w:rPr>'
            '<w:rFonts w:ascii="Malgun Gothic" w:eastAsia="Malgun Gothic" w:hAnsi="Malgun Gothic"/>'
            '<w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults>'
            '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
            '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/>'
            '<w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style>'
            '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/>'
            '<w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>'
            '<w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>'
            '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/>'
            '<w:pPr><w:spacing w:before="200" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr>'
            '<w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>'
            '</w:styles>')


def _settings() -> str:
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            f'<w:settings xmlns:w="{_W}"/>')


def _app() -> str:
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">'
            '<Application>samil-kssb-precheck-renderer</Application></Properties>')


def _core(title: str) -> str:
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<cp:coreProperties '
            'xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" '
            'xmlns:dcterms="http://purl.org/dc/terms/" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            f'<dc:title>{_esc(title)}</dc:title>'
            '<dc:creator>samil-kssb-precheck-renderer</dc:creator>'
            f'<dcterms:created xsi:type="dcterms:W3CDTF">{_FIXED_W3CDTF}</dcterms:created>'
            f'<dcterms:modified xsi:type="dcterms:W3CDTF">{_FIXED_W3CDTF}</dcterms:modified>'
            '</cp:coreProperties>')


def _docx_bytes(findings: dict) -> bytes:
    """DOCX 바이트를 결정적으로 조립한다(엔트리 순서·타임스탬프 고정)."""
    meta = _dict(findings.get("report_meta"))
    title = _s(meta.get("report_title")) or "KSSB 공시근거 사전검토 보고서 (초안)"
    entries = [
        ("[Content_Types].xml", _content_types()),
        ("_rels/.rels", _root_rels()),
        ("docProps/core.xml", _core(title)),
        ("docProps/app.xml", _app()),
        ("word/_rels/document.xml.rels", _document_rels()),
        ("word/styles.xml", _styles()),
        ("word/settings.xml", _settings()),
        ("word/document.xml", build_document_xml(findings)),
    ]
    import io
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for name, data in entries:
            zi = zipfile.ZipInfo(name, date_time=_FIXED_DT)
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            zf.writestr(zi, data.encode("utf-8"))
    return buf.getvalue()


# ===========================================================================
# 공개 진입점
# ===========================================================================

def _base_name(findings: dict, override: str | None) -> str:
    if override:
        return sanitize_filename_base(override)
    meta = _dict(findings.get("report_meta"))
    return sanitize_filename_base(_s(meta.get("generated_for")) or _s(meta.get("report_title")))


def render_report(findings: dict, out_dir: str | Path, base_name: str | None = None,
                  prefer_docx: bool = True) -> dict:
    """findings를 대표 문서로 변환한다.

    반환: {"docx": <경로 또는 None>, "html": <경로>, "docx_error": <문자열 또는 None>}
    - DOCX 조립에 실패하면 예외를 삼키지 않되, HTML fallback은 항상 생성한다.
    """
    _validate_findings(findings)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    base = _base_name(findings, base_name)
    stem = f"{base}{FILENAME_SUFFIX}"

    result: dict = {"docx": None, "html": None, "docx_error": None}

    # HTML fallback은 동일 findings 단일 소스에서 항상 생성(재판정 없음).
    html_path = out_dir / f"{stem}.html"
    html_path.write_text(render_html(findings), encoding="utf-8")
    result["html"] = str(html_path)

    if prefer_docx:
        try:
            data = _docx_bytes(findings)
            docx_path = out_dir / f"{stem}.docx"
            docx_path.write_bytes(data)
            result["docx"] = str(docx_path)
        except Exception as exc:  # noqa: BLE001 - DOCX 실패 시 HTML fallback으로 계속
            result["docx_error"] = f"{type(exc).__name__}: {exc}"
    return result


def load_findings(path: str | Path) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    return json.loads(text)


def _main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Samil KSSB Precheck 내부 findings 렌더러(재판정 없음). "
                    "Skill 워크플로우가 findings를 대표 DOCX/HTML로 변환할 때 사용한다.")
    parser.add_argument("findings", help="findings JSON 경로")
    parser.add_argument("-o", "--out-dir", default=".", help="출력 디렉터리(기본: 현재 디렉터리)")
    parser.add_argument("--base-name", default=None, help="파일명 base 재정의(기본: generated_for 또는 report_title)")
    parser.add_argument("--html-only", action="store_true", help="HTML fallback만 생성")
    args = parser.parse_args(argv)

    try:
        findings = load_findings(args.findings)
    except (OSError, ValueError) as exc:
        print(f"[error] findings 로드 실패: {exc}", file=sys.stderr)
        return 2

    try:
        out = render_report(findings, args.out_dir, base_name=args.base_name,
                            prefer_docx=not args.html_only)
    except RenderError as exc:
        print(f"[error] 렌더 불가: {exc}", file=sys.stderr)
        return 3

    if out.get("docx"):
        print(f"DOCX: {out['docx']}")
    elif out.get("docx_error"):
        print(f"[warn] DOCX 생성 실패, HTML fallback 사용: {out['docx_error']}", file=sys.stderr)
    print(f"HTML: {out['html']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
