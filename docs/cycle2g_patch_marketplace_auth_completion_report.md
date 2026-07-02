# Cycle 2G Patch 완료 보고 — Marketplace Authentication Policy Fix

## 1. 작업 개요

Codex Cycle 2G Marketplace / Install Readiness Review의 **CONDITIONAL PASS** Major를 최소 범위로 보정했다.
`.agents/plugins/marketplace.json`의 `policy.authentication` 값을 허용값 밖인 `NONE`에서 **`ON_INSTALL`**로 정렬하고,
그 값을 근거로 한 문서 문구(무인증/`NONE`)를 현행화했다. 이번 작업은 **Cycle 2G Patch**이며 Cycle 2H 착수가 아니다.
validator/renderer/schema 로직, manifest 핵심 필드·`source.path`(`./src`)·name 정합, Hook/MCP/app/assets는 변경/추가하지 않았다.

## 2. Codex Major 지적사항 요약

- `.agents/plugins/marketplace.json`의 `policy.authentication` 값 `NONE`이 plugin-creator 참조 스펙·Codex manual 예시의
  허용값(`ON_INSTALL`, `ON_USE`, 기본값 `ON_INSTALL`) 밖이라, install surface에서 거부·렌더링/설치 실패 위험이 있다.
- 나머지(repo marketplace 위치, `source.path=./src`, plugin root, `skills=./skills/`, name 정합, 제품 경계)는 리뷰에서 PASS.

## 3. 참고한 최소 진입 문서와 자율 탐색한 주요 파일

**최소 진입 문서**
- `docs/reviews/codex_cycle2g_marketplace_install_readiness_review.md` — Major 및 허용값(`ON_INSTALL`/`ON_USE`, 기본 `ON_INSTALL`), `installation` 허용값(`NOT_AVAILABLE`/`AVAILABLE`/`INSTALLED_BY_DEFAULT`) 확인.
- `docs/current_status.md` — 직전 상태(2G base).
- `docs/templates/CYCLE_COMPLETION_REPORT_TEMPLATE.md` — 완료 보고 구조.

**자율 탐색한 주요 파일**
- `.agents/plugins/marketplace.json`(보정 대상), `src/.codex-plugin/plugin.json`(무변경 확인).
- `docs/codex_install_readiness.md`·`docs/submission_packaging_policy.md`·`docs/current_status.md`·`docs/decision_log.md` — `NONE`/무인증 문구 위치를 grep으로 탐색해 보정 범위 확정.
- `README.md`·`docs/architecture.md` — authentication 언급 없음 확인(수정 불필요).
- `docs/cycle2g_marketplace_install_readiness_completion_report.md` — 과거 완료 보고, 원칙대로 **미수정**(당시 상태 기록 보존).

## 4. 수정한 파일

- `.agents/plugins/marketplace.json` — `policy.authentication`: `NONE` → `ON_INSTALL`.
- `docs/codex_install_readiness.md` — policy 설명을 `ON_INSTALL`로 현행화(허용값·기본값·실제 자격증명 미추가 명시).
- `docs/submission_packaging_policy.md` — §4.1 preflight에 `policy.authentication` 허용값(`ON_INSTALL`/`ON_USE`)·`installation` 허용값 점검 추가.
- `docs/current_status.md` — Cycle 2G(+Patch) 상태·Patch 섹션 추가, base 서술의 authentication 표기 현행화, GitHub 다음 단계 갱신.
- `docs/decision_log.md` — D33에 정정 포인터 추가, D34(정정 결정) 신설.

**변경하지 않음**: `src/.codex-plugin/plugin.json`(핵심 필드·metadata), `src/validators/**`·`src/renderers/**`·`src/schemas/**`·`tests/**`·`.gitignore`, `docs/cycle2g_marketplace_install_readiness_completion_report.md`(과거 완료 보고).

## 5. marketplace authentication 보정 내용

- **변경 전**: `"policy": { "installation": "AVAILABLE", "authentication": "NONE" }`
- **변경 후**: `"policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" }`
- **근거**: 리뷰가 확인한 허용값은 `ON_INSTALL`/`ON_USE`, 기본값은 `ON_INSTALL`. Skill-only·무인증 의도라도 schema 허용값을 따라야 실제 설치가 가능하다.
  `ON_USE`(사용 시점)보다 `ON_INSTALL`(설치 시점 검토/동의)이 보수적 기본값이라 선택. **실제 외부 자격증명 요구(MCP/hook/토큰)는 추가하지 않고 값만 정렬**했다.
- `installation`은 허용값 `AVAILABLE` 유지.

## 6. 문서 정합성 보정 내용

- `docs/codex_install_readiness.md`: "`authentication: NONE` … 인증 단계가 필요 없다" → "`authentication: ON_INSTALL`(허용값·기본값). 실제 외부 인증은 없지만 schema 허용값을 따라 보수적 기본값 사용".
- `docs/submission_packaging_policy.md` §4.1: authentication/installation 허용값 점검 항목 추가.
- `docs/current_status.md`: base 서술의 authentication 표기를 "Patch에서 `ON_INSTALL`로 보정"으로 현행화하고 Patch 섹션에 before→after 기록.
- `docs/decision_log.md`: D33의 `authentication: NONE` 선택이 허용값 밖 오류였음을 정정 포인터로 표기하고, D34에서 `ON_INSTALL` 보정 결정을 기록(before/after 명시).
- 과거 완료 보고(`cycle2g_..._completion_report.md`)는 당시 상태 기록이라 수정하지 않았다. 변경 전/후는 본 Patch 완료 보고와 D34에 남긴다.

## 7. install readiness 검증 결과 (파일 기반)

- marketplace JSON 문법 OK, manifest JSON 문법 OK.
- `plugins[].name`(`samil-kssb-precheck`) = manifest `name` — 정합.
- `source.path`(`./src`) 아래 `.codex-plugin/plugin.json`·`skills/` 존재 — 확인.
- manifest `skills`(`./skills/`) → `src/skills/samil-kssb-precheck/` 해석 — 확인.
- `policy.authentication`=`ON_INSTALL`(허용값), `policy.installation`=`AVAILABLE`(허용값) — 확인.

## 8. Preflight Check 결과

**수행함**
- `.agents/plugins/marketplace.json`·`src/.codex-plugin/plugin.json` JSON 문법 OK.
- name↔manifest 정합, `source.path=./src`가 plugin root(`.codex-plugin/plugin.json`·`skills/`)를 가리킴, manifest skills 경로 정합 — 스크립트로 확인.
- `policy.authentication`∈{`ON_INSTALL`,`ON_USE`}, `policy.installation` 허용값 — 확인.
- schema/example JSON 문법 OK. validator CLI error 0건 RC0. validator test **19/19 PASS**. renderer smoke **22/22 PASS**.
- 금지 산출물 미추가(`.mcp.json`/`.app.json`/assets/logo/screenshots/hooks/`submission.zip`/PDF/생성 DOCX/HTML/로그), 로직/스키마/테스트/`.gitignore` 무변경.
- Public marketplace 등록·공개 배포처럼 보이는 신규 표현 없음(관련 문구는 negation 유지). 금지/과장 표현·내부 경로 신규 노출 없음. 새 외부 의존성 없음.

**수행하지 못함 — §9**

## 9. 수행하지 못한 검증과 이유

- **실제 Codex GUI/CLI plugin browser 설치 확인**: 이 환경에서 Codex 설치 화면 접근이 불가하여 미수행. 이번 Patch 핵심은 파일 기반 Major 해소이며, GUI 확인은 별도 단계로 남긴다(`docs/codex_install_readiness.md`).
- **plugin-creator `validate_plugin.py` schema 검증**: 리뷰에서 `yaml` 모듈 부재로 실패했다고 기록됨. 새 의존성 설치 금지에 따라 이 Patch에서도 설치·실행하지 않았다.
- **`jsonschema` full validation**: 미설치로 미수행(로직 무변경이라 신규 리스크 없음).

## 10. 금지 작업 미수행 확인

- Public Plugin Directory 등록·공개 배포 주장 / 실제 publish — 미수행.
- Hook/MCP/`.mcp.json`/`.app.json`/assets/logo/screenshots 추가 — 미수행.
- `submission.zip` 생성, 샘플 PDF 분석, OCR/문서 파싱 — 미수행.
- 외부 패키지 추가 — 미수행(값 보정만).
- 원본 AI 대화 로그 생성·수정·요약 — 미수행.
- 생성 DOCX/HTML repo 커밋 — 미수행.
- Cycle 2H 상세 계획 작성 — 미수행.
- validator/renderer/schema 로직 변경 — 미수행. manifest `source.path`(`./src`)·name 정합 유지.
- 사용자-facing 기본 흐름을 Python CLI 중심으로 바꾸는 문구 — 작성하지 않음.

## 11. 남은 보류사항

- 실제 Codex GUI/CLI 설치 화면에서 repo marketplace 표시·설치 확인(별도 단계).
- plugin-creator validator/스키마 레벨 재확인(의존성 갖춘 환경 또는 Codex install surface).
- 로그 원본 제출 방식 최종 확정·실제 submission.zip 생성·샘플 실행(제출/샘플 단계). Public Plugin Directory 등록은 범위 밖.

## 12. GitHub push 상태

- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- commit message: `fix: align marketplace authentication policy`
- 최종 commit SHA는 본 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.

## 13. ChatGPT 확인 대기

- 다음 단계는 **Codex Cycle 2G Patch Review**이며, 착수 여부는 ChatGPT/사용자 확인 후 진행한다.
