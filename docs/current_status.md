# 현재 상태 (Current Status)

## 운영 원칙 (고정)
- **역할 구분·보고 방식은 `AGENTS.md`와 `docs/operating_principles.md`에 고정**했다(Operating Principles Lock).
  Claude Code=작업 수행자(PASS/FAIL 판정 금지, 완료 보고는 repo 문서·채팅은 경로/SHA/push만), Codex=독립 검증자(판정·리뷰는 `docs/reviews/`),
  ChatGPT=작업 분기 판단, User=외부 앱/CLI 상태 검증·최종 제출 판단. 모든 Claude/Codex 프롬프트는 두 문서를 먼저 읽는다.

## 현재 Cycle
- **Cycle 2N-6 Phase 0 — R1·R2·R3 (2N-5 Major 3건 보정)**(좁은 patch + 문서. Codex 계획 리뷰 **PASS**
  후 착수, 사용자 결정 3건 = **D93** 기록). **R1**: tool-cache/로그/out-dir **쓰기 실패의 통제된 실패**
  — 공통 기록 primitives를 guardedWrite로 승격(경로 미포함 한국어 안내 + baseline fallback + exit 7),
  3 runner에 main 래퍼(프로그램/CLI 양쪽 수렴, 기존 계약 무변경), **승인 기록 실패 시 설치/실행 미시작**
  (감사 추적 보존). 신규 테스트 **8/8**(권한 실패 mock — 실제 tool-cache 무접촉, CLI subprocess로 2N-5
  실측 결함 직접 재현: 종전 exit 1+stack → exit 7·누출 0). **R2**: `docs/blackbox_protocol.md` — 수동
  Skill-run+후반부 스크립트 프로토콜, 시나리오 1 PASS/FAIL/BLOCKED 판정 기준(LLM 비결정성 명시).
  **R3**: PYTHONUTF8 규약 문서화 + dei/delivery CLI 진입점 UTF-8 최소 가드(강제 cp949 실검증 —
  2N-5 crash 케이스 exit 0). 회귀: Node 39/21/29/11+신규 8 · Python 83/34/11/22/30/49/29/26 전부 green.
  보고: `docs/cycle2n_6_phase0_completion_report.md`. Node 이식(N1~) 미착수·portable Python 없음·
  2N-5 PASS 선언 아님. **다음 = Codex Phase 0 review → Phase 1(Q1~Q5 docs) → 2N-5R**(D93: 승인 기반
  OCR·HWP 실 실행 필수 — complete 선언 아닌 승인 경로·fallback·누출 방지 검증).
- **Cycle 2N-6(계획) — Post-2N-5 최종 보완 계획 수립, C안 단독**(계획 문서만 — 코드 무변경. **D92**).
  입력 3종 통합: Claude 기능 검토(파이썬 없는 사용자 환경에서 core 출력 절반 부재) + GPT Python-free
  품질 판단(카탈로그·생성 절차·quote 검증 채택, hard stop은 Node delivery 이식에 내장, quote checker는
  Node validator에 흡수) + **Codex 2N-5 black-box evidence(INCONCLUSIVE — PASS 8/BLOCKED 6/FAIL 0,
  Major 3: tool-cache 쓰기 실패 누출·harness 부재·Python UTF-8)**. **사용자 결정 = C안 단독**: portable
  Python 배제, core Node 이식(N1 validator→N2 delivery+HTML/MD→N3 dei→N4 DOCX→N5 aux 결정)이 유일한
  런타임 완결 경로, Python core는 과도기 parity reference. 순서: **Phase 0**(R1 tool-cache 실패 통제
  patch + black-box 프로토콜·UTF-8 규약 문서) → **Phase 1**(Q1~Q5 Python-free 품질 docs) → **2N-5R
  재실행** → **Phase 2**(N1~N5 이식, golden parity+Codex review) → Phase 3(검수 표 강화 등).
  사용자 결정 요청 3건(OCR/HWP 실 실행 필수 여부·N5 aux 처리·Python 원본 최종 처리). 계획:
  `docs/planning/post_2n5_final_remediation_plan_node_only.md`. **다음 = 계획 Codex 리뷰 → Phase 0 착수.**
- **Cycle 2N-4S / 2N-4S-A — Quality-preserving Simplification Audit + A-only Documentation Hygiene**
  (읽기 전용 audit + 문서 hygiene만 — 코드/테스트/안전 경계/§6/Skill 무변경). 2N-4S audit verdict =
  **DO_A_ONLY_BEFORE_2N_5**(`docs/reviews/claude_cycle2n_4s_whole_project_quality_preserving_simplification_audit.md`
  — B/C/D는 2N-5 후로, **Q등급 "품질 저하 단순화 금지" 8항목** 명시). 2N-4S-A 수행: **A-1** 이 문서의
  과거 사이클 이력(2N-4K 이하 bullet 49건 + 2B~2I 과거 섹션)을 `docs/history/current_status_archive_2n.md`로
  **무손실 이동**(삭제·요약 없음 — 이동 본문 byte-identical 검증) / **A-2** `docs/README.md`
  source-of-truth 지도 1페이지 신설(현재-facing vs historical 구분). OCR support complete·L2/L3 complete·
  provider finalization·2N-5 통과 아님. **다음 = Codex 2N-4S-A narrow review → 2N-5 프롬프트 작성
  (실행 환경·Python 호출 규약 명시, quickstart §7 15 시나리오 기반) → 2N-5 재진입 판단.**
- **Cycle 2N-4M — Integration Documentation Alignment + No-overclaim Review**(문서 정렬만 — 코드 무변경.
  Codex 2N-4L review **PASS**의 "required fixes before 2N-5" 이행). 정렬 원칙 8문장(core는 OCR 자동 실행
  안 함 / Kordoc-first·OCR은 승인 기반 assisted 경로 / OCR=ocr_supplement 전용 보조 재료·confirmed 단독
  승격 없음 / no-egress=프로세스 수준 provenance / native는 tool-cache 격리 / 실패·거부=baseline / 최종
  판단=사람)으로 사용자-facing 7개 표면 통일: **quickstart**(matrix 3행 재작성 — 텍스트 PDF에 구조 보강
  선택·혼합/스캔 PDF에 최소 OCR 경로, 상태 구분·승인 흐름 OCR 별도 승인 문단·**시나리오 12→15**),
  **README**(요약 3줄·트리 주석·구현 상태), **SKILL Inputs·§6**(문구만 — 행동·인용 규칙 무변경),
  **intake README·workflow_usage**. stale 제거: "플러그인 내 OCR 실행 미구현"류 5개소 → "core는 OCR을
  자동 실행하지 않음 + 승인 기반 로컬 assisted runner의 최소 page-set 경로". no-overclaim checklist +
  2N-5 재진입 기대조건 15 시나리오 문서화(실행 안 함). 전 테스트 재실행 green(Node 29/21/39/11 ·
  Python 11/49/83/29 — 문구 변경의 무해성 증명). decision_log 무변경(신규 결정 없음 — D91/plan §8 집행).
  보고: `docs/cycle2n_4m_integration_documentation_alignment_report.md`. **OCR support complete·L2/L3
  complete·provider finalization·2N-5 통과 아님 — Codex 2N-4M review 전까지 최종 승인 아님.**
  **다음 = Codex 2N-4M integration/documentation review → 2N-5 재진입 판단**(2N-5 프롬프트에 실행 환경·
  Python 호출 규약 명시 필요 — 2N-4H 이월).
- **Cycle 2N-4L — Minimum Page-set OCR Implementation**(코드 — 사용자 승인 하 구현. Codex 2N-4K evidence/
  Gate B review **PASS**(Gate B = **ACCEPT WITH CONDITIONS**) 후 착수). 신규 `pdf_ocr_runner.cjs`+
  `pdf_ocr_exec.mjs`: intake needsOcr 신호에서 **page-set 산정**(mixed=needsOcr∪ocrCandidatePages·
  scan-only=자연히 all pages·user-range=**부분집합 제한**·빈 집합=정중 종료) → **별도 승인**(U7 — npm+
  raw.githubusercontent.com **두 출처 분리 고지**) → tool-cache 별도 항목(`ocr-runtime@tesseract.js-7.0.0`,
  Kordoc과 분리) pin 설치 + **5종 exact version·skia native·traineddata 2종 SHA-256 매 실행 전 검증
  fail-fast**(불일치=정리 후 baseline) → nethook(block) 하 bounded 실행(cap 50/batch 5/120s/300dpi·
  로컬 standardFontDataUrl·**ink-coverage blank guard**·래스터 이미지 디스크 미기록) → 모든 페이지 완료 후
  **`<stem>.ocr_text.json` 원자적 1회 방출**(기존 ingest 계약 그대로 — Node canonical hash는 Python 규칙과
  **golden parity**, confidence/ink_ratio는 additive metadata만·ocr_supplement 전용 합류·confirmed 승격
  없음). **Gate B 조건 10개 전부 코드+테스트 반영**(보고서 §4 이행표). 실측 보정 1건: Windows `.cmd` spawn
  EINVAL → npm-cli.js 직접 실행. **실 E2E 검증**(repo 밖 temp tool-cache·전량 삭제): 실 설치+traineddata
  hash 검증→U3 분리→nethook 하 3p OCR 7.9s **no_egress_verified=true**→실 artifact가 Python ingest
  (`ocr_supplement`) 합류 rc 0(실전 hash parity). 테스트: 신규 OCR runner **29/29**+parity **11/11** +
  회귀(router 21·runner 39·bootstrap 11·Python 49/83/29) 전부 green. 보고:
  `docs/cycle2n_4l_minimum_page_set_ocr_implementation_report.md`. **OCR support complete·L2/L3 complete·
  provider finalization·2N-5 통과 아님 — Codex 2N-4L implementation review 전까지 최종 승인 아님.**
  **다음 = Codex 2N-4L implementation review → 2N-4M(사용자 문서 일괄 갱신·no-overclaim 재점검) → 2N-5
  재진입 판단.**

## 사이클 이력 (archive)

- **2N-4K 이하 전체 사이클 bullet(49건)과 과거 섹션(2B~2I·사이클 이력 요약·문서 템플릿 정비)은
  `docs/history/current_status_archive_2n.md`로 무손실 이동했다**(2N-4S-A — 기록 보존, 현재 문서 탐색성 개선).
  각 사이클의 리뷰 verdict·commit·required fixes 기록은 archive에서 그대로 찾을 수 있다.

## 미완료 / 이후 사이클 (의도적 제외)
- 인용 실재성(quote가 실제 입력 자료 원문인지)은 자동 검출 불가 → 사람 검수 유지(경량 검증 밖).
- workflow는 **문서상 사용 계약**으로 정합(Cycle 2E). 런타임 자동 배선(Hook/MCP 등)은 하드 요건 확정 시에만 재검토.
- 실제 샘플(PDF/OCR/문서 파싱) 실행·submission.zip 패키징·산업별 지표 확장.

## 보류 (확정하지 않음)
- **logs 원본 제출 방식**: repo 커밋 vs submission.zip 번들만 — **제출 패키징 단계에서 결정**(현재 미확정).
  결정 기준·잠정 권장(zip-only)·민감정보 스캔 필요성은 `docs/submission_packaging_policy.md` §2에 정리(최종 확정은 제출 단계).
- 샘플 실행 산출물의 zip 포함 여부(저작권·식별정보 검토 후 결정), 실제 submission.zip 생성.

## GitHub / 검증 상태
- repo: https://github.com/WonJong0920/samil-kssb-precheck-plugin (owner `WonJong0920`, branch `main`).
- 각 사이클은 push 후 **ChatGPT 확인 대기**로 종료한다. 현재 위치와 다음 단계는 위 "현재 Cycle" 참조
  (과거 사이클별 당시 "다음 단계" 기록은 `docs/history/current_status_archive_2n.md`에 보존).
- 최종 검증·PASS/FAIL 판정은 **Codex**가 수행한다. 검증 기준은 `docs/validation_criteria.md` 참조.
- 최종 commit SHA는 자기참조 문제로 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.
