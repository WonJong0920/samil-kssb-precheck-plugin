# Codex Review - Cycle 2I-3B Gate B License Evidence

## Review Overview

- Repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- Branch: `main`
- Target commit SHA: `0227a42ef6a74a7e7cfd591ca7dfccc39d2d3b21`
- Base commit SHA: `c3163b15bc25cf5891689caf21a4149af334e936`
- Actual HEAD checked: `0227a42ef6a74a7e7cfd591ca7dfccc39d2d3b21`
- Review date: 2026-07-03
- Reviewer role: Codex independent reviewer.
- Operating rules applied first: `AGENTS.md`, `docs/operating_principles.md`.
- Review purpose: verify whether `docs/samples/gate_b_license_review_evidence_2026-07-03.md` is sufficient Gate B license evidence in the whole 2I-3B structure: Kordoc as optional/local external adapter candidate, Gate A already process-level PASS, Version Strategy still pending, and implementation approval still separate.

## Verdict

**Verdict: PASS**

**Gate B 판정: PASS** for the stated **v1 text-PDF, opt-in/local, unbundled** scope.

The evidence is sufficient to proceed to Version Strategy confirmation. It documents a read-only inventory for the validated `kordoc@3.8.2 + pdfjs-dist@4.10.38` combination, defines the v1-required dependency closure as `dependencies` recursion from `kordoc` and `pdfjs-dist`, classifies that closure as permissive with no copyleft, native binary, or unknown licenses, separates optional/native/OCR packages from the v1 path, and aligns the conclusion with `docs/submission_packaging_policy.md`.

This PASS does not approve implementation, Kordoc hard dependency adoption, default enablement, OCR/formula/scanned-PDF scope, bundling, redistribution, or submission packaging inclusion. Those remain gated by Version Strategy confirmation, opt-in/local posture, core-boundary preservation, and separate approval.

## Critical / Major / Minor Findings

### Critical

None.

### Major

None.

### Minor

ID: C2I3B-GATEB-MIN-01
Severity: Minor
Location: `docs/samples/gate_b_license_review_evidence_2026-07-03.md:28-39`
Issue: The evidence records aggregate closure counts and representative packages, but not a sanitized complete per-package inventory table for all 117 v1-required packages.
Impact: The Gate B conclusion is still credible because the method, counts, representative licenses, and submission-policy boundary are documented. However, a future reviewer cannot independently spot-check every package/version/license tuple from the committed evidence alone.
Recommendation: Before implementation or any bundling decision, add a sanitized complete v1 dependency inventory artifact or table with package, version, license/SPDX, LICENSE/NOTICE presence, and native-binary flag. A hash of the raw inventory can be recorded without committing local paths or `node_modules`.
Blocking: No.

ID: C2I3B-GATEB-MIN-02
Severity: Minor
Location: `docs/samples/gate_b_license_review_evidence_2026-07-03.md:47-60`, `docs/planning/cycle2i_3b_gateprep_execution_plan.md:57-83`
Issue: Optional/native/LGPL packages are reasonably separated from the v1 dependency closure, but the committed evidence does not include an `--omit=optional` parse rerun or module-load trace proving the v1 parse path stays functional without optional/native packages present.
Impact: This is not blocking for the current opt-in/local, unbundled Gate B decision because optional/native packages are not proposed for submission redistribution and the evidence explicitly keeps them outside v1. It matters before implementation packaging or any local install contract that promises optional/native exclusion.
Recommendation: During Version Strategy or the first implementation-prep cycle, confirm the exact install posture with `--omit=optional` or an equivalent optional-exclusion check and, if feasible, record a sanitized module-load/native-load trace for the v1 text-PDF parse path.
Blocking: No.

## Gate B Evidence Review

PASS.

The evidence is a real Gate B execution record, not just a policy statement:

- It states the review followed GatePrep §4 and was performed under user approval in a repo-external temporary directory.
- It records execution metadata: observer, UTC time, Node/npm versions, no new install, analysis command shape, and target package combination.
- It states raw inventory dumps, `node_modules`, analysis script, and lock files were not committed.
- It explicitly labels the review as a first-pass inventory and not formal legal advice.
- It updates `docs/current_status.md` and `docs/decision_log.md` consistently.

The evidence supports Gate B PASS within its stated scope. It does not overclaim final legal clearance or implementation approval.

## v1 Dependency Closure Review

PASS with non-blocking reproducibility notes.

The v1-required closure definition is reasonable for this stage:

- Roots are `kordoc` and `pdfjs-dist`, matching the validated Gate A parsing combination.
- Recursive traversal is limited to `dependencies`, excluding `optionalDependencies` and `devDependencies`.
- This maps to the intended v1 text-PDF path and the project decision to exclude OCR/formula/scanned-PDF from v1.
- The evidence cross-references Gate A success for the same package combination.

The closure excludes optional packages by design, which is appropriate for license/submission review of the v1 path. The committed evidence would be stronger with a full sanitized dependency table and an optional-omitted execution confirmation, but those are not required before Version Strategy discussion.

## License Classification Review

PASS.

The license classification is sound at the evidence level:

- v1-required closure: 117 packages.
- Permissive: 116 packages.
- Dual permissive-selectable: 1 package, `jszip = MIT OR GPL-3.0-or-later`.
- Copyleft: 0 in v1 closure.
- Unknown: 0 in v1 closure.
- Native binary: 0 in v1 closure.

Treating `jszip = MIT OR GPL-3.0-or-later` as MIT-selectable is appropriate because the `OR` expression permits choosing the MIT license path. The evidence also treats `pako = MIT AND Zlib` as permissive because both sides are permissive, which is reasonable.

Apache-2.0 NOTICE obligations are correctly identified for any future bundling. The single package without an included LICENSE file (`isarray`) is low risk at this stage because its `package.json` declares MIT, but it should be covered in a future attribution collection if bundling is considered.

## Optional / Native / OCR Exclusion Review

PASS.

The evidence correctly keeps optional/native/OCR risk outside the v1 text-PDF Gate B decision:

- It identifies 48 installed-but-outside-v1 packages from optional dependencies.
- It identifies native/image/OCR packages such as `@hyzyla/pdfium`, `sharp`, `@img/sharp-win32-x64`, `@napi-rs/canvas`, and `onnxruntime-node`.
- It identifies LGPL exposure in `@img/sharp-win32-x64` as optional/extras-only.
- It states OCR/formula/MCP/setup were unused.
- It keeps scanned/OCR scope excluded from v1.

This is consistent with Gate A, which validated text parsing under process-level no-egress for the same package combination, and with the adapter design that forbids core hard dependency adoption. The exclusion should be hardened later with an optional-omitted run or module-load trace before implementation packaging.

## Submission Packaging Alignment Review

PASS.

The evidence aligns with `docs/submission_packaging_policy.md`:

- Original PDFs remain excluded.
- `node_modules`, lock files, raw inventory dumps, and scripts are not committed.
- Kordoc and its dependencies are treated as user-local, opt-in, and unbundled.
- Because there is no redistribution in the current posture, redistribution license obligations are not triggered by the plugin submission itself.
- If future bundling is approved, the evidence records required conditions: MIT/BSD license text, Apache-2.0 NOTICE preservation, and optional/native/LGPL exclusion via `--omit=optional` or equivalent.

This preserves the distinction between "local optional adapter candidate" and "repo/submission package dependency."

## Whole-Structure Review: Gate A, Gate B, Version Strategy, Implementation Boundary

PASS.

The whole structure remains coherent:

- Gate A is recorded as PASS at process/Node runtime level, with OS/kernel no-egress hardening still non-blocking.
- Gate B is now recorded as PASS for v1 text-PDF license/submission suitability under opt-in/local and unbundled assumptions.
- Version Strategy remains pending and is correctly identified as the next gate.
- Implementation entry remains blocked until Gate A PASS + Gate B PASS + Version Strategy confirmation + v1 scope + opt-in/local posture + core boundary invariants are all satisfied and separately approved.
- Kordoc remains outside plugin core; no schema, validator, renderer, delivery, manifest, marketplace, or package dependency changes are introduced.
- OCR/formula/scanned-PDF/native optional paths remain outside v1.

The evidence does not present Gate B PASS as a hard-dependency approval or legal opinion. That boundary is important and is maintained.

## Scope / Artifact Safety Review

PASS.

The target diff changes only evidence/status/decision documentation:

- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/samples/gate_b_license_review_evidence_2026-07-03.md`

No `src/**`, tests, schema, validator, renderer, delivery, Skill, manifest, marketplace, dependency/package files, MCP/client setting, PDF, raw log, generated report, converted JSON/Markdown, `node_modules`, or `submission.zip` artifact is added in the target diff.

Focused searches found no committed package/lock files, `node_modules`, `.mcp.json`, `.app.json`, PDF, DOCX, JSONL, or `submission.zip`. Matches for `node_modules`, `.mcp.json`, `submission.zip`, local paths, and related terms are policy/redaction/historical context rather than committed artifact disclosure. The evidence uses generalized paths and `[REDACTED_LOCAL_PATH]`.

Validation performed:

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --stat c3163b15bc25cf5891689caf21a4149af334e936..0227a42ef6a74a7e7cfd591ca7dfccc39d2d3b21`
- `git diff --name-only c3163b15bc25cf5891689caf21a4149af334e936..0227a42ef6a74a7e7cfd591ca7dfccc39d2d3b21`
- `git diff --name-status c3163b15bc25cf5891689caf21a4149af334e936..0227a42ef6a74a7e7cfd591ca7dfccc39d2d3b21`
- `git diff --check c3163b15bc25cf5891689caf21a4149af334e936..0227a42ef6a74a7e7cfd591ca7dfccc39d2d3b21`
- Required-file review for Gate B evidence, GatePrep plan, Gate A review/evidence, optional adapter design/review, submission packaging policy, current status, and decision log.
- Focused `rg` checks for artifact files, local paths, secrets, dependency/package files, MCP/app settings, and boundary language.

Runtime tests were not run because the target commit is evidence/documentation-only and changes no runtime code, schema, validator, renderer, delivery wrapper, or test file.

## Required Fixes Before Version Strategy or Implementation

None blocking before Version Strategy confirmation.

Before implementation or any bundling/default-activation decision:

- Resolve `C2I3B-GATEB-MIN-01` by keeping a sanitized complete v1 dependency/license inventory or equivalent review artifact.
- Resolve `C2I3B-GATEB-MIN-02` by confirming the optional-exclusion install posture or recording an equivalent module/native-load check.
- Preserve the unbundled opt-in/local adapter posture unless a later approved cycle changes it.
- Keep OCR/formula/scanned-PDF outside v1 unless separate evidence and approval exist.
- Complete Version Strategy: exact `kordoc` pin, `pdfjs-dist` 4.10.x constraint, compatibility check, fail-fast behavior, no auto-upgrade, and revalidation rule for new versions.
- Treat this evidence as first-pass inventory, not formal legal advice; obtain formal legal review before redistribution/bundling if that becomes relevant.

## Recommended Next Step

Proceed to Version Strategy confirmation. Do not enter implementation until the full gateprep conditions are satisfied and separately approved.
