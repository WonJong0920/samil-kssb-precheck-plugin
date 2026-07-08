# Claude Review — GPT "Post-N4 Hook 구조" 제안 검토 의견

> **성격**: Claude Code의 **검토 의견 문서**다(구현·코드 수정 0 — 이 문서 1개만 생성.
> 사용자 지시: "리뷰 문서의 생성만 허용"). PASS/FAIL 판정이 아니다 — 최종 판정은 Codex,
> 다음 분기 결정은 ChatGPT/사용자 몫이다(`docs/operating_principles.md`).
> 검토 대상: GPT가 제안한 "N4 구현 이후 플러그인 구조에 넣을 7개 hook point"
> (input_intake_policy / evidence_candidate_enrichment / findings_generation_guidance /
> findings_preflight / report_render_policy / report_postprocess / evidence_trace_export).
>
> 검토 시점의 repo 상태: Phase 2 **N1·N2 완료(Codex review 통과)** · **N3 진행 중**
> (`src/intake/dei_producer.cjs` 미커밋) · N4 미착수 · N5 사용자 결정 대기(D92 §7-②).

## 1. 요약 결론

**방향(계층 분리·경계 규정·금지 목록)은 타당하나, "hook"이라는 실행 메커니즘 도입에는
동의하지 않는다.** 제안된 7개 중 실제로 **새로 만들 것은 1개(evidence trace manifest)뿐**이며,
그것도 hook이 아니라 **delivery 종단의 결정적 파이프라인 단계**로 만드는 것이 이 repo의
기존 규율(결정성·golden parity·black-box 검증 가능성·누출 방지)에 더 부합한다.
나머지는 이미 모듈로 존재하거나(2개), 코드가 아닌 **데이터/콘텐츠**로 표현해야 하거나(3개),
기존 detect-only 체계의 확장으로 흡수 가능하다(1개).

시점에 대해서는 명확히 이견이 있다: GPT는 hook 4·5를 "Phase 2 N1~N2 / N2~N4에서 같이"
넣으라고 했으나, **Phase 2는 충실 이식 + parity 검증만 허용하는 구간**이다(D92 공통 규율).
구조 변경은 N4 완료 후 **전용 사이클 + Codex review + decision_log 기록**으로만 진행해야 한다.

## 2. 동의하는 부분

1. **금지 목록은 전적으로 동의.** auto_compliance_judgment / audit_opinion / assurance_opinion
   계열은 제품 경계("감사·인증·준수 판단 대체 아님" — `docs/operating_principles.md` §5,
   plugin.json 고지)를 무너뜨린다. aux_signal 계열이 N5 보류 결정(D92 §7-②)과 충돌한다는
   지적도 정확하다.
2. **"판정하지 않는 보강"과 "판단 기준 선택 vs 판단 자동화"의 경계 규정**은 잘 그어져 있다.
   enrichment는 후보 표시만, guidance는 기준 선택만 — 이 경계 자체는 Phase 3 설계에 그대로
   가져갈 가치가 있다.
3. **근거 추적 가능성(trace manifest)이 이 제품의 최대 차별점**이라는 판단에 동의한다.
   7개 제안 중 실질 신규 가치는 여기에 있다.
4. Codex 외부 hook API가 아니라 내부 구조 얘기라는 전제도 옳다 — `docs/architecture.md`가
   "Hook/MCP/apps/assets 경로는 plugin.json에 추가하지 않는다(현 범위 밖)"로 고정했고,
   `docs/current_status.md`도 "런타임 자동 배선(Hook/MCP 등)은 하드 요건 확정 시에만 재검토"를
   유지 중이다.

## 3. 사실관계 보정 (repo 실측 기준)

GPT 제안은 N1·N2 완료 상태를 반영하지 못한 전제 위에 서 있다. 실측과 다른 부분:

| GPT 주장 | repo 실측 |
|---|---|
| "findings_preflight_hook은 Phase 2 N1~N2에서 반드시 구조화해야 한다" | **이미 구조화 완료.** `src/renderers/kssb_report_delivery.cjs`가 N1 Node validator를 직접 require하고(24행), preflight error ≥ 1이면 산출물 0·exit 4로 중단하는 **D94 hard stop을 내장**했다(N2 완료, Codex review 통과). 별도 `hooks/findings_preflight.cjs`를 만들면 검증 통과 표면에 순수 간접층(indirection)만 추가된다. |
| "OCR 대상 판단을 runner 내부에 묻어두지 말고 hook으로 빼두라" | 이 판단은 이미 **결정 완료·문서화된 사안**이다(R4 — Phase 1에서 "대상 페이지 목록이 기준, 요약 boolean 아님"을 runners README·blackbox_protocol에 명시, 코드 무변경 결정). 또 라우팅 정책 소유권은 `src/intake/runners/document_intake_router.cjs`가 이미 갖는다(D91 — Kordoc-first when approved / baseline fallback, family 판별 포함). hook 추출은 리뷰 통과한 결정을 다시 여는 것이다. |
| "report_render_policy_hook을 N2~N4에서 같이 넣는 게 좋다" | Phase 2 규율 위반이다. D92 공통 규율은 "검증 범위·경계 축소 없는 **이식만**" 허용하며, parity 대조는 Python reference와의 충실 일치를 전제한다. 이식 중 정책 계층을 삽입하면 parity 기준선 자체가 흔들린다. 그리고 현재 렌더 정책은 **1개뿐**이다(대표 문서 1개, DOCX→HTML→MD 우선순위). 두 번째 실수요가 없는 정책 hook은 투기적 일반화다. |
| trace manifest를 "hook"으로 | 방향은 동의하나 메커니즘은 아래 §5-④ 참조. 단, `docs/workflow_usage.md` 산출물 정책이 이미 "JSON/CSV/**manifest**/`_검토근거` 폴더는 기본 산출물이 아니다"로 고정했으므로, manifest는 **RUN_ROOT(repo 밖) 내부 artifact**여야 하고 사용자-facing 대표 문서 1개 원칙을 침범하면 안 된다. |

## 4. 구조적 이견 — 왜 "hook"이 이 repo에 맞지 않는가

이 파이프라인은 **선형·결정적·단일 호출자**(Skill 워크플로우 → 내부 CLI) 구조다. hook
(등록/디스패치되는 실행 확장점)은 다중 호출자·플러그인 생태계·비결정적 조합이 필요할 때
가치가 있는 메커니즘이고, 이 구조에서는 비용만 남는다:

- **결정성·parity 부담**: Phase 2 전체가 golden fixture 대조 위에 서 있다. hook 지점마다
  "무엇이 끼어들 수 있는가"가 변수가 되면 black-box 프로토콜(`docs/blackbox_protocol.md`)의
  시나리오 행렬이 조합적으로 커진다.
- **누출 표면 증가**: 2N-5의 Major 결함 자체가 "예외 경로에서 stack/로컬 경로 누출"이었고
  Phase 0(R1)이 이를 통제된 실패로 봉합했다. hook 호출 경계마다 같은 봉합을 반복해야 한다.
- **2N-4S 원칙과 충돌**: "지금 review-passed 경계를 건드리지 않는 것이 더 단순하다"
  (claude 2N-4S audit §7 원칙). hook 1·4는 정확히 review-passed 표면의 재배선이다.
- **경계는 산문이 아니라 계약으로 강제된다**: GPT가 강조한 "enrichment는 판정 금지" 같은
  경계는 hook 규약 문서로는 강제되지 않는다. 이 repo가 이미 쓰는 방식 — **JSON schema +
  detect-only validator 체크**(예: 금지 표현·내부 경로 스캔) — 가 강제 가능한 형태다.

이 repo의 확장 메커니즘은 이미 존재하고 검증되어 있다: **① 단계 간 데이터 계약(schema)** ·
**② CLI를 가진 모듈 경계**(router/runners/dei/validator/delivery/renderer) · **③ 문서상 사용
계약**(workflow_usage) · **④ decision_log 게이트**. 확장이 필요하면 이 네 가지를 늘리는 것이
hook 신설보다 싸고 검증 가능하다.

## 5. 항목별 대응 권고 (더 효율적인 방향)

| # | GPT 제안 | 권고 | 형태 |
|---|---|---|---|
| 1 | input_intake_policy_hook | **신설 불요** — 정책 소유권은 router에 이미 있음(D91). 업종별 정책이 실수요가 되면 **선언적 config(데이터)** 로 표현해 router가 소비 | 기존 모듈 + (필요 시) config |
| 2 | evidence_candidate_enrichment_hook | Phase 3에서 채택한다면 hook이 아니라 **optional 중간 산출 단계**로: dei와 Skill 사이의 candidate map을 **별도 schema로 계약화**(ocr_supplement 전례). "판정 금지" 경계는 schema 필드 제약 + validator 체크로 강제 | 신규 optional stage + schema |
| 3 | findings_generation_guidance_hook | 이것은 코드가 아니라 **콘텐츠 선택** 문제다. 업종별 guidance는 Skill이 선택하는 **markdown guidance pack**(카탈로그 확장)으로 — Q1 카탈로그 정밀화의 연장선. 실행 hook 불요 | Skill 문서/콘텐츠 팩 |
| 4 | findings_preflight_hook | **이미 존재** — delivery 내장 validator 게이트 + D94 hard stop(N1·N2 완료). 추가 작업 0 | 완료 |
| 5 | report_render_policy_hook | **지금 불요** — 렌더 정책이 1개뿐. Phase 3에서 internal_review/client_brief 등 두 번째 모드가 실수요가 되면 **delivery CLI 옵션 + 검증된 options 객체**(데이터)로. N4 이식 중 삽입 금지 | (필요 시) config/flag |
| 6 | report_postprocess_hook | 기존 detect-only 체계와 대부분 중복(validator의 금지 표현·내부 경로 스캔 + delivery의 sanitize/redaction). 보고서 수준 스캔이 더 필요하면 **기존 체크의 확장**으로, 2N-5R evidence 기반 Phase 3에서 | 기존 체계 확장 |
| 7 | evidence_trace_export_hook | **유일한 실질 신규 — 채택 권고.** 단 hook이 아니라 **delivery 종단의 결정적 manifest 단계**로: 이미 존재하는 provenance(승인 기록·prep egress·run log·dei canonical hash·findings hash·preflight 결과·보고서 hash)를 `run_manifest.json` 하나로 **집계**해 RUN_ROOT(repo 밖)에 기록. 2N-5R에서 Codex가 수동으로 한 hash 재계산 검증을 자동 집계로 대체하는 효과 | delivery 파이프라인 단계 |

**핵심 재해석**: GPT의 7개 hook은 실제로는 "**정책은 데이터로, 지침은 콘텐츠로, 경계는
schema로, 게이트는 이미 있는 delivery로, 신규는 manifest 하나**"로 환원된다. 이렇게 하면
GPT가 의도한 확장성(업종별 정책·보고서 모드·guidance 팩)은 전부 살리면서, hook 디스패치
계층이 가져올 결정성·parity·누출·리뷰 비용은 지불하지 않는다.

## 6. trace manifest 설계 시 지킬 기존 제약

- **기본 산출물 아님**: 사용자-facing 대표 문서 1개 원칙 유지. manifest는 RUN_ROOT 내부
  artifact(repo 밖)로만 생성(`docs/workflow_usage.md` 산출물 정책 그대로).
- **경로 누출 금지**: manifest 내용에 로컬 절대경로·계정명 미포함(hash·상대 식별자·건수 중심).
  사용자 요약에는 manifest 존재 언급 불요 또는 파일명만.
- **결정성**: 동일 입력 → 동일 manifest(타임스탬프 필드는 provenance 섹션으로 분리 명시).
- **재판정 금지**: manifest는 집계·기록만 한다. 판정·품질 평가 필드를 넣지 않는다.

## 7. 시점 권고

1. **지금(N3 진행 중)**: 구조 작업 0. 본 제안은 계획 입력으로만 보관.
2. **N4 완료 + Codex review 통과 후**: "trace manifest 단계 신설 + 정책-as-config 방침"을
   **전용 1사이클**(설계 문서 → Codex review → 구현 → Codex review)로. hook 도입 여부 자체가
   구조 원칙 변경급이므로 `docs/decision_log.md`에 결정으로 기록.
3. **Phase 3**: enrichment stage(schema 계약)·guidance pack·render mode·postprocess 확장은
   2N-5R급 실측 evidence 기반으로 개별 판단(D92 Phase 3 틀 그대로).
4. **명명 권고**: "hook"이라는 용어 자체를 피한다 — Codex plugin hook API(범위 밖 고정),
   repo의 `log-hooks/`(세션 로깅), 그리고 "런타임 자동 배선 재검토 보류" 결정과 3중으로
   충돌해 이후 프롬프트·리뷰에서 혼선을 만든다. "파이프라인 단계(stage)" / "정책
   config" / "guidance pack"으로 부르는 것을 권고한다.

## Final Report

- 성격: 검토 의견 문서 1건 생성만(코드·기존 문서 무변경, 판정 아님).
- 결론: 계층 분리·경계 규정·금지 목록은 동의. hook 메커니즘은 불채택 권고 —
  7개 제안을 "완료 1(preflight)·기존 모듈 1(intake 정책)·데이터/콘텐츠 3(render 정책·
  guidance·enrichment)·기존 체계 확장 1(postprocess)·실질 신규 1(trace manifest)"로 환원.
- 유일한 즉시 가치: trace manifest를 delivery 종단의 결정적 단계로(단, N4 완료 후 전용
  사이클 + decision_log 기록 + Codex review).
- Phase 2 규율 보호: N3·N4 이식 사이클에는 어떤 구조 변경도 편승시키지 않는다.
- 다음 단계: ChatGPT/사용자의 분기 판단(본 의견 채택 여부 → N4 후 사이클 계획 반영).
