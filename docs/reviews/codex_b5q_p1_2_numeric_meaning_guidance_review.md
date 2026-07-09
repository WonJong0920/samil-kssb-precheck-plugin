# Codex B5-Q P1-2 Numeric Meaning / Column Mapping Guidance Review

## Review range

- Range: `5f415a5d879ceee6eb3c34968ba9bfaacaeac220..4e930b5edb17189d9ee6e06caac17222ec1d565e`
- Reviewed HEAD: `4e930b5edb17189d9ee6e06caac17222ec1d565e`
- Review date: 2026-07-09

## Verdict

PASS

## Readiness

P1-2 is safely closed as a narrow upstream numeric-meaning and column/period mapping guidance cycle.

P1-3 may proceed as a separate narrow cycle for AR1/AR2 KSSB context wording, provided it preserves `docs/planning/kssb_precheck_output_enhancement_plan.md` section 7-2 source-status and hedge requirements and remains upstream-only.

This PASS does not approve renderer, validator, delivery, schema, manifest, package, generated artifact, or KSSB-standard interpretation changes.

## Changed files verification

Actual changed files:

- `docs/b5q_p1_2_numeric_meaning_guidance_completion_report.md`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`

The changed surface matches P1-2:

- `evidence_mapping_rules.md` adds two section 7 guidance bullets for numeric table quote mapping and same-number meaning separation.
- `SKILL.md` adds a short anchor pointing to those rules and explicitly frames them as description/question-layer guidance, not rejudgment.
- A completion report was added.

No `.cjs`, `.py`, `.json`, schema, validator, renderer, delivery, intake, manifest, marketplace, package, test, generated artifact, source document, or submission archive changes were present in the reviewed range.

## Source-of-truth inspected

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/reviews/codex_b5q_p1_1_quote_selection_guidance_review.md`
- `docs/planning/kssb_precheck_output_enhancement_plan.md`
- `docs/b5q_p1_2_numeric_meaning_guidance_completion_report.md`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`

## Commands/checks executed

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --name-only 5f415a5d879ceee6eb3c34968ba9bfaacaeac220..4e930b5edb17189d9ee6e06caac17222ec1d565e`
- `git diff --stat 5f415a5d879ceee6eb3c34968ba9bfaacaeac220..4e930b5edb17189d9ee6e06caac17222ec1d565e`
- `git diff --check 5f415a5d879ceee6eb3c34968ba9bfaacaeac220..4e930b5edb17189d9ee6e06caac17222ec1d565e`
- focused `git diff` review for `SKILL.md`, `evidence_mapping_rules.md`, and the completion report
- `rg` search for numeric meaning / mapping / rejudgment wording
- changed-file scope scan for code/schema/validator/renderer/delivery/package/test paths
- artifact/package scan with `git ls-files`
- untracked-file scan with `git ls-files --others --exclude-standard`
- SKILL first-byte check: `45 45 45`, confirming no UTF-8 BOM was introduced
- targeted no-overclaim grep on the changed files

No runtime tests were executed because this is a markdown-only upstream guidance change with no code/test/runtime changes.

## Guidance quality review

The added guidance directly addresses the P1-2 risks:

- numeric table quotes without visible year/period headers;
- ambiguous numeric meaning, such as target emission level versus reduction amount;
- accidental over-reading of table values when column/period/unit mapping is not source-confirmed.

The implementation is appropriate because it:

- requires `relevance_note` to state year/period and unit mapping when a table row quote lacks visible headers;
- limits mapping statements to what can be confirmed from source table headers;
- tells the Skill to state uncertainty and treat quantitative evidence conservatively when mapping is not source-confirmed;
- requires same-number meaning differences to be explained in the evidence note;
- allows cross-checking against another source location, but only as a source-bound consistency check;
- routes source ambiguity to customer questions rather than forcing a conclusion;
- explicitly states that this is description/question-layer guidance, not rejudgment or recalculation.

These additions improve consultant reviewability without changing label semantics.

## Boundary review

The change stays within the approved P1-2 boundary.

- It is upstream Skill/evidence-mapping guidance only.
- It does not add validator warnings or detection logic.
- It does not modify renderer or delivery output behavior.
- It does not change findings schema or `judgment_code` semantics.
- It does not introduce AR1/AR2 KSSB standard wording or roadmap/PwC source assumptions.
- It preserves source-bound, human-review, no-rejudgment, and no-overclaim boundaries.

## Critical / Major / Minor

Critical: 0

Major: 0

Minor: 0

Observations:

- Actual output improvement depends on future black-box or sample evidence because this is guidance-level work. That is acceptable for P1-2 and not a blocker.
- The "cross-check" language is safe as written because it is limited to source-text comparison and falls back to customer questions when the source is ambiguous.
- P1-3 is higher interpretive risk than P1-1/P1-2 because it involves KSSB context wording. It should carry forward the section 7-2 finalized/draft/guidance labels verbatim.

## Required fixes before P1-3

None.

## Carry-forward

- P1-3: preserve section 7-2 source-status labels and hedge requirements for AR1/AR2.
- P1-3: remain upstream-only unless a separate reviewed decision changes the implementation surface.
- B6: final review should consider whether B5-Q cycles are completed or explicitly deferred before final submission readiness.

## Recommendation

Proceed to P1-3 as a separate narrow B5-Q remediation cycle for AR1/AR2 KSSB context wording. Keep validator, renderer, delivery, schema, manifest, package, and generated artifacts unchanged unless a later cycle explicitly requests and reviews those surfaces.
