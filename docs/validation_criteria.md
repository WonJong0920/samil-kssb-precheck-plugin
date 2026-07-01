# 검증 기준 (Validation Criteria)

> **역할 분리**: 최종 검증과 PASS/FAIL 판정은 **Codex가 수행한다.** Claude Code는 독립 검증자가 아니라
> 구현·문서화·기본 누락 방지 점검 담당자다. Claude Code는 최종 PASS/FAIL 판정을 하지 않는다.

이 문서는 **Codex가 Cycle 1을 검증할 때 사용할 기준**을 정리한다.

## 1. 필수 파일 존재 기준
- `src/.codex-plugin/plugin.json`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/` 보조 문서: `kssb_requirement_catalog.md`, `judgment_schema.md`,
  `evidence_mapping_rules.md`, `customer_question_rules.md`, `report_template.md`,
  `completion_checklist.md`, `prohibited_terms.md`
- `src/reference/python_engine/README.md`
- `README.md`
- `docs/`: `product_definition.md`, `scope.md`, `architecture.md`, `validation_criteria.md`,
  `reference_review.md`, `current_status.md`, `decision_log.md`, `cycle1_completion_report.md`
- `logs/.gitkeep`

## 2. 제품 경계 기준
- 삼일회계법인 비공식·감사/인증/준수 대체 아님 고지가 README 및 주요 문서에 포함되어야 한다.
- 컨설턴트 검수용 사전검토 보조 도구 정체성이 유지되어야 한다.
- 감사·인증·준수 확정 도구처럼 보이는 표현이 없어야 한다.

## 3. 금지 표현 기준
- `prohibited_terms.md`의 금지 표현(audit trail, 감사 추적, 인증 의견, 준수 확정, 적합 판정 등)이
  사용자-facing 문서·보고서 템플릿에 사용되지 않아야 한다.
- 판정명에 "준수/적합/인증/감사 의견/적정"이 없어야 한다.

## 4. Source-bound Analysis 기준
- SKILL.md에 근거 기반 분석 원칙 7개가 포함되어야 한다.
- 확인 불가 항목이 고객 확인 질문으로 연결되는 원칙이 명시되어야 한다.
- 직접 근거와 추론 구분, 외부 지식 보강 금지 원칙이 있어야 한다.

## 5. KSSB 4대 영역 반영 기준
- 거버넌스·전략·위험관리·지표 및 목표 4대 영역이 카탈로그와 SKILL.md 검토 절차에 반영되어야 한다.
- 판정 스키마(모드별 라벨 세트)가 정의되어야 한다.

## 6. 구조/모드 기준
- Codex plugin root가 `src/`이고 `src/.codex-plugin/plugin.json`이 존재해야 한다.
- Skill-first 구조가 드러나야 한다.
- Hook 파일/hooks 설정을 추가하지 않았어야 한다.
- MCP 서버/`.mcp.json`을 추가하지 않았어야 한다.
- 샘플 고객사를 임의 선정하지 않았어야 한다.
- 기본 사용자 흐름이 Python CLI 중심으로 설계되지 않았어야 한다.
- 기본 사용자 흐름에서 JSON/CSV/manifest 산출물을 요구하지 않아야 한다.

## 7. 참고 자산 처리 기준
- `docs/reference_review.md`에 기존 1차 작업물 검토 결과가 기록되어야 한다.
- 기존 Python 구현을 복사/이동하지 않고 reference로 문서화했는지 확인 가능해야 한다.
- 기존 1차 작업물 원본(D 드라이브)을 수정하지 않았어야 한다.

## 8. 역할 분리 재확인
- Claude Code는 Preflight Check(누락 방지 최소 점검)만 수행하고 "완료/미완료"만 기록한다.
- 제품 적합성·해커톤 적합성·구조 정합성·문서 품질의 최종 검증과 PASS/FAIL 판정은 **Codex가 수행한다.**
