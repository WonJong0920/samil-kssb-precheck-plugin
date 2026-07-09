# Post-Phase 3-B — 남은 작업 검토 (planning / review, docs-only)

> **성격**: 이 문서는 **검토·선택지 정리**만 한다. 구현 지시가 아니다. 다음 작업을 임의 착수하지 않는다.
> repo 상태·source-of-truth 문서를 직접 확인해 판단했다(ChatGPT 요약 전재 아님).
> 기준 HEAD: `edc3a14`(Codex Phase 3-B implementation review) 이후. Phase 3-B closure = **D99**.

## A. 현재까지 closure된 범위

repo(current_status·decision_log·완료 보고서·review 문서) 확인 기준.

| 범위 | closure 유형 | 근거 | 의미 제한 |
|---|---|---|---|
| Phase 2 core Node migration N1~N4 | **implementation closure** | D95 | Node가 validator·DEI·delivery·renderer(DOCX→HTML→MD)·D94 hard stop을 런타임으로 제공. **제품 완성 아님** |
| Cycle C trace manifest | **implementation closure** | D96 | opt-in·기본 off·delivery-segment provenance. upstream end-to-end는 범위 밖(OBS-02) |
| Phase 3-A validation coverage audit | **docs-only closure** | audit review PASS | 대조표·격차·자동화 안전성 판정 |
| Phase 3-D 검증 프로토콜 Node 정렬 + manifest evidence + quote-reality 경계 | **docs-only closure** | D97 | blackbox_protocol Node 기준·evidence 규약 문서화 |
| Phase 3-C docs-first cleanup + P3C-MIN-01 | **docs-only closure** | D98 | runtime drift 정렬·검수 우선순위 표 **문서 서식**·stale `§6` 정리. **renderer 구현 아님** |
| Phase 3-B validator detect-only warning v1(R1·R2) | **implementation closure** | D99 | additive warning 2건. **판정 자동화·사람 검수 대체 아님** |

**의도적으로 유지되는 한계(제품 완성·제출 준비 완료로 보면 안 되는 항목)**:
- **N5 aux scanner**: Node 미이식 — 생성은 Python reference 전용(D93②·D95). 소비만 Node.
- **Python reference**: golden parity로 유지, 최종 처리(제거/보존)는 제출 패키징 단계 결정(D93③).
- **DOCX 컨테이너 전체 byte-parity**: 비목표(파트 콘텐츠 byte-identical + 결정성으로 대체 — N4).
- **quote 실재성**: opt-in·warning, 사람 검수·독립 표본 확인 비대체.
- **trace manifest v1**: delivery-segment 한정.
- **core는 OCR·문서 변환을 자동 실행하지 않음**: 승인 기반 로컬 보조 runner(core 밖)만.
- **Hook/MCP/dispatcher/registry 미도입**, 멀티-대상 배치(여러 자료 → 자료별 보고서 N개) 미지원(설계상 통합 1개).
- **아님 명시**: 제품 완성·2N-5 전체 통과·OCR complete·provider finalization·submission readiness·감사/인증/준수 확정.

## B. 아직 closure되지 않은 범위 / 남은 선택지

각 항목: 목적 / 착수 조건 / 변경 표면 / Codex review / 리스크 / 지금·보류·제출 후.

### B1. Phase 3-C renderer conditional implementation (검수 우선순위 표를 실제 보고서에 렌더)
- **목적**: report_template §7-1의 검수 우선순위 표(문서 서식)를 렌더러가 실제 대표 문서에 표면화(conflict·
  not_verifiable·partial·validator warning 연동).
- **착수 조건**: **별도 scope/design + Codex review**(3-B/3-C review 모두 "renderer 구현 승인 아님" 명시).
- **변경 표면**: `kssb_report_renderer.cjs`(+Python reference parity 여부 결정), delivery, 신규 테스트. schema 불변.
- **Codex review**: 필요(implementation).
- **리스크**: 렌더러 Node↔Python parity, 재판정 금지 경계, DOCX 파트 결정성, 오더링, scope creep.
- **판단**: **보류** — 제출 가치가 확인될 때 별도 설계 사이클로만 착수.

### B2. Phase 3-B follow-up / 보류 rule + OBS-01 fixture
- **목적**: 추가 detect-only 표면(anchor `page_or_section` 부재 warning / quote normalization 강화 / 정량
  수치결합·evidence gap warning) 및 OBS-01(동시 cross+within-item 회귀 fixture).
- **착수 조건**: 각 rule 별도 scope·승인(BORDERLINE은 P3A-OBS-03 — confirmed-only·item-specific). OBS-01은 소규모.
- **변경 표면**: `kssb_findings_validator.cjs`, node test.
- **Codex review**: 필요.
- **리스크**: noise(page_or_section), 거짓 신뢰(normalization), 재판정 경계(정량). OBS-01 fixture는 저위험.
- **판단**: 대부분 **보류/후속 설계**. OBS-01 fixture는 향후 validator 손댈 때 함께 넣을 수 있는 **선택적 회귀 가드**.

### B3. Final black-box / smoke test (Node runtime end-to-end evidence)
- **목적**: sample → Skill → findings → preflight → **Node delivery** → 대표 문서 전 구간 evidence를 현재
  Node-정렬 프로토콜(D97)로 확보(2N-5R은 과도기 Python 경로 기준이었음). `--manifest`로 delivery-segment 결정
  evidence 병기 가능(OBS-01 규약 준수 — exit 0 단독 판단 금지).
- **착수 조건**: 승인 기반 실행, 샘플은 repo 밖, 산출물 미커밋(집계·hash만 evidence 문서화).
- **변경 표면**: `docs/samples/` evidence 문서만. 코드 무변경.
- **Codex review**: 필요(evidence review).
- **리스크**: Skill(LLM) 비결정성, 환경(Node 존재), repo 오염 0 준수. **2N-5 전체 통과 주장 금지**.
- **판단**: **제출 안정화 강력 후보** — 현재 런타임 기준 실행 근거 제공.

### B4. Final documentation alignment (runtime drift 잔여)
- **목적**: `SKILL.md`가 아직 Workflow/Output 절에서 **Python 런타임 경로**(`kssb_findings_validator.py`·
  `kssb_report_renderer.py`·`kssb_report_delivery.py`)를 참조 — Phase 3-C가 completion_checklist·report_template에서
  정리한 것과 같은 drift가 SKILL.md에 남아 있음. README·architecture 정합도 함께 점검.
- **착수 조건**: docs-only, 타깃 정렬(대규모 README rewrite 금지).
- **변경 표면**: `SKILL.md`, 필요 시 `README.md`·`docs/architecture.md`·workflow 문서.
- **Codex review**: 필요(docs review).
- **리스크**: 낮음. scope creep(대규모 rewrite)만 경계.
- **판단**: **제출 안정화 후보**(SKILL.md runtime drift는 실재 — 저위험·제출 대면 가치).

### B5. Submission packaging readiness audit
- **목적**: `docs/submission_packaging_policy.md`를 현재 repo 상태에 대조(포함/제외 분류·logs zip-only·샘플·
  최종 preflight·marketplace 파일·generated artifact 0). **실제 packaging·submission.zip 생성은 아님**.
- **착수 조건**: docs-only audit.
- **변경 표면**: audit 문서 1개(+정책 문서 최소 갱신 가능).
- **Codex review**: 필요.
- **리스크**: submission.zip 생성·readiness 단정 금지.
- **판단**: **제출 안정화 후보**(docs-only).

### B6. Final Codex submission review
- **목적**: 제출 전 전체 독립 리뷰(경계·no-overclaim·구조 정합).
- **착수 조건**: B3·B4·B5 선행 후.
- **Codex review**: 이 자체가 review.
- **리스크**: 선행 미비 시 조기.
- **판단**: **마지막 게이트**.

### B7. 보류해야 할 후속 아이디어(지금 아님)
- upstream end-to-end provenance manifest(OBS-02) — 별도 사이클.
- 멀티-대상 배치 보고서(여러 자료 → 자료별 N개) — 현재 통합 1개 설계, 원하면 별도 기능 설계.
- N5 aux Node 이식 — 의도적 한계(D93②·D95) 유지.
- Hook/MCP·정량/normalization detect-only — 후속 설계.

## C. 추천 분기

### A안 — 제출 안정화 우선 (권장)
- **순서**: B4(docs alignment: SKILL.md runtime drift 등) → B3(Node runtime blackbox smoke evidence) →
  B5(submission packaging readiness audit) → B6(final Codex submission review). **신규 구현 없음.**
- **장점**: core가 Node로 완결(D95)되고 validation이 강화된 지금, **낮은 리스크의 docs·evidence로 제출 리스크를
  닫음**. 각 단계 독립 Codex review로 추적성 유지.
- **단점**: 검수 표 renderer 기능(B1)은 뒤로 미룸.
- **리스크**: 낮음(대부분 docs/evidence, 코드 표면 최소).
- **review gate**: B4·B3·B5·B6 각각 Codex review.
- **추천**: **예(권장)**.

### B안 — Phase 3-C renderer 확장 후 제출
- **순서**: B1(renderer 검수 표 scope/design → 구현 → review) → 이후 A안 안정화.
- **장점**: 보고서 표면이 풍부(검수 우선순위 표 실제 렌더).
- **단점**: 렌더러 parity·DOCX 복잡도·재판정 경계로 리스크·기간↑, 제출 지연. review들이 "별도 승인" 명시.
- **리스크**: 중~높음.
- **review gate**: design review + implementation review + 이후 안정화 review.
- **추천**: 아니오(지금은).

### C안 — 최소 추가 검증 후 packaging
- **순서**: B3(blackbox smoke) → B5(packaging audit) → B6. B4(docs alignment) 생략/축소.
- **장점**: packaging까지 최단.
- **단점**: SKILL.md runtime drift 등 문서 비정합이 남아 **제출 리뷰에서 지적될 여지**.
- **리스크**: 중(문서 비정합 노출).
- **review gate**: B3·B5·B6.
- **추천**: 조건부(문서 정합을 감수할 때만).

### 최종 추천
**A안(제출 안정화 우선)**. 첫 착수 후보는 **B4 문서 정합(SKILL.md runtime drift 정리)** — 저위험·docs-only이며
현재 Node 런타임 상태와 문서를 일치시켜 이후 evidence·packaging·final review의 기반을 만든다. **단, 이 문서는
계획이며 지금 어떤 것도 착수하지 않는다.**

## D. 다음 작업 후보 (짧은 명세)

| 후보 | 목적 | 변경 가능 파일 | 금지 범위 | Codex review | 예상 리스크 |
|---|---|---|---|---|---|
| **B4 문서 정합**(권장 첫 착수) | SKILL.md/README runtime drift → Node 런타임·Python reference 정렬 | `SKILL.md`(+선택 README·architecture) | renderer/validator 구현·대규모 README rewrite·schema | 필요(docs) | 낮음 |
| **B3 blackbox smoke** | Node 런타임 end-to-end 실행 evidence(`--manifest` 병기 가능) | `docs/samples/` evidence 문서 | 샘플/산출물 커밋·2N-5 통과 주장·submission.zip | 필요(evidence) | Skill 비결정성·환경 |
| **B5 packaging audit** | submission_packaging_policy 대조(docs-only) | audit 문서(+정책 최소) | submission.zip 생성·readiness 단정 | 필요 | 낮음 |
| **B1 renderer scope/design** | 검수 표 렌더 설계(구현 아님) | design 문서 | 실제 renderer 구현 | 필요(design) | 렌더러 parity |
| **B6 final submission review** | 제출 전 전체 독립 리뷰 | — | — | 이 자체가 review | 선행 미비 시 조기 |

**주의**: Phase 3-C renderer(B1)는 **별도 scope/design 없이는 착수하지 않는다.** 위 후보는 선택지이며, 실제
착수·순서는 ChatGPT/사용자 결정 이후 개별 프롬프트로 진행한다. 각 후보는 독립 Codex review 게이트를 유지한다.
