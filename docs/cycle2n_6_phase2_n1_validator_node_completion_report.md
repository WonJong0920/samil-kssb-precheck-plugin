# Cycle 2N-6 Phase 2 N1 — Node Validator 이식 Completion Report

> **성격**: D92(C안 단독 — core Node 이식) Phase 2의 **N1(validator)만** 수행한 완료 보고다.
> 2N-5R evidence review **PASS**("Phase 2 entry: Ready") 후 착수했다. Claude Code는 구현·검증·보고만
> 수행하며 **PASS/FAIL 최종 판정은 Codex N1 review가 수행한다.** N2/N3/N4/N5 미착수.
>
> 시작 HEAD: `f40962b82a2b10f597c1f9f042e814726844b434` (pull 후 최신 원격 main 일치·clean)
> 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재)

## 1. 구현 위치 / 변경 파일

| 구분 | 파일 |
|---|---|
| **Node validator (신규)** | `src/validators/kssb_findings_validator.cjs` |
| **Node 전용 테스트 (신규)** | `tests/test_findings_validator_node.test.cjs` — **43 tests** |
| **parity 테스트 (신규)** | `tests/test_findings_validator_parity.test.cjs` — **35 tests** |
| 문서 (최소 갱신) | `src/validators/README.md` · `docs/workflow_usage.md` · `docs/current_status.md` · 본 보고서 |
| **무변경** | `src/validators/kssb_findings_validator.py`(**Python reference 보존** — diff 0) · `tests/test_findings_validator.py`(diff 0) · schema/renderer/delivery/dei/runner/Skill 전부 |

decision_log 무변경(신규 결정 없음 — D92 계획의 N1 집행. 방식 A 선택은 계획이 위임한 구현 판단으로 본 보고서에 기록).

## 2. 이식 내용 (Python reference 기준 충실 이식)

프롬프트의 최소 이식 대상 16개 전부 구현:

1. JSON parse/CLI 입력 처리(로드 실패 → stderr 안내 + **exit 2**) ✔
2. `--json` 출력(동일 키 순서 severity/code/location/message, indent 2) ✔
3. error/warning/info Issue 구조(동일 필드) ✔
4. error 존재 시 exit 1 / 없으면 exit 0 ✔
5. required field 핵심 구조 검증(top-level + source_doc/area/item 중첩 — fallback 동등) ✔
6. `source_id` cross-reference ✔
7. `review_mode` ↔ `source_mode` 정합 ✔
8. `judgment_code`/`judgment_label`/`review_mode` 정합(모드별 라벨 표) ✔
9. source-bound 조건부 규칙(confirmed/partial→anchors, not_verifiable→missing+questions, conflict→human_review+note, out_of_scope→missing) ✔
10. evidence quote 빈값 금지 ✔
11. `customer_questions` 필수 6필드 + priority enum ✔
12. `prohibited_terms.md` 파싱 기반 금지 표현 스캔(동일 파서 규칙 — `## 금지 표현` 절 bullet + 판정명 라인 다어절, 제외 필드 4종 동일, 로드 실패 시 백업 목록+warning) ✔
13. 내부 경로 노출 스캔(**동일 정규식 목록**·IGNORECASE) ✔
14. jsonschema 부재 fallback 동등 info(아래 §3) ✔
15. `--warnings-as-errors` ✔
16. `--no-jsonschema` 동등 동작(info 생략) ✔

검출 **순서**까지 Python과 동일하게 유지했다(구조 → review_mode → source_modes → area 구조 →
items(필드→code→label→sourcebound→anchors→questions) → quote 재사용(코드포인트 정렬) →
금지어 로드 warning → 문자열 순회(경로→금지어) → info). 정렬은 코드포인트 비교기로 Python
`sorted()`와 일치시켰다.

## 3. jsonschema 차이 처리 — **방식 A 선택**

**A. Node는 표준 라이브러리 검증만 제공하고, Python의 no-jsonschema fallback과 parity를 맞춘다.**

- Node 기본 실행은 Python의 "jsonschema 미설치 fallback"과 동일 의미의 info
  (`schema.optional_skipped` @ `(schema)`)를 보고한다. 메시지 문구는 정직하게 다르다
  ("선택적 JSON Schema 검증은 Node 구현에 포함되지 않음…" — Node에서 'jsonschema 미설치'라는
  표현은 오해 소지가 있어 의미 동등·표기 상이로 처리, parity 예외 목록에 기록).
- `--no-jsonschema`는 Python과 동일하게 이 info 자체를 생략한다.
- 숨김 없음: 이 차이는 README·본 보고서·parity 테스트 주석에 명시했다. Node가 Python fallback보다
  좁아지지 않는다(fallback 경로의 검증 규칙은 전량 이식 — parity로 증명).

## 4. parity 기준 (golden = Python reference)

`tests/test_findings_validator_parity.test.cjs`:

- **fixture 30종**(Python 테스트의 전 변형 + 경계 확장: source_id 빈값/conflict note 빈값/out_of_scope
  missing 제거/not_verifiable missing 제거/unknown review_mode·judgment_code/invalid priority/
  다중 오류 조합/root 비객체)을 임시 파일로 생성해 **두 CLI를 각각 실행**
  (`--json --no-jsonschema` — 방식 A의 대조 경로) 후 대조:
  - exit code 동일
  - 이슈 **개수** 동일 + severity 분포(error/warning/info counts) 동일
  - **순서 포함** 각 이슈의 (severity, code, location) 완전 일치
  - **message 완전 일치**(예외 2종만 제외: `schema.*`·`prohibited.list_load` — 의미 동등·표기
    상이(안내문/경로 표기). 이 normalize는 검증 강도를 낮추지 않는다 — severity/code/location은
    예외 없이 전량·전순서 비교)
- 추가 parity: 기본 모드 info 의미 동등(환경에 jsonschema 설치 시 분기 처리 명시) ·
  `--warnings-as-errors` exit code · 로드 실패 exit 2 · root 비객체 단일 error(메시지 포함) ·
  텍스트 출력 요약 라인 동일.
- Python 실행 파일 탐색: `SAMIL_PARITY_PY` env → 로컬 표준 경로(3.14/3.13) → PATH `python` 실측.
  미탐지 시 **명시적 skip**(사유 출력 — 개발기 reference 대조용, 최종 사용자 런타임 요건 아님).
  이번 실행에서는 **skip 0** — Python 3.14.5와 실측 대조했다.
- fixture는 기존 Python 테스트처럼 공식 예시(`kssb_findings_example.json`)의 in-memory 변형으로
  생성한다(repo에 fixture 파일 미추가 — 임시 폴더 생성·정리).

## 5. optional quote 실재성 검증 — **구현함 (additive, 기본 꺼짐)**

- **기본 동작에서 꺼져 있음**: CLI `--source-text <파일>`(반복 가능) 또는 API `options.sourceTexts`가
  **명시 제공된 경우에만** 동작. 미제공 시 이슈 0건 추가(테스트로 강제 — parity에 영향 없음).
- 규칙: 각 anchor 인용을 **공백·줄바꿈 정규화(연속 공백↔공백 1)** 기준 substring 재탐색
  (Phase 1 `evidence_mapping_rules.md` §9·2N-5R evidence의 검증 방식과 동일 규칙).
- **미발견 = warning**(`quote.source_not_found`) — error가 아닌 이유: 원문 추출 방식 차이로 인한
  오탐 가능성이 있어 검출·검수 유도가 목적이며, 판정 차단은 사람 확인 후 결정한다.
  원문 파일 로드 실패도 warning(`quote.source_text_load`)으로 보고하고 검증은 계속한다.
- **사람 검수·독립 표본 확인(blackbox §3-(b))을 대체하지 않는다**(코드 주석·README 명시).
- Python reference에는 이 기능을 추가하지 않았다(기능 확장 금지 — D92 ③).

## 6. Node validator CLI/API 사용법

```
node src/validators/kssb_findings_validator.cjs <findings.json> [--json] [--no-jsonschema]
     [--warnings-as-errors] [--source-text <원문.txt> ...]
```

- 종료 코드: error ≥ 1 → 1 / 없음 → 0 / 로드 실패·usage 오류 → 2 (Python과 동일).

```js
const V = require("src/validators/kssb_findings_validator.cjs");
const issues = V.validateFindings(V.loadFindings("findings.json"));           // Python 기본과 동등
const issues2 = V.validateFindings(f, { useJsonschema: false });              // --no-jsonschema 동등
const issues3 = V.validateFindings(f, { sourceTexts: ["원문 텍스트"] });      // additive quote 점검
```

## 7. 검증 결과

| 항목 | 결과 |
|---|---|
| `<PY>` `tests/test_findings_validator.py` (reference 불변 확인) | **30/30 PASS** |
| `node --test tests/test_findings_validator_node.test.cjs` | **43/43 PASS** |
| `node --test tests/test_findings_validator_parity.test.cjs` | **35/35 PASS (skip 0 — Python 3.14.5 실측 대조)** |
| `<PY>` `tests/test_delivery_wiring.py` (validator 소비 표면 회귀) | **34/34 PASS** |
| Node 회귀: router 21 · hwp 39 · OCR 29 · write-failure 8 · bootstrap 11 | **전부 PASS** |
| `git diff --check` | clean |
| 오염 스캔(node_modules/package·lock/generated/traineddata/archive/submission.zip/repo tool-cache/샘플/report artifact) | **0건** |

실행하지 않은 테스트: Python intake/renderer/runner/nethook/aux/parity(OCR) 스위트 — 이번 diff가
해당 표면(intake·renderer·runner)을 건드리지 않고, validator 소비 표면은 delivery wiring 34/34로
확인했기 때문(생략 사유 기록). Kordoc/OCR 실 실행 없음(범위 밖).

## 8. 경계 준수

- **detect-only 유지**: findings 미변경(양 구현 모두 테스트로 강제), 판정·근거·질문·권고 생성 없음.
- **Python reference 보존**: `.py`·기존 테스트 diff 0. 기능 확장 없음(quote check는 Node에만 additive).
- **Node가 Python보다 느슨하지 않음**: fallback 경로 규칙 전량 이식 + 순서 포함 parity로 증명.
  (알려진 비목표 1건 — 병적 입력에서 Python이 문자열을 리스트로 우연 순회하는 부수 동작
  (예: `source_documents`가 문자열)은 재현하지 않았다. 두 구현 모두 해당 입력을 구조 error로
  실패시키므로 결과 판정은 동일하며, 이는 느슨화가 아니라 우연 동작의 비재현이다.)
- **외부 의존성 0**: Node 내장 모듈만. package.json/package-lock/node_modules 미추가.
- **N2/N3/N4/N5 미착수**: renderer/delivery/dei/aux/DOCX 관련 파일 diff 0. Python delivery
  hard-stop(D94) 미구현(정책대로 N2 대상). Skill 문서·runner 무변경.
- 2N-5 PASS·OCR complete·provider finalization·product complete 선언 없음 · Claude 최종 판정 없음.

## 9. Required Follow-up / Carry-forward

- **Codex Phase 2 N1 review** → PASS 시 N2(delivery + renderer HTML/MD 이식 + D94 hard stop 내장) 착수.
- N2에서 delivery가 Node validator를 소비하게 되면 `schema.optional_skipped` info의 사용자-facing
  처리(내부 기록 분리)는 delivery 계약대로 유지할 것.
- quote 실재성 보조 점검의 원문 입력 형태(DEI blocks JSON 직접 수용 등) 확장은 실사용 evidence 후
  별도 판단(현재는 텍스트 파일 입력만 — 최소 구현).
