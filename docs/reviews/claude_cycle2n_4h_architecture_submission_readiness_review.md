# Claude Cycle 2N-4H Architecture / Submission Readiness Review

> **성격**: 이 문서는 **Claude Code의 자율 readiness 리뷰**다(Codex 리뷰 아님). 2N-5 black-box 직전,
> "처음 repo를 받은 심사자/사용자가 이해→설치·승인→입력→실행→산출물 확인까지 가는 경로에서
> 어디에서 실패하거나 오해할 수 있는가"를 구현자 관점의 내부 정합성 중심으로 판단한다.
> 코드/문서 patch는 수행하지 않았다(리뷰 문서만 작성).

## Claude readiness opinion

**READY WITH NONBLOCKING OBSERVATIONS**

구조·문서·코드·패키징·안전 경계의 내부 정합성은 2N-5에 들어가도 되는 상태다. 단 **repo 결함이 아닌
결정 공백 1건** — *2N-5 실행 환경과 Python 호출 규약* — 이 2N-5 프롬프트에 명시되지 않으면 black-box가
core 단계(validator/renderer)에서 환경 문제로 실패할 수 있다. 이것은 코드 수정이 아니라 **2N-5 설계
결정**이므로 opinion을 NOT READY로 낮추지 않되, 아래 "2N-5 전 반드시" 항목으로 명시한다.

## Reviewed HEAD와 리뷰 범위

- reviewed HEAD: `d125c336be72d1bb3c4ce8f471f91cc26a6462d4` (pull 후 일치, working tree clean —
  직전 커밋은 Codex P2N5-UX-MAJ-01 closure review 문서 1건으로 예상 범위 내)
- 리뷰 범위: 사용자 여정 관련 문서(README·quickstart·SKILL·workflow_usage·runner/intake README·
  packaging policy)·manifest/marketplace·runner 3종(.py/.cjs/ps1)·nethook·core 3층·schemas·
  .gitignore·tests 전체 + 재실행 검증 + 오염 스캔. Codex closure review(P2N5-UX-MAJ-01 **closed**) 확인.

## 사용자 end-to-end journey 요약 (이 리뷰가 상정한 경로)

1. README를 읽고 목적·경계 파악 → **Quickstart 링크**로 파일 유형별 기대치·승인 흐름·산출물 확인.
2. Codex 플러그인 설치(로컬/repo marketplace — 설치 검증은 사용자 직접, `docs/codex_install_verification.md`).
3. 텍스트 PDF/공개자료 입력 → Skill이 findings 생성 → validator preflight → renderer/delivery → 초안 수령.
4. HWP-계열 입력 시 승인 대화(도구 설치/실행 분리) → repo 밖 tool-cache → no-egress 실행 → 산출물을
   ingest 경계로 정규화 → 근거 재료로 사용.
5. Node 부재 시 portable Node 승인 fallback(B안 — 채택됨, D90), 거부/실패는 기본 검토로 수렴.

## Architecture readiness 판단 — **정합**

- 문서가 말하는 구조와 실제 구조 일치: Skill-first(진입점 1개), core(schema/validator/renderer/delivery)와
  intake/runners의 분리가 코드·테스트(core 미참조 강제)로 유지된다. README·SKILL·quickstart·current_status의
  상태 표현(core/baseline/assisted/pending/미지원 5구분)이 서로 충돌하지 않음을 대조 확인했다.
- quickstart matrix와 구현 상태 정합: 스캔 PDF "플러그인 내 OCR 미구현", HWP=assisted 필수, HWPX/DOCX
  보조 신호 "일부 경로에서만 생성"(Node runner aux 미생성 차이) — 전부 실제 구현과 일치.
- B안 표현 정합: runner 구현(탐지 우선순위·버전 실측 게이트)·D90 채택 범위·quickstart 문구가 일치하며
  **portable Node가 core dependency처럼 보이는 서술은 없다**(선택적 assisted 경로의 fallback으로만 기술).
- validator/renderer/delivery의 재판정 금지 경계·detect-only 표현 유지, nethook은 프로세스(Node) 레벨
  한계를 정직 표기(OS 방화벽 과장 없음). 감사·인증·준수 확정류 표현은 negation/금지 문맥에만 존재(스캔 확인).

## Submission / Packaging readiness 판단 — **정합(개선 1건)**

- 오염 0: tracked에 package/lock/node_modules/tool-cache/생성 artifact/zip·exe·msi·submission.zip 없음.
  untracked 위험물도 없음(__pycache__는 ignore됨). `.gitignore`가 렌더 산출물·PDF·intake/ocr/aux artifact를 방어.
- **개선점(비차단)**: `.gitignore`에 `*.hwp`/`*.hwpx`/`*.docx` 방어가 없다 — 원본 미커밋 정책은 PDF와 동일한데
  패턴은 PDF만 있다. 2N-5는 HWP-계열 샘플을 다루므로 실수 커밋 방어의 대칭성을 위해 **2N-5 착수 전 1줄 추가 권장**.
- README "저장소 구조" 트리가 stale: `src/intake/`(ingest+runners)가 트리에 없다(본문 "현재 구현 상태"에는
  반영됨). 심사자가 트리만 보면 intake 계층을 놓칠 수 있음 — 제출 전 wording pass에서 갱신 권장(비차단).

## Runtime / Approval / No-egress readiness 판단 — **정합(결정 공백 1건)**

- 승인 흐름: 무승인 설치/실행 금지가 코드 게이트+테스트(exec 0)로 강제되고, 승인 문구가 위치·출처·hash·
  제거·no-egress를 고지한다. 무단 설치를 유도하는 경로 없음. prep egress(기록)↔실행 no-egress(훅) 구분이
  문서·코드·quickstart 평문 설명에서 일관된다.
- portable Node 체인: 공식 출처 고정·이중 hash·버전 실측 게이트·A안 수렴 — evidence(2N-4G)와 리뷰 체인 완결.
- **결정 공백(주요 리스크)**: core(validator/renderer/delivery)와 ingest는 Python이고, **Codex 세션에서
  bare `python`은 WindowsApps stub으로 실패**(P0 실측)하며 절대 경로 호출 규약(S0)은 evidence만 있고
  **채택·문서화되지 않았다**(P0-B "runtime adoption not performed"). 2N-5가 Codex-like 환경에서 돌면
  Skill→validator/renderer 단계가 환경 문제로 실패할 수 있다 — 이는 repo 결함이 아니라 **2N-5 실행 환경
  정의(U-3)와 Python 호출 규약을 2N-5 프롬프트에 명시해야 하는 결정 사항**이다.

## Output / Report contract readiness 판단 — **정합**

- findings 스키마·validator(30)·renderer(22)·delivery(34) green, §7 사용자 문구 규칙(커버리지 공시·provider명
  금지·인용 품질)이 2M-5에서 반영·테스트됨. 산출물은 consultant-review draft로 일관 표기, user_summary의
  경로 무노출 유지. quickstart의 산출물 기대치(DOCX 우선→HTML/MD fallback)와 renderer 실제 동작 일치.

## 2N-5 scenario readiness 판단 — **실행 가능 단위로 분해됨**

quickstart §7의 12개 시나리오는 각각 독립 실행 가능하다. 준비물 관점 확인:
텍스트/혼합/스캔 PDF·DOCX·HWPX·HWP 샘플(로컬 보유 — repo 밖), assisted 사전 준비 상태(기존 tool-cache의
Kordoc+portable Node 실물 존재 — 시나리오 7·8), 미설정 시뮬레이션(`--tool-cache` 빈 폴더 지정으로 재현 가능 —
시나리오 6·9), 오염 점검(기존 스캔 절차 재사용 — 시나리오 12). 시나리오 9의 "다운로드 실패 모의"는 로컬
fixture 불일치 케이스로 재현 가능(실 네트워크 불요).

## 발견한 blocker / risk 분류

### 2N-5 전 반드시 (결정 — repo 수정 아님)
1. **2N-5 실행 환경 정의 + Python 호출 규약을 2N-5 프롬프트에 명시**: (a) 어느 셸/환경 기준인지,
   (b) Python 구성요소 호출은 bare `python`인지 P0-B 절대 경로인지. 미명시 시 core 단계에서 환경 실패 가능 —
   이 리뷰의 유일한 "반드시" 항목이다.

### 2N-5에서 관찰하면 되는 것
2. assisted 산출물→ingest→Skill 연계가 **수동 배선**(runner 통합 pending)이라는 점이 사용자 여정에서
   어떻게 보이는지(시나리오 4~7의 실제 단계 수·이해 가능성).
3. HWPX/DOCX에서 **어느 runner(.py/.cjs)를 쓰는지와 aux 신호 차이**가 산출 품질에 주는 영향(기록 필요).
4. 스캔 PDF의 안내 품질(허위 앵커 0 — 시나리오 3)과 delivery fallback(시나리오 11).
5. Kordoc `images/` 부산물이 테스터에게 어떻게 안내되는지(민감도 정책 문서 존재 — 실경험 확인).

### 비차단 개선 (2N-5 착수 전 처리 권장 포함)
6. `.gitignore`에 `*.hwp`/`*.hwpx`/`*.docx` 1줄 추가(원본 미커밋 방어 대칭성 — **착수 전 권장**).
7. README "저장소 구조" 트리에 `src/intake/` 반영(stale — 제출 전 wording pass).
8. Python runner의 evidence 실패 traceback·bare npm 표시(2N-4D-A에서 Node만 보정 — reference 지위라 비차단,
   기록 유지 D85④).

## 검증 명령과 결과

- `git diff --check` PASS · working tree clean.
- `node --test tests/test_portable_node_bootstrap.test.cjs` **11/11** ·
  `node --test tests/test_hwp_assisted_runner_node.test.cjs` **39/39**.
- Python 7종 전부 green(시스템 Python 3.14.5 — bare `python`이 이 셸에서는 동작, Codex 세션과의 차이가
  곧 위 "반드시" 항목의 근거): runner 49 · nethook 29 · validator 30 · renderer 22 · delivery 34 ·
  intake 83 · aux 26.
- 오염 스캔: tracked/untracked 모두 해당 유형 0건. manifest/marketplace JSON parse OK, README·quickstart
  링크 대상 실재 확인.

## 금지 범위 준수

기능 구현·코드/문서 patch·다운로드·npm install·Kordoc 재설치·OCR·2N-5 실행·submission.zip·산출물 생성 —
전부 미수행(읽기 전용 inspection + 테스트 실행 + 스캔만).

## Codex 2N-4H review로 넘겨도 되는가

**가능하다.** P2N5-UX-MAJ-01 재개가 필요한 quickstart↔아키텍처 직접 모순은 발견하지 못했다.
Codex 2N-4H 리뷰(또는 2N-5 프롬프트 작성) 시 위 "반드시" 1건(2N-5 환경·Python 규약 명시)과
비차단 6·7(착수 전 처리 권장)을 함께 다루면 된다.
