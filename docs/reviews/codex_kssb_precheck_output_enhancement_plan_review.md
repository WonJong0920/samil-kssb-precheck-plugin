# Codex Review — KSSB Precheck Output Enhancement Plan

## Review Target

- Target HEAD: `a6c358e9d30e93c4f518b16c7eed631092567c55`
- Target file: `docs/planning/kssb_precheck_output_enhancement_plan.md`
- Review type: docs-only design / scope review

## Verdict

**CONDITIONAL PASS**

The plan is directionally strong and stays within a docs-only design posture. It correctly reframes the next quality work as generalizable output enhancement rather than a K-water-specific patch, preserves source-bound / detect-only / no-rejudgment boundaries, and routes high-risk changes into separate remediation cycles.

However, the plan relies on two important source inputs that are not directly reviewable in the repo: the referenced `kwater_kssb_precheck_improvement_report.md` and the KSSB finalized-standard reference (`[[kssb-standard-2026-finalized]]` / external PwC material). Before any P1 remediation changes Skill guidance, catalog wording, validator warnings, or renderer output, those source claims should be made reviewable or explicitly marked as user-supplied / externally verified assumptions.

The plan can remain as a design proposal, but implementation should wait until the source-traceability condition and sequencing against B5 packaging remediation are addressed.

## Readiness

- Plan as a discussion/design artifact: ready.
- P1 remediation implementation: **not yet ready** without source traceability and a sequencing decision.
- B5 packaging remediation: should still proceed first, as previously reviewed.
- B5-Q / output quality enhancement: suitable next lane after packaging-critical B5 work, or as a separately approved track that does not block/blur B5.

## Changed Files Verification

Actual changed files in `acf436b..a6c358e9d30e93c4f518b16c7eed631092567c55`:

- `docs/planning/kssb_precheck_output_enhancement_plan.md`

The change is docs-only. No code, Skill, schema, validator, renderer, delivery, manifest, marketplace, package, generated artifact, source PDF, or submission zip changes are present in the reviewed commit.

## Source-of-Truth Inspected

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/planning/kssb_precheck_output_enhancement_plan.md`
- `docs/planning/usertest_output_quality_review_2026-07-09.md`
- `docs/reviews/codex_b5_packaging_readiness_audit_scope_review.md`
- `docs/planning/post_phase3b_remaining_work_review.md`

## Additional Checks / Files Inspected

- `git status --short --branch`
- `git rev-parse HEAD`
- `git log --oneline -5`
- `git diff --name-only acf436b..a6c358e9d30e93c4f518b16c7eed631092567c55`
- `git diff --stat acf436b..a6c358e9d30e93c4f518b16c7eed631092567c55`
- `git diff --check acf436b..a6c358e9d30e93c4f518b16c7eed631092567c55`
- `rg` searches for the referenced K-water/GPT/KSSB terms and existing catalog entries.

No runtime tests were executed because this is a docs-only design review and the reviewed commit changes only a planning document.

## Findings

### Critical

None.

### Major

#### ENH-MAJ-01 — Key source references are not repo-verifiable before implementation

The plan cites:

- `kwater_kssb_precheck_improvement_report.md`
- `[[kssb-standard-2026-finalized]]`
- external PwC / KSSB finalized-standard material

Only `docs/planning/usertest_output_quality_review_2026-07-09.md` was found in the repo and directly reviewable. The missing GPT report may be intentionally uncommitted, and the external KSSB/PwC material may be outside repo scope, but the plan uses these sources to justify AR/G rules that could change future Skill prompts, catalog guidance, questions, and report framing.

Impact:

- A future implementation could bake in unreviewed or misquoted standard assumptions.
- Codex cannot independently validate the GPT-specific contributions or the exact KSSB finalized-standard claims from repo state alone.

Required before implementation:

- Add a small repo-reviewable source note, excerpt table, or redacted evidence summary for the GPT-derived and KSSB-standard-derived claims; or
- Explicitly mark those claims as user-supplied / external assumptions requiring human confirmation before implementation; and
- For AR1/AR2/AR3/AR4/AR6/AR7, record the exact standard source, date/version, and whether the rule is a mandatory requirement, transition relief, optional disclosure, or implementation guidance.

### Minor

#### ENH-MIN-01 — The "readiness pre-diagnosis" reframing needs sequencing protection against B5 scope

The plan intentionally shifts from an "item-level evidence matching report" toward a "KSSB disclosure readiness pre-diagnosis draft." It includes good boundaries, especially CORE/EXTENDED separation and no-overclaim wording.

Risk:

- If implemented before the B5 packaging fixes, it could blur the current stabilization sequence and introduce new installed-Skill wording before the bundle/path/policy issues are fixed.

Recommendation:

- Treat this plan as **B5-Q / output quality enhancement**, not as a replacement for B5-A/B/C packaging remediation.
- If any P1 item is pulled forward, keep it narrowly scoped and review it independently.

#### ENH-MIN-02 — AR1/AR2 wording can influence judgment labels and must stay upstream-only

The plan says internal carbon price should not be framed as simply out-of-scope/non-applicable when unconfirmed, and Scope 3 should be framed with transition-relief context. That is sensible, but these rules can affect judgment labels if applied carelessly.

Recommendation:

- Implement AR1/AR2 only in the upstream findings generation guidance/catalog/question layer.
- Do not add renderer/delivery post-processing that changes labels or reinterprets findings.
- If catalog wording changes are made, add test/evidence showing validator/renderer still consume findings without rejudgment.

#### ENH-MIN-03 — QR3 heuristic warning needs a separate noise-control design

QR3 proposes a validator detect-only warning for table-derived or stitched quotes. The warning-only posture is appropriate, but table extraction artifacts are noisy and could create too many false positives if implemented broadly.

Recommendation:

- Design QR3 as a narrow Node-only additive warning with fixture coverage before implementation.
- Keep it off the existing golden parity fixtures unless intentionally tested.
- Avoid treating warning presence as label downgrade or evidence rejection.

### Observations

- The plan correctly preserves source-bound analysis, detect-only validator boundaries, renderer no-rejudgment, human review, no-overclaim, and "missing disclosure is not noncompliance" boundaries.
- The P1 prioritization is plausible: QR1 and CR1 address concrete observed output defects, and AR1/AR2 address expectation framing.
- UR1 correctly recognizes that changing "True"/internal status wording is renderer expression work and requires Node/Python parity fixture handling.
- GR4/GR5 are correctly treated as EXTENDED because they can drift from evidence precheck into broader consulting readiness work.

## Scope Review

The reviewed change stays within planning scope:

- No implementation.
- No schema change.
- No validator or renderer change.
- No delivery or manifest change.
- No Skill change.
- No generated artifact or sample source commit.

The document does not claim product completion, 2N-5 pass, OCR completion, provider finalization, or submission readiness.

## Recommended Implementation Sequencing

1. Complete B5 required packaging remediation first:
   - bundle self-containment,
   - installed-plugin path normalization,
   - Node-first packaging policy,
   - minimal installed Skill UX guardrails.
2. Add source-traceability note for this enhancement plan.
3. Start narrow P1 quality remediation cycles:
   - QR1 upstream quote-selection guidance,
   - CR1 numeric meaning/customer-question guidance,
   - AR1/AR2 KSSB context wording after source confirmation.
4. Defer renderer wording work (UR1) and validator heuristic work (QR3) to their own design/implementation reviews.
5. Defer GR4/GR5 extended readiness sections until the core evidence-precheck report remains stable after B5/B6.

## Required Fixes Before P1 Implementation

1. Make GPT/KSSB-standard source claims reviewable or explicitly assumption-labeled.
2. Decide whether P1 runs after B5-A/B/C or as an explicitly separate B5-Q track.
3. For AR rules, record source version/date and mandatory/optional/transition-relief status.

## Recommendation

Accept the plan as a useful design direction, but do not start P1 implementation yet. First preserve the B5 remediation sequence and add source traceability for the external/GPT-derived standard claims. After that, implement P1 in narrow, separately reviewed remediation cycles.
