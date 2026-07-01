# Decision Log Entry Template (결정 항목 양식)

> **이 문서는 양식(template)이다.** `docs/decision_log.md`에 새 결정을 추가할 때 쓰는 항목 구조다.
> 결정 ID는 기존 로그의 마지막 번호를 이어서 부여한다(예: 마지막이 D19면 D20).

---

## 항목 구조

```markdown
## D<N>. <결정 제목>
- **Date**: YYYY-MM-DD
- **Context**: 왜 이 결정이 필요한가(배경/문제).
- **Decision**: 무엇을 결정했는가(명확히).
- **Rationale**: 결정 근거.
- **Alternatives Considered**: 검토한 대안과 기각 사유.
- **Consequences**: 결정의 영향/리스크/후속 필요.
- **Status**: 확정 / 지향(승인 전 미확정) / 보류 / 철회.
- **Related Files / Reviews**: 관련 파일 경로, 관련 리뷰 문서.
```

---

## 작성 예시(골격)

```markdown
## D20. <제목>
- **Date**: 2026-07-01
- **Context**: ...
- **Decision**: ...
- **Rationale**: ...
- **Alternatives Considered**: ...
- **Consequences**: ...
- **Status**: 확정
- **Related Files / Reviews**: `src/...`, `docs/reviews/codex_...md`
```

> 승인 전 방향성만 정한 경우 **Status: 지향(승인 전 미확정)**으로 표기하고, 보류 항목은 로그 하단 "보류 항목"에도 반영한다.
