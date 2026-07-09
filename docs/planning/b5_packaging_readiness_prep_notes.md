# B5 — Submission Packaging Readiness Prep Notes (planning, docs-only)

> **성격**: B5(submission packaging readiness audit)에서 다룰 항목을 **미리 정리한 prep 노트**다. 이 문서는
> 계획일 뿐 — **코드·스킬 콘텐츠·매니페스트·정책 문서를 수정하지 않는다.** 각 항목의 실제 실행은 **별도
> remediation 사이클(Codex review 게이트)**로 진행한다. submission.zip 생성·제출 준비 완료 주장 없음.
> 근거: B3b 실사용 evidence(`docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`),
> Codex B4 review(OBS-01·02·03), 매니페스트 확인(version·runtime 선언), `docs/blackbox_protocol.md`,
> `docs/submission_packaging_policy.md`. 시작 HEAD: `6f34657`(B3b evidence) 이후.

## 0. Codex B3 evidence review 매핑 (CONDITIONAL PASS · review `9614fb3`)

- **B3-MAJ-01**(B3b provenance): B3 evidence 문서에서 해소(산출물 SHA-256 회수 + 입력 PDF limitation) — **B5 아님**.
- **B3-MAJ-02**(번들 밖 `docs/` 참조) → **§1**(우선).
- **B3-MIN-02**(인코딩 나레이션) → **§2** / **B3-MIN-03**(에이전트 나레이션 경로·계정명 노출) → **§2 + §4 finding 4** /
  **B3-MIN-01**(PDF 입력 UX) → **§4 finding 3** / **B3-MIN-04**(항목수 나레이션) → **§4 finding 5**.

## 1. 플러그인 번들 밖 문서 참조 (B3b finding 2 / B3-MAJ-02 — 우선순위 높음)

**메커니즘**: 마켓플레이스 `source.path: "./src"` → 플러그인 root = `src/`. 따라서 **repo 루트 `docs/`는 번들
상위라 설치 시 미포함**. `src/` 아래(schemas·validators·renderers·skills·intake)는 번들됨.

### 1-A. 번들 밖 `docs/` 참조 (설치 시 끊김)

| 대상 | 참조 위치(파일:refs) | 중요도 |
|---|---|---|
| **`docs/findings_schema_contract.md`** | SKILL.md(48·84·148)·report_template.md(5)·customer_question_rules.md(33)·completion_checklist.md(50)·validators/README(4)·renderers/README(45) — 8회/6파일 | **높음**(에이전트가 실사용에서 부딪힘) |
| `docs/workflow_usage.md` | SKILL.md(50·143)·completion_checklist.md(48)·renderers/README(12) — 4회 | 중간(전달 계약) |
| `docs/blackbox_protocol.md` §3·§3-(b) | evidence_mapping_rules.md(121·139) — 2회 | 중간(quote 표본 규율 §9 연계) |
| `docs/cycle2c_renderer_completion_report.md` | renderers/README(108) | 낮음(과거 기록) |
| `docs/planning/cycle2l_1_...` | intake/README(70) | 낮음(과거) |
| `docs/reference_review.md`·`docs/decision_log.md` | reference/python_engine/README(37) | 낮음(과거) |

### 1-B. `src/` 접두 경로 불일치 (번들엔 있으나 설치 경로 어긋남)

스킬 문서가 `src/validators|renderers|schemas|intake/...`로 적었으나 설치 시 실제 경로는 접두 `src/` 없는
`validators|renderers|schemas|intake/...`. 해당: SKILL.md(35·48·129·134·136·169)·report_template.md(5·8·9)·
completion_checklist.md(43·46)·evidence_mapping_rules.md(45). 파일은 번들에 존재 → 치명적 아님, **경로 안내 마찰**.

### 1-C. 런타임 코드는 자기완결 (그래서 완주함)

`.cjs` 전수: 모든 `require`는 `node:` 내장 또는 `./` 상대, 파일 읽기는 `__dirname` 기준(예: validator의
`prohibited_terms.md`는 `path.join(__dirname,"..","skills",...)` = 번들 내부). **코드 레벨 dangling 참조 0** →
접두 불일치와 무관하게 런타임 동작. 스키마 JSON(`src/schemas/kssb_findings.schema.json`)도 번들됨.

### 1-D. 영향 / 완화 옵션(B5 결정)

- **영향**: 기능은 작동(코드 deps 번들·`__dirname` 기준·기계 스키마 번들). **저하** = 사람이 읽는 계약/규율
  문서(특히 `findings_schema_contract.md`) 부재 → 스킬이 스키마·코드에서 계약을 역추론(**.md에만 있는 수동 검증
  규칙·모드/라벨 뉘앙스 누락 리스크** + 탐색 마찰).
- **완화 옵션**:
  1. **계약 문서 번들 포함**: `findings_schema_contract.md`(필요 시 `workflow_usage.md`·`blackbox_protocol.md`
     §3 quote 발췌)를 `src/` 안(예: `src/schemas/` 또는 스킬 폴더)으로 넣고 참조 갱신 → 스킬 자기완결.
  2. **참조 정리**: 스킬 문서의 `docs/...`를 번들 등가물로 바꾸거나, 과거 기록성 `docs/cycle*`·planning·
     reference 참조는 스킬에서 제거/약화(런타임 가이드 vs 개발 전용 분리).
  3. **`src/` 접두 정리**: 스킬 문서 경로를 plugin-root 기준(`src/` 제거)으로 맞추거나 "repo 경로(개발용)" 명시.
- **비고**: 1·2는 skill 콘텐츠 변경이라 B5 하위 remediation 사이클로 실행(Codex review). schema/코드 로직 무변경.

## 2. 인코딩 모지바케 나레이션 완화 (§6-1 / B3b finding 1 — SKILL.md 지침 추가 예정)

- **재확인**: B3b 실사용에서 "안내 파일이 한글 인코딩 문제로 깨져 보여 UTF-8로 다시 읽겠다"가 재현. 파일은
  **전부 valid UTF-8·BOM 없음·LF**(결함 아님). 원인 = 호스트 Windows 기본 코드페이지(예: cp949) 오디코딩 →
  자가 UTF-8 재읽기 → 나레이션(Phase 0 R3·blackbox §1 계열). **정확성 결함 아니라 UX 노이즈.**
- **추가할 SKILL.md 지침(제안 문구 — 실행은 remediation 사이클)**:
  > 안내·기준 파일(SKILL.md 및 보조 `.md`)은 **UTF-8로 간주해 읽는다.** 화면상 한글이 깨져 보이면 UTF-8로
  > 재해석하되, **인코딩·재읽기·파일 처리 등 내부 동작을 사용자-facing 출력(요약·보고서·대화)에 노출하지
  > 않는다**(기존 `evidence_mapping_rules.md` §7 "내부 도구·영문 상태 문자열 비노출" 규칙의 연장). 재읽기
  > 안내를 사용자에게 반복 출력하지 않는다.
  - 배치 후보: SKILL.md "Prohibited expressions"/"Output policy" 인접 또는 Inputs 하단. **BOM 추가 금지**
    (SKILL.md `---` frontmatter 파싱 위험).
- **B3 kit UX rubric 반영**: `docs/planning/b3_smoke_and_real_ux_evidence_kit.md` §6에 "인코딩/파일 처리
  워크어라운드 비노출" 항목이 **이미 반영됨**(finding-capture 커밋). B5/remediation에서 SKILL.md 지침과 짝을 맞춤.
- **한계**: 완화는 **가시적 나레이션 제거**가 목표. 호스트의 오디코딩 자체는 플러그인에서 강제 불가(환경 특성).

## 3. 기존 리뷰가 B5로 지목한 항목

- **submission_packaging_policy.md의 Python-era final preflight 명령 → Node 정합**(Codex B4 OBS-01·
  remaining-work). 최종 preflight 예시를 `node --test tests/*.test.cjs` / `node …_delivery.cjs …` 기준으로 갱신.
- **`src/validators/README.md` usage 블록 순서**: Python 예시가 Node보다 먼저 나열(Codex B4 OBS-02) → runtime-first로 재정렬(저위험 polish).
- **install/marketplace·artifact 정책 재점검**(Codex B4 OBS-03):
  - `plugin.json` `version: "0.1.0"` **범프 여부 결정**(초기 이후 미변경 — 드리프트 아닌 결정 사항).
  - **런타임(Node) 의존성 선언**: 현재 매니페스트에 런타임/의존성 필드 없음(D2·D33 "불확실 필드 회피"의 보수적
    생략). Codex 플러그인 스키마가 런타임 선언을 지원/기대하는지 **확인 후 결정**.
  - generated artifact 제외(`.gitignore` 이미 report/`run_manifest.json` 등 커버 — 재확인)·로그 zip-only·
    marketplace 필드(`AVAILABLE`/`ON_INSTALL` = D34) 정합 재확인.

## 4. B3b 부수 finding (경중 낮음 — 라우팅만)

- **finding 3(PDF 입력 UX)**: Python 차단 확인 + 실 PDF에 즉흥 추출(앱 PDF.js, 문서화된 `src/intake/runners`
  경로 아님)·도구 탐색 시행착오. → **후속 UX 안내 검토**(core 입력 계약과 "사용자는 PDF를 던진다" 현실의 간극).
  B5 필수 아님, 별도 검토 후보.
- **finding 4(minor 경계)**: 에이전트 최종 나레이션이 로컬 절대경로·계정명(`C:\Users\<계정>\…`) 노출. delivery
  user_summary는 파일명만(B3a 확인)이므로 경계는 **에이전트 나레이션에도 적용**됨을 §2 지침에 함께 포함 가능.
- **finding 5(minor)**: 카탈로그 항목 수 9→10 자가 정정(출력 정상). 필요 시 카탈로그 항목 수 명시로 완화(선택).

## 5. 경계 / 이 노트의 성격

- **prep 노트만** — 코드·스킬 콘텐츠·매니페스트·정책 문서 무변경. 각 실행은 별도 remediation 사이클(Codex review).
- submission.zip 생성·제출 준비 완료·제품 완성·2N-5 통과·OCR complete·provider finalization 주장 없음.
- Skill-first·detect-only·재판정 금지·source-bound·사람 검수·no-overclaim 경계 유지.

## 6. 권장 B5 실행 그룹핑(제안)

1. **번들 자기완결화**(§1 옵션 1+2+3) — 계약 문서 번들 포함 + `docs/`/`src/` 참조 정리. (실사용 finding 우선)
2. **SKILL.md 인코딩/나레이션 지침**(§2, + finding 4 경계 포함) — skill 콘텐츠 remediation.
3. **정책·매니페스트 정합**(§3) — packaging_policy Node 정합·version/런타임 선언 결정·artifact/log/marketplace 재확인.
4. (선택) **finding 3 PDF 입력 UX 안내**(§4) — 별도 검토.

각 그룹은 독립 Codex review를 거친다. B5 종료 후 **B6 final Codex submission review**.
