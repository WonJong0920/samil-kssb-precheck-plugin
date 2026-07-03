# Cycle 2K — OCR / Scanned PDF / Image Analysis Capability Ladder 계획 (제출 목표 반영)

> **성격**: **계획 보강 문서**(문서 수준). 구현이 아니다. 최종 제출 목표가 text-PDF 처리에 머무르지 않고 **가능한 범위 안에서 OCR·스캔 PDF·이미지 기반 페이지·이미지/도표/표/차트 근거 후보 식별·검수 라우팅까지 확장**됨을 명시하고, 그 확장을 **단계(capability ladder) + 게이트**로 고정한다.
> **하지 않는 것**: 코드 구현·패키지 설치·Python/notebook 실행·API 호출·외부 문서 업로드·OCR 엔진 설치/실행·MCP 설정·raw artifact·submission.zip·src/tests/schema/validator/renderer/delivery/Skill/manifest/marketplace 변경.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Gate A/B PASS·Version Strategy 확정·2J 벤치마크(전부 Codex PASS) + 2J minor(C2J-MISTRAL-MIN-01).

## 1. 제출 목표에서 OCR / Scanned PDF / Image Analysis의 의미

- **의미**: 스캔·이미지 기반 공시자료에서도 (a) 판독 필요 구간을 **감지**하고, (b) 가능하면 텍스트/표를 **추출**하고, (c) 이미지·도표·표·차트를 **근거 후보로 식별**하며, (d) **위치(page/bbox)·품질(extraction_quality)·신뢰도(confidence)** 신호로 **사람이 검수 가능한 evidence routing**을 제공하는 것.
- **의미가 아닌 것**: 차트 수치·이미지 의미·KSSB 충족 여부를 **임의 추정·자동 판정**하는 기능, 감사·인증·준수확정 기능. 최종 판단은 **Skill의 source-bound 판정 + 사람 검수**로 불변.
- **현재 문서상 gap**: 기존 계획(2I-3~2J)은 OCR/스캔을 v1에서 **의도적으로 제외**하고 `needs_ocr` 신호까지만 다뤘다. "제출 목표가 거기까지 확장된다"는 방향과 단계 구조가 문서화되어 있지 않았다 → **본 문서가 그 gap을 채운다.** 기존 문서(2J 등)는 Codex PASS 상태를 유지하기 위해 수정하지 않고 **새 문서로 보강**한다.

## 2. 현재 완료된 text-PDF/Kordoc 경로와의 관계 (L0 기반)

- 완료·검증된 것(L0): `kordoc@3.8.2 + pdfjs-dist@4.10.38` 로컬 텍스트 PDF 파싱 — page/block(heading/paragraph/table)·bbox·outline·pageQuality·**needsOcr/ocrCandidatePages**·warnings(`SKIPPED_IMAGE` 등)·markdown. Gate A(no-egress, 프로세스 레벨)·Gate B(v1 폐포 전부 permissive)·Version Strategy 8규칙 확정.
- 본 계획의 모든 상위 단계(L1~L4)는 **L0 위에 얹는 확장**이며, L0의 게이트 결과·경계(optional/local, core hard dependency 금지)를 **대체하지 않는다.**

## 3. Kordoc의 역할 재정의 (OCR 엔진이 아니다)

**판단: Kordoc = "OCR-needed detection + page quality + block/bbox/table/image extraction + (후보) OCR orchestration layer". OCR 엔진 자체가 아니다.**

- **이미 실측 확인된 역할(로컬)**: text-PDF parsing, page/block/table/bbox 추출, `pageQuality`(hangul/PUA/저텍스트 비율), `needsOcr`·`ocrCandidatePages`(스캔/이미지 페이지 감지), `warnings`(이미지 영역 텍스트 없음 등) → **L1 감지·라우팅의 재료가 이미 있다.**
- **후보 역할(게이트 뒤)**: Kordoc의 optional 계열(`@hyzyla/pdfium`·`sharp`·`onnxruntime-node`·`@huggingface/transformers`, `--formula-ocr`)은 이미지 렌더·로컬 모델 실행 능력이 있어 **로컬 OCR provider를 붙이는 orchestration layer** 후보가 된다. 단:
  - 이들은 **Gate B가 v1 폐포 밖으로 격리한 native/LGPL 계열**이다 → 활성화하려면 **Gate B 재검토 필수**.
  - `--formula-ocr`는 첫 사용 시 **~155MB 모델 다운로드(egress)** → "로컬 OCR"도 **모델 준비 단계의 네트워크**와 **파싱 단계 no-egress**를 분리 검증해야 한다(Gate A의 설치/파싱 분리와 동형).
- **불변**: Kordoc은 계속 **optional/local external adapter 후보**이며 **plugin core hard dependency로 바꾸지 않는다**(Version Strategy V8).
- OCR 결과의 합류 경로: OCR 산출 텍스트/표는 **DEI 후보**(`extracted_text_or_table_markdown`+`needs_ocr` 이력+`extraction_quality`)로 합류 → Skill이 source-bound로 소비. renderer/validator에 직접 유입 금지(기존 경계 유지).

## 4. Mistral OCR 4 벤치마크의 역할 연결

**판단: Mistral OCR 4는 API 도입 후보가 아니라, Kordoc으로 추출한 이미지·도표·표 블록을 더 잘 다루기 위한 "구조 참고 모델"이다**(2J 결론 유지).

| Mistral 구조(2J 확인) | 본 계획에서의 활용 |
|---|---|
| typed block 분류(table/figure/equation/signature) | L3 이미지·도표·표 **후보 분류 설계** 참고(DEI `block_type` 확장 후보) |
| bbox / location anchor | L1~L3 **검수 하이라이트**(원문 위치 제시) 설계 참고 |
| inline confidence | **검수 우선순위(triage)** 신호 설계 참고 — KSSB 판단 아님 |
| raw OCR ↔ Document AI 분리 | 추출층(어댑터/OCR) ↔ 판정층(Skill) 분리의 동형 확인 |
| batch `custom_id`/status/result hash | 로컬 결정적 배치 상태·재현성 개념(부분실패 명시) |
| HITL verification | low-confidence → 사람 검수·요청자료 라우팅 설계 참고 |

- Mistral API 연결·SDK 설치·notebook 실행·외부 문서 업로드는 **본 계획에서도 제외**(Gate C 전까지 금지).

## 5. Capability Ladder (L0~L4)

각 단계는 **allowed(구현 대상) / prohibited(금지·라우팅 대상)**를 명시한다. 상위 단계는 하위 단계와 해당 게이트 통과 없이는 착수 불가.

### L0 — 텍스트 PDF 파싱 (완료·검증됨)
- **allowed**: 로컬 텍스트/표/위치/품질 추출(Gate A/B/Version 완료). 구현 착수는 별도 승인+RH-B2.
- **prohibited**: OCR 실행, native/optional 의존성 사용.
- **게이트**: Gate A·B PASS, Version 확정(완료).

### L1 — 스캔/이미지/도표 존재 **감지 + 검수 라우팅** (구현 후보, 추가 게이트 불요)
- **allowed**: 이미 검증된 Kordoc 신호(`needsOcr`·`ocrCandidatePages`·`pageQuality`·`SKIPPED_IMAGE`·image/table block·bbox)를 DEI로 수집해 —
  (a) 스캔/이미지 페이지·이미지/도표/표 블록을 **근거 후보 위치로 식별**, (b) `extraction_quality`/confidence류 신호로 **검수 우선순위** 부여,
  (c) 판독 불가/저신뢰 구간을 **`missing_info` + `customer_questions` + 요청자료**로 라우팅, (d) bbox/page anchor로 **검수 하이라이트 힌트** 제공.
- **prohibited**: OCR 실행, 이미지 내용 해석·수치 추정, 자동 판정.
- **게이트**: 신규 게이트 불요(기존 Gate A/B 검증 범위 내 신호만 사용). 단 **구현 착수는 사용자/ChatGPT 승인 + RH-B2**(기존 규칙).
- **제출 목표 관점**: L1까지가 "스캔 PDF·이미지 존재에 **대응**하는 MVP" — 판독은 못 해도 **어디를 사람이 봐야 하는지**를 제시.

### L2 — 로컬 OCR 실행 (이미지 내 텍스트) — **Gate D 필요**
- **allowed(게이트 통과 후)**: 로컬/오프라인 OCR provider(Kordoc orchestration 또는 별도 로컬 도구)로 스캔 페이지·이미지 블록의 **텍스트만** 추출 → DEI 후보로 합류(`needs_ocr` 이력·`extraction_quality` 필수 기록). 저신뢰 결과는 정량 근거로 승격 금지, 요청자료 라우팅.
- **prohibited**: 클라우드 OCR, 차트 수치 추정, OCR 텍스트의 무검수 판정 사용.
- **게이트**: **Gate D(로컬 OCR provider 게이트)** — 2I-3A §13 "OCR provider 별도 승인 게이트"의 공식화: ① 사용자 명시 승인, ② **모델/도구 준비 단계(다운로드 egress 허용, 기록) ↔ 파싱 단계(no-egress 증명, Gate A 방식)** 분리 검증, ③ native/LGPL 의존성 재유입에 대한 **Gate B 재검토**, ④ 결정성·재현성 evidence, ⑤ **비민감 스캔 샘플(유형3) 확보 후 검증**(2I-3A 미확보 잔여 항목).

### L3 — 이미지·도표·표·차트 **구조 분석/후보 분류** — Gate D + 설계 검증
- **allowed(게이트 통과 후)**: 블록의 **유형 분류**(표/그림/차트/서명 등, Mistral typed-block 참고)와 위치·품질 신호 강화, 표 구조 복원 확장. 분류는 **검수 참고 라벨**.
- **prohibited**: **차트 수치 읽기·이미지 의미 해석·KSSB 충족 추정** — 이는 자동 판정 계층이 되므로 금지. 해당 구간은 항상 사람 검수 + 요청자료.
- **게이트**: Gate D + 분류 오류가 판정에 영향 주지 않음(재료 신호 전용)을 Codex 검증.

### L4 — 클라우드/Self-host OCR — **Gate C / Gate C-SH**
- **allowed**: 없음(현재). 별도 승인 전 금지.
- **게이트**: **Gate C**(클라우드 OCR egress: 데이터 egress 명시 승인·프라이버시/DPA·법률/ToS·자격증명 repo 비노출·비용·로컬 우선 — 2J §10).
  **Gate C-SH(self-host 하위분기, C2J-MISTRAL-MIN-01 해소)**: self-host는 public API와 **다른 분기**이며 **자동으로 Kordoc Gate A no-egress와 동급이 아니다** — ① deployment entitlement(호스팅 권한), ② license/commercial terms, ③ model/container provenance, ④ **offline/no-egress 증명(자체 수행 필요)**, ⑤ operational security, ⑥ deterministic/version controls를 별도 검증해야 통과.

## 6. 구현 대상 vs 감지/검수/질문 라우팅 구분 (원칙)

- **구현해도 되는 것(각 단계 게이트 내)**: 감지·추출·위치(page/bbox)·품질/신뢰도 신호·검수 우선순위·라우팅(`missing_info`/`customer_questions`/요청자료)·하이라이트 힌트·로컬 배치 status/result hash.
- **구현하지 않고 사람/후속 게이트로 넘기는 것**: 이미지 의미·차트 수치·표 외 시각 정보의 해석, 저신뢰 구간의 근거 승격, KSSB 충족 판단, 클라우드/self-host OCR 도입 판단.
- **불변 원칙**: source-bound analysis · validator detect-only · renderer no re-judgment · delivery separation · 사람 검수 필수 · confidence/quality는 **재료·트리아지 신호**일 뿐.

## 7. 제출 MVP 범위 vs 후속 확장

- **제출 MVP 포함 가능**: **L0(완료) + L1(감지·라우팅, 승인 시 구현)** — 스캔/이미지 자료에도 "판독 필요·위치·검수 우선순위·요청자료"로 대응하는 제품 스토리 완성. 신규 게이트 불요.
- **후속 확장(게이트 뒤)**: **L2(Gate D)** → **L3(Gate D+검증)** → **L4(Gate C/C-SH)**. 제출 시점까지 게이트를 통과하지 못한 단계는 **계획·게이트 문서로만 제출물에 반영**(과장 표현 금지 — "지원"이 아니라 "단계적 확장 계획"으로 기재).
- 제출물 표현 주의: OCR/이미지 분석을 **현재 동작 기능처럼 표현하지 않는다**(README/SKILL 문구는 구현 완료 단계만 반영).

## 8. 기존 게이트 구조와의 정합 (충돌 없음)

- **Gate A**(no-egress)·**Gate B**(license)·**Version Strategy**·**Residual Hardening**: L0 결과로 **불변 유지**. L2+에서 native/optional 재유입 시 Gate B **재검토**가 필요하다는 것 자체가 기존 구조의 연장이다(우회 아님).
- **Gate C**(클라우드 OCR)·**Gate C-SH**(self-host 하위분기): 2J §10을 계승·세분화. **Gate D**(로컬 OCR provider): 2I-3A §13 게이트의 공식화. 게이트 신설은 기존 게이트를 **대체하지 않고 상위 단계에 추가**된다.
- RH register 연계: RH-S1(OCR/scanned v1 제외)은 "L0/L1 범위에서 유지, L2+는 Gate D 통과 후"로 해석 명확화(완화 아님).

## 9. Codex Review 요청 포인트

1. capability ladder(L0~L4)와 게이트 매핑(기존 A/B/Version + 신설 D, C/C-SH)이 기존 게이트 구조와 충돌 없이 정합하는가?
2. Kordoc을 "OCR 엔진이 아니라 감지/추출/orchestration 후보"로 재정의한 것이 실측 evidence와 일치하는가? core hard dependency 금지가 유지되는가?
3. L1(감지·라우팅)을 "신규 게이트 불요, 기존 검증 신호만 사용"으로 판단한 것이 타당한가?
4. Gate D의 모델 준비(다운로드) ↔ 파싱(no-egress) 분리와 Gate B 재검토 요건이 충분한가?
5. Gate C-SH가 C2J-MISTRAL-MIN-01(self-host ≠ 자동 no-egress 동급)을 충분히 해소하는가?
6. 차트 수치/이미지 의미/KSSB 충족 추정 금지 및 low-confidence → `missing_info`+`customer_questions` 라우팅이 source-bound·human-review·no re-judgment·detect-only 원칙을 보존하는가?
7. 제출 MVP(L0+L1) vs 후속 확장(L2~L4) 구분과 "미구현 단계 과장 금지" 표현 규칙이 제출 패키징 정책과 정합하는가?

## 10. 다음 단계

- 본 문서 Codex Review → 사용자/ChatGPT 판단.
- L1 구현 착수는 별도 승인 + RH-B2 종료 후. L2+는 각 게이트(D, C/C-SH) 수행 후에만.
