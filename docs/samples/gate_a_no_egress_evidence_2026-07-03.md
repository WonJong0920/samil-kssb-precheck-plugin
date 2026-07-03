# Gate A — Hard No-egress Rerun Evidence — 2026-07-03

> `docs/planning/cycle2i_3b_gateprep_execution_plan.md` §3(Gate A) 절차에 따라 **실제 수행**한 결과. 사용자 승인 하 **사용자 로컬 · repo 밖 임시 디렉터리**에서 실행.
> 로컬 경로·계정·회사명·파일명은 일반화(유형1/2)·`[REDACTED_LOCAL_PATH]`. raw log·PDF·변환 JSON/MD·`node_modules`·훅 스크립트·lock은 **repo 미커밋**.
> **OCR/formula/MCP/setup/model-check 미사용.** plugin core/schema/validator/renderer/delivery/manifest/marketplace/package 파일 **미변경**. 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`.

## 판정: **PASS** (범위: 프로세스(Node 런타임) 레벨 — §3 한계 참조)

Node 런타임 outbound를 **강제 차단(block)**한 상태에서 유형1·유형2 파싱이 **모두 성공**했고, 파싱 중 **outbound 연결 시도 0건**, 차단이 실제 작동함을 control로 입증, JSON·Markdown **결정성** 확인. OS/커널 방화벽 레벨 검증은 아니며, 민감 실데이터 운영 전 사용자 환경 OS 레벨 재확인을 비차단 보강 항목으로 남긴다.

## 1. 환경 (일반화)

- OS 종류: Windows / Node v24.16.0 / npm 11.x
- 실행 위치: repo 밖 임시 작업 디렉터리(`[REDACTED_LOCAL_PATH]`), 사용자 로컬
- **재설치 없음**: 검증 조합이 이미 설치된 상태를 사용 → **Gate A 수행 자체가 네트워크 불필요**(설치 단계 없음).

## 2. 검증된 버전 · 명령

- 패키지: **kordoc@3.8.2 + pdfjs-dist@4.10.38** (2I-3A 검증 조합).
- 실행 명령 형태: `node --require ./nethook.cjs node_modules/kordoc/dist/cli.js <유형N> --format json|markdown -o <out> --silent`
- **미사용(금지 준수)**: `--formula-ocr`, `setup`, `mcp`, `check-formula-models`.

## 3. 네트워크 차단 방식 + 범위/한계

- **방식**: Node 런타임 레벨 outbound 인터셉트 — preload(`--require`) 훅이 `dns.lookup`/`dns.resolve*`, `net.Socket.prototype.connect`, `tls.connect`,
  `http(s).request`/`get`를 패치. **block 모드 = 시도를 기록 후 예외 발생(패킷 미전송)**. Node의 `fetch`/undici도 최종적으로 `net.connect`를 거치므로 포함됨.
- **범위(정직한 한계)**: **프로세스(Node JS 런타임) 레벨** 차단이다.
  - **포함**: v1 텍스트 파싱 코드경로(kordoc + pdfjs, 순수 JS)의 모든 JS 네트워크 호출.
  - **미포함**: (a) native addon이 JS net 모듈을 우회한 raw syscall, (b) kordoc이 spawn하는 child process(텍스트 파싱 경로에서 미관측). v1은 native OCR/pdfium 미설치·미사용.
  - **보강 권장(비차단)**: OS/커널 방화벽 아웃바운드 차단 상태에서의 재확인은 사용자 환경에서 추가로 수행 가능(민감 실데이터 운영 전).

## 4. 차단 제어검증 (control)

| Control | 목적 | 방법 | 결과 |
|---|---|---|---|
| **C1** | 모니터가 연결 시도를 실제로 잡는가 | monitor 모드 + 의도적 `net.connect(127.0.0.1:9)`(loopback, 외부 egress 없음) | 훅이 기록 — `totalAttempts=1` → **시도 포착 확인** |
| **C2** | block이 실제 원격 연결을 막는가 | block 모드 + 의도적 `net.connect(8.8.8.8:53)`(알려진 원격) | 훅이 가로채 `NETHOOK_BLOCKED` throw(패킷 미전송) → **차단 실제 작동 확인** |

→ C1·C2로 "훅이 시도를 포착하고, block이 실제 원격 연결을 차단함"이 입증됨. 따라서 파싱 시 `totalAttempts=0`은 "훅 미작동"이 아니라 "kordoc이 outbound를 시도하지 않음"을 의미한다.

## 5. 파싱 결과 (block 모드, 각 유형 JSON·Markdown 2회)

| phase | 포맷 | exit | 파싱 중 outbound 시도 | 소요 |
|---|---|---|---|---|
| 유형1 run a | json | 0 | **totalAttempts=0** | ~3s |
| 유형1 run b | json | 0 | **0** | ~3s |
| 유형1 run a | markdown | 0 | **0** | ~3s |
| 유형1 run b | markdown | 0 | **0** | ~3s |
| 유형2 run a | json | 0 | **0** | 45s |
| 유형2 run b | json | 0 | **0** | 37s |
| 유형2 run a | markdown | 0 | **0** | 35s |
| 유형2 run b | markdown | 0 | **0** | 36s |

- 8/8 파싱 **성공(exit 0)**, 각 phase의 `[NETHOOK-SUMMARY] totalAttempts=0`. 파싱 구간 outbound 시도 라인 총 **0건**.
- 대용량(유형2, 126p) 도 block 상태에서 안정 완주.

## 6. 결정성 (해시 대상: JSON·Markdown 둘 다 — Codex C2I3B-GATEPREP-MIN-01 반영)

**해시 대상 = 산출 파일 전체 바이트(SHA-256, 앞 20 hex).** JSON 파일과 Markdown 파일을 **모두** 기록.

| 산출물 | 포맷 | SHA-256(20) | 2회 동일 | 크기 |
|---|---|---|---|---|
| 유형1 | JSON | `eeddfb595171b9bfdc1c` | ✔ 동일 | 831,949 B |
| 유형1 | Markdown | `953443f4a31fadbe504a` | ✔ 동일 | 144,437 B |
| 유형2 | JSON | `1c7d8ec90cd9aaf434c9` | ✔ 동일 | 2,744,652 B |
| 유형2 | Markdown | `6095b8814ba86a1890f4` | ✔ 동일 | 403,148 B |

- Markdown 해시는 2I-3A evidence의 값(유형1 `953443f4…`, 유형2 `6095b881…`)과 **일치** → 차단 환경에서도 산출물 동일(결정성·무영향 재확인).

## 7. 판정 근거 (PASS)

- **차단 제어검증됨**(C2: 알려진 원격 연결 차단) + **파싱 성공**(8/8 exit 0) + **파싱 중 outbound 시도 0** + **결정성**(JSON·Markdown 각 2회 동일).
- → **Gate A = PASS**. 단 판정 범위는 **프로세스(Node 런타임) 레벨**(§3). OS/커널 방화벽 검증은 아니므로, 민감 실데이터 운영·기본 활성화 전 **사용자 환경 OS 레벨 재확인**을 비차단 보강 항목으로 유지.

## 8. Redaction 확인

- 로컬 절대경로·계정명·host명·회사명·식별 가능 파일명·토큰·API key·private key **노출 없음**(유형 라벨/`[REDACTED_LOCAL_PATH]`).
- raw log(net 로그)·PDF·변환 JSON/MD·`node_modules`·`nethook.cjs`·lock 파일은 **repo 미포함**(임시 디렉터리에서만 생성). 커밋 전 재스캔: Y

## 9. 다음 단계

- **Gate A PASS** → Gate B(전이/native license review) · Version Strategy 확정으로 진행 가능.
- **구현 사이클 진입**은 gateprep §9 전체 조건(Gate A PASS + Gate B PASS + Version 확정 + v1 scope + opt-in/local posture + 경계 불변) 충족 후 별도 승인 하에.
- 비차단 후속: OS/커널 레벨 no-egress 재확인, (스캔 범위 포함 시) 비민감 스캔 샘플.
