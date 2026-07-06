# Cycle 2N-4C — 실행 런타임 전략 계획 (Codex 환경 Python 실행 불가 대응)

> **성격**: **계획 문서만**(코드·설치·다운로드·실행 없음). 실제 구현은 **Codex 리뷰 이후** 별도 사이클에서 진행한다.
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Codex 2N-3B(OBS-02)·2N-4B(OBS-01, AVR-01) 관측,
> 2N-0B-A §7.1 portable Node B안 설계(D76), 2N-1A U2-A 확정/U2-B gated(D77).
> 이 문서는 사용자 지시(5개 항목)를 계획에 반영하고, 추가 대안을 제시한다. **전략 확정·B안 채택 확정이 아니다.**

## 1. 문제 정의와 근거

**관측(Codex 리뷰 세션 2회 연속 실측)**:
- `python.exe`/`py.exe`가 **WindowsApps stub으로 해석되어 실행 불가**, `pytest` 부재
  (C2N3B-OBS-02 / C2N4B-OBS-01 — "system cannot access the file").
- 같은 세션에서 **`node -v` = v24.16.0 정상 실행**, git 정상 — 즉 Codex 실행 환경에서 **Node는 가용, Python은 불가**.

**영향 2계층**:
1. **검증 공백(현재 실재)**: Codex 독립 리뷰가 Python 테스트 7종·runner를 실행하지 못해 정적 검토+Node probe에
   의존한다. 회귀 실행 증거가 Claude 환경에만 존재(AVR-01이 매 사이클 반복되는 구조적 원인).
2. **제품 위험(조건부)**: 플러그인의 실행 계층 **전부**가 Python이다 — validator·renderer·delivery(core, 모든 보고서 필수),
   dei_producer·aux_scanner(ingest), hwp_assisted_runner(assisted). 사용자 E2E("이 보고서 분석해줘")가
   Codex 세션과 같은 특성의 환경에서 돌면 **preflight/렌더/전달이 전부 실행 불가**일 수 있다.
   2N-5 블랙박스 전에 이 위험의 실체를 확인해야 한다.

## 2. 현재 Python 의존 표면 인벤토리

| 구성요소 | 파일 | 역할 | 사용자 경로 필수성 | 이식 난이도(Node) |
|---|---|---|---|---|
| validator | `src/validators/kssb_findings_validator.py` | detect-only preflight | **필수**(모든 보고서) | 중(순수 로직·stdlib) |
| renderer | `src/renderers/kssb_report_renderer.py` | findings→DOCX/HTML/MD | **필수** | **상**(DOCX=OOXML zip 조립 — Python `zipfile`은 stdlib, Node엔 zip 내장 없음 → `zlib` 내장+수제 zip writer 필요) |
| delivery | `src/renderers/kssb_report_delivery.py` | 사용자 요약/분리 배선 | **필수** | 중 |
| ingest | `src/intake/dei_producer.py`·`aux_structure_scanner.py` | 계약 검증·DEI 정규화 | 선택(문서 인테이크 시) | 중(계약 재리뷰 필요 — 2L-5·2N-4B 승격 표면) |
| runner | `src/intake/runners/hwp_assisted_runner.py` | 승인 게이트·Kordoc 오케스트레이션 | 선택(HWP-계열) | **하**(subprocess 오케스트레이션 — Kordoc·nethook이 이미 Node) |
| tests | `tests/*.py` 7종(273 checks) | 회귀 증거 | 검증 전용 | 중(포트 대상과 동행) |
| (범위 밖) | `log-hooks/tools/save_log.py` | 사전 존재 로깅 인프라 | — | 대상 아님(D9) |

nethook.cjs(no-egress 훅)와 Kordoc은 **이미 Node** — assisted path는 runner만 이식하면 언어가 단일화된다.

## 3. 먼저 실측해야 할 미확인 사항 (P0 spike — 구현 전 최우선)

전략 선택이 아래 사실에 종속되므로, **코드 작성 전에 Codex 세션에서 실측**한다(Codex 프롬프트로 수행, 설치는 승인 항목만):

- **U-1 절대 경로 실행 가능 여부**: WindowsApps stub은 **PATH 해석** 문제다. Codex 세션에서
  (a) 사용자 시스템에 이미 설치된 Python의 **절대 경로** 호출(`<설치 경로>\python.exe --version`),
  (b) tool-cache 등 PATH 밖 임의 경로의 exe 실행이 되는지. → 되면 **이식 없이 해결 가능성**(S0/S2), 안 되면 Node 이식(S1)만 유효.
- **U-2 Codex 세션의 네트워크 정책**: 준비(다운로드) egress가 세션 안에서 가능한가, 사용자가 밖에서 수행해야 하는가
  (portable 런타임 배치 주체 결정에 필요).
- **U-3 2N-5 블랙박스 실행 환경 정의**(사용자 결정 필요): Codex app 세션에서 도는가 — 그렇다면 §1 영향 2가 실재 위험.
- **U-4 Codex 설정 우회 가능성**: 세션 PATH에 시스템 Python이 노출되도록 Codex 설정/환경으로 해소 가능한지(zero-code 해법 후보).

P0 산출물: `docs/samples/codex_runtime_probe_evidence_<날짜>.md`(실행 가능/불가 매트릭스 — 판정은 Codex 리뷰).

## 4. 전략 옵션 비교

| 안 | 내용 | 장점 | 단점/리스크 | 전제 |
|---|---|---|---|---|
| **S0 절대 경로 호출 규약**(신규 제안) | 기존 시스템 Python을 stub 우회 **절대 경로로 호출**(Skill 지침+문서 규약, 코드 0~미세) | 비용 최소·즉시 | Python 미설치 머신 해결 못함·경로 발견 규약 필요 | U-1(a) 성립 |
| **S1 Node 단일 런타임화**(사용자 방향) | 실행 계층을 Node로 이식 + 시스템 Node 우선 + portable Node B안 fallback | Codex 세션에서 **PATH node 가용 실증** — 리뷰가 테스트 직접 실행 가능해짐(검증 공백 근본 해소)·Kordoc/nethook과 언어 단일화·subprocess 계층 감소 | **이식 비용 최대**(특히 renderer의 OOXML zip 수제 구현)·리뷰된 표면 전면 재리뷰·이행기 이중 구현 드리프트 | 없음(node는 PATH로 이미 가용) |
| **S2 portable Python 동봉**(신규 제안) | python.org **embeddable zip**(≈11MB, installer 없음)을 B안과 **동일 규율**(승인·tool-cache·hash pin·PATH 무수정·폴더 삭제 제거)로 배치, 절대 경로 호출 | **이식 0** — 리뷰된 표면·테스트 273건 전부 보존. stdlib-only 설계와 정확히 부합(embeddable엔 pip 없음 — 본 프로젝트는 불필요) | 무결성 공표가 nodejs.org(SHASUMS256.txt)보다 약함(릴리스 페이지 해시/sigstore — **최초 관측 hash pin**으로 보완)·AV 유의·런타임 2종 관리 | U-1(b) 성립 |
| **S3 단계 하이브리드**(**권고**) | **P0 실측 → 분기**: U-1 성립 시 단기(제출 전)=S2(+S0), S1은 runner부터 단계 이식하는 중기 트랙 / U-1 불성립 시 S1 전면, 우선순위=사용자 필수 경로(core)부터 | 최소 위험으로 제출 일정 보호 + 검증 공백 해소 경로 확보 | 분기 관리 비용 | P0 |

**권고 이유**: S1의 가치(Codex가 직접 실행 검증 가능)는 분명하나, renderer의 DOCX zip 조립을 Node로 재작성하는 것은
새 hardening 표면(Word 열림·결정성 재검증)이며 제출 일정 대비 비용이 크다. U-1이 성립하면 S2가 **모든 Python 구성요소를
무이식으로** 살리므로 단기 최저 위험이고, S1은 이득이 가장 크고 비용이 가장 작은 **runner부터** 점진 진행하는 것이 안전하다.

## 5. 사용자 지시 5개 항목의 계획 반영

| # | 지시 | 계획 반영 |
|---|---|---|
| 1 | Python 의존성 줄이기/제거 | §2 인벤토리 기준 **단계 이식 우선순위**: runner(하, 이득 큼) → ingest(중, 계약 재리뷰 동반) → core(상, 최후). S2 채택 시 "제거" 대신 "런타임 동봉"으로 대체 가능 — 최종 방침은 P0 후 결정(§8-⑤). Python 원본은 이행기 동안 reference 병행, 제거/표기 전환은 제출 전 별도 결정 |
| 2 | 시스템 Node 우선 사용 | **U2-A 그대로 유지**(D77 확정). 탐지 순서 고정: ① 시스템 Node(존재+적합 시 설치 제안 안 함) → ② tool-cache portable Node(기설치분) → ③ 부재 시에만 B안 승인 대화 |
| 3 | Node 부재 시 승인 후 repo 밖 portable Node | **2N-0B-A §7.1 B안 설계 그대로 채용 계획**: nodejs.org 공식 zip → `<홈>/.samil-kssb-precheck/tools/node@<pin>/`에 **압축 해제만**, `SHASUMS256.txt` 검증(불일치 fail-fast), **LTS pin 1버전**(후보: Gate D 관측과 같은 v24 LTS 계열 — 상이 버전이면 AVR-07 재검증), win-x64 한정, **OS installer 미실행·시스템 PATH 영구 수정 없음·관리자 권한 불요**(C안 배제 불변 — D76), 절대 경로 호출, 제거=폴더 삭제, 용량·출처·hash·제거법 고지 포함 승인 대화, prep_egress_log 기록, AV 차단·거부·실패는 전부 A안(안내+baseline) 수렴. **bootstrap**: Node가 전혀 없는 환경의 다운로드·검증·해제는 Windows 내장 PowerShell로 수행하는 source-only 스크립트(승인 후 실행) — Python·Node 없이 성립 |
| 4 | Kordoc tool-cache 승인 설치 | **기존 U1/U3 불변**(2N-4 실증 완료): `kordoc@3.13.0+pdfjs-dist@4.10.38`, `--omit=optional`, `npm --prefix`(portable Node zip에 npm 동봉이라 그대로 성립 — §7.1), 승인 marker·prep egress 기록 유지 |
| 5 | 실행은 no-egress | **nethook.cjs 불변 재사용**(Node 이식과 무관하게 `--require` preload 동일). `no_egress_verified=true`=요약 실관측+egress 0 정책 불변(느슨해지지 않음). portable Node 실행 시에도 동일 훅 적용, 런타임 버전 상이 시 재검증(AVR-07) |

## 6. 구현 Phase 계획 (각 Phase 종료마다 Codex 리뷰)

- **P0 — Codex 실행환경 실측 spike**(§3): 코드 무변경. 설치가 필요한 probe(portable 배치)는 사용자 승인 후 tool-cache에만.
  → **결과로 S0/S1/S2 분기 결정**(사용자/ChatGPT).
- **P1 — runner Node 이식**(S1 트랙 1단계, 분기와 무관하게 가치 있음): `hwp_assisted_runner.cjs`(Node 내장 모듈만) —
  기존 사양 동일(승인 게이트·exit code·한국어 문구·prep egress·provenance 파서·artifact 규약) + 탐지 순서(§5-2) +
  portable Node B안 승인 흐름 + PowerShell bootstrap(§5-3). 테스트는 **`node:test`**(Node 내장 러너 — 의존성 0,
  **repo 루트 package.json 불필요**)로 작성 → **Codex가 리뷰에서 직접 실행 가능**. Python runner는 parity 확인 후 처리 결정(§8-⑤).
- **P2 — ingest 대응**: S2 채택 시 불필요(Python 유지). S1 전면 시 `dei_producer` Node 포트 — **golden fixture parity**
  (동일 입력→DEI JSON byte 동일: PDF paginated·document-level·aux 병합 전 케이스) + 계약 재리뷰 필수(승격 표면).
  ocr_text/canonical hash는 gated 유지 — OCR 경로가 열릴 때 canonical 규칙의 단일 소스 언어를 그 시점에 결정
  (단일 Node 구현이 되면 2N-0B의 교차 언어 위험은 소멸).
- **P3 — core 대응**: S2 채택 시 불필요. S1 전면 시 validator→delivery→renderer 순(renderer 최후 —
  OOXML zip 수제 writer의 결정성·Word 열림 재검증 필요). 산출물 parity(HTML/MD byte, DOCX 구조) 기준 명문화 후 착수.
- **P4 — 문서·표현 정리**: capability 표현은 분리 표기 유지(과장 금지), SKILL.md/README의 런타임 요건 문구 갱신,
  packaging policy에 portable 런타임 취급(zip 포함 여부 — 기본 미포함·승인 다운로드) 추가.

## 7. 불변 경계 (모든 옵션 공통 — 이 계획으로 바뀌지 않는 것)

무승인 설치/실행 금지(승인 게이트) · repo 밖 tool-cache만 사용 · **OS installer 실행/시스템 PATH 영구 수정/관리자 권한 요구
금지**(C안 배제 확정 불변) · hash 검증 fail-fast · 준비 egress 기록↔실행 no-egress 분리 · provider명 3층 정책 ·
OCR/tesseract.js/traineddata/rasterizer **gated 불변**(이 계획은 OCR 경로를 열지 않는다) · repo 루트 package.json/lock 미생성 ·
샘플·artifact·tool-cache 미커밋 · L2 전체 완료/OCR 지원/provider finalization 선언 없음 · Skill-first(사용자 진입점은 Skill 하나).

## 8. 리스크 레지스터와 결정 요청

**리스크**: ① 이행기 이중 구현 드리프트(완화: golden parity fixture + 단일 사양 문서), ② renderer zip 수제 구현 품질(완화:
P3 최후 배치·구조 parity 기준 선행 정의), ③ 리뷰된 표면 재리뷰 비용(완화: Phase당 좁은 diff), ④ python.org embeddable
무결성 공표 체계가 SHASUMS 방식보다 약함(완화: 최초 관측 hash pin + 출처 URL 고정), ⑤ AV 차단(완화: A안 수렴 + 한국어 안내),
⑥ 제출 일정(완화: S3 분기로 단기/중기 분리), ⑦ portable 런타임의 Gate D 재검증 필요 가능성(AVR-07).

**사용자/ChatGPT 결정 요청**:
① 2N-5 블랙박스 실행 환경 정의(U-3), ② P0 spike 진행 승인(Codex 프롬프트 — 승인 필요한 배치 probe 포함 여부),
③ 전략 선택(S0/S1/S2/S3 — P0 결과 후), ④ **portable Python(S2) 후보 수용 여부**(B안과 동일 규율 — 신규 제안),
⑤ Python 원본 코드의 최종 처리(제거 vs reference 유지 — 제출 패키징 정책 연계).

## 9. 이번 사이클 산출물과 다음 단계

- 이번 사이클: **이 계획 문서 + 2N-0B §7.1 포인터 주석 + status/decision 갱신만**(코드·설치·다운로드·실행·테스트 변경 없음).
- 다음 단계: **Codex 계획 리뷰** → P0 spike → 분기 결정 → Phase 구현. 2N-5와의 순서(블랙박스 전/후)는 U-3 답과 함께 ChatGPT/사용자 결정.
