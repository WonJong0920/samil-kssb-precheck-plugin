# Codex Cycle 2D Validation / Guardrail Review

## 1. Review Overview

- 검증 대상 repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- 검증 대상 branch: `main`
- 검증 대상 commit: `d10dafa22a1b4cd85e5418c12964a45e55089dc4`
- 참고 리뷰: `docs/reviews/codex_cycle2c_renderer_review.md`
- 리뷰 목적: Cycle 2D Lightweight Validation / Guardrail 산출물이 detect-only 원칙을 지키며 Source-bound Analysis와 사람 검수 경계를 약화하지 않는지 독립 검증한다.
- 리뷰 일시: 2026-07-02

## 2. Verdict

- **Verdict**: CONDITIONAL PASS
- **Readiness**: 조건부 준비됨
- 한 줄 요약: Cycle 2D는 validation/guardrail-only 범위와 detect-only 원칙을 대체로 잘 지키며 재사용 가능한 표준 라이브러리 테스트도 추가했다. 다만 `jsonschema`가 없는 기본 환경에서 일부 schema-required 중첩 구조 누락을 error로 잡지 못하는 guardrail 공백이 있어, Cycle 2E에서 이 검증기를 신뢰 전제로 쓰기 전 보강이 필요하다.

## 3. Reviewed Materials

- `docs/cycle2d_validation_completion_report.md`
- `docs/reviews/codex_cycle2c_renderer_review.md`
- `docs/current_status.md`
- `docs/reviews/REVIEW_REPORT_TEMPLATE.md`
- `src/validators/kssb_findings_validator.py`
- `src/validators/README.md`
- `tests/smoke_test_renderer.py`
- `tests/test_findings_validator.py`
- `tests/README.md`
- `src/skills/samil-kssb-precheck/report_template.md`
- `src/skills/samil-kssb-precheck/completion_checklist.md`
- `src/skills/samil-kssb-precheck/prohibited_terms.md`
- `src/schemas/kssb_findings.schema.json`
- `src/schemas/kssb_findings_example.json`
- `docs/decision_log.md`
- `.gitignore`

## 4. Validation Performed

- `git rev-parse HEAD`로 대상 commit이 `d10dafa22a1b4cd85e5418c12964a45e55089dc4`임을 확인했다.
- `git status --short`로 리뷰 착수 시점 worktree가 clean임을 확인했다.
- `git diff --name-only 25301a9..d10dafa` 및 `git diff --stat 25301a9..d10dafa`로 Cycle 2D 변경 범위가 validator, tests, 완료/상태/결정 문서, `report_template.md`, `completion_checklist.md`에 한정됨을 확인했다.
- `python -m json.tool src\schemas\kssb_findings.schema.json`으로 schema JSON 문법을 확인했다.
- `python -m json.tool src\schemas\kssb_findings_example.json`으로 example JSON 문법을 확인했다.
- `jsonschema` 설치 여부를 확인했고, 설치되어 있지 않음을 확인했다. 새 의존성 설치 금지 지시에 따라 설치하지 않았다.
- `python src\validators\kssb_findings_validator.py src\schemas\kssb_findings_example.json`을 실행해 error 0건, warning 0건, info 1건(`jsonschema` 미설치 안내), 종료 코드 0을 확인했다.
- `python tests\smoke_test_renderer.py`를 실행해 22/22 PASS를 확인했다.
- `python tests\test_findings_validator.py`를 실행해 12/12 PASS를 확인했다.
- 추가 프로브로 `validate_findings(..., use_jsonschema=False)`에 대해 `source_documents[].source_mode`, `source_documents[].title`, `kssb_areas[].area_id`, `kssb_areas[].items`를 제거한 사본을 검사했고, 해당 누락이 error로 보고되지 않음을 확인했다.
- 외부 의존성 매니페스트(`requirements*.txt`, `pyproject.toml`, `setup.py`, `Pipfile`, `package.json` 등)가 없음을 확인했다.
- `.mcp.json`, PDF, `submission.zip`, 생성 DOCX/HTML 산출물이 repo에 추가되지 않았음을 확인했다.

## 5. Findings by Severity

- **Critical**: 없음.
- **Major**:
  - 표준 라이브러리 fallback 모드에서 schema-required 중첩 구조 누락 일부가 detect되지 않는다. 구체적으로 `source_documents[].source_mode`, `source_documents[].title`, `kssb_areas[].area_id`, `kssb_areas[].items`를 제거해도 `use_jsonschema=False`에서는 error가 없었다. 현재 환경처럼 `jsonschema`가 미설치인 상태에서는 schema-invalid findings가 validator CLI에서 error 없이 통과할 수 있다. 이는 validation/guardrail의 목적과 "외부 의존성 없이 유지" 원칙을 함께 만족하려면 보강이 필요한 부분이다.
- **Minor**:
  - renderer smoke test는 재사용 가능해졌지만, 판정 라벨 보존과 핵심 섹션 확인은 HTML 중심이다. DOCX는 zip/OOXML 파싱 중심으로 점검된다. Cycle 2C 독립 리뷰에서 DOCX 내용 보존을 별도로 확인했으므로 당장 차단은 아니나, smoke 범위 설명은 이 한계를 유지해야 한다.
  - `jsonschema` 기반 full validation은 미설치로 수행되지 않았다. 이는 지시상 허용되는 한계지만, 위 Major 때문에 표준 라이브러리 fallback 보강 전에는 "full schema guardrail"로 과장하면 안 된다.
  - quote가 실제 입력 자료 원문인지 확인하는 인용 실재성 검증은 자동화 범위 밖으로 남아 있으며 사람 검수 경계가 계속 필요하다.

## 6. Scope-Specific Review

### 6.1 Validation / Guardrail Only Scope

- 판단: PASS
- 근거: 변경 범위는 validator, tests, 문서 정리, 상태/결정/완료 보고에 한정된다. renderer/schema를 수정하지 않았고 OCR/문서 파싱, Hook/MCP, sample PDF 분석, `submission.zip` 생성은 확인되지 않았다.

### 6.2 Detect-Only Principle

- 판단: PASS
- 근거: `validate_findings()`는 `Issue` 목록을 반환하며 findings를 수정하지 않는다. validator test도 `detect-only(입력 미변경)`을 확인한다. 판정·근거·질문·권고 생성이나 보정 로직은 확인되지 않았다.

### 6.3 Implemented Guardrail Rules

- 판단: CONDITIONAL PASS
- 근거: source_id cross-reference, source_mode mismatch, judgment_label/mode mismatch, source-bound 조건부 규칙, 빈 quote, customer_questions 필수 6필드, 금지 표현, 내부 경로 노출 스캔은 테스트로 검출이 확인되었다.
- 이슈: `jsonschema`가 없는 표준 라이브러리 모드에서는 일부 schema-required 중첩 필드 누락을 검출하지 못한다. 특히 `source_mode`가 없으면 review_mode/source_mode 정합을 판단할 수 없는데도 error가 없다.

### 6.4 Cycle 2C Minor Resolution

- 판단: PASS
- 근거: `report_template.md`의 "렌더러 미구현" 문구는 현행화되었고, `completion_checklist.md` 질문 항목에는 관련근거가 추가되었다. reusable smoke test도 `tests/smoke_test_renderer.py`로 추가되었다.

### 6.5 Tests and Reusability

- 판단: PASS
- 근거: tests는 표준 라이브러리 스크립트이며 pytest 의존성이 없다. renderer smoke 22/22 PASS, validator test 12/12 PASS를 독립 재현했다. 출력은 repo 밖 임시 폴더에 생성된다.

### 6.6 Standard Library / Dependency Boundary

- 판단: PASS
- 근거: validator와 tests는 표준 라이브러리 및 로컬 모듈만 사용한다. `jsonschema`는 선택 import이며 미설치 시 info issue만 남긴다. 새 의존성 매니페스트는 없다.

### 6.7 Skill-First / No Re-Judgment

- 판단: PASS
- 근거: validator는 렌더 전 별도 점검 단계로 문서화되어 있고, renderer의 no re-judgment 원칙을 변경하지 않는다. Skill 문서도 findings-first 흐름과 렌더러 재판정 금지를 유지한다.

## 7. Boundary / Risk Review

- 제품 경계 유지 여부: PASS. 고지·사람 검수 경계·금지 표현 스캔이 유지된다.
- Source-bound Analysis 유지 여부: CONDITIONAL PASS. 검증기는 source-bound 규칙 다수를 감지하지만, 표준 라이브러리 fallback 구조 검증 공백이 있어 보강 조건이 있다.
- 사람 검수 경계 유지 여부: PASS. 인용 실재성은 자동 검출 범위 밖으로 명시되어 있고 사람 검수 대상으로 남아 있다.
- 금지 작업 수행 여부: PASS. Hook/MCP, OCR/문서 파싱, 샘플 PDF 분석, 외부 패키지 추가, `submission.zip` 생성은 확인되지 않았다.
- 해커톤 제출 맥락 리스크: 로그 원본 제출 방식은 계속 보류이며 제출 패키징 단계에서 결정해야 한다.

## 8. Next-Step Readiness

- 판단: 조건부 준비됨
- Cycle 2E 착수 가능성: 조건부 가능
- 조건: `jsonschema` 미설치 표준 라이브러리 모드에서도 schema-required 중첩 구조 누락(`source_documents[].title/source_mode`, `kssb_areas[].area_id/area_name/items` 등)을 error로 감지하도록 validator를 보강하거나, Cycle 2E에서 이 검증기를 preflight gate로 쓰기 전에 해당 한계를 명시적으로 보완해야 한다.
- 근거: detect-only 구조, 테스트 재사용성, 금지 작업 미수행, Cycle 2C Minor 해소는 충분하다. 남은 Major는 guardrail coverage의 보강 조건이며, 구현 방향을 뒤집어야 하는 실패는 아니다.

## 9. Reviewer Notes

- Python은 sandbox에서 직접 실행이 막혀, JSON 문법 검증과 validator/test 실행은 권한 승격으로 수행했다.
- 이 리뷰는 Cycle 2E 상세 구현 계획을 작성하지 않는다.

## 10. ChatGPT / User Confirmation

- 본 리뷰는 Cycle 2D Validation / Guardrail 산출물 검증 결과만 기록한다.
- 최종 다음 단계 착수 여부는 ChatGPT/User 확인 후 진행한다.
