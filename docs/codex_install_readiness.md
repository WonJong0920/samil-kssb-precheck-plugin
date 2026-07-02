# Codex Install Readiness (로컬/Repo Marketplace)

> **범위**: 이 문서는 이 repo를 Codex의 **로컬/Repo marketplace**로 추가해 플러그인 설치 탐색을 검증하기 위한
> 파일 기반 readiness를 정리한다. **Public Plugin Directory 등록이나 공개 배포가 아니다.** 실제 Codex app/CLI 설치
> 화면(GUI)에서의 확인은 **별도 단계**이며 이 문서는 그 전 단계의 파일 정합성만 다룬다.
>
> **현재 상태**: **파일 기반 install readiness는 완료**(아래 정합성 규칙·수동 확인 절차 통과). 그러나 실제 Codex app/CLI에서의
> 설치 성공은 **아직 확인되지 않았다** — 이는 사용자의 로컬 Codex 상태를 바꿀 수 있어 **사용자가 직접 수행**한다.
> 이 문서는 실제 설치 성공을 **주장하지 않는다.** 사용자 직접 검증 절차는 `docs/codex_install_verification.md`,
> 결과 기록 양식은 `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`를 사용한다.

## 위치·경로 요약

| 항목 | 값 | 비고 |
|---|---|---|
| Repo marketplace | `.agents/plugins/marketplace.json` | repo root의 `.agents/plugins/` (marketplace root = repo root) |
| Plugin root | `src/` | plugin manifest·skills가 있는 폴더 |
| Plugin manifest | `src/.codex-plugin/plugin.json` | plugin root의 `.codex-plugin/plugin.json` |
| `source.path` (marketplace entry) | `./src` | marketplace root(repo root) 기준 상대경로 → plugin root |
| Skills path (manifest) | `./skills/` → `src/skills/` | plugin root 기준. `src/skills/samil-kssb-precheck/` |

## 정합성 규칙

- **plugin manifest 위치**: plugin root의 `.codex-plugin/plugin.json`에 둔다(현재 `src/.codex-plugin/plugin.json`). ✔
- **plugin root 기준 배치**: `skills/`는 plugin root 기준(`src/skills/`)에 있다. `hooks`/`.mcp.json`/`.app.json`/`assets`는 **추가하지 않았다**(현 범위 밖).
- **marketplace `source.path`**: plugin root가 repo root가 아니라 `src/`이므로, marketplace entry의 `source.path`는 `./src`로 plugin root를 정확히 가리킨다.
- **name 정합**: marketplace `plugins[].name` = `samil-kssb-precheck` = plugin manifest `name`.
- **interface metadata**: install surface에 보이는 이름·설명은 manifest `interface`(displayName/shortDescription/longDescription/developerName/category)와 marketplace `interface.displayName`가 제어한다. 제품 경계(삼일 비공식·감사/인증/준수 대체 아님)를 문구에 유지한다.
- **policy**: `installation: AVAILABLE`, `authentication: ON_INSTALL`. marketplace schema의 `authentication` 허용값은
  `ON_INSTALL`·`ON_USE`뿐이며 기본값은 `ON_INSTALL`이다. 이 플러그인은 Skill-only이며 실제 외부 인증(MCP/hook/토큰)이 없지만,
  schema 허용값을 따라 보수적 기본값 `ON_INSTALL`을 사용한다(실제 자격증명 요구를 추가하지 않는다).

## Local/Repo marketplace vs Public Plugin Directory

- **Local/Repo marketplace(이번 범위)**: 이 repo를 로컬/repo marketplace로 추가해 Codex가 플러그인을 **탐색·설치**할 수 있는지 파일 수준에서 준비한다. 공개 등록이 아니다.
- **Public Plugin Directory(범위 밖)**: 공개 디렉터리 등록·공개 배포는 하지 않는다. 이 문서·manifest·marketplace 어디에도 공개 등록 완료를 주장하지 않는다.

## 수동 확인 절차 (파일 기반)

```
python -m json.tool .agents/plugins/marketplace.json
python -m json.tool src/.codex-plugin/plugin.json
```

- marketplace `plugins[].name`과 manifest `name`이 `samil-kssb-precheck`로 일치하는지 확인.
- `source.path`(`./src`) 아래에 `.codex-plugin/plugin.json`과 `skills/`가 존재하는지 확인.
- manifest `skills`(`./skills/`)가 plugin root 기준 실제 `src/skills/samil-kssb-precheck/`로 해석되는지 확인.

## 아직 하지 않은 것 (사용자 직접 검증 단계)

- 실제 Codex app/CLI plugin browser에서의 **설치·활성화·사용 확인**은 이 문서 범위 밖이며, **사용자가 직접 수행**한다
  (Claude Code는 사용자의 Codex 설정·plugin enabled 상태를 조작하지 않는다). 절차: `docs/codex_install_verification.md`,
  결과 기록: `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`.
- `authentication: ON_INSTALL`은 Cycle 2G Patch에서 schema 허용값에 맞춘 값이며, **실제 외부 자격증명 요구를 추가한 것이 아니다.**
- Public Plugin Directory 등록·공개 배포, assets/logo/screenshots, Hook/MCP/apps 추가는 하지 않았다.
- 제출 패키징에서 marketplace 파일·install verification evidence 취급은 `docs/submission_packaging_policy.md` 참조.
