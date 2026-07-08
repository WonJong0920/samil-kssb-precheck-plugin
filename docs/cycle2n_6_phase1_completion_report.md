# Cycle 2N-6 Phase 1 — Completion Report (Q1~Q5·R4, Python-free 품질 보완)

> **성격**: Post-2N-5 최종 보완 계획(D92)의 **Phase 1만** 수행한 완료 보고다. Codex Phase 0 review
> **PASS**("Phase 1 entry: ready") 후 착수했으며, **docs/markdown-only** 원칙을 지켰다 — 런타임 코드
> (`.py`/`.cjs`/`.mjs`)·schema·validator·renderer·delivery·runner 구현·package 상태·generated artifact
> 전부 무변경. PASS/FAIL 최종 판정은 Codex 리뷰가 수행한다.
>
> 시작 HEAD: `efde9c083ce03ce5c06b6bb034494bf2312fc764` (pull 후 최신 원격 main 일치·clean)

## 반영 위치 판단 (문서 증식 없음)

Q1~Q5/R4 전부 **기존 문서 확장**으로 반영했다. 신규 문서는 이 완료 보고서 1개뿐이다.

| 항목 | 반영 위치 | 위치 판단 근거 |
|---|---|---|
| Q1 | `src/skills/samil-kssb-precheck/kssb_requirement_catalog.md` | 항목 정의의 단일 source of truth — 판정 기준은 항목 곁에 |
| Q2 | `evidence_mapping_rules.md` **§8** + `prohibited_terms.md`(no-overclaim 소절) | 계획 §3의 지시 그대로(신규 파일 대신 기존 규칙 문서 확장 — 2N-4S 문서 증식 방지) |
| Q3 | `evidence_mapping_rules.md` **§9** + `completion_checklist.md` 항목 | 인용 품질 규칙(§7)과 같은 문서에 두어 교차 참조 최소화 |
| Q4 | `customer_question_rules.md` **§5·§6**(기존 예시는 §7로) | 질문 생성 규칙의 기존 소유 문서 |
| Q5 | `docs/workflow_usage.md`(전달 계약) + `docs/decision_log.md` **D94** | 전달 계약의 소유 문서 + 정책 결정의 canonical 기록처 |
| R4 | `src/intake/runners/README.md`(OCR runner 항목) + `docs/blackbox_protocol.md` §2 | 작업자/evidence 작성자가 읽는 두 표면(page-set 산정 서술 바로 옆) |

## Q1 — KSSB catalog 정밀화

카탈로그에 **"항목별 상세 기준"** 섹션 신설 — 10개 항목(gov-01/02, strat-01/02, risk-01,
metric-01~04, target-01) 각각에:

- **탐색 키워드(참고)** — recall 보조임을 사용 원칙으로 못박음(키워드 불일치 ≠ 미공시, 키워드 일치 ≠ 근거 확정).
- **근거 확인 최소 요소** — "근거 문장의 존재 표시를 위한 최소 기준이며 준수·적합·인증·감사 의견이 아님"을 명시.
- **partial / not_verifiable 전형 조건** — 애매하면 보수적으로 낮은 판정 + 질문 라우팅.
- **요청자료 기본값** — Q4 질문 생성의 시작점(단일 기준은 카탈로그).

기존 "확정성 주의"(조문 미확정)는 유지하고, Cycle 1 경계에 "상세 기준은 실무 기준 정밀화이며
조문 인용 확정이 아님"을 추가했다. 정량 특칙(metric-04 에너지 단위 결합·전용 금지)은 기존 규칙과 정합.

## Q2 — findings 생성 표준 절차

`evidence_mapping_rules.md` **§8** 신설: 기준 로드 → 후보 구간 수집(키워드=recall 보조) → 인용 후보
추출(문장 경계) → 필수 요소 대조 → 판정(judgment_schema 결정 순서·보수적 하향) → 부족분·질문 생성
(Q4 템플릿+카탈로그 기본값) → quote 실재성 재검(§9) → 표현·커버리지 점검의 8단계.
말미에 **"판단 순서의 표준화일 뿐 판단 자동화·결정화가 아니다"**를 명시(blackbox_protocol §3과 동일 관점).

prohibited/no-overclaim 통합: `prohibited_terms.md`에 **"산출물 no-overclaim 표현"** 소절 추가
("전수 검토 완료"·"원문 대조 완료/자동 검증 완료"·"OCR로 원문 확인 완료"·도구 성능 주장 계열 금지).
**validator가 이 파일의 `## 금지 표현` 섹션을 런타임 파싱하므로**, 신규 소절이 그 섹션 밖(파서가
다른 `## ` 라인에서 수집을 멈추는 위치)에 있음을 코드로 확인하고 validator 테스트를 재실행해 검증했다(§검증).

## Q3 — quote 실재성 재검수 checklist

`evidence_mapping_rules.md` **§9** 신설: confirmed/partial의 모든 quote에 대해 ① 원문 재탐색
(verbatim — 허용 정규화는 공백·줄바꿈뿐, 의역·합성은 실재 아님) ② 재발견 실패 시 유지 금지
(수정 또는 anchor 제거+판정 재적용 → anchor 0이면 not_verifiable+질문) ③ 위치 일치 ④ 항목 적합성
⑤ OCR 유래 quote의 §6 재확인. **한계 명시**: 작성자 자기 점검이며 자동 확정이 아니고,
컨설턴트 검수·blackbox_protocol §3-(b) 표본 확인(사람)을 **대체하지 않는다** — §3-(b)에도 역방향
정합 문장을 1줄 추가했다. `completion_checklist.md`에 §8/§9 점검 항목 추가, SKILL.md 절차에 9단계로 연결.

## Q4 — 고객 질문 템플릿 / 요청자료 표준

`customer_question_rules.md` **§5** 상황 유형별 표준 템플릿 6종(확인 불가/정량 수치 부족/구체성 부족/
상충/판독 불가/조건부 적용 확인 — 질문·질문사유 쌍, 사유-상황 일치 규칙 재확인) + **§6** 공통 요청자료
분류 4종(규정·체계/활동 기록/산정·데이터/판독 대체 — "항목별 기본값의 단일 기준은 카탈로그" 명시,
고객 보유 문서 우선 원칙). 확인 불가·부분 근거·자료 부족·판독 불가가 전부 질문·요청자료로 라우팅되는
경로가 §6(라우팅)·§8(절차)·카탈로그(기본값)로 닫힌다.

## Q5 — preflight error hard stop 정책 (기록만)

**D94** 기록 + `workflow_usage.md` 전달 계약에 정책 문단 추가:

- **정책**: preflight error ≥ 1이면 delivery는 대표 문서를 생성하지 않고 통제된 중단(한국어 안내·
  raw 출력/내부 경로 미노출·문서화된 종료 코드). warning은 기록 후 진행(현행 유지).
- **구현 시점**: **N2(Node delivery 이식)에 내장** — 과도기 Python delivery는 **무변경**
  (이중 구현 방지, D92 ③). Python 패치·임시 구현 없음(이번 diff에 `.py` 변경 0).
- **과도기 커버**: SKILL Workflow 2단계("error 보완 후 렌더") + blackbox_protocol §3-(a)(error 0이어야 PASS).

## R4 — needsOcr 해석 기준

`src/intake/runners/README.md`(OCR runner 항목)와 `docs/blackbox_protocol.md` §2-4에 명시:
OCR 대상 여부의 기준은 intake의 **대상 페이지 목록**(`pageQuality[].needsOcr` ∪ `ocrCandidatePages`)이며
`qualitySummary.needsOcr` **요약 boolean 단독 판단 금지**(2N-5 실측: 요약 False인데 후보 5페이지 존재).
runner 로직은 이미 목록 기준으로 동작하므로 **코드 무변경** — 해석 기준 문서화만.

## 최소 docs hygiene (부수)

- `docs/current_status.md`: Phase 1 bullet 추가 + 리뷰가 종결된 구 current-cycle bullet 3건
  (2N-4L·2N-4M·2N-4S/4S-A — 각 Codex review PASS)을 `docs/history/current_status_archive_2n.md`로
  **무손실 이동**(2N-4S-A 방식 그대로 — 본문 무수정, archive에 이동 출처 명기).
  계획 리뷰 OBS-01(구 bullet 정리)의 이행이다.
- `docs/README.md` 지도: blackbox_protocol(2N-5R 기준 문서)·카탈로그 상세 기준 라인 추가,
  archive 범위 표기(2B~2N-4S-A)·D 범위 표기 갱신.

## blackbox_protocol 정합성 확인 (2N-5R evidence discipline과 충돌 없음)

- §8/§9는 Skill-run **내부**의 작성 규칙이다 — 프로토콜의 캡처 요건(프롬프트·HEAD·입력·findings hash)과
  판정 기준(§3)은 무변경. §3-(b) 사람 표본 확인은 §9 자기 점검으로 **대체되지 않음**을 양쪽에 명시했다.
- R4 문구는 §2-4(OCR 단계)의 기록 규칙으로 추가 — 기존 단계·판정 기준과 충돌 없음.
- Q5 정책은 §3-(a)와 동일 방향(error 0)이며 프로토콜 판정 기준을 바꾸지 않는다.

## Python runner(.py) write-failure parity — 노출 확인 (범위 밖, carry-forward)

문서상 실행 경로 확인 결과: 사용자-facing/evidence 경로는 Node runner 3종(`.cjs`)이고
`blackbox_protocol.md` §2도 Node runner 명령만 사용한다. Python runner는 reference 지위
(D85④·D92 ③·D93 ③)로 **노출 경로 없음** — 이번 diff에서 미수정, follow-up 유지
(재현 시 좁은 patch — Phase 0 보고서 carry-forward와 동일).

## 검증

| 항목 | 결과 |
|---|---|
| `git diff --check` | clean |
| `git diff --name-only` + untracked | **14개 파일 전부 `.md`**(수정 13 + 신규 본 보고서 1 — 목록은 §Changed Files) |
| 런타임 테스트 | **validator 스팟 실행**: `tests/test_findings_validator.py` **30/30 PASS**(UTF-8 규약 하) — `prohibited_terms.md`가 validator의 런타임 파싱 대상이라 문서 변경의 무영향을 실행으로 확인. 그 외 스위트는 생략 — 나머지 변경 파일은 코드가 참조하지 않는 markdown뿐(문서 변경만으로 런타임 테스트 생략) |
| 오염 스캔(node_modules/package/lock/generated `.intake.json`·`.ocr_text.json`/traineddata/archive/submission.zip/repo tool-cache) | 신규 0건 |
| no-overclaim 스캔(2N-5 PASS·OCR support complete·L2/L3 complete·provider finalization·product complete·준수 확정류) | 미부정 신규 주장 0건(금지 목록·negation·인용 문맥만) |

## 범위 준수

런타임 코드 무변경(`.py`/`.cjs`/`.mjs`/schema/validator/renderer/delivery/runner 구현 diff 0) ·
Node 이식(N1~N5) 미착수 · Python delivery 임시 hard stop 미구현 · portable Python/OS Python 안내 없음 ·
OCR runtime 다운로드/설치/실행 없음 · Kordoc 재설치/실행 없음 · package.json/lock/node_modules 없음 ·
generated 산출물/traineddata/archive/submission.zip repo 미유입 · 2N-5 PASS/OCR support complete/
L2/L3/provider finalization/product complete 선언 없음 · Claude 최종 판정 없음.

## Changed Files

- `src/skills/samil-kssb-precheck/kssb_requirement_catalog.md` (Q1 — 항목별 상세 기준)
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md` (Q2 §8 · Q3 §9)
- `src/skills/samil-kssb-precheck/prohibited_terms.md` (Q2 — no-overclaim 소절)
- `src/skills/samil-kssb-precheck/customer_question_rules.md` (Q4 — §5 템플릿·§6 요청자료 분류)
- `src/skills/samil-kssb-precheck/SKILL.md` (§8/§9·카탈로그 상세 기준 연결 — 절차 9단계)
- `src/skills/samil-kssb-precheck/completion_checklist.md` (§8/§9/템플릿 점검 항목)
- `docs/workflow_usage.md` (Q5 정책 문단)
- `docs/decision_log.md` (D94)
- `docs/blackbox_protocol.md` (R4 기록 규칙 · §3-(b) 정합 1줄)
- `src/intake/runners/README.md` (R4 해석 기준)
- `docs/current_status.md` · `docs/history/current_status_archive_2n.md` · `docs/README.md` (최소 hygiene)
- 본 보고서

## Required Follow-up / Carry-forward

- **Codex Phase 1 review** → PASS 시 **2N-5R**(`docs/blackbox_protocol.md` + D93 — 승인 기반 OCR·HWP
  실 실행 필수, 검증 대상은 승인 경로·fallback·누출 방지, complete 선언 아님).
- Python runner(.py) write-failure parity — reference 지위 유지, 재현 시 좁은 patch(위 §노출 확인).
- 카탈로그 2차 정밀화(조문 대조·산업별 확장)와 quote fuzzy matching 검토는 Phase 3(실 샘플 evidence 기반).
- N1(Node validator 이식) 시 optional quote 실재성 검증(원문 제공 시 substring check)은 §9의
  정규화 기준(공백·줄바꿈)을 구현 기준으로 참조한다(계획 §3 — 별도 도구 신설 없음).
