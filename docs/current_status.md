# 현재 상태 (Current Status)

## 운영 원칙 (고정)
- **역할 구분·보고 방식은 `AGENTS.md`와 `docs/operating_principles.md`에 고정**했다(Operating Principles Lock).
  Claude Code=작업 수행자(PASS/FAIL 판정 금지, 완료 보고는 repo 문서·채팅은 경로/SHA/push만), Codex=독립 검증자(판정·리뷰는 `docs/reviews/`),
  ChatGPT=작업 분기 판단, User=외부 앱/CLI 상태 검증·최종 제출 판단. 모든 Claude/Codex 프롬프트는 두 문서를 먼저 읽는다.

## 현재 Cycle
- **Cycle 2N-3A — nethook Coverage Patch**(Codex 2N-3 **CONDITIONAL PASS**의 **C2N3-MAJ-01** 해소 — narrow patch). 보정:
  ① **host 추출 일관화** — net/tls option object의 `host`/`hostname`/`servername` 모두 처리(누락 시 loopback 오인 차단), http(s)는
  URL 객체 포함 `hostname` 우선, **로컬 IPC(`path`/named pipe)와 host-부재 option은 loopback 취급 허용**(원격 호스트명에 경로 구분자가
  올 수 없어 안전 — 판단 불가 형태는 fail-closed 유지). ② **DNS 커버리지 전면 확장** — callback+**promises**+**Resolver(양쪽 prototype)**의
  lookup·resolve-family 전체(resolve/4/6/Any/Cname/Caa/Mx/Naptr/Ns/Ptr/Soa/Srv/Txt·reverse) 패치, **claim=patch 범위 일치** 원칙으로
  README에 커버 범위·한계(dgram·child_process·native raw syscall 미차단 — 프로세스 레벨) 정직 표기. ③ 요약 형식·provenance 정책 불변
  (`no_egress_verified=true`는 요약 실관측+egress 0에만 — 느슨해진 것 없음). ④ 테스트: nethook 12→**29/29**(option object 4형태·
  http hostname/URL 객체·DNS 7형태(cb/promises/Resolver)·IPC/loopback 허용 — 전부 **pre-call throw라 외부 트래픽 0**) +
  **pytest 래퍼 추가**(C2N3-MIN-01 — standalone 실행 계속 지원, 단 이 환경에 pytest 미설치라 수집은 미확인). runner 48/48·기존 5종 green 유지.
  **다음 = Codex 2N-3A patch review → 2N-4 assisted retest.** OCR/rasterizer/portable Node는 gated 유지, provider finalization·L2 완료 아님.
- **Cycle 2N-2 — HWP-first Narrow Implementation**(코드 — **runner skeleton 구현. full HWP+OCR+portable Node는 여전히 미구현/gated,
  provider finalization 아님, L2 전체 완료 아님**). 2N-1A scope대로 구현: ① **`src/intake/runners/hwp_assisted_runner.py`**(source-only,
  stdlib) — check/plan 모드, **무승인 설치/실행 금지**(승인 플래그 없으면 한국어 승인 문구 출력 후 종료, exec 호출 0 테스트 증명),
  HWP/HWPX/DOCX 외 확장자 정중 종료, Node 부재 시 설치 안내+baseline 수렴(**portable Node 미제안**), repo 밖 tool-cache
  (`npm --prefix`·**`--omit=optional` 필수**·pin kordoc@3.13.0+pdfjs-dist@4.10.38·global/npx 미사용), 준비 egress 기록(prep_egress_log.jsonl)·
  승인 marker(approvals.json)·run 로그 전부 tool-cache 내부, `--out-dir` 필수+repo 내부 경고, artifact 규약 `<stem>.intake/.aux_signals.json`
  (**ocr_text는 HWP-first 범위 밖 — 미생성**), HWPX/DOCX는 aux 스캐너 in-process 연계. ② **`nethook.cjs`**(source-only, AVR-04 사양) —
  dns/net/tls/http/https 차단(비-loopback은 **패킷 발신 전 기록 후 throw**)·worker_threads 전파·`[NETHOOK-SUMMARY]` 요약.
  **`no_egress_verified=true`는 훅 요약 실관측+egress 0인 실행에만**(미관측=false, evidence 모드=실패). ③ `.gitignore`에 artifact 3패턴 방어.
  ④ 테스트: 신규 **runner 48/48**(승인 게이트·builder·prep log·provenance 정책·한국어/공백 파일명·UTF-8·core 미참조/미import — 전부 mock·tmp,
  실제 설치/실행/네트워크 없음) + **nethook 12/12**(실 Node로 차단·worker 전파·요약 — 외부 트래픽 없음: block은 pre-connect throw) +
  기존 5종 무수정 green(30/22/34/56/26). repo 루트 package.json/lock/node_modules 없음·실제 홈 tool-cache 미생성 확인.
  **다음 = Codex 2N-3 구현 리뷰.** OCR/rasterizer/tesseract.js/portable Node는 gated 유지.
- **Cycle 2N-1A — HWP-first Scope Decision**(scope decision 문서만 — 구현·설치·실행 없음). Codex 2N-1 **CONDITIONAL PASS**(C2N1-MAJ-01:
  full HWP+OCR+portable Node 2N-2는 blocking / 문서화된 HWP-only slice는 non-blocking)에 대응해 **2N-2 = HWP-first narrow implementation으로 확정**.
  U1~U8 처리: U1(외부 tool-cache·kordoc pin만)·U3(설치 1회+실행 세션/실행 단위 승인, marker는 tool-cache)·U4(runner source-only 커밋, zip 포함은 후보)·
  U5(3층 provider명 정책)·U6(결정성 2회=evidence 한정)·U7(HWP/OCR 승인 분리) **확정**, U2=**A안 확정**(portable Node B는 gated),
  U8=**scope-out**(rasterizer spike·native 수용·Gate B 재검토는 OCR 경로 착수 전 별도 게이트). 2N-2 포함/제외 범위 명문화(OCR·tesseract.js·traineddata·
  rasterizer·portable Node·OS installer 전부 제외). HWP-first에도 남는 검증 조건(AVR-04 nethook·AVR-05 Windows/UTF-8·AVR-06 artifact 낙하 방지 + 조건부 AVR-07) 이관.
  **C2N1-MAJ-01: narrowed scope 조건 대응 완료 / full scope blocking 유지.** 문서: `docs/planning/cycle2n_1a_hwp_first_scope_decision.md`.
  **다음 = Claude 2N-2 HWP-first implementation**(§10 제약 반영).
- **Cycle 2N-0B-A — Node/npm 부재 UX 설계 보정**(설계 문서 보정만 — 코드/설치/실행 없음). U2를 3안 구조로 보정:
  **A** 설치 안내+baseline 계속(기본 안전 fallback) / **B** 사용자 승인 후 repo 밖 tool-cache에 **portable Node**(nodejs.org 공식 zip 해제만 —
  **OS installer 미실행·PATH 영구 수정 없음·관리자 권한 불요·폴더 삭제로 제거**, SHASUMS256 검증·LTS pin·win-x64 한정·시스템 Node 우선 탐지) /
  **C** OS installer 실행·PATH 영구 수정 = **배제 확정**. "Node 자동 전역 설치"와 "portable Node 설치"를 명확 구분(§7.1).
  B안은 별도 후보로 포함하되 **2N-1 Codex 리뷰(쟁점 8번 신설)에서 보안·제출 정책·"외부 상태 변경은 사용자 직접" 원칙과의 양립 확인 후 사용자 결정**.
  B 실패·거부·AV 차단은 전부 A로 수렴(§14). 문서: `docs/planning/cycle2n_0b_runner_provider_ux_design.md` §7.1·§13 U2·§15·§16-8 보정.
- **Cycle 2N-0B — Runner / Provider UX 설계**(설계 문서만 — **구현 아님**, provider 설치·실행·샘플 재실행 없음. runner/provider/OCR/provider finalization 여전히 pending).
  2N-0A U1~U8을 선택지 비교+권고안+**사용자 결정 필요** 분리로 설계: ① 외부 전용 **tool-cache**(버전 디렉터리+approvals/prep-egress marker — repo package.json 미생성) 권고,
  ② **HWP/OCR 이중 경로 분리 승인**(HWP=Kordoc만·기검증·저리스크 → 구현 선행 권고 / OCR=+rasterizer+traineddata), ③ 준비 egress↔실행 no-egress 분리(nethook 재작성·커밋은 2N-2),
  ④ **hash는 Python 헬퍼 주입**(canonical 규칙 단일 소스 — Node 교차 언어 위험 제거), 결정성 2회는 evidence 모드 한정, ⑤ 단일 문서 CLI+`--out-dir` 필수+`.gitignore` artifact 방어,
  ⑥ **provider명 3층 분리**(승인 대화=명시/보고서=금지(§7)/내부 evidence=명시), ⑦ **rasterizer는 spike 후 결정**(1순위 @napi-rs/canvas — native 수용 시 Gate B 재검토 전제, 유일한 공급망 공백),
  ⑧ 거부·Node 부재·실패는 전부 "baseline 계속+§7 한계 문구" 수렴. 경계 정련("자동 실행 금지"→**"무승인 실행 금지"**)·Skill 중개 양립성 등 7개 쟁점을 2N-1 Codex 리뷰 확인 대상으로 명시.
  문서: `docs/planning/cycle2n_0b_runner_provider_ux_design.md`. **다음 = 사용자 U1~U8 결정 + Codex 2N-1 설계 리뷰.** 2N-2 구현 전제 4건(§17) 정의.
- **Cycle 2N-0A — Runner / Provider UX Blindspot Pass**(planning만 — 설계 확정·구현·설치·실행 없음). Codex 2M-6 **PASS**로 2M 종료 가능 확인 후,
  2N-0B 설계 전 blindspot 도출: 핵심 발견 — ① **rasterizer 공백**(tesseract.js는 이미지 입력만·Gate D는 AGPL PyMuPDF로 렌더(검사용)·Kordoc 이미지 경로는 native canvas 필요 →
  OCR 경로의 유일한 미해결 공급망, U8), ② **HWP 경로와 OCR 경로는 별개 assisted path**(승인·egress 프로파일 상이 — 포맷별 분리 승인 권고), ③ OCR은 Kordoc intake 선행 의존
  (needsOcr 정합 fail-fast), ④ canonical hash는 Python 규칙(Node 구현 시 불일치 위험), ⑤ repo에 package.json 없음·중간 JSON 산출물 gitignore 미방어·nethook 자산 repo 부재,
  ⑥ "자동 실행 금지"(2L-4A/4B) ↔ 2N-5 블랙박스 흐름은 **"무승인 실행 금지"로 정련 필요(Codex 리뷰로 확정)**, ⑦ §7 provider명 금지 ↔ 승인 대화 명시의 이중 정책 필요.
  사용자 결정 8건(U1 설치 위치·U2 Node 부재 범위·U3 승인 단위·U4 runner 커밋·U5 provider명 이중 정책·U6 결정성 범위·U7 경로별 승인 분리·U8 rasterizer) 정리.
  문서: `docs/planning/cycle2n_0a_runner_provider_blindspot_pass.md`. **다음 = 사용자 결정 → 2N-0B 설계.** 2M-7 독립 블랙박스는 미진행(2N-5로 통합).
- **Cycle 2M-5 — Report Output Quality Remediation**(2M-3A/3B 품질 리뷰 반영 — 블랙박스 테스트 전 보정. runner/provider/assisted path 미구현, 2N 분리).
  보정층 판단: 대부분 findings 작성 품질 → **Skill 지침 층에서 해결** — `evidence_mapping_rules.md` **§7 신설**(커버리지 침묵 금지: 미추출/판독불가 구간을
  `overall_limitations`에 문서별 실수치 명시 · 검토 항목 수 명시 · 사용자 문구 한국어 표준화(내부 도구/provider명·영문 상태 문자열 금지, 표준 문구 3종) ·
  인용 품질(문장 경계·목차/표머리 조각 금지·**항목 간 동일 인용 재사용 금지**) · 사유-상황 일치(partial/not_verifiable 분리) · 하네스 어휘 금지) + SKILL.md 포인터 2곳(절차 8단계·금지표현 절).
  기계 감지 가능 1건은 **validator detect-only warning** 추가(`evidence.duplicate_quote_reuse` — error 아님·사람 검수 유도), 코드 결함 실재 1건은 **delivery 수정**
  (user_summary에서 human_review_boundary 존재 시 같은 취지 일반 문구 중복 출력 제거). 테스트: validator 26→**30**·delivery 33→**34**(회귀 체크 추가)·renderer 22·intake 56·aux 26 전부 green.
  미수정(사유 기록): P2 개별화(§7이 원인 커버)·P3 섹션 병기(기존 convention)·P4 U+200C 정규화(F1과 함께 2N/후속)·renderer(결함 없음). 메모: `docs/planning/cycle2m_5_output_quality_remediation_notes.md`.
  **다음 = Codex 재리뷰 가능.** L2 표현·provider pending 경계 불변.
- **Cycle 2M-2 — C2M1-MIN-01 Narrow Wording Refresh**(문구 최신화만 — 코드 로직·테스트 로직 무변경). Codex 2M-1 구조 리뷰의 nonblocking minor가 지적한
  Skill/intake 현재-facing 문구의 "L2 provisional / Codex review pending" 계열 표현을 2L-5 closure 상태로 정렬:
  SKILL.md Inputs·evidence_mapping_rules §6(접두 2곳+범위 경계)·intake README(제목+2곳)·dei_producer.py docstring/주석 4곳 →
  **"L2 = partially implemented, repo-side ingest boundary = implemented+reviewed(2L-5), provider execution·runner 통합·최종 확정 = pending,
  plugin-side OCR 실행 = 미구현, L3 = planned/미구현"**으로 통일. 금지 표현(L2 완료/OCR 지원/확정) 미사용 확인.
  테스트 5종 전부 green(56/26/26/22/33 — 로직 무변경 증명). **샘플 폴더 전수 산출물 테스트(Codex) 진행 가능 상태.**
- **Cycle 2L-5A — Historical Wording Cleanup**(docs-only, Codex 2L-5 review **PASS**의 nonblocking minor **C2L5-MIN-01** 해소).
  과거 2L-3C/3D/4A/4B/4C bullet의 당시 기준 "Codex review pending / 다음 = Codex review" 문구에 **historical 주석**(이후 PASS·2L-5 closure 반영)을 덧붙여
  현재 상태와의 충돌을 제거(과거 기록 자체는 보존). 2L-5 closure 판단·Ledger(L2=partially implemented, provider execution·final selection pending) **불변**.
- **Cycle 2L-5 — L2 Closure / Promotion Decision**(status decision, 문서만 — 코드 무변경). 근거 체인: Codex 2L-4A 설계 **PASS** → 2L-4B 구현 **PASS**(minor 1) →
  2L-4C patch **PASS**(findings 0, C2L4B-MIN-01 종결, required fixes 없음). 판단:
  **승격 = "L2 repo-side ingest boundary → `implemented+reviewed`"로 한정** — 승격 범위는 리뷰된 표면 그대로: `aux_structure_scanner.py`(stdlib 보조 스캐너) +
  `dei_producer.py` additive 병합(`ocr_supplement`/`aux_structure`) + artifact 계약 3종(intake/ocr_text/aux_signals — hash 무결성 검증 포함) + 경계 테스트(56+26 및 기존 3종 green).
  **승격하지 않는 것(별도 pending 명시)**: ① provider 최종 확정(Kordoc+tesseract.js는 계속 provisional·가역), ② runner 구현/통합(스크립트 배치 정책 open question),
  ③ **full OCR execution capability — plugin은 OCR을 실행하지 않으며 실행은 사용자 로컬 out-of-band**(이 경계가 승격 라벨의 핵심 한정), ④ L3(이미지/차트/표 의미 분석),
  ⑤ Kordoc 3.15.0 source 최종 비교, ⑥ OS 레벨 no-egress·defusedxml·HWPX 잔여 표 2건·개요 스타일 샘플(비차단 hardening).
  표현 규칙: 제품 문서에는 "L2 완료/OCR 지원"으로 쓰지 않고 **"repo-side ingest boundary implemented+reviewed / provider execution·final selection pending"**으로 분리 표기.
  변경 = current_status(Ledger 갱신 포함)·decision_log(D70)만.
- **Cycle 2L-4C — OCR Hash Integrity Narrow Hardening Patch**(Codex 2L-4B nonblocking minor **C2L4B-MIN-01**만 좁게 보정 — L2 승격·provider 확정 아님).
  `_validate_ocr_text_contract`의 `text_sha256`/`output_sha256`을 **presence-only → 실제 무결성 검증**으로 격상: ① `pages[].text_sha256` = 해당 text(UTF-8)의 SHA-256 재계산 일치(불일치 IntakeError),
  ② `output_sha256` = **`canonical_ocr_output_sha256()`**(신규 공개 함수 — top-level output_sha256 제외, `json.dumps(sort_keys, ensure_ascii=False, separators=(",",":"))` UTF-8 SHA-256; key 순서 독립·결정적·stdlib만) 일치,
  ③ hex 대소문자 정규화 비교, ④ **`model_sha256`은 presence-only 유지**(외부 모델 파일의 runner-제공 provenance — ingest 재계산 불가, 문서화된 한계).
  테스트 50→**56/56**(+6: 정상 PASS·text 변조 거부·output 불일치 거부·key-order 독립·재정렬 병합 PASS·대문자 hex 허용; fixture는 실제 hash 계산으로 교체). 기존 4종 무수정 green(aux 26·validator 26·renderer 22·delivery 33).
  변경 = `dei_producer.py`+`test_intake_dei_producer.py`+status/decision만. *(historical — 이후 **Codex 2L-4C patch review PASS(findings 0)**로 종결되고,
  **2L-5 closure에서 repo-side ingest boundary가 implemented+reviewed로 승격 판단됨.** runner 정책 등 잔여 follow-up은 pending 유지.)*
- **Cycle 2L-4B — L2 Ingest / Aux Scanner Provisional Implementation**(코드 — 당시 provisional. *(historical — 이후 **Codex 2L-4B review PASS**(minor 1건은 2L-4C에서 종결),
  **2L-5 closure에서 repo-side ingest boundary만 implemented+reviewed로 승격됨.** provider 최종 확정은 여전히 아님.)*)
  Codex 2L-4A **PASS** 권고("runner 없이 ingest 계약부터")에 따라 **repo-side ingest만** 구현: ① 신규 **`src/intake/aux_structure_scanner.py`**(stdlib-only —
  HWPX/DOCX zip+xml 문서 수준 신호: 이미지 3계층·표 top/nested 분해·caption/heading 후보·chart rels; 방어: member allowlist·bounded read·zip-slip 거부·raw XML/본문 미보존).
  ② **`dei_producer.py` additive 확장**: 선택 인자 `ocr_text`(provenance 필수 — provider/모델/hash/no_egress_verified, **needsOcr 페이지 불일치 fail-fast**)·`aux_signals`(계약 검증) →
  **`ocr_supplement`**(blocks 미혼입·extraction_quality="low" 고정)·**`aux_structure`** optional 섹션과 gap hint(image_detection_gap/table_count_mismatch/review_required_reason →
  review_priority_hints만, 판정 매핑 금지)로만 병합. 인자 없으면 기존 L1과 동일 산출(**DEI_VERSION "1" 유지 — 하위 호환 테스트로 증명**).
  ③ 테스트: 신규 `tests/test_aux_structure_scanner.py` **26/26** + `tests/test_intake_dei_producer.py` 26→**50/50**(병합 contract·fail-fast·하위 호환·결정성) + 기존 3종
  **무수정 green**(validator 26·renderer 22·delivery 33) = core 무변경 증거. ④ 문서 좁은 보정: intake README(L2 provisional 경계)·evidence_mapping_rules §6(**OCR 유래 인용 =
  출처 표기+보수적 매핑 필수**, gap 신호는 검수 신호만)·SKILL.md Inputs. **thin runner 미포함**(Codex 권고 자세 — open question 유지). **provider 실행·설치는 여전히 out-of-band·repo 밖.**
  schema/validator/renderer/delivery/manifest/package/lock **무변경**, core의 intake import 없음. **다음 단계 = Codex 구현 리뷰**(당시) — *(historical — 이후 PASS로 완료, 2L-5 closure 반영.)*
- **Cycle 2L-4A — L2 Adapter Boundary Design**(implementation-prep 설계, 문서만 — **L2 실제 구현 아님·provider 최종 확정 아님**). Codex 2L-3D **PASS** 후 provisional 구도
  (Kordoc+tesseract.js+stdlib aux 스캐너)를 **가역적 adapter boundary**로 설계: ① core는 provider 미실행 — **runner 층**(사용자 로컬 out-of-band, 준비 egress↔파싱 no-egress 분리)과
  **ingest 층**(`src/intake/` stdlib-only 정규화) 분리, 경계 = **artifact 계약 3종**(intake.json 기존 계약 불변 + ocr_text.json(provenance 필수) + aux_signals.json) → 계약만 맞추면 provider 교체 가능.
  ② OCR 텍스트는 blocks 미혼입 — **별도 `ocr_supplement` optional 섹션**(extraction_quality=low 고정·출처 구분 유지). ③ aux 신호 = DEI 재료(counts·사실) vs review-signal(gap 플래그 →
  기존 §6 not_verifiable/missing_info/customer_questions 경로 전용, 판정 매핑 금지) 분리(Codex 2L-3D 목록 준수). ④ **findings 스키마/validator/renderer/delivery 무변경**(DEI additive optional만).
  ⑤ pin/fail-fast(kordoc 3.13.0·pdfjs 4.10.38·tesseract.js 7.0.0·traineddata hash)·no-egress 훅·artifact redaction 계승. 테스트 전략(aux contract·병합 contract·core 미import·기존 4종 green)과
  2L-4B 구현 파일 목록·불가침 목록 확정. open questions: runner 스크립트 repo 커밋 여부(기본안: thin runner 커밋)·DEI_VERSION 유지(기본안 "1")·OCR 인용 표기.
  문서: `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`. **다음 단계 = Codex Review**(당시) — *(historical — 이후 Codex 2L-4A review PASS → 2L-4B 구현 진행됨.)*
- **Cycle 2L-3D — HWPX/DOCX Auxiliary Structure Scanner Review**(검토 evidence, 문서만 — L2 구현·provider 최종 확정·제품 코드 추가 아님). Codex 2L-3C **PASS** follow-up #4(DOCX 이미지·HWPX heading·caption gap)를 실측 검토.
  결과: **stdlib zip+xml 스캐너가 auxiliary layer로 적합**(권고·확정 아님) — ① DOCX 이미지 gap 완전 보강(Kordoc 0 vs 실측 **drawing 70·rels 71·media 14** 3계층 분해), ② 표 불일치 해명(raw 30/32 vs Kordoc 25 = **중첩 표 5** + HWPX 잔여 2 → review 신호),
  ③ **caption 후보 164**("표 제목" 스타일 문단 — Kordoc·python-docx 비가시), ④ HWPX heading 0의 실체 = 개요 스타일 15종 정의·본문 사용 0(Kordoc 결손 아님; 매핑 기제는 작동 → 다른 샘플로 재검증 항목). 스캔 결정적(2회 SCAN_SHA 동일)·stdlib은 네트워크 모듈 미사용(설치 0).
  **python-docx 비권장**: lxml **native .pyd 7개** 강제(RH-B2 격리 클래스)·inline_shapes 과소(68 vs 70)·HWPX 미지원. defusedxml은 L2 설계 시 하드닝 후보만. auxiliary signal model(이미지 3계층·표 top/nested·caption/heading 후보·review_required_reason) 설계 제안 포함.
  **provisional 구도 유지+확장(확정 아님): Kordoc + tesseract.js + stdlib aux 스캐너.** 문서: `docs/samples/hwpx_docx_auxiliary_structure_scanner_review_2026-07-05.md`. **L2/L3 구현·provider 최종 확정 계속 금지. 다음 단계 = Codex Review**(당시 — *historical: 이후 Codex 2L-3D review PASS*). 준비 egress는 python-docx pip 설치만(repo 밖 venv·기록), project package/lock/source 무변경.
- **Cycle 2L-3C — Provider / Document Analysis Capability Comparison**(comparison evidence, 문서만 — L2 구현·provider 최종 확정 아님). **Gate D = PASS 유지**(Codex `codex_cycle2l_3b_gate_d_evidence_review.md`), **tesseract.js = Gate D-proven OCR baseline**, **Kordoc = document-analysis comparison candidate**.
  sample 5종(유형3 스캔 ver2 9p hash 일치 확인·텍스트레이어 PDF 11p·HWP v5·HWPX·DOCX, 전부 repo 밖)으로 비교: **Kordoc npm latest-observed 3.13.0 + pdfjs-dist@4.10.38 fallback**(peer `>=4.0.0`; **pdfjs@6.1.200는 실측 비호환** — `doc.destroy` API 제거 재현 → fallback 사유 기록)
  이 **5포맷 전부 성공·10/10 run 파싱 no-egress(훅, egress 0)·5/5 쌍 결정적**, 텍스트레이어 PDF에서 한글 98.8% 커버 + **heading 3계층·표 25(셀 628)·outline·needsOcr 혼합페이지 신호**, **HWP v5 파싱 유일**, 스캔 ver2는 needsOcr 9/9 신호(OCR은 불가 — tesseract.js와 상호보완). 공백: DOCX 이미지 미감지·HWPX heading 0·caption 미지원.
  **Version discrepancy 기록**: GitHub source `kordoc@3.15.0` ≠ npm observed latest `3.13.0`; source install은 dist 부재로 실행 불가(limitation — 3.13.0은 npm-published baseline로만 해석). 독립 baseline pdfjs-dist@6.1.200 별도 행 비교. PyMuPDF/poppler는 AGPL/GPL이라 검사용만.
  **provisional recommendation(확정 아님): Kordoc(구조·다포맷 인테이크) + tesseract.js(스캔 OCR fallback) 조합 구도.** 문서: `docs/samples/provider_document_analysis_comparison_2026-07-04.md`. **L2/L3 구현·provider 최종 확정은 계속 금지(Codex Review + 승인 후 별도 결정). 다음 단계 = Codex Review**(당시 — *historical: 이후 Codex 2L-3C review PASS*). 원본/raw 산출물 미커밋(tracked 0), project package/lock/source 무변경.
- **Cycle 2L-3B — Gate D Execution Evidence**(로컬 OCR provider 실행 검증, evidence 문서). Codex 2L-3B0 PASS + 사용자 확인(ver2 9p **PII 없음**·**공식 홈페이지 다운로드**) 후,
  preflight 기준으로 로컬 OCR 실행을 증거화(**모두 repo 밖 임시 디렉터리**, sample/PNG/OCR원문/모델/venv/node_modules 미커밋). 샘플 hash **일치**(`238de8be…`, 9p) 확인 후 진행.
  provider 후보 2종 평가: **rapidocr-onnxruntime 기각**(onnxruntime **native DLL 초기화 실패** — preflight §3 native/Windows 리스크 실사례) → **tesseract.js 7.0.0 선정**(순수 JS+WASM, **native 0**, Apache-2.0/MIT/BSD, tessdata_fast kor+eng).
  **준비 egress(허용·기록: npm/PyPI/GitHub)↔파싱 no-egress 분리**. 파싱 no-egress = **Gate A 방식 Node 훅 + worker_threads 확장**(control C1 monitor 포착·C2 원격 `8.8.8.8:53` 차단·worker도 차단 확인), 파싱 중 **outbound 0**(main observedTotal=0, worker hooked, block 하 OCR 성공·완주).
  **결정성 3회 output hash 동일**(`546926ec…`). license/native: provider 트리 13패키지 전부 permissive·native 바이너리 0(wasm 6)·**RH-B2 native 재유입 없음**. OCR 산출은 집계·hash만 기록(원문 미커밋), 한국어 위주 인식(총 11,852자).
  **provisional outcome = all criteria observed**, 단 **최종 Gate D PASS/FAIL은 Codex Review 보류**(Claude Code 판정 안 함). 한계: Node 런타임 레벨(OS/커널 방화벽 아님, 비차단)·정확도 미평가(게이트 기준 아님).
  문서: `docs/samples/gate_d_ocr_evidence_2026-07-04.md`. **코드/schema/validator/renderer/delivery/src/tests/manifest/package/lock 무변경, cloud/외부API OCR 미사용, submission.zip 없음, repo tracked artifact 0.**
  **L1=implemented+reviewed 유지. L2/L3=Gate D-blocked 유지 — Codex evidence review PASS 전까지 L2/L3 구현 금지.** OCR 결과는 DEI candidate/검수 신호로만(판정 미생성).
- **Cycle 2L-3B0 Patch — Type 3 Selected Sample Review (ver2, 9p)**(read-only inspection, 문서만). 사용자가 292p source candidate에서 대표 **9페이지를 선별한 ver2 PDF**
  (로컬 `[REDACTED_LOCAL_PATH]`, repo 밖)를 read-only 도구(`fitz`·`pdftotext`)로만 검사(이미지 렌더링·OCR·API·notebook·설치 없음). 결과: **9페이지 전면 스캔/이미지 기반, 텍스트 레이어 0**
  (전 페이지 0자, 두 도구 교차검증), 비암호화, metadata PII 없음, 292p와 **동일 스캔 프로파일**. **SHA-256 `238de8be…c843c5a3`**(source candidate 292p = `be9bfb1a…b2ed363`와 구분). →
  **Type 3 충족 + Gate D 샘플로 292p보다 우수**(분량 축소로 PII 노출면·determinism 비용 감소, 사람 선별). **권장: ver2 전체 9p 사용 가능**(선별 9p 사용자 PII 확인 + 출처/공개성 확인 전제).
  선행조건 해소: ①소수 페이지 선별=**충족**(9p) / ②PII 육안 점검=**부분 충족**(선별로 노출면↓, 9p 명시 확인 잔여) / ③출처·공개성=**미해소**(사용자 확인). **바로 Gate D execution 아님 → Codex Review 후 승인.**
  **원본·ver2 모두 repo 미커밋 유지**(`.gitignore` `*.pdf` 방어 유지, tracked PDF 0건, hash·관찰만). 문서: `docs/samples/gate_d_type3_selected_sample_review_2026-07-04.md`(신규) + 292p suitability 문서에 참조 추가.
  **L1=implemented+reviewed 유지, L2/L3=Gate D-blocked 유지. Gate D는 아직 실행 전.**
- **Cycle 2L-3B0 — Type 3 Sample Suitability Review**(read-only inspection, 문서만). 사용자 제공 Gate D 후보 PDF(로컬 `[REDACTED_LOCAL_PATH]`)를
  이미 설치된 read-only 도구(PyMuPDF `fitz`·poppler `pdftotext`)로만 검사(이미지 렌더링·OCR·API·notebook·설치 없음). 결과: **292페이지 전면 스캔/이미지 기반, 텍스트 레이어 0**
  (전 페이지 추출 텍스트 0자, 두 도구 교차검증 일치), **비암호화**, metadata PII 항목 없음(변환 도구명만). **SHA-256 `be9bfb1a…b2ed363`**. →
  **Type 3 기술 요건 충족**(진짜 스캔·`needsOcr` 자명). 단 텍스트 레이어 부재로 **이미지 내부 PII는 구조검사만으로 미확인** → 채택은 **사람 육안 PII 점검 + 대표 소수 페이지(3–5p) 선별** 전제(전량 292p 사용 지양).
  **원본 PDF = repo 미커밋**(submission 정책 E-분류) — `.gitignore`에 `*.pdf`/`*.PDF` 추가로 실수 커밋 차단(tracked PDF 0건, 원본 untracked·ignored), 본문은 **hash·관찰만** 기록.
  판정: 샘플 자체는 부적합 아님, **선별·PII 점검·출처 확인이 선행 조건(CONDITIONAL readiness)** → 바로 Gate D execution 아님. OCR provider 선정(§3)·no-egress evidence는 Gate D 실행 시 별도 수행.
  문서: `docs/samples/gate_d_type3_sample_suitability_review_2026-07-04.md`. **L1=implemented+reviewed 유지, L2/L3=Gate D-blocked 유지. Gate D는 아직 실행 전.**
- **Cycle 2L-3A — Gate D Preflight / Execution Plan**(no-execution prep, 문서만). Gate D 실행 **전** preflight를 확정: 목적·범위(모델/도구 **준비 egress**(허용·기록) ↔
  **파싱/OCR 실행 no-egress**(Gate A 방식 증거) 분리, native/optional/license = **Gate B 재검토**, 비민감 Type 3 샘플, OCR 결과는 **DEI candidate/검수 신호로만**), Type 3 샘플 기준(**현재 미확보** — 임의 생성·다운로드 금지),
  OCR provider **평가 기준 우선·후보 나열만**(Kordoc `--formula-ocr`/Tesseract 계열/로컬 ONNX — 설치·실행 안 함), Gate D **evidence 빈 템플릿**, PASS/CONDITIONAL/FAIL 기준, Gate D 이후 경로(PASS→2L-4 L2 / CONDITIONAL→조건해소 / FAIL→L1 fallback+목표선 미달; L3는 Gate D PASS+설계검증 전 금지).
  문서: `docs/planning/cycle2l_3_gate_d_preflight_plan.md`. **OCR provider 미설치·모델 미다운로드·OCR 미실행·API/notebook/다운로드 없음, 샘플 PDF 미생성/미커밋, 코드/package/schema 미변경. Gate D는 아직 실행 전.**
- **Cycle 2L-2 Closure — L1 → `implemented+reviewed` 승격**(status update, 코드 무변경). Codex patch review **PASS**(findings 0,
  `docs/reviews/codex_cycle2l_2_l1_patch_review.md`)로 **C2L2-MAJ-01/MIN-01/MIN-02 종결** 확인 → Capability Status Ledger에서 L1을 **`implemented+reviewed`**로 승격.
  근거 commit/review: L1 구현 `045e617217df8b5740eba08aa5d5b21386d89527` · L1 patch `0fa52d839ddfb4dacb9f91f5709c813e7e3b7d71` · patch review PASS `e8f90164404fa28e4fcf70dbaa1bbee5d9a9f170`.
  **다음 단계 = Cycle 2L-3 Gate D prep/execution — 착수 가능하나 아직 실행 전.** Gate D 통과 전까지 L2/L3 코드·OCR provider 설치/실행·모델 다운로드·native/egress 개방 **금지**. L4는 예선 범위 밖 유지.
- **Cycle 2L-2 Patch — Intake Validation Fix**(Codex CONDITIONAL PASS 조건 해소, narrow patch). **C2L2-MAJ-01**: `dei_producer.py`의 `_require`를
  `_validate_intake_contract`로 대체 — malformed 입력(빈 `{}`·`success` 누락/비-true·`blocks` 비-list·`pageQuality` 누락/빈값·`qualitySummary` 누락·`pageCount`<1 등)은
  **조용한 빈 DEI 대신 `IntakeError`**. "유효하지만 근거 빈약(스캔 전용 blocks=[])"은 `pageQuality`/`qualitySummary`/`pageCount` 신호로 허용. negative/positive 테스트 +12(14→**26/26 PASS**).
  **C2L2-MIN-01**: `evidence_mapping_rules.md` §6 정리 — not_verifiable 위치는 `missing_info`/고객질문에, `evidence_anchor`는 읽을 수 있는 근거에만(앵커 미생성). **C2L2-MIN-02**: decision_log 후행 공백 제거(`git diff --check` clean).
  schema/validator/renderer/delivery 코드 무변경(기존 26·22·33 green), OCR/native/model/egress·package 변경 없음. patch note: 완료 보고 §8. **Codex patch review 후 L1 ledger 승격.**
- **Cycle 2L-2 — L1 Implementation**(코드: 선택적 인테이크→DEI producer). 신규 **`src/intake/dei_producer.py`**(core 밖 opt-in, 표준 라이브러리)로
  이미 로컬 추출된 인테이크 산출물을 **DEI-candidate**(결정적·판정 미생성·원문 보존·실패 명시)로 정규화. Skill 라우팅 지침(`evidence_mapping_rules.md` §6, SKILL.md)으로
  스캔/이미지/저신뢰 신호를 **기존 `not_verifiable`+`missing_info`+`customer_questions` 경로**에 연결(위치는 `p.<n> · <섹션>` 자유텍스트, **bbox는 DEI에만**).
  **schema/validator/renderer/delivery 코드 무변경**(별도 schema-evolution 불필요로 판단). 테스트: 신규 `tests/test_intake_dei_producer.py` **14/14 PASS**, 기존 검증기 26·렌더러 22·전달 33 **전부 유지(실패 0)**.
  경계: DEI는 renderer/validator 직접 유입 금지(테스트로 강제)·priority→판정 직접 매핑 금지·OCR/native/model/egress 없음·L2/L3는 현재 기능 아님(Gate D 대상). 완료 보고: `docs/cycle2l_2_l1_intake_completion_report.md`.
  **OCR provider 미설치/미실행, package/dependency 미변경, API/notebook/업로드 없음.** Codex Review 대기.
- **Capability Status Ledger**(2L-5 갱신): **L0=implemented+reviewed** / **L1=implemented+reviewed**(구현 `045e617` + patch `0fa52d8`, Codex patch review PASS `e8f9016`) /
  **L2=partially implemented — repo-side ingest boundary `implemented+reviewed`**(Gate D PASS + 구현 `d1f1e42` + hash patch `8042cdd`, Codex 2L-4B/4C PASS;
  **provider execution·runner 통합·provider 최종 확정은 pending** — plugin은 OCR을 실행하지 않음, 실행은 사용자 로컬 out-of-band) /
  **L3=planned(설계·승인 blocked, 의미 분석 금지 유지)** / **L4=out-of-preliminary-scope**.
- **Cycle 2L-1 — L1 Implementation-Prep**(문서 + RH-B2 로컬 검증, L1 코드 미구현). **RH-B2 종결(PASS)**: `--omit=optional` 클린 설치
  (`kordoc@3.8.2 + pdfjs-dist@4.10.38`, native/optional 전부 부재·`.node` 0건)에서 유형1·유형2 파싱 4/4 성공, 산출물 해시가 **Gate A와 바이트 일치** →
  optional/native는 v1 텍스트 경로에 무영향(evidence: `docs/samples/rh_b2_optional_exclusion_evidence_2026-07-03.md`). 이어 **L1 schema-free DEI-후보 계약 동결**,
  **page/bbox/quality hint 자유텍스트 convention**(findings엔 `p.<n> · <section>` 최소표기, bbox는 DEI 문서수준에만 — 숨은 스키마화 방지), **L1 Skill routing draft**
  (판독불가/저신뢰 → 기존 `not_verifiable`+`missing_info`+`customer_questions`, core 무변경), **L1 test plan**(기존 3종 green 유지 + 신규 DEI 생산기 단위/계약/경계 테스트),
  **Gate D 비실행 준비**(유형3 샘플·provider 기준·evidence 템플릿·no-exec 체크리스트 — 설치·OCR·모델다운로드 없음)를 정리. 문서: `docs/planning/cycle2l_1_l1_implementation_prep.md`.
  **코드/schema/validator/renderer/delivery/manifest/package 미변경, OCR provider 미설치·미실행, API/notebook/업로드 없음.** (Ledger는 상단 2L-2 항목으로 갱신됨.)
- **Cycle 2L — 예선 L3 Implementation-Prep 로드맵**(문서만, 구현 없음). 코드 구조 실측(파이프라인이 findings에서 시작, src에 인테이크/OCR 코드 없음,
  `not_verifiable→missing_info+customer_questions` 라우팅·SKILL "매칭 실패≠미공시" 이미 존재, evidence_anchor/source_documents는 `additionalProperties:false`) 기반으로
  L3 달성 실행 구조를 **sub-cycle 분해**: 2L-1(L1 prep — **RH-B2 종료 포함**·DEI-후보 계약·**schema-free 경로 확정**) → 2L-2(L1 구현, core 무변경 목표) →
  **2L-3(Gate D prep/실행 — 모델준비 egress↔파싱 no-egress 분리·Gate B 재검토·유형3 샘플)** → 2L-4(L2 구현, Gate D PASS 후) → 2L-5(L3 구현, Gate D+설계검증 후).
  판단: L1 prep과 Gate D prep은 **분리**(리스크 계층 다름), L2/L3는 예선 target이나 **Gate D가 물리적 선행**(target≠implemented). 과장 방지 **Capability Status Ledger** 도입.
  L4는 로드맵 제외(예선 범위 밖, Gate C/C-SH). Kordoc=optional/local·core hard dependency 아님, Mistral=구조 benchmark, OCR/image=DEI 후보·검수 신호만, 차트수치/이미지의미/KSSB충족 추정 금지 불변.
  문서: `docs/planning/cycle2l_preliminary_l3_implementation_prep.md`. **코드/dependency/OCR 엔진/API/Python/notebook/submission 없음.**
- **Cycle 2K Patch — 예선 L3 제출 목표 명확화**(Codex C2K-MAJ-01 해소, 문서만). Codex CONDITIONAL PASS가 지적한 "L0+L1=MVP, L2/L3=막연한 후속 확장"
  서술을 **예선 제출 3단 구조**로 재정리: **예선 최소/fallback = L0+L1**(신규 게이트 불요) / **예선 제출 목표 = L0+L1+L2+L3**(Gate D 통과·구현 evidence·독립 검증 조건, L2/L3는 "의도된 목표선") /
  **예선 범위 밖 = L4**(Gate C/C-SH 이후, 본선과 별도). L2/L3가 목표선이어도 **Gate D 통과 전 구현 착수 금지**·**구현 완료 전 "현재 지원 기능" 표현 금지**는 유지;
  Gate D 미통과 시 L1 fallback 제출은 유효하나 내부적으로 "목표선 미달"로 구분 기록. 차트 수치·이미지 의미·KSSB 충족 추정 금지, DEI 후보·검수 신호로만 합류하는 원칙 불변.
  문서: `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md`(§7 재작성). Codex 리뷰 원문·2J 문서는 미수정.
- **Cycle 2K — OCR/Scanned PDF/Image Analysis Capability Ladder 계획**(제출 목표 반영, 문서만, 구현/설치/실행 없음).
  제출 목표가 text-PDF를 넘어 **OCR·스캔 PDF·이미지 기반 페이지·이미지/도표/표/차트 근거 후보 식별·검수 라우팅까지 확장**됨을 명시하고
  **L0~L4 capability ladder + 게이트**로 고정: L0(텍스트 PDF, 완료) → **L1(스캔/이미지/도표 존재 감지+검수 라우팅 — 기존 검증 신호만 사용, 신규 게이트 불요, 제출 MVP 후보)**
  → L2(로컬 OCR 실행 — **Gate D**: 모델 준비 egress↔파싱 no-egress 분리·Gate B 재검토·유형3 샘플) → L3(도표/차트 구조 분류 — 수치/의미 추정 금지)
  → L4(클라우드/self-host — Gate C / **Gate C-SH**(C2J-MISTRAL-MIN-01 해소: self-host ≠ 자동 no-egress 동급)).
  Kordoc 역할 재정의: **OCR 엔진이 아니라 감지/추출/orchestration 후보**(core hard dependency 금지 유지). Mistral은 구조 참고 모델(2J 유지).
  차트 수치·이미지 의미·KSSB 충족 추정 금지, low-confidence → missing_info+customer_questions. 문서: `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md`.
  (참고: 위 "제출 MVP 후보"·"MVP" 표현은 이후 **D55(§7)**에서 **예선 최소/fallback(L0+L1) / 예선 target(L0+L1+L2+L3) / 예선 범위 밖(L4)**으로 대체됨.)
- **Cycle 2J — Mistral OCR 4 문서지능 구조 벤치마크**(계획 보완, 문서만, 구현/실행 없음). 공개 링크 read-only 확인 후 Mistral OCR 4 구조
  (bbox·typed-block·**inline confidence(페이지/단어)**·markdown·raw OCR↔Document AI 분리·batch `custom_id`/status)를 현재 Kordoc·DEI·evidence 구조와 대비.
  판정: page/block·markdown·계층분리는 **이미 보유(Kordoc 로컬)**; **confidence는 판단이 아니라 '검수 우선순위' 신호**로 DEI 선택필드 반영(추후+Codex검증, no re-judgment 유지);
  bbox/block_type은 DEI 위치·유형 힌트(evidence_anchor schema 불변); batch는 **로컬 결정적 개념**(status/result hash)로만; **스캔 OCR 실행·Mistral 클라우드 API/SDK는 제외**.
  Mistral은 **클라우드 egress(문서 업로드)** 라 Gate A no-egress와 상충 → 도입은 별도 **Gate C(외부/클라우드 OCR egress)** 필요. Gate A/B/Version과 무충돌 보완.
  문서: `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md`. **API/Python/notebook/업로드 없음, Mistral/Kordoc dependency·MCP·코드·schema·manifest 미변경.**
- **Cycle 2I-3B Version Strategy Confirmation → 확정 + Residual Hardening Register**(문서만, 구현 없음). Gate A·B PASS 이후 남은 gate인
  Version Strategy 8규칙 확정: `kordoc@3.8.2` exact pin · `pdfjs-dist@4.10.x`(실측 4.10.38, 광역 `>=4` 금지) · 실행 전 compat-check · 미검증 fail-fast ·
  auto-upgrade 금지 · 신버전 시 Gate A/B 재검증 · 불일치 시 fallback · Kordoc은 계속 optional/local(core hard dependency 아님, `--omit=optional`).
  전체 흐름의 non-blocking 보강을 Residual Hardening Register로 수집(RH-A1 OS-egress·RH-A2 메타·RH-B2 optional-omit trace·RH-P1/2 attribution/법률·RH-S1/C1 유지규칙);
  **RH-B1(완전 117 의존성 인벤토리+`INVENTORY_SHA256`)은 본 문서에서 해소**(GATEB-MIN-01). 판정: **기술 gate 전부 충족, 잔여 blocker 없음. 단 구현 착수 전 사용자/ChatGPT 명시적 승인 필요 → 다음은 구현이 아니라 Codex Review→승인→구현.**
  확정: `docs/planning/cycle2i_3b_version_strategy_confirmation.md`. **package/dependency 미추가, Kordoc 미설치/미재실행, PDF/OCR/MCP 미실행, 코드/schema/manifest 미변경.**
- **Cycle 2I-3B Gate B — Transitive/Native License Review 실행 → PASS**(v1 text-PDF 경로). `kordoc@3.8.2 + pdfjs-dist@4.10.38` 기준
  v1-required 폐포(deps-only 재귀) **117개 전부 permissive**(116 permissive + jszip dual MIT-electable; copyleft·native·unknown 0). 116/117 LICENSE 동봉.
  카피레프트(LGPL: `@img/sharp-win32-x64`)·native 바이너리(`sharp`/`onnxruntime`/`@hyzyla/pdfium`/`canvas`)는 **모두 v1 경로 밖 optional**로 미로드.
  어댑터 opt-in/local·미번들 → 재배포 의무 미발생; 번들 시 attribution/NOTICE 보존 + `--omit=optional`로 LGPL/native 제외 조건 명시. `submission_packaging_policy.md`와 정합.
  evidence: `docs/samples/gate_b_license_review_evidence_2026-07-03.md`. **읽기전용 인벤토리(설치 없음), 형식 법률의견 아님, node_modules/스크립트/lock repo 미커밋, 코드/schema/manifest 미변경.** 다음: Version Strategy 확정.
- **Cycle 2I-3B Gate A — Hard No-egress Rerun 실행 → PASS**(프로세스/Node 런타임 레벨). Node outbound를 preload 훅으로 **강제 차단(block)**한 상태에서
  유형1·유형2 파싱 8/8 성공·**파싱 중 outbound 시도 0건**. control로 차단 실제 작동 입증(monitor 포착 + 알려진 원격 `8.8.8.8:53` 차단). 결정성은 **JSON·Markdown 둘 다** 2회 동일
  (유형1 JSON `eeddfb59…`/MD `953443f4…`, 유형2 JSON `1c7d8ec9…`/MD `6095b881…`; MD는 2I-3A와 일치). 검증 조합 `kordoc@3.8.2 + pdfjs-dist@4.10.38`, 재설치 없이 오프라인 수행.
  한계: OS/커널 방화벽 레벨 아님 → 민감 실데이터 운영 전 OS 레벨 재확인은 비차단 보강. evidence: `docs/samples/gate_a_no_egress_evidence_2026-07-03.md`.
  **OCR/formula/MCP/setup 미사용, raw log·PDF·변환물·node_modules·훅 repo 미커밋, 코드/schema/manifest 미변경.** 다음: Gate B(license)·Version Strategy.
- **Cycle 2I-3B GatePrep — Gate A/B/Version Strategy 실행계획**(Plan Mode, 문서만, gate 실제 실행 없음). 2I-3B 설계 Codex PASS(§11/§12) 기반으로
  구현 전 필수 gate를 실행 가능한 절차로 구체화: **Gate A**(hard no-egress rerun — 차단 제어검증·아웃바운드 관찰·결정성·evidence 항목·PASS/HOLD/FAIL),
  **Gate B**(전이/native license review — v1 경로 의존성·copyleft·native·submission 정합), **Version Strategy**(`kordoc@3.8.2`+`pdfjs-dist@4.10.x` pin·compat-check·fail-fast·auto-upgrade 금지·재검증 5규칙),
  v1 OCR/formula/scanned 제외·opt-in/local-only posture 유지, 구현 사이클 진입 조건 체크리스트. 계획: `docs/planning/cycle2i_3b_gateprep_execution_plan.md`.
  **Kordoc 설치/재실행·no-egress 테스트·license 정밀검토·코드/의존성/manifest/marketplace 변경·OCR/PDF 재실행 없음.**
- **Cycle 2I-3B — Optional/Pluggable External Intake Adapter 설계**(문서만, 코드 무구현). spike evidence + Codex PASS를 바탕으로
  Kordoc을 **런타임 결합 의존성이 아니라 "외부 인테이크 어댑터 인터페이스 계약 + 로컬 preprocessing" 뒤의 한 구현**으로 격리.
  plugin core는 findings 계약만 소비(어댑터 산출물은 DEI→Skill 경유, renderer/delivery/validator 직접 입력 아님). DEI↔`evidence_anchor` 매핑(판정 미생성·schema 미변경),
  버전 pin(`kordoc@3.8.2`+`pdfjs-dist@4.10.x`, auto-upgrade 금지·fail-fast), **Gate A(no-egress 강제검증)·Gate B(전이/native license)** 를 구현 전 필수 gate로,
  OCR/formula/scanned는 v1 제외(needs_ocr는 신호만), 부재 시 현행 fallback 유지, 구현 진입 gate 체크리스트를 정의. 설계: `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`.
  **Kordoc 설치·MCP·OCR·PDF 재실행·코드/의존성/manifest/marketplace 변경 없음.**
- **Cycle 2I-3A 실제 local Kordoc feasibility spike 실행** — 사용자 승인 하 로컬에서 **kordoc@3.8.2**(MIT) 설치·CLI 파싱 실측.
  결과: 표 재구성(유형1 49개·유형2 199개)·결정성(2회 SHA 동일)·대용량 안정(156MB·126p 40초)·풍부한 위치/품질/`needsOcr` 신호로
  baseline(naive 텍스트) 대비 인테이크 품질 **개선 확인**. 단 **PDF는 `pdfjs-dist` 별도 설치 필요 + 버전 민감(v6 실패, v4.10.x 고정 필요)**,
  Node 런타임 필요, OCR/formula는 모델 egress → **plugin hard dependency 부적합, optional/pluggable로만** 권고.
  종합: **성공(가치 입증) + hard dependency 부적합**. evidence: `docs/samples/kordoc_spike_evidence_2026-07-03.md`.
  유형3(스캔 전용 비민감 샘플)은 미확보(후보 암호화/텍스트레이어). **OCR 미실행(needs_ocr 관찰만)**, plugin core·schema·renderer·delivery·validator·manifest·marketplace **미변경**, 샘플·변환물·`.mcp.json`·raw log repo 미포함.
- **Cycle 2I-3A (계획)** — Kordoc Feasibility Spike / Approval Gate **문서화**(설치·실행 아님, 코드 무변경).
  Kordoc을 **optional/pluggable intake 후보**로 유지(본체 hard dependency 아님)하고, 사용자 승인 전 확인 조건(오프라인·무-egress·라이선스·재현성·경계),
  샘플 유형별 spike 시나리오·성공/실패 기준·evidence 기록 요건(정확한 버전·명령·README 확인일), DEI↔evidence_anchor 매핑 검증, OCR 별도 승인 게이트,
  MCP/설정·로컬 경로 repo 커밋 금지, 실패 fallback을 정의. 계획: `docs/planning/cycle2i_3a_kordoc_feasibility_spike_plan.md`.
  Codex 2I-3 minor(C2I3-MIN-01: 계획 문서 stale 서문) 정리. **Kordoc 설치/MCP/OCR/PDF 재실행 없음.**
- **Cycle 2I-3A 실행 Runbook 추가** — 승인 후 사용자 로컬 spike **실행 절차 + evidence 기록 템플릿**:
  `docs/planning/cycle2i_3a_kordoc_local_spike_runbook.md`. 실행 전 승인 체크리스트·offline/no-egress 확인·라이선스 확인·재현성 기록·
  샘플 유형별 실행·성공/실패 기준·DEI→evidence_anchor 매핑 관찰·redaction 규칙·실패 fallback·실행 후 Codex Review 포인트 포함.
  계획(Approval Gate)과 분리된 **실행/증거** 문서. **문서만, Kordoc 설치·MCP·OCR·PDF 재실행 없음.**

## 이전 Cycle: Cycle 2I-3 (+ 최소 guardrail 구현)
- 계획 §11의 **validator 내부 경로 스캔 확장**을 detect-only로 구현(`_PATH_PATTERNS`에 `/home/`·`/var/folders/`·`[\\/]Temp[\\/]`·env-var 추가).
  `_PATH_PATTERNS`에 `/home/`·`/var/folders/`·`[\\/]Temp[\\/]`·`%(TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)%` 추가 →
  findings 값의 로컬/임시/계정 경로 노출을 렌더 전 preflight에서 `path.internal_exposure`(error)로 감지. renderer/delivery/schema 불변, detect-only 유지, valid example error 0(오탐 없음).
  검증: 검증기 26/26, 렌더러 스모크 22/22, 전달 33/33 PASS. 완료 보고: `docs/cycle2i_3_minimal_validator_guardrail_completion_report.md`. Kordoc/OCR/PDF 재실행 없음(2I-3A 유지).

## 이전 Cycle: Cycle 2I-3 계획
- Document Intake / Evidence Quality 설계 계획(DEI 문서 수준 제안, Kordoc 2I-3A spike 분리). 계획: `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`.
  남은 리스크(인테이크 품질·표/스캔 수치·findings 값 로컬 경로 유입·Kordoc/OCR 승인 게이트)를 정리하고,
  표·이미지 판독용 **Document Evidence Index를 문서 수준(비-schema)**으로 제안(판정 생성 아님, `evidence_anchor` 매핑).
  로컬 경로 차단은 **upstream validator(detect-only)**에서, renderer/delivery는 재작성 금지 원칙 정리.
  **최소 validator 경로 스캔 확장**(2I-3 구현 후보)은 **계획 검토 우선**으로 이번 push에 미포함(승인 후 별도 커밋).
  Kordoc은 **2I-3A feasibility spike 후보**로만 분리(미설치·미실행). 계획 문서: `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`.

## 이전 Cycle
- **Cycle 2I-2** — Presentation / Report Wording Quality + Skill Workflow Alignment **구현**.
  렌더러 3종(HTML/DOCX/Markdown) 표현 개선: **한글 공시요구 제목 우선**(항목ID 보조), 근거 앵커를 **인용/출처/위치** 라벨로 분리,
  §2 항목표 열 재정렬(영역·공시요구·판정·항목ID), 질문 안내 인트로. Codex 2I-1 minor 3건 처리 — SKILL.md를 전달 배선기·Markdown fallback과 정합(MIN-01),
  강제 DOCX 실패 fallback 영구 테스트 추가(MIN-02), 렌더러 stale fallback 문구 현행화(MIN-03).
  재판정 없음·detect-only·경계 유지. 검증: 전달 33/33, 렌더러 스모크 22/22, 검증기 19/19 PASS. 완료 보고: `docs/cycle2i_2_presentation_quality_completion_report.md`.

## 이전 Cycle
- **Cycle 2I-1** — Execution Wiring / Output Separation / 대표 문서 생성 **구현**.
  전달 배선기 `src/renderers/kssb_report_delivery.py` 신설: findings → **validator preflight(detect-only)** → **renderer(재판정 없음)** →
  **사용자-facing 요약**. 사용자 요약(파일명·표시경로·preflight 건수·사람 검수·경계 고지)과 내부 상세(전체 경로·validator 이슈·docx 오류)를 **분리 반환**(CLI: stdout=요약, `--debug`=stderr).
  renderer에 **Markdown fallback**(`render_markdown`) 추가 + `render_report`가 대표 문서 우선순위(**DOCX→HTML→Markdown**)를 `primary`/`primary_format`으로 지정. 로컬 절대경로·계정명은 표시경로 sanitize + 2차 redaction으로 비노출.
  테스트 `tests/test_delivery_wiring.py`(24건) 신설, `.gitignore`에 `.md` 산출물 제외 추가. 완료 보고: `docs/cycle2i_1_execution_wiring_completion_report.md`.
  검증: 전달 배선 24/24, 렌더러 스모크 22/22, 검증기 19/19 PASS. **Kordoc/OCR/PDF 재실행 없음.**

## 이전 Cycle
- **Cycle 2I-0 (+ Addendum)** — baseline 문제 분석에 이어 **구현계획 문서화**(구현 아님, 판정 없음).
  개선 순서 **2I-1(실행 배선/로그·경로 분리·대표 문서 생성) → 2I-2(표현 품질: 코드→한글 라벨·인용/위치) → 2I-3(인테이크/표 fallback 설계) ∥ 2I-3A(Kordoc feasibility spike)** 제안.
  **Kordoc**은 사용자 승인 후 로컬 MCP/CLI 설치 가능한 **인테이크 후보**로만 반영(본체 hard dependency 아님, 미설치·미실행).
  표·이미지 판독용 **Document Evidence Index**를 schema 변경 없이 상위 설계로 제안(판정 생성 아님, 근거 재료만).
  계획 문서: `docs/planning/cycle2i_remediation_implementation_plan.md`.
- **Codex Cycle 2I Review = CONDITIONAL PASS**(`docs/reviews/codex_cycle2i_remediation_plan_review.md`). 문서 cleanup patch로 대응:
  Major(레거시 `reference_review.md`의 실제 로컬 계정 경로) → `[REDACTED_LOCAL_PATH]`로 정리, Minor(decision_log 제목 범위 → 2I, Kordoc feasibility 버전/확인일/artifact 출처 기록 요건) 보강.
  **실제 수정·설치 미착수**. 다음 단계는 확인 후 Cycle 2I-1(실행 배선/출력 분리).

## 이전 Cycle: Cycle 2I-0 baseline
- 두 실사용 테스트(Run A Hana / Run B K-water)를 실행 단계 문제·산출물 품질 문제로 분리 분석. 경계 유지 관찰. 문서: `docs/cycle2i_baseline_execution_output_problem_analysis.md`.

## 이전 Cycle
- **Cycle 2H (+ Patch, + Install/Smoke Evidence)** — display name 정렬 후, **사용자 직접 Codex CLI discovery + 새 thread smoke test 확인 완료**를
  evidence 문서로 기록. 실제 보고서 기반 end-to-end 품질 검증은 다음 단계(Cycle 2I)로 분리. PASS/FAIL 판정 없음.

## Cycle 2H Install/Smoke Evidence (사용자 직접 확인)
- 사용자 직접 Codex CLI에서 대상 plugin(**Samil KSSB Precheck Plugin** / `samil-kssb-precheck`)이 확인됨. 이전 `local-kssb-plugins`/`kssb-evidence-gap-auditor`(파이썬 기반)와 구분.
- 새 thread smoke test: **실제 기업 분석 없이** plugin 사용 방식(입력자료·KSSB 4대 영역·근거 기반 검토·보고서 구조·경계) 설명만 요청·확인. source-bound·감사/인증/준수 대체 아님·사람 검수 경계 유지.
- app GUI 표시 검증·실제 보고서 end-to-end 품질 검증은 **미수행(다음 단계)**. evidence: `docs/codex_install_verification_evidence_2026-07-02.md`.
- Claude Code는 실제 Codex 상태 변경(add/install/enable) 미수행. 다음: Codex evidence review + Cycle 2I(Real Report Practical Output Validation) 제안.

## Cycle 2H Patch (Plugin Display Name Alignment)
- 사용자 화면의 `Local KSSB Plugins / local-kssb-plugins` 항목은 **이전 파이썬 기반 local plugin**으로 확인되어, 현재 플러그인과 혼동 가능성이 있다.
  이에 현재 플러그인의 사용자-facing 표시명을 **Samil KSSB Precheck Plugin**으로 **선제 정렬**한다(naming consistency 보정).
- 이번 Patch는 **discovery 문제를 해결하지 않으며**, 현재 대상 플러그인의 실제 app/CLI 표시 여부는 **아직 미확인**이다(별도 사용자 직접 검증 항목).
- 변경: manifest `interface.displayName` → `Samil KSSB Precheck Plugin`, marketplace `interface.displayName` → `Samil KSSB Precheck Plugin — Local/Repo Marketplace`.
- **불변(이전 리뷰 정합값 유지)**: machine `name`=`samil-kssb-precheck`, marketplace `plugins[0].name`, `source.path`=`./src`, `skills`=`./skills/`,
  `policy.installation`=`AVAILABLE`, `policy.authentication`=`ON_INSTALL`, plugin root=`src/`, manifest/Skill 경로.
- 문서: `codex_install_verification.md`·evidence template에 표시명 기대값(+machine name 유지·축약 시 detail에서 full name 확인) 반영.
- 실제 Codex app/CLI install/enable 최종 검증은 **여전히 사용자 직접 수행 항목**. 완료 보고: `docs/cycle2h_patch_plugin_display_name_completion_report.md`.

## 이전 Cycle: Cycle 2H (base)
- **Cycle 2H** — User-led Codex Install Verification Kit. 실제 Codex app/CLI 설치 확인은 사용자 환경 상태를 바꾸므로
  Claude Code가 대신 수행하지 않고, **사용자가 직접 검증**할 절차 문서·evidence 양식을 제공. 문서/양식 중심(코드·로직 무변경).

## Cycle 2H 완료 작업
- 신규 `docs/codex_install_verification.md`: 사용자 직접 검증 절차(목적·repo 구조 요약·local vs public·준비사항·CLI/GUI 절차·새 thread 사용·성공/실패 기준·오류/외부 상태 기록·민감정보 금지·repo 반영 방법).
- 신규 `docs/templates/CODEX_INSTALL_VERIFICATION_EVIDENCE_TEMPLATE.md`: 확인 개요·사전 파일 상태·CLI/GUI 결과·새 thread 결과·외부 상태 변경·판정(PASS/PARTIAL/FAIL). 상단 민감정보 금지 안내.
- `docs/codex_install_readiness.md` 보강: "파일 기반 readiness 완료 / 실제 app·CLI 확인은 사용자 직접 수행 대기(설치 성공 미주장)", verification 문서·evidence 양식 참조, `ON_INSTALL`은 실제 자격증명 미추가 재확인.
- `docs/submission_packaging_policy.md` 보강: install verification evidence를 B분류(제출 단계 민감정보 스캔 후 repo/zip 결정)로 추가, §4.1 preflight에 evidence 확인·민감정보 없음·FAIL 시 제출 전 보정 항목 추가.
- **Claude Code는 실제 Codex app/CLI를 조작하지 않음.** 실제 설치 확인은 사용자 직접 수행 대기.
- 완료 보고: `docs/cycle2h_user_led_install_verification_kit_completion_report.md`.

## 이전 Cycle: Cycle 2G (+ Patch)
- **Cycle 2G (+ Patch)** — Codex Marketplace / Local Install Readiness. repo/local marketplace 추가·manifest metadata 보강 후,
  `policy.authentication`을 허용값 `ON_INSTALL`로 보정(D34). Codex Cycle 2G Patch Review **PASS**(`docs/reviews/codex_cycle2g_patch_marketplace_auth_review.md`).

## Cycle 2G Patch (Codex Marketplace Review 대응)
- Codex 판정: **CONDITIONAL PASS**(`docs/reviews/codex_cycle2g_marketplace_install_readiness_review.md`). Major: marketplace
  `policy.authentication` 값 `NONE`이 허용값(`ON_INSTALL`/`ON_USE`) 밖 → install failure 위험.
- 보정: `.agents/plugins/marketplace.json`의 `authentication`을 `NONE` → **`ON_INSTALL`**(schema 허용·보수적 기본값). 실제 자격증명 요구는 추가하지 않음.
- 문서 정합: `docs/codex_install_readiness.md`·current_status의 `NONE`/무인증 문구 현행화, `submission_packaging_policy.md` §4.1에 authentication 허용값 점검 추가, decision_log D34(정정).
- validator/renderer/schema·manifest 핵심 필드·`source.path`(`./src`)·name 정합 무변경. 완료 보고: `docs/cycle2g_patch_marketplace_auth_completion_report.md`.

## Cycle 2G 완료 작업 (Patch 이전 base)
- 신규 `.agents/plugins/marketplace.json`: 로컬/Repo marketplace 정의. `plugins[].name`=`samil-kssb-precheck`(manifest와 정합),
  `source.source`=`local`·`source.path`=`./src`(plugin root=src/), `policy`=`installation: AVAILABLE`/`authentication`(Patch에서 `ON_INSTALL`로 보정), `category: Productivity`.
- `src/.codex-plugin/plugin.json` metadata 보강: `interface`(displayName·shortDescription·longDescription·developerName·category)·`keywords`·`repository` 추가.
  핵심 4필드(name/version/description/skills) 유지, Hook/MCP/apps/assets 미추가, 제품 경계 문구 유지.
- 신규 `docs/codex_install_readiness.md`: 위치·경로 요약(marketplace/plugin root/source.path/manifest/skills), 정합성 규칙, local vs public 구분, 수동 확인 절차, GUI 확인은 별도 단계.
- `docs/submission_packaging_policy.md`: marketplace 파일 A분류 추가, §4.1에 marketplace JSON 문법·name 정합·source.path·local vs public 점검 추가.
- README·architecture 저장소 트리에 `.agents/plugins/marketplace.json` 반영, architecture에 install readiness 절 추가. current_status·decision_log(D33) 갱신.
- 완료 보고: `docs/cycle2g_marketplace_install_readiness_completion_report.md`.

## 이전 Cycle: Cycle 2F
- **Cycle 2F** — 제출 패키징 사전점검/정책 정리(문서만, submission.zip 미생성).
  Codex Cycle 2F Submission Preflight Review **PASS**(`docs/reviews/codex_cycle2f_submission_preflight_review.md`).

## Cycle 2F 완료 작업
- 신규 `docs/submission_packaging_policy.md`: (1) 포함/제외 5분류(A repo+zip / B zip-only 조건부 / C 생성 제외 /
  D 제출 전 재생성·재검증 / E 절대 금지) 표, (2) logs 원본 제출 방식(원본·무편집 원칙, 요약 대체 금지, commit vs
  zip-only 결정 기준, 파일명·위치, 민감정보 스캔, 미확정 사항), (3) 샘플 실행 산출물 위치 정책, (4) 최종 제출 preflight checklist.
- `docs/planning/submission_packaging_checklist.md`: 정책 통합 문서로의 포인터 추가(요약 체크리스트로 위치).
- `docs/workflow_usage.md`: 산출물 정책에 submission 정책 포인터 추가.
- current_status·decision_log(D32) 갱신. 코드·스키마·테스트·`.gitignore` 변경 없음.
- 완료 보고: `docs/cycle2f_submission_preflight_completion_report.md`.

## 이전 Cycle: Cycle 2E
- **Cycle 2E** — Skill Workflow Wiring / Usage Contract 정리(문서 정합, 코드 변경 없음).
  findings → 검증기 preflight(detect-only) → 렌더러 형식 변환(재판정 없음) → 사람 검수 흐름을 문서 전반에 반영.
  Codex Cycle 2E Workflow Review **PASS**(`docs/reviews/codex_cycle2e_workflow_review.md`).

## Cycle 2E 완료 작업
- `SKILL.md`: 산출 흐름 blockquote에 검증→렌더→사람 검수 반영, "Workflow" 절 신설(내부 구성요소 명시), Output policy의
  "렌더러 미구현" 잔여 문구 현행화, 완료 점검에 검증기 preflight error 0건 조건 추가.
- 신규 `docs/workflow_usage.md`: findings→검증→렌더→사람 검수 사용 계약, 구성요소 경계 표, 내부/검증용 실행(사용자 흐름 아님), 산출물·경계 정책.
- `README.md`: 작동 방식을 워크플로우로 현행화, 저장소 구조에 schemas/validators/renderers/tests 추가, 스테일 "Cycle 1 현재 상태"를 현재 구현 상태로 교체.
- `docs/architecture.md`: 저장소 트리 갱신, "Workflow 구성요소" 절 추가, Skill-first 노출 문구를 내부 구성요소 반영으로 정정, 실행 의존성 행 현행화.
- `completion_checklist.md`: "워크플로우" 점검 그룹(검증기 preflight·렌더러 생성·내부 구성요소 취급) 추가.
- 코드(validator/renderer/schema)·테스트는 **변경하지 않음**. Preflight로 기존 테스트 통과 재확인.
- 완료 보고: `docs/cycle2e_workflow_wiring_completion_report.md`.

## 이전 Cycle: Cycle 2D (+ Patch)
- **Cycle 2D (+ Patch)** — 경량 검증/가드레일 추가 후, Codex Cycle 2D Validation Review(CONDITIONAL PASS)
  Major 대응. `jsonschema` 없는 표준 라이브러리 fallback 모드에서도 schema-required 중첩 구조 누락을 error로 감지하도록 보강.
  Codex Cycle 2D Patch Review **PASS**(`docs/reviews/codex_cycle2d_patch_review.md`).

## Cycle 2D Patch (Codex Validation Review 대응)
- Codex 판정: **CONDITIONAL PASS**(`docs/reviews/codex_cycle2d_validation_review.md`). Major: fallback 모드에서
  `source_documents[].title/source_mode`, `kssb_areas[].area_id/area_name/items` 등 중첩 required 누락 미감지.
- 보강: `_check_source_modes`에 title·source_mode 필수 존재 검사 추가, `_check_area_structure` 신규(area_id·area_name·items),
  `_check_items`에 judgment_label 필수 검사 추가. 전부 detect-only(findings 미변경). full JSON Schema 대체가 아니라
  Cycle 2E preflight gate용 핵심 required 구조 보강(README/docstring 정합).
- 테스트: fallback 누락 6건 + valid example fallback 0건 케이스 추가(`tests/test_findings_validator.py` 19건).
- Preflight: schema/example 문법 OK, 검증기 CLI RC0, validator 19/19 PASS, renderer smoke 22/22 PASS, 새 외부 의존성 없음.
- 완료 보고: `docs/cycle2d_patch_validation_completion_report.md`.

## Cycle 2D 완료 작업 (Patch 이전 base)
- 검증기: `src/validators/kssb_findings_validator.py`(표준 라이브러리만, `jsonschema`는 있으면 선택 사용).
  구조 필수 필드, `source_id` cross-reference, review_mode↔source_mode↔judgment_label 정합,
  source-bound 조건부 규칙, evidence quote 빈값, customer_questions 필수 6필드, 금지 표현 스캔(고지·경계 필드 제외),
  내부 경로 노출 스캔을 **감지·보고만** 한다(findings 미변경).
- 보조 문서: `src/validators/README.md`(detect-only 경계·규칙·사용).
- 재사용 테스트: `tests/smoke_test_renderer.py`(렌더러 스모크, 출력은 repo 밖 임시 폴더), `tests/test_findings_validator.py`
  (valid example error 0건 + 손상 사본에서 기대 코드 검출), `tests/README.md`. 새 pytest 의존성 없음.
- 문서 정리(Codex Cycle 2C Renderer Review Minor): `report_template.md`의 "렌더러 미구현" 문구를 현행화,
  `completion_checklist.md` 질문 항목에 관련근거 추가(6필드 정합).
- Preflight: schema/example JSON 문법 OK, 검증기 example RC0, 렌더러 스모크 22/22 PASS, 검증기 테스트 12/12 PASS,
  새 외부 의존성·의존성 매니페스트 없음.
- 완료 보고: `docs/cycle2d_validation_completion_report.md`.

## 이전 Cycle: Cycle 2C 완료 작업
- Codex Cycle 2C Renderer Review **PASS**(`docs/reviews/codex_cycle2c_renderer_review.md`).
- 렌더러: `src/renderers/kssb_report_renderer.py`(Python 표준 라이브러리만, 외부 의존 0).
  findings JSON을 읽어 stdlib `zipfile` OOXML DOCX와 self-contained HTML fallback을 결정적으로 생성.
  판정·근거·질문·권고를 **재계산하지 않고** 형식 변환(정렬·표·escape·sanitize·안전 오류)만 수행.
- 보조 문서: `src/renderers/README.md`(렌더러=Skill 워크플로우의 내부 형식 변환기 포지셔닝, 산출물 커밋 정책).
- 스모크 테스트(example JSON): schema/example JSON 문법, DOCX 생성·zip 무결성·내부 XML 파싱, HTML 핵심 섹션 포함,
  결정성(동일 바이트), 파일명 규칙, 재판정 금지(출력 판정 라벨=입력 라벨), 누락 필드 안전 처리 — **33건 전부 PASS**.
- `.gitignore`에 렌더러 산출물(`*_KSSB_공시근거_사전검토보고서.docx/.html`, `build/`, `out/`) 제외 추가.
- 완료 보고: `docs/cycle2c_renderer_completion_report.md`.
- **생성 DOCX/HTML은 커밋하지 않음**(스모크 출력은 repo 밖 임시 폴더에 생성).

## 이전 Cycle
- **Cycle 2B (+ Patch)** — Findings Schema Contract 확정 후 Codex Schema Review(CONDITIONAL PASS) Major 지적 보정.
  Codex Cycle 2B Patch Review **PASS**(`docs/reviews/codex_cycle2b_patch_review.md`). 렌더러·validator 코드·Hook/MCP·샘플 실행 없음.

## Cycle 2B Patch (Codex Schema Review 대응)
- Codex 판정: **CONDITIONAL PASS**(`docs/reviews/codex_cycle2b_schema_review.md`).
- Major 해소: `customer_question` 스키마 계약을 질문 규칙·보고서 템플릿과 정합 — `related_evidence`·`follow_up_action` 필드 추가 + 실무 필드 필수화.
- 갱신: schema/example/contract, customer_question_rules·completion_checklist 정합 보강. 완료 보고 `docs/cycle2b_patch_completion_report.md`.
- Minor(수동 검증 규칙: source_id cross-ref·모드↔라벨 정합 등)는 이미 계약 문서에 명시. 향후 경량 검증 단계에서 우선 처리(보류).

## 사이클 이력 (요약)
- **Cycle 1** — Skill-first Codex 플러그인 1차 골격. Codex 독립 리뷰 **PASS**(`docs/reviews/codex_cycle1_independent_review.md`). Minor: submission.zip 원본 로그 포함.
- **Cycle 2A** — 구현 계획 수립(planning-only). Codex Planning Review **PASS**(`docs/reviews/codex_cycle2a_planning_review.md`). Minor: 로그 포함 방식 확정(제출 단계), current_status·decision_log 잔여 Cycle 1 문구 정리.
- **Cycle 2B** — 본 사이클. 구조화 findings 데이터 계약 확정.

## Cycle 2B 완료 작업
- Findings 스키마: `src/schemas/kssb_findings.schema.json`(JSON Schema draft-07, 외부 의존 0). `judgment_code`별 source-bound 필수 조건을 `if/then`으로 강제.
- 예시 findings: `src/schemas/kssb_findings_example.json`(가상 공개 보고서, 4대 영역, 판정 5종 포함, 실제 기업·파일명 미사용).
- 계약 문서: `docs/findings_schema_contract.md`(생성/소비 주체, 렌더러 재판정 금지, review_mode, judgment_code↔label, source-bound 규칙, 수동 검증 규칙).
- Skill 문서 최소 정합성 보정: `SKILL.md`, `report_template.md`, `completion_checklist.md`(findings-first 흐름·렌더러 재판정 금지·근거 앵커 필수·확인 불가→질문 반영).
- current_status·decision_log 정리(Codex Cycle 2A Minor 반영).
- **렌더러/validator 코드·Hook/MCP·샘플 PDF·Python 코드 복사 없음.**

## 문서 템플릿 정비 (Cycle 2B 이후)
- 반복 사용 양식 추가: `docs/reviews/REVIEW_REPORT_TEMPLATE.md`(공통 리뷰 보고 형식),
  `docs/templates/`(완료보고·Codex 리뷰 프롬프트·Claude Code 작업 프롬프트·Preflight 체크리스트·decision log 항목·README).
- 향후 Codex 리뷰는 `REVIEW_REPORT_TEMPLATE.md`를 참고하는 **짧은 프롬프트 방식**으로 전환.
- 완료 보고: `docs/template_system_completion_report.md`.
- **Cycle 2B schema/example/contract 및 Skill 문서는 수정하지 않음(검증 대기).**

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
- Cycle 2H Install/Smoke Evidence push 후 **ChatGPT 확인 대기**. 다음 단계는 Codex evidence review + Cycle 2I(Real Report Practical Output Validation) 제안(실제 분석은 미착수).
- 최종 검증·PASS/FAIL 판정은 **Codex**가 수행한다. 검증 기준은 `docs/validation_criteria.md` 참조.
- 최종 commit SHA는 자기참조 문제로 문서에 고정하지 않고 작업 완료 채팅 보고에 기재한다.
