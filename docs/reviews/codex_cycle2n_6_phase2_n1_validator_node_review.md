# Codex Cycle 2N-6 Phase 2 N1 — Node Validator Review

## Review Overview

- Role: Codex independent reviewer.
- Review scope: Phase 2 N1 Node validator port only.
- Base commit: `f40962b82a2b10f597c1f9f042e814726844b434`
- Target commit: `5229eb7842bb415a0ddff61d5ac0aaf50ec57e44`
- Target commit message: `feat: port findings validator to node with golden parity`

This review does not evaluate or approve N2/N3/N4/N5 implementation. It also does not declare product completion, OCR support completion, L2/L3 completion, provider finalization, or overall 2N-5 completion.

## Verdict

**PASS**

N1 is scoped to a Node port of the findings validator, preserves the Python reference, keeps the validator detect-only, uses no external dependency or package state, and demonstrates sufficient golden parity for N2 to proceed without required fixes.

## Readiness

- N2 entry: **Ready**
- Required fixes before N2: **None**
- Carry-forward to N2:
  - Keep Node validator issues internal/sanitized in delivery output, especially `schema.optional_skipped` info and optional quote-source load warnings.
  - Preserve D94 hard-stop implementation as an N2 delivery responsibility.
  - Keep Python validator as golden parity reference until the broader Node-only transition is closed.

## Actual Changed Files

Diff range checked:

`f40962b82a2b10f597c1f9f042e814726844b434..5229eb7842bb415a0ddff61d5ac0aaf50ec57e44`

Changed files:

- `docs/current_status.md`
- `docs/cycle2n_6_phase2_n1_validator_node_completion_report.md`
- `docs/workflow_usage.md`
- `src/validators/README.md`
- `src/validators/kssb_findings_validator.cjs`
- `tests/test_findings_validator_node.test.cjs`
- `tests/test_findings_validator_parity.test.cjs`

The diff did not include Python reference code, existing Python validator tests, schema, renderer, delivery, intake, runner, Skill, manifest, marketplace, package files, generated outputs, or runtime artifacts.

## Source-of-truth Reviewed

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/chatgpt_coordination_workflow.md`
- `docs/current_status.md`
- `docs/planning/post_2n5_final_remediation_plan_node_only.md`
- `docs/reviews/codex_cycle2n_5r_black_box_evidence_review.md`
- `docs/cycle2n_6_phase2_n1_validator_node_completion_report.md`

## Additional Files Inspected

- `docs/decision_log.md` entries D92, D93, D94
- `docs/workflow_usage.md`
- `src/validators/README.md`
- `src/validators/kssb_findings_validator.cjs`
- `src/validators/kssb_findings_validator.py`
- `tests/test_findings_validator_node.test.cjs`
- `tests/test_findings_validator_parity.test.cjs`
- `tests/test_findings_validator.py`
- related runner/delivery regression tests listed below

## Tests / Commands Executed

### Git / Diff Checks

- `git status --short --branch`
  - Result: clean `main...origin/main`
- `git log -1 --oneline`
  - Result: `5229eb7 feat: port findings validator to node with golden parity`
- `git diff --check f40962b82a2b10f597c1f9f042e814726844b434..5229eb7842bb415a0ddff61d5ac0aaf50ec57e44`
  - Result: pass
- `git diff --name-only f40962b82a2b10f597c1f9f042e814726844b434..5229eb7842bb415a0ddff61d5ac0aaf50ec57e44`
  - Result: changed files match the N1 reported surface.

### N1 Validator Tests

- `node --test tests/test_findings_validator_node.test.cjs`
  - Result: 43/43 pass, 0 skipped.
- `node --test tests/test_findings_validator_parity.test.cjs`
  - Result: 35/35 pass, 0 skipped.
- Absolute Python 3.14 with UTF-8 env, `tests/test_findings_validator.py`
  - Result: 30/30 pass.

### Additional Regression / Boundary Checks

- `node --test tests/test_document_intake_router.test.cjs`
  - Result: 21/21 pass.
- `node --test tests/test_hwp_assisted_runner_node.test.cjs`
  - Result: 39/39 pass.
- `node --test tests/test_pdf_ocr_runner.test.cjs`
  - Result: 29/29 pass.
- `node --test tests/test_toolcache_write_failure.test.cjs`
  - Result: 8/8 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/test_delivery_wiring.py`
  - Result: 34/34 pass.

### jsonschema Behavior Spot Check

- Python reference valid example default:
  - Result: one `schema.optional_skipped` info because `jsonschema` is not installed.
- Node valid example default:
  - Result: one `schema.optional_skipped` info with Node-specific wording.
- Node valid example `--no-jsonschema`:
  - Result: no issues.

This confirms the current environment exercised the intended fallback-equivalent path.

### Contamination Scan

Checked for package/runtime/generated-artifact contamination including:

- `package.json`
- `package-lock.json`
- `node_modules`
- `*.intake.json`
- `*.ocr_text.json`
- `*.dei_candidate.json`
- `*.findings.json`
- `*.aux_signals.json`
- `submission.zip`
- `*.traineddata`
- runtime archives/installers/executables
- repo-local tool-cache directories

Result: no matching repo contamination found.

## Tests Not Executed

The full Python intake/renderer/runner/nethook suites were not exhaustively re-run. Reason: the target diff does not touch those surfaces, and targeted regression coverage was provided by delivery wiring plus Node runner/router/OCR/tool-cache suites. This does not affect the verdict for N1 because the reviewed change surface is the validator port.

## N1 Scope Compliance

**PASS**

The implementation is limited to:

- adding a Node findings validator,
- adding Node validator unit tests,
- adding Python/Node parity tests,
- documenting validator usage and current workflow status.

No N2 delivery/renderer port, N3 DEI port, N4 DOCX writer, N5 aux scanner decision/implementation, OCR runtime change, runner change, package change, or Skill change was introduced.

## Python Reference Preservation

**PASS**

`src/validators/kssb_findings_validator.py` and `tests/test_findings_validator.py` are not changed in the target diff. The Python reference suite still passes 30/30. The Node implementation treats Python as the golden reference rather than replacing or weakening it.

## Node Validator Detect-only Boundary

**PASS**

The Node validator mirrors the Python detect-only contract:

- it returns Issue objects and does not mutate findings,
- it does not generate or alter judgments, evidence, customer questions, recommendations, or report content,
- it does not call renderer/delivery/intake/runner code,
- it uses only Node built-ins.

The Node tests explicitly cover input immutability, including the optional quote check path.

## Python / Node Parity Assessment

**PASS**

Parity coverage is sufficient for the N1 gate:

- 30 fixture variants cover the Python validator behavior plus expanded edge cases.
- The parity suite compares exit code, issue count, severity distribution, issue order, severity, code, location, and message.
- Message comparison exceptions are documented and narrow (`schema.*` and `prohibited.list_load` wording/path differences).
- The parity suite found Python 3.14 and ran with skip 0.
- `--warnings-as-errors`, load failure exit 2, root non-object failure, and text summary parity are covered.

The Node validator is not looser than the Python fallback path currently used in this repo. The lack of optional `jsonschema` in Node is documented as "방식 A" and surfaced via `schema.optional_skipped` rather than hidden.

## jsonschema Difference Assessment

**PASS**

The Node implementation intentionally does not add a JSON Schema dependency. It reports `schema.optional_skipped` in default mode and suppresses that info under `--no-jsonschema`, matching the Python fallback behavior rather than claiming full schema validation.

This is acceptable for N1 because:

- the Python reference treats `jsonschema` as optional,
- core fallback structural checks are ported,
- parity is tested in the fallback path,
- the difference is documented in the completion report and validator README.

## Optional Quote Check Assessment

**PASS**

The optional quote check is additive and safely bounded for N1:

- default off,
- enabled only through explicit `--source-text` or API `sourceTexts`,
- whitespace-normalized substring check only,
- missing quote is a warning, not an error,
- findings are not modified,
- it does not replace black-box source review or human verification.

This feature is intentionally Node-only and does not expand the Python reference, which is consistent with D92's reference-preservation boundary.

## Dependency / Package / Artifact Contamination

**PASS**

No external dependency was added. There is no package manifest or lockfile change, no `node_modules`, no generated report/intake/OCR/findings artifacts, no runtime archive, no traineddata, no sample source commit, and no submission package.

## D94 / N2 Boundary Review

**PASS**

D94 hard-stop is still an N2 delivery responsibility. N1 adds the Node validator only and does not alter Python delivery behavior. `docs/workflow_usage.md` correctly documents Node validator as an internal/development execution option while keeping the user-facing entrypoint Skill-first.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

#### C2N6-N1-OBS-01: Keep validator info/warnings internal in N2 user-facing delivery

Node default validation emits `schema.optional_skipped` info, and optional quote-source load warnings can include the source-text path as issue location when the user provides a missing file. This is acceptable for N1 because validator output is an internal/preflight surface, but N2 delivery must preserve D94's raw-output and path-sanitization boundary before presenting summaries to users.

Blocking: No.

#### C2N6-N1-OBS-02: Optional quote check currently accepts text files, not DEI JSON directly

The quote check is intentionally minimal and additive. If future workflows want to use DEI blocks directly as the source corpus, that should be a later explicit enhancement rather than inferred from N1.

Blocking: No.

#### C2N6-N1-OBS-03: Continue using Python reference until broader Node migration closes

The parity suite is strong for N1 and should remain part of subsequent N2/N3/N4 validation while Python remains the golden reference. Removing or relaxing Python reference parity would be premature before the Node-only transition is complete.

Blocking: No.

## Required Fixes Before N2

None.

## Carry-forward Items

- N2 delivery should consume Node validator output without exposing raw issue locations, local paths, stack traces, or internal diagnostic details to user-facing summaries.
- N2 should implement D94 hard-stop in Node delivery rather than patching transitional Python delivery.
- Maintain Python validator as the golden parity reference for later migration steps.
- Treat optional quote checking as a review aid, not a substitute for source-bound human review.

## Final Recommendation

Proceed to N2: delivery + HTML/Markdown renderer port with D94 hard-stop built into Node delivery. N1 is sufficiently scoped and verified, with no required fixes before N2.
