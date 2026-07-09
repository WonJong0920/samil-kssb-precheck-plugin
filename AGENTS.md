# AGENTS.md — 에이전트 운영 원칙 (Operating Principles Lock)

> **이 파일과 `docs/operating_principles.md`를 모든 작업/리뷰 시작 전에 먼저 읽는다.**
> 이후 모든 Claude Code 작업 프롬프트·Codex 리뷰 프롬프트는 "먼저 `AGENTS.md`와 `docs/operating_principles.md`를
> 읽으라"는 지시를 포함한다. 이 문서는 기능 구현이 아니라 **에이전트 간 역할 구분과 보고 방식을 고정**한다.

## 역할 구분 (한눈에)

| 주체 | 역할 | 하는 것 | 하지 않는 것 |
|---|---|---|---|
| **Claude Code** | 작업 수행자 | 문서/코드 수정, 자체 Preflight 점검, 완료 보고를 **repo 문서**로 작성 | PASS/FAIL 판정, 장문 채팅 보고 |
| **Codex** | 독립 검증자 | repo diff·문서 정합성 검토, **PASS / CONDITIONAL PASS / FAIL** 판정, 리뷰를 **`docs/reviews/`** 문서로 작성 | 구현·산출물 수정, 장문 채팅 검증 |
| **ChatGPT** | 작업 분기 판단 | GitHub 문서 확인 후 다음 단계 결정, Claude/Codex 프롬프트 작성 | 직접 구현, 최종 검증 판정 |
| **User** | 외부 상태 검증·최종 판단 | 외부 앱/CLI 상태 변경 검증(예: Codex app/CLI 설치 확인), 최종 제출 판단 | — |

## 핵심 운영 원칙

1. 모든 실질 작업 Cycle은 원칙적으로 **Claude Code 작업 → Codex 독립 리뷰** 순서로 진행한다.
2. **Claude Code**는 자체 점검(Preflight)을 하되 **PASS/FAIL 판정을 하지 않는다.** 완료 보고는 repo 문서로 남기고,
   채팅 보고는 **문서 경로·commit SHA·push 여부**만 짧게 적는다.
3. **Codex**는 독립 검증자다. 핵심 질문은 최소 기준이며 **자율 탐색 필수**. 리뷰 문서는 반드시 **`docs/reviews/`**에 남긴다.
   채팅 보고는 **리뷰 문서 경로·Verdict·Readiness·Critical/Major/Minor 요약·commit SHA·push 여부**만 적고, 장문 검증 내용은 repo 문서에 기록한다.
4. **Claude Code와 Codex 모두 장문 완료/검증 보고를 채팅에 쓰지 않는다.** 상세는 repo 문서에 남긴다.
5. **ChatGPT**는 repo 문서를 확인한 뒤 다음 분기와 다음 프롬프트를 결정한다(직접 구현자·최종 검증자 아님).
6. **외부 앱/CLI 상태를 바꾸는 작업은 사용자가 직접 수행한다.** 특히 **Codex app/CLI plugin install/enable 확인은 사용자 직접 검증 항목**이다
   (절차: `docs/codex_install_verification.md`, 기록: `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`).
7. 이후 모든 Claude/Codex 프롬프트에는 **먼저 `AGENTS.md`와 `docs/operating_principles.md`를 읽으라**는 지시를 포함한다.
8. ChatGPT는 다음 작업 프롬프트를 쓰기 전 **GitHub의 현재 repo 상태와 `docs/chatgpt_coordination_workflow.md`를 직접 확인**한다.
9. 프롬프트의 **필수 source-of-truth 문서는 최소화**한다. `AGENTS.md`·`docs/operating_principles.md`와 해당 작업에 직접 필요한 문서만 필수로 지정하고, 나머지 문서는 에이전트가 필요시 자율 탐색하게 한다.
10. Claude Code 실행 프롬프트와 Codex 리뷰 프롬프트는 **세부 체크리스트가 아니라 목표·경계·산출물·검증 기준 중심**으로 작성한다. 구현·실행·리뷰 과정의 자율 판단 범위를 보장한다.
11. 리뷰는 기계적 체크리스트 수행이 아니라 **독립적 repo/diff 검토**다. Codex가 필요한 추가 파일을 자율적으로 탐색하고, 상세 판단은 repo 리뷰 문서로 남긴다.

## 항상 유지하는 제품/분석 경계

- Skill-first 구조 유지(사용자 진입점은 Skill 하나, validator·renderer는 내부 구성요소, Python CLI 회귀 금지).
- Source-bound Analysis 원칙, 사람 검수 경계 유지.
- 삼일회계법인 공식 제품·내부 도구가 아니며 감사·인증·준수 판단을 대체하지 않는다는 경계 유지.

상세는 `docs/operating_principles.md` 참조.