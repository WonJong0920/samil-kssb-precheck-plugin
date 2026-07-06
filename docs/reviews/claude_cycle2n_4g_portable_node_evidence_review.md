# Claude Cycle 2N-4G Portable Node Real-download Evidence Review

> **성격**: 이 문서는 **Claude Code 리뷰**다(Codex 리뷰 아님 — 사용자 지시에 따른 evidence sanity review).
> 2N-4G evidence가 실제 변경 파일·실행 로그·hash 기록·runner/nethook 관측·repo 오염 경계와 모순 없는지 검토한다.
> 이 리뷰에서 코드 수정·새 다운로드·설치는 수행하지 않았다.

## Verdict

**PASS** (nonblocking follow-up 있음)

2N-4G evidence는 실제 repo 변경·로컬 실물 artifact·재실행 테스트와 모두 정합한다. 5개 지점의 hash 값이 동일하고
(evidence expected/observed·SHASUMS row·ps1 상수·테스트 상수), 원격 출처는 공식 URL로 한정되어 있으며,
이 리뷰가 로컬에서 독립적으로 실측한 portable 런타임 상태(버전·npm·마커·prep 로그)가 evidence 기록과 일치한다.
과장 선언은 발견되지 않았다. Critical/Major 없음 — Minor 1건(테스트 중복)과 Observation 3건은 비차단이다.

## Reviewed HEAD

- reviewed HEAD: `f7b7b5359e1c6e5ed01bb9af5050cb844c8cada5` (pull 후 일치, working tree clean)
- previous HEAD: `c2a3f979f926e01dfc293fe42ca9c04defd3d1da`

## Actual changed files (c2a3f97..f7b7b53)

`docs/samples/codex_cycle2n_4g_portable_node_real_download_evidence.md`(신규),
`src/intake/runners/prepare_portable_node.ps1`(pin 상수 기록 + 주석 2곳 — diff로 확인, 로직 무변경),
`tests/test_portable_node_bootstrap.test.cjs`(2N-4G 상수 검증 테스트 추가 + 구 "pin 미기록 fail-closed" 테스트를
override-거부 변형으로 대체), `tests/test_hwp_assisted_runner_node.test.cjs`(parity 테스트의 상수 단언을
빈 값→기록 값으로 갱신 — 5줄), `src/intake/runners/README.md`(상수 기록 문구), `docs/current_status.md`,
`docs/decision_log.md`. **evidence 문서의 주장 범위와 실제 diff가 일치한다.** 금지 표면
(core/ingest/schema/validator/renderer/delivery/Skill/manifest/nethook/Python runner) 무변경 확인.

## Evidence consistency assessment

| evidence 주장 | 이 리뷰의 확인 방법 | 결과 |
|---|---|---|
| repo-pinned 상수 기록 | ps1 diff·현행 소스 확인 | 일치(`edaca9bd…cd56`) |
| 공식 SHASUMS row = observed zip hash | evidence 본문 대조 | 동일 값 |
| bootstrap exit 0·위치·버전 | **로컬 실물 실측**(아래) | 일치 |
| prep log started→ok(official source) | 로컬 `prep_egress_log.jsonl` 직접 확인 | `started 12:48:38Z → ok 12:50:30Z`, source=`https://nodejs.org/dist/v24.16.0/`, provider=nodejs-portable |
| approvals runtime marker | 로컬 `approvals.json` 직접 확인 | `node@v24.16.0-win-x64: 2026-07-06T12:48:38Z`(prep started와 시각 정합), 기존 kordoc install marker 무손상 |
| 테스트 12/12·39/39·Python 49/29 | **재실행** | 전부 재현(green) |

## Hash / source / provenance assessment

- **hash 5중 일치**: evidence expected = evidence observed = SHASUMS256.txt row = `$PINNED_ZIP_SHA256_CONST` =
  테스트 상수(`REAL_NODE_WIN_X64_SHA256`) — 전부 `edaca9bd58ec8e92037dac4e877d52f6b8f430b81c18b57e264b4e2fb111cd56`.
- **공식 출처 한정 유지**: ps1의 원격 게이트(`$officialRoot = https://nodejs.org/dist/v<pin>` 정확 일치·비공식 fail-fast·
  원격 `-PinnedZipSha256` 거부)는 2N-4F-A 상태 그대로이며(diff에 로직 변경 없음), evidence의 실행 출처도 공식 URL이다.
- **한계(기록)**: 이 리뷰는 새 다운로드 금지 지시에 따라 nodejs.org의 SHASUMS를 **독립 재관측하지 않았다** —
  기록 값의 외부 정합성은 Codex의 1회 관측에 의존한다. 다만 로컬에 남은 실물 런타임의 `node.exe --version` 실측이
  pin과 일치하므로, 잘못된 바이너리가 배치되었을 가능성은 실질적으로 낮다고 판단한다.

## Runner / nethook assessment

- **runner detection**: `detectNode(()=>null, <TOOL_CACHE>)`로 시스템 탐지를 억제한 방법은 타당하다 — 이 조건에서
  `source=portable`이 나오려면 2N-4F-A 게이트(실측 `node.exe --version === v24.16.0`)를 실제로 통과해야 한다.
  이 리뷰의 로컬 실측(`v24.16.0`·`npm.cmd --version=11.13.0`)이 이를 재확인했다.
- **nethook 구분**: clean run(`observedTotal=0 egressAttempts=0`) vs control run(`observedTotal=1 egressAttempts=1`,
  `dns.lookup example.com` 기록)의 쌍은 Gate A/D 계열의 control 방법론과 동일 구조로, "훅이 활성 상태였고 관측
  능력이 있었다"를 증명해 no-egress 주장을 적절히 뒷받침한다. control의 차단은 원본 호출 전 throw이므로 외부
  트래픽을 만들지 않는다(기존 nethook 설계와 정합).

## Log sufficiency / redaction assessment

- **충분성**: exit code·zip 크기·SHASUMS row 원문·버전 실측·prep 로그 subset·마커·테스트 수치까지 —
  재검증에 필요한 수준을 갖췄다. 부족하지 않다.
- **redaction**: `<USER_HOME>/<TOOL_CACHE>/<TEMP*>` 일반화가 일관 적용됐고, 원시 로컬 절대경로·계정명 노출은
  발견하지 못했다. 과다 노출 없음.

## Repo contamination assessment

- 이 리뷰의 재스캔: tracked 파일 중 package/lock/node_modules/tool-cache/생성 artifact/zip·exe·msi/submission.zip
  **0건**, `git diff --check` clean, working tree clean. evidence의 스캔 주장과 일치.
- 런타임 실물은 repo 밖 tool-cache에만 존재함을 확인(경로·내용 실측).

## Findings

### Critical
없음.

### Major
없음.

### Minor

**ID:** CLD2N4G-MIN-01
**Location:** `tests/test_portable_node_bootstrap.test.cjs:81`, `:101`
**Issue:** "공식 원격 + `-PinnedZipSha256` override → exit 7" 테스트가 **동일 시나리오로 2개 중복**된다
(구 "pin 미기록 fail-closed" 테스트를 override-거부 변형으로 대체하면서 2N-4F-A의 기존 동일 테스트와 겹침).
**Impact:** 기능 결함 아님 — 중복 실행 비용과 유지보수 혼동만. 구 테스트의 시나리오(상수 빈 값)는 상수 기록으로
영구히 소멸된 상태라 대체 자체는 타당하다.
**Recommendation:** 다음 테스트 파일 수정 시 1개로 dedupe(비차단).
**Blocking:** No.

### Observations

**ID:** CLD2N4G-OBS-01 — control run 출력의 `blocked-code=undefined`는 nethook 차단 오류 객체에 `code` 속성이
없어서다(코스메틱). egressAttempts/log 기록이 실질 증거라 영향 없음. 향후 hardening 시 오류 code 부여 고려(비차단).

**ID:** CLD2N4G-OBS-02 — pin 상수가 기록된 현재, `-ApproveRuntime` 단독 호출은 **실 다운로드를 수행하는 상태**가
됐다(설계된 동작). mock 테스트 suite에는 "공식 원격 + override 없음 + 승인" 케이스가 의도적으로 없어 네트워크가
발생하지 않음을 확인했다 — 향후 테스트 추가 시 이 케이스를 넣지 않도록 suite 주석에 명시해 두면 안전하다(비차단).

**ID:** CLD2N4G-OBS-03 — intentional failure는 pinned-hash-mismatch 분기만 라이브로 실증됐고, SHASUMS 불일치·파싱
실패·해제 실패 분기는 mock suite(12/12)로 커버된다. 조합으로 충분하다고 판단하나, 라이브 실증 범위가 1개 분기라는
사실은 기록해 둔다(비차단).

**잔여 미검증 항목(다음 단계 재료 — 결함 아님)**: portable `npm.cmd`로의 **실제 Kordoc 설치 성립**은 이번 evidence
범위에서 수행되지 않았다(`npm install` 금지 준수 — 버전 확인까지만). C2N4E-OBS-03의 "bundled npm.cmd가 실제로
사용됨" 절반이 남아 있다.

## Required fixes before B안 채택 판단 / 2N-4H

**없음(차단 기준).** MIN-01 dedupe는 다음 테스트 파일 수정에 얹으면 된다.

## 다음 단계 추천

1. **B안 채택 판단(사용자/ChatGPT)**: 이 evidence로 판단 재료는 충족됐다고 본다 — 채택 선언은 이 리뷰가 하지 않는다.
2. 채택 시 선택적 **2N-4H(좁은 잔여 evidence)**: 사용자 승인 하 portable `npm.cmd`로 Kordoc tool-cache 설치 1회 성립
   확인(+ 그 위에서 runner mock run) — C2N4E-OBS-03 완결. 없이 채택해도 위험은 낮다(시스템 npm.cmd와 동일 배포물).
3. **2N-5 직접 진행은 여전히 불가 판단 유지** — B안은 Node 부재 커버리지이며, ingest/core Python 실행 트랙(S0/S2
   결정)은 별개다(기존 판단 불변).
