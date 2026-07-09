# B5-A — Plugin Bundle Self-Containment Remediation 완료 보고서

> **성격**: Claude Code 작업 완료 보고(자체 Preflight, PASS/FAIL 판정 아님). B5 review의 required fix
> **B5-MAJ-01**(번들 밖 계약 참조 자기완결) + **B5-MAJ-02**(설치 plugin-root 경로 정규화)를 좁게 처리했다.
> 근거: `docs/reviews/codex_b5_packaging_readiness_audit_scope_review.md`, `docs/planning/b5_packaging_readiness_prep_notes.md`.
> 시작 HEAD `ff59e64…` 이후(현재 브랜치 기준 최신). `marketplace.json` `source.path: ./src` → **설치 plugin root = `src/`**.

## 1. 번들 안으로 가져온 것 (B5-MAJ-01)

설치 Skill이 이름으로 참조하던 **계약·워크플로우 문서**가 번들 밖 repo-root `docs/`에 있어 설치 시 끊겼다(B3b 실사용에서 관측).
Skill 실행에 필요한 **최소 계약 2종을 번들 `src/` 안으로 복제**하고(경로 정규화·provenance 헤더 포함), Skill-facing 참조를 번들 사본으로 바꿨다.

| 번들 사본(신규) | 개발 기준 원본(유지) | 성격 |
|---|---|---|
| `src/schemas/findings_schema_contract.md` | `docs/findings_schema_contract.md` | findings 데이터 계약(수동 검증 규칙·모드↔라벨). 스키마 JSON과 co-locate |
| `src/skills/samil-kssb-precheck/workflow_usage.md` | `docs/workflow_usage.md` | 워크플로우/전달 계약(D94·사용자 요약 분리·산출물 정책) |

- **이동(move) 대신 복제(add)** 선택 이유: 두 계약 문서는 repo 전역 ~60개 개발/기록 문서에서 참조되어 이동 시 대량 파손. 허용범위 "필요한 최소 계약 문서의 `src/` 내 추가"와 정합.
  드리프트 방지를 위해 각 번들 사본 상단에 **provenance 헤더**(개발 원본 경로·동기화 책임)를 명시했다.
- **`docs/blackbox_protocol.md`는 번들하지 않음**: black-box **개발·검증 프로토콜**(PASS/FAIL 판정 기준·evidence 캡처)로 설치 Skill 실행에 불필요 → 참조를 **"저장소 전용·설치 실행 필수 아님"으로 명시**만 함.

## 2. repo-root `docs/` 참조가 어떻게 줄었는지

**설치 Skill 운영 문서**에서 Skill 실행에 필요한 `docs/` 계약 참조를 **번들 경로로 전환**:

- `docs/findings_schema_contract.md` → `schemas/findings_schema_contract.md`: SKILL.md(3곳)·report_template.md·completion_checklist.md·customer_question_rules.md·validators/README·renderers/README.
- `docs/workflow_usage.md` → `workflow_usage.md`(스킬 폴더 형제) 또는 `skills/samil-kssb-precheck/workflow_usage.md`: SKILL.md(2곳)·completion_checklist.md·renderers/README.

**남은 `docs/` 참조**(전부 설치 Skill 실행에 불필요 — 명시적으로 저장소 전용):
- `docs/blackbox_protocol.md`(evidence_mapping_rules §8·§9·workflow_usage) → **"개발·검증 프로토콜, 저장소 전용"** 명시.
- `docs/submission_packaging_policy.md`·`docs/cycle2n_6_phase2_closure_summary.md`(workflow_usage) → 제출/과거 closure 문서로 명시.
- 과거 기록성: `docs/cycle2c_renderer_completion_report.md`(renderers/README)·`docs/planning/cycle2l_1_…`(intake/README)·`docs/reference_review.md`·`docs/decision_log.md`(reference README) → **"과거 기록, 저장소 전용"** 명시.
- 번들 사본 2종의 provenance 헤더가 개발 원본 `docs/…`를 가리킴(의도된 표기).
- **런타임 코드 주석**(`src/validators/kssb_findings_validator.py`·`src/intake/dei_producer.py`)의 `docs/…` 주석은 **미수정**(B5-A "runtime code 미수정" 준수 — dev 주석).
- `prohibited_terms.md`의 "docs/README"는 경로가 아니라 "문서/README" 일반어(참조 아님).

## 3. `src/` path prefix 불일치 처리 (B5-MAJ-02)

설치 plugin root가 이미 `src/`이므로, **Skill 운영 지시 경로에서 `src/` 접두 제거**(plugin-root 기준). SKILL.md에 **경로 규약(설치 플러그인 기준)** 블록을 추가해 규칙을 못 박았다.

- **완전 정규화(설치 Skill 운영 surface)**: `SKILL.md`·`report_template.md`·`completion_checklist.md`·`evidence_mapping_rules.md`(및 `customer_question_rules.md`)의 `src/validators|renderers|schemas|intake/…` → `validators|renderers|schemas|intake/…`.
- **저장소 뷰로 명시 유지(개발자 README)**: `validators/README.md`·`renderers/README.md`·`intake/README.md`는 저장소 폴더를 설명하는 개발 문서(제목이 `# src/intake …` 등)이며 CLI 예시는 저장소 개발 트리 기준이다. 각 사용 절에 **"`src/…` = 저장소 개발 트리 기준, 설치 루트에서는 `src/` 접두 제거"** 경로 규약 주석을 달았다(B5 review가 README는 repo-root 링크 허용·후순위로 지정).
- 번들 `workflow_usage.md`의 개발 CLI 절도 동일 경로 규약 주석으로 저장소 기준임을 명시.
- **미수정**: `schemas/kssb_findings.schema.json`의 `$id`는 경로가 아니라 URL 식별자이며 schema 수정 금지 대상 → 유지. 런타임 코드(.cjs/.py) 내 `src/…` 주석 → 유지(코드 미수정).

## 4. 설치 plugin root 기준 남은 known limitation

- **계약 문서 이중 사본**(번들 `src/` ↔ 개발 `docs/`): 계약 변경 시 두 파일 동기화 필요. 각 사본 provenance 헤더에 동기화 책임을 명시했으나 자동 강제는 없음(향후 단일화 여부는 별도 결정 사항).
- **개발자 README·번들 workflow_usage 개발 CLI 절**의 `src/…` 예시는 저장소 뷰로 **명시만** 함(설치 루트에서는 접두 제거). Skill 운영 경로는 아니므로 실행 마찰은 없으나 표기는 저장소 기준으로 남음.
- 런타임 코드 주석의 `docs/…`·`src/…` 참조는 B5-A "코드 미수정" 원칙상 손대지 않음(dev 주석, 설치 실행 무영향).
- B5-MAJ-03(packaging_policy Node 정합)·B5-MIN(인코딩/PDF UX 등)은 **범위 밖**(B5-B/B5-C에서 처리).

## 5. 변경 파일 목록

**신규(번들 계약 사본)**:
- `src/schemas/findings_schema_contract.md`
- `src/skills/samil-kssb-precheck/workflow_usage.md`

**수정(설치 Skill 운영 문서·READMEs — 모두 markdown)**:
- `src/skills/samil-kssb-precheck/SKILL.md`(경로 규약 추가 + 참조/경로 정규화)
- `src/skills/samil-kssb-precheck/report_template.md`
- `src/skills/samil-kssb-precheck/completion_checklist.md`
- `src/skills/samil-kssb-precheck/customer_question_rules.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`
- `src/validators/README.md`
- `src/renderers/README.md`
- `src/intake/README.md`
- `src/reference/python_engine/README.md`

**미변경(범위 밖·금지)**: 런타임 코드(.cjs/.py)·스키마 JSON·plugin.json/marketplace.json·version·test·submission_packaging_policy·current_status/decision_log·생성 산출물.

## 6. 검증 명령과 결과

- `git grep -n "docs/" -- src`: Skill 운영 계약 참조는 번들 경로로 전환됨. **남은 `docs/` 참조는 전부 저장소 전용(개발·검증·과거 기록)으로 명시**되거나, 번들 사본 provenance 헤더·런타임 코드 주석·일반어("docs/README")임 — 설치 Skill 실행에 필요한 dangling 참조 0.
- `git grep -n "src/validators|renderers|schemas|intake" -- src`: **Skill 운영 4개 문서는 plugin-root로 완전 정규화**. 남은 `src/` 접두는 개발자 README CLI/제목(저장소 뷰·경로 규약 명시)·번들 개발 CLI 절(명시)·schema `$id` URL·런타임 코드 주석뿐.
- 번들 내부 참조 대상 존재 확인: `schemas/kssb_findings.schema.json`·`schemas/kssb_findings_example.json`·`skills/samil-kssb-precheck/{judgment_schema,report_template,workflow_usage}.md` 모두 존재 → **번들 내 dangling 0**.
- `git diff --check`: 공백 오류 0(LF→CRLF 정보성 경고만).
- `git status --short`: 변경 = markdown 9 수정 + 2 신규. **코드/스키마/패키지/매니페스트/테스트/생성 산출물 변경 0.**

## 7. status

- **Codex B5-A review 대기**. B5-A는 설치 번들 자기완결(B5-MAJ-01)·경로 정규화(B5-MAJ-02)에 한정했고,
  B5-B(Skill UX)·B5-C(packaging/README Node 정합)·B5-D(검증)·B5-Q(품질)는 후속 별도 사이클이다.
