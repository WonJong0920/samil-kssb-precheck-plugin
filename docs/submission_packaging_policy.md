# 제출 패키징 정책 (Submission Packaging Policy)

> **성격**: 정책 문서. 이번 사이클(Cycle 2F)에서 **`submission.zip`을 실제로 생성하지 않는다.** 실제 샘플 PDF 분석·OCR·
> 문서 파싱·원본 로그 생성/수정도 하지 않는다. 이 문서는 최종 제출 단계에서 흔들리지 않도록 "무엇을 repo에 둘지,
> 무엇을 zip에만 포함할지, 무엇을 생성 산출물로 남길지, 무엇을 제외할지"의 **포함/제외 정책과 결정 기준·preflight**를 고정한다.
> 상위 계획 체크리스트는 `docs/planning/submission_packaging_checklist.md`, 샘플 취급은 `docs/planning/sample_input_policy.md`,
> 흐름·사용 계약은 `docs/workflow_usage.md`.

## 0. 분류 체계

| 분류 | 의미 |
|---|---|
| **A. repo 커밋 + zip 포함** | source of truth. repo에 커밋하고 최종 zip에도 포함. |
| **B. repo 제외 · zip에만 포함(조건부)** | repo에는 커밋하지 않고 최종 zip에만 번들 가능. 포함 여부는 아래 기준으로 제출 단계 결정. |
| **C. 생성 산출물 — 기본 제외** | findings에서 결정적으로 재생성 가능. 기본적으로 repo·zip 모두 미포함. |
| **D. 최종 제출 전 재생성·재검증** | 커밋 대상은 아니나, 제출 직전 다시 생성·검증해 상태를 확인해야 하는 항목. |
| **E. 절대 포함 금지** | repo·zip 어디에도 포함하면 안 되는 항목. |

## 1. submission.zip 포함/제외 정책

| 항목 | 분류 | 근거 / 비고 |
|---|---|---|
| `src/.codex-plugin/plugin.json` | **A** | 필수 매니페스트(name·version·description·skills + install surface `interface`/`keywords`/`repository`). 제출 규격 핵심. |
| `.agents/plugins/marketplace.json` | **A** | 로컬/Repo marketplace 정의(`source.path`=`./src`). Public Plugin Directory 등록이 아니다. |
| `src/skills/samil-kssb-precheck/` | **A** | Skill 본체 `SKILL.md` + 보조 7종(catalog·judgment·evidence·question·report_template·checklist·prohibited). 사용자-facing 진입점. |
| `src/schemas/` | **A** | findings 데이터 계약(JSON Schema) + 예시. |
| `src/validators/` | **A** | 내부 detect-only 검증기(표준 라이브러리). |
| `src/renderers/` | **A** | 내부 형식 변환기(표준 라이브러리). |
| `docs/` | **A** | 설계·정책·현황·의사결정·완료 보고·workflow_usage·리뷰. |
| `tests/` | **A** | 재사용 검증기·렌더러 점검(표준 라이브러리). |
| `README.md` | **A** | 한국어 중심, 삼일 고지·제품 경계 포함. |
| `logs/.gitkeep` | **A** | 로그 디렉터리 유지용(내용 아님). |
| **원본 무편집 AI 대화 로그**(Claude Code·Codex·ChatGPT) | **B**(zip 포함은 필수, repo 커밋 여부는 §2 기준으로 제출 단계 결정) | Codex Cycle 1 Minor. 최종 zip에는 반드시 포함, repo 커밋은 민감성 검토 후 결정. |
| 생성 DOCX/HTML 대표 문서 | **C**(필요 시 zip 포함은 §3 샘플 정책) | `.gitignore`로 repo 제외. findings에서 재생성 가능. |
| 실제 샘플 실행 산출물(문서·validator 결과·smoke 출력) | **B/C**(§3) | 저작권·식별정보 검토 후 제출 단계 결정. |
| Codex install verification **evidence**(채운 결과 문서) | **B**(repo 커밋 vs zip-only는 제출 단계 민감정보 스캔 후 결정) | 로컬 경로·계정 식별정보·토큰 없어야 함(`docs/codex_install_verification.md` §11). 양식은 A. |
| 원본 PDF·공개 샘플 원자료 | **E**(원칙) | 저작권·용량·재현성 문제. repo 미포함. zip 포함은 저작권 확인된 경우로 한정하되 원칙 제외. |
| 로컬 절대경로·`cache`·`sandbox`·`plugin/cache`·`AppData` 노출 파일 | **E** | 내부 경로 노출 금지. 제출 전 스캔. |
| API 키·토큰·자격증명·개인정보성 파일 | **E** | 보안. 절대 포함 금지. |
| `__pycache__/`·`build/`·`out/`·임시파일 | **E** | 불필요 산출물. `.gitignore` 반영됨. |
| `log-hooks/`(사전 존재 세션 로깅 인프라) | **E** | 플러그인 산출물과 분리. `.gitignore`로 제외됨. zip 미포함. |

- **D(제출 전 재생성·재검증)**: 대표 DOCX/HTML은 최종 findings에서 다시 생성해 결정성·Word 정상 열림·금지 표현·내부 경로를 재확인한다.
  validator CLI·validator test·renderer smoke도 제출 직전 재실행한다(아래 §5).

## 2. logs 원본 제출 방식 정책

Codex Cycle 1 이후 남은 Minor(최종 `submission.zip`에 원본 무편집 AI 대화 로그 포함). 이번 사이클에서 **실제 로그를 생성·수정·요약하지 않으며**,
포함 방식의 최종 확정은 제출 단계로 남긴다. 정리한 기준은 다음과 같다.

- **원본·무편집 원칙**: 제출 로그는 Claude Code·Codex·ChatGPT의 **원본 무편집** 대화 로그다. **요약본·발췌본으로 대체하지 않는다.**
  로그 조작(재작성·선택 삭제로 흐름 왜곡)은 금지한다.
- **원본 vs 요약 구분**: 요약/정리 문서를 만들 경우 그것은 **보조 자료**일 뿐 원본 로그를 대체할 수 없다. 제출물의 로그 요건은 원본으로만 충족한다.
- **repo 커밋 vs zip-only(결정 기준)**:
  - 현재 `.gitignore`는 `logs/*`를 제외(`.gitkeep`만 유지)하고, 사전 존재 `log-hooks/`도 제외한다. 즉 **기본 태세는 "로그 미커밋"**이다.
  - 로그에 로컬 절대경로(`C:\Users\...` 등)·개인정보·비밀값이 포함될 가능성이 높으므로, **잠정 권장은 zip-only 번들**(git 제외 + 최종 zip에만 포함)이다.
  - 민감정보가 없음을 스캔으로 확인한 경우에 한해 repo 커밋도 선택지로 열어둔다. **최종 결정은 제출 단계에서 민감성 스캔 결과로 확정**한다(현 단계 미확정).
- **파일명·위치 정책**: `logs/claude-code/*.jsonl`, `logs/codex/*.jsonl`, `logs/chatgpt/*`(도구별 하위 폴더). 기존 참고 엔진 로그 형식(`*.jsonl`)을 따른다.
- **민감정보 점검 필요성**: 제출 전 로그에 대해 로컬 절대경로·사용자명·API 키·토큰·개인정보 노출을 스캔한다. 발견 시 처리는 **사람 판단**(제출 단계) —
  자동 요약·삭제로 원본을 대체하지 않는다.
- **현 단계에서 확정 불가 / 제출 단계 확인 사항**: 로그 최종 포함 방식(commit vs zip-only), 민감정보 발견 시 처리, 실제 로그 파일 목록·크기.

## 3. 샘플 실행 산출물 위치 정책

실제 샘플 실행은 이번 사이클에서 하지 않는다. 향후 샘플 실행 시 산출물 위치·취급 정책만 고정한다(샘플 취급 원칙은 `sample_input_policy.md`).

- **공개자료 기반 샘플 실행 결과**: repo 밖 작업 폴더 또는 `docs/samples/`(후속 사이클 생성)의 **실행 로그 문서**에만 식별정보를 기록한다.
  제품 문서(README·SKILL 등)에는 **회사명·파일명·URL을 고정하지 않는다**(2개 일반화 유형으로만 지칭).
- **생성 DOCX/HTML**: `.gitignore` 대상. repo 밖 임시 폴더(예: `build/`·`out/` 또는 세션 임시 폴더)에 생성한다. **repo 커밋 금지.**
- **validator 결과**: 콘솔/JSON 출력. 필요 시 실행 로그 문서에만 요약 기록. findings·판정을 수정하는 산출물이 아니다.
- **renderer smoke 산출물**: `tests/smoke_test_renderer.py`가 **repo 밖 임시 폴더**(`tempfile.mkdtemp`)에 생성 후 정리한다. repo에 남기지 않는다.
- **repo 커밋 여부**: 샘플 실행 산출물·생성 문서는 **기본 미커밋(C)**. final zip 포함은 저작권·식별정보 검토 후 제출 단계 결정(B).
- **식별정보 고정 금지**: 샘플 기업명·파일명·URL을 제품 문서에 고정하지 않는다(고정 금지 원칙 유지).

## 4. 최종 제출 preflight checklist

최종 제출 직전(별도 제출 사이클) 다음을 점검한다. 이 목록은 점검 항목이며, 이번 사이클에서 실행·확정하지 않는다.

### 4.1 구조 / 매니페스트 / marketplace
- [ ] `src/.codex-plugin/plugin.json` JSON 파싱 성공, `name`=`samil-kssb-precheck`, `version`, `description`, `skills`=`./skills/`.
- [ ] `skills` 경로가 plugin root 기준 실제 `src/skills/samil-kssb-precheck/`와 일치.
- [ ] `SKILL.md` + 보조 7종 존재.
- [ ] `.agents/plugins/marketplace.json` JSON 파싱 성공.
- [ ] marketplace `plugins[].name`과 manifest `name`이 `samil-kssb-precheck`로 정합.
- [ ] marketplace `source.path`(`./src`)가 실제 plugin root(=`.codex-plugin/plugin.json`·`skills/` 보유 폴더)를 가리킴.
- [ ] marketplace `policy.authentication`이 허용값(`ON_INSTALL` 또는 `ON_USE`)이고 `policy.installation`이 허용값(`AVAILABLE` 등)임.
- [ ] 로컬/Repo marketplace이며 **Public Plugin Directory 등록·공개 배포가 아님**을 확인(문구·metadata 과장 없음). 상세 `docs/codex_install_readiness.md`.
- [ ] **사용자 직접 Codex install verification evidence 확인**: `docs/codex_install_verification.md` 절차로 실제 app/CLI에서 확인하고,
      결과를 `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`로 기록했는지 확인(§7 판정 PASS/PARTIAL/FAIL).
- [ ] install verification evidence에 로컬 절대경로·계정 식별정보·토큰 등 민감정보가 없음을 확인(있으면 `[REDACTED]` 처리 후에만 포함).
- [ ] install verification이 **FAIL/PARTIAL이면 submission.zip 생성 전에 Patch/보정 후 재검증**(FAIL 상태로 제출물 생성 금지).
- [ ] zip 내부 파일 목록(매니페스트) 별도 기록.

### 4.2 문서 / 제품 경계
- [ ] `README.md`에 삼일 비공식·감사/인증/준수 대체 아님 고지 유지.
- [ ] `docs/` 설계·정책·완료 보고 포함, workflow_usage 최신.
- [ ] 감사·인증·준수 확정처럼 보이는 신규 표현 없음.

### 4.3 계약 / 검증 / 렌더
- [ ] `python -m json.tool src/schemas/kssb_findings.schema.json` 성공.
- [ ] `python -m json.tool src/schemas/kssb_findings_example.json` 성공.
- [ ] `python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json` → error 0건, RC 0.
- [ ] `python tests/test_findings_validator.py` PASS.
- [ ] `python tests/smoke_test_renderer.py` PASS.
- [ ] 대표 DOCX/HTML 재생성 시 결정성·Word 정상 열림 확인(생성물은 커밋하지 않음).

### 4.4 표현 / 경로 스캔
- [ ] 금지 표현(`prohibited_terms.md`) 스캔 통과(고지·경계 negation 문맥 제외).
- [ ] 내부 경로(`C:\`·`C:/`·`/Users/`·`.codex`·`sandbox`·`plugin/cache`·`AppData`·`D:\`) 신규 노출 없음.
- [ ] 비밀키·토큰·개인정보 없음.

### 4.5 로그 / 샘플 / 산출물
- [ ] 원본 무편집 AI 대화 로그 포함 방식 확정(commit vs zip-only) 및 실제 포함 확인.
- [ ] 로그가 원본(요약·발췌 아님)임을 확인, 로그 민감정보 스캔 완료.
- [ ] 샘플 실행 결과 포함 여부 결정(저작권·식별정보 검토), 제품 문서에 고정 고객사명·파일명 없음.
- [ ] 생성 DOCX/HTML을 repo에 커밋하지 않았음 확인.

### 4.6 정리 / 규격
- [ ] `__pycache__`·`build/`·`out/`·임시파일·`log-hooks/` 제외.
- [ ] 무단 PDF 원본 미포함.
- [ ] 해커톤 제출물 규격(디렉터리·필수 파일)·zip 크기 점검.
- [ ] Codex 최종 검증 대기 상태로 정리, 완료 보고에 패키징 결과 기록.

## 5. 현 단계 확정 불가 / 최종 제출 단계 확인 사항

- 원본 로그 최종 포함 방식(repo 커밋 vs zip-only)과 민감정보 발견 시 처리 — 제출 단계 민감성 스캔 후 확정.
- 샘플 실행 산출물의 zip 포함 여부 — 저작권·식별정보 검토 후 결정.
- 실제 `submission.zip` 생성·크기·매니페스트 — 제출 사이클에서 수행.

## 6. 경계 재확인

- 본 도구는 삼일회계법인의 공식 제품·내부 도구가 아니며, 감사·인증·준수 판단을 대체하지 않는다.
- Skill-first: 사용자-facing 진입점은 Skill 하나. validator(detect-only)·renderer(no re-judgment)는 내부 구성요소다.
- Source-bound Analysis·사람 검수 경계 유지. 확인 불가 항목을 미공시로 단정하지 않는다.
- 이 문서는 정책·점검 기준이며, 실제 패키징·로그 포함·샘플 실행은 이후 제출/샘플 단계에서 수행·확정한다.
