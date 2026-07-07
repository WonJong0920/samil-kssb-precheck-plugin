# src/intake/runners — Assisted Runners (HWP-first 2N-2 / Node port 2N-4D / intake router 2N-4J)

> **경계**: 이 폴더는 **plugin core가 아니며 Skill entrypoint도 아니다.** core(schema/validator/renderer/delivery)는
> 이 폴더를 참조하지 않는다(테스트로 강제). Skill이 사용자 승인 절차를 **중개**할 때만 안내되는 opt-in 보조 도구다.
> 근거: 2N-1A HWP-first scope decision(D77)·Codex 2N-1 CONDITIONAL PASS 조건·2L-4A runner 조건.

## 무엇인가

- `hwp_assisted_runner.py`: Kordoc 기반 **HWP/HWPX/DOCX 구조·텍스트** assisted path의 runner skeleton(표준 라이브러리만).
  check/plan 모드, **승인 게이트**(`--approve-install`/`--approve-run` — **무승인 설치·실행 절대 금지**),
  repo 밖 tool-cache(`npm --prefix`, **`--omit=optional` 필수**, pin `kordoc@3.13.0 + pdfjs-dist@4.10.38`),
  준비 egress 기록(`prep_egress_log.jsonl`)·승인 marker(`approvals.json`)·실행 로그(tool-cache 내부 전용),
  `--out-dir` 필수, artifact 규약 `<stem>.intake.json`/`<stem>.aux_signals.json`.
- `hwp_assisted_runner.cjs` **(2N-4D 신규 — Node port, 2N-4D-A 보정 후 Codex re-review PASS)**: 위 Python runner와 **CLI 계약 동일**
  (플래그·exit code·한국어 승인 문구·tool-cache 레이아웃·pin·로그 형식·provenance 규칙)한 Node 구현(내장 모듈만,
  외부 의존성 0 — repo package.json 미생성). **동기**: Codex 실행환경에서 Python이 WindowsApps stub으로 실행 불가,
  Node는 가용(P0 probe 실측 — 2N-4C 계획 S1 1단계). 테스트는 `node:test` 내장 러너
  (`node --test tests/test_hwp_assisted_runner_node.test.cjs`) — **Codex가 리뷰에서 직접 실행 가능**.
  **v1 의도적 차이(문서화)**: ① **aux_signals 미생성**(HWPX/DOCX 보조 신호는 Python 경로 전용 — Node 내장에
  zip/XML parser 부재; 기존 설계상 aux 부재 허용, 건너뜀 안내 출력) ② node 실행 파일은 자기 자신(process.execPath)으로
  보장(부재 케이스 구조적 없음 — npm 부재만 exit 4) ③ npm은 PATH+PATHEXT 해석(Windows npm.cmd — bare npm의
  npm.ps1 정책 차단 위회, P0/AVR-04). **Python runner는 reference로 유지**(제거 아님 — 최종 처리는 별도 결정).
  실 Kordoc 실행 parity evidence는 미수행(이번 사이클 실행 승인 없음 — follow-up).
  **(2N-4D-A 보정 — C2N4D-MAJ-01/MIN-01)**: evidence 모드 실패는 **통제된 실패**다 — RunnerError가 CLI 밖으로 새지 않고
  정직한 provenance(no_egress_verified=false)를 run_log에 남긴 뒤 한국어 문구 + **exit 7**로 종료(stack trace·로컬 경로
  미노출, CLI subprocess 테스트로 강제). check 모드의 설치 명령 표시도 실제 실행과 동일한 **resolved npm 경로**(Windows:
  npm.cmd)를 쓴다(bare npm 표시 금지). Python runner의 동일 보정은 이번 patch 범위 밖(변경 금지) — 후속 결정 항목.
- `document_intake_router.cjs` **(2N-4J 신규 — Kordoc-aware intake router skeleton)**: 문서 계열(family) 판별과
  **라우팅 소유권**을 갖는 진입 모듈(C2N4I-OBS-02/C2N4I4M-OBS-01 — HWP-계열과 PDF 의미를 한 runner에서 뭉개지 않음).
  **PDF → Kordoc-first enhanced intake 경로**(권장·**승인 기반 선택** — 텍스트 PDF도 대상, 목적은 표·섹션·페이지 위치·
  도표 주변 맥락 보강. D91: "Kordoc-first when available and approved / baseline fallback when unavailable, declined,
  or failed") / **HWP/HWPX/DOCX → 기존 `hwp_assisted_runner.cjs`로 무변경 위임**(원 argv 그대로 — 기존 계약·문구·
  exit code 불변) / 그 외 → 정중한 범위 밖 안내. 게이트·pin·prep egress·no-egress·provenance는 기존 runner의
  exported primitives **재사용**(재구현·자체 pin 없음 — 테스트로 강제), CLI 플래그·exit code 동일.
  unavailable(런타임 부재)/declined(승인 거부)/failed(준비·실행 실패)는 전부 **기본 텍스트 검토(baseline) 수렴**으로
  정직하게 안내(실패 은폐 없음). **OCR은 실행하지 않는다** — 스캔/이미지 페이지는 intake의 판독 필요 신호로만 드러나며,
  page-set OCR·rasterizer·tesseract.js는 2N-4K spike/2N-4L 별도 사이클(gated). PDF intake 산출물은 기존 ingest
  boundary(`dei_producer.py`)의 paginated 계약으로 합류(ingest 무변경). Kordoc-first **구현 완료 선언 아님**(skeleton).
  테스트: `node --test tests/test_document_intake_router.test.cjs`.
- `prepare_portable_node.ps1` **(2N-4F 신규 → 2N-4G real-download evidence → B안 채택됨(D90))**:
  **채택 범위**: Windows에 시스템 Node/npm이 없는 환경의 **승인 기반 fallback runtime strategy**다 —
  core plugin의 필수 dependency가 **아니며**, 2N-5 통과·모든 HWP 처리 완성·OCR support complete를 뜻하지 않는다.
  시스템 Node가 없는 사용자를 위한 **승인 기반** portable Node 준비 스크립트(Windows 내장 PowerShell만 — Node/Python 불요,
  닭-달걀 해소). `-ApproveRuntime` 없이는 어떤 파일도 만들지 않고 승인 안내만 출력(exit 5). **이중 SHA-256 검증**
  (repo-pinned 기대값 + 공식 SHASUMS256.txt 교차 — 어느 한쪽 불일치/파싱 실패도 부분 파일 정리 후 중단, 해제 금지),
  해제 후 `node.exe --version`=pin 자가 확인, approvals.json `runtime` marker·prep_egress_log 기록(BOM 없는 UTF-8),
  모든 실패는 A안(기본 텍스트 검토 계속) 수렴. **기대 hash 상수는 2N-4G real-download evidence에서
  공식 SHASUMS256.txt와 실제 zip hash를 교차 확인해 기록했다**. pin `v24.16.0`(v24 LTS 계열 — 사용자 결정,
  Gate D·2N-4·P0 실측 major). OS installer/PATH 영구 수정/관리자 권한 없음(제거=폴더 삭제), `-ExecutionPolicy Bypass`는
  프로세스 1회 한정(승인 문구 고지). **주의: 이 파일은 UTF-8 BOM 인코딩이어야 한다**(PowerShell 5.1이 BOM 없는 UTF-8을
  CP949로 읽어 한국어 문구가 깨짐 — 2M-3 인코딩 전례).
- **runner 탐지 계층(2N-4F, 2N-4F-A 보정)**: `detectNode()`가 **시스템 Node/npm(둘 다) → tool-cache portable → 부재**
  순서로 동작하고, 부재 안내(exit 4)에 B안 승인 절차(bootstrap 명령)를 표시한다 — **무단 설치는 없다**(exec 0 테스트).
  **(C2N4F-MAJ-01)** portable은 파일 존재만으로 인정하지 않는다: `node.exe --version` **실측이 pin과 정확히 일치**해야
  유효하며, 버전 명령 실패·timeout·비정상 출력·불일치·파일 누락은 전부 missing/corrupt로 취급되어 승인 안내/A안으로
  수렴한다. exit code·플래그·승인 게이트·nethook·provenance 계약은 2N-4D-A PASS 상태 그대로.
  **(C2N4F-MAJ-02 — ps1)** 원격 SourceRoot는 **공식 `nodejs.org/dist/v<pin>/`만 허용**(미러/임의 URL은 네트워크 호출 전
  fail-fast 거부)하고, **원격 경로에서는 `-PinnedZipSha256` override를 거부**한다(repo-pinned 상수만 유효 — provenance
  약화 방지). 로컬 디렉터리 SourceRoot는 테스트 fixture 전용으로 유지(출처가 prep 로그에 남음).
- `nethook.cjs`: 실행(파싱) 단계 **no-egress 훅**(source-only) — 비-loopback 시도를 **패킷 발신 전에 기록 후 차단**(block 모드),
  `worker_threads` 전파, 종료 시 `[NETHOOK-SUMMARY]` 출력. runner는 **요약이 실제 관측되고 egress 시도 0인 실행에만
  `no_egress_verified=true`**를 기록한다(evidence 모드에서는 미관측=실패).
  - **커버 범위(2N-3A 보정 — claim과 patch 일치)**: `net.Socket.connect`/`tls.connect`(위치 인자·option object의
    `host`/`hostname`/`servername`·정규화 args 배열), `http(s).request/get`(URL 문자열·URL 객체·option object),
    `dns` **callback+promises+Resolver의 lookup·resolve-family 전체**(resolve/4/6/Any/Cname/Caa/Mx/Naptr/Ns/Ptr/Soa/Srv/Txt·reverse).
    로컬 IPC(`path`/named pipe)와 loopback은 허용.
  - **한계(정직 표기)**: `dgram`(UDP 직접 사용)·`child_process`로 별도 spawn된 프로세스(worker_threads는 전파됨)·
    native addon의 raw syscall은 이 훅의 범위 밖이다 — 프로세스(Node 런타임) 레벨 검증이며 OS/커널 방화벽이 아니다(Gate A/D와 동일 한계).

## 하지 않는 것 (HWP-first 범위 밖 — gated)

- **OCR 미수행**: tesseract.js·traineddata·rasterizer는 이 runner의 범위 밖이며, **`.ocr_text.json`을 생성하지 않는다**
  (OCR assisted path는 rasterizer 결정·Gate B 재검토 등 별도 게이트 해소 후 별도 단계).
- portable Node 설치·OS installer 실행·PATH 영구 수정·관리자 권한 요구 없음(Node 부재 시 설치 안내 + 기본 텍스트 검토로 수렴).
- repo 루트 package.json·package-lock·repo 내부 node_modules·npm global·npx 미사용.
- provider 최종 확정 아님. **사용자 보고서에는 provider명이 들어가지 않는다**(승인 대화·내부 로그에만 — evidence_mapping_rules §7).

## 사용 흐름(요지)

1. `--check`: 설치·실행 없이 필요한 작업과 한국어 승인 문구를 표시(plan).
2. 설치 필요 시 승인 문구 출력 후 종료 → 사용자가 `--approve-install`로 재실행(준비 egress 기록).
3. 실행 승인 문구 출력 후 종료 → `--approve-run`으로 재실행(no-egress 훅 하 파싱, provenance는 tool-cache 로그에).
4. 산출물(intake/aux_signals JSON)은 기존 ingest boundary(`dei_producer.py`)가 그대로 소비한다
   (HWP-계열은 2N-4B document-level 변형 계약 — runner는 provider 출력을 무변경 보존한다).

## 산출물 취급 주의 (2N-4 관측 — artifact 정책)

- **Kordoc은 문서 내 이미지를 out-dir에 `images/` 폴더로 추출**하고, `intake.json` 안에도
  이미지 바이트를 **base64로 인라인**한다(top-level `images` + image 블록 `imageData`).
  따라서 **out-dir 산출물 전체(images/ 포함)는 원본 문서와 동일한 민감도로 취급**한다:
  repo/커밋 금지(원본 미커밋 원칙과 동일), `--out-dir`는 repo 밖 사용(runner가 repo 내부 경로를 경고),
  삭제는 out-dir 폴더 제거로 완결. `.gitignore`의 `*.intake.json` 방어는 유지되지만 `images/`의
  개별 이미지 파일까지 막지는 않으므로 **repo 밖 out-dir가 1차 방어**다.
- ingest boundary(`dei_producer.py`)는 이미지 base64를 DEI로 **가져오지 않는다**(테스트로 강제 —
  image 블록은 파일명 텍스트만 전달).
