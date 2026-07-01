# Templates (반복 사용 문서 양식)

이 폴더는 Samil KSSB Precheck Plugin 작업에서 **반복 사용하는 문서 양식**을 모은다.
목적은 Codex 리뷰·완료 보고·작업 지시 프롬프트를 매번 길게 반복하지 않고, 양식을 참조해 **짧고 일관되게**
작성하는 것이다.

> 모든 파일은 **실제 산출물이 아니라 양식**이다. 특정 Cycle 번호에 종속되지 않으며, 필요 시 섹션을 추가·축소할 수 있다.

## 목록과 사용 시점

| 템플릿 | 용도 | 사용 시점 |
|---|---|---|
| `../reviews/REVIEW_REPORT_TEMPLATE.md` | 공통 리뷰 보고 형식(Codex 리뷰 문서가 참고) | Codex가 리뷰 문서를 작성할 때 |
| `CYCLE_COMPLETION_REPORT_TEMPLATE.md` | Cycle 완료 보고 형식 | Claude Code가 Cycle 작업 완료 후 |
| `CODEX_REVIEW_PROMPT_TEMPLATE.md` | 짧은 Codex 리뷰 프롬프트 틀 | Codex 리뷰를 요청하는 프롬프트 작성 시 |
| `CLAUDE_CODE_TASK_PROMPT_TEMPLATE.md` | 짧은 Claude Code 작업 지시 틀 | Claude Code 작업을 지시하는 프롬프트 작성 시 |
| `PREFLIGHT_CHECKLIST_TEMPLATE.md` | 제출 전 최소 점검 항목 | 각 Cycle 종료 전 Preflight 수행 시 |
| `DECISION_LOG_ENTRY_TEMPLATE.md` | decision_log 새 항목 구조 | `docs/decision_log.md`에 결정 추가 시 |

> 리뷰 보고 양식은 관례상 `docs/reviews/` 아래(`REVIEW_REPORT_TEMPLATE.md`)에 두어 실제 리뷰 문서와 같은 위치에서 참조한다.

## 사용 원칙
- 리뷰 프롬프트에는 **"리뷰 보고 형식은 `docs/reviews/REVIEW_REPORT_TEMPLATE.md`를 참고하라"**를 넣어 형식 반복을 줄인다.
- 판정 기준은 PASS / CONDITIONAL PASS / FAIL로 간단히 유지한다.
- 어느 양식을 쓰든 **제품 경계(삼일 비공식·감사/인증/준수 대체 아님), Source-bound Analysis, 사람 검수 경계,
  해커톤 제출 맥락, 금지 작업 점검**이 빠지지 않도록 한다.
- 최종 검증·PASS/FAIL 판정은 Codex가 수행한다. Claude Code는 Preflight(누락 방지)만 수행한다.
