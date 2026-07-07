# Kordoc-first Enhanced Intake + Full-scan OCR Fallback Plan (Cycle 2N-4I)

> **성격**: 이 문서는 **설계/계획 문서**다(implementation-prep). 이번 사이클에서 코드 구현·OCR 실행·package 설치·
> Kordoc 재설치·portable Node 다운로드·2N-5 실행은 **수행하지 않았다**. 구현은 2N-4J~2N-4L에서, 통합 검증은
> 2N-4M에서, 2N-5 black-box 재진입은 그 이후에 진행한다. 전략 채택 결정은 `docs/decision_log.md` **D91**에 기록한다.

## 1. 왜 이 계획이 필요한가

2N-4H에서 architecture/submission readiness가 확인되어(Codex 2N-4H review **PASS** + Claude readiness
**READY WITH NONBLOCKING OBSERVATIONS**) 2N-5 black-box에 들어갈 수 있는 상태였다. 그러나 제품 전략을 재정했다:
**2N-5를 바로 진행하지 않고, Kordoc-first enhanced intake와 page-set OCR fallback 구조를 먼저 설계·구현한 뒤
2N-5로 재진입한다.** 배경은 두 가지다.

1. **텍스트 PDF도 "텍스트만" 읽으면 놓치는 것이 있다.** 텍스트 레이어가 충분한 PDF/보고서라도 평문 텍스트만
   읽어 분석하면 **표 구조·섹션 계층·페이지 anchor·도표 주변 맥락·캡션**을 놓쳐 KSSB evidence matching의
   근거 anchor 품질이 떨어진다. 이것은 가설이 아니라 repo 실측 근거가 있다 — 2L-3C provider 비교에서 Kordoc은
   텍스트레이어 PDF(11p)에서 **한글 98.8% 커버 + heading 3계층 + 표 25개(셀 628) + outline + needsOcr
   혼합페이지 신호**를 산출했다(`docs/samples/provider_document_analysis_comparison_2026-07-04.md`).
   이 구조 신호는 이미 ingest 경계(DEI)가 표 markdown 변환·섹션 위치 힌트·bbox(DEI 전용)로 운반할 수 있는
   형태다. 즉 **자산은 절반 이상 만들어져 있는데, 텍스트 PDF의 권장 기본 경로가 이를 활용하지 않고 있었다.**
2. **스캔/이미지 PDF OCR을 나중에 별도 확장으로 두 번 구현하지 않는다.** OCR 실행 경로를 "혼합 PDF의
   needsOcr 페이지 몇 장"용으로 좁게 만들고 나서 full scanned PDF를 나중에 다시 설계하면 이중 구현이 된다.
   Gate D(2L-3B)에서 이미 **스캔 전용 9p 전량을 tesseract.js로 no-egress 하에 OCR 실행**(worker 전파 확인·
   결정성 3회)한 전례가 있으므로, 처음부터 **full scanned PDF 전체 OCR을 감당할 수 있는 page-set
   architecture**로 설계하고 초기 구현만 bounded로 제한한다.

이 계획으로 무엇이 바뀌고(전략·권장 순서) 무엇이 바뀌지 않는지(승인 경계·baseline·ingest 계약·no-overclaim)를
아래에 고정한다.

## 2. 정책: Kordoc-first Enhanced Intake

### 2.1 정책 문장 (고정)

```text
Kordoc-first when available and approved.
Baseline fallback when unavailable, declined, or failed.
```

### 2.2 의미 (고정)

- **텍스트 PDF도 Kordoc-first enhanced intake 대상이다.** 스캔 감지용이 아니라, 텍스트 PDF에서도
  **표·섹션·page anchor·caption·figure-adjacent context를 보강**하여 evidence matching 품질을 높이는 것이 목적이다.
- **Kordoc은 enhanced intake provider이지 KSSB 판단 엔진이 아니다.** 판정 라벨·질문·권고는 계속 Skill(판단 절차)이
  만들고, Kordoc output은 **DEI/evidence candidate boundary(`src/intake/dei_producer.py`)를 거쳐** 근거 재료로만
  합류한다(기존 L1/L2 경계 그대로).
- **baseline fallback은 제거하지 않는다.** baseline = Skill이 입력 자료의 텍스트를 직접 읽어 분석하는 기본 경로
  (별도 코드 아님). Kordoc이 **unavailable(도구/런타임 부재)·declined(승인 거부)·failed(준비/실행 실패)**이면
  언제나 baseline으로 수렴하고, 판독 못 한 부분은 기존 §7 커버리지 문구(확인 불가→질문)로 정직하게 공시한다.
- **Kordoc-first는 무단 실행이 아니다.** 기존 승인 경계(무승인 설치/실행 금지·repo 밖 tool-cache·prep egress
  기록↔실행 no-egress)가 그대로 적용된다. 바뀌는 것은 "승인을 권장하는 기본 순서"뿐이다.
- 거부는 실패가 아니라 **정상 경로**다(A안 수렴 — D90과 동일한 자세).

### 2.3 기존 baseline과의 공존 방식

| 상황 | 경로 |
|---|---|
| Kordoc 승인 + 준비/실행 성공 | enhanced intake — intake.json → DEI → 구조 보강된 evidence candidate |
| 도구/런타임 부재 (unavailable) | baseline — 텍스트 직접 분석 + 한계 공시 (portable Node B안 승인 안내는 기존 D90 흐름) |
| 승인 거부 (declined) | baseline — 아무것도 설치/실행하지 않음, 기본 검토 계속 |
| 준비/실행 실패 (failed) | baseline 수렴 + 실패를 조용히 숨기지 않는 정직한 안내(기존 exit 계약 유지) |

주의: 현행 `docs/user_quickstart_pre_2n_5.md` matrix의 텍스트 PDF 행("기본 경로 — 승인 불필요")은 이 전략이
**구현된 뒤** 갱신 대상이다. 지금은 구현 전이므로 quickstart가 현재 구현 상태를 정확히 서술하고 있고,
이번 사이클에서 수정하지 않는다(§10, Final Report 참조).

## 3. 표와 도표/차트의 경계

Kordoc-first는 **표와 문서 구조 보강에는 적극적으로** 사용하고, **도표/차트는 주변 맥락 보강까지만** 사용한다.

**허용되는 방향**:

- 표 구조 보강(기존 DEI의 표 markdown 변환 경로 재사용)
- 섹션/heading/page anchor 보강(기존 location_hint 규약 재사용)
- figure caption / nearby text / figure-adjacent context 활용
- 도표 **주변 맥락** 보강
- 사람이 검수할 **evidence candidate** 생성

**금지되는 방향(표현 포함)**:

- 차트 의미해석 완료 / 도표 수치 자동 판독 / 이미지 의미해석 / L3 complete /
  chart·figure semantic interpretation complete

**정직한 신호 현황(과장 방지)**: PDF 경로에서 Kordoc의 도표 관련 신호는 **SKIPPED_IMAGE 계열 warning +
주변 문단 텍스트** 수준이다. caption/heading **구조** 후보 카운트는 stdlib aux 스캐너의 **HWPX/DOCX 전용**
신호다(2L-3D). 따라서 PDF의 "figure-adjacent context"는 도표 인접 블록·캡션성 문장을 근거 재료로 쓰는 것이지,
도표 내부를 판독하는 것이 아니다. OCR 유래 텍스트는 §6 기존 규칙(출처 표기 필수·OCR 단독으로 confirmed 승격
금지·보수적 매핑)을 그대로 따른다.

## 4. Page-set OCR Architecture

### 4.1 단일 엔진 + selected_pages

OCR 실행기는 처음부터 **`selected_pages`** 개념을 갖는 단일 엔진으로 설계한다. 케이스별로 엔진을 나누지 않는다.

```text
mixed PDF:          selected_pages = needsOcr/text-empty pages
scan-only PDF:      selected_pages = all pages   (스캔 전용은 전 페이지가 needsOcr)
large scanned PDF:  selected_pages = all pages + bounded execution
                    (page cap / batch / timeout / resume 가능성 / artifact policy / approval)
user-selected range: needsOcr 부분집합으로 제한
```

- **needsOcr 페이지의 원천**은 Kordoc intake의 기존 신호(`pageQuality[].needsOcr`,
  `qualitySummary.ocrCandidatePages`)다 — OCR 경로가 Kordoc-first intake에 선행 의존하는 구조(2N-0A ③)를 유지한다.
- **user-selected range를 needsOcr 부분집합으로 제한하는 이유**: 기존 OCR ingest 계약이 OCR 페이지가
  인테이크의 needsOcr 대상(`ocrCandidatePages ∪ pageQuality.needsOcr`) 밖이면 **fail-fast로 거부**한다
  (`dei_producer.py` — "not an OCR-needed page … (page mismatch)", 텍스트 레이어 원문과의 혼동 방지 규칙).
  텍스트 페이지까지 OCR하도록 계약을 여는 것은 이번 범위가 아니다 — 필요해지면 **별도 결정+리뷰 사이클**로
  다룬다(§10 open question, schema/contract 변경은 2N-4I에서 하지 않음).

### 4.2 Full-scan 설계 범위와 bounded 초기 구현

설계는 **full scanned PDF 전체 OCR**을 감당할 수 있어야 한다(근거: Gate D에서 스캔 전용 9p 전량 OCR을
no-egress·worker 전파·결정성 3회로 실증). 단 초기 구현(2N-4L)은 다음 제한 장치로 bounded 실행한다.

- **approval**: OCR 경로는 별도 승인(§7 — U7 경로별 승인 분리 유지).
- **page cap / batch / timeout**: 기본값은 2N-4K spike 실측(페이지당 시간·메모리) 후 결정한다.
- **resume 가능성**: 체크포인트는 **내부 scratch에만** 둔다. 부분 산출물을 최종 artifact처럼 남기지 않는다.
- **원자적 방출**: 최종 `*.ocr_text.json`은 **모든 대상 페이지 처리가 완료된 뒤 1회 원자적으로 방출**한다.
  이유: `output_sha256`은 문서 단위 canonical hash(`canonical_ocr_output_sha256()`)라 부분 파일은 계약 위반이
  된다 — batch/resume은 실행기 내부 사정이고 **artifact 계약은 무변경**이다.
- **artifact policy**: 래스터 PNG는 원본 문서와 **동일 민감도**로 취급 — repo 밖 out-dir 또는 scratch에만
  생성하고 커밋하지 않는다. `*.png` 전역 ignore 추가는 이번 2N-4I에서 하지 않는다(오차단 부작용 검토 포함
  2N-4L에서 결정 — §10).

## 5. 기존 OCR Ingest 계약 재사용 (재설계 금지)

OCR ingest 쪽 절반은 **이미 구현+리뷰된 자산**이다(2L-4B 구현 → 2L-4C hash 하드닝 → 2L-5 closure로
repo-side ingest boundary 승격). 2N-4I에서 OCR evidence candidate 구조를 처음부터 새로 설계하지 않는다.

**그대로 재사용하는 것**:

- **`ocr_text.json` 계약**: provenance 필수(provider/provider_version/model/model_sha256/no_egress_verified/
  output_sha256 + pages[{page,text,text_sha256}]), `text_sha256`/`output_sha256` **실제 무결성 검증**
  (canonical 규칙 = `canonical_ocr_output_sha256()`, 불일치 IntakeError), needsOcr 페이지 정합 fail-fast.
- **`ocr_supplement` 병합 규칙**: OCR 텍스트는 blocks에 섞지 않고 별도 섹션으로만, `extraction_quality="low"` 고정.
- **§6 OCR 인용 규칙**(`evidence_mapping_rules.md`): OCR 유래 표기 필수·보수적 매핑·OCR 단독 confirmed 승격 금지.
- **document-level 변형(HWP/HWPX/DOCX)의 `ocr_text` 명시 거부**(2N-4B — needsOcr 정합 기준 신호가 없음): 유지.
  이 계획의 OCR 경로는 **paginated(PDF) 계약 전용**이다.
- **`aux_structure`/gap 신호 분리**(DEI 재료 vs review-signal): 유지.

**이번 계획에서 새로 결정/설계하는 중심** (ingest 계약이 아니라 그 앞단):

- Kordoc-first enhanced intake **strategy**(§2) 와 라우팅(§6.1)
- **page-set OCR runner/runtime** 설계(§4, §6.2)
- **rasterizer/traineddata/package/cache** 결정(§6.3~6.4)
- **output_sha256 Node/Python parity**(§6.5)
- **approval/no-egress/artifact policy**(§4.2, §7)
- **full-scan readiness boundary**(§4.2, §8)

## 6. 새로 설계해야 할 영역

### 6.1 Intake router (2N-4J)

현행 `hwp_assisted_runner.cjs`는 지원 확장자가 `.hwp/.hwpx/.docx`이고 **PDF는 범위 밖으로 정중 종료(exit 3)**
한다. Kordoc-first를 성립시키려면 runner가 PDF를 수용하고 다음을 분기하는 **router skeleton**이 필요하다:

- 확장자별 분기(PDF → Kordoc-first 권장 경로 / HWP-계열 → 기존 assisted 경로 / 그 외 → 기존 정중 종료).
- 기존 승인 체계 재사용(도구 설치·실행 분리 승인, tool-cache pin `kordoc@3.13.0 + pdfjs-dist@4.10.38` 불변).
- unavailable/declined/failed → baseline 수렴 문구(§2.3 표와 일치, 기존 exit 계약 유지).
- **DEI/ingest는 무변경 소비**: page inventory·표·섹션·needsOcr 신호는 기존 intake.json 계약이 이미 운반한다.
  4J는 router 표면에 한정하고 DEI 재설계로 번지지 않는다.
- Node runner의 aux_signals 미생성(v1 차이) 등 기존 문서화된 차이는 그대로 승계한다.

### 6.2 Page-set OCR runner/runtime (2N-4K spike → 2N-4L 구현)

- tesseract.js를 **OCR fallback provider**로 사용(Gate D-proven: 7.0.0, WASM, native 0, permissive 13패키지).
- 실행기는 `selected_pages`를 받아 rasterize→OCR→(scratch 체크포인트)→원자적 `ocr_text.json` 방출.
- 실행 단계는 기존 `nethook.cjs` no-egress 훅 아래(worker_threads 전파는 Gate D에서 검증됨).
- confidence: **2N-4L에서 additive metadata 기록만** 허용. threshold 판단·자동 confirmed 승격은 2N-5 이후
  별도 결정(D53의 "검수 우선순위 신호로만" 원칙 연장).

### 6.3 Rasterizer (2N-4K spike에서 결정 — 미해결로 정직 표기)

- Gate D의 래스터화는 **PyMuPDF 300 DPI = AGPL, 검사 전용 evidence**였다 — **제품 경로로 재사용하지 않는다.**
- 제품 rasterizer는 미해결(2N-0A U8)이며 **2N-4K spike에서 결정**한다: 1순위 @napi-rs/canvas(2N-0B ⑦ —
  **native dependency 수용 시 Gate B(license/native) 재검토 필수**), 대안 pure-JS 경로. spike 실패 시
  OCR 경로 자체가 gated로 남는다(전략 채택은 유지되나 구현이 열리지 않음 — 정직하게 보고).

### 6.4 traineddata / package / cache

- traineddata는 npm 밖 **제3 출처를 포함한다**: Gate D 실측 출처는 **raw.githubusercontent.com/tesseract-ocr/tessdata_fast**
  (tessdata_fast `eng` sha256 `7d4322bd2a774972…`, `kor` sha256 `6b85e11d9bbf0786…` — evidence에 기록됨).
- 준비 절차는 기존 규율 그대로: **source URL 고정 + hash pin + repo 밖 tool-cache 배치 + 승인 문구에 출처·용량·
  위치·제거 방법 고지 + prep egress 기록**. tesseract.js/tesseract.js-core npm 설치도 동일(pin은 4K에서 확정).
- 승인 대화에는 npm registry와 raw.githubusercontent.com이 **별개 네트워크 출처**임을 숨기지 않는다.

### 6.5 output_sha256 Node/Python parity

- OCR runner는 Node로 구현하므로 `output_sha256`을 **Node에서 계산**하되, **Python `canonical_ocr_output_sha256()`
  과의 golden parity 테스트**(동일 fixture → 동일 hash)를 요구한다. D75의 "hash는 Python 헬퍼 주입" 권고는
  Node pivot(2N-4C~4D) 이전 결정이므로 이 방식으로 갱신한다(canonical 규칙의 단일 소스는 Python 함수 정의 유지,
  Node는 그 규칙의 구현+parity 증명).

## 7. Approval / No-egress boundary 유지 방식

- **U7 경로별 승인 분리 유지**: HWP-계열 assisted 승인과 **OCR 경로 승인은 별개**다. OCR 승인 대화는
  tesseract.js(npm)와 traineddata(raw.githubusercontent.com) 출처·hash·용량·설치 위치·제거 방법을 고지한다.
- **prep egress(기록) ↔ 실행 no-egress(훅) 분리 유지**: 다운로드/설치는 준비 단계에서만 발생·기록되고,
  rasterize·OCR·파싱 실행은 nethook 아래 no-egress로 수행한다(`no_egress_verified=true`는 요약 실관측+egress 0
  실행에만 — 기존 provenance 규칙 무변경).
- **거부/실패 = baseline 수렴**: 어떤 실패 지점도 무단 재시도/무단 설치로 이어지지 않는다(D90 실패 매트릭스 자세).
- 무승인 설치/실행 금지·repo 밖 tool-cache·OS installer/PATH 영구 수정/관리자 권한 금지(C안 배제)는 불변.

## 8. Capability ladder / No-overclaim

OCR 실행이 승인 기반 로컬 runner로 들어와도 core/plugin 경계 표현은 다음 3층으로만 쓴다:

```text
core plugin:                         OCR을 자동 실행하지 않음
approval-based local assisted runner: 사용자 승인 후 tesseract.js OCR 실행 가능
report/output:                       OCR 기반 근거는 human-review-required evidence candidate로만 사용
```

- **D70 승격 라벨과의 정합**: D70의 핵심 한정("plugin은 OCR을 실행하지 않으며 실행은 사용자 로컬 out-of-band")은
  2N-4L 구현 후 **"core plugin은 OCR을 자동 실행하지 않는다; 승인 기반 로컬 assisted runner가 실행할 수 있다"**로
  정련된다 — repo-side ingest boundary 승격 근거는 깨지지 않는다(ingest 계약 무변경이므로). SKILL.md Inputs·
  §6 범위 경계·intake/runners README·quickstart의 관련 문구 갱신은 **구현이 실재한 뒤(2N-4L/4M)** 일괄 수행한다.
- **D77과의 관계**: D77의 U8 scope-out(OCR 경로·rasterizer는 gated 분리)은 이번 사용자 결정으로 **경로가 열린다**
  — 단 D77이 걸어둔 게이트 자체(rasterizer spike·native 수용 시 Gate B 재검토·U7 승인 분리)는 폐기가 아니라
  **2N-4K에서 통과해야 할 조건으로 승계**된다.
- **금지 표현**: OCR support complete / L2 complete / L3 complete / provider finalization / product complete /
  감사·인증·준수 판단 자동화. tesseract.js·Kordoc은 계속 provider 후보(가역)이며 finalization이 아니다.

## 9. Cycle 분해 — 2N-4J / 4K / 4L / 4M이 각각 닫아야 할 것

| Cycle | 성격 | 닫아야 할 것 | 명시적으로 닫지 않는 것 |
|---|---|---|---|
| **2N-4J** Intake router skeleton | 코드(mock 검증) | PDF 수용 + Kordoc-first 분기·승인 재사용·unavailable/declined/failed 문구·intake.json 연계. node:test로 게이트/문구/분기 검증(실 실행 없음) | OCR 실행·rasterizer·DEI 변경 |
| **2N-4K** Rasterizer + tesseract.js runtime spike | **승인 기반 실측 evidence**(2N-4G 패턴: 사용자 승인·prep egress 기록·오염 스캔·리뷰) | rasterizer 결정(1순위 @napi-rs/canvas — **native 수용 시 Gate B 재검토 포함**), tesseract.js 실행 실측(페이지당 시간·메모리), traineddata 출처·hash·cache 승인 절차, page cap/batch/timeout 기본값 근거 | 제품 코드에 OCR 경로 병합(4L로) |
| **2N-4L** Page-set OCR 최소 구현 | 코드 | `selected_pages` 실행기 + bounded 실행 + scratch 체크포인트 + **원자적 ocr_text.json 방출** + confidence additive 기록 + **output_sha256 Node 구현+Python golden parity 테스트** + 기존 ingest 합류(무변경) 실증 | threshold 판단·자동 승격·전 포맷 확장·계약 개방 |
| **2N-4M** 통합 리뷰 + 문서 일괄 갱신 | 리뷰+docs | quickstart matrix(텍스트 PDF 행 포함)·current_status·SKILL/§6/ladder 문구 일괄 갱신, Codex 통합 리뷰, **2N-5 재진입 판단** | 2N-5 실행·제품 완성 선언 |

각 사이클은 기존 관행대로 Codex 리뷰 게이트를 거친다. 4K가 실측에서 실패하면(모든 rasterizer 후보 기각 등)
4L은 착수하지 않고 OCR 경로를 gated로 되돌린 뒤 2N-5 재진입 여부를 다시 판단한다 — 전략 채택(D91)이
구현 강행을 의미하지 않는다.

## 10. Open Questions (이번에 결정하지 않은 것)

1. **ingest 계약 개방 여부**: user-selected range를 needsOcr 집합 밖(텍스트 페이지 포함)으로 허용할 것인가.
   현재 결정은 **부분집합 제한(계약 무변경)** — 개방이 필요해지면 별도 결정+리뷰 사이클(future cycle).
2. **page cap / batch / timeout 기본값**: 2N-4K 실측 후 결정.
3. **rasterizer 최종 선택과 Gate B verdict**: 2N-4K에서 결정(native 수용 여부 포함).
4. **`*.png` 전역 ignore 추가 여부**: 래스터 artifact 방어 vs 오차단 부작용 — 2N-4L에서 결정(이번 미추가).
5. **confidence threshold·검수 우선순위 반영 방식**: 2N-5 이후 별도 결정(4L은 additive 기록만).
6. **Python runner의 OCR 경로 확장 여부**: 기조는 미확장(D87 ⑤의 portable Node 미확장 전례와 동일 —
   Python runner는 reference 지위, D85 ④) — 4J/4L에서 확인.
7. **tesseract.js/tesseract.js-core 버전 pin 확정**: Gate D 당시 7.0.0 — 4K 시점 재관측 후 pin(AVR-07 방식).
8. **2N-4M 리뷰 분담**: Codex 단독 vs Claude 선행 리뷰 + Codex 최종 — ChatGPT/사용자 판단.

## 11. 무엇을 구현 완료로 주장하면 안 되는가

이 문서와 D91은 **strategy adoption**이다. 다음은 이 계획의 어느 단계에서도(구현 후에도 별도 리뷰 전까지)
주장하지 않는다:

- Kordoc-first enhanced intake **구현 완료** (설계만 존재 — 구현은 2N-4J~4L)
- **OCR support complete** / **L2 complete**
- **L3** image/chart semantic interpretation (어떤 형태로도)
- **provider finalization** (Kordoc·tesseract.js는 계속 가역적 후보)
- **2N-5 통과** 또는 2N-5 unblock (2N-5는 4M 이후 재진입 판단)
- **product complete** / 감사·인증·준수 판단 자동화

---

## Cycle 2N-4I Final Report

- **변경 파일** (3건 — 전부 docs):
  - `docs/kordoc_first_enhanced_intake_fullscan_ocr_plan.md` (신규 — 본 설계 문서)
  - `docs/decision_log.md` (D91 추가)
  - `docs/current_status.md` (현재 Cycle = 2N-4I 설계 단계·2N-5 보류 기록 — 최소 수정)
- **핵심 결정**:
  - Kordoc-first enhanced intake strategy 채택 — 텍스트 PDF도 구조 보강 대상,
    "Kordoc-first when available and approved / baseline fallback when unavailable, declined, or failed".
  - full scanned PDF까지 고려한 **page-set OCR architecture** 채택(selected_pages 단일 엔진),
    초기 구현은 approval/page cap/batch/timeout/resume(scratch)/원자적 artifact 방출로 bounded.
  - user-selected range는 **needsOcr 부분집합으로 제한**(기존 ingest 계약 무변경 — 개방은 open question).
  - 기존 OCR ingest 계약(ocr_text/ocr_supplement/§6/hash 무결성) **재사용 — 재설계 금지**.
  - tesseract.js = OCR fallback provider(후보 지위 유지), output_sha256 = Node 구현 + Python golden parity,
    confidence = additive 기록만(threshold는 2N-5 이후), rasterizer/native = 2N-4K spike + Gate B 재검토 대상.
  - cycle 재분해: 2N-4J(router) → 2N-4K(spike·evidence) → 2N-4L(page-set OCR 최소 구현) → 2N-4M(통합 리뷰)
    → 2N-5 재진입 판단.
- **설계 문서 작성**: 완료(본 문서).
- **D91 추가**: 완료(strategy adoption으로 기록 — 구현 완료 아님·Not means 명시).
- **current_status 갱신**: 완료(2N-4I 설계 단계·2N-5 보류·2N-4H readiness PASS 유지·다음 = 2N-4J~4M).
- **quickstart 수정 여부**: **수정하지 않음.** 이유: quickstart는 현재 구현 상태 기준 사용자-facing 문서이고,
  Kordoc-first enhanced intake·OCR fallback은 아직 설계 단계다. 지금 텍스트 PDF 행 등을 바꾸면 구현 완료처럼
  오해될 수 있다. 2N-4J/4L 구현과 2N-4M 리뷰 후 일괄 갱신한다.
- **검증 결과**: `git diff --check` clean · 변경 파일 = 위 3건(docs만) · working tree에 그 외 변경 없음 ·
  코드/테스트/schema/manifest 무변경(테스트 미실행 — docs-only 사이클).
- **범위 준수**: OCR/tesseract.js 구현·router 구현·rasterizer spike·schema/validator/renderer/delivery/Skill
  변경·manifest 변경·README rewrite·quickstart 수정·npm install·Kordoc 재설치·portable Node 다운로드·
  tesseract 실행·2N-5 실행·submission.zip·산출물 생성·원본/래스터 커밋 — **전부 미수행**.
- **다음 권장 단계**: Codex 2N-4I 설계 리뷰 → PASS 시 2N-4J router skeleton 착수.
  (2N-4K는 승인 기반 실측 evidence 사이클이므로 착수 전 사용자 승인 확인 필요.)
