# Phase 3-A — Validation Coverage Audit & 검수 표 Gap Map (docs-only)

> **성격**: 이 문서는 **audit(대조·격차 정리)만** 한다. 코드·테스트·schema·package·generated artifact를
> 바꾸지 않는다. 자동화 안전성 판정은 **후속 Codex review로 승인받아야** 구현(3-B/3-C)으로 넘어간다.
> Claude Code는 PASS/FAIL 최종 판정을 하지 않는다.
> 상위 계획: `docs/planning/phase3_validation_strengthening_plan.md`(§3 Phase 3-A). 시작 HEAD `152709e` clean.
> 근거: `docs/findings_schema_contract.md`, `src/validators/kssb_findings_validator.cjs`,
> `src/skills/samil-kssb-precheck/completion_checklist.md`·`report_template.md`, `docs/blackbox_protocol.md`,
> `docs/decision_log.md`(D93·D95·D96), `docs/reviews/codex_cycle2n_6_trace_manifest_implementation_review.md`.

## 1. 목적 / 범위

현재 **detect-only 검증 표면**이 계약(스키마+수동 규칙)을 어디까지 덮는지 대조하고, 남은 격차 각각을
**detect-only로 안전하게 자동화 가능한지** 판정한다. 여기에 **검수 표(human-review surface)** 드리프트와
**검증 프로토콜(blackbox)** 의 Node 드리프트·manifest evidence 적용 범위를 목록화한다. 구현은 하지 않는다.

**자동화 안전성 기준**(이 audit이 각 격차에 적용하는 판정 틀):
- (a) findings를 **읽기만** 한다(변조 없음).
- (b) `judgment_code`/`judgment_label`을 **다시 계산·변경하지 않는다**(재판정 금지).
- (c) 명백한 계약 위반만 `error`, 휴리스틱 신호는 `warning`/`info`.
- (d) **결정적**이고 외부 의존성 0.
- (e) 입력 findings 외 **추가 데이터(원문 텍스트 등)가 필요하면 opt-in 게이트**로만 둔다.
→ 위 5개를 모두 만족하면 **SAFE**, 일부 저촉·경계면 **BORDERLINE(설계·리뷰 필요)**, 결정적 자동화가
원리적으로 불가하면 **NOT-AUTOMATABLE(사람 유지)** 로 판정한다.

## 2. 계약 규칙 ↔ validator 자동 감지 대조표

`kssb_findings_validator.cjs`(런타임)가 실제로 방출하는 이슈 코드 기준. 스키마 강제 규칙도 validator가
fallback으로 중복 커버(Node는 jsonschema 부재 — `schema.optional_skipped` info로 표기)한다.

| 계약 규칙(출처) | 성격 | validator 이슈 코드 | 커버리지 |
|---|---|---|---|
| evidence_confirmed·partial → anchors ≥ 1 | 스키마 강제 | `sourcebound.anchors` | **자동** |
| not_verifiable → missing_info ≥ 1 + questions ≥ 1 | 스키마 강제 | `sourcebound.missing_info`·`sourcebound.questions` | **자동** |
| conflict → human_review_required=true + note | 스키마 강제 | `sourcebound.human_review`·`sourcebound.human_review_note` | **자동** |
| out_of_scope → missing_info ≥ 1 | 스키마 강제 | `sourcebound.out_of_scope` | **자동** |
| quote 비어있지 않음(minLength 1) | 스키마 강제 | `anchor.quote_empty` | **자동** |
| customer_question 필수 6필드·priority enum | 스키마 강제 | `question.field`·`question.priority` | **자동** |
| judgment_code enum·필수 항목 필드 | 스키마 강제 | `item.judgment_code`·`item.field` | **자동** |
| 구조 필수(report_meta·disclaimer·human_review_boundary·source_documents·kssb_areas·area·item) | 스키마 강제 | `structure.*`·`source_doc.*`·`area.*` | **자동** |
| **anchor.source_id ↔ source_documents cross-ref** | **수동(스키마 미표현, 계약 §96)** | `anchor.source_id_ref` | **자동(수동규칙 이미 해소)** |
| **judgment_label ↔ review_mode 정합** | **수동(계약 §96)** | `mode.label_mismatch` | **자동(해소)** |
| **source_mode ↔ review_mode 정합** | **수동(계약 §96)** | `mode.source_mode_mismatch` | **자동(해소)** |
| **quote 실재성(입력 원문에 존재)** | **수동(계약 §100)** | `quote.source_not_found`(opt-in `--source-text`) | **부분(PARTIAL)** — §3-①  |
| **정량요구 항목 수치·단위 결합(판정 타당성)** | **수동(계약 §101, 에너지 특칙)** | — | **미자동(GAP)** — §3-② |
| **출처 없는 숫자·보고서 밖 추정·외부 지식 보강** | **수동/절차(계약 §80·§102)** | — | **미자동(원리적)** — §3-③ |
| 렌더러 재판정 금지 | 절차(계약 §81) | (validator 대상 아님 — renderer parity 테스트가 커버) | 범위 밖 |

**validator가 계약 수동목록 밖에서 추가로 제공하는 guardrail**(강화된 표면):
`evidence.duplicate_quote_reuse`(warning — 동일 인용 다항목 재사용), `prohibited.term`·`path.internal_exposure`
(error — 금지표현·내부경로 노출), `prohibited.list_load`(warning), `schema.optional_skipped`(info).

### 요지
계약의 수동 검증 규칙 5건 중 **3건(cross-ref·label↔mode·source_mode↔mode)은 이미 자동화**되어 격차가 아니다.
**실제 남은 격차는 quote 실재성(부분)·정량 수치결합(미자동)·출처없는 숫자(원리적 미자동) 3건**뿐이다.
즉 Phase 3-B의 detect-only 추가 여지는 **넓지 않고 좁다** — 과도한 규칙 신설은 재판정 위험만 키운다.

## 3. 남은 격차별 자동화 안전성 판정

### ① quote 실재성 — 현재 PARTIAL
- **현황**: `_checkQuoteReality`(additive·기본 off·`--source-text` 제공 시만)가 공백 정규화 substring 미발견을
  `quote.source_not_found` warning으로 보고. Python reference 미확장(Node-only). `docs/workflow_usage.md` 경계
  서술은 이 opt-in 점검을 **언급하지 않음**(문서-코드 정합 갭).
- **한계**: 원문 미제공 시 미실행 / exact substring only(의역·말줄임·OCR·정규화 변형에 취약) / match ≠ 맥락정합 /
  non-match ≠ 환각. 그래서 warning이며 사람 검수·독립 표본(blackbox §3-(b))을 대체하지 않는다.
- **판정**:
  - (문서 정합) workflow_usage 경계 한 줄 추가 = **SAFE(docs-only)** → 3-D 또는 3-C 문서 정렬에 포함 가능.
  - (정규화 강화: NFC·문장부호/따옴표 폴딩·하이픈 dehyphenation) = **BORDERLINE** — 거짓 미발견 감소 이점 vs
    과도 폴딩 시 거짓 신뢰 위험. opt-in 유지·warning 유지 전제면 재판정 아님. 설계·리뷰 필요.
  - (intake OCR 원문 자동 배선) = **범위 밖(보류)** — upstream provenance 경계(OBS-02) 접촉. v1 밖, 후속 별도
    사이클 후보로만. 3-B에서 착수하지 않는다.

### ② 정량요구 항목 수치·단위 결합 — GAP(미자동)
- **현황**: completion_checklist §근거·판정 정합성("정량요구 항목에서 수치 없는 근거를 '근거 확인'으로 올리지
  않았다", "에너지 사용량 항목에서 온실가스 수치를 정량 근거로 전용하지 않았다")은 **사람 체크리스트 전용**.
  validator·renderer는 `kssb_requirement_catalog.md`의 항목별 상세 기준을 **소비하지 않는다**.
- **자동화 후보(가정)**: 카탈로그에서 "정량 요구"로 표시된 `item_id`에 한해, 판정이 confirmed/partial인데 anchor
  quote/relevance_note에 **수치+단위 토큰이 전무**하면 `warning`(예: `evidence.quantitative_no_metric`).
- **판정**: **BORDERLINE** —
  - 저촉 지점: 카탈로그 `item_id` 결합(카탈로그↔validator 신규 의존), 수치·단위 패턴 휴리스틱의 오탐, 그리고
    "정량 항목인데 근거에 수치 없음"을 신호화하는 것이 **재판정 경계에 근접**(판정을 바꾸진 않지만 판정 타당성에
    개입). warning·detect-only·판정 불변을 엄격히 지키면 (a)(b)(c) 충족 가능하나 설계 난이도·오탐 관리가 크다.
  - **권고**: 3-B 필수가 아님. 채택 시 **별도 소범위 설계 + Codex 사전 승인**을 거치고, 에너지 특칙 같은
    항목별 세부는 자동화하지 않고 사람 체크리스트로 유지(§4 검수 표 강화로 흡수). **미채택도 정당한 선택**.

### ③ 출처 없는 숫자·보고서 밖 추정·외부 지식 보강 — NOT-AUTOMATABLE
- 원문 대조 + 의미 판단이 필요해 결정적 자동화가 원리적으로 불가(계약 §80·§102도 "스키마로 자동 검출 불가"로
  명시). **사람 검수 유지.** quote 실재성 점검(①)이 부분적으로만 근접 신호를 줄 뿐, 이 규칙 자체는 자동화 대상 아님.

### (부가) 새 detect-only guardrail 후보 — 3-B triage용(필수 아님)
계약 밖이지만 검수 품질에 도움될 수 있는 **SAFE 후보**(전부 warning·판정 불변·findings 읽기만):
- confirmed/partial anchor에 `page_or_section`(위치 단서) 부재 → 위치성 약함 warning.
- `missing_info`/질문 필드가 공백문자만(예: `" "`)인 경우(현재 nonempty 검사를 통과할 수 있는 경계) 재점검.
- 동일 항목 내 동일 quote 중복 anchor.
→ 채택은 3-B에서 **오탐/노이즈 대비 효용**으로 취사. 신설 남발 금지(요지: 격차는 좁다).

## 4. 검수 표(human-review surface) Gap Map

- **런타임 드리프트(SAFE·docs-only)**: `completion_checklist.md` §워크플로우가 아직 Python 경로
  (`src/validators/kssb_findings_validator.py`·`src/renderers/kssb_report_renderer.py`)를 참조 → Phase 2 Node
  closure(D95)와 불일치. **Node 또는 런타임-중립 표기로 정렬** 필요. `report_template.md` §7·내용 규칙은 경로
  참조가 없어 저위험이나, 검증 단계 서술을 런타임-중립으로 재확인.
- **검수 우선순위 표면화 격차**: 현재 보고서는 conflict→"사람 검수 대상" 표기, not_verifiable→질문 연결까지는
  하지만, **항목별 "왜/무엇을 사람이 확인해야 하는지"를 한 표로 모으는 검수 우선순위 표가 없다.** validator가
  내는 warning(quote 재사용·quote 미발견 등)도 delivery `--debug` 내부에만 있고 검수자 대면 산출물에 표면화되지
  않는다.
- **강화 방향(3-C)**: (docs 먼저) 검수 대상 항목 유형(conflict·not_verifiable·partial·warning-flag)을 한 표로
  모으는 **검수 표 서식**을 report_template/completion_checklist에 정의. (조건부 구현) 렌더러가 human-review 절에
  항목별 검수 사유를 표면화 — **재판정 금지·parity 준수·단계 분리**(문서 서식 확정 후 별도 판단). 판정 자동화 아님.

## 5. 검증 프로토콜(blackbox) Node 드리프트 + manifest evidence 범위

- **Node 드리프트(SAFE·docs-only, 3-D)**: `docs/blackbox_protocol.md` §1 Python 과도기 규약·§2 step 5(dei_producer)
  ·step 8(kssb_report_delivery)이 `<PY>` 기준. D95(core Node closure)로 §5의 "Node 이식 완료 시 갱신" 조건이
  성립 → 해당 명령을 **Node(`node src/intake/dei_producer.cjs`·`node src/renderers/kssb_report_delivery.cjs`)로
  갱신, Python은 reference로 병기**. 판정 기준 §3(PASS/FAIL/BLOCKED)·quote 표본 확인 §3-(b)은 유지.
- **manifest evidence 범위(3-D)**: trace manifest(D96, opt-in)를 **delivery-segment 한정** 결정적 검증 evidence로
  §4에 편입 가능(findings canonical hash·preflight counts·산출물 hash를 수동 집계 대신 `run_manifest.json`으로).
  단 **OBS-01 규약 명시 필수**: exit 0 단독으로 manifest capture 성공을 단정하지 말고 **파일 존재·API 반환·
  `--debug`로 확인**. **upstream intake/OCR/runner end-to-end provenance는 범위 밖 유지**(OBS-02).

## 6. Open Question — 신규 detect-only 규칙의 parity 방침

validator는 Python golden parity reference(D93③)와 parity 테스트(`test_findings_validator_parity.test.cjs`)를
가진다. 3-B에서 규칙을 추가할 때:
- **A. Node-only additive(문서화된 divergence)** — `_checkQuoteReality`(“Python 미확장”) 선례. Python을 golden
  reference로 동결 유지, Node에만 additive. 장점: Python 무변경 관례 유지·범위 최소. 단점: Node/Python divergence
  표면 증가(parity 테스트에서 의도된 차이로 명시 기록 필요).
- **B. Python reference에도 미러링** — full parity 유지. 장점: 단일 규칙 세트. 단점: Python 수정 발생(그간의
  "Python 무변경" 강한 관례와 충돌, 작업량↑).
- **잠정 권고(리뷰 대상 — 확정 아님)**: warning 성격의 휴리스틱 신호는 **A(Node-only additive)**, 명백한 계약
  위반(error)을 새로 잡는 경우엔 **B(미러링) 고려**. 최종 방침은 **Codex review + ChatGPT/사용자 승인**으로 확정.

## 7. 3-B/3-C/3-D 착수 범위 권고(요약)

| 후속 | 범위 권고 | 유형 |
|---|---|---|
| **3-D** | blackbox Node 명령 정렬 + manifest evidence(OBS-01 규약) + quote-reality 경계 한 줄 문서화 | docs-only, **저위험 — 우선 착수 후보** |
| **3-C** | 검수 표 서식 정의(문서) + completion_checklist 런타임 정렬 / 렌더러 검수 우선순위(조건부) | docs 우선 + 조건부 구현 |
| **3-B** | quote-reality 정규화 강화(BORDERLINE·opt-in 유지) / (선택) 정량 수치결합 warning — **필수 아님, 사전 승인 필요** | 구현 |

**착수 순서 권고**: 3-D(저위험 docs) → 3-C(검수 표 문서 서식) → 3-B(BORDERLINE 항목은 별도 설계·승인 후).
3-A audit **Codex review PASS 전에는 3-B 구현을 착수하지 않는다**(자동화 안전성·parity 방침 승인 게이트).

## 8. 하지 말아야 할 것 (경계)

- 이 audit 단계에서 코드·테스트·schema·package·generated artifact **무변경**(docs-only).
- **재판정 금지**: 어떤 신규 규칙도 판정을 계산·변경하지 않는다. 정량 수치결합(②)은 재판정 경계라 미채택이 기본값.
- **quote-reality intake 배선·upstream end-to-end provenance는 v1 밖**(OBS-02) — 후속 별도 사이클 후보로만.
- **Python reference·N5 aux 한계 유지**(D93). hook/dispatcher·submission packaging으로 확장하지 않는다.
- **no-overclaim**: 이 audit·Phase 3은 검증 표면 강화일 뿐 — 제품 완성·2N-5 통과·OCR complete·provider
  finalization·submission readiness가 아니다. 사람 검수는 최종 권한.

## 9. 다음 단계

- 본 audit에 대한 **Codex review**(대조표 정확성·자동화 안전성 판정·parity 방침·범위 권고 검증).
- review PASS 후 착수 순서(§7): **3-D → 3-C → 3-B(BORDERLINE은 승인 후)**. 각 후속은 독립 Codex review 게이트 유지.
