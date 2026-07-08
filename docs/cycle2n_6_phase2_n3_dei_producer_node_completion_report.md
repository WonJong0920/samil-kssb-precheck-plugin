# Cycle 2N-6 Phase 2 N3 — Node DEI Producer 이식 Completion Report

> **성격**: D92 Phase 2의 **N3만** 수행한 완료 보고다. Codex N2 review **PASS**("N3 entry: Ready")
> 후 착수했다. Claude Code는 구현·검증·보고만 수행하며 **PASS/FAIL 최종 판정은 Codex N3 review가
> 수행한다.** N4(DOCX)/N5(aux) 미착수. 제품 완성·OCR complete·provider finalization·
> 2N-5 전체 완료 선언이 아니다.
>
> 시작 HEAD: `fd5e804d055226b86c8c216bcdfe201969ed4815` (프롬프트 기준과 일치 — pull 후 최신
> 원격 main·clean)
> 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재)

## 1. 구현 위치 / 변경 파일

| 구분 | 파일 |
|---|---|
| **Node DEI producer (신규)** | `src/intake/dei_producer.cjs` — intake(+optional ocr_text/aux_signals) → DEI-candidate |
| **Node 테스트 (신규)** | `tests/test_intake_dei_producer_node.test.cjs` — **61 tests** (Python 스위트 83체크 미러 + Node 전용) |
| **parity 테스트 (신규)** | `tests/test_intake_dei_producer_parity.test.cjs` — **46 tests** (Python CLI 실측 대조) |
| 문서 (최소 갱신) | `src/intake/README.md` · `docs/current_status.md` · 본 보고서 |
| **무변경** | `dei_producer.py`(**transitional reference 보존** — diff 0) · aux_structure_scanner.py · runner 4종(.cjs/.py) · validator(.py/.cjs) · renderer/delivery(.py/.cjs) · schema · Skill · 기존 테스트 전부 |

decision_log 무변경(신규 결정 없음 — D92 ③의 N3 집행. canonical hash 규칙·DEI 계약·경계 전부 기존 결정 그대로).

참고: 작업 중 repo에 **untracked 문서 1건**(`docs/reviews/claude_gpt_post_n4_hook_structure_proposal_review.md`)이
외부(다른 세션)에서 생성되어 있음을 확인했다 — 본 사이클 산출물이 아니므로 **커밋에 포함하지 않았다**
(시작 시점 `git status`는 clean이었음).

## 2. Python reference에서 파악한 DEI producer 책임 범위 (전량 이식)

`dei_producer.py`(652줄)의 책임은 다음 5가지로 파악했고 축소 없이 전부 이식했다:

1. **최소 인테이크 계약 강제**(paginated — malformed 거부·"유효하지만 근거 빈약" 구분,
   C2L2-MAJ-01): success/blocks/pageQuality/qualitySummary/metadata.pageCount 검증.
2. **document-level 변형 계약**(2N-4B — HWP/HWPX/DOCX): fileType∈{hwp,hwpx,docx}+
   pageQuality/qualitySummary 모두 부재일 때만 별도 변형(없는 신호 미합성 —
   pagination/page_count_basis/quality_signal additive 명시, 빈 blocks 거부, ocr_text 명시 거부).
3. **결정적 정규화**: blocks(입력 순서 보존·표→md·block_id 기본값·extraction_quality 휴리스틱·
   bbox는 DEI location_hint에만)·doc_quality·review_priority_hints(needs_ocr/low_text/
   skipped_image → 결정적 정렬) — **판정·findings·질문·권고 미생성**(검수 트리아지 신호만).
4. **L2 additive ingest**(2L-4B/4C/2N-4L): `ocr_text`(provenance 필수·needsOcr 페이지 정합
   fail-fast·**text_sha256/output_sha256 실제 무결성 검증** — canonical hash 규칙 포함)를
   별도 `ocr_supplement` 섹션(low 고정·blocks 미혼입)으로, `aux_signals`를 `aux_structure`+
   gap hint로만 병합. 없으면 L1과 동일 산출(DEI_VERSION "1" 유지).
5. **내부/디버그 CLI**: intake JSON → DEI JSON stdout(정렬 직렬화), IntakeError→exit 2.

## 3. 구현 흐름 (목표 상태 달성)

```
intake/OCR 계열 입력 (Kordoc intake JSON · runner의 ocr_text.json · aux_signals.json — 이미 생성된 산출물만)
→ Node DEI producer (src/intake/dei_producer.cjs — 실행 없음·계약 검증·결정적 정규화)
→ deterministic DEI candidate output (JSON)
→ 이후 Skill/findings 생성 입력(근거 재료)으로 사용 가능
   ※ DEI는 findings가 아니며 validator/renderer/delivery에 직접 유입되지 않는다(경계 유지 —
     findings는 종전대로 Skill이 생성하고 N1 validator preflight → N2 delivery(D94)로 흐른다).
```

## 4. CLI / API 사용법

```bash
node src/intake/dei_producer.cjs <intake.json> --source-id <id> \
  [--source-title <title>] [--ocr-text <path>] [--aux-signals <path>]
# exit: 0=성공(DEI JSON stdout — Python과 동일 직렬화) / 2=IntakeError·인자 오류
# / 1=입력 JSON 로드 등 통제된 실패(Python reference는 이 구간 traceback+exit 1 —
#   Node는 같은 exit 1에 stack·경로 없는 통제 안내만. 문서화된 의도적 차이)
```

```js
const D = require("src/intake/dei_producer.cjs");
const dei = D.buildDeiCandidate(intake, sourceId, sourceTitle, { ocrText, auxSignals });
// 그 외: IntakeError / isDocumentLevelIntake / docLevelHint / pageOrSectionHint /
//        canonicalOcrOutputSha256 / loadIntake / DEI_VERSION — Python 공개 표면 대응
```

## 5. parity 기준 / byte parity 가능 여부 / 허용 차이

**byte parity를 적용했다**(구조 비교보다 강한 기준). DEI 출력 도메인이 str/int/bool/list/dict뿐이라
Python `json.dumps(ensure_ascii=False, indent=2, sort_keys=True)` 동등 직렬화기를 이식해
CLI stdout **전문 일치**가 성립한다. `tests/test_intake_dei_producer_parity.test.cjs`
(Python 미탐지 시 명시적 skip — 이번 실행 **skip 0**, Python 3.14.5 실측 대조):

- **성공 10케이스**: paginated 기본/OCR+aux 병합/스캔 전용/혼합 변형(비-dict 블록·type 누락·
  code 없는 warning·message fallback·block_id 기본값·표 셀 결손 등 fallback 경로 심층)/
  HWP·DOCX document-level/PUA 오염/doc-level+aux/특수문자 escape/대문자 hex·key 재배열 OCR —
  exit 0 + **stdout 전문 일치(개행 정규화 CRLF↔LF만 — Windows Python stdout 번역분)**.
- **거부 34케이스**: paginated malformed 12종·source_id 2종·document-level fail-fast 6종·
  OCR provenance/무결성/페이지 정합 9종·aux malformed 4종·warnings 비-list — 양쪽 exit 2 +
  **IntakeError stderr 메시지 전문 일치**(오류 문자열을 reference와 동일하게 이식).
- **인자 오류**: --source-id 누락 → 양쪽 exit 2(메시지는 argparse/자체 파서로 상이 — exit만 대조).
- 개행 정규화 외 normalize 없음(검증 강도 저하 없음).

**허용(문서화)한 차이** — 전부 계약 밖 병리 입력 또는 CLI 오류 표면:

1. **JSON 정수형 float**(`5.0`): JS는 JSON.parse가 5로 읽어 정수로 수용, Python은 float로 구분해
   거부/기본값 처리. JS 수 체계의 한계로 재현 불가(기존 Node runner의 canonical hash와 동일 제약 —
   runner가 쓰는 실제 artifact에는 발생하지 않는 표현).
2. **비정형 타입의 미세 동작**(예: ocrCandidatePages 안의 bool — Python은 bool⊂int로 통과):
   재현하지 않음. 계약 검증이 먼저 거부하거나 결과 동일(모듈 헤더에 non-goal 명시, N1 방식과 동일).
3. **입력 로드 실패/인자 오류 메시지**: exit 코드는 동일(1/2), 문구는 Node가 통제된 한국어 안내
   (traceback 미출력 — reference보다 보수적, §4에 기재).

## 6. deterministic output / canonical metadata 처리

- **결정성**: 동일 입력→동일 출력(API 2회 canonical 비교 + CLI 2회 stdout 동일 테스트).
  정렬 전부 이식 — hints `(location_hint, reason)` 코드포인트 정렬(stable), ocr_supplement 페이지
  번호 정렬, low_text/ocr_candidate_pages 수치 정렬, aux reason 중복 제거+정렬.
- **canonical hash**: `canonicalOcrOutputSha256`을 모듈 내 자체 구현(충실 이식 — top-level
  output_sha256 제외 + sort_keys compact canonical JSON의 SHA-256). **runner를 require하지 않고
  이중 구현한 이유**: Python도 dei_producer가 자체 보유(규칙의 single source)하고 runner가 이를
  미러하는 구조이며, ingest가 runner 코드를 로드하지 않는 독립성을 유지하기 위함(변경 금지 대상인
  runner 추출·수정 회피). 이중화 위험은 **3중 결속**으로 상쇄: ① 기존 golden 상수 F1/F2/F3
  (`test_ocr_canonical_hash_parity.py`/`test_pdf_ocr_runner.test.cjs`와 문자 그대로 동일 fixture)
  일치, ② runner 함수와 동일값 직접 대조 테스트, ③ parity에서 Node가 만든 output_sha256을
  Python ingest가 실검증 통과(성공 케이스 병합 = 교차 언어 hash 수용 증명).
- **text_sha256/output_sha256 실제 무결성 검증**(presence-only 아님)·대문자 hex 정규화·
  key 순서 독립 전부 이식(테스트로 강제). model_sha256은 presence-only(문서화된 한계) 유지.

## 7. intake/OCR contract 검증 방식

- paginated/document-level/ocr_text/aux_signals 4계약의 검사 항목·**검사 순서**·오류 메시지를
  reference와 동일하게 이식(거부 parity 34케이스가 메시지 수준으로 증명).
- needsOcr 페이지 정합: `pageQuality.needsOcr` 페이지 ∪ `ocrCandidatePages`만 허용(밖이면
  fail-fast — 텍스트 레이어 원문과의 혼동 방지), document-level에서는 ocr_text 명시 거부.
- "유효하지만 근거 빈약"(스캔 전용 blocks=[]) vs malformed 구분 유지(스캔 전용 허용 테스트).

## 8. 검증 결과

| 항목 | 결과 |
|---|---|
| `node --test tests/test_intake_dei_producer_node.test.cjs` | **61/61 PASS** (skip 0) |
| `node --test tests/test_intake_dei_producer_parity.test.cjs` | **46/46 PASS (skip 0 — Python 3.14.5 실측 대조)** |
| **DEI/intake 회귀(Python)**: dei 83 · OCR hash parity 11 · aux 26 · nethook 29 · runner 49 | **전부 PASS (불변)** |
| **N1 회귀**: validator node 43 · parity 35 | **전부 PASS** |
| **N2 회귀**: delivery node 18 · delivery parity 6 | **전부 PASS** |
| Python core reference: validator 30 · delivery wiring 34 · renderer smoke 22 | **전부 PASS (불변)** |
| Node intake/runner 회귀: router 21 · hwp 39 · OCR 29 · write-failure 8 · bootstrap 11 | **전부 PASS** |
| `git diff --check` | clean |
| 오염 스캔(node_modules/package·lock/generated intake·OCR·DEI·findings·report/traineddata/zip/submission.zip/repo tool-cache/샘플 원본) | **0건** |

실행하지 않은 테스트: 없음 — 이번에는 N2 review carry-forward(C2N6-N2-OBS-03)에 따라
Python DEI/intake/runner/nethook/aux 스위트를 **전부 재실행**했다(위 표). 실 샘플 문서 실행·
OCR/HWP runner 실 실행은 없음(N3 범위 밖 — 합성 fixture 기반, 2N-5R evidence가 실측 커버).

## 9. no-overclaim / leak scan

- **사용자-facing 출력(stdout/stderr)**: stdout은 입력에서 파생된 DEI JSON뿐(외부 문구 없음).
  stderr는 reference와 동일한 IntakeError 계약 메시지(영문·경로 없음) 또는 통제된 한국어 안내.
  로드 실패 경로에 **stack trace·로컬 절대경로 미노출**(테스트로 강제 — `at `·드라이브 경로 부재 assert).
- **overclaim 부재**: 신규 코드·테스트·문서에 OCR 지원 완료/support complete/provider finalization/
  product complete/2N-5 통과 선언 없음. provider명(tesseract.js 등)은 **테스트 fixture의 provenance
  데이터 값**과 소스 주석에만 존재(Python reference 스위트와 동일 형태) — 사용자-facing 출력에는
  입력 artifact가 담은 값 이상을 추가하지 않는다.
- **N2 carry-forward 준수**(C2N6-N2-OBS-02 포함): N2 delivery/renderer 코드 diff 0 —
  sanitized user-summary 경계·D94 hard stop(renderer 전 artifact 차단) 그대로(delivery 18/6 재실행
  green). N3 산출물(DEI)은 renderer로 우회 투입되지 않는다 — `dei_producer.cjs`가 core
  (validator/renderer/delivery)·runner를 **require하지 않음을 테스트로 강제**(비-require 스캔 +
  내장 모듈 외 require 0 assert).

## 10. 경계 준수

- **Python reference 보존**: `dei_producer.py` diff 0(기능 변경·확장·hard-stop류 patch 없음),
  Python DEI/intake 스위트 전부 green 유지. aux_structure_scanner.py·runner·nethook 무변경.
- **N4/N5 미착수**: DOCX writer·aux scanner Node 이식 없음(renderer/aux diff 0). N1/N2 의미 무변경.
- **판정·findings 미생성**: judgment 계열 키 부재를 deep-key 스캔 테스트로 강제(paginated·병합·
  document-level 전부). 고객 질문·보완 권고·KSSB 판단 자동화 없음.
- **실행 없음**: OCR/모델/네트워크/외부 도구 실행 없음 — 이미 생성된 JSON만 변환(reference와 동일).
- **의존성 0**: Node 내장 모듈만(require 스캔 테스트로 강제). package.json/lock/node_modules 미추가.
- generated artifact/샘플 원본 repo 미유입(테스트는 임시 폴더 생성·정리).

## 11. Required Follow-up / Carry-forward

- **Codex Phase 2 N3 review** → PASS 시 N4(DOCX zip writer 이식 — Phase 2 마지막 core 단계,
  byte-parity 대신 구조·결정성 parity 기준 사전 정의) 착수 판단. N5는 D93대로 미이식 유지.
- `docs/blackbox_protocol.md`·`docs/workflow_usage.md`의 후반부 스크립트/내부 실행 표면은 아직
  Python dei/delivery CLI 기준 서술 — **Node 경로(intake→dei.cjs→findings→delivery.cjs)로의 표면
  일괄 정렬은 Node 경로 승격 시점(N4 이후)에 수행**(C2N6-N2-OBS-01과 같은 축, 이번엔 최소 갱신만).
- 이중 구현된 canonical hash(dei_producer.cjs ↔ pdf_ocr_runner.cjs)는 규칙 변경 시 **골든 상수
  3곳(F1/F2/F3)과 함께 갱신**해야 한다 — 현행 테스트(골든+직접 대조)가 불일치를 즉시 잡는다.
- untracked 외부 문서(`docs/reviews/claude_gpt_post_n4_hook_structure_proposal_review.md`)는
  본 사이클에서 다루지 않음 — 처리(커밋/폐기)는 ChatGPT/사용자 판단 대상.
