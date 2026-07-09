# 데모 시나리오 — 공개 보고서 1건 → 사전검토 보고서 초안 (5분 재현)

> **성격**: 심사/시연용 재현 절차. 실제 실행 기록은 `docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`.
> 본 도구는 삼일회계법인 공식 제품이 아니며 감사·인증·준수 판단을 대체하지 않는다(컨설턴트 검수용 초안).

## 준비물

- Codex(플러그인 설치 가능 환경) + 이 repo를 로컬/repo marketplace로 추가(`.agents/plugins/marketplace.json`, `source.path=./src`).
- 입력: 공개 지속가능경영보고서 PDF 1건(텍스트 레이어가 있는 판독 가능 문서 — 예: 상장/공공기관 공개 보고서).
  원본 PDF는 repo에 커밋하지 않는다.

## 시나리오 A — 실사용 경로 (Codex Skill, 권장)

1. Codex에서 플러그인 설치·활성화 확인(사용자 직접 — `docs/codex_install_verification.md`).
2. 입력 PDF를 대화에 첨부하고 요청: **"이 보고서를 검토해줘"** (또는 "KSSB 공시근거 사전검토").
3. Skill `samil-kssb-precheck`가 절차 수행: 4대 영역 카탈로그 대조 → source-bound findings 생성
   (판정·원문 인용·위치·부족정보·고객질문) → preflight(detect-only) → 대표 문서 생성.
4. **확인 포인트(심사 관점)**:
   - 산출물 = `<보고서명>_KSSB_공시근거_사전검토보고서.docx`(+HTML/MD fallback) — 컨설턴트 워크페이퍼 구조
     (판정 요약표 → 영역별 근거(원문 인용+페이지) → 고객 확인 질문/요청자료 표 → 보완 권고 → 한계·검수 경계).
   - **인용 실재성**: 보고서의 아무 인용이나 골라 원문 PDF에서 검색(Ctrl-F) → 주장 페이지에서 재발견되는지.
   - **정직한 확인 불가 처리**: 근거 없는 항목이 "미공시"로 단정되지 않고 질문·요청자료로 연결되는지.
   - 고지·사람 검수 경계 문구 포함 여부.

## 시나리오 B — 내부 구성요소 결정성 (로컬, 2분)

Skill 판단 단계 없이 검증기·렌더러의 결정 동작만 재현(번들 예시 findings 사용):

```
node src/validators/kssb_findings_validator.cjs src/schemas/kssb_findings_example.json   # detect-only, error 0
node src/renderers/kssb_report_delivery.cjs src/schemas/kssb_findings_example.json -o <repo 밖 임시폴더>
# → DOCX→HTML→MD 생성 + 사용자 요약(경로/계정 비노출). 재실행 시 byte-identical.
node --test tests/*.test.cjs   # 365건 green (validator·renderer·delivery·parity)
```

- **D94 안전 중단 시연**: 예시 findings의 anchor `quote`를 빈 문자열로 바꾼 사본으로 delivery 실행 →
  보고서 미생성·통제된 중단(exit 4)·sanitized 안내 확인.

## 시연 멘트 뼈대 (3분)

1. **문제**: 컨설턴트의 KSSB 초기 검토는 "자료↔공시요구 대조 + 근거 추적 + 고객질문 정리" 반복 작업 —
   일반 챗봇은 근거가 끊기고 확인 불가를 그럴듯하게 확정한다.
2. **해결**: 판단(LLM Skill)과 검증(detect-only)·변환(재판정 없는 렌더러)을 분리 — 근거 없는 확정은 스키마가 막고,
   오류 상태면 보고서가 아예 안 나온다.
3. **증거**: 실제 126p 공개 보고서 완주, 인용 18건 중 17건 원문 재발견(페이지 정확도 100%), 실행 중 환각 인용
   3건 실제 차단, byte-identical 재생성 (→ README "검증 실적").
4. **경계**: 초안 생성기일 뿐 판단은 컨설턴트 — 감사·인증 대체 아님(규제 산업 전제에 맞춘 설계).

## 주의

- 스캔/이미지 전용 PDF는 기본 경로에서 자동 판독되지 않는다(한계·질문으로 라우팅). OCR은 승인 기반 선택 경로.
- 생성 산출물·원본 PDF는 repo에 커밋하지 않는다.
