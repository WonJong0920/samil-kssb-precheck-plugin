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

## B. B3b — 실사용 Codex 플러그인 UX (User 실행) — 관측 완료 (2026-07-09)

- **입력**: 2024 K-water 지속가능경영보고서(공개 지속가능경영보고서 = **공개자료 검증 모드**, 권장대로). PDF
  126페이지. **원본·산출물 repo 미커밋.**
- **흐름**: 사용자가 "이 보고서 검토해줘"로 스킬 호출 → 지침·카탈로그 로드 → PDF 텍스트 추출(126p) → 항목별
  근거 대조 → 구조화 findings 생성 → validator preflight → 대표 문서(DOCX+HTML+MD) 생성. **end-to-end 완주.**
- **산출물**: `2024_K-water_지속가능경영보고서_KSSB_공시근거_사전검토보고서.docx`(primary) + html/md, 사용자
  Documents(repo-외부). 판정 10항목: **근거 확인 5 · 일부 근거 확인/보완 필요 4 · 조건부/적용대상 확인 필요 1**.
  핵심 질문: Scope 3·감축목표 진척·경영진 보고 체계·기후 재무영향. validator **error 0 / warning 0**(quote 수정 후).
  (원본·산출물 미커밋 — 파일 bytes/sha256은 로그에 미포함.)

### B-관측: 긍정 (설계대로 작동)
- **스킬 실제 호출·완주**: 실 공개 보고서에 대해 findings→validator→renderer/delivery 전 구간 실행, 대표 DOCX
  생성. Skill-first 진입점이 실동작.
- **출력 계약 충족**: DOCX 우선 + HTML/MD, 파일명 규칙, repo-외부 산출.
- **source-bound 규율 실동작(핵심)**: 검증기 원문 재탐색이 **인용 3건의 다단/줄바꿈 추출 불일치를 실제로 검출**
  → 에이전트가 §9 규율대로 **추출 텍스트에 실재하는 짧은 구간으로 교체** → warning 0. **재발견 안 되는 인용을
  유지하지 않음(환각 인용 차단이 실동작).**
- **보수적 판정**: confirmed 남발 없이 partial/조건부 활용. 질문이 실제 근거 공백(Scope 3 등)에 집중.
- **공개자료 모드**: PII/저작권 리스크 회피(원본 미커밋).

### B-관측: finding / rough edge (판정 아님 — Codex evidence review·후속)
1. **[확인] 인코딩 모지바케 나레이션 재현**(§6-1): "안내 파일이 한글 인코딩 문제로 깨져 보여 UTF-8로 다시
   읽겠다"가 실사용에서 재현. 자가 복구·source-bound 정상. **UX 노이즈**. → SKILL.md 완화 후행(별도 묶음, BOM 금지).
2. **[신규] 플러그인 번들 밖 문서 참조**: 스킬이 `docs/findings_schema_contract.md`(repo root `docs/`) 등을
   참조하나 **plugin `source.path=./src`라 `docs/`는 번들에 미포함** → 에이전트가 "계약 문서가 패키지에 포함
   안 됨"을 관측하고 **번들된 `src/schemas`·validator·renderer로 우회**. 기능은 완주했으나 **설치 플러그인에서
   dangling doc 참조**. → **B5 packaging**(계약 문서 번들 포함 또는 스킬의 `docs/` 참조 조정 검토).
3. **[신규/환경 확인] Python 차단 + PDF 추출 즉흥**: "Python 실행이 이 환경에서 막혀 있어"(D92 Node-only 근거
   재확인). core는 "텍스트 추출 가능 문서 전제·OCR/변환 미자동"인데 **실제 PDF 입력**에 부딪혀 에이전트가 **앱
   런타임의 PDF.js를 찾아 즉흥 추출**(문서화된 `src/intake/runners` 경로 아님). 도구 탐색 시행착오·Windows
   와일드카드 검색 실패 다수. → **PDF 입력 UX 러프 엣지**: 문서화된 입력 계약과 실제 사용자 행동(PDF 투입)
   간극. 안내/가이드 명확화 검토(후속).
4. **[minor 경계] 에이전트 최종 나레이션에 로컬 절대경로·계정명 노출**: delivery `user_summary`는 파일명만
   (B3a 확인)이나, **에이전트 자신의 채팅 링크가 `C:\Users\<계정>\Documents\...` 형태로 노출**. 경계 문구가
   에이전트 나레이션에도 적용됨을 상기. → minor(후속).
5. **[minor] 항목 수 흔들림(9→10)**: 카탈로그 항목을 9로 세었다가 10으로 자가 정정, 최종 보고서는 10 사용.
   일시적 추론 노이즈(출력은 정상).

### B-요약 (관찰)
실 공개 보고서 end-to-end가 **작동**하고 **source-bound 규율이 실제로 환각 인용을 차단**한 점이 핵심 긍정.
반면 **(2) 번들 밖 문서 참조**·**(3) PDF 입력 UX**는 제출 전 다룰 실질 finding(주로 B5/후속), **(1)**은 §6-1
재확인, (4)(5)는 minor. **판정(BLOCKED/PASS/FAIL)은 Codex evidence review 몫.**

## C. 한계 / 경계 (정직 표기)

- B3a는 **로컬 Node·현재 HEAD 기준** — Codex 플러그인 실행 환경과 동일 보장 아님(하한선).
- B3b는 **Skill(LLM) 판단 포함** → 1회 실행은 spot-check(재실행 시 findings 상이 가능).
- **실제 Codex 설치·실행·활성화 = 사용자 직접 검증(D35).** Claude는 "작동 확정"을 단정하지 않는다.
- **1회 실행 ≠ 2N-5 전체 통과·제품 완성·OCR complete·provider finalization·submission readiness.**
- repo-safety: 원본/산출물/`run_manifest.json`/bad findings **미커밋**, evidence는 집계·hash·관찰만.

## D. 다음 단계

1. B3b 실행(User) — **완료(2026-07-09), §B 기록.**
2. **Codex evidence review**(§A·§B 대조, 판정 — B3b finding (2)(3)의 경중 판단 포함).
3. 이후 **B5**(submission packaging readiness audit — policy Python-era preflight Node 정합 + **B3b finding 2:
   플러그인 번들 밖 문서 참조** 포함) → **B6**(final review).
4. **후속/별도 묶음**: §6-1 인코딩 나레이션 SKILL.md 완화(BOM 금지), B3b finding 3(PDF 입력 UX) 안내 검토, finding 4·5(minor).
