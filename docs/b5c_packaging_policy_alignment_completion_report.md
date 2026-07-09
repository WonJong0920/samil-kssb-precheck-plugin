# B5-C — Packaging Policy / Internal README Alignment 완료 보고서

> **성격**: Claude Code 작업 완료 보고(자체 Preflight, PASS/FAIL 판정 아님). B5 audit의
> **B5-MAJ-03**(packaging policy Python-era preflight) + **B5-MIN-03**(README runtime-first) +
> **B5-MIN-04**(version/manifest 보수 결정) + required scope 2(artifact 정책 재확인)를 처리했다.
> 근거: `docs/reviews/codex_b5_packaging_readiness_audit_scope_review.md`,
> `docs/reviews/codex_b5b_skill_ux_polish_review.md`(carry-forward). 시작 HEAD `87a4ebb…`.

## 1. 무엇을 정렬했는지

### 1-A. `docs/submission_packaging_policy.md` — Node runtime-first (B5-MAJ-03)

- **§4.3 최종 preflight 전면 재작성**: Python-era 명령(`python -m json.tool`·`python src/validators/…`·
  `python tests/…`)이 최종 게이트처럼 나열되던 것을 **"필수 = Node 런타임 게이트 / 선택 = Python golden parity
  reference(교차확인용·게이트 아님)"** 2단 구조로 정렬:
  - 필수: `node --test tests/*.test.cjs` · Node validator CLI(RC 0·error 0) · 대표 delivery 실행(repo 밖 out-dir,
    사용자 요약 경로 비노출) · **D94 hard stop 재확인**(exit 4·산출물 0·out-dir 미생성 — blackbox §2-8 정합) ·
    **trace manifest opt-in 확인 규약**(파일/반환값 확인, exit 0 단독 판단 금지 — OBS-01) · Node 기반 JSON 파싱 ·
    DOCX 결정성/Word 열림.
  - 선택(reference): Python validator/test/smoke — blackbox §1 절대경로·UTF-8 규약 준수 조건 명시.
- **§1 분류표 현행화**: `src/skills/` 보조 7종→**8종**(B5-A `workflow_usage.md` 번들 사본), `src/schemas/`에
  `findings_schema_contract.md` 번들 사본 반영, `src/validators|renderers` 설명을 "런타임 Node `.cjs` + reference
  Python `.py`"로 갱신, **`src/intake/`·`src/reference/` A행 추가**(기존 표 누락), **`run_manifest.json` C행 추가**
  (opt-in 내부 provenance·`.gitignore` 방어·기본 미포함), **`package.json`·`package-lock.json`·`node_modules/` E행
  추가**(외부 의존성 0 원칙 — 존재 자체가 오염).
- **§4.1 체크리스트 보강**: 보조 8종 존재 확인, **번들 계약 사본 2종 ↔ 개발 원본 드리프트 수동 대조**(B5-A OBS-01
  대응 — 자동 가드 없음), **version 결정 기록 참조 라인** 추가.

### 1-B. 내부 README runtime-first (B5-MIN-03)

- `src/validators/README.md`: 구현 목록을 **Node(런타임) 먼저 → Python(reference) 다음**으로 재정렬, 사용 CLI
  블록을 `# 런타임 (Node)` / `# reference (Python)` 주석과 함께 Node-first로, 프로그램 사용 예시도 js 먼저.
- `src/renderers/README.md`: 상단 구현 목록에서 Python 2종이 먼저 나열되던 것을 **Node 이식 2종(런타임) 먼저 →
  Python reference 2종 다음**으로 재정렬(사용 절·프로그램 예시는 이미 Node-first — 무변경).

## 2. Generated artifact / source PDF / logs 정책 재확인 (required scope 2)

- `.gitignore` 현행 유지 확인: 생성 대표 문서·`run_manifest.json`·`logs/*`·`log-hooks/`·임시 산출물 제외,
  `submission.zip` 미생성 원칙 유지. **이번 작업에서 어떤 생성 산출물·원본 PDF·로그도 커밋하지 않음.**
- 원본 로그 zip-only 잠정 권장·제출 단계 민감성 스캔 확정(§2)·샘플 산출물 기본 미커밋(§3)은 **기존 정책 그대로
  유효** — 변경 사유 없음(재확인만).

## 3. plugin.json / marketplace / version 결정 (B5-MIN-04 — 보수적 유지)

**결정: `plugin.json` `version: "0.1.0"` 유지, manifest/marketplace 무수정.** 근거:

1. B5-A/B/C 변경은 전부 **문서·Skill 지침 층**이다 — 스키마·런타임 인터페이스·설치 표면(`source.path`·`skills` 경로)
   무변경이므로 repo 근거만으로 bump가 기계적으로 요구되지 않는다(B5 audit B5-MIN-04와 동일 판단).
2. **unsupported manifest field 금지**: Codex plugin manifest 스키마가 runtime/dependency 선언 필드를 지원함을
   확인하지 못했고, 기존 결정(D2·D33)이 불확실 필드 회피를 고정했다 — 필드 추가 없음.
3. 설치 캐시 명확성을 위한 bump 필요성은 **제출 직전(B5-D/제출 사이클)에서 실제 재설치 검증과 함께 재평가**하는
   것이 안전하다 — 그때 변경 시 근거를 함께 기록한다(§4.1 체크 라인으로 고정).
4. `plugin.json`·`marketplace.json` 파싱·정합(`name`·`source.path=./src`)은 B5 audit에서 확인됨 — 이번에 수정 없음.

## 4. 수정 파일

- `docs/submission_packaging_policy.md` (§1 표·§4.1·§4.3)
- `src/validators/README.md` (Node-first 재정렬)
- `src/renderers/README.md` (Node-first 재정렬)
- `docs/b5c_packaging_policy_alignment_completion_report.md` (본 보고서, 신규)

**미변경(경계)**: 런타임 코드·validator/renderer/delivery 로직·schema·SKILL.md·plugin.json/marketplace.json·
version·package artifacts·생성 산출물·current_status/decision_log.

## 5. B5-C 범위 밖으로 남긴 항목

- **B5-D**: 최종 번들 검증(dangling·번들 사본 드리프트·artifact 부재·재설치 확인) + 그 시점의 version 재평가.
- **B5-Q**: 산출물 품질 고도화(렌더러 문구 등).
- 번들 계약 사본 드리프트의 **자동 가드**(현재 수동 대조만 — §4.1 체크로 고정)는 필요 시 후속 결정.

## 6. 검증 결과

- `git grep "python src/validators|python tests/" -- docs/submission_packaging_policy.md src/validators/README.md src/renderers/README.md`:
  남은 Python 명령은 전부 **"선택/reference" 블록 내부**에만 존재(최종 게이트 아님 명시).
- `git grep "node --test|\.cjs|run_manifest|submission.zip" …`: §4.3 필수 게이트가 Node 명령 기준으로 존재,
  run_manifest 확인 규약(OBS-01)·submission.zip 미생성 원칙 유지 확인.
- `git status --short` / `git diff --name-only`: 변경 = 문서 3개 수정 + 보고서 1개 신규(전부 markdown).
  **code/schema/test/package/manifest/generated artifact 변경 0.** `git diff --check` 공백 오류 0.

## 7. status

- **Codex B5-C review 대기.** 이후 B5-D(최종 번들 검증) → B6.
