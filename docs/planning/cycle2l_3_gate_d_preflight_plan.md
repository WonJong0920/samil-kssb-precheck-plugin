# Cycle 2L-3 — Gate D Preflight / Execution Plan

> **성격**: **no-execution prep 문서**(문서 수준). Gate D를 **실제 실행하기 전** 필요한 preflight·evidence template·pass/fail 기준을 확정한다.
> **이번 작업에서 하지 않는 것**: OCR provider 설치·모델 다운로드·OCR 실행·외부 API 호출·notebook 실행·Python OCR/문서처리 실행·외부 문서 다운로드·샘플 PDF 생성/커밋·package/lock 변경·schema/validator/renderer/delivery 수정·L2/L3 코드·submission.zip·실제 evidence 값 조작/가정.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: 2L-1 §6(Gate D 비실행 준비 seed)·2K(L2/Gate D)·Gate A evidence(no-egress 검증법)·RH-B2/Gate B(native/license)·Version Strategy.

## 1. Gate D 목적과 범위

**목적**: **L2(로컬 OCR 텍스트 추출)** 착수 전에, 로컬 OCR provider를 프로젝트의 **no-egress·무-hard-dependency·결정성·license 경계**를 깨지 않고 붙일 수 있는지 실증 검증한다.

**핵심 구분(반드시 분리)**:
| 단계 | 성격 | Gate D 요구 |
|---|---|---|
| **모델/도구 준비** | 모델·바이너리 다운로드 등 **egress 발생 가능**(1회성) | egress **허용·기록**(명령·출처·시각). 파싱 단계와 **분리** |
| **문서 파싱/OCR 실행** | 실제 스캔/이미지 텍스트화 | **no-egress 증거 필수**(Gate A 방식: 차단 제어검증 + 실행 중 outbound 시도 0) |
| **native/optional/license** | provider가 끌어오는 native 바이너리·LGPL 등 | **Gate B 재검토**(RH-B2가 격리한 native/LGPL 재유입 통제) |
| **비민감 Type 3 샘플** | 스캔/이미지 전용 입력 | 비민감·재현성(§2) |
| **결과 연결 경계** | OCR 산출 | **DEI candidate / 검수 신호로만** 연결(§L1과 동일). renderer/validator 직접 유입·판정 생성 금지 |

**경계**: **Gate D는 L2/L3 구현이 아니다.** Gate D **통과 전 L2/L3 코드 구현 금지.** OCR 결과는 판정을 만들지 않으며(차트 수치/이미지 의미/KSSB 충족 추정 금지), 최종 판단은 Skill source-bound + 사람 검수.

## 2. Type 3 샘플 기준

Gate D에 쓸 스캔/이미지 전용 샘플 기준:
- **비민감**: KSSB 판단·고객 정보·개인정보(PII) 없음.
- **공개 가능 또는 synthetic**: 저작권·식별정보 문제 없는 공개자료이거나 합성 문서.
- **실제 스캔/이미지 기반 페이지**: 텍스트 레이어가 없거나 낮은 품질.
- **검증 가능성**: 인테이크 신호(`pageQuality.needsOcr` / 낮은 `textChars` / `qualitySummary.needsOcr`)로 "텍스트 레이어 없음/저품질"을 확인 가능해야 함.
- **repo 원본 PDF 커밋 여부**: **별도 판단으로 보류**(제출 패키징 정책 §1 E-분류 원칙상 원본 PDF는 원칙 미커밋). Gate D evidence는 hash·관찰만 기록.

**현재 상태: 미확보.** (기존 관찰: 로컬 후보 중 교육 PDF는 암호화, "HWP Document"는 텍스트 레이어 PDF → 스캔 전용 아님.) → **필요 샘플 정의만** 남기고, 이번 작업에서 **샘플을 생성·다운로드하지 않는다.** 실제 확보는 Gate D 실행(사용자 로컬) 선행 항목.

## 3. OCR provider 후보 기준 (평가 기준 우선, 고정 금지)

provider를 바로 고정하지 않고 **후보 평가 기준**을 먼저 정의한다:
1. **local/offline 실행 가능성**(클라우드 API 아님 → Gate C 아닌 Gate D 대상).
2. **모델 준비 단계 ↔ 파싱 단계 분리 가능성**(§1 핵심 — 준비 egress와 파싱 no-egress 분리 검증 가능).
3. **no-egress 검증 가능성**(Gate A 방식으로 파싱 중 outbound 관측·차단 가능).
4. **native dependency 존재 여부**(.node/바이너리 → Gate B 재검토 필요성).
5. **license 재검토 필요성**(provider·전이·모델 가중치 license; LGPL/비permissive 여부).
6. **deterministic output 확보 가능성**(동일 입력→동일 출력 hash).
7. **Windows 환경 실행 가능성**(현 개발 환경).
8. **package/lock/submission 포함 통제 가능성**(`--omit=optional`류로 미유입 고정 가능, 제출 번들 통제).
9. **실패 시 L1 fallback 유지 가능성**(provider 부재/실패 시 현행 "확인 불가→질문" 경로 유지).

**검토 대상 후보(설치·실행 금지, 나열만)**:
- **Kordoc `--formula-ocr`**: 로컬 ONNX(onnxruntime-node) 경로. 단 첫 사용 시 **~155MB 모델 다운로드(준비 egress)**, native 바이너리, RH-B2가 격리한 optional/native 재유입 → Gate B 재검토 필수. (수식 위주라 일반 OCR 적합성 별도 확인.)
- **Tesseract 계열**(native `tesseract` 또는 `tesseract.js` WASM): 로컬·오프라인 가능, Apache-2.0 계열. 언어 데이터(kor/eng) 준비 단계 egress 분리 필요.
- **로컬 ONNX 기반 OCR**(예: RapidOCR/PaddleOCR ONNX 계열): 로컬 실행 가능하나 모델 가중치 준비·native·license·용량 재검토 필요.
- → 최종 선정은 **Gate D 실행 단계에서 위 9개 기준으로 평가 후** 결정. 이번 작업은 **후보 나열까지만.**

## 4. Gate D Evidence Template (템플릿만 — 실제 값 생성 금지)

> Gate D 실행(사용자 로컬·승인 후) 시 아래를 채워 `docs/samples/gate_d_ocr_evidence_<YYYY-MM-DD>.md`로 저장(민감정보 제거). **아래는 빈 템플릿이다.**

```markdown
# Gate D — Local OCR Provider Evidence — <YYYY-MM-DD>

## 실행 환경 (일반화)
- OS 종류 / Node·Python 메이저 버전:
- 실행 위치: repo 밖 임시 디렉터리 [REDACTED_LOCAL_PATH]
- 실행자(observer) / 실행 시각(UTC):

## Provider / 버전
- provider 이름 / 버전:
- 모델/가중치 이름 / 버전 / 출처:

## 모델 준비 단계 (egress 허용·기록)
- 설치/모델 준비 명령(sanitized):
- 다운로드 출처 / 시각:
- 준비 단계 outbound 발생: Y (예상) — 상세(일반화):

## 파싱/OCR 실행 단계 (no-egress 증거)
- OCR 실행 명령(sanitized):
- egress 차단 방식(네트워크 차단 / 프로세스 outbound 훅 / 방화벽 등):
- 차단 제어검증(알려진 원격 연결 실패 확인): Y/N
- 파싱 중 outbound attempt 관측: 0 / <n> (있으면 상세, 마스킹):

## native / 바이너리 / license
- native dependency / `.node` / 바이너리 존재: Y/N (목록):
- license check 결과(provider·전이·모델 가중치, SPDX):
- Gate B 재검토(RH-B2 격리 native/LGPL 재유입 통제): 결과:

## 샘플 / 결정성
- input Type 3 sample hash(SHA-256):
- output hash(SHA-256):
- determinism rerun hash(2회 동일 여부):

## Redaction / artifact
- 로컬 경로·계정·토큰·API key·private key 노출 없음: Y/N
- 원본 PDF·모델·node_modules·raw log repo 미커밋: Y/N

## 판정 / 잔여 리스크
- Gate D 판정: PASS / CONDITIONAL PASS / FAIL
- 잔여 리스크(비차단 보강):
```

## 5. Gate D PASS / CONDITIONAL PASS / FAIL 기준

- **PASS**: 파싱/OCR 단계 **no-egress**(차단 제어검증 + outbound 0) · **deterministic output**(2회 hash 동일) · license/native **검토 통과**(permissive·통제 가능) · **비민감 Type 3 샘플** 처리 · **artifact redaction** 충족.
- **CONDITIONAL PASS**: provider는 유망하나 특정 조건 보완 필요 — 예: 특정 모델 가중치 license 불명확 · native 통제 방식 추가 검증 · 준비 egress 기록 보강. **조건 해소 patch/review 후** 진행.
- **FAIL**: 파싱 단계 **egress 발생** · license 불명확·부적합 · native dependency **통제 불가** · **deterministic 불가** · Type 3 샘플 부적합. → L1 fallback 유지.

## 6. Gate D 이후 경로

- **Gate D PASS** → **2L-4 L2 구현 가능**(로컬 OCR 텍스트 → DEI candidate 합류, 저신뢰 요청자료 라우팅). L2도 core 경계·판정 미생성 유지.
- **Gate D CONDITIONAL PASS** → 조건 해소 **patch/review** 필요. 해소 전 L2 코드 금지.
- **Gate D FAIL** → **L1 fallback 유지**, 내부 문서에 **"L3 target-shortfall(목표선 미달)"** 기록. 제품 문서는 L2/L3를 현재 기능으로 표기하지 않음.
- **어떤 경우에도 L3는 Gate D PASS + 별도 설계 검증 전 구현 금지.**

## 7. 이번 작업 경계 재확인 (no-execution)

- OCR provider 미설치·모델 미다운로드·OCR 미실행·API 미호출·notebook 미실행·외부 문서 미다운로드·샘플 PDF 미생성/미커밋.
- package/lock/manifest/schema/validator/renderer/delivery **무변경**, L2/L3 코드 없음, submission.zip 없음.
- **실제 Gate D evidence 값을 만들지 않았다**(§4는 빈 템플릿). L1은 `implemented+reviewed` 유지, L2/L3는 Gate D-blocked.

## 8. Codex Review 요청 포인트

1. Gate D 목적·범위(§1)가 준비 egress ↔ 파싱 no-egress를 정확히 분리하고 L2/L3 구현과 구분하는가?
2. Type 3 샘플 기준(§2)과 "미확보" 표기가 적절한가(임의 생성·다운로드 없이)?
3. OCR provider **평가 기준 우선·후보 나열만**(§3)이 provider 조기 고정을 피하는가?
4. evidence template(§4)이 준비/파싱 분리·no-egress·native/license·결정성·redaction을 충분히 담는가?
5. PASS/CONDITIONAL/FAIL 기준(§5)과 이후 경로(§6)가 L1 fallback·L3 게이트를 지키는가?
6. 이번 문서가 no-execution이며 L2/L3를 현재 기능으로 표현하지 않는가?

## 9. 다음 단계

- 본 preflight 문서 Codex Review → **사용자/ChatGPT 승인 후 Gate D execution(2L-3B 등)** 착수. 이번 작업은 **no-execution prep**이며 Gate D는 **아직 실행 전**.
