# Cycle 2L-4A — L2 Adapter Boundary Design

> **성격**: **implementation-prep / 설계 문서**(L2 실제 구현 아님·provider 최종 확정 아님·제품 코드 미추가).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거 체인: Gate D PASS(`codex_cycle2l_3b_gate_d_evidence_review.md`) →
> provider 비교 PASS(`codex_cycle2l_3c_provider_comparison_review.md`) → aux 스캐너 검토 PASS(`codex_cycle2l_3d_auxiliary_scanner_review.md`).
> 기준 구도(provisional·가역): **Kordoc + tesseract.js + stdlib zip+xml auxiliary scanner.**

## Summary

L2(로컬 OCR/문서분석 결과의 인테이크 합류)를 **provider를 core에 결합하지 않는 가역적 adapter boundary**로 설계한다.
핵심 결정: ① plugin core는 provider를 **실행하지 않는다** — L2는 "runner 층(사용자 로컬 out-of-band 실행)"과 "ingest 층(stdlib-only 정규화)"으로 분리되고,
경계는 코드 결합이 아니라 **intake artifact 계약(JSON 형태)** 이다(계약만 맞추면 provider 교체 가능). ② OCR 텍스트는 기존 blocks에 섞지 않고
**별도 `ocr_supplement` 섹션**으로 DEI candidate에 합류(텍스트레이어 원문과 구분·provenance 보존). ③ aux 신호는 **DEI 재료(결정적 사실)와
review-signal(gap 플래그)로 분리**해 기존 `not_verifiable`/`missing_info`/`customer_questions` 경로로만 라우팅(판정 매핑 금지).
④ **findings 스키마·validator·renderer·delivery 무변경**(additive DEI optional 필드만). ⑤ 검증 구조는 기존 게이트 자산 계승 —
version pin/fail-fast(Version Strategy 8규칙), 준비 egress↔파싱 no-egress 분리(Gate A/D 방식), artifact redaction/미커밋.
이 문서는 설계이며, 실제 구현은 Codex Review + 사용자/ChatGPT 승인 후 별도 사이클(2L-4B 등)에서 수행한다.

## Source-of-truth reviewed

- Codex 리뷰 3종: 2L-3B Gate D evidence(PASS — tesseract.js는 Gate D-proven baseline, 최종 provider 아님), 2L-3C 비교(PASS — 구도 타당·가역적 adapter 경계 권고),
  2L-3D aux 스캐너(PASS — stdlib 스캐너 채택 지지 + allowlist·bounded size·contract test 등 설계 권고, DEI/review-signal 분리 목록 제시).
- evidence: `provider_document_analysis_comparison_2026-07-04.md`, `hwpx_docx_auxiliary_structure_scanner_review_2026-07-05.md`, `gate_d_ocr_evidence_2026-07-04.md`.
- 현행 계약(read-only): `src/intake/dei_producer.py`(최소 인테이크 계약·`DEI_VERSION="1"`·bbox는 DEI만·findings 힌트는 `p.<n> · <섹션>` 자유텍스트·IntakeError fail-fast),
  `evidence_mapping_rules.md` §6(스캔/저신뢰→기존 not_verifiable 경로·anchor 미생성), `SKILL.md` Inputs(선택적 인테이크 어댑터·OCR은 현재 기능 아님),
  `tests/test_intake_dei_producer.py`(26 checks — 결정성·무판정·경계·core 미import), `docs/submission_packaging_policy.md`(원본/raw = E-분류), current_status·decision_log.

## Design goals

1. **가역성**: provider(Kordoc/tesseract.js)는 언제든 교체·제거 가능해야 한다 — 경계는 artifact 계약, 코드 결합 아님.
2. **core 불변**: schema/validator(detect-only)/renderer(no re-judgment)/delivery 무변경. Skill-first 유지.
3. **판정 미생성**: L2 산출물은 DEI candidate/검수 신호까지만. KSSB 판단·감사·인증·준수 결론 없음.
4. **검증 가능성 계승**: no-egress·결정성·native/license·artifact redaction을 구현 단계에서도 게이트 자산(Gate A/B/D 방식)으로 재검증 가능한 구조.
5. **최소·단순**: 새 공급망 0(ingest 층은 stdlib-only), 기존 L1 패턴(dei_producer) 확장으로 신규 개념 최소화.

## Non-goals

- L2 실제 코드·L3(도표/차트 분류)·MCP·provider 최종 확정·findings 스키마 변경·package/lock 변경·submission 패키징.
- OCR 정확도 개선/보증(Gate D와 동일: 실행 가능성·안전성 게이트이지 품질 인증 아님).

## Proposed L2 adapter boundary

```text
[사용자 로컬 · out-of-band · repo 밖 실행/자산]           [repo 내 · stdlib-only · opt-in · core 밖]
┌─────────────────────────────────────┐                 ┌──────────────────────────────────────┐
│ Runner 층 (실행)                     │   artifact 계약  │ Ingest 층 (정규화)                    │
│  · Kordoc CLI → intake.json          │ ──(JSON 3종)──▶ │  · dei_producer(기존, 최소 확장)      │
│  · tesseract.js → ocr_text.json      │                 │  · aux_structure_scanner(신규)        │
│  · (원본 zip류) aux scan 실행 선택지  │                 │     └ zip류 원본 직접 스캔도 가능      │
└─────────────────────────────────────┘                 └──────────────┬───────────────────────┘
      egress 게이트: 준비(허용·기록) ↔ 파싱(no-egress 훅)                │ DEI candidate (판정 없음)
                                                                        ▼
                                              Skill(재료로만 소비) → findings(기존 스키마 불변)
                                                        → validator(detect-only) → renderer → 사람 검수
```

- **경계 = artifact 계약 3종**(아래 Data flow). ingest 층은 "이미 만들어진 파일"만 읽는다(실행·네트워크 없음).
- provider 교체 시나리오: 다른 OCR 엔진이 `ocr_text.json` 형태만 만들면 ingest·Skill·core 전부 무변경. Kordoc 제거 시 L1/L0 fallback 그대로(기존 원칙).
- aux scanner만 예외적으로 **in-process 실행 가능**(stdlib-only·네트워크 모듈 미사용·로컬 zip 읽기 전용이라 runner 격리가 불필요) — 단 opt-in·core 미접속은 동일.

## Component responsibilities

| 구성요소 | 책임 | 하지 않는 것 |
|---|---|---|
| **Kordoc**(runner, repo 밖) | 주 구조 추출(PDF/HWP/HWPX/DOCX → intake.json), `needsOcr` 라우팅 신호 | OCR 실행(수식 OCR 미사용), core 접속, repo 내 설치 |
| **tesseract.js**(runner, repo 밖) | needsOcr 페이지의 스캔 OCR 텍스트 생산(ocr_text.json) — Gate D-proven 경로(로컬 core/wasm+lang 자산) | 구조 추출, 텍스트레이어 페이지 처리(비효율·불필요), 판정 |
| **aux_structure_scanner**(ingest, 신규·stdlib) | HWPX/DOCX zip+xml cross-check → aux_signals(이미지 3계층·표 top/nested·caption/heading 후보·gap 플래그) | 의미 해석(스타일명→판단 금지), raw XML/이미지 보존, 네트워크 |
| **dei_producer**(ingest, 기존·최소 확장) | intake.json(기존 계약) + ocr_text.json + aux_signals의 **additive 병합** → DEI candidate | 판정 생성, 원문 합성, findings 직접 생산 |
| **python-docx** | (제품 경로 아님) 개발·교차검증 전용 — native lxml 수반으로 제외(2L-3D) | 제품/제출 경로 포함 |

## Data flow (artifact 계약 3종)

1. **intake.json** — 기존 L1 계약 그대로(변경 없음): `success·metadata.pageCount·blocks·pageQuality·qualitySummary(+outline/warnings)`.
2. **ocr_text.json** (신규 계약, 최소형): 문서 hash·provider 이름/버전·모델(traineddata) 이름/hash·실행 모드(no-egress 여부)·페이지별 `{page, text, text_sha256}`·전체 output hash.
   - **provenance 필수**: 어떤 엔진·어떤 모델·no-egress 검증 여부가 남아야 Gate D 계열 증거와 연결된다.
   - 대상 페이지는 intake의 `needsOcr`/`ocrCandidatePages`와 일치해야 하며, 불일치는 ingest에서 IntakeError(fail-fast).
3. **aux_signals.json** (신규 계약): 2L-3D signal model — `image_resource_count·image_relationship_count·image_instance_count·table_tag_count·table_top_level_count·nested_table_count·heading_style_candidate_count·heading_recovery_candidate·caption_candidate_count·chart_relationship_count` + 플래그 `image_detection_gap·table_count_mismatch·review_required_reason[]`.

**DEI candidate 병합 규칙(additive)**:
- `ocr_supplement`(신규 optional 섹션): 페이지별 OCR 텍스트 + provenance. **blocks에 병합하지 않는다** — 텍스트레이어 원문(고신뢰)과 OCR 텍스트(저신뢰)의 출처 구분을 소비자(Skill·사람)가 항상 볼 수 있게 유지. `extraction_quality`는 `"low"` 고정(OCR 텍스트는 정확도 미보증 — Gate D 한계 명시 계승).
- `aux_structure`(신규 optional 섹션): counts(사실) 그대로.
- `review_priority_hints`(기존): gap 플래그를 기존 reason 체계에 추가(`image_detection_gap`·`table_count_mismatch` 등, priority=medium) — 기존 정렬·결정성 규칙 유지.
- 기존 필수 구조·의미는 불변 → 기존 소비자는 새 optional 섹션을 몰라도 동작(하위 호환).

## DEI candidate / review signal mapping (Codex 2L-3D 분리 준수)

| 분류 | 항목 | 소비 방식 |
|---|---|---|
| **DEI 재료(결정적 사실)** | 이미지/표/caption/heading counts, OCR 텍스트(+provenance), 위치 힌트 | Skill이 근거 재료로만 사용. 인용은 원문 그대로, 위치는 `p.<n> · <섹션>` 자유텍스트(bbox는 DEI 내부만) |
| **review-signal(플래그)** | `image_detection_gap`·`table_count_mismatch`·`review_required_reason`·provider-absent-vs-aux-present | **기존 §6 경로 전용**: not_verifiable + missing_info + customer_questions(requested_material) 라우팅, 검수 우선순위. **판정 규칙화 금지**, evidence_anchor 미생성 |

- OCR 텍스트를 인용(quote)으로 쓸 때의 원칙(설계 제안): Skill은 OCR 유래 인용에 **출처 표기(예: "OCR 추출")**를 붙이고, 저신뢰 신호가 있으면 confirmed 대신 partial/not_verifiable 쪽으로 보수적으로 매핑 — 세부 문구는 구현 사이클에서 evidence_mapping_rules §6에 최소 추가.

## Auxiliary signal model

2L-3D 제안 모델을 그대로 채택하되 **위치**를 확정: aux 신호는 **DEI candidate의 `aux_structure` optional 섹션**(문서 수준)과 `review_priority_hints`(플래그)로만 존재한다.
findings 스키마·evidence_anchor에는 어떤 aux 필드도 추가하지 않는다(숨은 스키마화 방지 — L1의 bbox 원칙과 동일).
**DEI_VERSION 처리(open question)**: optional additive 확장이므로 `"1"` 유지가 기본안(소비자는 미지 필드 무시), `"1.1"`/`"2"` bump는 Codex Review 의견 반영 후 결정.

## Version / dependency / no-egress strategy

- **pin/fail-fast(Version Strategy 8규칙 계승·확장)**: `kordoc@3.13.0`(npm-published baseline) + `pdfjs-dist@4.10.38`(v6 비호환 실측 — 미검증 버전 fail-fast·auto-upgrade 금지) + `tesseract.js@7.0.0`/`tesseract.js-core@7.0.0` + traineddata(kor/eng) **hash 고정**. 신버전 채택 시 Gate A/B/D 계열 재검증. kordoc 3.15.0 재비교는 follow-up 유지.
- **egress 분리**: 준비(설치·모델 다운로드) = 허용·기록(명령·출처·hash·시각) / 파싱·OCR = **no-egress**(Gate A/D 방식 Node 훅 — worker_threads 포함 — 또는 사용자 환경 OS 차단). runner 절차 문서에 고정.
- **native/license**: runner 의존성은 repo 밖(`--omit=optional`, native 0 확인 절차 유지). ingest 층은 stdlib-only(신규 공급망 0). defusedxml은 신뢰 경계 정의 후 별도 결정(후보만).
- **결정성**: 동일 입력→동일 산출 hash(2회 실행 비교)를 runner 절차·ingest 테스트 양쪽에 명시.

## Artifact and redaction policy

- 원본 문서·raw XML/JSON·OCR 원문·페이지 이미지·모델/traineddata·venv/node_modules = **repo 미커밋**(E-분류·`*.pdf` 등 gitignore 방어 유지). repo에는 계약·설계·evidence(집계·hash)만.
- 로컬 경로·계정 = `[REDACTED_LOCAL_PATH]`. DEI/ocr_text 내부의 원문 텍스트는 로컬 산출물로만 존재(repo 문서에는 미기재).
- **runner 스크립트 배치(open question)**: (a) thin runner 스크립트(nethook·실행 래퍼)를 `src/intake/runners/`에 커밋(리뷰 가능성·재현성 ↑, 의존성은 여전히 repo 밖) vs (b) 절차 문서화만 유지(현행). 기본안은 **(a) — 검증된 Gate D 자산을 리뷰 가능한 형태로 고정**하는 쪽이나, 제출 패키징 영향이 있어 Codex Review 의견 후 확정.

## Test strategy (구현 사이클 최소 기준)

1. **aux scanner contract**(신규 `tests/test_aux_structure_scanner.py`): 결정성(2회 동일 직렬화)·네트워크 모듈 미import(소스 스캔)·ZIP member allowlist·크기 상한(bounded read)·경로 탈출(zip-slip) 거부·raw XML 미보존(산출물에 원문 XML 부재)·합성 fixture 기반 카운트 정확성.
2. **dei 병합 contract**(기존 테스트 확장): ocr_supplement가 judgment 필드를 만들지 않음(재귀 키 스캔 — 기존 패턴)·blocks 불변(OCR 텍스트 미혼입)·ocr↔intake 페이지 불일치 IntakeError·aux 플래그가 priority hint로만 나타남·bbox findings 힌트 미전이(기존)·하위 호환(신규 섹션 없어도 기존 산출 동일).
3. **경계 유지**: core 미import 테스트(기존 패턴 재사용), 기존 4종(validator 26·renderer 22·delivery 33·intake 26) **무수정 green** = core 무변경 증거.
4. **fixture 정책**: 합성 소형 zip/dict만 손으로 구성(실 샘플·실 기업 문서 미커밋). 실 샘플 검증은 사용자 로컬 out-of-band + evidence 문서.

## Implementation plan for the next cycle (2L-4B 예정 — 순서 고정 아님)

- **신규**: `src/intake/aux_structure_scanner.py`(stdlib-only), `tests/test_aux_structure_scanner.py`.
- **최소 확장**: `src/intake/dei_producer.py`(ocr_supplement/aux_structure additive 병합 + fail-fast), `tests/test_intake_dei_producer.py`(병합 contract), `src/intake/README.md`(경계 갱신).
- **미세 보정(문서)**: `evidence_mapping_rules.md` §6(OCR 유래 인용 표기·gap 플래그 라우팅 1~2줄), `SKILL.md` Inputs(ocr_supplement 존재 시 취급).
- **(open question 채택 시)**: `src/intake/runners/`에 thin runner(nethook.cjs·OCR/parse 래퍼) + runner README.
- **불가침**: `src/schemas/*`·`src/validators/*`·`src/renderers/*`·manifest·marketplace·package/lock·`.mcp.json`.

## Open questions / nonblocking follow-ups

1. runner 스크립트 repo 내 커밋 여부(기본안 (a), 위 참조) — Codex 의견 요청.
2. DEI_VERSION 유지 vs bump — 기본안 "1" 유지(additive).
3. OCR 유래 인용의 findings 내 표기 형식(최소 문구) — 구현 사이클에서 §6에 확정.
4. (계승) HWPX 잔여 표 불일치 2건 분류·개요 스타일 실사용 샘플 재검증·defusedxml 판단·kordoc 3.15.0 source 재비교·OS 레벨 egress 재확인.

## Recommended next step

- 본 설계 **Codex Review** → 사용자/ChatGPT 승인 → **2L-4B L2 구현 사이클**(본 설계의 파일 목록·테스트 기준·경계 준수, 구현 후 Codex 구현 리뷰 필수).
- 그 전까지 L2/L3 코드 없음·provider 최종 확정 없음·제품 문서에 L2/L3를 현재 기능으로 표기하지 않음.
