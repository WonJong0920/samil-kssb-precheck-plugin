# B3 — Node 런타임 스모크 + 실사용 UX Evidence (2026-07-09)

> **성격**: B3 evidence 문서다. **집계·hash·관찰만** 기록하며 원본 샘플·생성 산출물은 **repo 미커밋**이다.
> Claude Code는 **PASS/FAIL 판정을 하지 않는다** — 판정은 후속 **Codex evidence review**가 수행한다.
> Kit: `docs/planning/b3_smoke_and_real_ux_evidence_kit.md`(Codex design review PASS — `2307a2e`).
> B3a와 B3b는 결정성·실행 주체가 달라 **섹션을 분리**한다(kit review OBS-03).
> 실행 HEAD: `3d07242`(finding-capture 커밋 이후). 환경: Node v24.16.0, 참조 Python 3.14.5(D94 bad-findings 생성용).
> 산출물은 **repo-외부 임시 폴더**(`<TEMP>`)에 생성 후 관찰·해시만 기록(원본 미커밋).

## A. B3a — 로컬 결정적 Node 런타임 스모크 (Claude 실행) — 관측 완료

### A1. 전체 Node 테스트 스위트 (OBS-02 — 실행 시점 실측 카운트)
- `node --test tests/*.test.cjs` → **tests 365 · pass 365 · fail 0 · skipped 0** (duration ≈ 57s).
- 관찰: 회귀 없음(현 baseline과 일치).

### A2. 성공 경로 delivery (`--manifest`)
- `node src/renderers/kssb_report_delivery.cjs src/schemas/kssb_findings_example.json -o <TEMP>/report --manifest`
- exit **0**. 산출물 4종(대표 문서 우선순위 **DOCX → HTML → Markdown**, primary=DOCX):

  | 파일 | bytes | sha256(선두 16) |
  |---|---|---|
  | `…_사전검토보고서.docx` | 6599 | `07a539e5506d1b7c` |
  | `…_사전검토보고서.html` | 12830 | `6ee2521a7012fa65` |
  | `…_사전검토보고서.md` | 9480 | `87e72e223e8d7078` |
  | `run_manifest.json` | 1689 | `167006a04f30c9fb` |

- **manifest capture 확인(OBS-01 규약 — exit 0 단독 아님)**: `run_manifest.json` **파일 존재** + `manifest_sha256`
  = `0b9880bd288d69c5eeae047d9e7740ce2ddecdda22489c5acf3e16be941a88a3`.
- **user_summary(stdout) 관찰**: 대표 문서 파일명·형식(우선순위 명시)·fallback(html/md)·preflight 요약(error 0,
  warning 0, "세부는 내부 점검 기록으로 분리")·사람 검수 안내·경계 고지(삼일 비공식·감사/인증/준수 대체 아님) 포함.
  **표시 경로 = 파일명만**(repo-외부라 절대경로 미노출). DOCX 6599B는 N4 문서(컨테이너 차이·파트 콘텐츠 byte-identical)
  기록과 일치.

### A3. D94 hard stop (의도적 error findings — 한 anchor `quote=""`)
- bad findings = 알려진 example을 최소 복사 후 첫 anchor `quote`를 `""`로 변형(kit review 권고대로).
- `node …/kssb_report_delivery.cjs <TEMP>/bad.findings.json -o <TEMP>/report_bad` → exit **4**.
- **out-dir(`report_bad`) 미생성** 확인. stdout = sanitized 한국어 안내("보고서 생성을 중단했습니다 … findings를
  보완한 뒤 다시 생성 … 세부 오류 내역은 내부 점검 기록으로 분리"). validator raw·로컬 경로·stack **미노출**.

### A4. 누출 / 금지표현 스캔 (성공 user_summary)
- 경로/스택 패턴(`C:\`·`/Users/`·`AppData`·`/tmp/`·`\Temp\`·`Traceback`·`node_modules`): **0건**.
- 강한 금지 어구(`준수 확정`·`인증 의견`·`적합 판정`·`감사 추적`·`감사 의견`·`audit trail`·`제3자 검증 완료`·
  `자동 감사`): **0건**.
- **OBS-01 반영**: user_summary의 "감사·인증·준수 판단을 대체하지 않는다"는 **필수 경계 negation 문구**로 정상이며
  금지 위반이 아니다(강한 금지 어구 스캔과 구분).

### A5. 결정성 (2회 실행 대조)
- 동일 findings 2회(`report` vs `report2`) → **4파일 전부 byte-identical**(docx·html·md·run_manifest.json 모두 identical).

### A6. Repo 오염
- 실행 후 `git status --porcelain --untracked-files=all` → repo 신규 변화 **0**(산출물은 `<TEMP>`에만).

### A7. B3a 관찰 요약(판정 아님)
- 결정적 뒷단(preflight → D94 → renderer → delivery)은 **관측상 기대 동작과 일치**(성공/실패 경로·누출 0·결정성·
  오염 0). **판정(PASS/FAIL)은 Codex evidence review 몫.** B3a는 Node 런타임의 **하한선** 근거이며 아래 B3b(실제
  Codex 플러그인 표면)를 대체하지 않는다.

## B. B3b — 실사용 Codex 플러그인 UX (User 실행) — **PENDING (미실행)**

- 정식 B3b(공개자료 1건 업로드 + "이 보고서 검토해줘" + kit §5 캡처)는 **아직 미실행**. 실행 후 이 절을 채운다.
- **단, 사전 관측 finding 1건**(사용자 실사용 관측 — kit §6-1):
  - **인코딩 모지바케 나레이션**: 안내 파일이 깨져 보여 "UTF-8로 다시 읽겠다"류 문구를 매 호출 반복 노출.
  - 검증: 플러그인 스킬/매니페스트 10종 **전부 valid UTF-8·BOM 없음·LF**(파일 결함 아님).
  - 근본 원인: 호스트의 Windows 기본 코드페이지(예: cp949) 오디코딩 → 자가 UTF-8 재읽기 → 나레이션(Phase 0 R3·
    blackbox §1 계열). **정확성 결함이 아니라 UX 노이즈**(source-bound 분석은 정상).
  - **완화 후행**: SKILL.md에 "UTF-8 간주 + 인코딩/재읽기 내부 동작 비노출" 지침(별도 묶음·Codex review). BOM 금지.
- 위 finding 외 B3b 관측치는 실행 시 기록.

## C. 한계 / 경계 (정직 표기)

- B3a는 **로컬 Node·현재 HEAD 기준** — Codex 플러그인 실행 환경과 동일 보장 아님(하한선).
- B3b는 **Skill(LLM) 판단 포함** → 1회 실행은 spot-check(재실행 시 findings 상이 가능).
- **실제 Codex 설치·실행·활성화 = 사용자 직접 검증(D35).** Claude는 "작동 확정"을 단정하지 않는다.
- **1회 실행 ≠ 2N-5 전체 통과·제품 완성·OCR complete·provider finalization·submission readiness.**
- repo-safety: 원본/산출물/`run_manifest.json`/bad findings **미커밋**, evidence는 집계·hash·관찰만.

## D. 다음 단계

1. **B3b 실행(User)** → 본 문서 §B 채움(캡처 템플릿·UX rubric·산출물 계약 rubric).
2. **Codex evidence review**(§A·§B 대조, 판정).
3. 이후 **B5**(submission packaging readiness audit — policy Python-era preflight Node 정합 포함) → **B6**(final review).
