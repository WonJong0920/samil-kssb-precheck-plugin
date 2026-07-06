# Cycle 2N-4E — Portable Node B안 실행 계획 (Node 부재 일반 사용자 fallback)

> **성격**: **계획 문서만**(코드·다운로드·설치·hash 검증 실행·Kordoc 재설치·npm install 없음. 구현은 Codex 리뷰 이후 별도 사이클).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 설계 원천: 2N-0B-A §7.1 B안(D76 — **C안(OS installer/PATH 영구
> 수정) 배제 확정 불변**), 2N-1A U2(A안 확정+B gated, D77), 2N-4C 전략 계획(S1 트랙), P0/P0-B probe, 2N-4D/-A Node runner(PASS).
> **이 문서는 B안 채택 확정이 아니다** — 채택은 사용자 결정(§9), 구현·실측은 각각 Codex 리뷰를 거친다.

## 1. 전제와 위치 (이 계획이 푸는 문제)

- **문제**: 일반 사용자 Windows 머신에는 Node가 기본 탑재가 아니다. 시스템 Node가 없으면 HWP-계열 assisted path
  (Node runner + Kordoc)가 전부 불가하고, 현재 동작은 A안(설치 안내 + 기본 텍스트 검토 계속)뿐이다.
- **근거 사실**: P0/P0-B로 Codex 세션에서 ① PATH 밖 **절대 경로 실행 가능**, ② 시스템 Node v24 가용(이 머신),
  ③ bare npm은 npm.ps1 정책 차단(npm.cmd 필요)이 실측됐다. 2N-4D/-A로 Node runner가 구현·PASS 상태다.
- **경계 유지**: 이 계획은 **Node 부재 사용자 커버리지**용이다. ingest/core의 Python 실행 문제(S0/S2 트랙)와 독립이며,
  B안이 되어도 **E2E의 ingest 합류·보고서 생성은 여전히 Python 필요**(2N-5 unblock 아님 — no-overclaim 불변).

## 2. 시스템 Node 우선 사용 (질문 1)

**탐지 우선순위(고정)**:
1. **시스템 Node/npm** — 현행 runner의 `which()`(PATH+PATHEXT — npm은 npm.cmd 자연 선택·npm.ps1 배제) 결과가 있으면
   그대로 사용. **설치 제안을 하지 않는다**(§7.1-1 계승). 버전 게이트는 v1에서 도입하지 않음(현행 계약 유지 —
   상이 major 관측 시 AVR-07 재검증 원칙만 문서 유지).
2. **tool-cache portable Node(기설치분)** — `<tool-cache>/node@v<pin>-win-x64/node.exe` 존재+`--version`=pin 일치 시
   그 **절대 경로**를 사용(승인 대화 재표시 없음 — 설치 승인은 도구·버전당 1회, U3).
3. 둘 다 없으면 → **B안 승인 안내**(§3). 거부·실패는 전부 **A안 수렴**(§8).

## 3. 승인 UX (질문 2)

기존 U3/U5 패턴을 그대로 확장한다(한국어, 승인 대화에는 도구명 명시):

- **고지 항목(§7.1-5 + 기존 Kordoc 문구 패턴)**: 설치 대상(Node.js 실행 환경 v<pin>), 출처(nodejs.org/dist 공식 zip —
  고정 URL), 용량(다운로드 약 30MB / 해제 약 80MB), 설치 위치(tool-cache — 저장소 밖, **제거=폴더 삭제로 완결**),
  **SHA-256 무결성 검증 수행**, OS installer 미실행·시스템 PATH 영구 수정 없음·관리자 권한 불요,
  준비(다운로드) 단계에만 네트워크 발생·문서 분석 실행은 no-egress 훅 아래 수행, 거부해도 기본 텍스트 검토 계속.
- **승인 단위**: 도구·버전당 1회(U3). marker는 `approvals.json`에 신규 kind(예: `"runtime": {"node@v<pin>": ts}`)로 기록,
  다운로드·검증·해제의 시작/성공/실패는 `prep_egress_log.jsonl`에 기록(내부 전용 — 사용자 보고서 전이 금지).
- **부트스트랩 순서(닭-달걀 해소)**: Node가 전혀 없는 환경에서는 Node runner(.cjs) 자체가 실행 불가하므로,
  준비는 **Windows 내장 PowerShell**로 수행한다 — source-only 스크립트(구현 사이클에서
  `src/intake/runners/prepare_portable_node.ps1` 신규) 또는 동일 내용의 문서화된 명령 절차. 호출 형태는
  `powershell.exe -NoProfile -ExecutionPolicy Bypass -File prepare_portable_node.ps1`(**Bypass는 해당 프로세스 1회에만
  적용 — 시스템 실행 정책 영구 변경 아님**, 이 사용에 대한 동의를 승인 문구에 포함). 준비 완료 후 runner는
  portable node 절대 경로로 실행된다: `<tool-cache>/node@.../node.exe src/intake/runners/hwp_assisted_runner.cjs ...`.

## 4. 배치 위치 (질문 3)

`<사용자 홈>/.samil-kssb-precheck/tools/node@v<pin>-win-x64/` — 기존 U1 tool-cache의 **버전 디렉터리** 규약
(§7.1 레이아웃 그대로). 드리프트는 경로 수준에서 감지(경로 불일치=미설치), 제거는 폴더 삭제로 완결.
repo 내부·npm global·시스템 디렉터리는 사용하지 않는다. **repo와 submission.zip에 portable Node 바이너리를 포함하지
않는다**(승인 다운로드 방식만 — 패키징 정책 §9-4 확인 항목).

## 5. 공식 zip / SHASUMS256 / hash 검증 (질문 4)

- **출처 고정**: `https://nodejs.org/dist/v<pin>/node-v<pin>-win-x64.zip` + 같은 디렉터리의 `SHASUMS256.txt`
  (다른 미러·리다이렉트 수용 금지).
- **이중 검증(둘 다 통과해야 해제)**:
  1. **repo-pinned hash(1차)**: 구현 사이클에서 pin 버전 zip의 SHA-256을 **최초 관측·기록**(traineddata 방식 —
     Gate D 정밀도 계승)해 스크립트 상수로 고정. `Get-FileHash -Algorithm SHA256` 결과와 대조.
  2. **SHASUMS256.txt 대조(2차)**: 다운로드한 SHASUMS256.txt에서 해당 zip 파일명 행의 hash를 파싱해 동일 값인지 재확인
     (repo-pin과 nodejs.org 공표값의 교차 — 어느 한쪽 불일치도 fail-fast).
- **불일치/파싱 실패 시**: 부분 다운로드 파일 삭제(정리) → prep_egress_log에 failed 기록 → 한국어 안내 → **A안 수렴**
  (해제 진행 절대 금지).
- **해제 후 자가 확인**: `node.exe --version` 실측 = `v<pin>` 일치 확인(불일치 시 폴더 정리 + A안).
- **pin 후보**: Gate D·2N-4·P0가 검증한 **v24 LTS 계열**(구현 시점의 v24 최신 LTS 관측 버전으로 확정 — §9 결정 항목).
  pin이 기검증 major와 다르면 **AVR-07 재검증**(nethook 테스트 + mock run을 portable node로 재실행) 필수.

## 6. OS installer / 관리자 권한 / PATH 영구 변경 없이 실행 (질문 5)

- **zip 압축 해제만**(`Expand-Archive`) — .msi/.exe installer 미실행, 레지스트리 무접촉.
- 설치 위치가 사용자 홈이므로 **관리자 권한 불요**.
- **시스템 PATH·사용자 PATH 영구 수정 없음** — 모든 호출은 **절대 경로**: runner 실행(`<...>/node.exe runner.cjs`),
  Kordoc 파싱(run 명령의 node), npm(`<...>/npm.cmd` — zip에 동봉, `--prefix` 설치 그대로 성립 §7.1).
  세션 한정 env 주입도 기본 미사용(절대 경로가 더 명시적).
- 제거 = `node@v<pin>-win-x64/` 폴더 삭제(고지 문구에 포함). C안(installer/PATH 영구 수정/관리자 권한)은 **배제 확정
  불변**(D76).

## 7. 기존 Node runner / Kordoc tool-cache / nethook 경계 연결 (질문 6)

- **runner 탐지 확장(구현 사이클)**: `detectNode()`를 §2 우선순위로 확장 — 반환 형태는 기존 `{node, npm}` 유지
  (portable 채택 시 두 값 모두 tool-cache 절대 경로). Node 전무 + 미승인 시 exit 4 유지하되 안내 문구에 B안 승인
  절차(bootstrap 명령)를 추가 표시. **exit code·플래그·승인 게이트 계약은 불변.**
- **Kordoc tool-cache(U1) 불변**: `kordoc@3.13.0+pdfjs-dist@4.10.38`, `--omit=optional`, `--prefix` — 설치 실행 파일만
  portable `npm.cmd` 절대 경로로 대체 가능(2N-4D-A의 resolved-npm 표시 원칙 그대로 — check 모드에도 절대 경로 표시).
- **nethook 불변**: run 명령은 이미 `node --require nethook.cjs` 구조 — node가 portable 절대 경로로 바뀔 뿐 훅 적용·
  `NETHOOK_MODE=block`·provenance 규칙(요약 실관측+egress 0에만 true, evidence 모드 통제 실패 exit 7)은 그대로다.
  portable node에서의 nethook 동작은 실측 evidence 사이클(§9 단계 2)에서 확인한다.

## 8. 실패 시 안전 fallback (질문 7)

**모든 실패는 A안(설치 안내 + 기본 텍스트 기반 검토 계속 + §7 커버리지 한계 문구)으로 수렴한다.** 실패가 보고서 품질
주장을 오염시키지 않도록 기존 §7 경로(확인 불가 → 질문 연결)를 그대로 쓴다.

| 실패 지점 | 처리 |
|---|---|
| 사용자 거부 | 정상 경로 — 안내 후 baseline 계속(기록 없음) |
| 다운로드 실패(네트워크) | prep log failed 기록 → 부분 파일 정리 → 안내 → A안 |
| hash 불일치(1차 repo-pin 또는 2차 SHASUMS) | **fail-fast** — 파일 삭제·해제 금지 → failed 기록 → 안내 → A안 |
| SHASUMS256.txt 파싱 실패 | 동일(fail-fast) |
| AV 차단(다운로드/해제/실행 시점) | 원인 유형 한국어 안내(§7.1-6) → 정리 가능 범위 정리 → A안 |
| Expand-Archive 실패 / 디스크 부족 | failed 기록 → 부분 폴더 정리 → A안 |
| 해제 후 node.exe 실행 불가/버전 불일치 | 폴더 정리 → failed 기록 → A안 |
| 이후 세션에서 portable 손상 감지 | 미설치로 간주(경로/버전 확인 실패) → B안 승인 안내부터 재시작 |

## 9. 2N-5 전 필요한 검증·Codex 리뷰 단계 (질문 8)

| 단계 | 내용 | 검증 | 리뷰 |
|---|---|---|---|
| **(가칭) 2N-4F 구현** | bootstrap ps1(다운로드·이중 hash 검증·해제·기록·정리) + runner 탐지 확장(§7) + README | **mock 전용 node:test**(실 다운로드 없음): 가짜 zip/가짜 SHASUMS fixture로 검증·불일치 fail-fast·정리 로직, 탐지 우선순위(시스템 우선·portable 차선), exit/문구 계약 불변 확인 + 기존 29종·Python 7종 green | Codex narrow review |
| **(가칭) 2N-4G 실측 evidence** | **사용자 승인 하 실 다운로드 1회** — 이중 hash 검증 성공 + **고의 불일치 케이스**(변조 기대값으로 실패 경로 실증) + portable node로 runner `--check`·mock run(**nethook 요약 관측** — AVR-07 해당 시 nethook 29종 재실행) + portable npm.cmd로 Kordoc 설치 성립 확인(승인 시) | evidence 문서(repo 밖 산출물·경로 일반화 표기) | Codex evidence review |
| 이후 | 2N-5 배치 판단 — 단 **B안 완료 ≠ 2N-5 unblock**(ingest/core Python 트랙의 S0/S2 결정 별도 필요) | — | 사용자/ChatGPT |

**사용자 결정 요청(구현 착수 전)**:
① **B안 최종 채택**(D76 유보 해소 — 이 계획대로 구현 승인), ② **pin 버전 확정**(v24 LTS 계열 권고 — 구현 시점 관측
버전), ③ bootstrap의 `-ExecutionPolicy Bypass`(프로세스 1회 한정) 사용 동의, ④ submission.zip에 portable Node
**미포함**(승인 다운로드 방식 유지) 확인, ⑤ Python runner(reference)에도 portable 탐지를 확장할지(후속 — 기본 미확장 권고).

## 10. 불변 경계 (이 계획으로 바뀌지 않는 것)

무승인 설치/실행 금지 · repo 밖 tool-cache만 · **OS installer/시스템 PATH 영구 수정/관리자 권한 금지(C안 배제 불변)** ·
준비 egress 기록↔실행 no-egress 분리 · provider명 3층 정책 · OCR/rasterizer/tesseract.js/traineddata gated ·
repo package.json/lock/node_modules 미생성 · 샘플·artifact·tool-cache·runtime 바이너리 미커밋 ·
core Python 제거/Node 이식 확정 아님 · 2N-5 unblock/L2 완료/OCR 지원/provider finalization 선언 없음.
