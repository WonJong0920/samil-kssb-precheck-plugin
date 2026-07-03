# Cycle 2J — Mistral OCR 4 문서지능 구조 벤치마크 (계획 보완)

> **성격**: **구조 벤치마크를 통한 계획 보완 문서**(문서 수준). **구현 사양 확정이 아니다.** Mistral OCR 4를 **실제 도입/실행 대상으로 보지 않는다**(API/Python/SDK/notebook 실행·외부 문서 업로드 없음).
> 목적: Mistral OCR 4의 문서 판독 구조를 참고해, 현재 Kordoc optional/local adapter·DEI·evidence 구조에 **추가할 개념 / 추후 다룰 개념 / Codex 검증 개념 / 제외 개념**을 자율 판단한다.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Gate A/B PASS·Version Strategy 확정(모두 Codex PASS) + 공개 링크 확인.

## 0. 확인 출처 / 확인 한계

- 공개 링크 read-only 확인(WebFetch): `https://mistral.ai/news/ocr-4/`(제품 설명), `mistralai/cookbook .../ocr/batch_ocr.ipynb`(배치 예제, raw).
- **확인된 것 vs 확인 못 한 것을 구분**(추정 단정 금지):
  - 뉴스 페이지 명시: bounding box, typed-block 분류(titles/tables/equations/signatures 등), **inline confidence(페이지·단어 단위)**, markdown + structured JSON, **dual layer**(raw OCR ↔ 선택적 "Document AI" 스키마/프롬프트), Batch API.
  - 배치 노트북 명시: JSONL 항목이 `custom_id`로 keying, 문서는 base64/`files.upload(purpose="batch")`, `batch.jobs.create(endpoint="/v1/ocr")`, `status`/`total|failed|succeeded_requests` 폴링, 결과 다운로드 후 `custom_id`로 매핑. **이 예제 결과는 `pages[].markdown`만** 사용(해당 노트북엔 bbox/confidence 미시연).
  - 미확인: 실제 confidence 스키마 형태, batch manifest 상세 필드 전체, HITL 워크플로 세부 — **단정하지 않음.**

## 1. Mistral OCR 4에서 벤치마크할 구조

| 구조 요소 | Mistral(확인) | 벤치마크 가치 |
|---|---|---|
| page/block 파싱 | 블록 단위 추출·의미 청킹 | 인테이크 기본 구조(이미 보유) |
| bounding box / location anchor | bbox로 in-context highlight | 근거 위치 하이라이트 개념 |
| typed block 분류 | titles/tables/equations/signatures 등 | block_type 확장 후보 |
| inline confidence | 페이지·단어 단위 점수 | **검수 우선순위 신호**(핵심 차용) |
| markdown output | markdown + structured JSON | 이미 보유(Kordoc markdown) |
| raw OCR ↔ Document AI 분리 | 추출층 ↔ 스키마/프롬프트 재구성층 | **계층 분리**(이미 반영된 구조 확인) |
| batch manifest | custom_id JSONL·job status counts | 로컬 배치 상태/재현 개념 |
| HITL verification | confidence 기반 검수/redaction | 사람 검수 라우팅 강화 |

## 2. 기존 Kordoc 계획과의 차이

- **이미 로컬로 확보(Kordoc, Gate A/B 검증)**: `blocks[].type`(heading/paragraph/table)·`pageNumber`·`bbox`·`outline`(섹션)·`pageQuality`·`needsOcr`·`warnings`·`markdown`. → Mistral raw OCR의 **구조 대부분을 Kordoc이 오프라인으로 이미 제공**한다.
- **Mistral이 추가로 갖는 것**: (a) 더 풍부한 typed block(equation/signature 등), (b) **per-word/per-page inline confidence**, (c) 스캔/이미지 OCR 자체(현재 v1은 `needs_ocr` **신호로만** 다루고 실행은 제외).
- **결정적 차이**: **Mistral OCR = 클라우드 API(문서 업로드/egress)**, Kordoc = **로컬/오프라인**(Gate A no-egress PASS의 전제). 민감한 KSSB 공시자료 전제에서 이 차이가 도입 가능성을 좌우한다.

## 3. 현재 DEI/evidence 구조에 추가할 수 있는 개념 (문서 수준, schema 미변경)

DEI(문서 수준, 2I-3 §5 개념)에 **선택 필드로만** 반영 후보(findings schema·validator·renderer **불변**):
- **per-block/per-page `confidence`**(재료 신호, §4 방식) — 기존 `extraction_quality`/`evidence_confidence`를 세분.
- **`block_type` enum 확장 후보**(table/figure/equation/signature 등) — 현재 heading/paragraph/table에서 개념 확장.
- **`bbox_or_location_hint`**(이미 DEI 개념에 존재) — 검수자용 **원문 위치 하이라이트 힌트**로 활용(§5).
- **판정 미생성 경계 유지**: 위 전부 "근거 후보·위치·품질 신호"일 뿐, `judgment_code`/`judgment_label`은 **Skill**이 source-bound로 결정.

## 4. confidence를 "판단"이 아니라 "검수 우선순위"로 쓰는 방식

- Mistral도 confidence를 **citations/redaction/HITL**를 구동하는 신호로 쓴다(자동 확정이 아니라 사람 확인 유도). 현재 설계와 방향 일치.
- **채택 방식**:
  - confidence는 **어떤 evidence anchor를 컨설턴트가 먼저 검증할지 우선순위**를 매기는 데만 사용(정렬/표시 우선순위).
  - **저confidence 구간은 자동 미공시/판정으로 단정하지 않고** "확인 불가 → `missing_info` + `customer_questions` + 요청자료"로 라우팅.
  - renderer는 confidence로 **재판정하지 않는다**(no re-judgment). validator는 detect-only. 최종 판단·근거 선택은 **사람 검수 + Skill(source-bound)**.
- → confidence는 **검수 트리아지 신호**이지 KSSB 판단/감사/인증/준수확정 신호가 아니다.

## 5. bounding box / block type / page anchor를 evidence anchor에 반영하는 방식

- 현재: DEI `page_number`+`section_path` → `evidence_anchor.page_or_section`, 발췌 → `quote`. **bbox는 evidence_anchor에 대응 필드 없음(축약 손실, 허용)**.
- 벤치마크 반영(개념): **bbox/block_type는 DEI 위치 힌트로 유지**하고, 용도는 **검수자에게 원문 위치를 하이라이트**해 quote 실재성 확인을 빠르게 하는 것. findings `evidence_anchor` **스키마는 변경하지 않는다**(Codex 검증 포인트).
- block_type는 표/그림/서명 등 **근거 유형 라벨**로 검수 참고에만 사용(판정 아님).

## 6. batch manifest / result hash / page-level status 구조

- Mistral batch: `custom_id` keying + job status(`total|failed|succeeded_requests`) + 결과 `custom_id` 매핑.
- **추후 로컬 개념으로 차용(클라우드 배치 API 아님)**:
  - **안정적 키(custom_id류)**로 문서·페이지 결과를 매핑.
  - **per-doc/per-page status**(succeeded/failed/needs_ocr)로 부분 실패를 명시(조용한 누락 금지 — Version Strategy fail-fast 정신과 정합).
  - **result hash**(결정성 지문) — Gate A 결정성 해시·RH-B1 `INVENTORY_SHA256`와 같은 재현성 규율.
- 성격: **로컬·오프라인·결정적** 배치 개념. 이번 사이클은 **계획 개념까지만**(구현·매니페스트 파일 생성 없음).

## 7. API / Python / SDK / notebook 실행을 제외하는 이유

- **egress**: Mistral OCR는 **클라우드 API**이며 배치 예제는 문서를 **base64/파일 업로드**한다 → 민감 KSSB 공시자료가 **외부로 전송**된다. **Gate A(no-egress) 전제 위배**(외부 문서 업로드 금지 항목과도 충돌).
- **의존/자격/비용**: `mistralai` SDK(외부 hard dependency), **API key/자격증명**(repo 비노출 원칙), 페이지당 과금.
- **결정성/재현성**: 외부 모델 버전 변동 → 결정성 보장이 로컬보다 약함(Version Strategy 재현성 규율과 상충).
- 따라서 이번 문서는 **구조만 참고**하고 실행·호출·업로드·의존 추가를 하지 않는다.

## 8. Mistral을 지금 도입하지 않고 구조만 참고하는 이유

- v1은 **오프라인/로컬**이 전제(Gate A PASS가 no-egress에 의존). 클라우드 OCR 도입은 이 전제를 근본적으로 바꾼다.
- 필요한 raw 구조(page/block/bbox/typed-block/markdown)는 **Kordoc이 로컬로 이미 제공** → 지금 얻을 증분 가치는 주로 **confidence·스캔 OCR**인데, 둘 다 **별도 게이트**(스캔/OCR은 gateprep §13, 클라우드는 egress) 대상.
- 결론: **구조·개념 벤치마크로 계획을 강화**하되, 도입은 별도 승인·게이트(§10) 전까지 보류.

## 9. 기존 Gate A/B/Version Strategy와 충돌하지 않는 보완 방향

- 추가되는 것은 **문서 수준 DEI 개념(confidence 트리아지·block_type/bbox 힌트·로컬 배치 status/hash)**뿐 → **core 무변경**(schema/validator/renderer/delivery/manifest/marketplace/package 불변).
- **egress 없음**(로컬 개념만), **버전 규칙 불변**(kordoc/pdfjs pin·fail-fast 유지), **confidence는 재료 신호**(no re-judgment·detect-only·source-bound·human-review 유지), `submission_packaging_policy.md` 정합(원본 PDF·node_modules·자격증명 미포함).
- 따라서 본 벤치마크는 Gate A/B/Version Strategy·Residual Hardening과 **충돌하지 않는 보완**이다.

## 10. 향후 실제 도입 검토 시 필요한 별도 gate — "Gate C (외부/클라우드 OCR egress)"

Mistral(또는 임의 클라우드 OCR)의 실제 도입은 Kordoc 로컬 게이트와 **다른, 더 엄격한** 게이트가 필요하다:
- **데이터 egress 명시 승인**: 민감 공시자료의 외부 전송을 사용자가 명시 승인(기본 비활성). **하드 no-egress는 클라우드 OCR에서 불가**하므로 Gate A와 별개.
- **프라이버시/DPA·법률·ToS 검토**: 데이터 처리·보존·재사용 조건, 제출/재배포 영향.
- **자격증명 처리**: API key는 **repo 비노출**, 사용자 로컬/비밀관리로만.
- **비용·결정성·가용성**: 과금·모델 버전 변동·오프라인 불가 리스크.
- **로컬/오프라인 우선 원칙**(gateprep §13 OCR 게이트 연장): 로컬 OCR을 우선 검토하고, 클라우드는 데이터 유출 관점 별도 심사.
- → 도입 판단은 이 **Gate C**와 사용자/ChatGPT 승인 이후 별도 사이클에서만.

## 11. 벤치마크 판정 요약 (반영 / 추후 / Codex-검증 / 제외)

| 후보 | 판정 | 근거 |
|---|---|---|
| page/block 파싱 | **반영(현행 유지)** | Kordoc이 이미 로컬 제공 |
| markdown 구조 출력 | **반영(현행 유지)** | Kordoc markdown 보유 |
| raw OCR ↔ Document AI 계층 분리 | **반영(구조 확인)** | 어댑터=raw 재료, Skill=판정과 동형; 자동판정 금지 유지 |
| inline confidence → 검수 우선순위 | **추후 + Codex-검증** | DEI 선택 필드로 개념 반영, no re-judgment 경계 검증 필요 |
| bbox / location anchor(하이라이트) | **추후 + Codex-검증** | DEI 위치 힌트, evidence_anchor schema 불변 확인 |
| typed block 분류 확장 | **추후** | DEI `block_type` 확장 후보(검수 참고용) |
| batch manifest/status/result hash | **추후(로컬 개념)** | 클라우드 배치 아님; 결정성/부분실패 명시 |
| scanned/이미지 OCR 실행 | **제외(현 범위)** | gateprep §13 OCR 게이트; v1은 needs_ocr 신호만 |
| Mistral 클라우드 API/SDK/실행 | **제외** | egress·자격·비용·hard dep → Gate C 전까지 금지 |

## 12. 경계 재확인

- Mistral OCR 4는 **core dependency도, 실제 실행 기능도 아니다**(구조 벤치마크 대상일 뿐). API 호출·문서 업로드·SDK/Python/notebook 실행 없음.
- **OCR/confidence는 KSSB 판단·감사·인증·준수확정 기능이 아니다.** confidence는 검수 우선순위 신호, 최종 판단은 사람 검수 + Skill(source-bound).
- Skill-first·validator detect-only·renderer no re-judgment·delivery separation·source-bound·human-review 불변. Kordoc은 계속 optional/local(§Version Strategy V8).

## 13. 다음 단계

- 본 벤치마크는 **계획 보완**(개념 판정). 실제 반영(DEI confidence 필드·bbox 힌트·로컬 배치 개념)은 **구현-prep/구현 사이클**에서 RH-B2 종료·사용자 승인 후.
- Mistral 등 클라우드 OCR 도입은 **Gate C(§10)** 통과 시에만 별도 검토.
- 다음 단계 = Codex Review(본 문서) → 사용자/ChatGPT 판단.
