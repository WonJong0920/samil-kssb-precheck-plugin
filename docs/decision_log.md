# 의사결정 기록 (Decision Log) — Cycle 1 ~ 2I

> 사이클별 섹션: Cycle 1(D1~D10) → Cycle 2A 방향성(D11~D15) → Cycle 2B(D16~D21) → Cycle 2C(D22~D25) → Cycle 2D(D26~D29) → Cycle 2D Patch(D30) → Cycle 2E(D31) → Cycle 2F(D32) → Cycle 2G(D33) → Cycle 2G Patch(D34) → Cycle 2H(D35) → 운영 원칙(D36) → Cycle 2H Patch(D37) → Cycle 2H Evidence(D38) → Cycle 2I-0(D39) → Cycle 2I-0 Addendum(D40) → Cycle 2I-1(D41) → Cycle 2I-2(D42) → Cycle 2I-3 계획(D43) → Cycle 2I-3 guardrail(D44) → Cycle 2I-3A 계획(D45) → Cycle 2I-3A Runbook(D46) → Cycle 2I-3A Spike 실행(D47) → Cycle 2I-3B Adapter 설계(D48) → Cycle 2I-3B GatePrep 계획(D49) → Cycle 2I-3B Gate A 실행(D50) → Cycle 2I-3B Gate B 실행(D51) → Cycle 2I-3B Version Strategy 확정(D52) → Cycle 2J Mistral OCR4 벤치마크(D53) → Cycle 2K OCR/이미지 Capability Ladder(D54) → Cycle 2K Patch 예선 L3 목표 명확화(D55) → Cycle 2L 예선 L3 Implementation-Prep 로드맵(D56) → Cycle 2L-1 L1 Implementation-Prep·RH-B2 종결(D57) → Cycle 2L-2 L1 구현(D58) → Cycle 2L-2 Patch Intake Validation(D59) → Cycle 2L-2 Closure L1 승격(D60) → Cycle 2L-3A Gate D Preflight(D61) → Cycle 2L-3B0 Type 3 샘플 적합성 검토(D62) → Cycle 2L-3B0 Patch ver2 selected sample 검토(D63) → Cycle 2L-3B Gate D execution evidence(D64) → Cycle 2L-3C provider 비교(D65) → Cycle 2L-3D aux 스캐너 검토(D66) → Cycle 2L-4A L2 adapter boundary 설계(D67) → Cycle 2L-4B L2 ingest provisional 구현(D68) → Cycle 2L-4C OCR hash 무결성 패치(D69) → Cycle 2L-5 L2 closure/promotion 결정(D70) → Cycle 2L-5A historical wording cleanup(D71) → Cycle 2M-2 C2M1-MIN-01 wording refresh(D72) → Cycle 2M-5 output quality remediation(D73) → Cycle 2N-0A runner/provider blindspot pass(D74) → Cycle 2N-0B runner/provider UX 설계(D75) → Cycle 2N-0B-A Node 부재 UX 보정(D76) → Cycle 2N-1A HWP-first scope 결정(D77) → Cycle 2N-2 HWP-first 구현(D78) → Cycle 2N-3A nethook coverage patch(D79) → Cycle 2N-4 HWP-first assisted retest(D80).

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

---

# Cycle 2L-1 기록 (D57) — L1 Implementation-Prep + RH-B2 종결

## D57. RH-B2 종결(PASS), L1 schema-free DEI-후보 계약·hint convention·Skill routing draft·test plan 확정, Gate D 비실행 준비
- **Date**: 2026-07-03
- **Context**: 2L roadmap Codex PASS(minors C2L-MIN-01 RH-B2 evidence 구체화, C2L-MIN-02 Gate D 비실행 logistics 조기 시작) 후 2L-1 착수. L1 코드는 아직 미구현.
- **Decision**:
  ① **RH-B2 종결(PASS)** — `npm install kordoc@3.8.2 pdfjs-dist@4.10.38 --omit=optional` 클린 설치(119 packages, native/optional(`sharp`/`onnxruntime-node`/`@hyzyla/pdfium`/`@napi-rs/canvas`) 전부 부재, `.node` 0건)에서 유형1·유형2 파싱 4/4 성공, 4개 산출물 SHA-256이 **Gate A evidence와 바이트 일치** → optional/native는 v1 텍스트 경로에 무영향·미로드. evidence: `docs/samples/rh_b2_optional_exclusion_evidence_2026-07-03.md`(명령·버전·설치태세·native 부재·hash·redaction, C2L-MIN-01 충족).
  ② **L1 schema-free DEI-후보 계약 동결** — DEI는 findings 상위 문서수준 산출물(schema 아님), 어댑터(2L-2, core 밖) 생산·Skill 소비. 안정 필드(source_id·doc_quality·blocks{block_type·text_or_table_md·location_hint·extraction_quality·needs_ocr·warnings}·review_priority_hints) + 규칙(판정 미생성·원문 보존·결정성·실패 명시). ad-hoc 매핑 방지.
  ③ **hint convention** — findings `page_or_section`은 `p.<n> · <section_path>` 최소 사람표기(표/그림 라벨 허용), **bbox 좌표는 DEI `location_hint`에만**(findings 자유텍스트의 숨은 스키마화 방지, Codex 리스크 반영).
  ④ **L1 Skill routing draft**(실제 SKILL.md 수정은 2L-2) — 판독불가/저신뢰(needs_ocr·low quality·SKIPPED_IMAGE) → 미공시 단정 금지 → 기존 `not_verifiable`+`missing_info`+`customer_questions` 경로 재사용(스키마 allOf가 이미 강제 → **validator 무변경**). 차트수치·이미지의미·KSSB충족 추정 금지.
  ⑤ **L1 test plan** — 기존 3종(26·22·33) 수정 없이 green 유지(core 무변경 증거) + 신규 DEI 생산기 단위(결정성·감지→priority·판정 미생성·원문 보존)·계약(→findings validator 0 error)·경계(직접 유입 금지) 테스트.
  ⑥ **Gate D 비실행 준비(C2L-MIN-02)** — 유형3 샘플 기준(비민감·진짜 스캔·미암호화; **적합 샘플 미확보를 2L-3 선행 확보 항목으로 표기**)·로컬 OCR provider 후보 기준(로컬/오프라인·모델준비↔파싱 분리 가능·license 검토 가능·결정성)·Gate D evidence 빈 템플릿·no-execution 체크리스트. **설치·모델다운로드·OCR 실행·native/egress 개방 없음.**
  ⑦ **Capability Status Ledger**를 current_status에 반영(L0 implemented+reviewed / L1 prep / L2·L3 planned·Gate D-blocked / L4 out-of-scope).
- **Rationale**: RH-B2를 실측으로 닫아 L1이 어댑터 경로에 의존하기 전 선행조건 충족. schema-free 경로로 core를 건드리지 않고 예선 하한선(L1)을 빠르게 확보. Gate D 비실행 준비로 예선 target(L2/L3) 일정 리스크를 게이트 위반 없이 축소.
- **Consequences**: 2L-2(L1 구현) 착수 조건 = 본 문서 Codex PASS + 사용자/ChatGPT 승인. 2L-2는 신규 인테이크/DEI 생산기(core 밖)+Skill 지침만, schema/validator/renderer/delivery 무변경 목표. Gate D(2L-3) 통과 전 L2/L3 코드 없음.
- **Status**: prep 확정. **L1 코드·schema·validator/renderer/delivery·package 미변경, OCR provider 미설치/미실행, API/Python/notebook/업로드 없음. `node_modules`·lock·파싱 산출물 repo 미커밋.**
- **Related Files**: `docs/planning/cycle2l_1_l1_implementation_prep.md`, `docs/samples/rh_b2_optional_exclusion_evidence_2026-07-03.md`, `docs/planning/cycle2l_preliminary_l3_implementation_prep.md`, `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`, `src/schemas/kssb_findings.schema.json`, `src/skills/samil-kssb-precheck/SKILL.md`.

---

# Cycle 2L-2 기록 (D58) — L1 구현 (Optional Intake → DEI Producer, core 무변경)

## D58. L1을 core 밖 선택적 인테이크→DEI producer로 구현, schema/validator/renderer/delivery 무변경, 기존 not_verifiable 경로 재사용
- **Date**: 2026-07-03
- **Context**: 2L-1 Codex PASS(findings 0) + 승인 후 2L-2(L1 구현) 착수. 범위 = 선택적 인테이크/DEI producer(core 밖) + Skill routing + 테스트. Gate D/L2/L3 아님.
- **Decision**:
  ① **`src/intake/dei_producer.py`**(신규, 표준 라이브러리) — 이미 로컬 추출된 인테이크 산출물(Kordoc `--format json` 형태)을 DEI-candidate로 **결정적** 정규화. `build_dei_candidate()`·`page_or_section_hint()`(findings-side, bbox 제외). **판정 미생성·원문 보존·실패 명시**. 인테이크 도구/OCR/네트워크 **미실행**(이미 만들어진 JSON만 변환).
  ② **`src/intake/README.md`** — 이 폴더가 core 아님(opt-in/local, findings 파이프라인 밖) 명시.
  ③ **Skill routing** — `evidence_mapping_rules.md` §6 신설 + `SKILL.md` Inputs 최소 보정: 스캔/이미지/저신뢰 신호 → **기존** `not_verifiable`+`missing_info`+`customer_questions` 경로. 위치는 `p.<n> · <섹션>` 자유텍스트(**bbox는 DEI에만**). priority→판정 직접 매핑 금지. OCR 실행·도표 구조 분류는 현재 기능 아님(후속 게이트) 명시.
  ④ **`tests/test_intake_dei_producer.py`**(신규, **14/14 PASS**) — 결정성·judgment 미생성·원문/표 셀 보존·감지→priority hint·findings 힌트 bbox 미포함·실패 예외·**core 미import**(직접 유입 방지).
  ⑤ **core 무변경 판단**: L1 감지·라우팅은 기존 스키마/판정 경로로 충분 → **schema-evolution 불필요**. `schema`·`validator`·`renderer`·`delivery` 코드 미변경(기존 26·22·33 테스트 수정 없이 green 유지로 증명).
- **Rationale**: DEI를 findings 상위 문서수준 재료로만 두고 Skill이 기존 not_verifiable 경로로 라우팅하면, core 경계(Skill-first·detect-only·no re-judgment·delivery separation·source-bound·human-review)를 건드리지 않고 예선 하한선(L1)을 확보할 수 있다. 구조화 필드가 필요치 않아 스키마도 손대지 않음.
- **Consequences**: L1 = implemented(2L-2). Codex Review PASS 시 Capability Status Ledger에서 `implemented+reviewed`로 승격(그 전 제품 문서 "현재 기능" 확정 표기 유보). L2/L3는 Gate D(2L-3) 통과 전 코드 없음. 실제 Kordoc→intake JSON 생산은 사용자 로컬 out-of-band, 어댑터는 변환만.
- **Status**: L1 구현 완료(테스트 PASS). **schema/validator/renderer/delivery/manifest/marketplace/package·dependency 미변경, OCR provider 미설치/미실행, API/notebook/외부 업로드 없음, node_modules·lock·raw artifact 미커밋.** Codex Review 대기.
- **Related Files**: `src/intake/dei_producer.py`, `src/intake/README.md`, `tests/test_intake_dei_producer.py`, `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`, `src/skills/samil-kssb-precheck/SKILL.md`, `docs/cycle2l_2_l1_intake_completion_report.md`, `docs/planning/cycle2l_1_l1_implementation_prep.md`.

---

# Cycle 2L-2 Patch 기록 (D59) — Intake Validation Fix (Codex CONDITIONAL PASS 해소)

## D59. 최소 인테이크 계약 강제(malformed는 IntakeError), not_verifiable 위치힌트 문구 정리, trailing whitespace 제거
- **Date**: 2026-07-03
- **Context**: `docs/reviews/codex_cycle2l_2_l1_implementation_review.md`가 **CONDITIONAL PASS** — C2L2-MAJ-01(입력 검증이 너무 관대해 `build_dei_candidate({}, "doc-1")`가 빈 DEI 반환, L1 ledger 승격 blocking), C2L2-MIN-01(§6 위치힌트 문구가 not_verifiable에 evidence_anchor를 다는 것처럼 읽힘), C2L2-MIN-02(decision_log 후행 공백). narrow patch로 해소.
- **Decision**:
  ① **C2L2-MAJ-01** — `dei_producer.py`의 `_require` → `_validate_intake_contract`. **최소 계약**: `success == true` · `metadata.pageCount`(int≥1) · `blocks`(list) · `pageQuality`(비어 있지 않은 list) · `qualitySummary`(object); (존재 시) `outline`/`warnings` list. 위반은 **`IntakeError`**(조용한 빈 DEI 금지). **"유효하지만 근거 빈약"(스캔 전용 blocks=[])는 pageQuality/qualitySummary/pageCount로 허용**해 malformed와 구분. negative 11건 + 스캔 전용 positive 1건 테스트 추가(14→**26/26 PASS**).
  ② **C2L2-MIN-01** — `evidence_mapping_rules.md` §6: 판독 불가 위치는 `missing_info`/고객질문(`requested_material`)에 싣고 **not_verifiable에 evidence_anchor 미생성**. `evidence_anchor.page_or_section`은 **읽을 수 있는 근거(confirmed/partial)에만**. bbox는 어느 경우도 findings 미포함.
  ③ **C2L2-MIN-02** — `decision_log.md` D58 `- **Decision**:` 라인 후행 공백 제거(`git diff --check` clean).
- **Rationale**: 계약을 강제하되 스캔 전용(L1 핵심 대상)을 배제하지 않도록 `pageQuality`/`qualitySummary`를 최소 구조 신호로 요구해 evidence-poor와 malformed를 구분. Codex도 schema-evolution 불필요·schema-free 유효를 확인.
- **Consequences**: MAJ-01 해소 → **Codex patch review PASS 시 L1을 `implemented+reviewed`로 승격** 가능(그 전엔 유보). 이후 2L-3(Gate D). schema/validator/renderer/delivery 코드·package 무변경 유지.
- **Status**: patch 완료(intake 26/26, 코어 26·22·33 green, `git diff --check` clean). **schema/validator/renderer/delivery/manifest/package 미변경, OCR/API/notebook/업로드 없음.** Codex patch review 대기.
- **Related Files**: `src/intake/dei_producer.py`, `tests/test_intake_dei_producer.py`, `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`, `docs/cycle2l_2_l1_intake_completion_report.md`(§8), `docs/reviews/codex_cycle2l_2_l1_implementation_review.md`.

---

# Cycle 2L-2 Closure 기록 (D60) — L1을 implemented+reviewed로 승격

## D60. Codex patch review PASS에 따라 L1 승격, C2L2 finding 전부 종결, 다음은 Gate D(미실행)
- **Date**: 2026-07-04
- **Context**: Cycle 2L-2 L1 patch(D59)에 대한 Codex patch review(`docs/reviews/codex_cycle2l_2_l1_patch_review.md`)가 **PASS**(Critical/Major/Minor 0). C2L2-MAJ-01(malformed→IntakeError 최소 계약)·C2L2-MIN-01(not_verifiable 위치힌트 문구)·C2L2-MIN-02(trailing whitespace) **전부 종결** 확인. 테스트 intake 26/26·코어 26·22·33 green 재확인. 이번 작업은 status closure(문서만).
- **Decision**: Capability Status Ledger에서 **L1을 `implemented(2L-2), review 대기` → `implemented+reviewed`로 승격**. 근거 commit/review: L1 구현 `045e617217df8b5740eba08aa5d5b21386d89527`, L1 patch `0fa52d839ddfb4dacb9f91f5709c813e7e3b7d71`, patch review PASS `e8f90164404fa28e4fcf70dbaa1bbee5d9a9f170`. **L2/L3는 planned·Gate D-blocked 유지, L4는 out-of-preliminary-scope 유지.**
- **Consequences**: 다음 단계 = **Cycle 2L-3 Gate D prep/execution**(사용자/ChatGPT 결정 후 착수 가능, 아직 실행 전). **Gate D 통과 전까지 L2/L3 코드·OCR provider 설치/실행·모델 다운로드·native/egress 개방 금지.** 제품 문서는 이제 L1을 현재 기능으로 표기 가능(L2/L3는 금지).
- **Status**: closure 완료(status 문서만). **코드/테스트/schema/validator/renderer/delivery/manifest/package·dependency 무변경, OCR/API/notebook/업로드 없음.** (코드 변경 없음으로 테스트 미재실행 — patch review에서 26/26·26·22·33 green 확인됨.)
- **Related Files**: `docs/current_status.md`, `docs/reviews/codex_cycle2l_2_l1_patch_review.md`, `docs/cycle2l_2_l1_intake_completion_report.md`.

---

# Cycle 2L-3A 기록 (D61) — Gate D Preflight / Execution Plan (no-execution)

## D61. Gate D 실행 전 preflight·evidence template·pass/fail 기준 확정, provider 조기 고정 금지, 실행은 승인 후 별도
- **Date**: 2026-07-04
- **Context**: L1 `implemented+reviewed` 승격(D60) 후 다음 단계 = Cycle 2L-3 Gate D. 실행 전 preflight 문서·evidence plan 확정이 필요. 이번 작업은 **no-execution prep**.
- **Decision**: `docs/planning/cycle2l_3_gate_d_preflight_plan.md` 작성 —
  ① **Gate D 목적/범위**: **모델/도구 준비 egress(허용·기록) ↔ 파싱/OCR 실행 no-egress(Gate A 방식 증거) 분리**, native/optional/license = **Gate B 재검토**, 비민감 Type 3 샘플, OCR 결과는 **DEI candidate/검수 신호로만**(판정 미생성). **Gate D ≠ L2/L3 구현, 통과 전 L2/L3 코드 금지.**
  ② **Type 3 샘플 기준**(비민감·공개/synthetic·실제 스캔/저텍스트·PII/KSSB판단 없음; 원본 PDF repo 커밋 보류) — **현재 미확보**로 명시, 임의 생성·다운로드 금지.
  ③ **OCR provider 평가 기준 우선(9개)·후보 나열만**(Kordoc `--formula-ocr`/Tesseract 계열/로컬 ONNX — 설치·실행 금지, provider 조기 고정 금지).
  ④ **Gate D evidence 빈 템플릿**(환경·provider 버전·준비/파싱 명령·egress 차단·outbound 관측·native/바이너리·license·input/output/rerun hash·redaction·판정·잔여 리스크).
  ⑤ **PASS/CONDITIONAL PASS/FAIL 기준** + **이후 경로**(PASS→2L-4 L2 / CONDITIONAL→조건해소 patch·review / FAIL→L1 fallback+목표선 미달; L3는 Gate D PASS+설계검증 전 금지).
- **Consequences**: 다음 단계 = 사용자/ChatGPT 승인 후 **Gate D execution(2L-3B 등)**. 그 전까지 OCR provider 설치/실행·모델 다운로드·native/egress 개방·L2/L3 코드 없음.
- **Status**: preflight 확정(문서만). **OCR provider 설치/실행·모델 다운로드·API 호출·notebook·Python OCR 실행·외부 다운로드·샘플 PDF 생성/커밋 없음. package/lock/schema/validator/renderer/delivery 무변경.** L1=implemented+reviewed 유지, L2/L3=Gate D-blocked. 실제 evidence 값 미생성(빈 템플릿). Gate D **아직 실행 전**.
- **Related Files**: `docs/planning/cycle2l_3_gate_d_preflight_plan.md`, `docs/planning/cycle2l_1_l1_implementation_prep.md`, `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`, `docs/samples/rh_b2_optional_exclusion_evidence_2026-07-03.md`, `docs/submission_packaging_policy.md`.

## D62. Gate D 후보 PDF = 강한 Type 3(292p 전면 스캔·텍스트 0), 채택은 육안 PII 점검·소수 페이지 선별 전제, 원본 미커밋
- **Date**: 2026-07-04
- **Context**: Cycle 2L-3A preflight(D61) 후 사용자가 Gate D 후보 PDF를 로컬 제공. Gate D execution 전 **샘플 적합성만** 검토(2L-3B0). OCR·provider 설치·모델·API·notebook·이미지 렌더링 없음.
- **Decision**: 이미 설치된 read-only 도구(PyMuPDF `fitz`·poppler `pdftotext`)로만 검사 →
  ① **기술 적합성**: 292페이지 **전면 스캔/이미지 기반, 텍스트 레이어 0**(전 페이지 추출 텍스트 0자, 두 도구 교차검증), 비암호화, metadata PII 항목 없음(변환 도구명만), SHA-256 `be9bfb1a4907cc0928a33e058cfaa94e4fc0810a8dd5a92b5175a1710b2ed363` → **Type 3 요건 충족**(진짜 스캔·`needsOcr` 자명).
  ② **PII 위험**: 텍스트 레이어가 전무해 **이미지 내부 PII는 구조검사만으로 미확인**(이미지 미렌더링). email/전화 패턴 0건은 텍스트 부재 때문이며 PII 부재 증거 아님 → **사람 육안 점검 필요**, 출처/공개성은 사용자 확인 대상.
  ③ **권장 사용 범위**: 전량 292p 지양, **육안 PII 점검 통과 대표 소수 페이지(3–5p)만** 선별 사용(노출면·determinism 비용 축소).
  ④ **repo artifact**: 원본 PDF = `submission_packaging_policy.md` §1 **E-분류 → repo 미커밋**. `.gitignore`에 `*.pdf`/`*.PDF` 추가로 실수 커밋 차단(tracked PDF 0건 확인, 원본 untracked·ignored), 본문은 **hash·관찰만** 기록.
- **Consequences**: 샘플 자체는 부적합 아님. **선별·PII 육안 점검·출처 확인이 선행 조건(CONDITIONAL readiness)** → **바로 Gate D execution 아님**. OCR provider 선정(preflight §3)·no-egress evidence(§1/§4)는 Gate D 실행 시 별도 수행. 사용자/ChatGPT 승인 후 Gate D execution(2L-3B 등).
- **Status**: **docs-only sample suitability review.** OCR provider 설치/실행·모델 다운로드·API 호출·notebook·외부 다운로드·이미지 렌더링/래스터화·원본 PDF repo 커밋 없음. 변경: 신규 suitability 문서 + current_status + `.gitignore`(`*.pdf` 방어) + 본 D62. 코드/package/lock/schema/validator/renderer/delivery 무변경. L1=implemented+reviewed 유지, L2/L3=Gate D-blocked. Gate D **아직 실행 전**.
- **Related Files**: `docs/samples/gate_d_type3_sample_suitability_review_2026-07-04.md`, `docs/planning/cycle2l_3_gate_d_preflight_plan.md`, `docs/submission_packaging_policy.md`, `.gitignore`.

## D63. ver2(9p) = Gate D selected sample(292p source보다 우수), 채택은 선별 9p PII 확인·출처 확인 전제, 원본·ver2 미커밋
- **Date**: 2026-07-04
- **Context**: D62(292p source candidate 검토) 후 사용자가 292p에서 대표 9페이지를 선별한 **ver2 PDF**(repo 밖 경로)를 제공. Gate D execution 전 **selected sample 적합성만** 검토(2L-3B0 Patch). OCR·provider·모델·API·notebook·이미지 렌더링 없음.
- **Decision**: read-only 도구(`fitz`·`pdftotext`)로만 검사 →
  ① **기술 적합성**: 9페이지 **전면 스캔/이미지 기반, 텍스트 레이어 0**(전 페이지 0자, 두 도구 교차검증), 비암호화, metadata PII 없음, 292p와 동일 스캔 프로파일. SHA-256 `238de8be151da74023a5e1287e104a30a19c7c7a40aaa80749ceeb3cc843c5a3` → **Type 3 충족, Gate D 샘플로 292p source보다 우수**(분량 축소→PII 노출면·determinism 재실행 비용 감소, 사람 선별).
  ② **PII 위험**: 이미지 내부 PII는 여전히 구조검사만으로 미확인(미렌더링). 단 292p→9p 축소는 사람 큐레이션이라 위험 축소 → **선별 9p 사용자 PII 확인**(이름·서명·연락처)과 **출처/공개성 확인**이 남는 경량 조건.
  ③ **권장 범위**: **ver2 전체 9p 사용 가능**(위 2개 확인 전제). 추가 선별·synthetic 불요.
  ④ **문서 관계**: 292p = **source candidate**(D62 문서 유지, 삭제 안 함), ver2 = **selected sample candidate = Gate D 실행 대상**. hash 각각 구분. 신규 `docs/samples/gate_d_type3_selected_sample_review_2026-07-04.md` 작성 + 292p 문서에 참조 추가.
  ⑤ **artifact**: 원본·ver2 PDF **모두 repo 미커밋**(submission 정책 E-분류). `.gitignore` `*.pdf` 방어 유지, tracked PDF 0건, hash·관찰만 기록.
- **Consequences**: 선행조건 3개 중 ①소수 페이지 선별=충족 / ②PII 육안 점검=부분 충족(9p 명시 확인 잔여) / ③출처·공개성=미해소. 남은 조건 + OCR provider 선정(preflight §3)·no-egress evidence(§1/§4)는 Gate D 실행 시. **바로 execution 아님 → Codex Review 후 사용자/ChatGPT 승인 → Gate D execution(2L-3B 등).**
- **Status**: **docs-only selected sample review update.** OCR provider 설치/실행·모델 다운로드·API·notebook·외부 다운로드·이미지 렌더링·원본/ver2 PDF repo 커밋 없음. 변경: 신규 selected sample 문서 + 292p 문서 참조 1건 + current_status + `.gitignore` 방어 유지(무변경) + 본 D63. 코드/package/lock/schema/validator/renderer/delivery 무변경. L1=implemented+reviewed 유지, L2/L3=Gate D-blocked. Gate D **아직 실행 전**.
- **Related Files**: `docs/samples/gate_d_type3_selected_sample_review_2026-07-04.md`, `docs/samples/gate_d_type3_sample_suitability_review_2026-07-04.md`, `docs/planning/cycle2l_3_gate_d_preflight_plan.md`, `docs/submission_packaging_policy.md`, `.gitignore`.

## D64. Gate D execution evidence — tesseract.js(WASM) 선정·onnxruntime 기각, 파싱 no-egress·결정성·permissive 확인, 최종 verdict Codex 보류
- **Date**: 2026-07-04
- **Context**: Codex 2L-3B0 PASS + 사용자 확인(ver2 9p **PII 없음**·**공식 홈페이지 다운로드**) 후 Gate D **execution evidence cycle**(2L-3B). preflight §1(준비 egress↔파싱 no-egress 분리)·§3(provider 기준)·§4(evidence)·§5(PASS/FAIL) 적용. **모두 repo 밖 임시 디렉터리**.
- **Decision(evidence, 판정 아님)**: 샘플 hash 일치(`238de8be…`, 9p) 확인 후 —
  ① **provider**: 후보 평가 → **rapidocr-onnxruntime 기각**(onnxruntime **native DLL 초기화 실패**, VC++ present에도 실패 = preflight §3 native/#7 Windows 리스크 실사례) → **tesseract.js 7.0.0 + core 7.0.0 선정**(순수 JS+WASM, native 바이너리 0, tessdata_fast kor+eng). Kordoc `--formula-ocr`(수식 전용)·native Tesseract(미설치)는 제외.
  ② **준비 egress(허용·기록)**: tesseract.js=npm registry + tessdata_fast(GitHub raw, eng/kor hash 기록), rapidocr=PyPI(hash 기록). project package/lock/venv/source **무변경**(repo 미변경). 파싱과 분리.
  ③ **파싱 no-egress**: Gate A 방식 Node 훅(dns/net/tls/http(s) block+record) + **worker_threads.Worker 패치로 worker thread 확장**. control: C1 monitor 포착·C2 원격 `8.8.8.8:53` 차단·worker에서도 차단 확인. 파싱 중 **outbound 0**(main observedTotal=0, worker hooked=WORKERS_CREATED 1, block 하 OCR 성공·완주 ⇒ 두 스레드 egress 0). 한계: Node 런타임 레벨(OS/커널 아님, 비차단).
  ④ **결정성**: 3회 output text SHA-256 **동일**(`546926ec…`).
  ⑤ **native/license**: provider 트리 13패키지 **전부 permissive**(Apache-2.0/MIT/BSD-2), **native 0**(wasm 6), traineddata Apache-2.0. **RH-B2 native 재유입 없음**(선정 provider가 native 미도입). repo/package/submission 미포함.
  ⑥ **artifact/redaction**: ver2 PDF·PNG·OCR원문·모델·venv·node_modules **repo 미커밋**(tracked 0), 로컬 경로·계정·토큰 미노출, OCR 원문 미기재(집계·hash만). `.gitignore` `*.pdf` 유지.
- **Consequences**: **provisional outcome = all criteria observed** — 단 **최종 Gate D PASS/FAIL은 Codex Review 보류**(운영 원칙: Claude Code 판정 금지). **Codex evidence-review PASS + 사용자/ChatGPT 승인 전까지 L2/L3 구현 금지**(Gate D-blocked 유지). OCR 결과는 **DEI candidate/검수 신호로만**(판정 미생성·renderer/validator 직접 유입 금지). 정확도는 게이트 기준 아님·미주장.
- **Status**: evidence 문서만. **schema/validator/renderer/delivery/src/tests/manifest/package/lock/marketplace 무변경, cloud/외부 API OCR 미사용, submission.zip 없음.** 실행(설치·모델·OCR)은 전부 repo 밖. L1=implemented+reviewed 유지. Gate D는 **evidence 생성 완료·Codex 판정 대기**.
- **Related Files**: `docs/samples/gate_d_ocr_evidence_2026-07-04.md`, `docs/planning/cycle2l_3_gate_d_preflight_plan.md`, `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`, `docs/samples/rh_b2_optional_exclusion_evidence_2026-07-03.md`, `docs/samples/gate_d_type3_selected_sample_review_2026-07-04.md`.

## D65. 2L-3C provider 비교 — Kordoc(3.13.0)+tesseract.js 조합 구도를 provisional로, 3.15.0 source 미검증 limitation, 확정은 리뷰 후
- **Date**: 2026-07-04
- **Context**: Gate D PASS(Codex, D64 evidence) 후 nonblocking follow-up으로 문서분석 provider 비교(2L-3C). tesseract.js는 Gate D-proven baseline일 뿐 최종 L2 provider 아님. 모든 설치·실행·raw 산출물은 repo 밖.
- **Decision(evidence, 확정 아님)**: sample 5종(유형3 스캔 ver2 9p — expected hash·9p 일치 확인 / 텍스트레이어 PDF 11p / HWP v5 / HWPX / DOCX)을 Kordoc·pdfjs-dist@6 baseline·PyMuPDF·poppler·stdlib zip+xml·tesseract.js(Gate D 기록)로 비교 —
  ① **version policy**: kordoc npm observed latest **3.13.0** 사용(+3.8.2 교차확인). **GitHub source 3.15.0과 불일치** — source install은 `dist` 부재(빌드 필요)로 실행 불가 → **source-aligned 비교 불가 = limitation**. pdfjs-dist는 peer(`>=4.0.0`)라 latest 6.1.200 먼저 시도 → **kordoc PDF 파싱 FAIL**(v6 API 변경, `doc.destroy` 제거 실측) → **4.10.38 fallback**(사유 기록). 독립 pdfjs@6 baseline은 별도 행.
  ② **결과**: Kordoc 5포맷 전부 success·**10/10 run 파싱 no-egress(Gate A 방식 훅, egress 0)**·**5/5 쌍 결정적**(hwp/hwpx/ver2는 3.8.2와 바이트 동일). 텍스트레이어 PDF 한글 98.8% 커버 + heading 3계층·표 25(셀 628 rows/cols 복원)·outline 39·needsOcr 혼합페이지 감지. **HWP v5 파싱 유일**(175블록·image 70 감지). 스캔 ver2 = needsOcr 9/9 신호(OCR 불가 — tesseract.js 11,852자와 상호보완). 공백: DOCX 이미지 미감지·HWPX heading 0·caption 미지원.
  ③ **운영 안전성**: kordoc `--omit=optional` 117pkg·native 0(RH-B2 유지)·MIT. PyMuPDF(AGPL dual)/poppler(GPL)는 제품 경로 부적합 — 검사·교차검증용만(no-egress는 not verified로 정직 기록).
  ④ **DEI 적합성**: kordoc JSON(pageNumber/bbox/type/표/needsOcr)이 기존 DEI-candidate 계약과 정합 — evidence anchor 후보·not_verifiable 라우팅에 직접 사용 가능. tesseract.js는 평문(어댑터 가공 필요).
- **Consequences**: **provisional recommendation = Kordoc(구조·다포맷 인테이크) + tesseract.js(스캔 OCR fallback) 조합 구도** — 단 **provider 최종 확정 아님**(3.15.0 미검증·pdfjs 4.10.x pin 유지 필요·DOCX/HWPX 감지 공백). **다음 = Codex Review**, 이후 사용자/ChatGPT 분기(L2 implementation-prep vs 3.15.0 source 재비교). **L2/L3 구현 계속 금지.**
- **Status**: comparison evidence 문서만. 원본/raw JSON/OCR 원문/node_modules/venv **미커밋**(tracked 0). schema/validator/renderer/delivery/src/tests/manifest/package/lock 무변경. cloud/외부 API OCR 미사용, KSSB 판단 미생성. tesseract.js 재실행 없음(Gate D 기록 재인용).
- **Related Files**: `docs/samples/provider_document_analysis_comparison_2026-07-04.md`, `docs/reviews/codex_cycle2l_3b_gate_d_evidence_review.md`, `docs/samples/gate_d_ocr_evidence_2026-07-04.md`, `docs/planning/cycle2i_3b_version_strategy_confirmation.md`.

## D66. 2L-3D aux 스캐너 검토 — stdlib zip+xml 채택 권고(확정 아님), python-docx 비권장(native lxml), gap 3종 실측 해명
- **Date**: 2026-07-05
- **Context**: Codex 2L-3C PASS의 follow-up #4(DOCX 이미지 미감지·HWPX heading 0·caption 미지원을 adapter 설계 전 검토)를 이행. L2 실제 구현 전 보조 구조 스캐너의 타당성 검토(2L-3D). 실행·설치는 전부 repo 밖, 제품 코드 미추가.
- **Decision(검토 의견, 확정 아님)**: sample HWPX/DOCX(hash 2L-3C 기록 일치 재확인)를 stdlib zip+xml 심층 스캔·python-docx 실측·Kordoc 3.13.0 산출물(2L-3C)과 3자 대조 —
  ① **DOCX 이미지 gap 보강 확정**: Kordoc image 블록 0이나 stdlib이 `w:drawing` 70·image relationship 71·media 리소스 14를 감지(3계층 분해로 파일 재사용까지 식별).
  ② **표 불일치 해명**: raw 태그 HWPX 32/DOCX 30 vs Kordoc 25 = **중첩 표 각 5**(DOCX는 top-level 25로 Kordoc과 정확 일치) + HWPX 잔여 2(미해명 → review_required 신호로 유지).
  ③ **caption 후보 164**: "표 제목" 스타일 문단 164(+DOCX "캡션" 스타일 정의·사용 0·SEQ 0) — Kordoc·python-docx 모두 비가시, 스타일 기반 caption 후보 추출 유효.
  ④ **HWPX heading 0의 실체**: 개요류 스타일 15종 정의·본문 문단 사용 0(표 제목 164·기타 1) → Kordoc heading 0은 이 샘플에선 결손 아님. 매핑 기제는 작동 — 개요 스타일 실사용 샘플로 재검증 항목.
  ⑤ **python-docx 비권장**: lxml 6.1.1 native `.pyd` 7개 강제(RH-B2 격리 native 클래스·onnxruntime 실패 전례), inline_shapes 과소(68 vs 70), 본문 순회 한계로 셀 내 문단 비가시, HWPX 미지원. **stdlib이 의존성 0으로 전 신호 동등 이상**(2회 스캔 SCAN_SHA `e547efcb…` 동일·네트워크 모듈 미사용). defusedxml=하드닝 후보만, lxml/docx2python=동일 사유 비권장, olefile=범위 밖.
  ⑥ **auxiliary signal model 설계 제안**: image 3계층(resource/relationship/instance)+detection_gap, table top/nested+mismatch, heading 스타일 정의/사용 분해, caption_candidate_count, review_required_reason — DEI candidate(결정적 사실)와 review-signal(gap 플래그, 판정 매핑 금지)을 분리. findings 스키마 불변 전제.
- **Consequences**: **provisional 구도(확장) = Kordoc + tesseract.js + stdlib aux 스캐너**(확정 아님). 다음 = **Codex Review** → 승인 시 L2 implementation-prep(가역적 adapter 경계). **L2/L3 구현·provider 최종 확정 계속 금지.** follow-up: HWPX 잔여 표 2건 원인 분류·개요 스타일 실사용 샘플 재검증·defusedxml 판단·(기존) Kordoc 3.15.0 source 재비교.
- **Status**: evidence 문서만. 준비 egress = `pip install python-docx`(repo 밖 venv, 기록)뿐 — stdlib 경로는 설치 0. project package/lock/requirements/source/schema/validator/renderer/delivery/tests/manifest **무변경**. 원문/raw XML/추출물/venv 미커밋(tracked 0). KSSB 판단 미생성. L1=implemented+reviewed 유지.
- **Related Files**: `docs/samples/hwpx_docx_auxiliary_structure_scanner_review_2026-07-05.md`, `docs/reviews/codex_cycle2l_3c_provider_comparison_review.md`, `docs/samples/provider_document_analysis_comparison_2026-07-04.md`, `src/intake/dei_producer.py`(read-only 참조).

## D67. 2L-4A L2 adapter boundary 설계 — runner/ingest 분리·artifact 계약 3종·ocr_supplement·스키마 불변, 구현은 리뷰 후 2L-4B
- **Date**: 2026-07-05
- **Context**: Codex 2L-3B/3C/3D 연속 PASS로 provisional 구도(Kordoc+tesseract.js+stdlib aux 스캐너)가 성립. L2 실제 구현 전, 이 구도를 제품 코드에 결합하지 않는 **가역적 adapter boundary**로 설계할 필요(2L-4A, implementation-prep). 실제 구현·provider 확정은 하지 않음.
- **Decision(설계 확정 — 구현은 별도 승인)**: `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md` 작성 —
  ① **경계 원칙**: plugin core는 provider를 실행하지 않는다. L2 = runner 층(사용자 로컬 out-of-band: Kordoc CLI·tesseract.js, 준비 egress 허용·기록 ↔ 파싱 no-egress 훅) + ingest 층(`src/intake/` stdlib-only, 이미 만들어진 산출물만 정규화). **경계 = artifact 계약 3종** — intake.json(기존 L1 계약 불변)·ocr_text.json(신규: provider/모델/hash/no-egress provenance 필수, needsOcr 페이지 정합 fail-fast)·aux_signals.json(2L-3D 모델) → 계약만 맞추면 provider 교체 가능(가역성).
  ② **병합 규칙(additive)**: OCR 텍스트는 blocks 미혼입, **별도 `ocr_supplement` optional 섹션**(extraction_quality="low" 고정 — 텍스트레이어 원문과 출처 구분, Gate D 정확도 미보증 계승). aux counts는 `aux_structure` optional 섹션. gap 플래그(image_detection_gap·table_count_mismatch 등)는 기존 `review_priority_hints`에만 — **기존 §6 경로(not_verifiable+missing_info+customer_questions) 전용, 판정 매핑·evidence_anchor 생성 금지**(Codex 2L-3D DEI/review-signal 분리 준수).
  ③ **core 불변**: findings 스키마·validator·renderer·delivery·manifest·package/lock 무변경. aux 필드의 findings 유입 금지(숨은 스키마화 방지, L1 bbox 원칙 동일).
  ④ **검증 구조 계승**: pin/fail-fast(kordoc@3.13.0·pdfjs-dist@4.10.38·tesseract.js@7.0.0·traineddata hash 고정, 미검증 버전 거부·auto-upgrade 금지), Gate A/D 방식 no-egress(worker 포함), native/license(runner는 repo 밖 --omit=optional·ingest는 stdlib), 결정성 2회 hash, artifact E-분류 미커밋·[REDACTED_LOCAL_PATH].
  ⑤ **테스트 전략**: aux scanner contract(결정성·network import 금지·member allowlist·bounded read·zip-slip 거부·raw XML 미보존)·병합 contract(무판정·blocks 불변·페이지 정합 IntakeError·하위 호환)·core 미import·기존 4종(26/22/33/26) 무수정 green. fixture는 합성 소형만.
  ⑥ **2L-4B 파일 목록**: 신규 aux_structure_scanner.py+테스트 / 최소 확장 dei_producer.py+테스트+README / 문서 미세 보정(§6·SKILL Inputs). **open questions**: runner 스크립트 repo 커밋 여부(기본안: thin runner 커밋, Codex 의견 요청)·DEI_VERSION 유지(기본안 "1")·OCR 유래 인용 표기 형식.
- **Consequences**: 다음 = **Codex Review(본 설계)** → 사용자/ChatGPT 승인 → **2L-4B L2 구현**(구현 후 Codex 구현 리뷰 필수). 그 전까지 L2/L3 코드·provider 최종 확정·제품 문서의 L2/L3 "현재 기능" 표기 금지. follow-up 계승: kordoc 3.15.0 재비교·HWPX 잔여 표 2건·개요 스타일 실사용 샘플·defusedxml·OS 레벨 egress.
- **Status**: 설계 문서만(design-only). src/tests/schema/validator/renderer/delivery/manifest/package/lock 무변경, 설치·실행·egress 없음, raw artifact 미커밋. L1=implemented+reviewed·Gate D PASS 유지, L2/L3=blocked 유지.
- **Related Files**: `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`, `docs/reviews/codex_cycle2l_3d_auxiliary_scanner_review.md`, `docs/reviews/codex_cycle2l_3c_provider_comparison_review.md`, `docs/reviews/codex_cycle2l_3b_gate_d_evidence_review.md`, `src/intake/dei_producer.py`(read-only 기준).

## D68. 2L-4B L2 ingest provisional 구현 — aux scanner + DEI additive 병합(runner 미포함), Codex 구현 리뷰 전 승격 없음
- **Date**: 2026-07-05
- **Context**: Codex 2L-4A 설계 리뷰 **PASS**("2L-4B may proceed without runner scripts by implementing only ingest contracts first"). 2L-4A 설계에 따라 repo-side ingest 구현부만 최소 구현(2L-4B). **provisional implementation — L2 최종 승격·provider 확정 아님.**
- **Decision(구현)**:
  ① **`src/intake/aux_structure_scanner.py`(신규, stdlib-only)**: HWPX/DOCX zip+xml에서 문서 수준 보조 신호 추출 — 이미지 3계층(resource/relationship/instance)·표 태그/top-level/중첩 분해·caption 후보(캡션류 스타일 문단+caption 태그+SEQ 필드)·heading 스타일 정의/사용 분해·chart relationship. 포맷 감지는 zip 내용 기준. **방어**: member allowlist(내용 읽기는 header/section/document/styles/rels만, 리소스는 이름만 카운트)·bounded read(멤버/총합 상한)·zip-slip 멤버명 거부·raw XML/이미지/본문 텍스트 미보존·네트워크 모듈 미import. 실패는 `AuxScanError` fail-fast.
  ② **`dei_producer.py` additive 확장**: `build_dei_candidate(..., ocr_text=None, aux_signals=None)` — `_validate_ocr_text_contract`(provenance 필수: provider/provider_version/model/model_sha256/output_sha256 str + no_egress_verified bool + pages[{page,text,text_sha256}]; **OCR 페이지가 인테이크 needsOcr 대상 밖이면 IntakeError**)·`_validate_aux_signals_contract`(doc_format∈{hwpx,docx}·카운트 int≥0). 병합은 **`ocr_supplement`**(정렬된 페이지·extraction_quality="low" 고정·location_hint 부여 — **기존 blocks 미혼입**)·**`aux_structure`**(카운트 사본)·gap hint(**aux vs intake 비교는 여기서만**: image_detection_gap(aux 인스턴스>0 & intake image 블록 0)·table_count_mismatch(top-level≠intake 표 블록)·review_required_reason → `review_priority_hints` medium, `doc-level` 힌트)로만. **인자 없으면 기존 L1 산출과 동일 → DEI_VERSION "1" 유지**(Codex 조건 "additive 하위 호환을 테스트로 증명" 이행). 내부 CLI에 `--ocr-text`/`--aux-signals` 선택 플래그(실행 없음).
  ③ **테스트**: 신규 `tests/test_aux_structure_scanner.py` **26/26 PASS**(카운트 정확성·결정성·zip-slip·bounded read·비-zip/XML 파손/미인식 레이아웃 거부·raw 미보존·네트워크/core 미import). `tests/test_intake_dei_producer.py` 26→**50/50 PASS**(+24: 하위 호환(섹션 부재·버전 유지)·blocks 불변·OCR 미혼입·provenance 보존·low 고정·gap hint 3종·판정 키 부재·병합 결정성·페이지 불일치/provenance 누락/aux malformed fail-fast 11종). 기존 3종 **무수정 green**(validator 26·renderer 22·delivery 33) = core 무변경 증거.
  ④ **문서 좁은 보정**: intake README(aux scanner·L2 provisional 경계— "OCR은 실행하지 않고 out-of-band 산출물 ingest만"), evidence_mapping_rules §6(**OCR 유래 인용: 출처 표기 + 단독 confirmed 승격 금지·보수적 매핑**, gap 신호는 검수 신호만 — Codex follow-up 이행), SKILL.md Inputs(ocr_supplement/aux_structure 취급 1문단).
  ⑤ **thin runner 미포함**(Codex 권고 자세 채택) — runner 커밋 여부는 open question 유지. provider 실행·설치는 여전히 사용자 로컬 out-of-band.
- **Consequences**: **다음 = Codex 구현 리뷰.** 리뷰 PASS 전 L2 승격 선언·provider 최종 확정·제품 문서 "현재 기능" 표기 금지. follow-up 계승: runner 배치 결정·kordoc 3.15.0 재비교·HWPX 잔여 표 2건·개요 스타일 실사용 샘플·defusedxml·OS 레벨 egress.
- **Status**: 변경 = src/intake 2(신규 1)·tests 2(신규 1)·Skill 문서 2·status/decision 2. **schema/validator/renderer/delivery/manifest/marketplace/package/lock/.mcp.json 무변경**(스캔 확인), core의 intake/provider import 없음, tracked artifact 0, 설치·실행·egress 없음(테스트는 stdlib·합성 fixture만). L0/L1=implemented+reviewed·Gate D PASS 유지.
- **Related Files**: `src/intake/aux_structure_scanner.py`, `src/intake/dei_producer.py`, `tests/test_aux_structure_scanner.py`, `tests/test_intake_dei_producer.py`, `src/intake/README.md`, `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`, `src/skills/samil-kssb-precheck/SKILL.md`, `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`, `docs/reviews/codex_cycle2l_4a_l2_adapter_boundary_design_review.md`.

## D69. 2L-4C OCR hash 무결성 — text/output hash 실검증(canonical JSON 규칙 공개), model hash는 presence-only 유지
- **Date**: 2026-07-05
- **Context**: Codex 2L-4B 구현 리뷰 **PASS + nonblocking minor C2L4B-MIN-01**("text_sha256/output_sha256이 presence-only — 최종 승격/runner 통합 전 실검증 또는 metadata-only 문서화"). 좁은 hardening patch로 실검증을 선택(2L-4C).
- **Decision(구현)**:
  ① **`pages[].text_sha256` 실검증**: 해당 `text`(UTF-8) SHA-256 재계산과 비교, 불일치 시 `IntakeError`(fail-fast). hex는 대소문자 정규화 비교.
  ② **`output_sha256` 실검증 + canonical 규칙 공개**: 신규 함수 **`canonical_ocr_output_sha256(ocr)`** — top-level `output_sha256` 필드만 제외한 dict를 `json.dumps(sort_keys=True, ensure_ascii=False, separators=(",",":"))`로 직렬화(UTF-8)한 바이트의 SHA-256. **sort_keys로 key 순서 독립·결정적·stdlib만**. runner도 동일 규칙으로 산출물 hash를 만들도록 docstring에 명시.
  ③ **`model_sha256`은 presence-only 유지(문서화된 한계)**: 외부 모델 파일의 runner-제공 provenance라 ingest가 재계산할 수 없음 — Codex 권고의 두 선택지 중 "text/output은 실검증, model은 metadata-only"로 분리 적용.
  ④ **테스트 50→56/56**: fixture를 실제 hash 계산으로 교체(placeholder 제거 — 리뷰가 지적한 사실 자체 해소), +6건(정상 artifact PASS·text 변조(stale hash) 거부·output 불일치 거부·canonical key-order 독립·재정렬 artifact 병합 PASS·대문자 hex 허용). 페이지 불일치 테스트는 유효 hash를 주어 "페이지 정합" 자체를 검증하도록 정비. 기존 4종 무수정 green(aux 26·validator 26·renderer 22·delivery 33).
- **Consequences**: OCR artifact 계약의 재현성/무결성 가치 확보(runner 통합·L2 최종 승격의 선행 조건 중 하나 해소). **다음 = Codex patch review.** L2는 계속 provisional — runner 정책·kordoc 3.15.0·HWPX 잔여 표·개요 스타일 샘플·defusedxml·OS 레벨 egress follow-up 유지.
- **Status**: 변경 = `src/intake/dei_producer.py`·`tests/test_intake_dei_producer.py`·status/decision만(범위 준수). schema/validator/renderer/delivery/manifest/package/lock 무변경, 새 의존성 0(hashlib=stdlib), runner 미구현, provider 실행·설치·egress 없음, raw artifact 미커밋. L2 승격 선언 없음.
- **Related Files**: `src/intake/dei_producer.py`, `tests/test_intake_dei_producer.py`, `docs/reviews/codex_cycle2l_4b_l2_ingest_implementation_review.md`.

## D70. 2L-5 L2 closure — "repo-side ingest boundary"만 implemented+reviewed로 승격, provider 실행·확정·runner·L3는 pending 유지
- **Date**: 2026-07-05
- **Context**: Codex 리뷰 체인 완성 — 2L-4A 설계 PASS → 2L-4B 구현 PASS(nonblocking minor 1) → 2L-4C patch PASS(findings 0, C2L4B-MIN-01 종결, required fixes 없음). L2 상태 정리(closure/promotion) 결정 필요. 코드 무변경(문서만).
- **Decision**:
  ① **승격**: **"L2 repo-side ingest boundary = `implemented+reviewed`"** — 범위는 리뷰된 표면으로 한정: `src/intake/aux_structure_scanner.py`(stdlib 보조 스캐너, 방어 규칙 포함) + `src/intake/dei_producer.py` additive 병합(`ocr_supplement`/`aux_structure`) + artifact 계약 3종(intake 불변·ocr_text provenance+hash 무결성·aux_signals) + 경계·회귀 테스트(intake 56/56·aux 26/26·기존 3종 green). Ledger에는 **"L2=partially implemented"**로 표기(전체 L2 완료 아님).
  ② **승격하지 않음(별도 pending 명시)**: provider 최종 확정(Kordoc+tesseract.js = 계속 provisional·가역) / runner 구현·통합(배치 정책 open) / **full OCR execution capability(plugin은 OCR 미실행 — 실행은 사용자 로컬 out-of-band, 이 한정이 라벨의 핵심)** / L3 의미 분석 / Kordoc 3.15.0 source 최종 비교 / OS 레벨 no-egress·defusedxml·HWPX 잔여 표 2건·개요 스타일 샘플(비차단).
  ③ **표현 규칙**: 제품 문서에 "L2 완료"·"OCR 지원"으로 쓰지 않는다 — **"repo-side ingest boundary implemented+reviewed / provider execution·final selection pending"** 분리 표기. 예선 3단 구조(D55)의 target≠implemented 원칙 유지: L2 target 중 ingest 절반만 구현·검증 완료 상태.
  ④ **별도 closure 문서 미작성**: 결정이 간결해 current_status(Ledger 갱신)·본 D70로 충분(불필요 문서 지양 — 프롬프트 지침).
- **Consequences**: 다음 분기(사용자/ChatGPT): (a) runner 정책 결정·통합 사이클, (b) Kordoc 3.15.0 재비교, (c) 제출 준비 정리 중 선택. 어느 쪽이든 provider 확정·L3 착수는 별도 승인+리뷰 필요.
- **Status**: docs-only(현황·결정 기록만). 코드/tests/schema/validator/renderer/delivery/manifest/package/lock 무변경, 설치·실행·egress 없음. L0/L1=implemented+reviewed·Gate D PASS 불변.
- **Related Files**: `docs/reviews/codex_cycle2l_4c_ocr_hash_hardening_review.md`, `docs/reviews/codex_cycle2l_4b_l2_ingest_implementation_review.md`, `docs/reviews/codex_cycle2l_4a_l2_adapter_boundary_design_review.md`, `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`.

## D71. 2L-5A historical wording cleanup — 과거 bullet의 "review pending/다음 리뷰" 문구에 historical 주석 부가(기록 보존)
- **Date**: 2026-07-05
- **Context**: Codex 2L-5 closure review **PASS** + nonblocking minor **C2L5-MIN-01**(과거 2L-4B/4C bullet의 당시 기준 "Codex review pending / 다음 = Codex patch review / 다음 단계 = Codex 구현 리뷰" 문구가 최신 closure 상태와 스캔 수준 혼동 유발 가능).
- **Decision**: `docs/current_status.md`의 해당 문구 6곳(2L-4C·2L-4B×2 + 동류인 2L-4A·2L-3D·2L-3C)에 **과거 기록을 지우지 않고** "*(historical — 이후 Codex review PASS · 2L-5 closure 반영)*" 형식의 결과 주석만 부가. 2L-5 최신 판단·Capability Ledger(L2=partially implemented — repo-side ingest boundary implemented+reviewed / provider execution·final selection pending)는 무변경.
- **Status**: docs-only(current_status + 본 D71). 코드/tests/schema/validator/renderer/delivery/manifest/package/lock 무변경. L2 전체 완료·provider 확정·runner 통합·L3 착수 선언 없음.
- **Related Files**: `docs/current_status.md`, `docs/reviews/codex_cycle2l_5_l2_closure_promotion_review.md`.

## D72. 2M-2 wording refresh — Skill/intake 현재-facing 문구를 2L-5 closure 상태로 정렬(C2M1-MIN-01 해소)
- **Date**: 2026-07-05
- **Context**: Codex 2M-1 전체 구조 리뷰 **PASS** + nonblocking minor **C2M1-MIN-01**(SKILL.md:37·evidence_mapping_rules:70·intake README:1/10/30·dei_producer.py:26 등의 "L2 provisional — Codex review pending" 계열이 2L-5 closure 대비 **과소표현**으로 stale). 샘플 전수 테스트 전 문구 정렬.
- **Decision**: 지적 위치 5곳 + 동류 주석 3곳(dei_producer 95/272/358행 "provisional" 접두)·§6 접두 2곳을 통일 문구로 정정 —
  **"L2 = partially implemented / repo-side ingest boundary = implemented+reviewed(2L-5 closure) / provider execution·runner 통합·provider 최종 확정 = pending / plugin-side OCR 실행 = 미구현 / L3 = planned·미구현"**. 금지 표현(L2 전체 완료·OCR 지원·확정·runner 통합 완료·L3 완료·감사/인증/준수 보증) 미사용. dei_producer.py는 **docstring/주석만** 수정(로직 무변경 — 테스트 5종 green으로 증명: intake 56/56·aux 26/26·validator 26·renderer 22·delivery 33).
- **Consequences**: C2M1-MIN-01 해소 → **샘플 폴더 전수 산출물 테스트(Codex) 진행 가능**. 잔여 pending(runner 정책·provider 확정·kordoc 3.15.0·L3·비차단 hardening)은 불변.
- **Status**: 문구 변경만(코드 로직·tests·schema/validator/renderer/delivery/manifest/package 무변경). 샘플 파싱/OCR/보고서 생성 없음.
- **Related Files**: `src/skills/samil-kssb-precheck/SKILL.md`, `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`, `src/intake/README.md`, `src/intake/dei_producer.py`, `docs/reviews/codex_cycle2m_1_whole_plugin_structure_review.md`.

## D73. 2M-5 산출물 품질 보정 — Skill 지침 §7 신설 + validator 중복인용 warning + delivery 중복문구 제거(블랙박스 전 필수분 해소)
- **Date**: 2026-07-06
- **Context**: Codex 2M-3(PASS+follow-up)·Claude 2M-3B(수정 후보 분류)의 사용자-facing 품질 결함 — B1 커버리지 침묵(Blocker candidate)·R1~R5(Required before black-box)·P1(user_summary 중복). 대부분 findings 작성 품질이라 보정층 선택이 핵심. runner/provider/assisted는 2N 분리.
- **Decision(보정층별)**:
  ① **Skill 지침(1차 층)**: `evidence_mapping_rules.md` **§7 "사용자-facing 문구·인용 품질 규칙" 신설** — (B1) 미추출/판독불가/미지원 구간을 `overall_limitations`에 **문서별 실수치** 명시 의무("총 359p 중 35p 미추출…" 형식) / (R5) 카탈로그 대비 검토 항목 수 1줄 명시 / (R1) 사용자 필드에 내부 도구·provider명·영문 상태 문자열 금지 + 한국어 표준 문구 3종(스캔 전용·zero-text 혼재·형식 미지원) / (R2) 인용은 문장 경계 단위, 목차 점선·표 머리글 뭉침·제목 조각 단독 금지, **항목 간 동일 인용 재사용 금지**(적합 인용 없으면 not_verifiable) / (R4) partial↔not_verifiable 질문사유 분리 / (R3) 사이클명·Track·테스트 어휘 금지. `SKILL.md`에 절차 8단계(커버리지·검토 범위 기록)와 금지표현 절 포인터 추가.
  ② **validator(감지 가능분만, detect-only)**: `_check_quote_reuse` 신설 — 서로 다른 항목의 동일 quote 재사용을 **warning** `evidence.duplicate_quote_reuse`로 보고(재사용이 항상 오류는 아니므로 error 아님, 사람 검수 유도). findings 미변경 원칙 유지.
  ③ **delivery(코드 결함 실재분만)**: `build_user_summary`에서 `human_review_boundary` 존재 시 같은 취지의 일반 문구를 생략(중복 출력 제거 — Skill 지침으로 해결 불가한 유일 항목).
  ④ **테스트 보강(재발 방지 한정)**: validator 26→**30**(중복 warning 검출·error 아님·valid example 무-warning·전제 체크), delivery 33→**34**(중복 문구 회귀 체크). renderer 22·intake 56·aux 26 무수정 green.
- **미수정(사유)**: P2 개별화(§7이 원인 커버 — LLM 작성 품질은 코드 강제 불가), P3 섹션 병기(기존 convention 준수 문제), P4 U+200C 정규화(F1 quote 정규화와 함께 2N/후속), renderer(결함 미관찰), F1/F2/F3(검증·확장 실행 필요 — 별도 확인 항목 유지).
- **Consequences**: 블랙박스 테스트 전 필수 보정(B1·R1~R5·P1) 해소. **다음 = Codex 재리뷰 가능** → 이후 2N(runner/provider assisted) 또는 블랙박스 테스트 분기. 2N 이월: D1(aux/ocr 실활용 데모)·D2(Track B 재실행)·D3(provider명 표기 정책).
- **Status**: 변경 = evidence_mapping_rules(§7)·SKILL(포인터 2)·validator(+warning 1)·delivery(중복 제거)·tests 2종(+5 checks)·notes 문서·status/decision. schema/manifest/marketplace/package/lock 무변경, runner/provider/OCR 미구현·미실행, 샘플 재실행·생성물 커밋 없음. L2 표현 경계 불변.
- **Related Files**: `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`, `src/skills/samil-kssb-precheck/SKILL.md`, `src/validators/kssb_findings_validator.py`, `src/renderers/kssb_report_delivery.py`, `tests/test_findings_validator.py`, `tests/test_delivery_wiring.py`, `docs/planning/cycle2m_5_output_quality_remediation_notes.md`, `docs/planning/cycle2m_3b_claude_user_facing_output_quality_review.md`.

## D74. 2N-0A blindspot pass — rasterizer 공백·이중 경로·hash 규칙·경계 정련 등 설계 전 리스크 도출(설계·구현 없음)
- **Date**: 2026-07-06
- **Context**: Codex 2M-6 PASS(findings 0)로 2M 종료 가능. 2M-7 독립 블랙박스는 미진행(assisted path 이후 2N-5로 통합). 2N-0B 설계 전 blindspot pass 수행(구현·설치·실행·설계 확정 없음).
- **Decision(도출 결과 기록)**: `docs/planning/cycle2n_0a_runner_provider_blindspot_pass.md` 작성 —
  **unknown knowns**: rasterizer 공백(OCR 경로 유일 미해결 공급망 — Gate D의 PyMuPDF는 AGPL 검사용, Kordoc 이미지 경로는 native canvas), naive npm install의 native 재유입(--omit=optional 필수), HWP/OCR 이중 경로(승인·egress 프로파일 상이), OCR의 Kordoc intake 선행 의존(페이지 정합 fail-fast), canonical hash의 Python 규칙(교차 언어 위험), PowerShell 인코딩 사고 전례(2M-3 _utf8), §7 provider명 금지↔승인 대화 이중 정책, validator 경로 스캔↔provenance, "자동 실행 금지"→"무승인 실행 금지" 정련 필요(Codex 확정 대상), traineddata hash 기존재. **repo 사실 확정**: package.json 부재·중간 JSON 산출물 gitignore 미방어·nethook/runner 자산 repo 부재.
  **known unknowns**: 블랙박스 머신 Node 유무, tessdata fast 정확도, rasterizer 실후보, kordoc 버전 기준, 승인 지속성, npm 차단 환경, 대형 문서 소요시간 UX, harness 승인 이중성.
  **unknown unknowns**: 중간 산출물 낙하 위치, tool-cache 버전 드리프트, 결정성 비용 폭발, 제출 zip 속 실행 스크립트 인상, AV 개입, 셸 이중 환경, 배치/단일 인터페이스 분기, 부분 성공 상태.
  **사용자 결정 8건(U1~U8)**: 설치 위치(외부 tool-cache 권고)·Node 부재 범위·승인 단위/기록·runner 커밋+zip 포함·provider명 이중 정책·결정성 범위(evidence 한정 권고)·경로별 승인 분리·rasterizer 방향.
- **Consequences**: 다음 = **사용자 U1~U8 결정 → 2N-0B 설계**(경계 정련 포함) → 2N-1 Codex 설계 리뷰 → 2N-2 구현 → 2N-3 리뷰 → 2N-4 Track B 재테스트 → 2N-5 블랙박스.
- **Status**: planning 문서만(+status/decision). 코드/테스트/schema/manifest/package 무변경, 설치·실행·OCR 없음.
- **Related Files**: `docs/planning/cycle2n_0a_runner_provider_blindspot_pass.md`, `docs/reviews/codex_cycle2m_6_remediation_review.md`, `docs/samples/gate_d_ocr_evidence_2026-07-04.md`, `docs/samples/provider_document_analysis_comparison_2026-07-04.md`, `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`.

## D75. 2N-0B runner/provider UX 설계 — tool-cache·이중 경로·3층 provider명 정책·Python hash 주입 권고(확정은 사용자+Codex 이후)
- **Date**: 2026-07-06
- **Context**: 2N-0A blindspot pass(D74) 후 설계 단계. 구현·설치·실행 없음. 사용자 미결정 사항(U1~U8)은 권고안과 "사용자 결정 필요"로 분리 표기(임의 확정 금지).
- **Decision(설계 내용 — 권고 수준)**: `docs/planning/cycle2n_0b_runner_provider_ux_design.md` 작성(18개 섹션) —
  ① **전체 UX**: "이 보고서 분석해줘" → baseline 진단 → 판독 특성 분류(HWP/OCR 이중 경로) → check → 한국어 승인 대화(도구·출처·위치·용량·egress 고지) → 준비(egress 허용·기록) → 실행(no-egress 훅) → artifact 3종(repo 밖 out_dir) → 기존 ingest(dei_producer 그대로) → §7 준수 보고서. **거부·Node 부재·실패는 전부 baseline 계속+§7 한계 문구로 수렴**(옵트인 부가물 원칙).
  ② **U1~U8 권고**: 외부 전용 tool-cache(버전 디렉터리+approvals/prep_egress marker, repo package.json 미생성 — npx·repo 내부 배제) / Node 부재=안내+baseline / 승인=설치(도구·버전당 1회)+실행(세션 1회) / runner 커밋+zip 포함(조건부) / provider명 **3층 분리**(승인 대화 명시·보고서 금지·evidence 명시) / 결정성 2회=evidence 모드 한정 / 경로별 분리 승인 / rasterizer=**spike 후 결정**(1순위 @napi-rs/canvas, native 수용 시 Gate B 재검토 전제).
  ③ **구조 결정(권고)**: OCR은 Kordoc intake 선행 후 needsOcr 페이지만(계약 fail-fast가 순서 강제), hash는 **Python 헬퍼가 canonical_ocr_output_sha256 재사용해 주입**(교차 언어 위험 제거), 단일 문서 CLI+`--out-dir` 필수+`.gitignore` artifact 패턴 방어(2N-2), `no_egress_verified`는 훅 적용 실행에만 true, ocr_text 계약에 경로 필드 추가 금지, 부분 성공은 유효 artifact+커버리지 문구.
  ④ **경계 정련 제안**: "자동 실행 금지"→"**무승인 실행 금지**", 능력 표현="plugin core는 provider를 실행하지 않으며 사용자 승인 하의 로컬 보조 실행을 옵트인 제공" — **2N-1 Codex 리뷰 확인 쟁점 7건**으로 명시(경계 양립성·Skill 중개·3층 정책·tool-cache 정합·부분 성공·hash 주입·표현 정련).
  ⑤ **2N-2 전제 4건**: U1~U8 결정+2N-1 PASS+rasterizer spike(OCR 경로 한정)+nethook 사양 확정. 구현 순서 권고: HWP 경로 선행.
- **Consequences**: 다음 = 사용자 U1~U8 결정 → **2N-1 Codex 설계 리뷰** → 2N-2 구현 → 2N-3 → 2N-4(검증 관점 초안 §18) → 2N-5 블랙박스. runner/provider/OCR/finalization은 여전히 pending(선언 없음).
- **Status**: 설계 문서만(+status/decision). 코드/테스트/schema/manifest/package 무변경, 설치·실행·tool-cache 생성·nethook 커밋 없음.
- **Related Files**: `docs/planning/cycle2n_0b_runner_provider_ux_design.md`, `docs/planning/cycle2n_0a_runner_provider_blindspot_pass.md`, `docs/samples/gate_d_ocr_evidence_2026-07-04.md`, `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`, `src/intake/dei_producer.py`(계약 기준).

## D76. 2N-0B-A U2 보정 — portable Node tool-cache 후보(B안) 추가, OS installer/PATH 수정(C안) 배제 확정
- **Date**: 2026-07-06
- **Context**: 2N-0B 설계(D75)의 U2(Node/npm 부재)가 2안(안내 vs 설치 안내)으로 좁았음. "Node 자동 전역 설치"와 "portable Node 설치"를 구분해 선택지를 정련(설계 보정만 — 코드/설치/실행 없음).
- **Decision**: U2를 3안으로 재구성(설계 문서 §7.1 신설·§13 U2 행·§15·§16 쟁점 8 보정) —
  **A**(설치 안내+baseline 계속) = 기본 안전 fallback 유지. **B**(사용자 승인 후 repo 밖 tool-cache에 portable Node) = 신규 후보: nodejs.org 공식 zip을 `node@<LTS>/`에 **압축 해제만**(OS installer 미실행·시스템 PATH 영구 수정 없음·관리자 권한 불요·레지스트리 무흔적·**폴더 삭제로 제거 완결**), 절대 경로 호출, SHASUMS256 검증(traineddata와 동일 규율)·prep_egress 기록, 시스템 Node 우선 탐지(존재+적합 시 설치 제안 안 함), win-x64 한정(기타 플랫폼 A 수렴), AV 차단 시 A 수렴. **C**(OS installer 실행/PATH 영구 수정) = **배제 확정**(시스템 대변경·관리자 권한·"외부 앱/CLI 상태 변경은 사용자 직접" 원칙 충돌).
  **B안 채택 여부는 미확정** — 2N-1 Codex 리뷰(신설 쟁점 8: 보안·제출 정책·운영 원칙 양립성) 확인 후 사용자 결정. B 채택 시에도 PATH 영구 수정·관리자 권한·OS installer는 금지 불변. 추가 pin 유의: Gate D는 Node v24 검증이므로 B안 LTS pin 버전의 실측 재검증을 rasterizer spike에 포함.
- **Status**: 설계 문서 보정 + status/decision만. 코드/테스트/schema/package 무변경, 설치·실행·tool-cache 생성 없음.
- **Related Files**: `docs/planning/cycle2n_0b_runner_provider_ux_design.md`(§7.1·§13·§14·§15·§16).

## D77. 2N-1A scope 결정 — 2N-2 = HWP-first narrow implementation, OCR/rasterizer/portable Node는 gated 분리(C2N1-MAJ-01 narrowed 대응)
- **Date**: 2026-07-06
- **Context**: Codex 2N-1 **CONDITIONAL PASS** — C2N1-MAJ-01(full 2N-2는 U1~U8 미결·portable Node 정책·rasterizer/Gate B·nethook 사양에 종속 → full blocking, 문서화된 HWP-only slice는 non-blocking). AVR-01(결정 기록)이 선행 요건. 구현·설치·실행 없음(scope decision 문서만).
- **Decision**: **2N-2 = HWP-first narrow implementation 확정** — Kordoc 기반 HWP/HWPX/DOCX assisted path + tool-cache/check/approval/run skeleton + 승인 UX + 준비 egress 기록/실행 no-egress 훅 + `--out-dir` 필수 + `.gitignore` artifact 방어 + 기존 ingest 연결(무변경 소비) + root package.json 미생성.
  **U1~U8**: U1 확정(외부 tool-cache `<홈>/.samil-kssb-precheck/tools/`, HWP-first는 `kordoc@3.13.0+pdfjs-dist@4.10.38 --omit=optional`만) / U2 **A안 확정**(시스템 Node 확인→부재 시 안내+baseline, portable Node B는 gated·2N-2 밖, OS installer/PATH/관리자 권한 계속 배제) / U3 확정(설치=도구·버전 1회 ↔ 실행=세션/실행 단위 분리, marker는 tool-cache 내부, 거부=baseline+§7 문구) / U4 확정(runner source-only 커밋; tool-cache·node_modules·lock·artifact 커밋 금지; zip 포함은 "기본 비실행/승인 필요/외부 tool-cache" 문구 전제 후보) / U5 확정(3층: 승인 대화 명시·보고서 금지·evidence 명시) / U6 확정(일반 1회+hash, 2회는 evidence 모드) / U7 확정(경로 분리 — 2N-2에서 OCR 승인 대화 미표시) / U8 **scope-out**(native 수용 미결정 유지, spike·Gate B 재검토는 OCR 착수 전 별도 게이트, HWP-first 비차단).
  **HWP-first 잔존 검증 조건**: AVR-04(nethook — worker 전파·control·훅 적용시만 no_egress_verified=true), AVR-05(PowerShell/UTF-8/한국어 파일명), AVR-06(--out-dir·gitignore 3패턴·경로 스캔 clean), 조건부 AVR-07(런타임 상이 시 재검증) → 2N-2 구현·테스트 요건으로 이관. no-overclaim("사용자 승인 하의 로컬 보조 실행") 유지.
- **Consequences**: **C2N1-MAJ-01 = narrowed scope 조건 대응 완료 / full scope blocking 유지**(deferred gates: OCR path·rasterizer spike·portable Node·(참고) kordoc 3.15.0·OS 커널 no-egress·L3). 다음 = **Claude 2N-2 HWP-first implementation**(§10 제약: 금지 목록 명시·AVR 테스트 요건·2L-4A 조건 계승·pin·3층 정책·기존 테스트 green).
- **Status**: planning 문서 + status/decision만. 코드/테스트/schema/package 무변경, 설치·실행·tool-cache 생성·nethook 커밋 없음. repo 문서와 충돌 없음 확인.
- **Related Files**: `docs/planning/cycle2n_1a_hwp_first_scope_decision.md`, `docs/reviews/codex_cycle2n_1_runner_provider_ux_design_review.md`, `docs/planning/cycle2n_0b_runner_provider_ux_design.md`.

## D78. 2N-2 HWP-first 구현 — 승인 게이트 runner skeleton + nethook(source-only), 실제 설치/실행 없이 mock 검증
- **Date**: 2026-07-06
- **Context**: 2N-1A scope 결정(D77)에 따른 HWP-first narrow implementation. 이번 사이클에서 실제 Kordoc 설치·npm 다운로드·provider 실행·OCR·샘플 재실행은 하지 않음(검증은 mock/fake fixture·임시 디렉터리).
- **Decision(구현)**:
  ① **`src/intake/runners/hwp_assisted_runner.py`**(source-only·stdlib·core 미참조/미import 테스트 강제): CLI(input + `--out-dir` 필수 + `--tool-cache` 기본 `<홈>/.samil-kssb-precheck/tools/` + `--check`/`--approve-install`/`--approve-run`/`--evidence-mode`). **무승인 실행 금지** — 승인 플래그 없으면 한국어 승인 문구만 출력하고 상태 코드로 종료(설치 대기=5·실행 대기=6), exec 호출 0을 테스트로 증명. HWP-first 범위 밖 확장자=정중 종료(3), Node/npm 부재=설치 안내+baseline 수렴(4, **portable Node 미제안**). 설치 builder: `npm install --prefix <cache>/kordoc@3.13.0 --omit=optional kordoc@3.13.0 pdfjs-dist@4.10.38`(global/npx/repo 설치 없음). 준비 egress(prep_egress_log.jsonl: timestamp/action/provider/version/source/command_summary/status)·승인 marker(approvals.json)·run provenance 로그는 **tool-cache 내부 전용**(사용자-facing 전이 금지). artifact 규약 `<stem>.intake.json`/`<stem>.aux_signals.json`(**`.ocr_text.json`은 HWP-first 범위 밖 — 미생성**), HWPX/DOCX는 aux_structure_scanner in-process 연계(실패 시 건너뜀 안내 — intake 유효 유지). 완료 안내는 provider명 미노출(§7 3층 정책).
  ② **`nethook.cjs`**(source-only, Gate A/D 사양 재작성 — AVR-04): dns.lookup/resolve*·net.Socket.connect·tls.connect·http(s).request/get 인터셉트, block 모드=비-loopback 시도 **기록 후 원본 호출 전 throw**(패킷 미발신 — 테스트도 외부 트래픽 0), monitor 모드=관측, **worker_threads.Worker 패치로 훅 전파**, 종료 시 `[NETHOOK-SUMMARY] ... egressAttempts=N workersCreated=M`. runner는 **요약 실관측+egress 0**일 때만 `no_egress_verified=true`(미관측=false, `--evidence-mode`=RunnerError 실패).
  ③ `.gitignore`: `*.intake.json`·`*.ocr_text.json`·`*.aux_signals.json` 방어 추가(AVR-06). `src/intake/README.md`·`runners/README.md` 경계 문서화.
  ④ **테스트**: 신규 `tests/test_hwp_assisted_runner.py` **48/48**(out-dir fail-fast·범위 밖 종료·Node 부재(mock)·builder pin/omit-optional/global 부재·무승인 차단·승인 문구 요소(U5)·prep log 구조·artifact 규약·gitignore 3패턴·run command 훅 구성·provenance 4상태(AVR-04 정책)·설치→실행 승인 분리(U3)·check 모드 무실행·한국어+공백 파일명/UTF-8(AVR-05)·core 상호 미참조·완료 안내 provider명 미노출) + `tests/test_nethook.py` **12/12**(실 Node — 원격 net/dns/http/tls 차단(pre-connect)·loopback 허용·monitor 관측·worker 전파 3종·요약 형식·runner 파서 정합). 기존 5종 무수정 green(validator 30·renderer 22·delivery 34·intake 56·aux 26). repo 루트 package.json/lock/node_modules 없음·실제 홈 tool-cache 미생성 확인.
- **Consequences**: **다음 = Codex 2N-3 구현 리뷰.** 실제 설치·실행 evidence는 사용자 승인 하 이후 단계(2N-4). OCR path·rasterizer·tesseract.js·portable Node는 gated 유지(D77). provider finalization·L2 전체 완료·"OCR 지원" 선언 없음.
- **Status**: 변경 = runners 3파일(신규)·tests 2파일(신규)·.gitignore·intake README·status/decision. schema/validator/renderer/delivery/manifest/package 무변경(스캔 확인).
- **Related Files**: `src/intake/runners/hwp_assisted_runner.py`, `src/intake/runners/nethook.cjs`, `src/intake/runners/README.md`, `tests/test_hwp_assisted_runner.py`, `tests/test_nethook.py`, `docs/planning/cycle2n_1a_hwp_first_scope_decision.md`.

## D79. 2N-3A nethook coverage patch — host 추출·DNS resolve-family 보정(C2N3-MAJ-01), claim=patch 일치·외부 트래픽 0 테스트
- **Date**: 2026-07-06
- **Context**: Codex 2N-3 **CONDITIONAL PASS** — C2N3-MAJ-01(nethook이 net/tls option object의 `hostname` 누락 시 loopback 오인, dns.promises resolve 계열 미패치 → 누락 형태 사용 시 egress가 발생해도 요약이 0으로 보여 `no_egress_verified=true` 신뢰 훼손). 2N-4 assisted retest·no-egress evidence 전 보정 필수. narrow patch(HWP-first scope·no install·no OCR·no package 오염 유지).
- **Decision(구현)**:
  ① **host 추출 보정**(`extractHostPort`): option object에서 `hostname || host || servername` 일관 처리(net/tls), http(s)는 URL 객체 포함 `hostname` 우선. **로컬 IPC 허용 정규화** — `options.path`·`connect(path)` 문자열(경로 구분자 포함)은 'localhost' 취급(원격 호스트명에 `/`·`\`가 올 수 없어 안전, 판단 불가 형태는 기존대로 차단 = fail-closed). host 부재 option은 loopback 기본 유지.
  ② **DNS 커버리지 확장**(`patchDnsFunctions` 일반화): **callback API + dns.promises + dns.Resolver.prototype + dns.promises.Resolver.prototype** 4표면에 lookup + resolve-family 14종(resolve/resolve4/resolve6/resolveAny/resolveCname/resolveCaa/resolveMx/resolveNaptr/resolveNs/resolvePtr/resolveSoa/resolveSrv/resolveTxt/reverse) 전부 패치. **claim=patch 일치 원칙**: 커버 목록을 코드 상수·README에 명시하고, 미차단 범위(dgram UDP 직접 사용·child_process 별도 spawn·native addon raw syscall — 프로세스(Node) 레벨 한계)를 과장 없이 한계로 표기.
  ③ **정책 불변(엄격성 유지)**: `[NETHOOK-SUMMARY]` 형식·runner `build_run_provenance` 파서·"요약 실관측+egressAttempts=0에만 true(미관측=false·evidence 모드=실패)" 그대로 — 느슨해진 조건 없음. worker_threads 전파 로직 무변경(테스트로 유지 확인).
  ④ **테스트**: `tests/test_nethook.py` 12→**29/29** — 신규 17건: option object 4형태(net-host/net-hostname/tls-hostname/tls-servername, egress 집계 4 확인)·http(s) 3형태(options.hostname/URL 객체/https)·DNS 7형태(cb-resolveMx/cb-resolveTxt/cb-reverse/promises-resolve4/promises-resolveSrv/Resolver-cb/promises-Resolver)·로컬 IPC(path)+loopback object 허용(egress 0). **전 원격 probe는 원본 호출 전 throw로 외부 네트워크 미발생**. pytest 래퍼 2건 추가(C2N3-MIN-01 — standalone `python tests/…` 실행 계속 지원; 이 환경은 pytest 미설치라 수집 확인 불가, 지원 경로는 standalone임을 명시). runner 48/48·기존 5종(30/22/34/56/26) green 유지.
- **Consequences**: **다음 = Codex 2N-3A patch review** → PASS 시 2N-4 HWP-first assisted retest(실제 Kordoc 설치/실행 evidence — AVR-02/03/04/05, npm 호출 방식 기록 포함). OCR path·rasterizer·tesseract.js·portable Node는 gated 유지. provider finalization·L2 전체 완료·"OCR 지원" 선언 없음.
- **Status**: 변경 = nethook.cjs·test_nethook.py·test_hwp_assisted_runner.py(래퍼만)·runners/README.md·status/decision. runner 본체·core·schema/validator/renderer/delivery/manifest/package 무변경. 실제 설치/실행/네트워크/tool-cache 생성 없음.
- **Related Files**: `src/intake/runners/nethook.cjs`, `tests/test_nethook.py`, `src/intake/runners/README.md`, `docs/reviews/codex_cycle2n_3_hwp_first_implementation_review.md`.

## D80. 2N-4 assisted retest — 실 Kordoc no-egress 4/4 검증·npm 해석 patch, HWP-계열 ingest 계약 공백을 blocker로 기록
- **Date**: 2026-07-06
- **Context**: Codex 2N-3B PASS(C2N3-MAJ-01 해소)로 2N-4 진행 허용. 승인 기반 실 실행 retest(OCR/rasterizer/tesseract.js/portable Node 범위 밖 유지). 승인은 2N-4 지시로 부여, runner 게이트 절차(문구 표시→명시 플래그) 그대로 이행·기록.
- **Decision(evidence + 좁은 patch)**:
  ① **환경(AVR-03/04)**: `python`=3.14.5(standalone — pytest 미설치), Node v24.16.0/npm 11.13.0. **PowerShell은 npm→npm.ps1(ExternalScript, 정책 차단 위험 실증)**, Python `shutil.which("npm")`→npm.CMD. → **좁은 patch**: `build_install_command(npm_exe=...)` + main이 탐지 경로 전달(리터럴 "npm"은 CreateProcess에서 실패). 테스트 +1(49/49).
  ② **준비(AVR-02)**: `--approve-install`로 `<홈>/.samil-kssb-precheck/tools/kordoc@3.13.0`에 실 설치 — pin 일치(kordoc 3.13.0·pdfjs-dist 4.10.38)·cli.js 존재·**native 0**(--omit=optional 실효)·prep_egress_log(started/ok, npm.CMD 경로 포함)·approvals marker. 설치 후 rc=6으로 실행 승인 분리 증거.
  ③ **실행(AVR-01)**: 실 Kordoc 4회(hwp/hwpx/docx + PowerShell 한국어 파일명 hwpx) **전부** `hook_observed=true·egress_attempts=0·no_egress_verified=true`(evidence 모드). intake 바이트가 2L-3C 산출과 동일(348192/341346/238416 — 교차 컨텍스트 결정성). `.ocr_text.json` 미생성 확인.
  ④ **Windows/UTF-8(AVR-05)**: PowerShell 5.1에서 한국어+공백+괄호 파일명·한국어 out-dir 실행 성공, UTF-8 stdout·artifact 한글 10,057자 보존.
  ⑤ **ingest 호환성 — 핵심 발견(blocker, 미패치)**: Kordoc HWP/HWPX JSON에 `pageQuality`/`qualitySummary` 부재, DOCX `pageCount:null` → dei_producer가 **설계된 fail-fast로 3종 전부 거부**(PDF 대조군 rc=0 정상). 원인=L1 계약이 PDF 출력 형태 기준(D58 관측 범위). 지시된 금지(ingest 계약 변경)에 따라 **패치하지 않고 blocker 기록** — **비페이지 포맷 계약 확장(또는 어댑터 정규화)은 별도 결정+Codex 리뷰 사이클(2N-4B 권고)**.
  ⑥ **오염 0**: repo package.json/lock/node_modules/artifact 0건, tool-cache·샘플·산출물 미커밋, `.gitignore` 방어 유지. (관찰) Kordoc이 out-dir에 `images/` 70개 추출 — artifact 정책 명시 follow-up.
- **Consequences**: runner·승인 UX·no-egress·npm·한국어 경로는 2N-5 수준 증거 확보. 단 **E2E는 HWP-계열 ingest 계약 공백에서 끊김** → 2N-5 전 (a) 계약 확장 사이클(권고) 또는 (b) 2N-5 범위 한정 중 사용자/ChatGPT 결정 필요. 테스트: nethook 29·runner 49·기존 5종 green.
- **Status**: 변경 = retest report + runner patch(npm_exe) + 테스트 1건 + status/decision. core/schema/validator/renderer/delivery/manifest 무변경. OCR/rasterizer/portable Node 미접촉, L2 완료·OCR 지원·finalization 선언 없음.
- **Related Files**: `docs/planning/cycle2n_4_hwp_first_assisted_retest_report.md`, `src/intake/runners/hwp_assisted_runner.py`, `tests/test_hwp_assisted_runner.py`, `docs/reviews/codex_cycle2n_3b_nethook_coverage_patch_review.md`.

## 보류 항목(이후 결정)
- 생성 아키텍처·렌더러 코드 위치·도입 시점(승인 후 확정).
- 참고 엔진 재구현 범위.
- DOCX/HTML 실제 생성 구현 및 수동 검증 규칙의 자동화(경량 결정적 검증 단계).
- **로그 원본 제출 방식(repo 커밋 vs submission.zip 번들만)은 제출 패키징 단계에서 확정 — 현재 미확정.**
- OCR·문서 변환 파이프라인, 결정적 검증 엔진 도입.
- 산업별 KSSB 세부 지표 확장.
- (다음 단계는 ChatGPT·사용자 확인 후 결정. 이 문서에서 확정하지 않는다.)
