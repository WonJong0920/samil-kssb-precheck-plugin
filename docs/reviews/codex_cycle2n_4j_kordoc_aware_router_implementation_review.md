# Codex Cycle 2N-4J Kordoc-aware Intake Router Implementation Review

## Verdict

PASS.

Cycle 2N-4J is safely closed as a router skeleton implementation. The implementation recognizes PDFs, routes them into a Kordoc-first enhanced-intake path with approval and fallback semantics, delegates HWP/HWPX/DOCX unchanged to the existing Node HWP assisted runner, and avoids OCR, rasterizer, tesseract.js, package installation, download, or 2N-5 execution.

This verdict only means that the 2N-4J implementation review passed and that 2N-4K preparation can proceed. It does not mean OCR support completion, Kordoc-first completion, L2/L3 completion, provider finalization, 2N-5 passage, or product completion.

Reviewed commit:

```text
be74599e96ff422474dae9e11c4b5513cd174ae2
```

Base commit:

```text
6236ac9e67bfa11023af481990777e6858972732
```

## Reviewed Scope

Primary source-of-truth files reviewed:

- `docs/cycle2n_4j_kordoc_aware_intake_router_skeleton_report.md`
- `src/intake/runners/document_intake_router.cjs`
- `tests/test_document_intake_router.test.cjs`

Additional files and context checked:

- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/README.md`
- `docs/current_status.md`
- Diff from `6236ac9e67bfa11023af481990777e6858972732` to `be74599e96ff422474dae9e11c4b5513cd174ae2`
- Repository contamination scan for package/runtime/generated artifacts

Actual changed files in the reviewed diff:

```text
docs/current_status.md
docs/cycle2n_4j_kordoc_aware_intake_router_skeleton_report.md
src/intake/runners/README.md
src/intake/runners/document_intake_router.cjs
tests/test_document_intake_router.test.cjs
```

This matches the reported change surface.

## Router Boundary Assessment

The router design keeps document-family ownership clear.

`document_intake_router.cjs` detects PDF separately from the existing HWP-family supported extensions. PDFs are routed through a new Kordoc-first enhanced-intake flow. HWP/HWPX/DOCX inputs are delegated to `hwp_assisted_runner.cjs` by calling the existing runner with the original `argv` and options. The existing HWP runner still does not include `.pdf` in `SUPPORTED_EXTENSIONS`, and direct invocation of the HWP runner with a PDF remains out-of-scope.

That is the right answer to the 2N-4I/4M observation that PDF and HWP-family semantics should not be collapsed into a single runner ownership model.

## Approval, Fallback, and Failure Assessment

The PDF path follows the 2N-4I policy:

```text
Kordoc-first when available and approved.
Baseline fallback when unavailable, declined, or failed.
```

Observed behavior:

- Runtime unavailable: returns exit 4 and explains baseline fallback plus optional Portable Node B preparation.
- Install approval not granted: returns exit 5 with no exec call and no tool-cache side effect.
- Run approval not granted: returns exit 6 with no exec call.
- Install or run failure: returns exit 7 and points back to baseline text-based review.
- Evidence-mode no-egress failure: exits 7 without stack trace, local code path, or RunnerError leakage.
- Check mode: prints plan text and resolved npm path without executing install or run.

The implementation reuses existing runner primitives for pinning, install command construction, node/npm detection, nethook execution, provenance parsing, approval markers, prep-egress logs, and run logs. It does not define its own Kordoc pin or exit-code constants.

## No-OCR / No-Rasterizer Boundary Assessment

The router does not implement OCR, rasterization, tesseract.js, traineddata handling, page-set OCR, confidence scoring, or `ocr_text.json` generation.

The code imports only Node built-ins and the existing `hwp_assisted_runner.cjs`. It does not import validator, renderer, delivery, schema, DEI producer, OCR libraries, rasterizer libraries, or package-managed dependencies.

The PDF completion and approval messaging explicitly says OCR is not run in this phase and that scanned/image pages remain a later-stage concern. This keeps the 2N-4K/4L boundary intact.

## HWP-family Regression Assessment

HWP-family delegation is narrow and appropriate.

The reviewed code does not modify:

- `hwp_assisted_runner.cjs`
- `hwp_assisted_runner.py`
- `nethook.cjs`
- `prepare_portable_node.ps1`
- core schema/validator/renderer/delivery
- DEI producer
- Skill documents
- manifest or marketplace metadata

Node runner regression tests passed. The existing runner contract, exit codes, approval text, and nethook behavior remain intact.

## Documentation and Status Assessment

The implementation report and `current_status.md` align with the actual implementation.

They correctly state that:

- 2N-4J is a router skeleton.
- OCR/rasterizer/tesseract.js remain unimplemented and gated.
- Kordoc-first implementation is not complete.
- This is not L2/L3 completion, provider finalization, OCR support completion, or 2N-5 unblock.
- 2N-4K remains an evidence/spike step requiring review and user approval.

The runner README update is minimal and consistent with the new router surface.

## Test Execution

Commands run:

```text
git diff --check
node --test tests/test_document_intake_router.test.cjs
node --test tests/test_hwp_assisted_runner_node.test.cjs
node --test tests/test_portable_node_bootstrap.test.cjs
git diff --name-only 6236ac9e67bfa11023af481990777e6858972732..be74599e96ff422474dae9e11c4b5513cd174ae2
git status --short
repository contamination scan for node_modules, package files, generated intake/OCR/aux artifacts, raster images, runtime archives/installers, and submission.zip
```

Results:

- `git diff --check`: PASS
- `tests/test_document_intake_router.test.cjs`: 21/21 PASS
- `tests/test_hwp_assisted_runner_node.test.cjs`: 39/39 PASS
- `tests/test_portable_node_bootstrap.test.cjs`: 11/11 PASS
- `git status --short`: clean before review document creation
- contamination scan: no forbidden artifacts found

Python spot checks were not required for this review because the changed implementation surface is Node router skeleton plus Node tests, and existing HWP-family Node runner regression passed. The implementation report's Python spot-check claim was reviewed as report context, not re-run as a blocker condition.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

ID: C2N4J-OBS-01
Severity: Observation
Location: future 2N-4K evidence
Issue: The router skeleton tests use mocked Kordoc execution; there is not yet router-mediated real PDF Kordoc evidence.
Impact: This is acceptable for a skeleton, but 2N-4K should prove or explicitly defer real router-mediated PDF execution evidence before any broader claim is made.
Recommendation: Include a router-mediated PDF evidence scenario in 2N-4K if downloads/install/run approval is granted, or document why existing 2L-3C PDF Kordoc evidence remains sufficient.
Blocking: No.

ID: C2N4J-OBS-02
Severity: Observation
Location: future 2N-4K/4L artifact policy
Issue: Kordoc may create `images/` and image-bearing artifacts under output directories.
Impact: Even with `.intake.json` ignored, extracted images can be as sensitive as source documents.
Recommendation: Keep the current out-dir warning and carry artifact cleanup/contamination checks into 2N-4K/4L, especially before committing any sample or generated output.
Blocking: No.

ID: C2N4J-OBS-03
Severity: Observation
Location: future 2N-4M docs refresh
Issue: User-facing documentation is intentionally not updated to say text PDFs are Kordoc-first by default until implementation is reviewed end-to-end.
Impact: This is correct now, but will become stale if 2N-4J through 2N-4L land without a 2N-4M refresh.
Recommendation: Keep quickstart/status/README/Skill wording alignment as a 2N-4M gate before 2N-5.
Blocking: No.

## Required Fixes Before 2N-4K

None.

## Carry-forward Items for 2N-4K

- Treat 2N-4K as an approval-based evidence cycle, not ordinary implementation.
- Obtain explicit user approval before real download, install, runtime spike, tool-cache change, or external source access.
- Decide and evidence rasterizer candidates.
- Re-run Gate B or equivalent review if native dependencies are accepted.
- Keep PyMuPDF out of the product path unless a separate reviewed license decision changes that boundary.
- Pin and evidence tesseract.js, tesseract.js-core, traineddata source, hashes, cache location, and cleanup.
- Verify prep-egress logging separately from execution no-egress.
- Include contamination scans for package files, node_modules, runtime archives, raster PNG/images, intake/OCR/aux outputs, and submission.zip.
- Consider router-mediated PDF Kordoc evidence if feasible.

## Carry-forward Items for 2N-4L / 4M

2N-4L:

- Implement page-set OCR only after 2N-4K evidence.
- Preserve `selected_pages` rules for mixed, scan-only, and user-selected range cases.
- Keep OCR output in `ocr_supplement`.
- Emit final `ocr_text.json` atomically only after all selected pages complete.
- Add Node/Python `output_sha256` parity tests.
- Keep confidence as additive metadata only.
- Decide raster image artifact defense before claiming OCR implementation readiness.

2N-4M:

- Refresh quickstart matrix and user-facing docs after implementation review.
- Align README, current status, Skill docs, evidence mapping rules, intake README, and runner README with actual implemented behavior.
- Re-check no-overclaim boundaries before 2N-5 re-entry.
- Confirm baseline fallback remains clear for unavailable, declined, and failed assisted paths.

## Scope Compliance

Code changes by Codex: none.
Existing implementation docs modified by Codex: none.
`current_status.md` or `decision_log.md` modified by Codex: none.
README/quickstart/Skill modified by Codex: none.
OCR/tesseract.js/rasterizer execution: not performed.
Kordoc reinstall, npm install, portable Node download: not performed.
2N-5 black-box test: not performed.
Generated output, submission.zip, source documents, or raster PNGs: not created.

## Recommendation

Proceed to 2N-4K preparation after this review is accepted.

2N-4K should be framed as a user-approved runtime/rasterizer/tesseract evidence cycle. It should not be treated as product-path implementation until its approval, supply-chain, no-egress, license/native, artifact, and contamination evidence has been reviewed.

## Final Report

- **verdict**: PASS
- **reviewed commit**: `be74599e96ff422474dae9e11c4b5513cd174ae2`
- **changed surface**:
  - `docs/current_status.md`
  - `docs/cycle2n_4j_kordoc_aware_intake_router_skeleton_report.md`
  - `src/intake/runners/README.md`
  - `src/intake/runners/document_intake_router.cjs`
  - `tests/test_document_intake_router.test.cjs`
- **findings summary**:
  - Critical: 0
  - Major: 0
  - Minor: 0
  - Observations: 3
- **required fixes before 2N-4K**: none
- **carry-forward items for 2N-4K**: user approval, rasterizer evidence, tesseract/traineddata pin/hash/cache/prep-egress evidence, no-egress execution evidence, contamination scan, optional router-mediated PDF evidence
- **carry-forward items for 2N-4L/4M**: page-set OCR contract, atomic `ocr_text.json`, hash parity tests, artifact defense, confidence-as-metadata, quickstart/status/Skill/README refresh, no-overclaim review
- **verification performed**:
  - `git diff --check`: PASS
  - `node --test tests/test_document_intake_router.test.cjs`: 21/21 PASS
  - `node --test tests/test_hwp_assisted_runner_node.test.cjs`: 39/39 PASS
  - `node --test tests/test_portable_node_bootstrap.test.cjs`: 11/11 PASS
  - diff/status/artifact scans: expected and clean
- **scope compliance**: review-only; no code patch, no docs patch outside this review, no install/download/OCR/rasterizer/2N-5 execution, no generated artifacts
- **recommendation**: 2N-4K preparation may proceed after this review is accepted
