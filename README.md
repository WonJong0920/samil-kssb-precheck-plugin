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

## 검증 실적 (실측 evidence — 주장 아닌 기록)

실제 공개 자료로 end-to-end 실행하고, 산출물의 인용을 **원문과 직접 대조**해 기록으로 남겼다.

- **실보고서 완주**: 실제 공개 지속가능경영보고서(126페이지 PDF, 2024년판)를 입력으로 Codex 실사용 환경에서
  findings 생성 → preflight(오류 0) → 대표 DOCX 보고서까지 완주
  (`docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`).
- **인용 실재성 원문 대조**: 산출 보고서의 개별 인용 18건을 입력 PDF 전문과 대조 — **17건이 주장한 페이지에서
  원문 그대로 재발견(페이지 정확도 100%)**. 예외 1건은 표의 셀을 가로지른 비연속 인용으로 식별해
  인용 선택 지침으로 보강했다(`docs/planning/usertest_output_quality_review_2026-07-09.md`).
- **환각 인용 차단 실동작**: 실행 중 source-bound 재검 규율이 다단 편집 추출 불일치 인용 **3건을 실제로 걸러내고
  수정**하게 했다(실사용 로그 기반 evidence).
- **결정성**: 동일 findings에서 보고서 재생성 시 **byte-identical**(로컬 스모크 2회 실측 + 테스트).
- **안전 중단**: 검증 오류가 있으면 보고서를 만들지 않고 통제된 중단(문서화된 종료 코드) — 오류 상태의
  그럴듯한 보고서가 나가지 않는다.
- **테스트**: Node 내장 테스트 **365건 green**, 외부 의존성 0(package.json/node_modules 없음).

> 위 수치는 전부 repo 문서에 기록된 실측이며, 제품 완성·감사/인증 수준 보증을 의미하지 않는다(컨설턴트 검수 전제).

## 데모 (5분 재현)

공개 보고서 1건으로 보고서 초안까지 재현하는 절차: [docs/submission_demo_scenario.md](docs/submission_demo_scenario.md)

## 작동 방식 (워크플로우)

사용자-facing 진입점은 **Skill 하나**다. 스킬 절차가 아래 내부 단계를 잇는다(사용자는 Python·PATH·CLI를 의식하지 않는다).

1. **findings 생성 (Skill = 판단 엔진)**: 입력 자료(고객 제공자료 또는 공개자료)를 근거로 KSSB **4대 영역**
   (거버넌스·전략·위험관리·지표 및 목표) 공시요구 항목별 **판정 라벨**(근거 확인 / 일부 근거 확인, 보완 필요 /
   확인 불가 / 상충 또는 해석 필요 / 검토 범위 외)·근거 앵커·부족정보·**고객 확인 질문·요청자료·후속조치**·권고를
   source-bound **구조화 findings**로 만든다.
2. **preflight 검증 (Validator = detect-only 게이트)**: 검증기가 findings를 **재판정 없이** 점검한다
   (구조 필수 필드·근거 참조·모드↔라벨 정합·source-bound 규칙·금지 표현·내부 경로). findings를 고치지 않고 감지·보고만 한다.
3. **렌더/전달 (Renderer + Delivery = 형식 변환 + 전달)**: 동일 findings를 **재판정 없이** 대표
   **DOCX → HTML → Markdown**으로 결정적 변환한다(preflight 오류가 있으면 **보고서를 만들지 않고 안전하게 중단**).
4. **사람 검수**: 산출물은 **초안**이며 컨설턴트가 검수·수정·확정한다.

검증기·렌더러는 스킬 워크플로우의 **내부 구성요소**다(사용자-facing CLI가 아니다).
**실행 런타임은 Node 구현(`.cjs`)**이며, Python 구현(`.py`)은 제거하지 않고 **동작 대조용 참조 기준**으로 함께 유지한다.

상세 절차: [src/skills/samil-kssb-precheck/SKILL.md](src/skills/samil-kssb-precheck/SKILL.md) ·
흐름/사용 계약: [docs/workflow_usage.md](docs/workflow_usage.md)

## 데모 흐름 (예시 `kssb_findings_example.json` 기준)

> 사용자 진입점은 **Skill 하나**다. 아래는 공개 예시 findings([src/schemas/kssb_findings_example.json](src/schemas/kssb_findings_example.json)
> — 가상 공개 보고서)를 입력으로 했을 때의 end-to-end 흐름이다. 내부 검증기·렌더러는 Skill이 부르는
> 구성요소이며 **사용자가 CLI를 직접 실행하지 않는다**.

1. **Skill 호출 + 자료 입력** — 사용자가 Skill `samil-kssb-precheck`를 호출하고 검토 대상 자료(예: 공개
   지속가능경영 보고서)를 제공한다. 스캔/혼합 PDF·HWP/HWPX는 **승인 기반 선택 경로**로 구조 판독·OCR 보강이
   가능하며, 거부해도 기본 검토는 계속된다.
2. **findings 생성 (Skill = 판단 엔진)** — KSSB **4대 영역**(거버넌스·전략·위험관리·지표 및 목표) 항목별로
   source-bound 구조화 findings를 만든다. 예시에서는 **출처 자료 2건 · 항목 5건**, 판정 라벨 **5종이 각 1건**
   (공개자료상 근거 확인 / 일부 근거 확인, 보완 필요 / 공개자료로 확인 불가 / 상충 또는 해석 필요 / 검토 범위 외)으로 나온다.
3. **preflight 검증 (detect-only 게이트)** — 검증기가 findings를 **재판정 없이** 점검한다(구조·근거 참조·
   모드↔라벨 정합·금지 표현·내부 경로). 예시는 **오류 0건** → 다음 단계로. 오류가 있으면 **보고서를 만들지
   않고 안전하게 중단**하며 "보완 후 재생성" 안내로 종료한다.
4. **대표 문서 생성 (형식 변환)** — 동일 findings에서 **DOCX → HTML → Markdown**을 결정적으로 파생한다.
   대표 문서 1개(`<보고서명>_KSSB_공시근거_사전검토보고서.docx`) + HTML/Markdown fallback.
5. **사용자-facing 요약** — 대표 문서 파일명·형식·preflight 건수·**고객 확인 질문 4건(요청자료·후속조치 포함)**·
   사람 검수 고지를 담은 안전 요약을 돌려준다(로컬 절대경로·내부 로그·validator raw 출력 미노출).
6. **사람 검수** — 산출물은 **초안**이다. 컨설턴트가 근거·판정을 검수·수정·확정하며, 확인 불가·상충 항목은
   사람 판단으로 마무리한다.

**경계**: 이 흐름의 산출물은 컨설턴트 검수용 **초안**이며 **감사·인증·준수 판단을 대체하지 않는다.**
확인 불가 항목을 미공시로 단정하지 않는다. (문서 유형별 기대 동작·승인 지점은 아래 Quickstart 참조.)

## 사용자 Quickstart · 지원 문서 유형 · 검증 시나리오

처음 사용하는 사용자/심사자는 **[사용자 Quickstart 문서](docs/user_quickstart_pre_2n_5.md)** 한 장으로
다음을 파악할 수 있다: 파일 유형별(텍스트 PDF·혼합 PDF·스캔 PDF·DOCX·HWPX·HWP·미지원) 기대 동작과 fallback,
어떤 단계에서 사용자 승인이 필요한지(로컬 판독 도구·**승인 기반 Node 대체 실행 경로**), 거부/실패 시 무엇이
남는지, 산출물 기대치(DOCX 우선·컨설턴트 검수 초안), 블랙박스 검증 시나리오 체크리스트(12건).

요약 3줄:
- **텍스트로 읽히는 자료는 기본 경로**로 바로 보고서 초안을 만든다(승인 불필요). PDF는 승인 시
  **구조 보강 판독(선택·권장)**으로 표·섹션·페이지 위치 신호를 더해 근거 표시 품질을 높일 수 있다.
- **HWP/HWPX/DOCX 구조 판독과 스캔/혼합 PDF의 문자 인식(OCR)은 승인 기반 선택 경로**다 — 도구는 저장소
  밖에 설치되고, 문서 분석 실행은 네트워크 차단(no-egress) 훅 아래에서 수행되며(실행 기록 기반의
  프로세스 수준 검증), 거부해도 기본 검토는 계속된다.
- **core 플러그인은 OCR을 자동 실행하지 않는다** — OCR은 승인 기반 로컬 보조 실행의 **최소 경로**
  (문서의 '판독 필요' 페이지만·페이지 상한/제한시간 내)이며, 결과는 검수용 보조 재료로만 쓰인다.
  이미지·차트의 의미 해석은 지원하지 않는다.

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

## 설계 선택과 근거

- **왜 스킬(Skill) 하나로 설계했나** — 사용자가 Python·PATH·CLI 실행을 의식하지 않고 **스킬 하나만 호출**하면
  되도록 하기 위해서다. 검증기·렌더러는 스킬이 내부적으로 부르는 구성요소이며, 사용자 진입점은 스킬이다.
- **왜 Python이 아니라 Node를 실행 런타임으로 택했나** — 파이썬이 설치되지 않은 사용자 환경에서도 대표 문서
  생성까지 **하나의 런타임(Node)으로 완결**되게 하기 위해서다. 승인 기반 보조 판독 도구도 Node로 동작해
  런타임을 하나로 모을 수 있었다. Python 구현은 제거하지 않고 **동작 대조용 참조 기준**으로 함께 유지한다.
- **왜 일부 보조 기능은 구현하지 않았나**(예: 문서 구조 교차 신호의 자동 생성) — 그 기능은 보고서 생성의
  필수 조건이 아니라 **2차 검수 보조 신호**이고, 표준 라이브러리에 XML 파서가 없는 Node에서 파서를 새로
  만들면 **잘못된 신호(오탐)·재현성 리스크**가 커진다. 그래서 이 생성 기능은 **의도적 한계**로 두었고(이미
  만들어진 신호의 소비는 Node에서 가능), 없어도 핵심 보고서는 정상 산출된다.
- **왜 Hook·MCP 자동 배선을 넣지 않았나** — 이 파이프라인은 **선형·결정적·단일 호출자** 구조라, 실행
  확장점(hook)이나 외부 연결 계층(MCP)은 재현성·검증·유지 비용만 늘린다. 확장은 데이터 계약·모듈 경계·
  문서상 사용 계약으로 처리하며, 자동 배선은 **명확한 요건이 확정될 때만 재검토**한다.

## 저장소 구조

```
Samil KSSB Precheck Plugin/
├── .agents/plugins/marketplace.json        # 로컬/Repo marketplace 정의 (source.path = ./src)
├── src/
│   ├── .codex-plugin/plugin.json          # Codex 플러그인 매니페스트 (plugin root = src/)
│   ├── skills/samil-kssb-precheck/         # Skill 본체 + 보조 문서 (사용자-facing 진입점)
│   ├── schemas/                            # findings 데이터 계약(JSON Schema) + 예시
│   ├── validators/                         # 내부: findings detect-only preflight 검증기(런타임 Node .cjs + Python reference)
│   ├── renderers/                          # 내부: findings → DOCX/HTML/Markdown 형식 변환기(런타임 Node .cjs + Python reference)
│   ├── intake/                             # 선택적(opt-in) 인테이크·ingest 경계 — core·Skill entrypoint 아님
│   │                                       #   (DEI 정규화 + 승인 기반 보조 runner: HWP/HWPX/DOCX·PDF 구조 판독,
│   │                                       #    스캔/혼합 PDF의 '판독 필요' 페이지 대상 OCR — core는 OCR을 자동 실행하지 않음)
│   └── reference/python_engine/README.md   # 기존 Python 엔진 참고(코드 미포함)
├── tests/                                   # Node 런타임 스위트(.test.cjs) + Python reference 점검
├── docs/                                    # 설계·검증·현황·의사결정·완료보고·workflow_usage
├── logs/.gitkeep
└── README.md
```

주요 문서: [docs/product_definition.md](docs/product_definition.md) ·
[docs/scope.md](docs/scope.md) · [docs/architecture.md](docs/architecture.md) ·
[docs/validation_criteria.md](docs/validation_criteria.md) ·
[docs/reference_review.md](docs/reference_review.md) ·
[docs/cycle1_completion_report.md](docs/cycle1_completion_report.md)

## 현재 구현 상태

Skill-first 구조를 유지하며, findings 데이터 계약과 내부 워크플로우 구성요소를 구현했다.

- **findings 데이터 계약**: `src/schemas/kssb_findings.schema.json`(JSON Schema draft-07, 외부 의존 0) + 계약 문서 `docs/findings_schema_contract.md`.
- **검증기(내부, detect-only)**: **실행 런타임 Node `src/validators/kssb_findings_validator.cjs`**
  (Python `.py`는 동작 대조용 참조 기준) — findings를 재판정 없이 preflight 점검하고, 오류가 있으면 보고서를
  만들지 않고 안전하게 중단한다.
- **렌더러/전달(내부, 형식 변환 + 전달)**: **실행 런타임 Node `src/renderers/kssb_report_delivery.cjs` →
  `kssb_report_renderer.cjs`**(Python `.py`는 참조 기준) — findings를 재판정 없이 **DOCX → HTML → Markdown**으로
  결정적 변환한다. 핵심 파이프라인(검증·전달·DOCX/HTML/Markdown 렌더)의 Node 구현을 완료했다(독립 리뷰 통과).
- **재사용 점검**: `tests/`(Node 런타임 스위트 + Python reference 점검). 새 외부 의존성 없음(repo에 package.json/node_modules 없음).
- **선택적 인테이크/보조 판독 경로**(`src/intake/`): 이미 추출된 문서 산출물을 근거 재료로 정규화하는 ingest 경계
  (구현+리뷰 완료, 문서 수준 변형 계약 포함) + **승인 기반** 보조 판독 도구 — HWP/HWPX/DOCX 구조 판독
  (Python/Node, 네트워크 차단 훅 아래), 텍스트/혼합 PDF 구조 보강 판독, 스캔/혼합 PDF의 문자 인식(OCR —
  '판독 필요' 페이지만·페이지 상한/제한시간, 결과는 검수용 보조 재료 전용), 승인 기반 Node 대체 실행 경로.
  판독 도구 최종 확정·스킬 자동 통합·OCR 실행 한도의 실 스캔 실측 보정은 이후 과제로 남겨 둔다.
- **미포함(현재)**: **무승인 자동 OCR**(core는 OCR을 자동 실행하지 않음 — 승인 기반 최소 경로만 존재),
  이미지·차트의 의미 해석, Hook·MCP 자동 배선, 제출 패키지(zip).
- 흐름/사용 계약: [docs/workflow_usage.md](docs/workflow_usage.md) · 사용자 요약: [Quickstart](docs/user_quickstart_pre_2n_5.md) · 상세: [docs/current_status.md](docs/current_status.md)

## 검증 / 확인 대기

- 각 사이클은 GitHub push 후 **ChatGPT 확인 대기 상태**로 종료된다.
- 최종 검증과 PASS/FAIL 판정은 **Codex**가 수행한다.
