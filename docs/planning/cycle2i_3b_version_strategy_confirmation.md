# Cycle 2I-3B — Version Strategy Confirmation + Residual Hardening Register

> **성격**: **확정/정리 문서(문서 수준)**. 구현이 아니다. Gate A PASS·Gate B PASS 이후 남은 gate인 **Version Strategy를 확정**하고,
> Gate A/B Codex Review·adapter design 흐름에서 나온 **모든 non-blocking 보강 항목을 Residual Hardening Register로 수집**한다.
> **하지 않는 것**: package/dependency 파일 추가·Kordoc 설치/재실행·PDF 재실행·OCR/formula/MCP/setup·src/tests/schema/validator/renderer/delivery/manifest/marketplace 변경·raw artifact/submission.zip 생성.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Gate A/B evidence + Codex reviews(모두 PASS).

## 0. 판정 요약

- **Version Strategy: 확정(CONFIRMED).**
- **구현 진입 기술 gate**: Gate A PASS + Gate B PASS + Version Strategy 확정 = **모두 충족.** v1 scope 유지·opt-in/local posture·core boundary 불변도 유지.
- **잔여 blocker: 없음**(Version Strategy 관점). 남은 보강은 전부 non-blocker이며 처리 시점을 §4에 명시.
- **다음 단계 = Codex Review**(이 확정 문서 독립 검증) → 이후 **사용자/ChatGPT 명시적 승인 시** 구현 사이클(예: 2I-3C, 최소 opt-in 어댑터 계약). 즉 **"바로 구현"이 아니라 "Codex Review → 승인 → 구현"**.

## 1. 입력 근거

- Gate A: **PASS**(프로세스/Node 런타임 레벨 no-egress) — `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`, 리뷰 `docs/reviews/codex_cycle2i_3b_gate_a_no_egress_evidence_review.md`(minor GATEA-MIN-01).
- Gate B: **PASS**(v1 text-PDF permissive, opt-in/local·미번들) — `docs/samples/gate_b_license_review_evidence_2026-07-03.md`, 리뷰 `docs/reviews/codex_cycle2i_3b_gate_b_license_evidence_review.md`(minor GATEB-MIN-01/02).
- 설계·계획: `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`, `docs/planning/cycle2i_3b_gateprep_execution_plan.md`, `docs/submission_packaging_policy.md`.

## 2. Version Strategy 확정 (구현 계약 규칙)

아래 규칙을 **확정**한다. 실제 pin/lock/코드 반영은 **구현 사이클**에서 수행(이번은 규칙 동결).

| # | 규칙 | 확정 내용 | 상태 |
|---|---|---|---|
| V1 | **kordoc exact pin** | `kordoc@3.8.2` 정확 고정(범위 지정 금지) | 확정 |
| V2 | **pdfjs-dist constraint** | `pdfjs-dist@4.10.x`(실측 검증 `4.10.38`). 광역 `>=4` 금지 — 최신 `6.1.200`은 2I-3A에서 실패(`doc.destroy`) | 확정 |
| V3 | **실행 전 compat-check** | 어댑터 실행 전 설치된 `kordoc`·`pdfjs-dist` 버전을 확인해 검증 조합과 일치하는지 점검 | 확정 |
| V4 | **미검증 버전 fail-fast** | 검증되지 않은 조합이면 **즉시 중단(fail-fast)** 하고 조용한 저품질 산출 금지 | 확정 |
| V5 | **auto-upgrade 금지** | 자동 최신 갱신 비활성(범위 확장·`^`/`~`로의 드리프트 금지) | 확정 |
| V6 | **신버전 재검증** | 새 `kordoc`/`pdfjs-dist` 버전 도입은 **Gate A(no-egress) + Gate B(license) 재검증 또는 동등 evidence** 통과 후에만 | 확정 |
| V7 | **불일치 시 fallback** | 버전 불일치·compat-check 실패·미검증 시 **현행 경로 유지**(제한 텍스트 추출 + "확인 불가→`missing_info`+`customer_questions`+요청자료") | 확정 |
| V8 | **posture** | Kordoc은 계속 **optional/local external adapter 후보**이며 **plugin core hard dependency 아님**. 설치 태세는 `--omit=optional`로 native/LGPL 미유입(Gate B 연계) | 확정 |

## 3. 구현 사이클 진입 조건 상태 (gateprep §9 대조)

| 조건 | 상태 | 비고 |
|---|---|---|
| Gate A = PASS | ✔ 충족 | 프로세스 레벨. OS/kernel 보강은 non-blocker(RH-A1) |
| Gate B = PASS | ✔ 충족 | v1 permissive. MIN-01/02는 non-blocker(RH-B1 해소·RH-B2 open) |
| Version Strategy 확정 | ✔ 충족 | 본 문서 §2 |
| v1 scope(OCR/formula/scanned 제외) 유지 | ✔ 충족 | RH-S1 유지 규칙 |
| opt-in/local-only posture, core dependency·submission 기본 불변 | ✔ 충족(명시적 재확인) | V8·RH-C1 |
| 경계 불변(Skill-first·detect-only·no-rejudgment·delivery separation·source-bound·human-review) | ✔ 충족 | 이번 사이클 코드 무변경 |
| **사용자/ChatGPT 명시적 구현 승인** | ✘ **미충족(대기)** | 구현 착수 전 필수. 기술 gate와 별개 |

→ **기술 gate는 전부 충족.** 남은 유일 미충족은 **"명시적 구현 승인"**(운영 원칙상 사용자/ChatGPT 판단). 따라서 이 문서 이후 바로 구현이 아니라 **Codex Review → 승인**을 거친다.

## 4. Residual Hardening Register

| ID | 출처 | 항목 | blocker? | 처리 시점 | 상태 |
|---|---|---|---|---|---|
| **RH-A1** | GATEA review | OS/kernel-level no-egress 재확인(방화벽/격리) | non-blocker → **민감 실데이터 운영·기본 활성화 전 blocker** | 운영/기본활성화 전 | open |
| **RH-A2** | GATEA-MIN-01 | 메타데이터: 정확한 sanitized 명령·timestamp/timezone·observer·hook fingerprint | non-blocker | future gate evidence | 부분(observer/UTC/도구버전은 Gate B evidence에 반영). hook 소스 fingerprint는 미기록 → 향후 |
| **RH-B1** | GATEB-MIN-01 | 완전 v1 의존성 인벤토리(117) + raw 인벤토리 hash | non-blocker | 구현/번들 전 | **해소**(본 문서 §6, `INVENTORY_SHA256` 기록) |
| **RH-B2** | GATEB-MIN-02 | `--omit=optional` 파싱 재실행 또는 module/native-load trace(optional/native 미로드 실증) | non-blocker → **구현 packaging 전 필요** | 구현-prep 사이클 | open (이번 사이클 **PDF 재실행 금지**로 미수행) |
| **RH-P1** | Gate B/policy | 번들 시 attribution/NOTICE(MIT/BSD 텍스트 + Apache-2.0 NOTICE) 수집, **LGPL/native 제외** | 조건부 non-blocker → **번들 결정 시 blocker** | 번들 결정 시 | open |
| **RH-P2** | Gate B | 형식 법률 검토(재배포/번들 전) | 조건부 non-blocker → **재배포/번들 전 blocker** | 재배포/번들 전 | open |
| **RH-S1** | design/Gate B | OCR/formula/scanned-PDF **v1 제외 유지**(needs_ocr는 신호만) | 유지 규칙 | 상시 | 유지 |
| **RH-C1** | design | core boundary 변경 금지(schema/validator/renderer/delivery/manifest/marketplace/package) | 유지 규칙 | 상시 | 유지 |

**해석**: 전 항목이 **Version Strategy 확정·Codex Review·구현 승인 논의**를 막지 않는다(non-blocker). 단 **RH-B2/RH-P1/RH-P2는 실제 packaging·번들·재배포·기본 활성화 전 반드시 처리**해야 하는 조건부 항목이다. RH-B1은 본 문서에서 해소.

## 5. 구현 사이클 진입 가능 여부 판정

- **기술 gate 관점: 진입 가능**(Gate A PASS + Gate B PASS + Version 확정 + scope/posture/boundary 유지).
- **잔여 blocker(현 단계): 없음.** RH-B2·RH-P1·RH-P2는 **구현 packaging/번들/재배포 단계의 조건**이지 Version Strategy 확정이나 다음 논의의 blocker가 아니다.
- **그러나 실제 구현 착수 전 필수 선행 2가지**: (1) **사용자/ChatGPT 명시적 승인**(운영 원칙), (2) 구현-prep에서 **RH-B2**(optional 제외 실증) 처리.
- **다음 단계 = Codex Review**(본 확정 문서) → 승인 시 별도 사이클로 **최소 opt-in 어댑터 계약** 구현. **바로 구현하지 않는다.**

## 6. 부록 — v1-required 완전 의존성 인벤토리 (RH-B1 / GATEB-MIN-01 해소)

- **폐포 정의**: roots={`kordoc`, `pdfjs-dist`}에서 `dependencies`만 재귀(optional/dev 제외). 총 **117개**.
- **요약**: permissive **116** + permissive(dual, `jszip` MIT-electable) **1** = 117. **copyleft 0 · native 0 · unknown 0.** LICENSE/NOTICE 파일 **116/117**(예외 `isarray`는 `package.json` MIT 선언).
- **재현성 지문**: `INVENTORY_SHA256 = 64648c647827b2ebaa8a1bafe2a8eca588914fd09c9567cd0cba968b3a4b64ce`
  (canonical `name@version|license` 라인들의 SHA-256; raw `node_modules`·분석 스크립트·lock은 repo 미커밋). 분석 도구: Node v24.16.0, 읽기전용.

| package | version | license | class | LICENSE file |
|---|---|---|---|---|
| `@hono/node-server` | 1.19.14 | MIT | permissive | Y |
| `@modelcontextprotocol/sdk` | 1.29.0 | MIT | permissive | Y |
| `@xmldom/xmldom` | 0.9.10 | MIT | permissive | Y |
| `accepts` | 2.0.0 | MIT | permissive | Y |
| `adler-32` | 1.3.1 | Apache-2.0 | permissive | Y |
| `ajv` | 8.20.0 | MIT | permissive | Y |
| `ajv-formats` | 3.0.1 | MIT | permissive | Y |
| `argparse` | 2.0.1 | Python-2.0 | permissive | Y |
| `body-parser` | 2.3.0 | MIT | permissive | Y |
| `bytes` | 3.1.2 | MIT | permissive | Y |
| `call-bind-apply-helpers` | 1.0.2 | MIT | permissive | Y |
| `call-bound` | 1.0.4 | MIT | permissive | Y |
| `cfb` | 1.2.2 | Apache-2.0 | permissive | Y |
| `commander` | 13.1.0 | MIT | permissive | Y |
| `content-disposition` | 1.1.0 | MIT | permissive | Y |
| `content-type` | 1.0.5 | MIT | permissive | Y |
| `cookie` | 0.7.2 | MIT | permissive | Y |
| `cookie-signature` | 1.2.2 | MIT | permissive | Y |
| `core-util-is` | 1.0.3 | MIT | permissive | Y |
| `cors` | 2.8.6 | MIT | permissive | Y |
| `crc-32` | 1.2.2 | Apache-2.0 | permissive | Y |
| `cross-spawn` | 7.0.6 | MIT | permissive | Y |
| `debug` | 4.4.3 | MIT | permissive | Y |
| `depd` | 2.0.0 | MIT | permissive | Y |
| `dunder-proto` | 1.0.1 | MIT | permissive | Y |
| `ee-first` | 1.1.1 | MIT | permissive | Y |
| `encodeurl` | 2.0.0 | MIT | permissive | Y |
| `entities` | 4.5.0 | BSD-2-Clause | permissive | Y |
| `es-define-property` | 1.0.1 | MIT | permissive | Y |
| `es-errors` | 1.3.0 | MIT | permissive | Y |
| `es-object-atoms` | 1.1.2 | MIT | permissive | Y |
| `escape-html` | 1.0.3 | MIT | permissive | Y |
| `etag` | 1.8.1 | MIT | permissive | Y |
| `eventsource` | 3.0.7 | MIT | permissive | Y |
| `eventsource-parser` | 3.1.0 | MIT | permissive | Y |
| `express` | 5.2.1 | MIT | permissive | Y |
| `express-rate-limit` | 8.5.2 | MIT | permissive | Y |
| `fast-deep-equal` | 3.1.3 | MIT | permissive | Y |
| `fast-uri` | 3.1.3 | BSD-3-Clause | permissive | Y |
| `finalhandler` | 2.1.1 | MIT | permissive | Y |
| `forwarded` | 0.2.0 | MIT | permissive | Y |
| `fresh` | 2.0.0 | MIT | permissive | Y |
| `function-bind` | 1.1.2 | MIT | permissive | Y |
| `get-intrinsic` | 1.3.0 | MIT | permissive | Y |
| `get-proto` | 1.0.1 | MIT | permissive | Y |
| `gopd` | 1.2.0 | MIT | permissive | Y |
| `has-symbols` | 1.1.0 | MIT | permissive | Y |
| `hasown` | 2.0.4 | MIT | permissive | Y |
| `hono` | 4.12.27 | MIT | permissive | Y |
| `http-errors` | 2.0.1 | MIT | permissive | Y |
| `iconv-lite` | 0.7.2 | MIT | permissive | Y |
| `immediate` | 3.0.6 | MIT | permissive | Y |
| `inherits` | 2.0.4 | ISC | permissive | Y |
| `ip-address` | 10.2.0 | MIT | permissive | Y |
| `ipaddr.js` | 1.9.1 | MIT | permissive | Y |
| `is-promise` | 4.0.0 | MIT | permissive | Y |
| `isarray` | 1.0.0 | MIT | permissive | — |
| `isexe` | 2.0.0 | ISC | permissive | Y |
| `jose` | 6.2.3 | MIT | permissive | Y |
| `json-schema-traverse` | 1.0.0 | MIT | permissive | Y |
| `json-schema-typed` | 8.0.2 | BSD-2-Clause | permissive | Y |
| `jszip` | 3.10.1 | (MIT OR GPL-3.0-or-later) | permissive(dual) | Y |
| `kordoc` | 3.8.2 | MIT | permissive | Y |
| `lie` | 3.3.0 | MIT | permissive | Y |
| `linkify-it` | 5.0.2 | MIT | permissive | Y |
| `markdown-it` | 14.3.0 | MIT | permissive | Y |
| `math-intrinsics` | 1.1.0 | MIT | permissive | Y |
| `mdurl` | 2.0.0 | MIT | permissive | Y |
| `media-typer` | 1.1.0 | MIT | permissive | Y |
| `merge-descriptors` | 2.0.0 | MIT | permissive | Y |
| `mime-db` | 1.54.0 | MIT | permissive | Y |
| `mime-types` | 3.0.2 | MIT | permissive | Y |
| `ms` | 2.1.3 | MIT | permissive | Y |
| `negotiator` | 1.0.0 | MIT | permissive | Y |
| `object-assign` | 4.1.1 | MIT | permissive | Y |
| `object-inspect` | 1.13.4 | MIT | permissive | Y |
| `on-finished` | 2.4.1 | MIT | permissive | Y |
| `once` | 1.4.0 | ISC | permissive | Y |
| `pako` | 1.0.11 | (MIT AND Zlib) | permissive | Y |
| `parseurl` | 1.3.3 | MIT | permissive | Y |
| `path-key` | 3.1.1 | MIT | permissive | Y |
| `path-to-regexp` | 8.4.2 | MIT | permissive | Y |
| `pdfjs-dist` | 4.10.38 | Apache-2.0 | permissive | Y |
| `pkce-challenge` | 5.0.1 | MIT | permissive | Y |
| `process-nextick-args` | 2.0.1 | MIT | permissive | Y |
| `proxy-addr` | 2.0.7 | MIT | permissive | Y |
| `punycode.js` | 2.3.1 | MIT | permissive | Y |
| `qs` | 6.15.3 | BSD-3-Clause | permissive | Y |
| `range-parser` | 1.3.0 | MIT | permissive | Y |
| `raw-body` | 3.0.2 | MIT | permissive | Y |
| `readable-stream` | 2.3.8 | MIT | permissive | Y |
| `require-from-string` | 2.0.2 | MIT | permissive | Y |
| `router` | 2.2.0 | MIT | permissive | Y |
| `safe-buffer` | 5.1.2 | MIT | permissive | Y |
| `safer-buffer` | 2.1.2 | MIT | permissive | Y |
| `send` | 1.2.1 | MIT | permissive | Y |
| `serve-static` | 2.2.1 | MIT | permissive | Y |
| `setimmediate` | 1.0.5 | MIT | permissive | Y |
| `setprototypeof` | 1.2.0 | ISC | permissive | Y |
| `shebang-command` | 2.0.0 | MIT | permissive | Y |
| `shebang-regex` | 3.0.0 | MIT | permissive | Y |
| `side-channel` | 1.1.1 | MIT | permissive | Y |
| `side-channel-list` | 1.0.1 | MIT | permissive | Y |
| `side-channel-map` | 1.0.1 | MIT | permissive | Y |
| `side-channel-weakmap` | 1.0.2 | MIT | permissive | Y |
| `statuses` | 2.0.2 | MIT | permissive | Y |
| `string_decoder` | 1.1.1 | MIT | permissive | Y |
| `toidentifier` | 1.0.1 | MIT | permissive | Y |
| `type-is` | 2.1.0 | MIT | permissive | Y |
| `uc.micro` | 2.1.0 | MIT | permissive | Y |
| `unpipe` | 1.0.0 | MIT | permissive | Y |
| `util-deprecate` | 1.0.2 | MIT | permissive | Y |
| `vary` | 1.1.2 | MIT | permissive | Y |
| `which` | 2.0.2 | ISC | permissive | Y |
| `wrappy` | 1.0.2 | ISC | permissive | Y |
| `zod` | 3.25.76 | MIT | permissive | Y |
| `zod-to-json-schema` | 3.25.2 | ISC | permissive | Y |

> 표의 `class`는 SPDX 표기 기반 1차 분류(dual `OR`는 permissive 선택 가능, `AND`는 전부 permissive면 permissive). 형식 법률 판단 아님(RH-P2).

## 7. Redaction 확인

- 로컬 절대경로·계정명·회사명·식별 파일명·토큰·API key·private key **노출 없음**. 인벤토리는 공개 npm 패키지명·버전·SPDX만 포함.
- raw `node_modules`·분석 스크립트·lock·raw 인벤토리 덤프 **repo 미커밋**(임시 디렉터리). 커밋 전 재스캔: Y.

## 8. Codex Review 요청 포인트

1. Version Strategy 8규칙(§2)이 구현 전 버전 리스크(민감성·fail-fast·재검증)를 충분히 고정하는가?
2. 구현 진입 조건(§3)에서 "기술 gate 충족 + 명시적 승인 미충족" 구분이 타당한가?
3. Residual Hardening Register(§4)가 전체 흐름의 non-blocking 보강을 빠짐없이 수집했고 blocker/non-blocker·처리 시점이 정확한가?
4. RH-B1(완전 인벤토리+hash) 해소가 GATEB-MIN-01을 충족하는가? RH-B2를 구현-prep으로 미룬 판단이 적절한가?
5. "다음 단계 = 구현이 아니라 Codex Review→승인→구현" 결론이 운영 원칙·gate 구조와 정합하는가?
