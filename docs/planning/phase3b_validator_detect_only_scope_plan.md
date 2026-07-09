# Phase 3-B — Validator Detect-only Rule 강화 Scope Plan (구현 아님 · docs-only)

> **성격**: 이 문서는 Phase 3-B **구현 스코프·rule selection·parity 방침·테스트 계획·금지 범위**를 확정하는
> 계획 문서다. **여기서 validator를 구현하지 않는다.** 다음 구현자가 바로 착수할 수 있도록 판단 기준만 고정한다.
> Codex review 대상이며, **review PASS 후에만** Phase 3-B 구현 프롬프트를 작성한다.
> 근거: `docs/planning/phase3a_validation_coverage_audit.md`(§3·§6·§7),
> `docs/planning/phase3_validation_strengthening_plan.md`(§3 Phase 3-B),
> `docs/reviews/codex_phase3a_validation_coverage_audit_review.md`(P3A-OBS-01·02·03),
> `src/validators/kssb_findings_validator.cjs`(read-only), `tests/test_findings_validator*.test.cjs`(read-only).
> 시작 HEAD: `d134d53`(Codex integrated review) 이후.

## 5-1. Phase 3-B의 목적

validator의 **detect-only validation surface 강화** — 구조·계약·근거 품질의 결함이 사람 검수에 도달하기 전에
**warning으로 더 많이 표면화**되게 한다. 다음을 **하지 않는다**:

- findings **재판정 금지**(judgment_code/judgment_label 계산·변경 없음).
- **renderer 변경 금지**, **delivery 변경 금지**, **schema 변경 금지**.
- **Skill 판단 대체 금지**, **사람 검수 대체 금지**.
- 제품/감사/인증/준수 확정 아님. quote 실재성·source-less number를 자동 판정으로 전환하지 않는다.

validator는 findings를 **읽기만** 하고 Issue 목록만 방출한다(현행 detect-only 경계 유지).

## 5-2. 구현 후보 rule set (안전성 분류)

Phase 3-A audit(§2 남은 격차 3건 + §부가 SAFE 후보)와 Codex observation(P3A-OBS-02·03)을 기준으로 분류한다.
후보를 **전부 구현 대상으로 확정하지 않는다.**

| 후보 | audit 판정 | Phase 3-B 처리 |
|---|---|---|
| **within-item 동일 quote 재사용 warning**(한 항목 내 동일 quote 다중 anchor) | §부가 SAFE | **v1 구현** |
| **`missing_info` 공백-only 원소 warning**(배열 원소가 공백문자만) | §부가 SAFE(P3A-OBS-02가 실제 미커버 표면으로 좁힘) | **v1 구현** |
| anchor `page_or_section`(위치 단서) 부재 warning | §부가 SAFE이나 noise 가능(권장 필드·정당한 생략 다수) | **보류**(noise 관리·opt-in 여부 설계) |
| quote normalization 강화(NFC·문장부호/하이픈 폴딩) | §3-① BORDERLINE | **후속 설계**(과도 폴딩=거짓 신뢰 리스크, opt-in 유지 전제) |
| quote-reality intake 원문 자동 배선 | 범위 밖(OBS-02 upstream) | **후속 별도 사이클**(v1 밖·본 Phase 3-B 밖) |
| 정량 수치결합 / 정량요구 evidence gap warning | §3-② BORDERLINE(catalog 결합·재판정 경계) | **후속 설계**(P3A-OBS-03: confirmed-only·item-specific, partial penalize 금지) |
| source-less number / 외부 지식 보강 detect-only | §3-③ NOT-AUTOMATABLE | **미채택(사람 유지)** |

기존 규칙(cross-item `evidence.duplicate_quote_reuse`, opt-in `quote.source_not_found`,
`prohibited.term`·`path.internal_exposure` 등)은 **불변**이다. v1은 그 위에 additive로만 얹는다.

## 5-3. v1 권장 범위 (좁게)

**v1 = Node validator에 additive detect-only warning 2건만.**

- **R1 — within-item 동일 quote 재사용 warning**
  - 한 `finding_item`의 `evidence_anchors` 안에서 동일 quote가 2회 이상 anchor로 쓰이면 warning.
  - 신규 코드(예) `evidence.duplicate_quote_within_item`. 기존 cross-item `evidence.duplicate_quote_reuse`와
    **분리**(중복 방출 금지 — 같은 quote가 cross-item·within-item 양쪽에 해당하면 규칙별 판단 근거를 겹치지 않게 설계).
- **R2 — `missing_info` 공백-only 원소 warning**
  - `missing_info` 배열에 **공백문자만 있는 원소**가 있으면 warning(현행은 원소 내용의 공백-only를 잡지 않음 —
    P3A-OBS-02). 신규 코드(예) `missing_info.blank_item`.
  - **범위 한정**(P3A-OBS-02): 이미 `_isNonemptyStr()`로 커버되는 customer_question 필드는 **중복 검사하지
    않는다** — 실제 미커버 표면(`missing_info` 배열 원소)만 대상.

공통 제약(둘 다):
- **additive detect-only**, **warning 우선**(error 신규 없음).
- **findings 수정 없음**, **judgment_code/label 변경 없음**, **schema 변경 없음**, **renderer 변경 없음**.
- **source_text 미제공 시 기존 동작 불변**(R1·R2는 source_text와 무관 — findings 자체만 읽음).
- valid example(`kssb_findings_example.json`)에서 **신규 warning 0건**(clean fixture 무회귀 — 아래 테스트로 강제).

정량·normalization·intake·source-less는 **v1에서 제외**(§5-2). v1 rule을 과도하게 늘리지 않는다(audit §2 요지:
격차는 좁다 — 규칙 남발은 재판정·오탐 위험만 키운다).

## 5-4. parity 방침

**핵심 사실**(read-only 확인 — `tests/test_findings_validator_parity.test.cjs`): parity 스위트는 **동일 fixture에
대해 Node↔Python CLI의 전체 이슈 목록을 순서 포함 (severity, code, location, message)까지 대조**한다
(`--json --no-jsonschema`, message 비교 예외는 `schema.*`·`prohibited.list_load`뿐).

따라서:
- **v1 R1·R2는 Node-only additive**로 둔다(Python reference 미수정 — golden parity 동결 유지, D93③).
  선례 = opt-in `quote.source_not_found`("Python 미확장").
- **parity 무회귀 조건**: 신규 Node-only warning이 **기존 parity fixture와 base example에서 발화하지 않아야**
  한다(그래야 두 구현의 이슈 목록이 여전히 일치). R1·R2는 clean/기존 fixture를 건드리지 않으므로 조건 충족 예상 —
  단 **구현 시 실측 확인 필요**(신규 warning이 기존 30여 parity fixture 중 어디서도 안 뜨는지).
- **신규 warning fixture는 Node 단위 테스트(`test_findings_validator_node.test.cjs`)에만** 둔다(parity 스위트에
  넣지 않는다).
- **의도된 divergence 기록**: 신규 warning code가 Node 전용임을 완료 보고서·테스트 주석에 명시. 만약 어떤 신규
  warning이 기존 parity fixture에서 불가피하게 발화하면, 그건 **의도된 divergence**이므로 parity 하네스에 Node-only
  code allowlist를 추가하는 방식이 필요하다 → **그 처리 방식은 구현 시 확인 필요**(현재 하네스에 allowlist 훅이
  있는지 미확인).
- **Python mirror가 필요한 경우**: 새로 **error-severity 계약 위반**을 잡는 규칙을 추가할 때만 mirror를 고려한다.
  v1은 error 신규가 없어 mirror 불필요. Python reference 수정은 "Python 무변경" 관례를 바꾸므로 **별도 승인·별도
  review**가 전제다(임의 수정 금지).

## 5-5. 테스트 계획 (다음 구현자용 — repo 실재 명령 기준)

신규 구현자가 수행할 테스트 표면. **명령은 repo에 실재하는 것만 기재**하고, 불확실한 부분은 "확인 필요"로 남긴다.

- **신규 단위 테스트**(R1·R2): `tests/test_findings_validator_node.test.cjs`에 fixture·assert 추가(또는 신규
  `.test.cjs`). 실행: `node --test tests/test_findings_validator_node.test.cjs`.
  - `warningCodes(f)` 헬퍼(해당 파일에 이미 존재)로 신규 warning code 발화/미발화 검증.
  - clean example에서 신규 warning 0건, 트리거 fixture에서만 1건.
- **전체 Node regression**: `node --test tests/*.test.cjs`(validator·delivery·renderer·DEI·runner·manifest 포함) —
  green 유지로 무회귀 증명.
- **parity**: `node --test tests/test_findings_validator_parity.test.cjs` — 기존 fixture에서 Node↔Python 일치
  유지(신규 Node-only warning이 기존 fixture에서 미발화). Python 실행 파일은 스위트가 자동 탐색(`SAMIL_PARITY_PY`
  또는 `%LOCALAPPDATA%\Python\...\python.exe`), 없으면 skip.
  - **확인 필요**: 신규 warning이 기존 parity fixture와 충돌하지 않는지 실측, 충돌 시 의도된-divergence 기록 방식.
- **Python reference 불변**: `<PY> tests/test_findings_validator.py`(`PYTHONUTF8=1; PYTHONIOENCODING=utf-8`,
  절대경로 Python) — Python 미수정이므로 **불변 확인**(회귀 아님).
- **동작 성질 확인**:
  - source_text **제공/미제공** 케이스에서 R1·R2 동작 동일(무관 확인).
  - **warning-only**: 신규 규칙이 error를 만들지 않음(preflight **error count 불변**).
  - **renderer/delivery 비영향**: 동일 findings의 delivery 산출물·user_summary 불변(신규 warning은 내부 이슈
    목록에만).

## 5-6. 금지 범위 (Phase 3-B 구현 프롬프트에도 명시)

- validator **구현 착수 금지**(이 문서는 계획일 뿐).
- renderer 구현 금지 · schema 변경 금지 · delivery 변경 금지.
- judgment 재계산 금지 · findings 자동 수정 금지.
- quote-reality를 **사람 검수 대체로 표현 금지** · source-less number를 **자동 판정으로 전환 금지**.
- quote normalization 실제 구현·intake/OCR/runner 자동 배선·trace manifest v1의 upstream 확장 금지.
- hook/dispatcher/MCP/registry·submission packaging 금지.
- 제품 완성·2N-5 전체 통과·OCR complete·provider finalization·submission readiness 주장 금지.

## 5-7. 다음 단계 게이트

1. **이번 scope plan은 Codex review 대상**이다.
2. **Codex review PASS 후에만** Phase 3-B 구현 프롬프트를 작성한다.
3. Phase 3-B 구현은 **별도 commit / 별도 review**로 수행한다(v1 rule·parity·테스트 실측 포함).
4. 구현 후에도 **Phase 3-B closure는 Codex review 이후** current_status/decision_log에 기록한다(조기 closure 금지).
5. 보류·후속 설계 항목(§5-2)은 각각 **별도 설계·승인·review**로만 진입한다(v1에 편승 금지).
