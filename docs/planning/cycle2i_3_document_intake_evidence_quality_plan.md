# Cycle 2I-3 계획 — Document Intake / Evidence Quality / Kordoc Feasibility Boundary

> **성격**: 계획 문서. 이번 사이클은 **설계 + 구현 가능 범위 판단 + 작은 guardrail 제안**이다.
> **하지 않는 것**: Kordoc 설치·MCP setup·npx/npm/pip·OCR provider·외부 vision 호출·실제 HFG/K-water PDF 재실행·
> 문서 인테이크 엔진 대규모 구현·Document Evidence Index를 확정 schema로 강제 도입·marketplace/manifest 변경·submission.zip.
> Kordoc은 후속 **2I-3A feasibility spike 후보**로만 다룬다. 운영 원칙은 `AGENTS.md`·`docs/operating_principles.md`.
> **이번 push는 계획 문서(설계)만** 포함하며, 아래 §11의 최소 validator guardrail은 **검토 후 착수 대기(미구현)**다.

## 1. 작업 목적

Skill → validator preflight → renderer → delivery 파이프라인(2I-1/2I-2, Codex PASS)은 대표 문서(DOCX/HTML/Markdown)와
안전한 사용자 요약을 낸다. 남은 리스크는 모두 **findings 상위(문서 인테이크)**에 있으며 판정/렌더 로직이 아니다. 이 문서는
그 리스크를 **어디서(인테이크 vs validator vs renderer/delivery)** 다룰지 정리하고, quote/page/location 품질을 높이는
안전한 중간 구조(Document Evidence Index)를 **문서 수준으로** 제안하며, 지금 안전하게 구현 가능한 최소 guardrail과
2I-3A로 미룰 항목을 구분한다.

## 2. 완료된 2I-1 / 2I-2 요약

- **2I-1(Execution Wiring / Output Separation)**: 전달 배선기 `src/renderers/kssb_report_delivery.py` 신설 —
  findings → validator preflight(detect-only) → renderer(재판정 없음) → **사용자-facing 요약**. 사용자 요약(파일명·표시경로·
  preflight 건수·사람 검수·경계 고지)과 내부 상세(전체 경로·validator 이슈·docx_error)를 **분리**. 대표 문서 우선순위
  **DOCX → HTML → Markdown**(Markdown fallback 추가). 표시경로 sanitize + 2차 redaction으로 로컬 절대경로·계정명 비노출.
- **2I-2(Presentation Quality + Skill Alignment)**: 렌더러 3종에서 한글 공시요구 제목 우선(항목ID 보조), 근거 앵커를
  인용/출처/위치 라벨로 분리, §2 항목표 열 재정렬, 질문 안내 인트로. SKILL.md를 배선기 경로·Markdown fallback과 정합. 표기만 변경(재판정 없음).

## 3. 남은 intake/evidence 품질 문제

1. **인테이크 품질 의존성**: PDF 추출 품질이 낮으면 findings의 `quote`/`page_or_section`이 부실해지고, 렌더러는 있는 것만
   보여줄 수 있어 근거 품질이 그대로 낮아진다.
2. **정량 지표 신뢰도**: 표 안 수치(Scope 1·2·3, 에너지 사용량 등)가 깨져 들어오면 정량 근거로 승격하면 안 됨 →
   "확인 불가/보완 필요 → 요청자료"로 전환해야 한다(현 원칙과 정합).
3. **findings 값에 로컬 경로 유입**: findings의 문자열 값 자체에 로컬 절대경로·임시경로·계정명이 들어오면, 렌더러는
   내용을 재작성하지 않으므로 **대표 문서 본문**에 그대로 남을 수 있다(2I-2 리뷰 §8이 2I-3 과제로 지목).
4. **인용 실재성**: quote가 실제 원문인지(환각·창작 인용 여부)는 자동 검증 밖이며 사람 검수 대상.

## 4. PDF / table / image / scanned-document 리스크

- **텍스트 PDF**: 한글 CID/ToUnicode CMap 필요. 일부 문자·수치 깨짐 가능.
- **표(table)**: 선 없는 표·병합 셀은 텍스트 스트림만으로 구조·수치 복원 불안정 → 위치/수치 단서 손실.
- **이미지·차트**: 텍스트 미포함. 캡션·수치가 이미지 안에 있으면 텍스트 추출로 잡히지 않음.
- **스캔 PDF**: 텍스트 레이어 없음 → OCR 필요(별도 승인 게이트). OCR 없이는 근거 미확인 → 요청자료 전환.
- **대용량**: 대형 PDF는 메모리/시간 취약.

## 5. Document Evidence Index (DEI) 제안 — 문서 수준(설계만)

인테이크가 findings **상위(upstream)**에서 생성하는 중간 산출물 개념. **findings schema를 바꾸지 않는다.**
아직 확정 schema로 강제 도입하지 않고, 아래 예시(illustrative)로 정의만 한다.

```json
{
  "source_file": "<파일명 또는 source_id>",
  "page_number": 9,
  "section_path": "II. 기후 > 거버넌스",
  "block_id": "p9-b3",
  "block_type": "heading | paragraph | table | image | list",
  "extracted_text_or_table_markdown": "…원문 발췌 또는 마크다운 표…",
  "bbox_or_location_hint": "p.9 상단 표",
  "extraction_quality": "high | medium | low",
  "warnings": ["표 수치 일부 미복원"],
  "needs_ocr": false,
  "kssb_candidate_area": "governance | strategy | risk_management | metrics_and_targets",
  "evidence_confidence": "high | medium | low",
  "reviewer_note": "사람 검수 메모"
}
```

**현 구조와 연결(설계만, 코드/스키마 미변경)**:
- **→ findings `evidence_anchor`**: `source_file`→`source_id`(source_documents 매핑), `page_number`+`section_path`→
  `page_or_section`, `extracted_text_or_table_markdown` 발췌→`quote`, 관련성 서술→`relevance_note`.
- **→ `finding_item.area`**: `kssb_candidate_area`는 후보 제시일 뿐, 최종 판정·근거 선택은 **Skill이 수행**(재판정 아님).
- **→ validator(detect-only)**: `needs_ocr`·`extraction_quality`·`warnings`가 저신뢰 구간을 표식 →
  "확인 불가 → `missing_info` + `customer_questions`" 전환 근거.
- **→ renderer**: 변경 없음. renderer는 계속 findings만 소비. DEI는 findings 생성 재료이지 renderer 입력이 아니다.
- **경계**: DEI는 **판정을 만들지 않는다.** 근거 후보·위치·품질 신호만 제공. `evidence_confidence`/`kssb_candidate_area`가
  자동 판정처럼 오용되지 않도록 "재료일 뿐" 경계를 유지.

## 6. findings 입력값 로컬 경로/임시경로 guardrail 제안

- **이미 존재**: validator가 findings의 **모든 문자열 값**을 스캔해 내부 경로 토큰(`C:\`·`/Users/`·`.codex`·`.claude`·
  `AppData`·`sandbox`·`/tmp/`·`plugin/cache` 등)을 `path.internal_exposure`(error)로 감지한다
  (`src/validators/kssb_findings_validator.py` `_PATH_PATTERNS`·`_check_prohibited_and_paths`·`_walk_strings`).
- **차단 위치 원칙**: 로컬 경로는 **렌더러/delivery에서 내용을 지우는 방식이 아니라, 렌더 전 upstream(validator preflight)**에서
  감지·차단해야 한다(렌더러는 재작성 금지, delivery는 사용자 요약만 sanitize). validator가 error를 내면 findings를 먼저
  바로잡은 뒤 렌더한다.
- **이번 사이클 최소 확장(§11)**: 기존 스캔이 놓치는 몇 개 토큰(`/home/…`, `%TEMP%`/`%USERPROFILE%` 등 Windows env-var,
  `/var/folders/`, `\Temp\`)을 **detect-only로** 추가. 새 의존성·시그니처 변경·렌더러/스키마 변경 없음.

## 7. validator가 잡을 수 있는 것 vs intake가 잡아야 할 것

| 잡는 주체 | 항목 |
|---|---|
| **validator(detect-only, 현재/확장)** | 구조 필수 필드·source_id cross-ref·모드↔라벨 정합·source-bound 조건부 규칙·빈 quote·질문 6필드·금지 표현·**내부/로컬 경로 노출** |
| **intake(문서 인테이크, 2I-3/2I-3A)** | 원문 인용 충실도(quote↔원문)·표 수치 복원·페이지/섹션 실재성·이미지/스캔 OCR 필요 판정·표/이미지 구조 |
| **사람 검수(불변)** | 인용 실재성 최종 확인·상충·해석 필요·정량 타당성 |

→ validator는 "형식·정합·노출"을, intake는 "원문 충실도·수치·위치 실재성"을 담당. 서로 대체하지 않는다.

## 8. renderer / delivery가 하지 말아야 할 것

- **renderer**: 재판정·근거/질문/권고 생성 금지, 없는 페이지·인용 합성 금지, **findings 내용 재작성 금지**(로컬 경로 스크럽도 하지 않음 — 그건 upstream 책임).
- **delivery**: 판정·근거 생성 금지. 사용자 요약 생성 + 표시경로 sanitize + 로그/내부 분리까지만. findings 본문을 바꾸지 않는다.

## 9. Kordoc feasibility spike 범위 (2I-3A)

- **포지셔닝**: 사용자 승인 후 로컬 MCP/CLI 설치 가능한 **인테이크 후보 도구**로만. **plugin 본체 hard dependency 금지**,
  인테이크 계층은 **도구 교체 가능(pluggable)**, Kordoc 부재 시 현행 경로(제한 텍스트 추출 + "확인 불가→요청자료") 유지.
- **적합 근거(공개 README, 확인일 2026-07-02)**: PDF·XLSX·DOCX·HWP(X) → Markdown + 표 재구성, MCP 도구(`parse_document`·
  `parse_table` 등), Node.js 18+. baseline "표 수치 복원 실패"와 직접 맞닿음.
- **범위**: 별도 evidence 문서/spike 지침(설치·실행은 사용자 로컬·승인 후). 이번 사이클은 **범위 정의까지만.**

## 10. Kordoc 설치 전 필요한 사용자 승인 조건

1. **오프라인/무-egress** — 문서·데이터가 외부 서버로 나가지 않음(민감자료 전제).
2. **라이선스 적합성** — 배포·제출 맥락에서 사용 가능(정밀 검토).
3. **두 샘플 유형 재현성** — KSSB형/일반형 PDF에서 표·수치가 신뢰 가능하게 복원.
4. **결정성/대용량 안정성**.
5. **DEI → `evidence_anchor` 손실 최소 매핑**.
6. **Skill-first·경계 유지**(내부 구성요소, 로컬 경로·MCP 설정 비노출).
7. **재현성 기록**: 정확한 패키지 버전·명령/도구 출처·README 확인일·public README 일치 여부 기록(이전 D40 요건).
- `.mcp.json`·클라이언트 설정·설치 명령·로컬 경로·계정은 **repo 커밋 금지**. OCR provider는 **별도 승인 전 사용 금지**.

## 11. 2I-3에서 바로 구현 가능한 최소 작업 (검토 후 착수)

**validator 내부 경로 스캔 소폭 확장(detect-only)** — 6가지 안전 기준(validator detect-only 유지 · renderer 재판정 없음 유지 ·
delivery 전달 경계 유지 · 새 의존성 없음 · 테스트 가능 · 2I-3A와 무충돌) 모두 충족.
- `_PATH_PATTERNS`에 보수적 토큰 추가: `/home/`, `/var/folders/`, `[\\/]Temp[\\/]`, `%TEMP%`·`%TMP%`·`%USERPROFILE%`·
  `%APPDATA%`·`%LOCALAPPDATA%`. (한글 ESG 공시 텍스트에 등장 가능성이 낮아 오탐 위험 낮음.)
- `tests/test_findings_validator.py`에 신규 토큰 검출 케이스 3~4건 추가, valid example 0 error 불변식 유지.
- **범위**: validator 파일 + 테스트만. renderer/delivery/schema/manifest 불변.
> **구현 완료**(별도 커밋). `_PATH_PATTERNS`에 `/home/`·`/var/folders/`·`[\\/]Temp[\\/]`·`%(TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)%` 추가, 테스트 7건 추가(26/26 PASS). 완료 보고: `docs/cycle2i_3_minimal_validator_guardrail_completion_report.md`.

## 12. 2I-3A로 분리해야 할 작업

- 문서 인테이크 엔진(PDF/표/이미지 파싱), Kordoc adapter/설치, OCR provider 연동, DEI를 **확정 schema/코드**로 도입.
- 이유: 외부 의존·복잡도·사용자 승인·별도 검증이 필요하며, 본체 hard dependency로 성급히 고정하면 Skill-first·결정성·경계 리스크.

## 13. Codex Review 요청 포인트

1. 인테이크/evidence 품질 문제와 리스크 정리가 정확한가?
2. DEI를 **문서 수준(비-schema)**으로 둔 것이 적절한가? findings/renderer/validator와 충돌 없는가?
3. 로컬 경로 차단을 **upstream validator**에 두고 renderer/delivery는 재작성하지 않는 경계가 타당한가?
4. validator 경로 스캔 소폭 확장이 detect-only·무-의존·무-오탐 관점에서 안전한가?
5. Kordoc을 2I-3A feasibility spike(사용자 승인·미설치·pluggable)로 제한한 것이 적절한가?
6. 지금 구현 가능한 최소 범위와 2I-3A 분리 범위 구분이 타당한가?

## 14. 다음 단계 제안

- (이번) 계획 문서 검토 → (승인 시) §11 최소 validator guardrail 구현·테스트·push → Codex Review.
- 이후 2I-3A: Kordoc feasibility spike(사용자 승인·로컬), 실제 PDF 인테이크·표/OCR 설계 검증.
- 착수 여부·순서는 ChatGPT/사용자 확인 후.
