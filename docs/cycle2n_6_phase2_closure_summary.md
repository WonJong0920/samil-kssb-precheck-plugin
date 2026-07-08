# Cycle 2N-6 Phase 2 — Core Node Migration Closure + N5 Limitation

> **성격**: 문서 전용(docs-only) closure 정리다. **코드 변경 0.** Claude Code는 구현·검증·보고만
> 수행하며 PASS/FAIL 최종 판정은 하지 않는다 — 본 문서는 이미 통과한 4건 Codex review(N1~N4)와
> 확정된 사용자 결정(D93 ②)을 **집계·명시**할 뿐 새 판정을 내리지 않는다.
>
> 시작 HEAD: `834abf0fe72d119267ecc6e3b9e77f947b4856cf` (pull 후 최신 원격 main·clean)
> 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재)

## 1. Phase 2 core Node migration 상태 (N1~N4 완료 + N5 한계)

D92(C안 단독 — Node가 유일한 런타임 완결 경로)의 Phase 2 core 이식은 다음으로 정리된다:

| 단계 | 내용 | 상태 | Codex review |
|---|---|---|---|
| **N1** | Node validator 이식 | **완료** | `docs/reviews/codex_cycle2n_6_phase2_n1_validator_node_review.md` — **PASS** |
| **N2** | Node delivery + HTML/Markdown renderer 이식(D94 hard stop 내장) | **완료** | `docs/reviews/codex_cycle2n_6_phase2_n2_delivery_html_md_review.md` — **PASS** |
| **N3** | Node DEI producer 이식 | **완료** | `docs/reviews/codex_cycle2n_6_phase2_n3_dei_producer_node_review.md` — **PASS** |
| **N4** | Node DOCX writer 이식 | **완료** | `docs/reviews/codex_cycle2n_6_phase2_n4_docx_writer_node_review.md` — **PASS** |
| **N5** | aux structure scanner | **Node 미이식 — 한계로 확정**(D93 ②) | 이식 안 함(별도 결정, 아래 §2) |

Codex N4 review는 "**N1~N4 core Node migration은 reviewed surface 기준으로 closed로 봐도 된다**"고
명시했다(`Phase 2 Core Closure Readiness: PASS`).

## 2. N5 aux scanner — Node 경로 한계 (limitation)

- **N5 aux scanner는 Node path에서 구현하지 않고 한계(limitation)로 명시한다.** 이는 D93 ②에서 이미
  확정된 사용자 결정의 집행이며, 본 문서에서 새로 정하는 것이 아니다(중복 결정 아님).
- **N1~N4 core Node path는 validator · DEI producer · delivery · DOCX/HTML/Markdown까지 제공한다.**
  파이썬 없는 사용자 환경에서도 findings 검증 → 대표 문서(DOCX→HTML→MD) 생성 전 구간이 Node로 완결된다.
- **aux scanner는 보조 구조 신호이며 core report generation의 필수 조건이 아니다.** aux_signals는
  findings·판정·보고서에 직접 유입되지 않고, DEI candidate의 `aux_structure` 섹션·검수 힌트
  (image_detection_gap / table_count_mismatch / heading 미사용)로만 합류하는 **2차 교차 확인 신호**다.
  이 신호가 없어도 Kordoc intake → DEI → validator → delivery의 핵심 산출은 정상이다.
- **기술적 배경**: Node 내장 모듈에는 XML 파서가 없고(외부 npm 의존성 0 원칙), aux scanner는
  HWPX/DOCX의 zip+xml 구조를 파싱해 카운트를 뽑는다. 순수 JS XML 파서를 새로 작성하면 parity 취약·
  오탐(잘못된 교차 신호) 리스크가 큰 반면 사용자 가치는 낮아, **한계 유지가 합리적**이라는 판단이다.
- **소비 측은 이미 Node로 이식됨**: `src/intake/dei_producer.cjs`는 (어디서 생성되었든) `aux_signals`를
  **소비·병합**할 수 있다(N3에서 이식·검증). 즉 Node가 aux_signals를 "소비"는 하되 HWPX/DOCX에서
  직접 "생성"만 하지 않는다 — Python `aux_structure_scanner.py`가 그 생성 경로의 reference로 남는다.
- **문서화 위치**: `src/intake/runners/README.md`(Node HWP runner v1 의도적 차이 — aux_signals 미생성),
  `src/intake/README.md`(aux scanner Node 미이식 한계), 본 문서.

## 3. Closure가 의미하지 않는 것 (no-overclaim 경계)

Phase 2 core 이식 closure는 **reviewed surface 기준 core Node 이식 종료**일 뿐이며, 다음을 의미하지 않는다:

- 제품 완성 아님 · 2N-5 전체 통과 아님 · OCR support complete 아님 · L2/L3 완료 아님 ·
  provider finalization 아님 · submission readiness 확정 아님.
- Python 원본 제거 아님 — D93 ③대로 golden parity reference로 유지하며, submission.zip 포함 여부는
  제출 패키징 단계에서 결정한다.

## 4. Phase 2 이후 (별도 사이클)

closure 이후 남은 작업은 **각각 별도 사이클**로 진행한다(Phase 2 이식 사이클에 편승 금지):

1. **workflow docs 정렬**(다음 — docs-only): Node 경로가 core 런타임 경로임을 문서에서 일관되게
   정렬한다(N3-OBS-01·N4-OBS-02). 단 **Python은 reference 지위 유지**(제거·deprecation 표기 없음, D93 ③).
2. **trace manifest stage**(그 후 — design→code 전용 사이클): delivery 종단의 결정적 provenance 집계
   단계. hook 아님. `docs/reviews/claude_gpt_post_n4_hook_structure_proposal_review.md` §5-⑦·§6·§7의
   권고대로 **설계 문서 → Codex review → 구현 → Codex review + decision_log 결정**으로 진행한다.
3. **Phase 3 품질 강화**: enrichment stage(schema 계약)·guidance pack·render mode 등은 2N-5R급 실측
   evidence 기반으로 개별 판단(D92 Phase 3 틀).

## 5. 검증 (docs-only)

- 본 사이클은 **문서 전용**이라 코드 테스트를 실행하지 않는다(코드·스키마·런타임 무변경 — 회귀 표면
  없음). N1~N4 이식·회귀 결과는 각 완료 보고서와 Codex review 문서에 기록되어 있다.
- 검증 범위: `git diff --check` clean · 변경은 문서/결정 기록만 · generated artifact·code·package 무변경 ·
  no-overclaim(closure가 제품 완성/2N-5 통과/OCR complete/provider finalization을 주장하지 않음).

## 6. 다음 단계

- 본 closure 문서 + N5 limitation 집행에 대한 **Codex review** → PASS 시 workflow docs 정렬 사이클(위 §4-1).
- ChatGPT/사용자 분기 판단 대기.
