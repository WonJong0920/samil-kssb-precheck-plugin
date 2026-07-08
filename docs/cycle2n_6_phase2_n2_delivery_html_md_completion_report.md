# Cycle 2N-6 Phase 2 N2 — Node Delivery + HTML/Markdown Renderer 이식 Completion Report

> **성격**: D92 Phase 2의 **N2만** 수행한 완료 보고다. Codex N1 review **PASS**("N2 entry: Ready")
> 후 착수했다. Claude Code는 구현·검증·보고만 수행하며 **PASS/FAIL 최종 판정은 Codex N2 review가
> 수행한다.** N3(DEI)/N4(DOCX)/N5(aux) 미착수. 제품 완성·OCR complete·provider finalization·
> 2N-5 전체 완료 선언이 아니다.
>
> 시작 HEAD: `dfd1af9c8592febaa5add07ecab65faf5d7cfa4b` (pull 후 최신 원격 main 일치·clean)
> 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재)

## 1. 구현 위치 / 변경 파일

| 구분 | 파일 |
|---|---|
| **Node renderer (신규)** | `src/renderers/kssb_report_renderer.cjs` — HTML/Markdown만(DOCX 없음) |
| **Node delivery (신규)** | `src/renderers/kssb_report_delivery.cjs` — N1 validator preflight + **D94 hard stop** |
| **Node 테스트 (신규)** | `tests/test_delivery_node.test.cjs` — **18 tests** |
| **parity/구조 테스트 (신규)** | `tests/test_delivery_node_parity.test.cjs` — **6 tests** |
| 문서 (최소 갱신) | `src/renderers/README.md` · `docs/workflow_usage.md` · `docs/current_status.md` · 본 보고서 |
| **무변경** | `kssb_report_delivery.py`·`kssb_report_renderer.py`(**transitional reference 보존** — diff 0) · validator(.py/.cjs) · schema · Skill · runner · 기존 테스트 전부 |

decision_log 무변경(신규 결정 없음 — D92/D94의 N2 집행).

## 2. 구현 흐름 (목표 상태 달성)

```
findings.json
→ Node validator preflight (src/validators/kssb_findings_validator.cjs — N1, 의미 무변경 소비)
→ error ≥ 1 → D94 hard stop (산출물 0·out-dir 미생성·sanitized 안내·exit 4)
→ error == 0 → Node renderer: HTML + Markdown 생성 (primary=HTML)
→ 사용자-facing 요약 (경로·raw 이슈·stack 미노출)
```

## 3. CLI / API 사용법

```bash
node src/renderers/kssb_report_delivery.cjs <findings.json> -o <out_dir> [--base-name <이름>] [--debug]
# -o | --out | --out-dir 동일. exit: 0=성공 / 2=findings 로드 실패 / 3=전달 불가(RenderError)
# / 4=preflight hard stop(D94) / 1=예기치 못한 내부 실패(통제된 안내 — stack/경로 미노출)
```

```js
const D = require("src/renderers/kssb_report_delivery.cjs");
const result = D.deliver(findings, outDir, { baseName });
// result = { hard_stop, user_summary(안전), outputs, preflight:{counts,issues}(내부), internal_notes(내부) }
const R = require("src/renderers/kssb_report_renderer.cjs");
const out = R.renderReport(findings, outDir);  // { html, markdown, primary, primary_format:"html" }
```

- 산출 파일명은 Python과 동일 규칙: `<보고서명>_KSSB_공시근거_사전검토보고서.{html,md}`
  (base = `generated_for`→`report_title` sanitize — parity 테스트로 파일명 집합 동일 확인).

## 4. D94 hard stop 구현 방식

- **판정 기준**: Node validator 기본 실행 결과의 **severity=error 개수 ≥ 1** →
  renderer 호출 전 중단. **어떤 보고서 파일도 만들지 않으며 out-dir 자체를 생성하지 않는다**(테스트로 강제).
- **error/warning/info 구분**: `schema.optional_skipped` **info는 error가 아니다** — 생성 진행.
  warning(예: 중복 인용)도 생성을 막지 않고 요약에 **건수만** 표기 + "내부 점검 기록 확인 권장" 안내.
- **사용자-facing sanitization(N1 carry-forward C2N6-N1-OBS-01 이행)**: hard stop 안내는
  error 건수 + "findings 보완 후 재생성" 한국어 문구만 — **raw 이슈 code/location(`kssb_areas[...]`)·
  로컬 경로·stack trace·내부 info 코드 미노출**(테스트의 공통 누출 assert로 강제).
  상세 이슈는 프로그램 반환값(`preflight.issues`)과 `--debug` stderr에만.
- **성공 요약 sanitization**: Python delivery와 동일 원칙 — 표시 경로는 repo 하위면 상대경로,
  밖이면 파일명만 + `[REDACTED_LOCAL_PATH]` 2차 방어. 형식 안내는 정직하게
  "이 실행 경로의 산출 형식: HTML → Markdown" + "DOCX 형식은 이 실행 경로에서 생성되지 않습니다"
  (DOCX placeholder·지원 예정 문구 없음).
- **예기치 못한 실패**: CLI 최상위에서 통제된 한국어 안내 + exit 1(stack/경로 미노출,
  `--debug` 시에만 stderr 상세) — R1 통제된 실패 원칙과 정합(Python reference보다 보수적, 기능 동일).
- **Python delivery hard-stop patch 없음**: Python은 현행 그대로(경고 후 생성 계속) — parity 테스트가
  이 **의도된 차이를 명시적으로 기록**한다(divergence 은폐 없음).

## 5. Node validator consumption 방식

- `require`로 N1 `kssb_findings_validator.cjs`의 `validateFindings(findings)`를 기본 옵션으로 호출
  (validator 의미·규칙 무변경 — quote check 등 additive 옵션 미사용).
- counts(error/warning/info)를 산정해 D94 분기 + 요약 건수 표기에만 사용. 이슈 원문은 내부 반환값으로만.

## 6. HTML/Markdown renderer

- Python `render_html`/`render_markdown`의 **충실 이식** — 섹션 구성(표지·고지 → 1.검토 개요 →
  2.상태 요약 → 3.영역별 결과·근거 → 4.고객 질문·요청자료 → 5.보완 권고 → 6.한계·사람 검수)·
  표기 문구·escape 규칙(html.escape 동등: `&<>"'`)·정렬(영역=enum 순·질문=우선순위 순 stable)·
  파일명 sanitize·`str(True)` 표기까지 동일. `_validateRenderable` → RenderError(안전 오류) 동일.
- **재판정 없음**: judgment_code/label 그대로 소비, evidence/questions/recommendations/권고 생성 0
  (테스트: 항목·근거 앵커·질문 수 입력과 동일, 라벨 원문 보존).
- **DOCX 미구현**(N4 대상): 결과 객체에 docx 키 자체를 만들지 않고, 산출 폴더에 .docx가 생기지 않음을
  테스트로 강제(placeholder 없음 — 오해 방지).

## 7. Python reference와의 비교 (parity/구조 테스트)

`tests/test_delivery_node_parity.test.cjs` (Python 미탐지 시 명시적 skip — 이번 실행 **skip 0**,
Python 3.14.5 실측 대조):

- **renderer 전문 대조**: 동일 findings(공식 예시 + 선택 필드 제거·우선순위 변형)에 대해 Python
  `--html-only` 산출 HTML/MD와 Node 산출을 **개행 정규화(CRLF↔LF)만 적용 후 전문 일치** 확인 +
  산출 파일명 집합 동일. (요구된 구조 비교보다 강한 기준 — 이식이 문구 단위로 동일함을 증명.)
- **구조 불변식**(전문 대조가 미래에 완화되어도 경계 유지): 섹션 헤딩 집합·항목 수(`####`)·
  근거 앵커 수(인용 라인)·질문 표 행 수·judgment label 목록 동일.
- **delivery 대조**: 정상 findings — 양쪽 exit 0·"error 0건" 요약·HTML/MD 파일명 동일.
- **D94 의도된 차이의 명시 기록**: error findings — Python(reference)은 exit 0 + 생성 계속(현행 동작
  그대로임을 검증), Node는 exit 4 + 산출물 0(D94). 어느 쪽도 은폐하지 않는다.
- 개행 정규화 외 normalize 없음(검증 강도 저하 없음).

## 8. no-overclaim / leak scan 결과

- **생성 산출물(HTML/MD) 스캔**(테스트로 상시 강제): `OCR 지원 완료`/`support complete`/
  `provider finalization`/`product complete`/provider명(kordoc·tesseract)/`tool-cache`/`node_modules`/
  `AppData`/`Traceback`/`RunnerError`/내부 사이클 용어(2N-5·2N-6·Cycle 2) — **0건**.
  감사/인증/준수 계열 표현은 **negation 경계 문맥 라인에서만** 존재(예: "감사·인증·준수 판단을
  대체하지 않습니다", "KSSB 준수 확정·감사의견·인증이 아니다" — findings 원문 고지·한계 문구).
  오탐 방지: 해당 계열이 나오는 라인에 negation 표지가 있는지로 판정.
- **사용자-facing 출력(stdout/stderr) 스캔**(테스트로 상시 강제): 사용자 홈 경로·AppData·임시 폴더
  절대경로·stack(`at `)·raw 이슈 location(`kssb_areas[`)·내부 info 코드 — **0건**.

## 9. 검증 결과

| 항목 | 결과 |
|---|---|
| `node --test tests/test_delivery_node.test.cjs` | **18/18 PASS** |
| `node --test tests/test_delivery_node_parity.test.cjs` | **6/6 PASS (skip 0 — Python 3.14.5 실측 대조)** |
| N1 회귀: validator node 43 · parity 35 | **전부 PASS** |
| `<PY>` validator 30 · delivery wiring 34 · renderer smoke 22 (reference 불변 확인) | **전부 PASS** |
| Node 회귀: router 21 · hwp 39 · OCR 29 · write-failure 8 · bootstrap 11 | **전부 PASS** |
| `git diff --check` | clean |
| 오염 스캔(node_modules/package·lock/generated intake·OCR·DEI·findings·report/traineddata/zip/submission.zip/repo tool-cache/샘플 원본) | **0건** |

실행하지 않은 테스트: Python intake(dei) 83·runner 49·nethook 29·aux 26·OCR parity 11 —
이번 diff가 해당 표면(intake/runner/nethook/aux)을 건드리지 않기 때문(영향 없음으로 판단, 사유 기록).
실 샘플 문서 실행·OCR/HWP runner 실행 없음(N2 범위 밖 — 산출물 검증은 공식 예시 findings 기반).

## 10. 경계 준수

- **Python delivery/renderer reference 보존**: `.py` 2종 diff 0, Python 테스트(34·22) green 유지.
  Python hard-stop patch 없음(D92 ③·D94 정책 그대로).
- **validator 의미 무변경 소비**: N1 구현 diff 0, 기본 옵션 호출만.
- **재판정 없음·산출물 정책 준수**: 판정/근거/질문/권고 생성 0(테스트 강제), DOCX 미생성(N4),
  N3/N5 미착수(dei/aux diff 0).
- **의존성 0**: Node 내장 모듈만. package.json/lock/node_modules 미추가.
- generated artifact/샘플 원본 repo 미유입(테스트는 임시 폴더 생성·정리).
- 감사·인증·준수 확정·제품 완성 표현 생성/암시 없음 · Claude 최종 판정 없음.

## 11. Required Follow-up / Carry-forward

- **Codex Phase 2 N2 review** → PASS 시 N3(dei_producer 이식) 착수 판단.
- N4(DOCX)에서 Node renderer에 DOCX가 추가되면 delivery의 형식 안내 문구("HTML → Markdown")와
  primary 선정 로직을 함께 갱신할 것(현재 문구는 정직 표기).
- workflow_usage·quickstart의 "대표 문서 우선순위 DOCX→HTML→MD" 서술은 Python 경로 기준으로 유지 중 —
  Node 경로가 사용자 기본 경로로 승격되는 시점(N4 이후)에 표면 일괄 정렬 권장(이번엔 최소 갱신만).
- 미실행 스위트(intake/runner/nethook/aux)는 N3 진입 시 해당 표면과 함께 재실행.
