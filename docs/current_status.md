# 현재 상태 (Current Status)

## 현재 Cycle
- **Cycle 2D** — findings·렌더러 산출물에 대한 **경량 결정적 검증/가드레일** 추가(validation/guardrail only).
  검증기는 detect-only(재판정·findings 보정 없음). OCR·PDF 파싱·Hook/MCP·submission.zip 없음.

## Cycle 2D 완료 작업
- 검증기: `src/validators/kssb_findings_validator.py`(표준 라이브러리만, `jsonschema`는 있으면 선택 사용).
  구조 필수 필드, `source_id` cross-reference, review_mode↔source_mode↔judgment_label 정합,
  source-bound 조건부 규칙, evidence quote 빈값, customer_questions 필수 6필드, 금지 표현 스캔(고지·경계 필드 제외),
  내부 경로 노출 스캔을 **감지·보고만** 한다(findings 미변경).
- 보조 문서: `src/validators/README.md`(detect-only 경계·규칙·사용).
- 재사용 테스트: `tests/smoke_test_renderer.py`(렌더러 스모크, 출력은 repo 밖 임시 폴더), `tests/test_findings_validator.py`
  (valid example error 0건 + 손상 사본에서 기대 코드 검출), `tests/README.md`. 새 pytest 의존성 없음.
- 문서 정리(Codex Cycle 2C Renderer Review Minor): `report_template.md`의 "렌더러 미구현" 문구를 현행화,
  `completion_checklist.md` 질문 항목에 관련근거 추가(6필드 정합).
- Preflight: schema/example JSON 문법 OK, 검증기 example RC0, 렌더러 스모크 22/22 PASS, 검증기 테스트 12/12 PASS,
  새 외부 의존성·의존성 매니페스트 없음.
- 완료 보고: `docs/cycle2d_validation_completion_report.md`.

## 이전 Cycle: Cycle 2C 완료 작업
- Codex Cycle 2C Renderer Review **PASS**(`docs/reviews/codex_cycle2c_renderer_review.md`).
- 렌더러: `src/renderers/kssb_report_renderer.py`(Python 표준 라이브러리만, 외부 의존 0).
  findings JSON을 읽어 stdlib `zipfile` OOXML DOCX와 self-contained HTML fallback을 결정적으로 생성.
  판정·근거·질문·권고를 **재계산하지 않고** 형식 변환(정렬·표·escape·sanitize·안전 오류)만 수행.
- 보조 문서: `src/renderers/README.md`(렌더러=Skill 워크플로우의 내부 형식 변환기 포지셔닝, 산출물 커밋 정책).
- 스모크 테스트(example JSON): schema/example JSON 문법, DOCX 생성·zip 무결성·내부 XML 파싱, HTML 핵심 섹션 포함,
  결정성(동일 바이트), 파일명 규칙, 재판정 금지(출력 판정 라벨=입력 라벨), 누락 필드 안전 처리 — **33건 전부 PASS**.
- `.gitignore`에 렌더러 산출물(`*_KSSB_공시근거_사전검토보고서.docx/.html`, `build/`, `out/`) 제외 추가.
- 완료 보고: `docs/cycle2c_renderer_completion_report.md`.
- **생성 DOCX/HTML은 커밋하지 않음**(스모크 출력은 repo 밖 임시 폴더에 생성).

## 이전 Cycle
- **Cycle 2B (+ Patch)** — Findings Schema Contract 확정 후 Codex Schema Review(CONDITIONAL PASS) Major 지적 보정.
  Codex Cycle 2B Patch Review **PASS**(`docs/reviews/codex_cycle2b_patch_review.md`). 렌더러·validator 코드·Hook/MCP·샘플 실행 없음.

## Cycle 2B Patch (Codex Schema Review 대응)
- Codex 판정: **CONDITIONAL PASS**(`docs/reviews/codex_cycle2b_schema_review.md`).
- Major 해소: `customer_question` 스키마 계약을 질문 규칙·보고서 템플릿과 정합 — `related_evidence`·`follow_up_action` 필드 추가 + 실무 필드 필수화.
- 갱신: schema/example/contract, customer_question_rules·completion_checklist 정합 보강. 완료 보고 `docs/cycle2b_patch_completion_report.md`.
- Minor(수동 검증 규칙: source_id cross-ref·모드↔라벨 정합 등)는 이미 계약 문서에 명시. 향후 경량 검증 단계에서 우선 처리(보류).

## 사이클 이력 (요약)
- **Cycle 1** — Skill-first Codex 플러그인 1차 골격. Codex 독립 리뷰 **PASS**(`docs/reviews/codex_cycle1_independent_review.md`). Minor: submission.zip 원본 로그 포함.
- **Cycle 2A** — 구현 계획 수립(planning-only). Codex Planning Review **PASS**(`docs/reviews/codex_cycle2a_planning_review.md`). Minor: 로그 포함 방식 확정(제출 단계), current_status·decision_log 잔여 Cycle 1 문구 정리.
- **Cycle 2B** — 본 사이클. 구조화 findings 데이터 계약 확정.

## Cycle 2B 완료 작업
- Findings 스키마: `src/schemas/kssb_findings.schema.json`(JSON Schema draft-07, 외부 의존 0). `judgment_code`별 source-bound 필수 조건을 `if/then`으로 강제.
- 예시 findings: `src/schemas/kssb_findings_example.json`(가상 공개 보고서, 4대 영역, 판정 5종 포함, 실제 기업·파일명 미사용).
- 계약 문서: `docs/findings_schema_contract.md`(생성/소비 주체, 렌더러 재판정 금지, review_mode, judgment_code↔label, source-bound 규칙, 수동 검증 규칙).
- Skill 문서 최소 정합성 보정: `SKILL.md`, `report_template.md`, `completion_checklist.md`(findings-first 흐름·렌더러 재판정 금지·근거 앵커 필수·확인 불가→질문 반영).
- current_status·decision_log 정리(Codex Cycle 2A Minor 반영).
- **렌더러/validator 코드·Hook/MCP·샘플 PDF·Python 코드 복사 없음.**

## 문서 템플릿 정비 (Cycle 2B 이후)
- 반복 사용 양식 추가: `docs/reviews/REVIEW_REPORT_TEMPLATE.md`(공통 리뷰 보고 형식),
  `docs/templates/`(완료보고·Codex 리뷰 프롬프트·Claude Code 작업 프롬프트·Preflight 체크리스트·decision log 항목·README).
- 향후 Codex 리뷰는 `REVIEW_REPORT_TEMPLATE.md`를 참고하는 **짧은 프롬프트 방식**으로 전환.
- 완료 보고: `docs/template_system_completion_report.md`.
- **Cycle 2B schema/example/contract 및 Skill 문서는 수정하지 않음(검증 대기).**

## 미완료 / 이후 사이클 (의도적 제외)
- 인용 실재성(quote가 실제 입력 자료 원문인지)은 자동 검출 불가 → 사람 검수 유지(경량 검증 밖).
- 렌더러·검증기를 Skill 절차에 실제 배선(호출 지점 확정)·산업별 지표 확장.
- 실제 샘플(PDF/OCR/문서 파싱) 실행·submission.zip 패키징.
- Hook/MCP는 하드 요건 확정 시에만 재검토.

## 보류 (확정하지 않음)
- **logs 원본 제출 방식**: repo 커밋 vs submission.zip 번들만 — **제출 패키징 단계에서 결정**(현재 미확정).
- 렌더러 코드 도입 위치·시점, 참고 엔진 재구현 범위.

## GitHub / 검증 상태
- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin (owner `WonJong0920`, branch `main`).
- Cycle 2D 검증/가드레일 push 후 **ChatGPT 확인 대기**. 다음 단계는 Codex Cycle 2D Validation Review.
- 최종 검증·PASS/FAIL 판정은 **Codex**가 수행한다. 검증 기준은 `docs/validation_criteria.md` 참조.
- 최종 commit SHA는 자기참조 문제로 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.
