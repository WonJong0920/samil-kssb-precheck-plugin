---
name: samil-kssb-precheck
description: 고객 제공자료(또는 해커톤 검증용 공개자료)만을 근거로 KSSB 4대 영역(거버넌스·전략·위험관리·지표 및 목표) 공시요구별 확인 근거·부족 정보·추가 확인 질문·요청자료·보완 권고를 구조화하여 컨설턴트 검수용 KSSB 공시근거 사전검토 보고서 초안을 생성한다. 감사·인증·준수 확정 도구가 아니다.
---

# Samil KSSB Precheck (KSSB 공시근거 사전검토)

> **고지**: 본 스킬은 AX 해커톤 제출을 위해 삼일회계법인의 공개 ESG·지속가능성 공시 자문 맥락을 바탕으로 설계한 Codex 플러그인의 일부입니다. 삼일회계법인의 공식 제품 또는 내부 도구가 아니며, 감사·인증·준수 판단을 대체하지 않습니다. 컨설턴트 검수용 사전검토 보조 도구입니다.

## Purpose (무엇을 하는가)

ESG·지속가능성 공시 컨설팅의 **초기 단계**에서, 고객사가 제공한 보고서·증빙자료만을 근거로
KSSB 공시요구사항별 **확인 근거 / 부족한 정보 / 추가 확인 질문 / 요청자료 / 보완 권고**를 구조화하여
**컨설턴트 검수용 사전검토 보고서 초안**을 생성한다.

- 이 스킬은 자유 분석 프롬프트가 아니라 **반복 가능한 업무 절차**다. 동일 입력에 동일한 구조의 산출을 지향한다.
- 최종 판단(공시 적정성, 대응 방향, 고객 커뮤니케이션)은 항상 **컨설턴트가 수행**한다.

## When to use this skill (사용 상황)

- 삼일회계법인 등 ESG·지속가능성 공시 컨설팅 조직이 고객사의 KSSB 대응 초기 컨설팅에 착수할 때.
- 고객 제공 지속가능경영보고서·사업보고서·내부 증빙을 KSSB 공시요구와 빠르게 대조해
  "무엇이 근거로 확인되고, 무엇을 더 물어봐야 하는지"를 정리해야 할 때.
- 해커톤/데모 검증 상황에서는 고객 제공자료 대신 **공개자료**를 대체 입력으로 사용한다.

사용하지 않는 경우: 감사·인증·준수 의견 산출, 제3자 검증, 규제 신고서 확정.

## Inputs (입력)

- **실제 컨설팅 모드**: 고객사가 제공한 보고서/증빙(지속가능경영보고서, 사업보고서, 내부 정책·규정, 데이터표 등).
- **해커톤 공개자료 검증 모드**: 고객 제공자료를 공개자료(공시된 지속가능경영보고서 등)로 대체.
  - 이 경우 산출물의 근거 표기와 판정 라벨은 "공개자료" 기준으로 전환한다(아래 Judgment schema 참조).
- 입력은 텍스트로 읽을 수 있는 문서를 전제로 한다. 현재 범위에서는 **OCR 실행 코드를 포함하지 않는다.**
- (선택) 스캔·이미지가 섞인 문서의 경우, core 밖 선택적 인테이크 어댑터(`src/intake/`)가 이미 로컬에서 추출된 인테이크 산출물을
  **판독 필요·위치·품질 신호(DEI-candidate)**로 정규화해 제공할 수 있다. Skill은 이 신호를 근거 재료로만 읽어 판독 불가/저신뢰 구간을
  **기존 "확인 불가 → 질문" 경로**로 라우팅한다(스키마 변경 없음, `evidence_mapping_rules.md` §6).
- (선택, **L2 = partially implemented — repo-side ingest boundary는 implemented+reviewed(2L-5 closure), provider 실행·runner 통합·provider 최종 확정은 pending**)
  DEI-candidate에 `ocr_supplement`(사용자 로컬 out-of-band OCR 산출물의
  저신뢰 텍스트 — 출처·provenance 포함)나 `aux_structure`(HWPX/DOCX 구조 교차확인 신호)가 있으면, Skill은 이를 근거 재료/검수 신호로만
  사용한다 — **OCR 유래 인용은 출처 표기 + 보수적 매핑 필수**(§6). **plugin-side OCR 실행은 미구현이며**(실행은 사용자 로컬 out-of-band),
  도표/차트 구조 분류(L3)는 planned/미구현이다.

> 산출 흐름(워크플로우): 이 스킬은 최종 보고서를 직접 쓰지 않고, 먼저 **구조화 findings**(데이터 계약)를 만든 뒤
> ① 검증기가 findings를 **재판정 없이** preflight 점검(detect-only)하고 ② 렌더러가 findings를 **재판정 없이**
> 대표 문서(DOCX → HTML → Markdown)로 변환하며 ③ 전달 배선기가 로그와 분리된 **사용자-facing 요약**을 만든 다음 ④ 컨설턴트가 검수한다. findings 형식은
> `docs/findings_schema_contract.md` 및 스키마 `src/schemas/kssb_findings.schema.json`을 따른다.
> 검증기·렌더러·전달 배선기는 스킬 워크플로우가 사용하는 **내부 구성요소**이며, 아래 절차는 findings 내용을 근거로 구성하기 위한 지침이다.
> 전체 흐름은 아래 "Workflow" 절과 `docs/workflow_usage.md` 참조.

## Source-bound analysis rules (근거 기반 분석 원칙)

1. **고객 제공자료에 없는 내용은 근거로 사용하지 않는다.**
2. 해커톤 검증에서는 **공개자료를 고객 제공자료의 대체 입력**으로 사용한다.
3. 일반 지식, 업계 추정, 외부 검색 결과로 판정을 보강하지 않는다.
4. **직접 근거와 추론을 구분한다.** 추론은 근거로 승격하지 않는다.
5. 근거가 없으면 실제 모드에서는 **"제공자료로 확인 불가"**, 해커톤 공개자료 모드에서는 **"공개자료로 확인 불가"**로 표시한다.
6. 고객 확인 질문은 **부족한 근거와 연결**한다(근거 없는 곳에서 질문이 나온다).
7. **최종 판단은 컨설턴트가 수행한다.** 스킬은 초안·근거·질문을 구조화할 뿐 확정하지 않는다.

## KSSB 4-area MVP review flow (4대 영역 검토 절차)

Cycle 1 범위는 KSSB 4대 영역 MVP로 한정한다: **거버넌스 / 전략 / 위험관리 / 지표 및 목표**
(KSSB 제1호·제2호, ISSB IFRS S1·S2의 4개 축 구조에 정렬). 상세 항목은
`kssb_requirement_catalog.md` 참조.

각 공시요구 항목에 대해 다음 절차를 반복한다.

1. **요구사항 식별**: 카탈로그에서 해당 영역의 공시요구 항목을 가져온다.
2. **근거 탐색**: 입력 자료에서 그 요구를 뒷받침하는 서술/수치/표를 찾는다.
3. **근거 앵커링**: 찾은 근거는 원문 인용(quote) + 위치 단서(섹션/제목/표 식별자)와 함께 기록한다
   (`evidence_mapping_rules.md`).
4. **판정 부여**: 근거 상태에 따라 판정 라벨을 부여한다(`judgment_schema.md`).
5. **부족분·질문 생성**: 근거가 없거나 부분적이면, 부족한 정보를 명시하고
   고객 확인 질문·요청자료·후속조치를 생성한다(`customer_question_rules.md`).
6. **보완 권고**: 필요 시 컨설턴트 관점의 보완 권고를 덧붙인다(확정 표현 금지).
7. **findings 기록**: 위 결과를 항목별로 구조화 findings에 담는다. `judgment_code`별 필수 조건을 지킨다 —
   `evidence_confirmed`/`partial_evidence_needs_supplement`는 `evidence_anchors` ≥ 1,
   `not_verifiable`는 `missing_info` + `customer_questions` 연결,
   `conflict_or_interpretation_needed`는 `human_review_required` + 사유,
   `out_of_scope_or_not_applicable`는 적용 제외 사유(`missing_info`). 상세는 `docs/findings_schema_contract.md`.
8. **커버리지·검토 범위 기록**: 텍스트 미추출/판독 불가/미지원 구간이 있으면 그 사실을 **문서별 실제 수치로** `overall_limitations`에
   명시하고, 카탈로그 대비 실제 검토 항목 수도 1줄로 밝힌다(`evidence_mapping_rules.md` §7 — 커버리지 침묵 금지).

## Judgment schema (판정 스키마)

판정 라벨은 입력 모드에 따라 아래 중 하나의 세트를 사용한다. 상세 정의는 `judgment_schema.md`.

**실제 고객자료 모드**
- 제공자료상 근거 확인
- 일부 근거 확인, 보완 필요
- 제공자료로 확인 불가
- 상충 또는 해석 필요
- 검토 범위 외 또는 적용대상 아님

**해커톤 공개자료 검증 모드**
- 공개자료상 근거 확인
- 일부 근거 확인, 보완 필요
- 공개자료로 확인 불가
- 상충 또는 해석 필요
- 검토 범위 외 또는 적용대상 아님

> "준수", "적합", "인증", "감사 의견"처럼 보이는 판정명은 **절대 사용하지 않는다.**

## Evidence mapping rules (근거 매핑 규칙)

- "근거 확인" 계열 판정에는 **원문 인용(quote)과 위치 단서가 최소 1개 이상 필수**다. 근거 없는 "확인" 판정은 부여하지 않는다.
- 표/수치 근거는 정량 요구 항목에서만 정량 근거로 인정한다(예: 온실가스 배출량 수치를 에너지 사용량 근거로 전용하지 않는다).
- 키워드/표현 차이로 근거를 놓칠 수 있다 → **매칭 실패가 곧 "미공시" 확정이 아니다.** 확인 불가로 표시하고 질문으로 연결한다.
- 상세 규칙은 `evidence_mapping_rules.md`.

## Customer question generation rules (고객 확인 질문 생성 규칙)

- 질문은 **부족하거나 확인 불가한 근거에서만** 생성한다.
- 각 질문은 다음 필드를 갖춘다: 항목ID · 항목명 · 질문 · 질문사유 · 관련근거 · 우선순위 · 요청자료 · 후속조치.
- 상세 규칙은 `customer_question_rules.md`.

## Workflow (findings → 검증 → 렌더 → 사람 검수)

사용자-facing 진입점은 **이 스킬 하나**다. 스킬 절차가 아래 내부 단계를 잇는다. 사용자는 Python·PATH·CLI를 의식하지 않는다.

1. **findings 생성 (스킬 = 판단 엔진)**: 위 4대 영역 절차로 항목별 판정·근거 앵커·부족정보·고객 질문·권고를
   `judgment_code`별 source-bound 필수 조건에 맞춰 구조화 findings로 만든다(단일 source of truth).
2. **preflight 검증 (검증기 = detect-only 게이트)**: `src/validators/kssb_findings_validator.py`가 findings를
   **재판정 없이** 점검한다 — 구조 필수 필드·source_id cross-reference·모드↔라벨 정합·source-bound 조건부 규칙·
   빈 quote·질문 필수 6필드·금지 표현·내부 경로 노출. 검증기는 findings를 **고치지 않고 문제를 감지·보고만** 한다.
   error가 있으면 findings를 먼저 바로잡은 뒤 렌더한다.
3. **렌더 (렌더러 = 형식 변환기)**: `src/renderers/kssb_report_renderer.py`가 동일 findings를 **재판정 없이**
   대표 문서로 변환한다. 대표 문서 우선순위는 **DOCX → HTML → Markdown**이며, DOCX 생성이 제한돼도 HTML·Markdown fallback은 항상 생성된다(단일 소스 파생, 결정적 출력).
4. **전달 (배선기 = 로그/사용자 분리)**: `src/renderers/kssb_report_delivery.py`가 위 2·3단계(preflight+렌더)를 잇고
   **사용자-facing 요약**(대표 문서 파일명·표시 경로·preflight 건수·사람 검수·경계 고지)을 생성한다. 로컬 절대경로·계정명·임시경로·validator raw 출력·실행 로그는
   사용자 결과에 노출하지 않고 내부 상세와 **분리**한다. 사용자-facing 산출 흐름은 **이 배선기 경로**를 사용한다.
5. **사람 검수**: 산출물은 초안이며 컨설턴트가 검수·수정·확정한다. 확인 불가·상충 항목은 사람 검토로 넘긴다.

검증기·렌더러·전달 배선기는 **내부 워크플로우 구성요소**다(사용자-facing Python CLI가 아니다). 배선기는 재판정하지 않는다.
상세는 각 폴더 README와 `docs/workflow_usage.md`("전달 계약") 참조.

## Report structure (보고서 구조)

산출은 **컨설턴트 검수용 KSSB 공시근거 사전검토 보고서 초안**이며, **구조화 findings에서 렌더러가 변환**한다
(렌더러는 재판정하지 않는다). 구성은 `report_template.md`. findings 계약은 `docs/findings_schema_contract.md`.
표준 섹션: 표지·고지 → 검토 개요 → 상태 요약 → 영역별(4대) 항목 결과와 근거 → 고객 확인 질문·요청자료 → 보완 권고 → 한계와 사람 검수 안내.

## Completion checklist (완료 점검)

보고서 초안을 마무리하기 전 `completion_checklist.md`의 항목을 점검한다(근거 앵커 누락, 금지 표현, 확인 불가–질문 연결 등).
findings는 렌더 전 검증기 preflight(위 Workflow 2단계)에서 error 0건이어야 한다.

## Prohibited expressions (금지 표현)

`prohibited_terms.md`의 금지 표현(예: 감사 추적, 인증 의견, 준수 확정, 적합 판정 등)을 사용하지 않는다.
권장 표현(사전검토, 검토 근거, 보완 필요사항, 고객 확인 질문, 사람 검수 필요 등)을 사용한다.
사용자-facing findings 텍스트에는 **내부 도구/제공자 이름·영문 상태 문자열·작업 사이클/테스트 하네스 어휘**도 넣지 않는다
(`evidence_mapping_rules.md` §7 — 사용자 문구는 한국어 표준 문구로).

## Output policy (산출물 정책)

- 기본 목표 산출물: `<보고서명>_KSSB_공시근거_사전검토보고서.docx` (대표 문서 1개).
- DOCX 생성이 제한될 경우 fallback: `.html` → `.md`(우선순위 DOCX → HTML → Markdown). 배선기가 대표 문서(primary)를 지정한다.
- 기본 사용자 흐름에서는 JSON/CSV/manifest/debug log/`_검토근거` 폴더를 **산출물로 요구하지 않는다.**
  (이는 향후 개발/검증/debug mode에서 내부 검증용으로만 사용할 수 있다.)
- 대표 문서 생성·전달은 렌더러(`src/renderers/kssb_report_renderer.py`)와 전달 배선기(`src/renderers/kssb_report_delivery.py`,
  표준 라이브러리 기반 내부 구성요소)가 findings를 재판정 없이 변환해 수행한다. 렌더 전 검증기가 findings를 detect-only로 preflight 점검한다(위 Workflow 절).
  사용자-facing 요약(파일명·표시 경로·사람 검수·경계 고지)은 **배선기 경로**로 생성하며, 실행 로그·내부 상세와 분리한다.
  본 스킬은 구조화 findings와 보고서 템플릿·출력 정책을 규정하는 판단 엔진이며, 사용자-facing 진입점은 스킬 하나다.
- 사용자-facing 안내에 plugin/cache/sandbox 내부 경로·로컬 절대경로·계정명을 노출하지 않는다.

## Human review boundary (사람 검수 경계)

- 이 스킬의 산출물은 **초안**이며, 컨설턴트의 검수·수정·확정을 전제로 한다.
- 확인 불가 항목을 미공시로 단정하지 않는다. 상충·해석 필요 항목은 사람 검토로 넘긴다.
- 감사·인증·준수 판단을 대체하지 않는다.
