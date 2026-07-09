# Phase 3-B — Validator Detect-only Warning v1 구현 Report (R1·R2)

> **성격**: validator 구현 완료 보고다. Codex가 승인한 v1 warning **2건만** 구현했다
> (scope: `docs/planning/phase3b_validator_detect_only_scope_plan.md`, review:
> `docs/reviews/codex_phase3c_closure_phase3b_scope_plan_review.md` — **PASS**, OBS-01/02 carry-forward).
> Claude Code는 구현·검증·보고만 하며 PASS/FAIL 최종 판정은 후속 **Codex implementation review**가 수행한다.
> **이 커밋에서 current_status·decision_log에 closure를 기록하지 않는다**(프롬프트 지시 — review PASS 후 별도).

## 0. HEAD

- 시작 HEAD: `e59dc26`(Codex Phase 3-B scope review commit — origin/main 동기, clean, 0/0). 예상 밖 local
  변경·충돌·untracked 없음. HEAD가 지정 scope review commit과 정확히 일치.
- 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재).

## 1. 변경 파일

| 파일 | 성격 |
|---|---|
| `src/validators/kssb_findings_validator.cjs` | R1·R2 detect-only warning helper 2개 추가 + `validateFindings`에서 호출 |
| `tests/test_findings_validator_node.test.cjs` | R1·R2 신규 테스트 11건 추가 |
| 본 완료 보고서 | 신규 |
| **무변경** | Python validator·schema·renderer·delivery·package/lock·parity harness·기타 전부 |

## 2. 구현 방식 선택 이유

- **별도 helper 2개 + `validateFindings`에서 호출**(기존 `_checkQuoteReuse`·`_checkItems` 본문 미개조).
  - 이유: 기존 cross-item `evidence.duplicate_quote_reuse`와 item 검사 로직을 **건드리지 않아** 기존 issue의
    code·message·location·**ordering을 흔들지 않는다**(OBS-01·기존 동작 보존). 신규 warning은 additive로만 얹힌다.
  - 호출 지점: `_checkQuoteReuse(...)` 직후에 `_checkQuoteReuseWithinItem` → `_checkMissingInfoBlank` 순서로 배치
    (quote 관련 규칙을 인접 배치, 기존 순서 뒤에 additive 삽입 — 기존 이슈 상대순서 불변).
- 순회는 기존 `_iterItems(f)` 제너레이터를 재사용해 location 접두사(`kssb_areas[AI].items[II]`)를 기존 규칙과
  동일 규약으로 생성. quote 비교는 기존 관례대로 `String(value).trim()`(내부 `_s(...).trim()`).

## 3. 구현한 warning 2개 (외부 계약)

### R1 — within-item duplicate quote reuse
- **code**: `evidence.duplicate_quote_within_item`
- **severity**: `warning`
- **location**: `kssb_areas[AI].items[II].evidence_anchors[J].quote` — 반복 quote의 **첫 anchor index J**.
- **message**: `동일 항목 안에서 같은 인용이 여러 evidence_anchors에 반복 사용되었습니다. 중복 근거인지 사람 검수가 필요합니다.`
- **동작/de-dup**: 한 item의 `evidence_anchors` 안에서만 비교. 객체 아닌 anchor·빈 quote(`trim()===""`)는 skip
  (빈 quote는 기존 `anchor.quote_empty` 담당). 동일 quote 2회↑ → **item+quote당 warning 1건**(3회↑도 1건).
  서로 다른 quote가 각각 반복되면 각각 1건씩(첫 등장 anchor index 순 = Map 삽입순, 결정적).
- **cross-item 규칙 불변**: 기존 `evidence.duplicate_quote_reuse`는 변경하지 않음. 한 quote가 cross-item·
  within-item을 동시에 만족하면 두 warning이 모두 날 수 있으나 R1 자체는 item+quote당 1건.

### R2 — whitespace-only `missing_info`
- **code**: `missing_info.blank_item`
- **severity**: `warning`
- **location**: `kssb_areas[AI].items[II].missing_info[J]` — 공백-only 원소의 index J.
- **message**: `missing_info에 공백문자만 있는 항목이 있습니다. 실제 부족 정보 문구를 쓰거나 제거해야 합니다.`
- **동작**: `missing_info`가 배열일 때만 순회. 원소가 **string이고 `trim()===""`**(`""`·공백·탭·줄바꿈)면 warning.
  string 아닌 원소는 v1 대상 아님. `missing_info=[]`는 대상 아님(기존 sourcebound rule이 담당). customer_question
  필드는 미검사(기존 `question.field`가 담당). warning-only(error count 불변).

### ordering
- 두 규칙 모두 `_checkQuoteReuse` 이후·`_checkProhibitedAndPaths` 이전에 additive로 방출. 기존 이슈의 상대순서
  불변. 신규 warning 간 순서는 item 순회 순 → (R1) 첫 등장 quote 순 / (R2) 원소 index 순으로 결정적.

## 4. 수정하지 않은 범위 (경계 준수)

- **Python validator 무변경**(golden parity reference 유지 — D93③). schema·renderer·delivery·package/lock·
  generated artifact 무변경.
- **parity harness 무완화**: allowlist·message 비교 예외·하네스 수정 없음.
- findings 미변경(detect-only), judgment_code/label 미변경, 신규 issue 전부 `warning`, source_text와 무관.
- quote normalization·source-text truth matching 확장·intake/OCR/runner 배선·source-less number 자동 판정·
  정량 수치결합/evidence gap·anchor `page_or_section` warning·human-review table renderer·hook/MCP·N5·
  submission packaging **미착수**.

## 5. 테스트 실행 결과

| 명령 | 결과 |
|---|---|
| `node --test tests/test_findings_validator_node.test.cjs` | **54/54 pass**(기존 43 + 신규 11), skip 0 |
| `node --test tests/test_findings_validator_parity.test.cjs` | **35/35 pass**, skip 0(Python reference 사용됨) |
| `node --test tests/*.test.cjs`(전체 Node 스위트) | **365/365 pass**(기존 354 + 신규 11), fail 0·skip 0 |
| `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 <PY> tests/test_findings_validator.py` | **30/30 pass**(Python 불변) |

- `<PY>` = `%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe`(실측). `git diff --check` clean.
- 신규 테스트 커버리지: R1 valid무발화·2회 1건·3회 1건·서로 다른 quote 2건(ordering)·within-item≠cross-item /
  R2 valid무발화·공백원소 1건·빈문자열/탭/줄바꿈·`[]`은 sourcebound 담당·non-string 제외 / detect-only 불변.
  severity·code·location·message·warning count·error count를 assert.

## 6. parity 관련 결과

- **기존 parity fixture·base example에서 신규 warning 발화 없음** → **무회귀**(parity 35/35, base CLI "warning
  0건" 유지). 사전 분석: 25개 parity fixture 중 within-item 동일 quote를 만드는 것 없음(`duplicate_quote_reuse`는
  cross-item, `anchor_quote_empty`는 빈 quote로 R1 skip), `missing_info` 관련 fixture는 `[]`(빈 배열)이라 공백-only
  원소 없음. 실행으로 확정(parity 0 fail·0 skip).
- 불가피한 divergence **없음** → parity 완화·allowlist·message 예외 추가 **하지 않음**(금지 준수).

## 7. 자체 검증 요약

- 변경 파일 = validator.cjs·node test 2건(+보고서). Python·schema·renderer·delivery·package 무변경(guard 확인).
- 신규 issue 전부 warning(error count 불변 — 테스트 강제). detect-only(findings 미변경 — 테스트 강제).
- 기존 issue code/message/location/order 불변(별도 helper·기존 본문 미개조).
- no-overclaim: 제품 완성·2N-5 통과·OCR complete·provider finalization·submission readiness 주장 없음.

PASS/FAIL 판정은 하지 않는다(Codex 몫).

## 8. 다음 단계

- **Codex implementation review** 대기(R1·R2 계약·detect-only·warning-only·parity 무회귀·경계 대조).
- review PASS 후: Phase 3-B closure를 current_status/decision_log에 **별도** 기록. 보류·후속 설계 rule
  (anchor page_or_section·quote normalization·정량 수치결합)은 각각 별도 승인·설계·review로만 진입.
