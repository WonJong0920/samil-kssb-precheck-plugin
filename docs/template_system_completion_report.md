# 문서 템플릿 정비 완료 보고

## 1. 작업 개요
반복적으로 사용하는 문서 양식을 repo에 템플릿화했다. Codex 리뷰·완료 보고·작업 지시 프롬프트를 매번 긴 형식으로
반복하던 문제를 해소하기 위해, 공통 리뷰 보고 형식과 반복 산출물 양식을 추가하고 이후 재사용할 수 있게 했다.
이번 작업은 **템플릿 정비만** 수행했으며, 검증 대기 상태인 Cycle 2B 산출물(schema/example/contract/Skill 문서)은 건드리지 않았다.

## 2. 작성한 템플릿 목록
- `docs/reviews/REVIEW_REPORT_TEMPLATE.md` — 공통 리뷰 보고 형식.
- `docs/templates/CYCLE_COMPLETION_REPORT_TEMPLATE.md` — Cycle 완료 보고 형식.
- `docs/templates/CODEX_REVIEW_PROMPT_TEMPLATE.md` — 짧은 Codex 리뷰 프롬프트 틀.
- `docs/templates/CLAUDE_CODE_TASK_PROMPT_TEMPLATE.md` — 짧은 Claude Code 작업 지시 틀.
- `docs/templates/PREFLIGHT_CHECKLIST_TEMPLATE.md` — 제출 전 최소 점검 양식.
- `docs/templates/DECISION_LOG_ENTRY_TEMPLATE.md` — decision_log 새 항목 양식.
- `docs/templates/README.md` — 각 템플릿 용도·사용 시점 안내.

## 3. 각 템플릿 용도
- **REVIEW_REPORT_TEMPLATE**: Codex 리뷰 문서(`docs/reviews/codex_*.md`)가 참고하는 권장 구조. Overview·Verdict·Reviewed·Validation·Findings by Severity(Critical/Major/Minor)·Scope-Specific·Boundary/Risk·Next-Step Readiness·Reviewer Notes·확인 대기. PASS/CONDITIONAL PASS/FAIL 기준 포함. 섹션 가감 가능 명시.
- **CYCLE_COMPLETION_REPORT_TEMPLATE**: 완료 보고 공통 양식(작업 개요·파일·핵심 결정·검증·금지 작업 미수행·보류·push·확인 대기).
- **CODEX_REVIEW_PROMPT_TEMPLATE**: 짧은 리뷰 프롬프트 틀. "리뷰 보고 형식은 REVIEW_REPORT_TEMPLATE.md를 참고하라" 문구 포함.
- **CLAUDE_CODE_TASK_PROMPT_TEMPLATE**: 짧은 작업 지시 틀(목표·확인 문서·산출물·범위·금지·Preflight·완료 보고 형식).
- **PREFLIGHT_CHECKLIST_TEMPLATE**: 필수 파일·문법/구조·제품 경계·Source-bound·금지 표현·금지 작업 미수행·git 상태.
- **DECISION_LOG_ENTRY_TEMPLATE**: Decision ID·Date·Context·Decision·Rationale·Alternatives·Consequences·Status·Related.
- **templates/README**: 용도·사용 시점 표와 사용 원칙.

## 4. 기존 문서 갱신 내용
- `docs/current_status.md`: "문서 템플릿 정비" 섹션 추가(양식 추가, 짧은 Codex 리뷰 프롬프트 전환, Cycle 2B 미수정 명시).
- `docs/decision_log.md`: D20(반복 문서 양식 템플릿화) 추가 — 새 DECISION_LOG_ENTRY 양식 구조로 기록.
- **Cycle 2B schema contract 본문은 수정하지 않음.**

## 5. Preflight Check 결과 (완료)
- [x] `docs/reviews/REVIEW_REPORT_TEMPLATE.md` 존재.
- [x] `docs/templates/README.md` 및 템플릿 5종 존재.
- [x] 반복 사용 가치가 있는 양식만 추가(과다 생성 지양).
- [x] `current_status.md` / `decision_log.md`가 템플릿 추가 상태 반영.
- [x] Cycle 2B `kssb_findings.schema.json` / `kssb_findings_example.json` / `findings_schema_contract.md` / `SKILL.md` / `report_template.md` / `completion_checklist.md` **미수정**(git diff로 확인).
- [x] 렌더러/validator 코드 미추가, Hook/MCP 미추가, submission.zip 미생성.
- [x] git diff가 템플릿 문서 + 상태/결정 로그 갱신 + 본 완료 보고에만 한정.

## 6. 금지 작업 미수행 확인
- schema/example/contract/SKILL/report_template/completion_checklist 수정: **미수행**.
- 렌더러·validator 코드 구현, Hook/MCP 추가, 기존 Python 코드 복사: **미수행**.
- 샘플 보고서 분석 실행, submission.zip 생성, Codex 리뷰 실행: **미수행**.

## 7. GitHub push 상태
- repo URL: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- 최종 commit SHA는 자기참조 문제로 본 문서에 고정하지 않고, 작업 완료 채팅 보고에 별도 기재한다.

## 8. ChatGPT 확인 대기
- Cycle 2B schema contract 수정 없음, Codex 리뷰 실행 없음.
- 다음 단계는 `REVIEW_REPORT_TEMPLATE.md`를 참고하는 **짧은 Codex Cycle 2B 리뷰 프롬프트**로 전환한다.
- 최종 검증·PASS/FAIL 판정은 Codex가 수행한다.
