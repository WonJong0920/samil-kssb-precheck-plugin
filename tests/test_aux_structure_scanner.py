"""HWPX/DOCX auxiliary structure scanner 테스트(표준 라이브러리만, Cycle 2L-4B).

경계·방어·결정성 증명(Codex 2L-4A test strategy 반영):
- 결정성(동일 입력 -> 동일 직렬화).
- 포맷 감지(zip 내용 기준)와 카운트 정확성(top-level vs 중첩 표, 이미지 3계층, caption/heading 후보).
- zip-slip(경로 탈출) 멤버명 거부.
- bounded read(멤버 크기 상한 초과 거부).
- 산출물에 raw XML 미보존.
- 네트워크 모듈 미import(소스 스캔).
- core(validator/renderer/delivery) 미import.
- malformed 입력(비-zip·XML 파손) fail-fast.

실 샘플 파일을 repo에 넣지 않는다 — fixture는 테스트가 임시 폴더에 합성 생성한다.
종료 코드: 모든 점검 PASS면 0, 하나라도 실패면 1.
"""
from __future__ import annotations

import json
import sys
import tempfile
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
INTAKE_DIR = REPO / "src" / "intake"
sys.path.insert(0, str(INTAKE_DIR))

import aux_structure_scanner as A  # noqa: E402

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


# ---- 합성 fixture 생성(실 문서 미사용) ----------------------------------------

_HWPX_HEADER = """<?xml version="1.0" encoding="UTF-8"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head">
  <hh:styles>
    <hh:style id="0" name="바탕글"/>
    <hh:style id="1" name="개요 1"/>
    <hh:style id="7" name="표 제목"/>
  </hh:styles>
</hh:head>
"""

# 표 2개(top-level) 중 하나 안에 중첩 표 1개, pic 2개, caption 태그 1개,
# 개요 문단 1개("개요 1" 스타일), 표 제목 문단 2개.
_HWPX_SECTION = """<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"
        xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:p styleIDRef="1"><hp:run>제1장</hp:run></hp:p>
  <hp:p styleIDRef="0"><hp:run>본문</hp:run></hp:p>
  <hp:p styleIDRef="7"><hp:run>표 1 제목</hp:run></hp:p>
  <hp:tbl>
    <hp:tr><hp:tc><hp:p styleIDRef="0"><hp:run>셀</hp:run></hp:p>
      <hp:tbl><hp:tr><hp:tc><hp:p styleIDRef="0"/></hp:tc></hp:tr></hp:tbl>
    </hp:tc></hp:tr>
    <hp:caption><hp:p styleIDRef="0"/></hp:caption>
  </hp:tbl>
  <hp:p styleIDRef="7"><hp:run>표 2 제목</hp:run></hp:p>
  <hp:tbl><hp:tr><hp:tc><hp:p styleIDRef="0"/></hp:tc></hp:tr></hp:tbl>
  <hp:pic/>
  <hp:pic/>
</hs:sec>
"""

_DOCX_CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>
"""

_DOCX_STYLES = """<?xml version="1.0" encoding="UTF-8"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:styleId="H1"><w:name w:val="제목1"/></w:style>
  <w:style w:styleId="Cap"><w:name w:val="캡션"/></w:style>
  <w:style w:styleId="Body"><w:name w:val="바탕글"/></w:style>
</w:styles>
"""

# drawing 3개, 표 2개(top-level) + 중첩 1개, 제목 문단 1개, 캡션 문단 1개, SEQ 필드 1개.
_DOCX_DOCUMENT = """<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
 <w:body>
  <w:p><w:pPr><w:pStyle w:val="H1"/></w:pPr></w:p>
  <w:p><w:pPr><w:pStyle w:val="Cap"/></w:pPr></w:p>
  <w:p><w:fldSimple w:instr=" SEQ 표 \\* ARABIC "/></w:p>
  <w:tbl>
    <w:tr><w:tc>
      <w:tbl><w:tr><w:tc><w:p/></w:tc></w:tr></w:tbl>
    </w:tc></w:tr>
  </w:tbl>
  <w:tbl><w:tr><w:tc><w:p/></w:tc></w:tr></w:tbl>
  <w:p><w:drawing/></w:p>
  <w:p><w:drawing/></w:p>
  <w:p><w:drawing/></w:p>
 </w:body>
</w:document>
"""

_DOCX_RELS = """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart1.xml"/>
</Relationships>
"""


def make_hwpx(path: Path) -> Path:
    p = path / "sample.hwpx"
    with zipfile.ZipFile(p, "w") as z:
        z.writestr("mimetype", "application/hwp+zip")
        z.writestr("Contents/header.xml", _HWPX_HEADER)
        z.writestr("Contents/section0.xml", _HWPX_SECTION)
        z.writestr("BinData/image1.png", b"\x89PNG-fake")
        z.writestr("BinData/image2.png", b"\x89PNG-fake")
    return p


def make_docx(path: Path) -> Path:
    p = path / "sample.docx"
    with zipfile.ZipFile(p, "w") as z:
        z.writestr("[Content_Types].xml", _DOCX_CONTENT_TYPES)
        z.writestr("word/document.xml", _DOCX_DOCUMENT)
        z.writestr("word/styles.xml", _DOCX_STYLES)
        z.writestr("word/_rels/document.xml.rels", _DOCX_RELS)
        z.writestr("word/media/image1.png", b"\x89PNG-fake")
    return p


def expect_error(name: str, fn) -> None:
    try:
        fn()
        check(name, False, "no exception")
    except A.AuxScanError:
        check(name, True)


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="auxscan-test-"))

    hwpx = make_hwpx(tmp)
    docx = make_docx(tmp)

    # 1. 포맷 감지(zip 내용 기준)
    check("HWPX 포맷 감지", A.detect_format(hwpx) == "hwpx")
    check("DOCX 포맷 감지", A.detect_format(docx) == "docx")

    # 2. HWPX 카운트 정확성
    h = A.build_aux_signals(hwpx)
    check("HWPX image_resource_count", h["image_resource_count"] == 2, str(h["image_resource_count"]))
    check("HWPX image_instance_count(pic)", h["image_instance_count"] == 2)
    check("HWPX 표 top-level/중첩 분해", (h["table_top_level_count"], h["nested_table_count"]) == (2, 1),
          f"{h['table_top_level_count']}/{h['nested_table_count']}")
    check("HWPX heading 스타일 후보(개요1·표 제목)", h["heading_style_candidate_count"] == 2)
    check("HWPX 개요 문단(heading_recovery_candidate)", h["heading_recovery_candidate"] == 1)
    check("HWPX caption 후보(표제목 2 + caption 태그 1)", h["caption_candidate_count"] == 3,
          str(h["caption_candidate_count"]))
    check("HWPX relationship=0 고정", h["image_relationship_count"] == 0)

    # 3. DOCX 카운트 정확성
    d = A.build_aux_signals(docx)
    check("DOCX image_instance_count(drawing)", d["image_instance_count"] == 3)
    check("DOCX image_relationship_count", d["image_relationship_count"] == 2)
    check("DOCX image_resource_count(media)", d["image_resource_count"] == 1)
    check("DOCX 표 top-level/중첩 분해", (d["table_top_level_count"], d["nested_table_count"]) == (2, 1))
    check("DOCX chart_relationship_count", d["chart_relationship_count"] == 1)
    check("DOCX heading 문단 사용", d["heading_recovery_candidate"] == 1)
    check("DOCX caption 후보(캡션 1 + SEQ 1)", d["caption_candidate_count"] == 2,
          str(d["caption_candidate_count"]))

    # 4. 결정성: 동일 입력 2회 -> 직렬화 동일
    s1 = json.dumps(A.build_aux_signals(hwpx), sort_keys=True, ensure_ascii=False)
    s2 = json.dumps(A.build_aux_signals(hwpx), sort_keys=True, ensure_ascii=False)
    check("결정성(동일 입력->동일 직렬화)", s1 == s2)

    # 5. 산출물에 raw XML 미보존(원문/태그 문자열 부재)
    blob = json.dumps({"h": h, "d": d}, ensure_ascii=False)
    check("raw XML 미보존", "<hp:" not in blob and "<w:" not in blob and "<?xml" not in blob)
    check("본문 텍스트 미보존", "제1장" not in blob and "본문" not in blob)

    # 6. zip-slip(경로 탈출) 멤버명 거부
    evil = tmp / "evil.hwpx"
    with zipfile.ZipFile(evil, "w") as z:
        z.writestr("Contents/header.xml", _HWPX_HEADER)
        z.writestr("Contents/section0.xml", _HWPX_SECTION)
        z.writestr("../outside.xml", "<x/>")
    expect_error("zip-slip 멤버명 거부", lambda: A.build_aux_signals(evil))

    # 7. bounded read: 멤버 크기 상한 초과 거부(상한을 임시 축소)
    orig = A.MAX_MEMBER_BYTES
    try:
        A.MAX_MEMBER_BYTES = 10
        expect_error("bounded read(멤버 상한 초과 거부)", lambda: A.build_aux_signals(hwpx))
    finally:
        A.MAX_MEMBER_BYTES = orig

    # 8. malformed: 비-zip 파일 거부
    notzip = tmp / "not.hwpx"
    notzip.write_bytes(b"not a zip at all")
    expect_error("비-zip 거부", lambda: A.build_aux_signals(notzip))

    # 9. malformed: XML 파손 거부
    broken = tmp / "broken.docx"
    with zipfile.ZipFile(broken, "w") as z:
        z.writestr("word/document.xml", "<w:document xmlns:w='x'><w:body>")
    expect_error("XML 파손 거부", lambda: A.build_aux_signals(broken))

    # 10. 알 수 없는 zip 레이아웃 거부
    unk = tmp / "unknown.zip"
    with zipfile.ZipFile(unk, "w") as z:
        z.writestr("random.txt", "hello")
    expect_error("미인식 레이아웃 거부", lambda: A.build_aux_signals(unk))

    # 11. 네트워크 모듈 미import(소스 스캔) — no-egress 코드 경로 부재
    src = (INTAKE_DIR / "aux_structure_scanner.py").read_text(encoding="utf-8")
    net_mods = ["socket", "http", "urllib", "ftplib", "requests", "asyncio"]
    hit = [m for m in net_mods if f"import {m}" in src or f"from {m}" in src]
    check("네트워크 모듈 미import", not hit, f"hit={hit}")

    # 12. core(validator/renderer/delivery) 미import — 직접 유입 방지
    banned = ["kssb_findings_validator", "kssb_report_renderer", "kssb_report_delivery"]
    check("core 미import", not any(m in src for m in banned))

    passed = sum(1 for _, ok, _ in _results if ok)
    total = len(_results)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
