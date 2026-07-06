# Codex Cycle 2N-4E Portable Node B Plan Review

## Verdict

**PASS with nonblocking follow-up**

The Cycle 2N-4E plan is safe and specific enough to proceed to the proposed 2N-4F mock implementation and review, provided the explicit user decisions listed in the plan remain prerequisites before any real implementation or download path is adopted. The plan preserves the intended order of system Node first, portable Node fallback second, and A-path fallback on refusal or failure. It also keeps portable Node adoption separate from 2N-5 unblock, L2 completion, OCR support, and provider finalization.

No required fixes are needed before implementation planning. The follow-up items below should be treated as implementation and evidence-cycle checks, not blockers to accepting the plan.

## Reviewed scope

Source-of-truth files read:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/planning/cycle2n_4e_portable_node_b_plan.md`
- `docs/reviews/codex_cycle2n_4d_a_node_runner_safety_patch_review.md`
- `docs/samples/codex_runtime_probe_evidence_p0.md`
- `docs/samples/codex_runtime_probe_evidence_p0b.md`
- `docs/planning/cycle2n_4c_runtime_strategy_python_reduction_plan.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/README.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/submission_packaging_policy.md`

Checks performed:

- `git pull origin main`
- `git rev-parse HEAD`
- `git diff --name-only HEAD^..HEAD`
- `git diff --stat HEAD^..HEAD`
- `git diff --check`
- `git status --short`
- repo artifact/package contamination scan for package files, lock files, `node_modules`, generated intake/OCR/aux artifacts, runtime archives/installers, tool-cache, and `submission.zip`

No portable Node download, `npm install`, Kordoc reinstall, hash verification execution, tool-cache creation, or generated artifact creation was performed.

## Actual changed files

Current HEAD reviewed:

- `df0c60bea234cbafa1daa6bacce2a3b2b74bd2ef`

Actual changed files in the target commit:

- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/planning/cycle2n_4e_portable_node_b_plan.md`

The diff is docs-only and matches the expected planning scope. No code, test, schema, validator, renderer, delivery, DEI producer, Skill, manifest, marketplace, package, lock, `node_modules`, tool-cache, generated artifact, or submission archive change was found.

## Plan assessment

The plan addresses the correct problem: environments where system Node is absent and the Node HWP assisted runner cannot be executed without a runtime. It does not attempt to solve the separate Python ingest/core execution issue and does not present portable Node as a general 2N-5 unblock.

The runtime priority is appropriate:

1. Use system Node/npm first when available.
2. Use an already approved and already present portable Node from repo-external tool-cache second.
3. If neither exists, request explicit user approval for Portable Node B.
4. On refusal or failure, fall back to A-path guidance rather than silently installing or failing closed.

This ordering is consistent with P0/P0-B evidence, the 2N-4C runtime strategy plan, and the 2N-4D-A Node runner safety review.

## Security / approval UX assessment

The approval UX is sufficiently explicit for a future implementation cycle. It requires disclosure of runtime name/version, official source, approximate size, repo-external tool-cache location, removal method, SHA-256 verification, no OS installer, no permanent PATH mutation, no administrator privilege, preparation-egress boundaries, and continued baseline operation if the user refuses.

The proposed one-process PowerShell `-ExecutionPolicy Bypass` use is acceptable as a planning choice because it is scoped to a source-controlled bootstrap script, does not change persistent execution policy, and is required only when Node is absent. This should still be verified in 2N-4F mock tests and repeated plainly in the user approval text.

## Hash / provenance assessment

The two-layer provenance design is sound:

- Official Node.js zip URL and `SHASUMS256.txt` from `nodejs.org/dist`.
- Repo-pinned expected SHA-256 captured during the implementation cycle.
- Runtime download hash compared against both the repo-pinned hash and the official `SHASUMS256.txt` row.
- Fail-fast cleanup and A-path fallback on mismatch, parse failure, or post-extract version mismatch.

This is stronger than relying on the downloaded checksum file alone. The plan also correctly separates planning from real hash validation; no hash verification execution was performed in this review.

## Tool-cache / packaging assessment

The planned placement under a repo-external user tool-cache is consistent with the submission packaging policy. The plan explicitly excludes portable Node binaries from the repository and `submission.zip`, avoids global npm/system directories, and avoids permanent PATH changes.

The plan preserves the existing Kordoc tool-cache posture: Kordoc remains separately pinned, installed with `--prefix`, and run through the explicit approval/no-egress pathway. Portable Node changes the Node/npm executable location only; it does not change provider scope or ingest boundaries.

## Failure fallback assessment

The failure matrix is complete enough for implementation:

- user refusal
- download failure
- repo-pinned hash mismatch
- `SHASUMS256.txt` parse or mismatch failure
- antivirus block
- extraction failure
- disk failure
- `node.exe --version` mismatch
- later portable runtime corruption

All listed failures converge to cleanup where feasible, failed prep logging, Korean user-facing notice, and A-path fallback. That is the correct no-overclaim behavior.

## 2N-4F / 2N-4G sequencing assessment

The split between 2N-4F mock implementation and 2N-4G real measurement is appropriate:

- 2N-4F can test detection order, display text, cleanup, mismatch handling, and fallback behavior without network access or real downloads.
- 2N-4G can separately seek explicit user approval for real download, dual-hash verification, portable Node execution, `npm.cmd` behavior, and nethook evidence.

This sequencing keeps approval, implementation, and evidence responsibilities cleanly separated.

## Findings by severity

### Critical

None.

### Major

None.

### Minor

None.

### Observations

**ID:** C2N4E-OBS-01

**Severity:** Observation

**Location:** `docs/planning/cycle2n_4e_portable_node_b_plan.md`

**Issue:** The plan correctly leaves B-option adoption, version pin, and one-process PowerShell bootstrap approval as user decisions. Future implementation should not treat this PASS as those decisions already being made.

**Impact:** No current blocker. It prevents accidental strategy adoption by review implication.

**Recommendation:** In 2N-4F, keep explicit user-decision prerequisites visible in the implementation report and review scope.

**Blocking:** No.

**ID:** C2N4E-OBS-02

**Severity:** Observation

**Location:** 2N-4F mock implementation scope

**Issue:** The mock implementation should cover both repo-pinned hash mismatch and `SHASUMS256.txt` mismatch or parse failure, plus partial-file cleanup behavior, without making real network calls.

**Impact:** No blocker for the plan. These are the most important safety regressions for the future bootstrap code.

**Recommendation:** Add focused mock tests for mismatch, parse failure, extraction failure, and cleanup/fallback behavior when 2N-4F implementation begins.

**Blocking:** No.

**ID:** C2N4E-OBS-03

**Severity:** Observation

**Location:** 2N-4G evidence scope

**Issue:** Portable Node evidence should explicitly verify that the bundled `npm.cmd` is resolved and used, and that `nethook.cjs` still observes and blocks outbound attempts under the portable `node.exe`.

**Impact:** No blocker for the plan. It is the key evidence needed before treating portable Node as a usable runtime fallback.

**Recommendation:** Keep these as required evidence points in 2N-4G before any practical reliance on portable Node.

**Blocking:** No.

## Required fixes before implementation

None.

## Recommendation for next step

Proceed to the proposed 2N-4F mock implementation/review cycle only after the user explicitly confirms the implementation-path decisions listed in the plan. Keep 2N-4G real download and hash evidence as a separate approval-gated cycle. Do not treat this review as declaring 2N-5 unblocked, L2 complete, OCR support complete, provider finalization complete, or portable Node adopted.
