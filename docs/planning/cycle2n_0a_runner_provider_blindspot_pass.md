# Cycle 2N-0A — Runner / Provider UX Blindspot Pass

> **성격**: 2N-0B(runner/provider UX 설계) **전**의 blindspot pass. 설계 확정·구현·설치·실행 없음(read-heavy planning).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Codex 2M-6 **PASS**(2M 종료 가능, 다음=2N-0), Gate A/B/D evidence,
> 2L-3C provider 비교, 2L-4A adapter boundary 설계·리뷰, 2M-3A/3B 품질 리뷰, 2M-5 §7 문구 규칙.

## 1. 작업 목표

Kordoc/tesseract.js 기반 **user-approved local assisted path**(설치 확인→사용자 승인→설치→실행→artifact 생성→ingest)를 설계하기 전에,
repo의 실제 구조·기존 게이트 evidence·2M 품질 결과와 대조해 숨은 전제·충돌·후반 비용이 커질 결정·설계 전 질문을 드러낸다.

## 2. 현재 확정된 사실 (repo 대조 확인)

프롬프트의 확정 사실 목록은 repo 문서와 **충돌 없음**을 확인했다(current_status Ledger·D70·§7·intake README 일치). 추가로 이번 pass에서 확정한 repo 사실:

- **repo 루트에 `package.json`이 없다** — Node 프로젝트가 아니며, 제출물 표면에 npm 계약이 존재하지 않는다.
- **`.gitignore`는 중간 JSON 산출물을 방어하지 않는다** — `*.pdf`·로그·렌더 산출물 이름 패턴만 방어. `intake.json`/`ocr_text.json`/`aux_signals.json`이 repo 안에 떨어지면 커밋 위험.
- **runner/no-egress 훅 자산이 repo에 없다** — Gate A/D의 `nethook.cjs`(worker_threads 확장 포함)·OCR 실행 스크립트는 evidence 문서에만 기록되고 세션 임시 폴더에서만 존재했다.
- ocr_text/aux_signals **ingest 계약과 hash 무결성 검증은 이미 구현·리뷰 완료**(dei_producer — needsOcr 페이지 정합 fail-fast, `canonical_ocr_output_sha256()` 공개 규칙 포함).

## 3. Unknown knowns (repo에 단서가 있으나 놓치기 쉬운 사실)

1. **래스터라이저 공백이 OCR 경로 전체를 막는다.** tesseract.js는 **이미지 입력만** 받는다. Gate D는 스캔 PDF를 **PyMuPDF(fitz)로 300 DPI PNG 렌더**해서 OCR했는데(evidence의 실행 환경 기록), PyMuPDF는 2L-3C에서 **AGPL dual → 제품 경로 부적합(검사용만)** 판정을 이미 받았다. Kordoc의 PDF 이미지 경로는 `@napi-rs/canvas`(optional **native** — RH-B2가 격리한 클래스) 필요("Cannot load @napi-rs/canvas" 경고 실측). 즉 **"스캔 PDF→페이지 이미지" 단계의 제품용 도구가 미정**이고, 현 후보 전부가 native(Gate B 재검토) 또는 license(AGPL) 게이트에 걸린다. Gate D PASS는 "OCR 엔진" 검증이었지 rasterizer 공급망 결정이 아니었다.
2. **naive `npm install kordoc`은 native를 재유입한다.** `--omit=optional` 없이 설치하면 sharp/onnxruntime-node/pdfium이 딸려와 RH-B2·Gate B 격리가 무효화된다(2L-3C에서 `--omit=optional` 117pkg·native 0 실측). runner 설치 명령의 **필수 플래그**로 고정해야 함.
3. **HWP 경로와 OCR 경로는 서로 다른 assisted path다.** HWP v5/HWPX/구조 추출은 **Kordoc 파싱만**으로 되고(모델 다운로드 불필요, no-egress 파싱 10/10 검증 완료), 스캔/zero-text 페이지는 **tesseract.js OCR**(traineddata 다운로드 + rasterizer 필요). 설치 대상·egress 프로파일·승인 내용이 다르므로 단일 "assisted path"로 뭉뚱그리면 승인 UX가 과대해지고 HWP 사용자가 불필요한 OCR 설치 승인을 요구받는다.
4. **OCR은 Kordoc intake에 선행 의존한다.** ingest의 페이지 정합 fail-fast 때문에 ocr_text 페이지는 intake의 needsOcr 집합 안이어야 한다 — 즉 runner 실행 순서는 항상 "Kordoc intake 먼저 → needsOcr 페이지만 OCR"로 강제된다(스캔 전용 문서도 intake가 needsOcr 9/9 신호를 만들어 준다).
5. **canonical hash는 Python 규칙이다.** `output_sha256`은 `json.dumps(sort_keys, ensure_ascii=False, compact)` UTF-8 SHA-256으로 정의·검증된다. Node runner가 `JSON.stringify`로 산출하면 유니코드 이스케이프·직렬화 차이로 **IntakeError로 즉사**할 수 있다. hash 계산을 Python 측 헬퍼에 위임하거나 교차 언어 동등성 테스트가 필요하다.
6. **Windows 인코딩 사고는 실측 전례가 있다.** 2M-3 1차 산출물이 PowerShell stdin 경유 비UTF-8로 오염돼 전량 `_utf8` 재생성됐다. runner가 한국어 파일명·본문을 다루는 모든 지점(인자 전달·stdout·파일 쓰기)에 인코딩 규율이 설계 항목이다. 샘플 파일명에는 한국어+공백이 실제로 있다.
7. **§7 provider명 금지와 승인 UX는 층이 다르다.** 2M-5가 사용자-facing findings/보고서에서 provider명·영문 상태 문자열을 금지했지만, **informed consent 승인 대화는 무엇을 설치하는지 명시해야** 한다. "승인 대화=명시 / 보고서=금지" 이중 정책이 필요하다(D3 계승).
8. **validator 경로 스캔이 tool-cache 경로를 잡는다.** `AppData`·`\Temp\`·드라이브 문자 패턴이 findings에 유입되면 error다. runner provenance(설치 위치·모델 경로)가 findings로 흘러들지 않도록 현 ocr_supplement 계약(경로 없음)을 유지해야 한다 — 좋은 가드지만 설계가 모르면 나중에 preflight에서 터진다.
9. **Codex 2L-4A/4B 조건과 2N-5 목표는 재해석이 필요하다.** 기존 조건은 "runner는 Skill entrypoint 금지·**자동 실행 금지**·core 미import". 2N-5의 "이 보고서 분석해줘 → 확인→승인→설치→실행" 흐름은 Skill 지침이 runner 절차를 **안내·중개**해야 성립한다. "자동 실행 금지"를 "**무승인 실행 금지**"로 정련하는 경계 변경이며, Codex 리뷰로 확정해야 한다(암묵 진행 금지).
10. **traineddata pin이 이미 존재한다.** Gate D evidence에 tessdata_fast kor/eng의 hash가 기록돼 있다(eng `7d4322bd…`·kor `6b85e11d…`). runner의 모델 다운로드 검증 기준으로 재사용 가능 — 새로 정할 필요 없음(단 fast/best 선택이 바뀌면 갱신).

## 4. Known unknowns (설계 전 확인 필요)

1. **블랙박스 사용자 머신에 Node/npm이 있는가.** 현 개발기에는 있지만(2M-3 확인: node v24·npm 11), 없을 때 범위 — Node 설치 안내까지 갈지, baseline fallback으로 정중히 종료할지 — 미정(사용자 결정).
2. **tessdata_fast kor의 실전 정확도.** Gate D는 실행 가능성 게이트였지 품질 측정이 아니었다. fast로 충분한지, best로 가야 하는지(모델 hash·용량·prep egress 변경)는 2N-4 측정 전엔 모른다. 참고: 텍스트레이어 PDF를 ground truth로 쓰는 무민감 측정법이 세션 검토에서 제안돼 있음.
3. **rasterizer 실후보.** ①pdfjs-dist v4 + 순수 JS 캔버스 폴리필 가능 여부, ②pdfium/native 수용(Gate B 재검토 전제), ③사용자 로컬 기존 도구 활용 — 조사 필요(설치 없는 문서 조사부터).
4. **kordoc 버전 기준.** npm 3.13.0(현 baseline) vs GitHub 3.15.0(dist 미포함·빌드 필요) — runner pin을 어디에 둘지. 3.15.0 재비교는 기존 nonblocking follow-up.
5. **승인 상태의 지속성.** 승인 기록을 어디에(도구 캐시 내 marker? evidence 문서? 매 세션 재확인?) 남길지와 재승인 트리거(버전 변경 시) — 미정.
6. **npm 차단 환경의 실패 모드.** 프록시·방화벽·registry 차단 시 설치 실패 UX(진단 메시지·baseline 계속) — 시나리오 정의 필요.
7. **대형 문서 OCR 소요시간 UX.** 동서발전 359p 중 35p OCR — 페이지당 수 초×35(+결정성 2회 시 ×2). 진행 표시·중단·부분 결과 정책 미정.
8. **Codex 실행 환경의 승인 이중성.** harness 자체의 명령 실행 승인과 Skill 차원의 한국어 승인 대화가 겹친다 — 실제 UX에서 어떻게 보이는지 2N-5 전에 확인 필요.

## 5. Unknown unknowns (후속 단계에서 문제가 될 리스크 후보)

- **중간 산출물 낙하 위치**: intake/ocr_text/aux_signals JSON이 작업 폴더(repo 내부일 수 있음)에 떨어지면 `.gitignore` 미방어로 커밋 위험. 배치 규약(항상 repo 밖 out_dir) + 방어 패턴 추가 여부가 설계 항목.
- **tool-cache 버전 드리프트**: 사용자가 나중에 캐시 안 버전을 바꾸면 pin이 무언 침식 — 런타임 compat-check(버전 불일치 fail-fast, Version Strategy 계승)를 runner에도 넣지 않으면 후반에 비싸진다.
- **결정성 요구의 비용 폭발**: "2회 실행 hash 동일"을 기본 UX에 넣으면 대형 문서에서 시간 2배. evidence 모드에서만 요구하는 분리가 없으면 2N-4/2N-5에서 발견하고 재설계하게 됨.
- **제출 zip 속 실행 스크립트의 인상**: runner(설치+실행 스크립트)를 zip에 넣으면 심사 환경에서 "설치를 유도하는 제출물"로 읽힐 수 있다 — packaging 정책 문구·기본 비실행 자세 필요.
- **AV/SmartScreen 개입**: npm 설치·모델 다운로드 중 백신 간섭으로 어중간한 실패(부분 설치) — 재시도/정리(clean-up) 시나리오 부재 시 캐시 오염.
- **PowerShell vs bash 이중 환경**: Gate D 자산은 bash 기준. 사용자 환경 PowerShell 5.1(파이프라인 체이닝·인코딩 제약)에서 같은 절차가 다르게 실패할 수 있음 — 어느 셸을 계약으로 삼을지.
- **다중 문서 배치 인터페이스**: 샘플 8개 일괄(2N-4)과 단일 문서(2N-5)의 runner 인터페이스가 다르면 이중 구현 — 처음부터 단일 파일 단위 CLI로 통일하는 게 저비용.
- **부분 성공 상태**: Kordoc 성공+OCR 실패(또는 일부 페이지만 성공) 시 artifact를 내보낼지(부분 ocr_text는 페이지 정합상 유효) — 정책 없으면 구현 시 임의 결정.

## 6. 작업 전에 사용자가 결정해야 할 사항

| # | 결정 | 선택지(권고 표시) | 왜 지금 |
|---|---|---|---|
| U1 | **설치 위치** | 전용 외부 tool-cache 디렉터리(신설, **권고**) vs npm global vs npx | repo package/lock 오염 금지 + 재현성. npx는 실행마다 다운로드(준비/파싱 egress 분리 붕괴)라 사실상 배제 후보 |
| U2 | **Node 부재 시 범위** | 안내 후 baseline 계속(**권고**) vs Node 설치까지 안내 | 2N-5 블랙박스 시나리오의 하한선 결정 |
| U3 | **승인 단위·기록** | 설치류(1회, 버전 변경 시 재승인)+실행(세션 1회) 분리(**권고 초안**) — 기록 위치는 tool-cache 내 marker | UX 골격이자 provenance 필드 설계 입력 |
| U4 | **runner 스크립트 repo 커밋 + 제출 zip 포함 여부** | 커밋+포함(조건 준수, **권고**) vs docs-only | 2L-4A open question 종결. 재현성 vs 제출물 표면 |
| U5 | **provider명 이중 정책 승인** | 승인 대화=명시 / 보고서=금지(§7 유지) (**권고**) | informed consent와 2M-5 규칙의 충돌 해소 |
| U6 | **결정성 2회 실행 범위** | evidence 모드 한정(**권고**) vs 기본 UX 포함 | 대형 문서 시간 비용 |
| U7 | **HWP 경로/OCR 경로 승인 분리** | 포맷별 필요한 것만 승인(**권고**) vs 일괄 승인 | 최소 권한 원칙·설치 최소화 |
| U8 | **rasterizer 방향** | 조사 후 결정(2N-0B에서 후보 비교 제시, native 수용 시 Gate B 재검토 전제 승인) | OCR 경로의 유일한 미해결 공급망 |

## 7. 기존 문서/코드/운영원칙과 충돌 가능성이 있는 지점

- **"자동 실행 금지"(Codex 2L-4A/4B) ↔ 2N-5 블랙박스 흐름**: "무승인 실행 금지"로의 정련 필요 — **Codex 리뷰로 경계 변경 확정 필수**(§3-9).
- **§7 provider명 금지 ↔ 승인 대화**: 이중 정책으로 해소 가능하나 문서화 전엔 충돌 상태(§3-7, U5).
- **no-egress 원칙 ↔ 설치/모델 다운로드**: 기존 "준비 egress(허용·기록) ↔ 파싱 no-egress" 분리 원칙으로 해소됨 — 설계 문서에 명문화만 하면 됨(신규 충돌 아님).
- **submission 정책(원본/생성물 미커밋) ↔ 중간 산출물 낙하**: 배치 규약 없으면 충돌 발생 가능(§5-1).
- **validator 경로 스캔 ↔ provenance**: ocr_supplement에 경로 필드를 추가하는 순간 충돌 — 현 계약(경로 없음) 유지가 제약 조건.
- **Ledger "provider execution pending" ↔ 2N-2 구현 후 표현**: 구현되면 "user-approved assisted execution(옵트인) 지원 / plugin core는 여전히 provider 미실행"으로 표현을 분리해야 함 — 과대표현 방지 규칙을 2N-0B에 포함.

## 8. 후반 비용이 커질 수 있는 설계 결정

1. **rasterizer 선택**(U8): 후보 전부 게이트 재검토 유발 — 잘못 고르면 Gate B/D 재실행+RH-B2 재설계. 가장 큰 단일 리스크.
2. **hash 계산 위치**(§3-5): Node 구현 후 불일치 발견 시 재작업 — 처음부터 Python 위임 또는 교차 테스트.
3. **오케스트레이션 층**: 승인·설치·실행 로직을 코드(runner CLI)로 넣을지 Skill 지침+thin script로 최소화할지 — 코드가 커질수록 리뷰 표면·경계 리스크 증가. thin 우선이 저비용.
4. **tool-cache 레이아웃**: 버전별 디렉터리 없이 평면 설치하면 pin 드리프트·재승인 트리거 구현 불가.
5. **단일/배치 인터페이스**(§5-7): 처음에 단일 파일 CLI로 통일하지 않으면 2N-4에서 이중 구현.

## 9. 그래도 바로 진행 가능한 최소 안전 작업 범위

- **2N-0B 설계 문서 작성 자체**(구현 0): 이중 경로(HWP/OCR) 승인 흐름 시나리오, tool-cache 레이아웃 paper design, 중간 산출물 배치 규약, 승인 문구 초안(한국어), provenance 필드 매핑(기존 ocr_text 계약 재사용), 실패/거부/미지원 UX(§7 표준 문구 연결).
- **rasterizer 후보 문서 조사**(설치·실행 없음 — license/native/유지보수 상태 비교표).
- **nethook 재작성 사양 정리**(Gate A/D evidence 기반 요구사항 명세 — 코드는 2N-2).
- **`.gitignore` 방어 패턴 추가 여부 검토**(중간 JSON 산출물 이름 규약과 함께 — 규약 확정 전 적용 보류).

## 10. 이번 단계에서 절대 구현하면 안 되는 것

runner 코드·설치 확인 코드·승인 UX 코드·provider 설치/실행·OCR 실행·**repo 루트 package.json 생성**·nethook 커밋·샘플 재실행·보고서 재생성·schema/validator/renderer/delivery 변경·manifest/marketplace 변경·submission.zip·"OCR 지원/L2 완료/provider 확정/runner 통합 완료" 선언.

## 11. 2N-0B 설계로 넘어가기 전 질문 목록

1. U1~U8 결정(§6 표) — 특히 **U1(설치 위치)·U4(runner 커밋)·U8(rasterizer)**이 설계 골격을 좌우.
2. "자동 실행 금지 → 무승인 실행 금지" 경계 정련을 2N-0B 설계에 명시하고 2N-1 Codex 리뷰에서 확정하는 절차에 동의하는가?
3. 2N-4 품질 측정의 합격 기준(예: 텍스트레이어 ground-truth 대비 문자 일치율 하한? 아니면 측정·보고만?)을 미리 정할 것인가?
4. 승인 대화 문구(한국어)의 고지 수준 — 설치 대상·용량·출처·egress 발생·로컬 저장 위치를 어디까지 명시할 것인가(초안은 2N-0B에서 제시).
5. 2N-5 블랙박스의 성공 판정 주체·기준(사용자 직접? Codex 리뷰?)은 언제 정하는가.

## 메타

- 구현·설치·실행: 없음(read-heavy planning). 코드/테스트/schema/manifest 무변경.
