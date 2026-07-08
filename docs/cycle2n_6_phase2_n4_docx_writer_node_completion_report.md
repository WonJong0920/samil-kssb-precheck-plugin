# Cycle 2N-6 Phase 2 N4 — Node DOCX Writer 이식 Completion Report

> **성격**: D92 Phase 2의 **N4만** 수행한 완료 보고다. Codex N3 review **PASS**("N4 entry: Ready")
> 후 착수했다. Claude Code는 구현·검증·보고만 수행하며 **PASS/FAIL 최종 판정은 Codex N4 review가
> 수행한다.** N4는 Phase 2의 마지막 core Node 이식 단계이지만, **N4 완료가 제품 완성·OCR complete·
> provider finalization·2N-5 전체 완료를 의미하지 않는다.** N5(aux scanner)는 D93대로 미이식.
>
> 시작 HEAD: `792cd4826e8824ec365b874294eeb71dc289daaf` (프롬프트 기준과 일치 — pull 후 최신
> 원격 main·clean)
> 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재)

## 1. 구현 위치 / 변경 파일

| 구분 | 파일 |
|---|---|
| **Node DOCX writer (renderer에 추가)** | `src/renderers/kssb_report_renderer.cjs` — `buildDocumentXml`·`docxBytes`·`buildDeterministicZip` + OOXML 파트 빌더, `renderReport`에 DOCX 경로(우선순위 DOCX→HTML→MD) |
| **Node delivery 연결** | `src/renderers/kssb_report_delivery.cjs` — 대표 문서 DOCX 반영(user summary 문구·fallback·docx_error), `--html-only`/`preferDocx` 옵션 |
| **Node DOCX 테스트 (신규)** | `tests/test_docx_writer_node.test.cjs` — **17 tests** (구조·결정성·XML/ZIP safety·재판정 없음·delivery 연결·D94 차단·no-overclaim) |
| **DOCX parity 테스트 (신규)** | `tests/test_docx_writer_node_parity.test.cjs` — **7 tests** (Python 파트별 콘텐츠 byte-identical) |
| **N2 테스트 갱신** | `tests/test_delivery_node.test.cjs`(DOCX-부재 단언 → DOCX 생성으로) · `tests/test_delivery_node_parity.test.cjs`(HTML/MD 비교 시 Node도 preferDocx:false) |
| 문서 (최소 갱신) | `src/renderers/README.md` · `docs/workflow_usage.md` · `docs/current_status.md` · 본 보고서 |
| **무변경** | `kssb_report_renderer.py`·`kssb_report_delivery.py`(**transitional reference 보존** — diff 0) · validator(.py/.cjs) · dei_producer(.py/.cjs) · schema · Skill · runner · aux scanner |

decision_log 무변경(신규 결정 없음 — D92 ③의 N4 집행. DOCX 계약·결정성 규칙·경계 전부 기존 결정 그대로).

## 2. 구현 흐름 (목표 상태 달성)

```
findings JSON
→ Node validator preflight (kssb_findings_validator.cjs — N1, detect-only)
→ D94 hard stop (error ≥ 1 → 산출물 0·out-dir 미생성·exit 4)
→ Node delivery → renderReport
→ DOCX + HTML + Markdown 대표 보고서 생성 (primary = DOCX, 우선순위 DOCX → HTML → Markdown)
```

## 3. Python reference에서 파악한 DOCX renderer/writer 책임 범위 (전량 이식)

`kssb_report_renderer.py`의 DOCX 책임을 다음으로 파악하고 축소 없이 이식했다:

1. **OOXML 문서 XML 조립**(`build_document_xml`): 7개 섹션(표지·고지 → 1.검토 개요 → 2.상태 요약 →
   3.영역별 결과·근거 → 4.고객 질문·요청자료 → 5.보완 권고 → 6.한계·사람 검수)을 `_run`/`_p`/
   `_title`/`_h1`/`_h2`/`_label`/`_cell`/`_table` 문단·표 빌더로 구성. HTML/MD와 **동일한 정렬·문구·
   라벨**(영역=enum 순, 질문=우선순위 순, `str(True)` 표기)을 공유(재판정 없음).
2. **OOXML 패키지 파트**: `[Content_Types].xml`·`_rels/.rels`·`docProps/core.xml`·`docProps/app.xml`·
   `word/_rels/document.xml.rels`·`word/styles.xml`·`word/settings.xml`·`word/document.xml` 8종을
   Python과 동일 문자열로 생성(스타일·폰트·페이지 여백·core 날짜 고정).
3. **결정적 ZIP 조립**(`_docx_bytes`): 엔트리 순서 고정, 모든 date_time = 1980-01-01, core.xml
   created/modified 고정, DEFLATE(level 9).
4. **안전 처리**: 금지 제어문자 제거(`_sanitize_xml_text`) + XML escape(`_esc` — `& < > "`, 작은따옴표
   비-escape), 파일명 sanitize, `RenderError`(내용 미생성), DOCX 실패 시 HTML/MD fallback.

## 4. 구현한 Node DOCX writer 위치 / 모듈 경계

- **단일 모듈 결정**: Python이 renderer·DOCX를 한 모듈에 두므로 Node도 `kssb_report_renderer.cjs`에
  DOCX를 **추가**했다(별도 파일 신설 안 함 — repo 관례·공유 헬퍼 재사용 `_orderedAreas`·
  `_collectQuestions`·`_judgmentCountRows`·`_priorityDisplay`·`sanitizeFilenameBase`).
- **ZIP writer**: 외부 의존성 없이 `zlib`만으로 최소 ZIP을 수동 조립(`buildDeterministicZip`) —
  로컬 헤더 + 중앙 디렉터리 + EOCD, extra field·data descriptor 없음, version=20·host=0(FAT),
  external_attr=0o644<<16, CRC32(`zlib.crc32`), DEFLATE(`zlib.deflateRawSync(level:9)`).
- **escape 분리**: HTML용 `_h`(작은따옴표까지 escape)와 별개로 DOCX용 `_escDocx`(Python `_esc` 동등 —
  `& < > "`만, 작은따옴표 비-escape)를 두어 파트 콘텐츠가 Python과 정확히 일치하도록 함.

## 5. Node delivery 연결 방식

- `renderReport(findings, outDir, { baseName, preferDocx=true })`가 DOCX→HTML→MD를 생성하고
  `{docx, html, markdown, primary, primary_format, docx_error}`를 반환(Python `render_report` 반환
  형태 이식). primary는 DOCX(조립 성공 시).
- `deliver()`는 **preflight → D94 hard stop → renderReport(preferDocx)** 순서 유지. user summary는
  Python delivery 문구로 정렬: "형식: docx (우선순위 DOCX → HTML → Markdown)", fallback에 html/
  markdown 파일명, `docx_error` 시 "DOCX 생성이 제한되어 fallback…" 정직 표기. **D94 hard stop은
  renderReport 호출 전이라 DOCX도 생성되지 않는다**(동작 무변경).
- CLI에 `--html-only`(=`preferDocx:false`) 추가(내부/검증용 — Python delivery와 동일 옵션).

## 6. CLI / API 사용법

```bash
node src/renderers/kssb_report_delivery.cjs <findings.json> -o <out_dir> [--base-name <이름>] [--html-only] [--debug]
# 대표 문서: DOCX → HTML → Markdown. exit: 0=성공 / 2=로드 실패 / 3=RenderError / 4=D94 hard stop / 1=통제된 실패
node src/renderers/kssb_report_renderer.cjs 는 별도 CLI 없음(모듈 API) — renderReport/docxBytes/buildDocumentXml.
```

```js
const R = require("src/renderers/kssb_report_renderer.cjs");
const out = R.renderReport(findings, outDir);            // { docx, html, markdown, primary, primary_format, docx_error }
const bytes = R.docxBytes(findings);                     // 결정적 DOCX Buffer
const xml = R.buildDocumentXml(findings);                // word/document.xml 문자열
```

## 7. parity 기준 (구현 초기 정의 — 프롬프트 요구 항목)

- **DOCX 구조 parity**: 동일한 8개 OOXML 파트가 **동일 이름·동일 순서**([Content_Types].xml first,
  word/document.xml 존재).
- **문구/섹션 parity**: 각 파트의 **압축 해제 콘텐츠가 Python과 byte-identical**(섹션·문구·스타일·
  core.xml·styles.xml 전부). 이것이 이 단계의 **parity gate**다(구조 비교보다 강함).
- **deterministic output**: 동일 findings → Node가 매 실행 **byte-identical**(고정 타임스탬프
  1980-01-01·엔트리 순서·압축 파라미터). Python도 콘텐츠 결정적.
- **XML escaping/safety**: XML 1.0 금지 제어문자(`\x00-\x08\x0B\x0C\x0E-\x1F`) 제거, `& < > "` escape
  (작은따옴표 비-escape — Python `_esc` 동등), document.xml well-formed.
- **ZIP entry ordering / timestamp / compression 결정성**: 엔트리 순서 고정, 전 엔트리 date_time
  1980-01-01, method DEFLATE(level 9), extra field·data descriptor 없음, 고정 external attr.
- **user-facing summary**: DOCX가 대표 문서(primary), 우선순위 DOCX → HTML → Markdown, docx_error 시
  fallback 정직 표기. 로컬 경로·stack·provider·내부 용어 미노출.

## 8. Python reference와의 parity/structure comparison 결과

`tests/test_docx_writer_node_parity.test.cjs`(Python 미탐지 시 skip — 이번 실행 **skip 0**, Python
3.14.5 실측 대조):

- **파트별 콘텐츠 byte-identical**: 공식 예시 + 변형(선택 필드 제거·질문 우선순위 변경·escape 문자
  `<b>&"'`) + 금지 제어문자 포함 findings 3케이스 모두, 8개 파트 각각 압축 해제 콘텐츠가
  Python `_docx_bytes` 산출과 byte-identical(측정: word/document.xml 28,495 bytes 포함 전 파트 동일).
- **구조 불변식**: 파트 수 8, [Content_Types].xml first, word/document.xml 존재(양쪽 동일).
- **결정성 parity**: Node 반복 실행 byte-identical, Python 반복 실행 byte-identical.

## 9. byte parity 가능 여부와 허용 차이

- **파트 콘텐츠 byte parity: 달성**(위 §8 — 압축 해제 후 전 파트 동일).
- **컨테이너 전체 byte parity: 미달성(목표 아님 — 문서화된 허용 차이)**. 측정값: 공식 예시에서
  Python .docx 6,638 bytes vs Node .docx 6,599 bytes. 원인은 **큰 파트(word/document.xml, 28KB)에서
  Node zlib와 Python zlib의 DEFLATE 압축 스트림이 상이**(작은 파트는 스트림까지 일치하는 것을
  별도 실측으로 확인 — 차이는 큰 입력의 압축기 구현 차). CRC·압축 해제 콘텐츠가 동일하므로
  **의미·구조·유효성은 완전 동일**하며, 압축 컨테이너 봉투 차이는 산출물 품질에 영향이 없다.
  parity gate는 **구조 + 콘텐츠 + 결정성**으로 정의했다(byte-for-byte 컨테이너 일치를 강제하지
  않음 — 은폐 없이 `test_docx_writer_node_parity.test.cjs`가 이 관측을 명시 기록).

## 10. deterministic output / XML·ZIP safety 검증

- **결정성**: `docxBytes(base)` 2회 `Buffer.equals`, renderReport 반복 산출 파일 byte-identical,
  파일 == docxBytes 확인(테스트로 강제).
- **ZIP safety**: 전 엔트리 method 8·extra field 0·DOS date 1980-01-01·**CRC32 재계산 정합**·usize
  정합. Node 생성 .docx를 Python `zipfile.testzip()`으로 검사 → **None(무결)**, 8개 XML 파트 전부
  `ElementTree` 파싱 성공(**well-formed**).
- **XML safety**: 주입 `<b>&"'` → `&lt;b&gt;&amp;&quot;'&lt;/b&gt;`(작은따옴표만 비-escape),
  금지 제어문자(`\x00`,`\x07`,`\x1F`) 제거 후 잔존 0(테스트로 강제).

## 11. D94 hard stop에서 DOCX artifact 차단 여부

- **차단 확인**: preflight error ≥ 1이면 `deliver()`가 renderReport 호출 전에 hard stop → `outputs={}`,
  **out-dir 미생성 → .docx 생성 없음**(테스트). 미리 존재하는 out-dir에서도 .docx/.html/.md 0건
  생성(테스트로 강제). D94 동작은 N2 대비 무변경.

## 12. 검증 결과

| 항목 | 결과 |
|---|---|
| `node --test tests/test_docx_writer_node.test.cjs` | **17/17 PASS** (skip 0) |
| `node --test tests/test_docx_writer_node_parity.test.cjs` | **7/7 PASS (skip 0 — Python 3.14.5 실측)** |
| `node --test tests/test_delivery_node.test.cjs` (N2 갱신) | **19/19 PASS** |
| `node --test tests/test_delivery_node_parity.test.cjs` (N2 갱신) | **6/6 PASS (skip 0)** |
| N1 회귀: validator node 43 · parity 35 | **전부 PASS** |
| N3 회귀: dei node 61 · parity 46 | **전부 PASS** |
| Python reference 회귀: validator 30 · delivery wiring 34 · renderer smoke 22 · dei 83 · OCR hash 11 · aux 26 · nethook 29 · hwp 49 | **전부 PASS (불변)** |
| Node 회귀: router 21 · hwp 39 · OCR 29 · write-failure 8 · bootstrap 11 | **전부 PASS** |
| Node DOCX 유효성: Python `testzip()` None + 8 파트 XML well-formed | **PASS** |
| `git diff --check` | clean |
| 오염 스캔(node_modules/package·lock/generated intake·OCR·DEI·findings·report·**.docx**/traineddata/zip/submission.zip/repo tool-cache/샘플 원본) | **0건** |

실행하지 않은 테스트: 없음(프롬프트가 요구한 N1/N2/N3 + Python reference + intake/runner 스위트를
전부 재실행). 실 샘플 문서 실행·OCR/HWP runner 실 실행은 없음(N4 범위 밖 — 합성/공식 예시 findings 기반,
2N-5R evidence가 실측 커버). Word GUI 열람 확인은 환경 제약으로 미실행 — 대신 콘텐츠가 known-good
Python reference와 byte-identical임 + Python zipfile/XML 파서 유효성 검증으로 대체(사유·영향 명시).

## 13. no-overclaim / leak scan

- **document.xml 본문**: OCR 지원 완료/support complete/provider finalization/product complete/
  provider명(kordoc·tesseract)/tool-cache/node_modules/AppData/Traceback/RunnerError/내부 사이클
  용어(2N-5·2N-6·Cycle 2) — **0건**. 감사/인증/준수 계열은 `<w:t>` 텍스트 추출 후 negation 경계
  문맥에서만 존재(테스트로 강제).
- **core.xml/app.xml**: creator/application이 중립 식별자(`samil-kssb-precheck-renderer`) — provider명·
  완성 주장 없음(테스트로 강제).
- **사용자-facing 요약**: 로컬 절대경로·계정명·stack·raw 이슈 미노출(delivery 테스트의 누출 assert).

## 14. 경계 준수 / 미착수 확인

- **Python reference 보존**: `kssb_report_renderer.py`·`kssb_report_delivery.py` diff 0(명시적 parity
  결정 없이 무변경 — N3 carry-forward 준수). Python 스위트(30/34/22/83/…) green 유지.
- **N5 미착수**: aux scanner Node 이식·결정 변경 없음(aux_structure_scanner diff 0).
- **hook/stage/config 구조 작업 미착수**: 해당 표면 무변경(제안 문서만 외부 세션이 별도 보유 —
  본 사이클에서 다루지 않음).
- **N1/N2/N3 의미 무변경**: validator·D94 hard stop·DEI producer 로직 diff 0. DEI candidate는 findings가
  아니며 renderer로 우회 투입되지 않는다(경계 유지).
- **재판정 없음**: DOCX writer는 판정·근거·질문·권고를 생성/변경하지 않음(항목·근거·질문 수·라벨
  보존 테스트). KSSB 판단 자동화·고객 질문 생성 없음.
- **의존성 0**: Node 내장 모듈(`zlib`/`fs`/`path`)만. package.json/lock/node_modules 미추가.
- generated artifact(.docx 포함)·샘플 원본 repo 미유입(테스트는 임시 폴더 생성·정리).
- 감사·인증·준수 확정·제품 완성 표현 없음 · Claude 최종 판정 없음.

## 15. Required Follow-up / Carry-forward

- **Codex Phase 2 N4 review** → PASS 시 Phase 2 core 이식(N1~N4) 완료 판단 및 다음 단계(N5 aux 처리
  결정 §7-②, Phase 3 품질 강화) 착수 판단.
- **workflow docs 표면 일괄 정렬**(C2N6-N3-OBS-01 계승): 이제 Node 경로가 DOCX→HTML→MD 전 형식을
  제공하므로, 과도기 Python CLI 기준 서술을 Node 경로 기준으로 정렬하는 일괄 작업을 다음 사이클에서
  수행 권장(이번엔 최소 갱신만 — workflow_usage의 Node delivery 줄·README 렌더러 절).
- **컨테이너 byte parity 비보장**: DOCX 규칙·zlib 파라미터 변경 시 파트 콘텐츠 parity 테스트가 즉시
  회귀를 잡는다. 컨테이너 봉투 차이는 의도된 허용 차이로 유지(§9).
- **Word GUI 열람 확인**: 환경 제약으로 자동화 밖 — 제출 전 사람 검수 단계에서 실 Word 열람 확인 권장
  (콘텐츠가 2N-5R에서 실 delivery된 Python DOCX와 byte-identical이라 리스크 낮음).
