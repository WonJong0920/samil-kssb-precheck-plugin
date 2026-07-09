# Renderers (findings → 대표 문서 형식 변환기)

이 폴더는 Skill `samil-kssb-precheck` 워크플로우가 사용하는 **내부 형식 변환기**와 **전달 배선기**를 담는다.
사용자-facing 진입점은 Skill 하나이며, 렌더러는 Skill이 만든 **구조화 findings**를
**재판정 없이** 대표 DOCX/HTML/Markdown으로 바꾸는 단계일 뿐이다. 사용자는 Python/PATH를 의식하지 않는다.

**런타임 경로는 Node 이식(`.cjs`, 아래)**이며, 아래 Python(`.py`) 2종은 **golden parity reference**로 유지한다
(제거 아님 — D93 ③). Python:

- `kssb_report_renderer.py` — **(reference)** findings → DOCX/HTML/Markdown 형식 변환기(재판정 없음).
- `kssb_report_delivery.py` — **(reference)** findings → validator preflight(detect-only) → renderer → **사용자-facing 요약** 배선기.
  사용자 요약과 내부 상세(전체 경로·validator 이슈)를 분리하고, 로컬 절대경로·계정명을 비노출한다. 전달 계약: `skills/samil-kssb-precheck/workflow_usage.md`(번들).

**Node 이식 2종 (런타임 — 2N-6 Phase 2 N2 HTML/MD → N4 DOCX — D92 Node 이식)**:
- `kssb_report_renderer.cjs` — Python renderer의 **HTML/Markdown/DOCX 경로 충실 이식**. HTML/MD는
  섹션·문구 동일(`tests/test_delivery_node_parity.test.cjs` 전문 대조), **DOCX는 N4 이식 완료**:
  `buildDocumentXml`/`docxBytes` + `zlib`만으로 결정적 최소 ZIP(OOXML) 수동 조립(엔트리 순서·
  타임스탬프 1980-01-01·DEFLATE level 9 고정). **parity = 8개 파트 압축 해제 콘텐츠가 Python과
  byte-identical + 결정성**(`tests/test_docx_writer_node*.test.cjs`); 컨테이너 전체 byte parity는 큰
  파트의 zlib 압축 스트림 차로 목표가 아님(허용 차이 — 콘텐츠·구조·유효성은 동일). 대표 문서
  우선순위 **DOCX → HTML → Markdown**(primary=DOCX).
- `kssb_report_delivery.cjs` — findings → **Node validator(N1) preflight** → **D94 hard stop**
  (preflight error ≥ 1이면 **산출물(DOCX 포함)을 만들지 않고** 통제된 중단 — exit 4, sanitized 안내:
  raw 이슈 위치·로컬 경로·stack 미노출, 상세는 프로그램 반환값·`--debug` stderr에만) → Node renderer
  (DOCX→HTML→MD) → 사용자-facing 요약. **Python delivery/renderer는 transitional reference로 무변경**
  (D92 ③ — error 시에도 경고 후 생성 계속하는 현행 동작 유지, D94 구현은 Node 경로에만).
  사용: `node src/renderers/kssb_report_delivery.cjs <findings.json> -o <out_dir> [--base-name <이름>] [--html-only] [--manifest] [--debug]`
  (exit: 0=성공 / 2=로드 실패 / 3=전달 불가 / 4=preflight hard stop / 1=예기치 못한 실패의 통제된 안내).
  Node 두 파일 모두 내장 모듈만 사용(외부 의존성·package.json 없음).
  - **trace manifest(opt-in, 기본 off)**: `--manifest`/`{ manifest: true }`일 때만 성공 delivery의 provenance
    (findings canonical-JSON hash·preflight 요약(code/severity)·산출물 basename/bytes/sha256·self-hash)를
    `run_manifest.json` 내부 artifact로 **결정적** 기록한다. **대표 문서 아님**·판정/품질/감사·인증류 필드 없음·
    로컬 경로/계정명/stack/timestamp 미포함. **D94 hard stop 시 미생성**, 생성 실패는 delivery 성공을 깨지 않고
    `manifest_error`(경로·stack 없는 짧은 사유)로만 남긴다. Node-only 신규 stage(포트 아님 — Python parity 비대상).
    기본 산출물이 아니므로 `.gitignore`로 방어한다.

## 포지셔닝

- 사용자 흐름의 본체는 Skill(판단 엔진)이다. 렌더러는 findings → 문서 변환기다.
- 렌더러는 **판정·근거·질문·권고를 다시 계산하거나 변경하지 않는다.**
- DOCX·HTML·Markdown은 **동일 findings 단일 소스**에서 파생하며 서로 다른 판정을 내지 않는다.

## 계약

- 입력: `schemas/findings_schema_contract.md` / `schemas/kssb_findings.schema.json`(번들 계약·스키마) 형식의 findings JSON.
- 출력 파일명: `<보고서명>_KSSB_공시근거_사전검토보고서.{docx|html|md}`(우선순위 DOCX→HTML→Markdown).
  `<보고서명>` base는 `report_meta.generated_for`(없으면 `report_title`)에서 파생해 sanitize한다.

## 렌더러가 하는 일 / 하지 않는 일

**하는 일**: 필드 읽기, 섹션 정렬(영역=스키마 enum 순, 질문=우선순위 순), 표 생성,
HTML/XML escape, 금지 제어문자 sanitize, 파일명 sanitize, 누락 필드에 대한 안전한 처리,
DOCX 실패 시 HTML fallback 생성.

**하지 않는 일**: judgment_code 재계산, judgment_label 변경, evidence_anchors/quote/missing_info/
customer_questions/recommendations 생성, 외부 지식 보강, 문서 밖 추정 추가.

## 구현 원칙 (런타임 = Node / reference = Python, 외부 의존성 0)

- **런타임(Node, `.cjs`)**: Node **내장 모듈만** 사용(`node:fs`·`node:path`·`node:zlib`). DOCX는 **`zlib`로
  OOXML `.docx`를 수동 조립**한다(`buildDeterministicZip` — DEFLATE level 9, 고정 타임스탬프). package.json/
  node_modules 없음.
- **reference(Python, `.py`)**: **표준 라이브러리만** 사용(`json`, `re`, `html`, `zipfile`, `io`, `argparse`,
  `pathlib`, `sys`). DOCX는 `zipfile`로 조립. `python-docx` 등 외부 의존성 없음 — golden parity 기준으로 유지한다(D93 ③).
- **DOCX 공통 원칙**: XML escape + 금지 제어문자 제거로 Word open 실패를 예방하고, ZIP 엔트리 순서·타임스탬프·
  core.xml 날짜를 고정해 **결정적 출력**을 보장한다(파트 콘텐츠는 Node/Python **byte-identical** — N4 parity).
- **HTML/Markdown**: self-contained. 동일 findings에서 파생하며 고지문과 human_review_boundary를 포함한다.
- 내부 절대경로·sandbox/cache/plugin path를 문서에 노출하지 않는다.

## 사용(내부/검증용)

> **경로 규약**: 아래 CLI 예시의 `src/…` 경로는 **저장소 개발 트리 기준**이다(설치 플러그인 루트에서는 `src/` 접두를 제거해 `renderers/…`·`schemas/…`로 읽는다). 이 절은 개발/검증용이며 설치 스킬의 기본 사용자 흐름이 아니다.

런타임 경로는 **Node 이식(`.cjs`)**이다. Python(`.py`)은 golden parity reference로 유지한다(제거 아님 — D93 ③).

```
# 런타임 (Node — 대표 문서 DOCX → HTML → Markdown, D94 hard stop)
node src/renderers/kssb_report_delivery.cjs findings.json -o <출력폴더> [--base-name <이름>] [--html-only] [--debug]
node src/renderers/kssb_report_renderer.cjs   # 모듈 API(renderReport/docxBytes/buildDocumentXml) — 별도 CLI 없음
```

```
# reference (Python — golden parity 대조용)
python src/renderers/kssb_report_renderer.py src/schemas/kssb_findings_example.json -o <출력폴더>   # --html-only / --base-name
```

프로그램 사용:

```js
// 런타임 (Node)
const R = require("./src/renderers/kssb_report_renderer.cjs");
const out = R.renderReport(R.loadFindings("findings.json"), "build");
// out == { docx, html, markdown, primary, primary_format, docx_error }
const D = require("./src/renderers/kssb_report_delivery.cjs");
const res = D.deliver(R.loadFindings("findings.json"), "build");
// res.user_summary = 안전한 사용자-facing 요약, res.outputs/res.preflight = 내부 상세
```

```python
# reference (Python)
from kssb_report_renderer import load_findings, render_report
out = render_report(load_findings("findings.json"), out_dir="build")
from kssb_report_delivery import deliver
res = deliver(load_findings("findings.json"), out_dir="build")
```

## 산출물 커밋 정책

생성된 DOCX/HTML은 **기본적으로 커밋 대상이 아니다.** 스모크 테스트/검증 출력은 repo 밖(임시 폴더)에 쓴다.
`docs/cycle2c_renderer_completion_report.md`(과거 완료 기록, 저장소 전용)의 산출물 정책을 참고한다.
