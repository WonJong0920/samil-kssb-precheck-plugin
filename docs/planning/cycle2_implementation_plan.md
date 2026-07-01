# Cycle 2 구현 계획 (Implementation Plan)

> **성격**: 이 문서는 **계획**이다. 실제 구현 방식은 **사용자 승인 전까지 확정하지 않는다.**
> 각 질문에 복수 옵션과 장단점을 제시하고, 제안(권장)은 "승인 전 미확정"으로 표시한다.
> 최종 검증·PASS/FAIL 판정은 Codex가, 다음 단계 결정은 ChatGPT·사용자가 수행한다.

## 0. 배경
- Cycle 1 skeleton은 Codex 독립 리뷰에서 **PASS**(중대·Major 결함 없음).
- 유일한 Minor: 최종 `submission.zip`에 **원본 무편집 AI 대화 로그** 포함 필요.
- 참고 엔진(`D:\PrimeBell\AI_Projects\kssb-evidence-gap-auditor`)의 확인된 자산:
  - `src/pipeline/docx_report.py`(315줄): **표준 라이브러리 `zipfile`만으로** OOXML .docx 조립(외부 의존 0),
    `_sanitize_xml_text` XML sanitizer + 고정 타임스탬프 core.xml로 결정적 출력. → "Word open failure" 시행착오 자산.
  - `src/validate/validate_outputs.py`: status enum·근거 필수·금지표현 QA 게이트 개념.
- 이 자산들은 **설계 근거**로만 참고한다. 이번 사이클에서 코드는 작성하지 않는다.

---

## Q1. 해커톤 제출 완성물까지의 구현 단계

단계형 로드맵(각 단계는 사용자 승인 게이트).

| Phase | 내용 | 산출 | 코드 |
|---|---|---|---|
| **B. Findings 스키마 확정** | Skill이 만들 구조화 중간산출(항목별 판정·근거앵커·질문 등)의 필드·형식 정의 | 스키마 문서 | 없음 |
| **C. 리포트 렌더러** | 구조화 findings → 대표 DOCX + HTML fallback 생성(재판정 없음) | 렌더 방식 확정, (승인 시) 최소 코드 | 소량(승인 후) |
| **D. 가드레일** | 금지표현·제품경계·source-bound 검사 | 검사 규칙/스텝 | 소량(승인 후) |
| **E. 샘플 검증** | 2개 일반화 샘플 유형 실행·자기검증 | 실행 로그(별도 문서) | 없음 |
| **F. 제출 패키징** | submission.zip 구성 + 원본 로그 포함 | 제출물 | 없음 |

- 옵션: 단계 병합(B+C 동시) vs 순차. **권장(미확정)**: 순차 — 스키마가 렌더러·가드레일의 단일 계약이 되므로 먼저 고정.

## Q2. Skill-first 유지하며 실제 보고서 생성

**핵심 설계**: Skill = "판단 엔진"(source-bound 분석·판정), 렌더러 = "형식 변환기"(재판정 없는 결정적 출력).
그 사이를 **구조화 findings 중간산출**이 잇는다.

구조화 findings(항목별) 필드안: `item_id · area · judgment_label · mode · evidence_anchors[{quote, location}] · missing_info · questions[{질문, 질문사유, 우선순위, 요청자료, 후속조치}] · recommendations`.

| 옵션 | 설명 | 장점 | 단점 |
|---|---|---|---|
| 2A | 코드 전무, 모델이 최종 문서를 직접 출력 | 순수 Skill-first, 의존성 0 | DOCX는 이진 OOXML zip → 모델 직접 생성 비신뢰·비결정적, Word open failure 위험. HTML만 현실적 |
| **2B (권장·미확정)** | Skill→구조화 findings→얇은 stdlib 렌더러가 DOCX+HTML 생성 | 결정적·유효 DOCX, 외부 의존 0, Word-open-failure 자산 계승, 사용자엔 렌더러 비노출 | 소량 코드 도입(승인 필요) |
| 2C | 참고 파이프라인 전체 이식 | 검증된 로직 | Python CLI 회귀·과범위, Skill-first 훼손 → **기각** |

- Skill-first 유지 방법: 사용자 진입점은 Skill 하나, 렌더러는 Skill 절차가 호출하는 내부 단계(사용자가 Python/PATH를 의식하지 않음).

## Q3. DOCX 기본 + HTML fallback 현실안

- **DOCX**: `zipfile`로 OOXML 수동 조립(참고 docx_report.py 설계 근거). **권장(미확정)**. 외부 의존 0, 결정적, sanitizer로 Word open 실패 예방.
  - 대안: `python-docx` — 코드 단순하나 **외부 설치 부담**·Skill-first에 이물감 → 회피.
- **HTML fallback**: 동일 findings에서 파생하는 단일 self-contained `.html`(결정적). 생성 트리버: DOCX 렌더 단계 실패/불가 또는 경량 경로 선택 시.
- **단일 소스 원칙**: DOCX·HTML 모두 같은 구조화 findings에서 파생, **재판정 금지**(참고 엔진 "사용자 파일은 findings에서 파생" 계승).

## Q4. 참고 Python reference engine 활용 범위

| 옵션 | 설명 | 장점 | 단점 |
|---|---|---|---|
| **4A (권장·미확정)** | 설계·경화된 스니펫(OOXML 조립, `_sanitize_xml_text`, QA 게이트 개념)을 **신규 스키마에 맞게 재구현**, 무복사 | CLI 회귀 없음, 깔끔한 Skill-first 코드베이스, 시행착오 계승 | 재구현 공수 |
| 4B | docx_report.py·validate_outputs.py 축자 복사 | 빠른 재사용 | `practical_guidance` 등 결합·Python 중심성 유입, 어차피 디커플링 필요 |
| 4C | 무활용 | 최소주의 | Word open failure 재발·중복 노력 |

- **원칙**: 이번 사이클 코드 도입 금지. **코드 도입 자체(위치·범위·시점)는 승인 후 확정.** 재사용은 "복사"가 아니라 "설계 계승" 지향.

## Q5. Hook/MCP 없이 가능한가

- **결론(미확정 제안)**: 제출까지 **Hook/MCP 불필요.** 흐름 = 사용자가 Skill 호출 → 분석 → 렌더 단계 → 대표 문서 출력. 백그라운드 자동화·외부 서버 불요.
- **MCP 재검토 조건**: 지속형 문서변환/OCR 서비스, 외부 KSSB 지식베이스 연동이 **하드 요건**으로 확정될 때만.
- **Hook 재검토 조건**: 런타임 로깅·가드레일 자동 강제가 요건일 때만. 단 해커톤 로그 요건은 **패키징 시 원본 로그 보존**으로 충족되므로 Hook 불필요.
- 권장: 제출까지 Hook/MCP-free 유지. 필요 시 조건을 decision_log에 기록 후 검토.

## Q6. Source-bound Analysis 생성 흐름 보장

- **스키마 강제**: "근거 확인 / 일부 근거 확인" 판정은 `evidence_anchors` **필수 필드**. 앵커 없으면 해당 판정 부여 불가(참고 validator "근거 없으면 SUPPORTED 불가" 계승).
- **다층 방어**: (1) SKILL.md 절차, (2) completion_checklist 자기점검, (3) 렌더/검사 단계가 앵커 없는 확인 판정·질문 미연결 확인불가·출처 없는 숫자를 차단.
- 옵션: 절차만 vs 절차+프로그램 검사. **권장(미확정)**: 절차 + 최소 결정적 검사(참고 validate_outputs.py 개념).

## Q7. 금지 표현·제품 경계 검사

- **방식**: 생성물 + 구조화 findings 텍스트를 `prohibited_terms.md` 목록으로 스캔하고, 고지문·경계문(삼일 비공식·감사/인증 대체 아님) 존재를 assert(참고 validate_outputs.py 금지표현 검사 계승).
- 옵션: 수동 체크리스트만 vs 자동 스캔 + 체크리스트. **권장(미확정)**: 자동 스캔 + 수동 체크리스트 백스톱.
- 한계: substring 스캔은 오탐/누락 가능 → **사람 검수 유지** 명시.

## Q8. 샘플 자료 검증 순서

1. 2개 유형 일반화 입력 준비(**PDF repo 미커밋**, 텍스트 추출 입력 기반).
2. 유형1(KSSB 구조 공개 보고서) 실행 → 대표 문서 → 자기검증.
3. 유형2(일반 지속가능경영보고서 gap-precheck) 실행 → 대표 문서 → 자기검증.
4. 판정 스키마·금지표현·source-bound 대조.
5. 실제 샘플명·URL·파일명은 **별도 실행 로그 문서에만** 기록(제품 문서 미고정).
- 상세 정책: `docs/planning/sample_input_policy.md`. 전부 후속 사이클(이번 사이클 미실행).

## Q9. submission.zip 패키징 확인 사항

- plugin.json 유효·`skills` 경로 정합 / SKILL.md + 보조문서 존재 / README·docs 포함 /
  (포함 시) 대표 샘플 출력에 **고정 고객명 없음** / **원본 무편집 AI 대화 로그 포함**(Codex Minor) /
  비밀키·토큰 없음 / 무단 PDF 없음 / 결정적 출력 / plugin·cache·sandbox 경로 비노출 /
  해커톤 제출 규격 정합 / 크기 점검 / zip 매니페스트.
- 상세: `docs/planning/submission_packaging_checklist.md`.

## Q10. logs 원본 제출 요건

- `logs/`에 **패키징 시점의 원본 대화 로그**(Claude Code·Codex·ChatGPT) 배치. 현재는 `.gitkeep`만.
- 옵션: (a) repo에 로그 커밋 vs (b) git 제외 + zip에만 번들. **권장(미확정)**: 민감내용 있으면 (b), 없으면 (a).
- 사전 존재 `log-hooks/tools/save_log.py`는 **Hook 편입 금지**. 패키징 시 수동 스크립트 활용 여부는 **보류 항목**.
- 참고 엔진은 `logs/claude-code/*.jsonl`·`logs/codex/*.jsonl` 형태로 로그를 보관했다(형식 참고).

---

## 요약: 권장 방향(승인 전 미확정)
- Skill(판단) + 구조화 findings + 얇은 stdlib 렌더러(2B), DOCX=stdlib OOXML·HTML fallback(Q3), 참고 엔진은 설계 계승·무복사(4A), Hook/MCP-free(Q5), source-bound·금지표현은 스키마 강제 + 최소 결정적 검사(Q6·Q7).
- **어떤 코드도 사용자 승인 후에만 도입한다.**
