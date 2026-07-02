# Cycle 2D 완료 보고 — Lightweight Validation / Guardrail

## 1. 작업 개요

Cycle 2C Renderer Review(PASS)의 남은 Minor와 findings 계약의 수동 검증 규칙을 바탕으로, findings와 렌더러
산출물에 대한 **경량 결정적 검증/가드레일**을 추가했다. 범위는 **validation / guardrail only**이며, 검증기는
**detect-only**다 — findings를 고치지 않고 판정·근거·질문·권고를 새로 만들지 않는다. 실제 샘플 PDF 분석·OCR·
문서 파싱·Hook/MCP·submission.zip 생성은 하지 않았다. 모든 코드는 외부 의존성 없이 표준 라이브러리로 구현했다.

## 2. 참고한 최소 진입 문서와 자율 탐색한 주요 파일

**최소 진입 문서**
- `docs/reviews/codex_cycle2c_renderer_review.md` — Minor 3건(report_template 문구, completion_checklist 질문 항목, reusable test 부재)과 Next-Step Readiness 확인.
- `docs/current_status.md` — Cycle 2C 상태·이후 사이클 항목.
- `docs/templates/CYCLE_COMPLETION_REPORT_TEMPLATE.md` — 완료 보고 구조.

**자율 탐색한 주요 파일**
- `docs/findings_schema_contract.md` — "JSON Schema로 표현하지 못한 수동 검증 규칙"(cross-ref·모드↔라벨 정합·인용 실재성·금지 표현) 목록.
- `src/schemas/kssb_findings.schema.json`, `src/schemas/kssb_findings_example.json` — 검증 대상 계약·예시.
- `src/skills/samil-kssb-precheck/prohibited_terms.md` — 금지 표현 목록(스캔 단일 소스).
- `src/skills/samil-kssb-precheck/customer_question_rules.md`, `report_template.md`, `completion_checklist.md` — 질문 6필드·문서 정합.
- `src/renderers/kssb_report_renderer.py` — 스모크 테스트 대상.

## 3. 작성/수정한 파일

**신규**
- `src/validators/kssb_findings_validator.py` — 경량 findings 검증기(표준 라이브러리, detect-only).
- `src/validators/README.md` — 검증기 경계(detect-only)·규칙·사용.
- `tests/smoke_test_renderer.py` — 재사용 렌더러 스모크(출력은 repo 밖 임시 폴더).
- `tests/test_findings_validator.py` — 검증기 테스트(valid 0건 + 손상 사본 검출).
- `tests/README.md` — 테스트 실행 안내(표준 라이브러리, pytest 미도입).
- `docs/cycle2d_validation_completion_report.md` — 본 완료 보고.

**수정**
- `src/skills/samil-kssb-precheck/report_template.md` — "렌더러 미구현" 문구를 현행화(렌더러·검증기 경로 명시). *Cycle 2C Minor.*
- `src/skills/samil-kssb-precheck/completion_checklist.md` — 질문 항목에 관련근거 추가(스키마 6필드 정합). *Cycle 2C Minor.*
- `docs/current_status.md` — Cycle 2D 상태·완료 작업·이후 사이클·GitHub 상태 갱신.
- `docs/decision_log.md` — Cycle 2D 결정 D26~D29 추가.

findings schema/example/contract는 **변경하지 않았다**(검증 대상으로만 소비).

## 4. 추가한 경량 검증/가드레일 요약

`kssb_findings_validator.validate_findings()`는 findings를 변경하지 않고 `Issue(severity·code·location·message)` 목록을 반환한다.

1. **구조 필수 필드** — report_meta(report_title·review_mode·disclaimer)·source_documents·kssb_areas·human_review_boundary, finding_item 핵심 필드.
2. **source_id cross-reference** — 모든 `evidence_anchors[].source_id`가 `source_documents[].source_id`에 존재하는지.
3. **review_mode ↔ source_mode 정합** — customer_provided_materials↔customer_provided, public_materials_validation↔public.
4. **judgment_code ↔ judgment_label ↔ review_mode 정합** — 계약의 모드별 라벨 표를 강제(예: public+evidence_confirmed→"공개자료상 근거 확인").
5. **Source-bound 조건부 규칙** — confirmed/partial→anchors≥1, not_verifiable→missing_info+customer_questions, conflict→human_review_required+note, out_of_scope→missing_info. evidence **quote 빈값 금지**.
6. **customer_questions 필수 6필드** — question·reason·related_evidence·priority(enum)·requested_material·follow_up_action 비어있지 않음.
7. **금지 표현 스캔** — `prohibited_terms.md`의 강한 표현을 분석 콘텐츠 필드에서 검출. 고지·경계·한계·notes 필드는 negation 문맥이라 제외(오탐 방지). 판정명 단일어는 규칙 4로 검증.
8. **내부 경로 노출 스캔** — 전체 문자열 필드에서 `C:\`·`/Users/`·`.codex`·`sandbox`·`AppData`·`plugin/cache` 등 토큰 검출.

`jsonschema`가 설치돼 있으면 선택적 Draft-07 검증을 추가하고, 없으면(현 환경) info 이슈로 표기하고 표준 라이브러리 검증만 수행한다(새 의존성 설치 없음).

검증기는 문제를 **감지·보고만** 한다. 판정·근거·질문·권고를 생성·보정하지 않으며 Source-bound Analysis와 사람 검수 경계를 약화하지 않는다.

## 5. 문서 정리 내용

- `report_template.md`: Cycle 2B 시점의 "실제 DOCX/HTML 생성 코드는 아직 구현하지 않는다" 주의 문구를, 렌더러(`src/renderers/…`)와 검증기(`src/validators/…`)가 구현되었음을 반영하도록 최소 현행화.
- `completion_checklist.md`: "확인 불가·질문 연결" 항목의 질문 필드 나열에 **관련근거**를 추가해, 같은 파일의 findings 스키마 정합성 섹션(6필드)과 표현을 일치시킴.
- 그 외 계약·스키마 문구는 변경하지 않았다.

## 6. Preflight Check 결과

**수행함**
- schema JSON / example JSON 문법 확인(`python -m json.tool`) — OK.
- 검증기 example 실행 — error 0건, warning 0건(RC 0).
- 렌더러 스모크(`tests/smoke_test_renderer.py`) — **22/22 PASS**(DOCX zip/내부 XML, HTML 핵심 섹션, 재판정 금지(출력 라벨=입력 라벨), quote 원문 보존, 결정성, 파일명 규칙, 내부 경로 비노출).
- 검증기 테스트(`tests/test_findings_validator.py`) — **12/12 PASS**(valid 0건 + cross-ref·모드 정합·빈 quote·질문 필드·source-bound·금지 표현·내부 경로 검출, detect-only 입력 미변경).
- DOCX/HTML 생성 경로가 기존 산출물 정책과 충돌하지 않음 — 렌더 출력은 임시 폴더에만 생성, `.gitignore` 산출물 제외 유지.
- 새 외부 의존성·의존성 매니페스트 부재 확인(`requirements*.txt`·`pyproject.toml`·`setup.py`·`Pipfile`·`package.json` 없음). 검증기 import는 표준 라이브러리만.

**수행하지 못함(한계)**
- `jsonschema` 기반 full validation은 패키지 미설치로 미수행(설치 금지 준수, info 이슈로 표기).
- quote가 실제 입력 자료 원문인지(인용 실재성)는 자동 검출 대상이 아님 → 사람 검수 유지.
- MS Word GUI 실제 열기 검증은 미수행(zip 무결성·OOXML XML 파싱으로 대체).

최종 PASS/FAIL 판정은 작성하지 않는다(최종 검증은 Codex가 수행).

## 7. 금지 작업 미수행 확인

- 실제 샘플 PDF 분석 — 미수행.
- OCR / 문서 파싱 구현 — 미수행.
- Hook / MCP 추가 — 미수행.
- 기존 Python reference 코드 복사 — 미수행(참고 엔진 코드 미참조, 신규 구현).
- 외부 패키지 추가 — 미수행(표준 라이브러리만, `jsonschema`는 선택적·미설치 시 미사용).
- submission.zip 생성 — 미수행.
- 로그 원본 제출 방식 확정 — 미수행(보류 유지).
- 제품 문서에 특정 샘플 고객사명/파일명 고정 — 미수행.
- Cycle 2E 상세 계획 작성 — 미수행.
- 렌더러가 judgment를 재계산하도록 변경 — 미수행(렌더러 로직 미변경).
- findings 내용 자동 보정·보강 로직 추가 — 미수행(검증기는 detect-only).

## 8. 남은 보류사항

- 인용 실재성(quote↔입력 원문 일치) 자동 검증은 범위 밖 → 사람 검수 유지.
- 렌더러·검증기를 Skill 절차에 실제 배선(호출 지점 확정).
- 실제 샘플(PDF/OCR/문서 파싱) 실행·submission.zip 패키징, 로그 원본 제출 방식 — 제출 패키징 단계 결정(보류).
- `jsonschema` 기반 full validation은 새 의존성 금지로 미수행.

## 9. GitHub push 상태

- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- commit message: `feat: add lightweight validation guardrails`
- 최종 commit SHA는 본 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.

## 10. ChatGPT 확인 대기

- 다음 단계는 **Codex Cycle 2D Validation Review**이며, 착수 여부는 ChatGPT/사용자 확인 후 진행한다.
