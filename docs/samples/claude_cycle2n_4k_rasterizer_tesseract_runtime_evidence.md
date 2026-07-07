# Claude Cycle 2N-4K — Rasterizer + tesseract.js Runtime Evidence

> **성격**: 사용자 승인 하의 **evidence cycle**이다(Claude Code 수행 — 최종 PASS/FAIL 판정은 Codex 리뷰 대상).
> 제품 코드 구현·OCR 경로 병합·2N-4L 착수·2N-5 실행이 아니다. 모든 설치·다운로드·실행은 **repo 밖**
> 임시 작업 폴더에서 수행했고 종료 시 전량 삭제했다(§9). 원본 문서(고객/공개 보고서)는 사용하지 않았다 —
> 입력은 전부 이 사이클에서 생성한 **synthetic fixture**다.
>
> reviewed base commit: `e46b7afd18f9e43dd4a67b483eefff1d991efb9a` (pull 후 일치·clean — Codex 2N-4J review PASS 포함)

## 1. 실행 환경과 작업 폴더

- Windows 10, 시스템 Node **v24.16.0** + npm **11.13.0** (bare `node`/`npm` 이 셸에서 동작).
- 작업 폴더(repo 밖, 세션 임시): `<TEMP>\claude\…\scratchpad\ocr-spike-2n4k\{pkg, traineddata, work, logs}` —
  종료 시 전체 삭제(§9). repo에는 어떤 패키지/산출물도 생성하지 않았다.

## 2. Prep egress 기록 (승인 하 다운로드 — 실행 no-egress와 분리)

| 시각(UTC) | 행위 | 출처 |
|---|---|---|
| 08:27:58→08:28:07 | `npm install tesseract.js@7.0.0 pdfjs-dist@4.10.38` (16 packages, rc=0) | registry.npmjs.org |
| 08:29:34→08:29:35 | `eng.traineddata`·`kor.traineddata` 다운로드 | **raw.githubusercontent.com**/tesseract-ocr/tessdata_fast (npm과 별개 제3 출처 — 분리 기록) |

## 3. 공급망 / 버전 / hash 실측 (핵심 질문 4)

**설치 결과 (16 packages — 전부 permissive: MIT 10 · Apache-2.0 5 · BSD-2-Clause 1, copyleft/unknown 0):**

| 패키지 | 버전 | license | npm dist.integrity |
|---|---|---|---|
| tesseract.js | **7.0.0** | Apache-2.0 | `sha512-exPBkd+z+wM1BuMkx/Bjv43OeLBxhL5kKWsz/9JY+DXcXdiBjiAch0V49QR3oAJqCaL5qURE0vx9Eo+G5YE7mA==` |
| tesseract.js-core | **7.0.0** | Apache-2.0 | `sha512-WnNH518NzmbSq9zgTPeoF8c+xmilS8rFIl1YKbk/ptuuc7p6cLNELNuPAzcmsYw450ca6bLa8j3t0VAtq435Vw==` |
| pdfjs-dist | **4.10.38** (기존 Kordoc pin과 동일 버전) | Apache-2.0 | `sha512-/Y3fcFrXEAsMjJXeL9J8+ZG9U01LbuWaYypvDW2ycW1jL269L3js3DVBjDJ0Up9Np1uqDXsDrRihHANhZOlwdQ==` |
| @napi-rs/canvas | **0.1.100** | MIT | `sha512-xglYA6q3XO5P3BNJYxVZ1IV7DLVjp1Py6nwag88YntrS+3vKHyYcMqXVS4ZztJmwz2uGvz1FWhI/4LgbR5uQDA==` |
| @napi-rs/canvas-win32-x64-msvc | 0.1.100 | MIT | `sha512-MyT1j3mHC2+Lu4pBi9mKyMJhtP6U7k7EldY7sj/uS5gJA65gTXt8MefJQXLJo5d/vZbuWmfxzkEUNc/urV3pHA==` |

- **주의(버전 해석)**: npm standalone latest `tesseract.js-core`는 6.1.2였으나, `tesseract.js@7.0.0`이 의존성으로
  **core@7.0.0을 스스로 pin**한다 — 설치 실측으로 Gate D(2L-3B)와 **동일 조합(7.0.0+7.0.0)** 재현.
  4L pin은 `tesseract.js@7.0.0`(+동반 core 7.0.0)로 잡으면 된다.
- **@napi-rs/canvas 버전은 pdf.js가 결정**: `pdfjs-dist@4.10.38`의 optionalDependencies가 `@napi-rs/canvas ^0.1.65`
  → npm이 0.1.100으로 해소(우리가 별도 고른 게 아니라 pdf.js의 자체 Node canvas 선택 — 생태계 표준 경로).
- **native 바이너리는 정확히 1개**: `skia.win32-x64-msvc.node` **27,294,720 B**,
  sha256 `0f76fb0648fbff832856f6ce202059fc3fa38be7ad925300e96935906ea11132` (prebuilt — 빌드 툴체인 불요).
  wasm은 tesseract.js-core 6종(기존 Gate D와 동일 계열).

**traineddata (tessdata_fast, 제3 출처) — Gate D(7/4) 기록과 전체 hash·바이트 일치(시점 간 재현성 확인):**

| 파일 | 바이트 | SHA-256 |
|---|---|---|
| eng.traineddata | 4,113,088 | `7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2` |
| kor.traineddata | 1,677,415 | `6b85e11d9bbf07863b97b3523b1b112844c43e713df8b66418a081fd1060b3b2` |

**cache/cleanup 정책 근거**: 이번 spike는 임시 폴더 사용 후 전량 삭제로 실증. 4L 제품 경로는 기존 tool-cache
규율(repo 밖 `<홈>/.samil-kssb-precheck/tools/`·승인·hash fail-fast·제거=폴더 삭제)을 재사용하되, **Kordoc 항목과
분리된 별도 항목**이어야 한다 — Kordoc 설치는 `--omit=optional`(RH-B2 native 차단)인데 OCR 래스터 경로는
optional(@napi-rs/canvas)이 **필수**라 설치 정책이 상반된다. U7 경로별 승인 분리와도 정합.

## 4. Rasterizer finding (핵심 질문 1·2)

- **PyMuPDF 300DPI는 제품 경로에서 배제 유지** (질문 2 답: 그렇다) — AGPL·Gate D 검사 전용 evidence였고
  이번 사이클에서 설치·실행하지 않았다.
- **제품 경로 후보 = pdfjs-dist(4.10.38) + @napi-rs/canvas(0.1.100)** — 이번 spike로 실측 성립:

| 실측 | 300 DPI | 150 DPI |
|---|---|---|
| 페이지당 래스터 시간 | 404–474 ms | 112–132 ms |
| 픽셀/파일 | 2550×3301, PNG ~230 KB | 1275×1651, PNG ~105 KB |

- **함정 실측(4L 필수 방어)**: 1차 실행에서 `standardFontDataUrl`을 지정하지 않자 표준 14폰트(Helvetica) 텍스트가
  **오류 없이 빈 페이지로 렌더**됐고(3페이지 PNG가 전부 백지·바이트 동일) OCR이 0자를 반환했다. 로컬
  `node_modules/pdfjs-dist/standard_fonts/` 지정으로 해소(네트워크 불요). → 4L 구현 요건: ① 로컬
  standardFontDataUrl 고정, ② **ink-coverage(비백색 픽셀 비율) 가드**로 silent-blank 탐지(이번 spike에서 잉크율
  0.036~0.039 실측 — 백지=0과 명확 구분). 스캔 이미지 페이지는 폰트와 무관하므로 이 함정은 텍스트 페이지
  래스터에 해당한다.
- **pure-JS 대안**: 이번 spike에서 실측하지 않았다(한계로 기록). pdf.js의 Node 렌더 자체가 @napi-rs/canvas를
  optionalDependencies로 전제하는 구조라, pure-JS canvas 대체는 pdf.js가 요구하는 canvas API 표면 보장이 없어
  별도 검증 비용이 크다. 필요 시 후속 spike 항목.
- **native 판단(질문 1 답)**: 후보는 native 1개(prebuilt skia, MIT)를 수반한다. **이 문서는 채택 선언이 아니다**
  — 제품 경로 수용은 **Gate B(license/native) 재검토** 후 별도 결정(recommendation: 재검토 개시. 근거 —
  license 전량 permissive 실측·prebuilt로 빌드 리스크 부재·RH-B2 위반 아님(경로 분리 시)·pdf.js 생태계 표준).

## 5. tesseract.js runtime finding (핵심 질문 3·6)

- **준비·실행 방식 성립**: `createWorker(lang, 1(LSTM), { langPath: <로컬 traineddata 폴더>, gzip: false,
  cachePath: <로컬> })` — 전 경로 로컬 파일, 실행 중 네트워크 불요(§6에서 차단 하 완주로 증명).
- **실측(합성 fixture — 클린 텍스트 기준)**:

| 단계 | 실측 |
|---|---|
| worker init | 0.20–0.32 s/worker |
| eng recognize 300dpi | 1.38–1.46 s/페이지 (confidence 90) |
| eng recognize 150dpi | 0.55 s/페이지 (confidence 93 — 클린 합성 한정, 실 스캔 일반화 금지) |
| kor recognize (캔버스 합성 한국어) | 0.37 s (confidence 92 — 3문장 완전 인식: "지속가능경영보고서 온실가스 배출량…") |
| 결정성 | 동일 입력 2회 → text SHA-256 동일 |
| 메모리 | 메인 프로세스 rss 피크 ~313 MB (worker 프로세스 별도 미측정 — 한계) |

- **worker 재사용 권고**: 이번 spike는 OCR 호출마다 createWorker(6 worker 생성)했다 — 4L은 **batch 단위 worker
  재사용**으로 init(~0.3s/회)을 상각해야 한다.
- **page cap/batch/timeout 초기 기본값 제안(질문 6 — 4L에서 조정 가능해야 하며, 합성 fixture 한계 명시)**:
  합성 기준 raster+OCR ≈ 2s/페이지(300dpi). 실 스캔은 노이즈·잉크밀도로 더 느릴 수 있다(Gate D는 실 스캔 9p
  완주 전례만 있고 페이지당 시간 미기록). 제안: **per-page timeout 120s / batch 5페이지(worker 재사용 단위) /
  page cap 기본 50p per 승인(초과 시 명시 재확인) / DPI 기본 300(Gate D 전례), 대형 문서용 150 옵션**(합성에서
  품질 동등·3–4× 고속 — 실 스캔 재검증 전 기본값 승격 금지). 실 스캔 대규모 실측은 4L 구현 후 evidence 항목.

## 6. no-egress finding (핵심 질문 5)

- **실행 단계 전체를 기존 `nethook.cjs`(block) 하에서 완주**: 합성 PDF 생성 → 300/150dpi 래스터 6페이지 →
  OCR 7회(eng×6·kor×1) 전 과정 →
  `[NETHOOK-SUMMARY] mode=block observedTotal=0 egressAttempts=0 workersCreated=6` — **egress 0 + worker_threads
  전파 실관측**(tesseract.js worker 6개 전부 훅 아래).
- **control run**: 동일 훅 하에서 원격 DNS 시도(`blocked.invalid`) → **발신 전 차단**(`NETHOOK_BLOCKED dns.lookup`),
  `egressAttempts=1` 기록 — 차단 장치가 실제로 동작함을 대조 증명.
- **prep↔run 분리 실증**: §2의 다운로드는 승인 하 prep 단계에서만 발생·기록됐고, 실행은 위와 같이 차단 하 완주.
- **한계(정직 표기)**: 프로세스(Node 런타임) 레벨 검증이며 OS/커널 방화벽이 아니다(dgram·child_process·native raw
  syscall 범위 밖 — 기존 nethook 문서화된 한계와 동일). native skia 래스터가 이 한계 안에서 동작하는 것은 관측
  사실이나, native 코드의 raw syscall 가능성 자체는 Gate B 재검토에서 다룰 항목이다.

## 7. Router-mediated PDF 실행 evidence (C2N4J-OBS-01 종결)

2N-4J 리뷰 observation("router 경유 실 PDF Kordoc evidence 부재")을 이번 사이클에서 닫았다 — **기존 홈
tool-cache의 kordoc@3.13.0을 그대로 사용(재설치 0)**, 입력은 이 사이클에서 생성한 합성 3p PDF:

- `document_intake_router.cjs <합성 PDF> --check` → exit 0, "Kordoc 3.13.0: 준비됨" + PDF 승인 문구 표시.
- `--approve-run --evidence-mode` → **exit 0**, `synthetic_3p.intake.json` 생성: `fileType=pdf`, `pageCount=3`,
  `pageQuality[].textChars=140`·`needsOcr=false`(3페이지), `qualitySummary.ocrCandidatePages=[]` —
  **page-set OCR selector가 소비할 신호가 실제 PDF 경로에서 산출됨을 확인**. run_log:
  `hook_observed=true, egress_attempts=0, no_egress_verified=true`(evidence 모드).
- 산출 intake를 기존 ingest 경계에 투입: `build_dei_candidate()` **rc 0** — DEI_VERSION "1", 12 blocks,
  `p.<n> · bbox≈…` 위치 힌트 생성. **router→Kordoc→intake→기존 DEI 계약 무변경 합류**의 전 체인 실증.
- 부수 기록: 이 실행으로 홈 tool-cache의 `run_log.jsonl`/`approvals.json`에 항목이 추가됐다(설계된 정상 동작 —
  repo 밖 로그).

## 8. Artifact / contamination finding (핵심 질문 7)

- **생성 위치**: 전부 repo 밖 임시 작업 폴더(§1)와 repo 밖 홈 tool-cache 로그. repo 내부 생성물 0.
- **cleanup 실증**: 종료 시 작업 폴더 **전체 삭제**(node_modules 123MB + traineddata 5.6MB + work 1.1MB —
  합성 PDF·래스터 PNG 6장·한국어 샘플 PNG·OCR cache·results.json·prep 로그 포함). 삭제 후 부재 확인.
- **repo 오염 스캔**: `git status --short` clean(0건), 신규 node_modules/package.json/package-lock/*.png/
  *.traineddata/*.zip/*.intake.json/*.ocr_text.json 탐색 0건.
- **`*.png` 전역 ignore**: 이번에 **추가하지 않음**(2N-4I 결정 유지). 근거 — 1차 방어는 repo 밖 생성이며 이번
  사이클로 실증됐다. 전역 ignore는 향후 정당한 문서 자산(다이어그램 등)까지 오차단하는 부작용이 있다.
  recommendation: 4L에서 ① out-dir(repo 밖) 정책 강제 + ② cleanup/오염 스캔 테스트를 구현 요건으로 넣고,
  그래도 필요하면 전역이 아닌 좁은 패턴(예: `*_raster_p*.png` 규약 명명)을 검토.

## 9. 검증 수행 내역

- 실행: npm view(메타데이터)·npm install(scratch prefix)·traineddata curl+sha256sum·license/native 인벤토리 스크립트·
  pipeline.mjs(래스터+OCR — nethook block 하)·control run·router --check/--approve-run·build_dei_candidate 합류 확인.
- cleanup 후: `git diff --check` PASS(clean)·`git status --short` clean·금지 파일 신규 0(§8).
- 이번 커밋 대상: 본 evidence 문서 + `docs/current_status.md` 최소 갱신(문서만).

## 10. 핵심 질문 8 — 2N-4L로 넘어가도 되는가

**넘어가도 된다(전제 조건부)** — Claude 판단이며 최종 판정은 Codex 리뷰. 근거: runtime 성립(§5)·rasterizer 실측
성립(§4)·no-egress 분리 실증(§6)·공급망 pin/hash 확보(§3)·artifact 방어 실증(§8)·router 체인 실증(§7).
**전제 조건**: ① native(@napi-rs/canvas skia) 수용에 대한 **Gate B 재검토**가 4L 제품 병합 전에 완료될 것,
② 4L 구현에 silent-blank 방어(§4)·worker 재사용·bounded 실행(§5 제안값)·원자적 ocr_text.json·Node/Python
hash parity가 요건으로 들어갈 것. Gate B 재검토가 native를 기각하면 OCR 래스터 경로는 다시 gated로 되돌린다
(전략 채택 D91은 구현 강행을 의미하지 않음).

## Final Report

- **status/verdict**: **EVIDENCE COMPLETE — 2N-4L READY(조건부)** (Claude Code evidence — 최종 PASS/FAIL은 Codex 리뷰 대상)
- **reviewed base commit**: `e46b7afd18f9e43dd4a67b483eefff1d991efb9a`
- **evidence summary**: tesseract.js 7.0.0(+core 7.0.0 자체 pin — Gate D 조합 재현) + pdfjs-dist 4.10.38 +
  @napi-rs/canvas 0.1.100(pdf.js optional 해소) 설치 실측(16 pkg 전부 permissive), traineddata 제3 출처 hash가
  Gate D 기록과 **전체 일치**, 합성 3p PDF → 300/150dpi 래스터 → eng/kor OCR 파이프라인이 **nethook block 하
  egress 0·worker 전파 6**으로 완주(결정성 2회 동일), control run 차단 실증, router 경유 실 Kordoc PDF 판독
  (no_egress_verified=true) → 기존 DEI 합류 rc 0, 전 산출물 repo 밖 생성·전량 삭제·repo 오염 0.
- **rasterizer finding**: 후보 = pdfjs-dist+@napi-rs/canvas(생태계 표준·MIT·prebuilt native 1개 sha256 `0f76fb06…`) —
  **채택 선언 아님, Gate B 재검토 필요**. PyMuPDF는 AGPL로 제품 경로 배제 유지. **silent-blank 함정 실측**
  (standardFontDataUrl 미지정 → 무오류 백지) + 해소법·ink-coverage 가드 요건 도출. 300dpi ~0.44s/p·150dpi ~0.12s/p.
- **tesseract.js/traineddata finding**: 전 경로 로컬 실행 성립(langPath/gzip:false/cachePath), eng 300dpi ~1.4s/p
  conf 90·kor conf 92 완전 인식·결정성 동일, traineddata eng `7d4322bd…`(4,113,088B)/kor `6b85e11d…`(1,677,415B)
  raw.githubusercontent.com 출처 분리 기록. OCR tool-cache는 Kordoc 항목과 **분리**(optional 정책 상반) 권고.
- **no-egress finding**: prep(기록된 다운로드 2건)↔run(block 하 완주 egressAttempts=0·workersCreated=6) 분리 실증 +
  control 차단 실증. 한계: 프로세스 레벨(기존 nethook 한계 동일) — native raw syscall은 Gate B 항목.
- **artifact/contamination finding**: 전부 repo 밖 생성·전량 삭제 실증, repo 스캔 clean, `*.png` 전역 ignore
  미추가(부작용 근거 기록 — 4L에서 out-dir 정책+cleanup 테스트로 방어).
- **2N-4L readiness judgment**: **진행 가능(조건부)** — §10.
- **required fixes before 2N-4L**: 없음(코드 결함 없음). 단 **선행 결정 1건**: @napi-rs/canvas native 수용에 대한
  Gate B 재검토(사용자/Codex — 4L 제품 병합 전).
- **carry-forward to 2N-4L**: pin 세트(tesseract.js@7.0.0·pdfjs-dist@4.10.38·@napi-rs/canvas@0.1.100·traineddata
  full hash 2건·native binary hash) / 로컬 standardFontDataUrl 고정 + ink-coverage 가드 / worker 재사용 batch /
  bounded 기본값 제안(timeout 120s/p·batch 5p·cap 50p·DPI 300 기본+150 옵션) / OCR 전용 tool-cache 항목 분리
  (U7 승인 분리·traineddata 제3 출처 고지) / 원자적 ocr_text.json + Node/Python output_sha256 golden parity /
  out-dir 정책·cleanup 테스트 / 실 스캔 페이지당 시간 실측(기본값 확정용).
- **carry-forward to 2N-4M**: quickstart 텍스트 PDF 행·OCR 관련 문구 일괄 갱신(구현 리뷰 후), ladder 표현
  ("core는 자동 실행하지 않음 / 승인 기반 로컬 runner가 실행 가능"), no-overclaim 재점검, 이 evidence의
  기본값이 실 구현과 일치하는지 대조.
- **verification performed**: §9 (설치/다운로드/파이프라인/control/router/DEI 합류 + cleanup 후 git diff --check·
  status·금지 파일 스캔 clean).
- **scope compliance**: 제품 코드 병합 0·router/runner/ingest/schema/Skill 변경 0·2N-4L 착수 0·2N-5 실행 0·
  submission.zip 0·repo 내 package/lock/node_modules/binary/raster/OCR artifact 커밋 0·provider finalization/
  OCR support complete/L2/L3 complete 선언 없음. Kordoc 재설치 없음(기존 tool-cache 사용).
- **recommendation**: Codex 2N-4K evidence review → 병행/직후 **Gate B 재검토 결정**(native skia 수용 여부) →
  통과 시 2N-4L page-set OCR 최소 구현 착수. Gate B 기각 시 OCR 래스터 경로 gated 회귀 + 2N-5 재진입 재판단.
