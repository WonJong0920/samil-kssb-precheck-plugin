# Codex Install Verification Evidence

> **이 문서는 양식(template)이다.** 복사해서 채운다. 절차는 `docs/codex_install_verification.md` 참조.
>
> **민감정보 금지**: 로컬 절대경로(홈 디렉터리·드라이브 경로), 사용자명·계정 식별정보·이메일, API 키·토큰·자격증명,
> 개인 파일 경로를 이 문서에 **기록하지 말 것**. 오류 메시지에 그런 정보가 포함되면 해당 부분을 `[REDACTED]`로 치환한다.
> 실제 Codex 설치/활성화는 사용자가 직접 수행하며, 이 양식은 그 결과 기록용이다.

## 1. 확인 개요
- 확인 일시:
- 확인자:
- 확인 방식: CLI / App GUI / 둘 다
- OS:
- repo branch:
- repo commit SHA:
- Codex app/CLI 버전(확인 가능 시):

## 2. 사전 파일 상태
- marketplace path: `.agents/plugins/marketplace.json`
- marketplace source.path: `./src`
- plugin manifest path: `src/.codex-plugin/plugin.json`
- Skill path: `src/skills/samil-kssb-precheck/`
- marketplace JSON 문법 확인: (예: `python -m json.tool .agents/plugins/marketplace.json` → OK/실패)
- manifest JSON 문법 확인: (예: `python -m json.tool src/.codex-plugin/plugin.json` → OK/실패)
- name 정합(marketplace `plugins[].name` == manifest `name` == `samil-kssb-precheck`):
- policy 확인(`installation: AVAILABLE`, `authentication: ON_INSTALL`):

## 3. Codex CLI 확인 결과
- repo root에서 실행 여부:
- plugin/marketplace 인터페이스 접근 가능 여부:
- marketplace 표시 여부:
- plugin 표시 여부:
- plugin detail 열림 여부:
- install/enable 성공 여부:
- enabled 상태 확인:
- 오류 메시지: (원문, 민감정보는 `[REDACTED]`)

## 4. Codex App GUI 확인 결과
- Plugins 화면 접근 가능 여부:
- marketplace/source 표시 여부:
- plugin 표시 여부:
- plugin detail 열림 여부:
- install/enable 성공 여부:
- enabled 상태 확인:
- 오류 메시지: (원문, 민감정보는 `[REDACTED]`)

## 5. 새 thread 사용 요청 결과
- 테스트 요청 문장:
- Skill 또는 plugin이 사용된 정황:
- 출력 요약:
- 오류 메시지: (원문, 민감정보는 `[REDACTED]`)

## 6. 외부 상태 변경
- Codex 설정 변경 여부:
- plugin installed/enabled 상태 변경 여부:
- 원복 수행 여부:
- 원복 필요 여부:

## 7. 판정
- PASS / PARTIAL / FAIL:
- 차단 이슈:
- 후속 조치:
