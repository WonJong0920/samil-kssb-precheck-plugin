"""경량 findings 검증기 테스트(표준 라이브러리만).

- valid example findings에서 error가 0건인지 확인한다.
- 의도적으로 손상시킨 in-memory 사본에서 기대한 검증 코드가 검출되는지 확인한다.
  (repo에 샘플 데이터를 추가하지 않고, 예시 findings를 복사·변형해서 점검한다.)

종료 코드: 모든 점검 PASS면 0, 하나라도 실패면 1.
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "src" / "validators"))

import kssb_findings_validator as V  # noqa: E402

EXAMPLE = REPO / "src" / "schemas" / "kssb_findings_example.json"

_results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    _results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" - {detail}" if detail else ""))


def codes(findings) -> set[str]:
    return {i.code for i in V.validate_findings(findings) if i.severity == "error"}


def codes_fallback(findings) -> set[str]:
    """jsonschema 미사용(표준 라이브러리 fallback) 경로에서의 error 코드 집합."""
    return {i.code for i in V.validate_findings(findings, use_jsonschema=False) if i.severity == "error"}


def main() -> int:
    base = json.loads(EXAMPLE.read_text(encoding="utf-8"))

    # 1. valid example → error 0건
    check("valid example error 0건", not codes(base), sorted(codes(base)))

    # 2. source_id cross-reference 실패
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["evidence_anchors"][0]["source_id"] = "does-not-exist"
    check("source_id cross-ref 검출", "anchor.source_id_ref" in codes(f))

    # 3. source_mode ↔ review_mode 불일치
    f = copy.deepcopy(base)
    f["source_documents"][0]["source_mode"] = "customer_provided"  # public 모드인데 customer
    check("source_mode 불일치 검출", "mode.source_mode_mismatch" in codes(f))

    # 4. judgment_label ↔ mode 불일치 (public 모드에 customer 라벨)
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["judgment_label"] = "제공자료상 근거 확인"
    check("label↔mode 불일치 검출", "mode.label_mismatch" in codes(f))

    # 5. evidence quote 빈값
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["evidence_anchors"][0]["quote"] = ""
    check("빈 quote 검출", "anchor.quote_empty" in codes(f))

    # 6. customer_question 필수 필드 누락
    f = copy.deepcopy(base)
    f["kssb_areas"][1]["items"][0]["customer_questions"][0].pop("follow_up_action", None)
    check("customer_question 누락 필드 검출", "question.field" in codes(f))

    # 7. Source-bound: not_verifiable인데 questions 없음
    f = copy.deepcopy(base)
    for a in f["kssb_areas"]:
        for it in a["items"]:
            if it["judgment_code"] == "not_verifiable":
                it["customer_questions"] = []
    check("not_verifiable→questions 규칙 검출", "sourcebound.questions" in codes(f))

    # 8. Source-bound: conflict인데 human_review_required=false
    f = copy.deepcopy(base)
    for a in f["kssb_areas"]:
        for it in a["items"]:
            if it["judgment_code"] == "conflict_or_interpretation_needed":
                it["human_review_required"] = False
    check("conflict→human_review 규칙 검출", "sourcebound.human_review" in codes(f))

    # 9. 금지 표현이 분석 콘텐츠 필드에 유입
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["recommendations"] = ["준수 확정 판정을 부여함"]
    check("금지 표현(분석 필드) 검출", "prohibited.term" in codes(f))

    # 10. 고지/경계 필드의 negation 문맥은 오탐 아님(disclaimer는 원래 '감사·인증·준수' 포함)
    check("고지 필드 negation 오탐 없음", "prohibited.term" not in codes(base))

    # 11. 내부 경로 노출
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["evidence_anchors"][0]["page_or_section"] = r"C:\Users\me\report.pdf"
    check("내부 경로 노출 검출", "path.internal_exposure" in codes(f))

    # --- Cycle 2D Patch: 표준 라이브러리 fallback 모드의 schema-required 중첩 구조 누락 감지 ---
    # (Codex Cycle 2D Major: use_jsonschema=False에서 아래 누락이 error로 잡히지 않던 공백 보강)

    # 0'. valid example은 fallback 모드에서도 error 0건 유지
    check("valid example fallback error 0건", not codes_fallback(base), sorted(codes_fallback(base)))

    # 12. source_documents[].title 누락
    f = copy.deepcopy(base)
    f["source_documents"][0].pop("title", None)
    check("source_doc.title 누락 검출(fallback)", "source_doc.title" in codes_fallback(f))

    # 13. source_documents[].source_mode 누락
    f = copy.deepcopy(base)
    f["source_documents"][0].pop("source_mode", None)
    check("source_doc.source_mode 누락 검출(fallback)", "source_doc.source_mode" in codes_fallback(f))

    # 14. kssb_areas[].area_id 누락
    f = copy.deepcopy(base)
    f["kssb_areas"][0].pop("area_id", None)
    check("area.area_id 누락 검출(fallback)", "area.area_id" in codes_fallback(f))

    # 15. kssb_areas[].area_name 누락
    f = copy.deepcopy(base)
    f["kssb_areas"][0].pop("area_name", None)
    check("area.area_name 누락 검출(fallback)", "area.area_name" in codes_fallback(f))

    # 16. kssb_areas[].items 누락
    f = copy.deepcopy(base)
    f["kssb_areas"][0].pop("items", None)
    check("area.items 누락 검출(fallback)", "area.items" in codes_fallback(f))

    # 17. finding_item.judgment_label 누락
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0].pop("judgment_label", None)
    check("judgment_label 누락 검출(fallback)", "item.field" in codes_fallback(f))

    # 18. detect-only: 검증이 findings를 변경하지 않음
    snapshot = json.dumps(base, ensure_ascii=False, sort_keys=True)
    V.validate_findings(base)
    check("detect-only(입력 미변경)", json.dumps(base, ensure_ascii=False, sort_keys=True) == snapshot)

    # --- Cycle 2I-3: findings 값의 로컬/임시/계정 경로 노출 스캔 확장(detect-only) ---

    # 19. POSIX 홈 경로 /home/<user>/ 감지
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["evidence_anchors"][0]["page_or_section"] = "/home/alice/reports/hfg.pdf"
    check("경로 노출 검출: /home/<user>/", "path.internal_exposure" in codes(f))

    # 20. macOS 임시 폴더 /var/folders/ 감지
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["evidence_anchors"][0]["relevance_note"] = "/var/folders/xy/abc123/T/extract.txt 참조"
    check("경로 노출 검출: /var/folders/", "path.internal_exposure" in codes(f))

    # 21. Windows 환경변수 경로 참조 %TEMP% / %USERPROFILE% 감지
    f = copy.deepcopy(base)
    f["source_documents"][0]["notes"] = r"%TEMP%\sm_extract.txt"
    check("경로 노출 검출: %TEMP%", "path.internal_exposure" in codes(f))
    f = copy.deepcopy(base)
    f["source_documents"][0]["notes"] = r"%USERPROFILE%\Desktop\report.pdf"
    check("경로 노출 검출: %USERPROFILE%", "path.internal_exposure" in codes(f))

    # 22. 임시 폴더 \Temp\ 감지(AppData 밖)
    f = copy.deepcopy(base)
    f["kssb_areas"][0]["items"][0]["evidence_anchors"][0]["relevance_note"] = r"D:\work\Temp\out.md"
    check("경로 노출 검출: \\Temp\\", "path.internal_exposure" in codes(f))

    # 23. valid example은 확장 후에도 error 0 유지(오탐 없음)
    check("valid example 확장 후 error 0 유지", not codes(base), sorted(codes(base)))

    # 24. detect-only: 경로 포함 findings 검증도 입력을 변경하지 않음
    f = copy.deepcopy(base)
    f["source_documents"][0]["notes"] = "/home/bob/x.pdf"
    snap2 = json.dumps(f, ensure_ascii=False, sort_keys=True)
    V.validate_findings(f)
    check("detect-only(경로 포함 입력 미변경)", json.dumps(f, ensure_ascii=False, sort_keys=True) == snap2)

    failed = [r for r in _results if not r[1]]
    print(f"\n총 {len(_results)}건 중 실패 {len(failed)}건")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
