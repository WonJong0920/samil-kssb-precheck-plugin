# Cycle 2M-5 — Output Quality Remediation Notes

> 2M-3A(Codex)·2M-3B(Claude) 품질 리뷰의 수정 후보를 **어느 층에서** 보정했는지 기록한다.
> runner/provider/assisted path는 구현하지 않음(2N 분리). 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`.

## 보정 원칙

2M-3B의 진단대로 대부분의 결함은 **findings 작성 품질**(렌더러는 넣어준 것을 충실히 변환)이므로, 1차 보정층은
**Skill 지침(evidence_mapping_rules §7 신설 + SKILL.md 포인터)**이다. 기계적으로 감지 가능한 것 1건(중복 인용)만
validator에 **detect-only warning**으로 추가했고, 코드 결함이 실재한 것 1건(user_summary 중복 문구)만 delivery를 수정했다.

## 항목별 보정 위치

| 항목 | 보정 층 | 내용 |
|---|---|---|
| B1 커버리지 침묵 | **Skill 지침** (§7 + SKILL 절차 8단계 신설) | 텍스트 미추출/판독 불가/미지원 구간을 `overall_limitations`에 **문서별 실수치로** 명시 의무화("총 359p 중 35p 미추출…" 예시 포함). 스키마·렌더러 무변경(기존 overall_limitations 렌더 경로 사용) |
| R1 영문 내부 문자열/provider명 | **Skill 지침** (§7) + SKILL 금지표현 절 | 사용자-facing 필드에 내부 도구/제공자명·영문 상태 문자열 금지, 한국어 표준 문구 3종(스캔 전용/zero-text 혼재/형식 미지원) 제공 |
| R2 인용-요구 적합성 | **Skill 지침** (§7) + **validator warning** | 문장 경계 단위·목차 점선/표 머리글/제목 조각 단독 금지·항목 간 동일 인용 재사용 금지(없으면 not_verifiable). 재발 감지용 `evidence.duplicate_quote_reuse` **warning**(detect-only — 재사용이 항상 오류는 아니므로 error 아님) |
| R3 테스트 하네스 어휘 | **Skill 지침** (§7) + SKILL 금지표현 절 | 사이클명·Track·"샘플 자동 산출 테스트"류를 사용자-facing 텍스트에서 금지(내부 로그/evidence 전용) |
| R4 질문사유 상황 일치 | **Skill 지침** (§7) | partial용/not_verifiable용 사유 문구 분리·교차 사용 금지(각 표준 문구 제시) |
| R5 검토 범위 명시 | **Skill 지침** (§7 + SKILL 8단계) | "카탈로그 중 N항목 검토" 1줄 의무화 |
| P1 user_summary 중복 | **delivery 코드** (+회귀 테스트) | `human_review_boundary` 존재 시 같은 취지의 일반 문구 생략(중복 조립이 코드에 실재 — Skill 지침으로 해결 불가한 유일 항목). `tests/test_delivery_wiring.py`에 회귀 체크 추가 |

## 수정하지 않은 항목과 이유

- **P2 근거설명·권고 개별화**: §7의 사유-상황 일치·인용 품질 규칙이 원인(보일러플레이트 작성)을 이미 커버 — 별도 강제 로직은 과잉(LLM 작성 품질 문제라 코드 검증 불가).
- **P3 위치 힌트 섹션 병기**: 기존 convention(`p.N · 섹션`)이 이미 문서화되어 있고, outline 가용성에 의존 — 규칙 추가 없이 기존 규칙 준수 문제.
- **P4 인용 내 U+200C 정규화**: quote 검증 정규화(F1과 동일 뿌리)와 함께 다뤄야 일관적 — 2N/후속으로 이월.
- **F1(HFG 앵커 불일치)·F2(카탈로그 확장 품질)·F3(Word 실개봉)**: 검증·확장 실행이 필요한 항목 — 이번 사이클 범위(보정) 밖, 별도 확인 항목 유지.
- **renderer 수정 없음**: 렌더 결함이 관찰되지 않았음(HTML/DOCX/MD 구조 건전) — §7 지침이 지켜진 findings는 현행 렌더러로 충분.

## 2N으로 넘긴 항목

D1(aux_structure/ocr_supplement 실활용 데모)·D2(Track B 재실행·비교)·D3(provider명 표기 정책) + Codex 2M-3의 assisted-needed 5개 파일 재실행.

## 검증

- validator 26→**30/30**(중복 인용 warning 검출·error 아님 확인·valid example 무-warning 포함), delivery 33→**34/34**(중복 문구 회귀 체크), renderer 22, intake 56, aux 26 — **전부 green**.
- 스키마 무변경(§7은 기존 필드 사용 지침), manifest/marketplace/package 무변경, runner/provider/OCR 미구현·미실행.
