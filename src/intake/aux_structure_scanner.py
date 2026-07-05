"""Samil KSSB Precheck - HWPX/DOCX Auxiliary Structure Scanner (Cycle 2L-4B, provisional).

이 모듈은 **plugin core 밖의 선택적(opt-in) 보조 스캐너**다. 로컬 HWPX/DOCX 파일의 zip+xml
구조에서 **문서 수준 보조 구조 신호**(이미지/표/caption/heading/chart 카운트 — Cycle 2L-3D
signal model)를 결정적으로 추출한다. 주 추출기(예: Kordoc) 결과의 **교차확인(cross-check)·
gap 신호 재료**를 만들 뿐이며, 그 자체로 판정·해석을 하지 않는다.

경계(무엇을 하지 않는가) — 2L-4A 설계·Codex 2L-3D/2L-4A Review 정합:
- **판정을 만들지 않는다.** 스타일 이름·도형 수로 의미/차트 수치/KSSB 충족을 추정하지 않는다.
- **원문을 보존하지 않는다.** raw XML·이미지 바이트·문단 텍스트를 산출물에 담지 않는다(카운트·이름 수준 메타만).
- **findings가 아니다.** 산출물(aux_signals)은 DEI-candidate 병합 재료/검수 신호일 뿐,
  renderer/validator/delivery에 직접 유입되지 않는다.
- **실행·네트워크 없음.** 로컬 zip 파일만 읽는다. 네트워크 모듈을 import하지 않는다(표준 라이브러리만).

방어 규칙(Codex 2L-4A test strategy):
- **member allowlist**: 정해진 멤버(mimetype/header/section/document/styles/rels)만 내용을 읽는다.
  리소스(BinData/media)는 **이름만 센다**(바이트 미읽기).
- **bounded read**: 멤버당/총합 크기 상한 초과 시 실패(fail-fast).
- **zip-slip 방어**: `..`·절대경로·드라이브 문자 멤버명이 있으면 거부.
- **결정성**: 동일 입력 → 동일 직렬화(고정 키 순서·정렬된 목록).

출력: aux_signals dict (2L-4A 설계 §Data flow의 aux_signals.json 계약). 실패는 AuxScanError.
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from pathlib import Path

AUX_SIGNALS_VERSION = "1"

# bounded read 상한(방어적 기본값 — 합성/실무 문서 XML에 충분히 여유).
MAX_MEMBER_BYTES = 30_000_000
MAX_TOTAL_READ_BYTES = 60_000_000

# 내용을 읽어도 되는 멤버(allowlist). 이 밖의 멤버는 이름만 관찰한다.
_HWPX_READ_ALLOWLIST = (re.compile(r"^mimetype$"),
                        re.compile(r"^Contents/header\.xml$"),
                        re.compile(r"^Contents/section\d+\.xml$"))
_DOCX_READ_ALLOWLIST = (re.compile(r"^\[Content_Types\]\.xml$"),
                        re.compile(r"^word/document\.xml$"),
                        re.compile(r"^word/styles\.xml$"),
                        re.compile(r"^word/_rels/document\.xml\.rels$"))

# heading/caption 후보 스타일 이름 패턴(구조 신호용 — 의미 해석 아님).
_HEADING_NAME_RE = re.compile(r"(개요|제목|heading|outline|title)", re.IGNORECASE)
_OUTLINE_NAME_RE = re.compile(r"(개요|outline|^Heading\s*\d|heading \d)", re.IGNORECASE)
_CAPTION_NAME_RE = re.compile(r"(캡션|caption|표 제목|그림 제목|table title|figure title)", re.IGNORECASE)

_W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


class AuxScanError(ValueError):
    """보조 스캔 입력이 유효하지 않거나 방어 규칙 위반일 때."""


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def _check_member_names(names: list[str]) -> None:
    """zip-slip/경로 탈출 방어: 의심 멤버명이 하나라도 있으면 전체 거부."""
    for n in names:
        if n.startswith("/") or n.startswith("\\") or ".." in n.replace("\\", "/").split("/") \
                or re.match(r"^[A-Za-z]:", n):
            raise AuxScanError(f"suspicious zip member name (path traversal): {n!r}")


def _read_member(z: zipfile.ZipFile, name: str, budget: dict) -> bytes:
    """allowlist 멤버를 크기 상한 검사 후 읽는다(bounded read)."""
    try:
        info = z.getinfo(name)
    except KeyError:
        raise AuxScanError(f"required member missing: {name!r}")
    if info.file_size > MAX_MEMBER_BYTES:
        raise AuxScanError(f"member too large: {name!r} ({info.file_size} bytes)")
    budget["total"] += info.file_size
    if budget["total"] > MAX_TOTAL_READ_BYTES:
        raise AuxScanError("total read budget exceeded")
    return z.read(name)


def _parse_xml(data: bytes, member: str) -> ET.Element:
    try:
        return ET.fromstring(data)
    except ET.ParseError as e:
        raise AuxScanError(f"malformed XML in {member!r}: {e}")


def _table_depths(root: ET.Element, tbl_local: str) -> tuple[int, int]:
    """(top_level, nested) 표 수 — 태그 트리에서 tbl 중첩 여부로 분해(결정적)."""
    top = 0
    nested = 0

    def walk(el: ET.Element, in_tbl: bool) -> None:
        nonlocal top, nested
        for ch in el:
            if _local(ch.tag) == tbl_local:
                if in_tbl:
                    nested += 1
                else:
                    top += 1
                walk(ch, True)
            else:
                walk(ch, in_tbl)

    walk(root, False)
    return top, nested


def detect_format(path: str | Path) -> str:
    """zip 내용으로 포맷을 결정한다('hwpx'|'docx'). 확장자에 의존하지 않는다."""
    p = Path(path)
    if not p.is_file():
        raise AuxScanError(f"not a file: [path redacted]")
    if not zipfile.is_zipfile(p):
        raise AuxScanError("not a zip container (HWPX/DOCX expected)")
    with zipfile.ZipFile(p) as z:
        names = z.namelist()
        _check_member_names(names)
        nameset = set(names)
        if "Contents/header.xml" in nameset:
            return "hwpx"
        if "word/document.xml" in nameset:
            return "docx"
    raise AuxScanError("unrecognized zip layout (neither HWPX nor DOCX)")


def _scan_hwpx(z: zipfile.ZipFile, names: list[str]) -> dict:
    budget = {"total": 0}
    # 리소스: 이름만 관찰(바이트 미읽기).
    image_resources = [n for n in names if n.startswith("BinData/")]

    header = _parse_xml(_read_member(z, "Contents/header.xml", budget), "Contents/header.xml")
    styles: dict[str, str] = {}
    for el in header.iter():
        if _local(el.tag) == "style":
            sid = el.get("id")
            if sid is not None:
                styles[sid] = el.get("name") or ""
    heading_styles = {sid for sid, nm in styles.items() if _HEADING_NAME_RE.search(nm)}
    outline_styles = {sid for sid, nm in styles.items() if _OUTLINE_NAME_RE.search(nm)}
    caption_styles = {sid for sid, nm in styles.items() if _CAPTION_NAME_RE.search(nm)}

    sections = sorted(n for n in names if re.match(r"^Contents/section\d+\.xml$", n))
    if not sections:
        raise AuxScanError("HWPX has no Contents/section*.xml")

    pic = 0
    tbl_total = 0
    caption_tag = 0
    outline_paras = 0
    caption_paras = 0
    top = 0
    nested = 0
    for sn in sections:
        root = _parse_xml(_read_member(z, sn, budget), sn)
        t, nst = _table_depths(root, "tbl")
        top += t
        nested += nst
        for el in root.iter():
            lt = _local(el.tag)
            if lt == "pic":
                pic += 1
            elif lt == "tbl":
                tbl_total += 1
            elif lt == "caption":
                caption_tag += 1
            elif lt == "p":
                sref = el.get("styleIDRef")
                if sref in outline_styles:
                    outline_paras += 1
                if sref in caption_styles:
                    caption_paras += 1

    reasons = []
    if heading_styles and outline_paras == 0:
        reasons.append("heading_styles_defined_but_unused")

    return {
        "image_resource_count": len(image_resources),
        "image_relationship_count": 0,  # HWPX에는 OOXML relationship 개념 없음(구조상 0 고정)
        "image_instance_count": pic,
        "table_tag_count": tbl_total,
        "table_top_level_count": top,
        "nested_table_count": nested,
        "heading_style_candidate_count": len(heading_styles),
        "heading_recovery_candidate": outline_paras,
        "caption_candidate_count": caption_paras + caption_tag,
        "chart_relationship_count": 0,  # HWPX 차트는 별도 태그 체계 — v1 스캐너는 카운트 대상 외
        "review_required_reason": sorted(reasons),
    }


def _scan_docx(z: zipfile.ZipFile, names: list[str]) -> dict:
    budget = {"total": 0}
    image_resources = [n for n in names if n.startswith("word/media/")]

    rel_types: Counter = Counter()
    if "word/_rels/document.xml.rels" in set(names):
        rels = _parse_xml(_read_member(z, "word/_rels/document.xml.rels", budget),
                          "word/_rels/document.xml.rels")
        for el in rels.iter():
            if _local(el.tag) == "Relationship":
                rel_types[(el.get("Type") or "").rsplit("/", 1)[-1]] += 1

    heading_styles: dict[str, str] = {}
    caption_styles: dict[str, str] = {}
    if "word/styles.xml" in set(names):
        sroot = _parse_xml(_read_member(z, "word/styles.xml", budget), "word/styles.xml")
        for st in sroot.iter():
            if _local(st.tag) != "style":
                continue
            sid = st.get(_W_NS + "styleId") or ""
            nm = ""
            for ch in st:
                if _local(ch.tag) == "name":
                    nm = ch.get(_W_NS + "val") or ""
            label = f"{sid} {nm}"
            if _HEADING_NAME_RE.search(label):
                heading_styles[sid] = nm
            if _CAPTION_NAME_RE.search(label):
                caption_styles[sid] = nm

    droot = _parse_xml(_read_member(z, "word/document.xml", budget), "word/document.xml")
    drawing = 0
    tbl_total = 0
    heading_paras = 0
    caption_paras = 0
    seq_fields = 0
    top, nested = _table_depths(droot, "tbl")
    for el in droot.iter():
        lt = _local(el.tag)
        if lt == "drawing":
            drawing += 1
        elif lt == "tbl":
            tbl_total += 1
        elif lt == "pStyle":
            v = el.get(_W_NS + "val") or ""
            if v in heading_styles:
                heading_paras += 1
            if v in caption_styles:
                caption_paras += 1
        elif lt == "fldSimple":
            if "SEQ" in (el.get(_W_NS + "instr") or el.get("instr") or ""):
                seq_fields += 1
        elif lt == "instrText":
            if "SEQ" in (el.text or ""):
                seq_fields += 1

    reasons = []
    if heading_styles and heading_paras == 0:
        reasons.append("heading_styles_defined_but_unused")

    return {
        "image_resource_count": len(image_resources),
        "image_relationship_count": rel_types.get("image", 0),
        "image_instance_count": drawing,
        "table_tag_count": tbl_total,
        "table_top_level_count": top,
        "nested_table_count": nested,
        "heading_style_candidate_count": len(heading_styles),
        "heading_recovery_candidate": heading_paras,
        "caption_candidate_count": caption_paras + seq_fields,
        "chart_relationship_count": rel_types.get("chart", 0),
        "review_required_reason": sorted(reasons),
    }


def build_aux_signals(path: str | Path) -> dict:
    """HWPX/DOCX 파일 -> aux_signals dict (2L-4A 계약). 결정적. 판정 미생성. 실패는 AuxScanError."""
    doc_format = detect_format(path)
    with zipfile.ZipFile(Path(path)) as z:
        names = z.namelist()
        _check_member_names(names)
        body = _scan_hwpx(z, names) if doc_format == "hwpx" else _scan_docx(z, names)
    out = {"aux_signals_version": AUX_SIGNALS_VERSION, "doc_format": doc_format}
    out.update(body)
    return out
