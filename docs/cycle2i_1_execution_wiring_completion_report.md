# Cycle 2I-1 완료 보고 — Execution Wiring / Output Separation / Representative Document Generation

## 1. 작업 목적

baseline(2I-0)에서 확인된 다음 문제를 줄인다: (1) 실행 로그와 사용자-facing 보고서 혼합, (2) 로컬 경로·임시경로·스크립트 로그 노출,
(3) DOCX/HTML/Markdown 대표 문서 미보장, (4) findings→validator→renderer 미배선, (5) 산출물 경로/전달 계약 불명확.
핵심 산출은 **사용자-facing 최종 보고와 내부 실행 로그를 분리**하고 **대표 문서 파일을 생성·반환**하는 흐름을 구현하는 것이다.

## 2. 변경 요약

- **전달 배선기 신설**: `src/renderers/kssb_report_delivery.py` — findings → **validator preflight(detect-only)** → **renderer(재판정 없음)** → **사용자-facing 요약** 배선. 기존 renderer/validator를 재사용하며 새 외부 의존성 없음(표준 라이브러리).
- **로그/사용자 분리**: `deliver()`가 `user_summary`(안전)와 `outputs`/`preflight.issues`/`internal_notes`(내부)를 **분리 반환**. CLI는 stdout=요약, `--debug`=stderr=내부 상세.
- **대표 문서 우선순위·Markdown fallback**: renderer에 `render_markdown()` 추가, `render_report()`가 **DOCX→HTML→Markdown**을 모두 생성하고 `primary`/`primary_format`을 지정. DOCX 실패 시에도 HTML/Markdown fallback 보장.
- **경로 비노출**: 사용자 요약의 경로는 repo-relative 또는 파일명만(`_display_path`) + 2차 redaction(`_redact`)으로 로컬 절대경로·계정명·임시경로 비노출.
- **테스트·정책**: `tests/test_delivery_wiring.py`(24건) 신설, `.gitignore`에 `.md` 산출물 제외 추가.

## 3. 수정 파일

**신규**
- `src/renderers/kssb_report_delivery.py` — 전달 배선기(내부 구성요소).
- `tests/test_delivery_wiring.py` — end-to-end 전달 배선 스모크.
- `docs/cycle2i_1_execution_wiring_completion_report.md` — 본 완료 보고.

**수정**
- `src/renderers/kssb_report_renderer.py` — `render_markdown()` 추가, `render_report()`에 `markdown`/`primary`/`primary_format` 키·Markdown 생성·대표 문서 선정 추가, `_main` 출력에 Markdown/primary 반영.
- `.gitignore` — `*_KSSB_공시근거_사전검토보고서.md` 제외 추가.
- `docs/workflow_usage.md` — "전달 계약(Delivery contract)" 절 추가, 내부/검증용 실행·산출물 정책 현행화.
- `docs/current_status.md`, `docs/decision_log.md`(D41) — Cycle 2I-1 반영.

**변경하지 않음**: validator 로직, schema, manifest, marketplace, Skill 판정 절차(코드 아님).

## 4. 구현 방식 판단 근거

- **기존 구조 재사용·최소 변경**: renderer는 이미 DOCX+HTML을 stdlib로 결정적 생성하므로, 파이프라인을 재작성하지 않고 **얇은 배선기**로 validator+renderer를 잇고 사용자 요약만 새로 만들었다. Markdown은 renderer에 소량 추가.
- **DOCX 우선, 그러나 항상 대표 문서 보장**: DOCX 생성이 제한돼도 HTML/Markdown이 항상 있으므로 "대표 문서 미생성" 문제가 구조적으로 사라진다.
- **로그 분리를 배선기 책임으로**: renderer는 형식 변환, validator는 detect-only라는 경계를 지키기 위해, 사용자/내부 출력 분리는 **배선기**가 담당한다(책임 혼합 회피).
- **경로 노출 2중 방어**: 표시 경로 sanitize(파일명/상대경로) + redaction 정규식.

## 5. 생성/보장되는 대표 산출물

- 파일명 계약: `<보고서명>_KSSB_공시근거_사전검토보고서.{docx|html|md}`.
- 우선순위: **DOCX(1) → HTML(2) → Markdown(3)**. `render_report()` 결과에 `primary`(대표 문서 경로)·`primary_format` 포함.
- 사용자 요약에는 대표 문서 **파일명 + 표시 경로**, fallback 파일명, preflight 건수, 사람 검수 고지, 감사·인증·준수 대체 아님 경계 고지가 노출된다.

## 6. 로그/경로 비노출 처리

- 사용자 요약(stdout)에는 내부 명령 로그·스크립트 전문·stack trace·validator raw location(`kssb_areas[...]`)·로컬 절대경로·계정명·임시 폴더 경로가 **포함되지 않는다**(테스트로 확인).
- 내부 상세(전체 경로·validator 이슈·docx 오류)는 `--debug` 시 **stderr로만** 출력하며, **로그 파일은 기본 생성하지 않는다**(민감 경로 영속 회피). 생성 문서·향후 로그는 `.gitignore` 산출물 정책상 커밋 대상 아님.

## 7. validator / renderer 경계 유지 여부

- **validator**: detect-only 유지 — `validate_findings()`가 Issue 목록만 반환하고 findings를 변경하지 않음(테스트 `detect-only(입력 findings 미변경)` PASS).
- **renderer**: 재판정 없음 유지 — `render_markdown()`도 findings의 `judgment_label` 등을 그대로 소비. 출력 판정 라벨 집합 = 입력 라벨 집합(테스트 PASS). 없는 근거 생성·확인 불가의 미공시/부적합 단정 없음.
- **배선기**: 판정·근거·질문·권고를 만들지 않음(형식 변환·요약·경로 sanitize만).

## 8. 실행한 검증

- `python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json` → error 0, RC 0.
- `python tests/smoke_test_renderer.py` → **22/22 PASS**.
- `python tests/test_findings_validator.py` → **19/19 PASS**.
- `python tests/test_delivery_wiring.py` → **24/24 PASS**(대표 문서 3종 생성·zip/OOXML·Markdown 섹션·파일명 규칙·재판정 없음·detect-only·사용자 요약 안전 불변식).
- 전달 CLI 수동 실행: stdout=사용자 요약만, 로컬 절대경로/계정/`/tmp` 미노출 확인. repo에 생성 산출물 미유입(`git status`) 확인.

## 9. 검증 결과

- 위 모든 검증 PASS. 대표 문서(DOCX 우선) 생성·경로 반환·로그 분리·경계 고지가 확인됨.

## 10. 실행하지 못한 검증과 이유

- **실제 PDF(HFG/K-water) 재실행·인테이크 품질 검증**: 이번 범위 밖(2I-3). PDF 재실행·OCR·Kordoc 사용은 지시상 금지.
- **MS Word GUI 실제 열기**: 미수행. zip 무결성·OOXML XML 파싱으로 대체(기존 렌더러와 동일 기준).
- **`jsonschema` full validation**: 미설치(설치 금지). 표준 라이브러리 검증기로 대체.

## 11. 남은 리스크

- 사용자 요약의 안전성은 배선기 경로에서만 보장된다. Skill이 배선기를 우회해 직접 요약을 만들면 로그·경로 노출이 재발할 수 있음 → Skill 문서/절차에서 배선기 경로 사용을 권장(2I-2 문서 정합에서 보강 여지).
- findings 입력 값 자체에 로컬 경로가 들어오면(예: source title에 경로) 사용자 요약에는 반영되지 않지만 대표 문서 본문에는 남을 수 있음 → 인테이크/입력 검증 단계(2I-3, validator 입력 스캔) 과제.
- 실제 PDF 인테이크·표 수치 복원 문제는 미해결(2I-3/2I-3A).

## 12. 다음 단계 제안

- **2I-2 표현 품질**: 내부 코드명→한글 항목명 우선 표기, 원문 인용·페이지/섹션 위치 단서 강화, 질문 요청자료 구체화. Skill 문서에 배선기 기반 산출 흐름 명시.
- **2I-3 / 2I-3A**: PDF 인테이크·표/OCR fallback 설계 및 Kordoc feasibility spike(사용자 승인·로컬·미설치 조건).
- 착수 여부·순서는 ChatGPT/사용자 확인 후.
