# Codex Cycle 2N-4C Runtime Strategy Plan Review

## Verdict

**PASS with nonblocking follow-up**

Cycle 2N-4C is a sound execution runtime strategy plan. It correctly treats the repeated Codex-session Python failure as both a reviewability gap and a potential user-environment risk, while keeping the response at planning level only. The plan does not prematurely select Node migration, portable Node, portable Python, or any implementation path. Its strongest choice is the P0 runtime probe gate: measure the actual Codex/user execution environment before committing to a runtime strategy.

No required fix blocks the next planning step. The next step may be a P0 runtime probe/evidence cycle, with explicit user approval for any download or portable runtime placement.

## Reviewed Scope

- Target commit reviewed: `98e46b04b5f809b6d2bc2f6fbe45faad743c50b6`
- Previous reviewed commit: `dd796538a936d305c5aea2be6c729415687621ee`
- Actual changed files:
  - `docs/planning/cycle2n_4c_runtime_strategy_python_reduction_plan.md`
  - `docs/planning/cycle2n_0b_runner_provider_ux_design.md`
  - `docs/current_status.md`
  - `docs/decision_log.md`

The actual diff matches the reported scope. No `src/`, `tests/`, schema, validator, renderer, delivery, Skill, manifest, marketplace, package, lock, MCP/app config, generated artifact, tool-cache, or submission archive file changed in the target diff.

Primary files read:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/chatgpt_coordination_workflow.md`
- `docs/planning/cycle2n_4c_runtime_strategy_python_reduction_plan.md`
- `docs/planning/cycle2n_0b_runner_provider_ux_design.md`
- `docs/reviews/codex_cycle2n_4b_hwp_family_ingest_contract_review.md`
- `docs/planning/cycle2n_4b_hwp_family_ingest_contract_decision.md`
- `docs/current_status.md`
- `docs/decision_log.md`

## Plan Assessment

The plan frames the problem accurately:

- Codex review sessions have repeatedly failed to execute `python.exe` / `py.exe` because they resolve to inaccessible WindowsApps stubs.
- Node is available in the same sessions.
- The repo’s execution surface is still largely Python: validator, renderer, delivery, ingest, aux scanner, runner, and test scripts.
- This causes a real verification gap and may become a user-facing runtime risk if the 2N-5 black-box environment resembles the Codex review environment.

The plan avoids a premature rewrite. It compares four strategies:

- S0: absolute-path Python invocation.
- S1: Node single-runtime migration.
- S2: portable Python embeddable runtime.
- S3: staged hybrid strategy.

The recommendation, S3 with P0 measurement first, is appropriate. It protects the already reviewed Python surface from unnecessary churn while still acknowledging that Node migration may be the right long-term direction, especially for the runner.

## Runtime Strategy Review

The Python dependency inventory is useful and realistic. It correctly distinguishes:

- core required path: validator, renderer, delivery;
- optional ingest path: DEI producer and aux scanner;
- assisted path: HWP runner;
- tests as verification-only;
- log-hooks as out of scope.

The migration prioritization is sensible:

- runner first, because Kordoc and nethook are already Node-based and the orchestration surface is smaller;
- ingest only if runtime strategy requires it, because it is a reviewed/promotion-sensitive contract boundary;
- renderer last, because reimplementing deterministic DOCX OOXML zip generation in Node would open the largest regression surface.

This avoids the most dangerous version of “reduce Python”: a broad rewrite of reviewed core behavior right before black-box testing.

## Portable Node / Portable Python Boundary Review

The plan preserves the existing portable Node B boundary from 2N-0B-A:

- system Node first;
- portable Node only if needed and approved;
- repo-external tool-cache;
- zip extraction only;
- no OS installer;
- no permanent PATH mutation;
- no administrator rights;
- hash verification and fail-fast;
- refusal/failure falls back to baseline.

The new portable Python option is appropriately marked as a proposal, not a decision. It has a strong short-term rationale because it could preserve the reviewed Python implementation and 273 existing checks without a rewrite. The plan also identifies the key weakness: Python embeddable distribution hash/provenance posture is not as straightforward as Node’s `SHASUMS256.txt`.

That is enough for planning. Any portable Python adoption should require its own evidence/review cycle before implementation or packaging decisions.

## P0 Spike Readiness

The P0 probe is the right next gate. It asks the questions that determine whether a rewrite is necessary:

- Can an existing Python be called by absolute path?
- Can a repo-external executable in a tool-cache be launched?
- Is preparation egress possible from the relevant session, or must the user perform it externally?
- Is 2N-5 intended to run inside the Codex app/session or another environment?
- Can Codex settings expose system Python without code changes?

The planned P0 output as `docs/samples/codex_runtime_probe_evidence_<date>.md` is appropriate if it is redacted and does not include raw local paths, secrets, installed binaries, or downloaded archives.

Nonblocking follow-up: split P0 into two evidence classes in the next prompt or runbook:

- no-install probes: PATH/absolute-path detection, Node/Python command resolution, launchability, settings checks;
- approved install/download probes: portable Node or portable Python placement, hash verification, egress log, removal proof.

This split will keep “measurement” from quietly turning into “runtime adoption.”

## Scope / Artifact Safety Review

The target diff is docs-only. No code, tests, package files, lock files, tool-cache, generated reports, intake/OCR/aux artifacts, portable runtime binaries, installers, samples, or submission archive were added.

The plan itself keeps the core product boundaries intact:

- no unapproved install or execution;
- repo-external tool-cache only;
- no OS installer / permanent PATH change / admin rights;
- prep egress vs execution no-egress remains separated;
- nethook policy remains strict;
- OCR/tesseract/rasterizer remains gated;
- no L2 full completion, OCR support, provider finalization, or L3 implementation claim;
- Skill-first user entry remains unchanged.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

**ID:** C2N4C-OBS-01

**Severity:** Observation

**Location:** `docs/planning/cycle2n_4c_runtime_strategy_python_reduction_plan.md:39`

**Issue:** P0 intentionally includes questions that may lead to approved portable runtime placement, but the current plan only summarizes the probe output as an execution matrix.

**Impact:** This is acceptable for planning, but the next P0 prompt/runbook should separate no-install probes from download/install probes so evidence does not blur measurement with adoption.

**Recommendation:** In the P0 cycle, require separate sections for no-install checks, approved download/placement checks, hash verification, repo contamination scan, removal/fallback evidence, and redaction.

**Blocking:** No.

**ID:** C2N4C-OBS-02

**Severity:** Observation

**Location:** `docs/planning/cycle2n_4c_runtime_strategy_python_reduction_plan.md:58`

**Issue:** Portable Python is a useful alternative, but it is newer than the existing Node B policy and has weaker/less uniform upstream hash-distribution assumptions.

**Impact:** The plan recognizes this. It should not be adopted or packaged without a dedicated evidence review.

**Recommendation:** If S2 remains viable after P0, run a narrow portable Python evidence review covering source URL, version pin, hash/signature evidence, no PATH mutation, removal, AV/failure fallback, and submission packaging posture.

**Blocking:** No.

## Required Fixes Before P0

None.

## Additional Verification Requests

- During P0, record exact command-resolution behavior for `python`, `py`, known absolute Python paths, `node`, `npm`, and any proposed portable executable path.
- During P0, avoid downloading or placing any runtime unless the user explicitly approves that subtest.
- If a portable runtime is placed, record hash verification, egress source, tool-cache location in redacted form, removal procedure, and repo contamination scan.
- Before 2N-5 is declared complete, define whether the black-box run occurs inside Codex, Claude, user shell, or another environment.
- If Node migration is selected, start with runner parity and `node:test`; do not rewrite core renderer/validator/delivery until a separate parity plan is reviewed.

## Recommendation for Next Step

Proceed to **P0 Codex runtime probe planning/execution**, then decide among S0/S1/S2/S3 based on evidence. Keep 2N-5 sequencing tied to the U-3 environment decision: if 2N-5 must run in the Codex-like environment, runtime strategy is a preflight concern; if 2N-5 runs in a known Python-capable environment, P0 can proceed in parallel as runtime hardening.
