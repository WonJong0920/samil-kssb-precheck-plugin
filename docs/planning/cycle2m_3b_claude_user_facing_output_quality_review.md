# Cycle 2M-3B — Claude 사용자-facing 보고서 품질 검수 (Autonomous Review)

> **성격**: Codex 2M-3 생성 산출물에 대한 Claude Code의 **독립 품질 검수 문서**. PASS/FAIL 판정 없음 — 수정 후보를 분류만 한다.
> 코드/테스트/Skill/renderer 수정 없음, 보고서 재생성·원본 재파싱·OCR 실행 없음. 산출물은 repo 밖(`<LOCAL_SAMPLE_OUTPUT_DIR>`)에 두고 관찰만 기록.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`.

## 검수 범위

- 산출물 위치: `<LOCAL_SAMPLE_OUTPUT_DIR>` (cycle2m_3_20260705_232512). **authoritative = `_utf8` 디렉터리와 `report_generation_results_utf8.*`**(비UTF-8 1차 산출물은 superseded — 검수 제외).
- 8개 샘플 전부의 `_utf8` 산출물(findings.json·validator_issues·delivery_user_summary·delivery_internal·reports MD/HTML/DOCX)을 직접 열람.
  대표 심층 정독: 04_HFG(MD 전문+HTML 전문), 03_scanned(MD 전문), 06_HWP(핵심 절), 01_동서발전·02_SMReport·08_textrater(findings 인용 전수 + §6).
- 교차 자료: `quote_verification_utf8.json`(8파일 20앵커), manifest, Codex 2M-3 리뷰, DOCX 1건 독립 검증(zip+document.xml 파싱 OK).
- 관점: "컨설턴트가 이 초안을 받았을 때", "심사자가 데모 산출물로 봤을 때" — 체크리스트가 아니라 실제 독해 기준.

## 사용한 산출물

README_FOR_CLAUDE.md · baseline_measurement_manifest.md/json · report_generation_results_utf8.md/json · quote_verification_utf8.json · assisted_path_evidence.md · 8×`_utf8/`(findings/validator/delivery/reports).

## 전체 품질 판단 (판정 아님 — 종합 관찰)

**파이프라인 품질과 안전 경계는 사용자-facing에서도 잘 작동한다** — 8/8 렌더 성공, validator error 0, 경계 고지 3중 유지, 스캔/HWP에서 인용 조작 없음, 확인 불가→질문 연결 정상, 절대경로 사용자 노출 0, HTML/DOCX 구조 건전.
그러나 **"보고서 내용의 신뢰 서사"에는 실사용 전 반드시 고칠 결함이 있다**: ① 검토되지 않은 페이지가 있다는 사실이 사용자에게 보이지 않고(커버리지 침묵), ② 내부용 영문 사유 문자열이 그대로 노출되며, ③ 근거 인용의 선택 품질(중복 재사용·목차 점선·표 헤더 뭉침)이 "검증된 인용 ≠ 의미 있는 근거"임을 드러낸다. 이 결함들은 renderer/validator 결함이 아니라 **findings 작성(생성 프롬프트/절차) 품질 문제**다 — 파이프라인은 넣어준 것을 충실히 렌더했다.

## 파일별 주요 관찰

| 파일 | 산출 | 사용자-facing 관찰 |
|---|---|---|
| 01 동서발전(359p) | partial×4 | **35개 zero-text 페이지 사실이 보고서 어디에도 없음**(§6은 8파일 공통 보일러플레이트). 인용 품질 나쁨: "(1) 전략기획····…"(목차 점선줄)이 전략 근거, "’19년 실적’20년 목표’20년 실적"류 표 헤더 뭉침, 문장 중간 절단(➞·｢ 잘림) |
| 02 SMReport(126p) | partial×4 | 인용에 문장 절단·특수문자(U+200C zero-width non-joiner) 포함. zero-text 1페이지 미고지 |
| 03 scanned(9p) | not_verifiable×4 | 라우팅·라벨·우선순위(상) 정상, 인용 조작 없음 — **경계 동작은 모범적**. 단 사유가 `tesseract.js OCR needed for scanned/image-only PDF` **영문 내부 문자열 그대로**. 질문사유는 partial용 보일러플레이트를 재사용해 상황과 불일치("확인된 근거만으로는…" — 근거가 0인데) |
| 04 HFG(53p) | partial×4 | **gov-01과 strat-01이 동일 인용("위험 및 기회에 관한 관리·감독 기구", p.3) 재사용** — 거버넌스 인용이 전략 근거로 등장(적합성 문제). metric-01 인용 "(1) 온실가스 배출에 대한 조직경계"는 20앵커 중 유일한 검증 불일치 + 제목 조각이라 근거 실질도 약함. zero-text 1페이지 미고지 |
| 05 docx / 07 hwpx | partial×2 | 텍스트 경로 정상. **aux_signals.json이 생성됐으나 findings/보고서에 전혀 반영 안 됨**(aux_structure/ocr_supplement 미사용) — L2 ingest 기능의 가치가 산출물에서 안 보임 |
| 06 HWP v5 | not_verifiable×4 | unsupported 정직 처리 좋음. 단 사유가 `Kordoc needed for HWP v5 baseline unsupported` **영문+provider명 노출**. "이 파일 형식은 현재 자동 판독 미지원"이라는 한국어 설명 부재 |
| 08 textrater(11p) | partial×4 | 경로 정상. 인용 일부가 표 셀 뭉침("’19년 실적’20년 목표’20년 실적") |

공통: user_summary의 "사람 검수 안내"에 거의 동일한 두 문장이 연속 출력(경어체+평서체 중복 — delivery 보일러플레이트와 findings boundary 문구의 중복 조립). 위치 힌트는 `p.N`만(섹션 없음 — convention은 `p.N · 섹션` 지원). 항목 수가 카탈로그 대비 4개(영역당 1개)인데 **몇 항목 중 몇을 검토했는지 보고서에 없음**.

## 사용자-facing 관점의 핵심 문제 (우선순위순)

1. **커버리지 침묵**: 동서발전 보고서를 받은 컨설턴트는 문서의 ~10%(35p)가 검토조차 되지 않았음을 알 수 없다. "일부 근거 확인"이 전체 문서 검토 결과처럼 읽힌다. 신뢰(오판 유발) 문제 — Codex가 지적한 "mixed PDF가 처리된 것처럼 보임" 리스크가 사용자 문서에서 실제로 실현됨.
2. **내부/영문 문자열 노출**: `tesseract.js OCR needed…`·`Kordoc needed…`가 한국어 컨설팅 보고서의 "부족 정보/사유"에 그대로. 영문·기술어휘·**pending 상태인 provider명**이 사용자 문서에 노출.
3. **인용 선택 품질**: "검증됨(원문에 존재)" ≠ "근거로 유의미". 목차 점선·표 헤더 뭉침·문장 중간 절단·타 영역 인용 재사용(HFG gov→strat)이 근거로 제시되면 검증 통과와 무관하게 **컨설턴트 신뢰를 깎는다.**
4. **테스트 하네스 어휘 노출**: 제목("Cycle 2M-3 샘플 테스트 초안")·§6("Track A"·"smoke/deep-review")·근거 설명("샘플 자동 산출 테스트에서…")·질문사유. 이번 사이클에선 정직한 표기지만, 블랙박스/제출 데모에서 이 어휘가 남으면 안 된다.
5. **검토 항목 수 미고지**: 카탈로그 전체 대비 4항목(영역당 1개)만 검토했다는 사실이 명시되지 않음 — "사전검토 보고서"의 범위가 과대해석될 수 있음.
6. **한계 절(§6)의 비개별화**: 8개 파일이 동일한 일반 문구 — 파일별 실한계(35p 미추출/스캔 전체/HWP 미지원)가 §6에 반영 안 됨(1번의 원인).

## 수정 후보 분류

**Blocker candidate**
- (B1) 커버리지 침묵 — zero-text/미검토 페이지 수를 `overall_limitations`(또는 항목 missing_info)에 문서별로 명시. *renderer는 이미 overall_limitations를 렌더하므로 findings 작성만으로 해결 가능(코드 무변경).*

**Required before black-box test**
- (R1) 부족 정보/사유의 영문 내부 문자열 → 한국어 사용자 문구로("스캔/이미지 기반 PDF로 텍스트 레이어가 없어 자동 판독 불가" 등), provider명은 사용자 보고서에서 제거.
- (R2) 인용-요구 적합성 규칙: 서로 다른 항목에 동일 인용 재사용 금지(적합 인용 없으면 그 항목은 확인 불가로), 인용은 문장 경계 단위·목차/표머리 조각 배제.
- (R3) 테스트 하네스 어휘(사이클명·Track·테스트 절차 설명) 제거된 findings 작성 지침 — 블랙박스용 표준 문구 세트.
- (R4) not_verifiable용 질문사유 문구 분리(현재 partial용 재사용으로 상황 불일치).
- (R5) 검토 범위 명시: "카탈로그 N항목 중 M항목 검토" 1줄(§1 또는 §2).

**Polish before submission**
- (P1) user_summary 사람 검수 안내 중복 문장 정리(경어체/평서체 1개로).
- (P2) 근거 설명·보완 권고의 항목별 개별화(현재 동일문 반복 — 기계적 인상).
- (P3) 위치 힌트에 섹션 병기(`p.N · 섹션`) — outline 가용 시.
- (P4) 인용 내 zero-width 문자(U+200C) 정규화 여부 검토(quote 검증 정규화와 함께).

**Defer to 2N runner/provider cycle**
- (D1) aux_structure/ocr_supplement의 실제 활용 데모(현재 생성만 되고 미반영) — assisted 흐름과 함께 자연스러움.
- (D2) 스캔 PDF·HWP·zero-text 페이지의 실제 텍스트화(Track B) 및 그 후 재생성 비교.
- (D3) provider명 표기 정책(사용자 문서 vs 내부 로그)의 확정 — runner 설계와 함께.

**Further review needed**
- (F1) HFG metric-01 인용 "(1) 온실가스 배출에 대한 조직경계" 검증 불일치 1건 — 이번 사이클은 원본 재파싱 금지라 원인(공백/번호 정규화로 추정) 미확정. 별도 확인 필요.
- (F2) 4항목 외 카탈로그 항목으로 확장 시 인용 선택 품질이 유지되는지(항목 수가 늘면 3번 문제가 증폭될 가능성) — 확장 샘플 1회 필요.
- (F3) DOCX를 실제 Word에서 열어 서식(표 폭·인용 블록) 확인 — XML 파싱 OK는 확인했으나 시각 확인은 사람 몫.

## 2M에서 고칠 항목

- B1·R1~R5 전부 — **모두 findings 작성(생성 절차·문구) 수준이라 renderer/validator/schema 코드 무변경으로 가능**. P1만 delivery 조립 검토가 필요할 수 있음(중복 문장의 출처 확인 후).

## 2N runner/provider cycle로 넘길 항목

- D1~D3 + Codex 2M-3가 이미 명시한 Track B 재실행(5개 assisted-needed 파일).

## 추가 확인이 필요한 항목

- F1(HFG 인용 1건 원문 대조), F2(카탈로그 확장 시 품질), F3(Word 실개봉 확인) — 이후 별도 프롬프트로 요청 예정.

## 메타

- 코드 수정: No · 보고서 재생성: No · 원본 재파싱/OCR: No · 산출물 repo 복사: No.
