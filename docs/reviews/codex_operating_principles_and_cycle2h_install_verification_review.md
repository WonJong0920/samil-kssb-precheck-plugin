# Codex Operating Principles Lock + Cycle 2H Install Verification Kit Review

## 1. Review Overview

- 대상 repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- 대상 branch: `main`
- 검토 기준 HEAD: `521ed0a0174e32340d98ddedf26ec5e53258879f`
- 대상 commits:
  - Operating Principles Lock: `521ed0a0174e32340d98ddedf26ec5e53258879f`
  - Cycle 2H User-led Install Verification Kit: `44c87acd33502a47307c0495e679e837bb3fd827`
- 비교 기준: `86312c21125a3cec67109b89c07a0e7d521bce31` 이후 두 작업 통합 diff
- 리뷰 목적: Operating Principles Lock과 Cycle 2H 사용자 직접 Codex install verification kit가 역할 구분, 보고 방식, 사용자 직접 검증 경계, 기존 marketplace/install readiness 정책과 정합하는지 독립 검증
- 리뷰 일시: 2026-07-02

## 2. Verdict / Readiness

- **Verdict**: PASS
- **Readiness**: 준비됨

한 줄 요약: `AGENTS.md`와 `docs/operating_principles.md`는 에이전트 역할과 보고 방식을 상위 운영 원칙으로 명확히 고정하고, Cycle 2H 문서와 evidence template은 실제 Codex app/CLI install verification을 사용자 직접 수행 항목으로 안전하게 남긴다. 다음 단계인 사용자 직접 Codex install verification 진행에 차단 이슈가 없다.

## 3. Reviewed Materials

최소 진입 문서:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/operating_principles_lock_completion_report.md`
- `docs/codex_install_verification.md`
- `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`
- `docs/cycle2h_user_led_install_verification_kit_completion_report.md`
- `docs/reviews/codex_cycle2g_patch_marketplace_auth_review.md`
- `docs/current_status.md`
- `docs/reviews/REVIEW_REPORT_TEMPLATE.md`

자율 탐색 문서/파일:

- `docs/decision_log.md`
- `docs/codex_install_readiness.md`
- `docs/submission_packaging_policy.md`
- `docs/templates/CLAUDE_CODE_TASK_PROMPT_TEMPLATE.md`
- `docs/templates/CODEX_REVIEW_PROMPT_TEMPLATE.md`
- `README.md`
- `docs/architecture.md`
- `.agents/plugins/marketplace.json`
- `src/.codex-plugin/plugin.json`
- `src/schemas/kssb_findings.schema.json`
- `src/schemas/kssb_findings_example.json`
- `src/validators/kssb_findings_validator.py`
- `tests/test_findings_validator.py`
- `tests/smoke_test_renderer.py`

참고한 로컬 스펙:

- system `plugin-creator` skill의 marketplace entry 지침: `policy.authentication` 허용값 `ON_INSTALL`/`ON_USE`, 기본값 `ON_INSTALL`; `policy.installation` 허용값 `NOT_AVAILABLE`/`AVAILABLE`/`INSTALLED_BY_DEFAULT`.

확인한 OpenAI 공식 문서:

- Codex Plugins overview: https://developers.openai.com/codex/plugins
- Build plugins: https://developers.openai.com/codex/plugins/build

## 4. Validation Performed

- `git status --short`로 리뷰 전 working tree clean 확인.
- `git log --oneline -10`, `git rev-parse HEAD`, `git branch --show-current`로 branch `main`, HEAD `521ed0a`, 대상 commit 두 개 반영 상태 확인.
- `git merge-base --is-ancestor`로 `44c87ac`와 `521ed0a`가 HEAD에 포함됨을 확인.
- `git diff --name-status 86312c2..HEAD`와 `git diff --stat 86312c2..HEAD`로 두 작업의 변경 범위를 확인.
  - 변경은 `AGENTS.md`, 운영 원칙 문서, install verification 문서/template, current_status, decision_log, install readiness, submission policy, prompt templates에 한정.
- `git diff --name-only 86312c2..HEAD -- .agents src .gitignore tests logs log-hooks`로 marketplace/manifest/validator/renderer/schema/test/log 구조가 변경되지 않았음을 확인.
- PowerShell `ConvertFrom-Json`으로 marketplace/manifest JSON 파싱 및 cross-field 정합 확인.
  - marketplace `plugins[0].name` = manifest `name` = `samil-kssb-precheck`
  - marketplace `source.path` = `./src`
  - `./src/.codex-plugin/plugin.json` 존재
  - `./src/skills/` 및 `src/skills/samil-kssb-precheck/SKILL.md` 존재
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
- `rg` 검색으로 다음을 확인.
  - 실제 install 성공을 이미 주장하는 표현 없음. 관련 표현은 "주장하지 않는다", "미확인", "사용자 직접 수행" 문맥.
  - Public Plugin Directory 등록·공개 배포 완료 주장 없음. 관련 표현은 "아님/범위 밖" 문맥.
  - 민감정보·로컬 절대경로·토큰 관련 문구는 기록 금지, `[REDACTED]`, 스캔 대상 안내 문맥.
  - Hook/MCP/assets/submission/sample/log 관련 문구는 금지·미수행·범위 밖 문맥.
- `rg --files`로 `.mcp.json`, `.app.json`, assets, screenshots, `submission.zip`, PDF, 생성 DOCX/HTML, 실제 evidence 결과 문서 추가 여부 확인.
  - 신규 금지 산출물 없음. evidence는 template만 존재.
- 의존성 매니페스트 검색 및 diff 확인.
  - 새 외부 의존성 파일 추가 없음.
- OpenAI 공식 Codex plugin 문서 2건을 확인.
  - `https://developers.openai.com/codex/plugins`: Codex app plugin directory, CLI `/plugins`, install/detail/enabled 상태 확인, 새 thread에서 plugin 사용 요청 흐름을 확인.
  - `https://developers.openai.com/codex/plugins/build`: repo marketplace 위치(`$REPO_ROOT/.agents/plugins/marketplace.json`), marketplace `source.path`가 marketplace root 기준 상대경로라는 점, `.codex-plugin/plugin.json` 필수 entry point, manifest path rules, marketplace `policy.authentication=ON_INSTALL` 예시, workspace sharing이 public Plugin Directory publish가 아니라는 점을 확인.

수행하지 못한 검증:

- 실제 Codex GUI 또는 CLI plugin install/enable/use 확인은 수행하지 않았다. 이번 운영 원칙과 Cycle 2H 문서상 사용자 직접 검증 항목이며, 외부 앱/계정/로컬 Codex 상태를 변경할 수 있으므로 Codex가 수행하지 않는 것이 맞다.
- plugin-creator 별도 validator CLI는 수행하지 않았다. 현재 repo에 독립 실행 가능한 marketplace validator가 없고, 새 의존성 설치가 금지되어 있어 로컬 `plugin-creator` skill 지침과 파일 기반 구조 검증으로 대체했다.
- `jsonschema` 기반 Draft 검증은 수행하지 않았다. 환경에 `jsonschema`가 설치되어 있지 않았고, 새 의존성 설치 금지에 따라 표준 라이브러리 검증과 기존 validator/test로 대체했다.

## 5. Findings by Severity

- **Critical**: 없음
- **Major**: 없음
- **Minor**: 없음

## 6. Operating Principles Review

### 6.1 AGENTS.md as Read-First Entry Point

- 판단: PASS
- 근거: `AGENTS.md`는 모든 작업/리뷰 시작 전에 `AGENTS.md`와 `docs/operating_principles.md`를 먼저 읽으라고 명시한다. 역할 구분 표와 핵심 운영 원칙을 루트 진입 문서로 제공해 이후 프롬프트가 짧아져도 상위 원칙을 참조할 수 있다.
- 이슈: 없음

### 6.2 Role Separation

- 판단: PASS
- 근거: Claude Code는 작업 수행자이자 repo 문서 완료 보고 작성자이며 PASS/FAIL 판정 금지로 정의된다. Codex는 독립 검증자이며 PASS/CONDITIONAL PASS/FAIL 판정, 자율 탐색, `docs/reviews/` 기록 의무가 명확하다. ChatGPT는 작업 분기 판단과 프롬프트 작성, User는 외부 상태 검증과 최종 제출 판단으로 구분된다.
- 이슈: 없음

### 6.3 Chat Reporting Discipline

- 판단: PASS
- 근거: `AGENTS.md`, `docs/operating_principles.md`, Claude/Codex prompt templates 모두 Claude Code와 Codex가 장문 완료/검증 보고를 채팅에 쓰지 않고 repo 문서로 상세를 남기도록 고정한다.
- 이슈: 없음

### 6.4 Prompt Template Alignment

- 판단: PASS
- 근거: `docs/templates/CLAUDE_CODE_TASK_PROMPT_TEMPLATE.md`와 `docs/templates/CODEX_REVIEW_PROMPT_TEMPLATE.md` 모두 read-first 지시와 역할별 보고 방식을 반영한다. 이후 모든 Claude/Codex 프롬프트가 두 운영 원칙 문서를 먼저 읽도록 하는 규칙과 정합한다.
- 이슈: 없음

### 6.5 Durability Beyond One Cycle

- 판단: PASS
- 근거: 운영 원칙 문서는 특정 Cycle 산출물이 아니라 역할·보고 방식·항상 유지하는 경계를 고정하는 형태다. 원칙 변경 시 `decision_log`와 두 문서를 함께 갱신하라고 하여 지속 적용 가능성이 있다.
- 이슈: 없음

## 7. Cycle 2H Install Verification Kit Review

### 7.1 User-Led Verification Boundary

- 판단: PASS
- 근거: `docs/codex_install_verification.md`는 사용자가 직접 Codex app/CLI에서 marketplace 표시, plugin 설치/활성화, 새 thread 사용 요청을 확인하는 절차 문서라고 밝힌다. Claude Code가 실제 Codex app/CLI 상태를 조작하지 않는다는 경계도 상단에 명확하다.
- 이슈: 없음

### 7.2 Marketplace / Plugin Structure Accuracy

- 판단: PASS
- 근거: 문서와 template은 repo marketplace `.agents/plugins/marketplace.json`, plugin root `src/`, manifest `src/.codex-plugin/plugin.json`, Skill path `./skills/` -> `src/skills/samil-kssb-precheck/`, `source.path=./src`, `policy.authentication=ON_INSTALL`, `policy.installation=AVAILABLE`를 현재 파일과 일치하게 설명한다.
- 공식 문서 대조: Build plugins 문서는 repo marketplace를 `$REPO_ROOT/.agents/plugins/marketplace.json`에 둘 수 있고, 각 entry의 `source.path`는 marketplace root 기준의 `./` 상대경로로 plugin folder를 가리킨다고 설명한다. 이 repo의 `source.path=./src`는 plugin root가 `src/`라는 현재 구조와 정합한다.
- 이슈: 없음

### 7.3 Local/Repo vs Public Marketplace Boundary

- 판단: PASS
- 근거: `docs/codex_install_verification.md`와 `docs/codex_install_readiness.md` 모두 Local/Repo marketplace와 Public Plugin Directory를 구분하고, 공개 등록·공개 배포가 아니라고 반복 명시한다.
- 공식 문서 대조: Build plugins 문서는 local/workspace sharing이 Public Plugin Directory publish가 아니라고 설명하며, 현재 문서의 local/repo marketplace 경계와 정합한다.
- 이슈: 없음

### 7.4 CLI / App GUI / New Thread Procedure

- 판단: PASS
- 근거: CLI 절차는 plugin/marketplace 탐색, marketplace 표시, plugin 표시, detail 확인, install/enable, enabled 상태 기록으로 구성된다. GUI 절차도 Plugins 화면 접근, source/plugin/detail/install/enable/enabled 상태 확인으로 충분하다. 새 thread 절차는 Skill을 유도하는 요청, Skill/plugin 사용 정황, 출력 요약/오류 기록을 요구한다.
- 공식 문서 대조: Plugins overview는 Codex CLI에서 `codex` 실행 후 `/plugins`로 plugin list를 열고, marketplace tab/detail/install/uninstall/enabled toggle을 확인하며, 설치 후 새 thread에서 plugin 사용을 요청하는 흐름을 안내한다. Cycle 2H 절차는 이 흐름을 과도하게 단정하지 않고 버전 차이를 공식 문서 우선으로 처리한다.
- 이슈: 없음

### 7.5 Failure Handling and Evidence Template

- 판단: PASS
- 근거: 실패 시 확인 항목이 marketplace 위치/JSON/source.path, name 정합, plugin root, policy, manifest skills path 기준으로 정리되어 있다. evidence template은 CLI, App GUI, 새 thread 결과, 외부 상태 변경, 원복 필요성, PASS/PARTIAL/FAIL 판정을 기록할 수 있다.
- 이슈: 없음

### 7.6 Sensitive Information Boundary

- 판단: PASS
- 근거: 절차 문서와 evidence template 모두 로컬 절대경로, 사용자명/계정 식별정보, 이메일, API 키·토큰·자격증명, 개인 파일 경로를 기록하지 말고 필요 시 `[REDACTED]`로 치환하라고 안내한다. submission policy도 evidence를 B분류로 두고 제출 단계 민감정보 스캔 후 repo/zip 포함을 결정하게 한다.
- 이슈: 없음

### 7.7 No Premature Success Claim

- 판단: PASS
- 근거: 문서는 "실제 설치 성공을 주장하지 않는다", "아직 확인되지 않았다", "사용자 직접 수행"을 명확히 반복한다. install verification kit는 성공을 단정하지 않고 결과 기록 표준만 제공한다.
- 이슈: 없음

## 8. Integration / Consistency Review

- 운영 원칙과 Cycle 2H 사용자 직접 검증 원칙은 정합한다. User 역할에 외부 앱/CLI 상태 변경 검증을 배치하고, Cycle 2H 문서가 이를 실제 절차로 연결한다.
- `docs/codex_install_verification.md`는 `docs/codex_install_readiness.md`의 파일 기반 readiness와 충돌하지 않는다. 전자는 사용자 직접 실사용 확인, 후자는 파일 기반 사전 정합성이다.
- `docs/submission_packaging_policy.md`는 install verification evidence를 B분류로 추가하고, FAIL/PARTIAL이면 제출 전 보정 후 재검증하라고 하여 제출 정책과 정합한다.
- `docs/current_status.md`와 `docs/decision_log.md`는 D35(Cycle 2H)와 D36(Operating Principles Lock)을 추적 가능하게 반영한다.
- 이번 두 작업은 코드·manifest·marketplace 구조를 변경하지 않고 문서/양식 범위에 머물렀다.
- 기존 Cycle 2G Patch Review에서 PASS된 marketplace 구조(`source.path=./src`, `authentication=ON_INSTALL`, `installation=AVAILABLE`)는 훼손되지 않았다.
- 다음 단계가 사용자 직접 Codex app/CLI install verification이며, evidence template을 채워 후속 검증으로 이어질 수 있음이 명확하다.

## 9. Boundary / Risk Review

- 제품 경계: 유지됨. 삼일회계법인 공식 제품·내부 도구, 감사·인증·준수 판단 대체 도구처럼 보이는 신규 표현은 발견되지 않았다.
- Skill-first: 유지됨. 사용자-facing 진입점은 Skill 하나이고 validator/renderer는 내부 구성요소라는 기존 경계와 충돌하지 않는다.
- Source-bound Analysis / 사람 검수 경계: 운영 원칙 문서가 해당 원칙을 유지 대상으로 명시하며, Cycle 2H kit는 분석 로직을 건드리지 않는다.
- Detect-only / no re-judgment: validator/renderer/schema/test 변경이 없고, Cycle 2H 문서는 설치 검증 절차만 다룬다.
- 외부 상태 변경 경계: 실제 Codex install/enable은 사용자 직접 수행으로 남아 있으며, Codex/Claude가 대신 수행했다는 흔적은 없다.
- 금지 작업: Hook/MCP, `.mcp.json`, `.app.json`, assets/logo/screenshots, OCR/문서 파싱, 샘플 PDF 분석, `submission.zip`, 원본 로그 생성/수정/요약, 실제 install/enable 수행은 발견되지 않았다.
- 민감정보 리스크: 실제 evidence 결과 문서는 아직 없고 template만 존재한다. template에는 민감정보 금지와 `[REDACTED]` 원칙이 충분히 안내된다.

## 10. Next-Step Readiness

- 판단: 준비됨
- 근거: 운영 원칙과 Cycle 2H kit가 모두 명확하고, 기존 install readiness/packaging policy와 충돌하지 않는다. marketplace/manifest 파일 기반 정합성 및 기존 validator/smoke 검증도 통과했다.
- 다음 단계 착수 전 차단 이슈: 없음
- 다음 단계 성격: 사용자 직접 Codex app/CLI install verification 수행 및 evidence template 작성. 이 리뷰는 Cycle 2I 상세 구현 계획을 작성하지 않는다.

## 11. Reviewer Notes

- `docs/codex_install_verification.md`의 CLI/GUI 메뉴명은 버전별 차이를 인정하고 "공식 문서 우선"이라고 안내한다. 이는 정확한 명령을 과도하게 단정하는 것보다 안전하다.
- `docs/submission_packaging_policy.md`에서 evidence를 B분류로 둔 것은 적절하다. 실제 evidence에는 로컬 환경·계정 상태·오류 메시지가 포함될 수 있으므로 제출 단계 민감정보 스캔 후 repo 포함 vs zip-only를 판단해야 한다.
- Operating Principles Lock이 현재 리뷰에도 바로 적용 가능하다. 본 리뷰도 상세 검증 내용은 repo 문서에 남기고 채팅 보고는 짧게 해야 한다.

## 12. ChatGPT / User Confirmation

본 리뷰는 Operating Principles Lock과 Cycle 2H User-led Install Verification Kit의 통합 검증 결과만 기록한다. 다음 단계 판단과 실제 사용자 직접 install verification 수행 여부는 ChatGPT/사용자가 본 리뷰와 GitHub 상태를 확인한 뒤 결정한다.
