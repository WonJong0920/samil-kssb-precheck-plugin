# Reference: Python Engine (참고 엔진)

이 폴더는 **참고(reference) 역할만** 한다. 실행 코드를 포함하지 않는다.

## 목적

Samil KSSB Precheck는 **Skill-first** 구조다. 사용자-facing 본체는 Codex Skill(`src/skills/samil-kssb-precheck/`)이며,
일반 사용자가 Python 설치·PATH 설정·CLI 실행기를 의식하지 않도록 설계되었다.

기존 1차 작업물에는 결정적(deterministic) 규칙 기반 Python 파이프라인이 존재한다. 그 구현은
KSSB 항목 구조, 판정 라벨 체계, 근거 앵커 규칙, 고객 질문 생성 방식, DOCX 생성/Word open failure 대응 경험 등
**설계 자산의 출처**로서 가치가 있다. Cycle 1에서는 이 자산을 **문서로 계승**하고, 코드를 신규 repo로
복사·이동하지 않는다.

## 참고 엔진 위치 (read-only, 원본 수정 금지)

```
D:\PrimeBell\AI_Projects\kssb-evidence-gap-auditor
```

주요 참고 파일(원본):
- `src/skills/kssb-evidence-gap-audit/SKILL.md` — 스킬 절차·포지셔닝
- `src/references/kssb_public_disclosure_checklist.json` — KSSB 4개 축 체크리스트
- `src/references/evidence_grading_rules.md` — status enum·근거 앵커 규칙
- `src/pipeline/*.py` — 결정적 파이프라인(intake→normalize→gapmatch→reporting→validate)
- `src/pipeline/docx_report.py` — DOCX 생성(Word open failure·XML sanitizer 경험)
- `src/validate/validate_outputs.py` — 산출물 QA 게이트

## Cycle 1 정책

- 위 코드를 신규 repo로 **복사하지 않았다**(무비판적 복사 금지, Python CLI 회귀 방지).
- 물리 이동하지 않았다(원본은 read-only reference).
- 신규 repo의 사용자-facing 본체는 Python CLI가 아니라 Skill이다.
- 향후 사이클에서 결정적 검증 엔진(regression/reference engine)이 필요하다고 판단되면,
  그때 범위·리스크를 문서화한 뒤 반영 여부를 결정한다(여기서 제안하지 않는다).

자세한 검토 내역은 `docs/reference_review.md`, 의사결정은 `docs/decision_log.md` 참조(개발 기록·의사결정 로그, 저장소 전용).
