# Codex Cycle 2N-4D-A Node Runner Safety Patch Review

## Verdict

**PASS**

Cycle 2N-4D-A resolves the two required fixes from the Codex Cycle 2N-4D review within the intended narrow scope. Evidence-mode no-egress provenance failure is now a controlled CLI failure with exit code `7`, no stack trace, no `RunnerError` class-name leakage, and no local repo path leakage. Check-mode install command display now uses the same resolved npm executable policy as actual install execution, including `npm.CMD` on Windows rather than bare `npm`.

This review does not declare 2N-5 unblocked, L2 complete, OCR support complete, portable Node adopted, or provider finalization complete. It only verifies the Node runner safety patch.

## Reviewed scope

- Target HEAD after `git pull origin main`: `168c9c0f16cfece70f0617454885e030ed8f2fc2`
- Previous review commit: `8bd3ea0b76380d62490500211db28583c920ad64`
- Review type: narrow patch re-review for `C2N4D-MAJ-01` and `C2N4D-MIN-01`

Primary files read:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/reviews/codex_cycle2n_4d_node_runner_review.md`
- `docs/samples/codex_runtime_probe_evidence_p0.md`
- `docs/samples/codex_runtime_probe_evidence_p0b.md`
- `docs/planning/cycle2n_4c_runtime_strategy_python_reduction_plan.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `tests/test_hwp_assisted_runner_node.test.cjs`
- `src/intake/runners/README.md`

## Actual changed files

Actual diff from `8bd3ea0b76380d62490500211db28583c920ad64` to HEAD:

- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/runners/README.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `tests/test_hwp_assisted_runner_node.test.cjs`

The diff is limited to the expected patch surface. No schema, validator, renderer, delivery, DEI producer, Python runner, `nethook.cjs`, Skill, manifest, marketplace, package file, lock file, `node_modules`, tool-cache, generated artifact, or submission archive changed.

## Test execution result

Executed checks:

- `git pull origin main`
  - Result: already up to date.
- `git rev-parse HEAD`
  - Result: `168c9c0f16cfece70f0617454885e030ed8f2fc2`.
- `git diff --name-only 8bd3ea0b76380d62490500211db28583c920ad64..HEAD`
  - Result: the five expected patch files only.
- `node --test tests/test_hwp_assisted_runner_node.test.cjs`
  - Result: pass, 29/29 tests passed.
- Controlled CLI evidence-mode failure probe using a fake repo-external Kordoc install and fake `cli.js` that attempted blocked DNS under `nethook.cjs`
  - Result: exit code `7`.
  - Output contained an evidence-mode failure message.
  - Output did not contain `RunnerError`.
  - Output did not contain a stack trace.
  - Output did not contain `hwp_assisted_runner.cjs:<line>`.
  - Output did not contain the local repo path.
  - `run_log.jsonl` recorded `hook_observed=true`, `egress_attempts=1`, and `no_egress_verified=false`.
- Check-mode CLI probe
  - Result: exit code `0`.
  - Displayed install command used resolved `npm.CMD`.
  - Displayed install command did not use bare `npm install`.
  - Displayed install command did not use `npm.ps1`.
- Python regression spot checks via P0-B absolute Python path
  - `tests/test_hwp_assisted_runner.py`: pass, 49/49 checks passed.
  - `tests/test_nethook.py`: pass, 29/29 checks passed.
  - `tests/test_findings_validator.py`: pass, 30 total / 0 failed.
  - `tests/smoke_test_renderer.py`: pass, 22 total / 0 failed.
  - `tests/test_delivery_wiring.py`: pass, 34 total / 0 failed.
- `git diff --check`
  - Result: pass.
- Artifact/package contamination scan
  - Result: no committed `package.json`, `package-lock.json`, `node_modules`, generated `.intake.json`, `.ocr_text.json`, `.aux_signals.json`, `submission.zip`, runtime archive, installer, or tool-cache found.

No Kordoc reinstall, `npm install`, portable runtime download, OCR/rasterizer/tesseract execution, generated report commit, sample artifact commit, or submission packaging was performed.

## C2N4D-MAJ-01 fix assessment

**Resolved.**

The previous review required evidence-mode provenance failure to terminate through the documented runner failure contract rather than leaking as an uncaught `RunnerError`. The patch handles that in two layers:

- Inside `main()`, the `buildRunProvenance(output, ns.evidenceMode)` call is wrapped. If it throws `RunnerError`, the runner recomputes provenance in non-throwing mode, appends an honest run log with `no_egress_verified=false`, prints a concise Korean failure message, and returns `EXIT_RUN_FAILED` (`7`).
- At the executable CLI boundary, `require.main === module` also catches `RunnerError` and maps it to exit `7`, preventing stack traces from escaping through alternate runner-error paths.

The programmatic `buildRunProvenance(..., true)` throwing API is retained; the test suite still asserts that direct evidence-mode provenance failure throws `RunnerError`. The patch changes only CLI/main handling of that expected failure.

Independent CLI probe result:

- `--approve-run --evidence-mode` with a fake Kordoc `cli.js` attempting blocked DNS exited `7`.
- The combined output did not include `RunnerError`, stack `at ...` lines, `hwp_assisted_runner.cjs:<line>`, or the local repo path.
- The run log recorded `hook_observed=true`, `egress_attempts=1`, `no_egress_verified=false`.

That satisfies the Major finding.

## C2N4D-MIN-01 fix assessment

**Resolved.**

The previous review found that check-mode displayed bare `npm install ...` even though actual install execution resolved `npm.cmd`. The patch changes check-mode display to call:

```text
buildInstallCommand(toolCache, node.npm)
```

That makes the displayed plan follow the same resolved executable policy as actual execution.

Independent check-mode probe result:

- Exit code `0`.
- Install command line contained `npm.CMD install`.
- Install command line did not match bare `npm install`.
- Install command line did not contain `npm.ps1`.

That satisfies the Minor finding.

## Artifact/package contamination assessment

The patch did not add or modify package/dependency/runtime artifacts. Contamination scans found no repo package files, lock files, `node_modules`, generated intake/OCR/aux artifacts, runtime archives/installers, tool-cache, or `submission.zip`.

Temporary fake Kordoc fixtures were created only under the OS temp directory for controlled probes and were removed after execution.

## Findings by severity

### Critical

None.

### Major

None.

### Minor

None.

### Observations

**ID:** C2N4DA-OBS-01

**Severity:** Observation

**Location:** `docs/decision_log.md`, `src/intake/runners/README.md`

**Issue:** The docs correctly note that the Python runner still has an analogous evidence-failure traceback/bare-npm display characteristic, but that runner was intentionally outside this narrow patch scope.

**Impact:** This does not block the Node runner safety patch. It is relevant only if future evidence cycles rely on the Python runner for assisted execution rather than the patched Node runner.

**Recommendation:** Track the Python runner parity question as a separate decision if it remains an active execution path.

**Blocking:** No.

**ID:** C2N4DA-OBS-02

**Severity:** Observation

**Location:** review scope

**Issue:** The Node runner patch verifies the runner safety surface only. It does not address the broader 2N-5 environment choice or remaining Python-dependent ingest/reporting path.

**Impact:** The Node runner can be used as a safer assisted runner evidence vehicle, but this PASS should not be read as 2N-5 acceptance or L2 completion.

**Recommendation:** Keep the next runtime/2N-5 decision separate from this narrow PASS.

**Blocking:** No.

## Required fixes before next step

None for the Node runner safety patch.

## Recommendation for next step

The 2N-4D-A safety patch may be accepted. The patched Node runner is suitable for follow-up assisted runner evidence use, subject to the existing explicit approval gates and artifact handling rules. Continue to keep 2N-5 unblock, full L2 completion, OCR support, provider finalization, and portable runtime adoption as separate decisions.
