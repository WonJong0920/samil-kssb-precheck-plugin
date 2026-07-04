# Codex Review - Cycle 2L-3C Provider / Document Analysis Capability Comparison

## Verdict

PASS with nonblocking follow-up.

The Cycle 2L-3C evidence is sufficient as provider/document-analysis comparison material for L2 implementation-prep. It stays within comparison evidence scope, keeps Gate D PASS separate from final provider selection, and preserves the source-bound / human-review / no-rejudgment boundaries.

No Critical, Major, or Minor findings were identified.

Key judgment:

- `Kordoc + tesseract.js` is a reasonable provisional L2 candidate architecture: Kordoc for multi-format structure and routing signals, tesseract.js for scanned-page OCR fallback.
- This is not final provider approval.
- Kordoc 3.15.0 source-aligned comparison is recommended before final provider selection, but it is not a blocker for L2 implementation-prep.
- MCP feasibility is an optional follow-up design item, not a blocker for this review or for L2 prep.

## Critical / Major / Minor Findings

Critical: 0

Major: 0

Minor: 0

## Scope and Boundary Review

The comparison document remains scoped as evidence, not implementation:

- It explicitly states that the work is provider comparison evidence and not L2 code or final provider selection.
- It does not claim OCR/document-analysis outputs as KSSB judgment, audit, assurance, certification, or compliance conclusions.
- It treats extraction results as DEI candidate / review-signal material only.
- It preserves the ban on direct renderer/validator ingestion from provider outputs.
- Current status and decision log also keep L2/L3 implementation and provider finalization blocked pending review and user/ChatGPT decision.

The target commit is documentation-only: the changed files are `docs/current_status.md`, `docs/decision_log.md`, and `docs/samples/provider_document_analysis_comparison_2026-07-04.md`.

## Sample Coverage Review

The five-sample set is adequate for comparison evidence:

- scanned PDF
- text-layer PDF
- HWP v5
- HWPX
- DOCX

This covers the main near-term intake risks: scanned-only pages, structured text-layer PDF, Korean document formats, Office XML, table extraction, image detection gaps, and routing signals. The evidence records hash/aggregate information while keeping original documents outside the repo.

No tracked PDF, page image, raw OCR output, raw provider JSON, notebook, package lock, node_modules, venv, submission artifact, or MCP/app configuration was added.

## Provider Comparison Validity Review

The provider interpretation is appropriately bounded:

- Kordoc `3.13.0 + pdfjs-dist@4.10.38` is correctly framed as the npm-published/latest-observed baseline.
- Kordoc `3.8.2` is used as cross-check evidence, not as the preferred future version.
- `pdfjs-dist@6.1.200` is kept as an independent PDF baseline and not conflated with Kordoc behavior.
- PyMuPDF, poppler, and stdlib are treated as inspection/cross-check baselines, not product-path providers.
- tesseract.js is treated as the Gate D-proven scanned OCR baseline, not as the whole document-analysis solution.

The extraction-quality matrix supports the provisional architecture: Kordoc gives structured multi-format signals and tesseract.js covers OCR text production for scanned pages. The document also records limitations rather than overclaiming a complete solution.

## Version Discrepancy / Fallback Risk Review

The most important risk is documented clearly enough:

- GitHub source advertises `kordoc@3.15.0`, while npm latest observed is `3.13.0`.
- The attempted GitHub install fetched source but could not execute because `dist/cli.js` was absent.
- The evidence therefore limits tested Kordoc claims to npm-published `3.13.0`.
- `pdfjs-dist@6.1.200` incompatibility is separated from the Kordoc result and explains the fallback to `4.10.38`.

Judgment:

- Kordoc 3.15.0 source-aligned comparison is not an L2 implementation-prep blocker.
- It should be treated as a nonblocking follow-up before final provider selection or broader capability claims.
- The `pdfjs-dist@4.10.x` fallback is acceptable for prep only if the existing version-strategy posture remains: explicit pin, compat-check, fail-fast on unverified versions, and no auto-upgrade.

This means L2 prep can begin around a narrow, reversible provider interface, but irreversible provider finalization should wait for 3.15.0 source-aligned verification or an explicit decision to stay on npm-published 3.13.0.

## No-Egress / Native / License / Artifact Safety Review

The no-egress and native/license evidence is sufficient for comparison purposes:

- Kordoc parsing was run with the Gate A-style Node hook and recorded egress attempts as zero for both `3.13.0` and `3.8.2`.
- The evidence honestly notes that PyMuPDF/stdlib were not separately no-egress verified and limits them to inspection/cross-check use.
- `--omit=optional`, native 0, and RH-B2 boundary preservation are recorded for Kordoc.
- PyMuPDF AGPL dual and poppler GPL are treated as product-path unsuitable / inspection-only.
- Preparation egress is recorded separately from parsing no-egress.

Artifact safety was also preserved:

- Original documents, raw outputs, node_modules, venvs, locks, generated reports, and submission.zip were not committed.
- The scan found only policy/history references to raw artifacts, node_modules, venv, and submission.zip, not actual tracked artifacts.
- No unredacted local absolute path, account name, token, API key, private key, or sensitive sample file path was found in the changed evidence/status/decision files.

## Extraction Quality / DEI Suitability Review

The evidence supports the main qualitative conclusion:

- Kordoc provides useful structured signals for text-layer PDF, HWP v5, HWPX, DOCX, tables, outline/heading where available, images where detected, page numbers, bbox, and `needsOcr`.
- Kordoc's weaknesses are documented: no scanned OCR text generation, DOCX image gap, HWPX heading gap, caption limitation, and source-latest 3.15.0 unverified.
- tesseract.js is appropriately positioned as scanned OCR fallback, not a structural extractor.
- Kordoc JSON appears compatible with the existing DEI-candidate producer direction, but the review agrees with the evidence document's implicit limitation: this is mapping suitability, not a schema or judgment guarantee.

The current DEI boundary remains intact: provider outputs should become reviewable DEI candidates and routing signals only, then the Skill creates findings under the existing source-bound schema. Provider outputs must not bypass the Skill, validator, renderer, or human-review boundaries.

## Optional MCP Integration Feasibility Review

MCP is not required for this cycle and was correctly not implemented:

- No `.mcp.json`, plugin manifest MCP entry, MCP server bundle, or write/generation tool was added.
- Kordoc MCP integration, if pursued, should remain optional local-agent integration outside the L2 core path.
- Read-only extraction tools such as `parse_document` or `parse_table` are plausible future candidates.
- Write/generation tools such as `fill_form`, `patch_document`, or `generate_document` should remain out-of-scope or disabled by default for the MVP.

Judgment: MCP feasibility is a nonblocking follow-up design item. It is not a blocker for 2L-3C PASS or for L2 implementation-prep.

## Next-Step Readiness

L2 implementation-prep may proceed, but narrowly:

- It may use `Kordoc + tesseract.js` as a provisional candidate architecture.
- It should design a reversible adapter boundary rather than hard-code final provider commitment.
- It should keep provider outputs as DEI candidate material only.
- It should preserve no-egress, version pin/fail-fast, artifact redaction, native/license, and human-review gates.
- It must not present L2/L3 as implemented current functionality until implementation evidence and independent review pass.

The recommended branch is L2 implementation-prep with nonblocking follow-ups tracked, rather than blocking on Kordoc 3.15.0 source-aligned comparison first.

## Required Fixes Before Next Step, If Any

None.

## Recommended Next Step

Proceed to user/ChatGPT decision for L2 implementation-prep, with these nonblocking follow-ups carried forward:

1. Recheck Kordoc 3.15.0 source-aligned behavior when a runnable build path or npm publication exists.
2. Keep `pdfjs-dist@4.10.x` pinned with compat-check and fail-fast behavior; treat `6.x` as unsupported until revalidated.
3. Evaluate optional Kordoc MCP integration separately as read-only local extraction only, not as MVP core.
4. Treat DOCX image detection, HWPX heading gaps, and caption support as known quality limitations to test during adapter design.

L2 implementation-prep should remain prep/design. Actual L2/L3 implementation still requires a separate approved cycle and subsequent independent review.
