# 운영 원칙 (Operating Principles)

> **성격**: 이 문서는 에이전트 간 **역할 구분과 보고 방식을 고정**한다(기능 구현 아님). 요약·진입은 repo 루트 `AGENTS.md`.
> 모든 Claude Code 작업/Codex 리뷰는 **시작 전 `AGENTS.md`와 이 문서를 먼저 읽는다.**

## 1. 왜 이 문서가 필요한가

프로젝트가 여러 Cycle을 거치며 에이전트 간 역할 구분과 보고 방식이 흐려질 수 있다. 작업 수행자(Claude Code)가 최종 판정을
내리거나, 검증자(Codex)가 구현에 손대거나, 장문 보고가 채팅에 쌓여 추적성이 떨어지는 것을 방지하기 위해 운영 원칙을 repo에 고정한다.

## 2. 역할별 상세

### 2.1 Claude Code — 작업 수행자
- 문서/코드 수정을 수행한다.
- 완료 보고는 **repo 문서**(`docs/<cycle>_..._completion_report.md`)로 작성한다.
- 채팅 보고는 **경로·commit SHA·push 여부**만 짧게 적는다(장문 금지).
- 자체 Preflight 점검을 하되 **PASS/FAIL 판정을 하지 않는다**(최종 판정은 Codex).
- 지시서의 "하지 말 것"과 제품/분석 경계를 준수한다.

### 2.2 Codex — 독립 검증자
- **PASS / CONDITIONAL PASS / FAIL** 판정을 내린다.
- repo diff와 문서 정합성을 검토한다. 프롬프트의 핵심 질문은 **최소 기준**이며 **자율 탐색이 필수**다.
- 리뷰/검증 보고는 **반드시 `docs/reviews/`** 문서로 남긴다(형식: `docs/reviews/REVIEW_REPORT_TEMPLATE.md`).
- 채팅 보고는 **리뷰 문서 경로·Verdict·Readiness·Critical/Major/Minor 요약·commit SHA·push 여부**만 적는다.
  **장문 검증 내용은 채팅이 아니라 repo 문서에 기록한다.**
- 구현·산출물 수정은 하지 않는다(검증자 경계).

### 2.3 ChatGPT — 작업 분기 판단
- GitHub 문서(README·docs·완료 보고·리뷰·commit 상태)를 확인한 뒤 **다음 단계와 다음 프롬프트를 결정**한다.
- Claude Code/Codex 프롬프트를 작성한다.
- **직접 구현자·최종 검증자 역할이 아니다.**

### 2.4 User — 외부 상태 검증·최종 판단
- **외부 앱/CLI 상태 변경이 필요한 검증**을 직접 수행한다. 특히 **Codex app/CLI plugin 탐색·설치·활성화·사용 확인**.
- **최종 제출 판단**을 수행한다.

## 3. 운영 원칙 (고정)

1. 모든 실질 작업 Cycle은 원칙적으로 **Claude Code 작업 → Codex 독립 리뷰** 순서로 진행한다.
2. Claude Code는 자체 점검을 할 수 있지만 **PASS/FAIL 판정은 하지 않는다.**
3. Codex는 독립 검증자이며, 리뷰 문서는 **반드시 `docs/reviews/`**에 남긴다.
4. Claude Code와 Codex 모두 **장문 완료/검증 보고를 채팅에 쓰지 않는다**(상세는 repo 문서).
5. ChatGPT는 repo 문서를 확인한 뒤 **다음 분기와 다음 프롬프트를 결정**한다.
6. **외부 앱/CLI 상태를 바꾸는 작업은 사용자가 직접 수행한다.**
7. **Codex app/CLI plugin install/enable 확인은 사용자 직접 검증 항목**이다(`docs/codex_install_verification.md`).
8. 이후 **모든 Claude/Codex 프롬프트에는 먼저 `AGENTS.md`와 `docs/operating_principles.md`를 읽으라는 지시를 포함**한다.

## 4. 보고 방식 요약

| 주체 | repo 문서 | 채팅 보고(짧게) |
|---|---|---|
| Claude Code | `docs/<cycle>_..._completion_report.md` | 문서 경로 · commit SHA · push 여부 |
| Codex | `docs/reviews/codex_<cycle>_<scope>_review.md` | 리뷰 문서 경로 · Verdict · Readiness · Critical/Major/Minor 요약 · commit SHA · push 여부 |

## 5. 항상 유지하는 경계 (모든 주체)

- **Skill-first**: 사용자 진입점은 Skill 하나. validator(detect-only)·renderer(no re-judgment)는 내부 구성요소. Python CLI 회귀 금지.
- **Source-bound Analysis**: 입력 자료 근거만 사용, 외부 지식 보강 금지. 확인 불가를 미공시로 단정하지 않는다.
- **사람 검수 경계**: 산출물은 초안이며 최종 판단은 컨설턴트. 상충·해석 필요는 사람 검토로.
- **제품 경계**: 삼일회계법인 공식 제품·내부 도구가 아니며 감사·인증·준수 판단을 대체하지 않는다.
- **로컬/Repo marketplace ≠ Public Plugin Directory**: 공개 등록·공개 배포를 주장하지 않는다.

## 6. 이 문서의 성격

- 이 문서는 **운영 원칙 고정**이며 특정 Cycle에 종속되지 않는다.
- 원칙 변경이 필요하면 `docs/decision_log.md`에 결정으로 기록한 뒤 이 문서와 `AGENTS.md`를 함께 갱신한다.
