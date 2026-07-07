# Post-2N-5 최종 보완 계획 — C안(Node 단일 런타임) 단독 (Cycle 2N-6 Plan)

> **성격**: 계획 문서다(구현 아님). 세 입력을 통합했다 — ① Claude 기능 검토(파이썬 없는 사용자 환경에서
> core 출력 절반 부재), ② GPT의 Python-free 품질 보완 판단(카탈로그·생성 절차·quote 검증·hard stop),
> ③ **Codex 2N-5 black-box 실행 evidence(INCONCLUSIVE — PASS 8 / BLOCKED 6 / FAIL 0, Major 3건)**.
> **사용자 결정: C안 단독** — portable Python 다리(B안)는 채택하지 않으며, core의 Node 이식이 유일한
> 런타임 완결 경로다. Python core는 이식 완료까지 **개발기/parity 기준(reference)**으로만 유지한다.
>
> base commit: `18aaac13ae315b2676108582195bfcbb18d2e8ab`

## 1. C안 단독 결정의 의미

- **종착지**: 사용자 컴퓨터에 필요한 런타임은 Node 하나(시스템 Node 또는 승인 기반 portable Node — D90).
  Python은 최종 사용자 환경에 요구하지 않고, 설치도 하지 않는다.
- **과도기**: Node 이식 완료 전까지 validator/renderer/delivery/dei_producer는 Python으로만 실행 가능
  — 이 구간의 검증·harness는 개발 머신의 실존 Python(3.14.5 절대 경로) + **UTF-8 env 규약**으로 수행한다.
- **금지**: portable Python bootstrap 제작·OS Python 설치 안내·Python core의 기능 확장(이식 대상을
  키우지 않는다 — 버그/안전 패치는 예외적으로 최소만).

## 2. 2N-5 실측 결함 → 계획 항목 매핑

| 2N-5 발견 | 심각도 | 대응 항목 | 시점 |
|---|---|---|---|
| tool-cache 쓰기 거부 시 **stack trace·로컬 경로 누출**(승인 후 실행이 exit 1) | Major | **R1** — runner 공통 primitives(recordApproval/appendPrepEgress/appendRunLog/mkdir)의 fs 실패를 RunnerError로 승격 → 기존 CLI 경계에서 한국어 안내+통제된 exit(누출 0), 3 runner 공통 + 테스트 | Phase 0 (즉시) |
| **결정적 sample→findings→report harness 부재** → 시나리오 1 BLOCKED_ENV | Major | **R2** — findings 생성은 Skill/LLM 판단이므로 결정적 CLI로 만들 수 없다(Skill-first 설계의 본질). 공식 black-box 프로토콜을 "**수동 Skill-run + 산출 findings 캡처 + 스크립트化 후반부(preflight→delivery)**"로 문서 정의. 후반부 스크립트는 과도기엔 Python+UTF-8 규약, N2 이후 Node | Phase 0 문서 / Phase 2 구현 |
| **Windows Python UTF-8**(cp949 UnicodeEncodeError — dei `bbox≈` 힌트, delivery stdout 깨짐) | Major | **R3** — 과도기: 실행 규약에 `PYTHONUTF8=1`/`PYTHONIOENCODING=utf-8` 필수 명시(+선택: 스크립트 상단 stdout reconfigure 최소 패치). 근본: Node 이식(N2·N3)으로 소멸 | Phase 0 문서 / Phase 2 근본 |
| `qualitySummary.needsOcr=False`인데 ocrCandidatePages 5건(요약 boolean이 직관 배반) | Obs | **R4** — 문서에 "대상 페이지 목록이 기준, 요약 boolean 아님" 명시 + OCR runner check 표시가 이미 목록 기준임을 확인(코드 무변경) | Phase 1 |
| OCR 승인 실행·HWP-계열 승인 실행 BLOCKED(설치 승인·sandbox 제약) | — | **R5** — 재실행 환경 결정: 사용자 로컬 세션(승인 가능)에서 수행 or 해당 시나리오를 승인-경계 검증으로 한정. **사용자 결정 필요**(§7-①) | 2N-5R |

## 3. GPT Python-free 항목의 채택·통합 (Claude 검토 반영)

| 항목 | 처리 |
|---|---|
| KSSB 카탈로그 정밀화(키워드·필수 요소·partial/not_verifiable 조건·요청자료 기본값) | **채택 — Q1, 최우선**(findings 품질 지렛대) |
| findings 생성 절차 규칙 | **채택 — Q2**, 신규 파일 대신 기존 evidence_mapping_rules/SKILL 확장(문서 증식 방지 — 2N-4S) |
| quote 실재성 checklist(작성 후 원문 재탐색) | **채택 — Q3**(§7 확장) |
| 고객 질문 템플릿·요청자료 표준 목록 | **채택 — Q4** |
| preflight error hard stop | **정책만 지금 기록(Q5)** — 구현은 Python delivery 패치가 아니라 **N2(Node delivery 이식)에 내장**(이중 구현 방지) |
| Node quote checker | **채택하되 N1(Node validator 이식)에 흡수** — 원문 텍스트(선택 입력: intake.json blocks 또는 텍스트 파일) 제공 시 quote substring 검증(normalize 규칙 포함)을 optional check로 설계. 별도 도구 신설 없음 |
| 보고서 검수 표/섹션 강화 | **이식 후(N2/N4 뒤)** — 먼저 충실 이식+parity, 강화는 실 샘플 evidence 기반 1회 구현(2M-5 패턴) |
| 유형별 안내 UX·no-overclaim 강화 | 기각(이미 구현 — quickstart matrix·§7 3층·validator 스캔). prohibited 용어 목록 통합만 Q2에 포함 |

## 4. Phase 계획

### Phase 0 — 2N-5 결함 즉시 보정 (좁은 코드 patch 1사이클 + Codex review)
- **R1**: runner 공통 tool-cache/로그 쓰기 실패의 통제된 실패 처리(누출 0·baseline 안내·문서화된 exit).
  변경 표면: `hwp_assisted_runner.cjs`의 기록 primitives(+3 runner가 공유) + 신규 테스트(권한 거부 모의).
- **R2/R3 문서 절반**: black-box 프로토콜 정의 + Python UTF-8 실행 규약(quickstart 또는 신규
  `docs/blackbox_protocol.md` 1개) — 2N-5 재실행의 전제.

### Phase 1 — Python-free 품질 보완 (docs-only 1사이클 + Codex review)
- **Q1** 카탈로그 정밀화 / **Q2** 생성 절차 규칙(기존 파일 확장) / **Q3** quote checklist /
  **Q4** 질문 템플릿 / **Q5** hard stop 정책 기록 / **R4** needsOcr 요약 주의 문구.
- 게이트: Skill 지침 변경이므로 Codex review 후에만 2N-5R 투입.

### 2N-5R — black-box 재실행 (Phase 0+1 완료 후, C안 이식을 기다리지 않음)
- 정의된 프로토콜로 실 샘플 1~2종의 **sample→Skill findings→preflight→delivery 전 구간** evidence 확보
  (과도기 Python 후반부 — UTF-8 규약 하). 승인 기반 OCR/HWP 시나리오는 §7-① 결정에 따름.
- 성공 기준: 시나리오 1 해소(BLOCKED_ENV → PASS/FAIL 판정 가능), Major 3건 재발 0, 생성 보고서
  no-overclaim/품질 평가 기록.

### Phase 2 — C안 core Node 이식 (사이클 분해, 각각 golden parity + Codex review)
| 단계 | 내용 | 핵심 리스크/게이트 |
|---|---|---|
| **N1** | validator 이식(+ optional quote 실재성 검증 — 원문 제공 시) | 로직 순수·리스크 최저. parity = Python 30 체크 결과 동일 fixture 대조 |
| **N2** | delivery + renderer **HTML/MD** 이식(+ Q5 hard stop 구현) | zip 불요라 선행 가능 — 이 시점부터 파이썬 없는 사용자도 대표 문서(HTML/MD) 수령 |
| **N3** | dei_producer 이식 | canonical hash Node 구현·parity 기존재로 절반 완료. ocr_text/intake 계약 검증 이식 |
| **N4** | renderer **DOCX**(수제 zip writer — deflateRawSync·결정성) | 최대 리스크(2N-4C에서 최후 배치) — byte-parity 대신 구조·결정성 parity 기준 사전 정의 |
| **N5** | aux scanner — 이식 or "Node 경로 한계"로 확정 | XML 파서 부재로 비용 큼 — 보조 기능이라 **한계 유지 우선 검토**(사용자 결정 §7-②) |
- 공통 규율: 이식마다 Python 스위트 green 유지(reference 불변 증거) + Node 신규 스위트 + golden
  fixture 대조. 기존 Q등급 금지(2N-4S) 준수 — 검증 범위·경계 축소 없는 이식만.

### Phase 3 — 이식 후 품질 강화 (2N-5R evidence 기반)
- 보고서 검수 표/섹션 강화(단일 구현 — Node renderer에), 카탈로그 2차 정밀화, quote fuzzy matching
  검토(P2), bounded OCR 기본값 실측 보정, Python 원본 최종 처리 결정(§7-③).

## 5. 권장 순서(요약)

```text
Phase 0 (R1 patch + 프로토콜/UTF-8 규약) → Phase 1 (Q1~Q5 docs) → 2N-5R 재실행
                                            ↘ Phase 2 (N1→N2→N3→N4[→N5]) 병행 착수 가능
제출 판단: 2N-5R 통과 + 최소 N1·N2 완료를 권장선으로(미완 시 "Node 이식 진행 중·검증은 Python 규약 하" 정직 표기)
```

## 6. 불변 경계 (이 계획 전체에 적용)

무승인 설치/실행 금지·U3/U7 승인 분리·prep egress↔run no-egress·hash fail-fast·§6(OCR 유래 표기·
confirmed 단독 승격 금지)·no-overclaim·사람 최종 판단·artifact repo 밖 원칙 — 전부 불변. 2N-4S Q등급
(품질 저하 단순화 금지 8항목)은 이식 과정에도 그대로 적용된다.

## 7. 사용자/ChatGPT 결정 요청

1. **2N-5R에서 승인 기반 OCR·HWP 실 실행을 필수 시나리오로 볼 것인가** — 필수면 승인 가능한 로컬
   세션에서 실행(OCR runtime 설치 승인 포함), 아니면 승인-경계 검증(현 PASS 상태)으로 한정.
2. **N5(aux scanner)** — Node 이식 vs "Node 경로 미제공" 한계 확정(권장: 한계 확정, 후순위).
3. **Python 원본 최종 처리** — 이식 완료 후 reference 유지 vs 제거(제출 패키징 단계 결정 권장).

## Final Report

- 성격: 계획 수립만(코드·기존 문서 무변경 — 본 계획 문서 + decision/status 기록).
- 입력 통합: Claude 기능 검토 + GPT Python-free 판단(채택/통합/기각 §3) + 2N-5 evidence(Major 3·Obs 1
  전건 대응 매핑 §2).
- 핵심 결정 반영: **C안 단독**(portable Python 배제·Node 단일 런타임 종착·Python은 과도기 reference).
- 산출 구조: Phase 0(즉시 patch)→Phase 1(docs 품질)→2N-5R(재실행)→Phase 2(N1~N5 이식)→Phase 3(강화).
- 다음 단계: 본 계획의 Codex 리뷰 → Phase 0(R1) 착수.
