# Cycle 2N-4 — HWP-first Assisted Retest Report

> **성격**: 승인 기반 **실 실행 evidence retest**(OCR/rasterizer/tesseract.js/portable Node는 범위 밖 유지).
> 상위 규칙: `AGENTS.md`·`docs/operating_principles.md`. 근거: Codex 2N-3B **PASS**(C2N3-MAJ-01 해소, 2N-4 진행 허용) + AVR-01~06.
> 샘플 원본·생성 artifact·tool-cache는 **repo 미커밋**(전부 repo 밖). 로컬 경로는 필요한 수준으로만 일반화 표기.

## 목적

사용자 승인 하에 Kordoc을 repo 밖 tool-cache에 준비하고 HWP/HWPX/DOCX assisted path를 실제 실행했을 때,
nethook no-egress 요약·artifact 생성·ingest 호환성·Windows/UTF-8/한국어 파일명·npm 호출·Python 회귀가 충분한 증거로 남는지 검증.

## 실행 환경

- OS: Windows 10 · 셸: Git Bash(주) + **Windows PowerShell 5.1(교차 검증)**.
- **Python**: `python` = 3.14.5 (pytest 미설치 — standalone script가 지원 경로, 실제 사용 명령: `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python tests/<file>.py`).
- **Node**: v24.16.0. **npm**: 11.13.0.
- **npm 해석 증거(AVR-04)**: PowerShell `Get-Command npm` → **`npm.ps1`(ExternalScript — 실행 정책 차단 위험 실증)**.
  Python `shutil.which("npm")` → **`npm.CMD`(안전 경로)**. → runner가 탐지 경로를 설치 명령에 쓰도록 **좁은 patch 적용**(아래).

## 좁은 code patch (2N-4 중 발견 blocker 해소 — 허용 범위)

- `hwp_assisted_runner.py`: `build_install_command(tool_cache, npm_exe="npm")` 파라미터 추가, `main()`이 `detect_node()`의
  npm 해석 경로를 전달. **사유**: 리터럴 `"npm"`은 Windows CreateProcess에서 `.cmd` 해석이 안 돼 subprocess 실패 —
  `npm.CMD` 명시 사용이 npm.ps1 정책 문제까지 우회(AVR-04 정확 대응). 테스트 1건 추가(49/49).

## 승인 절차 (runner 게이트 그대로 이행)

1. `--check`(plan 모드): 설치 필요·설치 명령·설치/실행 승인 문구 표시, 실행 없음(rc=0).
2. **무플래그 실행 → 설치 승인 문구 표시 후 rc=5 종료**(무승인 설치 불가 라이브 증거).
3. 설치 승인은 본 2N-4 지시(사용자)로 부여됨 — `--approve-install`로 실행. **설치 완료 후에도 rc=6(실행 승인 별도 요구)** — 게이트 분리 증거.
4. `--approve-run --evidence-mode`로 문서별 실행(evidence 모드: 훅 미관측 시 실패 처리).
- 승인 문구는 한국어로 Kordoc·버전·설치 위치(저장소 밖·폴더 삭제로 제거)·준비 단계 네트워크 발생·실행 단계 no-egress·거부 시 baseline 계속을 모두 명시함(실출력 확인).

## Tool-cache / Kordoc 준비 결과

- 위치: `<사용자 홈>/.samil-kssb-precheck/tools/`(설계 기본값 — repo 밖).
- **설치 성공**: `kordoc@3.13.0` + `pdfjs-dist@4.10.38`(pin 일치 확인), `node_modules/kordoc/dist/cli.js` **존재(AVR-02 layout 확인)**.
- **`--omit=optional` 실효**: tool-cache 전체에서 native 바이너리(.node/.dll/.exe) **0건**.
- **준비 egress 기록**: `prep_egress_log.jsonl`에 started/ok 2행(timestamp·action·provider·version·source=registry.npmjs.org·
  command_summary(npm.CMD 경로 포함)·status). 승인 marker `approvals.json`에 install/run 기록.

## 실행 대상 샘플 (원본 미커밋)

sample 폴더의 HWP-first 대표 3종: `smaple.hwp.hwp`(HWP v5)·`smaple.hwpx.hwpx`·`smaple.docx.docx`
(+ PowerShell 검증용으로 HWPX를 `한글 문서 사본 (검증).hwpx`로 복사 — 한국어·공백·괄호 파일명).

## 실행 command 요약

`python src/intake/runners/hwp_assisted_runner.py <문서> --out-dir <repo 밖 임시 폴더> --approve-run --evidence-mode`
→ 내부적으로 `node --require nethook.cjs <tool-cache>/.../cli.js <문서> --format json -o <out> --silent` (NETHOOK_MODE=block).

## nethook summary / no_egress_verified 근거 (AVR-01)

- **4회 실행 전부**(hwp/hwpx/docx + PowerShell 한국어 파일명 hwpx): `hook_observed=true`, `egress_attempts=0`,
  → **`no_egress_verified=true`** — run_log.jsonl에 provider/버전과 함께 기록. evidence 모드였으므로 훅 미관측이면 실패했을 것(정책 실증).
- 실 Kordoc 실행에서 child process·미커버 경로로 인한 egress 시도 관측 없음(요약 egress 0).

## 생성 artifact (repo 밖 out_dir)

| 파일 | 크기 | 비고 |
|---|---|---|
| smaple.hwp.intake.json | 348,192 B | **2L-3C 산출과 바이트 동일** — 교차 컨텍스트 결정성 |
| smaple.hwpx.intake.json | 341,346 B | 〃 |
| smaple.docx.intake.json | 238,416 B | 〃 |
| smaple.hwpx/docx.aux_signals.json | 각 ~0.4KB | aux 스캐너 in-process 생성(hwpx: table_top_level 27 등) |
| 한글 문서 사본 (검증).intake/.aux_signals.json | — | PowerShell 경로에서 생성 |
| (부산물) images/ 70개 | — | **Kordoc이 문서 내 이미지를 out-dir에 추출** — repo 밖이지만 artifact 정책 관찰 항목(아래 follow-up) |

`.ocr_text.json` **미생성 확인**(HWP-first 원칙 준수).

## Ingest 호환성 (AVR-02 후반) — **핵심 발견(blocker)**

- **PDF 대조군(양성)**: PDF-shaped intake(2L-3C textpdf) → `dei_producer` **rc=0**, DEI 생성(blocks 165) — ingest 체인 자체는 정상.
- **HWP-계열 3종 전부 계약 거부(설계된 fail-fast)**:
  - HWP/HWPX: `IntakeError: intake requires non-empty 'pageQuality'` — **Kordoc의 HWP/HWPX/DOCX JSON에는 `pageQuality`/`qualitySummary`가 없음**(PDF 전용 필드, 2L-3C 저장 산출물로 교차 확인).
  - DOCX: `IntakeError: metadata.pageCount as int >= 1` — DOCX는 `pageCount: null`.
- **판단**: L1 ingest 계약이 "관측된 Kordoc **PDF** 출력 형태"를 기준으로 동결됐기 때문에 생긴 **형식별 계약 공백**이며,
  runner·Kordoc·훅의 결함이 아니다. 지시된 금지(기존 ingest contract 변경)에 따라 **이번 사이클에서 패치하지 않고 blocker로 기록** —
  비페이지 포맷용 계약 확장(또는 어댑터 정규화)은 **별도 결정+Codex 리뷰 사이클** 필요. fail-fast가 침묵 실패를 정확히 막았음(경계 설계 검증).

## Windows/UTF-8/한국어 파일명 (AVR-05)

- **PowerShell 5.1에서 runner 직접 실행 성공**: 한국어+공백+괄호 파일명·한국어 out-dir·UTF-8 stdout(한국어 안내) 전부 정상(rc=0).
- artifact 내용 검증: intake.json UTF-8 파싱 정상, 한글 10,057자 보존, aux doc_format=hwpx.

## package / artifact 오염 방지

- repo 루트 `package.json`/`package-lock.json` 없음, repo 내 `node_modules` 없음, repo 내 `*.intake/.ocr_text/.aux_signals.json` **0건**.
- tool-cache·샘플·생성 artifact 미커밋. `.gitignore` 방어 유지. `git diff --check` clean.

## 테스트 결과 (실사용 명령: `python`(3.14) standalone)

nethook **29/29** · runner **49/49**(npm_exe patch 검증 +1) · validator 30 · renderer 22 · delivery 34 · intake 56 · aux 26 — **전부 green**.
pytest는 미설치라 `python -m pytest` 계열은 **미실행**(standalone script가 repo 지원 경로 — 래퍼는 2N-3A에 추가돼 있음).

## 실패/경고/미확인 항목

- **[Blocker]** HWP-계열 intake의 ingest 계약 거부(위 — 별도 계약 결정 사이클 필요).
- **[관찰]** Kordoc이 out-dir에 `images/`(문서 내 이미지 70개)를 추출 — repo 밖이라 무해하나 artifact 정책(민감 이미지 취급·정리 규약)에 명시 필요.
- **[미확인]** pytest 수집(미설치), OS/커널 레벨 no-egress(기존 비차단), dgram/child_process(실행 중 미관측 — 한계 문서화 유지).

## 2N-5 진입 가능 여부 판단

- **runner·승인 UX·no-egress·npm·Windows/한국어 경로는 2N-5 준비 완료 수준의 증거 확보.**
- 단 **"이 보고서 분석해줘" E2E는 HWP-계열 ingest 계약 공백 때문에 DEI 합류 단계에서 끊긴다** — 2N-5 전에
  (a) 비페이지 포맷 ingest 계약 확장 결정(+구현+리뷰) 또는 (b) 2N-5 범위를 "artifact 생성까지"로 한정하는 결정 중 하나가 필요.
  **권고: (a)를 좁은 사이클(2N-4B 등)로 처리 후 2N-5 진행.** 최종 판단은 사용자/ChatGPT.
