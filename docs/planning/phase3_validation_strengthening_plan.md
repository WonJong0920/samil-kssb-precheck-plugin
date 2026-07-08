# Phase 3 — Validation Strengthening 계획 (planning, docs-only)

> **성격**: 이 문서는 **계획만** 정의한다. 코드·테스트·schema·package·generated artifact를 바꾸지 않는다.
> 각 실행 단계는 별도 사이클로 착수하며 **Codex review 게이트**를 유지한다.
> 시작 기준: Cycle C trace manifest 구현·Codex implementation review·closure 완료(**D96**), HEAD `fd07087` clean.
> Source-of-truth: `docs/current_status.md`, `docs/decision_log.md`(D92·D93·D94·D95·D96),
> `docs/reviews/codex_cycle2n_6_trace_manifest_implementation_review.md`, `docs/blackbox_protocol.md`,
> `docs/findings_schema_contract.md`, `src/validators/kssb_findings_validator.cjs`,
> `src/skills/samil-kssb-precheck/completion_checklist.md`.

## 1. Phase 3의 목적

**사람 검수 전(前) 결정적 검증 표면을 강화**한다. 구조적·계약적·provenance 결함이 컨설턴트 검수 단계에
도달하기 전에 detect-only로 더 많이 잡히게 하고, 검수자가 "무엇을 왜 확인해야 하는지"를 더 명확히 보게
한다. **판단 자동화가 아니다** — validator는 detect-only, renderer는 재판정 없음, 최종 판단은 사람이 유지한다.

Phase 3은 **제품 완성·submission readiness·OCR complete·provider finalization이 아니다.** 검수에 도달하는
결함을 줄일 뿐 사람 검수를 대체하지 않는다(강화 ≠ 대체).

## 2. 검증 강화 대상 (repo 상태 기반 갭)

repo를 읽어 확인한 현재 검증 표면과 격차:

1. **Detect-only validator 커버리지 격차** — 런타임 `src/validators/kssb_findings_validator.cjs`는
   structure·source-mode·area·items·quote reuse·prohibited/paths·quote reality(opt-in)를 감지한다.
   `docs/findings_schema_contract.md`의 "수동 검증 규칙" 중 일부(예: 인용 실재성 강화 여지, 계약상
   조건부 규칙의 자동 감지 범위)가 detect-only로 안전하게 승격 가능한지 미정리 상태다.
2. **검수 표(human-review surface) 드리프트·약함** — `src/skills/samil-kssb-precheck/completion_checklist.md`
   와 `report_template.md` §7이 아직 **Python 런타임 경로**(`kssb_findings_validator.py`·
   `kssb_report_renderer.py`)를 참조한다(Phase 2 Node closure = D95와 드리프트). 또한 항목별
   "사람이 무엇을 왜 검수해야 하는지"(검수 우선순위·근거)를 표면화하는 구조가 약하다.
3. **검증 프로토콜의 Node 드리프트** — `docs/blackbox_protocol.md` §1/§2가 과도기 `<PY>` 명령 기준이며,
   문서 스스로 "Node core 이식 완료 시 Node 명령으로 갱신"을 §5에 예고한다(D95로 그 조건 성립).
   또한 trace manifest(D96)를 **delivery-segment 한정** 결정적 검증 evidence로 쓸 여지가 있으나
   OBS-01(“exit 0 ≠ manifest capture 성공”) 처리 규약이 프로토콜에 반영되지 않았다.
4. **quote 실재성 opt-in 점검의 문서 공백** — `_checkQuoteReality`(additive·기본 off·`--source-text`
   제공 시만)가 코드에는 있으나 `docs/workflow_usage.md` 경계 서술은 이를 언급하지 않는다(문서-코드 정합 갭).

## 3. 작업 단위 / 단계 구분

Phase 3을 4개 sub-cycle로 분해한다. **3-A(audit)를 먼저** 수행해 이후 구현 단계의 범위·안전성을 확정한다.

### Phase 3-A — Validation coverage audit & 검수 표 gap map (**docs-only**)
- `findings_schema_contract.md`의 수동 검증 규칙 ↔ 현재 validator 자동 감지 규칙을 **대조표**로 정리하고,
  각 격차가 **detect-only로 안전하게 자동화 가능한지**(재판정·findings 변조 없이) 판정한다.
- 검수 표(completion_checklist·report_template §7)의 (i) 런타임 경로 드리프트, (ii) 검수 우선순위 표면화
  격차를 목록화한다.
- blackbox_protocol의 Node 드리프트 지점과 manifest-as-evidence 적용 범위(delivery-segment 한정)를 목록화한다.
- **미결 결정 명시**: 새 detect-only 규칙을 **Node-only additive(문서화된 divergence — quote reality 선례)**
  로 둘지 **Python reference에도 미러링**할지(D93③ golden parity와의 관계)를 open question으로 남긴다.

### Phase 3-B — Detect-only validator 커버리지 강화 (**구현**)
- 3-A audit에서 "안전하게 자동화 가능"으로 판정된 detect-only 규칙만 `kssb_findings_validator.cjs`에 추가.
- 3-A에서 확정한 parity 방침(Node-only additive vs. Python 미러링)을 따른다.
- 기존 이슈 코드/severity/location 규약·검출 순서·detect-only 경계 유지.

### Phase 3-C — 검수 표 / human-review surface 강화 (**docs 우선, 렌더러 확장은 조건부**)
- (docs) completion_checklist·report_template §7의 런타임 참조를 **Node 또는 런타임-중립**으로 정렬(D95 정합).
- (조건부 구현) 보고서 human-review 절에 **검수 우선순위 신호**(항목별 "사람 확인 필요 사유" — conflict·
  not_verifiable·partial·quote 미발견 warning과 연동)를 표면화. 렌더러를 건드리면 재판정 금지·parity를
  준수하고 단계를 분리한다(문서 정렬 먼저, 렌더러 확장은 별도 판단).

### Phase 3-D — 검증 프로토콜 Node 정렬 + manifest evidence 규약 (**docs-only**)
- blackbox_protocol §1/§2의 `<PY>` 경로를 Node 런타임으로 갱신(D95 — Python은 reference로 병기).
- trace manifest를 **delivery-segment 한정** 결정적 검증 evidence로 편입하고, OBS-01 규약(파일 존재·API
  반환·`--debug`로 상태 확인, exit 0 단독 판단 금지)을 명시. upstream end-to-end provenance는 범위 밖 유지.

## 4. 각 단계의 산출물

| 단계 | 산출물 | 유형 |
|---|---|---|
| 3-A | `docs/planning/phase3a_validation_coverage_audit.md`(대조표·격차·자동화 안전성 판정·open question) | docs-only |
| 3-B | `kssb_findings_validator.cjs` detect-only 규칙 추가 + Node 테스트(+택1: Python parity) + 완료 보고서 | 구현 |
| 3-C | completion_checklist·report_template 정렬(문서) / (조건부) 렌더러 검수 우선순위 + 테스트 + 완료 보고서 | docs + 조건부 구현 |
| 3-D | blackbox_protocol 갱신 + manifest evidence 규약 + 완료 보고서 | docs-only |

각 구현 단계는 완료 보고서를 `docs/`에 남긴다(운영 원칙 §2.1).

## 5. 구현 필요 단계 vs docs-only 단계

- **docs-only**: 3-A(audit), 3-D(프로토콜/evidence 규약), 3-C의 문서 정렬 부분.
- **구현(코드+테스트)**: 3-B(validator 규칙), 3-C의 렌더러 검수 우선순위(조건부 — 별도 판단으로 착수 여부 결정).
- 순서 권장: **3-A → (3-D 또는 3-B) → 3-C**. 3-A 없이 3-B/3-C 구현을 시작하지 않는다(맹목 구현 방지).

## 6. Codex review가 필요한 지점

- **각 sub-cycle 종료 시 Codex review**(운영 원칙 — Claude Code 작업 → Codex 독립 리뷰).
- 특히 게이트로 중요한 지점:
  - 3-A audit **PASS 전에는 3-B/3-C 구현을 착수하지 않는다**(자동화 안전성·parity 방침 승인 게이트).
  - 3-B validator 변경은 detect-only 경계·parity·검출 순서 회귀를 Codex가 대조.
  - 3-C가 렌더러를 건드리면 재판정 금지·parity를 Codex가 대조.

## 7. 하지 말아야 할 것 (경계)

- 이 계획 문서 작성 단계에서 **코드·테스트·schema·package·generated artifact를 수정하지 않는다.**
- **재판정 금지**: validator는 detect-only, renderer는 형식 변환만. 검수 표 강화가 자동 판정으로 번지지 않게 한다.
- **Cycle C trace manifest v1 = delivery-segment provenance 한정.** upstream intake/OCR/runner end-to-end
  provenance는 v1 범위 밖 — 필요 시 **후속 별도 사이클 후보**로만 다루고 이 v1 manifest에 편승시키지 않는다(OBS-02).
- **Python reference·N5 aux scanner 한계 유지**(D93②·③). N5 aux 생성은 Python reference 전용 유지.
- **hook/dispatcher로 확장하지 않는다.** manifest·validator를 registry/자동 배선으로 만들지 않는다.
- **submission packaging 작업으로 넘어가지 않는다.**
- **no-overclaim**: Phase 3은 검증 표면 강화일 뿐 — 제품 완성·2N-5 전체 통과·OCR complete·provider
  finalization·submission readiness가 아니다. 사람 검수는 최종 권한으로 유지된다.

## 8. 다음 작업자가 바로 착수할 첫 번째 권장 작업

**Phase 3-A — Validation coverage audit & 검수 표 gap map (docs-only)**를 착수한다.
`docs/planning/phase3a_validation_coverage_audit.md`에 (1) 계약 수동검증 규칙 ↔ validator 자동 규칙 대조표와
각 격차의 detect-only 자동화 안전성 판정, (2) 검수 표(completion_checklist·report_template §7) 런타임 드리프트·
검수 우선순위 격차, (3) blackbox_protocol Node 드리프트·manifest evidence 적용 범위, (4) parity 방침
open question을 정리한다. **구현 없음 — audit 후 Codex review로 3-B/3-C 착수 범위를 확정한다.**
