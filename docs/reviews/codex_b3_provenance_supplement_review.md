# Codex Review — B3 Provenance Supplement

## Review Range

- Base: `9614fb3a136e6b187f9373ec82e69f6e2e995d40`
- Target: `4b4e94f8a04bdb62c73713efc540529973ffc756`
- Review type: narrow evidence/provenance supplement review

## Verdict

**PASS**

The supplement adequately resolves the blocking condition from `B3-MAJ-01` for B3 closure purposes. The generated B3b output artifacts now have recorded byte counts and full SHA-256 hashes, and the unrecoverable input PDF hash is explicitly recorded as a limitation rather than hidden or overclaimed. This matches the prior Codex review's allowed closure path: recover the hashes if available, or document the limitation and decide whether a rerun is necessary.

The input PDF provenance remains incomplete for the original B3b run, but the document now treats that as a known evidence limitation and explains why a rerun would not recreate the same LLM-mediated run. That is acceptable for B3 closure, provided B3 closure records preserve this caveat.

## Readiness

- B3-MAJ-01: resolved for B3 closure with documented limitation.
- B3 closure: can proceed as a separate gated status/decision step.
- B5 packaging readiness: can proceed after B3 closure, with `B3-MAJ-02` and minor UX items carried forward as already mapped.

## Changed Files Verification

Actual changed files in the reviewed range:

- `docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`
- `docs/planning/b5_packaging_readiness_prep_notes.md`

The range is docs-only. No code, tests, schema, package/lock files, manifest, generated report, original PDF, runtime artifact, or `submission.zip` changes are present in this diff.

## Source-of-Truth Inspected

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/reviews/codex_b3_node_runtime_and_real_ux_evidence_review.md`
- `docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`
- `docs/planning/b5_packaging_readiness_prep_notes.md`
- `docs/planning/b3_smoke_and_real_ux_evidence_kit.md`
- `docs/blackbox_protocol.md`

## Commands / Checks Executed

- `git pull origin main`
  - Result: already up to date.
- `git rev-parse HEAD`
  - Result: `4b4e94f8a04bdb62c73713efc540529973ffc756`.
- `git log --oneline -5`
  - Result: target commit is current HEAD.
- `git diff --name-only 9614fb3a136e6b187f9373ec82e69f6e2e995d40..4b4e94f8a04bdb62c73713efc540529973ffc756`
  - Result: expected two docs files only.
- `git diff --stat 9614fb3a136e6b187f9373ec82e69f6e2e995d40..4b4e94f8a04bdb62c73713efc540529973ffc756`
  - Result: two docs files, `42 insertions`, `7 deletions`.
- `git diff --check 9614fb3a136e6b187f9373ec82e69f6e2e995d40..4b4e94f8a04bdb62c73713efc540529973ffc756`
  - Result: clean.
- Repo contamination scan for `node_modules`, `tool-cache`, package/lock files, `submission.zip`, and generated intake/OCR/aux JSON artifacts.
  - Result: no matches.

B3a/B3b were not rerun, per review instructions.

## B3-MAJ-01 Supplement Review

The prior `B3-MAJ-01` required either recovery of missing B3b input/output inventory hashes or explicit limitation handling. The supplement does the following:

- Adds byte counts and full SHA-256 hashes for the three recovered generated outputs: DOCX, HTML, and Markdown.
- Records that `run_manifest.json` was absent because the real UX run did not use `--manifest`; this is normal for that run and is not presented as a missing artifact.
- States that the input PDF was the public 2024 K-water sustainability report with 126 pages.
- Explicitly records that the input PDF path, byte count, and SHA-256 were not captured in the real UX log and cannot be recovered from this evidence.
- Records the limitation rather than asserting full input provenance.
- Explains that rerunning would not reconstruct the same LLM-mediated findings/output run and is therefore not a good fix for this specific provenance gap.
- Carries the input-hash capture rule forward to future B3b-style executions.

This is sufficient to close the prior conditional-pass blocker as an evidence limitation, not as full input provenance recovery. The distinction is clear enough for B3 closure.

## Carry-Forward Mapping Review

The patch correctly maps the previous findings:

- `B3-MAJ-01`: closed in the evidence document by output hash recovery plus input limitation.
- `B3-MAJ-02`: carried into B5 prep as plugin-bundle `docs/` reference risk.
- `B3-MIN-01`: carried into B5/UX notes as PDF input UX gap.
- `B3-MIN-02`: carried into B5/UX notes as encoding/mojibake narration.
- `B3-MIN-03`: carried into B5/UX notes as local path/account-name exposure in agent narration.
- `B3-MIN-04`: carried into B5/UX notes as item-count narration instability.

This mapping is consistent with the prior review: only `B3-MAJ-01` blocked clean B3 closure; the others are B5 or later carry-forward items.

## Required Fixes Before B3 Closure

None.

B3 closure should still mention the input PDF hash limitation so future readers do not mistake the current B3b evidence for fully hashed input provenance.

## Observations

- The supplement does not verify the recovered output hashes independently against files because the review intentionally avoids accessing or committing repo-external generated artifacts. The evidence claims are still acceptable because this narrow review is about the repo-recorded provenance supplement, not a rerun or artifact audit.
- Future real UX evidence should capture input and output byte counts/SHA-256 at execution time, as the kit already requires.

## Recommendation

Proceed with a separate B3 closure recording step, preserving the input provenance limitation. After B3 closure, proceed to B5 packaging readiness audit, with `B3-MAJ-02` treated as a required packaging/readiness focus and the minor UX findings carried forward.
