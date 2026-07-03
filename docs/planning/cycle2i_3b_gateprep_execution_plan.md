# Cycle 2I-3B GatePrep 실행계획 — Gate A / Gate B / Version Strategy

> **성격**: **실행계획 문서(Plan Mode)**. gate를 **실제로 실행하지 않는다.** 다음 실행자가 **그대로 gate 작업에 착수**할 수 있도록
> 절차·evidence 기록 항목·PASS/HOLD/FAIL 기준·구현 진입 조건을 고정한다.
> **하지 않는 것(이번 문서)**: Kordoc 설치/재실행·no-egress 실제 테스트·license 실제 정밀 검토·코드 구현·dependency/package 파일 추가·
> schema/validator/renderer/delivery 변경·MCP/client 설정·OCR/formula/PDF 재실행·submission.zip.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: `cycle2i_3b_optional_intake_adapter_design.md` + Codex PASS(`codex_cycle2i_3b_optional_intake_adapter_design_review.md` §11/§12).

## 1. 목적 / 입력 근거

2I-3B 설계(Codex **PASS**, findings 0)는 Kordoc을 core 밖 optional 어댑터로 격리하고, 구현 전 필수 gate 3종을 정의했다.
이 문서는 그 gate들을 **실행 가능한 절차**로 구체화해, 승인 시 다음 실행자가 바로 수행하고 그 결과로 **구현 사이클 진입 여부**를 판정할 수 있게 한다.

- **Gate A** — hard no-egress rerun (EV-MIN-01: 관측 무-egress → 강제 검증으로 승격).
- **Gate B** — transitive/native dependency license review (EV-MIN-02).
- **Version Strategy** — `kordoc@3.8.2 + pdfjs-dist@4.10.x` pin / compat-check / fail-fast 확정.
- **유지**: v1 OCR/formula/scanned 제외(EV-MIN-03), opt-in/local-only posture(core dependency·submission 기본 불변).

## 2. 공통 실행 원칙 (모든 gate)

- **사용자 승인 + 사용자 로컬** 수행. 외부 앱/CLI 상태 변경은 사용자 직접(운영 원칙 §2.4).
- **repo 밖 임시 작업 디렉터리**에서만 실행. 샘플·변환물·raw log·`.mcp.json`·lock 파일은 **repo 미커밋**.
- **비민감 공개자료 또는 사용자 제공 비민감 로컬 파일만**(2I-3A 유형1/2 재사용 가능).
- **Redaction**(2I-3A runbook §11 계승): 로컬 경로→`[REDACTED_LOCAL_PATH]`, 계정→`[REDACTED_ACCOUNT]`, 토큰→`[REDACTED_TOKEN]`,
  식별 파일명·회사명→유형 라벨. evidence 커밋 전 재스캔.
- **검증된 버전 조합**(§5)으로만 실행. 미검증 조합이면 중단·기록.

## 3. Gate A — Hard No-egress Rerun

**목적**: 2I-3A에서 "관측상 무-egress"였던 파싱을, **네트워크 강제 차단** 상태에서 재현해 evidence로 승격. 통과 전 민감 문서 사용·기본 활성화·"무-egress 검증됨" 주장 금지.

### 3.1 사전조건
- 사용자 승인, §5 검증 버전 조합 설치본, 유형1·유형2(비민감) 준비, 아웃바운드 관찰 수단(방화벽 로그/연결 모니터) 확보.

### 3.2 실행 절차 (순서 고정)
1. **차단 방식 선택**(택1 이상): (a) OS 네트워크 비활성, (b) 방화벽 아웃바운드 차단(해당 프로세스/전체), (c) 네트워크 격리 VM·컨테이너.
2. **차단 상태 제어 검증**: 알려진 원격 host 연결이 **실패**하는지 먼저 확인(차단이 실제로 동작함을 입증). 실패 확인 못 하면 Gate A 중단.
3. **대표 파싱 재실행**: 유형1·유형2를 `--format json`으로 파싱(§5 CLI). `--formula-ocr`·`setup`·`mcp`·`check-formula-models` **미사용**.
4. **아웃바운드 관찰**: 파싱 동안 연결 시도/원격 다운로드(모델·폰트) **발생 여부**를 로그로 관찰·기록.
5. **결정성 재확인**: 동일 입력 2회 → markdown SHA 동일 여부(2I-3A 기준선과 비교).
6. **결과 정리**: 성공/실패, 연결 시도 유무, 사용 버전·명령을 evidence에 기록(민감정보 제거).

### 3.3 evidence 기록 항목
- 차단 방식 + **제어 검증 결과**(원격 연결 실패 확인 Y/N).
- 파싱 중 **아웃바운드 연결 시도 Y/N**(있으면 일반화된 상세, host/경로 마스킹).
- 파싱 성공 Y/N, 결정성(2회 SHA 동일) Y/N.
- 사용 패키지 버전·CLI 명령·관측자·일시.
- Redaction 확인 Y/N.

### 3.4 판정 기준
- **PASS**: 차단 제어 검증됨 + 파싱 성공 + **아웃바운드 연결 시도 없음** + 결정성 유지.
- **HOLD**: 차단 검증 불충분/부분 관찰만 가능/일부 유형 미실행 → 방법 보강 후 재수행.
- **FAIL**: 파싱 중 외부 연결/원격 다운로드 발생, 또는 오프라인에서 핵심 파싱 불가 → 어댑터 무-egress 전제 불성립 → 구현 보류·fallback.

## 4. Gate B — Transitive / Native Dependency License Review

**목적**: kordoc 본체 MIT 외 **전이 의존성 + native 바이너리**의 license·재배포/제출 적합성 확인(EV-MIN-02) 및 `docs/submission_packaging_policy.md` 정합. 통과 전 번들·기본 호출·submission 포함 금지.

### 4.1 범위
- **대상 조합**: §5 검증 조합(`kordoc@3.8.2` + `pdfjs-dist@4.10.x`) 기준 실제 설치 트리.
- **native/optional 주의**: `@hyzyla/pdfium`·`sharp`·`onnxruntime-node`·`@huggingface/transformers`는 **base+pdfjs 텍스트 파싱 경로에 필수 아님**(OCR/이미지·formula 계열).
  v1 범위(텍스트 PDF)에서 **설치·사용되는 의존성만** 1차 대상으로 하고, optional/native는 "미사용·미설치 유지" 전제를 명시적으로 확인.

### 4.2 실행 절차
1. **의존성 트리 열거**(오프라인, 설치본 기준): v1 경로에서 실제 설치되는 패키지+버전 목록화.
2. **license 식별**: 각 패키지 `package.json` `license` + LICENSE 파일 수집, SPDX 식별.
3. **의무 분류**: permissive(MIT/BSD/Apache-2.0 등) vs **copyleft/attribution 의무**(GPL/LGPL/MPL 등) vs unknown/dual.
4. **native 바이너리 확인**: v1 경로에 native 바이너리가 실제 포함되는지, 포함 시 해당 license·재배포 조건.
5. **제출 영향 판단**: 재배포/submission.zip 포함 시 의무를 `submission_packaging_policy.md`와 대조.
6. **미해결 항목 목록화**: 정밀 법률검토가 필요한 항목을 남긴다(이번은 절차·1차 식별, 최종 법적 판단은 별도).

### 4.3 evidence 기록 항목
- v1 경로 의존성 목록(패키지·버전·license·SPDX).
- copyleft/attribution 의무 패키지 유무·목록.
- native 바이너리 포함 여부·license.
- optional/OCR 계열 미설치·미사용 확인 Y/N.
- 제출 패키징 영향 요약 + `submission_packaging_policy.md` 정합 여부.
- 미해결/추가 검토 필요 항목.

### 4.4 판정 기준
- **PASS**: v1 경로 의존성이 permissive이며 의무 충족 가능, 문제 license(제출 불가 copyleft 등) 없음, native/OCR 리스크 v1에서 미노출, 제출 정책과 정합.
- **HOLD**: attribution 의무 미정리 / 일부 license unknown / 제출 포함 방식 미확정 → 정리·재판정.
- **FAIL**: v1 경로에 제출·배포 부적합 license 또는 회피 불가 의무 존재 → 어댑터 번들·기본 호출 불가(로컬 사용자 설치 전제만 가능성 재검토).

## 5. Version Strategy 확정 방법

- **검증된 조합(기준선)**: `kordoc@3.8.2` + `pdfjs-dist@4.10.x`(실측 4.10.38). 최신 `pdfjs-dist@6.1.200`은 2I-3A에서 실패(`doc.destroy`).
- **확정할 규칙**(구현 사이클 계약으로 문서화; 이번엔 규칙 확정만, lock/코드는 구현 시):
  1. **Pin 범위**: kordoc 정확 버전 pin, pdfjs-dist는 검증된 4.10.x로 제약(광역 `>=4` 금지).
  2. **Compat-check**: 어댑터 실행 전 설치 버전 확인 → **미검증 조합이면 fail-fast**(조용한 저품질 산출 금지).
  3. **Auto-upgrade 금지**: 자동 최신 갱신 비활성.
  4. **신버전 재검증 절차**: 새 버전 도입은 **새 evidence(파싱 성공·결정성·무-egress 재확인)** 통과 후에만.
  5. **불일치/미검증 시**: §Fallback로 회귀.
- **확정 방법**: 위 5개 규칙을 구현 사이클 진입 계약에 명문화하고, Gate A/B evidence와 함께 검토.

### 5.1 판정 기준
- **확정(OK)**: 5개 규칙이 구체화되고 검증 조합이 재확인됨.
- **HOLD**: compat-check/fail-fast 방식 미확정 → 보강.
- (버전 전략은 FAIL이 아니라 미확정 시 HOLD로 다룬다.)

## 6. v1 Scope 유지 (변경 없음)

- OCR/formula/scanned-PDF는 **v1 제외 유지**(EV-MIN-03). `needs_ocr`/`ocrCandidatePages`는 **신호로만** 소비("확인 불가 → `missing_info`+`customer_questions`+요청자료").
- 스캔/OCR을 범위에 넣으려면 **비민감 스캔 샘플을 동일 evidence 절차로 검증**한 별도 gate 필요.

## 7. Opt-in / Local-only Posture 유지 (변경 없음)

- 어댑터는 **선택·로컬**이며, **plugin core dependency·submission 패키징을 기본 변경하지 않는다.**
- core는 어댑터 없이 동작(§Fallback). 어댑터 산출물은 renderer/delivery/validator에 직접 입력되지 않고 DEI→Skill 경유(판정 미생성).

## 8. Gate 종합 판정 표

| Gate | PASS | HOLD | FAIL |
|---|---|---|---|
| **A no-egress** | 차단 검증 + 파싱 성공 + 연결 시도 없음 + 결정성 | 차단/관찰 불충분·부분 실행 | 파싱 중 egress 발생 or 오프라인 파싱 불가 |
| **B license** | v1 경로 permissive·의무 충족·제출 정합 | attribution/unknown 미정리 | 부적합 copyleft/회피불가 의무 |
| **Version** | 5개 규칙 확정 + 조합 재확인 | compat-check/fail-fast 미확정 | (해당 없음 — 미확정은 HOLD) |

## 9. 구현 사이클 진입 조건

**모두 충족 시에만** 별도 승인 하에 구현 사이클(예: 2I-3C, 최소 opt-in 어댑터 계약)로 진입:

- [ ] Gate A = **PASS**(evidence 기록).
- [ ] Gate B = **PASS**(evidence 기록 + `submission_packaging_policy.md` 정합).
- [ ] Version Strategy = **확정**(5개 규칙).
- [ ] v1 scope = OCR/formula/scanned 제외 유지 명시.
- [ ] Posture = opt-in/local-only, core dependency·submission 기본 불변 명시적 재확인.
- [ ] 경계 재확인: Skill-first·validator detect-only·renderer no-rejudgment·delivery separation·source-bound·사람 검수 불변.

**하나라도 HOLD/FAIL**이면 구현 미진입 — 해당 gate 보강(HOLD) 또는 어댑터 도입 보류·현행 fallback 운영(FAIL).

## 10. 실행 후 Codex Review 요청 포인트

Gate A/B/Version 실제 수행 후 evidence 문서에 대해 Codex 독립 검증 시 확인:
1. Gate A 차단이 **제어 검증**으로 실제 동작을 입증했고, 연결 시도 없음이 기록되었는가?
2. Gate B가 v1 경로 의존성 license를 실증적으로 식별하고 제출 정책과 정합했는가(native/OCR 미노출 포함)?
3. Version Strategy 5개 규칙이 fail-fast·auto-upgrade 금지·재검증까지 구체적인가?
4. v1 OCR/scanned 제외와 needs_ocr 신호-전용 소비가 유지되는가?
5. opt-in/local-only posture와 core 무변경 전제가 지켜지는가?
6. §9 진입 조건 체크리스트가 실제로 충족되어 구현 사이클 진입이 정당한가?

## 11. 이번 문서 검증 / 미실행 사유

- **문서만**(코드·테스트·schema·validator·renderer·delivery·manifest·marketplace·package/dependency·MCP 설정 무변경).
- **gate 실제 실행·Kordoc 설치/재실행·no-egress 테스트·license 정밀 검토·OCR/PDF 재실행: 모두 미수행**(본 문서는 절차·기준 고정까지). 로컬 경로·계정·토큰·API key 미포함.
