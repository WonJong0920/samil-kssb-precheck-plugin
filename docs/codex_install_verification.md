# Codex Install Verification (사용자 직접 검증 절차)

> **성격**: 이 문서는 **사용자가 직접** Codex app 또는 CLI에서 이 플러그인의 marketplace 표시·plugin 설치/활성화·
> 새 thread 사용 요청을 확인하기 위한 절차 문서다. **Claude Code는 실제 Codex app/CLI 상태를 조작하지 않는다**
> (설치/활성화는 사용자의 로컬 Codex 설정·plugin enabled 상태·계정/앱 상태를 바꿀 수 있으므로 사용자 환경에 종속된다).
> 현재까지의 **파일 기반 install readiness**는 `docs/codex_install_readiness.md`에서 완료했고, 이 문서는 그 다음 단계인
> **실제 앱/CLI 확인**을 사용자가 직접 수행하도록 안내한다.

## 1. 목적

- 이 repo를 로컬/Repo marketplace로 추가했을 때 Codex가 플러그인을 **탐색·설치·활성화·사용**할 수 있는지 사용자가 직접 확인한다.
- 확인 결과(성공/부분/실패·오류 메시지)를 evidence template에 기록해 후속 판단·제출 판단에 사용한다.
- 이 문서는 실제 설치 성공을 **주장하지 않는다.** 실제 결과는 사용자 확인으로만 확정된다.

## 2. 현재 repo 구조 요약

| 항목 | 값 |
|---|---|
| Repo marketplace | `.agents/plugins/marketplace.json` (marketplace root = repo root) |
| Plugin root | `src/` |
| Plugin manifest | `src/.codex-plugin/plugin.json` (plugin root의 `.codex-plugin/plugin.json`, 필수 entry point) |
| Skill path | `./skills/` → `src/skills/samil-kssb-precheck/` (plugin root 기준) |
| marketplace `source.path` | `./src` (marketplace root 기준 상대경로 → plugin root) |
| marketplace `plugins[].name` / manifest `name` | `samil-kssb-precheck` (정합) |
| `policy` | `installation: AVAILABLE`, `authentication: ON_INSTALL` (schema 허용값; 실제 외부 자격증명 요구 아님) |

공식 문서 기준: 플러그인은 **plugin root** 기준으로 구성하고, plugin root 아래 `.codex-plugin/plugin.json`이 필수 entry point다.
repo marketplace는 `$REPO_ROOT/.agents/plugins/marketplace.json`에 두고, marketplace `source.path`는 marketplace root 기준 상대경로로 plugin folder를 가리킨다.
참고: https://developers.openai.com/codex/plugins , https://developers.openai.com/codex/plugins/build

## 3. Local/Repo marketplace vs Public Plugin Directory

- **Local/Repo marketplace(이번 검증 대상)**: 이 repo를 로컬/repo marketplace로 추가해 Codex가 플러그인을 탐색·설치할 수 있는지 확인한다. 공개 등록이 아니다.
- **Public Plugin Directory(범위 밖)**: 공개 디렉터리 등록·공개 배포는 하지 않는다. 이 검증은 공개 등록 완료를 확인하는 것이 아니다.

## 4. 실제 검증 전 준비사항

1. 최신 `main`을 pull하고 working tree가 clean인지 확인한다.
2. 파일 기반 사전 점검을 실행한다(아래 명령은 상태를 바꾸지 않는 읽기 전용 확인이다).
   ```
   python -m json.tool .agents/plugins/marketplace.json
   python -m json.tool src/.codex-plugin/plugin.json
   ```
   - marketplace `plugins[].name` == manifest `name` == `samil-kssb-precheck` 확인.
   - `source.path`(`./src`) 아래 `.codex-plugin/plugin.json`·`skills/` 존재 확인.
   - `policy.authentication` == `ON_INSTALL`, `policy.installation` == `AVAILABLE` 확인.
3. Codex app/CLI가 이 repo 루트를 인식할 수 있는 위치에서 실행하는지 확인한다.
4. **주의**: 아래 CLI/GUI 절차의 정확한 메뉴 이름·명령은 Codex 버전에 따라 다를 수 있다. 공식 문서를 우선하고,
   이 문서의 표현과 다르면 공식 문서를 따른다.

## 5. Codex CLI 검증 절차

> 명령·플래그는 Codex 버전에 따라 다를 수 있으니 공식 문서를 확인한다. 아래는 확인해야 할 **관점** 목록이다.

1. repo root에서 Codex CLI를 실행한다.
2. plugin/marketplace 탐색 인터페이스(예: plugin browser 또는 `/plugins` 계열)에 접근한다.
3. 이 repo의 repo/local marketplace가 표시되는지 확인한다.
4. `samil-kssb-precheck` plugin이 목록에 표시되는지 확인한다.
5. plugin detail(이름·설명·category 등 install surface metadata)이 열리는지 확인한다.
6. install 또는 enable을 수행한다(사용자 판단). 성공/실패와 오류 메시지를 기록한다.
7. enabled 상태가 반영되는지 확인한다.
8. 각 단계의 성공/실패·오류 메시지를 evidence template §3에 기록한다.

## 6. Codex App GUI 검증 절차

1. Codex app의 Plugins(또는 동등) 화면에 접근한다.
2. repo/local marketplace source가 표시되는지 확인한다.
3. `samil-kssb-precheck` plugin이 표시되는지 확인한다.
4. plugin detail이 열리고 install surface metadata(displayName/description/category)가 의도대로 보이는지 확인한다.
5. install 또는 enable을 수행한다. 성공/실패·오류 메시지를 기록한다.
6. enabled 상태를 확인한다.
7. 각 단계 결과를 evidence template §4에 기록한다.

## 7. 새 thread 사용 요청 절차

1. 새 thread(대화)를 연다.
2. 이 플러그인의 Skill을 유도할 요청을 한 문장으로 보낸다(예: KSSB 4대 영역 공시근거 사전검토 초안을 요청하는 문장).
3. Skill/plugin이 사용된 정황(스킬 호출·산출 구조)이 나타나는지 확인한다.
4. 출력 요약과 오류 메시지를 evidence template §5에 기록한다.

## 8. 성공 기준

- marketplace/source가 표시되고, `samil-kssb-precheck` plugin이 목록·detail에 표시된다.
- install/enable이 오류 없이 완료되고 enabled 상태가 반영된다.
- 새 thread 사용 요청에서 Skill/plugin이 사용되는 정황이 확인된다.
- 위가 모두 충족되면 PASS, 일부만 충족되면 PARTIAL, 표시/설치 자체가 실패하면 FAIL로 기록한다.

## 9. 실패 시 확인할 항목

- marketplace가 표시되지 않으면: `.agents/plugins/marketplace.json` 위치·JSON 문법·`source.path`(`./src`) 확인.
- plugin이 표시되지 않으면: `plugins[].name` ↔ manifest `name` 정합, plugin root(`src/`) 아래 `.codex-plugin/plugin.json`·`skills/` 존재 확인.
- install 실패 시: `policy.installation`(`AVAILABLE`)·`policy.authentication`(`ON_INSTALL`) 허용값, manifest 필수 필드 확인.
- 사용 요청이 Skill로 이어지지 않으면: manifest `skills`(`./skills/`) 경로와 `src/skills/samil-kssb-precheck/SKILL.md` 확인.
- 오류 메시지 전문을 evidence template에 그대로 기록한다(단, §11 민감정보 주의 준수).

## 10. 오류 메시지 / 외부 상태 변경 기록 방법

- 오류 메시지는 **원문 그대로** evidence template의 해당 오류 필드에 기록한다(요약·창작 금지). 단 민감정보는 제거한다(§11).
- Codex 설정·plugin installed/enabled 상태를 바꿨다면 evidence template §6에 변경 여부와 **원복 여부/필요성**을 기록한다.
- 검증 후 필요 시 install/enable을 원복(uninstall/disable)하고 그 결과도 기록한다.

## 11. 기록 시 주의 (민감정보 금지)

evidence 문서·오류 로그에 다음을 **기록하지 않는다**:
- 로컬 절대경로(예: 홈 디렉터리·드라이브 경로), 사용자명/계정 식별정보, 이메일.
- API 키·토큰·자격증명, 개인 파일 경로.
- 오류 메시지에 위 정보가 포함되면 해당 부분을 `[REDACTED]`로 치환한 뒤 기록한다.

## 12. 검증 결과를 repo에 반영하는 방법

1. `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`를 복사해 결과를 채운다.
2. 채운 evidence를 어디에 둘지는 `docs/submission_packaging_policy.md`의 기준(제출 단계 민감정보 스캔 후 repo 포함 vs zip-only 결정)을 따른다.
3. 실패/부분 성공이면 원인(파일/정책/경로)을 파악해 별도 Patch로 보정한 뒤 재검증한다.
4. evidence에 민감정보·로컬 경로·계정 식별정보가 없는지 다시 확인한 뒤에만 repo/zip에 포함한다.
