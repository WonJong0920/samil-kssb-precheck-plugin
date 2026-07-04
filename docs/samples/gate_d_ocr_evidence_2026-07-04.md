# Gate D — Local OCR Provider Execution Evidence — 2026-07-04

> **성격**: Cycle 2L-3B **Gate D execution evidence cycle**. 로컬 OCR provider **실행 가능성**을 증거로 검증한다(L2/L3 구현 아님).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 기준: `docs/planning/cycle2l_3_gate_d_preflight_plan.md`(§1 준비 egress↔파싱 no-egress 분리·§3 provider 기준·§4 evidence 템플릿·§5 PASS/FAIL), Gate A 방식(`docs/samples/gate_a_no_egress_evidence_2026-07-03.md`).
> **최종 Gate D PASS/FAIL 판정은 Codex Review가 한다.** 본 문서는 **execution evidence + provisional outcome**만 기록한다(Claude Code는 판정하지 않음).
> 모든 실행은 **repo 밖 임시 디렉터리 `[REDACTED_LOCAL_PATH]`**(사용자 로컬)에서 수행. sample PDF·렌더 PNG·OCR 원문·모델/traineddata·venv·node_modules는 **repo 미커밋**. 본문에 OCR 원문을 붙이지 않는다(집계·hash만).

## Summary

Gate D preflight 기준에 따라 **선별 Type 3 샘플(ver2 9p)**에 대해 로컬 OCR provider 실행을 증거화했다. 후보 2종을 평가해
**onnxruntime 계열(rapidocr-onnxruntime)은 native DLL 초기화 실패로 이 Windows 호스트에서 실행 불가 → 기각**, **tesseract.js(순수 JS+WASM, native 0)를 선정**해 실행했다.
결과(증거 수준): **파싱 단계 no-egress**(Gate A 방식 훅 + worker thread 확장, control 검증, 파싱 중 outbound 0) · **결정성**(3회 output hash 바이트 동일) ·
**license/native 통과**(provider 트리 13패키지 전부 permissive, native 바이너리 0) · **비민감 Type 3 샘플**(사용자 PII 없음·공식 출처 확인) · **artifact 미커밋**(repo tracked 0).
준비 단계는 egress 발생(허용·기록)이며 파싱 단계와 분리했다. **provisional outcome = all criteria observed**, 단 **최종 verdict는 Codex Review 보류**.

## Selected sample

| 항목 | 값 |
|---|---|
| sanitized sample name | 유형3 스캔 전용 PDF — ver2 selected sample (9p) |
| 경로 | `[REDACTED_LOCAL_PATH]` (repo 밖) |
| expected SHA-256 | `238de8be151da74023a5e1287e104a30a19c7c7a40aaa80749ceeb3cc843c5a3` |
| observed SHA-256 | `238de8be151da74023a5e1287e104a30a19c7c7a40aaa80749ceeb3cc843c5a3` → **일치(MATCH)** |
| page count | expected 9 / observed **9** → 일치 |
| file size | 1,156,885 bytes |
| encrypted | 아니오 |
| text layer | 0(스캔 전용) — 선별 검토 문서에서 두 도구 교차검증 |
| **user PII confirmation** | 사용자 확인: 9페이지에 **PII 없음** |
| **official-source confirmation** | 사용자 확인: **공식 홈페이지에서 다운로드** |
| artifact non-commit status | 원본/ver2 PDF **repo 미커밋**(`*.pdf` gitignore, tracked=0), 본 문서엔 hash·집계만 |

> hash·page count가 기대값과 달랐다면 OCR을 실행하지 않고 중단하는 절차였다. **둘 다 일치**하여 진행함.

## Provider selection

### candidates checked (preflight §3 기준)
1. **rapidocr-onnxruntime**(로컬 ONNX/onnxruntime-python) — 평가·설치함(기각, 아래).
2. **tesseract.js**(Node, 순수 JS+WASM) — **선정**.
3. **Kordoc `--formula-ocr`** — 수식 OCR 중심(일반 텍스트 OCR 부적합) + ~155MB 모델 다운로드 + onnxruntime-node native(RH-B2 격리분 재유입). **일반 OCR 후보에서 제외**.
4. **native Tesseract 바이너리(pytesseract)** — 미설치(시스템 인스톨러/관리자 권한 필요), child-process 모델이라 no-egress 증명 약함. **미사용**.

### selected provider
- **tesseract.js 7.0.0 + tesseract.js-core 7.0.0**(Apache-2.0), 언어데이터 **tessdata_fast `kor`+`eng`**(Apache-2.0), OEM=1(LSTM).

### selection rationale
- **local/offline**·**순수 JS+WASM(native 바이너리 0)** → onnxruntime DLL 실패 회피 + **RH-B2 native 재유입 없음**.
- **license permissive**(트리 전부 Apache-2.0/MIT/BSD-2), **deterministic**, **Windows(Node) 실행 가능**.
- **준비 egress ↔ 파싱 no-egress 분리 용이**(core/lang 로컬 캐시 후 오프라인 파싱), no-egress를 **Gate A 방식 Node 훅**으로 검증 가능(worker thread까지 확장).

### rejected candidates and reasons
- **rapidocr-onnxruntime 1.2.3 / onnxruntime 1.27.0**: repo 밖 venv 설치는 성공했으나 `import onnxruntime`에서 **native DLL 초기화 실패**(`DLL load failed ... onnxruntime_pybind11_state: DLL 초기화 루틴을 실행할 수 없습니다`). VC++ 런타임 DLL은 System32에 present임에도 실패 → 이 호스트에서 **파싱 실행 불가**. preflight §3 #4(native dependency)·#7(Windows 실행성) 리스크의 실제 사례. **기각**(시스템 런타임 수정은 이번 범위 밖).
- **Kordoc `--formula-ocr`**: 수식 중심·모델 다운로드·native 재유입 → 일반 스캔 텍스트 OCR 부적합. **제외**.

## Preparation phase (egress occurred — allowed, recorded)

> 모두 **repo 밖 임시 디렉터리**에서 수행. **project package.json/lock/venv/source tree 무변경**(repo에 아무 것도 추가 안 함). 준비 egress와 파싱 no-egress를 분리.

- **selected(tesseract.js)** — `npm install tesseract.js tesseract.js-core` (source: **registry.npmjs.org**, 13 packages). 언어데이터 다운로드(source: **raw.githubusercontent.com/tesseract-ocr/tessdata_fast**):
  - `eng.traineddata` 4,113,088 B, sha256 `7d4322bd2a774972…`
  - `kor.traineddata` 1,677,415 B, sha256 `6b85e11d9bbf0786…`
  - 시각(UTC): ~2026-07-04T05:34Z. core(wasm)+lang을 **로컬 경로**에 두어 파싱 단계 무-네트워크화.
- **rejected(rapidocr-onnxruntime)** — `pip install rapidocr-onnxruntime`(source: **files.pythonhosted.org/PyPI**), 시각 ~2026-07-04T05:23–05:24Z. 대표 해시:
  - `rapidocr-onnxruntime==1.2.3` sha256 `c707d3a6eb72d131…`, `onnxruntime==1.27.0` sha256 `49e416be0d717338…`, `opencv-python==5.0.0.93` sha256 `f90ba04b8f73bc5c…`, `numpy==2.5.0` sha256 `ebb81d9d5443e030…`. 모델은 wheel 내장(별도 모델 다운로드 없음). → 이후 native DLL 실패로 파싱 미실행.
- 준비 단계 outbound: **발생(Y)** — PyPI/npm/GitHub raw. 파싱 단계와 **문서·실행상 분리**.

## Parsing / OCR execution phase (no-egress)

- **렌더링(로컬, 무-네트워크)**: ver2 9페이지를 **PyMuPDF로 300 DPI PNG 래스터화**(고정 matrix→재현 가능), repo 밖 임시 디렉터리. (OCR 입력용, 커밋 안 함.)
- **no-egress control method**: **Node 런타임 훅**(`nethook.cjs`, `--require` preload) — `dns.lookup/resolve*`·`net.Socket.connect`·`tls.connect`·`http(s).request/get` 인터셉트, **block 모드=비-loopback 시도 기록 후 throw(패킷 미전송)**. 추가로 **`worker_threads.Worker`를 패치**해 tesseract worker thread에도 훅을 전파(execArgv `--require`).
- **control verification**:
  | control | 방법 | 결과 |
  |---|---|---|
  | C1 monitor | 의도적 loopback `127.0.0.1:9` | `observedTotal=1` → 훅이 시도 포착(hook active) |
  | C2 block | 의도적 원격 `8.8.8.8:53` | `NETHOOK_BLOCKED`, `egressAttempts=1` → **원격 차단 실작동** |
  | C3 block loopback | `127.0.0.1:9` | `egressAttempts=0` → loopback 허용 |
  | **worker 커버리지** | nethook 로드 후 생성한 worker에서 `8.8.8.8:53` | `WORKER_BLOCKED:NETHOOK_BLOCKED`(hookActive=true) → **worker thread도 차단됨** |
- **OCR command (sanitized)**: `NETHOOK_MODE=block NODE_OPTIONS=--require=<nethook> node ocr_tess.cjs <pages_dir> <out>` (langs `kor+eng`, OEM=1, **corePath/langPath=로컬**, cacheMethod none).
- **outbound attempt observation**: main thread `observedTotal=0`·`egressAttempts=0`; tesseract worker는 **패치된 HookedWorker로 생성**(`WORKERS_CREATED_VIA_HOOK=1` → worker가 훅과 함께 기동). **OCR 성공적으로 완주**.
  - 논리적 폐포: **block 모드에서 비-loopback connect는 throw→OCR 중단**을 유발한다. worker가 훅 하에 있고(위 커버리지 control + WORKERS_CREATED=1) OCR이 **성공·결정적으로 완주**했으므로, **두 스레드 모두 파싱 중 egress 시도 0**.
- **한계(정직·Gate A §3와 동류)**: 본 검증은 **Node 런타임(JS) 레벨**이다. native addon의 raw syscall이 Node net을 우회하면 미포함이나, **선정 provider는 순수 JS+WASM(native addon 0)**이고 WASM의 소켓 접근은 JS(net)를 경유하므로 훅 대상이다. **OS/커널 방화벽 레벨 재확인은 비차단 보강**(Gate A와 동일).

## Native / binary / license review

- **provider version**: tesseract.js 7.0.0 / tesseract.js-core 7.0.0. **language data**: tessdata_fast `eng`/`kor`(fast).
- **native binary/.node/.exe/.dll**: **0건**(provider 트리 스캔). `.wasm` 6건(WebAssembly, native machine-code addon 아님).
- **license**: provider 트리 **13패키지 전부 permissive** — Apache-2.0(tesseract.js, tesseract.js-core, idb-keyval, wasm-feature-detect) / MIT(bmp-js, is-url, node-fetch, opencollective-postinstall, regenerator-runtime, tr46, whatwg-url, zlibjs) / BSD-2-Clause(webidl-conversions). **copyleft/LGPL/unknown 0**. traineddata **Apache-2.0**.
- **provenance**: npm registry + 공식 tessdata_fast repo(해시 기록).
- **RH-B2 관계**: 선정 provider는 **native 바이너리 미도입** → RH-B2가 격리한 optional/native(onnxruntime-node·sharp·pdfium·LGPL) **재유입 없음**. (기각된 onnxruntime 경로는 native 재유입 + 실패였음.)
- **repo/package/submission 포함 여부**: provider는 **repo 밖 node_modules**에만 존재. project package/lock **미변경**, submission 번들 **미포함**, 커밋 0. opt-in/local posture 유지.

## Output / determinism

- **output text SHA-256 run1**: `546926ecbb43ea021cce0b1b6c754f176aa8e6bade830e01629e49f7c79deccc`
- **run2**: 동일 · **run3**: 동일 → **3회 산출 파일 바이트 동일**.
- **deterministic 여부**: **예(YES)**.
- **OCR output handling**: 산출물은 **repo 밖 임시 디렉터리에만** 저장, **커밋 안 함**. 기록은 집계·hash만:
  - 총 텍스트 11,852자(페이지 헤더 포함 파일 12,004자). 페이지별 char: p1 1475 / p2 732 / p3 1547 / p4 1482 / p5 1423 / p6 1272 / p7 674 / p8 1388 / p9 1859.
  - 언어 구성(내용-무관 집계): 한글 4,817 · 라틴 1,151 · 숫자 542 · 비공백 라인 260 → **한국어 위주 문서 인식**. (OCR 원문 미기재.)
- **recognition 품질은 게이트 기준 아님**: tessdata_fast `kor`는 fast 모델로 정확도를 주장하지 않는다. Gate D는 **실행 가능성·no-egress·결정성·license**를 본다(정확도 아님).

## Redaction / artifact policy

- 로컬 절대경로·계정·host별 식별정보·토큰·API key·private key **노출 없음**(모두 `[REDACTED_LOCAL_PATH]`/일반화). 커밋 전 재스캔: Y.
- ver2 PDF·렌더 PNG·OCR 텍스트·모델/traineddata·venv·node_modules → **repo 밖에만**. repo **tracked artifact 0건**, 작업트리 clean.
- `.gitignore` `*.pdf`/`*.PDF` 방어 유지.

## Residual risk

- no-egress는 **Node 런타임(main+worker thread) 레벨** 검증 — OS/커널 방화벽 레벨 아님(비차단 보강, Gate A와 동일).
- **정확도 미평가**: 한국어 fast 모델 인식 품질은 게이트 대상 아님·미주장. 하류 사용 시 **DEI candidate/검수 신호로만**(판정 미생성, renderer/validator 직접 유입 금지).
- **provider 이식성**: onnxruntime 계열은 이 호스트 native DLL 실패 → 다른 호스트/엔진 채택 시 재검증 필요. 기각된 rapidocr/onnxruntime venv는 repo 밖에 남음(무해·미커밋, 폐기 가능).

## Provisional execution outcome

- **all criteria observed** (evidence 수준): 파싱 no-egress(control 검증·outbound 0·worker 포함) · deterministic(3회 동일) · license/native(permissive·native 0) · 비민감 Type 3(PII 없음·공식 출처) · artifact redaction/미커밋.
- 준비 단계 egress는 예상·허용 범위이며 파싱과 분리됨. 후보 1종(onnxruntime)은 native 실패로 기각, 선정 provider(tesseract.js)가 전 기준 충족.
- **최종 Gate D verdict(PASS/CONDITIONAL/FAIL)는 Codex Review 보류.** (운영 원칙: Claude Code는 PASS/FAIL 판정 안 함.)

## Recommended next step

- **Codex 독립 evidence review** 필요. Codex evidence-review **PASS + 사용자/ChatGPT 승인 전까지 L2 구현 금지**(L2/L3 = Gate D-blocked 유지).
- OCR 결과는 **DEI candidate/검수 신호로만** 합류(판정 미생성). 이후 L2 설계 시 provider 이식성·정확도·언어모델 선정은 별도 검토.
