# Cycle 2I-3B 설계 — Optional / Pluggable External Intake Adapter

> **성격**: **설계 문서(문서/인터페이스 수준)**. 구현이 아니다. Kordoc을 plugin core hard dependency로 붙이지 않고,
> **교체 가능한 외부 인테이크 어댑터**로 다루는 구조와 경계, 구현 진입 전 gate를 정의한다.
> **하지 않는 것**: Kordoc 설치·MCP setup·OCR/formula·실제 PDF 재실행·코드 구현·schema/validator/renderer/delivery 변경·
> manifest/marketplace 변경·package/dependency 파일 추가·`.mcp.json`/client 설정 커밋·submission.zip.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: 2I-3A spike evidence + Codex PASS.

## 1. 목적 / 성격

Cycle 2I-3A 로컬 spike로 Kordoc의 인테이크 가치(텍스트 PDF 표 재구성·위치/품질/`needsOcr` 신호·결정성·대용량 안정)를 실측했고,
Codex evidence review는 **PASS**(hard dependency 부적합 명시). 이 문서는 그 결과를 바탕으로 **어떤 구조로 붙일지 판단 가능한 설계**를 제시하고,
**구현 사이클로 넘어가도 되는지**를 gate 체크리스트로 판정할 수 있게 한다. 구현·설치·번들은 별도 승인 사이클에서만.

## 2. 입력 근거 요약

- **가치(입증됨, 텍스트 PDF)**: 표 재구성(유형1 49개·유형2 199개), block/outline/pageQuality/`needsOcr`/warnings 위치·품질 신호,
  2회 SHA 동일(결정성), 156MB·126p 40초(대용량 안정), baseline(naive 텍스트) 대비 표 열구조·위치·OCR 신호 개선.
- **hard dependency 차단 요인(입증됨)**: Node.js 런타임 필요(plugin stdlib-only와 상충), PDF는 `pdfjs-dist` 별도 설치 필요 + **버전 민감
  (v6.1.200 실패, v4.10.38 성공)**, OCR/formula는 대용량 모델 egress, 전이/native 의존성 license 미검토, **no-egress 강제 검증 미완료**.
- **Codex 3 minors(비차단, 구현 전 필수)**: EV-MIN-01(no-egress 미경화), EV-MIN-02(의존성·버전 리스크), EV-MIN-03(스캔/OCR 미검증).
- **Codex §10 adoption gates**: hard no-egress rerun · 전이/native license 검토 · kordoc+pdfjs 버전 제약 전략 · (스캔 범위 시)비민감 스캔 샘플 ·
  adapter opt-in/local 이며 core dependency·submission 기본 불변이라는 명시적 결정.

## 3. 설계 결정 — adapter as interface, 외부 preprocessing 우선

**결정: Kordoc을 런타임 결합 의존성이 아니라, 얇은 "외부 인테이크 어댑터 인터페이스 계약" 뒤의 한 구현으로 둔다.**

- **v1 = 외부(out-of-band) 로컬 preprocessing**: 사용자 로컬에서 Kordoc(또는 다른 도구/수동)으로 문서를 파싱해 **정규화된 DEI-후보 JSON**을
  산출한다. plugin core는 이 JSON을 **선택적 근거 재료**로만 참조하고, 여전히 **findings JSON 계약**만 소비한다.
- **어댑터 = 인터페이스 계약**(input=로컬 문서 → output=DEI-후보 JSON). Kordoc은 그 계약을 만족하는 **하나의 교체 가능한 구현**일 뿐.
  core에 Kordoc/Node/pdfjs를 링크하지 않는다.
- **왜 런타임 결합이 아닌가**: 2I-3A에서 확인된 런타임·버전 민감성·egress·license 리스크를 core 밖으로 격리해야 Skill-first·결정성·무-의존·
  제출 패키징 원칙이 보호된다. 결합하면 이 리스크가 본체로 전이된다.
- **대안 기각**: (a) Kordoc을 core 의존성으로 번들 → 기각(위 리스크·stdlib-only 위반). (b) Kordoc MCP를 plugin이 자동 구동 → 기각
  (client 설정·egress·상태 변경, 사용자 직접 영역).

## 4. plugin core와의 경계

| 계층 | 역할 | 이번 설계에서 |
|---|---|---|
| **External Intake Adapter** (core 밖) | 로컬 문서 → DEI-후보 JSON | 신규(설계만). 사용자 로컬·opt-in. core 미링크 |
| **DEI(문서 수준, 비-schema)** | 근거 재료 색인 | 2I-3 §5 개념 재사용. findings schema 아님 |
| **Skill** | DEI 참고 → findings 작성·판정 | 최종 판정·근거 선택 담당(재판정 아님) |
| **validator(detect-only)** | 형식·정합·경로노출 감지 | **불변** |
| **renderer(no re-judgment)** | findings만 소비 | **불변**(어댑터 산출물 직접 입력 아님) |
| **delivery** | 사용자 요약/로그 분리 | **불변** |

- **경계 원칙**: 어댑터 산출물은 renderer/delivery/validator에 **직접 들어가지 않는다.** DEI를 거쳐 **Skill이 findings를 작성**할 때의 재료일 뿐.
- **hard dependency 없음**: core는 어댑터·Node·Kordoc·pdfjs 없이도 동작(§11 fallback).

## 5. 어댑터 인터페이스 계약 (interface-level, 구현 아님)

- **Input**: 사용자 로컬 문서 경로(들). 원격 URL/cloud fetch 금지. 로컬 전용.
- **Output**: 정규화된 **DEI-후보 JSON**(문서 수준). 개념 필드(2I-3 §5 재사용, 강제 schema 아님):
  `source_file, page_number, section_path, block_id, block_type, extracted_text_or_table_markdown, bbox_or_location_hint,
  extraction_quality, warnings, needs_ocr, kssb_candidate_area, evidence_confidence, reviewer_note`.
- **계약 규칙**:
  - **판정 미생성**: 어댑터/DEI는 근거 후보·위치·품질 신호만 제공. `judgment_code`/`judgment_label` 결정은 Skill.
  - `evidence_confidence`·`kssb_candidate_area`는 **재료 신호일 뿐**(자동 판정 금지).
  - **결정성 요구**: 동일 입력 → 동일 출력(2I-3A에서 kordoc 실측 충족).
  - **실패 신호 명시**: 파싱 실패·버전 불일치·egress 위험은 **명시적 에러**로 반환(조용한 부분 산출 금지) → fallback 트리거.

## 6. Kordoc output → DEI → `evidence_anchor` 연결

| Kordoc 필드(실측) | → DEI | → findings `evidence_anchor` | 비고(spike 관측) |
|---|---|---|---|
| `blocks[].pageNumber` + `outline` | page_number + section_path | `page_or_section` | section_path는 block↔outline **근접 조립** 필요(경계 모호 시 소폭 손실) |
| `blocks[].text` / `table.cells` | extracted_text_or_table_markdown | `quote` | 원문·표 수치 보존 양호. 장문/저작권 복붙 제한 |
| (source_file) | source_file | `source_id` | source_documents 매핑 |
| `qualitySummary.needsOcr`·`ocrCandidatePages`·`pageQuality`·`warnings` | needs_ocr·extraction_quality·warnings | (저신뢰 신호) | "확인 불가 → `missing_info`+`customer_questions`+요청자료" 전환 근거 |
| `blocks[].bbox` | bbox_or_location_hint | (대응 필드 없음) | **축약 손실(허용)** — `page_or_section`으로 |
| — | — | `relevance_note` | Kordoc 산출 아님 → **Skill/사람 작성** |

- **schema 미변경**: 매핑은 개념 검증. findings schema/코드는 이번에도 바꾸지 않는다. schema화 여부는 구현 gate 통과 후 별도 판단.

## 7. 버전 민감성의 설계 반영

- **검증된 조합(설계 기준선)**: `kordoc@3.8.2 + pdfjs-dist@4.10.x`. (최신 `pdfjs-dist@6.1.200`은 spike에서 실패.)
- **설계 제약**(구현 시 강제):
  - 어댑터는 **호환 버전 pin/compat-check**를 요구하고 **자동 최신 업그레이드를 금지**한다.
  - 실행 전 버전 확인 → 불일치/미검증 조합이면 **fail-fast** 후 §11 fallback(조용한 저품질 산출 금지).
  - 버전·명령·확인일 기록(2I-3A 재현성 요건 계승).
- **이번 문서는 제약 명시까지만.** dependency 파일 추가·pin 커밋은 구현 사이클에서.

## 8. Gate A — no-egress hard verification 미완료 (구현/운영 전 필수)

- 현재: parsing은 로컬 pdfjs만 사용하고 egress 기능 미사용으로 **관측상 무-egress**이나, **강제 네트워크 차단 검증은 미완료**(EV-MIN-01).
- **Gate**: 대표 파싱을 **네트워크 비활성/아웃바운드 차단** 상태에서 재현하고 연결 모니터 결과를 evidence로 기록하기 전에는
  **민감 문서 사용·기본 활성화·"무-egress 검증됨" 주장 금지.** 구현/운영 진입 차단 조건.

## 9. Gate B — 전이/native 의존성 license 검토 미완료 (구현/번들 전 필수)

- 현재: kordoc 본체 MIT 확인. 그러나 전이 의존성 다수 + native 바이너리(`pdfium`/`sharp`/`onnxruntime`)의 license·배포 영향 **미검토**(EV-MIN-02).
- **Gate**: 어댑터를 기본 호출하거나 산출물/코드를 번들하기 전에 **전이·native license 정밀 검토**와 `docs/submission_packaging_policy.md` 정합을 완료.
  미완료 시 번들·하드 통합·submission 포함 금지.

## 10. v1 범위 제외 — OCR / formula / scanned-PDF

- **제외(EV-MIN-03)**: OCR provider·formula OCR·스캔 전용 PDF 처리는 **v1 어댑터 범위 밖.**
- `needs_ocr`/`ocrCandidatePages`는 **표식만 소비**(해당 구간을 "확인 불가 → 요청자료"로 전환하는 신호). OCR 실행은 별도 승인 gate.
- 스캔/OCR을 범위에 넣으려면 **비민감 스캔 샘플을 동일 evidence 절차로 검증**한 뒤에만.

## 11. Fallback (어댑터 부재/실패 시)

- 어댑터 미도입·파싱 실패·버전 불일치·egress 위험 감지 시: **현행 경로 유지** — 제한 텍스트 추출 + "근거 부족/확인 불가 →
  `missing_info` + `customer_questions` + 요청자료".
- 저신뢰 표/수치는 **정량 근거로 승격하지 않고** 위치 단서 + 요청자료로 **사람 검수** 유도.
- 인테이크 계층은 **pluggable** 유지 → 다른 도구/수동 텍스트 입력으로 대체 가능. core는 어댑터 없이도 동작.

## 12. 구현 전 승인 조건 (Gate 체크리스트 — Codex §10 기반)

구현 사이클(예: 2I-3C) 진입 전 **아래를 모두 충족·기록**해야 한다.

- [ ] **Gate A**: hard no-egress rerun(네트워크 차단/아웃바운드 관찰) 완료·evidence 기록.
- [ ] **Gate B**: 전이/native 의존성 license 검토 완료 + `submission_packaging_policy.md` 정합.
- [ ] **버전 제약 전략 확정**: `kordoc@3.8.2 + pdfjs-dist@4.10.x` pin/compat-check·auto-upgrade 금지·fail-fast 규칙.
- [ ] **(스캔 범위 포함 시)** 비민감 스캔 샘플 검증 — 미포함이면 OCR/scanned를 v1에서 명시 제외.
- [ ] **opt-in/local 명시적 결정**: 어댑터는 선택·로컬이며 **plugin core dependency·submission 패키징을 기본 변경하지 않는다.**
- [ ] **경계 유지 확인**: Skill-first · validator detect-only · renderer no-rejudgment · delivery separation · source-bound · 사람 검수 불변.
- [ ] **인터페이스 계약 동결**: input/output(DEI-후보 JSON)·판정 미생성·결정성·실패 신호 규칙 확정.

## 13. "다음 구현 사이클 진입 가능 여부" 판단

- **설계 관점: 준비됨.** 어댑터를 인터페이스 계약 + 외부 preprocessing으로 격리하는 구조와 경계, DEI↔evidence_anchor 매핑, 버전/ egress/
  license gate, v1 범위, fallback이 정의되었다.
- **단, 구현 착수는 §12 gate 미충족 시 금지.** 특히 Gate A(no-egress)·Gate B(license)·버전 제약 전략은 **구현 전 필수 선행**.
- **결론**: 본 설계 확정 후 ChatGPT/사용자가 §12 gate 착수 여부를 결정. gate 통과가 확인되면 별도 승인 하에 구현 사이클로 진입. gate 미충족이면
  설계는 유지하되 구현 보류(현행 fallback 운영).

## 14. Codex Review 요청 포인트

1. Kordoc을 **런타임 결합이 아니라 인터페이스 계약 + 외부 preprocessing**으로 둔 결정이 Skill-first·무-의존·결정성 보호에 타당한가?
2. plugin core 경계(어댑터 산출물이 renderer/delivery/validator에 직접 들어가지 않고 DEI→Skill 경유)가 명확한가?
3. DEI↔`evidence_anchor` 매핑이 **판정 미생성·schema 미변경** 경계를 지키는가(bbox 축약·section_path 조립 손실 반영 포함)?
4. 버전 민감성(kordoc+pdfjs pin·fail-fast)·Gate A(no-egress)·Gate B(license) gate 설계가 구현/번들 전 차단 조건으로 충분한가?
5. OCR/formula/scanned를 v1에서 제외하고 `needs_ocr`를 신호로만 쓰는 범위가 적절한가?
6. §12 gate 체크리스트가 "구현 사이클 진입 가능 여부"를 판정하기에 충분·타당한가?
