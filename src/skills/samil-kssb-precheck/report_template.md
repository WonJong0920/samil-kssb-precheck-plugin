# 보고서 템플릿 (Report Template)

Samil KSSB Precheck의 사용자-facing 산출물은 **컨설턴트 검수용 KSSB 공시근거 사전검토 보고서 초안**이며,
**구조화 findings에서 렌더러가 변환**해 생성한다. 렌더러는 findings를 **재판정하지 않고** 형식 변환만 한다.
findings 계약은 `schemas/findings_schema_contract.md`, 스키마는 `schemas/kssb_findings.schema.json`(설치 플러그인 루트 기준 경로).

> **참고**: 이 문서는 보고서의 **섹션 구성과 내용 규칙**을 규정한다. 실제 파일 생성 렌더러의 **런타임 경로는
> `renderers/kssb_report_renderer.cjs`**(findings를 재판정 없이 DOCX → HTML → Markdown으로 변환)이고,
> 렌더 전 경량 검증의 런타임은 `validators/kssb_findings_validator.cjs`(detect-only)가 담당한다.
> Python(`.py`)은 golden parity reference로 유지한다(제거·CLI 회귀 아님 — D93③·D95).

## 파일 명명 규칙 (출력 정책)

- 기본 목표: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`
- DOCX 제한 시 fallback: `<보고서명>_KSSB_공시근거_사전검토보고서.html` 또는 `.md`
  (대표 문서 우선순위 **DOCX → HTML → Markdown**, primary=DOCX).
- 기본 사용자 흐름에서는 위 대표 문서 1개를 산출물로 한다. JSON/CSV/manifest/`_검토근거` 폴더는 기본 산출물이
  아니다(trace manifest `run_manifest.json`은 **opt-in 내부 provenance artifact**일 뿐 대표 문서가 아니다).

## 보고서 섹션 구성

### 1. 표지 및 고지
- 제목: `KSSB 공시근거 사전검토 보고서 (초안)`
- 대상 보고서명 / 검토 모드(고객 제공자료 또는 공개자료 검증) / 검토 기준(KSSB 제1·2호, 4대 영역 MVP)
- 고지문:
  > 본 보고서는 AX 해커톤 제출을 위해 삼일회계법인의 공개 ESG·지속가능성 공시 자문 맥락을 바탕으로 설계한
  > Codex 플러그인이 생성한 **컨설턴트 검수용 사전검토 초안**입니다. 삼일회계법인의 공식 제품 또는 내부 도구가
  > 아니며, 감사·인증·준수 판단을 대체하지 않습니다. 확인 불가 항목은 미공시로 단정하지 않으며, 최종 판단은
  > 컨설턴트가 수행합니다.

### 2. 검토 개요
- 검토 대상 자료, 검토 범위(4대 영역), 근거 기반 분석 원칙 요약, 판정 라벨 세트 안내.

### 3. 상태 요약
- 판정 라벨별 항목 수 요약 표(근거 확인 / 일부 근거 확인, 보완 필요 / 확인 불가 / 상충 또는 해석 필요 / 검토 범위 외).
- 영역별 항목-판정 요약 표(항목ID · 영역 · 판정).

### 4. 영역별 항목 결과와 근거
4대 영역 각각에 대해, 항목별로 다음을 기술한다.
- 항목ID · 공시요구 · **판정 라벨**
- 판단 근거: 원문 인용(quote) + 위치 단서(섹션/제목/표). "확인 불가"는 근거 없음으로 표기.
- 부족한 정보(있으면).

### 5. 고객 확인 질문 및 요청자료
- `customer_question_rules.md` 필드 구조의 질문 목록(항목ID·항목명·질문·질문사유·관련근거·우선순위·요청자료·후속조치).
- 우선순위 순 정렬 권장.

### 6. 보완 권고
- 컨설턴트 관점의 보완 방향(확정·보증 표현 금지). "권고/보완 필요/추가 확인 필요" 톤.

### 7. 한계와 사람 검수 안내
- 근거 기반 분석의 한계(표현 차이로 인한 누락 가능, 신뢰도는 휴리스틱).
- 확인 불가·상충 항목은 사람 검수 대상임을 명시.
- 감사·인증·준수 판단 대체 아님 재확인.

#### 7-1. 검수 우선순위 표 (human-review surface — 문서 서식)
검수자가 **어느 항목을 왜 사람 판단으로 확인해야 하는지**를 한눈에 보도록, 아래 유형의 항목을 한 표로 모은다.
이 표는 **판정 자동화가 아니라** 사람 검수 대상과 사유를 표면화하는 서식이다 — findings에서 파생하는 표시일 뿐
**판정을 바꾸거나 새로 계산하지 않으며**, findings 스키마도 변경하지 않는다(렌더러 자동 생성 여부는 별도 판단).

| 열 | 내용 |
|---|---|
| 항목ID · 영역 | 상위 finding_item에서 파생 |
| 판정 라벨 | findings `judgment_label`(재계산 없음) |
| 검수 사유(유형) | 아래 유형 중 해당 항목 |
| 확인 대상 | 검수자가 사람 판단으로 확인할 것(원문 대조·상충 해소·부족정보·인용 실재성 등) |

표에 표면화할 최소 유형:
- **상충/해석 필요**(`conflict_or_interpretation_needed` — `human_review_note` 동반): 자동 해소 금지, 사람 판단.
- **확인 불가**(`not_verifiable`): 미공시 단정 금지, `missing_info`·고객 질문 연결을 검수.
- **일부 근거 확인, 보완 필요**(`partial_evidence_needs_supplement`): 보완이 필요한 근거·부족분을 검수.
- **validator warning**: 예) 동일 인용 다항목 재사용(`evidence.duplicate_quote_reuse`), quote 실재성 opt-in
  미발견(`quote.source_not_found` — additive·기본 off·warning, 사람 검수·독립 표본 확인 비대체). warning은
  delivery 내부 상세(`--debug`)에 있으며, 이 표는 이를 **검수자 대면으로 표면화**하는 서식이다.

이 표는 **검수 유도 신호**이지 판정·품질·감사/인증 결론이 아니다. 최종 판단은 컨설턴트가 수행한다.

## 내용 규칙

- 모든 "근거 확인/일부 근거 확인" 항목에는 근거 앵커가 붙어야 한다(`evidence_mapping_rules.md`, findings `evidence_anchors` ≥ 1).
- 판정 표기는 findings의 `judgment_label`(review_mode에 맞는 라벨)을 그대로 사용한다. 렌더러는 라벨을 재계산하지 않는다.
- 금지 표현을 사용하지 않는다(`prohibited_terms.md`).
- 확인 불가 항목은 반드시 5절 질문과 연결된다(findings `not_verifiable` → `customer_questions`).
- 상충 또는 해석 필요 항목은 사람 검수 대상으로 표기한다(findings `human_review_required`).
- plugin/cache/sandbox 내부 경로를 보고서에 노출하지 않는다.
