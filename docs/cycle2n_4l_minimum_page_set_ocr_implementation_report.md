# Cycle 2N-4L — Minimum Page-set OCR Implementation (Report)

> **성격**: Codex 2N-4K evidence/Gate B review **PASS**(Gate B = ACCEPT WITH CONDITIONS)와 사용자 승인에
> 따른 **최소 page-set OCR 구현** 보고다. 이 구현은 승인 기반 local assisted runner 경로의 fallback이며,
> **OCR support complete·L2/L3 complete·provider finalization·2N-5 통과·product complete가 아니다.**
> Codex 2N-4L implementation review 전까지 최종 승인이 아니다.
>
> base commit: `906c880870294b47598b34a9011510f0fc548c63` (pull 후 일치·clean)

## 1. 무엇을 구현했나

```text
intake.json(needsOcr 신호) → page-set 산정 → [별도 승인] → tool-cache 별도 항목에 pin 설치+무결성 검증
→ [실행 승인] → nethook(block) 하 rasterize+OCR(bounded) → <stem>.ocr_text.json 원자적 방출
→ 기존 ingest(dei_producer)가 ocr_supplement로만 소비
```

- **`src/intake/runners/pdf_ocr_runner.cjs`** (신규): CLI/승인/검증/방출 오케스트레이션. 기존
  hwp_assisted_runner의 primitives(승인 marker·prep egress·run log·detectNode·nethook 경로·RunnerError
  통제 실패·exit 계약)를 재사용.
- **`src/intake/runners/pdf_ocr_exec.mjs`** (신규): nethook 하에서만 기동되는 실행 스크립트 —
  tool-cache prefix에서 pdfjs-dist/@napi-rs/canvas/tesseract.js를 로드해 rasterize+OCR.
- **`tests/test_pdf_ocr_runner.test.cjs`** (신규 29 tests) + **`tests/test_ocr_canonical_hash_parity.py`**
  (신규 11 checks): 게이트·계약·parity·guard·경계 검증.

## 2. selected_pages 처리

- 대상 집합 = `pageQuality[].needsOcr=true` ∪ `qualitySummary.ocrCandidatePages` — **ingest
  (dei_producer)의 페이지 정합 fail-fast가 허용하는 집합과 동일 규칙**이라 산출물이 구조적으로 ingest와
  무충돌(테스트로 부분집합 불변 증명).
- mixed PDF = 그 집합 / scan-only PDF = 전 페이지가 needsOcr(2L-3C 관측)이므로 자연히 all pages /
  **user-selected range(--pages)는 부분집합으로 제한** — 밖 페이지 포함 시 정중 거절(exit 3), 텍스트가
  충분한 페이지를 임의로 OCR 확대하지 않음. 집합이 비면 "OCR 불필요" 정중 종료(exit 0·artifact 없음).
- 보수 기준의 한계(기록): needsOcr 플래그가 없는 text-empty 페이지는 대상에 넣지 않는다(신호 원천은
  Kordoc intake — 관측상 zero-text 페이지는 needsOcr로 표시되나, 아닌 케이스는 baseline의 한계 공시 경로).

## 3. OCR runtime / tool-cache 처리

- tool-cache **별도 항목** `ocr-runtime@tesseract.js-7.0.0` (Kordoc 항목과 분리 — 이 경로는
  rasterizer(@napi-rs/canvas)가 optional 의존으로 해소되므로 `--omit=optional`을 쓰지 않는 **의도된
  차이**, Gate B 조건 1의 격리 원칙 준수).
- 설치: `npm install tesseract.js@7.0.0 pdfjs-dist@4.10.38 @napi-rs/canvas@0.1.100` + traineddata
  kor/eng 다운로드(pinned hash 검증 후에만 저장). **npm 실행 방식 실측 보정**: Windows에서 `.cmd` 직접
  spawn은 Node 보안 변경(CVE-2024-27980 대응)으로 셸 없이 EINVAL — npm.cmd의 실체인
  `node <dir>/node_modules/npm/bin/npm-cli.js`를 직접 실행(시스템·portable Node 동일 레이아웃 실측,
  공백 경로 안전·셸 불요). 비표준 배치는 resolved npm으로 fallback.
- **무결성 검증(`verifyOcrRuntime`)**: 패키지 5종 exact version + skia native binary SHA-256 +
  traineddata 2종 SHA-256 — 설치 직후와 **매 실행 전** 검증. 불일치는 어떤 것이든 **정리 후 중단 →
  baseline 수렴**(드리프트된 런타임을 조용히 쓰지 않음 — 테스트로 강제).

## 4. Gate B 조건 이행표

| # | 조건 | 이행 |
|---|---|---|
| 1 | tool-cache 격리 | 별도 항목·repo package 0·core/Skill 미참조(테스트) |
| 2 | exact pin+hash 검증 | OCR_PINS 5종+skia+traineddata 상수·verifyOcrRuntime(테스트: evidence 값 일치) |
| 3 | mismatch fail-fast | 버전/native/traineddata 불일치 → 정리+exit 7+baseline(테스트 3종) |
| 4 | prep↔run 분리+두 출처 고지 | 승인 문구에 npm+raw.githubusercontent.com 분리 고지, prep egress에 출처별 기록(실측 로그) |
| 5 | nethook 하 실행+정직 provenance | exec는 `--require nethook.cjs`(block)로만 기동, verified=요약 실관측+egress 0(evidence 모드 통제 실패 포함), 프로세스 레벨 한계 문서 보존 |
| 6 | 로컬 standardFontDataUrl+blank guard | exec에 고정 + ink-coverage guard(개별 blank=additive 기록·전체 blank=렌더 실패 exit) |
| 7 | 산출물 repo 밖+cleanup | 래스터 이미지 **디스크 미기록**(Buffer 직행 — 소스 검사 테스트), scratch는 os.tmpdir mkdtemp·finally 삭제, out-dir repo 내부 경고 |
| 8 | 원자적 artifact+계약 보존+parity | temp+rename 1회 방출, 기존 계약 필드 그대로, Node canonical ↔ Python golden parity(양측 동일 fixture·동일 상수) |
| 9 | confidence=metadata만 | 페이지 additive 필드로만 기록, ingest의 ocr_supplement에는 미전이(Python 테스트로 확인), 승격 로직 없음 |
| 10 | 사용자 문서는 4M | runner README 최소 갱신만(구현 상태 설명) — quickstart/SKILL/§6 일괄 갱신은 2N-4M |

## 5. ocr_text.json 계약 처리

- **기존 계약 재사용(신규 설계 없음)**: 필수 provenance(provider/provider_version/model/model_sha256/
  output_sha256 문자열 + no_egress_verified bool) + pages[{page,text,text_sha256}] — text_sha256은 실제
  UTF-8 SHA-256, output_sha256은 **Python `canonical_ocr_output_sha256()` 규칙의 Node 구현**으로 계산.
- **parity 방식**: 교차 spawn 없이(Codex 환경 bare python 불가) **동일 fixture 3종(한국어·제어문자·float·
  key 재배열)의 golden 상수를 Python으로 사전 계산**해 양쪽 테스트에 고정 — 두 스위트가 함께 green이면
  parity 성립. 실 E2E에서도 Node가 만든 artifact를 Python ingest가 hash 재검증 통과로 수용(§7).
- additive 필드(confidence·ink_ratio·blank_raster·model_files·dpi·langs)는 canonical hash에 포함되고
  계약 검증을 통과하며 ocr_supplement로는 전이되지 않음(Python 테스트).
- model_sha256 = 두 traineddata pin의 결정적 요약 hash(`lang:sha` 정렬 결합의 SHA-256 — presence-only
  계약의 문서화된 한계 내에서 재계산 가능한 규칙), model_files에 언어별 hash 병기.
- **partial artifact 금지**: 페이지 체크포인트는 scratch(JSONL)에만, 실패·timeout·guard 시 final 미방출.

## 6. bounded execution

기본값 = 2N-4K 제안 그대로 채택(조정 없음): page cap **50**(초과 시 정중 거절 — `--max-pages`로 명시
상향 가능), batch **5페이지**(batch당 worker 1회 생성·재사용·종료), per-page timeout **120s**(초과 시
전체 통제 실패 — 부분 산출물 없음), DPI 기본 **300**(`--dpi 150` 옵션). 실 스캔 대량 실측 후 재조정은
후속 항목(C2N4K-OBS-01).

## 7. 실 E2E 검증 (승인 범위 내 — repo 밖, 종료 후 전량 삭제)

합성 3p PDF + needsOcr 신호 fixture(원본 문서 미사용·플래그는 fixture 수준 시뮬레이션), temp tool-cache:

1. `--check`: 대상 3페이지·"설치/검증 필요"·두 출처 고지 표시(exit 0, side-effect 0).
2. `--approve-install`: 실 npm 설치(11s, prep egress `started→ok`) + 실 traineddata 다운로드(hash 검증
   통과, 출처별 기록) + 설치 직후 무결성 recheck 통과 → **실행 승인은 별도 대기(exit 6 — U3 분리 동작)**.
3. `--approve-run --evidence-mode`: nethook(block) 하 3페이지 rasterize+OCR **7.9초 완주**,
   `run_log: hook_observed=true, egress_attempts=0, no_egress_verified=true`, artifact 3페이지
   (confidence 88·ink_ratio ~0.022·정확 인식 "KSSB OCR E2E TEST PAGE 1…").
4. **Python ingest 합류**: 실 artifact를 `build_dei_candidate(intake, ocr_text=…)`에 투입 → rc 0,
   `ocr_supplement` pages [1,2,3]·extraction_quality 전부 "low"·no_egress_verified=true —
   **Node가 쓴 output_sha256을 Python이 재계산 검증 통과(실전 parity)**.
5. cleanup: E2E 작업 폴더(128MB — node_modules·traineddata·fixture·artifact) 전체 삭제 확인.

첫 실측에서 발견·보정한 결함 1건: `.cmd` spawn EINVAL(§3 — npm-cli.js 직접 실행으로 해소, 테스트 회귀 green).

## 8. artifact cleanup / contamination

- 래스터 이미지 무디스크(소스 검사 테스트) · scratch finally 삭제(테스트: tmpdir 개수 비증가) ·
  원자적 방출 후 `.tmp-*` 잔존 0(테스트) · E2E 전량 삭제(§7).
- repo 오염 스캔: `git status --short` = 신규 소스/테스트/문서만. node_modules/package.json/lock/
  `*.png`/`*.traineddata`/`*.ocr_text.json`/`*.intake.json`/zip 신규 유입 0.
- `.gitignore`의 기존 `*.ocr_text.json` 방어 유지(2N-2). `*.png` 전역 ignore는 이번에도 미추가 —
  이 구현이 래스터 이미지를 디스크에 아예 쓰지 않으므로 방어 필요성이 더 낮아졌다(근거 기록).

## 9. 테스트/검증

| 스위트 | 결과 |
|---|---|
| `node --test tests/test_pdf_ocr_runner.test.cjs` (신규) | **29/29** |
| `python tests/test_ocr_canonical_hash_parity.py` (신규) | **11/11** |
| router 21 · Node runner 39 · bootstrap 11 (회귀) | **전부 green** |
| Python runner 49 · intake 83 · nethook 29 (회귀) | **전부 green** |
| `git diff --check` | clean |

## Final Report

- **status/verdict**: **IMPLEMENTED — Codex 2N-4L review 대기** (최종 판정 아님)
- **changed files** (7건): `src/intake/runners/pdf_ocr_runner.cjs`(신규) ·
  `src/intake/runners/pdf_ocr_exec.mjs`(신규) · `tests/test_pdf_ocr_runner.test.cjs`(신규 29) ·
  `tests/test_ocr_canonical_hash_parity.py`(신규 11) · `src/intake/runners/README.md`(최소 갱신 —
  OCR runner 항목+낡은 "OCR 미수행" 문구 정합) · 본 보고서 · `docs/current_status.md`(최소 갱신)
- **implementation summary**: §1 — page-set 산정→별도 승인→pin/hash 검증→nethook 하 bounded
  rasterize+OCR→원자적 ocr_text.json→기존 ocr_supplement 합류. 기존 runner primitives 재사용,
  core/schema/validator/renderer/delivery/Skill/DEI 무변경.
- **selected_pages handling**: §2 — needsOcr ∪ ocrCandidatePages, user-range 부분집합 제한, 빈 집합
  정중 종료, cap 초과 정중 거절.
- **OCR runtime/tool-cache handling**: §3 — 별도 항목·pin 설치·매 실행 전 무결성 검증·불일치 정리 후
  baseline·npm-cli.js 직접 실행(실측 보정).
- **Gate B condition compliance**: §4 이행표 — 10개 조건 전부 코드+테스트로 반영.
- **ocr_text.json contract handling**: §5 — 계약 재사용·golden parity·additive 무해·partial 금지.
- **no-egress/provenance handling**: nethook(block) 전용 기동·verified=실관측+egress 0·evidence 모드
  통제 실패(exit 7·정직 로그·stack 미노출)·프로세스 레벨 한계 보존. 실 E2E에서 verified=true 관측.
- **artifact cleanup/contamination handling**: §8 — 무디스크 래스터·scratch 삭제·원자 방출·repo 오염 0.
- **tests/verification**: §9 — 신규 29+11, 회귀 21/39/11·49/83/29 전부 green, E2E 실측(§7).
- **scope compliance**: repo root package/lock/node_modules 0 · core/Skill/schema/validator/renderer/
  delivery/DEI 무변경 · router/hwp runner 계약 무변경(위임·재사용만) · confidence 승격 없음 ·
  2N-5/submission.zip/원본 문서/raster·OCR artifact 커밋 없음 · finalization/complete 선언 없음.
- **required follow-up**: ① 실 스캔 문서 대량 실측으로 bounded 기본값 재확인(C2N4K-OBS-01 — 2N-5 또는
  별도 evidence) ② hwp_assisted_runner의 npm `.cmd` spawn도 동일 EINVAL 잠재(실 설치를 Node runner로
  수행할 경우) — 이번 범위 밖(기존 계약 변경 금지), Codex 리뷰에 판단 위임 ③ needsOcr 미표시 text-empty
  페이지 정책(현행: 보수적 제외 — 한계 기록).
- **carry-forward to Codex review**: Gate B 이행표(§4)·E2E 실측(§7)·npm 실행 방식 보정(§3)의 적정성,
  required follow-up ②의 처리 방침.
- **carry-forward to 2N-4M**: quickstart matrix(텍스트 PDF 행 + 스캔 PDF 행 — "플러그인 내 OCR 미구현"
  문구가 이제 stale: "승인 기반 로컬 assisted runner의 최소 OCR 경로 구현됨(자동 실행 없음)"로 갱신 필요)·
  README·current_status·SKILL/§6/ladder 문구("core는 OCR을 자동 실행하지 않음 / 승인 기반 로컬 assisted
  runner가 실행 가능")·no-overclaim 재점검·router↔OCR runner 사용 흐름 문서화·2N-5 재진입 판단.
- commit SHA는 채팅 보고에 기재.
