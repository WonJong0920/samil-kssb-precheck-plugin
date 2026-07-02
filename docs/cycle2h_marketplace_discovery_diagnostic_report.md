# Cycle 2H Marketplace Discovery 진단 보고서

## 1. 진단 개요

- **문제 요약**: 사용자가 Codex app/CLI에서 **Samil KSSB Precheck Plugin**(`samil-kssb-precheck`)을 확인하지 못하고, 이전 파이썬 기반
  local plugin(`Local KSSB Plugins / local-kssb-plugins`, 엔진: `kssb-evidence-gap-auditor`)만 보이는 상태다.
- **이번 작업의 성격**: **수정이 아니라 원인 탐색과 진단**이다. 파일/설정을 바꾸지 않는다.
- **실제 Codex install/enable 미수행**: 이번 작업에서 Codex app/CLI의 install/enable/marketplace add 등 상태 변경 명령은 **수행하지 않았다**.
  읽기 전용 확인만 수행했다. 최종 판정(PASS/FAIL)은 하지 않는다(이후 Codex Review).

## 2. 현재 관찰된 사용자 보고 (입력 사실)

- Codex app/CLI에서 현재 플러그인(`samil-kssb-precheck` / Samil KSSB Precheck Plugin)이 보이지 않는다.
- 기존 `local-kssb-plugins` / `kssb-evidence-gap-auditor`(이전 파이썬 기반 엔진)만 보인다.
- 사용자가 "작업 폴더에 `.agents/plugins/marketplace.json` 파일이 없다"고 보고했다.
- 현재 repo의 대상 plugin은 `samil-kssb-precheck` / 표시명 **Samil KSSB Precheck Plugin**이다.

## 3. 로컬 repo 위치 확인 (Claude Code 작업 폴더 기준)

> 로컬 절대경로·사용자명은 기록하지 않는다. 폴더명·yes/no만 기록한다.

- 현재 branch: `main`.
- 현재 HEAD short SHA: `749ecba`.
- HEAD가 `origin/main`에 포함됨: **yes**(로컬이 GitHub main과 동기화됨).
- working tree clean 여부: **yes**(추적 변경 없음).
- Claude Code 작업 폴더가 repo root인지: **yes**(폴더명 `Samil KSSB Precheck Plugin`, `git rev-parse --show-toplevel` basename과 일치).

**중요 구분**: 위는 **Claude Code가 작업 중인 폴더(=이 GitHub repo 클론)** 기준이다. 사용자가 "파일이 없다"고 본 폴더가
이 폴더와 **동일한지 아직 확인되지 않았다**(§7 원인 후보 참조).

## 4. marketplace 파일 존재 확인 (Claude Code 작업 폴더)

- `.agents/` 디렉터리: **존재**.
- `.agents/plugins/` 디렉터리: **존재**.
- `.agents/plugins/marketplace.json`: **존재하며 git 추적됨**.
- JSON 문법(`python -m json.tool`): **OK**.
- 핵심 값(정합):
  - `interface.displayName` = `Samil KSSB Precheck Plugin — Local/Repo Marketplace`
  - `plugins[0].name` = `samil-kssb-precheck`
  - `source.path` = `./src`
  - `policy.installation` = `AVAILABLE`
  - `policy.authentication` = `ON_INSTALL`

즉 **이 repo 폴더에는 marketplace 파일이 정상적으로 존재하고 GitHub 기준과 정합한다.** 사용자가 "없다"고 본 것은
**다른 폴더이거나 미동기화 상태**일 가능성이 크다(§7).

## 5. manifest / Skill path 확인 (Claude Code 작업 폴더)

- `src/.codex-plugin/plugin.json`: **존재**, JSON 문법 **OK**.
  - `name` = `samil-kssb-precheck`
  - `interface.displayName` = `Samil KSSB Precheck Plugin`
  - `skills` = `./skills/`
- plugin root `src/`: 존재. `src/skills/`: 존재.
- `src/skills/samil-kssb-precheck/SKILL.md`: **존재**.

manifest·plugin root·Skill path는 모두 존재하고 정합한다.

## 6. Codex marketplace list 확인

- `codex` CLI 실행 여부: **실패 — Claude Code 환경 PATH에 `codex`가 없음**(`command not found`). 따라서 `codex plugin marketplace list`를
  이 환경에서 실행할 수 없었다.
- 성공/실패: 실패(환경 제약). 오류: `codex: command not found`(민감정보 없음).
- 확인된 marketplace/plugin 목록: **이 환경에서는 확인 불가** — Codex 목록 확인은 **사용자 직접 실행**이 필요하다.
- 현재 repo marketplace가 Codex 목록에 있는지 / 이전 `kssb-evidence-gap-auditor`만 보이는지: **이 환경에서 판단 불가**(사용자 직접 `codex plugin marketplace list`로 확인).

## 7. 원인 후보 정리 (우선순위)

이 repo 폴더의 파일은 정상·정합·동기화됨을 확인했으므로, 원인은 **repo 파일 문제가 아니라 Codex가 보는 대상/등록 상태**일 가능성이 높다.

- **1순위 — 현재 repo가 Codex marketplace source로 등록되지 않음**: Codex에는 이전에 추가된 old marketplace(`kssb-evidence-gap-auditor`)만
  등록되어 있고, 현재 repo(`.agents/plugins/marketplace.json`)를 marketplace source로 **add 하지 않았을** 가능성. → 그래서 old plugin만 보임.
- **2순위 — 사용자의 Codex 작업 폴더/클론이 이 repo 폴더와 다름(또는 최신 main 미반영)**: 사용자가 "marketplace.json 없다"고 본 폴더가
  이 repo 클론이 아니거나, 다른 위치의 오래된 클론이라 파일이 없을 가능성.
- **3순위 — 숨김 폴더 표시 문제**: `.agents`는 dot-folder라 파일 탐색기 기본 설정에서 보이지 않아 "없다"고 오인했을 가능성(단, git 추적상 존재).
- **4순위 — Codex discovery 캐시 / 재시작 필요**: marketplace를 add했더라도 Codex app/CLI 재시작 전에는 목록에 반영되지 않았을 가능성.
- **5순위(배제 경향) — 이 repo의 marketplace/manifest 파일 자체 문제**: §4·§5에서 파일 존재·문법·정합을 확인해 **가능성 낮음**.

## 8. 사용자 직접 후속 조치 제안 (Claude Code는 실행하지 않음)

> 아래는 **사용자가 직접** 수행할 후보다. Claude Code는 안내만 하며 실행하지 않는다. 외부 상태 변경·marketplace add·install/enable은 사용자 판단.

### (a) 먼저 "어느 폴더인지" 확정
- Codex를 실행/연결한 폴더가 이 repo 클론인지 확인한다. 그 폴더에서:
  ```
  git rev-parse --show-toplevel      # 이 repo 클론인지 폴더 확인
  git branch --show-current          # main 인지
  git pull origin main               # 최신 main 반영
  ```
  PowerShell 파일 확인(숨김 폴더도 인식):
  ```
  Test-Path .agents\plugins\marketplace.json
  Test-Path src\.codex-plugin\plugin.json
  ```
  - `Test-Path`가 `True`인데 탐색기에서 안 보이면 **숨김 폴더 표시 문제**(3순위)일 뿐이다.

### (b) local에는 파일이 있으나 Codex 목록에 없음 → 현재 repo를 marketplace로 add
- repo root에서(사용자 직접):
  ```
  codex plugin marketplace add .
  ```
  또는 GitHub 기준:
  ```
  codex plugin marketplace add WonJong0920/samil-kssb-precheck-plugin --ref main
  ```
  그 후:
  ```
  codex plugin marketplace list
  ```
  그리고 **Codex app/CLI 완전 재시작**(4순위 대응).
  > 정확한 서브커맨드·플래그는 Codex 버전에 따라 다를 수 있으니 공식 문서를 우선한다.

### (c) Codex가 이전 local marketplace만 보는 경우
- 현재 repo root를 marketplace로 add하고, 목록에서 표시명이 **Samil KSSB Precheck Plugin — Local/Repo Marketplace** / plugin **Samil KSSB Precheck Plugin**으로
  구분되는지 확인한다.
- 이전 `kssb-evidence-gap-auditor` marketplace의 삭제/정리는 **사용자 판단 후 별도 수행**(이번 진단 범위 밖, Claude Code는 손대지 않음).

### (d) 검증 결과 기록
- 확인 결과는 `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`로 기록한다(로컬 절대경로·계정 식별정보·토큰은 `[REDACTED]`).

## 9. 이번 작업에서 수행하지 않은 것

- 파일 수정 없음(marketplace/manifest/문서 기능값 무변경 — 이 진단 보고서만 추가).
- marketplace 등록(add) 없음.
- install/enable/uninstall/disable 없음.
- Codex app 설정 변경 없음.
- 이전 파이썬 기반 plugin/marketplace 삭제·수정 없음.
- PASS/FAIL 판정 없음.

## 10. 다음 단계 (분기)

- **A. local marketplace 파일 없음** → 올바른 repo root 확인 + `git pull origin main` 후 `Test-Path .agents\plugins\marketplace.json`. *(사용자 폴더가 이 repo 클론이 아닐 때)*
- **B. local marketplace 파일 있음, Codex 목록에 없음** → 사용자 직접 `codex plugin marketplace add .`(또는 GitHub ref) → `list` → Codex 재시작. **← 현재 증거상 가장 유력(1순위)**
- **C. Codex 목록에 marketplace 있음, plugin만 안 보임** → `source.path`(`./src`)/plugin root 진단.
- **D. plugin 보임, install 실패** → manifest/policy/detail 오류 진단.
- **E. install 성공, Skill 미작동** → Skill activation/use prompt 진단.

현재 진단 기준: 이 repo 폴더는 정상·동기화 상태이므로, 분기는 **B(등록 안 됨)** 또는 **A(사용자 폴더 불일치/미동기화)**일 가능성이 높다.
확정은 사용자가 자신의 Codex 연결 폴더에서 §8(a)·(b)를 수행한 결과로 판단한다.

## 11. ChatGPT 확인 대기

- 다음 판단은 ChatGPT/사용자가 GitHub 문서(이 진단 보고서 포함)를 확인한 뒤 수행한다.
- 실제 marketplace add·install·discovery 확인은 **사용자 직접 검증 항목**이며, 결과는 evidence template로 기록한다.
