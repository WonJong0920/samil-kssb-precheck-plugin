# B5-Q P1-3 — KSSB Context Wording (AR1/AR2) 완료 보고서

> **성격**: Claude Code 작업 완료 보고(자체 Preflight, PASS/FAIL 판정 아님). B5-Q 마지막 P1 narrow cycle로,
> **AR1(내부탄소가격 선택공시)·AR2(Scope 3 유예)** 제도 맥락 문구를 상류 지침(카탈로그) 층에만 반영했다.
> 근거: `docs/reviews/codex_b5q_p1_2_numeric_meaning_guidance_review.md`(PASS — P1-3 착수 권고·조건 2건),
> `docs/planning/kssb_precheck_output_enhancement_plan.md` §2-A(AR1/AR2)·**§7-2(source-status/hedge 라벨)**·§7-3(P1-3 편성),
> 실측 evidence `docs/planning/usertest_output_quality_review_2026-07-09.md` §4C-A1/A2. 시작 HEAD `b4abb5f…`.

## 1. 추가한 지침 (`src/skills/samil-kssb-precheck/kssb_requirement_catalog.md`)

### metric-03 (AR1 — §7-2 상태: ⓐ 확정 공시기준·선택공시 → 단정 가능)

- **제도 맥락 불릿 추가**: 톤당 내부 탄소가격 = **확정 공시기준(첫 번째 세트)의 선택공시 허용 항목** — 미확인 시
  근거 설명·질문에 "선택공시 항목이므로 운영 여부 확인 필요" 맥락 명시, **미운영·미확인을 결함/공시 갭으로 서술 금지**.
  기존 적용 조건 확인 규칙·"검토 범위 외 또는 적용대상 아님" **라벨 규칙 무변경** 명시.

### metric-02 (AR2 — §7-2 상태: 유예 개념 ⓐ 확정(경과규정) / 구체 일정 ⓑ 로드맵 초안·미확정 → hedge 필수)

- **제도 맥락 불릿 추가**: 유예 개념은 확정 기준 경과규정으로 지지 / **구체 유예 일정은 로드맵 초안 단계·미확정**으로
  구분 서술 + hedge 예문("공시 유예가 제시되어 있어, 확정 시 세부 일정은 달라질 수 있음") 고정.
  **보수 강화**: §7-2가 "2031 표기 시 hedge 필수"였으나, 설치 지침이 특정 연도를 사실처럼 반복 학습시키는 위험을 줄이기 위해
  **카탈로그 문구에는 특정 연도·기간 자체를 넣지 않았다**(계획 §7-2보다 좁은 방향의 이탈 — 완화 아님).
  정량 부재를 즉시 결함·미공시로 서술하지 않고 **선제 구축(카테고리·경계·데이터 체계) 질문·권고 유도**.
  정량요구 판정 규칙(수치 없으면 partial) **무변경** 명시.
- **요청자료 기본값 확장**: "(선제 구축 확인용) 데이터 수집 체계·단계별 구축 계획" 추가.

## 2. 리뷰 조건 준수 (P1-2 review carry-forward 2건)

- **§7-2 source-status/hedge 조건 유지**: 두 불릿 모두 확정/초안 구분을 문구에 그대로 반영(위 참조). 카탈로그는 설치
  번들 문서이므로 repo `docs/` 참조 없이 자기완결 서술(B5-A 원칙 유지) — traceability는 본 보고서와 계획 §7이 보유.
- **upstream-only 유지**: 변경은 카탈로그(findings 생성 지침) 층만. **validator·renderer·delivery·schema·manifest·
  judgment_code/라벨 의미 무변경** — 두 불릿 모두 "판정 규칙 무변경"을 문구 내 명시.

## 3. 검증 결과

- `git diff --name-only`: `kssb_requirement_catalog.md` 1개(+본 보고서). 비-markdown 변경 0.
- `git diff --check`: 공백 오류 0.
- 판정·라벨·스키마 관련 어휘 변경 없음(두 불릿은 근거설명·질문·권고 문구층 명시).

## 4. B5-Q P1 시퀀스 상태

- **P1-1(QR1) PASS → P1-2(CR1+QR2) PASS → P1-3(AR1/AR2) 본 사이클 완료** — P1 전 항목 구현 완료(각 리뷰 게이트).
- 연기 유지: UR1(렌더러 표현)·QR3(validator 휴리스틱)·GR4/GR5(EXTENDED).
- **B6 진입 조건**: B5-Q P1-3 리뷰 통과 시 "B5-Q 완료(연기 항목 명시 defer)" 상태로 B6 최종 리뷰 진행 가능(사용자/ChatGPT 결정).

## 5. status

- **Codex B5-Q P1-3 review 대기.**
