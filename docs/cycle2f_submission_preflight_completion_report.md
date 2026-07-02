# Cycle 2F 완료 보고 — Submission Packaging Preflight / Evidence & Logs Policy

## 1. 작업 개요

해커톤 제출 전 단계에서 필요한 **submission.zip 포함/제외 정책, 원본 로그 제출 방식, 샘플 실행 산출물 위치 정책,
최종 제출 preflight checklist**를 하나의 정책 문서로 정리했다. 이번 사이클은 **정책 정리/사전점검**이며, `submission.zip`을
실제 생성하지 않았고 실제 샘플 PDF 분석·OCR·문서 파싱·원본 로그 생성/수정도 하지 않았다. 코드·스키마·테스트·`.gitignore`는
변경하지 않았다(문서만).

## 2. 참고한 최소 진입 문서와 자율 탐색한 주요 파일

**최소 진입 문서**
- `docs/reviews/codex_cycle2e_workflow_review.md` — Cycle 2E PASS, 로그·샘플·submission은 제출 단계 과제로 명시됨 확인.
- `docs/current_status.md` — 직전 상태(2E)와 보류(로그 원본 제출 방식) 확인.
- `docs/templates/CYCLE_COMPLETION_REPORT_TEMPLATE.md` — 완료 보고 구조.

**자율 탐색한 주요 파일**
- `docs/planning/submission_packaging_checklist.md`, `docs/planning/sample_input_policy.md` — 기존 계획 체크리스트·샘플 정책(고정 금지·PDF 미커밋).
- `.gitignore` — `logs/*` 제외(`.gitkeep` 유지), 렌더러 산출물·`build/`·`out/` 제외, `log-hooks/` 제외.
- `logs/`(working tree: `.gitkeep`만 tracked, `claude-code/`·`codex/`는 untracked·ignored), `log-hooks/`(untracked·ignored) 상태.
- `docs/workflow_usage.md`(산출물 정책), `README.md`, `docs/architecture.md`(저장소 구조), `src/.codex-plugin/plugin.json`(name·version·skills), Skill 보조 7종 존재 확인.

## 3. 작성/수정한 파일

**신규**
- `docs/submission_packaging_policy.md` — 제출 패키징 정책 통합 문서(포함/제외 분류·로그·샘플 산출물·최종 preflight·미확정 사항·경계).
- `docs/cycle2f_submission_preflight_completion_report.md` — 본 완료 보고.

**수정(문서만)**
- `docs/planning/submission_packaging_checklist.md` — 정책 통합 문서로의 포인터 추가(요약 체크리스트로 위치 명시).
- `docs/workflow_usage.md` — 산출물 정책에 submission 정책 포인터 추가.
- `docs/current_status.md` — Cycle 2F 상태·완료 작업·보류(로그) 갱신, GitHub 상태 갱신.
- `docs/decision_log.md` — Cycle 2F 결정 D32 추가.

**변경하지 않음**: `src/**`(스키마·검증기·렌더러·Skill 코드/문서), `tests/**`, `.gitignore`.

## 4. submission.zip 포함/제외 정책 정리

5분류로 고정(상세는 정책 문서 §1):
- **A. repo 커밋 + zip 포함**: `plugin.json`, `src/skills/…`(SKILL.md+보조 7종), `src/schemas/`, `src/validators/`, `src/renderers/`, `docs/`, `tests/`, `README.md`, `logs/.gitkeep`.
- **B. repo 제외 · zip에만 포함(조건부)**: 원본 무편집 AI 대화 로그(zip 포함 필수, repo 커밋은 민감성 검토 후 결정), 실제 샘플 실행 산출물(저작권·식별정보 검토 후).
- **C. 생성 산출물 — 기본 제외**: 생성 DOCX/HTML(`.gitignore`, findings에서 재생성 가능).
- **D. 제출 전 재생성·재검증**: 대표 문서 재생성·결정성/Word 열림 확인, validator CLI/test·renderer smoke 재실행.
- **E. 절대 포함 금지**: 원본 PDF/샘플 원자료(원칙), 로컬 절대경로·cache·sandbox·plugin/cache·AppData 노출 파일, 비밀키·토큰·개인정보, `__pycache__`·`build/`·`out/`·임시파일, `log-hooks/`.

## 5. logs 원본 제출 방식 정리 (정책 문서 §2)

- **원본·무편집 원칙**: Claude Code·Codex·ChatGPT 원본 로그. **요약·발췌본으로 대체 금지**, 조작(흐름 왜곡) 금지.
- **원본 vs 요약 구분**: 요약/정리 문서는 보조 자료일 뿐 원본 로그 요건을 대체하지 못한다.
- **commit vs zip-only 결정 기준**: 현 `.gitignore`가 `logs/*`를 제외해 기본 태세는 "미커밋". 로컬 절대경로·개인정보 포함 가능성이 높아
  **잠정 권장은 zip-only 번들**. 민감정보 없음이 스캔으로 확인된 경우에만 repo 커밋도 선택지. **최종 결정은 제출 단계**(현 단계 미확정).
- **파일명·위치**: `logs/claude-code/*.jsonl`, `logs/codex/*.jsonl`, `logs/chatgpt/*`.
- **민감정보 점검**: 제출 전 로컬 경로·사용자명·키·토큰·개인정보 스캔. 발견 시 처리는 사람 판단(원본을 자동 요약·삭제로 대체하지 않음).
- **이번 사이클 미수행**: 실제 로그 생성·수정·요약·제출 없음. 최종 포함 방식·민감정보 처리·파일 목록은 제출 단계 확인 사항.

## 6. 샘플 실행 산출물 위치 정책 정리 (정책 문서 §3)

- 공개자료 기반 샘플 실행 결과의 식별정보는 후속 `docs/samples/` 실행 로그 문서에만 기록(제품 문서에 회사명·파일명·URL 고정 금지, 2개 일반화 유형으로만 지칭).
- 생성 DOCX/HTML은 repo 밖 임시 폴더에 생성(`.gitignore` 대상, 커밋 금지). renderer smoke는 `tempfile.mkdtemp`로 임시 생성 후 정리.
- validator 결과는 콘솔/JSON 출력이며 findings·판정을 수정하지 않는다.
- 샘플 실행 산출물·생성 문서는 기본 미커밋(C), final zip 포함은 저작권·식별정보 검토 후 제출 단계 결정(B).

## 7. 최종 제출 preflight checklist 정리 (정책 문서 §4)

구조/매니페스트 → 문서/제품 경계 → 계약/검증/렌더(json.tool·validator CLI·validator test·renderer smoke·DOCX 재생성) →
표현/경로 스캔(금지 표현·내부 경로·비밀) → 로그/샘플/산출물(원본 로그 포함 방식·민감정보 스캔·샘플 포함 여부·생성물 미커밋) →
정리/규격(`__pycache__`·`build/`·`out/`·`log-hooks/` 제외·무단 PDF 미포함·zip 규격/크기·Codex 검증 대기) 순으로 정리.

## 8. 문서 현행화 내용

- 정책 단일화: 분산돼 있던 포함/제외·로그·샘플·preflight를 `submission_packaging_policy.md`로 통합, 기존 planning 체크리스트는 요약본으로 포인터 연결.
- current_status의 보류(로그 원본 제출 방식)에 결정 기준·잠정 권장·정책 문서 참조 추가. decision_log D32 기록.
- workflow_usage 산출물 정책에 submission 정책 포인터 추가.

## 9. Preflight Check 결과

**수행함**
- 변경 범위 확인: **문서만** 변경(`git status`), `src/**`·`tests/**`·`.gitignore` 무변경.
- 금지 산출물 미추가 확인: `submission.zip`·PDF·생성 DOCX/HTML·로그 파일이 repo에 추가되지 않음.
- validator CLI example — error 0건, RC 0. validator test **19/19 PASS**. renderer smoke **22/22 PASS**(기존과 동일).
- 금지/과장 표현 스캔: 신규 문서의 "감사·인증·준수 확정" 등장은 모두 **negation·점검 대상 문맥**("…처럼 보이는 신규 표현 없음"), 새 확정·과장 표현 없음.
- 내부 경로 스캔: `C:\`·`.codex`·`sandbox`·`plugin/cache`·`D:\` 등은 **점검 대상 토큰(무엇을 제외/스캔할지)** 으로만 등장하며, 실제 로컬 절대경로(`C:\Users\user\…`) 신규 노출 없음.
- 새 외부 의존성·의존성 매니페스트 없음.
- 원칙 유지: Skill-first, validator detect-only, renderer no re-judgment, 제품·사람 검수 경계.

**수행하지 못함(한계)**
- 실제 submission.zip 생성·크기·매니페스트 검증은 이번 범위 밖(제출 단계).
- `jsonschema` full validation은 미설치로 미수행(코드 무변경이라 신규 리스크 없음).
- 실제 로그 민감정보 스캔은 원본 로그를 다루지 않으므로 미수행(제출 단계 확인 사항으로 명시).

최종 PASS/FAIL은 작성하지 않는다(최종 검증은 Codex가 수행).

## 10. 금지 작업 미수행 확인

- `submission.zip` 실제 생성 — 미수행.
- 실제 샘플 PDF 분석 / OCR / 문서 파싱 — 미수행.
- Hook/MCP 추가 / 외부 패키지 추가 / Python reference 코드 복사 — 미수행.
- 원본 AI 대화 로그 생성·수정·요약본 대체 — 미수행(정책·기준만 정리).
- 로그 제출 방식 임의 최종 확정 — 미수행(결정 기준만, 최종은 제출 단계).
- 제품 문서에 특정 샘플 고객사명/파일명 고정 — 미수행.
- 생성 DOCX/HTML repo 커밋 — 미수행.
- Cycle 2G 상세 계획 작성 — 미수행.
- validator 자동 수정·renderer 재판정 변경 — 미수행(코드 무변경).
- 사용자-facing 기본 흐름을 Python CLI 중심으로 바꾸는 문구 — 작성하지 않음.

## 11. 남은 보류사항

- **로그 원본 제출 방식 최종 확정**(repo 커밋 vs zip-only) 및 민감정보 발견 시 처리 — 제출 단계 스캔 후 확정.
- 샘플 실행 산출물의 zip 포함 여부 — 저작권·식별정보 검토 후 결정.
- 실제 submission.zip 생성·크기·매니페스트, 실제 샘플 실행 — 제출/샘플 단계.
- quote 인용 실재성 자동 검증(사람 검수 유지), `jsonschema` full validation(설치 시 선택).

## 12. GitHub push 상태

- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- commit message: `docs: define submission packaging preflight policy`
- 최종 commit SHA는 본 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.

## 13. ChatGPT 확인 대기

- 다음 단계는 **Codex Cycle 2F Submission Preflight Review**이며, 착수 여부는 ChatGPT/사용자 확인 후 진행한다.
