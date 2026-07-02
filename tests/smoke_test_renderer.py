"""재사용 가능한 렌더러 스모크 테스트(표준 라이브러리만).

Cycle 2C 렌더러가 findings를 재판정 없이 대표 DOCX/HTML로 변환하는지 결정적으로 점검한다.
출력은 항상 **repo 밖 임시 폴더**(`tempfile.mkdtemp`)에 생성하므로 repo를 오염시키지 않는다.

사용:
    python tests/smoke_test_renderer.py                       # example findings 사용
    python tests/smoke_test_renderer.py path/to/findings.json # 임의 findings 사용

종료 코드: 모든 점검 PASS면 0, 하나라도 실패면 1.
"""
from __future__ import annotations

import html as _html
import json
import shutil
import sys
import tempfile
import xml.dom.minidom as minidom
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "src" / "renderers"))

import kssb_report_renderer as R  # noqa: E402

DEFAULT_FINDINGS = REPO / "src" / "schemas" / "kssb_findings_example.json"

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


def run(findings_path: Path) -> int:
    findings = json.loads(findings_path.read_text(encoding="utf-8"))
    check("findings JSON 문법", isinstance(findings, dict))

    out_dir = Path(tempfile.mkdtemp(prefix="kssb_smoke_"))
    try:
        out = R.render_report(findings, out_dir)
        docx_path = Path(out["docx"]) if out.get("docx") else None
        html_path = Path(out["html"]) if out.get("html") else None
        check("DOCX 생성", bool(docx_path and docx_path.exists()), out.get("docx_error") or "")
        check("HTML 생성", bool(html_path and html_path.exists()))

        # DOCX zip 무결성 + 필수 엔트리 + 내부 XML 파싱
        if docx_path and docx_path.exists():
            with zipfile.ZipFile(docx_path) as zf:
                check("DOCX zip 무결성", zf.testzip() is None)
                names = set(zf.namelist())
                need = {"[Content_Types].xml", "_rels/.rels", "docProps/core.xml",
                        "docProps/app.xml", "word/_rels/document.xml.rels",
                        "word/styles.xml", "word/settings.xml", "word/document.xml"}
                check("DOCX 필수 엔트리 8개", need <= names, f"{len(names)}개")
                xml_ok, xml_err = True, ""
                for n in names:
                    if n.endswith(".xml") or n.endswith(".rels"):
                        try:
                            minidom.parseString(zf.read(n))
                        except Exception as e:  # noqa: BLE001
                            xml_ok, xml_err = False, f"{n}: {e}"
                            break
                check("DOCX 내부 XML 파싱 가능", xml_ok, xml_err)

        # HTML 핵심 섹션 / 경계 문구
        htmltext = html_path.read_text(encoding="utf-8") if html_path else ""
        meta = findings.get("report_meta", {})
        for label, needle in {
            "제목": meta.get("report_title", ""),
            "review_mode": "review_mode",
            "검토 개요": "검토 개요",
            "상태 요약": "상태 요약",
            "고객 확인 질문": "고객 확인 질문",
            "후속조치": "후속조치",
            "보완 권고": "보완 권고",
            "사람 검수": "사람 검수",
            "human_review_boundary": findings.get("human_review_boundary", "")[:20],
        }.items():
            check(f"HTML 포함: {label}", bool(needle) and needle in htmltext)

        # 재판정 금지: 출력 판정 라벨이 입력 판정 라벨과 정확히 일치(렌더러가 라벨을 새로 만들지 않음)
        input_labels = {
            it.get("judgment_label", "")
            for a in findings.get("kssb_areas", [])
            for it in a.get("items", [])
        }
        schema_labels = _judgment_label_enum()
        labels_in_output = {lbl for lbl in schema_labels if lbl and lbl in htmltext}
        check("출력 판정 라벨 = 입력 판정 라벨(재판정 없음)",
              labels_in_output == {lbl for lbl in input_labels if lbl},
              f"out={sorted(labels_in_output)}")

        # quote 원문 보존(escape만)
        first_quote = _first_quote(findings)
        if first_quote:
            check("HTML quote 원문 보존", _html.escape(first_quote, quote=True) in htmltext)

        # 결정성
        check("DOCX 결정성(동일 바이트)", R._docx_bytes(findings) == R._docx_bytes(findings))
        check("HTML 결정성(동일 문자열)", R.render_html(findings) == R.render_html(findings))

        # 파일명 규칙 + 내부 경로 비노출
        if docx_path:
            check("파일명 규칙 .docx", docx_path.name.endswith("_KSSB_공시근거_사전검토보고서.docx"))
        if html_path:
            check("파일명 규칙 .html", html_path.name.endswith("_KSSB_공시근거_사전검토보고서.html"))
        bad_tokens = ["C:\\", "C:/", "AppData", ".codex", "sandbox", "plugin/cache", "plugins/cache"]
        check("HTML 내부 경로 비노출", not any(t in htmltext for t in bad_tokens))
    finally:
        shutil.rmtree(out_dir, ignore_errors=True)

    failed = [r for r in _results if not r[1]]
    print(f"\n총 {len(_results)}건 중 실패 {len(failed)}건")
    return 1 if failed else 0


def _judgment_label_enum() -> set[str]:
    try:
        schema = json.loads((REPO / "src" / "schemas" / "kssb_findings.schema.json").read_text(encoding="utf-8"))
        return set(schema["definitions"]["finding_item"]["properties"]["judgment_label"]["enum"])
    except Exception:  # noqa: BLE001
        return set()


def _first_quote(findings: dict) -> str:
    for a in findings.get("kssb_areas", []):
        for it in a.get("items", []):
            for anc in it.get("evidence_anchors", []):
                q = anc.get("quote")
                if q:
                    return q
    return ""


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_FINDINGS
    raise SystemExit(run(path))
