# Cycle 2N-5R Black-box 재실행 Evidence (실행 주체: Claude Code)

> **성격**: `docs/blackbox_protocol.md`에 따른 2N-5R black-box 재실행의 **실행 evidence**다.
> **실행 주체는 Claude Code**이며(사용자 지시 — 2N-5R 프롬프트), **Codex는 이 문서를 post-run
> 독립 리뷰하는 역할**이다. 본 문서의 시나리오별 상태는 **후보 기록(PASS_CANDIDATE 등)**이며,
> 최종 PASS/FAIL 판정은 Codex evidence review가 수행한다. 2N-5 통과·OCR support complete·
> L2/L3 complete·provider finalization·product complete 선언이 아니다.

## 1. Git / 환경

| 항목 | 값 |
|---|---|
| 시작 HEAD | `fa1000358aeb1ec11ed624d4ece16d3e970312c9` (`git pull` 후 원격 main 일치, `git status --short` clean) |
| 종료 HEAD | 실행 중 repo 무변경 — 본 evidence 문서 커밋만 추가(커밋 SHA는 채팅 보고에 기재) |
| OS | Microsoft Windows NT 10.0.19045.0 (PowerShell 5.1) |
| Node | v24.16.0 (시스템 Node) |
| Python | `<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe`, **Python 3.14.5** (bare `python` stub 미사용 — 절대 경로) |
| Python UTF-8 규약 | 모든 Python 호출에 `PYTHONUTF8=1`, `PYTHONIOENCODING=utf-8` 적용(R3 규약 — §1 blackbox_protocol) |
| RUN_ROOT | `<TEMP>\samil_kssb_2n5r_blackbox_20260708` (repo 밖 — 산출물 전부 여기 생성, repo 미커밋) |
| tool-cache | `<USER_HOME>\.samil-kssb-precheck\tools` (repo 밖. Kordoc 3.13.0 기설치 재사용 — 재설치 없음) |

## 2. 실행 주체·역할 (이번 사이클 고정)

- **Claude Code**: 실행·승인 플래그 전달·repo 밖 산출물 생성·본 evidence 작성 (이 문서).
- **Codex**: 이번 실행에 관여하지 않음 — **post-run evidence 독립 리뷰** 대상.
- **User**: 승인 판단 — 이번 2N-5R 프롬프트(D93 집행 지시)로 승인 기반 OCR·HWP 실 실행과
  OCR runtime 설치를 승인함. runner의 `--approve-install`/`--approve-run` 플래그는 이 승인의 전달이다.
- **ChatGPT**: 실행 결과 확인 후 다음 분기 판단.

## 3. Python runner `.py` 미사용 확인

- HWP/HWPX/DOCX·PDF 구조 보강·OCR의 **모든 실행은 Node runner로 수행**했다:
  `src/intake/runners/document_intake_router.cjs`(PDF·HWP-family 라우팅) + `src/intake/runners/pdf_ocr_runner.cjs`(OCR).
  HWP-family는 router가 `hwp_assisted_runner.cjs`에 위임하는 제품 경로 그대로다.
- legacy Python HWP runner(`src/intake/runners/*.py`)는 **이번 실행의 어떤 단계에도 사용되지 않았다**
  (사용자-facing/evidence-generating path 진입 없음 — reference 지위 유지, D85④/D92).
- Python은 과도기 후반부 2개 구성요소에만 사용: `src/intake/dei_producer.py`, `src/renderers/kssb_report_delivery.py`
  (+ detect-only `kssb_findings_validator.py` preflight 확인).

## 4. 샘플 인벤토리 (전부 repo 밖 `<SAMPLE_ROOT>` = 사용자 Desktop\sample — 원본 미커밋)

| 파일 | 유형 | bytes | SHA-256 | 민감정보 판단 |
|---|---|---:|---|---|
| `HFG_ESG_KSSB_Report_KOR_2024.pdf` | 텍스트+혼합 PDF | 3,839,124 | `6930f45255913a1faca6c591923626c6f29f5ecdc5e851bcf78ec9d6a8ec5c62` | 공개 공시자료(하나금융그룹 2024 KSSB 보고서) — 공개자료 검증 모드 |
| `smaple.hwp.hwp` | HWP v5 | 103,936 | `445f82d6427446d39b5f5254a3c7d4c25a9981564f3b972892776f2e0249d982` | 검증용 샘플 — 비식별 |
| `smaple.hwpx.hwpx` | HWPX | 117,945 | `094b9df5928d9fba042839489a79c1ac239aa2c3ac9ad7c2d2fd700dde4a358c` | 검증용 샘플 — 비식별 |
| `smaple.docx.docx` | DOCX | 81,493 | `9567636d8d91e5e52fcaae3e4dbe719cc8e9ec734110a45726240c5ef0423580` | 검증용 샘플 — 비식별 |
| `gate-D smaple.ver2.pdf` | 스캔 전용 PDF | 1,156,885 | `238de8be151da74023a5e1287e104a30a19c7c7a40aaa80749ceeb3cc843c5a3` | 검증용 스캔 샘플 — 비식별 |

## 5. 회귀 스모크 (실행 전 sanity)

| 스위트 | 결과 |
|---|---|
| Node: router 21 · hwp runner 39 · OCR runner 29 · bootstrap 11 · write-failure 8 | **전부 pass (exit 0)** |
| Python(UTF-8 규약): validator 30 · delivery 34 · dei 83 · OCR parity 11 · renderer 22 | **전부 pass** |

## 6. 승인 경로 실행 기록 (Node runner)

### 6.1 S-A: 텍스트 PDF Kordoc-first 구조 보강 (승인 실행)

- `--check`(plan): exit 0 — 승인 문구에 목적(구조 보강)·no-egress·OCR 미실행 고지 확인.
- `--approve-run --evidence-mode`: **exit 0** → `HFG_ESG_KSSB_Report_KOR_2024.intake.json`
  (794,393B, sha256 `cf093615b0cfe6c4a9e88963289541b126260147b960c7988d7f08fd645c9a28`).
- run_log provenance: `provider=kordoc 3.13.0, hook_observed=true, egress_attempts=0, no_egress_verified=true`.

### 6.2 S-B: 혼합 PDF page-set OCR (승인 설치 + 승인 실행 — D93 필수 시나리오 ①)

- `--check`: exit 0 — **OCR 대상 페이지: 5페이지 [3, 29, 39, 51, 53]** (R4 규율:
  `qualitySummary.needsOcr` 요약 boolean이 아니라 **대상 페이지 목록 기준**으로 기록.
  intake의 `qualitySummary.needsOcr=False`였으나 `ocrCandidatePages` 5건 존재 — runner는 목록 기준으로 동작).
  승인 문구에 두 출처 분리 고지(npm registry / raw.githubusercontent.com traineddata)·pin·SHA-256 검증·설치 위치 확인.
- `--approve-install`: **설치 수행됨** — approvals.json에 `ocr-runtime@tesseract.js-7.0.0`
  (2026-07-08T03:35:53Z) 기록, prep_egress_log에 npm install(registry.npmjs.org)과
  kor/eng traineddata 다운로드(raw.githubusercontent.com/tesseract-ocr/tessdata_fast) started/ok 기록.
  설치 후 **실행은 시작되지 않고** 별도 실행 승인 안내 + exit 6(U3/U7 승인 분리 동작 확인).
- `--approve-run --evidence-mode`: **exit 0** — 매 실행 전 pin/hash 검증(fail-fast) 통과 후 nethook(block) 하 5페이지 OCR →
  `HFG_ESG_KSSB_Report_KOR_2024.ocr_text.json` (10,356B, sha256 `e7a66a4f2288838b04ea60c85595d3cc4d19a8694d62bebe64dac1e196980783`).
- artifact provenance: `provider=tesseract.js 7.0.0, model=tessdata_fast kor+eng, no_egress_verified=true,
  model_sha256=6ea2993bae5cb3a6eb10bf1fc623eeeccbbb57e1ed9c4e11ff46121d5d65e774,
  output_sha256=2fee5806f43db18ab287165de840d54e7efc7c8f7cdd87507dcd38d657e87214`,
  페이지별 confidence 82~92%·blank_raster 전부 false. run_log: egress_attempts=0.

### 6.3 S-C: HWP·HWPX·DOCX 구조 판독 (승인 실행 — D93 필수 시나리오 ②, router 위임 경로)

| 입력 | exit | artifact | bytes | SHA-256 |
|---|---:|---|---:|---|
| `smaple.hwp.hwp` | 0 | `smaple.hwp.intake.json` | 348,192 | `805c3bb6199075b236c474c149364087bfaf28eb57ef5f03377aa585477c72f9` |
| `smaple.hwpx.hwpx` | 0 | `smaple.hwpx.intake.json` | 341,346 | `fd8d49de0fa154fc4f78919173d8e60d1aa4bce5727ce85067d8e28ae18ff8c4` |
| `smaple.docx.docx` | 0 | `smaple.docx.intake.json` | 238,416 | `297f1c02f75711c62c6cbebd00644b9ff37017ebdcb5ff075869b1ebfe967f1b` |

- 3건 모두 run_log `no_egress_verified=true, egress_attempts=0` (kordoc 3.13.0).
  2N-5에서 sandbox로 BLOCKED_ENV였던 시나리오 9/10/11의 승인 실행이 이번 환경에서 완료됨.

### 6.4 S-G: 스캔 전용 PDF 전 페이지 OCR (승인 실행)

- intake(승인 실행): exit 0 → `gate-D smaple.ver2.intake.json` (2,688B,
  sha256 `9a248eb5a920ab236a265f131c50f493d14cbe22b534bb1a4d7b0e76be2849d6`).
- OCR(승인 실행): **exit 0** — 전 9페이지(스캔 전용 → 자연히 all pages) →
  `gate-D smaple.ver2.ocr_text.json` (24,251B, sha256 `67de0e0ed77ecae98e78a0df298225cfa792c9de1036214343216ebb1df7584c`,
  `no_egress_verified=true`). 2N-5의 시나리오 5(BLOCKED_APPROVAL) 해당 경로 실행 완료.

### 6.5 tool-cache write failure (2N-5 Major ①) 재발 여부

- 이번 실행에서 tool-cache/approvals/run_log/out-dir 쓰기는 전부 정상 수행되어 **누출 재발 없음**.
- 쓰기 실패의 통제된 실패 경로 자체는 Phase 0의 `tests/test_toolcache_write_failure.test.cjs` **8/8**
  (CLI subprocess 재현 포함)로 검증 상태 유지 — 이번 실행 환경에서는 실패 조건이 자연 발생하지 않았다(정직 기록).

## 7. DEI 정규화 (과도기 Python — UTF-8 규약 하)

| 실행 | exit | 산출물 | bytes | SHA-256 |
|---|---:|---|---:|---|
| `dei_producer.py` (HFG intake + `--ocr-text` OCR artifact) | 0 | `hfg.dei_candidate.json` | 363,395 | `6cc655f82b0f2932eda70d08c2f0d4a23b613184684a9f6f1010018d8c94bb72` |
| `dei_producer.py` (HWP intake, document-level 변형) | 0 | `hwp.dei_candidate.json` | 70,447 | `5877e5a57cef688ebd0ce12de56589d2a2e9c971cf6879f012b3f038f934f414` |

- HFG DEI: blocks 721, `ocr_supplement.pages=[3,29,39,51,53]` 합류 확인, page_count 53.
- UnicodeEncodeError·mojibake 0건(2N-5 Major ③ 재발 없음 — 규약 + R3 가드 이중 방어 하).

## 8. findings 생성 (판단 단계 — 정직 표기)

- **방식**: Codex Skill runtime을 Claude Code 세션에서 직접 호출할 수 없어, **Claude Code 세션에서
  Skill 문서 4종(`SKILL.md`·`evidence_mapping_rules.md` §8 절차·`kssb_requirement_catalog.md` 항목별
  상세 기준·`customer_question_rules.md` 템플릿)을 직접 적용해 findings를 생성**했다.
  결정적 parser가 아니며, 재실행 시 서술이 달라질 수 있다(LLM 비결정성 — 프로토콜 §5).
- **입력**: `hfg.dei_candidate.json`(위 hash). OCR 텍스트(`ocr_supplement`)는 §6 규칙에 따라
  **근거 인용에 사용하지 않고** 커버리지 한계 서술에만 반영했다.
- **절차(§8 준수)**: 카탈로그 상세 기준 로드 → 항목별 탐색 키워드로 DEI 블록 전수 탐색(후보 수집
  스크립트 — recall 보조) → 후보 구간 정독 → 필수 요소 대조 → 판정(결정 순서·보수 하향) →
  partial 항목 질문 생성(템플릿+카탈로그 기본값) → quote 실재성 재검(§9) → 표현·커버리지 점검.
- **산출**: `<RUN_ROOT>\sE_findings\hfg.findings.json` —
  **sha256 `2539047caa07f150303779ced562a0df498098d8eca234eb3c58ee7dd57f8ea0`**.
- **판정 분포**(10개 항목 전체): 근거 확인 8(gov-01/02·strat-01/02·risk-01·metric-01/02·target-01),
  일부 근거 확인·보완 필요 2(metric-03 내부 탄소가격 — 가격 수준 미확인 / metric-04 에너지 사용량 —
  수치·에너지 단위 미확인) — 각각 고객 확인 질문·요청자료로 라우팅.
- **한계**: 기계 추출 텍스트의 줄 단위 경계로 일부 인용이 원문 문장 중간에서 시작/끝남 —
  findings의 `overall_limitations`와 해당 anchor의 relevance_note에 명시했다.

## 9. quote/source 검증 (프로토콜 §3-(b) + §9)

- **전수 재검(§9 자기 점검)**: 19개 anchor 전부 입력 추출 텍스트에서 **verbatim(공백·줄바꿈 정규화만)
  재발견 19/19**, `page_or_section` 표기 페이지와 실제 발견 페이지 **전건 일치**. 재발견 실패 0건 —
  수정·제외·not_verifiable 재라우팅이 필요한 quote 없음.
- **무작위 표본 5건 확인(§3-(b))**: seed 20260708 무작위 추출 — gov-01#0, gov-01#1, metric-02#1,
  target-01#0, target-01#1. 각 표본을 발견 블록의 전후 문맥과 함께 실행자(Claude Code)가 육안 대조 —
  5/5 원문 재발견·항목 적합성 확인.
- **정직 한계**: 이 확인은 **실행자 수행 기록**이다. 프로토콜의 사람 확인 취지에 따라 **Codex evidence
  review에서 표본 재검(독립 확인)이 필요**하며, §9 자기 점검은 그것을 대체하지 않는다.

## 10. preflight + delivery (과도기 Python — UTF-8 규약 하)

- validator(detect-only) 단독 실행: **error 0 · warning 0** (info 1 — jsonschema 미설치 시 표준 라이브러리 검증 안내), exit 0.
- `kssb_report_delivery.py`: **exit 0** — preflight counts **error 0 · warning 0**, 사용자 요약(stdout)
  정상 한글 출력(경로·내부 상세 무노출, 표시 경로는 파일명만).
- **D94 오해 방지**: preflight error hard stop은 **N2 Node delivery의 정책 기록(D94)**이며 현행 Python
  delivery의 동작이 아니다. 이번 판정 기준은 프로토콜 §3-(a)의 "preflight error 0"으로 충족을 확인했다
  (hard stop 동작을 기대·주장하지 않음).

### 대표 문서 artifact (repo 밖 `<RUN_ROOT>\sF_report` — 미커밋)

| 파일 | bytes | SHA-256 |
|---|---:|---|
| `하나금융그룹_2024_지속가능성_관련_KSSB_보고서_공개자료_검증_KSSB_공시근거_사전검토보고서.docx` (**primary**) | 9,153 | `738dc38998a4cded7993c1ac98f0dd2e7d0769776144743201eac0281a6dc769` |
| 동명 `.html` (fallback) | 23,046 | `231635b32c11bacb9162f7f18fff2a8dd360557e61a452e3d3e6963c76a3012c` |
| 동명 `.md` (fallback) | 18,465 | `8bc65b4e8179622628fda183460232da6132c0d78e1bc3999f545dbb992d5198` |

- DOCX primary 생성 성공(fallback 강제 상황 미발생 — fallback 생성물은 함께 산출됨).

## 11. no-overclaim / leak / contamination 스캔

- **생성 보고서(md·html) 스캔**: `OCR 지원 완료`/`support complete`/`provider finalization`/
  `product complete`/`L2·L3 complete`/`2N-5`/`Cycle`/provider명(kordoc·tesseract)/`tool-cache`/
  `node_modules`/`AppData`/로컬 경로/`RunnerError`/`Traceback` — **전부 0건**.
  `준수 확정`·`감사의견`은 각 1곳 — 모두 **negation 경계 문맥**("~이 아니다", "~을 대체하지 않습니다").
- **repo 오염 스캔**: `git status --short` clean(본 문서 제외) · `git diff --check` clean ·
  node_modules/package.json/lock/`*.intake.json`/`*.ocr_text.json`/`*.dei_candidate.json`/
  `*.findings.json`/traineddata/zip/tool-cache/`*.docx`/생성 보고서 — **repo 내 0건**.
- 샘플 원본·산출물 원본은 전부 repo 밖 유지. tool-cache의 OCR runtime 설치분은 설계된 위치
  (repo 밖 사용자 홈 전용 폴더)에 남아 있으며 제거는 폴더 삭제로 완결된다(승인·prep egress 기록 보존).

## 12. 시나리오 결과 (Claude Code 후보 기록 — 최종 판정은 Codex)

| 시나리오 | 상태 | 근거 |
|---|---|---|
| 1. 텍스트 PDF baseline **전 구간**(sample→findings→preflight→delivery) | **PASS_CANDIDATE** | §6.1~§10 — 프로토콜 §3 기준 (a) error 0 (b) 표본 5/5+전수 19/19 (c) DOCX primary (d) partial 2건 질문 라우팅 (e) 과장·누출 0 (f) 오염 0 |
| 2. 텍스트 PDF 구조 보강 승인(Kordoc-first) | **PASS_CANDIDATE** | §6.1 — exit 0·no_egress_verified=true·intake 산출 |
| 4. 혼합 PDF page-set OCR 승인(D93 ①) | **PASS_CANDIDATE** | §6.2 — 설치 승인 분리·hash 검증·대상 5페이지만 OCR·provenance 완전 |
| 5. 스캔 전용 PDF 전 페이지 OCR 승인 | **PASS_CANDIDATE** | §6.4 — 9/9페이지·no_egress_verified=true |
| 9/10/11. DOCX·HWPX·HWP 승인 실행(D93 ②) | **PASS_CANDIDATE** | §6.3 — 3종 exit 0·artifact·provenance |
| 15. repo 오염 + 산출물 no-overclaim | **PASS_CANDIDATE** | §11 |
| 2N-5 Major ①(tool-cache 누출) 재발 | 재발 없음(실패 조건 미발생 — 테스트로 커버 유지) | §6.5 |
| 2N-5 Major ③(Python UTF-8) 재발 | 재발 없음(규약+가드 하 전 단계 정상) | §7·§10 |
| BLOCKED 항목 | **이번 실행 0건** | — |

## 13. Codex review 필요 (다음 단계)

- 본 evidence의 **독립 리뷰 필요**: 특히 ① findings 품질·source-bound 표본 재검(§9는 실행자 자기
  점검 — 독립 확인 대체 불가), ② 시나리오 1 PASS/FAIL 판정, ③ no-overclaim 판단.
- 실행 산출물 원본은 `<RUN_ROOT>`에 로컬 보존(미커밋) — 리뷰 시 hash 대조 가능. 리뷰 종료 후 삭제 가능.
- 본 문서는 실행 기록이며 **제품 완성·2N-5 통과 선언이 아니다.**
