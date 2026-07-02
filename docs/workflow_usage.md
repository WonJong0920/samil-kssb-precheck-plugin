# Workflow Usage (사용 계약 / workflow wiring)

Samil KSSB Precheck의 사용자-facing 진입점은 **Skill `samil-kssb-precheck` 하나**다.
검증기와 렌더러는 그 스킬 워크플로우가 사용하는 **내부 구성요소**이며, 사용자가 직접 실행하는 Python CLI가 아니다.
이 문서는 findings → 검증 → 렌더 → 사람 검수로 이어지는 흐름과 각 구성요소의 경계를 사용 계약으로 고정한다.

## 전체 흐름

```text
Skill (판단 엔진)
  └─ 입력 자료(고객 제공자료 또는 해커톤 공개자료)를 근거로 KSSB 4대 영역 항목별
     판정·근거 앵커·부족정보·고객 질문·권고를 source-bound 구조화 findings로 생성
        → src/schemas/kssb_findings.schema.json / docs/findings_schema_contract.md 계약 준수
Validator (detect-only preflight 게이트)
  └─ src/validators/kssb_findings_validator.py 가 findings를 재판정 없이 점검
     (구조 필수 필드·source_id cross-reference·모드↔라벨 정합·source-bound 조건부 규칙·
      빈 quote·질문 필수 6필드·금지 표현·내부 경로 노출). findings를 고치지 않고 감지·보고만.
     error가 있으면 findings를 바로잡은 뒤 다음 단계로.
Renderer (형식 변환기)
  └─ src/renderers/kssb_report_renderer.py 가 동일 findings를 재판정 없이
     대표 DOCX + HTML fallback으로 결정적 변환(단일 소스 파생).
Human review (사람 검수)
  └─ 산출물은 초안. 컨설턴트가 검수·수정·확정. 확인 불가·상충 항목은 사람 검토로.
```

## 구성요소 경계 (usage contract)

| 구성요소 | 역할 | 하는 것 | 하지 않는 것 |
|---|---|---|---|
| **Skill** | 판단 엔진 | source-bound findings 생성(판정·근거·질문·권고) | 최종 문서 직접 작성, 감사·인증·준수 확정 |
| **Validator** | detect-only preflight 게이트 | 구조적 위험 감지·보고(Issue 목록) | findings 수정, 판정·근거·질문 생성 |
| **Renderer** | 형식 변환기 | findings를 DOCX/HTML로 형식 변환 | judgment 재계산, 근거·질문 생성 |
| **사람 검수** | 최종 판단 | 검수·수정·확정 | — |

- **단일 source of truth**: findings 하나에서 검증·렌더가 파생한다. DOCX와 HTML은 서로 다른 판정을 내지 않는다.
- **재판정 금지**: 검증기·렌더러는 `judgment_code`/`judgment_label`을 소비만 하고 다시 계산하지 않는다.
- **Skill-first**: 사용자는 스킬만 호출한다. 검증기·렌더러의 CLI는 **내부/검증용**이며 기본 사용자 흐름이 아니다.

## 내부/검증용 실행 (개발·CI 참고, 사용자 흐름 아님)

```
python src/validators/kssb_findings_validator.py <findings.json>   # detect-only, error 시 종료코드 1
python src/renderers/kssb_report_renderer.py <findings.json> -o <out>   # DOCX + HTML fallback
```

재사용 점검 스크립트(표준 라이브러리, 출력은 repo 밖 임시 폴더):

```
python tests/test_findings_validator.py   # 검증기 점검
python tests/smoke_test_renderer.py       # 렌더러 스모크
```

## 산출물 정책

- 기본 산출물: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(fallback `.html`) 대표 문서 1개.
- JSON/CSV/manifest/`_검토근거` 폴더는 기본 산출물이 아니다(내부 개발/검증용 가능성만).
- 생성 문서는 커밋 대상이 아니며 findings에서 결정적으로 재생성 가능하다(`.gitignore` 산출물 제외).
- plugin/cache/sandbox 내부 경로를 산출물·사용자 안내에 노출하지 않는다.

## 경계

- 본 도구는 삼일회계법인의 공식 제품·내부 도구가 아니며, 감사·인증·준수 판단을 대체하지 않는다.
- 확인 불가 항목을 미공시로 단정하지 않는다. 최종 판단은 컨설턴트가 수행한다.
- quote 인용 실재성(입력 원문 일치)은 자동 검증 범위 밖이며 사람 검수 대상이다.
- 문서 변환/OCR·Hook/MCP·submission.zip은 현재 범위에 포함하지 않는다.
