# Claude Cycle 2N-4S — Whole-Project Quality-preserving Simplification Audit (before 2N-5)

> **성격**: Claude Code의 **읽기 전용 simplification audit**다(구현·수정 0 — 이 보고서 1개만 커밋).
> 전용 simplify skill은 이 세션에 제공되지 않아, 프롬프트의 품질 보존 기준을 그대로 절차로 삼아
> 수동 audit를 수행했다. 판정 편향은 지시대로 **보수적**이다 — 2N-5 직전에는 "단순한 구조"보다
> **"안전하게 검증 가능한 구조"**가 우선이며, 산출물 품질·근거 추적성·검수 가능성·안전 경계를
> 낮추는 단순화는 등급과 무관하게 배제했다.
>
> audited HEAD: `4dedffba70f68950609307ae8291de48c100f196` (pull 후 일치·clean —
> Codex 2N-4M review PASS 포함)

## 1. Verdict

**DO_A_ONLY_BEFORE_2N_5**

구조 복잡성은 2N-5 품질을 위협하는 수준이 아니다(BLOCK 아님). 코드·테스트·안전 경계는 지금 그대로
두는 것이 가장 단순하고 안전하다. 다만 **상태 문서의 탐색 비용**(current_status 680줄·"현재 Cycle"
섹션에 사이클 bullet 52개 누적, md 문서 149개)이 2N-5 프롬프트 작성자와 심사자의 이해 비용을 실제로
높이고 있어, **A등급 문서 hygiene 2건만** 수행하면 2N-5 품질이 올라간다. B등급 코드 정리는 가능하지만
**2N-5 전에는 권고하지 않는다**(review-passed 표면 churn > 이득).

## 2. 현재 구조 복잡도 판단

**코드: 복잡하지 않다.** src 전체 4,952줄(12파일), 최대 파일 963줄(renderer). 층 경계가 명확하고
(core 3층 / ingest / runners / Skill 지침), 경계가 테스트로 강제된다(core 미참조·require 표면 스캔).
runner가 3개(.cjs)+reference(.py)+bootstrap(ps1)으로 늘었지만 각각 별도 리뷰를 통과했고 소유권이
문서화되어 있다(family routing — C2N4I4M-OBS-01 대응 구조).

**테스트: 건강하다.** 3,588줄·11스위트(Node 4 + Python 7), 전부 green. 중복은 helper 수준
(runMain/mockExec/preinstallKordoc ×3)이며 검증 범위 중복이 아니다.

**문서: 여기가 복잡성의 중심이다.** md 149개(docs 루트 41 + planning 26 + reviews 69 + samples 13).
단, 4M 정렬 직후라 **내용 불일치는 없다**(Codex 2N-4M PASS — stale/overclaim 0). 문제는 정합성이
아니라 **탐색 비용**: ① `current_status.md` 680줄 — "현재 Cycle" 섹션이 사실상 append-only 사이클
로그(bullet 52개)가 되어 "현재"를 읽으려면 과거를 스크롤해야 한다. ② 어떤 문서가 현재-facing
source of truth이고 어떤 문서가 historical evidence인지의 **지도(map)가 없다** — 신규 독자(심사자·
2N-5 실행자)는 149개 중 무엇을 믿어야 하는지 관행으로만 안다.

## 3. 가장 큰 복잡성 원인 (우선순위순)

1. **current_status "현재 Cycle" 섹션의 무한 누적** (680줄·52 bullets) — 상태 문서가 이력 문서를 겸함.
2. **source-of-truth 지도 부재** — 149개 md의 역할 구분(현재-facing vs historical)이 암묵적.
3. runner family의 **의도적 중복**(defaultExec ×3·CLI RunnerError 경계 ×3·evidence 실패 블록 ×3·
   승인/설치 흐름 유사 구조 ×2) — 리뷰된 코드를 건드리지 않으려는 **의도된 선택**이었고(4J/4L 보고에
   기록), 유지보수 부담은 아직 실재하지 않음(세 파일 모두 최근 리뷰 통과·안정).
4. npm 실행 방식 비대칭 — OCR runner는 npm-cli.js 직접 실행(EINVAL 실측 보정), HWP runner는 종전
   방식(C2N4L-OBS-02 — Codex가 이미 "재현 시 좁은 patch"로 분류).
5. 테스트 helper 중복(×3) — 경미.

## 4. 품질 보존 기준 (이 audit가 적용한 게이트)

프롬프트의 금지 목록을 그대로 적용했다: KSSB 근거 추적성·source-bound 원칙·evidence mapping 품질·
ocr_supplement 경계·OCR 단독 confirmed 승격 금지·사람 최종 판단·no-overclaim·no-egress 한계 표기·
approval/fallback/fail-fast·hash parity·artifact 방어·2N-5 검증 가능성·보고서 검수 용이성 — 이 중
하나라도 degrade면 2N-5 전 후보에서 제외. 각 후보는 산출물 품질/검증 가능성/사용자 이해도/2N-5
안정성/rollback 난이도/Codex review 필요를 평가했다(§5 표기: 품질·검증·이해·안정 순).

## 5. 단순화 후보 분류

### A — 2N-5 전에 해도 안전하고 품질을 높이는 단순화 (권고: 이 2건만)

- **A-1. current_status 이력 분리(삭제 아님 — 이동+링크)**: "현재 Cycle" 섹션을 최신 사이클
  bullet 2~3개 + 요약 상태로 압축하고, 나머지 49개 bullet을 신규 `docs/history/`(예:
  `current_status_archive_2N.md`)로 **무손실 이동** + 상단 링크. 평가: 품질 improve(2N-5 프롬프트
  작성·심사자 이해) / 검증 neutral(기록 보존) / 이해 improve / 안정 improve / rollback 사소(git) /
  **Codex narrow review 권장**(상태 문서라 관행상 리뷰 체인 유지). 주의: **삭제·요약 대체는 Q**다 —
  원문 그대로 이동만 허용.
- **A-2. source-of-truth 지도 1페이지**: `docs/README.md`(신규 1개 — 순증이지만 현재-facing 독서량을
  줄이는 순감) — "사용자/심사자는 README+quickstart, 상태는 current_status, 결정은 decision_log,
  행동 규칙은 SKILL+evidence_mapping_rules, assisted 상세는 runners README이며, planning/samples/
  reviews는 **historical evidence(현재 상태 주장 아님)**"를 명시. 평가: 품질 improve / 검증 improve
  (리뷰어 오리엔테이션) / 이해 improve / 안정 improve / rollback 사소 / Codex narrow review 권장.

A로 분류하지 않은 것: README·quickstart·runner README 간 경계 문구 반복은 **의도적 defense-in-depth**
(각 문서의 독자가 다름)이라 중복 제거 대상이 아니다 — 4M에서 방금 정렬된 표면을 다시 만지는 것 자체가
리스크(§7 원칙 "지금 review-passed 경계를 건드리지 않는 것이 더 단순하다").

### B — 가능하지만 Codex review 필요 (권고: **2N-5 전에는 하지 않는다**)

- B-1. runner 공통 primitive 모듈(defaultExec·CLI RunnerError 경계·evidence 통제 실패 블록 통합 —
  3파일 touch). 품질 neutral / 검증 neutral(테스트 유지 전제) / 이해 neutral / **안정 risk**(리뷰
  통과 3표면 동시 churn). → 2N-5 후.
- B-2. hwp runner npm 실행을 npm-cli.js 방식으로 통일(C2N4L-OBS-02). 실 설치 evidence가 EINVAL을
  재현할 때만 좁은 patch로 — Codex 판단과 동일. 선제 통일은 2N-5 전 불필요 churn.
- B-3. 테스트 공용 helper(`tests/_runner_test_helpers.cjs`) 추출. 품질 neutral — 2N-5 후로.
- (공통) B는 어떤 경우에도 검증 범위·실패 경계를 줄이면 안 되며, 시행 시 전 스위트 green + Codex
  review가 조건이다.

### C — 2N-5 전에는 하지 말아야 할 단순화

runner 구조 재배치(3-runner를 단일 CLI로 통합 포함) · router의 pdf 흐름과 hwp main 흐름 통합 ·
OCR/Kordoc 통합 리팩터링 · DEI/ingest 계약 수정(user-range 개방 포함) · Skill behavior 수정 ·
schema/validator/renderer/delivery 변경 · packaging 구조 변경 · 테스트 범위 축소 · 검수/한계/경고
문구 삭제 · 4M에서 정렬된 사용자-facing 문구의 재편집(오류 발견 시 제외).

### D — 2N-5 이후 backlog

runner family 공통 모듈화(B-1의 큰 형태) · 단일 진입 CLI UX(사용자가 router/OCR runner를 별도로
아는 현재 구조의 개선 — 실사용 관찰 후) · 문서 IA 재편(planning/samples 아카이빙 체계) · bounded
기본값 재설계(실 스캔 실측 후 — C2N4K/4L/4M-OBS 계열) · Python runner의 지위 최종 결정(D85④ 이월) ·
package/runtime 관리 체계 통합 · report rendering 재구성.

### Q — 절대 하지 말아야 할 품질 저하 단순화 (이 audit의 핵심 산출)

1. **경고·한계·검수 문구 축소** — quickstart/README/SKILL의 "정확도 미보증·검수용 보조 재료·사람이
   최종 판단" 반복은 중복이 아니라 제품 경계다.
2. **§6 규칙 완화** — OCR 유래 표기·OCR 단독 confirmed 승격 금지·보수적 매핑은 어떤 단순화로도 건드리지 않는다.
3. **승인 게이트 통합** — "설치+실행 승인을 한 번으로", "HWP/PDF/OCR 승인을 하나로"(U3·U7 분리 해체)는
   UX 단순화처럼 보이지만 안전 경계 삭제다.
4. **fallback 경로 삭제/축약** — unavailable/declined/failed/timeout/mismatch/blank/no-target 각각의
   분기·문구는 실패 은폐 방지 장치다.
5. **provenance/evidence 축소** — run_log 필드·prep egress 이중 출처 기록·no-egress 한계 표기·
   hash 검증(5종 pin·native·traineddata·text/output hash·Node/Python parity) 어느 것도 "간소화" 대상 아님.
6. **테스트·오염 스캔 축소** — 129개 Node 테스트/183 Python 체크의 어떤 부분도 2N-5 전 정리 금지.
7. **historical 기록 삭제** — decision_log·reviews·planning·samples는 감사 추적성 자산이다.
   current_status 압축도 **이동만** 허용(A-1), 삭제·요약 대체는 Q.
8. **artifact 방어 완화** — .gitignore 방어·repo 밖 생성 원칙·cleanup 테스트·무디스크 래스터 설계.

## 6. 2N-5 프롬프트에 반영할 단순화 원칙 (Codex 2N-4M carry-forward 포함)

- 실행 환경 고정 명시 + **Python 호출 규약**(bare `python`은 Codex 세션에서 WindowsApps stub 실패 —
  절대 경로 규약, C2N4M-OBS-01/2N-4H "반드시" 이월).
- 테스트 플랜 = **quickstart §7의 15 시나리오**를 그대로 사용(새 시나리오 체계 발명 금지 — 문서가
  이미 source of truth).
- **no-overclaim check를 생성 산출물에도** 적용(4M report §5 체크리스트 재사용 — repo 텍스트만이 아니라
  생성 보고서 본문 검사).
- 생성 산출물 품질 점검 포함(가독성·인용 품질·한계 공시 — §7 규칙).
- provider명(Kordoc/tesseract)·로컬 경로·내부 사이클명·하네스 용어가 사용자 보고서에 미노출인지 확인.
- 실 스캔 evidence로 page cap/timeout/DPI 기본값 **관찰만**(2N-5 중 재설계 금지 — 기록 후 별도 결정).
- packaging policy의 `src/intake/` 포함 명시는 **제출 단계 항목**으로 유지(2N-5 범위 아님 — C2N4M-OBS-03).
- 시나리오별 실행/차단/승인거부를 구분 기록하고, 차단된 시나리오를 성공으로 쓰지 않는다(2N-4H 원칙 재확인).

## 7. Risk assessment

- **지금 단순화를 전혀 안 할 때의 리스크(낮음)**: 문서 탐색 비용 지속 — 2N-5는 가능하나 프롬프트
  작성·심사자 이해에 마찰. A 2건이 이를 해소.
- **A만 할 때의 리스크(아주 낮음)**: 문서 이동 실수로 링크 깨짐 — narrow Codex review + 링크 확인으로
  방어. 코드 무접촉.
- **B를 2N-5 전에 할 때의 리스크(중간)**: 리뷰 통과 runner 3표면 동시 churn → 회귀·재리뷰 비용이
  이득(중복 ~100줄 제거)을 초과. **비권고 근거.**
- **C/D를 지금 할 때의 리스크(높음)**: 계약·경계 재개방 → 2N-5 일정과 신뢰 기반 모두 훼손.

## Final Report

- **전체 verdict**: **DO_A_ONLY_BEFORE_2N_5**
- **현재 구조 복잡도 판단**: 코드·테스트는 적정(경계 명확·리뷰 체인 완비 — 2N-5 위협 없음). 복잡성의
  중심은 문서 탐색 비용(current_status 680줄·현재 Cycle bullet 52개·md 149개) — 정합성 문제는 아님
  (4M 정렬·Codex PASS 직후).
- **가장 큰 복잡성 원인**: §3 — ① current_status 이력 누적 ② source-of-truth 지도 부재 ③ runner
  의도적 중복(문제 아님) ④ npm 실행 비대칭(관찰 항목) ⑤ 테스트 helper 중복(경미).
- **품질 보존 기준**: §4 — degrade 1개라도 있으면 2N-5 전 후보 제외(전 후보에 적용).
- **A/B/C/D/Q 분류**: §5 — A 2건(이력 분리·source-of-truth 지도), B 3건(전부 2N-5 후 권고),
  C/D 명시, **Q 8항목**(경고 축소·§6 완화·승인 통합·fallback 삭제·provenance 축소·테스트 축소·
  이력 삭제·artifact 방어 완화 — 절대 금지).
- **2N-5 전에 실제로 할 것**: A-1(현재 Cycle 압축 — 무손실 이동+링크) + A-2(docs source-of-truth
  지도 1페이지). 각각 좁은 사이클 + Codex narrow review 권장. 이 2건 외에는 **아무것도 고치지 않는
  것이 최선**.
- **2N-5 전에 하지 말아야 할 것**: §5 B·C 전부(코드 중복 제거 포함 — review-passed 표면 churn).
- **절대 금지(품질 저하)**: §5 Q 8항목.
- **2N-5 프롬프트 반영 원칙**: §6 — 환경/Python 규약 고정·15 시나리오 재사용·산출물 no-overclaim
  check·provider명/경로 무노출 확인·bounded 기본값은 관찰만.
- **source of truth 정리 제안**: A-2 지도 1페이지(현재-facing 5종 vs historical 3계열 구분 명시).
- **문서 구조 정리 제안**: A-1(이동만)·대규모 IA 재편은 D.
- **코드 구조 정리 제안**: 없음(2N-5 전) — B-1/B-2/B-3 전부 2N-5 후 + Codex review 전제.
- **테스트 구조 정리 제안**: 없음(2N-5 전) — helper 추출은 D.
- **risk assessment**: §7.
- **recommendation**: 이 audit 확인(ChatGPT/사용자) → A-1+A-2를 좁은 문서 사이클로 수행(+Codex
  narrow review) → **2N-5 프롬프트 작성**(§6 원칙 반영) → 2N-5 재진입. B 이하는 2N-5 evidence 이후
  backlog로.
- **scope compliance**: 읽기·검색·메트릭 수집만 — 코드/문서/테스트/current_status/decision_log 수정 0,
  설치/다운로드/OCR·rasterizer 실행 0, 2N-5 실행 0, 커밋은 본 보고서 1개.
- **verification**: `git diff --check` clean · `git status --short` = 본 보고서만 · 메트릭(파일별
  wc·문서 계수·중복 grep — defaultExec ×3·CLI 경계 ×3·runMain ×3·현재 Cycle bullet 52 실측).
