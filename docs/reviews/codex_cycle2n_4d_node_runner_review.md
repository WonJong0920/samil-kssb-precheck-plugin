# Codex Cycle 2N-4D Node HWP Assisted Runner Review

## Verdict

**CONDITIONAL PASS**

Cycle 2N-4D adds a useful Node implementation of the HWP assisted runner with strong parity against the existing Python runner: the approval gates, Kordoc/pdfjs pins, tool-cache posture, nethook reuse, no-egress provenance model, and built-in `node:test` coverage are largely sound. The implementation does not change schema, validator, renderer, delivery, DEI producer, Skill, manifest, marketplace, package files, or the existing `nethook.cjs`.

However, one CLI error-handling issue must be fixed before the Node runner is used as the next assisted-path evidence vehicle or as part of a 2N-5 execution flow. In `--evidence-mode`, a failed no-egress provenance check can escape as an uncaught `RunnerError`, producing a stack trace, local code paths, and process exit `1` instead of the documented runner failure exit code. A smaller check-mode display issue also remains: the printed install plan still shows bare `npm install ...` even though actual execution correctly resolves `npm.cmd`.

## Reviewed scope

- Current HEAD reviewed: `16dc434773f00194dfe6cc442e1c8a9d7281f893`
- Original 2N-4D implementation base: `4171007801cac6651890ececce0669b6cb09b90a`
- Original 2N-4D implementation commit referenced in the prompt history: `3abade893767e2251c8252c46a666e0d87ffc8dc`

Primary files read:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/samples/codex_runtime_probe_evidence_p0.md`
- `docs/samples/codex_runtime_probe_evidence_p0b.md`
- `docs/planning/cycle2n_4c_runtime_strategy_python_reduction_plan.md`
- `docs/reviews/codex_cycle2n_4c_runtime_strategy_plan_review.md`
- `docs/planning/cycle2n_4_hwp_first_assisted_retest_report.md`
- `docs/planning/cycle2n_4b_hwp_family_ingest_contract_decision.md`
- `docs/reviews/codex_cycle2n_4b_hwp_family_ingest_contract_review.md`
- `docs/planning/cycle2n_0b_runner_provider_ux_design.md`
- `docs/planning/cycle2n_1a_hwp_first_scope_decision.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/submission_packaging_policy.md`
- `src/intake/runners/hwp_assisted_runner.py`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/nethook.cjs`
- `src/intake/runners/README.md`
- `src/intake/README.md`
- `tests/test_hwp_assisted_runner.py`
- `tests/test_hwp_assisted_runner_node.test.cjs`
- `tests/test_nethook.py`

## Actual changed files

The actual current HEAD contains the 2N-4D runner changes plus a later runtime probe evidence document.

Diff from `4171007801cac6651890ececce0669b6cb09b90a` to current HEAD includes:

- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/samples/codex_runtime_probe_evidence_p0b.md`
- `src/intake/README.md`
- `src/intake/runners/README.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `tests/test_hwp_assisted_runner_node.test.cjs`

The Node runner implementation surface itself is the expected six-file set when compared to the original 2N-4D commit:

- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/README.md`
- `src/intake/runners/README.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `tests/test_hwp_assisted_runner_node.test.cjs`

The extra `docs/samples/codex_runtime_probe_evidence_p0b.md` file is runtime environment evidence, not a Node runner implementation change. It supports the absolute-path Python context but is outside the runner review surface.

No schema, validator, renderer, delivery, DEI producer, Skill, manifest, marketplace, package file, lock file, `node_modules`, tool-cache, generated artifact, raw sample, or submission archive was added or modified by the Node runner implementation surface.

## Runtime/test execution result

Executed checks:

- `node --test tests/test_hwp_assisted_runner_node.test.cjs`
  - Result: pass, 27/27 tests passed.
- `node src/intake/runners/hwp_assisted_runner.cjs`
  - Result: usage output observed with nonzero exit. Unit tests cover the intended usage exit code contract.
- `node src/intake/runners/hwp_assisted_runner.cjs sample.hwp --out-dir <TEMP>/out --tool-cache <TEMP>/tool-cache --check`
  - Result: exit 0, no install/run executed, temporary directory removed.
  - Observed issue: displayed install command starts with bare `npm install ...`.
- Controlled evidence-mode failure probe with a fake repo-external Kordoc install and a fake `cli.js` that triggered a blocked DNS lookup under nethook:
  - Result: exit 1 with uncaught stack trace from `hwp_assisted_runner.cjs`, including local code paths.
  - This confirms `C2N4D-MAJ-01`.
- Python regression checks using the P0-B absolute Python path:
  - `tests/test_hwp_assisted_runner.py`: pass, 49/49 checks passed.
  - `tests/test_nethook.py`: pass, 29/29 checks passed.
  - `tests/test_intake_dei_producer.py`: pass, 83/83 checks passed.
  - `tests/test_aux_structure_scanner.py`: pass, 26/26 checks passed.
  - `tests/test_findings_validator.py`: pass, 30 total / 0 failed.
  - `tests/smoke_test_renderer.py`: pass, 22 total / 0 failed.
  - `tests/test_delivery_wiring.py`: pass, 34 total / 0 failed.
- `git diff --check`: pass.
- `git status --short`: clean before adding this review document.
- Artifact/package contamination scans: no committed `package.json`, `package-lock.json`, `node_modules`, generated `.intake.json`, `.ocr_text.json`, `.aux_signals.json`, `submission.zip`, runtime archive, installer, or tool-cache was found.

No Kordoc reinstall, `npm install`, portable runtime download, OCR/rasterizer/tesseract execution, generated report commit, or submission packaging was performed.

## CLI parity assessment

The Node runner provides strong CLI parity with the Python runner:

- Flags are present: `--check`, `--approve-install`, `--approve-run`, `--evidence-mode`, `--out-dir`, and `--tool-cache`.
- Exit constants are present for 0, 2, 3, 4, 5, 6, and 7.
- Tool-cache layout remains repo-external by default.
- Kordoc and pdfjs pins are preserved.
- The install command uses `--omit=optional`, `--no-audit`, `--no-fund`, and a prefix-based tool-cache install.
- No global install, npx path, package file, or lock file is introduced.
- The runner generates the expected v1 intake artifact and intentionally omits aux signals in the Node path.

The main parity gap is at the CLI boundary for evidence-mode failures. Programmatic tests currently assert that `main()` returns a thrown `RunnerError`, but the executable CLI wraps `main()` directly with `process.exit(main(...))`. That means a thrown `RunnerError` bypasses the documented exit-code contract and prints a stack trace.

## Approval gate assessment

Approval gates are mostly sound:

- Check mode prints a plan and performs no install or run.
- Missing Kordoc without `--approve-install` returns the install-approval-needed path.
- Existing Kordoc without `--approve-run` returns the run-approval-needed path.
- Install and run approvals remain separate.
- Korean approval text is consistent with the existing policy direction and does not claim automatic adoption.

No approval-free install or approval-free run path was found in code review or the Node test suite.

## npm.cmd / npm.ps1 risk assessment

Actual install execution correctly resolves `npm` through `which()` and, on Windows, selects `npm.cmd` while excluding `npm.ps1`. The node test suite explicitly covers this path.

The check-mode plan display is weaker. It calls `buildInstallCommand(toolCache)` without the resolved `node.npm`, so the user-facing plan shows bare `npm install ...`. This does not affect the actual install execution path, but it conflicts with the P0/P0-B WindowsApps/PowerShell-stub lessons and could mislead a user copying the displayed command manually.

## nethook/no-egress provenance assessment

The runner reuses the existing unchanged `nethook.cjs` with `--require` and `NETHOOK_MODE=block`. The provenance parser sets `no_egress_verified=true` only when a nethook summary is observed and `egressAttempts=0`. That core rule is correct.

The issue is failure presentation and exit-code handling, not the provenance rule itself. When `--evidence-mode` is set and no verified summary is available, `buildRunProvenance()` throws a `RunnerError`. In the CLI executable path this can surface as a raw stack trace and exit `1`, which weakens both output safety and contract parity.

## Artifact/package contamination assessment

The implementation keeps the repo clean:

- No `package.json` or lock file is added.
- No `node_modules` is added.
- No tool-cache is added under the repo.
- No generated intake/OCR/aux/report artifact is added.
- No `.mcp.json`, `.app.json`, marketplace, or manifest file is changed.
- No `submission.zip` is generated.

Temporary directories used during review probes were created outside the repo and removed.

## v1 aux_signals omission assessment

The v1 Node runner intentionally does not generate `.aux_signals.json`. This is acceptable for the current purpose because the Node runner is a runner-level assisted path parity step, not a full replacement for every Python-side auxiliary scanner capability.

The omission is documented in both runner and intake README materials. It should remain visible during 2N-5 planning because HWPX/DOCX auxiliary-structure coverage is still Python-path dependent unless a later Node aux scanner is designed and reviewed.

## No-overclaim assessment

No current-facing overclaim was found. The status and decision log preserve the intended boundary:

- The Node runner is not described as 2N-5 unblocking by itself.
- Python ingest/reporting remains necessary.
- L2 full completion, plugin-side OCR support, provider finalization, and L3 semantic analysis are not claimed.
- Kordoc remains an assisted/local provider candidate, not a core hard dependency.

## Findings by severity

### Critical

None.

### Major

**ID:** C2N4D-MAJ-01

**Severity:** Major

**Location:** `src/intake/runners/hwp_assisted_runner.cjs:266`, `src/intake/runners/hwp_assisted_runner.cjs:272`, `src/intake/runners/hwp_assisted_runner.cjs:410`, `src/intake/runners/hwp_assisted_runner.cjs:467`, `tests/test_hwp_assisted_runner_node.test.cjs:299`

**Issue:** Evidence-mode no-egress provenance failure can escape the CLI as an uncaught `RunnerError`, producing a JavaScript stack trace and exit `1` rather than the documented runner failure exit code. The existing unit test asserts the thrown programmatic error, but it does not verify the executable CLI behavior.

**Impact:** This breaks exit-code parity and output safety for a central failure path. It can expose local code paths in user-facing output and makes automation treat a controlled evidence failure as an unexpected process failure.

**Recommendation:** Catch `RunnerError` at the CLI boundary or inside `main()`, return `EXIT_RUN_FAILED=7`, and print a concise Korean error message without stack trace or local paths. Add a CLI/subprocess-style regression test that asserts exit `7`, no stack trace, and no local path leakage for evidence-mode provenance failure.

**Blocking:** Yes before using the Node runner for the next assisted execution evidence or 2N-5 runner evidence. It does not invalidate the overall Node runner direction.

### Minor

**ID:** C2N4D-MIN-01

**Severity:** Minor

**Location:** `src/intake/runners/hwp_assisted_runner.cjs:373`, `tests/test_hwp_assisted_runner_node.test.cjs:171`, `tests/test_hwp_assisted_runner_node.test.cjs:194`, `tests/test_hwp_assisted_runner_node.test.cjs:349`

**Issue:** Check mode displays an install command beginning with bare `npm install ...`, even though actual install execution correctly uses the resolved `npm.cmd` path and avoids `npm.ps1`.

**Impact:** The executed path is safe, but the displayed plan can conflict with Windows/P0 guidance and could mislead a user who copies the plan command manually.

**Recommendation:** In check mode, render the same resolved npm executable that would be used for execution, then add a test that check-mode output does not display bare `npm` when `npm.cmd` has been resolved.

**Blocking:** No for the Node port direction; should be fixed before user-facing check-mode evidence is relied on.

### Observations

**ID:** C2N4D-OBS-01

**Severity:** Observation

**Location:** `docs/samples/codex_runtime_probe_evidence_p0b.md`

**Issue:** Current HEAD includes a P0-B runtime probe evidence document in addition to the original 2N-4D Node runner implementation files.

**Impact:** This is not a runner implementation change and does not affect the runner review verdict. It does show that absolute-path Python execution is now available in this session.

**Recommendation:** Keep runtime strategy decisions separate from this Node runner review. Use P0/P0-B evidence during the next runtime strategy branch decision.

**Blocking:** No.

**ID:** C2N4D-OBS-02

**Severity:** Observation

**Location:** `src/intake/runners/README.md`, `src/intake/README.md`

**Issue:** The Node runner v1 omits aux signals.

**Impact:** This is safe and documented, but 2N-5 should not assume Node-run HWPX/DOCX coverage includes the Python auxiliary scanner signals.

**Recommendation:** If 2N-5 uses the Node runner, record the missing aux-signal limitation in evidence and user-facing quality assessment.

**Blocking:** No.

**ID:** C2N4D-OBS-03

**Severity:** Observation

**Location:** review environment

**Issue:** P0-B shows absolute Python can execute the existing regression suite in this Codex session.

**Impact:** Node runner parity is still useful, especially for runner-level Windows/npm/nethook validation, but Python is no longer completely unavailable in this specific session.

**Recommendation:** Decide in the runtime strategy branch whether S0 absolute Python is sufficient for 2N-5, whether S1 Node runner parity remains valuable, or whether both should be used in staged fashion.

**Blocking:** No.

## Required fixes before next step

Before using the Node runner as 2N-5 evidence or as the next assisted execution path:

1. Fix `C2N4D-MAJ-01`: evidence-mode provenance failure must return the documented failure exit code and suppress stack traces/local paths.
2. Preferably fix `C2N4D-MIN-01`: check-mode install command display should use the resolved `npm.cmd` path rather than bare `npm`.

## Additional verification requests

- After the Major fix, run a CLI/subprocess test for `--evidence-mode` failure and record exit code, stdout/stderr shape, and absence of local path leakage.
- If check-mode output is patched, run a check-mode command on Windows and confirm the displayed command matches the resolved executable policy.
- Before 2N-5 evidence is accepted, run at least one real approved runner check in the intended environment, without committing tool-cache or generated artifacts.
- Keep Python regression checks in the 2N-5 preflight if the full pipeline still depends on Python ingest/reporting.

## Recommendation for next step

Patch the Node runner CLI error handling first, then re-review narrowly. After that, the Node runner can be used as a runner-level evidence vehicle while keeping provider finalization, L2 full completion, OCR support, and 2N-5 acceptance as separate decisions.
