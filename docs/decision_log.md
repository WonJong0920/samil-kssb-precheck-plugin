# 의사결정 기록 (Decision Log) — Cycle 1 ~ 2I

> 사이클별 섹션: Cycle 1(D1~D10) → Cycle 2A 방향성(D11~D15) → Cycle 2B(D16~D21) → Cycle 2C(D22~D25) → Cycle 2D(D26~D29) → Cycle 2D Patch(D30) → Cycle 2E(D31) → Cycle 2F(D32) → Cycle 2G(D33) → Cycle 2G Patch(D34) → Cycle 2H(D35) → 운영 원칙(D36) → Cycle 2H Patch(D37) → Cycle 2H Evidence(D38) → Cycle 2I-0(D39) → Cycle 2I-0 Addendum(D40) → Cycle 2I-1(D41) → Cycle 2I-2(D42) → Cycle 2I-3 계획(D43) → Cycle 2I-3 guardrail(D44) → Cycle 2I-3A 계획(D45).

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

---

# Cycle 2G 결정 (D33) — Codex Marketplace / Local Install Readiness

## D33. 로컬/Repo marketplace 추가 + manifest install-surface metadata 보강(공개 등록 아님)
- **Date**: 2026-07-02
- **Context**: repo가 Codex에서 실제 탐색·설치 가능한 형태에 가까워지도록 marketplace 정의와 manifest install metadata가 필요.
  plugin root가 repo root가 아니라 `src/`라, marketplace `source.path`가 plugin root를 정확히 가리켜야 함.
- **Decision**: (1) `.agents/plugins/marketplace.json`(marketplace root=repo root) 신설, `source.source=local`·`source.path=./src`,
  `plugins[].name=samil-kssb-precheck`(manifest와 정합), `policy=installation: AVAILABLE`/`authentication: NONE`(Skill-only·무인증), `category: Productivity`.
  (2) `src/.codex-plugin/plugin.json`에 `interface`(displayName·shortDescription·longDescription·developerName·category)·`keywords`·`repository` 보강.
  (3) `docs/codex_install_readiness.md` 신설. **Public Plugin Directory 등록·공개 배포가 아님**을 문서·metadata에 명시.
- **Rationale**: 로컬/Repo install readiness 확보. D2의 "보수적 최소 구성"은 **install surface metadata까지 확장**하되 Hook/MCP/apps/assets는 여전히 미추가(불확실·없는 파일 경로 회피). 제품 경계 문구 유지.
- **Alternatives Considered**: (a) `source.path`를 repo root로 → 기각(plugin root는 `src/`). (b) `authentication: ON_INSTALL` → 기각(무인증 플러그인에 인증 단계 오해). (c) assets/logo·defaultPrompt·capabilities 추가 → 보류(없는 파일·불확실 필드 회피).
- **Consequences**: 파일 기반 install readiness 확보. 실제 Codex GUI/CLI 설치 확인은 별도 단계. marketplace 파일은 제출 패키징 A분류(repo 커밋+zip).
- **Status**: 확정(파일 기반). GUI 설치 확인·공개 등록은 범위 밖/보류.
- **정정(D34)**: 위 (b)의 `authentication: NONE` 선택은 marketplace schema 허용값(`ON_INSTALL`/`ON_USE`) 밖이라 **오류였다.** Codex Cycle 2G Review Major에 따라 D34에서 `ON_INSTALL`로 보정했다.
- **Related Files**: `.agents/plugins/marketplace.json`, `src/.codex-plugin/plugin.json`, `docs/codex_install_readiness.md`, `docs/submission_packaging_policy.md`, `README.md`, `docs/architecture.md`.

---

# Cycle 2G Patch 결정 (D34) — Marketplace Authentication 허용값 보정

## D34. `policy.authentication`을 `NONE` → `ON_INSTALL`로 보정 (Codex 2G Major 대응)
- **Date**: 2026-07-02
- **Context**: Codex Cycle 2G Review(CONDITIONAL PASS) Major — `.agents/plugins/marketplace.json`의 `policy.authentication` 값 `NONE`이
  plugin-creator 참조 스펙·Codex manual 예시의 허용값(`ON_INSTALL`/`ON_USE`, 기본 `ON_INSTALL`) 밖이라 install surface에서 거부·설치 실패 위험.
- **Decision**: `authentication`을 `NONE` → **`ON_INSTALL`**로 보정. schema 허용값이자 보수적 기본값이며, 설치 시점 검토/동의 성격에 가깝다.
  실제 외부 자격증명 요구(MCP/hook/토큰)는 추가하지 않는다 — 값만 schema 허용값으로 정렬한다. D33의 NONE 선택을 정정한다.
- **Rationale**: Skill-only·무인증 의도라도 marketplace schema 허용값을 따라야 실제 설치가 가능하다. `ON_USE`보다 `ON_INSTALL`이 보수적 기본값.
- **Alternatives Considered**: (a) `ON_USE` → 기각(사용 시점 인증 성격, 기본값 아님). (b) `authentication` 필드 생략 → 기각(스펙상 policy에 포함 권장·기본값 적용 불확실).
- **Consequences**: install failure 위험 해소. 실제 자격증명 흐름은 없음(값만 정렬). GUI/CLI 설치 확인은 여전히 별도 단계.
- **Status**: 확정. GUI 설치 확인·plugin-creator validator schema 재확인은 보류(환경 의존).
- **Related Files**: `.agents/plugins/marketplace.json`, `docs/codex_install_readiness.md`, `docs/submission_packaging_policy.md`, `docs/current_status.md`, `docs/reviews/codex_cycle2g_marketplace_install_readiness_review.md`.

---

# Cycle 2H 결정 (D35) — User-led Codex Install Verification Kit

## D35. 실제 Codex 설치 확인은 사용자 직접 수행, Claude Code는 검증 kit만 제공
- **Date**: 2026-07-02
- **Context**: Cycle 2G Patch Review PASS 이후 남은 주요 보류사항은 실제 Codex GUI/CLI plugin browser에서 marketplace 표시·설치·활성화·
  새 thread 사용 확인. 그러나 이 확인은 사용자의 로컬 Codex 설정·plugin enabled 상태·계정/앱 상태를 바꿀 수 있다.
- **Decision**: Claude Code는 실제 Codex app/CLI를 **조작하지 않는다.** 대신 사용자가 직접 검증하도록 절차 문서
  `docs/codex_install_verification.md`와 결과 기록 양식 `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`를 제공한다.
  실제 설치 성공을 주장하지 않으며, install readiness·제출 정책 문서에 "사용자 직접 검증 단계"임을 명시한다.
- **Rationale**: 외부 앱/계정 상태 변경은 사용자 환경 종속·비가역 리스크가 있어 에이전트가 대신 수행하면 안 된다. 파일 기반 readiness는
  이미 완료됐으므로, 남은 것은 사용자 확인 절차·evidence 표준화다.
- **Alternatives Considered**: (a) Claude Code가 실제 install/enable 시도 → 기각(외부 상태 변경·금지). (b) 설치 성공을 문서로 단정 → 기각(미검증 주장 금지).
- **Consequences**: evidence 문서는 제출 패키징 B분류(민감정보 스캔 후 repo/zip 결정). install verification FAIL/PARTIAL이면 submission.zip 생성 전 보정.
- **Status**: 확정(문서/양식). 실제 사용자 검증 결과는 evidence로 별도 기록 대기.
- **Related Files**: `docs/codex_install_verification.md`, `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`, `docs/codex_install_readiness.md`, `docs/submission_packaging_policy.md`.

---

# 운영 원칙 결정 (D36) — Operating Principles Lock

## D36. 에이전트 역할 구분·보고 방식을 repo에 고정
- **Date**: 2026-07-02
- **Context**: 여러 Cycle을 거치며 에이전트 간 역할 구분과 보고 방식이 흐려질 위험(작업 수행자가 판정, 검증자가 구현, 장문 채팅 보고로 추적성 저하).
- **Decision**: `AGENTS.md`(루트 요약·진입)와 `docs/operating_principles.md`(상세)를 신설해 역할을 고정 —
  Claude Code=작업 수행자(PASS/FAIL 금지·완료 보고 repo 문서·채팅은 경로/SHA/push만), Codex=독립 검증자(PASS/CONDITIONAL PASS/FAIL·리뷰는 `docs/reviews/`·자율 탐색 필수·채팅은 요약만),
  ChatGPT=작업 분기 판단(구현/최종검증 아님), User=외부 앱/CLI 상태 검증·최종 제출 판단. 실질 Cycle은 Claude Code 작업 → Codex 독립 리뷰 순서.
  외부 앱/CLI 상태 변경(Codex 설치 확인 등)은 사용자 직접. 이후 모든 Claude/Codex 프롬프트는 두 문서를 먼저 읽는다. 프롬프트 템플릿에 read-first 지시 반영.
- **Rationale**: 역할 혼선·판정 주체 혼동·추적성 저하 방지. 기능 구현이 아니라 운영 원칙 고정.
- **Alternatives Considered**: (a) 원칙을 프롬프트마다 반복 → 기각(누락·불일치). (b) current_status에만 기록 → 기각(진입 문서 부재).
- **Consequences**: 프롬프트가 짧아지고 역할·보고 방식이 일관. 원칙 변경 시 decision_log 기록 후 두 문서 동시 갱신.
- **Status**: 확정.
- **Related Files**: `AGENTS.md`, `docs/operating_principles.md`, `docs/templates/CLAUDE_CODE_TASK_PROMPT_TEMPLATE.md`, `docs/templates/CODEX_REVIEW_PROMPT_TEMPLATE.md`.

---

# Cycle 2H Patch 결정 (D37) — Plugin Display Name Alignment

## D37. 사용자-facing 표시명을 "Samil KSSB Precheck Plugin"으로 정렬(machine name 불변)
- **Date**: 2026-07-02
- **Context**: 사용자 화면의 `Local KSSB Plugins / local-kssb-plugins` 항목은 **이전 파이썬 기반 local plugin**으로 확인되어 현재 플러그인과
  혼동 가능성이 있다. 현재 플러그인의 사용자-facing 표시명을 의도한 공식 이름으로 **선제 정렬**할 필요(기존 `interface.displayName`="Samil KSSB Precheck (사전검토 보조)").
  이번 Patch는 naming consistency 보정이며 **Codex app/CLI discovery 문제를 해결하지 않는다**(현재 대상 플러그인의 실제 표시 여부는 미확인).
- **Decision**: manifest `interface.displayName`을 `Samil KSSB Precheck Plugin`으로, marketplace `interface.displayName`을
  `Samil KSSB Precheck Plugin — Local/Repo Marketplace`로 정렬. **machine name·구조·정책은 변경하지 않는다** —
  `name`=`samil-kssb-precheck`, marketplace `plugins[0].name`, `source.path`=`./src`, `skills`=`./skills/`,
  `policy.installation`=`AVAILABLE`, `policy.authentication`=`ON_INSTALL`, plugin root=`src/` 유지(D33/D34 정합값 불변).
- **Rationale**: display metadata만 조정해 사용자-facing 이름 명확화. discovery 구조·정합값은 이미 Codex 리뷰 PASS를 받았으므로 흔들지 않는다.
  제품 경계(삼일 비공식·감사/인증/준수 대체 아님·컨설턴트 검수용 초안·해커톤 제출용)는 short/long description에서 유지.
- **Alternatives Considered**: (a) machine name까지 변경 → 기각(정합·설치 구조 파괴). (b) 표시명 그대로 → 기각(사용자-facing 이름 불명확).
- **Consequences**: install verification 문서·evidence template에 표시명 기대값과 machine name 유지·축약 시 detail 확인 안내 추가. 실제 설치 검증은 사용자 직접 항목.
  **다음 별도 이슈는 marketplace registration/discovery 확인**(현재 플러그인이 실제로 app/CLI에 표시·설치되는지).
- **Status**: 확정(display metadata naming consistency). 실제 Codex app/CLI 표시·설치·discovery 확인은 사용자 직접 검증 대기(미확인).
- **Related Files**: `src/.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `docs/codex_install_verification.md`, `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`.

---

# Cycle 2H 기록 (D38) — Install/Smoke Evidence + 다음 단계 분리

## D38. 사용자 직접 CLI discovery·smoke 확인을 evidence로 기록, 실무 품질 검증은 다음 단계로 분리
- **Date**: 2026-07-02
- **Context**: 사용자가 직접 Codex CLI에서 대상 plugin(**Samil KSSB Precheck Plugin** / `samil-kssb-precheck`) discovery와 새 thread smoke test를 수행·보고했다.
- **Decision**: 사용자 직접 확인 결과를 `docs/codex_install_verification_evidence_2026-07-02.md`에 evidence로 기록한다. smoke는 **실제 기업 분석 없이** 사용 방식 설명만
  요청·확인했으며 제품 경계·source-bound·사람 검수 원칙 유지 여부를 사실 기록했다. **PASS/FAIL 판정은 하지 않는다**(독립 검증은 Codex). app GUI 표시 검증과
  **실제 보고서 기반 end-to-end 품질 검증은 미수행**으로 남기고, **Cycle 2I — Real Report Practical Output Validation**을 다음 단계로 제안(이번엔 미착수).
- **Rationale**: install/smoke discovery 단계와 실무 산출물 품질 검증 단계를 분리해 추적성 확보. 외부 상태 변경은 사용자 직접(운영 원칙 유지).
- **Consequences**: current_status에 evidence·다음 단계 반영. 실제 분석·submission.zip은 여전히 미수행.
- **Status**: 기록 확정(사용자 직접 evidence). 실무 품질 검증은 Cycle 2I 착수 시(사용자/ChatGPT 확인 후).
- **Related Files**: `docs/codex_install_verification_evidence_2026-07-02.md`, `docs/cycle2h_marketplace_discovery_diagnostic_report.md`, `docs/codex_install_verification.md`.

---

# Cycle 2I-0 기록 (D39) — Baseline 실행/산출물 문제 분석

## D39. 두 실사용 테스트 결과를 실행 단계·산출물 품질 문제로 분리 분석(수정 미착수)
- **Date**: 2026-07-02
- **Context**: 사용자가 실사용 방식으로 Run A(Hana, KSSB형) / Run B(K-water, 일반형)를 실행. gov/strat 내부 코드 표기, DOCX 미생성, PDF 파악 한계가 관찰됨.
- **Decision**: 문제를 **① 실행 단계**(문서 인테이크/OCR 부재, 표 수치 복원 실패, 대용량 처리, **실행 로그·로컬 경로 노출**, findings→renderer 미배선으로 **DOCX 미생성**·산출물 경로 부재)와
  **② 산출물 퀄리티**(내부 코드명 노출, 원문 인용·페이지/섹션 위치 단서 부족, 요약형)로 나눠 `docs/cycle2i_baseline_execution_output_problem_analysis.md`에 기록.
  경계(감사·인증·준수 대체 아님·컨설턴트 검수용·확인 불가 미공시 아님)는 두 Run 모두 유지됨을 관찰. **PASS/FAIL 판정·실제 수정은 하지 않음.**
- **Rationale**: 병목이 판정 로직이 아니라 실행 배선·표현 품질임을 분리해 이후 수정 우선순위를 명확히 하기 위함. 로컬 절대경로·계정명은 문서에서 `[REDACTED]` 처리.
- **Consequences**: 개선 우선순위(로그↔보고서 분리·경로 비노출 → 대표 문서 생성 → 코드→한글 라벨 → 인용/위치 → OCR/표 fallback → 질문 구체화)와 다음 사이클(2I-1/2I-2/2I-3) 제안. 착수는 확인 후.
- **Status**: 분석 기록 확정. 실제 수정 미착수.
- **Related Files**: `docs/cycle2i_baseline_execution_output_problem_analysis.md`.

---

# Cycle 2I-0 Addendum 기록 (D40) — Remediation 구현계획 + Kordoc feasibility

## D40. baseline 문제 기반 개선 순서·Kordoc feasibility·Document Evidence Index를 계획으로 문서화(구현·설치 미착수)
- **Date**: 2026-07-02
- **Context**: baseline 분석(D39) 이후, 개선 실행 순서와 Cycle 2I-3의 PDF/OCR/표 문제 보완을 위한 Kordoc(외부 문서파싱 도구) 도입 방향 검토 요청.
- **Decision**: `docs/planning/cycle2i_remediation_implementation_plan.md`에 개선 순서
  **2I-1(실행 배선/로그·경로 분리·기존 renderer로 대표 문서 생성) → 2I-2(표현 품질) → 2I-3(인테이크/표 fallback 설계) ∥ 2I-3A(Kordoc feasibility spike)**를 제안.
  **Kordoc은 사용자 승인 후 로컬 MCP/CLI 설치 가능한 인테이크 후보로만** 반영하고 **plugin 본체 hard dependency로 고정하지 않음**(pluggable, 부재 시 현행 경로 유지).
  표·이미지 판독용 **Document Evidence Index**(findings 상위 중간 산출물 개념)를 schema/코드 변경 없이 상위 설계로만 제안 — **판정을 만들지 않고 근거 후보·위치·품질 신호만** 제공(재판정 아님).
- **Rationale**: 새 의존성 없이 즉시 가능한 실행 배선/표현 품질을 먼저, 외부 의존·복잡한 인테이크는 격리 spike로 통제. 사용자 승인 없는 설치·외부 전송·로컬 설정 커밋 위험을 계획에 명시적으로 차단.
- **Consequences**: 이번 사이클은 **구현·설치·MCP setup·`.mcp.json`·OCR 사용 없음.** Codex Review 대상은 분석 문서 + 이 계획 문서 + 상태/결정. 착수는 확인 후.
- **Status**: 계획 기록 확정. 실제 수정·설치 미착수.
- **Related Files**: `docs/planning/cycle2i_remediation_implementation_plan.md`, `docs/cycle2i_baseline_execution_output_problem_analysis.md`.

---

# Cycle 2I-1 결정 (D41) — Execution Wiring / Output Separation

## D41. 전달 배선기로 findings→preflight→대표 문서→사용자 요약을 잇고 로그·경로를 분리
- **Date**: 2026-07-02
- **Context**: baseline(2I-0)에서 실행 로그·로컬 경로 노출, DOCX 미생성, findings→validator→renderer 미배선이 확인됨. Codex remediation plan review에서 2I-1을 다음 단계로 권장(PASS).
- **Decision**: **얇은 내부 배선기** `src/renderers/kssb_report_delivery.py`를 신설(기존 renderer/validator 재사용, 새 외부 의존성 없음).
  ① validator preflight(detect-only, findings 미변경) → ② renderer(재판정 없음) 대표 문서 생성 → ③ **사용자-facing 요약**(파일명·표시경로·preflight 건수·사람 검수·경계 고지)과 **내부 상세**(전체 경로·validator 이슈·docx 오류)를 **분리 반환**.
  CLI는 stdout=사용자 요약, `--debug`=stderr=내부 상세. 표시 경로는 repo-relative 또는 파일명만(절대경로·계정명 비노출) + 2차 redaction.
  renderer에 **Markdown fallback**을 더해 대표 문서 우선순위 **DOCX→HTML→Markdown**을 `primary`로 지정. `.gitignore`에 `.md` 산출물 제외 추가.
- **Rationale**: 사용자 결과와 내부 실행 로그를 분리하고 대표 문서 파일·경로를 보장하되, 판정·근거는 만들지 않아 재판정 금지·detect-only·Skill-first·제품 경계를 유지.
- **Alternatives Considered**: (a) renderer 안에서 요약·로그 처리 → 기각(책임 혼합·경계 흐림). (b) 사용자 요약에 절대경로 노출 → 기각(민감정보 정책 위배). (c) 파이프라인 전면 재작성 → 기각(과범위).
- **Consequences**: findings example 기준 대표 문서 3종 생성·사용자 요약 안전 불변식(경로/계정 비노출·경계·사람 검수·재판정 없음) 테스트로 확인. 실제 PDF 인테이크/OCR(2I-3)·표현 품질(2I-2)은 별도 사이클.
- **Status**: 구현 확정(2I-1 범위). 2I-2/2I-3 미착수.
- **Related Files**: `src/renderers/kssb_report_delivery.py`, `src/renderers/kssb_report_renderer.py`(render_markdown·render_report primary), `tests/test_delivery_wiring.py`, `.gitignore`, `docs/workflow_usage.md`.

---

# Cycle 2I-2 결정 (D42) — Presentation Quality + Skill Workflow Alignment

## D42. 대표 문서 표현 품질 개선(표기만) + 전달 배선기 정합 + 2I-1 minor 처리
- **Date**: 2026-07-02
- **Context**: 2I-1 PASS 이후, baseline의 산출물 품질 문제(내부 코드명·인용/위치 부족)와 Codex 2I-1 비차단 minor 3건.
- **Decision**: 렌더러 3종(HTML/DOCX/Markdown)에서 **표기·정렬·라벨만** 개선 — 한글 공시요구 제목 우선(항목ID 보조), 근거 앵커 인용/출처/위치 분리,
  §2 항목표 열 재정렬, 질문 안내 인트로. **재판정 금지 유지**(판정·근거·질문·권고 값 미생성, 없는 페이지/인용 미생성).
  Codex 2I-1 minor: (01) SKILL.md를 전달 배선기(`kssb_report_delivery.py`) 경로·DOCX→HTML→Markdown fallback과 정합,
  (02) 강제 DOCX 실패 fallback 영구 테스트 추가, (03) 렌더러 stale fallback 문구 현행화.
- **Rationale**: 병목은 판정 로직이 아니라 표현 품질·문서 정합이므로, 코드 표기와 Skill 문서만 최소 변경. validator/schema/delivery 로직·경계는 불변.
- **Alternatives Considered**: (a) 항목ID 완전 제거 → 기각(추적성 상실). (b) 질문/요청자료 문구를 렌더러가 재작성 → 기각(재판정/창작 위험). (c) 스키마에 표시용 필드 추가 → 보류(과범위).
- **Consequences**: 대표 문서가 한글 제목·인용/위치 중심으로 읽기 쉬워짐. 전달 33/33·렌더러 22/22·검증기 19/19 PASS. 실제 PDF 인테이크(2I-3)는 별도.
- **Status**: 구현 확정(2I-2 범위). 2I-3/2I-3A 미착수.
- **Related Files**: `src/renderers/kssb_report_renderer.py`, `src/skills/samil-kssb-precheck/SKILL.md`, `tests/test_delivery_wiring.py`.

---

# Cycle 2I-3 기록 (D43) — Document Intake / Evidence Quality 설계 계획

## D43. intake/evidence 품질 설계 + DEI 문서 수준 제안 + 최소 validator guardrail은 검토 후 착수
- **Date**: 2026-07-02
- **Context**: 2I-1/2I-2 PASS 이후 남은 리스크는 판정/렌더가 아니라 **문서 인테이크**(PDF/표/이미지/스캔·findings 값 로컬 경로 유입·Kordoc/OCR 승인 게이트).
- **Decision**: `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md` 작성 — (1) 인테이크/evidence 리스크 정리,
  (2) **Document Evidence Index를 문서 수준(비-schema)**으로 제안(판정 생성 아님, `evidence_anchor`로 매핑, 확정 schema 미도입),
  (3) 로컬 경로 차단은 **upstream validator(detect-only)**에서, renderer/delivery는 findings 재작성 금지,
  (4) **최소 validator 경로 스캔 확장**(`_PATH_PATTERNS`에 `/home/`·`%TEMP%`·`%USERPROFILE%`·`/var/folders/`·`\Temp\` 등)을 2I-3 구현 후보로 제시하되 **계획 검토 우선**으로 이번 push에 미포함,
  (5) Kordoc은 **2I-3A feasibility spike**(사용자 승인·pluggable·미설치)로 분리.
- **Rationale**: 병목이 upstream 인테이크이므로 성급한 엔진/외부 의존 도입을 피하고, 지금은 설계 확정과 최소·안전 guardrail 범위만 정의. 사용자 요청("우선 계획 확인")에 따라 계획 문서만 먼저 push해 검토 가능하게 함.
- **Consequences**: 계획 검토(및 Codex Review) 후 §11 guardrail을 별도 커밋으로 반영. 실제 인테이크/Kordoc/OCR은 2I-3A.
- **Status**: 계획 확정. guardrail 구현·2I-3A 미착수.
- **Related Files**: `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`, `src/validators/kssb_findings_validator.py`(향후 guardrail 대상), `docs/planning/cycle2i_remediation_implementation_plan.md`.

---

# Cycle 2I-3 결정 (D44) — Minimal Validator Path-Exposure Guardrail 구현

## D44. findings 값의 로컬/임시/계정 경로 노출 스캔을 detect-only로 소폭 확장
- **Date**: 2026-07-02
- **Context**: 2I-2 리뷰 §8·2I-3 계획 §6/§11 — findings 값에 로컬 경로가 들어오면 대표 문서 본문에 남을 수 있음. 렌더러는 재작성 금지이므로 **upstream validator**에서 감지해야 함.
- **Decision**: validator의 기존 내부 경로 스캔(`_PATH_PATTERNS`)에 보수적 토큰 추가 —
  `/home/`, `/var/folders/`, `[\\/]Temp[\\/]`, `%(TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)%`. detect-only·error(`path.internal_exposure`) 유지, findings 미변경.
  `tests/test_findings_validator.py`에 검출·불변식·detect-only 케이스 7건 추가(19→26).
- **Rationale**: 새 기능이 아니라 패턴 목록 확장이라 최소·안전. 추가 토큰은 한글 공시 본문 등장 가능성이 낮아 오탐 위험 낮음(valid example error 0 유지). renderer/delivery는 내용 스크럽하지 않는 경계 유지.
- **Alternatives Considered**: (a) renderer/delivery에서 본문 경로 스크럽 → 기각(재작성/경계 위반). (b) 더 공격적 패턴(예: 임의 `%...%`) → 기각(오탐↑).
- **Consequences**: findings에 경로가 들어오면 preflight error로 감지되어 렌더 전에 바로잡게 됨. 근본적 경로 유입 차단은 인테이크(2I-3A) 과제. renderer/delivery/schema/manifest 불변.
- **Status**: 구현 확정(2I-3 최소 범위). 2I-3A(Kordoc/OCR/인테이크) 미착수.
- **Related Files**: `src/validators/kssb_findings_validator.py`, `tests/test_findings_validator.py`, `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`.

---

# Cycle 2I-3A 기록 (D45) — Kordoc Feasibility Spike / Approval Gate 계획

## D45. Kordoc을 승인 게이트 뒤의 optional/pluggable intake 후보로 문서화(설치·실행 없음)
- **Date**: 2026-07-02
- **Context**: 남은 인테이크 품질(표/수치/위치·스캔 OCR)을 개선하려면 외부 도구(Kordoc) feasibility가 필요하나, 설치·MCP·OCR은 사용자 환경 변경·데이터 유출·라이선스 리스크가 있어 승인·검증 전 도입 금지.
- **Decision**: `docs/planning/cycle2i_3a_kordoc_feasibility_spike_plan.md` 작성 — Kordoc을 **optional/pluggable 후보**로 유지(hard dependency 금지),
  승인 게이트(오프라인·무-egress·라이선스·결정성·DEI 매핑·Skill-first·재현성 기록), 샘플 유형별 spike 시나리오, 성공/실패 기준, evidence 기록 요건(정확한 버전·명령·README 확인일·public README 일치),
  DEI↔evidence_anchor 매핑 검증(판정 미생성·schema 미변경), **OCR provider 별도 승인 게이트**, MCP/설정·로컬 경로 repo 커밋 금지, 실패 fallback을 정의.
  **이번 사이클은 문서만**(코드/테스트/manifest/marketplace/MCP 설정 무변경, Kordoc 설치·실행·PDF 재실행 없음).
- **Rationale**: 도입 리스크를 승인·검증 뒤로 게이팅해 Skill-first·결정성·무-egress·경계를 보호. 실제 판단은 사용자/ChatGPT가 evidence 기반으로.
- **Consequences**: 승인 시 사용자 로컬 spike → evidence(민감정보 제거) → 도입 여부 판단. 실패 시 현행 인테이크 fallback 유지.
- **Status**: 계획 확정. spike 수행·Kordoc 도입 미착수(사용자 승인 대기).
- **부수 정리(C2I3-MIN-01)**: `cycle2i_3_document_intake_evidence_quality_plan.md` 서문의 "계획만/미구현" stale 문구를 "처음 계획 push → 이후 guardrail 구현(D44)" 진행 이력으로 정리.
- **Related Files**: `docs/planning/cycle2i_3a_kordoc_feasibility_spike_plan.md`, `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`.

## 보류 항목(이후 결정)
- 생성 아키텍처·렌더러 코드 위치·도입 시점(승인 후 확정).
- 참고 엔진 재구현 범위.
- DOCX/HTML 실제 생성 구현 및 수동 검증 규칙의 자동화(경량 결정적 검증 단계).
- **로그 원본 제출 방식(repo 커밋 vs submission.zip 번들만)은 제출 패키징 단계에서 확정 — 현재 미확정.**
- OCR·문서 변환 파이프라인, 결정적 검증 엔진 도입.
- 산업별 KSSB 세부 지표 확장.
- (다음 단계는 ChatGPT·사용자 확인 후 결정. 이 문서에서 확정하지 않는다.)
