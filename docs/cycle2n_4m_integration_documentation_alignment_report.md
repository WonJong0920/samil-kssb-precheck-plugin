# Cycle 2N-4M — Integration Documentation Alignment + No-overclaim Review (Report)

> **성격**: 문서 정렬 사이클이다(기능 구현 아님·코드 무변경). Codex 2N-4L implementation review **PASS**
> ("required fixes before 2N-5: 2N-4M user-facing documentation / no-overclaim refresh")에 따라,
> 2N-4I~4L에서 실제로 바뀐 경계를 사용자-facing 문서에 반영하고 stale/과장 표현을 제거했다.
> **이 정렬은 OCR support complete·L2/L3 complete·provider finalization·2N-5 통과가 아니며,
> Codex 2N-4M review 전까지 최종 승인이 아니다.**
>
> base commit: `97959029433e5d088869786ba326b542c1c55a3c` (pull 후 일치·clean)

## 1. 정렬 원칙 (모든 수정이 따른 8개 문장)

```text
- core plugin은 OCR을 자동 실행하지 않는다.
- Kordoc-first PDF 구조 보강 경로는 승인 기반 assisted runner 경로다(텍스트 PDF도 대상 — 권장·선택).
- 스캔/혼합 PDF는 승인 기반 local assisted OCR runner의 최소 page-set OCR 경로가 있다.
- OCR은 보조 자료이며 ocr_supplement로만 합류한다(OCR 단독 confirmed 승격 없음).
- no-egress는 nethook 실행 기록(provenance)으로 확인되는 프로세스 수준 검증이다(OS/커널 보안 보장 아님).
- native rasterizer는 tool-cache assisted path에 격리된다.
- unavailable/declined/failed/timeout/mismatch/blank/no-target은 baseline fallback 또는 정중 종료.
- 최종 판단은 사람(컨설턴트)이 한다.
```

## 2. 문서별 변경 내역

### docs/user_quickstart_pre_2n_5.md (가장 큰 정렬)
- **§3 matrix**: 텍스트 PDF 행 — 기본 경로 유지 + "(권장·선택) 구조 보강 판독" 열 추가(승인 기반·거부 시
  기본 경로 계속). 혼합 PDF 행 — "'판독 필요' 페이지만 OCR" 선택 경로·별도 승인·fallback 명시. 스캔 전용
  PDF 행 — **"플러그인 내 OCR 실행은 미구현" 제거** → 승인 기반 최소 OCR 경로(상한·제한시간·정확도 미보증
  보조 재료) + "승인 없이 OCR이 실행되는 일은 없음". HWP-계열/미지원 행 무변경(구현 무변경).
- **§4 상태 구분**: assisted 행에 PDF 구조 보강·최소 OCR 경로 추가, pending 행에서 "OCR 실행(미구현)" 제거
  → "OCR 실행 한도 기본값의 실 스캔 실측 보정", 미지원 행 → "**무승인 자동 OCR**"로 정확화. 과장 주의
  문단에 "core는 OCR을 자동 실행하지 않음 / 최소 구현이며 OCR 지원 완료 아님" 명시.
- **§5 승인 흐름**: OCR **별도 승인** 문단 신설 — 두 출처(공식 npm registry + 언어 인식 데이터 공개 저장소)
  분리 고지·SHA-256 fail-fast·판독 필요 페이지만·검수 경계. no-egress 문구에 "프로세스 수준 검증이며 OS
  방화벽 보장이 아님" 괄호 보강.
- **§7 시나리오**: 12건 → **15건**으로 재구성(2N-5 재진입 기대조건 — §4 참조).

### README.md
- 요약 3줄 재작성: ① 기본 경로 + PDF 구조 보강(선택·권장) ② HWP-계열+OCR 모두 승인 기반 선택 경로·no-egress
  는 실행 기록 기반 프로세스 수준 검증 ③ "플러그인 내 OCR 실행은 미구현" 제거 → "**core는 OCR을 자동 실행하지
  않는다** — 승인 기반 최소 경로·검수용 보조 재료 전용·L3 미지원".
- 구조 트리의 intake 주석: "OCR 실행 미구현" → 보조 runner 3종(구조 판독·PDF router·최소 OCR)과 "core는
  OCR을 자동 실행하지 않음"으로 갱신.
- "현재 구현 상태": intake bullet에 2N-4J router·2N-4L OCR runner 반영, 미포함 목록을 "무승인 자동 OCR"로
  정확화(경계는 유지하되 stale 부정 제거).

### src/skills/samil-kssb-precheck/SKILL.md (Inputs 문구만 — Skill 행동 무변경)
- "현재 범위에서는 OCR 실행 코드를 포함하지 않는다" → "**core 워크플로우는 OCR을 자동 실행하지 않으며 OCR
  실행 코드를 포함하지 않는다**"(사실 유지 — OCR runner는 core 밖 intake/runners).
- "plugin-side OCR 실행은 미구현" → ladder 문구("core는 OCR을 자동 실행하지 않는다 — core 밖 승인 기반
  로컬 assisted runner의 최소 page-set 경로로만 제공, OCR 지원 완료 아님"). ocr_supplement 출처 서술을
  "승인 기반 로컬 assisted OCR runner 또는 out-of-band 도구"로 갱신(규칙 자체는 무변경).

### src/skills/samil-kssb-precheck/evidence_mapping_rules.md (§6 — 규칙 무변경, 출처·범위 서술만)
- ocr_supplement 출처 서술 갱신(위와 동일). §6 인용 규칙(OCR 유래 표기·confirmed 단독 승격 금지·보수적
  매핑·검수 필수)은 **문자 그대로 유지**.
- "범위 경계" 항목: "plugin-side OCR 실행 미구현" → ladder 문구 + "산출물은 이 §6 규칙으로만 합류".

### src/intake/README.md (Capability ladder 절)
- "OCR을 실행하지 않고(plugin-side OCR 실행 미구현)" → ingest는 실행하지 않음(무변경 사실) + 실행 주체는
  `runners/pdf_ocr_runner.cjs`(승인 기반·자동 실행 없음·tool-cache 격리) 명시 + "core plugin은 OCR을 자동
  실행하지 않는다" 유지.

### docs/workflow_usage.md (경계 절)
- "문서 변환/OCR…은 현재 범위에 포함하지 않는다" → "core는 자동 실행하지 않으며 승인 기반 로컬 보조
  runner로만 제공"으로 정확화(Hook/MCP·submission.zip 제외는 유지).

### 수정하지 않은 것(의도)
- `src/intake/runners/README.md` — 2N-4L에서 이미 정렬됨(OCR runner 항목 + "하지 않는 것" 절 갱신).
- 코드·테스트·schema·validator·renderer·delivery·manifest — 무변경(문서 정렬 사이클).
- 과거 계획/리뷰/decision_log/current_status의 **historical bullet** — 당시 기록으로 보존(현재-facing
  아님). `docs/decision_log.md` — **신규 결정 없음**: 이번 문구 전략은 D91/2N-4I plan §8("core는 자동
  실행하지 않음 / 승인 기반 로컬 runner가 실행" — D70 승격 근거 보존)에 이미 정의된 것의 집행이다.

## 3. 제거·정정된 stale/위험 표현

| 이전 | 이후 |
|---|---|
| "플러그인 내 OCR 실행은 미구현" (README·quickstart·SKILL·§6·intake README 5개소) | "core는 OCR을 자동 실행하지 않는다 + 승인 기반 로컬 assisted runner의 최소 page-set 경로" |
| 스캔 PDF "자동 OCR을 기대하지 마세요(pending)" | 승인 기반 선택 경로 존재 + "승인 없이 실행되는 일은 없음" |
| "미지원: 스캔 문서의 자동 OCR 처리" | "미지원: **무승인** 자동 OCR"(승인 기반 경로와 구분) |
| no-egress 서술(보안 보장으로 읽힐 여지) | "실행 기록(provenance) 기반 **프로세스 수준** 검증 — OS 방화벽 보장 아님" 명시(quickstart·README) |
| workflow_usage "OCR은 범위에 포함하지 않는다" | "core는 자동 실행하지 않음 / 승인 기반 보조 runner로만 제공" |

검증 스캔: 사용자-facing/현재-facing 문서(README·quickstart·workflow_usage·SKILL·§6·intake README·runners
README)에서 "OCR 실행 미구현"류 0건, "OCR 지원 완료/no-egress 보장/구현 완료"류는 negation·점검 항목 문맥만
잔존. "Kordoc-first 구현 완료" 표현 없음(모든 현재-facing 서술이 "최소 구현·리뷰 전 최종 승인 아님" 한정).

## 4. 2N-5 재진입 기대조건 (quickstart §7 — 15개 시나리오)

quickstart §7 체크리스트를 2N-5 재진입 시나리오 목록으로 재구성했다(실행하지 않음 — 문서화만):

1. 텍스트 PDF baseline / 2. 텍스트 PDF **구조 보강 승인**(Kordoc-first) / 3. 혼합 PDF OCR **미승인**
(한계 공시) / 4. 혼합 PDF **needsOcr page-set OCR 승인** / 5. 스캔 전용 PDF **전 페이지 OCR 승인** /
6. OCR **unavailable·거부·설치 실패·무결성 불일치** → baseline 수렴 / 7. **blank guard·timeout·page cap**
거절 UX(부분 산출물 0) / 8. OCR **대상 0페이지** 정중 종료 / 9. DOCX / 10. HWPX / 11. HWP 미설정·준비됨
(기존 경로 회귀 없음) / 12. portable Node 수락·거부 / 13. 미지원/손상 / 14. 전달 fallback /
15. repo 오염 점검 + **산출물 no-overclaim 점검**(OCR 지원 완료·준수 확정류 표현 0·provider명 무노출).

재진입 전 확인 조건: ① Codex 2N-4M review 통과 ② 2N-5 프롬프트에 실행 환경·Python 호출 규약 명시
(2N-4H "반드시" 항목 — 여전히 유효) ③ 실 스캔 실측으로 bounded 기본값 보정은 2N-5 중 관찰 항목(C2N4L-OBS-01).

## 5. no-overclaim checklist (2N-5 산출물·문서 공통)

- [ ] "OCR 지원/구현 완료·L2/L3 complete·provider finalization·product complete" 표현 없음
- [ ] core의 OCR 자동 실행을 암시하는 표현 없음(승인 기반·선택·최소 경로로만 서술)
- [ ] OCR 유래 인용에 출처 표기 + confirmed 단독 승격 없음(§6)
- [ ] no-egress를 OS/커널 보안 보장처럼 서술하지 않음(프로세스 수준 provenance)
- [ ] 감사·인증·준수 판단을 AI가 확정하는 표현 없음(사람 검수 전제)
- [ ] baseline fallback(거부=정상 경로) 서술 유지
- [ ] provider명·로컬 경로·내부 사이클명이 사용자 보고서에 미노출(§7)

## Final Report

- **status/verdict**: **ALIGNED — Codex 2N-4M review 대기** (최종 판정 아님)
- **changed files** (8건 — 전부 docs/문구):
  `docs/user_quickstart_pre_2n_5.md` · `README.md` · `src/skills/samil-kssb-precheck/SKILL.md`(Inputs 문구) ·
  `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`(§6 서술) · `src/intake/README.md` ·
  `docs/workflow_usage.md` · 본 보고서 · `docs/current_status.md`(최소 갱신)
- **documentation alignment summary**: §2 — 사용자-facing 7개 표면을 8개 정렬 원칙(§1)으로 통일.
  구현 상태(2N-4J router + 2N-4L 최소 OCR)와 문서 서술의 불일치 제거.
- **stale wording removed**: §3 표 — "OCR 미구현"류 5개소·자동 OCR 기대 금지 문구·범위 제외 문구 정정,
  no-egress 서술에 프로세스 수준 한정 명시.
- **no-overclaim safeguards**: §1 원칙 + §5 체크리스트 + quickstart 과장 주의 문단 + 시나리오 15(산출물
  no-overclaim 점검 항목화).
- **quickstart/user-facing changes**: §2 첫 항목(matrix 3행 재작성·상태 구분·승인 흐름 OCR 문단·시나리오
  12→15).
- **Skill/evidence wording changes**: 있음 — **문구만**(Inputs·§6 서술). Skill 행동·판정 규칙·§6 인용 규칙
  자체는 무변경(전 테스트 green으로 확인).
- **2N-5 re-entry expectations**: §4 — 15 시나리오 + 재진입 전 확인 조건 3건.
- **scope compliance**: 코드/스키마/validator/renderer/delivery/DEI/router/runner 무변경 · 설치/다운로드/
  OCR·rasterizer 실행 0 · 2N-5 실행 0 · submission.zip 0 · 금지 artifact 0 · finalization/complete 선언 0.
- **verification performed**: stale·no-overclaim 표현 스캔(사용자-facing 문서 — §3) · `git diff --check`
  clean · 변경 파일 목록 = 예상 8건 · 문서만 수정이나 안전 확인으로 전체 테스트 재실행 —
  Node 4종(OCR 29·router 21·runner 39·bootstrap 11) + Python 4종(parity 11·runner 49·intake 83·nethook 29)
  **전부 green**(문구 변경이 코드 계약을 건드리지 않음을 증명 — SKILL/§6은 코드가 참조하지 않는 지침 문서).
- **required follow-up**: ① Codex 2N-4M integration/documentation review ② 2N-5 프롬프트에 실행 환경·
  Python 호출 규약 명시(2N-4H 이월) ③ 실 스캔 실측 기반 bounded 기본값 보정(2N-5 관찰 — C2N4L-OBS-01)
  ④ 제출 패키징 단계에서 packaging policy A-class 표에 `src/intake/` 명시(C2N4H-MIN-01 이월).
- **carry-forward to Codex review**: §1 정렬 원칙의 문서 반영 적정성, §3 stale 제거 완전성(특히 quickstart
  matrix ↔ 실제 runner 동작 대조), §4 시나리오 15종이 2N-5 계획으로 충분한지, Skill/§6 문구 변경이 행동
  변경 없음의 확인.
- commit SHA는 채팅 보고에 기재.
