# 의사결정 기록 (Decision Log) — Cycle 1 ~ 2F

> 사이클별 섹션: Cycle 1(D1~D10) → Cycle 2A 방향성(D11~D15) → Cycle 2B(D16~D21) → Cycle 2C(D22~D25) → Cycle 2D(D26~D29) → Cycle 2D Patch(D30) → Cycle 2E(D31) → Cycle 2F(D32).

## Cycle 1 결정 (D1~D10)

## D1. Skill-first 구조 채택
- **결정**: 사용자-facing 본체를 Codex Skill로 두고 Python 실행 엔진을 신규 repo에 포함하지 않는다.
- **이유**: Cycle 1 목표가 Skill-first 골격이며, 일반 사용자가 Python 런타임을 의식하지 않아야 한다.
- **대안**: 기존 Python 파이프라인 이식 → 기각(CLI 회귀·복잡도·범위 초과).
- **보류**: 결정적 검증 엔진(regression engine)은 이후 사이클에서 필요 시 재검토.

## D2. plugin.json 최소 구성
- **결정**: `name`/`version`/`description`/`skills` 4개 필드만 사용.
- **이유**: 기존 1차 작업물이 실제로 채택·검증한 보수적 최소 구성. 불확실한 필드 임의 추가 지양.
- **대안**: manifest에 hooks/commands/mcp 등 추가 → 기각(Cycle 1 Hook/MCP 미추가 원칙, 불확실 필드 회피).

## D3. 판정 라벨: 한국어 라벨 세트 + 모드 분리
- **결정**: 사용자-facing 라벨을 지시서 §10의 한국어 라벨로 하고, 실제/공개자료 두 모드 세트를 둔다.
  내부 enum(SUPPORTED 등)은 매핑으로만 문서화하고 노출하지 않는다.
- **이유**: 감사·인증처럼 보이는 표현 회피 + 해커톤 공개자료 검증 모드 지원.
- **대안**: 내부 enum 그대로 노출 → 기각(사용자 친화성·경계 표현).

## D4. reference/python_engine 은 문서만
- **결정**: `src/reference/python_engine/`에 코드 없이 README만 배치. 기존 코드 복사·이동 없음.
- **이유**: 무비판적 복사 금지, Python CLI 회귀 방지, 원본 read-only 유지.
- **대안**: 코드 일부 복사 → 기각(원본 수정/회귀 리스크). **리스크**: 향후 엔진 필요 시 재도입 비용 → 위치를 문서화해 완화.

## D5. 산출물 대표 문서 1개 원칙
- **결정**: 기본 흐름 산출물은 `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(fallback `.html`) 1개.
  JSON/CSV/manifest/`_검토근거`는 기본 산출물에서 제외(내부 개발/검증용 가능성만 명시).
- **이유**: 사용자 혼란 방지, delivery contract 계승.
- **대안**: 검토근거 세트 기본 동봉 → 기각(Cycle 1 정책 위반).

## D6. Cycle 1에서 DOCX/HTML 생성 코드 미구현
- **결정**: 실제 파일 생성 코드는 만들지 않고 템플릿·출력 정책만 문서화.
- **이유**: Cycle 1 범위 명시(코드 미구현). 이후 사이클 과제.

## D7. 샘플 고객사 미정
- **결정**: 샘플 고객사를 임의 선정하지 않고, 해커톤 검증은 공개자료 모드로 문서화만 한다.
- **이유**: 지시서 금지사항. 임의 데이터 반입 지양.

## D8. Hook/MCP 미추가
- **결정**: Cycle 1에서 Hook 파일·hooks 설정·MCP 서버·`.mcp.json`을 추가하지 않는다.
- **이유**: 지시서 범위·금지사항.

## D9. 기존 log-hooks 폴더 처리
- **관찰**: 신규 작업 루트에 이미 `log-hooks/`(`.claude/settings.json`, `.codex/hooks.json`, `tools/save_log.py`)가
  존재했다(Claude Code가 생성한 것이 아니라 사전 존재하는 세션 로깅 인프라).
- **결정**: 이 폴더를 수정·확장하지 않고 그대로 둔다. Codex 플러그인(`src/`)의 일부로 취급하지 않으며,
  플러그인 Hook로 편입하지 않는다. `.gitignore`에서 제외(커밋 대상 아님)하여 플러그인 산출물과 분리한다.
- **이유**: "Hook 추가 금지"는 신규 추가를 의미하며, 사전 존재 로깅 인프라를 플러그인에 편입하면 경계가 흐려진다.
- **리스크**: 없음(플러그인 실행과 무관한 세션 로깅 유틸리티).

## D10. 최종 검증 역할 분리
- **결정**: Claude Code는 Preflight Check(누락 방지 최소 점검)만 수행하고 최종 PASS/FAIL을 판정하지 않는다.
- **이유**: 지시서 역할 분리. 최종 검증·판정은 Codex가 수행.

---

# Cycle 2A 방향성 결정 (비확정 제안 — 사용자 승인 전)

> Cycle 2A는 계획 수립만 수행한다. 아래는 구현 계획의 **권장 방향**이며 **승인 전 확정이 아니다.**
> 상세·대안·장단점은 `docs/planning/cycle2_implementation_plan.md` 참조.

## D11. 생성 아키텍처: 구조화 findings + 얇은 렌더러 (지향)
- **제안**: Skill(판단) → 구조화 findings 중간산출 → 얇은 결정적 렌더러(재판정 없음)로 대표 문서 생성.
- **이유**: Skill-first 유지하면서 결정적·유효 산출 확보. 대안 2A(모델 직접 DOCX 출력)는 DOCX 이진 특성상 비신뢰, 2C(전체 이식)는 CLI 회귀 → 기각 지향.

## D12. DOCX = stdlib OOXML, HTML fallback (지향)
- **제안**: DOCX는 표준 라이브러리 `zipfile` OOXML 수동 조립(참고 docx_report.py 설계 근거, 외부 의존 0), HTML은 동일 findings 파생 fallback.
- **이유**: 외부 설치 부담 없음, Word open failure 자산 계승, 결정적. `python-docx`는 설치부담으로 회피 지향.

## D13. 참고 엔진: 설계 계승·무복사 (지향)
- **제안**: 코드 축자 복사 없이 설계·경화 스니펫을 신규 스키마에 맞게 재구현. 코드 도입 자체는 승인 후.

## D14. Hook/MCP-free 유지 (지향)
- **제안**: 제출까지 Hook/MCP 미도입. 지속형 변환/OCR·외부 지식베이스가 하드 요건일 때만 MCP 재검토. 로그 요건은 패키징 시 원본 로그 보존으로 충족.

## D15. 로그 원본 제출 대응
- **제안**: `logs/`에 패키징 시점 원본 로그 배치. repo 커밋 vs zip 번들만은 민감내용 여부로 결정(보류). `log-hooks/tools/save_log.py`의 Hook 편입은 금지, 수동 활용은 보류.

---

# Cycle 2B 결정 (D16~) — Findings Schema Contract 확정

## D16. judgment_code / judgment_label 분리
- **결정**: 기계 판정 코드 `judgment_code`(5종 enum)와 사용자-facing 한국어 `judgment_label`을 스키마에서 분리. 렌더러·검증은 code를 소비, 표기는 review_mode에 맞는 label.
- **이유**: 라벨 문구가 모드별로 달라도 내부 로직은 안정 키로 처리. 금지 판정명은 label enum에서 원천 차단.
- **대안**: 라벨만 사용 → 기각(문구 변화에 로직 취약).

## D17. Source-bound 규칙을 스키마 조건부로 강제
- **결정**: JSON Schema `allOf`+`if/then`으로 판정별 필수 조건 인코딩 — confirmed/partial→`evidence_anchors`≥1, not_verifiable→`missing_info`+`customer_questions`, conflict→`human_review_required`+note, out_of_scope→`missing_info`. `quote`는 minLength 1.
- **이유**: 근거 없는 확인·질문 미연결 확인불가를 계약 수준에서 차단(참고 `validate_outputs.py` 원칙 계승).
- **한계**: cross-reference(`source_id` 참조), 인용 실재성, 모드↔라벨 정합은 JSON Schema로 미표현 → `findings_schema_contract.md`에 **수동 검증 규칙**으로 명시.

## D18. missing_info 역할 확장 / priority 코드화
- **결정**: `missing_info`(문자열 배열)를 not_verifiable의 부족정보뿐 아니라 out_of_scope의 적용 제외 사유까지 담는 단일 사유 필드로 정의. `customer_questions[].priority`는 `high/medium/low` 코드.
- **이유**: 판정별 사유의 일관된 표현·안정성. 조정 사유는 `findings_schema_contract.md`에 기록.

## D19. 외부 런타임 의존 미추가
- **결정**: 스키마 파일 자체만 작성. jsonschema 등 검증 라이브러리·validator 코드·렌더러 코드 미도입. 문법 검사는 `python -m json.tool`로 수행.
- **이유**: 이번 사이클은 계약 확정 범위. 검증 자동화는 승인 후.

---

# 문서 워크플로우 결정 (D20~)

## D20. 반복 문서 양식 템플릿화
- **Date**: 2026-07-01
- **Context**: Codex 리뷰·완료 보고·작업 지시를 매번 긴 형식으로 반복 지시해 프롬프트가 과도하게 길어짐.
- **Decision**: 공통 리뷰 보고 형식(`docs/reviews/REVIEW_REPORT_TEMPLATE.md`)과 반복 산출물 양식(`docs/templates/`: 완료보고·Codex 리뷰 프롬프트·Claude Code 작업 프롬프트·Preflight 체크리스트·decision log 항목·README)을 repo에 추가. 향후 Codex 리뷰는 REVIEW_REPORT_TEMPLATE.md를 참고하는 짧은 프롬프트로 전환.
- **Rationale**: 형식 반복 제거, 사이클 간 일관성 확보, 제품 경계·Source-bound·사람 검수 경계 점검 누락 방지.
- **Alternatives Considered**: 프롬프트에 형식 인라인 반복 → 기각(장황·불일치). 과다 템플릿 생성 → 지양(실제 반복 사용되는 양식만 작성).
- **Consequences**: 이후 작업/리뷰 프롬프트가 짧아짐. 템플릿은 양식일 뿐 특정 Cycle에 비종속.
- **Status**: 확정.
- **Related Files / Reviews**: `docs/reviews/REVIEW_REPORT_TEMPLATE.md`, `docs/templates/*`, `docs/template_system_completion_report.md`.

## D21. customer_question 계약 강화 (Codex 2B Major 대응)
- **Date**: 2026-07-01
- **Context**: Codex Cycle 2B Schema Review(CONDITIONAL PASS) Major — `customer_question` 스키마 계약이 `customer_question_rules.md`·`report_template.md`의 질문 열보다 약함(`question`만 필수, 관련근거·후속조치 필드 없음). 렌더러가 질문 열을 안정적으로 렌더 못 할 리스크.
- **Decision**: `customer_question`에 `related_evidence`(관련근거)·`follow_up_action`(후속조치) 추가, `reason`·`related_evidence`·`priority`·`requested_material`·`follow_up_action`을 필수화(모두 minLength 1, related_evidence는 "해당 없음" 허용). example 4개 질문·contract·customer_question_rules·completion_checklist 정합.
- **Rationale**: 문서(질문 규칙·보고서 템플릿)를 source of truth로 삼아 스키마를 그에 맞춰 강화 — 스키마 방향성·Skill-first·재판정 금지·Source-bound 원칙 유지하며 렌더러 입력 안정성 확보.
- **Alternatives Considered**: (a) 필드 선택 유지 + 렌더러가 누락 표시 → 기각(계약 약화 지속, report_template과 불일치). (b) 질문 규칙 문서를 스키마 수준으로 약화 → 기각(Source-bound·실무성 약화).
- **Consequences**: schema-valid findings는 항상 질문 6필드를 보유. 항목ID·항목명은 상위 finding_item에서 파생(질문 객체에 중복 안 둠).
- **Status**: 확정.
- **Related Files / Reviews**: `src/schemas/kssb_findings.schema.json`, `src/schemas/kssb_findings_example.json`, `docs/findings_schema_contract.md`, `docs/reviews/codex_cycle2b_schema_review.md`.

---

# Cycle 2C 결정 (D22~) — 최소 findings 렌더러 구현

## D22. 렌더러 코드 위치·경계
- **Date**: 2026-07-02
- **Context**: Cycle 2A에서 지향(미확정)했던 "얇은 stdlib 렌더러"를 Codex Cycle 2B Patch Review PASS 이후 실제 구현.
- **Decision**: 렌더러를 `src/renderers/kssb_report_renderer.py`에 두고, `src/renderers/README.md`로
  "Skill 워크플로우의 내부 형식 변환기(사용자-facing Python CLI 아님)" 포지셔닝을 명시. renderer only 범위 —
  판정·근거·질문 생성/재계산 없음, validator·OCR·PDF 파싱·Hook/MCP·submission.zip 없음.
- **Rationale**: Skill-first 유지(D1) + 결정적·유효 산출(D11). 사용자 진입점은 Skill 하나, 렌더러는 findings→문서 단계.
- **Alternatives Considered**: 모델이 DOCX 직접 출력(2A) → 기각(이진 OOXML 비신뢰). 참고 파이프라인 전체 이식(2C) → 기각(CLI 회귀).
- **Status**: 확정.
- **Related Files**: `src/renderers/kssb_report_renderer.py`, `src/renderers/README.md`, `docs/cycle2c_renderer_completion_report.md`.

## D23. DOCX = stdlib zipfile OOXML, HTML fallback = 동일 findings 단일 소스
- **Date**: 2026-07-02
- **Decision**: DOCX는 `zipfile`로 OOXML 수동 조립(외부 의존 0). XML escape + 금지 제어문자(XML 1.0 invalid) 제거로
  Word open 실패 예방, ZIP 엔트리 순서·타임스탬프·core.xml 날짜 고정으로 **결정적 출력**. HTML fallback은 동일 findings에서
  파생하는 self-contained 파일이며 서로 다른 판정을 내지 않는다. DOCX 조립 실패 시 HTML fallback으로 계속.
- **Rationale**: `python-docx` 설치 부담 회피(D12), 참고 엔진의 Word-open-failure 자산 계승(무복사·신규 구현).
- **Alternatives Considered**: `python-docx` 도입 → 기각(외부 의존·Skill-first 이물감).
- **Status**: 확정.

## D24. 참고 엔진 설계 계승·무복사
- **Date**: 2026-07-02
- **Decision**: 참고 엔진 `docx_report.py`의 stdlib OOXML 조립·`_sanitize_xml_text`·결정적 타임스탬프 **설계 기법만** 계승하고,
  코드는 복사하지 않고 신규 스키마(`kssb_findings.schema.json`)에 맞춰 재구현. 참고 엔진의 `status` enum·`practical_guidance` 결합은 도입하지 않음.
- **Rationale**: D4/D13 계승 — CLI 회귀·결합 유입 방지, 깨끗한 Skill-first 코드베이스.
- **Status**: 확정.

## D25. 렌더러 산출물 커밋 정책
- **Date**: 2026-07-02
- **Decision**: 생성 DOCX/HTML은 **기본 커밋 대상 아님.** 스모크/검증 출력은 repo 밖 임시 폴더에 생성하고,
  `.gitignore`에 `*_KSSB_공시근거_사전검토보고서.docx/.html`·`build/`·`out/`를 추가해 우발적 커밋을 방지.
- **Rationale**: 대표 문서는 findings에서 결정적으로 재생성 가능하므로 repo 비대화·고정 샘플 커밋 회피.
- **Status**: 확정.

---

# Cycle 2D 결정 (D26~) — 경량 검증 / 가드레일

## D26. 경량 검증기 도입(detect-only)
- **Date**: 2026-07-02
- **Context**: `findings_schema_contract.md`가 JSON Schema로 표현 못 한 수동 검증 규칙(source_id cross-ref·모드↔라벨 정합 등)과
  Codex Cycle 2C Renderer Review의 검증 자동화 Minor. 렌더러 소비 전 구조적 위험 사전 감지 필요.
- **Decision**: `src/validators/kssb_findings_validator.py`(표준 라이브러리만)를 추가. 검증기는 findings를 **고치지 않고**
  판정·근거·질문·권고를 만들지 않는다(detect-only). 문제를 발견해 severity/code/location/message로 보고만 한다.
- **Rationale**: Source-bound Analysis·사람 검수 경계를 약화하지 않으면서 계약 위반을 결정적으로 감지. 렌더러의 재판정 금지 원칙 유지.
- **Alternatives Considered**: (a) 렌더러 안에서 검증+자동 보정 → 기각(재판정·findings 변조 위험). (b) `jsonschema` 필수 도입 → 기각(외부 의존).
- **Consequences**: 검증기는 렌더 전 별도 단계. `jsonschema`가 설치돼 있으면 선택적 Draft-07 검증을 추가, 없으면 표준 라이브러리 검증만.
- **Status**: 확정.
- **Related Files**: `src/validators/kssb_findings_validator.py`, `src/validators/README.md`, `docs/findings_schema_contract.md`.

## D27. 금지 표현 스캔의 필드 경계(negation 오탐 방지)
- **Date**: 2026-07-02
- **Context**: 고지(disclaimer)·경계(human_review_boundary)·한계(overall_limitations)·비고(notes)는 "감사·인증·준수를 대체하지 않는다"처럼
  금지 어휘를 **negation 문맥**으로 정상적으로 포함한다. 전체 substring 스캔 시 이 필드들이 오탐된다(Cycle 2C에서 관찰).
- **Decision**: 금지 표현 스캔은 **분석 콘텐츠 필드만** 대상으로 하고 위 고지·경계·한계·notes 필드는 제외. 판정명 단일어(준수/적합/인증/적정)는
  substring 스캔 대신 judgment_label↔mode 정합(D26 규칙)으로 검증. 강한 다어절 표현(`준수 확정`·`인증 의견`·`audit trail` 등)만 콘텐츠 필드에서 스캔.
  금지 표현 목록은 `prohibited_terms.md`의 `## 금지 표현` 섹션에서 파싱해 문서를 단일 소스로 유지.
- **Rationale**: 제품 경계 문구를 유지하면서 실제 위반만 잡는다. 목록 드리프트 방지.
- **Status**: 확정.

## D28. 렌더러 스모크 테스트를 재사용 스크립트로 정리
- **Date**: 2026-07-02
- **Decision**: Cycle 2C의 일회성 스모크를 `tests/smoke_test_renderer.py`·`tests/test_findings_validator.py`(표준 라이브러리만, 출력은
  repo 밖 임시 폴더)로 커밋. 정식 pytest 프레임워크·의존성은 도입하지 않음.
- **Rationale**: Codex 리뷰가 지적한 "reusable test artifact 부재" 해소, Preflight/CI 재현성 확보. 새 외부 의존성 회피.
- **Status**: 확정.

## D29. Cycle 2C 이후 문서 문구 정리(최소)
- **Date**: 2026-07-02
- **Decision**: `report_template.md`의 "실제 DOCX/HTML 생성 코드는 아직 구현하지 않는다" 문구를 현행화(렌더러·검증기 경로 명시),
  `completion_checklist.md` 질문 항목에 관련근거 추가(스키마 6필드 정합). 그 외 계약·스키마는 변경하지 않음.
- **Rationale**: Codex Cycle 2C Renderer Review Minor 해소. 최소 범위 정리.
- **Status**: 확정.

## D30. 표준 라이브러리 fallback의 핵심 required 구조 보강 (Codex 2D Major 대응)
- **Date**: 2026-07-02
- **Context**: Codex Cycle 2D Validation Review(CONDITIONAL PASS) Major — `jsonschema` 미설치 fallback 모드에서
  `source_documents[].title/source_mode`, `kssb_areas[].area_id/area_name/items` 등 schema-required 중첩 구조 누락이
  error로 감지되지 않아, Cycle 2E preflight gate로 신뢰하기 전 보강 필요.
- **Decision**: `_check_source_modes`에 title·source_mode 필수 존재 검사, `_check_area_structure` 신규(area_id·area_name·items),
  `_check_items`에 judgment_label 필수 검사 추가. 전부 detect-only(findings 미변경). full JSON Schema를 재구현하지 않고
  **핵심 required 구조**만 보강하며, 이 한계를 docstring·README에 명시(과대표현 금지).
- **Rationale**: 외부 의존성 없이 유지 원칙과 guardrail 목적을 동시에 만족. schema·renderer는 변경하지 않음(검증기 국소 보강).
- **Alternatives Considered**: (a) `jsonschema` 필수화 → 기각(외부 의존). (b) full 스키마 검증기 자체 구현 → 기각(과범위, 지시상 금지).
- **Consequences**: fallback 모드에서 valid example은 여전히 error 0건, 누락 케이스는 error로 검출. 테스트 19건으로 확장.
- **Status**: 확정.
- **Related Files**: `src/validators/kssb_findings_validator.py`, `src/validators/README.md`, `tests/test_findings_validator.py`, `docs/reviews/codex_cycle2d_validation_review.md`.

---

# Cycle 2E 결정 (D31) — Skill Workflow Wiring / Usage Contract

## D31. 워크플로우를 문서상 사용 계약으로 정합(코드 무변경)
- **Date**: 2026-07-02
- **Context**: 검증기(2D)·렌더러(2C)가 구현됐으나 Skill 문서·README·architecture가 "렌더러 미구현"·Cycle 1 시점 문구 등으로
  현재 흐름과 어긋났다. Codex 2C/2D Minor·보류로 "Skill 절차 실제 배선"이 남아 있었다.
- **Decision**: findings → 검증기 preflight(detect-only) → 렌더러 형식 변환(재판정 없음) → 사람 검수 흐름을 SKILL.md("Workflow" 절),
  README, architecture, completion_checklist에 일관 반영하고, 사용 계약 문서 `docs/workflow_usage.md`를 신설. 검증기·렌더러는
  **내부 구성요소**로 위치시키고 사용자-facing 진입점은 스킬 하나로 유지. **코드(validator/renderer/schema)·테스트는 변경하지 않음.**
- **Rationale**: Skill-first·재판정 금지·detect-only·사람 검수 경계를 문구로 강화하면서 실제 구현 상태와 문서를 정합. 런타임 자동
  배선(Hook/MCP)은 금지 범위이자 하드 요건 미확정이므로 이번엔 **문서상 사용 계약**으로만 wiring.
- **Alternatives Considered**: (a) Hook/MCP로 자동 연결 → 기각(금지·범위 초과). (b) 검증기·렌더러를 사용자 CLI로 노출 → 기각(Skill-first 훼손).
- **Consequences**: 사용자·리뷰어가 단일 흐름과 구성요소 경계를 문서로 확인 가능. 실제 샘플 실행·제출 패키징은 이후 단계.
- **Status**: 확정.
- **Related Files**: `src/skills/samil-kssb-precheck/SKILL.md`, `docs/workflow_usage.md`, `README.md`, `docs/architecture.md`, `src/skills/samil-kssb-precheck/completion_checklist.md`.

---

# Cycle 2F 결정 (D32) — 제출 패키징 정책 / 원본 로그 방식 정리

## D32. 제출 패키징 포함/제외 정책과 로그 방식을 문서로 고정(확정은 제출 단계)
- **Date**: 2026-07-02
- **Context**: 제출 전 단계에서 submission.zip 구성, 원본 AI 대화 로그 포함 방식(Codex Cycle 1 Minor), 샘플 실행 산출물 위치가
  여러 문서에 분산·보류로 남아 있었다. 제출 단계에서 흔들리지 않도록 정책을 한 곳에 정리할 필요.
- **Decision**: `docs/submission_packaging_policy.md`를 신설해 (1) 포함/제외 5분류(A repo+zip / B zip-only 조건부 /
  C 생성 제외 / D 제출 전 재생성·재검증 / E 절대 금지), (2) 로그 원본·무편집 원칙·요약 대체 금지·commit vs zip-only 결정 기준·
  파일명/위치·민감정보 스캔, (3) 샘플 산출물 위치, (4) 최종 preflight checklist를 고정. 기존
  `docs/planning/submission_packaging_checklist.md`는 요약 체크리스트로 포인터 연결.
- **Rationale**: 정책 단일화로 제출 단계 리스크 감소. 이번 사이클은 **정책·기준만** 정리하고 실제 submission.zip·로그·샘플은
  생성/확정하지 않는다(지시 금지사항 준수). 로그 최종 포함 방식은 민감정보 스캔 결과로 제출 단계에서 확정(현 단계 미확정).
- **Alternatives Considered**: (a) 로그 방식 지금 최종 확정 → 기각(민감성 스캔 전·금지사항). (b) 정책을 여러 문서에 분산 유지 → 기각(제출 단계 혼선).
- **Consequences**: 잠정 권장은 로그 zip-only 번들(현 `.gitignore`가 이미 `logs/*` 제외). 생성 DOCX/HTML·샘플 산출물은 기본 미커밋.
- **Status**: 정책 확정, 로그 최종 방식·샘플 zip 포함은 제출 단계 확정(보류).
- **Related Files**: `docs/submission_packaging_policy.md`, `docs/planning/submission_packaging_checklist.md`, `docs/planning/sample_input_policy.md`, `docs/workflow_usage.md`, `.gitignore`.

## 보류 항목(이후 결정)
- 생성 아키텍처·렌더러 코드 위치·도입 시점(승인 후 확정).
- 참고 엔진 재구현 범위.
- DOCX/HTML 실제 생성 구현 및 수동 검증 규칙의 자동화(경량 결정적 검증 단계).
- **로그 원본 제출 방식(repo 커밋 vs submission.zip 번들만)은 제출 패키징 단계에서 확정 — 현재 미확정.**
- OCR·문서 변환 파이프라인, 결정적 검증 엔진 도입.
- 산업별 KSSB 세부 지표 확장.
- (다음 단계는 ChatGPT·사용자 확인 후 결정. 이 문서에서 확정하지 않는다.)
