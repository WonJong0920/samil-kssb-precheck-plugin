# 현재 상태 (Current Status)

## 운영 원칙 (고정)
- **역할 구분·보고 방식은 `AGENTS.md`와 `docs/operating_principles.md`에 고정**했다(Operating Principles Lock).
  Claude Code=작업 수행자(PASS/FAIL 판정 금지, 완료 보고는 repo 문서·채팅은 경로/SHA/push만), Codex=독립 검증자(판정·리뷰는 `docs/reviews/`),
  ChatGPT=작업 분기 판단, User=외부 앱/CLI 상태 검증·최종 제출 판단. 모든 Claude/Codex 프롬프트는 두 문서를 먼저 읽는다.

## 현재 Cycle
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
