# Cycle 2H Patch 완료 보고 — Plugin Display Name Alignment

## 1. 작업 개요

현재 플러그인의 사용자-facing 공식 표시명을 **Samil KSSB Precheck Plugin**으로 선제 정렬하는 **naming consistency 보정** Patch다.
machine name과 discovery 구조·정책은 그대로 두고, display metadata와 관련 문서만 정렬했다. 기능 구현이 아니다.

## 2. 왜 display name patch가 필요한가

- 사용자 화면의 `Local KSSB Plugins / local-kssb-plugins` 항목은 **이전 파이썬 기반 local plugin**으로 확인되어, 현재 플러그인(`samil-kssb-precheck`)과
  **혼동 가능성**이 있다. 이 혼동 가능성을 줄이기 위해 현재 플러그인의 사용자-facing 표시명을 의도한 공식 이름으로 명확히 정렬한다.
- 이번 Patch는 **naming consistency 보정**이며, **Codex app/CLI discovery 문제를 해결하지 않는다.** 현재 대상 플러그인이 실제 app/CLI에
  표시·설치되는지는 **아직 미확인**이며, 실제 확인은 **별도 사용자 직접 검증 항목**으로 남긴다. **다음 별도 이슈는 marketplace registration/discovery 확인**이다.

## 3. 작성/수정한 파일

- `src/.codex-plugin/plugin.json` — `interface.displayName` 정렬.
- `.agents/plugins/marketplace.json` — `interface.displayName` 정렬.
- `docs/codex_install_verification.md` — 표시명 기대값·machine name 유지·축약 시 detail 확인 안내.
- `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md` — 표시명/ machine name 확인 항목 추가.
- `docs/current_status.md` — Cycle 2H Patch 섹션(정정 반영).
- `docs/decision_log.md` — D37.
- `docs/cycle2h_patch_plugin_display_name_completion_report.md` — 본 완료 보고.

## 4. 변경한 display metadata

- manifest `interface.displayName`: `"Samil KSSB Precheck (사전검토 보조)"` → **`"Samil KSSB Precheck Plugin"`**.
- marketplace `interface.displayName`: `"Samil KSSB Precheck — Local/Repo Marketplace"` → **`"Samil KSSB Precheck Plugin — Local/Repo Marketplace"`**.
- `shortDescription`/`longDescription`은 제품 경계(삼일 비공식·감사/인증/준수 대체 아님·컨설턴트 검수용 초안·AX 해커톤 제출용)를 유지하며 별도 문구 보정은 하지 않았다.

## 5. 변경하지 않은 machine / path / policy 값 (불변)

| 항목 | 값(불변) |
|---|---|
| manifest `name` | `samil-kssb-precheck` |
| marketplace `plugins[0].name` | `samil-kssb-precheck` |
| `source.path` | `./src` |
| manifest `skills` | `./skills/` |
| `policy.installation` | `AVAILABLE` |
| `policy.authentication` | `ON_INSTALL` |
| plugin root | `src/` |
| manifest path | `src/.codex-plugin/plugin.json` |
| Skill path | `src/skills/samil-kssb-precheck/` |

이 값들은 이전 Codex 리뷰(D33/D34)에서 정합 판정을 받은 값이며 이번 Patch에서 흔들지 않았다.

## 6. install verification 문서 보강 내용

- 위치·경로 요약 표에 사용자-facing 표시명 행(**Samil KSSB Precheck Plugin**) 추가, 표시명 vs machine name 구분 note 추가.
- CLI/GUI 절차·성공 기준에 표시명 기대값(표시명 **Samil KSSB Precheck Plugin**, machine name `samil-kssb-precheck` 유지)과 **목록에서 축약 시 detail 화면에서 full display name 확인** 안내 추가.
- local/repo marketplace vs Public Plugin Directory 구분은 그대로 유지. 실제 app/CLI 표시·설치 확인은 사용자 직접 검증 항목으로 유지.

## 7. evidence template 보강 내용

- §2 사전 파일 상태에 표시명 기대값(`interface.displayName` == Samil KSSB Precheck Plugin) 행 추가, name 정합 항목에 "machine name 유지" 명시.
- §3(CLI)·§4(GUI)에 plugin 표시명 확인(기대값 Samil KSSB Precheck Plugin; 축약 시 detail의 full display name 기록)·machine name(`samil-kssb-precheck`) 확인 항목 추가.

## 8. current_status / decision_log 갱신 내용

- current_status: 현재 Cycle을 2H(+Patch)로, Patch 성격을 "이전 파이썬 기반 local plugin 혼동 가능성 → 표시명 선제 정렬(naming consistency), discovery 미해결·실제 표시 미확인" 으로 기록.
- decision_log: D37(Plugin Display Name Alignment) 추가. machine/path/policy 불변, 다음 별도 이슈=marketplace registration/discovery 확인 명시.

## 9. 자체 점검 결과 (파일 깨짐 방지 수준)

- `python -m json.tool` — marketplace/manifest JSON 문법 OK.
- manifest `interface.displayName` == **Samil KSSB Precheck Plugin** 확인.
- marketplace `interface.displayName` == **Samil KSSB Precheck Plugin — Local/Repo Marketplace** 확인.
- machine name `samil-kssb-precheck` 유지, `source.path`=`./src`, `skills`=`./skills/`, `policy.installation`=`AVAILABLE`, `policy.authentication`=`ON_INSTALL` 유지 — 단언 통과.
- public Plugin Directory 등록 완료·실제 install 성공을 주장하는 표현 없음(문서는 "미확인·사용자 직접 검증"으로 유지).
- 금지 산출물(`.mcp.json`/`.app.json`/assets/logo/screenshots/hooks/submission.zip/PDF/생성 DOCX/HTML) 미추가.

> PASS/FAIL 판정은 하지 않는다. 독립 검증은 이후 Codex Review에서 수행한다(운영 원칙 `AGENTS.md`·`docs/operating_principles.md`).

## 10. 수행하지 않은 작업

- 실제 Codex app/CLI install/enable 및 discovery 확인 — 사용자 직접 검증 항목(미수행).
- machine name·구조·정책 변경, validator/renderer/schema/test 로직 수정 — 미수행.

## 11. 금지 작업 미수행 확인

- `name`·marketplace `plugins[0].name`·`source.path`·`skills`·`policy.installation`·`policy.authentication` 변경 — 미수행(불변 확인).
- plugin root 이동·Skill 디렉터리명 변경 — 미수행.
- validator/renderer/schema/test 로직 수정 — 미수행.
- Hook/MCP·`.mcp.json`·`.app.json`·assets/logo/screenshots 추가 — 미수행.
- submission.zip 생성·샘플 PDF 분석·OCR/문서 파싱 — 미수행.
- 실제 Codex app/CLI install/enable 수행 — 미수행.
- PASS/FAIL 판정·장문 채팅 보고 — 하지 않음.

## 12. 남은 보류사항

- **marketplace registration/discovery 확인**(현재 플러그인이 실제 app/CLI에 표시·설치되는지) — 다음 별도 이슈·사용자 직접 검증.
- 이전 파이썬 기반 local plugin(`local-kssb-plugins`)과의 구분·정리 필요 여부 — 후속 확인 대상.
- 실제 submission.zip 생성·샘플 실행·로그 원본 제출 방식 확정 — 제출/샘플 단계.

## 13. GitHub push 상태

- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- commit message: `docs: align plugin display name`
- 최종 commit SHA는 본 문서에 고정하지 않고 최종 채팅 보고에만 기재한다.

## 14. ChatGPT 확인 대기

- 다음 단계는 Codex Cycle 2H Patch Review이며, 실제 app/CLI discovery 검증은 **사용자 직접 수행 대기**다.
