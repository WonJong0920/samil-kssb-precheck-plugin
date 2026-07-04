# Cycle 2L-3C Provider / Document Analysis Capability Comparison

> **성격**: provider comparison **evidence**. L2 구현 아님·provider **최종 확정 아님**(비교 재료만).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Codex Gate D evidence review **PASS**(`docs/reviews/codex_cycle2l_3b_gate_d_evidence_review.md` — tesseract.js는 Gate D-proven baseline일 뿐 최종 L2 provider 아님, Kordoc 비교는 nonblocking follow-up).
> 모든 설치·실행·raw 산출물은 **repo 밖 임시 디렉터리**(`[REDACTED_LOCAL_PATH]`). repo에는 본 evidence 문서만. OCR/파싱 원문은 미기재(집계·hash·짧은 관찰만). KSSB 판단·감사/인증/준수 결론 미생성.

## Summary

sample 폴더의 5개 문서(유형3 스캔 PDF ver2 9p / 텍스트레이어 PDF 11p / HWP v5 / HWPX / DOCX)로 문서분석 provider들을 비교했다.
결과 요지: **Kordoc(npm latest-observed 3.13.0 + pdfjs-dist@4.10.38 fallback)**이 5개 포맷 전부 성공·결정적(2회 hash 동일)·파싱 no-egress(훅 하 outbound 0)·
**구조 추출(제목 계층·표 rows/cols/cells·이미지 블록·outline·needsOcr 페이지 신호)에서 유일하게 전 포맷 대응**. 특히 **HWP v5 바이너리 파싱은 로컬 대안 없음**.
**tesseract.js 7.0.0**은 Gate D-proven **스캔 OCR baseline**으로 유지(스캔 전용 입력에서 Kordoc은 텍스트 0 + needsOcr 신호만, OCR은 못함 — 상호보완).
**pdfjs-dist@6.1.200**(독립 baseline)·PyMuPDF·poppler는 텍스트레이어 PDF 텍스트 추출은 우수하나 구조(표/제목/이미지 블록) 미제공, HWP/HWPX 불가.
**provisional recommendation: "Kordoc(구조·다포맷 인테이크) + tesseract.js(스캔 OCR fallback)" 조합이 L2 후보 구도** — 단 최종 확정은 아니며(kordoc GitHub source 3.15.0 미검증 limitation 포함) Codex Review + 승인 후 별도 결정.

## Scope

- **비교 목적**: L2 provider 선정을 위한 **추출 품질·운영 안전성 비교 재료** 생성(확정 아님).
- **하지 않은 것**: L2 코드 구현·provider 최종 확정·schema/validator/renderer/delivery/src/tests/manifest/package/lock 변경·cloud/외부 API OCR·KSSB 판단 생성·raw artifact 커밋·submission.zip.
- OCR/파싱 결과는 **DEI candidate/검수 신호 후보**로만 논한다(판정 미생성, renderer/validator 직접 유입 금지 전제).

## Samples found in sample folder

| sanitized name | format | SHA-256(16) | size(B) | 비고 |
|---|---|---|---|---|
| 유형3 스캔 PDF (Gate D ver2) | PDF(스캔) | `238de8be151da740` | 1,156,885 | **expected hash·9p 일치 확인 후 사용**. 사용자 PII 없음·공식 출처 확인(2L-3B0) |
| 텍스트레이어 PDF 샘플 | PDF(text) | `c279116cfd1d6bf7` | 1,993,443 | 11p 전 페이지 텍스트 존재, 이미지 객체 533, 저텍스트 페이지 2~3개 혼재 |
| HWP v5 샘플 | HWP(OLE CFB) | `445f82d6427446d3` | 103,936 | 시그니처 `d0cf11e0` 확인 |
| HWPX 샘플 | HWPX(zip/xml) | `094b9df5928d9fba` | 117,945 | section0.xml 1개, BinData 이미지 다수 |
| DOCX 샘플 | DOCX(zip/xml) | `9567636d8d91e5e5` | 81,493 | word/document.xml, media 이미지 다수 |

- 원본 파일은 전부 **repo 밖**·미커밋. 텍스트레이어 PDF metadata에 author 항목 존재(값 미기재·미인용 — 문서/산출물에 미노출).

## Providers compared

1. **Kordoc** — npm latest-observed **kordoc@3.13.0** + **pdfjs-dist@4.10.38(fallback)**, `--omit=optional`(117pkg, native 0). MIT.
2. **Kordoc 3.8.2(교차확인)** — 기존 검증 조합(3.8.2 + pdfjs 4.10.38)으로 동일 5샘플 실행(버전 간 산출 안정성 확인용).
3. **pdfjs-dist@6.1.200** — **독립 PDF baseline**(Kordoc과 분리, 직접 getTextContent 추출). Apache-2.0.
4. **PyMuPDF(fitz) 1.27.2.3** — 이미 설치된 local parser(텍스트/구조 메타). AGPL-3.0(dual) — 라이선스 유의(비교 검사용으로만 사용).
5. **poppler pdftotext** — 이미 설치(교차검증용). GPL — 동상.
6. **stdlib zip+xml** — Python 표준 라이브러리로 HWPX/DOCX 내부 xml 집계(설치 0).
7. **tesseract.js 7.0.0** — **Gate D-proven OCR baseline**(2L-3B evidence 재인용, 재실행 없음). Apache-2.0.

## Execution environment

- Windows / Node v24.16.0 / Python 3.14(+ 시스템 fitz). 실행 위치: repo 밖 임시 디렉터리 3곳(kordoc latest·kordoc 3.8.2·pdfjs baseline) + Gate D 기존 WORK.
- 파싱 실행은 전부 **Gate A 방식 Node 훅(block 모드)** 하에서 수행(비-loopback connect는 기록 후 throw).

## Version policy / resolved versions

- **kordoc latest 확인**: `npm view kordoc version` → **3.13.0**(npm registry observed latest, 2026-07-04). versions 목록 tail: …3.11.0, 3.12.0, **3.13.0**.
- **실제 사용 kordoc**: **3.13.0**(npm-published/latest-observed baseline) + 교차확인용 3.8.2.
- **Kordoc dependency/peerDependency 확인**: dependencies에 pdfjs-dist **없음**; **peerDependencies `pdfjs-dist: ">=4.0.0"`**(+ `puppeteer-core >=22`, 미설치·미사용), optionalDependencies(transformers/pdfium/onnxruntime-node/sharp)는 `--omit=optional`로 제외(native 0 확인). → pdfjs-dist는 사용자가 공급하는 peer이므로 "내부 요구 버전 override" 문제 없음(범위 내 선택).
- **resolved pdfjs-dist**: 최초 **6.1.200(latest)** 시도 → **kordoc PDF 파싱 FAIL**("PDF 파싱에 pdfjs-dist가 필요합니다" — 설치돼 있어도 로더가 v6 사용 실패) → **4.10.38로 fallback**(kordoc은 3.13.0 유지).
- **fallback 사유(실측)**: pdfjs-dist@6은 **API 변경**으로 v4 코드와 비호환 — 독립 baseline 실행에서 `doc.destroy is not a function`(v6에서 제거/변경)을 직접 재현. kordoc의 pdfjs 로더가 이 계열 비호환으로 실패하는 것으로 판단(2I-3A spike의 v6 실패와 동일 계열). peer 범위(`>=4.0.0`)가 v6를 허용하지만 실제로는 미지원 — **선언 범위 ≠ 실지원 범위**임을 기록.
- **pdfjs-dist@latest 별도 baseline**: **수행함**(6.1.200, Kordoc과 분리된 독립 추출·아래 매트릭스 별도 행).
- 설치 위치: 전부 repo 밖. **project package.json/lock/source tree 무변경**(repo diff에 코드 없음).

## Version discrepancy

```text
GitHub source version: kordoc@3.15.0 (chrisryugj/kordoc main package.json; CHANGELOG 3.15.0 - 2026-07-04)
npm registry observed latest: kordoc@3.13.0  → GitHub source와 불일치(레지스트리 미발행 추정)
Actual tested version: kordoc@3.13.0 (+ 3.8.2 교차확인)
Interpretation: npm-published/latest-observed baseline only; not full source-latest 3.15.0 capability.
Follow-up: source-aligned kordoc@3.15.0 comparison may be needed before final L2 provider selection.
```

- **source install 가능 여부 확인(실측)**: `npm install github:chrisryugj/kordoc`(repo 밖) → 3.15.0 fetch는 성공하나 **`dist/cli.js` 부재로 실행 불가** — 패키지가 `files:["dist"]`·빌드는 `tsup`(`prepublishOnly`)이고 `prepare` 스크립트가 없어 github: 설치로는 빌드 산출물이 생성되지 않음. devDependencies 설치+빌드는 본 비교 범위를 넘는 공급망 확장이라 **미수행**. → **3.15.0 source-aligned 비교 불가 = limitation**(본 문서의 Kordoc 결과는 3.13.0 기준으로만 해석).

## Preparation egress (허용·기록)

| 시각(UTC) | 명령(요지) | 출처 | 결과 |
|---|---|---|---|
| 06:56 | `npm install --omit=optional kordoc@3.8.2 pdfjs-dist@4.10.38` | registry.npmjs.org | 117pkg, native 0 |
| 07:04 | `npm install --omit=optional kordoc@3.13.0 pdfjs-dist@6.1.200` | registry.npmjs.org | 117pkg, native 0 |
| 07:05 | `npm install pdfjs-dist@4.10.38` (fallback 교체) | registry.npmjs.org | resolved 4.10.38 |
| 07:06 | `npm install pdfjs-dist@6.1.200` (독립 baseline 디렉터리) | registry.npmjs.org | 3pkg |
| 07:12 | `npm install github:chrisryugj/kordoc` (source probe) | github.com | 3.15.0 fetch, dist 부재 → 실행 불가 |
| (읽기) | GitHub raw package.json 확인 | raw.githubusercontent.com | version=3.15.0 확인 |

- 모델 다운로드 없음(`--formula-ocr` 미사용), tesseract.js 재설치 없음(Gate D 자산 재사용·재실행 없음). 준비 egress는 파싱 단계와 분리.

## No-egress parsing evidence

- **방식**: Gate D와 동일한 Node 훅(`nethook.cjs`) block 모드 — dns/net/tls/http(s) 인터셉트, 비-loopback 시도는 기록 후 throw. control(C1 loopback 포착·C2 `8.8.8.8:53` 차단·worker 커버리지)은 Gate D evidence에서 검증된 동일 파일 재사용.
- **결과**: kordoc 3.13.0 **5샘플×2회=10회 전부** `[NETHOOK-SUMMARY] egressAttempts=0`·exit 0. kordoc 3.8.2 10회 동일. pdfjs@6 baseline 3회 동일(0). PyMuPDF/stdlib 검사(Python)는 네트워크 API를 사용하지 않는 로컬 라이브러리 호출이나 **별도 차단 훅 없이 실행 → no-egress evidence는 "not verified(간접)"**로 정직 기록.
- **수준**: Node 런타임 레벨(OS/커널 아님 — Gate D와 동일 한계). kordoc 실행엔 child process 미관측.

## Native / license / model provenance

| provider | native | license | model/가중치 |
|---|---|---|---|
| kordoc@3.13.0(+pdfjs 4.10.38, omit-optional) | **0**(.node/.dll/.exe 없음) | MIT + permissive 전이(117pkg, Gate B 인벤토리와 동일 규모; optional LGPL/native 제외 유지) | 없음(formula-ocr 미사용) |
| pdfjs-dist@6.1.200 | 0 | Apache-2.0 | 없음 |
| tesseract.js 7.0.0 | 0(wasm 6) | Apache-2.0(+traineddata Apache-2.0) | tessdata_fast kor/eng(로컬, Gate D 기록) |
| PyMuPDF(fitz) | native wheel(로컬 검사용) | **AGPL-3.0/상용 dual — 제품 경로 채택 시 별도 라이선스 검토 필수** | 없음 |
| poppler pdftotext | native(로컬 도구) | GPL — 동상(외부 프로세스로만 쓰면 별개이나 번들 금지) | 없음 |
| stdlib zip+xml | 0 | Python stdlib | 없음 |

- RH-B2 관점: kordoc `--omit=optional` 설치에서 native 0 재확인(3.8.2·3.13.0 모두) — optional/native 격리 유지.

## Determinism

| 대상 | run a/b hash | 동일? |
|---|---|---|
| kordoc 3.13.0 — ver2/textpdf/hwp/hwpx/docx JSON | 5쌍 전부(예: textpdf `76a1f4c1…`, hwp `805c3bb6…`) | **5/5 동일** |
| kordoc 3.8.2 — 동일 5종 | 5쌍(예: textpdf `7d617b7d…`) | **5/5 동일** |
| 버전 간(3.8.2↔3.13.0) | **hwp·hwpx·ver2 3종은 바이트 동일**, textpdf·docx는 상이(파서 개선분) | 참고 |
| pdfjs@6 텍스트 추출(textpdf) | `a0657f85…` ×2 | 동일 |
| PyMuPDF 텍스트 추출(textpdf) | `10ace40f…` ×2 | 동일 |
| tesseract.js(ver2, Gate D 기록) | `546926ec…` ×3 | 동일(기존 evidence) |

## Extraction quality comparison

**유형3 스캔 PDF(ver2 9p)** — OCR 필요 입력:
- kordoc: success, **blocks 0·텍스트 0**, `pageQuality.needsOcr 9/9`, 경고 "이미지 기반 PDF … OCR 필요" → **L1 감지·라우팅 신호로 정확**(단 OCR 자체는 불가).
- pdfjs@6: 추출 8자(사실상 0) — 텍스트레이어 부재 재확인. PyMuPDF/pdftotext: 0자(기존 확인).
- tesseract.js(Gate D): **11,852자 인식**(한글 위주, 결정적) — **스캔 입력에서 유일하게 텍스트 생산**.

**텍스트레이어 PDF(11p, 표 다수·저텍스트 페이지 혼재)**:
- 텍스트 총량(순수 추출): PyMuPDF 12,861자(한글 7,715) / pdfjs@6 14,145자(한글 7,715 — 공백 join 차이로 총량만 상이) / **kordoc 3.13.0 = 본문 2,693 + 표 셀 9,640 = 12,333자(한글 7,625 ≈ 98.8% 커버)**.
- **구조**: kordoc만 제공 — **heading 39개(레벨 1/2/3 계층)·outline 39·표 25개(셀 628, rows×cols 복원, hasHeader 전부 인식)·list 13**·블록별 pageNumber+bbox. 저텍스트 페이지 `needsOcr` 2/11 플래그(혼합문서 감지). 한글 비율 0.78 산출.
- 페이지 순서·줄바꿈: 세 도구 모두 페이지 순서 보존, 결정적. 한글 깨짐(replacement/PUA) 지표: kordoc qualitySummary 0.

**HWP v5(바이너리)**: kordoc **유일 성공** — 175블록(heading 9·paragraph 71·**table 25(셀 564)**·**image 70 감지**), outline 9, 본문+셀 9,501자. PyMuPDF/poppler/stdlib/pdfjs 전부 불가(stdlib은 시그니처 식별만).

**HWPX**: kordoc 175블록(**table 25(셀 559)·image 70**, 9,472자 — 단 heading/outline 0 = HWP 대비 제목 계층 미복원). stdlib zip+xml은 집계 텍스트 13,693자·table/pic 태그 카운트는 가능하나 구조화 블록 아님(검증용 보조).

**DOCX**: kordoc 103블록(paragraph 78·**table 25(셀 559)**, 8,489자) — **image 블록 0(media 70개 존재하나 미감지)·heading 0·pageCount 없음** = DOCX 경로가 상대적으로 약함. stdlib으로 tables 30·images 70 태그 확인(교차: kordoc이 DOCX 이미지 감지 누락).

**caption/주석**: 어떤 provider도 명시적 caption 블록 타입 미제공(한계로 기록).

## DEI candidate suitability

- **kordoc JSON**: pageNumber·bbox·block type·표 구조·needsOcr·qualitySummary가 **기존 DEI-candidate 계약(2L-1 동결·`src/intake/dei_producer.py` 소비 형태)과 그대로 정합** — evidence anchor 후보(사람 읽기용 `p.<n>·섹션` 힌트), 저신뢰/스캔 신호의 `not_verifiable`+`missing_info`+`customer_questions` 라우팅에 직접 사용 가능. 사람이 검토 가능한 중간 산출물(JSON/markdown)이며, renderer/validator 직접 유입 차단도 기존 테스트 경계 그대로 적용.
- **tesseract.js 출력**: 평문 텍스트뿐(구조 없음) → DEI로 쓰려면 페이지 단위 매핑을 어댑터가 부가해야 함. 스캔 fallback 텍스트 소스로는 적합.
- **pdfjs/PyMuPDF/stdlib**: 원시 텍스트/태그 집계 수준 — DEI 재료로는 가공 필요, 구조 신호 없음(교차검증용으로 유용).

## Provider capability matrix

| Provider | Formats tested | OCR text | Text-layer PDF | HWP/HWPX | Table | Image/figure/chart | Section structure | No-egress evidence | Native/license risk | Determinism | Artifact safety | DEI suitability | Overall L2 suitability | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Kordoc latest-observed — resolved kordoc@3.13.0 / pdfjs-dist@4.10.38(fallback)** | PDF(스캔·텍스트)/HWP/HWPX/DOCX 5종 | 불가(needsOcr 신호만) | **우수**(텍스트 98.8%+구조) | **HWP v5·HWPX 파싱 유일**(HWPX heading 없음) | **우수**(25~26표, rows/cols/셀 복원) | HWP/HWPX image 70 감지·PDF/DOCX 이미지 블록 미감지 | **PDF heading 3계층+outline**, HWP outline 9 | 10/10 run egress 0(훅) | **낮음**(MIT·native 0·omit-optional) | 5/5 쌍 동일 | 원문 repo 밖·미커밋 | **높음**(기존 DEI 계약 정합) | **높음(구조·다포맷 인테이크)** | 비교 완료(확정 아님) |
| Kordoc 3.8.2 (교차확인) | 동일 5종 | 동일 | 양호(12,420자) | 동일 | 우수(셀 660) | 동일 경향 | heading 35 | 10/10 egress 0 | 낮음 | 5/5 동일 | 동일 | 동일 | (3.13.0으로 대체) | 교차확인용 |
| **pdfjs-dist latest baseline — pdfjs-dist@6.1.200** | PDF 2종 | 불가 | 텍스트만 우수(14,145자·한글 7,715) | 불가 | 없음 | 없음 | 없음 | 3 run egress 0 | 낮음(Apache-2.0) | 2/2 동일 | 동일 | 낮음(원시 텍스트) | 보조(텍스트 교차검증) | baseline |
| PyMuPDF(fitz) 1.27.2.3 | PDF 2종(+렌더) | 불가(래스터화만) | 텍스트 우수(12,861자) | 불가 | 없음 | 이미지 객체 수만 | TOC만(본 샘플 0) | **not verified**(훅 미적용) | **AGPL dual — 제품 채택 시 라이선스 재검토 필수** | 2/2 동일 | 동일 | 낮음 | 검사·렌더 보조 | 검사용 |
| poppler pdftotext | PDF 교차검증 | 불가 | 교차검증용 | 불가 | 없음 | 없음 | 없음 | not verified | GPL(번들 금지) | (참고) | 동일 | 낮음 | 교차검증 | 검사용 |
| stdlib zip+xml (Python) | HWPX/DOCX | 불가 | 해당 없음 | HWPX 집계만(구조 아님) | 태그 카운트만 | 태그/파일 카운트만 | 없음 | 로컬 stdlib(egress 코드 없음) | 없음 | 결정적 | 동일 | 낮음(검증 보조) | 교차검증 | 검사용 |
| **tesseract.js 7.0.0 (Gate D-proven)** | 스캔 PDF(래스터 경유) | **가능**(11,852자·한글 위주) | 비효율(래스터+OCR — 미실행) | 불가 | 없음 | 없음 | 없음 | **Gate D 검증**(worker 포함 egress 0) | 낮음(Apache-2.0·wasm) | 3/3 동일 | Gate D 기록 | 중간(평문 — 어댑터 가공 필요) | **스캔 OCR fallback 축** | Gate D baseline |

## Provisional recommendation (확정 아님)

- **구도**: **Kordoc(다포맷 인테이크·구조·needsOcr 신호) + tesseract.js(스캔 페이지 OCR fallback)** 조합이 L2 후보로 가장 정합적 — Kordoc이 스캔 감지(needsOcr)를 주고, OCR이 필요한 페이지만 tesseract.js 경로로 보내며, 산출은 모두 DEI candidate로만 합류.
- **유보 사유**: ① kordoc **GitHub source 3.15.0 미검증**(npm 3.13.0과 불일치 — limitation), ② pdfjs-dist 4.10.x fallback 고착(v6 비호환)의 유지보수 리스크, ③ DOCX 이미지/HWPX heading 감지 공백, ④ caption 미지원. → **최종 provider 확정은 본 비교의 Codex Review + 사용자/ChatGPT 승인 후 별도 결정**.
- PyMuPDF/poppler는 라이선스(AGPL/GPL) 때문에 제품 경로 부적합 — 검사·교차검증 도구로만.

## Required follow-up before L2 implementation

1. 본 비교 문서 **Codex Review**.
2. **kordoc@3.15.0 source-aligned 비교**(빌드 경로 확보 또는 npm 발행 대기) — 최종 provider 선정 전 권장.
3. pdfjs-dist **4.10.x pin 유지 전략 재확인**(Version Strategy 8규칙과 정합 — v6 비호환 실측 반영).
4. L2 implementation-prep(승인 후): Kordoc+tesseract.js 조합의 아키텍처·DEI 매핑·경계 테스트 설계(코드는 그 다음).
5. DOCX 이미지 감지·HWPX heading 공백은 stdlib 교차검증 또는 kordoc 신버전으로 보완 검토.

## Recommended next step

- Codex Review(본 문서) → 사용자/ChatGPT 분기 결정: (a) L2 implementation-prep(조합 구도 기준, provider 확정은 좁고 가역적으로) 또는 (b) kordoc 3.15.0 source-aligned 재비교 선행. 어느 쪽이든 source-bound·detect-only·no re-judgment·사람 검수 경계 유지, L2/L3 구현은 리뷰 통과 전 금지.
