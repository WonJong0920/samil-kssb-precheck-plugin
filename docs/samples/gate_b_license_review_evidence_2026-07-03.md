# Gate B — Transitive / Native Dependency License Review Evidence — 2026-07-03

> `docs/planning/cycle2i_3b_gateprep_execution_plan.md` §4(Gate B) 절차에 따라 **실제 수행**한 1차 의존성·license 인벤토리. 사용자 승인 하 **repo 밖 임시 디렉터리**에서 읽기전용 분석.
> 로컬 경로·계정·회사명·파일명은 일반화·`[REDACTED_LOCAL_PATH]`. raw 인벤토리 덤프·`node_modules`·분석 스크립트·lock은 **repo 미커밋**.
> **성격**: 사실 확인용 **1차 인벤토리**이며 **형식 법률 의견이 아니다**(최종 법적 판단은 별도). plugin core/schema/validator/renderer/delivery/manifest/marketplace/package 파일 **미변경**. OCR/formula/MCP/setup **미사용**. 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`.

## 판정: **PASS** (v1 text-PDF 경로)

v1 텍스트 파싱 필요 폐포는 **전부 permissive(카피레프트/네이티브/unknown 0)**. 카피레프트(LGPL)·네이티브 바이너리는 **v1 경로 밖 optional(OCR/이미지) 의존성에만** 존재하며 텍스트 파싱 시 미로드. 어댑터는 opt-in/local·미번들이므로 재배포 license 의무는 미발생(미번들 전제). 번들 시 조건은 §5에 명시.

## 0. 실행 메타데이터 (Codex C2I3B-GATEA-MIN-01 반영)

- 실행자(observer): Claude Code (작업 수행자)
- 실행 시각(UTC): 2026-07-03T03:45Z
- 도구: Node v24.16.0 / npm 11.13.0. 설치 없음(Gate A와 동일한 기존 설치본을 읽기전용 분석).
- 분석 방식(일반화 명령): repo 밖 임시 디렉터리에서 `node <inventory>.cjs` — `node_modules` 각 `package.json`의 `license`/`licenses` 필드 + `LICENSE`/`NOTICE` 파일 유무 + `.node`/`binding.gyp` 스캔으로 인벤토리 산출. 분석 스크립트·raw 인벤토리·`node_modules`는 **repo 미커밋**.
- 대상 조합: **kordoc@3.8.2 + pdfjs-dist@4.10.38** (Gate A 검증 조합).

## 1. 방법 / 폐포 정의

- **v1-required 폐포**: roots = {`kordoc`, `pdfjs-dist`}에서 각 패키지의 **`dependencies`만 재귀**(optionalDependencies·devDependencies 제외) → v1 텍스트 파싱에 실제 필요한 집합.
- 폐포 검증: Gate A에서 이 조합으로 텍스트 파싱이 성공했고, 유일 필수 peer는 `pdfjs-dist`였다(다른 optional/native 미요구) → deps-only 폐포가 실제 실행 경로와 정합.
- optional/OCR/native는 **별도 집계**(§4).
- 분류: permissive(MIT/ISC/BSD/Apache-2.0/Python-2.0/Zlib/0BSD 등) · copyleft(GPL/LGPL/AGPL/MPL/EPL/CDDL) · dual(OR, permissive 선택 가능) · unknown. 이중표현(`AND`/`OR`)은 분해 판정.

## 2. v1-required 폐포 결과 (117 패키지)

| 분류 | 개수 |
|---|---|
| permissive | 116 |
| permissive(dual, MIT 선택 가능) | 1 (`jszip` = `MIT OR GPL-3.0-or-later`) |
| **copyleft** | **0** |
| **unknown** | **0** |
| **native binary** | **0** |

- 대표 패키지: `kordoc` MIT, `pdfjs-dist` Apache-2.0, `cfb` Apache-2.0, `pako` `(MIT AND Zlib)`(둘 다 permissive), `jszip` `(MIT OR GPL-3.0-or-later)`(**MIT 선택**), `markdown-it`/`zod`/`commander`/`@xmldom/xmldom`/`@modelcontextprotocol/sdk` MIT.
- SPDX 구성: MIT 다수 + ISC + BSD-2/3-Clause + Apache-2.0 + Python-2.0(`argparse`) + Zlib(`pako`). **전부 permissive 계열.**
- **관찰(비리스크)**: 폐포에 `express`/`hono`/`@modelcontextprotocol/sdk`/`cors`/`jose` 등 **MCP 서버 계열**이 포함됨 — kordoc의 hard `dependencies`라 설치되나 **CLI 텍스트 파싱 경로에서 실행되지 않음**(v1은 CLI만 사용, MCP 서버 미기동). 모두 permissive.

## 3. LICENSE 파일 / attribution 준비도

- 117개 중 **116개가 LICENSE/NOTICE 파일 동봉**. 1개(`isarray`)만 LICENSE 파일 없음이나 `package.json`에 **MIT 선언**(SPDX 메타 존재) → 번들 시 attribution 가능(경미, 표준 MIT 텍스트로 보완).
- **Apache-2.0 패키지**(`pdfjs-dist`, `cfb`, `adler-32`, `crc-32` 등): 번들 시 **NOTICE 보존** 의무.
- MIT/BSD: 번들 시 라이선스 텍스트 보존(표준 의무).

## 4. optional / native / copyleft (v1 경로 **밖**)

- **설치되었으나 v1 폐포 밖 = 48개**(`npm install kordoc`이 optionalDependencies로 동반 설치).
- **native 바이너리(extras)**: `@hyzyla/pdfium`, `sharp`(+`@img/sharp-win32-x64`), `@napi-rs/canvas`, `onnxruntime-node` — 이미지/OCR/렌더 계열.
- **copyleft 노출(extras only)**: `@img/sharp-win32-x64` = `Apache-2.0 AND LGPL-3.0-or-later` (**LGPL**, sharp 네이티브/libvips 계열).
- **핵심**: 이들은 **v1 텍스트 파싱 경로에서 미로드**(Gate A 파싱 성공·pdfjs-dist만 필수로 확인). 디스크엔 존재하나 **실행·필수 경로 미포함**.

## 5. `submission_packaging_policy.md` 정합

- 원본 PDF = 분류 **E**(repo 미포함), `node_modules`/lock/인벤토리 덤프 = 미커밋. 어댑터는 **opt-in/local·미번들**.
- Kordoc+deps는 **사용자 로컬 설치**이며 submission.zip 재배포 대상 아님 → **재배포 license 의무(attribution/LGPL source offer) 미발생**(미번들 전제, 정책 §1·§6 경계와 정합).
- **IF 향후 번들 결정 시**(별도 승인):
  1. v1 permissive 집합의 **MIT/BSD 라이선스 텍스트 + Apache-2.0 NOTICE 보존**.
  2. **LGPL/native(sharp·onnxruntime·pdfium·canvas)는 번들 제외** → 설치 태세를 `--omit=optional`(또는 동등) 로 고정해 미유입.
  3. `submission_packaging_policy.md` §1 E-분류·§4.4 경로 스캔·§4.5 산출물 점검 준수.

## 6. 판정 근거 (PASS) — gateprep §4.4 대조

| 기준 | 결과 |
|---|---|
| v1 경로 의존성 permissive이며 의무 충족 가능 | ✔ 117/117 permissive, 116 LICENSE 동봉 |
| 제출 불가 copyleft 없음 | ✔ v1 폐포 copyleft 0 |
| native/OCR 리스크 v1 미노출 | ✔ 폐포 native 0; LGPL/native는 optional·미로드 |
| 제출 정책 정합 | ✔ 미번들·opt-in/local; 번들 시 조건 명시 |

→ **Gate B = PASS.**

**비차단 조건/후속**:
- (a) 구현 시 **`--omit=optional` 설치 태세**로 native/LGPL 미유입을 고정.
- (b) 번들 결정 시 attribution/NOTICE 수집 + LGPL/native 제외.
- (c) 본 문서는 **1차 인벤토리**이며, 실제 번들·재배포 전 **형식 법률 검토**는 제출 단계 별도.

## 7. Redaction 확인

- 로컬 절대경로·계정명·host명·회사명·식별 파일명·토큰·API key·private key **노출 없음**.
- raw 인벤토리 덤프·`node_modules`·분석 스크립트·lock 파일 **repo 미포함**(임시 디렉터리). 커밋 전 재스캔: Y.

## 8. 다음 단계

- **Gate A PASS + Gate B PASS**. 남은 gateprep 항목: **Version Strategy 확정**(`kordoc@3.8.2 + pdfjs-dist@4.10.x` pin·compat-check·fail-fast·auto-upgrade 금지).
- 구현 사이클 진입은 gateprep §9 전체 조건(Gate A·B PASS + Version 확정 + v1 scope + opt-in/local posture + 경계 불변) 충족 후 **별도 승인** 하에.
