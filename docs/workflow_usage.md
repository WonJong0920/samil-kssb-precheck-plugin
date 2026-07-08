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

## 전달 계약 (Delivery contract, Cycle 2I-1)

전달 배선기 `src/renderers/kssb_report_delivery.py`(내부 구성요소)가 **findings → preflight(detect-only) → 대표 문서 →
사용자-facing 요약**을 잇는다. 핵심은 **사용자-facing 최종 보고와 내부 실행 로그의 분리**다.

- **대표 문서 보장·우선순위**: DOCX → HTML → Markdown. DOCX 생성이 제한돼도 HTML·Markdown fallback은 항상 생성되며,
  `render_report()`가 `primary`/`primary_format`으로 대표 문서를 지정한다. 파일명은 `<보고서명>_KSSB_공시근거_사전검토보고서.{docx|html|md}`.
- **사용자-facing 요약(안전)**: 대표 문서 **파일명 + 표시 경로**(repo 하위면 상대경로, 아니면 파일명만), fallback 안내,
  preflight 요약(건수만), **사람 검수 고지**, **감사·인증·준수 대체 아님 경계 고지**를 담는다. **로컬 절대경로·계정명·임시경로·validator raw 출력·스크립트 로그는 포함하지 않는다**(표시 경로 sanitize + 2차 redaction).
- **내부/사용자 분리**: `deliver()`는 `user_summary`(안전)와 `outputs`/`preflight.issues`/`internal_notes`(전체 경로·이슈, 내부)를 **분리 반환**한다.
  CLI는 `user_summary`만 stdout에 출력하고, 내부 상세는 `--debug` 시에만 stderr에 출력한다.
- **경계 유지**: 배선기는 재판정하지 않는다(validator=detect-only, renderer=형식 변환). 확인 불가를 미공시/부적합으로 단정하지 않는다.
- **preflight error hard stop 정책(D94 — 정책 기록만, 구현은 N2)**: preflight에서 **error가 1건 이상이면
  delivery는 대표 문서를 생성하지 않고** "findings 보완 후 재생성" 안내와 함께 통제된 중단으로 종료하는 것을
  표준 정책으로 기록한다(validator raw 출력·내부 경로 미노출, 문서화된 종료 코드). warning은 기록 후 진행(현행 유지).
  **구현은 Node delivery 이식(N2)에 내장**하며, 과도기 Python delivery는 수정하지 않는다(이중 구현 방지 — D92 ③).
  과도기에는 Skill 절차의 "error 보완 후 렌더" 규칙(SKILL.md Workflow 2단계)과 검증 프로토콜의 판정 기준
  (`docs/blackbox_protocol.md` §3-(a): preflight error 0이어야 PASS)이 이 구간을 커버한다.

## 내부/검증용 실행 (개발·CI 참고, 사용자 흐름 아님)

```
python src/renderers/kssb_report_delivery.py <findings.json> -o <out>   # findings→preflight→대표 문서→사용자 요약(stdout)
python src/renderers/kssb_report_delivery.py <findings.json> -o <out> --debug   # 내부 상세는 stderr로 분리
python src/validators/kssb_findings_validator.py <findings.json>   # detect-only, error 시 종료코드 1 (reference)
node   src/validators/kssb_findings_validator.cjs <findings.json>  # Node 이식(N1 — 동일 규칙·exit, parity 테스트로 대조)
python src/renderers/kssb_report_renderer.py <findings.json> -o <out>   # DOCX + HTML + Markdown fallback
```

재사용 점검 스크립트(표준 라이브러리, 출력은 repo 밖 임시 폴더):

```
python tests/test_findings_validator.py   # 검증기 점검
python tests/smoke_test_renderer.py       # 렌더러 스모크
python tests/test_delivery_wiring.py      # 전달 배선 end-to-end 스모크
```

## 산출물 정책

- 기본 산출물: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(fallback `.html`, `.md`) 대표 문서 1개(우선순위 DOCX→HTML→Markdown).
- JSON/CSV/manifest/`_검토근거` 폴더는 기본 산출물이 아니다(내부 개발/검증용 가능성만).
- 생성 문서는 커밋 대상이 아니며 findings에서 결정적으로 재생성 가능하다(`.gitignore` 산출물 제외).
- plugin/cache/sandbox 내부 경로를 산출물·사용자 안내에 노출하지 않는다.
- 제출 패키징(포함/제외 분류·원본 로그 방식·샘플 산출물 위치·최종 preflight)은 `docs/submission_packaging_policy.md` 참조.

## 경계

- 본 도구는 삼일회계법인의 공식 제품·내부 도구가 아니며, 감사·인증·준수 판단을 대체하지 않는다.
- 확인 불가 항목을 미공시로 단정하지 않는다. 최종 판단은 컨설턴트가 수행한다.
- quote 인용 실재성(입력 원문 일치)은 자동 검증 범위 밖이며 사람 검수 대상이다.
- **core 워크플로우는 문서 변환·OCR을 자동 실행하지 않는다.** 문서 구조 판독과 스캔/혼합 PDF의 문자 인식(OCR)은
  core 밖 **승인 기반 로컬 보조 runner**(`src/intake/runners/` — 자동 실행 없음, 최소 경로)로만 제공되며,
  그 산출물은 근거 재료/검수용 보조 재료로만 합류한다. Hook/MCP·submission.zip은 현재 범위에 포함하지 않는다.
