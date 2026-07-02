# Operating Principles Lock 완료 보고

## 1. 작업 개요

에이전트 간 역할 구분과 보고 방식이 흐려지는 것을 방지하기 위해 운영 원칙을 repo에 고정했다. 기능 구현이 아니라
**운영 원칙 고정**이며, 문서만 추가/수정했다(코드·marketplace·manifest·validator·renderer·schema 무변경).

## 2. 작성/수정한 파일

**신규**
- `AGENTS.md` — 루트 진입 문서. 역할 구분 표 + 핵심 운영 원칙 + "작업/리뷰 전 `AGENTS.md`·`docs/operating_principles.md` 먼저 읽기" 지시.
- `docs/operating_principles.md` — 역할별 상세, 운영 원칙(고정), 보고 방식 요약 표, 항상 유지하는 경계.
- `docs/operating_principles_lock_completion_report.md` — 본 완료 보고.

**수정(최소)**
- `docs/templates/CLAUDE_CODE_TASK_PROMPT_TEMPLATE.md` — read-first 지시·역할(작업 수행자·PASS/FAIL 금지) 명시, 확인 문서에 두 원칙 문서 추가.
- `docs/templates/CODEX_REVIEW_PROMPT_TEMPLATE.md` — read-first 지시·역할(독립 검증자·리뷰는 `docs/reviews/`·채팅 요약만) 명시, 확인 파일에 두 원칙 문서 추가.
- `docs/current_status.md` — 상단에 "운영 원칙(고정)" 섹션 추가.
- `docs/decision_log.md` — D36(Operating Principles Lock) 추가.

## 3. 고정한 역할 구분

- **Claude Code** — 작업 수행자. 문서/코드 수정, 자체 Preflight. 완료 보고는 repo 문서, 채팅은 경로·commit SHA·push 여부만. **PASS/FAIL 판정 금지.**
- **Codex** — 독립 검증자. PASS/CONDITIONAL PASS/FAIL 판정, repo diff·문서 정합성 검토, 핵심 질문은 최소 기준·**자율 탐색 필수**.
  리뷰는 반드시 `docs/reviews/`. 채팅은 리뷰 문서 경로·Verdict·Readiness·Critical/Major/Minor 요약·commit SHA·push 여부만. 장문은 repo 문서.
- **ChatGPT** — 작업 분기 판단. GitHub 문서 확인 후 다음 단계·프롬프트 결정. 직접 구현자·최종 검증자 아님.
- **User** — 외부 앱/CLI 상태 변경 검증(Codex app/CLI 설치 확인 등), 최종 제출 판단.

## 4. 고정한 추가 운영 원칙

1. 실질 작업 Cycle은 원칙적으로 Claude Code 작업 → Codex 독립 리뷰 순서.
2. Claude Code는 자체 점검하되 PASS/FAIL 판정 안 함.
3. Codex 리뷰 문서는 반드시 `docs/reviews/`.
4. Claude Code·Codex 모두 장문 완료/검증 보고를 채팅에 쓰지 않음.
5. ChatGPT는 repo 문서 확인 후 다음 분기·프롬프트 결정.
6. 외부 앱/CLI 상태 변경 작업은 사용자 직접 수행.
7. Codex app/CLI plugin install/enable 확인은 사용자 직접 검증 항목.
8. 이후 모든 Claude/Codex 프롬프트는 먼저 `AGENTS.md`·`docs/operating_principles.md`를 읽으라는 지시 포함.

## 5. Preflight Check 결과

- 변경이 **문서만**임을 확인(코드·marketplace·manifest·validator·renderer·schema·tests·`.gitignore` 무변경).
- ZWSP 등 이상 문자 없음.
- 회귀 sanity: validator CLI error 0건 RC0, validator test **19/19 PASS**, renderer smoke **22/22 PASS**(원칙 문서만 추가라 로직 영향 없음 재확인).
- 제품/분석 경계 문구 유지(Skill-first·Source-bound·사람 검수·삼일 비공식·감사/인증/준수 대체 아님), public marketplace 등록 주장 없음.

## 6. 금지 작업 미수행 확인

- 기능 코드 수정 — 미수행. marketplace/manifest 수정 — 미수행. validator/renderer/schema 수정 — 미수행.
- submission.zip 생성 — 미수행. 샘플 실행 — 미수행. Codex app/CLI 설치 확인 수행 — 미수행(사용자 직접 항목).
- Hook/MCP 추가 — 미수행. 외부 패키지 추가 — 미수행.

## 7. 남은 보류사항

- 사용자 직접 Codex app/CLI 설치 검증(evidence) — 사용자 수행 대기.
- 실제 submission.zip 생성·샘플 실행·로그 원본 제출 방식 확정 — 제출/샘플 단계.

## 8. GitHub push 상태

- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- commit message: `docs: lock agent operating principles`
- 최종 commit SHA는 본 문서에 고정하지 않고 최종 응답에만 기재.

## 9. ChatGPT 확인 대기

- 다음 단계 결정은 ChatGPT가 repo 문서를 확인한 뒤 수행한다.
