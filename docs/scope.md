# 범위 (Scope) — Cycle 1

## Cycle 1 목표
완성형 실행 제품이 아니라 **해커톤 제출 가능한 1차 골격**을 만든다.

- 설계문서 작성
- Codex Skill 골격 생성
- 해커톤 제출 구조에 맞는 기본 repo 구조 구성
- 기존 1차 작업물 검토 및 참고 자산 정리
- 제품 경계와 Codex 검증 기준 문서화

## KSSB 4대 영역 MVP 범위
Cycle 1의 KSSB 범위는 4대 영역 MVP로 제한한다.

1. 거버넌스
2. 전략
3. 위험관리
4. 지표 및 목표

- KSSB 전체 조문을 세부 구현하지 않는다.
- 4대 영역별 사전검토 구조, 판정 체계, 근거 매핑 원칙, 고객 질문 생성 원칙을 고정하는 것이 목적이다.
- 상세 항목은 `src/skills/samil-kssb-precheck/kssb_requirement_catalog.md` 참조.

## 이번 사이클에서 하지 않는 것
- 샘플 고객사 선정(미정으로 둔다).
- 실제 고객사/공개 보고서 임의 다운로드.
- 실제 DOCX 생성 코드 구현.
- 실제 HTML 생성 코드 구현.
- Hook 추가.
- MCP 서버 추가.
- Python CLI 중심 실행 구조 설계(Skill-first 유지).
- 기존 Python 파이프라인의 무비판적 복사·이동.
- 기본 사용자 흐름에서 JSON/CSV/manifest 산출물 요구.
- `_검토근거` 폴더 기본 생성.
- 최종 PASS/FAIL 검증 판정(Codex가 수행).

## 산출물 정책 (요약)
- 기본 목표: `<보고서명>_KSSB_공시근거_사전검토보고서.docx`
- fallback: `<보고서명>_KSSB_공시근거_사전검토보고서.html`
- JSON/CSV/manifest/debug log/`_검토근거` 폴더는 기본 산출물이 아니며, 향후 개발/검증/debug mode 내부용 가능성만 열어둔다.

## 다음 단계
- Cycle 2 이후의 범위는 이 문서에서 제안하지 않는다.
- Cycle 1 산출물을 GitHub push 후, ChatGPT가 확인하고 Codex가 검증한 뒤 결정한다.
