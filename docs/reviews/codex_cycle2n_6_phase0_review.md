# Codex Review - Cycle 2N-6 Phase 0

## Review Overview

- Review target: Cycle 2N-6 Phase 0 independent review
- Branch: `main`
- Reviewed base commit: `cf9b8ea779962e4dfbe92bd36b938121cb0177a6`
- Reviewed target commit: `ad9557a2fc91df2f903861173289a3c6b6120abf`
- Target commit message: `fix: converge tool-cache write failures and add blackbox protocol`
- Role: Codex independent verifier. This review did not modify implementation, tests, planning docs, status docs, decision docs, generated outputs, package files, or runtime artifacts.

## Verdict

**PASS**

Cycle 2N-6 Phase 0 is narrow enough for the intended remediation scope and sufficiently resolves the Phase 0 obligations from the post-2N-5 plan:

- R1 controlled-failure behavior is implemented in the Node runner boundary used by HWP-family routing, PDF Kordoc-first routing, and page-set OCR routing.
- R2 black-box protocol is now concrete enough to rerun scenario 1 as `sample document -> Skill/LLM findings -> scripted preflight/delivery`, while preserving the fact that findings generation is not a deterministic repo parser.
- R3 transition-period Python UTF-8 handling is documented and minimally guarded at CLI entry points without introducing portable Python or expanding Python core scope.
- No broad Node migration, OCR runtime execution, package state change, generated artifact, 2N-5 PASS claim, L2/L3 completion claim, provider finalization, or product completion claim was introduced.

Phase 1 can proceed. There are no required fixes before Phase 1 or before preparing 2N-5R, assuming 2N-5R follows `docs/blackbox_protocol.md`.

## Reviewed Scope

### Required Source-of-truth

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/planning/post_2n5_final_remediation_plan_node_only.md`
- `docs/reviews/codex_post_2n5_final_remediation_plan_node_only_review.md`
- `docs/cycle2n_6_phase0_completion_report.md`
- `docs/blackbox_protocol.md`

### Additional Files Reviewed

- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/document_intake_router.cjs`
- `src/intake/runners/pdf_ocr_runner.cjs`
- `src/intake/dei_producer.py`
- `src/renderers/kssb_report_delivery.py`
- `tests/test_toolcache_write_failure.test.cjs`
- Related existing runner, validator, renderer, delivery, intake, nethook, and aux scanner tests listed below.

## Actual Changed Files

`git diff --name-only cf9b8ea779962e4dfbe92bd36b938121cb0177a6..ad9557a2fc91df2f903861173289a3c6b6120abf` reported:

- `docs/blackbox_protocol.md`
- `docs/current_status.md`
- `docs/cycle2n_6_phase0_completion_report.md`
- `docs/decision_log.md`
- `src/intake/dei_producer.py`
- `src/intake/runners/document_intake_router.cjs`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/pdf_ocr_runner.cjs`
- `src/renderers/kssb_report_delivery.py`
- `tests/test_toolcache_write_failure.test.cjs`

The changed surface matches Phase 0: one protocol doc, status/decision/completion docs, three Node runner surfaces, two minimal Python CLI UTF-8 guards, and one focused Node test file.

## Validation Performed

### Directly Executed

- `git diff --check cf9b8ea779962e4dfbe92bd36b938121cb0177a6..ad9557a2fc91df2f903861173289a3c6b6120abf` - pass
- `node --test tests/test_toolcache_write_failure.test.cjs` - 8/8 pass
- `node --test tests/test_hwp_assisted_runner_node.test.cjs` - 39/39 pass
- `node --test tests/test_document_intake_router.test.cjs` - 21/21 pass
- `node --test tests/test_pdf_ocr_runner.test.cjs` - 29/29 pass
- `node --test tests/test_portable_node_bootstrap.test.cjs` - 11/11 pass
- `<PY> tests/test_intake_dei_producer.py` with `PYTHONUTF8=1`, `PYTHONIOENCODING=utf-8` - 83/83 pass
- `<PY> tests/test_delivery_wiring.py` with UTF-8 env - 34/34 pass
- `<PY> tests/smoke_test_renderer.py` with UTF-8 env - 22/22 pass
- `<PY> tests/test_findings_validator.py` with UTF-8 env - 30/30 pass
- `<PY> tests/test_hwp_assisted_runner.py` with UTF-8 env - 49/49 pass
- `<PY> tests/test_nethook.py` with UTF-8 env - 29/29 pass
- `<PY> tests/test_aux_structure_scanner.py` with UTF-8 env - 26/26 pass
- Additional in-process OCR install-approval write-failure probe: controlled exit 7, `execCalls=0`, `fetchCalls=0`
- Additional R3 forced `PYTHONIOENCODING=cp949` probe for `dei_producer.py`: exit 0, `bbox≈` present, no `UnicodeEncodeError`
- Repo contamination scan for package/lock files, `node_modules`, tool-cache directories, generated intake/OCR/aux artifacts, traineddata, archives, and `submission.zip` - no hits
- Overclaim search for 2N-5 PASS, OCR/L2/L3 completion, provider finalization, product completion, and audit/certification/compliance-finality terms - hits were negation, boundary, validator/test, or historical review contexts

### Static Review Used As Supporting Evidence

- Reviewed runner source to confirm `recordApproval`, `appendPrepEgress`, `appendRunLog`, out-dir creation, OCR traineddata writes, and OCR final JSON atomic writes converge through `RunnerError`/exit 7 or preserve existing controlled `RunnerError`.
- Reviewed `docs/blackbox_protocol.md` to confirm Skill/LLM findings generation remains a manual judgment step and scripted checks only cover preflight/delivery.
- Reviewed status/decision docs to confirm Phase 0 is not represented as product completion, 2N-5 pass, broad Node migration, OCR support completion, L2/L3 completion, or provider finalization.

### Not Executed

- No actual Kordoc reinstall, npm install, OCR runtime download, rasterizer execution, portable runtime setup, sample folder rerun, generated report creation, or submission packaging was executed. These are intentionally outside this review scope and do not weaken the verdict.

## R1 - Controlled Failure Review

The R1 patch is correctly placed at the shared Node runner boundary:

- `hwp_assisted_runner.cjs` now exports `TOOLCACHE_WRITE_FAIL_MESSAGE`, `OUTDIR_WRITE_FAIL_MESSAGE`, and `guardedWrite`.
- Tool-cache write primitives (`recordApproval`, `appendPrepEgress`, `appendRunLog`) wrap non-controlled filesystem failures as path-free `RunnerError`s.
- `document_intake_router.cjs` and `pdf_ocr_runner.cjs` reuse the same guard rather than inventing separate failure text.
- Each runner has a `main`/`mainInner` wrapper so programmatic calls and CLI calls converge on Korean guidance plus documented exit 7 for `RunnerError`.
- Approval-record failure happens before install/run execution. The focused tests and the additional OCR install-approval probe confirmed no install, run, fetch, or artifact write begins when approval logging cannot be recorded.
- User-facing failure output is path-free. The tests assert no stack trace, no `RunnerError` class name, no repo path, and no user-home/tool-cache path leaks.

The tests are appropriately narrow. They simulate write failure using a regular file path under a temporary directory, avoiding real permission changes and avoiding home tool-cache mutation.

## R2 - Black-box Protocol Review

`docs/blackbox_protocol.md` is sufficient for a 2N-5R scenario 1 rerun:

- It explicitly separates assisted intake/OCR steps, manual Skill/LLM findings generation, and scripted preflight/delivery.
- It requires recording the prompt, Skill HEAD/version context, inputs, generated findings hash, command exit codes, output hashes, preflight counts, and repo contamination scan.
- It defines PASS/FAIL/BLOCKED criteria in a way that avoids treating environmental approval/sandbox limitations as product success.
- It does not claim byte-determinism for LLM findings. Instead, it judges whether the captured findings satisfy source-bound and report-quality requirements.
- It includes the R3 Python UTF-8 transition rule for the scripted Python half while Node migration remains pending.

The protocol is intentionally not a new deterministic findings generator, and that is the correct architecture for this plugin's Skill-first workflow.

## R3 - Python UTF-8 Transition Review

The R3 patch is narrow and safe:

- `dei_producer.py` and `kssb_report_delivery.py` reconfigure stdout/stderr at `_main` only.
- The library/import path is not changed.
- No portable Python, Python bootstrap, Python dependency expansion, or Python feature work was added.
- Existing Python regression tests passed under the documented UTF-8 environment.
- A targeted forced-`cp949` CLI probe for `dei_producer.py` completed successfully and emitted the `bbox≈` location hint without `UnicodeEncodeError`.

This is an appropriate transition-period guard while the user-approved C-path Node migration remains future work.

## Scope / Artifact / No-overclaim Review

Scope compliance is good:

- No broad Node migration was started.
- No package manager state, root `package.json`, `package-lock.json`, or `node_modules` was added.
- No Kordoc reinstall, npm install, OCR runtime download, rasterizer execution, sample folder rerun, generated report, generated intake/OCR/aux artifact, traineddata, archive, or `submission.zip` was added.
- Status and decision docs preserve that 2N-6 Phase 0 is a remediation step, not 2N-5 passage.
- Searches found no unnegated claim of OCR support completion, L2/L3 completion, provider finalization, product completion, audit opinion, certification opinion, or compliance finality.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

#### OBS-01 - Python runner write-failure parity remains a documented follow-up, not a Phase 0 blocker

- Severity: Observation
- Location: `docs/cycle2n_6_phase0_completion_report.md`, `docs/decision_log.md`
- Issue: The legacy Python HWP runner is not patched with the same controlled write-failure template.
- Impact: Low for Phase 0 and 2N-5R because the reviewed execution path is Node runner based, and Python runner remains a transition/reference surface under D92/D93.
- Recommendation: Keep this as a follow-up only if the Python runner is still exposed in any user-facing or evidence-generating path before Node parity completion.
- Blocking: No.

#### OBS-02 - 2N-5R success still depends on disciplined manual Skill findings capture

- Severity: Observation
- Location: `docs/blackbox_protocol.md`
- Issue: Scenario 1 can now be executed, but its first half remains a manual Skill/LLM step. That is architecturally correct, but the evidence packet must capture the prompt, inputs, findings hash, and human source-bound checks exactly as specified.
- Impact: Low. This is expected by the Skill-first design and is not a Phase 0 defect.
- Recommendation: During 2N-5R, do not skip the capture metadata or replace it with an informal summary.
- Blocking: No.

## Readiness

- Phase 1 entry: ready
- Required fixes before Phase 1: none
- Required fixes before 2N-5R: none from this review
- 2N-5R condition: follow `docs/blackbox_protocol.md` and D93 approval/fallback boundaries

## Carry-forward Items

- Phase 1 should proceed with Q1-Q5 documentation quality rules without broad implementation changes.
- 2N-5R should use the new black-box protocol and keep findings generation as a manual Skill/LLM capture step.
- D93 remains active: approved OCR/HWP execution is a required verification scenario for 2N-5R, but not a claim of OCR support completion.
- Phase 2 Node migration remains separate and should continue requiring golden parity plus independent review.

## Final Report

- verdict: `PASS`
- reviewed base: `cf9b8ea779962e4dfbe92bd36b938121cb0177a6`
- reviewed target: `ad9557a2fc91df2f903861173289a3c6b6120abf`
- critical: 0
- major: 0
- minor: 0
- observations: 2 nonblocking
- Phase 1 entry: ready
- required fixes before 2N-5R: none
- scope compliance: acceptable
- artifact contamination: none detected
- no-overclaim judgment: acceptable
- review doc only: `docs/reviews/codex_cycle2n_6_phase0_review.md`
