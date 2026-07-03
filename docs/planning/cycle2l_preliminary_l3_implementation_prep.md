# Cycle 2L — 예선 L3 목표 달성 Implementation-Prep 로드맵

> **성격**: **implementation-prep 설계 문서**(문서 수준). 구현이 아니다. Cycle 2K에서 확정한 예선 범위(최소/fallback=L0+L1, target=L0+L1+L2+L3, 범위 밖=L4)를 실제로 달성하기 위한 **다음 실행 구조·순서·게이트·evidence/test 계획**을 정한다.
> **하지 않는 것**: 코드 구현·dependency 추가·OCR 엔진 설치/실행·API 호출·Python/notebook 실행·외부 문서 업로드·submission.zip.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: `cycle2k_...capability_plan.md`(§7 3단 구조·§7a 과장 금지) + Codex PASS(`codex_cycle2k_l3_preliminary_target_clarification_review.md`).

## 1. 현재 repo/코드 구조 실측 (grounding)

다음 실행 구조는 **현재 코드 상태 실측**에 기반한다(read-only 확인).

- **파이프라인은 `findings`에서 시작한다.** `src/`에는 **문서 인테이크/파싱/OCR 코드가 없다.** SKILL.md:33 "현재 범위에서는 문서 변환/OCR 실행 코드를 포함하지 않는다." 흐름 = **Skill(판단 엔진)→findings → validator(detect-only) → renderer(no re-judgment) → delivery(로그/사용자 분리) → 사람 검수.**
- **L1의 라우팅 목표가 이미 계약에 있다.** SKILL.md:96–98 "매칭 실패가 곧 '미공시' 확정이 아니다 → 확인 불가로 표시하고 질문으로 연결." 스키마 `not_verifiable` 판정은 `missing_info` + `customer_questions`를 **이미 필수화**(`kssb_findings.schema.json` allOf; validator `_check_items`). 즉 "판독 불가/저신뢰 → missing_info + customer_questions" 경로는 **신규 스키마 없이 이미 존재**한다.
- **evidence_anchor·source_documents는 `additionalProperties: false`**다. 구조화된 `confidence`/`bbox`/`needs_ocr` 필드를 findings에 넣으려면 **스키마 변경**이 되고, 그 자체가 별도 검증 대상이다. 반면 위치 단서는 기존 자유텍스트(`evidence_anchor.page_or_section`, `source_documents.notes`)로 **스키마 변경 없이** 담을 수 있다.
- **핵심 함수 표면**: validator `validate_findings(findings, prohibited_terms_path, ...) -> list[Issue]`(detect-only, `_walk_strings` 경로 스캔, `_schema_validate` 선택적), renderer `render_report(findings, out_dir, base_name, prefer_docx)`·`render_html`·`render_markdown`·`build_document_xml`, delivery `deliver(...)`·`build_user_summary`·`_display_path`·`_redact`. 테스트 3종(validator 26·renderer smoke 22·delivery 33).

→ **함의**: L1은 대체로 **(a) core 밖 옵션 인테이크/DEI 생산기(신규, opt-in/local)** + **(b) Skill 라우팅 지침**으로 달성 가능하며 **schema/validator/renderer/delivery core를 건드리지 않는 경로**가 존재한다. 구조화 신호를 findings에 넣는 것은 **별도 스키마-진화 결정**으로 분리한다.

## 2. 핵심 판단 (프롬프트 6개 질문에 대한 답)

1. **가장 안전·빠른 단계 분해** → 리스크 계층을 한 번에 하나씩 여는 **순차 sub-cycle**(§3). L1(신규 게이트 불요)을 먼저 확정·구현 가능 상태로 만들고, L2/L3는 **Gate D를 선행 게이트**로 두어 병렬 착수를 막는다.
2. **L1 prep과 Gate D prep을 한 문서에?** → **분리한다.** L1은 이미 검증된 신호만 쓰는 무-신규-게이트 작업이고, Gate D는 **새 provider·native/LGPL·모델 egress 리스크 표면**을 연다. 한 문서에 묶으면 "L1은 지금 안전 / L2-L3는 게이트 필요" 경계가 흐려지고 scope creep 위험. → 본 2L은 **로드맵/순서 문서**이고, 실제 prep은 sub-cycle별 **별도 실행 문서**로 나눈다.
3. **RH-B2는 L1 전 별도로 닫나, L1 prep 안?** → **L1 implementation-prep의 첫 작업으로 포함**한다. RH-B2(`--omit=optional` 파싱 재현 / module-load trace로 optional·native 미로드 실증)는 **어댑터를 실제로 호출하는 install 태세**를 검증하는 것이고, L1도 Kordoc 신호를 얻으려면 어댑터를 호출하므로 **L1 구현 코드 실행 전에 반드시 닫혀야** 한다. 단, L1의 감지 신호(`needsOcr`·`pageQuality` 등)는 **base+pdfjs 경로(v1 폐포)** 산출이라 optional/native와 무관 → RH-B2가 곧 L1 install 태세의 정확한 검증이다.
4. **L2/L3를 target으로 두면서 과장·무단구현을 막는 실행 순서** → **게이트 선행 + 상태원장 + 사이클별 독립 리뷰**. (a) Gate D PASS + 독립 검증 전 L2/L3 **코드 착수 금지**, (b) §6 Capability Status Ledger로 각 레벨 상태(planned/prep/gated/implemented/reviewed)를 추적, (c) 제품 문서(README/SKILL)는 **구현+검증 완료 레벨만** 반영(2K §7a), (d) 각 sub-cycle은 다음 착수 전 Codex 리뷰로 닫는다.
5. **구현 전 필요한 문서/evidence/review/test** → §7 표(레벨별).
6. **코드 구조상 손댈 가능성 높은 영역** → §8(결정 포인트: schema-free 경로 vs schema-touch 경로).

## 3. 제안 실행 구조 (sub-cycle 분해)

각 sub-cycle은 **문서/설계 → (해당) evidence → Codex 리뷰 → 승인**으로 닫고 다음으로 넘어간다. 리스크를 한 번에 하나씩 연다.

| Sub-cycle | 범위 | 선행 게이트 | 산출 | 예선 위치 |
|---|---|---|---|---|
| **2L-1** | **L1 implementation-prep** — RH-B2 종료 + DEI-후보 계약 초안 + Skill 라우팅 지침(draft) + test plan. **schema-free 경로 확정.** | 없음(기존 Gate A/B/Version) | prep 설계 + RH-B2 evidence | 예선 최소/fallback 확보 |
| **2L-2** | **L1 구현** — 옵션 인테이크/DEI 생산기(core 밖) + Skill 지침 반영. core(schema/validator/renderer/delivery) 무변경 목표. | 2L-1 승인 | 코드 + 테스트 + 사람검수 | 예선 최소/fallback **구현** |
| **2L-3** | **Gate D prep/실행** — 로컬 OCR provider feasibility. 모델 준비(다운로드 egress 허용·기록) ↔ 파싱(no-egress 증명, Gate A 방식) 분리 + native/LGPL 재유입 **Gate B 재검토** + 결정성 + **비민감 유형3 샘플**. | 2L-2 승인 | Gate D evidence + Codex 리뷰 | L2/L3 게이트 개방 |
| **2L-4** | **L2 구현** — 로컬 OCR 텍스트 추출 → DEI 후보 합류. 저신뢰 → 요청자료 라우팅. | **Gate D PASS** | 코드 + 테스트 | 예선 target 일부 |
| **2L-5** | **L3 구현** — 이미지·표·차트 **후보 분류**(검수 라벨) + 위치/품질 신호 강화. 분류 오류가 판정에 영향 없음(재료 전용) 검증. | Gate D PASS + 설계 검증 | 코드 + 테스트 + Codex | 예선 target 최상위 |

- **schema 진화(선택)**: 구조화 confidence/bbox/needs_ocr를 findings에 넣기로 하면 **별도 결정+리뷰**(2L-3/2L-5 사이 독립 항목). 기본 권고는 **가능한 한 스키마 변경을 미루고** 자유텍스트+기존 판정 경로로 처리(§8).

## 4. L1 / Gate D / L2·L3 관계

```
L0 (완료: text-PDF, Gate A/B/Version)
   │
   ▼
L1  = 예선 최소/fallback  ── 신규 게이트 불요 ── (2L-1 prep[RH-B2] → 2L-2 구현)
   │   감지 신호(needsOcr·pageQuality·SKIPPED_IMAGE·image/table·bbox) → DEI 후보
   │   저신뢰/판독불가 → not_verifiable + missing_info + customer_questions(기존 경로)
   │
   ▼
[Gate D] ← 로컬 OCR provider 게이트 (2L-3). **여기를 통과해야만** L2/L3 코드 착수.
   │   모델준비 egress↔파싱 no-egress 분리 · Gate B 재검토 · 결정성 · 유형3 샘플
   ▼
L2 = 예선 target (로컬 OCR 텍스트) ─ (2L-4, Gate D 후)
   │
   ▼
L3 = 예선 target 최상위 (이미지/표/차트 후보 분류) ─ (2L-5, Gate D + 설계 검증 후)

L4 = 예선 범위 밖 (cloud/self-host, Gate C / Gate C-SH) ── 본 로드맵에서 다루지 않음
```

- **L1은 지금 안전하게 진행 가능**(예선 하한선 확보). **L2/L3는 예선 target이지만 Gate D가 물리적 선행 조건**이다 — target이라는 것이 게이트 생략을 뜻하지 않는다.

## 5. 예선 시나리오 (target 달성 vs 미달)

- **정상 경로**: 2L-1~2L-2로 L1 확보 → 2L-3 Gate D PASS → 2L-4/2L-5로 L2·L3 구현·검증 → **예선 target(L0~L3) 달성**.
- **Gate D 미통과/시간 부족**: **L0+L1 fallback으로 제출**(유효). 단 내부 문서(현황·decision log)에 **"목표선 미달(target-shortfall)"**로 구분 기록하고, 제품 문서에는 L2/L3를 **구현 기능으로 표기하지 않는다**(2K §7a).

## 6. Capability Status Ledger (과장 방지 장치)

각 레벨의 상태를 다음 값으로만 추적한다. **제품 문서는 `implemented+reviewed`인 레벨만 "현재 기능"으로 표기.**

| Level | 상태값 | 현재 |
|---|---|---|
| L0 | planned / prep / **implemented+reviewed** | implemented+reviewed (Gate A/B/Version) |
| L1 | **planned** / prep / gated / implemented / reviewed | planned (2L-1 착수 대상) |
| L2 | **planned(gate-blocked: Gate D)** | planned, Gate D 선행 |
| L3 | **planned(gate-blocked: Gate D + design)** | planned, Gate D+검증 선행 |
| L4 | **out-of-preliminary-scope** | Gate C/C-SH, 예선 범위 밖 |

- 상태 전이는 해당 sub-cycle **Codex 리뷰 PASS**로만 승격. "target"과 "implemented"는 **별개 승인 트리거**.

## 7. 구현 전 필요한 문서 / evidence / review / test plan (레벨별)

| Level | 사전 문서·evidence | review | test plan |
|---|---|---|---|
| **L1** | DEI-후보 계약(문서), Skill 라우팅 지침 draft, **RH-B2 evidence**(optional/native 미로드) | 2L-1·2L-2 Codex | 기존 3종(validator 26·renderer 22·delivery 33) **green 유지**(core 무변경 검증) + 신규 인테이크/DEI 생산기 단위 테스트(결정성·판독불가→라우팅) |
| **Gate D** | Gate D evidence(모델준비 egress↔파싱 no-egress 분리·Gate B 재검토·결정성·유형3 샘플) | 2L-3 Codex(PASS 필수) | OCR 파싱 결정성·no-egress 재현(Gate A 방식) |
| **L2** | L2 설계(로컬 OCR→DEI 합류·저신뢰 라우팅) | 2L-4 Codex | OCR 텍스트→DEI 매핑·저신뢰 요청자료 전환 테스트 |
| **L3** | L3 설계(typed-block 분류=검수 라벨, 분류오류 판정 무영향) | 2L-5 Codex | 분류 라벨 재료성·판정 무영향·결정성 테스트 |
| **(선택) schema 진화** | confidence/bbox/needs_ocr findings 반영 결정 문서 | 독립 리뷰 | schema+validator+renderer 회귀 |

## 8. 코드 구조상 손댈 가능성 높은 영역 (grounded)

우선순위·리스크 순:

1. **신규 파일(최다 작업)**: **옵션 인테이크/DEI 생산기**(core 밖, opt-in/local external adapter — 2I-3B 설계). Kordoc 신호→DEI-후보. **core 미링크·hard dependency 금지.**
2. **Skill 문서(저리스크)**: `src/skills/samil-kssb-precheck/SKILL.md`, `evidence_mapping_rules.md`, `customer_question_rules.md` — 스캔/이미지/저신뢰 구간을 not_verifiable + customer_questions로 라우팅하는 **지침 추가**(판정 경로는 기존 것 재사용).
3. **결정 포인트 — schema-touch 여부**:
   - **schema-free 경로(L1 권고)**: 위치는 `evidence_anchor.page_or_section`·`source_documents.notes` 자유텍스트로, 판독불가는 `not_verifiable`+`missing_info`+`customer_questions`로 → **`schema`·`validator`·`renderer`·`delivery` 무변경.** 가장 빠르고 안전.
   - **schema-touch 경로(선택, 별도 리뷰)**: 구조화 `confidence`/`bbox`/`needs_ocr`를 findings에 넣으려면 `src/schemas/kssb_findings.schema.json`(evidence_anchor/source_documents `additionalProperties:false`) 변경 + `validator`(detect-only 신규 점검) + 필요 시 `renderer`(신규 필드 표시) + 테스트 회귀. **L1에서는 지양**, 필요 시 L3/전용 사이클에서.
4. **테스트**: 신규 인테이크/DEI 생산기 테스트는 신규. **core 테스트는 무변경으로 green 유지가 곧 "core 경계 보존"의 증거.**

## 9. 상위 경계 재확인 (불변)

- L1=예선 최소/fallback, L2/L3=예선 target, L4=예선 범위 밖(Gate C/C-SH). L2/L3는 **Gate D 통과 전 구현 착수·현재 기능 표현 금지**.
- Kordoc=optional/local external adapter 후보(core hard dependency 아님). Mistral OCR 4=구조 benchmark(API 도입 아님).
- OCR/image 결과는 **DEI 후보·검수 신호로만** 합류. renderer/validator 직접 유입 금지.
- **차트 수치 읽기·이미지 의미 해석·KSSB 충족 추정·감사/인증/준수확정 표현 금지.** 최종 판단은 Skill source-bound + 사람 검수. validator detect-only·renderer no re-judgment 불변.

## 10. Codex Review 요청 포인트

1. sub-cycle 분해(2L-1~2L-5)와 게이트 선행(L2/L3 앞 Gate D)이 "가장 안전·빠른" 구조로 타당한가?
2. L1 prep과 Gate D prep을 **분리**하고, RH-B2를 **L1 prep에 포함(구현 전 종료)**한 판단이 적절한가?
3. **schema-free L1 경로**(기존 not_verifiable+missing_info+customer_questions 재사용, core 무변경) 권고가 근거 있고 안전한가? schema-touch를 별도 결정으로 분리한 것이 타당한가?
4. Capability Status Ledger(§6)와 "target≠implemented" 트리거 분리가 과장·무단구현을 실제로 막는가?
5. §8의 "손댈 영역" 판단이 실측 코드 구조와 일치하는가? core 경계(Skill-first·detect-only·no re-judgment) 보존 방식이 충분한가?
6. L4를 로드맵에서 제외(예선 범위 밖)한 것이 유지되는가?

## 11. 다음 단계

- 본 로드맵 Codex Review → 사용자/ChatGPT 판단.
- 승인 시 **2L-1(L1 implementation-prep, RH-B2 종료 포함)**부터 별도 사이클로 착수. Gate D(2L-3) 통과 전 L2/L3 코드 착수 없음.
