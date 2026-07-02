# Cycle 2I-3 완료 보고 — Minimal Validator Path-Exposure Guardrail

## 1. 작업 목적

`docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md` §11의 "2I-3에서 바로 구현 가능한 최소 작업"을 구현한다.
findings 내부 문자열 값에 포함될 수 있는 **로컬 경로·임시경로·계정 경로** 노출을 **렌더 전 validator preflight 단계에서
detect-only로** 더 잘 감지하도록 기존 내부 경로 스캔을 소폭 확장한다. renderer/delivery에서 내용을 지우는 방식이 아니라,
**upstream validator**에서 위험 문자열을 감지하는 것이 목적이다(렌더러는 재작성 금지 원칙 유지).

## 2. 변경 요약

- validator의 기존 내부 경로 스캔(`_PATH_PATTERNS` → `path.internal_exposure` error, findings 전체 문자열 값 대상)에
  한글 ESG 공시 텍스트에 등장 가능성이 낮은 **보수적 토큰**만 추가.
- `tests/test_findings_validator.py`에 신규 토큰 검출·valid example 불변식·detect-only 케이스 추가(19 → **26건**).
- 계획 문서 §11을 "구현 완료"로 현행화, current_status·decision_log(D44) 갱신.

## 3. 수정 파일

**수정**
- `src/validators/kssb_findings_validator.py` — `_PATH_PATTERNS` 확장(detect-only, 시그니처·구조 불변).
- `tests/test_findings_validator.py` — 경로 노출 확장 테스트 7건 추가.
- `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md` — §11 구현 완료 표기.
- `docs/current_status.md`, `docs/decision_log.md`(D44) — 반영.

**신규**
- `docs/cycle2i_3_minimal_validator_guardrail_completion_report.md` — 본 완료 보고.

**변경하지 않음**: renderer, delivery, schema, manifest, marketplace. 새 외부 의존성 없음.

## 4. 구현 판단 근거

- **최소·안전**: validator에 이미 내부 경로 스캔(`_check_prohibited_and_paths` + `_walk_strings` + `_PATH_RE`)이 있어,
  새 기능이 아니라 **패턴 목록만 소폭 확장**했다. 시그니처·반환·심각도(`error`)·detect-only 성격 불변.
- **오탐 최소화**: 추가 토큰(`/home/`, `/var/folders/`, `[\\/]Temp[\\/]`, `%(TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)%`)은
  한글 공시 본문에 자연스럽게 등장하기 어려운 경로·임시·계정 토큰이다. `[\\/]Temp[\\/]`는 앞뒤 경로 구분자를 요구해 "temperature" 등 일반어와 충돌하지 않는다.
  valid example은 확장 후에도 error 0(테스트로 확인).
- **차단 위치 원칙**: 로컬 경로는 렌더러/delivery에서 내용을 스크럽하지 않고, **렌더 전 validator에서 감지**한다(error 시 findings를 먼저 바로잡음).
- **중복 회피**: `%APPDATA%`/`%LOCALAPPDATA%`는 기존 `AppData` 패턴(IGNORECASE)이 이미 포괄하나, 명시성을 위해 env-var 결합 패턴에 함께 두었다(무해).

## 5. 추가한 경로 guardrail 범위

`_PATH_PATTERNS`에 추가:
- `r"/home/"` — POSIX(Linux) 사용자 홈.
- `r"/var/folders/"` — macOS 임시 폴더.
- `r"[\\/]Temp[\\/]"` — `\Temp\` 또는 `/temp/` 등 AppData 밖 임시 폴더.
- `r"%(?:TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)%"` — Windows 환경변수 경로 참조.

기존 커버리지(불변): `C:\`·`C:/`, `/Users/`·`Users\`, `.codex`·`.claude`, `AppData`, `sandbox`, `plugin(s)/cache`, `/tmp/`, `node_modules`.

## 6. validator detect-only 유지 여부

- 유지. `validate_findings()`는 여전히 `Issue` 목록만 반환하고 findings를 **변경하지 않는다**.
- 테스트로 확인: (a) 경로 포함 findings 검증 후 입력 객체 미변경, (b) 기존 detect-only 케이스 유지.

## 7. renderer / delivery / schema 불변 여부

- renderer(`kssb_report_renderer.py`)·delivery(`kssb_report_delivery.py`)·schema(`kssb_findings.schema.json`)·manifest·marketplace **미변경**.
- 렌더러는 계속 findings 내용을 재작성하지 않는다(로컬 경로 스크럽은 구현하지 않음 — upstream validator 책임).

## 8. 실행한 검증과 결과

- `python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json` → error 0, warning 0, info 1(jsonschema 미설치), RC 0.
- `python tests/test_findings_validator.py` → **26/26 PASS**(기존 19 + 경로 확장 7). 신규: `/home/<user>/`·`/var/folders/`·`%TEMP%`·`%USERPROFILE%`·`\Temp\` 검출, valid example error 0 유지, 경로 포함 입력 detect-only 미변경.
- `python tests/smoke_test_renderer.py` → **22/22 PASS**(렌더러 미변경).
- `python tests/test_delivery_wiring.py` → **33/33 PASS**(delivery 미변경).

## 9. 실행하지 못한 검증과 이유

- **`jsonschema` full validation**: 미설치(설치 금지). 표준 라이브러리 검증으로 대체.
- **실제 PDF(HFG/K-water) 재실행·인테이크**: 범위 밖·지시상 금지(미수행).

## 10. 남은 리스크

- 스캔은 **substring 기반**이라 인코딩 우회·비정형 표기 경로는 놓칠 수 있음(휴리스틱) → 사람 검수·인테이크 단계 보완 대상.
- 이 guardrail은 **findings 값에 경로가 들어온 경우 감지**한다. 근본적으로 경로가 findings에 들어오지 않게 하는 것은 **인테이크(2I-3A)** 과제.
- 표/이미지/스캔 PDF의 수치·위치 실재성, 인용 실재성은 여전히 인테이크·사람 검수 대상(이번 범위 밖).

## 11. 다음 단계 제안

- Codex Review(계획 문서 + 본 guardrail).
- 2I-3A: Kordoc feasibility spike(사용자 승인·로컬·pluggable·미설치), 실제 PDF 인테이크·표/OCR 설계 검증, Document Evidence Index 상위 설계 검증.
- 착수 여부·순서는 ChatGPT/사용자 확인 후.
