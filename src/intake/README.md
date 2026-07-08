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
  - **(2N-4B 구현 — document-level 변형 계약, Codex 2N-4B review PASS로 종결)** Kordoc HWP/HWPX/DOCX 출력에는 `pageQuality`/`qualitySummary`가
    없고 DOCX는 `pageCount`도 없다(2N-4 실측). **`fileType`이 {hwp,hwpx,docx}이고 두 필드가 모두 부재**할 때만 별도의
    document-level 변형으로 수용한다: 없는 페이지/품질 신호를 **합성하지 않고** additive 필드
    (`doc_quality.pagination="document_level"`·`page_count_basis`·`quality_signal="not_reported"`)로 부재를 명시,
    위치 힌트는 `p.<n>` 대신 heading **문서 순서** 기반 섹션 경로/'doc-level'(`doc_level_hint()`),
    블록 품질은 블록 자체 텍스트의 깨짐 신호로만 보수 계산(상한 medium), 빈 blocks·내용 없는 blocks는 거부(fail-fast 유지),
    이 변형에서 `ocr_text` 병합은 **명시 거부**(needsOcr 정합 기준 없음). 조건 밖 입력(예: fileType="pdf")은
    기존 paginated 계약이 **경로·산출 모두 무변경**으로 적용된다(PDF 대조군 byte-identical 확인).
- `dei_producer.cjs` **(2N-6 Phase 2 N3 — D92 Node 이식)**: `dei_producer.py`의 충실 이식(내장 모듈만 —
  외부 npm 의존성·package.json 없음, core·runner 모듈 미require). 검증 규칙·IntakeError 메시지·필드 구성·
  정렬·canonical hash(`canonicalOcrOutputSha256` — runner 구현·Python과 golden 상수로 3중 결속)·
  CLI 출력(json.dumps sort_keys/indent=2 동등)까지 동일하며, parity는
  `tests/test_intake_dei_producer_parity.test.cjs`가 동일 fixture로 Python CLI 실측 대조
  (**stdout/stderr 전문 일치** — 개행 정규화만). **Python `dei_producer.py`는 transitional
  reference로 무변경 보존**(D92 ③).
  사용: `node src/intake/dei_producer.cjs <intake.json> --source-id <id> [--source-title <t>]
  [--ocr-text <path>] [--aux-signals <path>]` (exit: 0=성공(DEI JSON stdout) / 2=IntakeError·인자 오류 /
  1=입력 로드 등 통제된 실패 — stack·경로 미노출).
- `runners/` **(2N-2 신규, source-only / 2N-4D Node port 추가)**: HWP-first assisted runner skeleton — **무승인 설치/실행 금지**, repo 밖 tool-cache,
  no-egress 훅(nethook.cjs), OCR/portable Node(다운로드) 범위 밖. Python(`.py`)과 Node(`.cjs`, 2N-4D — CLI 계약 동일,
  Codex-like 무-Python 환경 대응·aux 미생성 등 v1 차이는 README 명시) 두 구현이 있으며 Python은 reference 유지.
  경계 상세는 `runners/README.md`(core는 이 폴더를 참조하지 않는다).
- `aux_structure_scanner.py` **(2L-4B 신규, provisional)**: 로컬 HWPX/DOCX zip+xml 구조에서 **문서 수준 보조 신호**
  (이미지 리소스/relationship/인스턴스 3계층, 표 top-level/중첩 분해, caption/heading 후보, chart relationship)를
  결정적으로 추출하는 표준 라이브러리 전용 스캐너. 주 추출기 결과의 **교차확인·gap 신호 재료**일 뿐 판정·의미 해석을 하지 않는다.
  방어 규칙: member allowlist·bounded read·zip-slip 거부·raw XML/이미지/본문 미보존.
  - **(N5 — Node 미이식 한계, D93 ②·D95)**: 이 스캐너(aux_signals **생성**)는 **Node path에 이식하지 않고
    한계로 명시**한다(Node 내장에 XML 파서 부재 — 외부 npm 의존성 0 원칙, 순수 JS 파서는 parity 취약·오탐
    리스크). **aux_signals는 core report generation의 필수 조건이 아닌 2차 교차 신호**이며, N1~N4 Node core
    path(validator·DEI·delivery·DOCX/HTML/MD)는 이것 없이도 완결된다. **소비 측은 이미 Node 이식됨**
    (`dei_producer.cjs`가 aux_signals를 병합) — 생성만 Python `aux_structure_scanner.py` reference 전용이다.

## 경계(하지 않는 것)

- **판정 미생성**: `judgment_code`/`judgment_label`을 만들지 않는다. `extraction_quality`/`needs_ocr`/priority는 **검수 트리아지 신호**일 뿐 KSSB 판단이 아니다.
- **원문 보존**: 블록 텍스트/표를 원문 그대로 전달한다. 요약·수치 추정·이미지 의미 해석 금지.
- **findings 아님**: DEI는 findings 스키마가 아니다. **renderer/validator에 직접 유입되지 않는다.** Skill이 근거 재료로만 소비해 기존 findings 스키마 필드로 산출한다.
- **실행 없음**: OCR·모델 다운로드·네트워크·외부 도구를 **실행하지 않는다.** 인테이크 도구 실행은 이 모듈 밖(사용자 로컬)이며, 본 모듈은 이미 만들어진 인테이크 dict/JSON만 변환한다.
- **새 의존성 없음**: Python 구현은 표준 라이브러리만, Node 구현(.cjs)은 내장 모듈만 사용. Kordoc/Mistral을 **core hard dependency로 추가하지 않는다**(Version Strategy V8).

## Capability ladder 위치

- 이 어댑터는 **L1(스캔/이미지/도표 존재 감지 + 검수 라우팅)**의 재료 생산기다.
- **L2는 partially implemented다 — repo-side ingest boundary는 `implemented+reviewed`(2L-4B 구현 → 2L-5 closure 승격),
  provider 최종 확정·Skill 자동 통합은 pending**: 이 모듈(ingest)은 OCR을 **실행하지 않고**, 산출물의
  **ingest(정규화·병합)만** 담당한다. OCR 실행은 같은 폴더의 **승인 기반 로컬 assisted runner**
  (`runners/pdf_ocr_runner.cjs` — 2N-4L 최소 page-set 경로, 자동 실행 없음·tool-cache 별도 항목·no-egress 훅)
  또는 out-of-band 도구가 담당하며, 도구 설치·실행은 여전히 repo/core 밖(tool-cache)이다.
  **core plugin은 OCR을 자동 실행하지 않는다**("OCR 지원 완료" 아님).
- **L3(도표/차트 구조 분류)는 범위 밖**이다.

## Skill 연결

- Skill은 DEI-candidate의 `needs_ocr`·`extraction_quality`·`warnings`·`review_priority_hints` 신호를 읽어,
  판독 불가/저신뢰 구간을 **기존** `not_verifiable` + `missing_info` + `customer_questions` 경로로 라우팅한다(스키마 변경 없음).
- 위치는 `page_or_section_hint()`가 만드는 사람 읽기용 `p.<n> · <section>` 표기로만 findings에 들어간다(**bbox는 DEI에만**).
- 상세: `src/skills/samil-kssb-precheck/evidence_mapping_rules.md` §6, `docs/planning/cycle2l_1_l1_implementation_prep.md`.
