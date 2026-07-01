# Cycle Completion Report Template (완료 보고 양식)

> **이 문서는 양식(template)이다.** Claude Code가 Cycle 작업 완료 후 작성하는 완료 보고의 권장 구조다.
> 특정 Cycle 번호에 종속되지 않는다. 섹션은 작업 성격에 따라 추가·축소할 수 있다.

작성 파일명 권장: `docs/<cycle>_completion_report.md`

---

## 1. 작업 개요
- 이번 Cycle의 목표와 실제 수행 범위(한두 문단).

## 2. 작성/수정한 파일
- **신규**: 경로 + 목적 요약.
- **수정**: 경로 + 변경 요지(최소 보정 여부 명시).

## 3. 핵심 결정
- 이번 작업의 주요 설계/방향 결정(필요 시 `decision_log.md` 항목과 연결).

## 4. 검증 결과 (Preflight)
- 수행한 최소 점검과 결과(필수 파일 존재, 문법/구조 검증, 정합성 등).
- 상세 항목은 `docs/templates/PREFLIGHT_CHECKLIST_TEMPLATE.md` 참고.
- 최종 PASS/FAIL은 작성하지 않는다(최종 검증은 Codex가 수행).

## 5. 금지 작업 미수행 확인
- 이번 작업 지시의 금지 항목별 미수행 확인(코드/렌더러/Hook/MCP/Python 복사/샘플 PDF/submission.zip 등).

## 6. 보류된 결정사항
- 승인 전 미확정으로 남긴 항목과 결정 시점.

## 7. GitHub push 상태
- repo URL / branch.
- 최종 commit SHA는 **문서에 고정하지 않고** 최종 채팅 보고에만 기재(자기참조 회피).

## 8. ChatGPT 확인 대기
- 이번 작업에서 하지 않은 것(구현/리뷰 실행 등) 명시.
- 다음 단계는 ChatGPT/사용자 확인 후 결정. 최종 검증·PASS/FAIL은 Codex가 수행.

---

> 유지 권장 섹션: 작성/수정 파일, 검증 결과, 금지 작업 미수행 확인, push 상태, 확인 대기.
> 제품 경계(감사·인증·준수 대체 아님)와 Source-bound 원칙이 훼손되지 않았는지 확인 결과를 포함하면 좋다.
