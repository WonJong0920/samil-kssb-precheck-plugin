# Codex B5-Q P1-1 Quote Selection Guidance Review

## Review range

- Range: `3dd10c087044d811763d06a63024687db85335c0..35fef71f7b42cb710d39a811bae2e8ca765e7a7b`
- Reviewed HEAD: `35fef71f7b42cb710d39a811bae2e8ca765e7a7b`
- Review date: 2026-07-09

## Verdict

PASS

## Readiness

P1-1 is safely closed as a narrow upstream quote-selection guidance cycle.

P1-2 may proceed as a separate narrow cycle for numeric meaning / column-period mapping guidance. P1-3 should remain separate and must preserve the source-status and hedge requirements recorded in `docs/planning/kssb_precheck_output_enhancement_plan.md` section 7-2.

This PASS does not approve renderer, validator, delivery, schema, manifest, package, generated artifact, or KSSB-standard interpretation changes.

## Changed files verification

Actual changed files:

- `docs/b5q_p1_1_quote_selection_guidance_completion_report.md`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`

The changed surface matches P1-1:

- Skill guidance was updated with a short anchor to the continuous-span quote rule.
- Evidence mapping guidance was updated with continuous-span, table/index-derived quote, evidence-strength, and recheck checklist rules.
- A completion report was added.

No `.cjs`, `.py`, `.json`, schema, validator, renderer, delivery, intake, manifest, marketplace, package, test, generated artifact, source document, or submission archive changes were present in the reviewed range.

## Source-of-truth inspected

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/reviews/codex_b5q_source_traceability_review.md`
- `docs/planning/kssb_precheck_output_enhancement_plan.md`
- `docs/b5q_p1_1_quote_selection_guidance_completion_report.md`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`

## Commands/checks executed

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --name-only 3dd10c087044d811763d06a63024687db85335c0..35fef71f7b42cb710d39a811bae2e8ca765e7a7b`
- `git diff --stat 3dd10c087044d811763d06a63024687db85335c0..35fef71f7b42cb710d39a811bae2e8ca765e7a7b`
- `git diff --check 3dd10c087044d811763d06a63024687db85335c0..35fef71f7b42cb710d39a811bae2e8ca765e7a7b`
- focused `git diff` review for `SKILL.md`, `evidence_mapping_rules.md`, and the completion report
- `rg` search for quote / continuous span / evidence-mapping references in the changed Skill files
- artifact/package scan with `git ls-files`
- untracked-file scan with `git ls-files --others --exclude-standard`
- changed-file scope scan for code/schema/validator/renderer/delivery/package/test paths

An optional `Format-Hex` BOM spot check did not complete in the sandbox helper, but this does not affect the verdict: `git diff --check` passed, the reviewed diff is text-only, and no BOM-inducing rewrite was visible in the actual file diff.

No runtime tests were executed because this is a markdown-only upstream guidance change with no code/test/runtime changes.

## Guidance quality review

The added guidance directly addresses the observed QR1 risk: non-contiguous table/index tokens being stitched into a quote that cannot be rediscovered in the source.

The implementation is appropriate because it:

- defines a quote as one continuous source span, with only whitespace/linebreak normalization allowed;
- bans stitching separate sentences, cells, rows, or tokens into one quote;
- gives table/index-specific handling: quote only a single continuous cell value, and move row/column/category markers into page/location/relevance explanation instead of quote text;
- says no quote should be created when no continuous source span exists;
- prefers complete source sentences or actual activity/numeric descriptions over fragments and labels;
- adds a recheck checklist item for non-contiguous quote synthesis.

These are source-bound evidence-quality rules, not new judgment rules.

## Boundary review

The change stays within the approved P1-1 boundary.

- It is upstream Skill/evidence-mapping guidance only.
- It does not add validator warnings or detection logic.
- It does not modify renderer or delivery output behavior.
- It does not change findings schema or `judgment_code` semantics.
- It does not introduce KSSB standard interpretation, AR1/AR2 wording, or roadmap/PwC source assumptions.
- It extends existing "do not create anchors from unavailable quotes" and quote reality recheck rules rather than changing label assignment.

## Critical / Major / Minor

Critical: 0

Major: 0

Minor: 0

Observations:

- Because this is prompt/guidance-level work, actual improvement depends on future B5-Q or B6 black-box evidence. That is acceptable for P1-1 and not a blocker.
- If later cycles add validator detection for stitched table quotes, that should remain a separate QR3/noise-control design and must not be treated as part of this P1-1 closure.
- P1-2 should keep the same upstream-only posture unless it is explicitly scoped otherwise.

## Required fixes before P1-2

None.

## Carry-forward

- P1-2: numeric meaning and column/period mapping should remain an upstream guidance cycle unless separately approved.
- P1-3: preserve section 7-2 source-status labels and hedge requirements for AR1/AR2.
- B6: final review should consider whether B5-Q cycles are completed or explicitly deferred before final submission readiness.

## Recommendation

Proceed to P1-2 as a separate narrow B5-Q remediation cycle. Keep validator, renderer, delivery, schema, manifest, package, and generated artifacts unchanged unless a later cycle explicitly requests and reviews those surfaces.
