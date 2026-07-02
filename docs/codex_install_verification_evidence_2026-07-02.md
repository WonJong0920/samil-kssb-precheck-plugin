# Codex Install Verification Evidence — 2026-07-02

## 1. Evidence Overview

- **문서 목적**: 사용자가 직접 수행한 Codex CLI plugin discovery 및 새 thread smoke test 결과를 repo evidence로 기록한다.
- **사용자 직접 검증**: 아래 discovery·smoke 결과는 **사용자가 직접 Codex CLI에서 수행·보고한 것**이다.
- **Claude Code 미수행 명시**: Claude Code는 실제 Codex app/CLI install/enable/marketplace add 등 **상태 변경을 수행하지 않았다.**
  이 문서는 사용자 보고 내용을 evidence로 정리한 것이며, PASS/FAIL 판정은 하지 않는다(독립 검증은 이후 Codex Review).

## 2. Verification Scope

**포함**
- Codex CLI plugin discovery(사용자 직접 확인).
- 새 thread smoke test(plugin 사용 방식 설명 요청).
- 실제 기업 분석 없음.
- plugin 사용 방식 설명 검증(입력자료·검토 방식·보고서 구조·경계).

**제외**
- 실제 고객자료 기반 end-to-end 분석 — 미수행.
- 실제 보고서 생성 품질 검증 — 미수행.
- app GUI 표시 검증 — **미기록/미수행**(이번 evidence는 CLI discovery 기준).
- 공식 제출용 submission.zip 생성 — 미수행.
- 감사·인증·준수 판단 검증 — 범위 밖(대상 아님).

## 3. Plugin Identity

| 항목 | 값 |
|---|---|
| Display name | Samil KSSB Precheck Plugin |
| Machine name | samil-kssb-precheck |
| Marketplace display name | Samil KSSB Precheck Plugin — Local/Repo Marketplace |
| Manifest path | `src/.codex-plugin/plugin.json` |
| Skill path | `src/skills/samil-kssb-precheck/SKILL.md` |

## 4. CLI Discovery Evidence

- **확인 방식**: 사용자 직접 Codex CLI 확인.
- **결과**: 대상 plugin(**Samil KSSB Precheck Plugin** / `samil-kssb-precheck`)이 Codex CLI에서 **확인됨**(사용자 보고).
- **이전 plugin과의 구분**:
  - 이전: `local-kssb-plugins` / `kssb-evidence-gap-auditor`(이전 파이썬 기반 plugin).
  - 현재: **Samil KSSB Precheck Plugin** / `samil-kssb-precheck`(현재 대상 plugin).
- 로컬 절대경로·계정정보·토큰은 기록하지 않는다.
- 비고: app GUI 표시 확인은 이번 evidence에 포함되지 않았다(미수행/미기록).

## 5. Smoke Test Prompt (intent)

정확한 원문 프롬프트는 이 evidence에 고정하지 않고 **prompt intent**로 기록한다.

- **Prompt intent**: 실제 기업 분석은 요청하지 않고, **Samil KSSB Precheck Plugin 기준으로** KSSB evidence precheck에 필요한
  입력자료, 생성되는 보고서 구조, "감사·인증·준수 판단 대체 아님" 경계, "고객 제공자료 또는 공개 검증 가능 자료 기반" 원칙을
  **설명하게** 하는 것이었다.
- **명확화**: smoke prompt는 **특정 기업에 대한 실제 분석·판정을 요청하지 않았다.** 사용 방식 설명만 요청했다.

## 6. Smoke Test Output Summary

사용자가 제공한 smoke output 요지(실제 기업 분석 없이 사용 방식만 설명):

- **필요한 입력자료**:
  - 지속가능경영보고서, ESG 보고서, 사업보고서
  - 이사회/위원회 규정, 운영 정책, 내부 통제·감독 체계 자료
  - 기후·ESG 전략 문서, 위험관리 정책, 리스크 식별·평가 자료
  - 온실가스 배출량·에너지 사용량·목표/성과 데이터표
  - 산정 기준·산정 범위·기준연도·방법론 문서
  - 공개자료 검증 모드에서는 제3자가 확인 가능한 공개자료
- **KSSB 4대 영역**: 거버넌스 · 전략 · 위험관리 · 지표 및 목표.
- **근거 기반 검토 방식**:
  - 각 항목별 원문 근거·위치 단서·부족 정보·고객 확인 질문으로 연결.
  - 근거가 없다고 곧바로 미공시/미준수로 단정하지 않음.
  - 자료에 없는 내용은 추정으로 보강하지 않음(source-bound).
- **보고서 구조**: 표지 및 고지 → 검토 개요 → 상태 요약 → 영역별 항목 결과와 근거 → 고객 확인 질문 및 요청자료 → 보완 권고 → 한계와 사람 검수 안내.
- **고객 확인 질문 및 요청자료**: 근거 부족·확인 불가 항목을 고객 확인 질문과 요청자료로 전환.
- **보완 권고**: 컨설턴트 관점 보완 방향(확정·보증 표현 아님).
- **한계와 사람 검수 안내**: 산출물은 초안이며 컨설턴트 검수·수정·확정 전제.
- **감사·인증·준수 판단 대체 아님**: 감사·인증·준수 판단·적합 판정·제3자 검증을 대체하지 않음을 명시.
- **source-bound 원칙 / 추정 보강 금지**: 고객 제공자료 또는 공개 검증 가능 자료에 근거하며 일반 지식·추정으로 판정을 보강하지 않음.

## 7. Boundary Check (사용자 smoke output 기준)

- [x] 실제 기업 분석 수행 안 함.
- [x] 특정 기업에 대한 판단 없음.
- [x] 미공시/미준수 단정 없음.
- [x] 감사·인증·준수 판단 대체 주장 없음.
- [x] 컨설턴트 검수용 초안 경계 유지.
- [x] 고객 제공자료 또는 공개 검증 가능 자료 기반 원칙 유지.
- [x] 근거 부족 시 확인 질문/요청자료로 전환.
- [x] 사람 검수 필요성 유지.

> 이 체크리스트는 사용자 smoke output이 제품 경계·source-bound·human review 원칙을 유지했는지에 대한 **사실 기록**이며, 최종 판정이 아니다.

## 8. Current Evidence Status (사실 기록, 판정 아님)

- Codex CLI plugin discovery: **사용자 확인 완료**.
- New thread smoke test: **사용자 확인 완료**.
- App GUI verification: **미기록/미수행**.
- Install/enable detail: 사용자 확인 결과 범위 내에서만 기록(세부 install/enable 로그는 이 evidence에 별도 기록되지 않음).
- Real report end-to-end validation: **미수행 — 다음 단계**.

## 9. Remaining Work

- Codex evidence review(이 evidence 문서에 대한 독립 검증).
- 실제 보고서 기반 end-to-end 산출물 품질 검증.
- 산출물이 실무 검수 초안으로 사용 가능한 수준인지 별도 검증.
- 필요 시 sample evidence log / generated report / validation report 작성.
- submission.zip 생성은 아직 하지 않음.

## 10. Next Planned Cycle

- **Cycle 2I — Real Report Practical Output Validation**
  - 목표: 공개 검증 가능한 실제 ESG/지속가능경영보고서 또는 사용자가 제공한 **비민감 자료**를 입력으로 하여,
    Samil KSSB Precheck Plugin이 생성하는 KSSB 사전검토 산출물이 **실무 검수 초안으로 사용할 수 있는 수준**인지 평가한다.
  - 단, **실제 분석은 아직 수행하지 않으며** 다음 단계로만 기록한다.

## 11. Sensitive Information Handling

- 로컬 절대경로 기록 금지.
- 사용자 계정명 기록 금지.
- 토큰/API key 기록 금지.
- 기업 비공개자료 사용 시 원문 내용 무단 기록 금지.
- 공개자료 사용 시 출처·파일명은 기록하되, 저작권 있는 원문 장문 복붙 금지.
- (이 evidence에는 위 민감정보가 포함되지 않았다.)

## 12. ChatGPT 확인 대기

- 다음 판단은 ChatGPT/사용자가 GitHub 문서(이 evidence 포함)를 확인한 뒤 수행한다.
- 실제 보고서 기반 end-to-end 품질 검증(Cycle 2I)은 사용자/ChatGPT 확인 후 착수한다.
