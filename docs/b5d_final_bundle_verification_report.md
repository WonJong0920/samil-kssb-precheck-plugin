# B5-D — Final Bundle Verification 보고서

> **성격**: Claude Code 검증 보고(자체 Preflight, **PASS/FAIL 최종 판정 아님** — B6 진입 판정은 Codex B5-D review).
> 설치 번들(root = `src/`, marketplace `source.path=./src`) 기준 제출 전 최종 점검이다.
> 근거: `docs/reviews/codex_b5c_packaging_policy_alignment_review.md`(carry-forward),
> `docs/submission_packaging_policy.md` §4. 검증 HEAD `5aa2f56…`.

## 1. 검증한 범위 / 주요 명령 / 결과

| # | 점검 | 방법(주요 명령) | 결과 |
|---|---|---|---|
| 1 | 매니페스트 파싱·정합 | `node -e "JSON.parse(...)"` — plugin.json·marketplace.json | **정상** — name=`samil-kssb-precheck`(양쪽 일치)·version `0.1.0`·`skills=./skills/`·`source.path=./src`·policy `AVAILABLE`/`ON_INSTALL` |
| 2 | Skill 표면 인벤토리 | `git ls-files src/skills/samil-kssb-precheck` | **정상** — `SKILL.md` + 보조 8종(B5-A `workflow_usage.md` 포함, 정책 §1·§4.1과 일치) |
| 3 | installed-root 경로 정합·dangling | 번들 참조 대상 존재 확인(schemas 3종·workflow_usage·validator/renderer/delivery `.cjs`·intake) | **정상** — 9/9 존재, dangling 0. 남은 `docs/` 참조는 저장소 전용 명시(B5-A OBS-02 유지) |
| 4 | 번들 계약 사본 드리프트 | `git diff --no-index` — `docs/findings_schema_contract.md`↔`src/schemas/…`, `docs/workflow_usage.md`↔`src/skills/…/workflow_usage.md` | **드리프트 0** — 차이는 전부 의도된 것(provenance 헤더·plugin-root 경로 정규화·"저장소 전용" 주석). 계약 의미 차이 없음 |
| 5 | artifact 유입 | `git ls-files` 스캔(.docx/.pdf/.zip/run_manifest/package.json/lock/node_modules) + `git ls-files --others --exclude-standard` | **유입 0** — tracked 0건, 비무시 미추적 0건. `usertest/` 원본 PDF·산출물은 `.gitignore` 커버 확인 |
| 6 | 로컬 경로·계정명 노출 | `git grep`(드라이브 경로·`/Users/`·`AppData`·`plugin/cache`·계정명·이메일) — `src` 전체 | **1건 발견 → 조치**(§2-A). 그 외 히트는 전부 "노출 금지" 규칙 텍스트·validator 검출 패턴 정의(실노출 아님). 계정명·이메일 0 |
| 7 | Node runtime-first 최종 게이트(§4.3) | `node --test tests/*.test.cjs` / Node validator(example) / Node delivery(repo 밖 out-dir) | **전부 green** — 테스트 **365/365 PASS**·validator error 0(RC 0)·delivery RC 0, DOCX→HTML→MD 생성(6599/12830/9480 bytes — B3a 스모크와 **byte-identical = 결정성 재확인**), 사용자 요약은 파일명만(절대경로·계정명 0) |
| 8 | D94 hard stop | example의 첫 anchor `quote=''` 변조본(스크래치패드)으로 delivery 실행 | **정상** — exit 4·out-dir 미생성·sanitized 안내(raw 이슈·경로·stack 미노출) |
| 9 | 실행 후 repo 오염 | `git status --short` | **오염 0**(본 검증의 의도된 수정 2건 외 변화 없음, 산출물 전부 스크래치패드) |
| 10 | 오버클레임 스팟 스캔 | `git grep`("준수 확정"·"OCR 지원 완료"·"제출 준비 완료" 등) — `src` | **0건** — 히트 전부 negation/금지목록 문맥 |

## 2. 발견된 문제와 조치 (경미 2건 — 허용된 docs-only 최소 수정)

- **2-A. 로컬 절대경로 1건**(B5-C carry-forward 지목 항목): `src/reference/python_engine/README.md`의 참고 엔진
  위치가 실제 로컬 경로(`D:\…`)로 적혀 있었음 — 설치 번들에 포함되는 파일이고 정책 §4.4 스캔 패턴(`D:\`) 해당.
  **조치: `[REDACTED_LOCAL_PATH]`로 마스킹**(참고 원본이 저장소·번들에 미포함이라는 설명 유지 — 정보 손실 없음,
  기존 redaction 관례와 동일).
- **2-B. `.gitignore` 방어 공백**: 정책 §1 E-분류·B6 readiness 조건이 요구하는 `node_modules/`·`package.json`·
  `package-lock.json`·`submission.zip` 실수 유입 방어 패턴이 없었음. **조치: 4개 패턴 추가**(주석으로 정책 근거 명시).
  package 파일 **생성이 아니라 유입 방지 규칙 추가**이며, `git check-ignore`로 4/4 커버 확인.

Critical/Major에 해당하는 발견은 없었다.

## 3. version / manifest 판단 (보수 유지 — B5-C 결정 재확인)

- **`plugin.json`·`marketplace.json` 무수정, `version: 0.1.0` 유지.**
- 재평가 근거: B5-A/B로 번들 콘텐츠(SKILL 지침·계약 사본)가 실질 변경되어 **설치 캐시 명확성 관점의 bump 근거 자체는
  존재**하나, (a) B5-Q/B6에서 번들 표면이 더 바뀔 수 있어 지금 bump하면 제출 전 재-bump가 필요해지고,
  (b) 실제 재설치 확인은 사용자 직접 검증 항목(D35)이라 bump 효과 검증을 이 사이클에서 완결할 수 없다.
  → **제출 사이클(최종 패키징)에서 번들 표면 확정 후 1회 bump를 권고**하고, 그때 근거와 함께 기록한다
  (§4.1 체크 라인 기존 기록과 정합). unsupported manifest field 추가 없음(기존 결정 유지).

## 4. B6 진입 가능 여부 (executor 관점 — 판정 아님)

B5 audit의 B6 readiness 조건 대조: 설치 번들 dangling 0(§1-3) · 경로 plugin-root 정합/라벨(§1-3) · packaging policy
Node-first 정합(B5-C PASS + §1-7 실증) · 매니페스트 파싱·정합(§1-1) · version 결정 기록(§3) · `.gitignore` 방어(§2-B
조치 후 충족) · 경계/no-overclaim 유지(§1-10) — **이 검증에서 blocker를 발견하지 못했다.**
최종 판정은 **Codex B5-D review**가 수행한다.

## 5. 남은 carry-forward

- **제출 사이클**: version 1회 bump 결정·submission.zip 생성·로그 포함 방식 확정(zip-only vs commit)·샘플 산출물
  포함 여부·사용자 직접 Codex install verification evidence.
- **B5-Q(별도)**: 산출물 품질 고도화(`docs/planning/kssb_precheck_output_enhancement_plan.md` Q/C/A/G — 렌더러
  `수행=True` 표현 포함).
- 번들 계약 사본 드리프트의 자동 가드 부재(현재 §4.1 수동 대조) — 필요 시 후속 결정.

## 6. 변경 파일

- `src/reference/python_engine/README.md` (로컬 경로 redaction — §2-A)
- `.gitignore` (패키지/zip 유입 방어 4패턴 — §2-B)
- `docs/b5d_final_bundle_verification_report.md` (본 보고서, 신규)

**미변경**: 런타임 코드·schema·plugin.json/marketplace.json·version·package artifacts·생성 산출물·current_status/decision_log.

## 7. status

- **Codex B5-D review 대기.**
