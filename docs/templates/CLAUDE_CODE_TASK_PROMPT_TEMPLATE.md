# Claude Code Task Prompt Template (짧은 작업 지시 틀)

> **이 문서는 양식(template)이다.** 향후 Claude Code 작업 지시를 **짧고 일관되게** 작성하기 위한 기본 틀이다.
> 특정 Cycle 번호에 종속되지 않는다.
>
> **먼저 읽기(필수)**: 모든 작업 프롬프트는 "먼저 `AGENTS.md`와 `docs/operating_principles.md`를 읽으라"는 지시를 포함한다.
> Claude Code는 작업 수행자이며 **PASS/FAIL 판정을 하지 않는다.** 완료 보고는 repo 문서로, 채팅 보고는 **경로·commit SHA·push 여부**만.

---

## 채워 넣을 항목

- **목표**: (이번 작업으로 만들 결과 한두 줄)
- **확인할 문서**:
  - `AGENTS.md`, `docs/operating_principles.md` (운영 원칙 — 항상 먼저)
  - `...` (최신 main pull 후 확인)
- **작성/수정할 산출물**:
  - 신규: `...`
  - 수정(최소 범위): `...`
- **작업 범위**: (이번 작업에 포함되는 것)
- **하지 말 것**: (구현/렌더러/validator/Hook/MCP/Python 복사/샘플 PDF/샘플 실행/submission 생성/특정 산출물 수정 등)
- **Preflight Check**: `docs/templates/PREFLIGHT_CHECKLIST_TEMPLATE.md` 참고 + 이번 작업 고유 점검 항목
- **완료 보고 형식**: `docs/templates/CYCLE_COMPLETION_REPORT_TEMPLATE.md` 참고, 완료 후 commit·push

---

## 짧은 프롬프트 예시(골격)

```text
목표: <결과>.
확인할 문서: <목록> (최신 main pull 후).
작성/수정: 신규 <...>, 수정(최소) <...>.
작업 범위: <포함 항목>.
하지 말 것: <금지 항목>.
Preflight: PREFLIGHT_CHECKLIST_TEMPLATE.md + <고유 점검>.
완료 후 commit·push, 완료 보고는 CYCLE_COMPLETION_REPORT_TEMPLATE.md 형식.
```

---

## 유지 원칙(항상 적용)

- 해커톤 제출 맥락과 제품 경계(삼일 비공식·감사/인증/준수 대체 아님·컨설턴트 검수용 초안) 유지.
- Source-bound Analysis 원칙과 사람 검수 경계 유지.
- Skill-first 구조 유지(Python CLI 회귀 금지).
- 최종 검증·PASS/FAIL은 Codex가 수행. Claude Code는 Preflight(누락 방지)만.
- 다음 단계는 ChatGPT/사용자 확인 후 결정(불필요한 다음-Cycle 제안 금지).
- 역할 구분·보고 방식은 `AGENTS.md`·`docs/operating_principles.md`를 따른다.
