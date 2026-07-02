# Cycle 2I-2 완료 보고 — Presentation / Report Wording Quality + Skill Workflow Alignment

## 1. 작업 목적

대표 문서의 **표현 품질**을 높이고, Skill workflow를 새 **전달 배선기(delivery wrapper)** 경로와 정합화한다.
구체적으로: 내부 코드명 노출 완화(한글 공시요구 제목 우선), 원문 인용·페이지/섹션 위치 단서 강화, 고객 질문/요청자료 안내 개선,
그리고 Cycle 2I-1 Codex 비차단 minor 3건 처리. 렌더러는 계속 **재판정하지 않으며**, 없는 근거·페이지·인용을 만들지 않는다.

## 2. 변경 요약

- **표현 품질(렌더러 3종 일관)**: `render_html`·`build_document_xml`(DOCX)·`render_markdown`에서
  - §3 항목 헤더를 **한글 공시요구 제목 우선**으로 바꾸고 내부 항목ID는 보조 식별자(`(항목ID: …)`)로 표기.
  - §2 "항목-판정 요약" 표 열 순서를 **영역 · 공시요구 · 판정 · 항목ID**로 재정렬(코드 열을 뒤로).
  - 근거 앵커 표기를 **인용 / 출처 / 위치** 라벨로 분리해 위치 단서를 명확화(페이지/섹션이 있을 때 "위치:"로 표기).
  - 영역 헤더에서 area_id 괄호 표기 제거(한글 영역명만).
  - §4 고객 확인 질문에 우선순위·요청자료·후속조치를 안내하는 한 줄 인트로 추가.
- **MIN-01**: `SKILL.md` Workflow/Output/산출 흐름을 **전달 배선기(`kssb_report_delivery.py`) 경로 + DOCX→HTML→Markdown fallback**으로 정합화.
- **MIN-02**: `tests/test_delivery_wiring.py`에 **강제 DOCX 실패 fallback 영구 테스트** 추가(primary=html, HTML/Markdown 존재, docx_error 기록, user_summary 안전).
- **MIN-03**: 렌더러 docstring·`--html-only` help·주석의 "DOCX와 HTML fallback" 문구를 **DOCX→HTML→Markdown**으로 현행화.

## 3. 수정 파일

**수정**
- `src/renderers/kssb_report_renderer.py` — 표현 품질(HTML/DOCX/Markdown §2·§3·§4), docstring·help 현행화(MIN-03).
- `src/skills/samil-kssb-precheck/SKILL.md` — 전달 배선기·Markdown fallback 정합(MIN-01).
- `tests/test_delivery_wiring.py` — 표현 품질 3건 + 강제 DOCX 실패 fallback 6건 추가(MIN-02). 24 → **33건**.
- `docs/current_status.md`, `docs/decision_log.md`(D42), `docs/cycle2i_2_presentation_quality_completion_report.md`(신규).

**변경하지 않음**: validator 로직, schema, delivery 배선 로직(경계 유지), manifest, marketplace.

## 4. 구현 판단 근거

- **재판정 금지 유지**: 모든 변경은 **표기·정렬·라벨·안내 문구**에 한정. findings의 판정·근거·질문·권고 값은 그대로 소비하며 새 값을 만들지 않는다(테스트: 출력 라벨=입력 라벨, quote 원문 보존).
- **3종 렌더러 일관**: DOCX/HTML/Markdown이 동일 findings 단일 소스에서 파생하므로 동일한 표현 규칙을 세 곳에 일관 적용.
- **최소·안전**: 파이프라인·스키마·delivery 로직을 건드리지 않고 렌더러 표기와 Skill 문서만 조정. 새 외부 의존성 없음.
- **위치 단서 보수성**: `page_or_section`이 **있을 때만** "위치:"를 표기(없는 페이지·인용을 만들지 않음).

## 5. Codex minor 3건 대응 여부

- **C2I1-MIN-01 (SKILL.md ↔ delivery wrapper 정합)**: **대응 완료.** 산출 흐름 blockquote·Workflow(4단계 전달 배선기 추가)·Output policy에 배선기 경로와 DOCX→HTML→Markdown fallback, 사용자 요약/로그 분리를 명시.
- **C2I1-MIN-02 (강제 DOCX 실패 영구 테스트)**: **대응 완료.** `_docx_bytes`를 실패시키는 테스트로 primary=html·fallback 존재·docx_error·user_summary 안전을 영구 검증.
- **C2I1-MIN-03 (stale fallback 문구)**: **대응 완료.** renderer docstring·`--html-only` help·`_main` 설명·섹션 주석을 DOCX→HTML→Markdown 기준으로 정리.

## 6. 표현 품질 개선 내용

- **내부 코드명 완화**: 항목 상세·요약 표에서 한글 공시요구 제목을 앞세우고 항목ID를 보조로 강등. 사용자가 gov-01 같은 코드를 먼저 읽지 않도록 함.
- **근거 가독성**: `인용: "…"` / `출처: <source_id>` / `위치: <page_or_section>` / `근거 설명: …`으로 분리 표기 → 검수자가 원문 대조하기 쉬움.
- **질문/요청자료**: 우선순위 순·요청자료·후속조치 안내 인트로로 실무 요청 성격을 분명히(표 데이터 자체는 findings 값 그대로).

## 7. Skill workflow 정합화 내용

- 사용자-facing 산출 흐름을 **배선기 경로**(preflight → 렌더 → 사용자 요약, 로그 분리)로 명시하고, 대표 문서 우선순위(DOCX→HTML→Markdown)·산출물 경로/경계 고지 비노출 원칙을 SKILL.md에 반영. Skill-first·재판정 금지·detect-only 문구 유지.

## 8. validator / renderer / delivery 경계 유지 여부

- **renderer**: 재판정 없음 유지(표기만 변경, 판정/근거 미생성; 출력 라벨=입력 라벨 테스트 PASS).
- **validator**: detect-only 유지(이번 사이클 미변경; findings 미변경 테스트 PASS).
- **delivery**: 사용자/내부 분리·경로 sanitize 유지(강제 DOCX 실패 시에도 user_summary에 절대경로/계정 비노출 테스트 PASS). 판정·근거 미생성.

## 9. 실행한 검증과 결과

- `python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json` → error 0, RC 0.
- `python tests/smoke_test_renderer.py` → **22/22 PASS**(표현 변경 후에도 섹션·quote 보존·결정성 유지).
- `python tests/test_findings_validator.py` → **19/19 PASS**.
- `python tests/test_delivery_wiring.py` → **33/33 PASS**(기존 24 + 표현 품질 3 + 강제 DOCX 실패 fallback 6).

## 10. 실행하지 못한 검증과 이유

- **실제 PDF(HFG/K-water) 재실행·인테이크 품질**: 범위 밖(2I-3)·지시상 금지.
- **MS Word GUI 열기**: 미수행. zip 무결성·OOXML 파싱으로 대체.
- **`jsonschema` full validation**: 미설치(설치 금지). 표준 라이브러리 검증으로 대체.

## 11. 남은 리스크

- 표현 품질은 **findings 값의 품질**에 의존한다. 실제 PDF에서 인용/페이지가 부실하면 표기 개선만으로는 근거가 채워지지 않음 → 인테이크(2I-3) 과제.
- 입력 findings 값 자체에 로컬 경로가 들어오면 대표 문서 본문에 남을 수 있음(렌더러는 재작성하지 않음) → validator 입력 스캔/인테이크 가드레일(2I-3) 과제.
- 사용자 요약 안전성은 **배선기 경로** 사용 전제. SKILL.md에 배선기 경로를 명시했으나, 실제 런타임 자동 배선은 이후 과제.

## 12. 다음 단계 제안

- **2I-3 / 2I-3A**: PDF 문서 인테이크·표/OCR fallback 설계, Kordoc feasibility spike(사용자 승인·로컬·미설치 조건), Document Evidence Index 상위 설계 검증.
- 착수 여부·순서는 ChatGPT/사용자 확인 후.
