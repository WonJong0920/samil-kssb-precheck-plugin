# ChatGPT Coordination Workflow

## 목적

이 문서는 ChatGPT가 본 프로젝트에서 다음 작업 프롬프트를 작성하기 전 따라야 할 고정 운영 절차를 정의한다.

목표는 다음과 같다.

- 작업 완료 보고만 보고 다음 프롬프트를 성급히 작성하지 않는다.
- GitHub에 push된 실제 변경 내용을 먼저 확인한다.
- Codex Review에서 추가 확인이 필요한 부분이 있는지 먼저 판단한다.
- 기존 계획 문서와 리뷰 문서를 source of truth로 삼는다.
- 프롬프트에 기존 문서 내용을 과도하게 복사하지 않는다.
- Claude Code와 Codex의 자율적 판단 범위를 보장한다.
- 사용자 최종 확인 전에는 다음 단계 실행이나 GitHub 반영을 하지 않는다.

---

## 기본 역할

### User

- 최종 의사결정자.
- 다음 단계 착수 여부를 승인한다.
- GitHub 반영 전 최종 확인을 한다.

### ChatGPT

- 작업 조율자.
- GitHub에 올라간 실제 변경을 확인한다.
- 변경 범위, blocker, minor, 다음 단계 가능 여부를 판단한다.
- 프롬프트는 사용자 확인 후 작성한다.
- 기존 문서 내용을 과도하게 재작성하거나 중복 지시하지 않는다.

### Claude Code

- 구현 또는 문서 작성 실행자.
- 지정된 source-of-truth 문서를 직접 읽고 판단한다.
- 필요한 경우 repo 구조를 read-only로 확인한다.
- 작업 결과를 문서와 commit으로 남긴다.

### Codex

- 독립 리뷰어.
- Claude Code 산출물을 검토한다.
- PASS / CONDITIONAL PASS / FAIL 및 Critical / Major / Minor finding을 기록한다.
- 추가 확인 필요 여부를 드러낸다.

---

## 고정 운영 절차

### 1. 작업 완료 보고 수신

Claude Code 또는 Codex가 작업 완료를 보고하면 ChatGPT는 바로 다음 프롬프트를 작성하지 않는다.

먼저 다음 정보를 확인한다.

- commit SHA
- push 여부
- 수정 문서 또는 코드 경로
- verdict
- critical / major / minor
- 다음 단계 가능 여부
- 보고 내용과 실제 GitHub 상태의 일치 여부

---

### 2. GitHub 실제 변경 확인

ChatGPT는 보고만 신뢰하지 않고 GitHub에서 직접 확인한다.

확인 항목:

- base commit과 target commit 비교
- 변경 파일 목록
- 변경 범위가 보고와 일치하는지
- 핵심 문서 내용
- Codex Review 원문
- current_status / decision_log 갱신 여부
- 비의도적 코드, dependency, artifact 변경 여부

필요하면 핵심 문서 일부를 fetch하여 실제 문구를 확인한다.

---

### 3. 확인 보고만 먼저 작성

GitHub 확인 후 ChatGPT는 다음 프롬프트를 바로 쓰지 않고 확인 보고만 작성한다.

확인 보고 형식:

```text
확인 결과:
- 변경 범위:
- 핵심 판단:
- blocker:
- minor:
- 다음 단계 후보:
- 프롬프트 작성 전 확인할 점:
```

사용자가 명시적으로 “진행”, “프롬프트 작성”, “이 방향으로” 등 승인하기 전에는 다음 프롬프트를 작성하지 않는다.

---

## Codex Review 처리 기준

Codex Review가 있는 경우 ChatGPT는 다음 기준으로 판단한다.

### Critical 있음

- 즉시 중단.
- 다음 작업 금지.
- 수정 후 Codex 재리뷰 필요.

### Major 있음

- 다음 작업 금지.
- 문서 또는 코드 보정 후 Codex 재리뷰 필요.

### CONDITIONAL PASS

- 조건 해소 전 다음 작업 금지.
- 조건 해소 후 필요 시 Codex 재리뷰 진행.

### PASS + Minor 있음

- Minor가 `Blocking: No`이고 Required fixes가 없으면 다음 작업 가능.
- 단, Minor는 다음 작업자가 Codex Review 원문을 직접 읽고 반영하게 한다.
- ChatGPT가 Minor를 과도하게 재해석하여 세부 체크리스트로 주입하지 않는다.

### PASS + Required fixes before next step 있음

- 해당 fix를 먼저 처리한다.
- 필요하면 재리뷰 후 다음 작업으로 넘어간다.

---

## 추가 확인 필요성 판단

Codex Review를 받았더라도, ChatGPT는 다음을 반드시 확인한다.

- “Required fixes before next step”이 있는가?
- Minor가 실제로 비차단인가?
- 다음 작업 전에 clarification review가 필요한가?
- 리뷰 원문과 현재 계획 문서가 충돌하지 않는가?
- 다음 프롬프트가 Codex finding을 과소반영하거나 과잉반영할 위험이 있는가?

추가 확인이 필요하면 다음 단계 프롬프트를 작성하지 않고, 먼저 보정 또는 재리뷰 프롬프트를 작성한다.

---

## 프롬프트 작성 원칙

프롬프트는 사용자 승인 후 작성한다.

작성 원칙:

- 기존 계획 문서와 리뷰 문서를 source of truth로 지정한다.
- Claude Code 또는 Codex가 원문을 직접 읽고 판단하게 한다.
- 기존 문서에 이미 있는 경계 조건을 길게 복사하지 않는다.
- 필요한 경우 “기존 계획 문서의 경계와 게이트를 적용하라”로 충분히 지시한다.
- 작업자가 판단할 수 있는 영역은 남긴다.
- 세부 체크리스트보다 목표, source-of-truth, 금지 범위, 산출물, 검증 기준을 중심으로 작성한다.
- 최종 보고는 문서 본문을 반복하지 않고 메타정보 중심으로 요구한다.

---

## 프롬프트에 넣지 말아야 할 것

다음은 특별히 필요한 경우가 아니면 피한다.

- 이미 계획 문서에 있는 긴 경계 조건 복사
- Codex Review minor를 ChatGPT가 임의로 재해석한 긴 체크리스트
- 작업자가 작성한 문서 본문을 채팅에 다시 길게 보고하게 하는 형식
- “무조건 이렇게 하라” 식의 과도한 구현 순서 고정
- source-of-truth 문서를 읽지 않아도 되는 수준의 중복 설명

---

## 권장 프롬프트 구조

```text
1. 운영 원칙 확인
2. HEAD 확인
3. 목표
4. 먼저 확인할 source-of-truth 문서
5. 작업자가 직접 판단해야 할 사항
6. 산출물
7. 이번 작업에서 하지 말 것
8. 검증
9. 짧은 최종 보고 형식
```

---

## 최종 보고 형식 원칙

작업 완료 후 채팅 보고는 짧게 한다.

상세 내용은 작성한 문서에 남기고, 채팅에는 다음 정도만 요구한다.

```text
작업 완료 및 push 완료.

문서:
- [작성/수정 경로]

핵심 판단:
- [1~3줄]

status:
- [PASS / 미종결 / blocker 여부]

다음 단계 가능 여부:
- [가능 / 조건부 가능 / 불가]

변경 범위:
- [docs only 여부]
- [코드/package/OCR/API 실행 여부]

commit SHA:
push 여부:

ChatGPT 확인 대기.
```

---

## GitHub 반영 원칙

ChatGPT가 문서를 작성하거나 수정할 때도 다음 절차를 따른다.

1. 먼저 초안을 사용자에게 보여준다.
2. 사용자가 최종 확인한다.
3. 그 후 GitHub에 반영한다.
4. 반영 후 commit SHA와 변경 범위를 보고한다.

사용자 최종 확인 전에는 GitHub에 push하지 않는다.

---

## 현재 적용 상태

이 workflow는 Cycle 2L 이후부터 적용한다.

특히 다음 상황에서 반드시 적용한다.

- Claude Code 작업 완료 후 다음 프롬프트 작성 전
- Codex Review 완료 후 다음 작업 착수 전
- Critical / Major / Conditional PASS / Minor finding 판단 시
- 기존 계획 문서를 기반으로 다음 실행 프롬프트를 작성할 때
- ChatGPT가 직접 GitHub 문서를 추가하거나 수정할 때

---

## 핵심 원칙 요약

```text
보고만 보고 판단하지 않는다.
GitHub에서 실제 변경을 확인한다.
Codex Review의 추가 확인 필요성을 먼저 판단한다.
사용자 확인 전 다음 프롬프트를 작성하지 않는다.
기존 문서를 source of truth로 삼는다.
프롬프트는 짧고 자율성을 보장한다.
최종 보고는 메타정보만 받는다.
사용자 최종 확인 전 GitHub에 반영하지 않는다.
```
