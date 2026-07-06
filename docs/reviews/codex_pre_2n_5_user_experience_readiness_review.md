# Codex Pre-2N-5 User Experience Readiness Review

## Verdict

CONDITIONAL PASS

Reviewed HEAD: `f7b7b5359e1c6e5ed01bb9af5050cb844c8cada5`

This review finds the plugin's product boundary, evidence-first workflow, output report structure, and safety posture largely sound for a pre-2N-5 user experience review. However, a first-time user or judge still has to assemble the actual input-support expectations and assisted-runner approval flow from several documents. Before 2N-5 black-box testing, the repo should add one concise user-facing quickstart or equivalent README section that consolidates supported/fallback document handling, approval decisions, expected outputs, and the representative 2N-5 scenarios.

This verdict does not declare product completion, 2N-5 success, L2 completion, OCR support, provider finalization, or Portable Node B adoption.

## Review Scope

Reviewed user-facing and reviewer-facing materials relevant to:

- Plugin purpose and product boundary
- Skill entrypoint and workflow contract
- Input document handling expectations
- Assisted HWP/HWPX/DOCX runner and portable Node approval flow
- Delivery/output report usefulness
- Submission packaging and reproducibility posture
- Prior sample output quality evidence and 2N-5 scenario implications

Primary files reviewed:

- `README.md`
- `src/.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/report_template.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`
- `docs/product_definition.md`
- `docs/workflow_usage.md`
- `docs/codex_install_readiness.md`
- `docs/codex_install_verification.md`
- `docs/submission_packaging_policy.md`
- `src/intake/README.md`
- `src/intake/runners/README.md`
- `src/renderers/kssb_report_delivery.py`
- `src/renderers/kssb_report_renderer.py`
- `docs/samples/codex_cycle2n_4g_portable_node_real_download_evidence.md`
- `docs/reviews/codex_cycle2m_3_sample_output_quality_review.md`
- `docs/planning/cycle2m_5_output_quality_remediation_notes.md`
- `docs/current_status.md`
- `docs/decision_log.md`

No black-box sample execution, runtime download, npm install, Kordoc reinstall, OCR/rasterizer execution, submission packaging, or code modification was performed.

## User Journey Assessment

The repo communicates the product definition well at a high level. A user can understand that the plugin creates a consultant-review draft for KSSB disclosure evidence gaps, not an audit, certification, compliance, or legal conclusion. The Skill-first flow is also clear in the detailed docs: source-bound evidence analysis produces findings, validator preflight is detect-only, renderer/delivery converts findings into DOCX/HTML/Markdown outputs, and a human consultant reviews the result.

The main UX gap is not the purpose statement itself. It is the lack of one compact, current, user-facing route from "I have this kind of report file" to "this is what the plugin will do, what approval it may ask for, what output I should expect, and what fallback means." That information exists, but it is spread across the README, Skill, workflow usage docs, intake docs, runner docs, sample output review, and runtime evidence.

As a result, a judge or first-time user can understand the destination, but may not understand the operational path quickly enough before 2N-5.

## Install / Approval / Fallback UX Assessment

The install and approval posture is careful and mostly well documented:

- Local/repo marketplace status is separated from public Plugin Directory publication.
- User-led Codex install verification is documented.
- Portable Node uses explicit approval, repo-outside tool-cache, official source/hash controls, and decline/failure fallback.
- Kordoc-assisted execution is framed as an optional assisted path, not core plugin behavior.
- Preparation egress and parsing/run no-egress are distinguished in evidence and runner docs.

The weak point is presentation for non-implementers. `src/intake/runners/README.md` and the portable Node evidence are technically strong but dense. A user-facing quickstart should explain in plain Korean:

- Why Node/Kordoc may be requested
- Where tools are placed
- What happens if the user refuses
- What is allowed to access the network during preparation
- What no-egress means during document parsing
- Which path remains available when assisted setup is unavailable

This is a readiness issue before 2N-5 because black-box testing should validate the intended user flow, not force the tester to reverse-engineer it.

## Input Document Handling Assessment

The repo contains enough technical evidence to infer the expected handling of:

- Text-layer PDFs
- Mixed PDFs with zero-text pages
- Scanned/image-only PDFs
- DOCX
- HWPX
- HWP
- Unsupported or evidence-poor documents

However, the current user-facing docs do not consolidate this into a simple support/fallback matrix. This is especially important because current status is intentionally nuanced:

- L0/L1 baseline and schema-free DEI handling are available.
- L2 repo-side ingest boundary is implemented/reviewed only partially.
- Provider execution, runner integration, full plugin-side OCR execution, final provider selection, and L3 semantic image/chart/table analysis remain pending or provisional.
- Some documents can produce useful baseline outputs while still requiring assisted/OCR follow-up for full coverage.

Without a matrix, users may overexpect OCR/HWP support or underuse the available baseline path. This should be fixed before 2N-5.

## Output Report Usefulness Assessment

The output design is appropriate for consulting review. The report template and renderer provide:

- Cover and boundary notice
- Overall status summary
- Area/item-level evidence results
- Source anchors and quotes
- Missing information
- Customer questions and requested materials
- Recommendations
- Human review boundary and prohibited-term summary

The delivery wrapper also presents a user-facing summary that redacts local paths, identifies the primary output and fallbacks, summarizes preflight issues, and repeats the human review boundary. Cycle 2M-5 remediation strengthened wording and duplicate-warning behavior without turning validator or delivery into a rejudgment layer.

The output appears usable as a consultant-review draft. 2N-5 should still test whether actual generated reports remain readable for each input family and whether fallback documents contain enough context when assisted paths are unavailable.

## Submission / Reproducibility Assessment

Submission and reproducibility policy is strong. The repo distinguishes:

- Repo-included source and docs
- Zip-only conditional logs/sample artifacts
- Generated outputs excluded from repo by default
- No raw private logs, binaries, node_modules, package-lock, runtime archives, or submission.zip in repo
- User-led install verification and redaction requirements

The portable Node evidence also documents official source/hash behavior without committing runtime artifacts. This is suitable for reviewer reproducibility, provided the pre-2N-5 quickstart clarifies which steps are expected for black-box testing and which are optional/assisted.

## Overclaim / Safety Boundary Assessment

The safety boundary is generally robust:

- The plugin is not presented as Samil's official product or internal tool.
- It does not claim to replace audit, certification, compliance, legal, or final professional judgment.
- Validator remains detect-only.
- Renderer and delivery remain no-rejudgment format/conversion layers.
- Kordoc/portable Node are optional assisted-runner mechanisms, not hard plugin-core dependencies.
- L2/L3 status is mostly described with appropriate partial/provisional language.

The main overclaim risk is indirect: users may misread scattered technical evidence as current end-to-end support for HWP/OCR/L2. A consolidated quickstart/status matrix would reduce that risk.

## Recommended 2N-5 Black-box Scenarios

2N-5 should cover at least these user-visible scenarios:

1. Text-layer PDF baseline path: expected report generation with DOCX primary and HTML/Markdown fallback where configured.
2. Mixed PDF with zero-text pages: baseline report plus visible limitations, missing_info/customer_questions for unreadable portions, no overclaim.
3. Scanned/image-only PDF: graceful inability or assisted-needed path, with clear user action and no false evidence anchors.
4. DOCX input: document-level ingest/output behavior and safe handling of aux structure signals.
5. HWPX input: baseline or assisted-path behavior with clear limits.
6. HWP input with no assisted setup: clear fallback/refusal/customer action, no traceback.
7. HWP input with assisted runner prerequisites available: approval flow, tool-cache behavior, no-egress run evidence, and output handoff.
8. Portable Node approval accepted: official-source/hash/tool-cache flow and user-facing summary.
9. Portable Node approval denied or hash/download failure simulated: safe fallback to A path and understandable failure guidance.
10. Unsupported or malformed input: fail-fast or not_verifiable routing without generating false evidence.
11. Delivery failure/fallback: DOCX failure falls back to HTML/Markdown and user_summary remains path-redacted.
12. Submission preflight: generated artifacts are excluded from repo and logs/sample evidence handling is reproducible.

## Findings

### Critical

None.

### Major

ID: P2N5-UX-MAJ-01  
Severity: Major  
Location: `README.md`, `docs/workflow_usage.md`, `src/intake/README.md`, `src/intake/runners/README.md`, `docs/reviews/codex_cycle2m_3_sample_output_quality_review.md`  
Issue: Input support, assisted-runner expectations, OCR/scanned-PDF limits, and fallback behavior are not consolidated into one current user-facing matrix or quickstart.  
Impact: A first-time user or judge may not know what to expect for PDF/HWP/HWPX/DOCX/scanned documents, when approval is needed, or what fallback means. This also makes 2N-5 scenario selection less reproducible.  
Recommendation: Before 2N-5, add a concise README section or dedicated user quickstart that maps file type/status to expected handling, approval requirements, fallback behavior, and output expectations. Link it from README and, if appropriate, from runner/intake docs.  
Blocking: Yes, before 2N-5 user-facing black-box testing.

### Minor

ID: P2N5-UX-MIN-01  
Severity: Minor  
Location: `README.md`, `docs/workflow_usage.md`, `src/intake/README.md`  
Issue: Some top-level/current-flow wording remains conservative or historical enough to obscure the current distinction between core plugin flow, repo-side ingest boundary, and optional assisted runner evidence.  
Impact: Users may either underestimate available baseline/assisted paths or overread planning/evidence docs as completed end-to-end OCR/HWP support.  
Recommendation: In the same pre-2N-5 quickstart/status update, explicitly distinguish current core flow, optional assisted path, partial L2 boundary, pending provider execution/finalization, and unavailable L3 semantic image/chart analysis.  
Blocking: No if folded into P2N5-UX-MAJ-01.

### Observations

ID: P2N5-UX-OBS-01  
Severity: Observation  
Location: `src/skills/samil-kssb-precheck/SKILL.md`, `docs/product_definition.md`, `src/skills/samil-kssb-precheck/report_template.md`  
Issue: Product purpose and human-review boundary are clear and repeated appropriately.  
Impact: Reduces risk of audit/certification/compliance overclaim.  
Recommendation: Preserve this framing in the pre-2N-5 quickstart.

ID: P2N5-UX-OBS-02  
Severity: Observation  
Location: `src/renderers/kssb_report_delivery.py`, `src/renderers/kssb_report_renderer.py`  
Issue: Delivery and renderer outputs appear suitable for consultant review, with path redaction, primary/fallback output summary, warnings/errors, and human review boundary.  
Impact: Supports black-box testing of practical report usability.  
Recommendation: 2N-5 should inspect generated DOCX/HTML/Markdown for readability, not just existence.

ID: P2N5-UX-OBS-03  
Severity: Observation  
Location: `docs/submission_packaging_policy.md`, `docs/codex_install_readiness.md`, `docs/codex_install_verification.md`  
Issue: Submission and install verification policy is detailed and cautious.  
Impact: Good for judge reproducibility, but too detailed to serve as first-run guidance by itself.  
Recommendation: Keep these as reference docs and add a shorter user path on top.

ID: P2N5-UX-OBS-04  
Severity: Observation  
Location: `docs/samples/codex_cycle2n_4g_portable_node_real_download_evidence.md`, `src/intake/runners/README.md`  
Issue: Portable Node/Kordoc approval controls are well evidenced but still technical.  
Impact: Acceptable for implementation evidence; needs a plain-language summary for black-box testers.  
Recommendation: Summarize "why approval is requested / where it installs / what happens on refusal" before 2N-5.

## Required Fixes Before 2N-5

1. Add a concise user-facing quickstart or README section that includes:
   - Product purpose in one sentence
   - File-type handling matrix for text PDF, mixed PDF, scanned PDF, DOCX, HWPX, HWP, unsupported/malformed files
   - Which paths are core, baseline, optional assisted, pending, or unsupported
   - Approval flow for Node/Kordoc/portable Node, including refusal/failure fallback
   - Output expectations: DOCX primary, HTML/Markdown fallback, consultant-review draft, human review required
   - No-egress/prep-egress distinction in plain language
2. Add or link a compact 2N-5 black-box scenario checklist based on the recommended scenarios above.

## 2N-4H Need Before 2N-5

A narrow 2N-4H architecture/submission readiness or UX readiness patch review should happen before 2N-5 if it is used to add and verify the quickstart/status matrix. The review does not need to reopen core architecture, but it should confirm that the user-facing docs now match the current implementation, evidence, packaging policy, and no-overclaim boundaries.

## Direct 2N-5 Proceed Decision

2N-5 should wait for the required user-facing quickstart/status matrix. The technical implementation and evidence are close enough to support black-box testing, but the user journey is not yet sufficiently consolidated for a clean user-experience black-box run.

## Recommended Next Step

Create a narrow documentation patch for the pre-2N-5 quickstart/input-support matrix and scenario checklist, then run a short Codex review focused only on whether that patch resolves P2N5-UX-MAJ-01. After that, proceed to 2N-5 black-box testing.
