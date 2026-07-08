# Black-box 검증 프로토콜 — sample document → findings → preflight → delivery (2N-6 Phase 0, R2)

> **성격**: 2N-5 실행 evidence의 Major("결정적 sample→report harness 부재")에 대한 공식 프로토콜이다.
> **findings 생성은 Skill/LLM 판단 단계이므로 결정적 parser가 아니며, 이 프로토콜은 그것을 위장하지
> 않는다** — 판단 단계는 수동 Skill-run으로 수행·캡처하고, 후반부(preflight→delivery)만 스크립트로
> 실행한다. 이 문서가 시나리오 1(텍스트 PDF baseline 전 구간)의 판정 기준이다.

## 1. 실행 환경 규약 (Windows / Codex 세션 공통)

- **Node**: 시스템 Node(실측 v24.16.0) 또는 승인된 portable Node — runner 실행에 사용.
- **Python(과도기 — Node core 이식(D92) 완료 전까지)**: bare `python`은 WindowsApps stub로 실패할 수
  있으므로 **절대 경로**를 사용한다(예: `<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe`).
  실행자는 사용한 Python 경로·버전을 evidence에 기록한다.
- **UTF-8 규약(R3 — 필수)**: Python 후반부 실행 시 반드시 다음 환경 변수를 설정한다.
  ```powershell
  $env:PYTHONUTF8 = "1"; $env:PYTHONIOENCODING = "utf-8"
  ```
  (dei_producer/kssb_report_delivery의 CLI 진입점에는 stdout/stderr UTF-8 reconfigure **최소 가드**가
  있어 미설정 시에도 crash는 방지되지만, 규약 설정이 기본이다 — 가드는 이중 방어.)
- 산출물은 전부 **repo 밖** 임시 폴더(`<RUN_ROOT>`)에 생성하고, 실행 후 repo 오염 스캔을 수행한다.

## 2. 프로토콜 단계

### 준비
1. 샘플 문서 선정(repo 밖 보관·원본 미커밋) — 파일명·바이트·SHA-256을 evidence에 기록.
2. `git pull` 후 HEAD·clean 상태 기록.

### (선택·승인 기반) 보조 판독
3. 구조 보강 판독: `node src/intake/runners/document_intake_router.cjs <PDF> --out-dir <RUN_ROOT>\intake --approve-run --evidence-mode`
   → `<stem>.intake.json`. 거부/부재 시나리오는 해당 fallback 문구를 evidence로 캡처.
4. (해당 시) OCR: `node src/intake/runners/pdf_ocr_runner.cjs <PDF> --intake <intake.json> --out-dir … [--approve-install] --approve-run --evidence-mode`
   → `<stem>.ocr_text.json`. 설치 승인은 별도 기록.
5. (해당 시) DEI 정규화: `<PY> src/intake/dei_producer.py <intake.json> --source-id <id> [--ocr-text <ocr_text.json>]`
   → DEI-candidate JSON(§1 UTF-8 규약 하).

### 판단 단계 — 수동 Skill-run (결정적이지 않음을 명시)
6. Codex 세션에서 `samil-kssb-precheck` Skill을 호출하고, 입력으로 샘플 문서(또는 3~5의 DEI-candidate/
   보조 산출물)를 지정한다. Skill 절차(SKILL.md)에 따라 **구조화 findings JSON**을 생성시키고
   `<RUN_ROOT>\findings\<sample>.findings.json`으로 저장하게 한다.
7. **캡처 요건**: 사용한 프롬프트 문구·Skill 버전(HEAD)·입력 목록·생성 findings 파일의 SHA-256을
   evidence에 기록한다. LLM 비결정성 때문에 **재실행 시 findings가 달라질 수 있다** — 판정은 byte
   재현성이 아니라 아래 §3 기준 충족 여부로 한다.

### 후반부 — 스크립트 실행(결정적)
8. preflight+delivery: `<PY> src/renderers/kssb_report_delivery.py <findings.json> -o <RUN_ROOT>\report`
   → 사용자 요약(stdout) + 대표 문서(DOCX→HTML→MD). preflight counts를 evidence에 기록.
9. 산출 보고서에 no-overclaim/누출 스캔(§3-e)을 수행한다.

## 3. 시나리오 1 판정 기준 (PASS / FAIL / BLOCKED)

**PASS** — 아래 전부 충족:
- (a) findings JSON이 스키마·검증기 preflight를 통과(error 0; warning은 기록하고 진행).
- (b) findings의 evidence anchor가 **source-bound**: 무작위 표본 ≥5건의 quote가 입력 문서 원문에서
  재발견됨(사람 확인 — 텍스트 추출 가능 문서 한정), OCR 유래 인용은 §6 표기 준수.
- (c) delivery가 대표 문서를 생성(DOCX 우선, 실패 시 HTML/MD fallback도 PASS — fallback 동작 기록).
- (d) 확인 불가 항목이 단정 없이 질문/요청자료로 라우팅됨(표본 확인).
- (e) 생성 보고서에 미부정 과장 표현(OCR 지원 완료/준수 확정류)·provider명·로컬 경로·내부 사이클 용어·
  stack trace **0건**.
- (f) 실행 후 repo 오염 0.

**FAIL** — 위 기준 중 하나라도 재현 가능한 결함으로 미충족(예: preflight error에도 보고서가 정상처럼
출력, 허위 anchor, 누출 발견). 결함·재현 절차를 evidence에 기록.

**BLOCKED_ENV / BLOCKED_APPROVAL** — 환경 제약(sandbox·권한)·승인 부재로 단계 자체를 실행하지 못한
경우. **실패로 기록하지 않되 성공으로도 기록하지 않는다**(2N-5 원칙 유지). 사유·차단 지점 필수 기록.

## 4. evidence 최소 요건

실행 HEAD·환경 표(Node/Python 경로·버전)·샘플 인벤토리(hash)·단계별 명령과 exit code·산출물
위치/바이트/hash·preflight counts·§3 판정 근거·오염 스캔 결과. 원문/산출물 자체는 repo 미커밋
(집계·hash만 문서화).

## 5. 한계 (정직 표기)

- findings 품질 판정의 (b)(d)는 **사람 확인**이 개입한다 — 이 프로토콜은 판단 단계를 자동화하지 않는다.
- 동일 입력 재실행 시 findings 내용이 달라질 수 있다(LLM 비결정성). 회귀 비교가 필요하면 findings
  파일을 evidence로 보존해 계약·품질 기준 충족 여부를 각각 판정한다.
- Python 후반부 규약은 과도기다 — Node core 이식(D92 Phase 2) 완료 시 이 문서의 §1 Python 항목과
  §2의 `<PY>` 명령을 Node 명령으로 갱신한다.
