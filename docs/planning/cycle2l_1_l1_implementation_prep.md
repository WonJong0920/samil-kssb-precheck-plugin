# Cycle 2L-1 — L1 Implementation-Prep

> **성격**: **L1 구현 전 implementation-prep 문서**(문서 수준). **L1 코드는 아직 구현하지 않는다.** 2L roadmap(§3 sub-cycle 2L-1)의 실행 문서로, RH-B2 종결·DEI-후보 계약 동결·Skill 라우팅 draft·test plan·Gate D 비실행 준비를 다룬다.
> **하지 않는 것**: L1 코드 구현·schema 변경·validator/renderer/delivery 코드 변경·package/dependency 변경·OCR provider 설치/실행·API 호출·Python/notebook 실행·외부 문서 업로드·submission.zip.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: 2L roadmap + Codex PASS(`codex_cycle2l_preliminary_l3_implementation_prep_review.md`, minors C2L-MIN-01/02).

## 0. Codex Review 반영 분류 (2L roadmap 리뷰에서 추출)

| 항목 | 출처 | 분류 | 처리 |
|---|---|---|---|
| RH-B2 구체 pass/fail evidence(명령·버전·`--omit=optional`·load 관측·hash·redaction) | C2L-MIN-01 | **2L-1 필수** | §1 실행·`docs/samples/rh_b2_optional_exclusion_evidence_2026-07-03.md` |
| schema-free page/bbox/quality **안정 텍스트 convention** 정의 | 리뷰 §L1 Schema-Free / §Independent Risk | **2L-1 필수** | §3 |
| DEI-후보 계약을 **ad-hoc 매핑 방지 수준으로 구체화** | 리뷰 §Independent Risk | **2L-1 필수** | §2 |
| Capability Status Ledger를 current_status로 반영 | 리뷰 §Ledger / §Required | **2L-1 필수** | current_status 갱신 |
| L1 Skill routing **draft** | roadmap 2L-1 | **2L-1 필수(draft만)** | §4 (실제 SKILL.md 수정은 2L-2) |
| L1 test plan | roadmap 2L-1 | **2L-1 필수(계획만)** | §5 |
| Gate D **비실행** logistics(샘플/provider 기준·evidence 템플릿·no-exec 체크리스트) | C2L-MIN-02 | **2L-1 처리하면 좋은 비차단** | §6 (실행·설치·OCR 없음) |
| L1 fallback 메시지에 "L3 target-shortfall" 명시 | 리뷰 §Independent Risk | **2L-1 반영(원칙)** | §7 |
| 구조화 confidence/bbox/needs_ocr를 findings에 넣기 | roadmap §3 | **2L-3 이후/별도 schema-evolution 결정** | 본 사이클 제외 |
| 실제 L1 코드(인테이크/DEI 생산기) | roadmap 2L-2 | **2L-2로 이월** | §8 착수 조건 |
| OCR provider 선정·설치·실행, 스캔 처리 | roadmap 2L-3+ | **Gate D/2L-3 이후** | §6 no-exec |

## 1. RH-B2 종결 (필수) — **PASS**

- 수행: `--omit=optional` 클린 설치(`kordoc@3.8.2 + pdfjs-dist@4.10.38`, native/optional 전부 부재·`.node` 0건)에서 유형1·유형2 파싱 4/4 성공, 산출물 해시가 **Gate A evidence와 바이트 단위 일치**. → optional/native는 v1 텍스트 경로에 무영향·미로드.
- evidence: `docs/samples/rh_b2_optional_exclusion_evidence_2026-07-03.md`(명령·버전·설치태세·native 부재·hash·redaction 포함, C2L-MIN-01 충족).
- 경계: RH-B2는 **v1 텍스트 태세의 optional/native 제외 실현성**만 닫는다. OCR/Gate D readiness는 주장하지 않는다.
- **결과: RH-B2 = 종결(닫힘). L1 구현이 어댑터 경로에 의존하기 전 선행조건 충족.**

## 2. L1 Schema-Free DEI-Candidate Contract (필수, 동결)

**DEI-후보는 findings **상위**의 문서 수준 중간 산출물이다. findings schema가 아니며, `additionalProperties:false`인 evidence_anchor/source_documents를 바꾸지 않는다.** 어댑터(2L-2 신규, core 밖)가 생산하고 Skill이 **근거 재료로만** 소비한다.

계약(개념 필드, 안정 키):

```
DEICandidate {
  source_id: string            // source_documents.source_id와 매핑
  source_title: string
  doc_quality: {
    page_count: int
    needs_ocr: bool            // qualitySummary.needsOcr
    ocr_candidate_pages: int[] // qualitySummary.ocrCandidatePages
    low_text_pages: int[]      // pageQuality에서 textChars 낮은 페이지
  }
  blocks: [ {
    block_id: string
    page: int                  // blocks[].pageNumber
    block_type: "heading|paragraph|table|image|unknown"  // blocks[].type (image/unknown은 감지 표식)
    text_or_table_md: string   // blocks[].text 또는 표 markdown (발췌·원문 그대로, 합성 금지)
    location_hint: string      // §3 convention
    extraction_quality: "high|medium|low"  // pageQuality 기반
    needs_ocr: bool
    warnings: string[]         // warnings[].code/message (예: SKIPPED_IMAGE)
  } ]
  review_priority_hints: [ {
    location_hint: string
    reason: "needs_ocr|low_text|skipped_image|table_uncertain"
    priority: "high|medium|low"
  } ]
}
```

**계약 규칙(ad-hoc 매핑 방지)**:
- **판정 미생성**: DEI는 `judgment_code`/`judgment_label`을 만들지 않는다. `extraction_quality`/`needs_ocr`/`priority`는 **재료·트리아지 신호**일 뿐.
- **원문 보존**: `text_or_table_md`는 원문 발췌만. 요약·수치 추정·이미지 의미 해석 **금지**.
- **결정성**: 동일 입력 → 동일 DEI(2L-2 테스트로 강제).
- **실패 명시**: 파싱 실패·버전 불일치·egress 위험은 명시 에러로(조용한 부분 산출 금지, Version Strategy V4/V7).
- Skill은 DEI를 읽고 **기존 findings 스키마 필드로만** 산출한다(§4).

## 3. page / bbox / quality Hint 자유텍스트 Convention (필수, 안정·사람검증 가능)

Codex 지적("free-text hint가 convention으로 숨은 구조 스키마가 되면 안 된다") 반영 — **findings 쪽 텍스트는 사람이 읽는 최소 위치 표기로 한정**하고, 세밀 좌표(bbox)·품질 수치는 **DEI 문서 수준에만** 남긴다.

- **findings `evidence_anchor.page_or_section`** (기존 자유텍스트 필드):
  - 형식: `"p.<page> · <section_path>"` — 예: `"p.9 · II. 기후 > 거버넌스"`.
  - 표/그림 근거: 유형 접미 허용 — 예: `"p.14 · 표(지표 및 목표)"`, `"p.7 · 그림"`. (파서용 구분자가 아니라 **사람 읽기용 라벨**.)
  - **bbox 좌표는 findings에 넣지 않는다**(DEI `location_hint`에만). 사유: 좌표를 findings 자유텍스트에 넣으면 숨은 구조 스키마화 → 금지.
- **findings `source_documents.notes`** (기존 자유텍스트): 문서 수준 품질 메모만 — 예: `"일부 페이지 스캔형(판독 제한) — 원문 요청 대상"`. 수치·좌표 나열 금지.
- **DEI `location_hint`**(문서 수준, findings 아님): `"p.9 · II.기후>거버넌스 · bbox≈(x37,y627)"`처럼 좌표 포함 가능 — **검수 하이라이트용**, findings로 전이하지 않음.
- **원칙**: findings 쪽은 "사람이 원문을 찾아갈 수 있는 최소 표기", DEI 쪽은 "검수 도구가 하이라이트할 상세". 둘을 섞지 않는다.

## 4. L1 Skill Routing Draft (필수 — **draft만**, SKILL.md 실제 수정은 2L-2)

DEI 신호를 **기존 판정 경로**로 라우팅하는 지침 초안(2L-2에서 `SKILL.md`·`evidence_mapping_rules.md`·`customer_question_rules.md`에 반영 예정):

- **판독 가능 근거**(needs_ocr=false, extraction_quality high/medium, 원문 인용 확보): 기존 절차대로 `evidence_confirmed`/`partial_evidence_needs_supplement` + `evidence_anchors`(quote + §3 page_or_section).
- **판독 불가/저신뢰 구간**(needs_ocr=true, extraction_quality low, `SKIPPED_IMAGE` 등): **미공시로 단정하지 않는다**(기존 SKILL 원칙 재확인). →
  - `judgment_code = not_verifiable`(모드별 라벨 "제공자료로 확인 불가"/"공개자료로 확인 불가"),
  - `missing_info` ≥ 1: 판독 불가 구간 명시 — 예: `"p.12 스캔 페이지: 텍스트 레이어 없음, 자동 판독 불가"`,
  - `customer_questions` ≥ 1: 기계판독 가능 원문/데이터 요청(우선순위는 DEI `review_priority_hints.priority` 참조),
  - (기존 스키마 allOf가 이 필수 조건을 이미 강제 → validator 무변경.)
- **금지(재확인)**: 판독 불가 구간에서 **차트 수치·이미지 의미·KSSB 충족 추정 금지.** DEI `priority`는 검수 순서 신호일 뿐 판정 아님.
- **fallback 메시지(§7)**: L2/L3 미완 시 L1 산출에 "스캔/이미지 구간은 감지·질문까지만, 판독은 목표선(L2/L3) 대상" 취지 유지.

## 5. L1 Test Plan (필수 — 계획, 실행은 2L-2)

- **core 무변경 증거**: 기존 3종(validator 26 · renderer smoke 22 · delivery 33)이 **수정 없이 green 유지** → schema/validator/renderer/delivery 불변 증명.
- **신규 인테이크/DEI 생산기 단위 테스트**(2L-2 신규 파일): (a) **결정성**(동일 입력→동일 DEI), (b) needs_ocr/low_text/skipped_image → `review_priority_hints` 생성, (c) DEI가 **판정 필드 미생성**, (d) 원문 발췌 보존(합성 없음).
- **계약(통합) 테스트**: DEI → Skill 라우팅 산출 findings가 **기존 스키마로 validator 0 error**, 판독 불가 항목이 not_verifiable + missing_info + customer_questions를 갖는지.
- **경계 테스트**: 어댑터 산출물이 renderer/validator에 **직접 유입되지 않음**(findings 경유만) 확인.
- 결정성 비교 기준선: RH-B2/Gate A 해시(유형1·2)와 동일 파서 출력 유지.

## 6. Gate D 비실행 준비 (비차단, C2L-MIN-02) — **설치·OCR·실행 없음**

Gate D(2L-3)의 일정 리스크를 줄이기 위한 **비침습 준비**만. **provider 설치·모델 다운로드·OCR 실행·native/egress 개방 금지**(전부 2L-3 게이트에서).

- **유형3(스캔) 샘플 선정 기준**: 비민감(공개 또는 사용자 제공)·**텍스트 레이어 없는 진짜 스캔/이미지형**·소용량·암호화 없음. (기존 관찰: Desktop 후보 중 교육 PDF는 암호화, "HWP Document"는 텍스트 레이어 → **적합 유형3 샘플 미확보 상태**를 2L-3 선행 확보 항목으로 표기.)
- **로컬 OCR provider 후보 기준**(선정 아님, 기준만): 로컬/오프라인 동작 · **모델 준비(다운로드) 단계와 파싱 단계 분리 가능**(Gate A 방식 no-egress 증명 가능) · license 검토 가능(Gate B 재검토 대상) · 결정성. (후보 예: Kordoc `--formula-ocr`(로컬 ONNX, 단 첫 사용 시 ~155MB 모델 egress → Gate D에서 준비/파싱 분리 검증 필요), 기타 로컬 OCR. **이번 사이클 선정·설치 안 함.**)
- **Gate D evidence 템플릿(빈 양식, 2L-3에서 채움)**: 환경·버전 / provider·버전·license / 모델 준비 egress(허용·기록) ↔ 파싱 no-egress(제어검증) 분리 결과 / Gate B 재검토 결과 / 유형3 결정성·hash / redaction.
- **no-execution 체크리스트**: [ ] provider 미설치 [ ] 모델 미다운로드 [ ] OCR 미실행 [ ] native/optional 미개방 [ ] 외부 업로드 없음 — 2L-3 착수 전까지 유지.

## 7. L1 Fallback 메시징 원칙 (반영)

- Gate D 또는 L2/L3 미완 시 **L0+L1 fallback 제출은 유효**하되, 내부 문서(현황·decision log)에 **"L3 target-shortfall(목표선 미달)"**로 구분 기록. 제품 문서(README/SKILL)는 L2/L3를 **현재 기능으로 표기하지 않는다**(2K §7a, Capability Status Ledger).
- 사용자-facing 산출에서 스캔/이미지 구간은 "감지·위치·검수 질문"까지로 표기하고 "판독 완료"로 오인되지 않게 한다.

## 8. 2L-2 착수 조건

**모두 충족 시** 2L-2(L1 구현)로 진입:

- [x] **RH-B2 종결**(§1, PASS).
- [x] **DEI-후보 계약 동결**(§2) + **hint convention 확정**(§3).
- [x] **Skill routing draft**(§4) · **test plan**(§5) 확정.
- [ ] **본 2L-1 문서 Codex Review PASS**.
- [ ] **사용자/ChatGPT 구현 승인**.
- **2L-2 범위 제약**: 신규 인테이크/DEI 생산기(core 밖)만 추가, Skill 지침 반영. **schema/validator/renderer/delivery 코드 무변경 목표**(변경 필요 시 별도 schema-evolution 결정·리뷰 선행). Gate D/L2/L3는 착수 안 함.

## 9. 상위 경계 재확인 (불변)

L1=예선 최소/fallback · L2/L3=예선 target(Gate D 선행, 현재 기능 표현 금지) · L4=예선 범위 밖(Gate C/C-SH). Kordoc=optional/local(core hard dependency 아님) · Mistral=구조 benchmark · OCR/image=DEI 후보·검수 신호만(renderer/validator 직접 유입 금지) · 차트수치/이미지의미/KSSB충족 추정·감사/인증/준수확정 금지 · 최종 판단 Skill source-bound + 사람 검수 · validator detect-only · renderer no re-judgment.

## 10. Codex Review 요청 포인트

1. RH-B2 evidence(§1)가 "종결"로 충분한가(명령·버전·`--omit=optional`·native 부재·Gate A hash 일치·redaction)?
2. DEI-후보 계약(§2)이 ad-hoc 매핑을 막을 만큼 구체적이며 판정 미생성·원문 보존 경계를 지키는가?
3. hint convention(§3)이 안정·사람검증 가능하고 "숨은 구조 스키마화"를 피하는가(bbox는 DEI에만)?
4. Skill routing draft(§4)가 기존 not_verifiable 경로 재사용으로 core 무변경을 유지하는가?
5. test plan(§5)이 core 무변경·결정성·경계(직접 유입 금지)를 검증하는가?
6. Gate D 비실행 준비(§6)가 실행·설치·OCR 없이 일정 리스크만 낮추는가?
7. 2L-2 착수 조건(§8)과 core 무변경 목표가 타당한가?
