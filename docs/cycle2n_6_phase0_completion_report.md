# Cycle 2N-6 Phase 0 — Completion Report (R1·R2·R3)

> **성격**: Post-2N-5 최종 보완 계획(D92)의 **Phase 0만** 수행한 완료 보고다. Codex 계획 리뷰
> PASS("Phase 0 진행 가능 + 좁게 유지")의 조건 5건을 준수했다 — broad Node 이식·portable Python·
> OCR runtime 다운로드·package 상태 변경 없음. PASS/FAIL 최종 판정은 Codex 리뷰가 수행한다.
>
> 시작 HEAD: `cf9b8ea779962e4dfbe92bd36b938121cb0177a6` (pull 후 최신 원격 main 일치·clean)

## R1 — runner controlled-failure patch (2N-5 Major ①)

**결함**: 승인 후 실행이 tool-cache의 `approvals.json` 기록에 실패하자(권한/샌드박스) uncaught 예외로
stack trace + repo/사용자 홈 경로가 노출되고 exit 1로 종료(2N-5 실측).

**구현** (수정 표면 — 필요 최소 범위 직접 확인 결과):
- **공통 primitives 1개소 패치가 3 runner를 커버**: 기록 함수(recordApproval/appendPrepEgress/
  appendRunLog)는 `hwp_assisted_runner.cjs`에만 있고 router/OCR runner가 재사용하므로, 함수 본문을
  `guardedWrite()`로 감싸 fs 실패를 **경로 미포함 한국어 RunnerError**(TOOLCACHE_WRITE_FAIL_MESSAGE —
  권한/백신 안내 + `--tool-cache` 대안 + baseline fallback 안내)로 승격했다. 이미 통제된
  RunnerError(예: hash mismatch)는 재포장하지 않는다.
- **각 runner의 자체 쓰기 지점 보정**: out-dir 생성(hwp·router·OCR — OUTDIR_WRITE_FAIL_MESSAGE),
  OCR traineddata 폴더/파일 쓰기, 최종 ocr_text.json 원자적 쓰기(실패 시 임시 파일 정리 포함).
- **main 래퍼 3종**: 각 runner의 `main`을 `mainInner` + 래퍼로 분리 — 어떤 RunnerError도 프로그램적
  호출/CLI 양쪽에서 한국어 안내 + **문서화된 exit 7**로 수렴(기존 CLI 경계 catch는 최후 방어로 유지,
  기존 exit/승인/provenance 계약 무변경).
- **감사 추적 보존**: 승인 기록이 실패하면 설치/실행이 **시작되지 않음**(기록 없는 실행 금지 —
  테스트로 강제).
- Python runner(.py)의 동일 트레이트는 reference 지위(D85④ 전례)로 이번 범위 밖 — follow-up에 기록.

**테스트**: 신규 `tests/test_toolcache_write_failure.test.cjs` **8/8** — 실제 권한 변경·홈 tool-cache
접촉 없이 "일반 파일 아래 경로"로 쓰기 실패를 모의(side effect 0). primitive 단위(경로 미포함
RunnerError·기존 RunnerError 보존), hwp/router/OCR 각 main(exit 7·exec 0·artifact 없음), out-dir
실패, **CLI subprocess(2N-5 실측 결함 직접 재현 — 종전 exit 1+stack → 현재 exit 7·누출 0)**.
누출 검증은 공통 assert(stack `at `·`RunnerError`·repo 경로·`?:\Users\` 사용자 홈 패턴·해당 불가 경로).

## R2 — black-box protocol (2N-5 Major ②)

신규 `docs/blackbox_protocol.md` 1개(문서 증식 최소화 — R3 규약 포함). Codex가 요구한 5요소 충족:
수동 Skill-run 호출·findings 캡처 요건(프롬프트·HEAD·hash)·샘플 규약·후반부 스크립트(preflight→
delivery) 명령·**시나리오 1 PASS/FAIL/BLOCKED 판정 기준**(source-bound 표본 확인·preflight error 0·
대표 문서 생성·no-overclaim/누출 0·오염 0). findings 생성은 결정적 parser로 위장하지 않고 LLM
비결정성 한계를 명시했다.

## R3 — 과도기 Python UTF-8 실행 규약 (2N-5 Major ③)

- **규약 문서화**: blackbox_protocol §1 — `PYTHONUTF8=1`/`PYTHONIOENCODING=utf-8` 필수 + Python 절대
  경로 규약(bare python stub 실측 반영).
- **최소 script-level 가드 구현**(범위 판단: 2줄×2파일 — D92 ③ "최소 안전 패치" 예외 범위):
  `dei_producer.py`·`kssb_report_delivery.py`의 **CLI 진입점(_main) 한정** stdout/stderr UTF-8
  reconfigure(errors=replace). 라이브러리 사용 경로 무영향. **실검증**: 강제 `PYTHONIOENCODING=cp949`
  하에서 dei_producer가 bbox≈ 힌트 포함 출력을 exit 0으로 완료(2N-5 crash 케이스 —
  UnicodeEncodeError 0). renderer/validator 자체 CLI는 delivery가 감싸므로 미수정(범위 최소화).

## 검증

| 항목 | 결과 |
|---|---|
| 신규 `node --test tests/test_toolcache_write_failure.test.cjs` | **8/8** |
| Node 회귀: hwp 39 · router 21 · OCR 29 · bootstrap 11 | **전부 green** |
| Python 회귀: intake 83 · delivery 34 · parity 11 · renderer 22 · validator 30 · runner 49 · nethook 29 · aux 26 | **전부 green** |
| UTF-8 가드 실검증(강제 cp949) | exit 0·UnicodeEncodeError 0 |
| `git diff --check` | clean |
| 오염 스캔(node_modules/package/lock/generated/traineddata/archive/submission.zip/repo tool-cache) | 신규 0건 |
| 누출 부재 증거 | 신규 스위트의 CLI subprocess + in-process assert(§R1) |

## 범위 준수

Node core 이식(N1~N5) 미착수 · portable Python 미제작 · OS Python 설치 안내 미추가 · OCR runtime
다운로드/설치/실행 없음 · Kordoc 재설치/실행 없음 · package.json/lock/node_modules 없음 · generated
sample output/`.intake.json`/`.ocr_text.json`/traineddata/archive/submission.zip repo 미유입 ·
2N-5 PASS/OCR support complete/L2/L3/finalization/product complete 주장 없음 · Claude 최종 판정 없음.

## Changed Files

- `src/intake/runners/hwp_assisted_runner.cjs` (R1 — guard·메시지 상수·main 래퍼·exports)
- `src/intake/runners/document_intake_router.cjs` (R1 — out-dir guard·main 래퍼)
- `src/intake/runners/pdf_ocr_runner.cjs` (R1 — out-dir/traineddata/artifact guard·main 래퍼)
- `tests/test_toolcache_write_failure.test.cjs` (신규 8 tests)
- `src/intake/dei_producer.py` · `src/renderers/kssb_report_delivery.py` (R3 최소 가드 — CLI 진입점 2줄)
- `docs/blackbox_protocol.md` (신규 — R2+R3 규약)
- 본 보고서 · `docs/current_status.md`(최소) · `docs/decision_log.md`(D93 — 사용자 결정 3건 기록)

## Required Follow-up / Carry-forward

- **Codex Phase 0 review** → PASS 시 Phase 1(Q1~Q5 docs) → 2N-5R.
- 2N-5R은 `docs/blackbox_protocol.md` 기준으로 실행하며, **D93**에 따라 승인 기반 OCR·HWP 실 실행을
  필수 시나리오로 포함(검증 대상은 승인 경로·fallback·누출 방지 — complete 선언 아님).
- Python runner(.py)의 동일 쓰기 실패 트레이트(reference 지위 — 재현 시 좁은 patch, D85④/C2N4L-OBS-02
  계보) · Codex 계획 리뷰 OBS-01(구 current Cycle bullet 이동)은 Phase 1에서 처리 검토.
