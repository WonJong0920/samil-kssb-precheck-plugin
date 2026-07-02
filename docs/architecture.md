# 아키텍처 (Architecture)

## 설계 원칙: Skill-first
사용자-facing 본체는 **Codex Skill**이다. 일반 사용자가 Python 설치·PATH·CLI 실행기를 의식하지 않도록 설계한다.
기존 1차 작업물의 Python 파이프라인은 **참고 자산**으로만 계승하고, 신규 repo의 실행 본체로 회귀시키지 않는다.

## 최종 선택 구조

```
Samil KSSB Precheck Plugin/
├── .agents/
│   └── plugins/
│       └── marketplace.json            # 로컬/Repo marketplace 정의 (source.path = ./src)
├── src/
│   ├── .codex-plugin/
│   │   └── plugin.json                 # Codex 플러그인 매니페스트 (plugin root = src/)
│   ├── skills/
│   │   └── samil-kssb-precheck/
│   │       ├── SKILL.md                # 스킬 작업 지침(반복 가능한 업무 절차)
│   │       ├── kssb_requirement_catalog.md   # KSSB 4대 영역 MVP 공시요구 카탈로그
│   │       ├── judgment_schema.md      # 판정 라벨(모드별) 정의·결정 순서
│   │       ├── evidence_mapping_rules.md      # 근거 앵커·정량 근거·상충 규칙
│   │       ├── customer_question_rules.md     # 고객 확인 질문 필드·생성 규칙
│   │       ├── report_template.md      # 보고서 섹션 구성·출력 정책
│   │       ├── completion_checklist.md # 보고서 초안 자기점검
│   │       └── prohibited_terms.md     # 금지/권장 표현
│   ├── schemas/                        # findings 데이터 계약(JSON Schema draft-07) + 예시
│   ├── validators/                     # 내부: findings detect-only preflight 검증기(표준 라이브러리)
│   ├── renderers/                      # 내부: findings → DOCX/HTML 형식 변환기(표준 라이브러리)
│   └── reference/
│       └── python_engine/
│           └── README.md               # 기존 Python 엔진 참고 문서(코드 미포함)
├── tests/                              # 재사용 검증기·렌더러 점검(표준 라이브러리)
├── docs/                               # 설계·검증·현황·의사결정·완료보고·workflow_usage
├── logs/
│   └── .gitkeep
└── README.md
```

## 구조 결정 근거
- **Codex plugin root는 `src/`**: 매니페스트 `src/.codex-plugin/plugin.json`이 plugin root를 `src/`로 정의한다
  (repo 루트가 아님). 기존 1차 작업물과 동일한 마켓플레이스 제출 관례를 따른다.
- **plugin.json은 보수적 최소 구성**: `name`/`version`/`description`/`skills` 4개 필드만 사용한다
  (기존 1차 작업물이 실제로 채택·검증한 형태). 불확실한 필드를 임의로 추가하지 않는다.
- **Skill-first 노출**: `src/skills/samil-kssb-precheck/`가 사용자-facing 본체다. 검증기·렌더러는 스킬 워크플로우가
  사용하는 **내부 구성요소**이며(표준 라이브러리, 외부 의존 0), 사용자가 직접 실행하는 Python CLI가 아니다.
  참고 파이프라인을 실행 본체로 회귀시키지 않는다.
- **후보 구조에서 변경한 점**: 권장 후보 구조를 거의 그대로 채택했다. 단
  `reference/python_engine/`에는 실제 Python 코드를 두지 않고 **참고 README만** 배치했다
  (코드 복사·이동 금지, 원본은 D 드라이브 read-only). 이는 Python CLI 회귀와 원본 수정 리스크를 함께 차단한다.

## plugin.json
- 핵심 필드: `name`(`samil-kssb-precheck`) · `version`(`0.1.0`) · `description`(영문 + 한국어 고지) · `skills`(`./skills/`).
- **install surface metadata(Cycle 2G 보강)**: `interface`(displayName·shortDescription·longDescription·developerName·category) ·
  `keywords` · `repository`. Codex 설치 화면에 보이는 이름·설명을 제어하며 제품 경계(삼일 비공식·감사/인증/준수 대체 아님)를 유지한다.
  Hook/MCP/apps/assets 경로는 추가하지 않는다(현 범위 밖).

## Codex marketplace / install readiness
- 로컬/Repo marketplace: `.agents/plugins/marketplace.json`(marketplace root = repo root). Public Plugin Directory 등록이 아니다.
- plugin root는 `src/`이므로 marketplace entry의 `source.path`는 `./src`로 plugin root를 가리킨다. `plugins[].name`은 manifest `name`과 정합.
- 상세·확인 절차: `docs/codex_install_readiness.md`. 실제 GUI 설치 확인은 별도 단계.

## Workflow 구성요소 (Skill → 검증 → 렌더 → 사람 검수)
사용자-facing 진입점은 스킬 하나이며, 스킬 절차가 아래 내부 단계를 잇는다. 상세·경계는 `docs/workflow_usage.md`.

1. **Skill(판단 엔진)** — source-bound 구조화 findings 생성(단일 source of truth). 계약: `src/schemas/kssb_findings.schema.json`.
2. **Validator(detect-only preflight 게이트)** — `src/validators/kssb_findings_validator.py`. findings를 재판정 없이 점검해
   구조적 위험을 감지·보고만 한다(findings 미변경). 표준 라이브러리, `jsonschema`는 있으면 선택 사용.
3. **Renderer(형식 변환기)** — `src/renderers/kssb_report_renderer.py`. 동일 findings를 재판정 없이 DOCX/HTML로 결정적 변환.
4. **사람 검수** — 산출물은 초안. 컨설턴트가 검수·수정·확정.

원칙: 단일 소스 파생, 재판정 금지, Skill-first(검증기·렌더러는 내부 구성요소), 사람 검수 경계 유지.

## 보고서 템플릿 구조
- 대표 산출물 1개 원칙: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(fallback `.html`).
- 섹션: 표지·고지 → 검토 개요 → 상태 요약 → 영역별 항목 결과·근거 → 고객 확인 질문·요청자료 → 보완 권고 → 한계·사람 검수.
- 상세는 `src/skills/samil-kssb-precheck/report_template.md`.

## reference/python_engine 의 역할
- 기존 결정적 파이프라인을 **설계 자산 출처**로 문서화(코드 미포함).
- 향후 결정적 검증 엔진이 필요할 때의 참고점. 위치: `D:\PrimeBell\AI_Projects\kssb-evidence-gap-auditor`(read-only).

## 기존 Python 중심 구조와의 차이
| 구분 | 기존 1차 작업물 | 신규 Cycle 1 |
|---|---|---|
| 사용자-facing 본체 | Python CLI(`run_audit.py`) | Codex Skill(`SKILL.md`) |
| 실행 의존성 | Python 3.10+ 런타임 | 외부 패키지 0(내부 검증기·렌더러는 Python 표준 라이브러리) |
| 기본 산출물 | DOCX + 검토근거 세트(JSON/CSV/MD) | 대표 문서 1개(DOCX, fallback HTML) |
| 판정 표기 | 내부 enum(SUPPORTED 등) | 한국어 라벨(근거 확인 등) |
| OCR/문서변환 | 파이프라인 포함 | Cycle 1 미포함 |

## 사용자-facing 산출물 1개 원칙
- 기본 사용자 흐름에서 대표 문서 1개만 산출물로 한다.
- JSON/CSV/manifest/`_검토근거` 폴더는 기본 산출물이 아니며, 내부 개발/검증/debug mode용 가능성만 열어둔다.
- 사용자 안내에 plugin/cache/sandbox 내부 경로를 노출하지 않는다.
