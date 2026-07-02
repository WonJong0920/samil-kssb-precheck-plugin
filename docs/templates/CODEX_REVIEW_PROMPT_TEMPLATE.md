# Codex Review Prompt Template (짧은 Codex 리뷰 프롬프트 틀)

> **이 문서는 양식(template)이다.** 향후 Codex 리뷰 프롬프트를 **짧고 일관되게** 작성하기 위한 기본 틀이다.
> 리뷰 보고 형식을 프롬프트에 길게 반복하지 말고, 아래 한 줄로 위임한다:
> **"리뷰 보고 형식은 `docs/reviews/REVIEW_REPORT_TEMPLATE.md`를 참고하라."**
>
> **먼저 읽기(필수)**: 모든 리뷰 프롬프트는 "먼저 `AGENTS.md`와 `docs/operating_principles.md`를 읽으라"는 지시를 포함한다.
> Codex는 독립 검증자다. 리뷰는 **`docs/reviews/`** 문서에 남기고, 채팅 보고는 **경로·Verdict·Readiness·Critical/Major/Minor 요약·commit SHA·push 여부**만(장문 금지).

---

## 채워 넣을 항목

- **리뷰 목표**: (무엇이 적합한지/정합한지 독립 검증)
- **대상 repo / branch / commit**: `<repo>` / `<branch>` / `<SHA>`
- **반드시 확인할 파일**:
  - `AGENTS.md`, `docs/operating_principles.md` (운영 원칙 — 항상 먼저)
  - `...`
- **핵심 검토 질문**:
  1. ...
  2. ...
- **가능한 검증**: (파일 존재, JSON 문법, 정합성 대조, git 상태 등 — 코드 실행/설치는 하지 않음)
- **하지 말 것**: (수정 금지, 구현 금지, 샘플 실행 금지, submission 생성 금지 등)
- **판정 기준**: PASS / CONDITIONAL PASS / FAIL (기준 상세는 REVIEW_REPORT_TEMPLATE.md의 Verdict 참고)
- **리뷰 문서 경로**: `docs/reviews/codex_<cycle>_<scope>_review.md`
- **최종 보고 형식**: `docs/reviews/REVIEW_REPORT_TEMPLATE.md`를 참고하라.

---

## 짧은 프롬프트 예시(골격)

```text
목표: <cycle> 산출물이 <목적>에 정합하는지 독립 검증.
대상: repo <URL>, branch main, commit <SHA>.
반드시 확인: <파일 목록>.
핵심 질문: <1~3개>.
가능한 검증: 파일 존재·JSON 문법·정합성·git 상태(코드 실행/설치 없음).
하지 말 것: 산출물 수정, 구현, 샘플 실행, submission 생성.
판정: PASS / CONDITIONAL PASS / FAIL.
리뷰 문서: docs/reviews/codex_<cycle>_<scope>_review.md 에 작성.
리뷰 보고 형식은 docs/reviews/REVIEW_REPORT_TEMPLATE.md 를 참고하라.
```

> 제품 경계(삼일 비공식·감사/인증/준수 대체 아님), Source-bound Analysis, 사람 검수 경계는 리뷰 관점에서 항상 유지 확인 대상이다.
