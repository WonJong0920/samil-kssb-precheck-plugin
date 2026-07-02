# Cycle 2C 완료 보고 — DOCX/HTML Renderer 최소 구현

## 1. 작업 개요

Cycle 2B에서 확정된 findings schema(`src/schemas/kssb_findings.schema.json`)를 입력으로 받아,
**재판정 없이** 대표 DOCX와 HTML fallback을 생성하는 최소 렌더러를 구현했다. 범위는 **renderer only**이며,
샘플 PDF 분석·OCR·문서 파싱·validator 코드·Hook/MCP·submission.zip 생성은 하지 않았다.

착수 근거: Codex Cycle 2B Patch Review 결과 **PASS**(`docs/reviews/codex_cycle2b_patch_review.md`, Cycle 2C 착수 준비됨).

## 2. 작성/수정한 파일

**신규**
- `src/renderers/kssb_report_renderer.py` — findings JSON → DOCX + HTML 최소 렌더러(표준 라이브러리만).
- `src/renderers/README.md` — 렌더러 포지셔닝(Skill 워크플로우 내부 형식 변환기)·계약·구현 원칙·산출물 커밋 정책.
- `docs/cycle2c_renderer_completion_report.md` — 본 완료 보고.

**수정**
- `.gitignore` — 렌더러 산출물(`*_KSSB_공시근거_사전검토보고서.docx/.html`, `build/`, `out/`) 제외 추가.
- `docs/current_status.md` — Cycle 2C 상태·완료 작업·이후 사이클·GitHub 상태 갱신.
- `docs/decision_log.md` — Cycle 2C 결정 D22~D25 추가.

기존 findings schema/example/contract 및 Skill 문서는 **수정하지 않았다**(계약 소비만 함).

## 3. 렌더러 구현 요약

- **입력**: `docs/findings_schema_contract.md` / `kssb_findings.schema.json` 형식의 findings JSON.
- **의존성**: Python 표준 라이브러리만(`json`, `re`, `html`, `zipfile`, `io`, `argparse`, `pathlib`, `sys`). 외부 패키지 미추가.
- **공개 진입점**: `load_findings(path)`, `render_html(findings) -> str`, `build_document_xml(findings) -> str`,
  `render_report(findings, out_dir, base_name=None, prefer_docx=True) -> {"docx","html","docx_error"}`, `_main()`(내부/검증용 CLI).
- **파일명**: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(fallback `.html`). base는 `report_meta.generated_for`
  (없으면 `report_title`)에서 파생 후 sanitize(경로 구분자·금지 문자 제거, 공백→밑줄, 길이 제한).
- **렌더 섹션**: 표지·고지(제목·검토대상·목적·review_mode·생성시각·disclaimer) → 검토 개요(source_documents 표) →
  상태 요약(판정 라벨별 건수 표 + 항목-판정 요약 표) → 영역별 항목 결과와 근거(requirement_title/description,
  judgment_label, evidence_anchors[source_id·page_or_section·quote·relevance_note], missing_info, human_review) →
  고객 확인 질문·요청자료(항목ID·항목명·질문·질문사유·관련근거·우선순위·요청자료·후속조치 표, 우선순위 순 정렬) →
  보완 권고(recommendations) → 한계와 사람 검수(overall_limitations·사람 검수 대상·prohibited_terms_check 요약·human_review_boundary).
- **정렬**: 영역=스키마 enum 순(governance→strategy→risk_management→metrics_and_targets), 질문=우선순위(high→low) 순.
  우선순위는 high/medium/low를 상/중/하로 표기 변환(판정 아님).

## 4. DOCX 생성 방식

- 외부 패키지 없이 `zipfile`로 OOXML `.docx`를 수동 조립(`[Content_Types].xml`, `_rels/.rels`, `docProps/core.xml`·`app.xml`,
  `word/_rels/document.xml.rels`, `word/styles.xml`, `word/settings.xml`, `word/document.xml` 8개 엔트리).
- **Word open 실패 예방**: 모든 텍스트 삽입 경로가 `_esc()`를 거쳐 XML 1.0 금지 제어문자를 제거(`_sanitize_xml_text`)한 뒤 XML escape.
  표 셀은 최소 1개 `<w:p>`를 보장하고 표 뒤 빈 문단을 둔다.
- **결정성**: ZIP 엔트리 순서 고정, 모든 엔트리 `date_time`을 고정값(1980-01-01), core.xml created/modified를 고정 W3CDTF로 둠.
  동일 findings → 동일 바이트(스모크에서 6545 bytes 재현 확인).
- **경로 비노출**: core.xml creator/app는 일반 식별자만 사용, 문서 본문에 sandbox/cache/plugin 절대경로를 넣지 않는다.

## 5. HTML fallback 생성 방식

- 동일 findings **단일 소스**에서 파생하는 self-contained 단일 `.html`(별도 판정 없음).
- 모든 값은 `html.escape`(제어문자 제거 후) 적용. 인라인 CSS로 표·인용·고지 블록을 표현.
- DOCX와 동일한 섹션·데이터를 담으며, 고지문(disclaimer)과 human_review_boundary, prohibited_terms_check 요약을 포함.
- `render_report`는 HTML을 항상 먼저 생성하고, DOCX 조립 실패 시 예외를 삼키지 않되 `docx_error`로 기록하고 HTML fallback으로 계속한다.

## 6. findings 재판정 금지 준수 방식

- 렌더러는 `judgment_code`/`judgment_label`을 **그대로 소비**하고 다시 계산하지 않는다. 라벨 표기는 findings 값을 사용.
- evidence_anchors·quote·missing_info·customer_questions·recommendations를 **생성·변경하지 않으며**, 값을 원문 그대로 렌더.
- 렌더러가 수행하는 것은 필드 읽기·섹션 정렬·표 생성·escape·sanitize·파일명 정리·누락 필드 안전 처리·DOCX 실패 시 HTML fallback뿐이다.
- 스모크 검증: 출력에 등장하는 schema-enum 판정 라벨 집합이 입력 판정 라벨 집합과 **정확히 일치**(렌더러가 새 라벨을 만들지 않음),
  근거 quote가 escape만 되어 원문 그대로 등장함을 확인.

## 7. Smoke Test 결과

`src/schemas/kssb_findings_example.json`을 입력으로 표준 라이브러리 스모크 스크립트를 실행(새 외부 의존성 없음, 출력은 repo 밖 임시 폴더):

- schema JSON / example JSON 문법 확인 — PASS
- renderer가 example JSON 로드 — PASS
- DOCX 파일 생성 / HTML 파일 생성 — PASS
- DOCX zip 무결성(`testzip`) / 필수 엔트리 8개 존재 — PASS
- DOCX 내부 XML 전 엔트리 파싱 가능(`xml.dom.minidom`) — PASS
- HTML 핵심 섹션 포함(제목·review_mode·고지·검토 개요·상태 요약·고객 확인 질문·요청자료·후속조치·보완 권고·사람 검수·human_review_boundary·금지 표현 점검) — PASS
- HTML 4대 영역(거버넌스·전략·위험관리·지표 및 목표) 포함 — PASS
- HTML quote 원문 그대로 렌더 — PASS
- 출력 판정 라벨 = 입력 판정 라벨(재판정/생성 없음) — PASS
- DOCX 결정성(2회 렌더 동일 바이트, 6545 bytes) / HTML 결정성 — PASS
- 파일명 규칙(`_KSSB_공시근거_사전검토보고서.docx/.html`) — PASS
- 최소/누락 필드 findings 안전 렌더 / 잘못된 구조에 안전한 오류(RenderError) — PASS

**총 33건 전부 PASS.** `jsonschema`는 미설치 상태였고, 새 의존성 설치 금지 지시에 따라 설치하지 않았다(문법·구조 확인으로 대체).

## 8. 생성된 출력 파일 경로와 커밋 여부

- 스모크 출력은 **repo 밖 임시 폴더**(세션 scratchpad `.../scratchpad/out/`)에 생성했다.
- 생성된 DOCX/HTML은 **커밋하지 않는다.** `.gitignore`에 산출물 패턴(`*_KSSB_공시근거_사전검토보고서.docx/.html`,
  `build/`, `out/`)을 추가해 우발적 커밋을 방지했다. 대표 문서는 findings에서 결정적으로 재생성 가능하다.

## 9. 금지 작업 미수행 확인

- 실제 샘플 PDF 분석 — 미수행.
- OCR / 문서 파싱 구현 — 미수행.
- validator 코드 구현 — 미수행(스모크는 렌더러 산출 확인용, 판정 검증 아님).
- Hook / MCP 추가 — 미수행.
- 기존 Python 코드 복사 — 미수행(참고 엔진은 설계 기법만 계승, 신규 구현).
- submission.zip 생성 — 미수행.
- 샘플 고객사명/파일명 제품 문서 고정 — 미수행(example는 가상 입력, 파일명 base는 findings에서 파생).
- Cycle 2D 상세 계획 작성 — 미수행.
- findings judgment_code 재계산·label 변경·anchors/quote/질문/권고 생성·외부 지식 보강·문서 밖 추정 — 미수행.

## 10. 남은 보류사항

- 수동 검증 규칙(source_id cross-reference, 인용 실재성, review_mode↔label↔source_mode 정합, 금지 표현 스캔)의 경량 결정적 검증 단계 — 이후 사이클(보류).
- 렌더러를 Skill 절차에 실제 배선(호출 지점 확정) — 이후 사이클.
- 실제 샘플(PDF/OCR/문서 파싱) 실행·submission.zip 패키징, 로그 원본 제출 방식 — 제출 패키징 단계에서 결정(보류).
- `jsonschema` 기반 full validation은 새 의존성 금지로 미수행.

## 11. GitHub push 상태

- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin
- branch: `main`
- commit message: `feat: add minimal findings report renderer`
- 최종 commit SHA는 본 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.

## 12. ChatGPT 확인 대기

- 다음 단계는 **Codex Cycle 2C Renderer Review**이며, 착수 여부는 ChatGPT/사용자 확인 후 진행한다.
