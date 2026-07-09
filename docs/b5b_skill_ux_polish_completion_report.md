# B5-B — Skill UX Polish 완료 보고서

> **성격**: Claude Code 작업 완료 보고(자체 Preflight, PASS/FAIL 판정 아님). B5-A review PASS 이후의
> **설치 Skill UX guardrail 보강**(B5 audit required scope 3 / B5-MIN-01·B5-MIN-02 / B3b carry-forward)이다.
> 근거: `docs/reviews/codex_b5a_bundle_self_containment_review.md`(carry-forward to B5-B),
> `docs/reviews/codex_b5_packaging_readiness_audit_scope_review.md`(B5-MIN-01·02),
> `docs/planning/b5_packaging_readiness_prep_notes.md` §2·§4(제안 문구). 시작 HEAD `1f41783…`.

## 1. 추가한 UX guardrail

수정 위치는 **`src/skills/samil-kssb-precheck/SKILL.md` 단일 파일**로 좁혔다 — 설치 Skill에서 에이전트가
로드하는 지시 파일이며, findings/보고서 문구 규칙은 이미 `evidence_mapping_rules.md` §7에 있으므로
**대화 나레이션(세션) 층의 가드레일**만 새로 규정했다.

1. **신규 절 "Session narration guardrails (대화·나레이션 가드레일)"** (Prohibited expressions와 Output policy 사이):
   - **인코딩·내부 파일 처리 비노출**: 스킬 안내 파일은 UTF-8로 간주해 읽고, 한글이 깨져 보이면 조용히 UTF-8
     재해석 — **인코딩 문제·재읽기·내부 파일 처리 워크어라운드를 사용자-facing 출력에 서술·반복 안내하지 않는다.**
     스킬 문서 BOM 추가 금지. (B3b 인코딩 모지바케 나레이션 재발 방지 — prep 노트 §2 제안 문구 반영, §7 연장 명시.)
   - **경로·계정 비노출(나레이션 포함)**: delivery 사용자 요약의 sanitize 경계를 **에이전트 대화 나레이션
     (특히 산출물 완료 안내)에도 동일 적용** — 파일명(필요 시 상대 표시 경로)만. (B3b finding 4 / B5-MIN-01.)
   - **중간 집계·항목 수 확정 표현 금지**: 항목 수·건수는 **최종 findings 기준으로만 확정 서술**, 잠정 수치는
     "잠정" 표기 또는 생략, 항목 수는 카탈로그 대조 후 서술. (B3b 항목수 9→10 자기 정정 나레이션 — B3-MIN-04.)
2. **Inputs 절 PDF 입력 기대 정밀화** (B5-MIN-02 — 4요소를 한 불릿에 압축):
   텍스트 판독 가능 문서(예: 텍스트 레이어가 있는 PDF)가 **기준선** / core는 **OCR 자동 실행 없음**(기존 유지) /
   판독 불가·미지원 구간은 미공시 단정 없이 **한계 명시 + 확인 불가→질문 라우팅**(§6·§7, 커버리지 침묵 금지) /
   구조 보강·OCR은 **승인 기반·선택적** 경로만.
3. **Output policy 경로 비노출 불릿에 "(에이전트 대화 나레이션 포함)" 교차 참조** 추가 — 산출물 정책과 나레이션
   가드레일의 정합 명시.

## 2. 수정 파일

- `src/skills/samil-kssb-precheck/SKILL.md` (유일한 수정 파일 — 신규 절 1 + 기존 불릿 2곳 보강)
- `docs/b5b_skill_ux_polish_completion_report.md` (본 보고서, 신규)

## 3. B5-B 범위 밖으로 남긴 항목

- **B5-C**: `submission_packaging_policy.md` Node 정렬(B5-MAJ-03), validator/renderer README runtime-first 정렬(B5-MIN-03), manifest/version 결정(B5-MIN-04).
- **B5-D**: 최종 번들 검증(dangling·drift·artifact).
- **B5-Q**: 산출물 품질 고도화(`docs/planning/kssb_precheck_output_enhancement_plan.md`의 Q/C/A/G 규칙 — 인용 무결성·내용 정합 등은 별도 사이클).
- 렌더러 `수행=True` 상태 문자열(UR1)은 **렌더러+parity fixture 수정이 필요한 코드 변경**이라 B5-B(문구 polish) 밖 — B5-Q 계열로 유지.
- runtime code·validator/renderer/delivery 로직·schema·plugin.json/marketplace.json·version 무변경(경계 준수).

## 4. 검증 결과

- `git status --short --branch` / `git diff --name-only`: 변경 = SKILL.md 1개(+본 보고서). **code/schema/test/package/manifest/generated artifact 변경 0.**
- `git diff --check`: 공백 오류 0(LF→CRLF 정보성 경고만).
- SKILL.md 선두 바이트 = `---`(45,45,45) — **BOM 없음 유지**(frontmatter 파싱 리스크 없음).
- 신규 문구는 기존 경계(Skill-first·detect-only·source-bound·사람 검수·no-overclaim)를 변경하지 않고,
  기존 규칙(§7 비노출·delivery sanitize·커버리지 명시)의 **나레이션 층 연장**으로만 서술.

## 5. status

- **Codex B5-B review 대기.** 이후 순서는 B5 audit 권고대로 B5-C(정책·README 정합) → B5-D(최종 검증).
