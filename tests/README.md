# tests (재사용 가능한 표준 라이브러리 점검)

Cycle 2C 렌더러와 Cycle 2D 검증기에 대한 **재사용 가능한 스모크/검증 스크립트**다.
외부 패키지 없이 Python 표준 라이브러리만 사용하며, 렌더 출력은 항상 **repo 밖 임시 폴더**에 생성한다.

## 스크립트

- `smoke_test_renderer.py` — findings → DOCX/HTML 렌더러 스모크. DOCX zip/내부 XML 유효성, HTML 핵심 섹션,
  재판정 금지(출력 라벨=입력 라벨), quote 원문 보존, 결정성, 파일명 규칙, 내부 경로 비노출을 점검한다.
- `test_findings_validator.py` — 경량 검증기 점검. valid example에서 error 0건, 의도적으로 손상시킨
  in-memory 사본에서 기대 검증 코드(cross-ref·모드 정합·빈 quote·질문 필드·source-bound·금지 표현·내부 경로) 검출.

## 실행

```
python tests/smoke_test_renderer.py
python tests/test_findings_validator.py
```

기본 입력은 `src/schemas/kssb_findings_example.json`이다.
`smoke_test_renderer.py`는 인자로 임의 findings 경로를 받을 수 있다.

콘솔이 UTF-8이 아니면(예: Windows cp949) 다음처럼 인코딩을 지정한다.

```
set PYTHONUTF8=1 && python tests/smoke_test_renderer.py     # cmd
$env:PYTHONUTF8=1;  python tests/smoke_test_renderer.py     # PowerShell
```

두 스크립트 모두 모든 점검 PASS 시 종료 코드 0, 실패 시 1을 반환한다(CI/Preflight에서 사용 가능).
정식 pytest 프레임워크는 도입하지 않았다(새 외부 의존성 없음).
