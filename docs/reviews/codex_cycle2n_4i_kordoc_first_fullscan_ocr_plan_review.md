# Codex Cycle 2N-4I Kordoc-first Full-scan OCR Plan Review

## Verdict

PASS.

Cycle 2N-4I is safe to carry into Cycle 2N-4J router skeleton work. The plan is appropriately scoped as design and strategy adoption only. It does not claim OCR support completion, L2 completion, L3 completion, provider finalization, product completion, or 2N-5 passage.

Reviewed HEAD:

```text
9b3c7826f094102f8ef55b7781b5b648e15036bf
```

Base checked:

```text
fdbabf027c569f4f9d61cc61c1657e7c74d2c984
```

Actual changed files:

```text
docs/current_status.md
docs/decision_log.md
docs/kordoc_first_enhanced_intake_fullscan_ocr_plan.md
```

## Reviewed Scope

Primary source-of-truth files reviewed:

- `docs/kordoc_first_enhanced_intake_fullscan_ocr_plan.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/reviews/codex_cycle2n_4h_architecture_submission_readiness_review.md`

Additional files checked for contract consistency:

- `docs/user_quickstart_pre_2n_5.md`
- `src/intake/dei_producer.py`
- `src/intake/runners/README.md`
- Existing OCR-related references found by repository search

Commands and checks performed:

```text
git pull origin main
git status --short --branch
git rev-parse HEAD
git diff --name-status fdbabf027c569f4f9d61cc61c1657e7c74d2c984..9b3c7826f094102f8ef55b7781b5b648e15036bf
git diff --stat fdbabf027c569f4f9d61cc61c1657e7c74d2c984..9b3c7826f094102f8ef55b7781b5b648e15036bf
git diff --check
repo contamination scan for node_modules, package-lock.json, submission.zip, generated intake/OCR/aux artifacts, runtime archives, installers, and executables
```

Results:

- Working tree was clean before review work.
- HEAD matched the requested commit.
- The target diff was docs-only and matched the reported three files.
- `git diff --check` passed.
- No forbidden generated artifacts or runtime binaries were found by the scan.

No runtime, OCR, rasterizer, Kordoc, tesseract.js, npm install, portable Node download, or 2N-5 black-box execution was performed.

## Strategy Alignment Review

The Kordoc-first enhanced intake strategy is consistent with the product definition.

The plan positions Kordoc as an enhanced intake provider for evidence candidate quality, not as a KSSB judgment engine. It explicitly keeps final analysis source-bound and human-review-bound. The strategy is framed as:

```text
Kordoc-first when available and approved.
Baseline fallback when unavailable, declined, or failed.
```

That wording is appropriate. It preserves the baseline fallback and avoids unapproved execution. It also addresses the observed limitation that text-layer PDFs can still benefit from document structure, heading, page anchor, table-context, caption-like, and nearby-context extraction.

The plan does not remove or weaken the current fallback path. It also does not convert Kordoc, tesseract.js, or OCR into a decision layer.

## Existing Decision Consistency Review

D70, D77, D90, and D91 are mutually consistent with the plan.

- D70: The L2 ledger boundary remains limited to "repo-side ingest boundary implemented+reviewed" and "L2 partially implemented". The 2N-4I plan does not claim L2 full completion.
- D77: OCR, rasterizer, and related native or runtime work remain gated. The 2N-4I plan reopens OCR as a future path only through 2N-4K and 2N-4L evidence and implementation cycles.
- D90: Portable Node B remains an approval-based fallback runtime strategy. The 2N-4I plan does not bypass approval, no-egress, tool-cache, hash, or packaging boundaries.
- D91: The current status and decision log clearly describe strategy adoption, not implementation completion.

No inconsistency was found between D91, `docs/current_status.md`, and `docs/kordoc_first_enhanced_intake_fullscan_ocr_plan.md`.

## Page-set OCR Architecture Review

The page-set model is a sound next-step design.

The distinction among mixed PDF, scan-only PDF, and large scanned PDF is clear enough to guide 2N-4J through 2N-4L:

- Mixed PDF: OCR should target `needsOcr` or text-empty pages.
- Scan-only PDF: OCR should target all pages.
- Large scanned PDF: all-page OCR is in scope, but bounded by page cap, batching, timeout, resume, and cleanup constraints.
- User-selected range: constrained to the `needsOcr` subset to preserve the existing ingest page-matching fail-fast contract.

The atomic final `ocr_text.json` rule is appropriate. Internal batch/resume scratch artifacts should stay internal and should not become committed or user-facing outputs.

Observation: 2N-4K or 2N-4L should include a scan-only fixture that proves Kordoc or the router can classify all pages for OCR selection. This is not a 2N-4I blocker because the plan already identifies scan-only handling and bounded execution as design requirements.

## Existing OCR Ingest Contract Review

The plan correctly reuses the existing OCR ingest contract instead of designing a parallel schema.

The current `src/intake/dei_producer.py` already contains key guardrails:

- `ocr_text.json` is validated before merge.
- OCR pages must match allowed `needsOcr` pages.
- `pages[].text_sha256` is checked against page text.
- `output_sha256` uses canonical output hashing.
- OCR text is routed into `ocr_supplement`, not normal blocks.
- OCR alone should not become confirmed evidence.
- Document-level HWP/HWPX/DOCX intake rejects `ocr_text` without page-level OCR eligibility signals.

The 2N-4I plan aligns with those constraints. The requirement for Node implementation plus Python golden parity for `canonical_ocr_output_sha256()` is important and appropriate.

## Rasterizer, Traineddata, Runtime, and Gate Review

The plan correctly treats rasterization and OCR runtime as unresolved gated evidence areas.

The plan does not reuse PyMuPDF 300DPI as a product path. That is appropriate because previous Gate D use of PyMuPDF was evidence-only and AGPL-sensitive. Any native dependency or rasterization library should remain subject to Gate B and runtime review.

The plan also correctly exposes traineddata sourcing risk. If `raw.githubusercontent.com/tesseract-ocr/tessdata_fast` is used, it must be treated as a distinct prep-egress source with approval, source disclosure, cache rules, hash pinning, and contamination scanning.

These are not required fixes before 2N-4J, but they must be resolved before 2N-4L implementation can claim a safe OCR path.

## No-overclaim and User-facing Boundary Review

The plan preserves no-overclaim boundaries.

It does not claim:

- OCR support complete
- L2 complete
- L3 image, chart, or semantic interpretation complete
- provider finalization
- product completion
- 2N-5 passage

The figure and chart language remains appropriately limited to caption-like text, surrounding context, and evidence candidate support. It does not claim visual semantic interpretation.

The decision not to update `docs/user_quickstart_pre_2n_5.md` at this stage is appropriate. Updating user-facing quickstart material before router, spike, OCR implementation, and integration review would risk describing unimplemented behavior. The plan correctly defers that update to 2N-4M after implementation evidence and review.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

ID: C2N4I-OBS-01
Severity: Observation
Location: `docs/kordoc_first_enhanced_intake_fullscan_ocr_plan.md`
Issue: Scan-only handling depends on reliable all-page OCR selection.
Impact: If Kordoc output for scan-only PDFs lacks the expected page quality or OCR candidate signals, the router could under-select pages.
Recommendation: In 2N-4K or 2N-4L, include a scan-only fixture proving that all pages are selected, or document the fallback rule that promotes scan-only documents to all-page OCR.
Blocking: No.

ID: C2N4I-OBS-02
Severity: Observation
Location: `src/intake/runners/README.md`, future 2N-4J router work
Issue: The current HWP assisted runner remains HWP-family scoped, while 2N-4I needs a PDF-aware Kordoc-first router.
Impact: 2N-4J must avoid forcing PDF behavior through the existing HWP runner contract in a way that confuses exit-code or approval semantics.
Recommendation: Keep router-level responsibility explicit: detect document family first, then route PDF enhanced intake separately from existing HWP-family assisted flow.
Blocking: No.

ID: C2N4I-OBS-03
Severity: Observation
Location: future 2N-4K/2N-4L
Issue: Rasterizer choice remains the largest unresolved implementation risk.
Impact: Native dependency, license, download source, no-egress, output determinism, and Windows behavior can all affect whether OCR fallback is safe enough for implementation.
Recommendation: Treat 2N-4K as an evidence cycle with explicit user approval, license/native review, hash pinning, no-egress verification, and cleanup checks before 2N-4L.
Blocking: No for 2N-4J.

ID: C2N4I-OBS-04
Severity: Observation
Location: future 2N-4L
Issue: Node implementation of OCR output hashing must remain byte-for-byte compatible with the Python canonical hash rule.
Impact: Any mismatch would make OCR artifacts fail ingestion or weaken reproducibility.
Recommendation: Make Node/Python canonical hash parity a blocking test in 2N-4L.
Blocking: No for 2N-4J.

ID: C2N4I-OBS-05
Severity: Observation
Location: future 2N-4M / 2N-5 re-entry
Issue: User-facing quickstart and status material should not be updated until implementation is reviewed, but they must be updated before 2N-5 re-entry if the new path is implemented.
Impact: Without 2N-4M documentation refresh, 2N-5 testers may not understand which OCR and Kordoc-first behaviors are implemented, gated, or fallback-only.
Recommendation: Keep quickstart unchanged now, then update quickstart, status, and relevant runner/intake docs during 2N-4M after 2N-4L evidence.
Blocking: No for 2N-4J.

## Required Fixes Before 2N-4J

None.

2N-4J may proceed as a router skeleton cycle if it stays implementation-limited and preserves approval, baseline fallback, no-egress, and no-overclaim boundaries.

## Items to Carry Into 2N-4K

- Decide and evidence the rasterizer path before any product-path OCR implementation.
- Treat native dependencies as Gate B-sensitive.
- Treat traineddata download source, cache placement, and hash pinning as prep-egress evidence.
- Verify no-egress for parsing and OCR execution separately from prep egress.
- Include scan-only and mixed-PDF evidence for page selection.
- Keep tesseract.js as an OCR fallback candidate, not as provider finalization.

## Items to Carry Into 2N-4L

- Implement selected-page OCR with bounded page cap, batching, timeout, resume, and cleanup behavior.
- Emit the final `ocr_text.json` atomically only after all selected pages complete.
- Keep scratch artifacts internal and non-committed.
- Enforce page-match fail-fast behavior against allowed OCR pages.
- Preserve `ocr_supplement` separation and avoid mixing OCR text into normal blocks.
- Add Node/Python canonical hash parity tests.
- Keep confidence as additive metadata only, with no threshold-based evidence upgrade in this cycle.

## Items to Carry Into 2N-4M / 2N-5

- Perform an integration review before re-entering 2N-5.
- Update quickstart and user-facing docs only after the router, spike evidence, and minimal OCR implementation have been reviewed.
- Re-state that OCR and Kordoc outputs are evidence candidates subject to human review.
- Do not claim L2 complete, L3 complete, OCR support complete, provider finalization, or product completion unless a separate closure cycle explicitly supports it.

## Quickstart Judgment

The decision not to update quickstart now is appropriate.

Current quickstart material describes the implemented pre-2N-5 state. Updating it during 2N-4I would risk user-facing overclaim because Kordoc-first enhanced PDF intake and page-set OCR fallback are not implemented yet. The quickstart should be updated during or after 2N-4M if the 2N-4J through 2N-4L work passes review.

## Scope Compliance

Code modification: none observed in the target diff.
Non-review document modification by Codex: none in this review.
Install/download/OCR/rasterizer execution: not performed.
2N-5 black-box execution: not performed.
Generated artifacts committed: none observed.
Commit/push by Codex: intentionally not performed, per this review instruction.

## Recommendation for Next Step

Proceed to Cycle 2N-4J router skeleton.

The next cycle should stay narrow: document-family routing, Kordoc-first eligibility, approval/fallback behavior, and no-overclaim guardrails. Rasterizer and tesseract.js evidence should remain in 2N-4K, and OCR fallback implementation should remain in 2N-4L.
