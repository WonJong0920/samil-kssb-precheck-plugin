# Cycle 2L-3D — HWPX/DOCX Auxiliary Structure Scanner Review

> **성격**: 보조 구조 스캐너 **검토 evidence**(L2 구현 아님·provider 최종 확정 아님·제품 코드 미추가).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Codex 2L-3C 리뷰 **PASS**(`docs/reviews/codex_cycle2l_3c_provider_comparison_review.md`) follow-up #4 — "DOCX 이미지 감지·HWPX heading gap·caption 지원을 adapter 설계 시 검토할 known limitation으로 취급하라."
> 모든 실행·설치는 repo 밖(스캐너 스크립트·venv 포함). repo에는 본 문서만. 원문/raw XML/추출 이미지 미기재·미커밋(집계·hash만).

## Summary

Kordoc+tesseract.js provisional 구도에 **stdlib zip+xml 보조 스캐너를 auxiliary layer로 추가하는 것이 타당**하다는 결론이다(확정 아님·Codex Review 대상).
실측: stdlib만으로 ① **DOCX 이미지 감지 gap을 완전 보강**(Kordoc image 블록 0 vs 실제 drawing/pic 70 — relationship 71·media 14까지 3계층 분해),
② **표 수 불일치를 해명 가능한 신호로 전환**(raw 태그 30/32 vs Kordoc 25 = **중첩 표 5개** + HWPX 잔여 2), ③ **caption 후보 164개 발견**("표 제목" 스타일 문단 —
Kordoc·python-docx 모두 비가시), ④ **HWPX heading gap의 실체 규명**(개요 스타일 15종이 정의만 되고 본문 문단 사용 0 → Kordoc "heading 0"은 이 샘플에선 사실상 정확;
스타일→문단 매핑 기제 자체는 작동). **python-docx는 비권장**: lxml native 바이너리(.pyd 7개)를 강제 수반하고(RH-B2가 격리해온 native 클래스),
inline_shapes가 과소 계수(68 vs 70)이며 HWPX 미지원 — stdlib이 의존성 0으로 모든 신호에서 동등 이상. 스캔은 결정적(2회 hash 동일)이고 네트워크 코드 경로가 없다.

## Scope

- **한 것**: sample 폴더의 HWPX/DOCX 2종에 대해 stdlib zip+xml 심층 스캔(2회)·python-docx 실측(repo 밖 venv)·Kordoc 3.13.0 결과(2L-3C 산출물)와 3자 대조·auxiliary signal model 설계.
- **안 한 것**: L2 구현·provider 최종 확정·제품 코드/의존성 추가·schema/validator/renderer/delivery 연결·MCP·package/lock/requirements 변경·KSSB 판단 생성.

## Source-of-truth reviewed

`chatgpt_coordination_workflow.md`·Codex 2L-3C 리뷰(PASS+follow-up)·`provider_document_analysis_comparison_2026-07-04.md`·current_status·decision_log·submission_packaging_policy·`.gitignore`(+ read-only: `dei_producer.py`, `evidence_mapping_rules.md`).

## Samples

| sanitized name | SHA-256(16) | 2L-3C 기록과 일치 |
|---|---|---|
| HWPX 샘플 | `094b9df5928d9fba` | ✔ |
| DOCX 샘플 | `9567636d8d91e5e5` | ✔ |

(동일 원문서의 포맷 변환 계열로 추정 — 표/이미지 카운트가 상호 정합. 원본은 repo 밖·미커밋.)

## Baseline from 2L-3C (Kordoc 3.13.0)

| | HWPX | DOCX |
|---|---|---|
| blocks | 175 (para 80·image 70·table 25) | 103 (para 78·table 25) |
| heading/outline | **0** | **0** |
| image 블록 | 70 | **0 (gap)** |
| table | 25 (셀 559) | 25 (셀 559) |
| caption | 없음 | 없음 |

## stdlib zip+xml feasibility

**결론: 적합(권장).** Python 표준 라이브러리(zipfile·xml.etree·re·json·hashlib)만으로 아래를 안정 추출:

| 신호 | HWPX 실측 | DOCX 실측 |
|---|---|---|
| image 리소스(BinData/media 파일) | **14**(png 13·bmp 1) | **14**(png 13·bmp 1) |
| image relationship | (해당 구조 없음) | **71** |
| image 인스턴스(`hp:pic`/`w:drawing`) | **71** | **70**(pic·blipFill 70 동수) |
| table 태그 총수 / top-level / **중첩** | 32 / **27** / **5** | 30 / **25** / **5** |
| heading 스타일 정의(개요·제목류) | **15종**(개요 2~10·제목1·1. 제목 등) | 6종 + **캡션 스타일 존재(사용 0)** |
| 개요(outline) 스타일 본문 문단 | **0** | (아래 caption 참조) |
| **"표 제목" 스타일 문단(caption 후보)** | **164** | **164**(pStyle 78) |
| chart relationship / chart part | 0 | 0 / 0 |
| 도형류(rect/drawText/line) | 8/8/2 | (AlternateContent 미출현) |
| 스캔 결정성 | **2회 SCAN_SHA `e547efcb…` 동일** | 동일 파일에 포함 |

- 리소스(14) ≠ relationship(71) ≠ 인스턴스(70~71)의 3계층 분해가 가능 — 파일 재사용(중복 배치)까지 식별된다.
- XML 파싱은 로컬 zip 멤버만 읽으며 사용 모듈에 네트워크 코드 경로가 없다(추가 egress 자체가 불가한 구성).

## python-docx feasibility

**결론: 제품 경로 비권장(개발 시 교차검증 용도 이상 아님).** python-docx 1.2.0 실측(repo 밖 venv):
- top-level 표 **25**(Kordoc·stdlib과 3자 일치), 셀 564, 첫 표 5×3 — 표 검증엔 유효.
- **inline_shapes = 68(PICTURE)** — stdlib 70 대비 **과소 계수**(floating/anchored 도형 누락).
- `document.paragraphs`가 **본문 레벨만** 순회 → 표 셀 내부의 "표 제목" 문단 164개가 **비가시**(별도 순회 코드 필요).
- **의존성**: lxml 6.1.1 강제 수반 — **native `.pyd` 7개**(이 프로젝트가 RH-B2로 격리해온 native 클래스이며, 2L-3B에서 onnxruntime native DLL 실패 전례). HWPX 미지원.
- license: python-docx MIT·lxml BSD(permissive)이나 native 리스크가 stdlib 대비 정당화되지 않음.

## Other candidate tools or better implementation approaches

- **defusedxml**(PSF, pure-python): 신뢰할 수 없는 문서의 XML 파싱 시 entity-expansion류 방어 보강 — L2 adapter 설계 시 **선택적 하드닝 검토 후보**로만 기록(현 스캔은 로컬 비민감 샘플이라 미적용).
- **lxml 직접 사용·docx2python**: 둘 다 native lxml 계열 → 동일 사유로 비권장.
- **olefile**(HWP v5): 본 사이클 범위 밖(HWP v5는 Kordoc 유일 대응 유지).
- **더 나은 구현 방식**: 별도 도구 도입보다 **stdlib 스캐너를 L2 adapter의 out-of-core 보조 모듈로 설계**(기존 `src/intake/dei_producer.py`와 같은 stdlib-only·opt-in·core 미접속 패턴)하는 것이 최적 — 신규 공급망 0.

## HWPX gap analysis

- **heading 0의 실체**: 개요(outline) 스타일 15종이 **정의**돼 있으나 본문 문단이 **사용 0**(표 제목 164·기타 제목류 1) → Kordoc의 heading 0은 **이 샘플에선 결손이 아니라 사실**. 단 스타일→문단 매핑 기제는 작동하므로, 개요 스타일을 실제 쓰는 문서에서는 **heading 복원 후보**가 성립한다(스타일 정의 수 + 해당 문단 수를 신호로 제공).
- **표 불일치**: top-level 27 vs Kordoc 25 → **잔여 2는 미해명**(도형 컨테이너 내 표 등 추정) = `review_required` 신호로 남김. 중첩 5는 해명 완료.
- **이미지**: 인스턴스 71 vs Kordoc 70 — 잔여 1(헤더/도형 내 추정), 경미.

## DOCX gap analysis

- **이미지 gap 보강 확정**: Kordoc image 블록 0이지만 stdlib이 drawing/pic/blipFill **70**·relationship **71**·media **14**를 감지 — gap이 **결정적으로 계측·보고 가능**.
- **표 불일치 해명 완료**: top-level **25 = Kordoc 25 정확 일치**, +중첩 5 → 불일치는 결손이 아니라 **집계 기준 차이**(중첩 표 존재 신호로 전환).
- **caption**: "캡션" 스타일이 정의돼 있으나 사용 0, SEQ 필드 0 — 실제 caption 관행은 "표 제목" 스타일 문단(164)으로 구현돼 있음 → 스타일 기반 caption 후보 추출이 유효.

## Image/table/chart/caption signal comparison

| 신호 | Kordoc 3.13.0 | stdlib zip+xml | python-docx |
|---|---|---|---|
| DOCX 이미지 | 0 (gap) | **70 인스턴스·71 rels·14 리소스** | 68 (과소) |
| HWPX 이미지 | 70 | 71 | 미지원 |
| 표(top-level) | 25/25 | 27/25(+중첩 5/5) | 25(DOCX만) |
| caption 후보 | 없음 | **표 제목 문단 164 + 스타일 존재 신호** | 비가시(본문 순회 한계) |
| chart | 없음 | rels·parts 0 확인(도형류 8/8/2는 별도 신호) | 미확인 |
| heading | 0 | 스타일 정의 15/6종 + 사용 문단 분해(개요 0·표제목 164·기타 1) | 스타일 히스토그램(본문만) |

## Determinism / no-egress / license / artifact safety

- **결정성**: stdlib 스캔 2회 `SCAN_SHA256 e547efcb0a24538df5c9` 동일(정렬 키 직렬화). python-docx 집계도 재현 가능(`9c88727f…`).
- **no-egress**: stdlib 스캔은 네트워크 모듈 자체를 import하지 않음(zipfile/ElementTree/re/json/hashlib — egress 코드 경로 부재). python-docx 실행은 로컬 라이브러리 호출이나 **별도 차단 훅 미적용 → not verified**로 정직 기록(2L-3C의 PyMuPDF와 동일 취급).
- **준비 egress(기록)**: `pip install python-docx`(files.pythonhosted.org, ~2026-07-05T02:59Z, repo 밖 venv — python-docx 1.2.0·lxml 6.1.1·typing_extensions). **stdlib 경로는 설치 zero(egress 불필요)**. project package/lock/requirements/source **무변경**.
- **license**: stdlib=PSF(추가 의무 없음) / python-docx MIT·lxml BSD+native / defusedxml PSF(후보만).
- **artifact**: 스캐너 스크립트·venv·raw XML·추출물 전부 repo 밖. repo tracked 신규 artifact 0. 문서엔 집계·hash만(스타일 "이름"은 구조 메타로서 기재하되 본문 내용·개인정보 없음).

## DEI candidate vs review-signal suitability

- **DEI candidate로 보낼 수 있는 것(결정적 사실·재료)**: image 리소스/relationship/인스턴스 수, top-level/중첩 표 수와 치수, caption 후보 문단의 **위치 힌트**(사람 읽기용 `섹션·표 인접` 수준), heading 스타일 정의·사용 수. 모두 판정 아님 — Skill이 재료로만 소비.
- **review-signal(gap/불일치 플래그)로만 둘 것**: `image_detection_gap`(provider 0 vs 실측 70), `table_count_mismatch`(HWPX 잔여 2), `heading_styles_defined_but_unused`, `provider_caption_absent_but_candidates_exist`. → 기존 `not_verifiable`/`missing_info`/검수 우선순위 경로로만 라우팅, **판정 직접 매핑 금지**.
- **금지 유지**: 스타일 이름·도형 수로 의미/차트 수치/KSSB 충족을 추정하지 않음. renderer/validator 직접 유입 금지(기존 DEI 경계·테스트 패턴 그대로).

## Proposed auxiliary signal model (설계 제안 — 구현 아님)

```text
aux_structure_signals (문서 수준, 결정적, 판정 없음):
  image_resource_count        # zip 내 미디어 파일 수 (HWPX 14 / DOCX 14)
  image_relationship_count    # DOCX rels image 수 (71)
  image_instance_count        # 배치 인스턴스 수 (hp:pic 71 / w:drawing 70)
  image_detection_gap         # provider_image_blocks - image_instance_count ≠ 0 → flag
  table_tag_count             # raw 태그 총수 (32 / 30)
  table_top_level_count       # 중첩 제외 (27 / 25)
  nested_table_count          # (5 / 5)
  table_count_mismatch        # provider_table_count - table_top_level_count ≠ 0 → flag(잔여만)
  heading_style_candidate_count   # 정의된 개요/제목류 스타일 수 (15 / 6)
  heading_recovery_candidate      # 개요류 스타일 사용 문단 수 (0 — 정직 보고)
  caption_candidate_count         # 표 제목/캡션류 스타일 문단 + SEQ (164)
  chart_relationship_count        # (0) + 도형류 카운트는 figure_proxy로 별도
  review_required_reason[]        # 상기 flag의 근거 열거 (자유텍스트, 판정 아님)
```

- 산출 위치 제안: L2 adapter의 **out-of-core 보조 모듈**(stdlib-only)이 DEI candidate의 선택 필드(문서 수준)로 병합 — findings 스키마 불변, bbox/원문 미포함.

## Provisional recommendation (확정 아님)

- **채택 권고(검토 의견)**: `Kordoc(주 추출) + tesseract.js(스캔 OCR fallback) + stdlib zip+xml 보조 스캐너(HWPX/DOCX cross-check·gap 신호)` — 신규 공급망 0·결정적·no-egress 우위.
- **비권고**: python-docx(네이티브 lxml 수반·과소 계수·HWPX 미지원·부가 신호 없음). defusedxml은 L2 설계 시 하드닝 후보로만.
- 이 권고는 auxiliary layer 구도에 한정되며 **provider 최종 확정이 아니다**(Kordoc 3.15.0 source-aligned 재비교 등 기존 follow-up 유지).

## Required follow-up before L2 implementation

1. 본 문서 **Codex Review**.
2. L2 implementation-prep(승인 후)에서 aux signal model의 DEI 선택 필드 매핑·경계 테스트 설계(스키마 불변 확인 포함).
3. HWPX 잔여 표 불일치 2건의 원인 분류(도형 내 표 등) — prep 단계 확인 항목.
4. 개요 스타일을 실제 사용하는 HWPX 샘플 1종으로 heading 복원 신호 재검증(현 샘플은 사용 0이라 미검증 영역).
5. defusedxml 하드닝 필요성 판단(신뢰 경계 정의와 함께).

## Recommended next step

- Codex Review → 사용자/ChatGPT 승인 시 **L2 implementation-prep**(Kordoc+tesseract.js+stdlib aux 구도, 가역적 adapter 경계로 설계). L2/L3 실제 구현·provider 최종 확정은 계속 금지.
