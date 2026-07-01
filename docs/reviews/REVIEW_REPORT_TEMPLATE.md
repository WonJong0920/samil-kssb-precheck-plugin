# Review Report Template (공통 리뷰 보고 양식)

> **이 문서는 실제 리뷰가 아니라 양식(template)이다.** 앞으로 Codex 리뷰 문서(`docs/reviews/codex_*.md`)가
> 참고하는 **권장 구조**다. 고정 양식이 아니며, **리뷰 범위에 따라 섹션을 추가·축소·병합할 수 있다.**
> 특정 Cycle 번호에 종속되지 않는다.

작성 파일명 권장: `docs/reviews/codex_<cycle>_<scope>_review.md`

---

## 1. Review Overview (리뷰 개요)
- 검증 대상 repo / branch
- 검증 대상 commit (SHA)
- 비교/참고 대상(있으면): 기존 작업물, 이전 리뷰
- 리뷰 목적
- 리뷰 일시

## 2. Verdict (최종 판정)
- **Verdict**: PASS / CONDITIONAL PASS / FAIL
- 한 줄 요약

> **판정 기준(간단)**
> - **PASS**: 목적·범위를 충족하고 Critical·Major 없음. 다음 단계로 진행 가능.
> - **CONDITIONAL PASS**: 진행은 가능하나 명시된 Minor(또는 경미한 조건)를 다음 단계에서 해소해야 함.
> - **FAIL**: Critical 또는 범위 미충족. 수정 후 재검토 필요.

## 3. Reviewed Materials (확인한 자료)
- 확인한 repo 파일 목록
- (해당 시) 확인한 기존 작업물/참고 자료

## 4. Validation Performed (수행한 검증)
- 실제로 수행한 확인 방법(파일 존재, 문법/구조 검증, 정합성 대조, git 상태 등)
- 수행하지 못한 검증과 사유(있으면)

## 5. Findings by Severity (심각도별 지적사항)
- **Critical**: (없으면 "없음")
- **Major**: (없으면 "없음")
- **Minor**: (없으면 "없음")

## 6. Scope-Specific Review (범위별 검토)
- 이번 리뷰 범위의 항목별 판단. 각 항목: 판단(PASS/이슈) · 근거 · 이슈.
- 예: 제품 정의, 스키마 정합성, 구조화 findings, 산출물 정책 등 리뷰 대상에 맞게 구성.

## 7. Boundary / Risk Review (제품 경계·리스크 검토)
- 제품 경계 유지 여부: 삼일 비공식·감사/인증/준수 판단 대체 아님·컨설턴트 검수용 초안.
- Source-bound Analysis 원칙 유지 여부.
- 사람 검수 경계 유지 여부.
- 금지 표현·금지 작업 수행 여부(코드/Hook/MCP/샘플 PDF/Python 복사 등).
- 해커톤 제출 맥락 관련 리스크(예: 로그 원본 포함, 식별정보 노출).

## 8. Next-Step Readiness (다음 단계 준비도)
- 판단: 준비됨 / 조건부 준비됨 / 미준비
- 근거
- 다음 단계 착수 전 차단 이슈
- 주의할 리스크

## 9. Reviewer Notes (리뷰어 메모)
- 자체 추가 검토 항목, 관찰, 권고(있으면).

## 10. ChatGPT / User Confirmation (확인 대기)
- 본 리뷰는 해당 범위 검증 결과만 기록한다.
- 다음 단계 제안은 작성하지 않는다(또는 최소화).
- 다음 단계 판단은 ChatGPT/사용자가 본 리뷰와 GitHub 상태를 확인한 뒤 수행한다.

---

> 섹션은 리뷰 범위에 맞게 조정 가능하다. 다만 **Verdict, Findings by Severity, Boundary/Risk, 확인 대기**는 유지 권장.
