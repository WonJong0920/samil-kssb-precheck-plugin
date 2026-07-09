# Codex Review — B3 Node Runtime + Real UX Evidence

## Review Range

- Base: `6eb2b0f2b7b91f213476f05788bed8ac05c414b5`
- Target: `6f34657d68f5dd6843a20a53e1b9fb3d13ecc5c6`
- Review type: B3 evidence review

Note: the local branch had later commits after the target (`docs/planning/b5_packaging_readiness_prep_notes.md`). This review is fixed to the range above and does not review later B5 prep work.

## Verdict

**CONDITIONAL PASS**

B3a provides strong deterministic Node runtime smoke evidence, and B3b provides useful real Codex UX evidence showing that the Skill can complete an end-to-end public-report run. However, B3b does not record the input PDF bytes/SHA-256 or generated output bytes/SHA-256 required by the kit/blackbox evidence posture. That provenance gap should be closed, or explicitly recorded as unrecoverable, before clean B3 closure and before moving into B5 as a completed B3 evidence baseline.

## Readiness

- B3a local Node runtime smoke: ready / sufficient.
- B3b real Codex UX: conditionally sufficient as a qualitative UX signal, but provenance metadata is incomplete.
- B3 closure: hold until B3b input/output inventory hash gap is resolved or explicitly accepted as a documented limitation.
- B5 packaging readiness audit: should proceed after the B3b provenance closure note; B5 must address bundle-doc references and submission packaging boundaries.

## Changed Files Verification

Actual changed files in the reviewed range:

- `docs/planning/b3_smoke_and_real_ux_evidence_kit.md`
- `docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`

This matches the expected changed surface. No code, test, schema, package/lock, runtime implementation, generated output, sample source file, or `submission.zip` changes were present in the reviewed range.

## Source-of-Truth Inspected

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/planning/b3_smoke_and_real_ux_evidence_kit.md`
- `docs/reviews/codex_b3_smoke_and_real_ux_evidence_kit_review.md`
- `docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`
- `docs/blackbox_protocol.md`
- `docs/workflow_usage.md`
- `src/skills/samil-kssb-precheck/SKILL.md`

## Additional Files / Inputs Inspected

- User-provided raw B3b execution log attachment.
- `src/renderers/kssb_report_delivery.cjs`
- `src/renderers/kssb_report_renderer.cjs`
- `src/validators/kssb_findings_validator.cjs`
- `src/schemas/kssb_findings_example.json`
- `.gitignore`

## Commands / Checks Executed

- `git status --short --branch`
  - Result: clean working tree.
- `git rev-parse HEAD`
  - Result: local HEAD was post-target; review remained fixed to the requested range.
- `git diff --name-only 6eb2b0f2b7b91f213476f05788bed8ac05c414b5..6f34657d68f5dd6843a20a53e1b9fb3d13ecc5c6`
  - Result: expected two files only.
- `git diff --stat 6eb2b0f2b7b91f213476f05788bed8ac05c414b5..6f34657d68f5dd6843a20a53e1b9fb3d13ecc5c6`
  - Result: `2 files changed, 135 insertions(+)`.
- `git diff --check 6eb2b0f2b7b91f213476f05788bed8ac05c414b5..6f34657d68f5dd6843a20a53e1b9fb3d13ecc5c6`
  - Result: clean.
- `git show <target>:...` for the kit and evidence documents.
  - Result: reviewed the target-state content directly, avoiding later-commit drift.

B3a/B3b were not re-run, per review instructions.

## B3a Evidence Review

B3a is strong and credible.

Positive evidence:

- Full Node suite recorded as `tests 365 / pass 365 / fail 0 / skipped 0`.
- Delivery success path used Node runtime delivery with `src/schemas/kssb_findings_example.json` and `--manifest`.
- DOCX/HTML/Markdown and `run_manifest.json` were generated in a repo-external temp folder.
- Manifest capture was not inferred from exit 0 alone; the evidence records file existence and `manifest_sha256`.
- D94 hard stop was tested by mutating one known-good anchor quote to `""`; Node delivery exited 4, did not create the bad output folder, and produced sanitized Korean guidance.
- The success path user summary scan found no local path/stack/internal-provider leakage.
- Strong prohibited phrases were not found, while the required negation disclaimer was correctly treated as allowed boundary wording.
- Same findings were run twice and all four outputs were byte-identical.
- Repo contamination scan after execution recorded zero changes.

Limitation:

- Output file hashes are recorded only as the leading 16 hex characters in the table, except the manifest self-hash. This is adequate as smoke evidence when paired with byte-identical rerun and no artifact commits, but full hashes would be better for future evidence. Because B3a is deterministic and internally consistent, this is an observation rather than a required fix.

## B3b Evidence Review

B3b is a useful real UX signal, but not fully complete as provenance evidence.

Positive evidence:

- The raw user-provided log and evidence document agree that the Skill was invoked on a public K-water sustainability report.
- The flow completed end-to-end: PDF text extraction, findings creation, validator preflight, report delivery, and primary DOCX generation.
- The evidence records validator `error 0 / warning 0` after quote correction.
- The most important quality signal is positive: quote reality checks caught three multi-column/line-break extraction mismatches, and the agent shortened/replaced those quotes with text actually present in the extracted source. That is real evidence that source-bound rules can prevent unsupported quotations during use.
- The final item count self-corrected from 9 to 10 before final report generation.
- Public-materials mode avoided committing original/private material to the repo.

Evidence gap:

- The B3 kit requested input filename/bytes/SHA-256 and output filename/bytes/SHA-256. The B3b evidence records the input report name and page count, and the output DOCX filename, but explicitly says file bytes/SHA-256 were not included in the log.
- Because original and generated artifacts are intentionally not committed, those hashes are the main lightweight provenance handle. Their absence makes B3b less reproducible than the kit intended.

This gap does not erase the real UX value of the B3b run, but it prevents a clean PASS for B3 evidence closure without a short supplemental record or an explicit limitation decision.

## Finding Severity Review

### Critical Findings

None.

### Major Findings

#### B3-MAJ-01 — B3b input/output provenance metadata is incomplete

- Location: `docs/samples/b3_node_runtime_and_real_ux_evidence_2026-07-09.md`, B3b section.
- Issue: The kit and blackbox protocol call for input and generated-output byte counts and SHA-256 hashes. The B3b evidence explicitly lacks file bytes/SHA-256 for the real-user PDF and generated outputs.
- Impact: The B3b run remains useful UX evidence, but it is weaker as reproducible evidence and cannot be cleanly closed as full B3 evidence without either recovering hashes or documenting that they are unavailable.
- Recommendation: If the files are still available, add a small follow-up evidence supplement recording input PDF bytes/SHA-256 and generated DOCX/HTML/MD bytes/SHA-256. If unavailable, record that limitation explicitly and consider whether a rerun is needed.
- Blocking: Blocks clean B3 closure and B5-as-next-with-B3-complete. Does not invalidate B3a.

#### B3-MAJ-02 — Installed plugin references repo-root `docs/` content outside the plugin bundle

- Location: B3b raw log and evidence document; `SKILL.md` references such as `docs/findings_schema_contract.md`.
- Issue: The plugin marketplace source path is `./src`, so repo-root `docs/` files are not part of the installed plugin bundle. The real run observed that a contract document was not packaged and the agent had to fall back to bundled schema/validator/renderer files.
- Impact: The run completed, but this is a real packaging/readiness risk for installed-plugin UX and should not be deferred to final review.
- Recommendation: B5 packaging readiness audit should decide whether to bundle required contract docs under `src/`, adjust Skill references to bundled equivalents, or otherwise mark repo-root docs as development-only references.
- Blocking: Does not block B3 evidence review by itself, but is a required B5 focus before final submission readiness.

### Minor Findings

#### B3-MIN-01 — PDF input UX relies on ad hoc PDF.js discovery rather than documented intake path

- Issue: The user naturally supplied a PDF, while the documented core contract says text-readable input and no automatic OCR/conversion. The real run used a discovered app-runtime PDF.js path after Python and other tools were unavailable.
- Impact: The UX succeeded but exposed a gap between user expectations and documented input preparation.
- Recommendation: Add user-facing guidance before final review: what PDF inputs are supported, what happens without configured assisted runners, and how source-bound text extraction is expected to occur.
- Blocking: Not a B3 blocker; carry forward to B5/UX docs.

#### B3-MIN-02 — Encoding-mojibake narration is reproduced in real UX

- Issue: The agent repeatedly narrated that guidance files looked garbled and were being re-read as UTF-8.
- Impact: Accuracy recovered, but this is user-facing noise and makes the plugin feel less polished.
- Recommendation: Add a Skill instruction or equivalent guidance to avoid exposing internal encoding/re-read narration to the user, without adding BOM to `SKILL.md`.
- Blocking: Not a B3 blocker.

#### B3-MIN-03 — Agent final narration exposed a local absolute path

- Issue: The delivery user summary was sanitized in B3a, but the agent's final chat included a local `C:\Users\<account>\Documents\...` link.
- Impact: The delivery boundary works, but the Skill/agent narration boundary should also avoid exposing local account paths in user-facing text.
- Recommendation: Extend user-facing path redaction guidance to final agent narration.
- Blocking: Not a B3 blocker; should be fixed before final UX/submission review.

#### B3-MIN-04 — Item count self-correction indicates minor reasoning instability

- Issue: The agent first described 9 catalog items, then corrected to 10 before final report generation.
- Impact: The final output used 10, so no direct report defect is shown, but this is a traceable UX rough edge.
- Recommendation: In future user-facing runs, defer item-count narration until after catalog enumeration is complete.
- Blocking: Not a B3 blocker.

## Required Fixes Before Next Step

Before recording B3 closure or treating B3 as complete for B5 sequencing:

1. Add a short B3b evidence supplement with input PDF bytes/SHA-256 and generated output bytes/SHA-256 if the files are still available.
2. If those hashes cannot be recovered, record that limitation explicitly and decide whether to rerun B3b for complete provenance.

## Carry-Forward Items

For B5 packaging readiness audit:

- Resolve the plugin-bundle/document-reference mismatch for repo-root `docs/` references from `SKILL.md`.
- Include `submission_packaging_policy.md` Node-runtime final preflight command alignment.
- Confirm generated artifacts, source PDFs, logs, and sample outputs remain excluded or zip-only according to policy.

For UX/docs polish before final review:

- Clarify PDF input expectations and assisted extraction behavior.
- Suppress internal UTF-8 re-read / mojibake narration in user-facing output.
- Prevent agent final narration from exposing local absolute paths/account names.
- Encourage item-count narration only after catalog enumeration.

## Recommendation

Do not mark B3 fully closed yet. First close the B3b provenance metadata gap with a small evidence supplement or explicit limitation note. After that, record B3 closure and proceed to B5 packaging readiness audit, with B5 treating the plugin-bundle `docs/` reference issue as a required packaging/readiness item.
