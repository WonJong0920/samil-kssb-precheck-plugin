# src/intake — Optional Intake → DEI-candidate Adapter (Cycle 2L-2, L1)

> **경계**: 이 폴더는 **plugin core가 아니다.** Skill·validator·renderer·delivery·schema로 이루어진 findings 파이프라인의
> **바깥(opt-in/local)** 계층이다. Cycle 2I-3B 설계·2L-1 prep·Codex Review에 정합.

## 무엇인가

- `dei_producer.py`: 이미 로컬에서 추출된 **문서 인테이크 산출물**(예: Kordoc `--format json`)을 받아,
  Cycle 2L-1에서 동결한 **DEI-candidate 계약**(문서 수준 중간 산출물)으로 **결정적으로** 정규화하는 표준 라이브러리 전용 어댑터.

## 경계(하지 않는 것)

- **판정 미생성**: `judgment_code`/`judgment_label`을 만들지 않는다. `extraction_quality`/`needs_ocr`/priority는 **검수 트리아지 신호**일 뿐 KSSB 판단이 아니다.
- **원문 보존**: 블록 텍스트/표를 원문 그대로 전달한다. 요약·수치 추정·이미지 의미 해석 금지.
- **findings 아님**: DEI는 findings 스키마가 아니다. **renderer/validator에 직접 유입되지 않는다.** Skill이 근거 재료로만 소비해 기존 findings 스키마 필드로 산출한다.
- **실행 없음**: OCR·모델 다운로드·네트워크·외부 도구를 **실행하지 않는다.** 인테이크 도구 실행은 이 모듈 밖(사용자 로컬)이며, 본 모듈은 이미 만들어진 인테이크 dict/JSON만 변환한다.
- **새 의존성 없음**: Python 표준 라이브러리만 사용. Kordoc/Mistral을 **core hard dependency로 추가하지 않는다**(Version Strategy V8).

## Capability ladder 위치

- 이 어댑터는 **L1(스캔/이미지/도표 존재 감지 + 검수 라우팅)**의 재료 생산기다.
- **L2(로컬 OCR 실행)·L3(도표/차트 구조 분류)는 Gate D 통과 전 범위 밖**이며, 이 폴더는 OCR을 실행하지 않는다.

## Skill 연결

- Skill은 DEI-candidate의 `needs_ocr`·`extraction_quality`·`warnings`·`review_priority_hints` 신호를 읽어,
  판독 불가/저신뢰 구간을 **기존** `not_verifiable` + `missing_info` + `customer_questions` 경로로 라우팅한다(스키마 변경 없음).
- 위치는 `page_or_section_hint()`가 만드는 사람 읽기용 `p.<n> · <section>` 표기로만 findings에 들어간다(**bbox는 DEI에만**).
- 상세: `src/skills/samil-kssb-precheck/evidence_mapping_rules.md` §6, `docs/planning/cycle2l_1_l1_implementation_prep.md`.
