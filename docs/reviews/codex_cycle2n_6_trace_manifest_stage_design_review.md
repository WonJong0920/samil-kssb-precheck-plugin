# Codex Cycle 2N-6 Cycle C Review — Trace Manifest Stage Design

## Review Overview

- Role: Codex independent reviewer.
- Review type: narrow design review.
- Fixed review range: `bce31cc775b02647e45a9d5f4c73848c6c1b7006..79dee259a3a4d7c873876dafe56c8cef7a9d7502`
- Target commit: `79dee259a3a4d7c873876dafe56c8cef7a9d7502`
- Target commit message: `docs: design trace manifest stage`

This review evaluates only the trace manifest stage design. It does not implement trace manifest, re-review N1~N4 implementations, re-decide N5, start Phase 3, or introduce a hook registry/dispatcher.

## Verdict

**PASS**

The design is appropriately scoped as a design-only trace manifest proposal. It keeps trace manifest as an opt-in, default-off, delivery terminal stage rather than a hook/dispatcher. The design preserves D94 hard stop behavior, keeps the user-facing representative document policy intact, limits the manifest to internal provenance, separates deterministic core data from runtime-specific values, avoids judgment/quality/compliance fields, preserves Python as golden parity reference, and remains compatible with the N5 aux scanner limitation.

## Readiness

- Implementation cycle entry: **Ready, after ChatGPT/User confirm the intended defaults for the open questions in §16**
- Required fixes before implementation: **None**

The open questions are decision points, not design defects. The recommended defaults are sufficiently concrete for the next implementation prompt to adopt or override.

## Actual Changed Files

Diff range checked:

`bce31cc775b02647e45a9d5f4c73848c6c1b7006..79dee259a3a4d7c873876dafe56c8cef7a9d7502`

Changed files:

- `docs/designs/cycle2n_6_trace_manifest_stage_design.md`

No implementation, test, schema, package, runtime, generated artifact, `current_status.md`, or `decision_log.md` file is changed in the target diff.

## Source-of-truth Reviewed

Required:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/chatgpt_coordination_workflow.md`
- `docs/designs/cycle2n_6_trace_manifest_stage_design.md`
- `docs/cycle2n_6_phase2_closure_summary.md`
- `docs/workflow_usage.md`
- `docs/reviews/codex_cycle2n_6_workflow_docs_alignment_review.md`
- `docs/reviews/claude_gpt_post_n4_hook_structure_proposal_review.md`
- `docs/decision_log.md`
- `src/renderers/kssb_report_delivery.cjs`
- `src/renderers/kssb_report_renderer.cjs`
- `src/intake/dei_producer.cjs`

Additional references:

- `docs/blackbox_protocol.md`
- `src/intake/README.md`
- `src/intake/runners/README.md`

## Commands Executed

- `git status --short --branch`
  - Result: clean `main...origin/main`.
- `git log --oneline -6`
  - Result: target commit is current HEAD at review start.
- `git diff --check bce31cc775b02647e45a9d5f4c73848c6c1b7006..79dee259a3a4d7c873876dafe56c8cef7a9d7502`
  - Result: pass.
- `git diff --name-only bce31cc775b02647e45a9d5f4c73848c6c1b7006..79dee259a3a4d7c873876dafe56c8cef7a9d7502`
  - Result: one design document only.
- `git diff --stat bce31cc775b02647e45a9d5f4c73848c6c1b7006..79dee259a3a4d7c873876dafe56c8cef7a9d7502`
  - Result: 1 file changed, 230 insertions.
- `git show --stat --oneline --name-status 79dee259a3a4d7c873876dafe56c8cef7a9d7502`
  - Result: confirms design-doc-only target surface.
- Targeted `Select-String` / `rg` searches over the design and related docs/source for delivery, render outputs, preflight/D94, hook/dispatcher terms, manifest fields, determinism, path leak controls, no-overclaim tokens, Python reference, and N5 references.
  - Result: no blocking issue found.

## Tests Not Executed

Code tests were not executed because this is a design-doc-only review. The target diff contains no code, test, schema, package, runtime, or generated artifact changes. Source files were inspected read-only to confirm that the proposed delivery-terminal location matches the current Node delivery/renderer/DEI structure.

## Design-only Scope Review

**PASS**

The target commit adds only `docs/designs/cycle2n_6_trace_manifest_stage_design.md`. It does not modify implementation, tests, schemas, package files, runtime files, current status, decision log, generated artifacts, N5 code, trace manifest code, or Phase 3 design/implementation files.

## Delivery Terminal Stage Design Review

**PASS**

The design attaches trace manifest to the end of `src/renderers/kssb_report_delivery.cjs`, after:

1. Node validator preflight,
2. D94 hard stop check,
3. `renderReport()` output generation,
4. user summary assembly.

This is structurally appropriate because `deliver()` is the only current convergence point that holds findings, preflight counts/issues, and renderer outputs in memory. Placing the manifest in the renderer would cross the renderer's no-preflight/no-provenance boundary, while placing it in the runner would miss findings and report outputs.

## Hook / Dispatcher Non-adoption

**PASS**

The design repeatedly states that trace manifest is **not** a hook:

- no registry,
- no dispatcher,
- no multi-extension mechanism,
- no plugin/Codex hook API,
- no generic postprocess hook.

It follows the prior Claude/GPT review recommendation by reducing the proposal to one concrete delivery-terminal stage.

## Opt-in Default-off Review

**PASS**

The design makes manifest generation opt-in via `deliver(..., { manifest: true })` / CLI `--manifest`, with default off. This preserves existing N2/N4 delivery behavior, output counts, `user_summary`, and parity tests unless explicitly enabled. This is the correct posture for adding a new internal artifact without changing the default user-facing workflow.

## D94 Hard Stop Compatibility

**PASS**

The design preserves D94:

- preflight error hard stop remains before rendering;
- hard stop creates no report artifacts;
- manifest also remains uncreated in hard stop paths;
- hard stop remains a controlled stop rather than a provenance export path.

This avoids weakening the current "error >= 1 means no representative document" guarantee.

## User-facing Output Policy Review

**PASS**

The manifest is classified as an internal provenance artifact and is not promoted to the representative document. The design preserves:

- representative document priority: DOCX -> HTML -> Markdown,
- default manifest off,
- user summary unchanged by default,
- no JSON/manifest as basic user-facing output.

This is consistent with `docs/workflow_usage.md`, which already says manifest-style artifacts are not default outputs.

## Path Leak Prevention Review

**PASS**

The design requires basename, relative identifier, hash, byte count, and count-only fields rather than absolute paths. It excludes:

- local absolute paths,
- account names,
- temporary paths,
- tool-cache paths,
- validator raw messages/locations,
- stack traces,
- internal diagnostics.

It also requires manifest leak assertions equivalent to `user_summary` leak checks. That is sufficient for the design stage.

## Determinism / Runtime Block Review

**PASS**

The design separates:

- deterministic manifest core,
- optional/runtime-specific values such as node version or wall-clock timestamps.

It makes runtime data digest-excluded and recommends timestamp omission by default. It also requires stable key ordering and a fixed findings hash rule. This is aligned with the repository's existing deterministic-output discipline and N4 DOCX determinism approach.

## No-judgment / No-overclaim Review

**PASS**

The manifest field design is limited to hashes, byte counts, counts, formats, basenames, and preflight issue codes/severity. It explicitly excludes:

- status/verdict/pass-style fields,
- quality/score/grade fields,
- compliance/assurance/audit opinion/certified fields,
- raw findings/report body/quote text,
- product completion / 2N-5 pass / OCR completion / provider finalization / submission readiness implications.

This is the right boundary for an internal provenance artifact.

## Python Reference / N5 Limitation Review

**PASS**

The design preserves Python reference status:

- manifest is a new Node-only stage, not a Python port target;
- Python delivery remains unchanged;
- manifest is explicitly not a Python parity item.

It also does not revisit N5:

- aux scanner remains Node non-migrated under D93 ② / D95;
- upstream aux/intake/OCR provenance is left outside v1 scope;
- the design does not reclassify aux signals as required for core report generation.

## Open Questions Review

**PASS**

The design's open questions are implementation-planning questions, not gaps that block design approval. They are concrete enough for ChatGPT/User to resolve before implementation:

- upstream provenance included now vs later,
- findings hash rule,
- timestamp/runtime block policy,
- opt-in default,
- output file name/location,
- self-hash inclusion,
- hard stop manifest behavior.

The document recommends defaults for each. The next implementation prompt should explicitly adopt or override these defaults to avoid accidental drift.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

#### C2N6-C-OBS-01: Manifest location should be explicitly selected in the implementation prompt

The prior hook-structure review used "RUN_ROOT(repo 밖) 내부 artifact" language, while this design recommends `out-dir/run_manifest.json` and also keeps location/file name as an open question. These can be compatible if the implementation uses a repo-outside output directory, but the next prompt should explicitly choose the location rule and `.gitignore` pattern.

Blocking: No.

#### C2N6-C-OBS-02: Self-hash input should be spelled out precisely during implementation

The design correctly separates runtime data from `manifest_sha256`, but implementation should make the hash input unambiguous: exclude `manifest_sha256` itself and exclude the runtime block. The design already implies this; tests should lock it down.

Blocking: No.

#### C2N6-C-OBS-03: Opt-in failure behavior needs tests that match its intended use

The design says manifest write failure should not break delivery and should record `manifest_error`. That is a reasonable default for an optional internal artifact. Implementation tests should verify both report-success preservation and the fact that missing/failed manifest cannot be mistaken for successful provenance capture.

Blocking: No.

## Required Fixes

None.

## Implementation Cycle Entry

Implementation cycle may proceed after ChatGPT/User confirm the §16 defaults or provide alternate choices. Recommended implementation defaults from the design are acceptable:

- upstream provenance excluded in v1,
- findings canonical-JSON hash,
- timestamp omitted by default,
- manifest opt-in off by default,
- `run_manifest.json` with explicit repo-outside-output discipline and `.gitignore` defense,
- self-hash included,
- no manifest on D94 hard stop.

## Next Step

Proceed to a dedicated implementation cycle for the trace manifest delivery-terminal stage if ChatGPT/User approve the open-question defaults. Keep that cycle separate from hook/dispatcher work, N5, and Phase 3.

