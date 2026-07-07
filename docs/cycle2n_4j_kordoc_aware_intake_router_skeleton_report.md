# Cycle 2N-4J — Kordoc-aware Intake Router Skeleton (Implementation Report)

> **성격**: 2N-4I 전략(D91)·Codex 2N-4I design review PASS·2N-4I~4M execution plan addendum review PASS에 따른
> **router skeleton 구현 보고**다. OCR/rasterizer/tesseract.js 실행·설치·다운로드는 수행하지 않았다(2N-4K/4L 범위).
> 이 보고는 Kordoc-first **구현 완료** 선언이 아니다.

## 1. 무엇을 구현했나

`src/intake/runners/document_intake_router.cjs` (신규, Node 내장 모듈만 — 외부 의존성 0):

```text
PDF input           → Kordoc-first enhanced intake 경로 (권장·승인 기반 선택)
HWP/HWPX/DOCX input → 기존 hwp_assisted_runner.cjs로 무변경 위임 (원 argv 그대로)
그 외               → 정중한 범위 밖 안내 (기본 텍스트 검토 계속)
```

PDF 경로의 상태 전이(D91 정책 문장의 코드 표현):

| 상태 | 동작 | exit |
|---|---|---|
| available + approved | 기존 승인 게이트·tool-cache pin·nethook no-egress로 Kordoc intake 실행 방향 진행 | 0 |
| **unavailable** (Node/npm 부재) | PDF 구조 보강을 건너뛴다고 정직 안내 + portable Node B안 승인 절차 표시 + **baseline 수렴** | 4 |
| **declined** (설치/실행 승인 거부) | 승인 안내만 출력(side-effect 0) — 거부해도 기본 검토 계속 명시 | 5/6 |
| **failed** (설치/실행/evidence 실패) | 정직한 실패 안내 + provenance 기록 + **baseline 수렴** (stack/로컬 경로 미노출) | 7 |

## 2. 설계 판단 (왜 이 방식인가)

1. **별도 router 모듈 (기존 runner 무수정)** — 대안이었던 "hwp_assisted_runner.cjs에 PDF 분기 추가"를 기각했다.
   근거: ① 기존 runner는 2N-4D-A Codex PASS 상태이고 Python runner와 **소스 텍스트 parity 테스트**(pin·exit·
   확장자 집합)로 묶여 있어, `.pdf`를 SUPPORTED_EXTENSIONS에 넣으면 reviewed parity가 깨진다. ② Codex addendum
   review의 유일한 2N-4J 리스크 지적이 "HWP-family와 PDF 의미의 우발적 붕괴"(C2N4I4M-OBS-01)였다 — family별
   라우팅 소유권을 별도 모듈로 명시하는 것이 그 지적의 직접 대응이다. 기존 runner에 PDF를 직접 넣으면 여전히
   exit 3(범위 밖)이며, 이는 의도된 소유권 분리로 문서화·테스트했다.
2. **게이트 재구현 금지 — 기존 primitives 재사용** — 승인 게이트·which/detectNode(portable 포함)·
   buildInstallCommand(pin `kordoc@3.13.0+pdfjs-dist@4.10.38`, `--omit=optional`)·buildRunCommand(nethook,
   NETHOOK_MODE=block)·prep_egress/approvals/run_log·buildRunProvenance(요약 실관측+egress 0에만 verified)·
   RunnerError 통제 실패(C2N4D-MAJ-01)를 전부 기존 runner의 export에서 가져온다. router가 자체 pin·자체 exit
   code·자체 정규식을 정의하지 않음을 테스트로 강제했다(드리프트 방지). Kordoc tool-cache는 HWP 경로와 **공유**
   된다(동일 pin·동일 배치 — pdfjs-dist가 PDF 판독의 실질 의존이며 이미 pin에 포함).
3. **Kordoc 실행을 새로 구현하지 않음** — 실행 오케스트레이션은 기존 구조 그대로이고, 이번 사이클 검증은 전부
   mock execFn(실행 0·네트워크 0·실 Kordoc 미실행). PDF에 대한 실 Kordoc 실행 evidence는 2L-3C(PDF 5종 파싱
   no-egress 10/10·결정성)로 이미 존재하며, router 경유 실 실행 evidence는 후속(2N-4K 또는 별도 승인 사이클) 항목.
4. **CLI 계약 동일 유지** — 플래그·exit code를 기존 runner와 동일하게 써서 사용자/Skill 중개 학습 비용과 문서
   부담을 늘리지 않았다. usage 문구와 승인 문구만 PDF 목적(구조 보강)에 맞게 별도 작성(U5 3층 정책 준수 —
   승인 대화에 provider명 명시, 완료 안내에 미노출을 테스트로 강제).
5. **DEI/ingest 무변경** — PDF intake.json은 기존 paginated 계약(pageQuality/qualitySummary 포함)으로 이미
   소비 가능하므로(2L-3C·기존 intake 테스트) ingest에 손대지 않았다(addendum review의 "DEI redesign 금지" 준수).

## 3. 기존 HWP-family 경로 보존

- `hwp_assisted_runner.cjs`·`hwp_assisted_runner.py`·`nethook.cjs`·`prepare_portable_node.ps1` **무수정**
  (git diff에 해당 파일 없음). 기존 스위트 무수정 green: Node runner **39/39**, bootstrap **11/11**,
  Python runner **49/49**, intake **83/83**(스팟).
- router의 HWP-계열 처리는 **위임 1줄**(`R.main(argv, opts)`) — 문구·게이트·exit code 재정의 없음.
  위임 동작은 신규 테스트로 검증(기존 runner 고유 문구가 그대로 나오고 PDF 문구가 섞이지 않음).

## 4. 테스트/검증 결과

| 검증 | 결과 | 선택 이유 |
|---|---|---|
| `node --test tests/test_document_intake_router.test.cjs` (신규) | **21/21** | 이번 변경 표면 그 자체 |
| `node --test tests/test_hwp_assisted_runner_node.test.cjs` | **39/39** | 위임 대상 회귀 방지 |
| `node --test tests/test_portable_node_bootstrap.test.cjs` | **11/11** | 부재 안내가 참조하는 B안 경로 회귀 방지 |
| `python tests/test_hwp_assisted_runner.py` | **49/49** | Python runner 무변경 증명(스팟) |
| `python tests/test_intake_dei_producer.py` | **83/83** | ingest 무변경 증명(스팟) |
| `git diff --check` | clean | 커밋 위생 |

신규 21개 테스트가 닫는 것: family 판별(대소문자 포함)·기존 runner 확장자 집합 불변·runner 직접 호출 시 PDF
여전히 exit 3(소유권 문서화)·HWP-계열 위임 3종(무플래그/check/승인 실행)·PDF unavailable/declined(설치·실행)/
check/설치 승인 분리/설치 실패/실행 성공(nethook 구성·provenance·§7 완료 문구·한국어 파일명)/실행 실패/evidence
통제 실패(in-process + **CLI subprocess** — stack·로컬 경로 미노출)/repo 내부 out-dir 경고/require 경계
(node: 내장+기존 runner만)/자체 pin·상수 부재. 전부 mock — 실행 0·설치 0·네트워크 0.

## 5. 범위 준수

OCR/tesseract.js 구현·rasterizer spike·package 설치·Kordoc 재설치·portable Node 다운로드·npm install·
실 OCR/rasterizer/tesseract 실행·외부 다운로드·schema/validator/renderer/delivery/Skill 변경·findings 로직 변경·
DEI 계약 재설계·output_sha256 구현·confidence 구현·2N-5 실행·submission.zip·generated output·원본 문서 추가·
raster PNG 생성 — **전부 미수행**. repo에 package.json/lock/node_modules/tool-cache/artifact 미유입.

## 6. 2N-4K carry-forward

- 실 다운로드·설치·tool-cache 변경·runtime spike 전에 **사용자 명시 승인**(evidence 사이클 프레이밍 — addendum §2N-4K).
- rasterizer 후보(1순위 @napi-rs/canvas)·수용 기준·**native 수용 시 Gate B 재검토**. PyMuPDF는 제품 경로 금지 유지.
- tesseract.js/tesseract.js-core pin 재관측·traineddata 출처(raw.githubusercontent.com 계열) 고지·hash pin·
  cache 위치·제거 방법·prep egress 기록·실행 no-egress 분리·오염 스캔.
- page cap/batch/timeout 기본값의 실측 근거 수집.
- (선택) router 경유 PDF 실 Kordoc 실행 evidence — 2L-3C의 직접 실행 evidence를 router 표면으로 재확인.

## 7. 2N-4L/4M 주의 항목

- **4L**: selected_pages 계약(mixed/scan-only/user-range=needsOcr 부분집합)·bounded 실행·scratch 체크포인트·
  **원자적 ocr_text.json 1회 방출**·output_sha256 Node+Python golden parity(blocking test — C2N4I-OBS-04)·
  confidence=additive 기록만·raster PNG artifact 방어 결정(C2N4I4M-OBS-03). OCR 경로 승인은 U7 분리(HWP·PDF
  구조 판독 승인과 별개 대화 — traineddata 제3 출처 고지 포함). router의 PDF 완료 문구("OCR은 실행되지 않습니다
  — 별도 단계 예정")는 4L 구현 시 실제 상태에 맞게 갱신 필요.
- **4M**: quickstart matrix(텍스트 PDF 행 "승인 불필요 — 기본 경로" → Kordoc-first 권장·승인 기반으로)·README·
  current_status·SKILL/§6/ladder 문구 일괄 갱신 + no-overclaim 리뷰 + 2N-5 재진입 판단(addendum §2N-4M gate).
  Python runner에는 PDF 라우팅을 추가하지 않았다(reference 지위 — D85④/D87⑤ 기조) — 4M에서 지위 재확인.

## Final Report

- **변경 파일** (5건):
  - `src/intake/runners/document_intake_router.cjs` (신규 — router skeleton, 내장 모듈만)
  - `tests/test_document_intake_router.test.cjs` (신규 — 21 tests)
  - `src/intake/runners/README.md` (router 항목 추가 + 제목 보정 — 최소)
  - `docs/cycle2n_4j_kordoc_aware_intake_router_skeleton_report.md` (본 보고)
  - `docs/current_status.md` (2N-4J 완료·다음=Codex 리뷰 — 최소)
- **구현 요약**: family 판별·라우팅 소유권을 갖는 별도 router 모듈. PDF=Kordoc-first enhanced intake(권장·승인
  기반), HWP-계열=기존 runner 무변경 위임, 그 외=정중한 범위 밖. unavailable/declined/failed 전부 baseline
  fallback 수렴(정직한 안내 — 실패 은폐 없음).
- **설계 판단**: §2 (별도 모듈로 의미 붕괴 방지·게이트 재구현 금지·Kordoc 실행 신규 구현 없음·CLI 계약 동일·
  ingest 무변경).
- **기존 HWP-family 경로 보존**: §3 — runner 4파일 무수정, 기존 스위트 무수정 green.
- **PDF/Kordoc-first skeleton 처리**: §1 표 — 기존 승인 게이트·pin·nethook·provenance 재사용, PDF 전용 승인/
  안내 문구(구조 보강 목적 명시·OCR 미실행 고지).
- **fallback 처리**: unavailable=exit 4+B안 절차+baseline 안내 / declined=exit 5·6(side-effect 0) /
  failed=exit 7(정직 provenance·stack 미노출) — 모두 "기본 텍스트 기반 검토로 계속" 문구로 수렴.
- **테스트/검증**: §4 — 신규 21/21 + 회귀 39/39·11/11·Python 스팟 49/49·83/83, `git diff --check` clean.
- **범위 준수**: §5 — OCR/rasterizer/설치/다운로드/스키마 변경 전부 미수행.
- **2N-4K carry-forward**: §6. **2N-4L/4M 주의**: §7.
- **decision_log**: 갱신하지 않음 — 이번 사이클은 D91 ⑨(2N-4J=router skeleton)의 실행이며 새 의사결정이 없다.
- **다음 권장 단계**: **Codex 2N-4J implementation review** (2N-4K 준비·착수는 리뷰와 사용자 승인 이후).
- commit SHA는 채팅 보고에 기재.
