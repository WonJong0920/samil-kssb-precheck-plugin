# Cycle 2M-1 — Claude Code Whole Plugin Structure Inspection (엔지니어링 구조 점검 메모)

> **성격**: 작업자(Claude Code) 관점의 **독립 구조 점검 메모**. Codex 리뷰(`docs/reviews/codex_cycle2m_1_whole_plugin_structure_review.md`)를
> 대체하지 않으며 **PASS/FAIL 판정을 하지 않는다.** 코드 수정·샘플 보고서 생성·샘플 파싱/OCR 실행 없음(문서만).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 기준 HEAD: `32fbe3a`(Codex 2M-1 구조 리뷰 반영 후 최신 main).

## 점검 범위

- 전 영역 직접 확인: `src/.codex-plugin/plugin.json`·`.agents/plugins/marketplace.json`(JSON·경계 문구), `src/skills/`(SKILL + 보조 7종),
  `src/intake/`(dei_producer·aux_structure_scanner·README), `src/schemas/`(findings 스키마·예시), `src/validators/`(detect-only 검증기 — 금지표현/경로 스캔 로직 정독),
  `src/renderers/`(renderer·delivery — 산출 경로/파일명/표시경로 처리 정독), `tests/`(5종), `docs/`(current_status Ledger·decision_log·submission 정책·Codex 2M-1 리뷰).
- 관점: **샘플 폴더 전체 산출물 테스트(개수·파일명 미고정, 동적 발견)를 돌리기 전에 작업자가 걸릴 곳이 있는가.**

## 주요 관찰

1. **구조 정합**: Skill 단일 진입점 → findings(스키마 불변) → validator(detect-only) → renderer(무재판정) → delivery(로그/사용자 분리) 배선과
   intake(out-of-core, opt-in)의 격리가 코드 수준에서 일관됨. 테스트 5종(56/26/26/22/33) 기준선 green. Codex 2M-1 리뷰 결론과 상충하는 구조 문제는 발견하지 못함.
2. **산출물 경로는 호출자 책임**: `deliver(findings, out_dir, …)`가 out_dir을 **인자로 요구**하고, 표시 경로는 sanitize(`_display_path` — cwd 밖이면 파일명만)된다.
   repo 오염 방어는 `.gitignore`의 산출물 이름 패턴(`*_KSSB_공시근거_사전검토보고서.docx/.html/.md`)이 2차로 있음. → 테스트에서는 **repo 밖 out_dir 지정이 1차 원칙**.
3. **금지표현 스캔의 실샘플 오탐 가능성(관찰, 결함 아님)**: 강한 금지표현은 복합구("인증 의견"·"준수 확정"·"제3자 검증 완료" 등)라 "ISO 인증" 같은
   단어 단위는 오탐하지 않는다. 그러나 **evidence quote 필드도 스캔 대상**(제외 키는 disclaimer/human_review_boundary/overall_limitations/notes뿐)이므로,
   실제 지속가능경영보고서 원문에 "제3자 검증 완료" 등의 구가 있고 이를 **그대로 인용**하면 preflight error가 난다.
   이는 "도구 자기서술 금지"를 지키기 위한 보수적 동작이지만, 샘플 테스트에서는 **원문 인용 유래 오탐과 실제 위반을 구분해 기록**해야 한다.
4. **경로 스캔 토큰**: `_PATH_PATTERNS`에 `sandbox`·`AppData`·드라이브 문자 등 — 한국어 ESG 본문에서 오탐 확률 낮음(설계 의도대로 보수적). 특이사항 없음.
5. **stale wording(이미 Codex C2M1-MIN-01로 등록)**: SKILL.md:37·evidence_mapping_rules·intake README·dei_producer 독스트링의
   "L2 provisional — Codex review pending"류는 2L-5 closure 기준으로 **과소표현**(overclaim 아님) — 샘플 테스트 차단 요소 아님, 제출 전 정리 대상이라는 Codex 판단에 동의.
   본 메모에서는 수정하지 않음(코드/문서 수정 금지 범위 준수).
6. **입력 포맷별 경로가 상이함**: Skill 입력 전제는 "텍스트로 읽을 수 있는 문서"다. 샘플 폴더에는 스캔 PDF·HWP v5 등 **직접 판독 불가 포맷**이 섞여 있고
   (파일명·개수는 유동 — 고정하지 않음), plugin은 OCR을 실행하지 않으며 Kordoc/OCR runner는 out-of-band다. → 포맷별 기대 결과가 다르다(아래 주의사항 ③).
7. **스키마 제약 리마인드**: `evidence_anchor`/`source_documents`는 `additionalProperties:false`, `not_verifiable`은 missing_info+customer_questions 필수,
   질문은 6필드 필수 — 실샘플 findings 생성 시 Skill이 임의 필드를 추가하면 preflight에서 걸린다(의도된 가드).

## 샘플 테스트 전 보완 후보 (차단 아님 — 기록만)

- **(문서)** C2M1-MIN-01 stale wording 정리(제출 전 polish 단계) — 이미 Codex 리뷰에 등록됨, 여기선 중복 조치 안 함.
- **(테스트 절차)** 산출물 out_dir을 repo 밖으로 지정하는 관례를 테스트 프롬프트에 명문화(코드 변경 불필요 — 호출 인자로 해결).
- **(관찰 항목)** quote 유래 금지표현 오탐이 실제 발생하면: 빈도 기록 → 후속 사이클에서 "원문 인용 필드의 유래 표기/스캔 정책" 검토 후보(지금 바꾸지 않음).
- 구조상 **테스트를 막는 문제는 발견하지 못함**.

## Codex 샘플 테스트 프롬프트에 반영할 주의사항

1. **동적 발견**: 샘플 폴더의 **모든 지원 가능 파일을 먼저 목록화**(개수·파일명 고정 금지)하고, 파일별 포맷·처리 경로·결과를 표로 기록.
2. **산출물 위치**: 생성 보고서(DOCX/HTML/MD)·findings JSON·중간 산출물은 **repo 밖 out_dir**에 생성, repo 커밋 금지(`deliver()`의 out_dir 인자 사용).
3. **포맷별 기대 결과를 구분**: ① 텍스트 판독 가능 문서(텍스트 PDF/DOCX 등) → 정상 findings→보고서 경로. ② 스캔 PDF·이미지 기반 → plugin은 OCR을 실행하지 않으므로
   **"확인 불가→missing_info+질문" 라우팅이 정상 동작**(내용 추출 실패를 파이프라인 실패로 기록하지 말 것). ③ HWP v5 등 직접 판독 불가 포맷 →
   "unsupported/별도 경로 필요"로 명시 기록(침묵 실패 금지 — Codex 2M-1 권고와 동일).
4. **preflight error 분류**: validator error 발생 시 (a) findings 구성 결함 vs (b) **원문 인용 유래 금지표현 오탐** vs (c) 경로 노출을 구분해 기록.
5. **품질 검토 관점**: 근거 앵커(quote+위치) 실재성·확인불가→질문 연결·판정 라벨 모드 정합(공개자료 모드)·금지 표현·표/수치 근거의 전용 여부·
   보고서 구조(report_template 정합)·DOCX 정상 열림·결정성(동일 findings→동일 산출).
6. **경계 유지**: 감사·인증·준수 판단 표현 금지, L2는 "repo-side ingest boundary implemented+reviewed / provider execution pending", L3 미구현 표현 유지.
   OCR/HWP 처리를 위해 provider를 설치·실행하지 말 것(out-of-band 원칙).

## 메타

- 코드 수정 여부: **No**
- 샘플 보고서 생성 여부: **No** (샘플 파싱/OCR 실행도 없음 — 코드 정독과 기존 테스트 기준선 확인만)
