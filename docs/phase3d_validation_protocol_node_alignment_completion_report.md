# Phase 3-D — 검증 프로토콜 Node 정렬 + trace manifest evidence 규약 문서화 Completion Report

> **성격**: docs-only 작업 완료 보고다. Phase 3-A audit(`docs/planning/phase3a_validation_coverage_audit.md`)와
> Codex review(`docs/reviews/codex_phase3a_validation_coverage_audit_review.md` — **PASS**, required fixes 없음,
> "3-D entry: Ready")를 근거로 착수했다. Claude Code는 구현·검증·보고만 하며 PASS/FAIL 최종 판정은
> **후속 Codex Phase 3-D review**가 수행한다.
> 시작 HEAD: `c02e739`(origin/main fast-forward 동기 — 아래 §0) / 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재).

## 0. 시작 시 HEAD 상태 (투명 기록)

작업 시작 HEAD 확인 중 로컬(`8a82a89`)이 origin/main보다 **3 커밋 뒤**임을 발견했다(0 ahead / 3 behind,
working tree clean). 세 커밋은 전부 사용자/ChatGPT의 **운영 원칙·coordination 문서 갱신**이었다:
`c7ab670`(tighten agent coordination), `833ed3d`(refine operating principles for autonomous reviews),
`c02e739`(align ChatGPT coordination workflow). 충돌 없는 **fast-forward**로 `c02e739`까지 동기화한 뒤,
갱신된 `AGENTS.md`·`docs/operating_principles.md`를 다시 읽고 역할·경계에 충돌이 없음을 확인하고 진행했다.

## 1. 변경 파일

| 구분 | 파일 |
|---|---|
| **프로토콜 갱신** | `docs/blackbox_protocol.md` — 후반부 실행 Node 정렬(§1·§2 step5/8·§5) + trace manifest evidence(§4) + quote 실재성 opt-in 경계(§3-b) |
| **경계 문서(최소)** | `docs/workflow_usage.md` — quote 실재성 opt-in 보조 점검 경계 한 문단(§경계) |
| **완료 보고서(신규)** | 본 문서 |
| **무변경** | 코드·테스트·schema·package·generated artifact 전부. `current_status.md`·`decision_log.md`(§6 참조) |

## 2. 목표 1 — 후반부 실행 Node 정렬

Phase 2 core Node closure(D95)로 blackbox_protocol §5가 예고했던 "Node 이식 완료 시 §1 Python 항목·§2 `<PY>`
명령을 Node로 갱신" 조건이 성립했다. 이에 맞춰:

- **§1 실행 환경**: `Node`를 runner뿐 아니라 validator·DEI·delivery·renderer core의 **런타임 경로**로 명시.
  `Python`은 "과도기"에서 **golden parity reference / 과거 2N-5R evidence 맥락**으로 재프레이밍(제거·deprecation
  아님 — D93③, Python CLI 회귀 아님). reference 실행 시 절대경로·UTF-8 규약 유지.
- **§2 step 5(DEI 정규화)**: 런타임 `node src/intake/dei_producer.cjs …`를 우선 명령으로, Python은 golden
  parity 교차확인용 reference로 병기.
- **§2 step 8(preflight+delivery)**: 런타임 `node src/renderers/kssb_report_delivery.cjs … [--manifest]`를 우선
  명령으로. **D94 hard stop**(preflight error ≥ 1 → 산출물 0·out-dir 미생성·exit 4)을 명시. Python reference는
  D94 미구현(error 시에도 생성 계속하는 과거 동작)이라 **판정 근거로 삼지 않는다**고 명기.
- **§5 한계**: 과도기 문구를 "런타임 = Node core(D95), Python은 reference로 병기" 완료 상태로 갱신.

step 3·4(document_intake_router·pdf_ocr_runner)는 이미 Node(`.cjs`) 명령이라 변경 없음.

## 3. 목표 2 — trace manifest를 delivery-segment evidence로 문서화

§4에 **(선택) trace manifest — delivery-segment evidence** 소절 신설:

- `--manifest`(step 8) 실행 시 성공 delivery가 `run_manifest.json`으로 후반부 evidence를 **결정적** 집계:
  findings **canonical-JSON hash** · preflight counts(code/severity 요약) · 대표 산출물 basename/bytes/sha256 ·
  self-hash. 수동 집계(산출물 hash·preflight counts)를 이 파일로 대체 가능.
- **경계(반드시 유지)**:
  - opt-in·기본 off·내부 provenance artifact(대표 문서/기본 산출물 아님, repo 미커밋 `.gitignore` 방어,
    판정·품질·감사/인증류·경로·계정명·stack·timestamp 없음).
  - **exit 0 단독으로 capture 성공 단정 금지** → 파일 존재·`deliver()` 반환(`manifest`/`manifest_error`)·
    `--debug`로 명시 확인(**OBS-01**).
  - **D94 hard stop 시 미생성**(산출물 0 불변), 생성 실패는 delivery 성공을 깨지 않고 `manifest_error`만 남김.
  - **delivery-segment 한정** — 상류 intake/OCR/runner **end-to-end provenance는 v1 범위 밖**·후속 별도 사이클
    후보(**OBS-02**). 상류 provenance는 종전대로 각 산출물 hash·runner evidence로 기록.
- §5 한계에도 delivery-segment 한정·OBS-01/02 요약을 한 줄 추가.

## 4. 목표 3 — quote 실재성 opt-in 경계 문서 보강

Phase 3-A audit §3-①이 지목한 **문서-코드 정합 갭**(workflow_usage 경계 서술이 opt-in `_checkQuoteReality`를
미언급)을 해소:

- `docs/workflow_usage.md` §경계의 quote 실재성 항목에, validator의 **additive·기본 off** `--source-text` 보조
  점검이 원문 제공 시 공백정규화 substring 미발견을 **warning**으로 감지하지만 **opt-in·warning 성격이며 사람
  검수·독립 표본 확인을 대체하지 않는다**(원문 미제공 시 미실행·exact substring only·발견≠맥락정합·미발견≠환각)를
  한 문단으로 명시.
- `docs/blackbox_protocol.md` §3-(b)에도 이 opt-in 점검이 Skill 자기점검(§9)과 함께 **사람 표본 확인을 대체하지
  않는다**는 절을 추가.
- **정규화 강화·intake 자동 배선·validator 구현 변경은 하지 않았다**(3-B/후속 사이클 대상 — audit §3-①·경계 준수).

## 5. 경계 준수 확인

- **docs-only**: 코드·테스트·schema·package·generated artifact diff 0.
- **재판정 없음**: 문서 정렬만 — validator/renderer 동작·판정 로직 무변경.
- **trace manifest = delivery-segment 한정** 유지, **OBS-01/OBS-02** 문서 반영.
- **Python reference·N5 aux 한계 유지**(D93). Python을 부정·제거하지 않고 reference로 병기(회귀 아님).
- **미착수**: 3-B validator 규칙 구현, 3-C 검수 표/렌더러 변경, quote 정규화 강화, intake/OCR provenance 편승,
  hook/dispatcher/MCP/registry, submission packaging — 전부 손대지 않음.
- **no-overclaim**: 제품 완성·2N-5 전체 통과·OCR complete·provider finalization·submission readiness 주장 없음.
  사람 검수는 최종 권한으로 유지.

## 6. current_status / decision_log 처리

이번 커밋에서 **미수정**. 프로젝트 관례상 sub-cycle closure 기록(current_status bullet·decision)은 **해당
sub-cycle의 Codex review 이후 별도 결정**으로 처리한다(trace manifest = D96, Phase 3-A audit 동일 패턴 —
둘 다 작업 커밋에서 current_status/decision_log 미변경). Phase 3-D도 동일하게 **후속 Codex review PASS 후
closure 기록**을 별도로 남기는 것을 권고한다(조기 closure·과장 방지).

## 7. 자체 검증

- `git diff --check` clean(공백/충돌 마커 0 — CRLF 정규화 경고는 whitespace 오류 아님).
- 변경 파일 = `docs/blackbox_protocol.md`·`docs/workflow_usage.md`·본 보고서(3건, 전부 docs).
- 코드/test/schema/package/generated artifact 변경 0(오염 스캔).
- blackbox Node 명령이 현재 Node core closure(D95)와 정합(dei_producer.cjs·kssb_report_delivery.cjs 실재 경로).
- trace manifest evidence 서술이 **delivery-segment 한정**으로 남아 있음, **OBS-01·OBS-02** 반영.
- Python은 reference로 병기(부정·제거·CLI 회귀 아님).

PASS/FAIL 판정은 하지 않는다(Codex 몫).

## 8. 다음 단계

- **Codex Phase 3-D review**(Node 정렬 정확성·manifest evidence 경계·quote-reality 문서 정합·no-overclaim 대조).
- review PASS 후: Phase 3-D closure 기록(current_status/decision_log) + Phase 3 다음 단계(3-C docs-first cleanup —
  audit §7 및 P3A-OBS-01의 report_template top-note 드리프트 포함)로 진행 판단.
