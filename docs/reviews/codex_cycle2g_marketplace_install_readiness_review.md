# Codex Cycle 2G Marketplace / Install Readiness Review

## 1. Review Overview

- 검증 대상 repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- 검증 대상 branch: `main`
- 검증 대상 commit: `dc15b6dfaeb8dd825c6aa67415b842b32d00c43b`
- 비교 기준: 직전 Codex Cycle 2F Submission Preflight Review commit `15e0bdb25d2bbe4a1029047f1008884124ed6a00`
- 리뷰 목적: Cycle 2G 산출물이 Codex Marketplace / Local Install Readiness 범위에 머물렀는지, repo/local marketplace와 plugin manifest metadata가 실제 plugin root(`./src`) 구조와 정합하는지 독립 검증
- 리뷰 일시: 2026-07-02 KST

## 2. Verdict

- **Verdict**: CONDITIONAL PASS
- **Readiness**: 조건부 준비됨
- 한 줄 요약: repo marketplace 위치, `source.path=./src`, plugin root, manifest `skills=./skills/`, name 정합, 제품 경계 문구는 대체로 적절하다. 다만 `.agents/plugins/marketplace.json`의 `policy.authentication` 값 `NONE`은 plugin-creator 참조 스펙의 허용값(`ON_INSTALL`, `ON_USE`)에 없으므로 install failure 위험이 있는 Major 이슈다.

## 3. Reviewed Materials

- `docs/cycle2g_marketplace_install_readiness_completion_report.md`
- `docs/reviews/codex_cycle2f_submission_preflight_review.md`
- `docs/current_status.md`
- `docs/reviews/REVIEW_REPORT_TEMPLATE.md`
- `.agents/plugins/marketplace.json`
- `src/.codex-plugin/plugin.json`
- `docs/codex_install_readiness.md`
- `docs/submission_packaging_policy.md`
- `README.md`
- `docs/architecture.md`
- `docs/decision_log.md`
- `src/skills/samil-kssb-precheck/`
- OpenAI Codex manual cache: `Build plugins`, `Plugins`
- plugin-creator references: `references/plugin-json-spec.md`, `references/installing-and-updating.md`

## 4. Validation Performed

- 대상 branch/commit 확인: `main`, `dc15b6dfaeb8dd825c6aa67415b842b32d00c43b`.
- 작업 전 git 상태 확인: working tree clean.
- `git diff --name-status 15e0bdb... dc15b6d...`로 변경 범위 확인:
  - 변경/추가 파일은 `.agents/plugins/marketplace.json`, `src/.codex-plugin/plugin.json`, README, architecture, install readiness 문서, current_status, completion report, decision_log, submission policy 등 9개에 한정됨.
  - `src/validators`, `src/renderers`, `src/schemas`, `tests`, `.gitignore`, `logs`, `log-hooks` 변경 없음.
- Codex manual helper 실행:
  - 기본 sandbox에서는 network 차단으로 실패.
  - 승인된 escalated shell에서 `fetch-codex-manual.mjs` 실행 성공, local manual current 확인.
  - manual의 `Build plugins` 섹션에서 repo marketplace 위치(`$REPO_ROOT/.agents/plugins/marketplace.json`)와 `source.path`의 `./` 상대경로, marketplace root 기준 해석 확인.
- plugin-creator 참조 스펙 확인:
  - marketplace entry는 `policy.installation`, `policy.authentication`, `category`를 포함해야 함.
  - `policy.installation` 허용값: `NOT_AVAILABLE`, `AVAILABLE`, `INSTALLED_BY_DEFAULT`.
  - `policy.authentication` 허용값: `ON_INSTALL`, `ON_USE`.
  - 기본값은 `installation: AVAILABLE`, `authentication: ON_INSTALL`.
- marketplace/manifest 정합 확인:
  - marketplace `plugins[0].name` = `samil-kssb-precheck`.
  - manifest `name` = `samil-kssb-precheck`.
  - `source.path` = `./src`.
  - `./src/.codex-plugin/plugin.json`, `./src/skills/`, `./src/skills/samil-kssb-precheck/` 존재.
  - manifest `skills` = `./skills/`, plugin root 기준 `src/skills/`로 정합.
  - `developerName` = `WonJong0920`, 삼일 공식 주체처럼 보이지 않음.
- JSON 문법 확인:
  - `python -m json.tool .agents/plugins/marketplace.json`
  - `python -m json.tool src/.codex-plugin/plugin.json`
  - `python -m json.tool src/schemas/kssb_findings.schema.json`
  - `python -m json.tool src/schemas/kssb_findings_example.json`
- validator/renderer 검증:
  - `python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json` → error 0건, warning 0건, info 1건(`jsonschema` 미설치 안내), RC 0.
  - `python tests/test_findings_validator.py` → 19/19 PASS.
  - `python tests/smoke_test_renderer.py` → 22/22 PASS.
- 금지 산출물/경로 확인:
  - `.mcp.json`, `.app.json`, assets/logo/screenshots, hooks, `submission.zip`, PDF, 생성 DOCX/HTML, `build/`, `out/` 추가 없음.
  - tracked 파일 기준 관련 금지 산출물은 `logs/.gitkeep`만 존재.
- 금지/과장 표현 검색:
  - `Public Plugin Directory`, `공개 배포`, `등록 완료`, `공식 제품`, `감사`, `인증`, `준수`, `확정`, `audit trail` 등 검색.
  - 신규/변경 문서의 해당 표현은 "아님", "미수행", "점검 대상" 등 negation/경계 문맥으로 사용됨.

### 수행하지 못한 검증

- 실제 Codex GUI/CLI plugin browser 설치 확인은 수행하지 않았다. 설치 확인은 사용자 Codex 설정/전역 plugin 상태를 변경할 수 있고, 현재 marketplace policy 값에 Major 이슈가 있어 파일 기반 검증으로 제한했다.
- `plugin-creator`의 `validate_plugin.py`는 실행했으나 `yaml` 모듈 부재로 실패했다. 새 의존성 설치 금지 지시에 따라 설치하지 않았다.
- `jsonschema` 기반 Draft-07 전체 schema validation은 수행하지 않았다. 현재 환경에 `jsonschema`가 설치되어 있지 않았고, 새 의존성 설치 금지 지시에 따라 설치하지 않았다.

## 5. Findings by Severity

- **Critical**: 없음
- **Major**:
  - `.agents/plugins/marketplace.json`의 `policy.authentication` 값이 `NONE`이다. `plugin-creator` 참조 스펙과 현재 스킬 지침은 marketplace `policy.authentication` 허용값을 `ON_INSTALL` 또는 `ON_USE`로 제한하고, 기본값을 `ON_INSTALL`로 둔다. 공식 Codex manual의 repo marketplace 예시도 `ON_INSTALL`을 사용한다. 따라서 `NONE`은 install surface에서 거부되거나 렌더링/설치 실패를 일으킬 위험이 있다.
- **Minor**: 없음

## 6. Scope-Specific Review

### 6.1 Cycle 2G 범위 준수

- 판단: PASS
- 근거: 변경은 marketplace, plugin manifest metadata, install readiness/packaging/상태 문서에 한정된다. validator/renderer/schema/test 로직 변경, Hook/MCP/app/assets 추가, submission.zip 생성, 샘플 분석, OCR/문서 파싱은 없다.

### 6.2 Repo/local marketplace 위치와 구조

- 판단: PASS
- 근거: `.agents/plugins/marketplace.json`은 Codex manual이 설명하는 repo-scoped marketplace 위치와 일치한다. top-level `name`, `interface.displayName`, `plugins[]` 구조도 marketplace 용도에 맞다.

### 6.3 Marketplace name/source.path/plugin root 정합

- 판단: PASS
- 근거: marketplace `plugins[0].name`과 manifest `name`이 `samil-kssb-precheck`로 일치한다. `source.path=./src`는 repo root marketplace 기준 plugin root `src/`를 정확히 가리키며, 해당 위치에 `.codex-plugin/plugin.json`과 `skills/`가 존재한다.

### 6.4 Manifest skills path

- 판단: PASS
- 근거: manifest `skills=./skills/`는 plugin root(`src/`) 기준 `src/skills/`로 해석되며 실제 Skill directory `src/skills/samil-kssb-precheck/`와 보조 문서들이 존재한다.

### 6.5 Marketplace policy

- 판단: 이슈 있음
- 근거: `installation=AVAILABLE`은 허용값이고 repo/local install readiness와 맞다. 그러나 `authentication=NONE`은 확인 가능한 plugin-creator marketplace spec의 허용값에 없다. Skill-only·무인증 의도는 이해되지만, Codex marketplace schema 관점에서는 `ON_INSTALL` 또는 `ON_USE` 중 하나를 써야 할 가능성이 높다.

### 6.6 Plugin manifest metadata

- 판단: PASS
- 근거: `interface`, `keywords`, `repository`는 plugin-creator 참조 스펙의 manifest field guide에 존재한다. 없는 assets/logo/screenshots 경로나 Hook/MCP/app 경로를 manifest에 추가하지 않았고, `developerName=WonJong0920`은 삼일 공식 제품 오해를 줄이는 방향이다.

### 6.7 Public Plugin Directory / 제품 경계

- 판단: PASS
- 근거: marketplace, install readiness 문서, completion report, architecture, submission policy가 반복적으로 Public Plugin Directory 등록·공개 배포가 아님을 명시한다. 삼일 공식 제품, 감사·인증·준수 확정 도구처럼 보이는 신규 표현은 확인되지 않았다.

### 6.8 제출 정책/문서 정합성

- 판단: PASS
- 근거: `docs/submission_packaging_policy.md`가 `.agents/plugins/marketplace.json`을 A분류(repo 커밋 + zip 포함)로 추가했고, preflight에 marketplace JSON 문법, name 정합, `source.path`, local vs public 구분 확인을 반영했다. README/architecture/current_status/decision_log도 실제 추가 파일과 정합한다.

### 6.9 Cycle 2H 착수 가능성

- 판단: 조건부 준비됨
- 근거: install readiness의 핵심 경로와 manifest 구조는 준비되어 있으나, `policy.authentication=NONE` 보정 전에는 실제 설치 확인 또는 다음 단계 착수를 준비됨으로 보기는 어렵다. 해당 값을 허용값으로 보정한 뒤 GUI/CLI install 확인 또는 다음 사이클로 넘어가는 것이 안전하다.

## 7. Boundary / Risk Review

- 제품 경계: 유지됨. 비공식·컨설턴트 검수용·감사/인증/준수 판단 대체 아님 문구가 manifest와 문서에 유지된다.
- Source-bound Analysis: 유지됨. Cycle 2G는 install metadata와 문서 정합성 작업이며 findings·판정·근거 생성/수정을 하지 않는다.
- 사람 검수 경계: 유지됨. 산출물/보고서 판단 원칙에는 변화가 없다.
- 금지 작업: 수행되지 않음. Hook/MCP, `.mcp.json`, `.app.json`, assets/logo/screenshots, OCR/문서 파싱, 샘플 PDF 분석, submission.zip 생성, 로그 생성/수정, 생성 DOCX/HTML 커밋이 없다.
- Install risk: `policy.authentication=NONE`이 허용값 밖으로 보이므로 실제 Codex plugin browser에서 install failure가 발생할 수 있다.

## 8. Next-Step Readiness

- 판단: 조건부 준비됨
- Cycle 2H 착수 전 차단 조건:
  - marketplace `policy.authentication`을 확인 가능한 허용값(`ON_INSTALL` 또는 `ON_USE`)으로 보정해야 한다.
- 주의할 리스크:
  - 보정 후 실제 Codex GUI/CLI plugin browser에서 repo marketplace 표시·설치 확인을 수행해야 한다.
  - plugin-creator validator는 `yaml` 부재로 실행하지 못했으므로, 의존성이 갖춰진 환경 또는 Codex install surface에서 schema-level 검증을 재확인해야 한다.

## 9. Reviewer Notes

- `category=Productivity`는 manual 예시와 동일하고, KSSB evidence precheck workflow가 업무 생산성 범주에 들어가므로 무리하지 않다.
- `keywords`는 `kssb`, `esg`, `sustainability-disclosure`, `evidence-precheck`, `consultant-draft`로 제한되어 있고 public marketplace SEO처럼 과장되지는 않는다.
- `repository`는 공개 GitHub repo URL이며 manifest field guide에 존재한다. 안전성 문제는 확인되지 않았다.
- `source.path=./src`는 manual의 일반 예시(`./plugins/my-plugin`)와 다르지만, manual은 plugin directories가 고정 요구사항이 아니라 예시이며 `source.path`가 marketplace root 기준 plugin folder를 가리키면 된다고 설명한다. 따라서 `src/`가 plugin root인 이 repo 구조에서는 적절하다.

## 10. ChatGPT / User Confirmation

- 본 리뷰는 Cycle 2G Marketplace / Local Install Readiness 검증 결과만 기록한다.
- 산출물, marketplace, manifest, README, schema, validator, renderer는 수정하지 않았다.
- 실제 Codex GUI/CLI install, `policy.authentication` 보정, Cycle 2H 상세 구현 계획은 수행하지 않았다.
- ChatGPT/사용자 확인 대기.
