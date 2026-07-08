# Codex Review - Phase 3-A Validation Coverage Audit

## Review Overview

- Role: Codex independent reviewer.
- Review type: narrow docs-only review.
- Reviewed range: `152709ecb45c4d4520d8714435c0b1d31d371554..64025579b81f0069afa09b4aa5811f7b1221f887`
- Target commit: `64025579b81f0069afa09b4aa5811f7b1221f887`
- Target file: `docs/planning/phase3a_validation_coverage_audit.md`

This review checks whether the Phase 3-A audit is accurate enough to serve as a safe gate for later Phase 3 work. It does not implement Phase 3-B, modify the audit, update workflow docs, re-decide N5, or start 3-C/3-D.

## Verdict

**PASS**

The audit is accurate enough to use as a Phase 3 gate. It correctly identifies that most schema/manual-contract checks are already covered by the Node validator, keeps quote reality as partial/opt-in, treats quantitative evidence checks as borderline rather than safe-by-default, leaves source-less numbers/external knowledge as not automatable, and keeps Phase 3 as validation-surface strengthening rather than judgment automation.

## Readiness

- 3-D entry: **Ready**. The black-box protocol Node-command alignment and trace-manifest evidence wording are docs-only and low risk.
- 3-C entry: **Ready for docs-first work**. Runtime path cleanup and review-table template strengthening can proceed.
- 3-B entry: **Not as a broad immediate implementation**. Proceed only after the specific rule set is scoped and approved; borderline rules need separate design/review.
- Required fixes before next Phase 3 step: **None**.

## Changed Files

The fixed diff contains one file:

- `docs/planning/phase3a_validation_coverage_audit.md`

No code, tests, schema, package files, runtime files, generated artifacts, `current_status.md`, or `decision_log.md` changed in the reviewed diff.

## Source-of-truth Reviewed

Required:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/chatgpt_coordination_workflow.md`
- `docs/planning/phase3a_validation_coverage_audit.md`
- `docs/planning/phase3_validation_strengthening_plan.md`
- `docs/findings_schema_contract.md`
- `src/validators/kssb_findings_validator.cjs`
- `src/skills/samil-kssb-precheck/completion_checklist.md`
- `docs/blackbox_protocol.md`
- `docs/decision_log.md` entries D93, D95, D96

Additional files inspected:

- `src/skills/samil-kssb-precheck/report_template.md`
- `src/skills/samil-kssb-precheck/kssb_requirement_catalog.md`
- Validator-related tests and docs via targeted `rg` searches.

## Commands Executed

- `git status --short --branch`
  - Result: clean `main...origin/main`.
- `git rev-parse HEAD`
  - Result: `64025579b81f0069afa09b4aa5811f7b1221f887`.
- `git diff --check 152709ecb45c4d4520d8714435c0b1d31d371554..64025579b81f0069afa09b4aa5811f7b1221f887`
  - Result: pass.
- `git diff --name-only 152709ecb45c4d4520d8714435c0b1d31d371554..64025579b81f0069afa09b4aa5811f7b1221f887`
  - Result: `docs/planning/phase3a_validation_coverage_audit.md`.
- `git diff --stat 152709ecb45c4d4520d8714435c0b1d31d371554..64025579b81f0069afa09b4aa5811f7b1221f887`
  - Result: 1 file changed, 157 insertions.
- Targeted `rg` over validator issue codes and tests:
  - Confirmed `anchor.source_id_ref`, `mode.label_mismatch`, `mode.source_mode_mismatch`, `quote.source_not_found`, `evidence.duplicate_quote_reuse`, `path.internal_exposure`, `prohibited.term`, and `schema.optional_skipped` exist in the code/test surface.
- Targeted `rg` over black-box protocol and checklist/template:
  - Confirmed current `<PY>` references in `docs/blackbox_protocol.md`.
  - Confirmed Python path references still exist in checklist/template docs.
- Targeted no-overclaim search in the audit:
  - Found only explicit negative boundary wording, not completion claims.

## Tests Not Executed

Code tests were not required because the reviewed diff is docs-only and contains no implementation changes. Static review and targeted code searches were sufficient for the audit accuracy questions.

## Audit Accuracy Assessment

**PASS**

The contract-to-validator table matches the current Node validator surface:

- source-bound anchor requirements are automated;
- `not_verifiable`, conflict, out-of-scope conditional requirements are automated;
- source cross-reference, mode/source-mode, and label/mode checks are already automated;
- quote reality exists only as opt-in source-text checking and remains partial;
- source-less numbers and external knowledge remain outside deterministic validation.

The audit also correctly recognizes extra guardrails beyond the original manual rules: duplicate quote reuse, prohibited terms, internal path exposure, list-load warning, and optional schema fallback info.

## Gap Classification Assessment

**PASS**

The SAFE / BORDERLINE / NOT-AUTOMATABLE split is appropriately conservative:

- Quote reality documentation alignment is SAFE; stronger normalization is correctly BORDERLINE.
- Quantitative evidence and unit-coupling checks are correctly treated as BORDERLINE because they approach judgment-quality evaluation and require catalog coupling.
- Source-less numbers, report-external inference, and external knowledge supplementation are correctly NOT-AUTOMATABLE as deterministic validator rules.

The audit does not overstate the validator as a full semantic verifier.

## Phase 3 Follow-up Order Assessment

**PASS**

The recommended order is sound:

1. 3-D first: update black-box protocol to Node runtime commands and describe trace manifest evidence limits.
2. 3-C next: clean runtime references and strengthen the human-review table surface.
3. 3-B later: implement only scoped detect-only rules after approval.

This ordering reduces risk because docs-only alignment and review-surface clarity happen before adding new validator heuristics.

## Boundary / No-overclaim Assessment

**PASS**

The audit preserves:

- Python golden parity reference status under D93;
- N5 aux scanner limitation under D93/D95;
- trace manifest v1 as delivery-segment provenance only under D96;
- validator detect-only and renderer no-rejudgment boundaries;
- human review as final authority.

It also explicitly states that Phase 3 is not product completion, 2N-5 pass, OCR completion, provider finalization, submission readiness, or audit/certification/compliance assurance.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

#### P3A-OBS-01: 3-C should include `report_template.md` top-note runtime drift, not only checklist workflow lines

The audit correctly identifies Python path drift in `completion_checklist.md`. Additional inspection shows `src/skills/samil-kssb-precheck/report_template.md` also still references the Python renderer and validator in its introductory note. The audit partially scopes report_template review to section 7/content rules, so 3-C should include the top-note runtime wording too.

Blocking: No.

#### P3A-OBS-02: The whitespace-only SAFE candidate should be narrowed

The audit lists `missing_info` / question whitespace-only fields as a possible SAFE validator candidate. Current validator `_isNonemptyStr()` already rejects whitespace-only question fields, while `missing_info` array element content is only length-checked. If pursued in 3-B, this should be narrowed to the actual uncovered surface rather than duplicating existing question-field checks.

Blocking: No.

#### P3A-OBS-03: Quantitative warning design should avoid penalizing legitimate `partial` cases by default

The audit correctly classifies quantitative unit-coupling automation as BORDERLINE and non-mandatory. If a future 3-B design pursues it, the rule should be scoped carefully, because some `partial_evidence_needs_supplement` cases are intentionally partial due to missing quantitative values. A confirmed-only warning or item-specific design may be safer than a blanket confirmed/partial warning.

Blocking: No.

## Required Fixes

None.

## Phase 3 Entry Decision

- 3-D: may proceed.
- 3-C: may proceed as docs-first cleanup and review-table design.
- 3-B: may proceed only after a tightly scoped rule proposal is selected from the audit and reviewed; do not start broad validator implementation from the full BORDERLINE list.

## Recommended Next Step

Proceed with Phase 3-D first, then Phase 3-C docs-first cleanup. Treat any Phase 3-B implementation as a separate scoped implementation cycle with explicit rule selection, severity, parity strategy, and Codex review.
