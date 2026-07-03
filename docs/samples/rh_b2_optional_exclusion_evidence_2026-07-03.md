# RH-B2 Evidence — Optional/Native Exclusion for v1 Text-PDF Path — 2026-07-03

> Residual Hardening 항목 **RH-B2**(Version Strategy §Residual / Gate B `C2I3B-GATEB-MIN-02`) 종결 evidence. 사용자 승인 하 **repo 밖 임시 디렉터리**에서 수행.
> 로컬 경로·계정·회사명·파일명은 일반화(유형1/2)·`[REDACTED_LOCAL_PATH]`. `node_modules`·lock·raw 산출물은 **repo 미커밋**. **형식 법률의견 아님.** OCR 미실행. 상위 규칙 `AGENTS.md`·`docs/operating_principles.md`.

## 판정: **PASS** — v1 text-PDF 경로는 optional/native 없이 동작하며 산출물이 동일하다

`--omit=optional` 설치(native/OCR 계열 미설치)에서 유형1·유형2 파싱이 성공했고, 산출물 4개(JSON·Markdown ×2 유형)가 **Gate A evidence 해시와 바이트 단위로 일치**했다. → optional/native 패키지는 v1 텍스트 경로 산출물에 **영향이 없다**(미로드·불필요).

## 1. 실행 메타데이터 (Codex C2L-MIN-01 반영)

- 실행자(observer): Claude Code (작업 수행자)
- 실행 시각(UTC): 2026-07-03T08:29:55Z
- 환경: Windows / Node **v24.16.0** / npm **11.13.0**
- 위치: repo 밖 임시 작업 디렉터리(`[REDACTED_LOCAL_PATH]`), 신규 클린 설치
- 검증 조합: **kordoc@3.8.2 + pdfjs-dist@4.10.38** (Version Strategy V1/V2)

## 2. 설치 태세 (`--omit=optional`)

- **명령(sanitized)**: `npm install kordoc@3.8.2 pdfjs-dist@4.10.38 --omit=optional`
- 결과: **119 packages added, 0 vulnerabilities**(전체 설치 165 대비 optional/extra 48 제외).
- **native/optional 계열 부재 확인**(모두 absent): `sharp`, `onnxruntime-node`, `@hyzyla/pdfium`, `@napi-rs/canvas`, `@img/sharp-win32-x64`.
- **native 바이너리 스캔**: `find node_modules -name "*.node"` → **0건**.

## 3. 파싱 + 결정성 (module/native-load 관측 겸함)

- **명령(sanitized)**: `node node_modules/kordoc/dist/cli.js <유형N> --format json|markdown -o <out> --silent`
- 결과: 유형1·유형2 × (JSON·Markdown) = **4/4 성공(exit 0)**. native 미설치 상태에서 정상 완주 → 텍스트 경로가 native 모듈을 **요구·로드하지 않음**을 실증.

| 산출물 | 포맷 | SHA-256(20) | Gate A 대비 |
|---|---|---|---|
| 유형1 | JSON | `eeddfb595171b9bfdc1c` | **일치** |
| 유형1 | Markdown | `953443f4a31fadbe504a` | **일치** |
| 유형2 | JSON | `1c7d8ec90cd9aaf434c9` | **일치** |
| 유형2 | Markdown | `6095b8814ba86a1890f4` | **일치** |

- 4개 해시 모두 `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`의 값과 **바이트 단위 동일** → optional/native 제외가 산출물을 바꾸지 않음(결정성·무영향 동시 확인).

## 4. RH-B2가 닫는 것 / 닫지 않는 것 (경계)

- **닫음**: v1 text-PDF 파싱 태세에서 **optional/native(LGPL 포함) 제외가 실현 가능하고 산출물에 무영향**임을 실증 → Version Strategy V8(`--omit=optional`) 설치 태세의 근거. Gate B가 격리한 native/LGPL의 **무단 재유입 없음**을 L1 구현 전에 확인.
- **닫지 않음**: OCR 준비/실행(Gate D 대상), 스캔 PDF 처리(L2+), 클라우드/self-host(Gate C/C-SH). 본 evidence는 **OCR readiness나 Gate D readiness를 주장하지 않는다.**

## 5. Redaction / artifact 처리

- 로컬 절대경로·계정·host·회사명·식별 파일명·토큰·API key **노출 없음**(유형 라벨/`[REDACTED_LOCAL_PATH]`).
- `node_modules`·lock·파싱 산출물(JSON/MD)은 **repo 미포함**(임시 디렉터리에서만 생성). 커밋 전 재스캔: Y.
