# B5-Q P1-2 — Numeric Meaning / Column Mapping Guidance (CR1+QR2) 완료 보고서

> **성격**: Claude Code 작업 완료 보고(자체 Preflight, PASS/FAIL 판정 아님). B5-Q 두 번째 narrow cycle로,
> **CR1(수치 의미 정합) + QR2(수치 표 인용 열↔기간·단위 매핑)**를 상류 지침 층에만 반영했다.
> 근거: `docs/reviews/codex_b5q_p1_1_quote_selection_guidance_review.md`(PASS — P1-2 착수 권고·upstream 유지 조건),
> `docs/planning/kssb_precheck_output_enhancement_plan.md` §2-C(CR1)·§2-Q(QR2)·§7-3(P1-2 편성),
> 실측 evidence `docs/planning/usertest_output_quality_review_2026-07-09.md` §4B-C1(목표 배출 *수준* vs 감축 *량*
> 혼용 — p.100 교차검증으로 실측)·§4-Q2(연도 헤더 없는 숫자 나열 인용 4건 실측). 시작 HEAD `5f415a5…`.

## 1. 추가한 지침

### `src/skills/samil-kssb-precheck/evidence_mapping_rules.md` §7 — 신규 2불릿

1. **수치 표 인용의 열↔기간·단위 매핑 명시(QR2)**: 연도/기간 헤더 없는 숫자 나열을 quote로 쓸 경우 근거 설명
   (`relevance_note`)에 각 수치의 연도/기간·단위 대응을 명시 — **대응은 원문 표 헤더에서 확인한 것만**(추정 매핑 금지).
   매핑 미확인 시 그 사실을 서술하고 정량 근거 강도를 보수적으로 취급.
2. **동일 수치의 의미 구분(CR1)**: 같은 숫자가 다른 의미(목표 배출 수준 vs 누적 감축량, 총량 vs 원단위 등)로 읽힐
   수 있는 인용을 병치할 때 근거 설명에서 의미 차이를 구분하고, 가능하면 원문 내 다른 위치 수치와 교차확인.
   원문이 모호하면 임의 확정 대신 **고객 확인 질문으로 모호성 표면화**(기준연도·기준배출량 포함).
   **명시 경계**: 재판정·재계산이 아니라 서술·질문 층 규칙 — 판정 라벨 규칙(§1~§3·judgment_schema) 무변경.

### `src/skills/samil-kssb-precheck/SKILL.md` — 1줄 앵커

- Evidence mapping rules 절의 정량 근거 불릿 아래에 열↔기간 매핑·의미 구분 요약 + §7 포인터(재판정 아님 명시).

## 2. 경계 준수

- **상류 findings 생성 지침만** — validator·renderer·delivery·schema·manifest·package·생성 산출물 **무변경**
  (P1-1 리뷰 carry-forward "P1-2는 upstream guidance로 유지" 그대로).
- KSSB 표준 해석 불포함(P1-3 범위) — 본 사이클은 수치 인용 서술·질문 행동 규칙만.
- 교차확인·의미 구분은 **검수 유도 서술**이지 재계산 승인 아님을 문구에 명시(§7 마지막 문장).

## 3. 검증 결과

- `git diff --name-only`: `evidence_mapping_rules.md`·`SKILL.md` 2개(+본 보고서). 비-markdown 변경 0.
- `git diff --check`: 공백 오류 0. SKILL.md 선두 `---`(BOM 없음) 유지.
- 번들 계약 사본 2종은 본 변경과 무관(드리프트 비대상).

## 4. 남은 B5-Q 편성 (변경 없음)

- **P1-3**(AR1/AR2 KSSB 맥락 문구 — 계획 §7-2의 source-status/hedge 라벨 유지 필수) 별도 사이클.
- UR1·QR3·GR4/GR5 연기 유지. B6는 B5-Q 완료 또는 명시적 defer 후.

## 5. status

- **Codex B5-Q P1-2 review 대기.**
