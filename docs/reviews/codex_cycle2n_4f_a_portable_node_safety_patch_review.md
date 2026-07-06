# Codex Cycle 2N-4F-A Portable Node Safety Patch Review

## Verdict

**PASS**

Cycle 2N-4F-A resolves both Major findings from the Codex Cycle 2N-4F review within the intended narrow patch scope. Portable Node detection now requires an observed `node.exe --version` value matching the pinned version, and the PowerShell bootstrap now rejects non-official remote `SourceRoot` values and rejects `-PinnedZipSha256` overrides for remote official downloads.

This review allows moving to a separate 2N-4G real-download evidence cycle, subject to explicit user approval and the existing no-overclaim boundaries. It does not declare Portable Node B adopted, 2N-5 unblocked, L2 complete, OCR support complete, or provider finalization complete.

## Reviewed HEAD

- Base: `3c3b9b22b6bd4854680abe5ef25a92a0bf6bbe65`
- Reviewed HEAD: `a9168b1a83670c434088e199ac819de532d27d15`
- Branch: `main`

## Actual changed files

Actual diff from base to reviewed HEAD:

- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/runners/README.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/prepare_portable_node.ps1`
- `tests/test_hwp_assisted_runner_node.test.cjs`
- `tests/test_portable_node_bootstrap.test.cjs`

The patch stays within the expected safety-patch surface. No Python runner, `nethook.cjs`, core ingest, schema, validator, renderer, delivery, Skill, manifest, marketplace, package file, lock file, `node_modules`, tool-cache, generated artifact, runtime binary/archive, installer, or `submission.zip` change was found.

## Executed verification

Executed checks:

- `git pull origin main`
  - Result: already up to date.
- `git rev-parse HEAD`
  - Result: `a9168b1a83670c434088e199ac819de532d27d15`.
- `git diff --name-only 3c3b9b22b6bd4854680abe5ef25a92a0bf6bbe65..a9168b1a83670c434088e199ac819de532d27d15`
  - Result: the seven expected files listed above.
- `git diff --check`
  - Result: pass.
- `node --test tests/test_portable_node_bootstrap.test.cjs`
  - Result: pass, 11/11 tests passed.
- `node --test tests/test_hwp_assisted_runner_node.test.cjs`
  - Result: pass, 39/39 tests passed.
- Absolute-path Python spot checks using the P0-B Python path:
  - `tests/test_hwp_assisted_runner.py`: pass, 49/49 checks passed.
  - `tests/test_nethook.py`: pass, 29/29 checks passed.
- Repo contamination scan for package files, lock files, `node_modules`, generated intake/OCR/aux artifacts, tool-cache, runtime archives/installers, and `submission.zip`
  - Result: no matches.

No real `nodejs.org` access, portable Node download, `npm install`, Kordoc reinstall, OCR/rasterizer/tesseract execution, generated artifact commit, package/lock creation, runtime binary commit, or submission archive creation was performed.

## C2N4F-MAJ-01 resolution

**Resolved.**

The prior issue was that `portableNodePaths()` accepted a tool-cache portable runtime by checking only that `node.exe` and `npm.cmd` existed. The patch now adds `portableNodeVersionProbe(nodeExe)`, which runs:

```text
node.exe --version
```

with UTF-8 output and a 10-second timeout. The result is accepted only when it exactly equals:

```text
v${PORTABLE_NODE_VERSION}
```

`portableNodePaths()` now returns a portable runtime only when all of the following are true:

- `node.exe` exists;
- `npm.cmd` exists;
- the version probe succeeds;
- the observed version exactly matches the pinned `PORTABLE_NODE_VERSION`.

Version command failure, timeout, non-zero status, abnormal or mismatched output, thrown probe exceptions, and missing files all return `null`, causing `detectNode()` to fall back to the existing missing/corrupt path. With no system Node/npm available, that means exit `4` with the existing approval/A-path guidance and no execution.

The tests cover:

- version match accepted;
- version mismatch treated as missing;
- version command failure or exception treated as missing;
- real `process.execPath` version probe returns `process.version`;
- fake `node.exe` returns `null`;
- portable mismatch in the execution flow exits `4` with zero `execFn` calls;
- incomplete portable directory still prevents system/portable mixing.

This satisfies the previous Major.

## C2N4F-MAJ-02 resolution

**Resolved.**

The prior issue was that `prepare_portable_node.ps1` accepted any `https?://` `-SourceRoot` as a remote root and allowed `-PinnedZipSha256` to override repo-pinned provenance on remote paths.

The patch now adds an explicit remote-source gate before staging, logging, network calls, or file creation:

- `$officialRoot = "https://nodejs.org/dist/v$PinVersion"`;
- blank `SourceRoot` defaults to `$officialRoot + "/"`;
- any remote source must match `$officialRoot` after trimming trailing slashes;
- non-official remote URLs fail-fast with exit `7`;
- remote paths reject non-empty `-PinnedZipSha256`;
- remote paths use only `$PINNED_ZIP_SHA256_CONST`;
- because the constant remains empty in this mock cycle, real remote download remains fail-closed.

Local directory `SourceRoot` remains available for mock fixture tests and may still use `-PinnedZipSha256`; this is consistent with the mock-only test design and does not weaken the real remote path.

The tests cover:

- default official remote plus missing repo-pinned hash fails before file creation;
- non-official remote source fails before file creation;
- official remote plus `-PinnedZipSha256` override fails before file creation;
- local fixture source still supports successful mock install and all previous hash/failure tests.

This satisfies the previous Major.

## Boundary / no-overclaim review

The patch preserves the intended boundaries:

- no real network or download execution in this patch;
- no Kordoc reinstall or `npm install`;
- no portable runtime install;
- no package/lock/runtime artifact in repo;
- no changes to Python runner, `nethook.cjs`, core ingest, schema, validator, renderer, delivery, Skill, manifest, or marketplace;
- no declaration that B-option adoption, 2N-5 unblock, L2 completion, OCR support, or provider finalization is complete.

The docs correctly frame 2N-4G as a future explicit-approval evidence cycle.

## Findings by severity

### Critical

None.

### Major

None.

### Minor

None.

### Observations

**ID:** C2N4FA-OBS-01

**Severity:** Observation

**Location:** `src/intake/runners/prepare_portable_node.ps1`

**Issue:** Local directory `-SourceRoot` remains available for fixtures and accepts `-PinnedZipSha256`. This is appropriate for mock tests, but 2N-4G real evidence should use the default official remote path rather than a local source override unless the test is explicitly a controlled fixture case.

**Impact:** No current blocker. The real remote path is protected.

**Recommendation:** In 2N-4G evidence, distinguish official remote evidence from any local fixture failure-path probes.

**Blocking:** No.

**ID:** C2N4FA-OBS-02

**Severity:** Observation

**Location:** 2N-4G future evidence scope

**Issue:** The repo-pinned hash constant remains intentionally empty, so real remote download remains fail-closed. The first real evidence cycle must record the chosen pin and expected hash before a successful download can occur.

**Impact:** No current blocker. This is the intended gate between mock implementation and real evidence.

**Recommendation:** Keep pin/hash recording, intentional mismatch proof, portable `npm.cmd` behavior, and portable `nethook.cjs` observation as required 2N-4G evidence points.

**Blocking:** No.

## Required fixes before 2N-4G

None.

## 2N-4G readiness

2N-4G may proceed as a separate real-download evidence cycle after explicit user approval. That cycle must still avoid overclaiming: it may gather portable Node evidence, but it must not by itself declare 2N-5 unblocked, L2 complete, OCR support complete, provider finalization complete, or Portable Node B generally adopted beyond the reviewed evidence boundary.

## Recommendation

Accept the 2N-4F-A safety patch. Proceed to 2N-4G only as an approval-gated evidence cycle for official `nodejs.org` download, repo-pinned hash recording, intentional mismatch behavior, portable `npm.cmd`, and portable-node `nethook` observation.
