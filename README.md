# Samil KSSB Precheck Plugin

> **컨설턴트 검수용 KSSB 공시근거 사전검토 보고서 생성 플러그인 (Codex-native Skill)**

## 고지

> 본 플러그인은 AX 해커톤 제출을 위해 삼일회계법인의 공개 ESG·지속가능성 공시 자문 맥락을 바탕으로 설계한
> Codex 플러그인입니다. 삼일회계법인의 공식 제품 또는 내부 도구가 아니며, 감사·인증·준수 판단을 대체하지 않습니다.
> 컨설턴트 검수용 사전검토 보조 도구입니다.

## AX 해커톤 제출 맥락

- 본 산출물은 **AX 해커톤 제출물**이다.
- 실제 컨설팅에서는 고객 제공자료를 입력으로 사용하며, 해커톤 검증에서는 **공개자료를 대체 입력**으로 사용한다.

## 문제 정의

ESG·지속가능성 공시 컨설팅의 초기 단계에서, 컨설턴트는 고객이 제공한 지속가능경영보고서·사업보고서·증빙을
KSSB 공시요구와 일일이 대조해 "근거가 확인되는 항목 / 부족한 항목 / 제공자료로는 확인 불가한 항목"을 가르는
반복 작업을 한다. 일반 챗봇에 "분석해줘"라고 하면 근거 추적이 끊기고, 확인 불가 항목을 그럴듯하게 확정해버리며,
같은 입력에도 결과가 달라져 검수가 어렵다.

## 사용자 · 사용 상황

- **사용자**: 삼일회계법인 등 ESG·지속가능성 공시 컨설팅 조직의 컨설턴트.
- **사용 상황**: 고객사 KSSB 공시 컨설팅 착수 시, 제공 자료를 KSSB 4대 영역 공시요구와 대조해
  근거·부족분·고객 확인 질문을 정리해야 할 때.

## 플러그인이 해결하는 문제

고객 제공자료(또는 해커톤 공개자료)만을 근거로, KSSB 요구사항별 **확인 근거 · 부족한 정보 · 추가 확인 질문 ·
요청자료 · 보완 권고**를 구조화하여 **컨설턴트 검수용 KSSB 공시근거 사전검토 보고서 초안**을 생성한다.

## 단순 AI 분석과의 차이

- **근거 추적**: 모든 "근거 확인" 판정이 원문 인용·위치 단서에 연결된다(근거 없는 확정 방지).
- **확인 불가의 정직한 처리**: 근거가 없으면 확정하지 않고 "확인 불가 → 고객 확인 질문"으로 전환한다(환각 억제).
- **반복 가능한 절차**: 자유 프롬프트가 아니라 고정된 업무 절차(카탈로그·판정 스키마·질문 규칙)를 따른다.
- **제품 경계 준수**: 감사·인증·준수 확정 표현을 금지하고 컨설턴트 검수를 전제한다.

## 작동 방식

1. 입력 자료(고객 제공자료 또는 공개자료)를 근거로 KSSB **4대 영역**(거버넌스·전략·위험관리·지표 및 목표)
   공시요구 항목을 점검한다.
2. 각 항목에 대해 원문 근거를 찾아 **판정 라벨**을 부여한다(근거 확인 / 일부 근거 확인, 보완 필요 /
   확인 불가 / 상충 또는 해석 필요 / 검토 범위 외).
3. 확인 불가·부족·상충 항목은 **고객 확인 질문·요청자료·후속조치**로 전환한다.
4. 결과를 **컨설턴트 검수용 사전검토 보고서 초안**으로 구조화한다.

상세 절차: [src/skills/samil-kssb-precheck/SKILL.md](src/skills/samil-kssb-precheck/SKILL.md)

## 산출물 정책

- 기본 목표: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`
- DOCX 제한 시 fallback: `<보고서명>_KSSB_공시근거_사전검토보고서.html`
- 기본 사용자 흐름에서는 대표 문서 1개를 산출물로 한다. JSON/CSV/manifest/`_검토근거` 폴더는 기본 산출물이 아니다
  (향후 개발/검증/debug mode 내부용 가능성만 열어둔다).

## 제품 경계

- 감사·인증·준수 판단을 **대체하지 않는다.** 산출물은 **초안**이며 컨설턴트 검수를 전제로 한다.
- 확인 불가 항목을 미공시로 단정하지 않는다.
- 삼일회계법인의 공식 제품·내부 도구가 아니다.
- "근거 확인"은 자료에 근거가 존재함을 뜻할 뿐, KSSB 준수 확정·감사의견·인증이 아니다.

## 저장소 구조

```
Samil KSSB Precheck Plugin/
├── src/
│   ├── .codex-plugin/plugin.json          # Codex 플러그인 매니페스트 (plugin root = src/)
│   ├── skills/samil-kssb-precheck/         # Skill 본체 + 보조 문서
│   └── reference/python_engine/README.md   # 기존 Python 엔진 참고(코드 미포함)
├── docs/                                    # 설계·검증·현황·의사결정·완료보고
├── logs/.gitkeep
└── README.md
```

주요 문서: [docs/product_definition.md](docs/product_definition.md) ·
[docs/scope.md](docs/scope.md) · [docs/architecture.md](docs/architecture.md) ·
[docs/validation_criteria.md](docs/validation_criteria.md) ·
[docs/reference_review.md](docs/reference_review.md) ·
[docs/cycle1_completion_report.md](docs/cycle1_completion_report.md)

## Cycle 1 현재 상태

- 해커톤 제출 구조의 Codex 플러그인 **1차 골격**을 생성했다(Skill-first).
- KSSB 4대 영역 MVP의 사전검토 구조·판정 체계·근거 매핑·질문 생성 원칙을 문서로 고정했다.
- 실제 DOCX/HTML 생성 코드, Hook/MCP, 샘플 고객사 선정은 이번 사이클에 포함하지 않았다.
- 상세: [docs/current_status.md](docs/current_status.md)

## ChatGPT 확인 대기 상태

- 본 Cycle 1은 GitHub push 후 **ChatGPT 확인 대기 상태**로 종료된다.
- 다음 단계 판단은 ChatGPT가 GitHub의 README·docs·src 구조·완료 보고서·commit 상태를 직접 확인한 뒤 수행한다.
- 최종 검증과 PASS/FAIL 판정은 **Codex**가 수행한다.
