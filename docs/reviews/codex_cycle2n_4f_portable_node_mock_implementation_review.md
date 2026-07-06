# Codex Cycle 2N-4F Portable Node Mock Implementation Review

## Verdict

**CONDITIONAL PASS**

Cycle 2N-4F implements the Portable Node B-option mock surface in the intended narrow scope: source-only PowerShell bootstrap, no real download, no `npm install`, no Kordoc reinstall, no portable runtime install, and Node-only mock tests for approval, hash, cleanup, and detection behavior.

However, two required fixes are needed before 2N-4G real-download evidence:

- the runner accepts an existing portable Node directory by file presence only and does not verify `node.exe --version` against the pinned version;
- the bootstrap treats any `https?://` `-SourceRoot` as remote, while the plan requires remote downloads to be fixed to official `nodejs.org/dist/v<pin>/` and to reject other mirrors or remote roots.

These issues do not invalidate the mock-only implementation direction, but they block moving directly to 2N-4G real measurement until patched and re-reviewed.

This review does not declare Portable Node B adopted, 2N-5 unblocked, L2 complete, OCR support complete, or provider finalization complete.

## Reviewed scope

Source-of-truth files read:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/planning/cycle2n_4e_portable_node_b_plan.md`
- `docs/reviews/codex_cycle2n_4e_portable_node_b_plan_review.md`
- `docs/reviews/codex_cycle2n_4d_a_node_runner_safety_patch_review.md`
- `docs/samples/codex_runtime_probe_evidence_p0.md`
- `docs/samples/codex_runtime_probe_evidence_p0b.md`
- `docs/submission_packaging_policy.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/runners/prepare_portable_node.ps1`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/README.md`
- `tests/test_portable_node_bootstrap.test.cjs`
- `tests/test_hwp_assisted_runner_node.test.cjs`

Checks performed:

- `git pull origin main`
- `git rev-parse HEAD`
- `git diff --name-only 4336e8df5cf4d476d94b229c23e618f1f59caf0d..HEAD`
- `git diff --stat 4336e8df5cf4d476d94b229c23e618f1f59caf0d..HEAD`
- `git diff --check`
- `node --test tests/test_portable_node_bootstrap.test.cjs`
- `node --test tests/test_hwp_assisted_runner_node.test.cjs`
- absolute-path Python spot checks:
  - `tests/test_hwp_assisted_runner.py`
  - `tests/test_nethook.py`
- UTF-8 BOM byte check for `src/intake/runners/prepare_portable_node.ps1`
- repo contamination scan for package files, lock files, `node_modules`, generated intake/OCR/aux artifacts, tool-cache, runtime archives/installers, and `submission.zip`

No actual `nodejs.org` access, portable Node download, `npm install`, Kordoc reinstall, tool-cache runtime install, OCR/rasterizer/tesseract execution, generated report commit, package/lock creation, or submission archive creation was performed.

## Actual changed files

Target HEAD after pull:

- `7a143c3069e7a2f1cd533ac3fb543cd0cc5bf6e9`

Diff from previous review HEAD `4336e8df5cf4d476d94b229c23e618f1f59caf0d`:

- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/runners/README.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/prepare_portable_node.ps1`
- `tests/test_hwp_assisted_runner_node.test.cjs`
- `tests/test_portable_node_bootstrap.test.cjs`

The changed file set matches the expected 2N-4F mock implementation scope. No Python runner, `nethook.cjs`, core validator, renderer, delivery, DEI producer, Skill, manifest, marketplace, package file, lock file, `node_modules`, tool-cache, generated artifact, runtime binary/archive, or `submission.zip` change was found.

## Bootstrap mock assessment

`prepare_portable_node.ps1` is source-only and mock-testable with local fixture `-SourceRoot`. Its approval gate is appropriate:

- no `-ApproveRuntime` exits `5`;
- no files are created on unapproved invocation;
- the approval message covers Node version, official source, approximate size, repo-external location, dual SHA-256 verification, no OS installer, no permanent PATH change, no administrator privilege, one-process PowerShell policy bypass, prep-only network, no-egress execution boundary, and A-path fallback.

The real remote path is fail-closed while `$PINNED_ZIP_SHA256_CONST` remains empty. The corresponding test confirms that default HTTPS source plus missing pinned hash exits `7` before network or file creation.

The mock tests cover successful local-fixture preparation, approval marker, prep log, repo-pinned hash mismatch, SHASUMS mismatch, SHASUMS parse failure, corrupt zip extraction failure, missing fixture download failure, and post-extract version-check failure.

The PowerShell file begins with `EF BB BF`, so the intended UTF-8 BOM is present for Windows PowerShell 5.1 Korean text handling.

## Runner detection assessment

`hwp_assisted_runner.cjs` extends detection to:

1. system Node/npm when both are resolved;
2. portable tool-cache `node.exe` plus `npm.cmd`;
3. missing state with B-option approval guidance.

The positive behavior is tested:

- system Node/npm wins over portable presence;
- portable is used when system Node/npm is absent;
- incomplete portable directory without `npm.cmd` is treated as missing;
- no system/portable mixing occurs;
- run command uses the portable absolute `node.exe` when portable is selected;
- missing Node/npm still performs no unauthorized install or execution.

The remaining problem is that portable detection checks only `node.exe` and `npm.cmd` existence. It does not execute `node.exe --version` or compare to `PORTABLE_NODE_VERSION`.

## Hash / SHASUMS / cleanup assessment

The bootstrap has good mock coverage for fail-fast hash behavior:

- repo-pinned hash mismatch blocks extraction and removes destination;
- SHASUMS mismatch blocks extraction and removes destination;
- SHASUMS parse failure exits `7`;
- corrupt zip exits `7`;
- missing source files exit `7`;
- fake `node.exe` version-check failure cleans the destination.

The implementation logs `runtime_prepare` entries and `runtime` approval marker in the tool-cache, consistent with the plan. It does not commit those artifacts.

Remote source restriction is the major gap. The script defaults to official `https://nodejs.org/dist/v$PinVersion/`, but any `https?://` value supplied through `-SourceRoot` is treated as a remote root and fetched. The plan says remote source is fixed to official `nodejs.org/dist` and other mirrors or redirects are not accepted. Local `-SourceRoot` is useful for mock fixtures, but remote `-SourceRoot` should be allowlisted or rejected before any network call.

## Approval UX / PowerShell boundary assessment

The approval UX is aligned with the 2N-4E plan and submission boundary:

- `-ExecutionPolicy Bypass` is disclosed as one-process only;
- OS installer, registry mutation, persistent PATH changes, and administrator privileges are explicitly excluded;
- user refusal continues the baseline text-review path;
- `nodeMissingMessage()` adds a B-option command without performing installation.

This is acceptable for mock implementation. The real 2N-4G evidence cycle should still verify the exact user-facing command and redaction behavior before approving real download.

## Artifact/package contamination assessment

No repo contamination was observed:

- `git status --short` was clean before writing this review.
- scans found no package files, lock files, `node_modules`, generated `.intake.json`, `.ocr_text.json`, `.aux_signals.json`, tool-cache, runtime archive, installer, or `submission.zip`.

The test suite creates temporary fixture zips and executable copies under OS temp directories only. No runtime binary, zip, installer, Kordoc artifact, generated report, or sample artifact is committed.

## Test execution result

Executed:

- `git diff --check`
  - Result: pass.
- `node --test tests/test_portable_node_bootstrap.test.cjs`
  - Result: pass, 9/9 tests passed.
- `node --test tests/test_hwp_assisted_runner_node.test.cjs`
  - Result: pass, 35/35 tests passed.
- Absolute-path Python via P0-B Python 3.14:
  - `tests/test_hwp_assisted_runner.py`: pass, 49/49 checks passed.
  - `tests/test_nethook.py`: pass, 29/29 checks passed.

No full Python regression suite was required for this narrow mock implementation review; the requested Python runner/nethook spot checks passed.

## Findings by severity

### Critical

None.

### Major

**ID:** C2N4F-MAJ-01

**Severity:** Major

**Location:** `src/intake/runners/hwp_assisted_runner.cjs`, functions `portableNodePaths()` and `detectNode()`

**Issue:** Existing portable Node detection accepts the tool-cache portable runtime if `node.exe` and `npm.cmd` both exist. It does not run `node.exe --version` or compare the observed version to `PORTABLE_NODE_VERSION`.

**Impact:** This conflicts with the 2N-4E plan's "portable exists + version matches" condition and the failure matrix item for later portable corruption/version drift. A stale, manually modified, partially replaced, or wrong-version portable runtime could be reused in a later session without detection.

**Recommendation:** Before 2N-4G real measurement, update portable detection to validate `node.exe --version === v${PORTABLE_NODE_VERSION}` and treat failures or mismatches as missing/corrupt portable state that falls back to the approval/A-path flow. Add node:test coverage for version match, mismatch, and command failure.

**Blocking:** Yes, before 2N-4G real-download evidence or practical reliance on an existing portable runtime.

**ID:** C2N4F-MAJ-02

**Severity:** Major

**Location:** `src/intake/runners/prepare_portable_node.ps1`, remote `-SourceRoot` handling around `Invoke-WebRequest`

**Issue:** The bootstrap accepts any `https?://` `-SourceRoot` as remote and downloads `$zipName` plus `SHASUMS256.txt` from that root. The 2N-4E plan requires official `nodejs.org/dist/v<pin>/` as the fixed remote source and says other mirrors or redirects are not accepted.

**Impact:** The mock tests correctly avoid network access, but the future real-download path would allow a non-official remote root if a caller supplies it. The separate `-PinnedZipSha256` parameter also makes it easier to bypass the intended repo-pinned constant in a remote invocation. This weakens provenance and source-bound runtime preparation before the real evidence cycle.

**Recommendation:** Before 2N-4G, restrict remote source handling to the exact expected official base URL for the pin, or reject user-supplied remote `-SourceRoot` entirely while keeping local directory `-SourceRoot` for tests. Also ensure any `-PinnedZipSha256` override is limited to local/mock source roots or otherwise cannot weaken the repo-pinned constant in the real remote path.

**Blocking:** Yes, before 2N-4G real-download evidence.

### Minor

None.

### Observations

**ID:** C2N4F-OBS-01

**Severity:** Observation

**Location:** `src/intake/runners/prepare_portable_node.ps1`

**Issue:** `approvals.json` runtime marker is written before download/hash/extract success. This records user approval to attempt runtime preparation, not successful installation.

**Impact:** This is acceptable because runtime usability is determined by actual runtime detection, not by the marker. The prep log also records started/failed status. It may still need clear interpretation in evidence docs.

**Recommendation:** In 2N-4G evidence, state that the runtime marker means approval was granted, while success is determined by prep log `ok` plus version/hash evidence.

**Blocking:** No.

## Required fixes before 2N-4G

1. Add portable runtime version validation in runner detection and tests.
2. Add remote source allowlist/rejection for non-official `SourceRoot`, and ensure the pinned hash override cannot weaken official remote provenance.

Both fixes should be reviewed before any real portable Node download/hash evidence cycle.

## Recommendation for next step

Patch the two Major findings in a narrow 2N-4F-A safety patch, then run the Node mock tests again and perform a narrow Codex re-review. After that, 2N-4G can request explicit user approval for real `nodejs.org` download and evidence collection. Do not proceed directly to 2N-4G from the current state.
