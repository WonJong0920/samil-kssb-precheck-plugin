# Cycle 2N-6 — Trace Manifest Stage 설계 (design-only)

> **성격**: 설계 문서다(구현 아님). 코드·테스트·schema·package·runtime 무변경. Claude Code는
> 설계·검토 근거를 문서로 남기며 PASS/FAIL 판정은 하지 않는다 — 채택 여부는 ChatGPT/사용자,
> 구현 후 검증은 Codex review가 수행한다. 본 문서는 구현을 착수하지 않는다.
>
> 시작 HEAD: `bce31cc…`(Cycle B workflow alignment review 반영·최신 main·clean)

## 1. 설계 목적

대표 보고서 생성 과정에서 쓰인 **입력·검증·산출물의 provenance를 하나의 내부 artifact
(`run_manifest.json`)로 결정적으로 집계**해, 이후 black-box 검증과 사람 검수에서 **재현성·추적성**을
높인다. 지금은 이 집계를 **사람이 수동으로** 한다(`docs/blackbox_protocol.md` §4 — evidence 문서에
"산출물 위치/바이트/hash·preflight counts·오염 스캔"을 손으로 기록, 2N-5R에서는 Codex가 hash를 수동
재계산). trace manifest는 이 수작업을 **delivery 종단의 결정적 stage**로 자동화한다.

핵심 성격 못박기(이 문서 전체에 적용):
- **hook 아님** — 등록/디스패치되는 실행 확장점이 아니라 delivery 파이프라인의 **단일 종단 단계**다
  (`docs/reviews/claude_gpt_post_n4_hook_structure_proposal_review.md` §5-⑦·§7의 권고 준수).
- **판정 아님** — 집계·기록만 한다. 판정·품질평가·감사/인증/준수 의견 필드를 만들지 않는다.
- **사용자-facing 대표 문서 아님** — 기본 산출물 1개 원칙을 침범하지 않는 **내부 artifact**다.

## 2. 현재 repo 상태와 전제

- **Phase 2 core Node migration N1~N4 closure 완료**(각 Codex review PASS,
  `docs/cycle2n_6_phase2_closure_summary.md`). **N5 aux scanner는 Node 미이식 한계**(D93 ②·D95).
- **workflow docs alignment PASS**(Cycle B) — 런타임 경로 = Node(`.cjs`), Python(`.py`)은 golden
  parity reference.
- **런타임 delivery 경로**: `src/renderers/kssb_report_delivery.cjs`의 `deliver(findings, outDir, opts)`가
  `findings → N1 validator preflight → D94 hard stop → renderReport(DOCX→HTML→MD) → user_summary`를 잇고,
  `{ hard_stop, user_summary, outputs, preflight:{counts,issues}, internal_notes }`를 반환한다.
  `outputs`는 `{ docx, html, markdown, primary, primary_format, docx_error }`.
- **현재 delivery/renderer에는 해싱이 없다**(`src/renderers`에 sha256 0건 — 실측). 즉 findings 입력
  hash·보고서 산출물 hash는 **지금 어디서도 계산하지 않는다**. 이것이 manifest 구현의 실질 신규 코드다.
- **재사용 가능한 결정적 직렬화 자산**: `src/intake/dei_producer.cjs`의 `canonicalOcrOutputSha256`
  (top-level 필드 제외 + `sort_keys` canonical JSON의 SHA-256, `_pyJsonCompact`) 규칙과, runner의
  `sortDeep()` + `JSON.stringify(…, null, 1)`(approvals.json) 패턴이 이미 있다 — manifest 직렬화도
  같은 결정적 규칙을 따른다(신규 파서·의존성 불요).
- **provenance 소스**: runner가 tool-cache에 `approvals.json`·`prep_egress_log.jsonl`·`run_log.jsonl`
  (`no_egress_verified` 등)을 남기고, OCR/DEI는 `output_sha256`/canonical hash를 갖는다. 단 이들은
  **delivery 밖(intake/OCR 단계)** 산출이다 — 아래 §7에서 범위 경계를 정한다.

## 3. source-of-truth 검토 요약

- `docs/cycle2n_6_phase2_closure_summary.md` §4-2: trace manifest는 "delivery 종단의 결정적 provenance
  집계 단계, hook 아님, 설계→Codex review→구현→Codex review + decision_log 결정"으로 진행.
- `docs/workflow_usage.md` 산출물 정책: "JSON/CSV/**manifest**/`_검토근거` 폴더는 **기본 산출물이 아니다**
  (내부 개발/검증용 가능성만)" — manifest는 이 기존 정책에 그대로 들어맞는 내부 artifact다. 또 "plugin/
  cache/sandbox 내부 경로를 산출물·사용자 안내에 노출하지 않는다".
- `docs/reviews/claude_gpt_post_n4_hook_structure_proposal_review.md` §5-⑦·§6: 유일한 실질 신규 =
  trace manifest, RUN_ROOT(repo 밖) 내부 artifact, 경로 누출 금지, 결정성(타임스탬프는 provenance
  섹션 분리), 재판정 금지.
- `docs/blackbox_protocol.md` §4: evidence는 "실행 HEAD·환경·샘플 hash·단계별 exit code·산출물 바이트/
  hash·preflight counts·오염 스캔"을 기록하되 **원문/산출물 자체는 repo 미커밋(집계·hash만 문서화)** —
  manifest가 자동 대체할 대상의 명세다.
- `src/renderers/kssb_report_delivery.cjs`/`kssb_report_renderer.cjs`/`src/intake/dei_producer.cjs`:
  §2에 요약. delivery가 findings·preflight·outputs를 모두 in-memory로 갖는 **유일한 수렴점**임을 확인.
- `docs/decision_log.md` D94(hard stop)·D93 ③(Python reference 유지)·D95(closure/N5 한계): manifest는
  이 경계들과 정합해야 한다(하드 스톱 시 산출물 0, Python 무변경).

## 4. 권장 설계안

**delivery 종단의 opt-in 결정적 manifest stage**로 구현한다.

- **호출 시점**: `deliver()`가 renderReport로 대표 문서를 성공 생성한 **직후**(성공 경로 종단). D94 hard
  stop 경로에서는 산출물이 0이므로 **manifest도 생성하지 않는다**(하드 스톱 = artifact 0 원칙 유지).
- **opt-in(기본 off)**: `deliver(..., { manifest: true })` / CLI `--manifest`로만 생성. 기본 delivery
  출력(DOCX/HTML/MD 3개)과 user_summary는 **불변** → 기존 N2/N4 parity·테스트 무회귀.
- **위치**: 대표 문서와 같은 out-dir에 `run_manifest.json`으로. 사용자-facing 대표 문서가 아니라
  **내부 provenance artifact**다(§10). `.gitignore`에 방어 패턴 추가(구현 시 — `*.intake.json` 계열과 동일).
- **내용**: 아래 §6. 결정적 core + 분리된 runtime 블록(§9).
- **자기 hash**: manifest는 결정적 core에 대한 `manifest_sha256`(self digest)를 포함해 tamper-evidence를
  제공한다(runtime 블록은 digest 대상에서 제외).
- **직렬화**: dei_producer의 canonical JSON 규칙(sort_keys·compact 또는 indent 고정)을 재사용 —
  신규 의존성·파서 없음.
- **실패 처리**: manifest 생성 실패는 **delivery를 깨뜨리지 않는다**(대표 문서가 우선). `docx_error`
  패턴처럼 `manifest_error`를 반환값에 기록하고 계속 진행(§11).

## 5. 대안과 기각 사유

| 대안 | 기각/보류 사유 |
|---|---|
| **hook registry/dispatcher** | 선형·단일 호출자 구조에 결정성·parity·누출·리뷰 비용만 추가(§리뷰 문서 §4). 명시적 범위 밖(프롬프트 금지). |
| **별도 post-process CLI**(out-dir를 사후 스캔해 manifest 생성) | delivery의 in-memory findings·preflight을 잃어 산출물을 다시 읽어 재해싱해야 하고, 로직이 이중화된다. delivery가 이미 모든 입력을 가진 수렴점이라 종단 stage가 더 싸고 정확. |
| **renderer 내부 생성** | renderer는 순수 형식 변환기(재판정·preflight 무지) — provenance/preflight를 알면 경계 위반. |
| **runner 측 생성** | runner는 intake/OCR 단계로 findings→report 정보를 갖지 않는다. 상류 provenance는 이미 tool-cache 로그에 있음(§7). |
| **schema(JSON Schema) 신설로 계약 강제** | package/schema 무변경 원칙. manifest는 findings 계약이 아니라 내부 기록물 — 필드 계약은 **문서(README/설계)** + 구현 테스트의 필드 allowlist로 강제(이 repo가 이미 쓰는 방식). |
| **기본 on(항상 생성)** | 기존 delivery 출력·parity를 바꿔 N2/N4 회귀를 유발. opt-in default-off가 안전. |
| **wall-clock timestamp를 core에 포함** | 결정성 파괴. 타임스탬프는 runtime 블록으로 분리(§9). |

## 6. 포함 / 제외할 정보

**포함(결정적 core)** — 전부 hash·count·식별자·바이트 수준(판정 아님):
- `manifest_version`, `manifest_kind: "trace_manifest"`, `stage: "delivery_terminal"`.
- **input**: `findings_sha256`(findings의 canonical-JSON 또는 원문 바이트 SHA-256 — 규칙 §9 고정),
  `report_title`/`generated_for`(report_meta에서 온 문자열 — 경로 아님), `review_mode`, `source_count`,
  `area_count`, `item_count`.
- **preflight**(detect-only 결과 — 판정 아님): `counts{error,warning,info}`, `issue_codes`(코드·severity의
  정렬된 목록 — 전체 message/location 원문은 제외해 누출·오해 방지), `hard_stop: false`(성공 경로).
- **outputs**: 각 산출물별 `{ format, filename(basename), bytes, sha256, primary: bool }`.
  `primary_format`. `docx_error` 존재 시 그 사실(문자열 아님, boolean/사유 코드 수준).
- `manifest_sha256`(core self-digest).

**제외(만들지 않음)**:
- 로컬 절대경로·계정명·임시경로·tool-cache 경로(§8).
- validator issue의 전체 message·location 원문, stack trace, 내부 진단 문자열.
- **판정/품질/의견 필드**: `status: PASS`, `quality`, `score`, `compliance`, `assurance`, `audit_opinion`
  류 일체(§12).
- findings 원문·보고서 본문·인용 텍스트(hash·바이트 수만).
- 상류(intake/OCR/DEI/runner) provenance 원문 — 참조 링크조차 v1에서는 넣지 않는다(§7 open question).

## 7. 범위 경계 (delivery segment vs upstream provenance)

- **v1 범위 = delivery segment**(findings → preflight → 대표 문서). 이 구간의 provenance만 집계한다.
- **상류(intake·OCR·DEI·runner)** provenance는 이미 tool-cache 로그(`run_log.jsonl`·`approvals.json`·
  `prep_egress_log.jsonl`)와 DEI/OCR canonical hash에 **분산 존재**하며, delivery는 이를 in-memory로
  갖지 않는다. v1 manifest는 이를 **재수집하지 않는다**(범위 폭증·경로 누출 위험 회피).
- 상류를 하나로 잇는 "end-to-end run manifest"는 **open question**(§16-1)로 남긴다 — 필요 시 후속
  사이클에서 delivery에 상류 provenance 요약(hash만)을 **명시 입력으로 주입**하는 방식을 검토한다.

## 8. 경로 누출 방지 원칙

- manifest 내용은 **basename·상대 식별자·hash·건수·바이트만** 담는다. 절대경로·계정명·임시경로 금지.
- delivery가 이미 가진 `_displayPath`(cwd-relative-or-basename) / `_redact`(`[REDACTED_LOCAL_PATH]`)
  discipline을 manifest 경로 필드에도 적용(2차 방어).
- 구현 테스트에 **user_summary와 동일한 leak assert**(사용자 홈 경로·AppData·tmpdir·stack `at ` 부재)를
  manifest 문자열에도 적용한다.

## 9. determinism 전략

- **결정적 core**: 동일 findings → **byte-identical manifest core**. 필드 순서 고정(canonical JSON
  sort_keys 또는 고정 키 순서), hash 규칙 고정.
- **hash 대상 규칙 고정**(구현 시 확정, open question §16-2): findings는 (a) 입력 파일 원문 바이트
  SHA-256 또는 (b) canonical-JSON(sort_keys) SHA-256 중 하나로 고정. 권장은 **canonical-JSON**
  (파일 포맷/개행 차에 불변, dei canonical 규칙과 일관). 보고서 산출물은 **파일 바이트 SHA-256**
  (DOCX/HTML/MD 각각 — DOCX는 N4에서 Node 결정적 산출이므로 재현 가능).
- **runtime 블록 분리**: node version·`generated_at`(wall clock) 등 runtime-specific 값은 **별도
  `runtime` 섹션**에 두고 `manifest_sha256` digest 대상에서 **제외**한다. 기본값은 **타임스탬프 미포함**
  (완전 결정성 우선) — 타이밍이 필요하면 runtime 블록 opt-in.
- N4 DOCX writer가 고정 타임스탬프로 결정성을 얻은 것과 같은 원칙(runtime 가변값은 격리).

## 10. 사용자-facing 산출물과의 관계

- manifest는 **대표 문서가 아니다**. 기본 산출물 1개 원칙(대표 문서 DOCX→HTML→MD 1개)을 침범하지 않는다
  (`docs/workflow_usage.md` 산출물 정책의 "manifest는 기본 산출물 아님"에 정합).
- opt-in default-off이므로 **기본 delivery 출력·user_summary는 불변**. manifest 생성 시에도 user_summary는
  manifest를 대표 문서로 승격하지 않는다(언급하더라도 파일명 수준, 또는 미언급).
- `.gitignore` 방어로 repo 유입 차단(구현 시).

## 11. 실패 처리 전략

- **delivery 우선**: manifest 생성/쓰기 실패가 대표 문서 delivery를 깨지 않는다. 실패 시 `manifest_error`
  (사유 코드/짧은 안내 — 경로·stack 없음)를 반환값에 기록하고 delivery는 정상 종료.
- **D94 hard stop**: 산출물 0 경로에서는 manifest를 생성하지 않는다(artifact 0 원칙 유지). 하드 스톱의
  preflight 실패는 이미 user_summary·preflight.issues(내부)로 표현된다.
- **부분 산출**(예: docx_error로 HTML/MD만 생성): manifest는 **실제 생성된 산출물만** 기록(docx_error
  사실 포함). 없는 파일을 기록하지 않는다.
- CLI: manifest 실패는 delivery exit code를 바꾸지 않는다(성공은 0 유지). 상세는 `--debug` stderr에만.

## 12. no-overclaim 경계

- manifest는 **집계·기록물**이다. "이 보고서는 검증을 통과했다/품질이 좋다/감사·인증·준수"류로 읽히면 안 된다.
- **금지 필드**(구현 테스트의 필드 allowlist로 강제): `status`(PASS류)·`verdict`·`quality`·`score`·
  `grade`·`compliance`·`assurance`·`audit_opinion`·`certified` 등.
- preflight는 **detect-only 결과의 raw count/code**로만 표기하고 "합격/불합격" 언어로 승격하지 않는다.
- manifest 어디에도 제품 완성·2N-5 통과·OCR complete·provider finalization·submission readiness를 함의하지
  않는다. 문서·필드명·주석에서 이 경계를 명시.

## 13. 구현 시 필요한 변경 후보 (지금 구현하지 않음)

- `src/renderers/kssb_report_delivery.cjs`: 종단에 `buildTraceManifest(findings, outputs, preflight)` +
  `writeTraceManifest(manifest, outDir)` 추가, `deliver`에 opt-in `manifest` 옵션, 반환값에 `manifest`/
  `manifest_error` 필드, CLI `--manifest` 플래그. **기본 off로 기존 동작 불변**.
- 해싱/직렬화 헬퍼: `node:crypto` sha256 + canonical JSON(dei_producer 규칙 재사용 또는 소형 공용 util).
  **외부 의존성 0 유지**.
- `.gitignore`: `run_manifest.json`(또는 채택 파일명) 방어 패턴 추가.
- 문서: `docs/workflow_usage.md`·`src/renderers/README.md`에 manifest 필드 계약·opt-in 사용법 1절 추가,
  `docs/blackbox_protocol.md`에 "manifest 자동 집계로 §4 수작업 일부 대체 가능" 연결.
- **Python 무변경**: manifest는 **Node-only 신규 stage**다(포트가 아님 — Python delivery에는 대응물이
  없다). 따라서 **Python golden parity 대상이 아니다**(§14에서 검증 전략에 반영). D93 ③ Python reference
  지위 무변경.

## 14. 테스트 / 검증 전략 (구현 사이클용)

- **결정성**: 동일 findings 2회 → manifest core byte-identical(runtime 블록 제외). `manifest_sha256` 재현.
- **콘텐츠 정합**: manifest의 output `sha256`/`bytes`가 실제 생성 파일의 독립 계산값과 일치. preflight
  count/code가 validator 결과와 일치. findings_sha256이 규칙대로 재현.
- **누출**: manifest 문자열에 로컬 절대경로·계정명·tmpdir·stack 부재(user_summary와 동일 assert).
- **no-judgment 경계**: 금지 필드(§12) 부재를 **필드 allowlist assert**로 강제. 감사/인증/준수 토큰 스캔.
- **D94/하드 스톱**: hard stop 시 manifest 파일 미생성(artifact 0). 부분 산출(docx_error) 시 생성 파일만 기록.
- **opt-in 무회귀**: 기본(manifest off) delivery가 **기존 3파일·user_summary 불변**(N2/N4 delivery·parity
  테스트 그대로 green). manifest on일 때만 파일 1개 추가.
- **실패 처리**: 쓰기 실패 mock → delivery 성공 유지·`manifest_error` 기록·exit code 불변.
- **오염 스캔**: repo에 `run_manifest.json` 미유입(테스트는 임시 폴더 생성·정리).
- Node-only이므로 Python parity 테스트는 없음(§13 — 대응물 부재). 이 점을 완료 보고서에 명시.

## 15. Codex review에서 확인해야 할 항목

- delivery 종단 단독 stage인지(hook·dispatcher 아님), 범위가 delivery segment로 한정됐는지(상류 미수집).
- **결정성**(core byte-identical, runtime 블록 분리)·**self-hash** 정확성.
- **경로 누출 0**(basename·hash·count만) — user_summary와 동일 leak 기준.
- **no-judgment 경계**(금지 필드 allowlist, preflight는 raw count/code).
- **opt-in default-off로 N2/N4 delivery·parity 무회귀**(기본 출력·user_summary 불변).
- **D94 hard stop 무변경**(하드 스톱 시 manifest 0), 부분 산출 정직 기록.
- **Python reference 무변경**(D93 ③) + manifest가 Node-only 신규(포트 아님 — Python parity 비대상)라는
  설계 전제의 타당성.
- 외부 의존성·package·schema·generated artifact 오염 0.
- no-overclaim(제품 완성/2N-5/OCR/provider/submission readiness 무주장).

## 16. Open questions / 사용자 결정 필요

1. **상류 provenance 링크**(intake/OCR/DEI/runner hash를 manifest에 연결) — v1 제외(권장) vs 후속
   사이클에서 delivery에 상류 요약을 명시 입력으로 주입. → **결정 필요**(권장: v1 제외).
2. **findings hash 규칙** — 원문 파일 바이트 vs canonical-JSON(sort_keys). → 권장 canonical-JSON(포맷 불변·
   dei 규칙 일관). 구현 시 확정.
3. **wall-clock timestamp** — 기본 미포함(완전 결정성, 권장) vs runtime 블록 opt-in. → 권장 미포함.
4. **opt-in 기본값** — off(권장, parity 보존) vs on. → 권장 off.
5. **manifest 위치·파일명** — out-dir의 `run_manifest.json`(권장) vs 별도 provenance 하위 폴더·`<stem>.trace.json`.
6. **manifest self-hash 포함 여부** — 포함(권장, tamper-evidence) vs 생략.
7. **하드 스톱 시** — manifest 미생성(권장, artifact 0) vs 최소 preflight-only 기록.

## 17. 최종 권고

- **채택 권고**: trace manifest를 **delivery 종단의 opt-in(기본 off) 결정적 stage**로 구현. 유일한 실질
  신규 가치(수동 provenance 집계의 자동화)를 살리면서, 기본 출력·parity·경계를 건드리지 않는다.
- **구현 착수는 별도 사이클**로: 본 설계의 Codex review PASS → 사용자/ChatGPT 채택 결정(위 §16, 특히
  1~4) → 구현(코드+테스트) → Codex 구현 review + `decision_log` 결정 기록. **구조 추가**이므로 이식
  사이클과 분리한다.
- 권장 기본 결정(§16): 상류 미수집·canonical-JSON hash·타임스탬프 미포함·opt-in off·self-hash 포함·
  하드 스톱 시 미생성. 사용자가 달리 정하면 그에 맞춰 구현 설계를 조정한다.
