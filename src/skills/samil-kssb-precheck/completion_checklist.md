# 완료 점검 체크리스트 (Completion Checklist)

보고서 초안을 마무리하기 전에 다음을 점검한다. 이 체크리스트는 **보고서 품질의 최소 자기점검**이며,
제품/해커톤 적합성의 최종 판정을 의미하지 않는다(최종 검증은 컨설턴트 및 상위 검증 주체가 수행).

## 근거·판정 정합성
- [ ] 모든 KSSB 4대 영역 항목에 판정 라벨이 하나씩 부여되었다.
- [ ] findings가 생성 표준 절차를 따라 작성되었다 — 카탈로그 항목별 상세 기준(키워드·필수 요소·판정 조건)
      대조 포함(`evidence_mapping_rules.md` §8).
- [ ] "근거 확인" / "일부 근거 확인, 보완 필요" 항목에 근거 앵커(원문 인용 + 위치 단서)가 1개 이상 붙었다.
- [ ] 모든 quote가 실재성 재검수를 통과했다 — 원문 재탐색으로 재발견되지 않는 인용이 남아 있지 않다
      (`evidence_mapping_rules.md` §9. 자기 점검이며 사람 검수 대체 아님).
- [ ] 정량요구 항목에서 수치 없는 근거를 "근거 확인"으로 올리지 않았다.
- [ ] 에너지 사용량 항목에서 온실가스 배출량 수치를 정량 근거로 전용하지 않았다.

## 확인 불가·질문 연결
- [ ] "확인 불가" 항목이 모두 고객 확인 질문으로 연결되었다.
- [ ] 확인 불가 항목을 "미공시"로 단정하지 않았다.
- [ ] 각 질문에 항목ID·질문사유·관련근거·우선순위·요청자료·후속조치가 채워졌다(필수 6필드는 아래 스키마 정합성 섹션 참조).
- [ ] 질문·요청자료가 표준 템플릿과 카탈로그 요청자료 기본값을 반영했고, 질문사유가 실제 상황 유형과
      일치한다(`customer_question_rules.md` §5·§6).

## 상충·해석
- [ ] "상충 또는 해석 필요" 항목이 사람 검수 대상으로 표시되었다.

## 표현·경계
- [ ] 금지 표현(`prohibited_terms.md`)을 사용하지 않았다.
- [ ] "준수/적합/인증/감사 의견"처럼 보이는 판정명을 사용하지 않았다.
- [ ] 표지 고지문(삼일 비공식·감사/인증 대체 아님·컨설턴트 검수용)이 포함되었다.
- [ ] plugin/cache/sandbox 내부 경로를 노출하지 않았다.

## 산출물
- [ ] 대표 문서 파일명이 `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(또는 fallback `.html`) 규칙을 따른다.
- [ ] 기본 흐름에서 JSON/CSV/manifest/`_검토근거` 폴더를 산출물로 요구하지 않았다.

## 모드 정합성
- [ ] 입력 모드(고객 제공자료 / 공개자료 검증)에 맞는 판정 라벨 세트를 사용했다.
- [ ] 근거 표기가 모드("제공자료" / "공개자료")와 일치한다.

## 워크플로우 (findings → 검증 → 렌더 → 사람 검수)
- [ ] findings가 검증기 preflight(`src/validators/kssb_findings_validator.py`, detect-only)에서 error 0건이다.
- [ ] 대표 문서를 렌더러(`src/renderers/kssb_report_renderer.py`)가 동일 findings에서 재판정 없이 생성했다.
- [ ] 검증기·렌더러를 사용자-facing CLI가 아니라 스킬 워크플로우의 내부 단계로 다뤘다(`docs/workflow_usage.md`).

## findings 스키마 정합성 (`docs/findings_schema_contract.md`)
- [ ] 각 항목이 `judgment_code`와 review_mode에 맞는 `judgment_label`을 함께 가진다.
- [ ] `evidence_confirmed`·`partial_evidence_needs_supplement`에 `evidence_anchors` ≥ 1(각 `quote` 비어있지 않음).
- [ ] `not_verifiable`에 `missing_info`와 `customer_questions`가 연결되었다.
- [ ] 각 `customer_question`이 필수 6필드(`question`·`reason`·`related_evidence`·`priority`·`requested_material`·`follow_up_action`)를 갖췄다(관련근거 없으면 "해당 없음").
- [ ] `conflict_or_interpretation_needed`에 `human_review_required: true`와 `human_review_note`가 있다.
- [ ] `out_of_scope_or_not_applicable`에 적용 제외 사유(`missing_info`)가 있다.
- [ ] `evidence_anchors[].source_id`가 `source_documents`의 식별자를 참조한다(수동 확인).
- [ ] 출처 없는 숫자·보고서 밖 추정·외부 지식 보강이 findings에 없다.
- [ ] 렌더러가 findings를 재판정하지 않고 형식 변환만 하도록 유지되었다.
