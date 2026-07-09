# 현재 상태 (Current Status)

## 운영 원칙 (고정)
- **역할 구분·보고 방식은 `AGENTS.md`와 `docs/operating_principles.md`에 고정**했다(Operating Principles Lock).
  Claude Code=작업 수행자(PASS/FAIL 판정 금지, 완료 보고는 repo 문서·채팅은 경로/SHA/push만), Codex=독립 검증자(판정·리뷰는 `docs/reviews/`),
  ChatGPT=작업 분기 판단, User=외부 앱/CLI 상태 검증·최종 제출 판단. 모든 Claude/Codex 프롬프트는 두 문서를 먼저 읽는다.

## 현재 Cycle
- **Cycle 2N-6 Phase 3-D — 검증 프로토콜 Node 정렬 + trace manifest evidence 규약 문서화 closure**(문서 전용 —
  코드·테스트·schema·package 무변경. Codex Phase 3-D review **PASS**
  (`docs/reviews/codex_phase3d_validation_protocol_node_alignment_review.md` — Critical/Major 0·required fixes
  없음, Minor **P3D-MIN-01**(blackbox stale `§6` 참조)은 비차단 carry-forward) 후 집행). target commit `2652d3e`·
  review commit `b0e325a`. `docs/blackbox_protocol.md` 후반부 실행을 **Node 런타임**(dei_producer.cjs·
  kssb_report_delivery.cjs, D94 hard stop) 우선으로 정렬하고 Python은 golden parity reference로 병기(제거·CLI
  회귀 아님 — D93③). **trace manifest를 delivery-segment 한정 evidence로 문서화**(findings canonical hash·
  preflight counts·산출물 hash·self-hash, OBS-01=exit 0≠capture 성공→파일/API/`--debug` 확인·OBS-02=upstream
  end-to-end는 v1 밖). **quote 실재성 opt-in 경계**(additive·기본 off·warning·사람 검수 비대체)를 workflow_usage·
  blackbox §3-b에 명시. **closure ≠ 제품 완성·2N-5 통과·OCR complete·provider finalization·submission readiness.**
  결정: **D97**. 보고: `docs/phase3d_validation_protocol_node_alignment_completion_report.md`.
  **다음 = Phase 3-C docs-first cleanup**(검수 표 서식·runtime drift·P3D-MIN-01 정리) → 그 Codex review.
  **Phase 3-B validator 구현은 별도 범위·별도 승인·별도 review 대상으로 유지.**
- **Cycle 2N-6 Cycle C — trace manifest delivery-terminal stage 구현 closure**(문서 전용 — 코드·테스트·
  스키마·package 무변경. Codex implementation review **PASS**
  (`docs/reviews/codex_cycle2n_6_trace_manifest_implementation_review.md` — Critical/Major/Minor 0·
  **required fixes 없음**) 후 집행). Node delivery 종단(성공 경로)에 **opt-in·기본 off** provenance stage를
  붙인 구현(commit `616ce88`)을 완료·review PASS로 정리한다. `run_manifest.json`은 `--manifest`/
  `{manifest:true}`일 때만 생성되는 **내부 provenance artifact**(대표 문서 아님·기본 산출물 아님, `.gitignore`
  방어)로 findings canonical-JSON hash·preflight code/severity 요약·산출물 basename/bytes/sha256·self-hash만
  담고, 판정/품질/감사·인증류 필드·로컬 경로·계정명·stack·timestamp는 담지 않는다. **D94 hard stop 시
  미생성**(산출물 0 정책 불변), 생성 실패는 delivery 성공을 깨지 않고 안전 error만 남긴다(user_summary·exit
  code·기본 3파일 출력은 on/off 무관 불변, hook/dispatcher 아님). **Python reference·N5 aux 한계 유지**
  (manifest는 Node-only 신규 stage — Python parity 비대상). **closure ≠ 제품 완성·2N-5 통과·OCR complete·
  provider finalization·submission readiness.** carry-forward observation 2건(비차단): ① CLI exit 0만으로
  manifest capture 성공을 의미하지 않으므로 evidence는 파일 존재·API 반환·`--debug`로 상태를 명시 확인해야
  한다, ② upstream intake/OCR/runner end-to-end provenance 연계는 v1 범위 밖·후속 별도 사이클 후보(이 v1
  패치에 편승 금지). 결정: **D96**. 보고: `docs/cycle2n_6_trace_manifest_stage_completion_report.md`.
  **다음 = Phase 3 validation strengthening(검수 표 강화 등 — 별도 사이클·Codex review 게이트 유지).**
- **Cycle 2N-6 Phase 2 — core Node migration closure + N5 limitation**(문서 전용 — 코드 무변경.
  Codex N4 review **PASS**("N1~N4 core Node migration can be treated as closed") 후 집행). Phase 2
  core 이식을 **N1 validator·N2 delivery+HTML/MD·N3 DEI producer·N4 DOCX writer 4건 모두 Codex
  review PASS로 완료**로 정리하고, **N5 aux scanner는 Node 미이식 한계로 확정**(D93 ②의 집행 — 새
  결정 아님·중복 금지)했다. N1~N4 core Node path는 validator·DEI·delivery·DOCX/HTML/MD까지 제공하며,
  **aux scanner는 보조 교차 신호로 core report generation의 필수 조건이 아니다**(aux_signals 소비 측은
  N3에서 이미 이식 — 생성만 Python reference 전용). **closure ≠ 제품 완성·2N-5 통과·OCR complete·
  provider finalization·submission readiness**(no-overclaim 유지). Python 원본은 golden parity
  reference로 유지(D93 ③). 문서: `docs/cycle2n_6_phase2_closure_summary.md`(+ D95). N5 한계는
  `src/intake/README.md`·`src/intake/runners/README.md`에 명시.
  **다음 = 본 closure의 Codex review → workflow docs 정렬 사이클(Node=런타임·Python=reference 유지) →
  trace manifest stage 설계 사이클(별도) → Phase 3.**
- **Cycle 2N-6 Phase 2 N4 — Node DOCX writer 이식**(코드+테스트+최소 문서. Codex N3 review
  **PASS**("N4 entry: Ready") 후 착수 — Phase 2 마지막 core 이식 단계). `kssb_report_renderer.cjs`에
  `buildDocumentXml`·`docxBytes`·결정적 최소 ZIP writer(`buildDeterministicZip` — `zlib`만, 외부
  의존성 0) 추가로 Python DOCX 경로 충실 이식(8개 OOXML 파트·문구·스타일 동일, 재판정 없음).
  `renderReport`가 **DOCX → HTML → Markdown** 대표 문서 생성(primary=DOCX), Node delivery는
  **preflight → D94 hard stop → DOCX/HTML/MD** 배선(user summary DOCX 반영, `--html-only` 옵션 추가,
  D94 hard stop 동작 무변경 — error 시 DOCX 포함 산출물 0). **parity 기준 = 구조 + 파트 콘텐츠
  byte-identical + 결정성**(컨테이너 전체 byte parity는 큰 파트의 zlib 압축 스트림 차로 목표 아님 —
  허용 차이 명시 기록). 검증: 신규 DOCX **17/17** + DOCX parity **7/7**(Python 3.14.5 실측 — 8 파트
  압축 해제 콘텐츠 byte-identical, skip 0) + N2 갱신 delivery 19/6 + Node 유효성(Python `testzip` None·
  8파트 XML well-formed) + N1 43/35 + N3 61/46 + Python reference 30/34/22/83/11/26/29/49 불변 + Node
  회귀 21/39/29/8/11 전부 green. **Python renderer/delivery는 transitional reference로 무변경**(D92 ③).
  외부 의존성·package 상태 변경 0. N5 미착수. 보고: `docs/cycle2n_6_phase2_n4_docx_writer_node_completion_report.md`.
  **(후속) Codex N4 review PASS → Phase 2 core closure + N5 limitation 확정**(위 closure bullet 참조).
- **Cycle 2N-6 Phase 2 N3 — Node DEI producer 이식**(코드+테스트+최소 문서. Codex N2 review
  **PASS**("N3 entry: Ready") 후 착수). 신규 `src/intake/dei_producer.cjs`: Python reference의
  책임 5축(최소 인테이크 계약·document-level 변형·결정적 정규화·ocr_text/aux_signals additive
  ingest — **hash 실무결성 검증** 포함·내부 CLI) 전량 충실 이식(내장 모듈만 — core·runner
  미require, 판정/findings 미생성). canonical hash는 자체 구현을 golden 상수 F1~F3 + runner 함수
  직접 대조 + parity 교차 수용으로 **3중 결속**. parity 기준은 **CLI stdout/stderr 전문 일치**
  (개행 정규화만 — json.dumps sort_keys/indent=2 동등 직렬화기 이식, 오류 메시지 동일 문자열).
  검증: 신규 Node **61/61** + parity **46/46**(Python 3.14.5 실측, 성공 10·거부 34, skip 0) +
  **DEI/intake 회귀 전량 재실행**(dei 83·OCR hash 11·aux 26·nethook 29·runner 49 — N2 review
  carry-forward 이행) + N1 43/35 + N2 18/6 + Python core 30/34/22 불변 + Node 회귀 21/39/29/8/11
  전부 green. **Python `dei_producer.py`는 transitional reference로 무변경**(D92 ③).
  외부 의존성·package 상태 변경 0. N4/N5 미착수.
  보고: `docs/cycle2n_6_phase2_n3_dei_producer_node_completion_report.md`.
  **다음 = Codex Phase 2 N3 review → N4(DOCX zip writer 이식) 착수 판단.**
- **Cycle 2N-6 Phase 2 N2 — Node delivery + HTML/Markdown renderer 이식**(코드+테스트+최소 문서.
  Codex N1 review **PASS**("N2 entry: Ready") 후 착수). 신규 `src/renderers/kssb_report_renderer.cjs`
  (Python renderer의 HTML/MD 경로 충실 이식 — 섹션·문구·escape 동일, **DOCX는 N4 대상 미구현·
  placeholder 없음**) + `src/renderers/kssb_report_delivery.cjs`(findings → **N1 Node validator
  preflight** → **D94 hard stop 구현**: error ≥ 1이면 산출물 0·out-dir 미생성·sanitized 안내·exit 4 /
  error 0이면 HTML→MD 생성 + 사용자 요약 — raw 이슈·경로·stack 미노출, info/warning은 건수만).
  **Python delivery/renderer는 transitional reference로 무변경**(D92 ③ — Python hard-stop patch 없음,
  의도된 차이를 parity 테스트가 명시 기록). 검증: 신규 Node **18/18** + parity **6/6**(Python 3.14.5
  실측 — HTML/MD **전문 일치**(개행 정규화만)·구조 불변식·D94 divergence 기록, skip 0) + N1 43/35 +
  Python 30/34/22 불변 + Node 회귀 21/39/29/8/11 전부 green. 외부 의존성·package 상태 변경 0.
  N3/N4/N5 미착수. 보고: `docs/cycle2n_6_phase2_n2_delivery_html_md_completion_report.md`.
  **다음 = Codex Phase 2 N2 review → N3(dei_producer 이식) 착수 판단.**
- **Cycle 2N-6 Phase 2 N1 — Node validator 이식**(코드+테스트+최소 문서. 2N-5R evidence review
  **PASS**("Phase 2 entry: Ready") 후 착수 — D92 Phase 2의 첫 단계). 신규
  `src/validators/kssb_findings_validator.cjs`: Python reference의 검증 규칙·이슈 코드·severity·
  location·**검출 순서**까지 충실 이식(내장 모듈만 — 외부 의존성·package.json 없음). jsonschema 차이는
  **방식 A**(표준 라이브러리 검증만 + fallback 동등 info — 숨김 없음). additive로 **기본 꺼짐** quote
  실재성 보조 점검(`--source-text` 명시 제공 시만, 미발견=warning — 사람 검수 대체 아님, Python 미확장).
  검증: **parity 35/35**(동일 fixture 30종으로 Python CLI 실측 대조 — exit·개수·순서 포함
  severity/code/location 전량 + message(예외 2종만 제외) 일치, skip 0) · Node 전용 **43/43** ·
  Python reference **30/30 불변** · delivery wiring 34 · Node 회귀 21/39/29/8/11 전부 green.
  **Python reference 보존(diff 0)** · N2~N5 미착수 · D94 hard stop 미구현(N2 대상 유지).
  보고: `docs/cycle2n_6_phase2_n1_validator_node_completion_report.md`.
  **다음 = Codex Phase 2 N1 review → N2(delivery+HTML/MD 이식, D94 내장) 착수 판단.**
- **Cycle 2N-5R — black-box 재실행 (실행 주체: Claude Code, evidence만 — 판정은 Codex)**
  (Codex Phase 1 review **PASS** 후, `docs/blackbox_protocol.md`+D93 기준 실행). 실 샘플 5종으로
  **승인 기반 전 구간 실행 완료**: 텍스트 PDF baseline 전 구간(sample→Skill 문서 직접 적용 findings→
  preflight error 0→**DOCX primary** delivery) + Kordoc-first 구조 보강 + **page-set OCR 승인 설치·실행**
  (대상 페이지 목록 [3,29,39,51,53] 기준 — R4 규율, no_egress_verified=true) + **스캔 전용 전 9페이지 OCR** +
  **HWP·HWPX·DOCX 승인 실행 3종**(2N-5 BLOCKED 시나리오 4·5·9·10·11 실행 완료). quote 전수 19/19
  verbatim 재발견 + 무작위 표본 5건 확인(실행자 자기 점검 — Codex 독립 재검 필요). Python은 과도기
  후반부(dei/delivery)만 UTF-8 규약 하 사용, **Python runner .py 미사용**. 2N-5 Major 3건 재발 0.
  repo 오염 0·산출물 no-overclaim/누출 0. 시나리오별 **PASS_CANDIDATE**(BLOCKED 0)로만 기록 —
  **2N-5 통과 선언 아님**. evidence: `docs/samples/codex_cycle2n_5r_black_box_execution_evidence.md`.
  **다음 = Codex 2N-5R evidence review(표본 재검 포함) → Phase 2(N1~) 진입 판단.**
- **Cycle 2N-6 Phase 1 — Python-free 품질 보완 (Q1~Q5·R4)**(docs/markdown-only — 런타임 코드·package·
  generated artifact 무변경. Codex Phase 0 review **PASS** 후 착수). **Q1**: KSSB 카탈로그에 **항목별 상세
  기준** 신설(10개 항목 각각 탐색 키워드·근거 확인 최소 요소·partial/not_verifiable 조건·요청자료 기본값 —
  키워드는 recall 보조 명시, 준수/인증형 표현 없음·조문 번호 미확정 유지). **Q2**: findings 생성 표준 절차를
  `evidence_mapping_rules.md` §8로 고정(카탈로그 대조→보수적 판정→질문→재검→표현 점검 — 판단 자동화 아님) +
  `prohibited_terms.md`에 no-overclaim 계열 통합. **Q3**: quote 실재성 재검수 checklist(§9 — verbatim
  재탐색·재발견 실패 시 유지 금지·사람 검수 대체 아님, blackbox §3-(b)와 정합). **Q4**: 상황 유형별 표준
  질문 템플릿 + 공통 요청자료 분류(`customer_question_rules.md` §5·§6 — 항목별 기본값의 단일 기준은 카탈로그).
  **Q5**: preflight error hard stop **정책만 기록(D94**, workflow_usage 전달 계약**)** — 구현은 N2 Node
  delivery에 내장, 과도기 Python delivery 무변경(D92 ③). **R4**: OCR 대상 판단은 `qualitySummary.needsOcr`
  요약 boolean이 아니라 **대상 페이지 목록 기준**임을 runners README·blackbox_protocol에 명시(코드 무변경).
  SKILL/completion_checklist 최소 연결 + 구 current-cycle bullet 3건(2N-4L·4M·4S) archive 무손실 이동.
  보고: `docs/cycle2n_6_phase1_completion_report.md`. 2N-5 PASS·OCR support complete·product complete 아님.
  **다음 = Codex Phase 1 review → 2N-5R**(`docs/blackbox_protocol.md` + D93 기준).
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
## 사이클 이력 (archive)

- **2N-4K 이하 전체 사이클 bullet(49건)과 과거 섹션(2B~2I·사이클 이력 요약·문서 템플릿 정비)은
  `docs/history/current_status_archive_2n.md`로 무손실 이동했다**(2N-4S-A — 기록 보존, 현재 문서 탐색성 개선).
  각 사이클의 리뷰 verdict·commit·required fixes 기록은 archive에서 그대로 찾을 수 있다.
- **2N-4L·2N-4M·2N-4S/4S-A bullet 3건도 같은 방식으로 추가 이동했다**(2N-6 Phase 1 최소 hygiene —
  무손실, 각 리뷰는 완료됨: 2N-4L/4M/4S-A 모두 Codex review PASS 후 종결).

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
