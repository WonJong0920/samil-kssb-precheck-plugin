# Renderers (findings → 대표 문서 형식 변환기)

이 폴더는 Skill `samil-kssb-precheck` 워크플로우가 사용하는 **내부 형식 변환기**와 **전달 배선기**를 담는다.
사용자-facing 진입점은 Skill 하나이며, 렌더러는 Skill이 만든 **구조화 findings**를
**재판정 없이** 대표 DOCX/HTML/Markdown으로 바꾸는 단계일 뿐이다. 사용자는 Python/PATH를 의식하지 않는다.

- `kssb_report_renderer.py` — findings → DOCX/HTML/Markdown 형식 변환기(재판정 없음).
- `kssb_report_delivery.py` — findings → validator preflight(detect-only) → renderer → **사용자-facing 요약** 배선기.
  사용자 요약과 내부 상세(전체 경로·validator 이슈)를 분리하고, 로컬 절대경로·계정명을 비노출한다. 전달 계약: `docs/workflow_usage.md`.

## 포지셔닝

- 사용자 흐름의 본체는 Skill(판단 엔진)이다. 렌더러는 findings → 문서 변환기다.
- 렌더러는 **판정·근거·질문·권고를 다시 계산하거나 변경하지 않는다.**
- DOCX와 HTML은 **동일 findings 단일 소스**에서 파생하며 서로 다른 판정을 내지 않는다.

## 계약

- 입력: `docs/findings_schema_contract.md` / `src/schemas/kssb_findings.schema.json` 형식의 findings JSON.
- 출력 파일명: `<보고서명>_KSSB_공시근거_사전검토보고서.{docx|html|md}`(우선순위 DOCX→HTML→Markdown).
  `<보고서명>` base는 `report_meta.generated_for`(없으면 `report_title`)에서 파생해 sanitize한다.

## 렌더러가 하는 일 / 하지 않는 일

**하는 일**: 필드 읽기, 섹션 정렬(영역=스키마 enum 순, 질문=우선순위 순), 표 생성,
HTML/XML escape, 금지 제어문자 sanitize, 파일명 sanitize, 누락 필드에 대한 안전한 처리,
DOCX 실패 시 HTML fallback 생성.

**하지 않는 일**: judgment_code 재계산, judgment_label 변경, evidence_anchors/quote/missing_info/
customer_questions/recommendations 생성, 외부 지식 보강, 문서 밖 추정 추가.

## 구현 원칙

- **Python 표준 라이브러리만** 사용한다(`json`, `re`, `html`, `zipfile`, `io`, `argparse`, `pathlib`, `sys`).
  `python-docx` 등 외부 의존성을 추가하지 않는다.
- **DOCX**: `zipfile`로 OOXML `.docx`를 수동 조립한다. XML escape + 금지 제어문자 제거로 Word open 실패를
  예방하고, ZIP 엔트리 순서·타임스탬프·core.xml 날짜를 고정해 **결정적 출력**을 지향한다.
- **HTML**: self-contained 단일 파일. 동일 findings에서 파생하며 고지문과 human_review_boundary를 포함한다.
- 내부 절대경로·sandbox/cache/plugin path를 문서에 노출하지 않는다.

## 사용(내부/검증용)

```
python src/renderers/kssb_report_renderer.py src/schemas/kssb_findings_example.json -o <출력폴더>
```

- `--html-only`: HTML fallback만 생성.
- `--base-name`: 파일명 base 재정의.

프로그램 사용 시:

```python
from kssb_report_renderer import load_findings, render_report
out = render_report(load_findings("findings.json"), out_dir="build")
# out == {"docx":..., "html":..., "markdown":..., "primary":..., "primary_format":..., "docx_error":...}

# 전달 배선기(preflight + 대표 문서 + 사용자-facing 요약)
from kssb_report_delivery import deliver
res = deliver(load_findings("findings.json"), out_dir="build")
# res["user_summary"] = 안전한 사용자-facing 요약, res["outputs"]/res["preflight"] = 내부 상세
```

## 산출물 커밋 정책

생성된 DOCX/HTML은 **기본적으로 커밋 대상이 아니다.** 스모크 테스트/검증 출력은 repo 밖(임시 폴더)에 쓴다.
`docs/cycle2c_renderer_completion_report.md`의 산출물 정책을 참고한다.
