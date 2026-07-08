# Cycle 2N-6 — Trace Manifest Delivery-Terminal Stage 구현 Completion Report

> **성격**: trace manifest stage **구현** 완료 보고다. 설계(`docs/designs/cycle2n_6_trace_manifest_stage_design.md`)와
> Codex design review(**PASS**, required fixes 없음)를 source-of-truth로 삼아 채택 기본값대로 구현했다.
> Claude Code는 구현·검증·보고만 하며 PASS/FAIL 최종 판정은 **후속 Codex implementation review**가 수행한다.
> current_status·decision_log는 이번 커밋에서 수정하지 않았다(구현 review 이후 별도 결정).
>
> 시작 HEAD: `2a3572b…`(README 자체정합화 커밋 이후·clean) / 종료 HEAD: 본 커밋(채팅 보고에 SHA 기재).

## 1. 변경 파일

| 구분 | 파일 |
|---|---|
| **구현** | `src/renderers/kssb_report_delivery.cjs` — opt-in trace manifest stage(`buildTraceManifest`·`writeTraceManifest`·canonical JSON/sha256 헬퍼) + `deliver(...,{manifest})` + CLI `--manifest` |
| **테스트 (신규)** | `tests/test_trace_manifest_node.test.cjs` — **12 tests** |
| **방어** | `.gitignore` — `run_manifest.json` 패턴 추가 |
| 문서 (최소) | `docs/workflow_usage.md`(산출물 정책·CLI 라인) · `src/renderers/README.md`(delivery 절) · 본 보고서 |
| **무변경** | Python 전부(`kssb_report_delivery.py` 등) · renderer.cjs · validator.cjs · dei_producer.cjs · schema · Skill · runner · package/lock/node_modules(없음) |

`current_status.md`·`decision_log.md` **미수정**(프롬프트 지시).

## 2. 채택 기본값 (설계 §16·design review 권장값 그대로)

- **upstream provenance**: v1 제외(delivery segment만 — findings→preflight→대표 문서).
- **findings hash**: **canonical-JSON SHA-256**(파일 포맷·개행 차에 불변).
- **timestamp**: 기본 **미포함**(완전 결정성 — runtime block 미도입).
- **opt-in**: 기본 **off**(`--manifest`/`{manifest:true}`일 때만 생성).
- **파일명/위치**: out-dir의 `run_manifest.json`(내부 artifact). `.gitignore` 방어 추가.
- **self-hash**: 포함(`manifest_sha256` — 자기 필드 제외 canonical core로 계산).
- **D94 hard stop**: manifest **미생성**.

## 3. 구현 위치 / 흐름

`src/renderers/kssb_report_delivery.cjs` 종단(성공 경로)에 stage를 붙였다. delivery가 findings·preflight·
renderer outputs를 모두 in-memory로 가진 **유일한 수렴점**이기 때문이다(renderer에 두면 재판정·provenance
무지 경계 위반, runner에 두면 findings·보고서 정보 부재 — design review 확인).

```
findings → N1 validator preflight → D94 hard stop 검사
  → (error 0) renderReport(DOCX→HTML→MD) → user_summary
  → [manifest:true일 때만] buildTraceManifest → writeTraceManifest(run_manifest.json)
```

- hook/dispatcher 아님(단일 종단 stage, registry 없음).
- `deliver()` 반환에 `manifest`(성공 시 `{filename, manifest_sha256}`, 아니면 null)·`manifest_error`(실패 시
  짧은 사유 코드, 아니면 null) 추가. **hard stop·기본(off) 경로에서는 둘 다 null**.
- CLI: `--manifest` 플래그. exit code 불변(manifest 실패는 종료 코드를 바꾸지 않음). user stdout에 manifest 미언급.

## 4. manifest 내용 (provenance 전용)

결정적 core:
- `manifest_version`("1")·`manifest_kind`("trace_manifest")·`stage`("delivery_terminal").
- `input`: `findings_sha256`(canonical-JSON)·`report_title`·`generated_for`·`review_mode`·`source_count`·
  `area_count`·`item_count`(비경로 식별정보·단순 count).
- `preflight`: `counts{error,warning,info}` + `issues`(**code·severity만**, 정렬 — 전체 message/location 원문 제외)
  + `hard_stop:false`.
- `outputs`: 실제 생성 파일별 `{format, filename(basename), bytes, sha256, primary}`(고정 순서 docx→html→md).
- `primary_format`·`docx_generated`(boolean — docx 미생성/실패는 raw 문자열 없이 boolean으로만).
- `manifest_sha256`: 자기 필드 제외 canonical core의 SHA-256.

**제외(구현·테스트로 강제)**: 로컬 절대경로·계정명·임시경로·tool-cache 경로·stack·validator raw message/location·
findings 원문·보고서 본문·quote 텍스트·`status`/`verdict`/`quality`/`score`/`grade`/`compliance`/`assurance`/
`audit_opinion`/`certified` 등 판정·품질·감사/인증류 필드.

## 5. determinism / self-hash 규칙

- canonical JSON(재귀 key 정렬·compact)으로 hash 입력을 만든다(findings·core 공통). timestamp·runtime 값 미포함이라
  **동일 findings→동일 산출물이면 manifest 파일 바이트까지 결정적**(테스트로 강제 — 2회 실행 byte-identical).
- self-hash 입력 명시(OBS-02): `manifest_sha256` 자기 필드를 **제외**한 canonical core. 테스트가 "core 재계산 =
  저장된 self-hash"와 "self-hash 값을 바꿔도 core 재계산 불변(자기 참조 배제)"을 강제.

## 6. 실패 처리 / 경계

- manifest 생성/쓰기 실패는 **대표 문서 delivery 성공을 깨지 않는다**. `manifest_error="manifest_generation_failed"`
  (경로·stack·원본 예외 메시지 없음)만 남기고 delivery는 성공(exit 0)한다(테스트: write mock 예외 → 보고서 정상·
  manifest null·error 코드만·누출 0). manifest 미생성이 provenance 캡처 성공으로 오인되지 않도록 null/error로 구분.
- **D94 hard stop**: renderReport 이전 중단이라 manifest도 미생성(테스트 강제 — out-dir 미생성·반환 manifest null).
- **user_summary 불변**: manifest on/off와 무관하게 동일(테스트: on==off, "run_manifest" 미언급).

## 7. 검증 결과

| 항목 | 결과 |
|---|---|
| `node --test tests/test_trace_manifest_node.test.cjs` | **12/12 PASS** (skip 0) |
| `node --test tests/*.test.cjs` (전체 Node 스위트) | **354/354 PASS** (skip 0 — 기존 342 + 신규 12) |
| Python reference: validator 30 · delivery wiring 34 · renderer smoke 22 | **전부 PASS (불변 — Python 무수정)** |
| `git diff --check` | clean |
| 오염 스캔(`run_manifest.json`·generated report/intake/OCR/DEI/findings·package·lock·node_modules·traineddata·zip·tool-cache·샘플) | **0건** |

**테스트 커버리지**(요구 전량): 기본 off 미생성 · opt-in 생성 · CLI on/off · output basename/bytes/sha256 실제 파일 정합 ·
findings canonical hash 재현 · self-hash 재현·자기 필드 제외 · 2회 deterministic core 동일 · 누출 0 · 금지 필드 0 ·
D94 hard stop 미생성 · write 실패 시 delivery 성공+안전 error · 기본 출력·user_summary 무회귀.

실행하지 않은 테스트: Python DEI/intake/runner/nethook/aux/OCR parity 스위트 — 이번 diff는 delivery.cjs·신규
테스트·.gitignore·문서만 건드리고 그 표면을 변경하지 않는다(영향 없음). manifest는 **Node-only 신규 stage(포트
아님)**라 **Python parity 대상이 아니다**(대응 Python 구현 없음 — 설계·리뷰 확인).

## 8. 경계 준수 확인

- **기본 실행 무변경**: manifest off가 기본 — 기존 delivery 출력(DOCX/HTML/MD 3파일)·user_summary·N2/N4 parity 무회귀.
- **Python 무변경**: `.py` 전부 diff 0, Python 스위트 green.
- **의존성 0**: Node 내장 모듈(`node:crypto`·`node:fs`·`node:path`)만. package/lock/node_modules 미추가.
- **N5·hook/dispatcher·Phase 3 미착수**: aux scanner·hook registry·품질 강화 무변경.
- generated artifact(`run_manifest.json` 포함) repo 미유입(테스트는 임시 폴더 생성·정리, `.gitignore` 방어).

## 9. 다음 단계

- **Codex implementation review** 필요(설계·채택 기본값·경계 준수·무회귀 대조).
- review PASS 시 current_status·decision_log 갱신을 **별도 결정**으로 처리(이번 커밋 미포함).
- open questions 중 후속 검토 여지: 상류(intake/OCR/DEI/runner) provenance를 잇는 end-to-end manifest는 v1 범위
  밖으로 남김(필요 시 후속 사이클에서 delivery에 상류 요약을 명시 입력으로 주입하는 방식 검토).
