# Validators (findings 경량 가드레일)

이 폴더는 렌더러가 findings를 소비하기 전에 **구조적 위험을 결정적으로 감지·보고**하는 경량 검증기를 담는다.
`docs/findings_schema_contract.md`가 "JSON Schema로 표현하지 못한 수동 검증 규칙"으로 남겨 둔 항목을
표준 라이브러리만으로 자동 점검한다.

## 경계 (detect-only)

- 검증기는 findings를 **고치지 않는다.** 판정·근거·질문·권고를 새로 만들거나 보강하지 않는다.
- 문제를 **발견해서 보고**할 뿐이며, Source-bound Analysis와 사람 검수 경계를 약화하지 않는다.
- 렌더러는 계속 형식 변환기이며, 이 검증기는 렌더 전 별도 점검 단계다(렌더러 재판정을 유발하지 않는다).

## 검증 규칙

1. 구조 필수 필드(report_meta / source_documents / kssb_areas / human_review_boundary, finding_item 핵심 필드).
2. `evidence_anchors[].source_id` ↔ `source_documents[].source_id` **cross-reference**.
3. `review_mode` ↔ `source_documents[].source_mode` 정합.
4. `judgment_code` ↔ `judgment_label` ↔ `review_mode` 정합(계약의 모드별 라벨 표 강제).
5. Source-bound 조건부 규칙(confirmed/partial→anchors, not_verifiable→missing_info+questions,
   conflict→human_review, out_of_scope→missing_info)과 evidence **quote 빈값 금지**.
6. `customer_questions` 필수 6필드(question·reason·related_evidence·priority·requested_material·follow_up_action).
7. **금지 표현 스캔**(`prohibited_terms.md`의 강한 표현 기준). 고지·경계·한계 필드(disclaimer,
   human_review_boundary, overall_limitations, notes)는 감사·인증·준수를 **negation 문맥**으로 언급하므로
   오탐 방지를 위해 스캔에서 제외한다. 판정명 단일어(준수/적합/인증/적정)는 substring 스캔 대신 규칙 4의
   라벨 정합으로 검증한다.
8. **내부 경로 노출 스캔**(전체 문자열 필드 대상: `C:\`, `/Users/`, `.codex`, `sandbox`, `AppData`, `plugin/cache` 등).

## 사용

```
python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json
python src/validators/kssb_findings_validator.py findings.json --json
```

- 종료 코드: error가 하나라도 있으면 1, 없으면 0. `--warnings-as-errors`로 warning도 실패 처리.
- `--no-jsonschema`: 선택적 스키마 검증 비활성화.

프로그램 사용:

```python
from kssb_findings_validator import validate_findings, load_findings
issues = validate_findings(load_findings("findings.json"))  # list[Issue], findings 미변경
```

## 의존성

Python 표준 라이브러리만 사용한다(`json`, `re`, `sys`, `argparse`, `pathlib`).
`jsonschema`가 설치되어 있으면 선택적으로 Draft-07 검증을 추가하지만, **없으면 설치하지 않고**
표준 라이브러리 검증만 수행한다. 검증기는 새 외부 의존성을 요구하지 않는다.
