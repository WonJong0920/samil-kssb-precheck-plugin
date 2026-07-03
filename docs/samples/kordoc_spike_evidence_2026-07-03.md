# Kordoc Local Spike Evidence — 2026-07-03

> 본 문서는 `docs/planning/cycle2i_3a_kordoc_local_spike_runbook.md`의 evidence 템플릿에 **실제 관찰 결과**를 채운 기록이다.
> 사용자 승인 하에 **사용자 로컬 환경**에서 수행했다. 로컬 절대경로·계정·파일명·회사명은 제거(유형 라벨/`[REDACTED]`)했고,
> 저작권 원문 장문 복붙은 하지 않았다(짧은 발췌·일반화만). 최종 도입 판단은 사용자/ChatGPT가 하며, 본 evidence는 Codex 독립 검증 대상이다.
> **OCR provider는 사용하지 않았다**(needs_ocr "필요 여부 관찰"까지만). plugin core code·schema·renderer·delivery·validator·manifest·marketplace **미변경**.

## 환경 (일반화)

- OS 종류: Windows
- Node 메이저 버전: v24.x (실측 v24.16.0)
- npm: 11.x (실측 11.13.0)
- 실행 위치: repo 밖 임시 작업 디렉터리(`[REDACTED_LOCAL_PATH]`), repo 내부 아님
- 실행자: 사용자(로컬)

## 재현성

- 패키지 버전: **kordoc@3.8.2**
- 사용 도구/명령: **CLI** — `kordoc <file> --format json|markdown -o <out> -p <pages> --silent` (bin `dist/cli.js`). MCP 서버(`kordoc-mcp`)·`setup`·`--formula-ocr`·`check-formula-models`는 **미사용**.
- 설치 출처: 공식 npm 레지스트리 (`npm install kordoc`)
- **추가 필수 의존성(중요)**: PDF 파싱은 **optional peer `pdfjs-dist` 별도 설치 필요**. base `npm install kordoc`만으로는 PDF 파싱 시
  `PDF 파싱에 pdfjs-dist가 필요합니다`로 실패.
  - `pdfjs-dist@6.1.200`(최신) → **실패**: `doc.destroy is not a function` + JPX/OpenJPEG WASM 경고, 산출물 없음.
  - `pdfjs-dist@4.10.38`(= kordoc devDependency `^4.10.38`) → **성공**. 즉 **PDF 엔진 버전 고정(v4.10.x)이 사실상 필수**.
- README/문서 확인일 / 확인처: **2026-07-03** / 설치본 README.md(문서상 v3.8.2) 및 `https://github.com/chrisryugj/kordoc`
- 테스트 artifact ↔ 공개 README 일치 여부: **Y** (README 명시 기능 — HWP/HWPX/PDF/XLSX/DOCX→Markdown+표 재구성, CLI/MCP, needs_ocr 계열 품질신호 — 이 설치본 3.8.2와 일치)

## 라이선스

- 라이선스 종류(LICENSE 파일 확인): **MIT** (설치본 `node_modules/kordoc/LICENSE` = "MIT License, Copyright (c) 2026 chrisryugj", `package.json` `license: MIT`와 일치)
- third-party 고지 확인: **부분** — kordoc 본체 MIT 확인. 단 **전이 의존성 다수**(base 171 packages)와 PDF/이미지·OCR 계열
  (`pdfjs-dist`, `@hyzyla/pdfium`, `sharp`, `onnxruntime-node`, `@huggingface/transformers`)의 라이선스·배포 영향은 **별도 정밀 검토 필요**(README/최상위 MIT만으로 결론 금지).
- 배포·제출 사용 적합성(정밀 검토): **불명확 → 별도 심사 필요**. 본체 MIT는 우호적이나, 다수 전이 의존성·네이티브 바이너리(pdfium/sharp/onnxruntime) 포함 시
  제출 패키징 영향은 `docs/submission_packaging_policy.md`와 함께 재판단.

## 오프라인 / 무-egress

- 네트워크 차단 실행(강제): **미보장(환경 한계)** — 본 실행 환경에서 파싱 단계의 네트워크 하드 차단·아웃바운드 관찰을 직접 보장하지 못함.
- 오프라인에서 표/텍스트 추출 완료(관찰): **긍정** — PDF 파싱은 로컬 `pdfjs-dist`(순수 JS 파서)만 사용. 파싱 중 원격 다운로드·모델 fetch **관찰되지 않음**
  (설치 이후 파싱은 로컬 처리 시간과 일치: 유형1 3초, 유형2 40~45초).
- 실행 중 외부 연결 시도: **미관측**(단 강제 차단 아님). **egress 유발 기능은 모두 미사용**: `--formula-ocr`(첫 사용 시 ONNX 모델 ~155MB 다운로드),
  `check-formula-models`, `setup`(클라이언트 설정 패치), `mcp`(서버). 입력은 로컬 파일만, 원격 URL/cloud fetch 미사용.
- **사용자 재확인 필요 항목**: 네트워크 비활성/방화벽 아웃바운드 차단 상태에서 동일 파싱 재현 + 연결 로그 무발생 확인(runbook §4).

## 유형별 결과

> 파일명·회사명은 유형 라벨로 일반화. 유형1·2는 공개 공시성 보고서(비민감), 유형3은 아래 사유로 적합 샘플 미확보.

| 유형 | 표/텍스트 추출 | 페이지/섹션 단서 | 결정성(2회 동일) | baseline 대비 | 비고 |
|---|---|---|---|---|---|
| **유형1** (공개 KSSB형 텍스트 PDF, 53p) | 양호 — 796 blocks, **표 49개** 재구성, md 78,246자, 3초 | pageNumber·bbox·outline(섹션 레벨)·pageQuality 제공 | **동일**(sha `953443f4…` 2회 일치) | 개선 — 표 열구조·위치 단서·needs_ocr·warnings 보존 | needs_ocr 후보 페이지 `[3,17,29,37,39,51,53]`, warning `SKIPPED_IMAGE`(이미지 영역 텍스트 없음) |
| **유형2** (공개 지속가능경영보고서 텍스트 PDF, 126p, ~156MB) | 양호 — **표 199개**, md 238,165자, 40~45초, 대용량 안정(크래시·메모리폭발 없음) | 동일 필드 제공, warnings 12건 | **동일**(sha `6095b881…` 2회 일치) | 개선 — 동일(표/위치/품질신호) | needs_ocr 후보 `[27,63]` |
| **유형3** (스캔/이미지 전용 PDF) | **미확보** | — | — | — | 로컬 후보 일부는 **암호화("No password given")**로 파싱 불가, 다른 후보는 **텍스트 레이어 PDF**(needsOcr=false, PUA 0)여서 스캔 전용 아님. **단 needs_ocr 신호 자체는 유형1의 이미지/저텍스트 페이지에서 실측 관측됨** |

**표 재구성 예(유형1, p.3 목차표 15×3, header 감지)**: `개요 | 기후 | 금융소비자보호` 열구조와 각 영역 하위 항목·페이지 단서가 열별로 보존됨.

## 2회 실행 기준 결정성

- 유형1·유형2 모두 **동일 입력 2회 실행 시 markdown SHA-256 동일**(유형1 `953443f4…`, 유형2 `6095b881…`). 처리 타임스탬프 등 비결정 요소 미관측. → **결정성 확보**.

## baseline 대비 개선 여부

- **baseline(naive pdfjs 텍스트 추출, 표 로직 없음)**: 동일 페이지(유형1 p.3)에서 3열 목차가 단일 스트림으로 뒤섞임
  (열 병합·페이지번호 연속 `05 05 05 05…`), markdown 표 파이프 `|` 없음, needs_ocr/품질/섹션 메타 **전무**.
- **kordoc**: 같은 내용을 **markdown 표(열 구조 보존)** + block별 page/bbox + outline(섹션) + pageQuality + needsOcr + warnings로 산출.
- → **표 구조·위치 단서·OCR 필요 신호**에서 baseline 대비 **명확한 개선**. quote(원문 인용) 충실도도 한글·따옴표 보존 양호.

## DEI → evidence_anchor 매핑 손실 관찰

kordoc 출력 필드는 Document Evidence Index(2I-3 §5) 재료로 직접 활용 가능:

| DEI 재료(kordoc 필드) | → findings `evidence_anchor` | 관찰(손실 여부) |
|---|---|---|
| `blocks[].pageNumber` + `outline`(level/text/page) | `page_or_section` | **양호**. 단 section_path는 block↔outline **근접 매칭으로 조립** 필요(섹션 경계 모호 시 소폭 손실 위험) |
| `blocks[].text` / `table.cells` 발췌 | `quote` | **양호**(원문·표 수치 보존). 장문·저작권 원문 복붙은 별도 정책으로 제한 |
| (source_file) | `source_id` | source_documents 매핑으로 유지 |
| 관련성 서술 | `relevance_note` | kordoc 산출 아님 → **Skill/사람 작성**(정상, 판정 미생성 경계) |
| `qualitySummary.needsOcr`·`ocrCandidatePages`·`pageQuality`·`warnings` | (validator/사람 검수 신호) | **양호** — 저신뢰·이미지 구간을 "확인 불가 → `missing_info`+`customer_questions`"로 전환할 근거 제공 |
| `blocks[].bbox`(좌표) | (대응 필드 없음) | **손실(허용)** — evidence_anchor에 좌표 필드 없음. `page_or_section`으로 축약 |

- **경계 유지 확인**: DEI/kordoc은 **판정을 만들지 않는다.** `needsOcr`/품질신호는 **재료**일 뿐, 최종 판정·근거 선택은 Skill. schema 미변경.

## 종합 판단

**성공(핵심 인테이크 가치 입증) — 단, plugin hard dependency로는 부적합.**

- **가치(성공 근거)**: 표 재구성(49/199개), 결정성(2회 동일), 대용량 안정(156MB·126p 40초), 풍부한 위치/품질/needs_ocr 신호,
  baseline 대비 표·위치·OCR 신호 개선, DEI→evidence_anchor 매핑에 직접 유용, 본체 MIT.
- **hard dependency 부적합 근거(리스크)**:
  1. **Node.js 런타임 필요** — plugin의 stdlib-only(Python) 원칙과 상충.
  2. **PDF 의존성 부담·버전 민감** — `pdfjs-dist` 별도 설치 필수 + **최신 v6 실패, v4.10.x 고정 필요**.
  3. **OCR/formula 기능 egress** — 대용량 ONNX 모델 다운로드 → 비활성 유지 필요.
  4. **전이 의존성/네이티브 바이너리** 라이선스·제출 영향 별도 심사 필요.
  5. 무-egress **하드 차단은 본 환경 미보장** → 사용자 검증 필요.
- **권고**: Kordoc은 **optional/pluggable 외부 인테이크 도구**로만(사용자 로컬, 승인 하). **plugin core에 hard-couple 금지.**
  부재 시 현행 경로(제한 텍스트 추출 + "확인 불가→요청자료") fallback 유지. 도입 여부·범위는 사용자/ChatGPT가 본 evidence로 판단.
- **미완/후속**: 유형3(스캔 전용 비민감 샘플) 확보 후 needs_ocr·저텍스트 재현 재검증, 강제 무-egress 재확인, 전이 의존성 라이선스 정밀 검토.

## Redaction 확인

- 로컬 절대경로·계정·host명·token·API key·password·private key·MCP/client 설정 경로·식별 가능 비공개 파일명 **노출 없음**(유형 라벨/`[REDACTED_LOCAL_PATH]` 치환).
- 샘플 원문 장문 복붙 없음(짧은 발췌·일반화). 샘플 PDF·변환 산출물(JSON/MD)·raw log·`.mcp.json`은 repo에 **미포함**(repo 밖 임시 디렉터리에서만 생성).
- 커밋 전 재스캔 완료: Y
