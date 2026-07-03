# 의사결정 기록 (Decision Log) — Cycle 1 ~ 2I

> 사이클별 섹션: Cycle 1(D1~D10) → Cycle 2A 방향성(D11~D15) → Cycle 2B(D16~D21) → Cycle 2C(D22~D25) → Cycle 2D(D26~D29) → Cycle 2D Patch(D30) → Cycle 2E(D31) → Cycle 2F(D32) → Cycle 2G(D33) → Cycle 2G Patch(D34) → Cycle 2H(D35) → 운영 원칙(D36) → Cycle 2H Patch(D37) → Cycle 2H Evidence(D38) → Cycle 2I-0(D39) → Cycle 2I-0 Addendum(D40) → Cycle 2I-1(D41) → Cycle 2I-2(D42) → Cycle 2I-3 계획(D43) → Cycle 2I-3 guardrail(D44) → Cycle 2I-3A 계획(D45) → Cycle 2I-3A Runbook(D46) → Cycle 2I-3A Spike 실행(D47) → Cycle 2I-3B Adapter 설계(D48) → Cycle 2I-3B GatePrep 계획(D49) → Cycle 2I-3B Gate A 실행(D50) → Cycle 2I-3B Gate B 실행(D51) → Cycle 2I-3B Version Strategy 확정(D52) → Cycle 2J Mistral OCR4 벤치마크(D53) → Cycle 2K OCR/이미지 Capability Ladder(D54) → Cycle 2K Patch 예선 L3 목표 명확화(D55) → Cycle 2L 예선 L3 Implementation-Prep 로드맵(D56).

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

---

# Cycle 2I-3A 기록 (D46) — Kordoc Local Feasibility Spike 실행 Runbook + Evidence 템플릿

## D46. 승인 후 로컬 spike 실행 절차·증거 기록 양식을 문서화(설치·실행 없음)
- **Date**: 2026-07-03
- **Context**: D45 계획(Approval Gate)은 "왜/어떤 조건에서 승인"을 정의했으나, 승인 후 **무엇을 어떤 순서로 실행하고 무엇을 기록**할지 실행 절차서가 없었다.
- **Decision**: `docs/planning/cycle2i_3a_kordoc_local_spike_runbook.md` 작성 — 실행 전 승인 체크리스트, 로컬/offline/no-egress 확인, 라이선스 확인,
  재현성 기록(정확한 버전·명령·README 확인일), 샘플 유형별 실행 절차, 성공/실패 기준, DEI→evidence_anchor 매핑 관찰, 로컬 경로·계정·토큰 redaction 규칙,
  실패 fallback, evidence 기록 템플릿, 실행 후 Codex Review 요청 포인트를 정의. **실행 주체=사용자(로컬·승인 후)**, 명령은 placeholder 템플릿으로만 기재.
- **Rationale**: 계획(승인 게이트)과 실행(Runbook·증거)을 분리해 추적성 확보. 실행은 사용자 로컬·승인 후에만, repo에는 민감정보 없는 절차/템플릿만 남긴다.
- **Consequences**: 승인 시 Runbook을 따라 로컬 spike 수행 → evidence 문서(민감정보 제거) 작성 → Codex 검증 → 도입 여부 판단. 미승인 시 fallback 유지.
- **Status**: 문서 확정. **Kordoc 설치·MCP·OCR·PDF 재실행 미착수**(사용자 승인 대기).
- **Related Files**: `docs/planning/cycle2i_3a_kordoc_local_spike_runbook.md`, `docs/planning/cycle2i_3a_kordoc_feasibility_spike_plan.md`, `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`.

---

# Cycle 2I-3A 기록 (D47) — 실제 local Kordoc feasibility spike 실행 결과

## D47. Kordoc은 인테이크 품질에 가치 있으나 plugin hard dependency로는 부적합 — optional/pluggable로만 권고
- **Date**: 2026-07-03
- **Context**: D45/D46(승인 게이트·Runbook) 후 사용자 승인 하에 **실제 로컬 spike**를 수행. 목표: Kordoc이 문서 인테이크 품질(표/위치/needs_ocr)을 실제로 개선하는지, hard dependency 가치가 있는지 판단 재료 확보.
- **Decision(관찰 기반)**: `kordoc@3.8.2`(MIT) CLI로 공개 공시성 보고서 2종(유형1 53p·유형2 156MB/126p) 실측 —
  표 재구성(49/199개), **결정성**(2회 markdown SHA 동일), 대용량 안정(40초), block/outline/pageQuality/`needsOcr`/warnings 등 **DEI→evidence_anchor 매핑에 유용한 위치·품질 신호** 확보, baseline(naive 텍스트) 대비 표 열구조·위치·OCR 신호 **개선 확인**.
  단 리스크: **PDF는 `pdfjs-dist` 별도 설치 필수 + 버전 민감(v6.1.200 실패 `doc.destroy`, v4.10.38 성공)**, **Node.js 런타임 필요**(plugin stdlib-only와 상충), OCR/formula 기능은 **대용량 ONNX 모델 egress**, 전이 의존성/네이티브 바이너리 라이선스 별도 심사, 강제 무-egress 본 환경 미보장.
  → **종합: 성공(가치 입증) + hard dependency 부적합.** Kordoc은 **optional/pluggable 외부 인테이크 도구**로만(사용자 로컬·승인 하), plugin core hard-couple 금지, 부재 시 현행 fallback 유지.
- **Rationale**: 인테이크 개선 효과는 실측으로 확인됐지만, 런타임·의존성 버전 민감성·egress 기능·라이선스 심사 부담이 Skill-first·결정성·무-의존 원칙과 충돌. 도입은 본체 결합이 아니라 교체 가능한 외부 계층으로 격리해야 안전.
- **Consequences**: 실제 어댑터/DEI schema화/인테이크 코드는 **여전히 미착수**(별도 승인·검증 필요). 다음 후보: 유형3(스캔 전용) 재현·강제 무-egress 재확인·전이 의존성 라이선스 정밀 검토.
- **Status**: spike 실행·evidence 기록 완료. **Kordoc 미도입, plugin core/schema/renderer/delivery/validator/manifest/marketplace 미변경, OCR provider 미실행.** 사용자/ChatGPT 판단 대기.
- **Related Files**: `docs/samples/kordoc_spike_evidence_2026-07-03.md`, `docs/planning/cycle2i_3a_kordoc_local_spike_runbook.md`, `docs/planning/cycle2i_3a_kordoc_feasibility_spike_plan.md`.

---

# Cycle 2I-3B 기록 (D48) — Optional/Pluggable External Intake Adapter 설계

## D48. Kordoc을 런타임 결합이 아니라 "어댑터 인터페이스 계약 + 외부 preprocessing"으로 격리(설계만)
- **Date**: 2026-07-03
- **Context**: 2I-3A spike(D47)에서 Kordoc의 인테이크 가치는 입증됐으나 hard dependency 부적합(런타임·버전 민감·egress·license·no-egress 미경화). Codex evidence review는 PASS + 3 minors(EV-MIN-01 no-egress 미경화, EV-MIN-02 의존성·버전, EV-MIN-03 스캔/OCR 미검증)와 §10 adoption gate를 제시.
- **Decision**: `docs/planning/cycle2i_3b_optional_intake_adapter_design.md` 작성 — Kordoc을 **plugin core 밖 "외부 인테이크 어댑터 인터페이스 계약"의 한 구현**으로 둔다.
  v1 = 로컬 out-of-band preprocessing이 **DEI-후보 JSON**(2I-3 §5 개념, 강제 schema 아님)을 산출 → Skill이 근거 재료로만 참조, plugin core는 계속 **findings 계약**만 소비.
  경계: 어댑터 산출물은 renderer/delivery/validator에 직접 입력되지 않고 DEI→Skill 경유(판정 미생성). 버전: `kordoc@3.8.2 + pdfjs-dist@4.10.x`를 검증된 조합으로 기록, pin/compat-check·auto-upgrade 금지·불일치 시 fail-fast→fallback.
  **Gate A(no-egress 강제검증)·Gate B(전이/native license 검토)** 를 구현/운영/번들 전 필수 gate로, OCR/formula/scanned는 v1 제외(needs_ocr는 신호만), 어댑터 부재/실패 시 현행 fallback 유지, 구현 진입 gate 체크리스트(§12) 정의.
- **Rationale**: 2I-3A에서 확인된 런타임·버전·egress·license 리스크를 core 밖으로 격리해야 Skill-first·결정성·무-의존·제출 패키징 원칙이 보호된다. 런타임 결합/번들/자동 MCP 구동은 이 리스크를 본체로 전이하므로 기각.
- **Consequences**: 실제 어댑터 코드·의존성 pin·DEI schema화·인테이크 구현은 **여전히 미착수**. 구현 사이클(예: 2I-3C) 진입은 §12 gate(특히 Gate A·B·버전 전략) 충족·기록 후 별도 승인 하에만.
- **Status**: 설계 확정. **코드/의존성/schema/validator/renderer/delivery/manifest/marketplace 미변경, Kordoc 미설치·미도입, OCR 미실행.** 사용자/ChatGPT 판단 대기.
- **Related Files**: `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`, `docs/samples/kordoc_spike_evidence_2026-07-03.md`, `docs/reviews/codex_cycle2i_3a_kordoc_spike_evidence_review.md`, `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`.

---

# Cycle 2I-3B GatePrep 기록 (D49) — Gate A/B/Version Strategy 실행계획

## D49. 구현 전 gate(A: no-egress, B: license, Version)를 실행 가능한 절차·판정기준으로 고정(Plan Mode, 실행 없음)
- **Date**: 2026-07-03
- **Context**: 2I-3B 어댑터 설계가 Codex **PASS**(findings 0)를 받고 §11/§12에서 구현 전 필수 gate(hard no-egress rerun·전이/native license review·버전 제약 전략)와 gate 준비 착수를 권고. 다음 실행자가 바로 gate 작업에 들어갈 수 있는 실행계획 필요.
- **Decision**: `docs/planning/cycle2i_3b_gateprep_execution_plan.md` 작성 —
  **Gate A**(차단 방식 선택→차단 제어검증→유형1/2 재파싱→아웃바운드 관찰→결정성 재확인, evidence 항목·PASS/HOLD/FAIL),
  **Gate B**(v1 경로 의존성 트리·SPDX license 식별·copyleft/attribution 분류·native 바이너리·`submission_packaging_policy.md` 정합, evidence·PASS/HOLD/FAIL; optional/OCR 계열 미설치·미사용 확인),
  **Version Strategy 5규칙**(kordoc 정확 pin + pdfjs-dist 4.10.x 제약, 실행 전 compat-check→fail-fast, auto-upgrade 금지, 신버전 재검증, 불일치 시 fallback),
  v1 OCR/formula/scanned 제외 유지, opt-in/local-only posture 유지, **구현 사이클 진입 조건 체크리스트**(A PASS + B PASS + Version 확정 + scope + posture + 경계 불변)를 고정.
- **Rationale**: gate를 실행 전 절차·판정기준으로 못박아, 실제 수행 결과만으로 "구현 사이클 진입 정당성"을 판정할 수 있게 함. 실행·설치·정밀검토는 승인 하 별도 수행(이번은 계획만).
- **Consequences**: 승인 시 다음 실행자가 Gate A/B/Version을 로컬 수행 → evidence → Codex 검증 → §9 조건 충족 시 별도 승인 하 구현 사이클(2I-3C 등). 하나라도 HOLD/FAIL이면 미진입(보강 또는 현행 fallback).
- **Status**: 실행계획 확정. **gate 미실행, Kordoc 미설치/미재실행, no-egress/ license 미수행, 코드/의존성/schema/validator/renderer/delivery/manifest/marketplace 미변경, OCR/PDF 미재실행.**
- **Related Files**: `docs/planning/cycle2i_3b_gateprep_execution_plan.md`, `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`, `docs/reviews/codex_cycle2i_3b_optional_intake_adapter_design_review.md`, `docs/planning/cycle2i_3a_kordoc_local_spike_runbook.md`, `docs/submission_packaging_policy.md`.

---

# Cycle 2I-3B Gate A 기록 (D50) — Hard No-egress Rerun 실행 결과: PASS(프로세스 레벨)

## D50. Node 런타임 outbound 강제 차단 하에서 Kordoc 파싱 무-egress·성공·결정성 확인 → Gate A PASS
- **Date**: 2026-07-03
- **Context**: 2I-3A evidence의 "관측상 무-egress"(EV-MIN-01)를 강제 검증으로 승격해야 구현 진입 gate를 통과. gateprep §3 절차대로 실제 수행.
- **Decision(관찰 기반)**: preload(`--require`) 훅으로 dns/net/tls/http(s)(및 fetch→net 경유) outbound를 **block**한 상태에서 `kordoc@3.8.2 + pdfjs-dist@4.10.38` CLI로 유형1·유형2를 JSON·Markdown 2회씩 파싱 —
  **8/8 성공(exit 0), 파싱 중 outbound 시도 0건.** control로 차단 실작동 입증(monitor가 loopback 시도 포착 + block이 알려진 원격 `8.8.8.8:53` 연결을 패킷 전송 전 차단). 결정성은 **JSON·Markdown 모두** 2회 동일(유형1 JSON `eeddfb59…`/MD `953443f4…`, 유형2 JSON `1c7d8ec9…`/MD `6095b881…`; MD 해시는 2I-3A와 일치). 재설치 없이 오프라인 수행.
  → **Gate A = PASS**, 단 판정 범위는 **프로세스(Node JS 런타임) 레벨**(native raw-syscall/child process 미포함; v1은 native OCR/pdfium 미설치·미사용). OS/커널 방화벽 레벨 재확인은 민감 실데이터 운영 전 **비차단 보강**.
- **Rationale**: v1 텍스트 파싱 코드경로는 순수 JS(kordoc+pdfjs)이고 fetch/undici도 net.connect 경유이므로, Node net 레벨 차단이 실제 코드경로의 egress를 실증적으로 커버. control로 "차단이 실작동"함을 입증해 `totalAttempts=0`을 "훅 미작동"이 아닌 "무시도"로 해석 가능.
- **Consequences**: Gate A 충족. 다음은 Gate B(전이/native license review)·Version Strategy 확정. 구현 진입은 gateprep §9 전체 조건 충족 후 별도 승인.
- **Status**: Gate A PASS(프로세스 레벨). **Kordoc 미도입, raw log·PDF·변환물·node_modules·훅 repo 미커밋, OCR/formula/MCP 미사용, 코드/schema/validator/renderer/delivery/manifest/marketplace/package 미변경.**
- **Related Files**: `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`, `docs/planning/cycle2i_3b_gateprep_execution_plan.md`, `docs/samples/kordoc_spike_evidence_2026-07-03.md`.

---

# Cycle 2I-3B Gate B 기록 (D51) — Transitive/Native License Review 실행 결과: PASS(v1 경로)

## D51. v1 text-PDF 의존성 폐포는 전부 permissive, copyleft/native는 optional·미로드 → Gate B PASS
- **Date**: 2026-07-03
- **Context**: 2I-3A EV-MIN-02(전이/native license 미검토)를 실증 검토해 구현/번들 전 gate 통과 판단. gateprep §4 절차대로 실제 수행(읽기전용 인벤토리, 설치 없음).
- **Decision(관찰 기반)**: `kordoc@3.8.2 + pdfjs-dist@4.10.38`에서 roots={kordoc, pdfjs-dist}의 `dependencies`만 재귀한 **v1-required 폐포 117개가 전부 permissive**(permissive 116 + jszip dual `MIT OR GPL`→MIT electable; **copyleft 0·native 0·unknown 0**), 116/117이 LICENSE/NOTICE 동봉(예외 isarray는 MIT 메타). 카피레프트(LGPL: `@img/sharp-win32-x64` = `Apache-2.0 AND LGPL-3.0-or-later`)와 native 바이너리(`sharp`/`onnxruntime-node`/`@hyzyla/pdfium`/`@napi-rs/canvas`)는 **모두 v1 폐포 밖 optional**이며 텍스트 파싱 시 미로드(Gate A 성공·pdfjs-dist만 필수로 확인).
  → **Gate B = PASS**. 어댑터 opt-in/local·미번들이므로 재배포 license 의무 미발생. **번들 시 조건**: MIT/BSD 텍스트 + Apache-2.0 NOTICE 보존, `--omit=optional`로 LGPL/native 제외, `submission_packaging_policy.md` §1 E-분류·스캔 준수.
- **Rationale**: 폐포를 deps-only로 산정해 실제 실행 경로(Gate A로 검증)와 정합. LGPL/native 리스크가 optional 계열에 격리되어 있고 v1이 OCR/formula/scanned를 제외하므로, v1 텍스트 경로의 배포·번들 적합성이 확보됨.
- **Consequences**: Gate A·B PASS. 남은 gateprep 항목은 Version Strategy 확정. 구현 진입은 gateprep §9 전체 조건 충족 후 별도 승인. 비차단 후속: 구현 시 `--omit=optional` 설치 태세 고정, 번들 결정 시 attribution/NOTICE 수집, 형식 법률 검토(제출 단계).
- **Status**: Gate B PASS(1차 인벤토리). **형식 법률의견 아님. Kordoc 미도입, node_modules·분석 스크립트·lock·raw 인벤토리 repo 미커밋, OCR/formula/MCP 미사용, 코드/schema/validator/renderer/delivery/manifest/marketplace/package 미변경.**
- **Related Files**: `docs/samples/gate_b_license_review_evidence_2026-07-03.md`, `docs/planning/cycle2i_3b_gateprep_execution_plan.md`, `docs/submission_packaging_policy.md`, `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`.

---

# Cycle 2I-3B 기록 (D52) — Version Strategy 확정 + Residual Hardening Register

## D52. Version Strategy 8규칙 확정, 잔여 보강 수집 → 기술 gate 전부 충족, 다음은 Codex Review→승인→구현
- **Date**: 2026-07-03
- **Context**: Gate A(D50)·Gate B(D51) PASS 후 남은 gate는 Version Strategy. 동시에 Gate A/B 리뷰·adapter design 흐름의 non-blocking 보강을 빠짐없이 정리 필요.
- **Decision**: `docs/planning/cycle2i_3b_version_strategy_confirmation.md` 작성 — **Version Strategy 8규칙 확정**(V1 `kordoc@3.8.2` exact pin, V2 `pdfjs-dist@4.10.x`(광역 `>=4` 금지, v6.1.200 실패), V3 실행 전 compat-check, V4 미검증 fail-fast, V5 auto-upgrade 금지, V6 신버전 시 Gate A/B 재검증, V7 불일치 시 fallback, V8 optional/local·core hard dependency 아님·`--omit=optional`).
  **Residual Hardening Register**로 전체 보강 수집: RH-A1(OS/kernel no-egress), RH-A2(메타데이터: 부분 반영), **RH-B1(완전 117 인벤토리+`INVENTORY_SHA256=64648c64…`) 해소**, RH-B2(`--omit=optional` trace, open), RH-P1(attribution/NOTICE·LGPL 제외), RH-P2(형식 법률), RH-S1(OCR/scanned v1 제외 유지), RH-C1(core boundary 불변).
  → **기술 gate(Gate A PASS + Gate B PASS + Version 확정 + scope/posture/boundary) 전부 충족, 잔여 blocker 없음.** 단 **구현 착수 전 사용자/ChatGPT 명시적 승인 필요** + 구현-prep에서 RH-B2 처리. **다음 단계 = Codex Review → 승인 → 구현**(바로 구현 아님).
- **Rationale**: 버전 리스크를 pin·fail-fast·재검증 규칙으로 고정하고, 남은 보강을 blocker/non-blocker·처리 시점으로 명시해 "무엇이 언제 필요한지"를 추적 가능하게 함. RH-B1은 완전 인벤토리+hash로 즉시 해소(GATEB-MIN-01), RH-B2는 PDF 재실행 금지 경계상 구현-prep으로 이월.
- **Consequences**: 구현 사이클(예: 2I-3C, 최소 opt-in 어댑터 계약)은 사용자/ChatGPT 승인 + RH-B2 처리 후 별도 사이클로. RH-P1/P2는 번들·재배포 결정 시 처리.
- **Status**: Version Strategy 확정. **Kordoc 미도입·미설치, package/dependency 미추가, PDF/OCR/MCP 미실행, node_modules·스크립트·lock repo 미커밋, 코드/schema/validator/renderer/delivery/manifest/marketplace 미변경.**
- **Related Files**: `docs/planning/cycle2i_3b_version_strategy_confirmation.md`, `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`, `docs/samples/gate_b_license_review_evidence_2026-07-03.md`, `docs/planning/cycle2i_3b_gateprep_execution_plan.md`.

---

# Cycle 2J 기록 (D53) — Mistral OCR 4 문서지능 구조 벤치마크 (계획 보완)

## D53. Mistral OCR 4는 구조만 벤치마크, 클라우드 도입은 별도 Gate C — confidence는 검수 우선순위 신호로만 반영
- **Date**: 2026-07-03
- **Context**: 사용자가 Mistral OCR 4 문서 판독 구조를 현재 Kordoc/DEI/evidence 구조와 벤치마크해 계획 보완을 요청. 구현·API·업로드 없음.
- **Decision**: `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md` 작성 — 공개 링크 read-only 확인 후 판정:
  page/block·markdown·raw↔Document-AI 계층분리는 **이미 Kordoc 로컬 보유**; **inline confidence는 판단이 아니라 '검수 우선순위' 신호**로 DEI 선택필드에 개념 반영(추후+Codex검증, renderer no re-judgment·validator detect-only·source-bound·human-review 유지);
  bbox/block_type은 DEI 위치·유형 힌트로 유지(**findings evidence_anchor schema 불변**); batch는 클라우드 API가 아니라 **로컬 결정적 개념**(custom_id류 keying·per-page status·result hash, 부분실패 명시)로만 차용;
  스캔/이미지 OCR 실행은 v1 제외(needs_ocr 신호만), **Mistral 클라우드 API/SDK/Python/notebook/문서 업로드는 제외**.
  이유: Mistral OCR는 **클라우드 API(문서 egress)** 라 Gate A no-egress 전제와 상충 + 외부 dependency·API key·비용·결정성 약화. → 실제 도입은 Kordoc 로컬 게이트와 다른 **Gate C(외부/클라우드 OCR egress: 데이터 egress 승인·프라이버시/DPA·법률/ToS·자격증명 repo 비노출·로컬 우선)** 필요.
- **Rationale**: 필요한 raw 구조 대부분을 Kordoc이 오프라인으로 제공하므로 클라우드 OCR의 증분 가치(confidence·스캔 OCR)는 별도 게이트 대상. 구조·개념만 차용하면 Gate A/B/Version·Residual Hardening과 무충돌(core·egress·버전규칙 불변, confidence는 재료 신호).
- **Consequences**: DEI confidence 필드·bbox 힌트·로컬 배치 개념의 실제 반영은 구현-prep/구현 사이클(RH-B2 종료·사용자 승인 후). 클라우드 OCR 도입은 Gate C 통과 시에만.
- **Status**: 계획 보완(개념 판정). **Mistral 미도입, API/SDK/Python/notebook/업로드 없음, Kordoc/Mistral dependency·MCP·코드·schema·validator·renderer·delivery·manifest·marketplace 미변경.**
- **Related Files**: `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md`, `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`, `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`, `docs/planning/cycle2i_3b_gateprep_execution_plan.md`.

---

# Cycle 2K 기록 (D54) — OCR/Scanned PDF/Image Analysis Capability Ladder (제출 목표 반영)

## D54. 제출 목표를 OCR·스캔·이미지 분석까지 확장하되 L0~L4 ladder + 게이트로 단계화 — Kordoc은 OCR 엔진이 아니라 감지/추출/orchestration 후보
- **Date**: 2026-07-03
- **Context**: 기존 계획은 OCR/scanned를 v1에서 의도적으로 제외(needs_ocr 신호만)해, "제출 목표가 OCR·스캔 PDF·이미지 분석까지 확장된다"는 방향과 단계 구조가 문서에 없었다. 2J Codex minor(C2J-MISTRAL-MIN-01: self-host 분기 별도 게이트 필요)도 미반영 상태.
- **Decision**: `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md` 작성(기존 2J 문서는 Codex PASS 상태 보존 위해 미수정, 새 문서로 보강) —
  **capability ladder**: L0(텍스트 PDF, Gate A/B/Version 완료) → **L1(스캔/이미지/도표 존재 감지 + 위치/품질/신뢰도 기반 검수 라우팅** — 이미 검증된 Kordoc 신호(needsOcr·ocrCandidatePages·pageQuality·SKIPPED_IMAGE·image/table block·bbox)만 사용, **신규 게이트 불요, 제출 MVP 후보**) →
  L2(로컬 OCR 실행 — **Gate D** 신설: 사용자 승인·모델 준비(다운로드 egress 허용/기록)↔파싱(no-egress 증명) 분리·native/LGPL 재유입 시 **Gate B 재검토**·결정성·비민감 유형3 샘플) →
  L3(이미지·도표·표·차트 **후보 분류**(Mistral typed-block 구조 참고) — **차트 수치·이미지 의미·KSSB 충족 추정 금지**) →
  L4(클라우드/self-host OCR — **Gate C** + **Gate C-SH 하위분기 신설**(C2J-MISTRAL-MIN-01 해소): deployment entitlement·license/commercial terms·model/container provenance·offline/no-egress 자체 증명·operational security·deterministic/version controls, self-host ≠ 자동 Gate A 동급).
  **Kordoc 역할 재정의**: OCR 엔진이 아니라 "OCR-needed detection + page quality + block/bbox/table/image extraction + (후보) OCR orchestration layer". core hard dependency 금지 유지(V8). OCR 결과는 DEI 후보로만 합류(renderer/validator 직접 유입 금지).
  **Mistral**: API 도입 후보가 아니라 typed-block/bbox 하이라이트/confidence 트리아지/계층분리/batch status/HITL **구조 참고 모델**(2J 결론 유지).
  low-confidence/판독불가 → `missing_info`+`customer_questions`+요청자료. 제출물에는 미구현 단계를 "지원"이 아닌 "단계적 확장 계획"으로만 표기(과장 금지).
- **Rationale**: 제출 목표 확장을 명시하되, egress·license·판정 경계 리스크를 단계별 게이트로 격리하면 기존 Gate A/B/Version·RH와 충돌 없이 확장 가능. L1은 이미 검증된 신호만 쓰므로 게이트 추가 없이 MVP 스토리(스캔 자료에도 "어디를 사람이 봐야 하는지" 제시)를 완성한다.
- **Consequences**: L1 구현 착수는 별도 승인+RH-B2 후. L2~L4는 각 게이트(D, C/C-SH) 수행 후에만. RH-S1은 "L0/L1 유지, L2+는 Gate D 후"로 해석 명확화(완화 아님).
- **Status**: 계획 확정(문서만). **OCR 엔진 설치/실행·API 호출·업로드·패키지 추가·코드/schema/manifest 변경 없음. Kordoc/Mistral 미도입.**
- **Superseded wording**: 본 항목의 "제출 MVP 후보"·"L2~L4"·"MVP 스토리" 표현은 **D55(§7)**에서 **예선 최소/fallback(L0+L1) / 예선 target(L0+L1+L2+L3) / 예선 범위 밖(L4)**으로 대체됨(C2K-L3-MIN-01).
- **Related Files**: `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md`, `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md`, `docs/reviews/codex_cycle2j_mistral_ocr4_benchmark_review.md`, `docs/planning/cycle2i_3b_gateprep_execution_plan.md`, `docs/submission_packaging_policy.md`.

---

# Cycle 2K Patch 기록 (D55) — 예선 L3 제출 목표 명확화 (Codex C2K-MAJ-01 해소)

## D55. "MVP=L0+L1, 후속=L2/L3" 서술을 예선 3단 구조(최소 L0+L1 / 목표 L0+L1+L2+L3 / 범위밖 L4)로 재정리
- **Date**: 2026-07-03
- **Context**: Codex Review(`docs/reviews/codex_cycle2k_ocr_scanned_pdf_image_capability_plan_review.md`)가 **CONDITIONAL PASS**로 판정하며 Major `C2K-MAJ-01`을 제기: 기존 §7이 L0+L1을 "제출 MVP", L2/L3를 막연한 "후속 확장"으로만 표현해, 최신 제출 의도(사용자 확정: 예선 목표선은 L3)를 충분히 반영하지 못함. 또한 예선과 본선 과제가 다름을 명확히 구분할 필요가 확인됨.
- **Decision**: `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md` §7을 3단 구조로 재작성 — **예선 제출 최소/fallback = L0+L1**(신규 게이트 불요, 항상 달성 가능) / **예선 제출 목표(target) = L0+L1+L2+L3**(Gate D 통과 + 구현 evidence + 독립 검증 조건, L2/L3를 "의도된 목표선"으로 명시) / **예선 범위 밖 = L4**(Gate C/C-SH 이후, 본선과 별도 — 본 문서는 본선 로드맵을 다루지 않음을 헤더에 고지).
  §7a 신설로 "목표선 지정"과 "구현 완료 표현"을 분리: L2/L3가 목표 범위여도 **Gate D 통과 전 구현 착수 금지**, **구현·검증 전 "현재 지원 기능" 표현 금지**는 그대로 유지. Gate D 미통과 시 L1 fallback 제출은 유효하되 내부 문서상 "목표선 미달"로 구분 기록하는 규칙 추가. §5 L1~L4 절·§10 다음 단계도 목표/최소/범위밖 프레이밍에 맞춰 정합화. 차트 수치·이미지 의미·KSSB 충족 추정 금지, DEI 후보·검수 신호 전용 합류, source-bound·human-review 원칙은 전부 불변.
- **Rationale**: 계획 문서의 "목표 표기"와 제품 문서의 "구현 완료 표기"를 별개 승인 트리거로 분리하면, 목표를 명확히 하면서도 과장 표현 금지·게이트 순서를 동시에 지킬 수 있다. Codex 리뷰 원문과 2J 문서/리뷰(이미 PASS)는 수정하지 않고 이번 patch만으로 Major를 해소.
- **Consequences**: 다음 implementation-prep 논의는 L1(최소) 구현과 L2/L3(목표, Gate D 준비)를 병행 검토 대상으로 다룬다. L4는 예선 판단과 분리해 별도 사이클에서만.
- **Status**: patch 확정(문서만). **코드/schema/manifest/marketplace/package 미변경, OCR/Kordoc/Mistral 설치·실행 없음.** Codex 재검증 **PASS**(`docs/reviews/codex_cycle2k_l3_preliminary_target_clarification_review.md`, C2K-MAJ-01 해소 확인, minor `C2K-L3-MIN-01`: §9 질문 항목·D54 히스토리에 남은 구 표현("제출 MVP"·"후속 확장"·"MVP 후보") 정리 — 본 문서 §9 및 D54 Status에 대체 안내로 반영 완료).
- **Related Files**: `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md`, `docs/reviews/codex_cycle2k_ocr_scanned_pdf_image_capability_plan_review.md`, `docs/reviews/codex_cycle2k_l3_preliminary_target_clarification_review.md`.

---

# Cycle 2L 기록 (D56) — 예선 L3 Implementation-Prep 로드맵

## D56. L3 달성을 sub-cycle(2L-1~2L-5)로 분해, L1 prep과 Gate D prep 분리, RH-B2는 L1 prep 포함, L1은 schema-free 경로 권고
- **Date**: 2026-07-03
- **Context**: Cycle 2K에서 예선 범위(최소 L0+L1 / target L0+L1+L2+L3 / 범위밖 L4) 확정 및 Codex PASS 후, 다음은 예선 target L3까지의 실제 implementation-prep. 코드 구조를 실측(read-only)해 근거 있는 실행 구조 필요.
- **Decision**: `docs/planning/cycle2l_preliminary_l3_implementation_prep.md` 작성 — 실측 결과(파이프라인이 findings에서 시작, `src/`에 인테이크/OCR 코드 없음, SKILL "매칭 실패≠미공시→확인 불가+질문"·`not_verifiable→missing_info+customer_questions` 라우팅이 이미 스키마/validator에 존재, evidence_anchor/source_documents는 `additionalProperties:false`) 기반으로:
  ① 실행 구조를 **sub-cycle 분해** — 2L-1(L1 prep: **RH-B2 종료 포함**·DEI-후보 계약·Skill 라우팅 지침·test plan) → 2L-2(L1 구현, core 무변경 목표) → **2L-3(Gate D prep/실행: 모델준비 egress↔파싱 no-egress 분리·native/LGPL Gate B 재검토·결정성·비민감 유형3 샘플)** → 2L-4(L2 구현, Gate D PASS 후) → 2L-5(L3 구현, Gate D+설계검증 후). 각 sub-cycle은 Codex 리뷰로 닫는다.
  ② **L1 prep과 Gate D prep 분리**(리스크 계층 상이 — L1은 무-신규-게이트, Gate D는 새 provider·native·egress 표면). ③ **RH-B2는 L1 prep의 첫 작업**(어댑터 호출 install 태세 검증이 L1 실행의 선행). ④ **L1은 schema-free 경로 권고**(위치는 자유텍스트 page_or_section/notes, 판독불가는 기존 not_verifiable 경로 → schema/validator/renderer/delivery **무변경**); 구조화 confidence/bbox/needs_ocr는 스키마 변경이라 **별도 결정+리뷰**로 분리. ⑤ 과장 방지 **Capability Status Ledger**(레벨별 planned/prep/gated/implemented/reviewed, 제품 문서는 implemented+reviewed만 "현재 기능"). ⑥ **손댈 영역**: 신규 옵션 인테이크/DEI 생산기(core 밖)·Skill 지침(저리스크)·(선택) schema-touch 경로.
- **Rationale**: 리스크를 한 번에 하나씩 여는 순차 게이트 구조가 "가장 안전·빠름"에 부합. L1이 이미 존재하는 라우팅 계약을 재사용하면 core 무변경으로 예선 하한선을 빠르게 확보하고, L2/L3는 Gate D를 물리적 선행으로 두어 target이면서도 과장·무단구현을 차단.
- **Consequences**: 승인 시 2L-1부터 착수. Gate D(2L-3) 통과 전 L2/L3 코드 착수 없음. Gate D 미통과 시 L0+L1 fallback 제출은 유효하되 "목표선 미달"로 구분 기록.
- **Status**: 로드맵 확정(문서만). **코드/dependency/schema/manifest/marketplace 미변경, OCR 엔진·API·Python·notebook·업로드 없음. Kordoc/Mistral 미도입.**
- **Related Files**: `docs/planning/cycle2l_preliminary_l3_implementation_prep.md`, `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md`, `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`, `docs/planning/cycle2i_3b_version_strategy_confirmation.md`, `src/schemas/kssb_findings.schema.json`, `src/skills/samil-kssb-precheck/SKILL.md`.

## 보류 항목(이후 결정)
- 생성 아키텍처·렌더러 코드 위치·도입 시점(승인 후 확정).
- 참고 엔진 재구현 범위.
- DOCX/HTML 실제 생성 구현 및 수동 검증 규칙의 자동화(경량 결정적 검증 단계).
- **로그 원본 제출 방식(repo 커밋 vs submission.zip 번들만)은 제출 패키징 단계에서 확정 — 현재 미확정.**
- OCR·문서 변환 파이프라인, 결정적 검증 엔진 도입.
- 산업별 KSSB 세부 지표 확장.
- (다음 단계는 ChatGPT·사용자 확인 후 결정. 이 문서에서 확정하지 않는다.)
