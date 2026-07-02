# 기존 1차 작업물 검토 보고

## 1. 검토 대상

- 기존 1차 작업물 루트(read-only reference source):
  `D:\PrimeBell\AI_Projects\kssb-evidence-gap-auditor`
- 신규 Cycle 1 작업 루트:
  `[REDACTED_LOCAL_PATH]/Samil KSSB Precheck Plugin` (로컬 절대경로·계정명은 기록하지 않는다)

확인한 주요 파일/폴더:
- `README.md` — 공개자료 기반 KSSB 근거 갭 사전진단 소개, 실행법, 포지셔닝.
- `docs/` — `design_brief.md`, `validation_plan.md`, `dev_workflow.md`, `future_extensions.md`,
  다수의 Codex 리뷰 문서(`codex_*_review.md`), 구현 리포트(`implementation_reports/`).
- `src/.codex-plugin/plugin.json` — 매니페스트(plugin root=`src/`, 필드: name/version/description/skills).
- `src/skills/kssb-evidence-gap-audit/SKILL.md` — 스킬 절차·포지셔닝·산출물 정의.
- `src/references/` — `kssb_public_disclosure_checklist.json`(4개 축 체크리스트),
  `evidence_grading_rules.md`(status enum·근거 앵커), `ocr_policy.md`.
- `src/pipeline/*.py` — 결정적 파이프라인(intake, normalize, gapmatch, reporting, docx_report,
  quality_gate, preflight, user_outputs, output_layout 등).
- `src/validate/validate_outputs.py` — 산출물 QA 게이트(status enum·근거·금지표현 점검).
- `src/examples/outputs/` — golden 산출물(report.md, findings.json, customer_questions.csv,
  evidence_table.csv, manual_review_queue.csv, diagnosis_report.html 등).
- `tests/` — 배송 계약·DOCX XML sanitization·metric04 게이트·출력 레이아웃 테스트.
- `.codex/hooks.json`, `.claude/settings.json`, `tools/save_log.py` — 세션 로깅/훅 설정.

## 2. 재사용할 설계 자산

- **KSSB 항목 구조**: 4개 축(지배구조/전략/위험관리/지표와 목표), KSSB 제1·2호, ISSB S1·S2 정렬.
  gov/strat/risk/metric/target 항목 체계를 신규 카탈로그로 계승.
- **판정 라벨 체계**: `SUPPORTED/PARTIAL/NOT_VERIFIABLE/CONFLICT/OUT_OF_SCOPE` 5분류의 판정 논리를
  신규 한국어 라벨 세트(모드별)로 매핑 계승.
- **보고서 섹션 구성**: 요약 → 상태 요약 → 항목별 결과·근거 → 질문 → 수동검토 구조를 신규 보고서 템플릿에 반영.
- **고객 질문/요청자료 생성 방식**: `customer_questions.csv`의 필드
  (항목ID·항목명·질문·질문사유·관련근거·우선순위·요청자료·후속조치)를 신규 질문 규칙으로 계승.
- **근거 앵커 규칙**: source_id/block_id/quote/heading_path/table_id, "확인" 판정에 근거 필수 원칙 계승.
- **정량 근거 특칙**: metric-04 에너지 사용량의 "수치+에너지 단위" 결합 규칙, 배출량 수치 전용 금지 계승.
- **금지 표현 규칙**: 준수/감사/인증/적정 확정 표현 금지 및 안전 표현 원칙 계승.
- **output delivery 안정화 경험**: delivery contract(plugin/cache 경로 비노출, delivery target 전달) 원칙을
  산출물 정책·아키텍처에 반영.
- **DOCX/Word open failure 경험**: `docx_report.py`의 XML sanitizer·표준 라이브러리 결정적 생성 경험을
  참고 엔진 문서로 기록(Cycle 1에서는 코드 미구현).
- **completion gate / validation 경험**: `validate_outputs.py`의 QA 게이트 개념을 완료 점검 체크리스트와
  검증 기준 문서로 계승(자동 실행 코드는 미포함).

## 3. 신규 Skill-first 구조에서 제외할 요소

- Python CLI 중심 실행(`run_audit.py` 등)을 사용자-facing 본체로 두는 구조.
- 일반 사용자에게 노출되는 Python runtime 의존성(설치·PATH·실행기).
- 기본 사용자 흐름의 JSON/CSV/manifest 산출물.
- `_검토근거` 폴더 기본 생성.
- plugin/cache/sandbox 내부 경로의 사용자-facing 노출.
- OCR 파이프라인(Mistral 어댑터 등) 및 문서 변환(kordoc) 실행.
- 감사·인증·준수 확정처럼 보이는 표현.

## 4. 신규 repo에 반영한 내용

- `src/skills/samil-kssb-precheck/kssb_requirement_catalog.md` ← KSSB 4대 영역 항목 구조.
- `src/skills/samil-kssb-precheck/judgment_schema.md` ← 판정 라벨 체계(모드별 한국어 라벨 + 내부 enum 매핑).
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md` ← 근거 앵커·정량 근거·상충 규칙.
- `src/skills/samil-kssb-precheck/customer_question_rules.md` ← 고객 질문 필드·생성 규칙.
- `src/skills/samil-kssb-precheck/report_template.md` ← 보고서 섹션·출력 정책.
- `src/skills/samil-kssb-precheck/completion_checklist.md` ← QA 게이트 개념의 자기점검 체크리스트.
- `src/skills/samil-kssb-precheck/prohibited_terms.md` ← 금지/권장 표현.
- `src/skills/samil-kssb-precheck/SKILL.md` ← 스킬 절차·근거 기반 분석 원칙·산출물 정책.
- `src/reference/python_engine/README.md` ← 기존 Python 엔진의 참고 위치·역할.
- `docs/architecture.md` ← Skill-first 구조 결정, delivery contract 원칙.

## 5. 반영하지 않은 내용과 이유

| 제외 항목 | 이유 | 향후 검토 가능성 |
|---|---|---|
| Python 파이프라인 코드 | Skill-first 유지, CLI 회귀 방지, 무비판적 복사 금지 | 결정적 검증 엔진 필요 시 재검토 |
| OCR/kordoc 문서 변환 | Cycle 1 범위 밖(문서 변환 실행 미포함) | 이후 사이클 |
| DOCX/HTML 생성 코드 | Cycle 1에서 생성 코드 미구현(템플릿·정책만 문서화) | 이후 사이클 |
| golden 산출물/샘플 데이터 | 샘플 고객사 미정, 임의 데이터 반입 지양 | 공개자료 검증 모드 정식화 시 |
| `.codex/hooks.json`·훅/로깅 | Cycle 1에서 Hook/MCP 미추가 원칙 | 이후 사이클 |
| tests/ | 실행 엔진 미포함이라 대상 없음 | 엔진 도입 시 |

## 6. 기존 Python 구현 관련 판단

- **복사 여부**: 복사하지 않음. 기존 Python 코드를 신규 repo로 가져오지 않았다.
- **이동 여부**: 이동하지 않음. 원본은 `D:\PrimeBell\AI_Projects\kssb-evidence-gap-auditor`에 read-only로 둔다.
- **reference engine 문서화 여부**: `src/reference/python_engine/README.md`에 위치·역할·참고 파일을 문서화했다.
- **사용자-facing 본체 회귀 여부**: 회귀하지 않음. 신규 본체는 Codex Skill이며 Python CLI가 아니다.
  일반 사용자가 Python 설치·PATH·CLI 실행기를 의식하지 않도록 설계했다.
- **원본 수정 여부**: 기존 1차 작업물 원본 파일을 수정하지 않았다(읽기 전용 참고).
