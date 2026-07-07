# Codex Review — Post-2N-5 Final Remediation Plan, Node-only Runtime

## Review Overview

- Reviewed commit: `9259929d4d874bc7d28892219921cfd8def216f5`
- Base referenced by plan: `18aaac13ae315b2676108582195bfcbb18d2e8ab`
- Primary document: `docs/planning/post_2n5_final_remediation_plan_node_only.md`
- Related evidence: `docs/samples/codex_cycle2n_5_black_box_execution_evidence.md`
- Related status/decision docs: `docs/current_status.md`, `docs/decision_log.md`
- Review role: independent plan review only. No code, tests, existing planning/status/decision documents, or generated outputs were modified.

## Verdict

**PASS**

The post-2N-5 remediation plan is a sound planning-only response to the 2N-5 `INCONCLUSIVE` evidence. It maps all three Major issues and one Observation from the Codex 2N-5 evidence to concrete remediation tracks, preserves the user decision that C안(Node-only core runtime) is the only final runtime-completion path, and avoids claiming 2N-5 pass, OCR support complete, L2/L3 complete, provider finalization, or product completion.

Phase 0 can proceed.

## Findings

### Critical

None.

### Major

None.

### Minor

None blocking Phase 0.

### Observations

#### OBS-01 — `current_status.md` still carries historical "current cycle" blocks below the new 2N-6 entry

- Severity: Observation
- Location: `docs/current_status.md`
- Issue: The new 2N-6 status entry is correctly first, but older 2N-4S/2N-4M/2N-4L blocks remain under `## 현재 Cycle` with stale "다음 =" phrasing. This predates the plan style and does not contradict the new 2N-6 entry, but it can slow future reviewers.
- Impact: Low. The 2N-6 item is clearly topmost and the status archive note explains historical handling. Not a blocker for Phase 0.
- Recommendation: During a later documentation hygiene pass, consider moving these older "current cycle" blocks into history or clearly marking them as retained historical context. Do not block Phase 0 on this.
- Blocking: No.

## Plan Assessment

The plan addresses the actual 2N-5 evidence rather than inventing new scope:

- R1 maps the uncontrolled stack trace/local path leak on tool-cache write failure to a narrow runner primitive patch.
- R2 acknowledges that deterministic findings generation is a Skill/LLM judgment step, not a repo CLI, and proposes a black-box protocol based on manual Skill-run evidence plus scripted preflight/delivery.
- R3 addresses the observed Windows/Python UTF-8 failure in the transition period and correctly treats Node migration as the long-term fix.
- R4 treats the `qualitySummary.needsOcr` boolean inconsistency as a documentation/interpretation issue because the OCR runner already uses the target page list.
- R5 leaves approved OCR/HWP execution as an explicit user/ChatGPT decision, preserving the approval boundary.

The planned ordering is also reasonable: Phase 0 removes immediate user-facing execution hazards before another black-box rerun; Phase 1 improves findings quality guidance; 2N-5R reruns before waiting for full Node migration; Phase 2 then handles Node parity in separable steps.

## 2N-5 Major Mapping Review

### Tool-cache write failure leak

The plan correctly identifies this as an immediate Phase 0 patch. It scopes the implementation to shared runner primitives (`recordApproval`, prep/run log append, directory creation) and tests permission-denied behavior. That is the right layer: the failure happened below Kordoc/OCR logic and should be normalized before user-facing fallback text.

### Missing sample-to-findings black-box harness

The plan does not attempt to make findings generation deterministic by pretending the Skill judgment step is a pure parser. That is consistent with the product architecture. The proposed official protocol should be detailed enough in Phase 0 to specify:

- how the manual Skill-run is invoked;
- how generated findings are captured;
- which sample document(s) are used;
- how preflight/delivery are scripted;
- what evidence is sufficient to mark scenario 1 PASS/FAIL rather than BLOCKED.

This is a Phase 0 deliverable, not a blocker in the plan itself.

### Windows Python UTF-8 failure

The plan correctly separates transition-period mitigation from final architecture:

- transition: explicit `PYTHONUTF8=1` / `PYTHONIOENCODING=utf-8` execution rule, with optional minimal script guard;
- destination: Node migration removes Python runtime dependency.

This is safe and avoids investing in a portable Python bridge that the user explicitly rejected.

## Node-only Runtime Strategy Review

The C안-only decision is documented with appropriate guardrails:

- final user runtime is Node only, via system Node or already adopted portable Node fallback;
- portable Python and OS Python installation guidance are excluded;
- Python code remains a parity/reference surface during migration;
- each migration step requires golden parity and Codex review;
- Python feature expansion is prohibited except minimal bug/safety patches.

The N1→N2→N3→N4→N5 breakdown is technically sensible. Validator first is the lowest-risk migration; delivery + HTML/MD before DOCX is pragmatic because it unlocks a Python-free representative output earlier without tackling deterministic OOXML zip assembly first. N5(aux scanner) is left as a decision because its value is auxiliary and its XML/parser cost may be disproportionate.

## Quality / Source-bound Boundary Review

The plan preserves the project boundaries:

- Skill-first structure remains intact.
- Findings generation remains source-bound and human-review oriented.
- Validator/delivery/renderer migration is framed as parity, not behavioral reinvention.
- Quote reality checking is proposed as an optional validator function when source text is provided, not as external-knowledge enrichment.
- OCR-derived text remains low-confidence supplementary material under existing evidence rules.
- No audit, assurance, certification, compliance-finality, provider-finalization, L2/L3-complete, or product-complete claim is introduced.

The Q1~Q5 quality items are appropriate and should improve sample-output quality without weakening source-bound analysis. The plan's decision to extend existing `SKILL.md`/`evidence_mapping_rules.md` rather than proliferating new documents is aligned with the 2N-4S simplification audit.

## Scope / Artifact Safety Review

Actual changed files in the reviewed commit:

- `docs/planning/post_2n5_final_remediation_plan_node_only.md`
- `docs/current_status.md`
- `docs/decision_log.md`

No code, tests, schema, validator, renderer, delivery, Skill, manifest, marketplace, package/lock, `node_modules`, runtime artifact, generated sample output, OCR output, traineddata, or `submission.zip` was added by the reviewed commit.

`git diff --check HEAD^..HEAD` passed.

## Required Fixes Before Phase 0

None.

## Required Conditions During Phase 0

Phase 0 should stay narrow:

1. Patch only the user-facing failure behavior for tool-cache/log write failures.
2. Add tests that simulate permission/write failure without real tool-cache mutation.
3. Define the black-box protocol and UTF-8 execution rule without claiming 2N-5 pass.
4. Do not start broad Node core migration in the same patch.
5. Do not add portable Python, package manager state, generated outputs, OCR runtime downloads, or `submission.zip`.

## Recommended Next Step

Proceed to Phase 0:

- R1 runner controlled-failure patch and tests;
- R2 black-box protocol documentation;
- R3 transition-period UTF-8 execution rule.

Then run Codex review before Phase 1 or 2N-5R.

## Final Report

- verdict: `PASS`
- reviewed commit: `9259929d4d874bc7d28892219921cfd8def216f5`
- critical: 0
- major: 0
- minor: 0
- observations: 1 nonblocking
- required fixes before Phase 0: none
- Phase 0 start readiness: yes
- scope compliance: docs-only reviewed commit; this review adds only `docs/reviews/codex_post_2n5_final_remediation_plan_node_only_review.md`
