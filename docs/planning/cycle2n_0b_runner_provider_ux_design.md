# Cycle 2N-0B — Runner / Provider UX 설계

> **성격**: 2N-0A blindspot pass 결과를 반영한 **설계 문서**(구현·설치·실행·샘플 재실행 없음). 권고안과 **사용자 결정 필요**를 분리 표기한다.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: 2N-0A(U1~U8·unknown knowns), Gate A/B/D evidence, 2L-3C provider 비교,
> 2L-4A adapter boundary(artifact 계약 3종·ingest 구현 완료), 2M-5 §7 문구 규칙, Codex 2M-6 PASS.

## 1. 설계 목표와 범위

"이 보고서 분석해줘" 한 문장에서 출발해, **사용자 승인 하에** 로컬 provider(Kordoc/tesseract.js)를 준비·실행하고
그 산출물을 **기존 repo-side ingest boundary(변경 없음)**로 연결하는 assisted path의 UX·구조·정책을 설계한다.
구현 대상 표면은 **runner 층**(설치 확인·승인 중개·준비·실행·artifact 생성)뿐이며, core(schema/validator/renderer/delivery)와
ingest(dei_producer·aux_scanner)는 이미 구현·리뷰된 그대로 소비한다.

## 2. 비범위 (이번 설계가 하지 않는 것)

- provider **최종** 확정(Kordoc+tesseract.js는 여전히 provisional — 이 설계는 "현 provisional 조합의 assisted 실행" 설계다).
- L3(도표/차트 의미 분석)·클라우드 OCR(L4/Gate C)·OS 커널 레벨 no-egress.
- core/ingest/schema 변경. plugin-side OCR 실행 선언("plugin은 OCR을 실행하지 않는다"는 표현은 **"plugin core는 실행하지 않고,
  사용자 승인 하의 로컬 runner가 실행한다"**로 정련 — §11·§16).
- 이번 사이클에서의 코드·tool-cache 생성·nethook 커밋.

## 3. 전체 사용자 UX 흐름 (목표 — 구현은 2N-2)

```text
[사용자] "이 보고서 분석해줘" (+파일)
  1. baseline 진단: 기존 텍스트 추출 가능 범위 확인 (텍스트 충분 → 그대로 기존 분석 경로, assisted 불필요)
  2. 판독 특성 분류: (a)텍스트 충분 (b)HWP v5/구조 필요 → HWP 경로 (c)스캔/zero-text 페이지 → OCR 경로  ※ b·c 동시 가능
  3. [check] tool-cache에서 필요한 provider 존재·버전 pin 일치 확인
  4. 미설치/버전 불일치 → [승인 대화(한국어)] 무엇을·왜·어디서 받아·어디에 설치·용량·네트워크 발생 고지
     - 거부 → baseline으로 계속 + 보고서에 §7 표준 문구로 한계 명시 (실패가 아니라 정상 경로)
  5. 승인 → [준비 단계 — egress 허용·기록]: 설치/모델 다운로드(+hash 검증), 승인·출처·hash marker 기록
  6. [실행 단계 — no-egress]: 훅 하에 Kordoc intake → (needsOcr 페이지만) rasterize → tesseract.js OCR
  7. artifact 생성: intake.json / ocr_text.json / aux_signals.json → repo 밖 out_dir (배치 규약 §9)
  8. ingest: 기존 dei_producer(--ocr-text/--aux-signals)로 DEI 병합 → Skill 분석 → findings → validator → renderer → delivery
  9. 사용자 보고서·user_summary: provider명·경로·영문 상태 문자열 없음(§7). 내부 evidence: provider/version/hash/no_egress_verified
```

핵심 UX 원칙: **거부·부재·실패는 모두 "baseline 계속 + 정직한 한계 고지"로 수렴**한다(§7 문구가 이미 존재) — assisted는 언제나 옵트인 부가물.

## 4. HWP assisted path 설계안

- **대상**: HWP v5(현재 unsupported)·HWPX/DOCX 구조 보강·mixed PDF의 구조 신호. **필요 도구: Kordoc만**(`--omit=optional` — native 0, 모델 다운로드 없음).
- **흐름**: check(Kordoc) → (미설치 시) 승인 → 설치(준비 egress) → **no-egress 파싱**(Gate A 방식 검증 완료 경로) → intake.json(+aux_signals는 zip류에서 stdlib 스캐너로 in-process) → ingest.
- **판단**: OCR 경로와 완전히 분리 가능하고 이미 전 구간이 게이트 evidence로 검증돼 있어(파싱 no-egress 10/10·결정성·license) **구현 리스크가 가장 낮다.** HWP 사용자에게 traineddata·rasterizer 승인을 요구하지 않는다(U7).

## 5. OCR assisted path 설계안

- **대상**: 스캔 전용 PDF·mixed PDF의 zero-text 페이지. **필요 도구: Kordoc(선행 intake) + rasterizer(§12 미해결) + tesseract.js(+traineddata kor/eng, hash 검증)**.
- **흐름(순서 강제)**: Kordoc intake 먼저 → `pageQuality.needsOcr`/`ocrCandidatePages`로 대상 페이지 확정 → **해당 페이지만** rasterize → tesseract.js OCR(로컬 core/wasm+lang, no-egress 훅) → ocr_text.json(provenance 포함) → ingest(페이지 정합 fail-fast가 순서 위반을 기계적으로 차단).
- **판단**: rasterizer(§12)가 유일한 미해결 공급망. 이를 제외한 전 구간(엔진·no-egress·hash 계약)은 Gate D·2L-4C로 검증 완료.
- **부분 성공 정책(권고)**: 일부 페이지 OCR 실패 시 성공 페이지만 담은 ocr_text.json은 계약상 유효 — 내보내되 실패 페이지를 §7 커버리지 문구로 한계 명시. *(사용자 결정 불필요 — 계약 정합적 기본값. 2N-1 확인 쟁점)*

## 6. Provider 설치 확인 및 승인 UX

- **check(2N-2 구현)**: tool-cache 규약 경로에서 (a) 도구 존재 (b) 버전 == pin (c) traineddata hash == pin 확인. **repo·글로벌 환경을 뒤지지 않는다**(예측 가능성·드리프트 방지 — PATH의 임의 버전을 신뢰하지 않음).
- **승인 대화(한국어) 필수 고지 항목(초안)**: ① 무엇을(도구·버전 — **provider명 명시**, §11) ② 왜(이 문서의 스캔 N페이지/HWP 형식 때문) ③ 어디서(공식 registry/repo — 출처) ④ 어디에(로컬 전용 폴더 — 사용자 홈 하위, repo 밖) ⑤ 용량 대략치 ⑥ **이 준비 단계에서만 네트워크가 발생하며 분석 실행은 네트워크 차단 상태로 수행됨** ⑦ 거부 시에도 기본 분석은 계속됨.
- **승인 게이트의 이중 구조**: harness(명령 실행 권한)의 승인과 Skill 차원 한국어 승인이 공존한다 — Skill 승인 대화를 **1차(의사결정)**로, harness 프롬프트를 **2차(실행 확인)**로 위치시킨다. *(2N-5에서 실제 표시 검증 — known unknown)*
- **실패 UX**: 네트워크 차단/프록시로 설치 실패 → 원인 요약(한국어)+baseline 계속. 부분 설치 잔해는 tool-cache 버전 디렉터리 단위로 삭제 후 재시도(원자성 — §7 레이아웃이 전제).

## 7. Tool-cache / 설치 위치 / 버전 pinning 전략

- **권고 레이아웃**(paper design — 생성은 2N-2):
```text
<사용자 홈>/.samil-kssb-precheck/tools/          ← repo 밖 전용 tool-cache (U1 권고)
  kordoc@3.13.0/            (package.json은 여기에만 생성, npm --prefix 설치, --omit=optional 필수)
  tesseract.js@7.0.0/
  tessdata_fast/kor.traineddata (+.sha256)       ← Gate D 기록 hash로 검증
  node@<LTS버전>/                                 ← (U2-B 채택 시에만) portable Node — §7.1
  approvals.json                                  ← 승인 marker (대상·버전·hash·시각)
  prep_egress_log.jsonl                           ← 준비 egress 기록 (명령·출처·시각 — 내부 전용)
```

### 7.1 (2N-0B-A 보정) Node/npm 부재 시 선택지 — portable Node 후보

U2를 3안 구조로 보정한다. **"Node 자동 전역 설치"와 "portable Node 설치"는 다른 것**이며 이 구분이 핵심이다:

- **A. Node/npm 설치 안내 + baseline 계속** — 기본 안전 fallback(현행 권고 유지). 시스템 상태 무변경.
- **B. 사용자 승인 후 repo 밖 tool-cache에 portable Node 설치**(신규 후보) — nodejs.org 공식 배포 **zip**(예: `node-v<LTS>-win-x64.zip`)을
  tool-cache의 `node@<버전>/`에 **압축 해제만** 한다. **OS installer 미실행·시스템 PATH 영구 수정 없음·관리자 권한 불요·레지스트리 무흔적** —
  호출은 tool-cache 내 `node.exe` **절대 경로로만** 하며, 제거는 폴더 삭제로 완결된다. npm은 zip에 동봉되어 `--prefix` 설치가 그대로 성립한다.
- **C. 사용자 승인 후 OS installer 실행 / 시스템 PATH 영구 수정** — **배제**(시스템 대변경·관리자 권한·제거 흔적 — 기존 "외부 앱/CLI 상태 변경은 사용자 직접" 원칙과도 충돌).

**B안 설계 세부(채택 시 — 2N-1 확인 전 확정 금지)**:
1. **탐지 우선순위**: 시스템 Node 존재+버전 적합 → 그것을 사용(설치 제안 안 함) → 부재/부적합 시에만 B안 승인 대화 제시.
2. **무결성 검증**: nodejs.org는 배포별 `SHASUMS256.txt`를 제공 — traineddata와 동일한 규율로 다운로드 zip의 SHA-256을 검증 후 해제(불일치 fail-fast). 준비 egress로 `prep_egress_log`에 기록.
3. **버전 pin**: LTS 1개 버전 고정(runner 검증 조합의 일부). 단 Gate D는 v24에서 검증됐으므로 **pin 후보 버전에서의 실측 재검증을 rasterizer spike에 포함**.
4. **범위 한정**: 우선 **win-x64만**(현 대상 환경). 기타 플랫폼/아키텍처는 A안 fallback.
5. **승인 대화 고지 추가 항목**: 용량(~30MB 다운로드/약 80MB 해제)·출처(nodejs.org/dist 고정)·hash 검증 수행·**제거 방법=폴더 삭제**.
6. **AV 유의**: portable 실행 파일을 백신이 차단할 수 있음(2N-0A 리스크 연계) — 실패 시 A안 수렴 + 원인 한국어 안내.

**권고**: C안 배제 확정, A안을 기본 fallback으로 유지, **B안은 별도 후보로 설계에 포함하되 2N-1 Codex 리뷰에서 보안·제출 정책상 허용 여부를 확인 후 사용자 결정**.
B안 채택 시에도 시스템 PATH 영구 수정·관리자 권한 요구·OS installer 실행은 **금지 불변**.
- **버전 pin**: kordoc@3.13.0(npm-published baseline) + pdfjs-dist@4.10.38(v6 비호환 실측) + tesseract.js/core@7.0.0 + traineddata hash(Gate D 기록 재사용). **버전별 디렉터리**라 드리프트가 구조적으로 감지된다(경로 불일치=미설치). 미검증 버전 fail-fast·auto-upgrade 금지(Version Strategy 계승).
- **repo에는 package.json을 만들지 않는다**(현 구조 유지 — 제출물 표면 불변).

## 8. no-egress 구간과 준비 egress 구간 분리

기존 Gate A/D 원칙 그대로: **준비(설치·모델) = egress 허용·기록 / 실행(파싱·OCR) = no-egress**.
- 실행 단계는 nethook(Gate D 검증판 — dns/net/tls/http(s) block + worker_threads 전파)을 `--require`로 preload. nethook은 현재 repo에 없으므로 **2N-2에서 evidence 사양대로 재작성·커밋**(runner 자산의 일부, U4).
- `no_egress_verified: true`는 **훅이 실제 적용된 실행에서만** 기록한다(훅 없이 실행되면 false — 정직한 provenance).
- 한계 명시 유지: 프로세스/Node 레벨이며 OS 커널 레벨 아님(기존 비차단 보강 항목).

## 9. Artifact 생성 및 ingest 연결 설계

- **배치 규약(권고)**: runner는 `--out-dir` **필수 인자**로만 산출하며, 기본 안내는 repo 밖 경로. 파일명 규약 `<문서stem>.intake.json / .ocr_text.json / .aux_signals.json`.
  2N-2에서 `.gitignore`에 `*.intake.json`·`*.ocr_text.json`·`*.aux_signals.json` 방어 패턴 추가(중간 산출물 커밋 위험 차단 — 2N-0A unknown unknown 대응).
- **ingest는 기존 그대로**: `dei_producer.py --ocr-text --aux-signals`(이미 구현·리뷰) — runner의 책임은 "계약에 맞는 JSON 3종 생성"에서 끝난다. 새 ingest 코드 없음.
- **인터페이스 단위(권고)**: **단일 문서 단위 CLI**(파일 1개 → artifact 3종). 2N-4의 배치 실행은 이 CLI의 반복 호출로 조립(이중 구현 방지 — 2N-0A §8-5).

## 10. Provenance / hash / 결정성 전략

- **hash 계산 위치(권고)**: Node runner는 `output_sha256` **없이** ocr_text를 쓰고, 마무리 단계에서 **Python 헬퍼가 기존 `canonical_ocr_output_sha256()`을 재사용해 주입**한다.
  이유: canonical 규칙의 단일 소스 유지, Node `JSON.stringify` 교차 언어 불일치 위험(2N-0A §3-5) 원천 제거. 대안(Node 구현+교차 동등성 테스트)은 비용·리스크 대비 이득 없음.
- **provenance 필드**: 기존 ocr_text 계약 그대로(provider/provider_version/model/model_sha256/no_egress_verified/output_sha256 + 페이지 text_sha256) — **경로 필드 추가 금지**(validator 경로 스캔·§7과 충돌 방지). 승인 기록(approvals.json)은 tool-cache 내부 전용, findings로 미유입.
- **결정성(U6 권고)**: 일반 UX = 1회 실행 + hash 기록(계약 충족). **2회 재현 실행은 evidence/검증 모드 한정**(2N-4·게이트 evidence) — 대형 문서 시간 비용 회피.

## 11. Provider명 표기 정책 (3층 분리)

| 층 | 정책 | 근거 |
|---|---|---|
| **승인 대화** | **명시**(도구명·버전·출처·용량) | informed consent — 무엇이 설치되는지 모르는 승인은 승인이 아님 |
| **사용자 보고서·user_summary** | **금지**(§7 유지 — "로컬 판독 도구" 수준의 일반 표현 + 한국어 표준 문구) | 2M-5 규칙·과대표현 방지 |
| **내부 evidence/provenance** | **명시**(provider/version/hash/no-egress) | 재현성·게이트 추적성 |

능력 표현 정련(§2): 제품 문서는 "plugin core는 provider를 실행하지 않으며, **사용자 승인 하의 로컬 보조 실행(assisted path)**을 옵트인으로 제공한다"로 통일 — "OCR 지원" 표현은 계속 금지.

## 12. Rasterizer 후보와 미해결 리스크 (U8 — OCR 경로의 유일한 공급망 공백)

| 후보 | license | native | 평가 |
|---|---|---|---|
| **@napi-rs/canvas**(+pdfjs-dist 4.10.x 렌더) | MIT | **native(.node)** | Kordoc 이미지 경로와 정합(동일 스택). tool-cache 격리로 repo 미유입. **1순위 spike 후보** — 단 native 수용은 **Gate B 재검토 필수** 전제 |
| pdfjs-dist + 순수 JS 캔버스 폴리필 | Apache-2.0 | 없음 | 성립하면 native-free 최선이나 **실현 가능성 미검증**(렌더 API의 canvas 의존 심도) — 2순위 조사 |
| pdfium 계열(@hyzyla/pdfium 등) | Apache/BSD 계열 | native | 대안 native 후보. Kordoc optional과 동일 격리 클래스 |
| PyMuPDF | **AGPL** dual | native wheel | **제품 경로 배제 유지**(2L-3C 판정) — 검사·개발 교차검증 전용 |
| 사용자 기설치 poppler(pdftoppm) 호출 | GPL(외부 프로세스) | 시스템 도구 | 배포 아님·호출만이라 라이선스상 가능하나 **가용성 비보장** — 존재 시 opportunistic 옵션 이상 아님 |

**권고**: 2N-2 착수 **전** 짧은 **rasterizer spike**(별도 승인·repo 밖)로 @napi-rs/canvas 경로를 검증하고, 성공 시 Gate B 재검토(해당 native의 license·전이)를 묶어서 진행.
**사용자 결정 필요**: native rasterizer 수용 여부(수용 = Gate B 재검토 비용 발생 / 거부 = OCR 경로가 폴리필 성립 여부에 종속).

## 13. U1~U8 선택지 비교표

| # | 선택지 | 장점 | 단점/충돌 | 구현 비용 | 권고 |
|---|---|---|---|---|---|
| **U1 설치 위치** | ①외부 전용 tool-cache ②npm global ③npx ④repo 내부 | ①오염 0·버전 디렉터리·승인 명확 / ②간단 / ③설치 없음 | ②머신 전역 상태 변경·드리프트 / ③**실행마다 egress(분리 붕괴)+버전 부동** / ④package.json 생성=제출 표면 변경(금지 충돌) | ①낮음 | **① tool-cache** (③·④는 배제 권고) |
| **U2 Node 부재** (2N-0B-A 보정) | **A**안내+baseline **B**승인 후 tool-cache에 **portable Node**(zip 해제, PATH 무수정·installer 미실행 — §7.1) **C**OS installer/PATH 영구 수정 | A정직·안전 / B커버리지↑·시스템 무흔적·폴더 삭제로 제거 | B는 보안·제출 정책 확인 필요(2N-1)·AV 간섭 가능 / **C는 시스템 대변경·관리자 권한 → 배제** | A=0 / B=중 | **A 기본 fallback + B 별도 후보(2N-1 확인 후 사용자 결정) / C 배제** |
| **U3 승인 단위** | ①설치=도구·버전당 1회 + 실행=세션 1회, marker 기록 ②매 실행 승인 ③전역 1회 | ①균형 / ②안전하나 피로 / ③최소 마찰 | ③버전 변경 시 무승인 위험 | ①낮음 | **①**(marker는 tool-cache 내) |
| **U4 runner 커밋/zip** | ①커밋+zip 포함 ②docs 절차만 | ①재현성·리뷰 가능·심사 서사 / ②표면 최소 | ①zip 내 실행 스크립트 인상(packaging 문구 필요) / ②재현성 취약(2N-0A) | ①중 | **①**(조건: core 미import 테스트·자동 실행 없음·기본 비실행 명시) |
| **U5 provider명** | ①3층 분리(§11) ②전면 금지 ③전면 허용 | ①consent+§7 양립 | ②승인이 깜깜이 / ③§7 위반 | ①0 | **①** |
| **U6 결정성** | ①evidence 모드 한정 2회 ②기본 UX 2회 | ①시간 절약 / ②상시 증명 | ②대형 문서 2배 시간 | ①낮음 | **①** |
| **U7 경로 승인** | ①포맷별 분리(HWP=Kordoc만) ②일괄 | ①최소 설치·명확 / ②대화 1회 | ②불필요 설치 승인 강요 | ①낮음 | **①** |
| **U8 rasterizer** | §12 표 | — | native=Gate B 재검토 / 폴리필=미검증 | spike 필요 | **spike 후 결정**(1순위 @napi-rs/canvas) |

## 14. 권고안 (종합)

1. 외부 전용 tool-cache(버전 디렉터리+approvals/prep-egress 기록) — 오염 0·재현성·드리프트 감지.
2. HWP/OCR **이중 경로 분리 승인** — 필요한 것만, 최소 설치.
3. 준비 egress ↔ 실행 no-egress 분리를 nethook(재작성·커밋)으로 강제, `no_egress_verified`는 훅 적용 실행에만 true.
4. hash는 Python 헬퍼로 주입(규칙 단일 소스), 결정성 2회는 evidence 모드 한정.
5. runner는 단일 문서 CLI + `--out-dir` 필수 + `.gitignore` artifact 패턴 방어.
6. provider명 3층 분리 정책.
7. rasterizer는 spike 후 결정(1순위 @napi-rs/canvas + Gate B 재검토 묶음).
8. Node 부재·거부·실패는 전부 "baseline 계속 + §7 한계 문구" 수렴 — (2N-0B-A) U2-B(portable Node) 채택 시에도 B의 거부·다운로드 실패·AV 차단은 동일하게 A로 수렴한다.

## 15. 사용자 결정 필요사항

- **U1** 권고(외부 tool-cache) 채택 여부 — 특히 위치를 사용자 홈 하위로 신설하는 데 동의하는가.
- **U2** (2N-0B-A 보정) A안(안내+baseline)만으로 한정할지, **B안(portable Node를 tool-cache에 설치 — §7.1)**을 후보로 채택할지 — B안은 2N-1 확인 후 결정. C안(OS installer/PATH 수정)은 배제 확정.
- **U3** 승인 단위 권고(설치 1회+실행 세션 1회, marker 기록) 채택 여부.
- **U4** runner 커밋 + submission.zip 포함 여부(packaging 정책 문구 추가 포함).
- **U5** provider명 3층 분리 정책 승인.
- **U6** 결정성 evidence-모드 한정 승인.
- **U7** 경로별 분리 승인 채택 여부.
- **U8** native rasterizer 수용 여부(수용 시 Gate B 재검토 비용 동의) + spike 진행 승인.

## 16. 2N-1 Codex 리뷰에서 확인받아야 할 쟁점

1. **경계 정련**: "자동 실행 금지"(2L-4A/4B 조건) → **"무승인 실행 금지"**로의 재정의가 기존 리뷰 조건과 양립하는가(Skill이 절차를 안내·중개하되 매 실행이 승인 게이트 뒤).
2. Skill 지침에 assisted 절차 안내를 추가하는 것이 "runner ≠ Skill entrypoint" 조건과 양립하는가(진입점은 여전히 Skill 하나, runner는 Skill이 중개하는 보조 도구).
3. provider명 3층 분리(§11)가 §7·D3와 정합적인가.
4. tool-cache(사용자 홈 하위) 신설이 submission/redaction 정책과 충돌하지 않는가(경로는 findings 미유입 전제).
5. 부분 성공 정책(§5)·거부/실패 수렴 UX(§3)의 타당성.
6. hash Python-주입 설계(§10)가 계약 무결성 검증 취지를 훼손하지 않는가.
7. 능력 표현 정련(§11 — "사용자 승인 하의 로컬 보조 실행")이 과대표현 금지 규칙과 양립하는가.
8. **(2N-0B-A) portable Node B안(§7.1)**이 보안·제출 정책·"외부 앱/CLI 상태 변경은 사용자 직접 수행" 원칙과 양립하는가 —
   특히 "승인 하 tool-cache 압축 해제(PATH 무수정·installer 미실행·폴더 삭제로 제거)"를 OS installer류 시스템 변경과 구분해 허용할 수 있는지.

## 17. 2N-2 구현 전제 조건

① 사용자 U1~U8 결정, ② Codex 2N-1 설계 리뷰 PASS(§16 쟁점 포함), ③ rasterizer spike 결과(OCR 경로 착수 조건 — HWP 경로는 spike와 무관하게 선행 가능),
④ nethook 재작성 사양(Gate A/D evidence 기준) 확정. 구현 순서 권고: **HWP 경로 먼저**(리스크 최소·전 구간 기검증) → OCR 경로(스파이크 결과 반영).

## 18. 2N-4 / 2N-5 검증 관점 초안

- **2N-4(assisted 재테스트)**: assisted-needed 5파일 Track B 실행 — ① 커버리지 개선(zero-text 페이지 텍스트화율·HWP 판독 성립) ② OCR 정확도(텍스트레이어 PDF ground-truth 문자 일치율 — 비민감 측정법) ③ §7 준수(provider명·영문 문자열·커버리지 문구) ④ provenance 완전성(hash·no_egress_verified) ⑤ baseline 대비 findings 품질 비교(같은 파일 Track A vs B).
- **2N-5(블랙박스)**: "이 보고서 분석해줘"만으로 — ① 승인 대화 한국어 품질·고지 완전성 ② 거부/Node 부재/설치 실패 시나리오의 정중한 수렴 ③ 최종 보고서 §7 준수 ④ 준비/실행 egress 분리 로그 확인 ⑤ 성공 판정 주체·기준은 사전 정의(사용자 결정 — 2N-0A 질문 5).
