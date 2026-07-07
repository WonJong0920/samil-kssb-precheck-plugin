# Codex Cycle 2N-4I to 4M Execution Plan Addendum Review

## Verdict

PASS.

The prior Cycle 2N-4I design review PASS remains valid. The execution sequence from 2N-4J through 2N-4M is structurally sound, and Cycle 2N-4J can start without a required fix. This PASS is limited to execution-plan readiness. It does not mean OCR support completion, L2 completion, L3 completion, provider finalization, 2N-5 passage, or product completion.

Reviewed HEAD:

```text
9b3c7826f094102f8ef55b7781b5b648e15036bf
```

Existing review preserved:

```text
docs/reviews/codex_cycle2n_4i_kordoc_first_fullscan_ocr_plan_review.md
```

Addendum review:

```text
docs/reviews/codex_cycle2n_4i_to_4m_execution_plan_addendum_review.md
```

## Reviewed Scope

Source-of-truth files reviewed:

- `docs/kordoc_first_enhanced_intake_fullscan_ocr_plan.md`
- `docs/decision_log.md`
- `docs/current_status.md`
- `docs/reviews/codex_cycle2n_4i_kordoc_first_fullscan_ocr_plan_review.md`

Additional context checked by targeted search:

- D70, D77, D90, D91 decision context
- `2N-4J`, `2N-4K`, `2N-4L`, `2N-4M`
- `Gate B`, `Kordoc`, `tesseract`, `rasterizer`, `traineddata`
- `selected_pages`, `ocr_text`, `output_sha256`, `no-egress`, `approval`, `quickstart`

## Existing 2N-4I Review Status

The existing 2N-4I review remains valid and should be committed unchanged.

Summary retained from the prior review:

- Verdict: PASS
- Critical: 0
- Major: 0
- Minor: 0
- Observations: 5
- Required fixes before 2N-4J: none
- Quickstart judgment: do not update now; update after implementation and integration review

This addendum does not replace or weaken that review. It only clarifies execution sequencing and carry-forward gates for 2N-4J through 2N-4M.

## 2N-4J Readiness

Cycle 2N-4J can start.

The intended scope is sufficiently narrow:

- Add or adjust a router skeleton for PDF acceptance and Kordoc-first branching.
- Reuse existing approval/fallback semantics.
- Keep unavailable, declined, and failed paths flowing back to baseline.
- Validate gate behavior, wording, and branching with tests or mocks.
- Avoid OCR execution, rasterization, DEI redesign, findings schema changes, or renderer/validator/delivery changes unless a later reviewed cycle explicitly authorizes them.

The main 2N-4J implementation risk is not conceptual but boundary-related. The existing HWP-family runner historically treats PDF as out of scope. 2N-4J should therefore make routing ownership explicit rather than silently changing HWP-first semantics. PDF routing should be a Kordoc-first enhanced-intake path, while HWP/HWPX/DOCX should continue to follow the established assisted path unless intentionally refactored and reviewed.

Required fixes before 2N-4J: none.

## 2N-4K Spike Readiness

Cycle 2N-4K should not start as a normal implementation task. It should start only as an approval-based evidence cycle.

The following must be explicit before or at 2N-4K start:

- User approval for any real download, install, cache creation, or runtime spike.
- Rasterizer candidate list and acceptance criteria.
- Native dependency policy, including Gate B re-review if native dependencies are accepted.
- PyMuPDF boundary: prior 300DPI use was evidence-only and AGPL-sensitive; it must not become the product path by inertia.
- tesseract.js and tesseract.js-core package pinning and evidence scope.
- traineddata source disclosure, including any `raw.githubusercontent.com/tesseract-ocr/tessdata_fast` access.
- Hash pinning, cache location, cleanup method, and prep-egress logging.
- no-egress verification for rasterize/OCR execution, separate from prep egress.
- Contamination scan for node_modules, package/lock files, downloaded archives, runtime files, raster images, and generated OCR artifacts.

2N-4K may choose a rasterizer, but it should not merge OCR product-path code. That belongs to 2N-4L after 2N-4K evidence and review.

## 2N-4L Implementation Preconditions

Cycle 2N-4L should begin only after 2N-4K produces sufficient evidence for runtime, rasterizer, traineddata, hash, cache, and no-egress behavior.

Before 2N-4L starts, the following must be pinned down:

- `selected_pages` contract for mixed PDFs, scan-only PDFs, and user-selected ranges.
- Scan-only behavior proving all pages are selected or a fallback rule that treats scan-only documents as all-page OCR.
- Page cap, batch size, timeout, and resume behavior based on 2N-4K evidence.
- Scratch artifact location and cleanup rules.
- Atomic final `ocr_text.json` emission after all selected pages complete.
- `output_sha256` Node implementation with Python `canonical_ocr_output_sha256()` golden parity.
- Hash validation for page text and whole OCR artifact.
- Confidence recorded only as additive metadata, with no threshold-based judgment or evidence upgrade.
- Existing ingest contract preserved: OCR text remains in `ocr_supplement`, not normal blocks, and OCR alone cannot create confirmed evidence.
- Raster PNG artifact defense, either through cleanup tests, output directory policy, `.gitignore` policy, or a documented equivalent.

The current plan is clear enough that these items can be carried forward rather than fixed before 2N-4J.

## 2N-4M Integration Review Scope

Cycle 2N-4M is the right place for user-facing documentation updates and integration review.

It should review or update at least:

- `docs/user_quickstart_pre_2n_5.md`, especially text-PDF behavior after Kordoc-first implementation.
- `README.md` if user-facing workflow changes.
- `docs/current_status.md`.
- `src/skills/samil-kssb-precheck/SKILL.md` if supported input behavior changes.
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md` if OCR citation or evidence mapping rules need user-facing clarification.
- `src/intake/README.md`.
- `src/intake/runners/README.md`.
- Any runner approval wording affected by new OCR or Kordoc-first behavior.

2N-4M should also perform a no-overclaim review before 2N-5 re-entry. It must verify that the docs do not imply product completion, L2 completion, L3 completion, OCR support completion beyond the reviewed path, provider finalization, audit assurance, certification, compliance determination, or automatic KSSB judgment.

## 2N-5 Re-entry Checks

Before 2N-5 black-box testing resumes, the repo should have evidence that:

- 2N-4J router behavior was reviewed.
- 2N-4K evidence passed or any failed OCR/rasterizer path was explicitly gated off.
- 2N-4L implementation, if attempted, passed review.
- 2N-4M updated quickstart and status docs to match actual implementation.
- Generated OCR artifacts, raster images, runtime archives, and tool-cache contents are not committed.
- User-facing output remains a consultant-review draft, not a final audit, assurance, certification, compliance, or legal judgment.
- Baseline fallback remains available if Kordoc, tesseract.js, or OCR execution is unavailable, declined, or failed.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

ID: C2N4I4M-OBS-01
Severity: Observation
Location: 2N-4J execution scope
Issue: The plan is clear that 2N-4J should be a router skeleton, but implementation could accidentally collapse HWP-family and PDF semantics.
Impact: A broad runner refactor could disturb previously reviewed HWP assisted behavior.
Recommendation: Keep 2N-4J routing explicit by document family and preserve prior HWP/HWPX/DOCX behavior unless separately reviewed.
Blocking: No.

ID: C2N4I4M-OBS-02
Severity: Observation
Location: 2N-4K spike setup
Issue: 2N-4K involves real evidence collection and likely downloads or cache changes.
Impact: Treating 2N-4K as ordinary implementation could bypass user approval, prep-egress logging, or contamination scans.
Recommendation: Start 2N-4K only with explicit user approval and evidence-cycle instructions.
Blocking: No for 2N-4J.

ID: C2N4I4M-OBS-03
Severity: Observation
Location: 2N-4L implementation planning
Issue: Artifact policy for raster PNGs remains open.
Impact: Raster images could become repo contamination or leak document content if cleanup/ignore behavior is not tested.
Recommendation: Decide raster artifact defense in 2N-4L before OCR implementation is considered complete.
Blocking: No for 2N-4J.

ID: C2N4I4M-OBS-04
Severity: Observation
Location: 2N-4M documentation refresh
Issue: Quickstart update is correctly deferred, but it becomes required before 2N-5 re-entry if 2N-4J through 2N-4L land.
Impact: Without a 2N-4M refresh, black-box testers may test stale user-facing expectations.
Recommendation: Treat quickstart/status/runner-doc alignment as a 2N-4M gate before 2N-5.
Blocking: No for 2N-4J.

## Required Fixes Before 2N-4J

None.

2N-4J may proceed directly as long as it remains a router skeleton cycle and does not perform OCR, rasterizer spike work, package install, Kordoc reinstall, tesseract.js execution, or 2N-5 testing.

## Carry-forward to 2N-4K

- Obtain explicit user approval before real downloads, installs, tool-cache changes, or runtime evidence.
- Decide rasterizer candidates and require Gate B review for native dependencies.
- Keep PyMuPDF out of the product path unless a separate license decision changes that boundary.
- Pin tesseract.js, tesseract.js-core, traineddata sources, and hashes.
- Record prep egress separately from execution no-egress.
- Verify no-egress for OCR/raster execution under `nethook.cjs`.
- Run contamination scans for runtime/package/generated artifacts.

## Carry-forward to 2N-4L

- Enforce `selected_pages` for mixed, scan-only, and user-selected range cases.
- Use bounded execution: page cap, batch, timeout, resume, and cleanup.
- Emit final `ocr_text.json` atomically once per document.
- Keep scratch checkpoints internal.
- Preserve existing OCR ingest contract and `ocr_supplement` separation.
- Require Node/Python `output_sha256` parity tests.
- Keep confidence as metadata only.
- Decide and test raster PNG artifact defense.

## Carry-forward to 2N-4M

- Refresh quickstart matrix only after implementation is reviewed.
- Align `README.md`, `current_status`, Skill docs, evidence rules, intake README, and runner README with actual implemented behavior.
- Confirm no-overclaim language.
- Confirm baseline fallback remains clear.
- Decide whether Codex alone reviews 2N-4M or whether Claude performs a prep review before Codex final review.

## 2N-5 Re-entry Confirmation Items

- 2N-4J reviewed.
- 2N-4K evidence reviewed or OCR path gated off.
- 2N-4L reviewed if implemented.
- 2N-4M docs/integration reviewed.
- No generated OCR/raster/runtime artifacts committed.
- User-facing docs accurately distinguish current implementation, assisted paths, fallback behavior, and human-review boundaries.

## Quickstart Judgment

The prior quickstart judgment remains correct.

The quickstart should not be updated during 2N-4I or this addendum review because the new Kordoc-first enhanced intake and page-set OCR behavior is not implemented yet. If 2N-4J through 2N-4L land, quickstart update becomes a 2N-4M gate before 2N-5 re-entry.

## Verification

Performed during this addendum review:

```text
git rev-parse HEAD
git status --short
git status --short docs/reviews/codex_cycle2n_4i_kordoc_first_fullscan_ocr_plan_review.md
rg -n "2N-4J|2N-4K|2N-4L|2N-4M|D70|D77|D90|D91|Gate B|Kordoc|tesseract|rasterizer|traineddata|selected_pages|ocr_text|output_sha256|no-egress|approval|quickstart" ...
git diff --name-only
```

Final verification before commit should include:

```text
git diff --check
git diff --name-only
git status --short
```

## Scope Compliance

Code modification: none.
Existing planning document modification: none.
Decision log modification: none.
Current status modification: none.
Quickstart modification: none.
Install/download/OCR/rasterizer execution: none.
2N-5 execution: none.
Generated output creation: none.

Only review documents are included in the intended commit.

## Recommendation

Commit both review documents and proceed to Cycle 2N-4J router skeleton.

Cycle 2N-4K should be separately framed as an approval-based evidence cycle. Cycle 2N-4L should wait for 2N-4K evidence and review. Cycle 2N-4M should remain the integration and user-facing documentation gate before 2N-5 re-entry.
