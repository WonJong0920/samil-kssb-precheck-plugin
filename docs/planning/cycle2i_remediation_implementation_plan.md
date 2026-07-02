# Cycle 2I Remediation Implementation Plan

> **성격**: 계획 문서. **구현이 아니다.** 이 문서는 baseline 문제 분석(`docs/cycle2i_baseline_execution_output_problem_analysis.md`)을
> 바탕으로 개선 방향·순서·범위를 제안한다. plugin code·Skill·renderer·validator·schema·manifest·marketplace를 수정하지 않고,
> Kordoc 설치/MCP setup/외부 설치 명령/OCR provider 사용/`.mcp.json` 생성도 하지 않는다. PASS/FAIL 판정도 하지 않는다.
> 운영 원칙은 `AGENTS.md`·`docs/operating_principles.md`를 따른다(Claude Code=작업 수행자, 판정은 Codex).

## 1. Purpose

- baseline에서 분리한 **실행 단계 문제**와 **산출물 퀄리티 문제**에 대한 **가장 안전한 실행 순서·범위**를 제안한다.
- 사용자 검토 요청인 **Kordoc(문서 인테이크/표 추출 후보)** 도입 feasibility를 **설치 없이** 계획 수준으로 반영한다.
- 표·이미지 중심 문서판독을 위한 **중간 산출물 구조(Document Evidence Index)**를 schema 변경 없이 상위 설계로만 제안한다.
- Codex Review에 넘길 검토 포인트를 정리한다.

## 2. Inputs Reviewed

- `AGENTS.md`, `docs/operating_principles.md` — 역할·보고·경계 원칙.
- `docs/cycle2i_baseline_execution_output_problem_analysis.md` — Run A/B baseline 문제 분석(실행/품질 분리).
- `docs/current_status.md`, `docs/decision_log.md` — 현재 상태·결정 이력.
- `docs/workflow_usage.md`, `docs/architecture.md` — findings→검증→렌더→사람 검수 흐름, Skill-first 내부 구성요소.
- `src/skills/samil-kssb-precheck/SKILL.md` — 현 범위에 "문서 변환/OCR 실행 코드 미포함" 명시.
- `src/schemas/kssb_findings.schema.json`(evidence_anchor / customer_question / finding_item 정의), `src/renderers/`(stdlib DOCX/HTML), `src/validators/`(detect-only).
- Kordoc 공개 정보(README, read-only 확인): npm 패키지 `kordoc`(Node.js 18+). HWP 3.x/5.x·HWPX·HWPML·**PDF**·XLS·XLSX·DOCX → **Markdown 변환 + 표(Table) 재구성**, 신구대조, HWPX 생성, **MCP 연동**(`parse_document`·`parse_table`·`fill_form`·`generate_document` 등). *(외부 repo 상세는 공개 README 범위에서만 확인; 코드 감사·라이선스 정밀검토는 미수행.)*

## 3. Baseline Problem Summary

- **실행 단계**: 문서 인테이크/OCR/표 추출 부재(에이전트가 즉석 추출 대행) · 표 수치 복원 실패 · 대용량 처리 취약 · **실행 로그·로컬 경로 노출** · findings→renderer 미배선으로 **DOCX 미생성**·산출물 경로 부재.
- **산출물 품질**: 내부 코드명(gov/strat/metric) 노출 · 한글 항목명 부족 · 원문 인용 부족 · 페이지/섹션/표 위치 단서 부족 · 질문 요청자료 구체성 편차 · 요약문형.
- **유지(긍정)**: 두 Run 모두 감사·인증·준수 대체 아님·컨설턴트 검수용·확인 불가 미공시 아님 경계와 판정 라벨 체계·source-bound 톤 유지. 병목은 **판정 로직이 아니라 실행 배선·표현 품질**.

## 4. Remediation Goals

1. 사용자-facing 결과에서 실행 로그·로컬 경로를 분리·비노출하고 **대표 문서만** 산출물로 노출.
2. 구조화 findings → renderer 배선으로 **대표 문서 파일(DOCX, fallback HTML/Markdown)과 산출물 경로** 보장.
3. 내부 코드명 → **한글 항목명(requirement_title)** 중심 표기, 원문 인용·페이지/섹션 위치 단서 노출.
4. PDF/표/이미지 인테이크 한계에 대한 **fallback 설계**(표 재구성·OCR 게이팅)와 인테이크 후보(Kordoc) feasibility.
5. 위 전반에서 Skill-first·source-bound·사람 검수·제품 경계·민감정보 비노출 유지.

## 5. Candidate Implementation Tracks

| Track | 대상 문제 | 성격 | 새 의존성 | 리스크 |
|---|---|---|---|---|
| **2I-1 실행 배선/출력 분리** | 로그·경로 노출, DOCX 미생성, 산출물 경로 부재 | 배선·정리(기존 renderer 활용) | 없음(표준 라이브러리) | 낮음 |
| **2I-2 표현 품질** | 코드명 노출, 인용/위치 단서, 질문 구체성 | 렌더/표기 규칙 | 없음 | 낮음 |
| **2I-3 문서 인테이크/표 fallback (설계)** | PDF 파싱·표 복원·OCR | 파이프라인 설계 | (설계만) | 중 |
| **2I-3A Kordoc feasibility spike** | 인테이크 후보 검증 | 격리 검증(사용자 승인·로컬) | 외부(선택·미고정) | 중~높음(격리로 통제) |

- 각 Track은 **지시·승인 후 착수**. 이번 문서는 Track 정의·순서·범위까지만.

## 6. Recommended Sequence

**권장 순서: 2I-1 → 2I-2 → (2I-3 설계 ∥ 2I-3A Kordoc feasibility spike)**

판단 근거(지시서 6개 질문에 대한 답):

1. **2I-1/2I-2/2I-3 순서 유지가 나은가?** — 유지 권장. 2I-1·2I-2는 **기존 renderer(표준 라이브러리)로 새 의존성 없이** 사용자 체감 문제(로그·경로 노출·DOCX 미생성·코드명)를 해소한다. 2I-3(인테이크/OCR)은 외부 의존·복잡도가 커 마지막.
2. **Kordoc feasibility를 2I-3A로 분리하나?** — 분리 권장. 외부 도구·사용자 승인·로컬 MCP/CLI 설치가 필요하므로 **격리된 feasibility spike(2I-3A)**로 두고, 인테이크 **설계(2I-3)**는 특정 도구에 하드 커플링하지 않는다.
3. **Kordoc 검토를 Codex Review 전에 반영해야 하나?** — 그렇다. 이번 계획에 **feasibility 후보·격리 조건**으로 반영해 Codex가 "미설치·게이팅·격리" 통제를 검토하게 한다(구현 아님).
4. **DOCX 생성 vs 인테이크 개선, 무엇이 먼저인가?** — **대표 문서 생성(2I-1)이 먼저.** renderer가 이미 존재(재판정 없는 stdlib 변환기)해 즉시 배선 가능하고, 인테이크가 완벽하지 않아도 "확인 불가 → 요청자료" 전환으로 안전하게 산출물을 낼 수 있다. 인테이크는 이후 품질을 끌어올린다.
5. **Kordoc을 본체 의존성으로 넣기 전 필요한 evidence?** — §7.
6. **표/이미지 판독을 위한 중간 산출물 구조?** — **Document Evidence Index(§8)**.

## 7. Kordoc Intake Feasibility Plan (2I-3A)

- **포지셔닝**: Kordoc은 **"사용자 승인 후 로컬 MCP/CLI로 설치 가능한 인테이크 후보 도구"**로만 계획에 둔다. **plugin 본체 hard dependency로 고정하지 않는다.** 인테이크 계층은 **도구 교체 가능(pluggable)**하게 설계하고, Kordoc 부재 시에도 현행 경로(제한된 텍스트 추출 + "확인 불가→요청자료")로 동작해야 한다.
- **적합성(공개 README 기준)**: PDF·XLSX·DOCX → Markdown, **표 재구성**, MCP 도구(`parse_document`·`parse_table` 등)는 baseline의 "표 수치 복원 실패" 문제와 직접 맞닿는다. Node.js 18+ 로컬 실행.
- **본체 의존성 고정 전 필요한 evidence(승인 전 확보)**:
  1. **오프라인/로컬 동작 확인** — 외부 서버로 문서·데이터 egress가 없는지(민감자료 전제). 네트워크 차단 상태 동작 여부.
  2. **라이선스 적합성** — 배포·제출 맥락에서 사용 가능한 라이선스인지(정밀 검토).
  3. **두 샘플 유형 재현성** — KSSB형/일반형 PDF에서 표·수치가 신뢰 가능하게 복원되는지(정성 평가).
  4. **결정성/안정성** — 동일 입력 재현성, 대용량(예: 대형 PDF) 처리 안정성.
  5. **스키마 정합 매핑** — 산출(Markdown/표)이 Document Evidence Index(§8) → findings evidence_anchor로 **손실 최소** 매핑되는지.
  6. **Skill-first·경계 유지** — 사용자 진입점은 Skill 하나 유지, 인테이크는 내부 구성요소. 로컬 경로·MCP 설정은 사용자-facing/ repo 비노출.
- **격리 조건(spike 동안)**: 설치·`npx`·`.mcp.json`·MCP setup은 **사용자 로컬에서 사용자 승인 후**에만. repo에는 설치 명령·로컬 경로·계정·MCP 설정을 **커밋하지 않는다.** OCR provider(스캔 이미지 PDF 대응)는 **별도 사용자 승인 전 사용 금지**로 명시.
- **산출**: feasibility 결과는 별도 evidence 문서(후속)로 기록(도구 판단은 사용자/ChatGPT). 이번 문서는 **feasibility 계획**까지.

## 8. Document Evidence Index Proposal

표·이미지 중심 맥락 감지를 위해, **인테이크 계층이 findings **상위(upstream)**에서 생성하는 중간 산출물** 개념. findings schema를 바꾸지 않는다.

제안 필드(개념):
`source_file` · `page_number` · `section_path` · `block_id` · `block_type`(heading/paragraph/table/image/list) ·
`extracted_text_or_table_markdown` · `bbox_or_location_hint` · `extraction_quality` · `warnings` · `needs_ocr` ·
`kssb_candidate_area` · `evidence_confidence` · `reviewer_note`.

현 구조와의 연결(설계만, 코드/스키마 미변경):
- **→ findings evidence_anchor**: `source_file`→`source_id`(source_documents 매핑), `page_number`+`section_path`→`page_or_section`, `extracted_text_or_table_markdown`(발췌)→`quote`, 관련성 서술→`relevance_note`. 표는 마크다운 표 발췌로 인용 단서화.
- **→ finding_item.area**: `kssb_candidate_area`가 4대 영역 후보를 제시(최종 판정·근거 선택은 **Skill이 수행**, index는 후보·근거 재료만 제공 → 재판정 아님).
- **→ validator(detect-only)**: `needs_ocr`·`extraction_quality`·`warnings`가 낮은 신뢰 구간을 표식 → "확인 불가 → missing_info + customer_questions" 전환의 근거.
- **→ renderer**: 변경 없음. renderer는 계속 findings만 소비. index는 findings 생성 재료이지 renderer 입력이 아니다.
- **경계**: index는 **판정을 만들지 않는다.** 근거 후보·위치·품질 신호만 제공하고, judgment는 Skill이 source-bound로 부여(현 원칙 유지).
- **주의**: 이 구조는 **제안**이며, 실제 schema 신설/변경은 별도 사이클에서 승인 후. `evidence_confidence`/`kssb_candidate_area`가 자동 판정처럼 오용되지 않도록 "재료일 뿐" 경계를 문서에 고정할 것.

## 9. Table/Image Context Detection Proposal

- **표(table)**: 인테이크가 표를 **마크다운 표**로 재구성(Kordoc 후보 강점)하고, 표 셀 수치는 `extraction_quality`·`warnings`로 신뢰도를 표식. 저신뢰 수치는 근거로 승격하지 않고 "확인 불가/보완 필요 → 요청자료(데이터표·단위·산정범위·기준연도)"로 전환.
- **이미지(image)**: 텍스트 미포함 이미지·스캔 페이지는 `block_type=image`·`needs_ocr=true`로 표식하고, **OCR은 별도 승인 전 미수행**. 미수행 구간은 사람 검수 대상으로 명시.
- **정량 지표 안전장치**: baseline에서 확인된 Scope 1·2·3, 에너지 사용량 등은 표 복원 신뢰도가 낮으면 정량 근거로 쓰지 않고, `page_or_section`+요청자료로 검수자 원문 대조를 유도(현 evidence_mapping·completion_checklist 원칙과 정합).

## 10. Security / Privacy / Local Environment Constraints

- **로그·경로 비노출**: 사용자-facing 결과·repo 문서에 로컬 절대경로·계정명·임시경로·MCP 설정 경로·토큰을 노출/커밋하지 않는다(필요 시 `[REDACTED]`).
- **로컬·오프라인 우선**: 인테이크/OCR 후보는 로컬 실행·무-egress를 전제. 외부 전송·클라우드 OCR은 **사용자 승인 전 금지**.
- **설정 파일 격리**: `.mcp.json`·클라이언트 설정은 **사용자 로컬 소유**이며 repo에 생성/수정/커밋하지 않는다.
- **의존성 격리**: Kordoc은 선택·pluggable. 본체는 표준 라이브러리 원칙 유지. 새 하드 의존성은 evidence(§7)+승인 후에만.
- **산출물 정책**: 대표 문서·중간 산출물의 repo/zip 포함은 `docs/submission_packaging_policy.md` 기준(생성물 기본 미커밋, 민감정보 스캔).

## 11. What Not To Implement Yet

- plugin code / Skill / renderer / validator / schema / tests / manifest / marketplace 변경 — **하지 않음.**
- Kordoc 설치·`npx`·MCP setup·`.mcp.json` 생성 — **하지 않음.** OCR provider 사용 — **하지 않음(별도 승인 전 금지).**
- DOCX 생성 구현·PDF 재실행·Codex app/CLI 실행·submission.zip 생성 — **하지 않음.**
- Document Evidence Index의 schema 신설/코드화 — **하지 않음(개념 제안만).**
- 위 Track/순서/후보는 **제안**이며 착수·확정은 사용자/ChatGPT 확인 후.

## 12. Codex Review Scope

**Codex Review 대상 문서**
- `docs/cycle2i_baseline_execution_output_problem_analysis.md`
- `docs/planning/cycle2i_remediation_implementation_plan.md`
- `docs/current_status.md`
- `docs/decision_log.md`

**Codex가 검토할 질문**
1. 문제 분석이 정확한가(실행/품질 분리 포함)?
2. 실행 단계 문제와 산출물 품질 문제가 잘 분리됐는가?
3. 구현 우선순위(2I-1→2I-2→2I-3/2I-3A)가 타당한가?
4. Kordoc 도입을 feasibility spike(2I-3A)로 제한한 것이 적절한가?
5. 사용자 승인 없는 설치·외부 전송·로컬 설정 커밋 위험이 통제됐는가?
6. 문서판독 파이프라인 보강안(Document Evidence Index)이 현재 plugin 구조(findings schema·renderer·validator·Skill-first)와 충돌하지 않는가?
7. 바로 구현 가능한 범위(2I-1·2I-2)와 설계 검증이 필요한 범위(2I-3·2I-3A)가 잘 나뉘었는가?

## 13. Open Questions for User / ChatGPT

- 대표 문서 기본 포맷: DOCX 우선 + HTML/Markdown fallback 순서로 확정할지.
- Kordoc feasibility spike를 언제(2I-1/2I-2와 병렬 vs 이후) 착수할지, 로컬 설치 승인 범위.
- OCR 도입 여부·provider(로컬 전용 조건) 승인 정책.
- Document Evidence Index를 별도 산출물로 도입할지, findings 생성 지침에만 반영할지.
- 대표 문서·중간 산출물의 제출 포함 정책(민감정보 스캔 기준).
