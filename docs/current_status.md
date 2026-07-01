# 현재 상태 (Current Status)

## 현재 Cycle
- **Cycle 2B** — Findings Schema Contract 확정. 렌더러·validator 코드·Hook/MCP·샘플 실행 없음.

## 사이클 이력 (요약)
- **Cycle 1** — Skill-first Codex 플러그인 1차 골격. Codex 독립 리뷰 **PASS**(`docs/reviews/codex_cycle1_independent_review.md`). Minor: submission.zip 원본 로그 포함.
- **Cycle 2A** — 구현 계획 수립(planning-only). Codex Planning Review **PASS**(`docs/reviews/codex_cycle2a_planning_review.md`). Minor: 로그 포함 방식 확정(제출 단계), current_status·decision_log 잔여 Cycle 1 문구 정리.
- **Cycle 2B** — 본 사이클. 구조화 findings 데이터 계약 확정.

## Cycle 2B 완료 작업
- Findings 스키마: `src/schemas/kssb_findings.schema.json`(JSON Schema draft-07, 외부 의존 0). `judgment_code`별 source-bound 필수 조건을 `if/then`으로 강제.
- 예시 findings: `src/schemas/kssb_findings_example.json`(가상 공개 보고서, 4대 영역, 판정 5종 포함, 실제 기업·파일명 미사용).
- 계약 문서: `docs/findings_schema_contract.md`(생성/소비 주체, 렌더러 재판정 금지, review_mode, judgment_code↔label, source-bound 규칙, 수동 검증 규칙).
- Skill 문서 최소 정합성 보정: `SKILL.md`, `report_template.md`, `completion_checklist.md`(findings-first 흐름·렌더러 재판정 금지·근거 앵커 필수·확인 불가→질문 반영).
- current_status·decision_log 정리(Codex Cycle 2A Minor 반영).
- **렌더러/validator 코드·Hook/MCP·샘플 PDF·Python 코드 복사 없음.**

## 문서 템플릿 정비 (Cycle 2B 이후)
- 반복 사용 양식 추가: `docs/reviews/REVIEW_REPORT_TEMPLATE.md`(공통 리뷰 보고 형식),
  `docs/templates/`(완료보고·Codex 리뷰 프롬프트·Claude Code 작업 프롬프트·Preflight 체크리스트·decision log 항목·README).
- 향후 Codex 리뷰는 `REVIEW_REPORT_TEMPLATE.md`를 참고하는 **짧은 프롬프트 방식**으로 전환.
- 완료 보고: `docs/template_system_completion_report.md`.
- **Cycle 2B schema/example/contract 및 Skill 문서는 수정하지 않음(검증 대기).**

## 미완료 / 이후 사이클 (의도적 제외)
- DOCX/HTML 렌더러 구현(구조화 findings 소비).
- 경량 결정적 검증 단계(수동 검증 규칙 자동화).
- 샘플 실행·submission.zip 패키징.
- Hook/MCP는 하드 요건 확정 시에만 재검토.

## 보류 (확정하지 않음)
- **logs 원본 제출 방식**: repo 커밋 vs submission.zip 번들만 — **제출 패키징 단계에서 결정**(현재 미확정).
- 렌더러 코드 도입 위치·시점, 참고 엔진 재구현 범위.

## GitHub / 검증 상태
- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin (owner `WonJong0920`, branch `main`).
- Cycle 2B 산출물 push 후 **ChatGPT 확인 대기**. 다음 단계는 ChatGPT·사용자가 결정한다.
- 최종 검증·PASS/FAIL 판정은 **Codex**가 수행한다. 검증 기준은 `docs/validation_criteria.md` 참조.
- 최종 commit SHA는 자기참조 문제로 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.
