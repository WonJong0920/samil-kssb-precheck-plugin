# Cycle 2D Patch 완료 보고 — Validator Fallback Required Structure 보강

## 1. 작업 개요

Codex Cycle 2D Validation Review의 **CONDITIONAL PASS** Major를 최소 범위로 보정했다. `jsonschema`가 없는
표준 라이브러리 fallback 모드(`use_jsonschema=False`)에서도 **schema-required 중첩 구조 누락**을 error로 감지하도록
경량 검증기를 보강했다. 이번 작업은 **Cycle 2D Patch**이며 Cycle 2E 착수가 아니다. 검증기는 계속 **detect-only**로,
findings를 고치거나 판정·근거·질문·권고를 생성하지 않는다.

## 2. Codex Major 지적사항 요약

- 표준 라이브러리 fallback 모드에서 다음 schema-required 중첩 필드를 제거해도 error가 보고되지 않았다:
  `source_documents[].source_mode`, `source_documents[].title`, `kssb_areas[].area_id`, `kssb_areas[].items`
  (및 같은 성격의 `kssb_areas[].area_name`).
- 현 환경처럼 `jsonschema`가 미설치인 상태에서 schema-invalid findings가 validator CLI를 error 없이 통과할 수 있어,
  Cycle 2E에서 이 검증기를 preflight gate로 신뢰하기 전 보강이 필요하다는 조건.

## 3. 참고한 최소 진입 문서와 자율 탐색한 주요 파일

**최소 진입 문서**
- `docs/reviews/codex_cycle2d_validation_review.md` — Major 지적·Next-Step Readiness 조건.
- `docs/current_status.md` — Cycle 2D 상태.
- `docs/templates/CYCLE_COMPLETION_REPORT_TEMPLATE.md` — 완료 보고 구조.

**자율 탐색한 주요 파일**
- `src/validators/kssb_findings_validator.py` — 보강 대상.
- `src/schemas/kssb_findings.schema.json` — required 구조(source_documents items required: source_id·title·source_mode;
  kssb_areas items required: area_id·area_name·items(minItems 1); finding_item required: item_id·requirement_title·judgment_code·judgment_label) 확인.
- `src/schemas/kssb_findings_example.json` — valid 기준 입력.
- `tests/test_findings_validator.py`, `tests/smoke_test_renderer.py` — 테스트 구조.
- `src/validators/README.md` — 규칙 서술 정합.

## 4. 수정한 파일

- `src/validators/kssb_findings_validator.py`
  - `_check_source_modes`: `title` 필수 존재 검사 추가, `source_mode`를 **누락 시 error**(기존은 값이 있을 때 mismatch만 검사).
  - `_check_area_structure`(신규): `kssb_areas[].area_id`·`area_name`·`items`(list·최소 1개) 검사, items 내 비-dict 항목 감지.
  - `_check_items`: 핵심 필드 검사에 `judgment_label` 추가.
  - `validate_findings`에 `_check_area_structure` 호출 배선. 모듈 docstring 규칙 1 문구 현행화(중첩 required·fallback 범위 명시).
- `src/validators/README.md`: 규칙 1을 중첩 required 포함으로 갱신하고 "full JSON Schema 대체 아님"을 명시(과대표현 방지).
- `tests/test_findings_validator.py`: fallback 경로 테스트 추가(아래 5절).
- `docs/current_status.md`, `docs/decision_log.md`(D30): Patch 반영.
- `docs/cycle2d_patch_validation_completion_report.md`: 본 완료 보고.

schema/renderer는 **변경하지 않았다**(검증기 국소 보강). schema 구조 변경 없음.

## 5. fallback required structure 보강 내용

`use_jsonschema=False` 경로에서도 다음 누락을 **error**로 감지한다(코드/위치):

| 대상 | error code | 위치 |
|---|---|---|
| source_documents[].title 누락 | `source_doc.title` | `source_documents[i].title` |
| source_documents[].source_mode 누락 | `source_doc.source_mode` | `source_documents[i].source_mode` |
| kssb_areas[].area_id 누락 | `area.area_id` | `kssb_areas[i].area_id` |
| kssb_areas[].area_name 누락 | `area.area_name` | `kssb_areas[i].area_name` |
| kssb_areas[].items 누락/빈 배열 | `area.items` | `kssb_areas[i].items` |
| finding_item.judgment_label 누락 | `item.field` | `kssb_areas[i].items[j].judgment_label` |
| area/item 비-객체 | `area.type` / `item.type` | 해당 위치 |

- 기존 규칙(source_id cross-reference, source_mode mismatch, label↔mode 정합, source-bound 조건부, 빈 quote,
  customer_questions 6필드, 금지 표현, 내부 경로)은 그대로 유지된다.
- 보강은 **핵심 required 구조**에 한정하며 full JSON Schema 제약을 모두 재현하지 않는다(docstring·README 명시).
- 전부 detect-only — findings를 변경하지 않는다.

## 6. 추가/수정한 테스트

`tests/test_findings_validator.py`에 fallback 경로용 `codes_fallback()` 헬퍼와 다음 케이스를 추가(총 12건 → **19건**):

- valid example이 fallback 모드에서도 error 0건 유지.
- `source_documents[].title` 누락 시 `source_doc.title` 검출.
- `source_documents[].source_mode` 누락 시 `source_doc.source_mode` 검출.
- `kssb_areas[].area_id` 누락 시 `area.area_id` 검출.
- `kssb_areas[].area_name` 누락 시 `area.area_name` 검출.
- `kssb_areas[].items` 누락 시 `area.items` 검출.
- `finding_item.judgment_label` 누락 시 `item.field` 검출.
- 기존 detect-only(입력 미변경) 케이스 유지.

## 7. Preflight Check 결과

- schema JSON / example JSON 문법(`python -m json.tool`) — OK.
- validator CLI example 실행 — error 0건, warning 0건, info 1건(jsonschema 미설치 안내), RC 0.
- validator 테스트(`tests/test_findings_validator.py`) — **19/19 PASS**.
- renderer smoke 테스트(`tests/smoke_test_renderer.py`) — **22/22 PASS**(기존과 동일 통과).
- 새 외부 의존성·의존성 매니페스트 부재 확인(`requirements*.txt`·`pyproject.toml`·`setup.py`·`Pipfile`·`package.json` 없음),
  검증기 import는 표준 라이브러리만.
- 변경 범위가 Cycle 2D Patch 목적(fallback required 보강)을 벗어나지 않음 확인.

최종 PASS/FAIL은 작성하지 않는다(최종 검증은 Codex가 수행).

## 8. 금지 작업 미수행 확인

- `jsonschema` 설치 — 미수행(선택 import 유지, 미설치 시 info만).
- 외부 패키지 추가 — 미수행.
- schema 구조 변경 — 미수행(명백한 문서 정합성 외 수정 없음).
- renderer 수정 — 미수행(테스트 경로 정합을 위한 수정도 불필요했음).
- Hook/MCP 추가, OCR/문서 파싱, 샘플 PDF 분석, submission.zip 생성, 로그 제출 방식 확정, Cycle 2E 상세 계획 — 모두 미수행.
- 검증기 detect-only 유지 — findings 자동 수정·보강 없음.

## 9. 남은 보류사항

- `jsonschema` 기반 full schema validation은 새 의존성 금지로 미수행(설치 시에만 선택 활성). 이번 보강은 핵심 required 구조에 한정.
- quote 인용 실재성(입력 원문 일치) 자동 검증은 범위 밖 → 사람 검수 유지.
- 렌더러·검증기를 Skill 절차에 실제 배선, 실제 샘플(PDF/OCR) 실행·submission.zip 패키징·로그 원본 제출 방식 — 보류.

## 10. GitHub push 상태

- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- commit message: `fix: strengthen validator fallback required checks`
- 최종 commit SHA는 본 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.

## 11. ChatGPT 확인 대기

- 다음 단계는 **Codex Cycle 2D Patch Review**이며, 착수 여부는 ChatGPT/사용자 확인 후 진행한다.
