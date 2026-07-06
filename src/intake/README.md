# src/intake — Optional Intake → DEI-candidate Adapter (Cycle 2L-2 L1 + 2L-4B/2L-5 L2 ingest)

> **경계**: 이 폴더는 **plugin core가 아니다.** Skill·validator·renderer·delivery·schema로 이루어진 findings 파이프라인의
> **바깥(opt-in/local)** 계층이다. Cycle 2I-3B 설계·2L-1 prep·2L-4A adapter boundary 설계·Codex Review에 정합.

## 무엇인가

- `dei_producer.py`: 이미 로컬에서 추출된 **문서 인테이크 산출물**(예: Kordoc `--format json`)을 받아,
  Cycle 2L-1에서 동결한 **DEI-candidate 계약**(문서 수준 중간 산출물)으로 **결정적으로** 정규화하는 표준 라이브러리 전용 어댑터.
  - **(2L-4B 구현 — repo-side ingest boundary, 2L-5 closure에서 implemented+reviewed로 승격)** 선택 인자 `ocr_text`/`aux_signals`를 받으면
    out-of-band OCR 산출물(provenance 필수·needsOcr 페이지 정합 fail-fast)을 **별도 `ocr_supplement` 섹션**
    (extraction_quality="low" 고정, **기존 blocks에 미혼입**)으로, 보조 구조 신호를 `aux_structure` 섹션과
    review/gap hint로만 **additive 병합**한다. 두 인자가 없으면 산출은 기존 L1과 동일(DEI_VERSION "1" 유지).
  - **(2N-4B 구현 — document-level 변형 계약, Codex review 대기)** Kordoc HWP/HWPX/DOCX 출력에는 `pageQuality`/`qualitySummary`가
    없고 DOCX는 `pageCount`도 없다(2N-4 실측). **`fileType`이 {hwp,hwpx,docx}이고 두 필드가 모두 부재**할 때만 별도의
    document-level 변형으로 수용한다: 없는 페이지/품질 신호를 **합성하지 않고** additive 필드
    (`doc_quality.pagination="document_level"`·`page_count_basis`·`quality_signal="not_reported"`)로 부재를 명시,
    위치 힌트는 `p.<n>` 대신 heading **문서 순서** 기반 섹션 경로/'doc-level'(`doc_level_hint()`),
    블록 품질은 블록 자체 텍스트의 깨짐 신호로만 보수 계산(상한 medium), 빈 blocks·내용 없는 blocks는 거부(fail-fast 유지),
    이 변형에서 `ocr_text` 병합은 **명시 거부**(needsOcr 정합 기준 없음). 조건 밖 입력(예: fileType="pdf")은
    기존 paginated 계약이 **경로·산출 모두 무변경**으로 적용된다(PDF 대조군 byte-identical 확인).
- `runners/` **(2N-2 신규, source-only)**: HWP-first assisted runner skeleton — **무승인 설치/실행 금지**, repo 밖 tool-cache,
  no-egress 훅(nethook.cjs), OCR/portable Node 범위 밖. 경계 상세는 `runners/README.md`(core는 이 폴더를 참조하지 않는다).
- `aux_structure_scanner.py` **(2L-4B 신규, provisional)**: 로컬 HWPX/DOCX zip+xml 구조에서 **문서 수준 보조 신호**
  (이미지 리소스/relationship/인스턴스 3계층, 표 top-level/중첩 분해, caption/heading 후보, chart relationship)를
  결정적으로 추출하는 표준 라이브러리 전용 스캐너. 주 추출기 결과의 **교차확인·gap 신호 재료**일 뿐 판정·의미 해석을 하지 않는다.
  방어 규칙: member allowlist·bounded read·zip-slip 거부·raw XML/이미지/본문 미보존.

## 경계(하지 않는 것)

- **판정 미생성**: `judgment_code`/`judgment_label`을 만들지 않는다. `extraction_quality`/`needs_ocr`/priority는 **검수 트리아지 신호**일 뿐 KSSB 판단이 아니다.
- **원문 보존**: 블록 텍스트/표를 원문 그대로 전달한다. 요약·수치 추정·이미지 의미 해석 금지.
- **findings 아님**: DEI는 findings 스키마가 아니다. **renderer/validator에 직접 유입되지 않는다.** Skill이 근거 재료로만 소비해 기존 findings 스키마 필드로 산출한다.
- **실행 없음**: OCR·모델 다운로드·네트워크·외부 도구를 **실행하지 않는다.** 인테이크 도구 실행은 이 모듈 밖(사용자 로컬)이며, 본 모듈은 이미 만들어진 인테이크 dict/JSON만 변환한다.
- **새 의존성 없음**: Python 표준 라이브러리만 사용. Kordoc/Mistral을 **core hard dependency로 추가하지 않는다**(Version Strategy V8).

## Capability ladder 위치

- 이 어댑터는 **L1(스캔/이미지/도표 존재 감지 + 검수 라우팅)**의 재료 생산기다.
- **L2는 partially implemented다 — repo-side ingest boundary는 `implemented+reviewed`(2L-4B 구현 → 2L-5 closure 승격),
  provider execution·runner 통합·provider 최종 확정은 pending**: 이 폴더는
  OCR을 **실행하지 않고**(plugin-side OCR 실행 미구현), out-of-band runner(사용자 로컬 — Gate D-proven 경로)가 이미 만든 OCR 산출물의
  **ingest(정규화·병합)만** 담당한다. provider 실행·설치는 여전히 repo/core 밖이다.
- **L3(도표/차트 구조 분류)는 범위 밖**이다.

## Skill 연결

- Skill은 DEI-candidate의 `needs_ocr`·`extraction_quality`·`warnings`·`review_priority_hints` 신호를 읽어,
  판독 불가/저신뢰 구간을 **기존** `not_verifiable` + `missing_info` + `customer_questions` 경로로 라우팅한다(스키마 변경 없음).
- 위치는 `page_or_section_hint()`가 만드는 사람 읽기용 `p.<n> · <section>` 표기로만 findings에 들어간다(**bbox는 DEI에만**).
- 상세: `src/skills/samil-kssb-precheck/evidence_mapping_rules.md` §6, `docs/planning/cycle2l_1_l1_implementation_prep.md`.
