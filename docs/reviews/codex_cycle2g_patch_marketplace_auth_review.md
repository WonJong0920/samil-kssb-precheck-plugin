# Codex Cycle 2G Patch Marketplace Authentication Review

## 1. Review Overview

- 대상 repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- 대상 branch: `main`
- 대상 commit: `9e379b3033d2b48f5a201acdd79313471c154e38`
- 비교 기준: `48bb48cf740da4fdd5ee7211777fa11c341f1c50` 이후 Cycle 2G Patch diff
- 이전 리뷰: `docs/reviews/codex_cycle2g_marketplace_install_readiness_review.md`
- 리뷰 목적: Cycle 2G Review의 Major(`policy.authentication=NONE` 허용값 이탈)가 정확히 해소됐고, marketplace/local install readiness 범위가 유지됐는지 독립 검증
- 리뷰 일시: 2026-07-02

## 2. Verdict

- **Verdict**: PASS
- **Readiness**: 준비됨

한 줄 요약: `.agents/plugins/marketplace.json`의 `policy.authentication`이 허용값 `ON_INSTALL`로 보정되었고, 기존 name/source.path/plugin root/skills path 정합 및 제품 경계가 유지되어 Cycle 2H 착수에 차단 이슈가 없다.

## 3. Reviewed Materials

- `.agents/plugins/marketplace.json`
- `src/.codex-plugin/plugin.json`
- `docs/cycle2g_patch_marketplace_auth_completion_report.md`
- `docs/reviews/codex_cycle2g_marketplace_install_readiness_review.md`
- `docs/codex_install_readiness.md`
- `docs/submission_packaging_policy.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/reviews/REVIEW_REPORT_TEMPLATE.md`
- `README.md`
- `docs/architecture.md`
- `src/schemas/kssb_findings.schema.json`
- `src/schemas/kssb_findings_example.json`
- `src/validators/kssb_findings_validator.py`
- `tests/test_findings_validator.py`
- `tests/smoke_test_renderer.py`

참고한 로컬 스펙: system `plugin-creator` skill의 marketplace entry 지침(`policy.authentication`: `ON_INSTALL` 또는 `ON_USE`, 기본값 `ON_INSTALL`; `policy.installation`: `NOT_AVAILABLE`/`AVAILABLE`/`INSTALLED_BY_DEFAULT`).

## 4. Validation Performed

- `git log --oneline -6`로 대상 HEAD가 `9e379b3` 계열 최신 commit임을 확인.
- `git diff --name-status 48bb48c..9e379b3`로 Patch 변경 범위가 marketplace auth와 관련 문서 5종에 한정됨을 확인.
- PowerShell `ConvertFrom-Json`으로 marketplace/manifest JSON 파싱 및 cross-field 정합 확인.
  - marketplace `plugins[0].name` = manifest `name` = `samil-kssb-precheck`
  - marketplace `source.path` = `./src`
  - `./src/.codex-plugin/plugin.json` 존재
  - `./src/skills/` 존재
  - manifest `skills` = `./skills/`, plugin root 기준 실제 경로 존재
  - `policy.installation` = `AVAILABLE`, 허용값
  - `policy.authentication` = `ON_INSTALL`, 허용값
- `python -m json.tool`로 다음 JSON 문법 확인.
  - `.agents/plugins/marketplace.json`
  - `src/.codex-plugin/plugin.json`
  - `src/schemas/kssb_findings.schema.json`
  - `src/schemas/kssb_findings_example.json`
- `python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json` 실행.
  - 결과: error 0건, warning 0건, info 1건(`jsonschema` 미설치로 표준 라이브러리 검증만 수행)
- `python tests/test_findings_validator.py` 실행.
  - 결과: 19건 중 실패 0건
- `python tests/smoke_test_renderer.py` 실행.
  - 결과: 22건 중 실패 0건
- `rg` 검색으로 `NONE`/무인증 잔존 위치를 확인.
  - 현재 활성 설정과 현재 install readiness 문서는 `ON_INSTALL`.
  - `NONE`은 이전 완료 보고, 이전 리뷰, D33 역사 기록, D34 before/after 설명에만 남아 있어 충돌로 보지 않음.
- 금지/과장 표현 및 public marketplace 등록 완료처럼 보이는 표현을 검색.
  - 관련 문구는 "공개 등록 아님", "대체하지 않음" 등 negation/경계 문맥.
- nonexistent assets/hooks/MCP/app 경로 추가 여부, `submission.zip`, PDF, 생성 DOCX/HTML, 로그 파일 추가 여부 검색.
  - 신규 추가 없음.
- `git diff --name-only 48bb48c..9e379b3 -- src\validators src\renderers src\schemas tests .gitignore logs log-hooks` 확인.
  - validator/renderer/schema/test/log 관련 변경 없음.

수행하지 못한 검증:

- 실제 Codex GUI 또는 CLI plugin browser 설치 확인은 수행하지 않았다. 이 검증은 외부 앱/설치 상태를 바꿀 수 있어 파일 기반 readiness 리뷰 범위로 제한했다.
- plugin-creator의 별도 validator CLI는 수행하지 않았다. 현재 repo에는 독립 실행 가능한 marketplace validator가 없고, 새 의존성 설치가 금지되어 있어 로컬 skill 지침과 파일 기반 구조 검증으로 대체했다.
- `jsonschema` 기반 Draft 검증은 수행하지 않았다. 환경에 `jsonschema`가 설치되어 있지 않았고, 새 의존성 설치 금지에 따라 표준 라이브러리 검증과 기존 validator/test로 대체했다.

## 5. Findings by Severity

- **Critical**: 없음
- **Major**: 없음
- **Minor**: 없음

## 6. Scope-Specific Review

### 6.1 Previous Major Resolution

- 판단: PASS
- 근거: 이전 Major였던 `.agents/plugins/marketplace.json`의 `policy.authentication=NONE`이 현재 `ON_INSTALL`로 보정되었다. `ON_INSTALL`은 plugin-creator 참조 스펙의 허용값이자 기본값이다.
- 이슈: 없음

### 6.2 Marketplace / Manifest Path Contract

- 판단: PASS
- 근거: marketplace `plugins[0].name`과 manifest `name`이 `samil-kssb-precheck`로 일치한다. `source.path=./src`는 repo root 기준 실제 plugin root를 가리키며, 그 아래 `.codex-plugin/plugin.json`과 `skills/`가 존재한다. manifest `skills=./skills/`도 plugin root 기준 실제 Skill 디렉터리와 정합한다.
- 이슈: 없음

### 6.3 Authentication Semantics

- 판단: PASS
- 근거: 문서가 `ON_INSTALL`을 실제 외부 인증 추가가 아니라 marketplace schema 허용값에 맞춘 설치 시점 정책값으로 설명한다. `docs/codex_install_readiness.md`, `docs/current_status.md`, `docs/decision_log.md`는 "실제 자격증명 요구를 추가하지 않음"을 명시한다.
- 이슈: 없음

### 6.4 Scope Control

- 판단: PASS
- 근거: Patch diff는 marketplace auth 보정과 관련 문서 현행화에 한정된다. validator/renderer/schema/test 로직 변경, Hook/MCP, `.mcp.json`, `.app.json`, assets/logo/screenshots, sample PDF, OCR/문서 파싱, submission.zip, 원본 로그 생성/수정은 발견되지 않았다.
- 이슈: 없음

### 6.5 Documentation Consistency

- 판단: PASS
- 근거: `docs/codex_install_readiness.md`는 `authentication: ON_INSTALL` 및 허용값 근거를 현재 상태로 설명한다. `docs/submission_packaging_policy.md`의 preflight도 marketplace authentication 허용값 점검을 포함한다. `docs/current_status.md`와 `docs/decision_log.md`는 D33 오류와 D34 정정을 추적 가능하게 남긴다.
- 이슈: 없음

## 7. Boundary / Risk Review

- 제품 경계: 유지됨. 삼일 공식 제품, 내부 도구, 감사·인증·준수 판단 대체 도구처럼 보이는 신규 표현은 발견되지 않았다.
- Public marketplace 경계: 유지됨. 문서는 Local/Repo marketplace와 Public Plugin Directory를 구분하고 공개 등록·공개 배포 완료를 주장하지 않는다.
- Skill-first 구조: 유지됨. 사용자-facing 진입점은 Skill이며 validator/renderer는 내부 구성요소라는 기존 설명과 충돌하지 않는다.
- Source-bound Analysis / 사람 검수 경계: 약화 없음. 이번 Patch는 marketplace auth metadata와 문서 정합만 다루며 findings 판정·근거·질문·권고 생성 로직을 건드리지 않았다.
- 보안/패키징 경계: `ON_INSTALL` 변경이 실제 OAuth, 토큰, MCP 인증, credential flow를 추가하지 않는다. 생성 산출물·로그·submission.zip도 추가되지 않았다.

## 8. Next-Step Readiness

- 판단: 준비됨
- 근거: Cycle 2G Review의 유일한 Major였던 marketplace authentication 허용값 이탈이 해소되었고, 현재 파일 기반 install readiness와 제출 정책 문서가 `ON_INSTALL` 기준으로 정합한다. validator/test/renderer smoke도 통과했다.
- Cycle 2H 착수 전 차단 이슈: 없음
- 주의할 리스크: 실제 Codex GUI/CLI install 확인은 아직 파일 기반 리뷰 밖의 별도 검증이다. Cycle 2H에서 실제 설치 확인 또는 샘플 실행으로 넘어갈 때 외부 앱 상태 변경 여부를 명확히 구분하면 된다.

## 9. Reviewer Notes

- D33의 `NONE` 판단을 삭제하지 않고 D34 정정으로 남긴 방식은 리뷰 추적성 측면에서 적절하다. 현재 활성 문서의 `NONE` 잔존은 before/after 또는 역사적 기록 문맥으로만 나타난다.
- `ON_INSTALL`이 Skill-only 구조에서 "외부 인증이 생겼다"로 오해될 수 있는 리스크는 문서가 충분히 완화한다. 핵심 문구는 "schema 허용값을 따른 것이며 실제 자격증명 요구를 추가하지 않는다"이다.
- `policy.installation=AVAILABLE`은 유지되었고, public Plugin Directory 등록 완료처럼 보이는 표현은 없다.

## 10. ChatGPT / User Confirmation

본 리뷰는 Cycle 2G Patch Marketplace Authentication 검증 결과만 기록한다. 다음 단계 판단은 ChatGPT/사용자가 본 리뷰와 GitHub 상태를 확인한 뒤 수행한다.
