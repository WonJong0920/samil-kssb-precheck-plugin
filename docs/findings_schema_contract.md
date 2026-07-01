# Findings Schema Contract (구조화 findings 데이터 계약)

## 목적
Samil KSSB Precheck의 **Skill(판단 주체)**과 **DOCX/HTML 렌더러(소비 주체)** 사이의 데이터 계약을 확정한다.
Skill은 KSSB 4대 영역 사전검토 결과를 이 계약 형식의 **구조화 findings**로 산출하고, 렌더러는 이를 **재판정 없이**
대표 문서로 형식 변환한다. Source-bound Analysis 원칙을 계약(스키마) 수준에서 강제한다.

## 파일 위치
- 스키마: `src/schemas/kssb_findings.schema.json` (JSON Schema draft-07, 외부 런타임 의존 없음)
- 예시: `src/schemas/kssb_findings_example.json` (가상 공개 보고서 입력, 실제 기업·파일명 미사용)

## 생성 주체 / 소비 주체
- **생성 주체**: Skill `samil-kssb-precheck`. 입력 자료를 근거로 findings를 만든다(`SKILL.md` 절차).
- **소비 주체**: 향후 DOCX/HTML 렌더러. findings의 `judgment_code`·필드를 그대로 문서로 변환한다.
- **렌더러 재판정 금지**: 렌더러는 판정·근거·질문을 **다시 계산하거나 변경하지 않는다.** 정렬·표기·서식만 담당한다.
  DOCX와 HTML fallback은 **동일 findings 단일 소스**에서 파생하며 서로 다른 판정을 내지 않는다.

## review_mode
`report_meta.review_mode`는 두 모드를 지원한다.
- `customer_provided_materials` — 실제 고객 제공자료 기반.
- `public_materials_validation` — 해커톤 공개자료 검증(고객 제공자료의 대체 입력).

`source_documents[].source_mode`(`customer_provided` / `public`)는 review_mode와 정합해야 한다(수동 검증 규칙).

## judgment_code / judgment_label
내부 안정성을 위해 **기계 판정 코드(`judgment_code`)**와 **사용자-facing 라벨(`judgment_label`)**을 분리한다.
렌더러·검증은 `judgment_code`를 기준값으로 소비하고, 문서 표기에는 `judgment_label`을 쓴다.

| judgment_code | customer_provided_materials 라벨 | public_materials_validation 라벨 |
|---|---|---|
| `evidence_confirmed` | 제공자료상 근거 확인 | 공개자료상 근거 확인 |
| `partial_evidence_needs_supplement` | 일부 근거 확인, 보완 필요 | 일부 근거 확인, 보완 필요 |
| `not_verifiable` | 제공자료로 확인 불가 | 공개자료로 확인 불가 |
| `conflict_or_interpretation_needed` | 상충 또는 해석 필요 | 상충 또는 해석 필요 |
| `out_of_scope_or_not_applicable` | 검토 범위 외 또는 적용대상 아님 | 검토 범위 외 또는 적용대상 아님 |

- 이 매핑은 `src/skills/samil-kssb-precheck/judgment_schema.md`의 라벨 세트와 일치한다.
  `judgment_code`는 이번 계약에서 도입한 **정식 기계 코드**이며, judgment_schema.md의 라벨을 대체하지 않고 그 위에 안정 키를 부여한다.
- "준수/적합/인증/감사 의견/적정"처럼 보이는 라벨은 스키마 enum에 존재하지 않는다(금지).

## evidence_anchors 필수 규칙 (스키마 강제)
- `evidence_confirmed`, `partial_evidence_needs_supplement` 판정은 **`evidence_anchors` 최소 1개 필수**.
- 각 anchor는 `source_id` + `quote`(빈 문자열 금지)를 필수로 가진다. `page_or_section`·`relevance_note`는 권장.
- 근거 없는 "확인" 계열 판정은 스키마 검증에서 실패한다.

## not_verifiable → customer_questions 연결 규칙 (스키마 강제)
- `not_verifiable` 판정은 **`missing_info` 최소 1개 + `customer_questions` 최소 1개 필수**.
- 즉 확인 불가 항목은 반드시 부족 정보 명시와 고객 확인 질문으로 이어진다. 미공시로 단정하지 않는다.

## conflict_or_interpretation_needed → human review 연결 규칙 (스키마 강제)
- `conflict_or_interpretation_needed` 판정은 **`human_review_required: true` + `human_review_note`(비어 있지 않음) 필수**.
- 상충·해석 필요 항목은 자동 해소하지 않고 사람 검수로 넘긴다.

## out_of_scope_or_not_applicable 규칙 (스키마 강제)
- `out_of_scope_or_not_applicable` 판정은 **`missing_info` 최소 1개(적용 제외 사유) 필수**. 갭으로 단정하지 않는다.

## Source-bound Analysis 규칙
1. `evidence_confirmed`는 `evidence_anchors` ≥ 1. (스키마 강제)
2. `partial_evidence_needs_supplement`도 `evidence_anchors` ≥ 1. (스키마 강제)
3. `not_verifiable`는 `missing_info` ≥ 1 + `customer_questions` ≥ 1. (스키마 강제)
4. `conflict_or_interpretation_needed`는 상충·해석 사유 + `human_review_note`. (스키마 강제: human_review_required=true, note 비어있지 않음)
5. `out_of_scope_or_not_applicable`는 적용 제외 사유(`missing_info`). (스키마 강제)
6. `quote`는 빈 문자열 금지. (스키마 강제: minLength 1)
7. `evidence_anchors[].source_id`는 `source_documents[].source_id`에 존재하는 값을 참조해야 한다. **(수동 검증 규칙 — JSON Schema로 cross-reference 미표현)**
8. 출처 없는 숫자, 보고서 밖 추정, 외부 지식 보강은 findings에 넣지 않는다. **(수동/절차 규칙 — 스키마로 자동 검출 불가)**
9. 렌더러는 findings를 재판정하지 않고 형식 변환만 한다. **(절차 규칙)**

## 금지 표현 및 제품 경계와의 관계
- `report_meta.disclaimer`와 `human_review_boundary`는 필수 필드로, 삼일 비공식·감사/인증/준수 대체 아님·컨설턴트 검수용 초안 경계를 담는다.
- `prohibited_terms_check`는 금지 표현 스캔·고지문 존재 여부를 findings에 기록한다(`prohibited_terms.md` 목록 기준).
- `judgment_label` enum이 금지 판정명을 원천 차단한다.

## 향후 DOCX/HTML 렌더러가 따라야 할 최소 규칙
1. `judgment_code`를 기준값으로 소비하고, 표기는 review_mode에 맞는 `judgment_label`을 그대로 사용한다.
2. findings의 근거·질문·권고를 **재계산·재판정하지 않는다.**
3. `report_meta.disclaimer`, `human_review_boundary`를 대표 문서에 반드시 렌더한다.
4. DOCX·HTML은 동일 findings에서 파생(단일 소스). 결정적 출력을 지향한다.
5. plugin/cache/sandbox 내부 경로를 문서에 노출하지 않는다.
6. 대표 문서 파일명 규칙: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(fallback `.html`).

## JSON Schema로 표현하지 못한 수동 검증 규칙
- `evidence_anchors[].source_id` ↔ `source_documents[].source_id` cross-reference 정합.
- `judgment_label` ↔ `review_mode` 정합(제공자료 라벨은 customer 모드, 공개자료 라벨은 public 모드).
- `source_documents[].source_mode` ↔ `review_mode` 정합.
- `quote`가 실제 입력 자료에 존재하는 원문인지(환각·창작 인용 금지).
- 정량 요구 항목에서 수치·단위 결합 여부(예: 에너지 사용량 특칙) — 판정 타당성.
- 이 수동 규칙들은 향후 (승인 시) 경량 결정적 검증 단계 또는 완료 체크리스트로 점검한다. 코드는 이번 사이클에서 만들지 않는다.

## 필드 명명 조정 기록
- 지시서의 후보 구조를 대체로 유지했다. 조정·명확화한 부분:
  - `missing_info`를 문자열 배열로 정의하고, `not_verifiable`뿐 아니라 `out_of_scope_or_not_applicable`의 **적용 제외 사유**도 담도록 역할을 확장했다(판정별 사유의 단일 필드화).
  - `customer_questions[].priority`는 안정성을 위해 `high`/`medium`/`low` 코드로 정의했다(문서 표기 시 상/중/하로 변환 가능).
  - 판정별 필수 조건은 JSON Schema `allOf` + `if/then`으로 인코딩했다.
