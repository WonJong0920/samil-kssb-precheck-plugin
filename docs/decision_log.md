# 의사결정 기록 (Decision Log) — Cycle 1 ~ 2B

> 사이클별 섹션: Cycle 1(D1~D10) → Cycle 2A 방향성(D11~D15) → Cycle 2B(D16~).

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

## 보류 항목(이후 결정)
- 생성 아키텍처·렌더러 코드 위치·도입 시점(승인 후 확정).
- 참고 엔진 재구현 범위.
- DOCX/HTML 실제 생성 구현 및 수동 검증 규칙의 자동화(경량 결정적 검증 단계).
- **로그 원본 제출 방식(repo 커밋 vs submission.zip 번들만)은 제출 패키징 단계에서 확정 — 현재 미확정.**
- OCR·문서 변환 파이프라인, 결정적 검증 엔진 도입.
- 산업별 KSSB 세부 지표 확장.
- (다음 단계는 ChatGPT·사용자 확인 후 결정. 이 문서에서 확정하지 않는다.)
