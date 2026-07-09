# B5-Q P1-1 — Quote Selection Guidance (QR1) 완료 보고서

> **성격**: Claude Code 작업 완료 보고(자체 Preflight, PASS/FAIL 판정 아님). B5-Q 첫 narrow cycle로,
> **QR1(인용 선택 지침 — CR4·Q4 흡수)**을 상류 지침 층에만 반영했다.
> 근거: `docs/reviews/codex_b5q_source_traceability_review.md`(PASS — P1-1 착수 권고),
> `docs/planning/kssb_precheck_output_enhancement_plan.md` §2-Q(QR1)·§7-3(P1-1 편성),
> 실측 evidence `docs/planning/usertest_output_quality_review_2026-07-09.md` §2/Q1(비연속 표 인용 1건 실측).
> 시작 HEAD `3dd10c0…`.

## 1. 추가한 지침

### `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`

- **§7 신규 3개 불릿**:
  1. **단일 연속 스팬 원칙(인용 합성 금지)** — 인용은 원문에서 연속으로 존재하는 단일 스팬이어야 하며(허용 차이 =
     §9와 동일한 공백·줄바꿈 정규화), 개별 토큰이 실재해도 연속이 아니면 검증 가능한 인용이 아니다.
  2. **표/색인 파생 인용 규칙** — 여러 셀·행을 가로질러 이어붙인 문자열 금지(실측 사례 유형: 카테고리 헤더 + 다른
     행 분류번호 + 충족 마커 합성). 대안 ① 단일 연속 셀 값만 quote + 분류번호·페이지·마커(●◐○)·행/열 맥락은 인용
     밖(`page_or_section`·`relevance_note`·근거 설명), ② 연속 인용 불가 시 quote를 만들지 않고 근거 설명·
     `missing_info`로 서술(§6 "없는 quote로 앵커를 만들지 않는다"와 동일 원칙).
  3. **근거 선택 강도(권장, CR4·Q4 흡수)** — 조각·다이어그램 라벨·정의문보다 완결된 문장·실제 활동/수치 서술 우선.
     연속 원문인 라벨 나열은 사용 가능하되 더 온전한 문장이 있으면 그쪽 선택.
- **§9 재검수 checklist 신규 1항**: **비연속 합성 점검(표/색인 유래)** — quote가 셀/행 가로지른 합성이 아님을 확인,
  발견 시 §7 규칙으로 수정.

### `src/skills/samil-kssb-precheck/SKILL.md`

- Evidence mapping rules 절에 **1줄 앵커** 추가(단일 연속 스팬 원칙 + §7·§9 포인터) — 상세는 evidence_mapping_rules에 위임.

## 2. 경계 준수

- **상류 findings 생성 지침만** 변경 — validator·renderer·delivery·schema·manifest·package·생성 산출물 **무변경**
  (리뷰 지정 경계 그대로). detect-only·no-rejudgment·source-bound·사람 검수 경계 문구 변경 없음.
- 신규 지침은 기존 §6("없는 quote로 앵커 금지")·§9(verbatim 재검수)의 **연장·구체화**이며 판정 라벨 규칙을 바꾸지 않는다.
- KSSB 표준 해석 불포함(P1-3 범위) — 본 사이클은 source-bound 인용 행동 규칙만.

## 3. 검증 결과

- `git diff --name-only`: `evidence_mapping_rules.md`·`SKILL.md` 2개(+본 보고서). `.cjs`/`.py`/`.json`/tests 변경 0.
- `git diff --check`: 공백 오류 0. SKILL.md 선두 바이트 `---`(BOM 없음 유지).
- 번들 계약 사본 2종(schemas 계약·workflow_usage)은 본 변경과 무관 — 드리프트 비대상 확인.

## 4. 남은 B5-Q 편성 (변경 없음)

- **P1-2**(CR1+QR2 수치 의미·열매핑 지침) → **P1-3**(AR1/AR2 — §7-2 source-status/hedge 라벨 유지 조건) 각각 별도 사이클.
- UR1·QR3·GR4/GR5 연기 유지. B6는 B5-Q 완료 또는 명시적 defer 후.

## 5. status

- **Codex B5-Q P1-1 review 대기.**
