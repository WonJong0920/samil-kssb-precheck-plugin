# Cycle 2N-1A — HWP-first Scope Decision

> **성격**: Codex 2N-1 **CONDITIONAL PASS**(C2N1-MAJ-01) 조건 처리를 위한 **scope decision 문서**(구현·설치·실행 없음).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: `docs/reviews/codex_cycle2n_1_runner_provider_ux_design_review.md`,
> 2N-0B/2N-0B-A 설계(§7.1 포함), 2N-0A blindspot pass. repo 문서와의 충돌: **발견되지 않음**(2N-0B 설계의 권고 구조를 그대로 좁히는 결정).

## 1. 목적

2N-2를 "full HWP+OCR+portable Node 구현"이 아니라 **HWP-first narrow implementation**으로 좁히는 결정을 문서화하고,
U1~U8 중 HWP-first에 필요한 것은 확정, OCR/rasterizer/portable Node 관련은 **명시적 scope-out(gated subpath)**으로 분리한다.

## 2. Codex 2N-1 조건 요약

- verdict: **CONDITIONAL PASS** (Critical 0 / Major 1 / Minor 0 / Observation 2 / AVR 7).
- **C2N1-MAJ-01**: full 2N-2 착수는 U1~U8 미결·portable Node B 정책·native rasterizer 수용/Gate B 범위·nethook 사양에 종속 —
  **full HWP+OCR+portable Node 구현은 blocking / 문서화된 HWP-only slice는 non-blocking.**
- 권고 경로: HWP-first runner UX + tool-cache/check/approval skeleton, OCR rasterizer·portable Node는 gated subpath 유지.
- C2N1-OBS-01(nethook 미커밋 — 2N-2 테스트로 증명 필요), C2N1-OBS-02(rasterizer 미결 — OCR 경로에만 blocking).

## 3. 2N-2 Scope Decision

**2N-2 = HWP-first narrow implementation으로 확정한다.**
Kordoc 기반 HWP/HWPX/DOCX 구조·텍스트 assisted path만 구현하며, OCR 계열(tesseract.js·traineddata·rasterizer)과 portable Node는
**gated subpath로 명시 분리**(각 게이트 해소 전 착수 금지). 선택 근거: HWP 경로는 Gate A/B/D 계열 evidence로 전 구간(파싱 no-egress 10/10·
결정성·`--omit=optional` native 0·HWP v5 커버리지)이 기검증된 **최저 리스크 슬라이스**이고, 미결 게이트(U8 rasterizer·U2-B portable Node)에 의존하지 않는다.

## 4. U1~U8 HWP-first 결정표

| # | 결정 | 상태 |
|---|---|---|
| **U1 설치 위치** | repo 밖 전용 tool-cache — 기본 후보 `<사용자 홈>/.samil-kssb-precheck/tools/`. repo 내부 node_modules·repo package.json·npm global·npx **미사용**. HWP-first에서는 **`kordoc@<pin>`(3.13.0 + pdfjs-dist@4.10.38, `--omit=optional` 필수)만** 설치 대상 | **확정** |
| **U2 Node 부재** | HWP-first에서는 **portable Node 미구현**. 시스템 Node/npm 존재·사용 가능 여부만 확인 → 부재 시 **설치 안내 + baseline/text-only 계속**. B안(portable Node)은 설계 후보로 유지하되 **2N-2 범위 밖**(gated). OS installer·PATH 영구 수정·관리자 권한은 계속 배제 | **확정(A안) / B안 gated** |
| **U3 승인 단위·기록** | **설치 승인**(Kordoc 도구·버전 단위 1회) ↔ **실행 승인**(세션 또는 실행 단위) 분리. approval marker는 repo 밖 tool-cache 내부 기록. 거부 시 baseline/text-only 계속 + §7 한계 문구 | **확정** |
| **U4 runner 커밋·zip** | HWP-first runner **source는 repo 커밋 방향(source-only)**. tool-cache·node_modules·package-lock·생성 artifact는 commit 금지. submission.zip 포함은 **허용 후보**로 두되 packaging 문구에 "기본 비실행 / 사용자 승인 필요 / repo 밖 tool-cache 사용" 명시 필요 | **확정(커밋) / zip 포함은 후보** |
| **U5 provider명 정책** | **3층 정책 채택**: 승인 대화=Kordoc 명시 / 사용자 보고서·user_summary=provider명 금지("로컬 판독 도구" 수준, §7) / 내부 evidence·provenance=provider·version·hash·no-egress 명시 | **확정** |
| **U6 결정성 범위** | 일반 UX=1회 실행 + hash/provenance 기록. **2회 실행 determinism은 evidence/검증 모드 한정**(2N-4·Codex 검증 시 생성) | **확정** |
| **U7 경로 승인 분리** | **분리 확정.** 2N-2는 HWP 경로만 구현(Kordoc check/install/approval/run). OCR 경로(tesseract.js·traineddata·rasterizer)는 전부 2N-2 범위 밖 — **OCR 관련 승인 대화는 이번 구현에서 표시하지 않음** | **확정** |
| **U8 rasterizer** | **HWP-first 범위 밖 명시.** native rasterizer 수용 여부는 **미결정 유지**. @napi-rs/canvas spike·pure JS polyfill 조사·Gate B 재검토는 OCR 경로 착수 전 별도 단계. HWP-first 구현을 막지 않음(C2N1-OBS-02 정합) | **scope-out(gated)** |

## 5. 2N-2 포함 범위

- Kordoc 기반 **HWP/HWPX/DOCX 구조·텍스트 assisted path**(스캔/이미지 OCR 아님).
- repo 밖 tool-cache(§U1 레이아웃) + **Kordoc check / install / approval / run skeleton**.
- 사용자 승인 UX(한국어 — 도구·버전·출처·위치·용량·egress 고지, 거부=정상 경로).
- **준비 egress 기록**(prep_egress_log) ↔ **실행 no-egress 훅**(nethook 재작성 사양 반영 — §7-1).
- `--out-dir` 필수 + 중간 artifact **`.gitignore` 방어 패턴 추가**(`*.intake.json`·`*.ocr_text.json`·`*.aux_signals.json`).
- 기존 ingest boundary 연결(dei_producer/aux_scanner **무변경 소비**).
- **repo 루트 package.json 미생성 유지.** source-bound·human review·no-overclaim 유지.

## 6. 2N-2 제외 범위 (명시 scope-out)

OCR path 전체 · tesseract.js · traineddata 다운로드 · rasterizer · @napi-rs/canvas spike · pure JS canvas polyfill 조사/구현 ·
portable Node 설치 · OS installer 실행 · PATH 영구 수정 · 관리자 권한 요구 · L2 전체 완료 선언 · "OCR 지원" 표현 · provider 최종 확정.

## 7. HWP-first에도 남는 검증 조건 (Codex AVR 매핑)

1. **nethook 재작성 사양(AVR-04 — 2N-2 중, no-egress 주장 전 blocking)**: dns/net/tls/http/https 차단 + **worker_threads 전파** +
   loopback 허용/원격 차단 control + **훅 적용 실행에서만 `no_egress_verified=true`**(훅 미적용 실행은 false 또는 evidence mode fail).
2. **artifact 낙하 방지(AVR-06 — 2N-4 전 blocking)**: `--out-dir` 필수 동작, 기본 안내는 repo 밖 경로, `.gitignore` 3패턴 추가,
   생성 findings의 validator 경로 스캔 clean.
3. **Windows/UTF-8/한국어 파일명(AVR-05 — 2N-5 전 blocking)**: PowerShell 실행·경로 공백·한국어 파일명 인자·stdout/stderr UTF-8·파일 쓰기 UTF-8
   (2M-3 인코딩 사고 전례 반영 — 테스트 항목화).
4. **no-overclaim**: HWP-first 구현 후에도 L2 전체 완료·"OCR 지원"·provider finalization 선언 금지 —
   표현은 **"사용자 승인 하의 로컬 보조 실행"** 유지(plugin core는 provider를 실행하지 않음).
5. **(조건부) 런타임 재검증(AVR-07)**: 실행 Node 런타임이 Gate D 관측 환경(v24)과 다르면 no-egress·hash 기본 evidence 재확인 —
   HWP-first는 시스템 Node 사용이라 현 개발 환경에서는 동일, 상이 환경 발견 시 적용.

## 8. OCR / portable Node / rasterizer — Deferred Gates

| gated subpath | 게이트(착수 조건) | 관련 |
|---|---|---|
| **OCR path**(tesseract.js+traineddata) | rasterizer 결정 + Gate B 재검토(native 수용 시) + nethook 검증 + U8 사용자 결정 | AVR-03, OBS-02 |
| **rasterizer spike** | 사용자 승인(native 수용 여부 포함) 후 별도 단계 — 1순위 @napi-rs/canvas·2순위 pure JS polyfill 조사 | AVR-03 |
| **portable Node(U2-B)** | LTS pin·SHASUMS256 절차·win-x64 범위·AV fallback·제거 절차 확정 + 제출 정책 허용 확인 + 사용자 결정 | AVR-02 |
| (참고) Kordoc 3.15.0 재비교·OS 커널 no-egress·Gate C/C-SH·L3 | 기존 defer 유지(Codex "Items That Can Be Deferred") | — |

## 9. C2N1-MAJ-01 대응 상태

- **full HWP+OCR+portable Node 구현에 대해서는 여전히 유효**(blocking 유지 — 위 deferred gates 해소 전 착수 금지).
- **HWP-first narrowed scope에 대해서는 본 문서로 조건 대응 완료**: U1~U8을 결정(U1·U3~U7 확정, U2=A안 확정+B gated, U8=scope-out)했고,
  2N-2 범위를 HWP-only slice로 문서화했다 — Codex가 명시한 "narrower HWP-only slice is not blocked if documented" 요건 충족.
- AVR-01(결정 기록)은 본 문서로 처리. AVR-02/03은 gated 분리로 2N-2 비차단화. AVR-04/05/06(+조건부 07)은 2N-2 구현·테스트 요건으로 이관(§7).

## 10. 2N-2 구현 프롬프트 작성 시 반영할 제약

1. 범위 문장: "2N-2 = HWP-first narrow implementation — OCR/tesseract.js/traineddata/rasterizer/portable Node 금지"를 프롬프트 금지 목록에 명시.
2. §7의 AVR-04/05/06을 **테스트 요건**으로 포함(훅 control·인코딩/한국어 파일명·--out-dir/.gitignore/경로 스캔).
3. runner source 위치·구조는 2L-4A 조건 계승: `src/intake/runners/`(가칭) source-only, **core 미import 테스트**, 자동 실행 없음(무승인 실행 금지),
   Skill entrypoint 아님, repo package.json/lock 미생성.
4. Kordoc pin: `kordoc@3.13.0 + pdfjs-dist@4.10.38`, `--omit=optional` 필수, tool-cache `--prefix` 설치.
5. 승인 대화 문구는 U5 3층 정책·§7.1 고지 항목 준수(한국어), 거부·부재·실패는 baseline/text-only 수렴.
6. 기존 테스트 5종 green 유지 + 신규 runner 테스트(네트워크 미사용 합성 fixture 원칙 — 실제 설치/실행 검증은 사용자 승인 하 evidence 단계로 분리).
7. current_status/Ledger 표현: 구현 후에도 "provider execution=assisted(opt-in, user-approved)·finalization pending" 구조 유지.

## 11. 결론

2N-2는 **HWP-first narrow implementation**으로 진행한다. 필요한 결정(U1~U7)은 확정했고, 미결 게이트(U8·U2-B)는 OCR/portable Node
subpath와 함께 명시적으로 분리해 HWP-first를 막지 않게 했다. C2N1-MAJ-01은 narrowed scope에서 조건 대응 완료이며,
full scope에 대한 blocking은 deferred gates 해소 전까지 유지된다. **다음 단계 = Claude 2N-2 HWP-first implementation**(§10 제약 반영 프롬프트).
