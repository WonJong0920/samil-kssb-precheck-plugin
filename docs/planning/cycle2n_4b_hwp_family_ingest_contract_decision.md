# Cycle 2N-4B — HWP-family Ingest Contract Decision (+ Narrow Implementation)

> **성격**: 2N-4 blocker(HWP-계열 intake의 L1 ingest 계약 거부) 해소를 위한 **결정 문서 + 좁은 구현**.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: `docs/planning/cycle2n_4_hwp_first_assisted_retest_report.md`,
> Codex 2N-3B PASS(AVR-02 "ingest compatibility" 요구), 2L-4A adapter boundary 설계, D58(L1 계약)·D80(blocker 기록).
> **이 문서의 판단은 Codex review 대상이며, 2N-5 진입 여부의 최종 판단은 ChatGPT/User/Codex review 이후로 둔다.**

## 1. 2N-4 blocker 요약

Kordoc HWP/HWPX/DOCX intake artifact는 실제로 생성되지만(4/4 no-egress 검증 완료),
L1 ingest 계약(`dei_producer._validate_intake_contract`)이 **관측된 Kordoc PDF 출력 형태**(D58) 기준으로 동결되어 있어
HWP-계열 3종 전부 설계된 fail-fast로 거부됐다(PDF 대조군은 rc=0 정상):

- HWP/HWPX: `IntakeError: intake requires non-empty 'pageQuality'`
- DOCX: `IntakeError: metadata.pageCount as int >= 1`

## 2. 실제 Kordoc HWP/HWPX/DOCX artifact 관찰 (2N-4 산출물 + 2L-3C 교차)

repo 밖 2N-4 실물 artifact(hwp/hwpx/docx + PowerShell 한국어 파일명 hwpx — 2L-3C와 바이트 동일)를 직접 재관찰했다.

| 관찰 항목 | HWP | HWPX | DOCX | PDF(대조군) |
|---|---|---|---|---|
| `fileType` | `"hwp"` | `"hwpx"` | `"docx"` | `"pdf"` |
| `pageQuality`/`qualitySummary` | **모두 부재** | **모두 부재** | **모두 부재** | 존재 |
| `metadata.pageCount` | 1 | 1 | **부재**(키 없음) | 실제 페이지 수(11/9) |
| 블록 `pageNumber` | 전부 1 | 1 또는 **None**(2건) | **키 자체 부재**(103/103) | 실제 페이지 |
| `outline` | 있음(9건, 전부 p.1) | 없음 | 없음 | 있음 |
| 블록 유형 | heading 9·paragraph 71·image 70·table 25 | paragraph 80·image 70·table 25 | paragraph 78·table 25 | heading/paragraph/table |
| `table` 구조 | `{cells,rows,cols,hasHeader}` — PDF와 동일 | 〃 | 〃 | 기준 |
| **이미지 바이트** | top-level `images` + image 블록 `imageData`에 **base64 인라인** | 〃 | 〃(70건) | 없음 |
| `warnings` | 부재 | 부재 | 부재 | 있음 |

핵심 함의:
- **페이지 개념이 실질적으로 없다**: HWP/HWPX의 `pageCount:1`·전 블록 `pageNumber:1`은 물리 페이지가 아니라
  "단일 논리 문서" 표현이다(실물은 다페이지 문서). DOCX는 페이지 신호 자체가 없다.
  → `p.<n>` 위치 힌트를 그대로 쓰면 **존재하지 않는 페이지 좌표를 주장**하게 된다(anchor 품질 문제 — 2M-3B 계열).
- **품질 신호가 없다**: pageQuality/qualitySummary(needsOcr 포함)는 PDF 경로 전용 필드다.
- **분기 신호가 관측으로 확보된다**: `fileType` + pageQuality/qualitySummary 부재의 조합이
  PDF 형태와 HWP-계열 형태를 결정적으로 구분한다.

## 3. 기존 L1 ingest 계약과의 충돌 지점

| L1 계약 요구 | HWP-계열 실측 | 충돌 |
|---|---|---|
| `pageQuality` 비어 있지 않은 list | 부재 | fail-fast 거부 |
| `qualitySummary` dict | 부재 | fail-fast 거부 |
| `metadata.pageCount` int ≥ 1 | DOCX 부재 | fail-fast 거부 |
| 페이지 기반 hint/section 매칭(`p.<n>`·outline pageNumber) | 페이지 좌표 무의미 | 통과해도 **오해 유발** |
| needsOcr 페이지 정합(ocr_text 병합 기준) | 기준 신호 없음 | 정합 검증 불가 |

이 거부는 결함이 아니라 **경계 설계가 침묵 실패를 정확히 막은 것**이다(2N-4 판단 유지).
문제는 "계약이 틀렸다"가 아니라 "**PDF 형태만 계약화되어 있고 비페이지 포맷용 계약이 없다**"는 공백이다.

## 4. 선택 가능한 해결안 비교

| 안 | 내용 | 판단 |
|---|---|---|
| **(1) runner 측 정규화** | runner가 Kordoc 출력을 PDF 형태로 변환/보강해 저장 | **기각.** ① pageQuality를 합성해야 함(없는 신호 허위 생성 금지 위반). ② intake.json의 **provider 출력 바이트 결정성 증거**(2L-3C↔2N-4 동일)가 깨짐 — provenance 훼손. ③ 계약 로직이 core 미참조 source-only 도구에 들어가 경계가 흐려짐. |
| **(2) ingest 측 document-level 변형 계약** | `dei_producer`에 관측 기반 분기(HWP-계열 fileType + pageQuality/qualitySummary 부재)로 **별도 변형 계약**을 추가, 부재 신호는 additive 필드로 명시 | **채택.** 2L-4A 설계상 정규화는 ingest boundary의 역할("intake artifact 계약만 맞추면 provider 교체 가능"). 기존 paginated 경로는 코드·산출 모두 무변경 유지 가능(아래 §6). |
| **(3) 별도 compatibility layer 모듈** | 새 모듈/새 진입점(`normalize_hwp_intake()` 등) | **기각.** 진입점이 둘이 되어 소비자(Skill 지침·runner 문서)가 분기 책임을 지게 됨. PDF 형태로 변환하는 순간 (1)과 같은 합성 문제. 단일 진입점 내부의 명시 변형이 더 좁고 안전. |
| **(4) docs-only(구현 보류)** | 결정 문서만 남기고 중단 | **불채택.** 관측 근거(3포맷 실물 artifact + PDF 대조군)가 이미 충분하고, 변경 범위가 additive·좁음·기존 경로 무변경으로 통제 가능 — 프롬프트 기준 A(안전한 좁은 구현 가능)에 해당. |

## 5. 채택한 해결안 — document-level 변형 계약 (구현 완료)

### 5.1 분기 조건 (`is_document_level_intake()`)

`fileType ∈ {"hwp","hwpx","docx"}` **이고** `pageQuality`/`qualitySummary` **모두 부재**일 때만 변형 적용.

- fileType이 `"pdf"`이거나 부재 → 기존 paginated 계약 그대로(누락은 종전대로 거부 — **fail-fast 약화 없음**).
- HWP-계열이라도 pageQuality가 존재하면(미래 Kordoc) paginated 계약 적용 — **신호가 있으면 더 엄격한 쪽**.

### 5.2 변형 계약 검증 (`_validate_document_level_contract()`)

`success == true` + `metadata`(dict) + **비어 있지 않은 blocks** + 최소 1개 블록에 text(비공백)/table 필수.
페이지 품질 신호가 없는 포맷에서는 **blocks가 유일한 구조 증거**이므로 빈 blocks는
"유효하지만 근거 빈약"과 malformed를 구분할 수 없어 거부한다(스캔 전용 PDF와 대칭 논리).

### 5.3 부재 신호의 source-bound 표현 (합성 금지)

- pageQuality/qualitySummary를 **만들어내지 않는다.** 대신 `doc_quality`에 **additive 필드**로 부재를 명시:
  `pagination="document_level"` · `page_count_basis="provider_reported"|"not_reported"` · `quality_signal="not_reported"`.
  기존 paginated 산출에는 이 필드가 **추가되지 않는다**(부재 = paginated L1, 하위 호환·DEI_VERSION "1" 유지 — 2L-4B additive 원칙).
- `page_count`: provider가 보고한 int≥1만 통과(HWP/HWPX=1), 없으면 **0 + "not_reported"**(DOCX).
  `pagination="document_level"`일 때 page_count는 물리 페이지 수로 해석 금지(문서화).
- `needs_ocr`: 기준 신호가 없으므로 bool 계약을 유지한 채 False로 두되, `quality_signal="not_reported"`가 부재를 명시하고
  **doc-level 검수 hint `page_quality_signal_unavailable`(medium)**로 라우팅에 노출한다(판정 아님 — 기존 §6 경로 재료).
- 위치 힌트: `p.<n>` **미사용**(무의미한 페이지 좌표 주장 방지). heading 블록의 **문서 순서** 기반 섹션 추적으로
  `doc-level · <섹션>`(신규 `doc_level_hint()`), 섹션 없으면 `doc-level`. 블록의 provider 원시 `pageNumber`는
  DEI `page` 필드(1 또는 0)로 그대로 통과시켜 추적성은 보존하되 사람-facing 힌트에는 쓰지 않는다.
- 블록 `extraction_quality`: 페이지 신호가 없으므로 **블록 자체 텍스트의 깨짐 신호**(PUA/replacement 비율 — 기존
  `_BAD_RATIO` 상수 재사용)로만 결정적으로 계산. **"high"는 부여하지 않는다**(품질 신호 부재 상태에서 고신뢰 주장 금지 —
  보수 상한 medium, 빈 텍스트/깨짐은 low). 관측치가 아닌 값을 기본값으로 지어내지 않는다.
- **이미지 base64 미유입**: Kordoc이 인라인한 `images`/`imageData` 바이트는 DEI로 가져오지 않는다
  (image 블록은 파일명 텍스트만 — 테스트로 강제).
- `ocr_text` 병합: **명시 거부**(IntakeError). needsOcr 페이지 정합의 기준 신호가 없어 검증 불가 —
  침묵 병합 대신 fail-fast(HWP-first에서 OCR 산출물은 어차피 범위 밖·미생성. OCR 경로가 열리면 별도 결정 필요).
- `aux_signals` 병합: 기존 2L-4B 로직을 공용 helper(`_merge_aux_signals`)로 추출해 **동일 로직** 재사용
  (gap 비교는 hint로만 — 실물에서 hwpx `table_count_mismatch`(intake 25 vs aux 27)·docx `image_detection_gap`
  (intake image 블록 0 vs aux 70)이 실제 검수 신호로 발화함을 확인).

### 5.4 DOCX pageCount 처리 원칙

"없는 값은 없다고 기록한다": pageCount 부재/비정상 → `page_count=0` + `page_count_basis="not_reported"`.
1 같은 그럴듯한 기본값을 지어내지 않고, 0이 sentinel임을 basis 필드가 명시한다.

## 6. 기존 PDF path 영향 여부 — 없음 (실측)

- 분기 앞단에서 document-level 조건이 아니면 **기존 코드 경로가 그대로** 실행된다(검증 함수·산출 로직 무변경.
  aux 병합의 helper 추출은 동일 로직의 이동이며 산출 불변).
- **byte-diff 실측**: 2L-3C PDF 대조군(textpdf)의 DEI 산출을 변경 전/후 비교 → **byte-identical**.
- 기존 테스트 56건 무수정 green(paginated 거부 케이스 포함 — pageQuality 누락 거부 등 그대로).

## 7. source-bound / fail-fast / no-overclaim 검토

- **source-bound**: 모든 산출 값이 artifact 관측값에서만 유도(fileType·pageCount·블록 텍스트·heading 순서).
  합성한 것은 없고, 부재는 명시 필드/hint로 기록.
- **fail-fast**: 변형은 자동 완화가 아니라 관측 기반 명시 분기. 조건 밖 입력은 종전과 동일하게 거부되고,
  변형 안에서도 success/metadata/빈 blocks/내용 없는 blocks/ocr_text가 거부된다(negative 테스트 8건).
- **no-overclaim**: L2 전체 완료·OCR 지원·provider finalization 선언 없음. 이 구현은
  "repo-side ingest boundary"의 **비페이지 포맷 계약 확장**이며, 상태는 **구현 완료 + Codex review 대기**
  (2L-5 승격 라벨에 자동 편입되지 않음 — 승격 여부는 리뷰 후 별도 판단).

## 8. images/ 부산물 artifact policy 판단

2N-4 관찰: Kordoc이 out-dir에 `images/`(문서 내 이미지 70개)를 추출하고, **intake.json 안에도 base64로 인라인**한다.

**정책(문서화로 처리 — runner 코드 무변경)**:
- out-dir 산출물 전체(images/ 포함)는 **원본 문서와 동일한 민감도**로 취급 — repo/커밋 금지(원본 미커밋 원칙과 동일),
  삭제는 out-dir 제거로 완결. `runners/README.md`에 명시.
- 1차 방어 = repo 밖 out-dir(기존 runner 경고 + `.gitignore` `*.intake.json` 유지). `images/` 패턴의 `.gitignore` 추가는
  **하지 않음**(일반 폴더명이라 무관한 경로 오차단 부작용 — 기각 사유 기록).
- 자동 삭제(cleanup 옵션)도 **하지 않음**: 이미지는 컨설턴트 검수에 유용할 수 있는 사용자 로컬 데이터 — 사용자 데이터의
  무단 삭제는 승인 UX 원칙과 충돌. 필요해지면 별도 결정.
- DEI 미유입은 코드+테스트로 강제(§5.3).

## 9. 변경 파일과 테스트 결과

| 파일 | 변경 |
|---|---|
| `src/intake/dei_producer.py` | document-level 변형(분기 `is_document_level_intake`·계약 검증·빌더 `_build_document_level_dei`·`doc_level_hint`·블록 품질 계산) + aux 병합 helper 추출(`_merge_aux_signals` — 로직 동일) + docstring 계약 설명 |
| `tests/test_intake_dei_producer.py` | 56→**83**(+27: 수용·paginated 불변·page_count basis·힌트 규칙(p.<n> 미사용/heading 순서 섹션)·base64 미유입·품질 보수 상한/low·hint·fail-fast 8건·ocr_text 거부·aux 병합·결정성) |
| `src/intake/README.md` | document-level 변형 계약 문단(Codex review 대기 명시) |
| `src/intake/runners/README.md` | 산출물 취급 주의(images/·base64 인라인 — §8 정책), ingest 연결 문구 갱신 |
| `docs/current_status.md` / `docs/decision_log.md` | 2N-4B 항목 / D81 |

**무변경**: schema/validator/renderer/delivery/Skill/manifest/runner 본체(`hwp_assisted_runner.py`)/nethook/package·lock.

**검증 실행 결과** (pytest 미설치 — standalone 실행, 명령: `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python tests/<file>.py`):

- `git diff --check` clean · `git status --short` 의도 파일만.
- intake **83/83** · aux **26/26** · runner **49/49** · nethook **29/29** · validator **30/30** · renderer(smoke) **22/22** · delivery **34/34** — 전부 green.
- **실물 검증(repo 밖 2N-4 artifact 재사용 — Kordoc 재실행 없음)**: hwp/hwpx/docx/한국어 파일명 hwpx 4종 전부
  `dei_producer` CLI **rc=0**(blocks 175/175/103/175, 한글 4,878자 보존, base64 누출 0, 2회 실행 결정성 확인,
  hwpx/docx aux 병합·gap hint 발화, HWP heading 9개 기반 섹션 힌트 생성·`p.<n>` 0건).
- **PDF 대조군 byte-identical**(변경 전 baseline과 cmp 일치).

## 10. Codex review가 봐야 할 핵심 쟁점

1. 분기 조건의 안전성: `fileType` allowlist + 두 필드 부재 조합이 malformed PDF 산출물을 변형 경로로 빠뜨릴 여지가 없는가.
2. `needs_ocr=False`(bool 계약 유지) + `quality_signal="not_reported"` + hint 조합이 "OCR 불필요"로 오독될 여지 —
   Skill 지침(§6/§7) 측 보강 필요 여부(이번 사이클은 Skill 문서 무변경 — 의도적 보류).
3. 블록 품질 보수 상한(medium)의 적정성 — 특히 image 블록(파일명 텍스트)이 medium이 되는 것의 검수 신호 영향.
4. `doc-level · <섹션>` 힌트 표기가 findings `page_or_section` 자유텍스트 관례와 충돌하지 않는지
   (evidence_mapping_rules §6은 `p.<n> · 섹션` 표기를 예시로 듦 — 문서 갱신 필요 여부).
5. document-level에서 ocr_text 명시 거부가 향후 OCR 경로(gated)와 충돌하지 않는지.
6. images/ 정책(§8 — 문서화만, gitignore/cleanup 미추가)의 적정성.

## 11. 2N-5 진입 가능 여부 (판단 근거만 — 최종 판단은 리뷰 후)

- 2N-4 blocker였던 "HWP-계열 E2E가 DEI 합류 단계에서 끊김"은 **이 구현으로 기술적으로 해소**됐다
  (실물 4종 rc=0 + 회귀 green + PDF 무영향).
- 단 운영 원칙(작업 → Codex 독립 리뷰)상 **이 계약 확장은 아직 미리뷰 상태**다. ingest boundary는 2L-5에서
  "implemented+reviewed"로 승격된 표면이므로, 그 계약을 바꾼 본 변경은 **Codex review를 거쳐야 승격 상태가 회복**된다.
- **권고**: Codex 2N-4B review(PASS) → 2N-5 black-box 진행. review 없이 2N-5를 진행하면 미리뷰 계약 위에서
  black-box 결과를 쌓게 되어 재작업 위험. 최종 분기는 ChatGPT/User 결정.
