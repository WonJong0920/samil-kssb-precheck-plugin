# Cycle 2L-2 완료 보고 — L1 Implementation (Optional Intake → DEI Producer)

> 근거: Cycle 2L-1 prep(`docs/planning/cycle2l_1_l1_implementation_prep.md`) + Codex PASS(`docs/reviews/codex_cycle2l_1_l1_implementation_prep_review.md`, findings 0).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 성격: **L1 구현**(Gate D/L2/L3 아님). 본 문서는 완료 보고(판정 아님).

## 1. 무엇을 구현했나

- **`src/intake/dei_producer.py`** (신규, 표준 라이브러리 전용): 이미 로컬에서 추출된 인테이크 산출물(Kordoc `--format json` 형태)을
  Cycle 2L-1 §2에서 동결한 **DEI-candidate**(문서 수준 근거 재료)로 **결정적으로** 정규화. 판정 미생성·원문 보존·실패 명시.
  주요 함수: `build_dei_candidate(intake, source_id, source_title)`, `page_or_section_hint(page, section)`(findings-side, bbox 제외).
- **`src/intake/README.md`** (신규): 이 폴더가 **plugin core가 아님**(opt-in/local, findings 파이프라인 밖)을 명시.
- **`src/skills/samil-kssb-precheck/evidence_mapping_rules.md` §6**(신규 절): 스캔/이미지/저신뢰 신호를 **기존** `not_verifiable` + `missing_info` + `customer_questions` 경로로 라우팅하는 규칙.
- **`src/skills/samil-kssb-precheck/SKILL.md`** Inputs 최소 보정: 선택적 인테이크 어댑터 존재와 L1 경계(OCR 실행은 현재 기능 아님) 반영.
- **`tests/test_intake_dei_producer.py`** (신규, 14 checks): 결정성·경계·라우팅 신호 검증.

## 2. 판단 (2L-2 프롬프트 5개 질문)

1. **위치**: `src/intake/`(validators/renderers와 형제). **core 밖**은 물리 위치가 아니라 (a) core 모듈이 이를 import 하지 않음, (b) 이 모듈이 core를 import 하지 않음, (c) findings 파이프라인 단계가 아님(Skill이 재료로만 소비), (d) README 경계 명시로 강제. repo 안이라 리뷰·테스트 가능.
2. **core 무변경 가능?** **가능·달성.** DEI는 findings가 아니며, 라우팅은 **기존 스키마 필드/판정 경로**(not_verifiable→missing_info+customer_questions, 자유텍스트 page_or_section)만 사용 → `schema`·`validator`·`renderer`·`delivery` **코드 무변경**.
3. **Skill guidance 위치**: `evidence_mapping_rules.md`(이미 "매칭 실패는 미공시 확정 아님" 원칙의 집), SKILL.md Inputs에 최소 포인터. (Skill 문서 = 판단 엔진 지침, core 코드 아님.)
4. **경계·결정성 증명 테스트**: 결정성(동일 입력→직렬화 동일), judgment field 미생성(재귀 키 스캔), 원문/표 셀 보존, needs_ocr/low_text/skipped_image→priority hint, findings 힌트 bbox 미포함/DEI 힌트 bbox 포함, 실패 시 예외, **core 미import**(직접 유입 방지). + 기존 3종 green 유지로 core 무변경 증명.
5. **schema-evolution 필요 징후?** **없음.** L1은 감지·라우팅이라 구조화 confidence/bbox/needs_ocr를 findings에 넣을 필요가 없었다(자유텍스트+기존 판정 경로로 충분). → 스키마 변경 없이 완료(2L-1/Codex 권고대로 별도 결정으로 남김).

## 3. 테스트 / 검증 결과

| 대상 | 결과 |
|---|---|
| `tests/test_intake_dei_producer.py` (신규) | **14/14 PASS** (rc=0) |
| `tests/test_findings_validator.py` | **26/26** (실패 0) — core 무변경 |
| `tests/smoke_test_renderer.py` | **22/22** (실패 0) — core 무변경 |
| `tests/test_delivery_wiring.py` | **33/33** (실패 0) — core 무변경 |

- 실패 없음. 기존 3종이 **수정 없이** green → schema/validator/renderer/delivery 동작 불변 증거.
- 검증 명령: `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python tests/<file>.py`(한글 출력 인코딩).

## 4. 경계 보존 확인 (Codex 2L-1 risk 대응)

- **DEI ≠ 제2의 findings 스키마**: DEI는 renderer/validator에 직접 유입되지 않음(테스트 `core 미import`로 강제). Skill만 재료로 소비.
- **priority→judgment 직접 매핑 금지**: §6 규칙에 "priority는 참고, 판정으로 직접 매핑 금지" 명시.
- **OCR/native/model/egress 없음**: 어댑터는 실행하지 않고 이미 만들어진 JSON만 변환. 새 의존성 0(표준 라이브러리).
- **L2/L3 과장 금지**: SKILL.md·§6·README에 "OCR 실행·도표 구조 분류는 현재 기능 아님(후속 게이트)" 명시.
- **findings 스키마 불변**: `kssb_findings.schema.json` 미변경. bbox는 DEI에만, findings엔 사람 읽기용 위치 표기만.

## 5. 변경 범위 요약

- 신규: `src/intake/dei_producer.py`, `src/intake/README.md`, `tests/test_intake_dei_producer.py`.
- 수정(Skill 문서만): `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`, `.../SKILL.md`.
- **무변경**: `src/schemas/*`, `src/validators/*`, `src/renderers/*`(renderer·delivery), manifest·marketplace·package·dependency. OCR provider 미설치/미실행, API/Python-run(테스트 제외)/notebook/업로드 없음, node_modules·lock·raw artifact 미커밋.

## 6. Capability Status Ledger 갱신

- **L1 = implemented(2L-2), review 대기** → Codex Review PASS 시 `implemented+reviewed`로 승격(그 전엔 제품 문서에서 "현재 기능" 확정 표기 유보). L2·L3 = planned(Gate D-blocked), L4 = out-of-preliminary-scope.

## 7. 다음 단계

- **Codex Review 필요**(본 L1 구현). PASS 시 L1을 `implemented+reviewed`로 승격.
- 이후 **2L-3(Gate D prep/실행)** — 로컬 OCR provider·유형3 샘플·모델준비↔파싱 no-egress 분리. Gate D 통과 전 L2/L3 코드 없음.
- 미해결(비차단): 실제 Kordoc→intake JSON 생산은 사용자 로컬 out-of-band(어댑터는 그 산출물을 변환만). 적합 유형3 스캔 샘플 확보는 2L-3 선행.
