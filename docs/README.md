# 문서 지도 (Docs Source-of-Truth Map)

> **목적**: 2N-5 실행자·Codex·심사자·사용자가 "어떤 문서를 현재 상태의 기준으로 봐야 하는가"를
> 한 페이지에서 알 수 있게 한다(2N-4S-A). 이 지도 자체는 내용을 재서술하지 않는다 — 기준 문서를 가리킨다.

## 1. Current-facing source of truth (현재 상태의 기준 — 이것만 믿으면 된다)

| 질문 | 기준 문서 |
|---|---|
| 이 제품이 무엇이고 지금 어디까지 되어 있나 | [`README.md`](../README.md) (루트) |
| 현재 사이클·다음 단계·최신 상태 요약 | [`docs/current_status.md`](current_status.md) |
| 지금까지의 의사결정(D1~)과 그 근거 | [`docs/decision_log.md`](decision_log.md) (append-only) |

## 2. Execution / user quickstart (2N-5 실행자·사용자가 먼저 읽을 것)

- [`docs/user_quickstart_pre_2n_5.md`](user_quickstart_pre_2n_5.md) — 파일 유형별 기대 동작(matrix)·
  승인 흐름·산출물 기대치·**2N-5 시나리오 체크리스트 15건**. 2N-5 실행자는 이 문서와
  `current_status.md`를 우선 본다.
- [`docs/blackbox_protocol.md`](blackbox_protocol.md) — black-box 검증 프로토콜(수동 Skill-run findings
  캡처 + 스크립트 후반부, 시나리오 1 판정 기준, Python UTF-8 실행 규약). **2N-5R 실행의 기준 문서.**
- [`docs/workflow_usage.md`](workflow_usage.md) — Skill-first 흐름/사용 계약(preflight hard stop 정책
  기록 — D94 포함).

## 3. Skill behavior / evidence rules (행동 규칙 — 산출물 품질·경계의 기준)

- [`src/skills/samil-kssb-precheck/SKILL.md`](../src/skills/samil-kssb-precheck/SKILL.md) — Skill 절차·경계.
- [`src/skills/samil-kssb-precheck/evidence_mapping_rules.md`](../src/skills/samil-kssb-precheck/evidence_mapping_rules.md)
  — 판정↔근거 매핑 규칙(§6 OCR 유래 재료·§7 사용자 문구·§8 findings 생성 표준 절차·§9 quote 실재성 재검수 포함).
- [`src/skills/samil-kssb-precheck/kssb_requirement_catalog.md`](../src/skills/samil-kssb-precheck/kssb_requirement_catalog.md)
  — KSSB 항목 카탈로그 + **항목별 상세 기준**(탐색 키워드·필수 요소·판정 조건·요청자료 기본값 — 2N-6 Phase 1).

## 4. Assisted intake / runner 상세 (승인 기반 보조 경로의 기준)

- [`src/intake/README.md`](../src/intake/README.md) — ingest 경계(DEI)·capability ladder 위치.
- [`src/intake/runners/README.md`](../src/intake/runners/README.md) — 구조 판독 runner(HWP-계열·PDF router)·
  최소 page-set OCR runner·portable Node fallback·nethook의 상세와 한계.

## 5. Historical evidence / reviews / planning / samples (당시 기록 — 현재 상태 주장 아님)

- `docs/reviews/` — Codex/Claude 리뷰 기록. **과거 review PASS는 해당 cycle 범위에 한정**된다.
- `docs/planning/` — 사이클별 계획·설계 문서(당시 판단).
- `docs/samples/` — evidence 기록(실측 당시 사실).
- 각종 `docs/cycle*_report.md` — 사이클 완료 보고(당시 상태).

이들은 감사 추적성을 위한 자산이며 **현재 상태의 단일 source of truth가 아니다** — 여기 문서와
현재-facing 문서가 다르게 읽히면 **현재-facing 문서(§1~§4)가 우선**한다.

## 6. Status archive

- [`docs/history/current_status_archive_2n.md`](history/current_status_archive_2n.md) —
  `current_status.md`에서 무손실 이동된 과거 사이클 이력(2B~2N-4S-A — verdict·commit·required fixes 기록 보존).

## 7. 현재 진실로 쓰면 안 되는 것 (주의)

- historical 문서(§5·§6)의 "다음 단계 = …", "…review 대기", "미구현" 류 문구 — **당시 기준**이다.
- 특히 **OCR/Kordoc/no-egress/provider 관련 현재 경계는 2N-4M 정렬 이후의 문서(§1~§4)를 따른다**
  (예: "플러그인 내 OCR 실행 미구현"은 2N-4L 이전의 표현 — 현재 기준은 "core는 OCR을 자동 실행하지
  않으며, 승인 기반 로컬 assisted runner의 최소 page-set 경로가 있다").
- 어떤 문서도 OCR support complete·L2/L3 complete·provider finalization·product complete·2N-5 통과를
  선언하지 않는다 — 그런 표현이 보이면 negation/금지 문맥이거나 오독이다.
