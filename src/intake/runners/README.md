# src/intake/runners — HWP-first Assisted Runner (Cycle 2N-2, source-only)

> **경계**: 이 폴더는 **plugin core가 아니며 Skill entrypoint도 아니다.** core(schema/validator/renderer/delivery)는
> 이 폴더를 참조하지 않는다(테스트로 강제). Skill이 사용자 승인 절차를 **중개**할 때만 안내되는 opt-in 보조 도구다.
> 근거: 2N-1A HWP-first scope decision(D77)·Codex 2N-1 CONDITIONAL PASS 조건·2L-4A runner 조건.

## 무엇인가

- `hwp_assisted_runner.py`: Kordoc 기반 **HWP/HWPX/DOCX 구조·텍스트** assisted path의 runner skeleton(표준 라이브러리만).
  check/plan 모드, **승인 게이트**(`--approve-install`/`--approve-run` — **무승인 설치·실행 절대 금지**),
  repo 밖 tool-cache(`npm --prefix`, **`--omit=optional` 필수**, pin `kordoc@3.13.0 + pdfjs-dist@4.10.38`),
  준비 egress 기록(`prep_egress_log.jsonl`)·승인 marker(`approvals.json`)·실행 로그(tool-cache 내부 전용),
  `--out-dir` 필수, artifact 규약 `<stem>.intake.json`/`<stem>.aux_signals.json`.
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
