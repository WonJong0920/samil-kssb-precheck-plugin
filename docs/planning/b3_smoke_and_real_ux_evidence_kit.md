# B3 — 실행환경 스모크 + 실사용 UX·산출물 검토 Evidence Kit (design/kit, docs-only)

> **성격**: B3 사이클의 **설계 + evidence 캡처 kit + 검토 rubric**이다. 이 문서에서 실제 실행이나 산출물
> 커밋을 하지 않는다. B3는 두 단계로 나뉜다 — **B3a(로컬 결정적 런타임 스모크)는 Claude Code가 실행**,
> **B3b(실사용 Codex 플러그인 UX)는 사용자가 실행**(Codex 앱/CLI 설치·활성화·사용은 사용자 직접 검증 항목 —
> D35). Claude Code는 Codex를 대리 구동하지 않으며 PASS/FAIL 최종 판정도 하지 않는다(판정은 후속 Codex
> evidence review).
> 시작 HEAD: `94e7e71`(Codex B4 review) 이후. Source-of-truth: `docs/blackbox_protocol.md`(§2 단계·§3 판정
> 기준·§4 evidence·§5 한계), `docs/workflow_usage.md`, `src/skills/samil-kssb-precheck/SKILL.md`,
> `docs/planning/post_phase3b_remaining_work_review.md`(B3), `docs/reviews/codex_b4_documentation_alignment_review.md`.

## 1. 목적

현재 **Node 런타임 기준**으로 (1) 결정적 뒷단(validator→renderer→delivery)과 (2) 실제 사용자 진입점(Codex
플러그인 Skill)을 각각 근거로 확보해 **제출 안정화(A안 B3)**를 뒷받침한다. B3a가 결정적 결함을 먼저 걸러 B3b(비
결정적·재현 어려운 실사용)를 de-risk하고, B3b는 B3a가 못 보는 플러그인 표면·UX·LLM 판단을 본다.

**아님(no-overclaim)**: 제품 완성·2N-5 전체 통과·OCR complete·provider finalization·submission readiness가 아니다.

## 2. 구조 (blackbox_protocol §2 정합 — 결정적 후반부 vs 수동 Skill-run)

```
B3a 로컬 결정적 런타임 스모크 (Claude 실행, 산출물 repo 밖)
   → known-good 기준 산출물·거동 확보
B3b 실사용 Codex UX (User 실행: 자료 업로드 + "이 보고서 검토해줘")
   → 실제 진입점 UX·산출물 확보
→ 두 결과를 evidence 문서로 집계(§10) → Codex evidence review
```

## 3. 역할·환경 규약

- **B3a (Claude)**: 시스템 Node(실측 v24.16.0). 산출물·임시 findings는 **repo 밖 임시 폴더**(`<TEMP>`)에 생성,
  실행 후 repo 오염 스캔. Python 참조 대조를 쓸 경우에만 절대경로 + `PYTHONUTF8=1; PYTHONIOENCODING=utf-8`.
- **B3b (User)**: 사용자의 Codex 앱/CLI. 플러그인 탐색·설치·활성화·사용 확인은 **사용자 직접 검증(D35)**.
  Claude는 실행 결과를 "작동 확정"으로 단정하지 않는다.

## 4. B3a — 로컬 결정적 런타임 스모크 (Claude 실행 절차)

repo에 실재하는 명령만 사용. 산출물은 `<TEMP>`에만, **미커밋**.

1. **HEAD·clean 기록**: `git rev-parse HEAD` · `git status --short --branch`.
2. **전체 Node 스위트(회귀)**: `node --test tests/*.test.cjs` → green(현 baseline 365/365 기준).
3. **성공 경로 delivery(end-to-end)**:
   `node src/renderers/kssb_report_delivery.cjs src/schemas/kssb_findings_example.json -o <TEMP>/report --manifest`
   - 확인: 대표 문서 **DOCX → HTML → Markdown** 생성, primary=DOCX, 파일명
     `<보고서명>_KSSB_공시근거_사전검토보고서.{docx|html|md}`. `user_summary`(stdout) 캡처.
   - `--manifest`: `run_manifest.json` **파일 존재 + `manifest_sha256`** 확인(**OBS-01 규약 — exit 0 단독으로
     capture 성공 단정 금지**, 파일/반환/`--debug`로 확인). manifest는 opt-in 내부 provenance(대표 문서 아님).
4. **D94 hard stop(error 경로)**: `<TEMP>`에 의도적 error findings(예: 한 anchor의 `quote=""`) 생성 →
   `node src/renderers/kssb_report_delivery.cjs <TEMP>/bad.findings.json -o <TEMP>/report_bad`
   - 확인: **산출물 0 · out-dir 미생성 · exit 4 · sanitized 한국어 안내**(validator raw·경로·stack 미노출).
5. **누출/경계 스캔**: `user_summary`·stdout에 로컬 절대경로·계정명·`<TEMP>` 경로·stack·금지 표현·내부 사이클
   용어·provider명 **0**.
6. **(선택) DOCX 유효성·결정성**: Python 참조로 `zipfile.testzip()` None + 8파트 XML well-formed(개발기 대조);
   동일 findings 2회 실행 → 파트 콘텐츠·manifest **byte-identical**.
7. **산출**: 집계·hash·관찰만 evidence(§10). **원본 산출물 미커밋**, 실행 후 repo 오염 0 확인.

## 5. B3b — 실사용 Codex 플러그인 UX (User 실행 절차)

- **입력 정책**: **공개자료 검증 모드 권장**(공개된 지속가능경영보고서 1건). 실기업 자료면 PII·저작권 우려 →
  **repo 밖·미커밋**. 텍스트 추출 가능한 문서 전제(core는 OCR 자동 실행 안 함).
- **절차**: (1) Codex에서 플러그인 활성 확인 → (2) 자료 1건 업로드 → (3) 프롬프트 **"이 보고서 검토해줘"**(스킬
  트리거) → (4) 산출물 확보(대표 문서 파일 + 화면 요약) → (5) 관찰 캡처.
- **캡처 요건(템플릿)**:
  - 환경: Codex 버전·플러그인 활성 상태·기준 HEAD(가능 시).
  - 입력 인벤토리: 파일명·바이트·SHA-256(원본 미커밋).
  - 프롬프트 문구 원문.
  - **스킬 실제 호출 여부**(스킬이 구동됐는지) 및 관측된 흐름.
  - 산출물: 형식·파일명·바이트·SHA-256, 접근 방식(다운로드 등).
  - 화면 사용자 요약 문구(캡처).
  - 에러/차단 지점·소요·재시도 여부.

## 6. UX 검토 rubric (B3b)

- 스킬이 실제로 호출·구동되는가.
- 대표 문서(DOCX 우선)가 실제로 생성·접근(다운로드) 가능한가.
- 사용자 요약이 **사람이 읽기 좋은가**, 혼란스러운 내부 참조·영문 상태 문자열이 없는가.
- 에러 시 안내가 이해 가능한가(경로·stack·raw 노출 없이).
- **Skill-first 체감**: 사용자가 Python·PATH·CLI를 의식하지 않는가.

## 7. 산출물 계약·경계 검토 rubric (B3a·B3b 공통 — Claude가 산출물 검토)

- **findings 기반 구조**: KSSB 4대 영역 항목별 판정·근거 앵커·부족정보·고객 질문·권고.
- 대표 문서 우선순위 **DOCX→HTML→MD**·파일명 규칙.
- **표지 고지문**(삼일 비공식·감사/인증/준수 대체 아님·컨설턴트 검수용 초안)·**사람 검수 경계**·§7 한계 포함.
- **누출 0**: 로컬 절대경로·계정명·임시경로·validator raw·stack·내부 사이클 용어·provider명.
- **금지 표현 0**(`prohibited_terms.md`).
- **source-bound**: 근거 인용이 실제 입력 원문에서 재발견(무작위 표본 ≥5·사람 확인 — blackbox §3-(b); 자기
  점검 §9·opt-in `--source-text`는 표본 확인 대체 아님). OCR 유래 인용은 `evidence_mapping_rules.md` §6 표기.
- **확인 불가 → 질문/요청자료 연결**(미공시 단정 없음).
- **커버리지 정직성**: `overall_limitations`에 미추출/미검토 구간을 문서별 실제 수치로.
- **no-overclaim**: "OCR 지원 완료/준수 확정"류·감사/인증 결론 없음.
- (참고) 검수 우선순위 신호가 report_template §7-1 서식대로 보이는지 — 단 **renderer는 그 표를 아직 생성하지
  않으므로**(B1 별도·미승인) "표로 렌더되지 않음"은 정상. 정보 자체(상충·확인 불가·부분·warning)가 항목 단위로
  드러나는지만 본다.

## 8. 한계 / 주의 (정직 표기)

- B3a는 **로컬 Node·현재 HEAD 기준** — Codex 플러그인 실행 환경과 동일 보장 아님(하한선일 뿐).
- B3b는 **Skill(LLM) 판단 포함** → 1회 실행은 **spot-check**(재실행 시 findings가 달라질 수 있음 — 판정은 byte
  재현이 아니라 §7 기준 충족 여부).
- **실제 Codex 설치·실행·활성화 = 사용자 검증(D35)**. Claude는 "작동 확정"을 단정하지 않는다.
- **1회 실행 ≠ 2N-5 전체 통과·제품 완성.**

## 9. Repo-safety (필수)

- 원본 샘플·생성 산출물(DOCX/HTML/MD/`run_manifest.json`/임시 findings 등)은 **repo 미커밋**(`<TEMP>`·
  `.gitignore` 방어). evidence는 **집계·hash·관찰만** 문서화.
- **submission.zip 생성/커밋 금지.** PII·저작권 자료 미커밋(공개자료 모드 권장).
- 실행 후 **repo 오염 스캔 0** 확인.

## 10. Evidence 문서 계획

- B3a·B3b 결과를 예: `docs/samples/b3_node_runtime_and_real_ux_evidence_<YYYY-MM-DD>.md`에 **집계·hash·관찰만**
  기록(blackbox §4 요건: HEAD·환경·입력 인벤토리 hash·단계별 명령/exit·산출물 위치·바이트·hash·preflight
  counts·§7 근거·오염 스캔 결과). **원본/산출물 자체 미커밋.**
- **판정(PASS/FAIL)은 Claude가 하지 않는다** — evidence만 남기고 **Codex evidence review**가 판정.

## 11. 게이트 / 다음 단계

1. (선택) 이 kit 자체 **Codex design review** — 또는 곧바로 실행 단계로.
2. **B3a 실행(Claude)** + **B3b 실행(User)** → §10 evidence 문서 작성(Claude).
3. **Codex evidence review**(§3 판정 기준 대조).
4. 이후 **B5**(submission packaging readiness audit — OBS-01의 policy Python-era preflight Node 정합 포함) →
   **B6**(final Codex submission review).

## 12. 이번/후속에서 하지 말 것

- 코드·테스트·schema·package·generated artifact 변경(B3a는 실행만, temp 산출·미커밋).
- renderer/validator/delivery 구현 변경, **B1 renderer 검수 표 구현**(별도 미승인), quote normalization,
  intake/OCR/runner 자동 배선, trace manifest upstream 확장, hook/dispatcher/MCP/N5, submission packaging 착수.
- 원본 자료·생성 산출물·submission.zip 커밋.
- 제품 완성·2N-5 전체 통과·OCR complete·provider finalization·submission readiness 주장.

## 13. 자체 점검 (이 kit 작성 단계)

- 이 문서는 **docs-only 계획/kit** — 코드·테스트·산출물 무변경, 실행·커밋 없음.
- B3a 명령은 repo 실재 경로 기준(`kssb_report_delivery.cjs`·`kssb_findings_example.json`·`tests/*.test.cjs`).
- 역할 분담(Claude=B3a·검토 / User=B3b)·repo-safety·no-overclaim·D35 경계 명시.
- 다음 단계 = (선택 kit review 후) B3a/B3b 실행 → evidence → **Codex evidence review**.
