"""Samil KSSB Precheck - Lightweight Findings Validator / Guardrail (Cycle 2D).

렌더러가 소비하기 전에 findings의 **구조적 위험**을 결정적으로 감지·보고하는 경량 가드레일이다.
`docs/findings_schema_contract.md`가 "JSON Schema로 표현하지 못한 수동 검증 규칙"으로 남겨 둔 항목과,
금지 표현·내부 경로 노출을 표준 라이브러리만으로 점검한다.

경계(무엇을 하지 않는가):
- 이 검증기는 findings를 **고치지 않고, 판정·근거·질문·권고를 새로 만들지 않는다.**
  문제를 **발견해서 보고**할 뿐이다(detect-only). Source-bound Analysis를 약화하지 않는다.
- 렌더러는 여전히 형식 변환기이며, 이 검증기는 별도 단계다(렌더러의 재판정을 유발하지 않는다).

검증 규칙(요약):
1. 구조 필수 필드(report_meta/source_documents/kssb_areas/human_review_boundary, finding_item 핵심 필드).
2. `evidence_anchors[].source_id` ↔ `source_documents[].source_id` cross-reference.
3. `review_mode` ↔ `source_documents[].source_mode` 정합.
4. `judgment_code` ↔ `judgment_label` ↔ `review_mode` 정합(모드별 라벨 표 강제).
5. Source-bound 조건부 규칙(confirmed/partial→anchors, not_verifiable→missing_info+questions,
   conflict→human_review, out_of_scope→missing_info) 및 evidence quote 빈값 금지.
6. `customer_questions` 필수 6필드(question·reason·related_evidence·priority·requested_material·follow_up_action).
7. 금지 표현 스캔(`prohibited_terms.md` 기반, 분석 콘텐츠 필드 대상 — 고지/경계 필드는 negation 문맥이라 제외).
8. 내부 경로 노출 스캔(전체 문자열 필드 대상).

의존성: Python 표준 라이브러리만 사용한다(json, re, sys, argparse, pathlib). `jsonschema`가 설치되어 있으면
선택적으로 스키마 검증을 추가하지만, 없으면 표준 라이브러리 검증만 수행한다(새 의존성 설치 없음).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Iterator

# ---------------------------------------------------------------------------
# 계약 상수 (findings_schema_contract.md와 정합)
# ---------------------------------------------------------------------------

# review_mode → 기대 source_mode
MODE_TO_SOURCE_MODE = {
    "customer_provided_materials": "customer_provided",
    "public_materials_validation": "public",
}

# (review_mode, judgment_code) → 기대 judgment_label (계약의 모드별 라벨 표)
_SHARED = {
    "partial_evidence_needs_supplement": "일부 근거 확인, 보완 필요",
    "conflict_or_interpretation_needed": "상충 또는 해석 필요",
    "out_of_scope_or_not_applicable": "검토 범위 외 또는 적용대상 아님",
}
EXPECTED_LABEL = {
    "customer_provided_materials": {
        "evidence_confirmed": "제공자료상 근거 확인",
        "not_verifiable": "제공자료로 확인 불가",
        **_SHARED,
    },
    "public_materials_validation": {
        "evidence_confirmed": "공개자료상 근거 확인",
        "not_verifiable": "공개자료로 확인 불가",
        **_SHARED,
    },
}

VALID_JUDGMENT_CODES = {
    "evidence_confirmed", "partial_evidence_needs_supplement", "not_verifiable",
    "conflict_or_interpretation_needed", "out_of_scope_or_not_applicable",
}
VALID_PRIORITIES = {"high", "medium", "low"}
CUSTOMER_QUESTION_FIELDS = [
    "question", "reason", "related_evidence", "priority", "requested_material", "follow_up_action",
]

# 금지 표현 스캔에서 제외하는 필드 키(고지·경계·한계는 감사/인증/준수를 negation으로 언급하므로 오탐 방지).
PROHIBITED_SCAN_EXCLUDED_KEYS = {"disclaimer", "human_review_boundary", "overall_limitations", "notes"}

# 내부 경로 노출 스캔 패턴(문서 본문에 절대 등장하면 안 되는 토큰).
_PATH_PATTERNS = [
    r"[A-Za-z]:[\\/]",       # C:\ 또는 C:/
    r"/Users/", r"Users[\\]",
    r"\.codex", r"\.claude",
    r"AppData",
    r"sandbox",
    r"plugins?[\\/]cache", r"plugin[\\/]cache",
    r"/tmp/", r"node_modules",
]
_PATH_RE = re.compile("|".join(_PATH_PATTERNS), re.IGNORECASE)

# prohibited_terms.md를 읽지 못할 때의 백업 강한 금지 표현(파일이 우선).
_FALLBACK_PROHIBITED = [
    "audit trail", "감사 추적", "감사용", "인증 의견", "준수 확정", "적합 판정",
    "제3자 검증 완료", "컴플라이언스 확정", "자동 감사", "감사 의견",
]


class Issue:
    """검증 이슈. detect-only — 값을 바꾸지 않고 위치·사유만 보고한다."""

    __slots__ = ("severity", "code", "location", "message")

    def __init__(self, severity: str, code: str, location: str, message: str):
        self.severity = severity  # "error" | "warning" | "info"
        self.code = code
        self.location = location
        self.message = message

    def as_dict(self) -> dict:
        return {"severity": self.severity, "code": self.code,
                "location": self.location, "message": self.message}

    def __str__(self) -> str:
        return f"[{self.severity}] {self.code} @ {self.location}: {self.message}"


# ---------------------------------------------------------------------------
# 안전한 접근 / 워커
# ---------------------------------------------------------------------------

def _s(v: Any) -> str:
    return "" if v is None else str(v)


def _is_nonempty_str(v: Any) -> bool:
    return isinstance(v, str) and v.strip() != ""


def _walk_strings(node: Any, path: str, key: str | None) -> Iterator[tuple[str, str, str | None]]:
    """(location, value, leaf_key)로 모든 문자열 리프를 순회한다."""
    if isinstance(node, dict):
        for k, v in node.items():
            yield from _walk_strings(v, f"{path}.{k}" if path else k, k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from _walk_strings(v, f"{path}[{i}]", key)
    elif isinstance(node, str):
        yield (path, node, key)


def _load_prohibited_terms(path: Path | None) -> tuple[list[str], str | None]:
    """prohibited_terms.md의 '## 금지 표현' 강한 표현을 파싱한다. 실패 시 백업 목록과 경고."""
    if path is None:
        path = (Path(__file__).resolve().parents[1]
                / "skills" / "samil-kssb-precheck" / "prohibited_terms.md")
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return (list(_FALLBACK_PROHIBITED), f"prohibited_terms.md 로드 실패({path}); 백업 목록 사용")
    terms: list[str] = []
    in_section = False
    extra_line = ""
    for line in text.splitlines():
        if line.startswith("## "):
            in_section = line.strip() == "## 금지 표현"
            continue
        if in_section:
            m = re.match(r"^\s*-\s+(.+?)\s*$", line)
            if m:
                terms.append(m.group(1).strip())
            elif "판정명으로" in line:
                extra_line = line
    # 판정명 라인의 인용 중 '공백 포함' 다어절만 강한 표현으로 취급(단어 하나짜리 '준수/적합/인증/적정'은
    # 고지·요구사항 문맥에서 정상 등장할 수 있어 substring 스캔에서 제외 — judgment_label 정합은 별도 규칙이 담당).
    for q in re.findall(r'"([^"]+)"', extra_line):
        if " " in q:
            terms.append(q.strip())
    # 중복 제거·안정 정렬
    terms = sorted({t for t in terms if t})
    return (terms, None)


# ---------------------------------------------------------------------------
# 개별 검증 규칙
# ---------------------------------------------------------------------------

def _check_structure(f: dict, issues: list[Issue]) -> None:
    meta = f.get("report_meta")
    if not isinstance(meta, dict):
        issues.append(Issue("error", "structure.report_meta", "report_meta", "report_meta 객체가 없습니다."))
    else:
        for req in ("report_title", "review_mode", "disclaimer"):
            if not _is_nonempty_str(meta.get(req)):
                issues.append(Issue("error", "structure.report_meta_field", f"report_meta.{req}",
                                    f"report_meta.{req}가 비어 있거나 없습니다."))
    if not _is_nonempty_str(f.get("human_review_boundary")):
        issues.append(Issue("error", "structure.human_review_boundary", "human_review_boundary",
                            "human_review_boundary가 비어 있거나 없습니다."))
    if not isinstance(f.get("source_documents"), list) or not f.get("source_documents"):
        issues.append(Issue("error", "structure.source_documents", "source_documents",
                            "source_documents 배열이 비어 있거나 없습니다."))
    if not isinstance(f.get("kssb_areas"), list) or not f.get("kssb_areas"):
        issues.append(Issue("error", "structure.kssb_areas", "kssb_areas",
                            "kssb_areas 배열이 비어 있거나 없습니다."))


def _check_source_modes(f: dict, review_mode: str, issues: list[Issue]) -> None:
    expected = MODE_TO_SOURCE_MODE.get(review_mode)
    for i, sd in enumerate(f.get("source_documents") or []):
        if not isinstance(sd, dict):
            issues.append(Issue("error", "source_doc.type", f"source_documents[{i}]", "객체가 아닙니다."))
            continue
        loc = f"source_documents[{i}]"
        if not _is_nonempty_str(sd.get("source_id")):
            issues.append(Issue("error", "source_doc.source_id", f"{loc}.source_id", "source_id가 비어 있습니다."))
        sm = _s(sd.get("source_mode"))
        if expected and sm and sm != expected:
            issues.append(Issue("error", "mode.source_mode_mismatch", f"{loc}.source_mode",
                                f"review_mode='{review_mode}'는 source_mode='{expected}'를 기대하지만 '{sm}'."))


def _iter_items(f: dict) -> Iterator[tuple[str, dict]]:
    for ai, area in enumerate(f.get("kssb_areas") or []):
        if not isinstance(area, dict):
            continue
        for ii, item in enumerate(area.get("items") or []):
            if isinstance(item, dict):
                yield (f"kssb_areas[{ai}].items[{ii}]", item)


def _check_items(f: dict, review_mode: str, source_ids: set[str], issues: list[Issue]) -> None:
    label_map = EXPECTED_LABEL.get(review_mode, {})
    for loc, item in _iter_items(f):
        code = _s(item.get("judgment_code"))
        label = _s(item.get("judgment_label"))
        # 핵심 필드
        for req in ("item_id", "requirement_title"):
            if not _is_nonempty_str(item.get(req)):
                issues.append(Issue("error", "item.field", f"{loc}.{req}", f"{req}가 비어 있습니다."))
        if code not in VALID_JUDGMENT_CODES:
            issues.append(Issue("error", "item.judgment_code", f"{loc}.judgment_code",
                                f"알 수 없는 judgment_code: '{code}'."))
        # code ↔ label ↔ mode 정합
        if review_mode in EXPECTED_LABEL and code in label_map:
            if label != label_map[code]:
                issues.append(Issue("error", "mode.label_mismatch", f"{loc}.judgment_label",
                                    f"review_mode='{review_mode}', judgment_code='{code}'는 "
                                    f"judgment_label='{label_map[code]}'를 기대하지만 '{label}'."))
        anchors = item.get("evidence_anchors") or []
        missing = item.get("missing_info") or []
        questions = item.get("customer_questions") or []
        # Source-bound 조건부 규칙
        if code in ("evidence_confirmed", "partial_evidence_needs_supplement"):
            if not (isinstance(anchors, list) and len(anchors) >= 1):
                issues.append(Issue("error", "sourcebound.anchors", f"{loc}.evidence_anchors",
                                    f"'{code}' 판정은 evidence_anchors ≥ 1이 필요합니다."))
        if code == "not_verifiable":
            if not (isinstance(missing, list) and len(missing) >= 1):
                issues.append(Issue("error", "sourcebound.missing_info", f"{loc}.missing_info",
                                    "'not_verifiable' 판정은 missing_info ≥ 1이 필요합니다."))
            if not (isinstance(questions, list) and len(questions) >= 1):
                issues.append(Issue("error", "sourcebound.questions", f"{loc}.customer_questions",
                                    "'not_verifiable' 판정은 customer_questions ≥ 1이 필요합니다."))
        if code == "conflict_or_interpretation_needed":
            if item.get("human_review_required") is not True:
                issues.append(Issue("error", "sourcebound.human_review", f"{loc}.human_review_required",
                                    "'conflict_or_interpretation_needed' 판정은 human_review_required=true가 필요합니다."))
            if not _is_nonempty_str(item.get("human_review_note")):
                issues.append(Issue("error", "sourcebound.human_review_note", f"{loc}.human_review_note",
                                    "'conflict_or_interpretation_needed' 판정은 human_review_note가 필요합니다."))
        if code == "out_of_scope_or_not_applicable":
            if not (isinstance(missing, list) and len(missing) >= 1):
                issues.append(Issue("error", "sourcebound.out_of_scope", f"{loc}.missing_info",
                                    "'out_of_scope_or_not_applicable' 판정은 적용 제외 사유(missing_info) ≥ 1이 필요합니다."))
        # evidence anchor: quote 빈값 금지 + source_id cross-reference
        if isinstance(anchors, list):
            for j, anc in enumerate(anchors):
                if not isinstance(anc, dict):
                    continue
                aloc = f"{loc}.evidence_anchors[{j}]"
                if not _is_nonempty_str(anc.get("quote")):
                    issues.append(Issue("error", "anchor.quote_empty", f"{aloc}.quote",
                                        "evidence quote가 비어 있습니다(빈 인용 금지)."))
                sid = _s(anc.get("source_id"))
                if not sid:
                    issues.append(Issue("error", "anchor.source_id_empty", f"{aloc}.source_id",
                                        "evidence source_id가 비어 있습니다."))
                elif sid not in source_ids:
                    issues.append(Issue("error", "anchor.source_id_ref", f"{aloc}.source_id",
                                        f"source_id='{sid}'가 source_documents에 없습니다(cross-reference 실패)."))
        # customer_questions 필수 6필드
        if isinstance(questions, list):
            for j, q in enumerate(questions):
                if not isinstance(q, dict):
                    issues.append(Issue("error", "question.type", f"{loc}.customer_questions[{j}]", "객체가 아닙니다."))
                    continue
                qloc = f"{loc}.customer_questions[{j}]"
                for fld in CUSTOMER_QUESTION_FIELDS:
                    if not _is_nonempty_str(q.get(fld)):
                        issues.append(Issue("error", "question.field", f"{qloc}.{fld}",
                                            f"customer_question.{fld}가 비어 있거나 없습니다."))
                pr = _s(q.get("priority"))
                if pr and pr not in VALID_PRIORITIES:
                    issues.append(Issue("error", "question.priority", f"{qloc}.priority",
                                        f"priority는 high/medium/low여야 하는데 '{pr}'."))


def _check_prohibited_and_paths(f: dict, prohibited: list[str], issues: list[Issue]) -> None:
    prohibited_lower = [(t, t.lower()) for t in prohibited]
    for location, value, key in _walk_strings(f, "", None):
        # 내부 경로 노출: 모든 문자열 필드 대상
        m = _PATH_RE.search(value)
        if m:
            issues.append(Issue("error", "path.internal_exposure", location,
                                f"내부 경로로 보이는 토큰 '{m.group(0)}'이 값에 포함됨."))
        # 금지 표현: 분석 콘텐츠 필드만(고지·경계·한계 제외)
        if key in PROHIBITED_SCAN_EXCLUDED_KEYS:
            continue
        vlow = value.lower()
        for term, tlow in prohibited_lower:
            if tlow in vlow:
                issues.append(Issue("error", "prohibited.term", location,
                                    f"금지 표현 '{term}'이 분석 콘텐츠 필드에 포함됨."))


def _schema_validate(f: dict, issues: list[Issue]) -> None:
    """jsonschema가 설치되어 있으면 선택적으로 스키마 검증을 추가한다(없으면 건너뜀)."""
    try:
        import jsonschema  # type: ignore
    except Exception:
        issues.append(Issue("info", "schema.optional_skipped", "(schema)",
                            "jsonschema 미설치 — 표준 라이브러리 검증만 수행(새 의존성 설치 안 함)."))
        return
    schema_path = (Path(__file__).resolve().parents[1] / "schemas" / "kssb_findings.schema.json")
    try:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
    except OSError as exc:
        issues.append(Issue("warning", "schema.load", str(schema_path), f"스키마 로드 실패: {exc}"))
        return
    validator = jsonschema.Draft7Validator(schema)
    for err in sorted(validator.iter_errors(f), key=lambda e: list(e.path)):
        loc = "/".join(str(p) for p in err.path) or "(root)"
        issues.append(Issue("error", "schema.jsonschema", loc, err.message))


# ---------------------------------------------------------------------------
# 공개 진입점
# ---------------------------------------------------------------------------

def validate_findings(findings: Any, prohibited_terms_path: Path | None = None,
                      use_jsonschema: bool = True) -> list[Issue]:
    """findings를 검증하고 Issue 목록을 반환한다(detect-only, findings 미변경)."""
    issues: list[Issue] = []
    if not isinstance(findings, dict):
        issues.append(Issue("error", "structure.root", "(root)", "findings 최상위가 JSON 객체가 아닙니다."))
        return issues

    _check_structure(findings, issues)

    review_mode = _s((findings.get("report_meta") or {}).get("review_mode"))
    if review_mode and review_mode not in MODE_TO_SOURCE_MODE:
        issues.append(Issue("error", "mode.review_mode", "report_meta.review_mode",
                            f"알 수 없는 review_mode: '{review_mode}'."))

    source_ids = {
        _s(sd.get("source_id"))
        for sd in (findings.get("source_documents") or [])
        if isinstance(sd, dict) and _s(sd.get("source_id"))
    }

    _check_source_modes(findings, review_mode, issues)
    _check_items(findings, review_mode, source_ids, issues)

    prohibited, warn = _load_prohibited_terms(prohibited_terms_path)
    if warn:
        issues.append(Issue("warning", "prohibited.list_load", "(prohibited_terms)", warn))
    _check_prohibited_and_paths(findings, prohibited, issues)

    if use_jsonschema:
        _schema_validate(findings, issues)

    return issues


def load_findings(path: str | Path) -> Any:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Samil KSSB Precheck 경량 findings 검증기(detect-only). "
                    "findings를 고치지 않고 구조적 위험을 감지·보고한다.")
    parser.add_argument("findings", help="findings JSON 경로")
    parser.add_argument("--json", action="store_true", help="이슈를 JSON으로 출력")
    parser.add_argument("--no-jsonschema", action="store_true", help="jsonschema 선택 검증 비활성화")
    parser.add_argument("--warnings-as-errors", action="store_true", help="warning도 실패로 취급")
    args = parser.parse_args(argv)

    try:
        findings = load_findings(args.findings)
    except (OSError, ValueError) as exc:
        print(f"[error] findings 로드 실패: {exc}", file=sys.stderr)
        return 2

    issues = validate_findings(findings, use_jsonschema=not args.no_jsonschema)
    errors = [i for i in issues if i.severity == "error"]
    warnings = [i for i in issues if i.severity == "warning"]

    if args.json:
        print(json.dumps([i.as_dict() for i in issues], ensure_ascii=False, indent=2))
    else:
        for i in issues:
            print(str(i))
        print(f"\n요약: error {len(errors)}건, warning {len(warnings)}건, "
              f"info {len(issues) - len(errors) - len(warnings)}건.")

    if errors or (args.warnings_as_errors and warnings):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
