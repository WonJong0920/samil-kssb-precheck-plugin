# Validators (findings 경량 가드레일)

이 폴더는 렌더러가 findings를 소비하기 전에 **구조적 위험을 결정적으로 감지·보고**하는 경량 검증기를 담는다.
`schemas/findings_schema_contract.md`(번들 계약 문서)가 "JSON Schema로 표현하지 못한 수동 검증 규칙"으로 남겨 둔 항목을
표준 라이브러리만으로 자동 점검한다.

**구현 2종 (2N-6 Phase 2 N1 — D92 Node 이식)**:
- `kssb_findings_validator.py` — **Python reference (golden parity 기준)**. 기존 동작 무변경으로 유지.
- `kssb_findings_validator.cjs` — **Node 이식**(내장 모듈만 — 외부 의존성·package.json 없음).
  검증 규칙·이슈 코드·severity·location·검출 순서를 Python과 동일하게 유지하며,
  `tests/test_findings_validator_parity.test.cjs`가 동일 fixture로 두 구현을 대조한다.
  Python의 선택적 `jsonschema` 검증은 Node에 없다 — 기본 실행 시 Python의 "미설치 fallback"과
  동일 의미의 info(`schema.optional_skipped`)를 보고한다(표준 라이브러리 검증 범위 동등 — 방식 A).

## 경계 (detect-only)

- 검증기는 findings를 **고치지 않는다.** 판정·근거·질문·권고를 새로 만들거나 보강하지 않는다.
- 문제를 **발견해서 보고**할 뿐이며, Source-bound Analysis와 사람 검수 경계를 약화하지 않는다.
- 렌더러는 계속 형식 변환기이며, 이 검증기는 렌더 전 별도 점검 단계다(렌더러 재판정을 유발하지 않는다).

## 검증 규칙

1. 구조 필수 필드 — 최상위(report_meta / source_documents / kssb_areas / human_review_boundary)와
   **중첩 required 필드**(source_documents[].title·source_mode, kssb_areas[].area_id·area_name·items,
   finding_item의 item_id·requirement_title·judgment_code·judgment_label). `jsonschema`가 없는 표준
   라이브러리 fallback 모드에서도 이 **핵심** required 구조 누락을 error로 감지한다. 단 이는 full JSON Schema
   검증 대체가 아니라 Cycle 2E preflight gate용 핵심 구조 보강이다(전체 스키마 제약을 모두 재현하지는 않는다).
2. `evidence_anchors[].source_id` ↔ `source_documents[].source_id` **cross-reference**.
3. `review_mode` ↔ `source_documents[].source_mode` 정합.
4. `judgment_code` ↔ `judgment_label` ↔ `review_mode` 정합(계약의 모드별 라벨 표 강제).
5. Source-bound 조건부 규칙(confirmed/partial→anchors, not_verifiable→missing_info+questions,
   conflict→human_review, out_of_scope→missing_info)과 evidence **quote 빈값 금지**.
6. `customer_questions` 필수 6필드(question·reason·related_evidence·priority·requested_material·follow_up_action).
7. **금지 표현 스캔**(`prohibited_terms.md`의 강한 표현 기준). 고지·경계·한계 필드(disclaimer,
   human_review_boundary, overall_limitations, notes)는 감사·인증·준수를 **negation 문맥**으로 언급하므로
   오탐 방지를 위해 스캔에서 제외한다. 판정명 단일어(준수/적합/인증/적정)는 substring 스캔 대신 규칙 4의
   라벨 정합으로 검증한다.
8. **내부 경로 노출 스캔**(전체 문자열 필드 대상: `C:\`, `/Users/`, `.codex`, `sandbox`, `AppData`, `plugin/cache` 등).

## 사용

> **경로 규약**: 이 README는 개발자/검증용 문서이며, 아래 CLI 예시의 `src/…` 경로는 **저장소 개발 트리 기준**이다
> (설치 플러그인 루트에서는 `src/` 접두를 제거해 `validators/…`·`schemas/…`로 읽는다).

```
python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json
python src/validators/kssb_findings_validator.py findings.json --json
node   src/validators/kssb_findings_validator.cjs findings.json --json
```

- 종료 코드(두 구현 공통): error가 하나라도 있으면 1, 없으면 0, findings 로드 실패는 2.
  `--warnings-as-errors`로 warning도 실패 처리. `--no-jsonschema`: 선택적 스키마 검증(Python) /
  동등 info 보고(Node) 비활성화.
- **(Node, additive — 기본 꺼짐)** `--source-text <원문.txt>`(반복 가능)가 **명시 제공된 경우에만**
  quote 실재성 보조 점검을 수행한다: 각 anchor 인용을 공백·줄바꿈 정규화(연속 공백↔공백 1) 기준으로
  원문 텍스트에서 substring 재탐색하고, 미발견 시 **warning**(`quote.source_not_found`)으로 보고한다.
  이 점검은 검출·검수 유도용이며 **사람 검수·독립 표본 확인(blackbox §3-(b))을 대체하지 않는다.**

프로그램 사용:

```python
from kssb_findings_validator import validate_findings, load_findings
issues = validate_findings(load_findings("findings.json"))  # list[Issue], findings 미변경
```

```js
const V = require("./src/validators/kssb_findings_validator.cjs");
const issues = V.validateFindings(V.loadFindings("findings.json"));  // Issue[], findings 미변경
```

## 의존성

- Python: 표준 라이브러리만(`json`, `re`, `sys`, `argparse`, `pathlib`). `jsonschema`가 설치되어
  있으면 선택적으로 Draft-07 검증을 추가하지만, **없으면 설치하지 않고** 표준 라이브러리 검증만 수행한다.
- Node: 내장 모듈만(`node:fs`, `node:path`). repo package.json/node_modules 없음.
  두 구현 모두 새 외부 의존성을 요구하지 않는다.
