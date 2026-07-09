# Phase 3-C closure 기록 + P3C-MIN-01 정리 + Phase 3-B scope plan Completion Report

> **성격**: docs-only 작업 완료 보고다. 한 세션에서 **A) Phase 3-C closure 기록**, **B) P3C-MIN-01 문구 polish**,
> **C) Phase 3-B 구현 scope 확정(구현 아님)**을 수행하고 **커밋 3개로 분리**했다. Claude Code는 구현·검증·보고만
> 하며 PASS/FAIL 최종 판정은 후속 **Codex review**가 수행한다. **Phase 3-B validator는 이번에 구현하지 않았다.**

## 0. HEAD

- 시작 HEAD: `d134d53`(Codex integrated review commit — origin/main 동기, clean, 0/0). 예상 밖 local 변경·
  충돌·untracked 없음. HEAD가 지정 review commit과 정확히 일치.
- Commit 1(Phase 3-C closure): `13affeb`.
- Commit 2(P3C-MIN-01 polish): `390f8c5`.
- 종료 HEAD: 본 커밋(Commit 3 — 채팅 보고에 SHA 기재).

## 1. 변경 파일

| 커밋 | 파일 | 성격 |
|---|---|---|
| **Commit 1** | `docs/current_status.md` | Phase 3-C closure bullet |
| **Commit 1** | `docs/decision_log.md` | **D98**(Phase 3-C closure + Phase 3-B scope 확정) |
| **Commit 2** | `src/skills/samil-kssb-precheck/completion_checklist.md` | "산출물" fallback 문구 polish(P3C-MIN-01) |
| **Commit 2** | `src/skills/samil-kssb-precheck/report_template.md` | "파일 명명 규칙" fallback 문구 polish(P3C-MIN-01) |
| **Commit 3** | `docs/planning/phase3b_validator_detect_only_scope_plan.md` | Phase 3-B scope plan(신규·구현 아님) |
| **Commit 3** | 본 완료 보고서 | 신규 |
| **무변경** | 코드·테스트·schema·package·generated artifact·renderer·validator·delivery 전부 | — |

## 2. A — Phase 3-C closure 기록 (Commit 1)

Codex integrated review(`docs/reviews/codex_phase3d_closure_phase3c_docs_first_cleanup_review.md`)는
**PASS·Critical/Major 0·required fixes 없음**(Minor P3C-MIN-01만 비차단). 이를 운영 문서에 closure로 기록:

- `docs/current_status.md`: "현재 Cycle" 최상단에 Phase 3-C closure bullet 추가 — review PASS·target `a86bd42`·
  review `d134d53`, closure 의미를 **정확히 제한**(runtime drift 문서 정렬 / human-review priority table 문서
  서식 / P3D-MIN-01 stale reference 정리 / **docs-only**), 다음 = Phase 3-B **scoped implementation cycle**.
- `docs/decision_log.md`: **D98** 추가 — closure 3항 + P3C-MIN-01 polish + Phase 3-B scope 확정, no-overclaim,
  다음 게이트(scope plan Codex review → PASS 후 구현).
- **no-overclaim**: 제품 완성·2N-5 전체 통과·OCR complete·provider finalization·submission readiness·**Phase
  3-B 구현 완료**로 표현하지 않음. renderer 검수 표 자동 생성 승인도 아님.

## 3. B — P3C-MIN-01 문구 polish (Commit 2)

Codex Minor P3C-MIN-01: 정렬된 워크플로우 문구는 DOCX→HTML→Markdown인데, **구 출력정책 bullet 2곳은 여전히
DOCX 또는 `.html`만** 언급(Markdown 누락). polish:

- `completion_checklist.md` "산출물": 대표 문서 파일명 규칙을 `.docx`(fallback `.html`/`.md`, 우선순위
  DOCX→HTML→Markdown, primary=DOCX)로 정렬. JSON/CSV/manifest 경계 유지 + trace manifest는 opt-in 내부
  provenance라는 단서 추가.
- `report_template.md` "파일 명명 규칙": fallback을 `.html` 또는 `.md`로, 우선순위·primary 명시. 대표 문서
  원칙·기본 산출물 아님 경계 유지 + trace manifest 단서.
- **범위 = 문구 polish만**. 렌더러/delivery 구현·정책 변경 없음. "대표 문서 · JSON/CSV/manifest 아님" 경계 불변.

## 4. C — Phase 3-B scope plan (Commit 3, 구현 아님)

`docs/planning/phase3b_validator_detect_only_scope_plan.md` 신설. §5-1~§5-7:

- **목적**: detect-only validation surface 강화(재판정·renderer·Skill/사람 검수 대체 금지).
- **v1 권장 rule(좁게, 2건 · Node-only additive · warning)**:
  - **R1** within-item 동일 quote 재사용 warning(기존 cross-item `duplicate_quote_reuse`와 분리).
  - **R2** `missing_info` 공백-only 원소 warning(P3A-OBS-02가 지목한 실제 미커버 표면 — 기존 nonempty 검사와
    중복 금지).
- **보류**: anchor `page_or_section` 부재 warning(noise 관리 필요).
- **후속 설계**: quote normalization 강화(BORDERLINE), 정량 수치결합/evidence gap(BORDERLINE — P3A-OBS-03:
  confirmed-only·item-specific, partial penalize 금지).
- **범위 밖(별도 사이클)**: quote-reality intake 자동 배선(OBS-02 upstream).
- **미채택(사람 유지)**: source-less number / 외부 지식 보강(§3-③ NOT-AUTOMATABLE).

### parity 방침 요약
- parity 스위트는 동일 fixture에서 Node↔Python **전체 이슈 목록(순서·severity·code·location·message) 대조**
  (read-only 확인). 따라서 v1 R1·R2는 **Node-only additive**(Python golden reference 동결 — D93③), 신규 warning이
  **기존 parity fixture·base example에서 미발화**해야 무회귀(구현 시 실측 확인 필요). 신규 warning fixture는 Node
  단위 테스트에만. error-severity 신규 계약 규칙을 추가할 때만 Python mirror 고려(별도 승인·review). v1은 error
  신규 없음 → mirror 불필요.

### 테스트 계획 요약(repo 실재 명령)
- `node --test tests/test_findings_validator_node.test.cjs`(신규 R1·R2 단위) ·
  `node --test tests/*.test.cjs`(전체 regression) ·
  `node --test tests/test_findings_validator_parity.test.cjs`(기존 fixture 일치 유지) ·
  `<PY> tests/test_findings_validator.py`(PYTHONUTF8=1 — Python 불변 확인).
- **확인 필요**로 남긴 것: 신규 warning이 기존 parity fixture와 충돌하는지 실측 및 충돌 시 의도된-divergence 기록
  방식(현 하네스에 Node-only allowlist 훅 존재 여부 미확인).

### 다음 단계 게이트
scope plan은 Codex review 대상 → **PASS 후에만** Phase 3-B 구현 프롬프트 작성 → 구현은 별도 commit·별도 review →
구현 후 closure도 review 이후 기록.

## 5. 선택한 v1 rule set / 보류 rule set (요약)

- **v1 채택(2건)**: R1 within-item 동일 quote 재사용 warning · R2 `missing_info` 공백-only 원소 warning.
- **보류(v1 아님)**: anchor `page_or_section` 부재 warning.
- **후속 설계**: quote normalization 강화 · 정량 수치결합/evidence gap warning.
- **범위 밖**: quote-reality intake 배선(upstream). **미채택(사람 유지)**: source-less number/외부 지식.

근거: audit는 계약 수동규칙 대부분이 이미 자동화됐고 **남은 격차가 좁다**고 판정 — v1을 좁은 SAFE additive
warning 2건으로 제한해 재판정·오탐 위험을 피한다.

## 6. parity 방침 요약(재기재)

v1 = Node-only additive warning(Python golden reference 미수정, D93③). 무회귀 조건 = 신규 warning이 기존
parity fixture·base example 미발화(구현 시 실측). Python mirror는 error-severity 신규 계약 규칙에만·별도 승인/review.

## 7. 수정하지 않은 범위 (경계 준수)

- 코드·테스트·schema·package·dependency·generated artifact **무변경**.
- **validator/renderer/delivery 구현 없음**, **Phase 3-B rule 실제 구현 없음**, quote normalization·source_text
  자동 배선·intake/OCR/runner 배선 없음, trace manifest v1 upstream 확장 없음.
- hook/dispatcher/MCP/registry·submission packaging 미착수.
- Node runtime / Python reference 경계 유지(Python 부정·제거·CLI 회귀 아님).

## 8. 자체 검증

- `git diff --check` clean(공백/충돌 마커 0 — CRLF 정규화 경고는 whitespace 오류 아님).
- Commit별 변경: C1 = current_status·decision_log(2), C2 = completion_checklist·report_template(2), C3 = scope
  plan·본 보고서(2). 전부 docs/skill-md.
- 코드/test/schema/package/generated artifact 변경 0(오염 스캔).
- Phase 3-C closure가 **Codex PASS 이후 기록**으로 표현됨(target/review commit·경로 기재).
- P3C-MIN-01이 fallback 문구로 정확히 정리됨(경계 불변).
- Phase 3-B scope plan이 **구현으로 넘어가지 않음**(계획·rule selection·parity·테스트·금지만).
- v1 rule set이 **과도하지 않음**(좁은 SAFE additive warning 2건). parity 방침 명확.
- no-overclaim 유지. 다음 단계 = Codex review 대기 명시.

PASS/FAIL 판정은 하지 않는다(Codex 몫).

## 9. 커밋 분리 사유

프롬프트 권장 3커밋 구조를 따랐다 — C1 순수 closure 기록(운영 문서), C2 P3C-MIN-01 문구 polish(스킬 문서),
C3 Phase 3-B scope plan(신규 계획)+보고서. 성격이 다른 세 작업을 리뷰/추적 단위로 분리해 Codex가 각각을 명확히
대조하도록 했다.

## 10. 다음 단계

- **Codex review**(Phase 3-C closure 정합 + P3C-MIN-01 polish + Phase 3-B scope plan 적정성·경계·parity 방침 대조).
- review PASS 후: Phase 3-B **scoped implementation cycle**(v1 R1·R2 구현·테스트·parity 실측 — 별도 승인·commit·
  review). 보류·후속 설계 항목은 각각 별도 진입.
