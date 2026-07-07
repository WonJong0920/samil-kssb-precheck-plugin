# Codex Cycle 2N-4L Minimum Page-set OCR Implementation Review

## Verdict

PASS.

Cycle 2N-4L implements a safe minimum page-set OCR path and can proceed to Cycle 2N-4M integration/documentation review. The implementation follows the Cycle 2N-4K Gate B conditions closely enough for this stage: separate approval gates, isolated OCR tool-cache, exact pin/hash fail-fast, nethook-wrapped execution, local font assets plus blank-raster guard, bounded execution, atomic `ocr_text.json`, Node/Python canonical hash parity, and existing ingest-only `ocr_supplement` integration.

This PASS does not mean OCR support complete, Kordoc-first complete, provider finalization, L2/L3 complete, 2N-5 passage, or product completion. It only means the 2N-4L implementation review passed and 2N-4M can start.

Reviewed commit:

```text
ad2e8b02b75e5463e02ff1ee278973959f1991aa
```

Base commit:

```text
906c880870294b47598b34a9011510f0fc548c63
```

## Reviewed Scope

Primary files reviewed:

- `docs/cycle2n_4l_minimum_page_set_ocr_implementation_report.md`
- `src/intake/runners/pdf_ocr_runner.cjs`
- `src/intake/runners/pdf_ocr_exec.mjs`
- `tests/test_pdf_ocr_runner.test.cjs`
- `tests/test_ocr_canonical_hash_parity.py`

Additional files reviewed:

- `src/intake/runners/README.md`
- `docs/current_status.md`
- `src/intake/runners/hwp_assisted_runner.cjs`
- `src/intake/runners/document_intake_router.cjs`
- `src/intake/dei_producer.py` indirectly through tests and targeted boundary checks

Actual changed files:

```text
docs/current_status.md
docs/cycle2n_4l_minimum_page_set_ocr_implementation_report.md
src/intake/runners/README.md
src/intake/runners/pdf_ocr_exec.mjs
src/intake/runners/pdf_ocr_runner.cjs
tests/test_ocr_canonical_hash_parity.py
tests/test_pdf_ocr_runner.test.cjs
```

This matches the reported 2N-4L surface. Core schema, validator, renderer, delivery, Skill, DEI producer, document router, HWP runner, manifest, marketplace, package files, and submission packaging were not changed.

## Implementation Boundary Review

The implementation stays inside the intended minimum page-set OCR boundary.

The new PDF OCR runner is an approval-based local assisted path, not a Skill entrypoint or plugin-core dependency. It does not change the findings schema, renderer, validator, delivery wrapper, Skill, DEI contract, Kordoc router, or HWP runner behavior. The runner consumes an existing paginated `intake.json`, derives selected pages from OCR-needed signals, and emits a standalone `ocr_text.json` for the already-reviewed ingest path.

The implementation does not claim broad OCR support. It supports a minimum PDF page-set OCR path behind explicit install/run approvals, while preserving baseline fallback for unavailable, declined, failed, mismatched, timed-out, blank-raster, or out-of-scope cases.

## Gate B Condition Review

The 2N-4K Gate B conditions are materially implemented.

- Tool-cache isolation: `ocr-runtime@tesseract.js-7.0.0` is separate from the Kordoc cache and repo root package files.
- Exact pins: package versions for `tesseract.js`, `tesseract.js-core`, `pdfjs-dist`, `@napi-rs/canvas`, and `@napi-rs/canvas-win32-x64-msvc` are hard-coded and tested.
- Native and traineddata integrity: the skia native binary hash and both traineddata hashes are verified before use.
- Fail-fast: drifted package/native/traineddata state is rejected and cleaned before run.
- Approval split: install approval and run approval are separate.
- Source disclosure: npm and `raw.githubusercontent.com/tesseract-ocr/tessdata_fast` are separately disclosed in approval text and prep logs.
- no-egress provenance: execution is launched with `--require nethook.cjs`, and `no_egress_verified=true` requires a hook summary with zero egress attempts.
- Raster guard: local `standardFontDataUrl` is fixed in the execution script and ink coverage guards blank output.
- Artifact handling: raster images remain in memory, scratch state is temporary, final artifact is written atomically, and tests check temp-file cleanup.
- OCR contract: output is compatible with existing `ocr_text` ingest and remains `ocr_supplement` only.

The design intentionally does not use `--omit=optional` for the OCR runtime because `@napi-rs/canvas` is the accepted native rasterizer condition for this path. That is acceptable because it is isolated in the OCR runtime cache and not mixed with the Kordoc RH-B2 cache.

## Selected Pages / Bounded Execution Review

Selected-page handling is conservative and source-bound.

The allowed OCR set is `pageQuality[].needsOcr` union `qualitySummary.ocrCandidatePages`. User-specified page ranges must be a subset of that allowed set. This avoids using OCR to reprocess pages that the intake layer did not mark as OCR-needed. Empty target sets exit cleanly without artifact creation, and page-cap excess exits cleanly unless explicitly raised by `--max-pages`.

The default bounds, page cap 50, batch size 5, 120s per page, and 300 DPI, are reasonable for a minimum implementation based on 2N-4K evidence. They are still synthetic-evidence defaults and should be refined after real scanned-document measurements.

## OCR Contract / Ingest Boundary Review

The emitted `ocr_text.json` follows the existing contract:

- required provenance fields are present;
- page `text_sha256` is based on actual text;
- `output_sha256` uses the same canonical rule as Python ingest;
- Node/Python golden parity is tested;
- additive fields such as confidence, DPI, languages, ink ratio, blank flag, and model file hashes do not break ingest;
- OCR text merges into `ocr_supplement` only;
- OCR text is not mixed into normal DEI blocks;
- OCR confidence is not converted into a judgment or evidence upgrade.

This preserves the Source-bound Analysis and human-review boundary. OCR output remains low-quality assisted material that a consultant must review.

## No-egress / Provenance Review

Execution uses the same nethook provenance model as the reviewed HWP/Kordoc runner family. Evidence mode fails closed when the hook summary is absent or nonzero, and run logs record false provenance honestly.

In non-evidence mode, the runner records `no_egress_verified=false` if the hook is absent or nonzero rather than pretending no-egress succeeded. This matches the existing runner family behavior. It is acceptable for this stage because 2N-5/review evidence should use `--evidence-mode`, but 2N-4M documentation should keep no-egress claims tied to actual provenance rather than broad product guarantees.

## Test Assessment

The new tests cover the important contract surfaces:

- pin/hash constants;
- selected-page derivation and user-range subset enforcement;
- missing/malformed/out-of-scope cases;
- approval gates and no-side-effect behavior;
- install command shape and separate traineddata source;
- runtime drift and hash mismatch cleanup;
- nethook command construction and evidence-mode fail-closed behavior;
- atomic `ocr_text.json` output;
- canonical hash parity;
- ingest `ocr_supplement` integration;
- no core imports;
- no repo package or `node_modules` creation.

The test suite does not perform real OCR or rasterization, which is correct for this review. The implementation report records that Claude performed a temporary, repo-external E2E evidence run; Codex did not repeat it.

## Follow-up Judgment

The three follow-ups named in the completion report are not blockers for 2N-4M.

1. Real scanned-document metrics for bounded defaults: nonblocking. The synthetic 2N-4K/4L evidence is enough to start 2N-4M, but 2N-5 or later evidence should refine cap/batch/timeout/DPI.
2. HWP runner `.cmd` spawn EINVAL possibility: nonblocking for 2N-4L. The new OCR runner uses `npm-cli.js` directly, while the existing HWP runner was not changed. If real HWP install testing exposes the same issue, it should be handled as a narrow HWP runner patch or 2N-5 finding.
3. `needsOcr` unmarked text-empty pages: nonblocking. The conservative rule protects against OCR overreach. Real sample testing can decide whether additional Kordoc text-empty signals should be normalized upstream.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

ID: C2N4L-OBS-01
Severity: Observation
Location: `src/intake/runners/pdf_ocr_runner.cjs`
Issue: Bounded execution defaults are still based on synthetic and limited evidence.
Impact: Large or poor-quality real scans may need different timeout, batch, cap, or DPI defaults.
Recommendation: Capture real scanned-document timing and memory observations during 2N-5 or a dedicated evidence cycle before treating the defaults as stable.
Blocking: No.

ID: C2N4L-OBS-02
Severity: Observation
Location: existing `hwp_assisted_runner.cjs` install path
Issue: The OCR runner avoids Windows `.cmd` spawn ambiguity by invoking `npm-cli.js` through Node, but the older HWP runner install path still uses the prior npm executable style.
Impact: Not a 2N-4L regression, but a real HWP install in a future black-box test could surface a parallel Windows spawn issue.
Recommendation: Track this as a possible narrow HWP runner follow-up if 2N-5 or user evidence reproduces it.
Blocking: No.

ID: C2N4L-OBS-03
Severity: Observation
Location: selected-page signal source
Issue: The runner does not infer OCR for pages that are text-empty but not marked by `needsOcr` or `ocrCandidatePages`.
Impact: This avoids OCR overreach, but depends on upstream Kordoc intake emitting the right page-quality signal.
Recommendation: Use 2N-5 sample evidence to decide whether upstream signal normalization is needed.
Blocking: No.

ID: C2N4L-OBS-04
Severity: Observation
Location: 2N-4M documentation
Issue: User-facing docs must now distinguish "core does not auto-run OCR" from "approval-based local assisted OCR path exists."
Impact: Without 2N-4M wording refresh, docs can become stale or understate/overstate current behavior.
Recommendation: Treat quickstart, README, Skill/evidence wording, current status, runner README, and no-overclaim alignment as the next integration gate.
Blocking: No for 2N-4M start; required before 2N-5 re-entry.

## Verification Performed

Commands run:

```text
git diff --check
git diff --name-status 906c880870294b47598b34a9011510f0fc548c63..ad2e8b02b75e5463e02ff1ee278973959f1991aa
node --test tests/test_pdf_ocr_runner.test.cjs
python tests/test_ocr_canonical_hash_parity.py
node --test tests/test_document_intake_router.test.cjs
node --test tests/test_hwp_assisted_runner_node.test.cjs
node --test tests/test_portable_node_bootstrap.test.cjs
python tests/test_intake_dei_producer.py
python tests/test_hwp_assisted_runner.py
python tests/test_nethook.py
repository contamination scan for package files, node_modules, traineddata, PNG, zip, exe/native binaries, generated intake/OCR/aux artifacts, and submission.zip
```

Results:

- `git diff --check`: PASS.
- `tests/test_pdf_ocr_runner.test.cjs`: 29/29 PASS.
- `tests/test_ocr_canonical_hash_parity.py`: 11/11 PASS, using the real Python executable under `<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe` after bare `python` failed because of the WindowsApps stub.
- `tests/test_document_intake_router.test.cjs`: 21/21 PASS.
- `tests/test_hwp_assisted_runner_node.test.cjs`: 39/39 PASS.
- `tests/test_portable_node_bootstrap.test.cjs`: 11/11 PASS.
- `tests/test_intake_dei_producer.py`: 83/83 PASS.
- `tests/test_hwp_assisted_runner.py`: 49/49 PASS.
- `tests/test_nethook.py`: 29/29 PASS.
- Repo contamination scan: no forbidden package/runtime/generated artifacts found.

Codex did not run real OCR, real rasterization, npm install, Kordoc reinstall, portable runtime download, 2N-5, or submission packaging during this review.

## Required Fixes Before 2N-4M

None.

## Required Fixes Before 2N-5

Before 2N-5 re-entry, 2N-4M should update and review user-facing integration docs:

- quickstart matrix for text PDF, scan PDF, mixed PDF, HWP/HWPX/DOCX, and unsupported files;
- README and runner README wording for approval-based local OCR;
- Skill and evidence rules where OCR-derived material is discussed;
- no-overclaim language around OCR support, L2/L3 completeness, provider finalization, and human review;
- baseline fallback wording for unavailable, declined, failed, blank, timeout, mismatch, or no-target cases.

## Scope Compliance

Code modifications by Codex: none.
Existing implementation/status/report documents modified by Codex: none.
Schema/validator/renderer/delivery/Skill/manifest changes by Codex: none.
Downloads/installs/OCR/rasterizer execution by Codex: none.
Generated artifacts committed by Codex: none.

Only this review document is intended for commit.

## Recommendation

Proceed to Cycle 2N-4M integration/documentation review.

2N-4M should not implement new OCR functionality. It should align user-facing documentation with the reviewed implementation, verify no-overclaim boundaries, and define the 2N-5 re-entry expectations.

## Final Report

- **verdict**: PASS
- **reviewed commit**: `ad2e8b02b75e5463e02ff1ee278973959f1991aa`
- **implementation readiness judgment**: minimum page-set OCR implementation is acceptable for 2N-4M integration/documentation review
- **findings summary**:
  - Critical: 0
  - Major: 0
  - Minor: 0
  - Observations: 4
- **required fixes before 2N-4M**: none
- **required fixes before 2N-5**: 2N-4M user-facing documentation/no-overclaim refresh and review
- **major carry-forward items**:
  - real scanned-document timing/memory/default refinement;
  - possible HWP runner npm spawn follow-up if reproduced;
  - upstream `needsOcr` signal normalization evidence;
  - quickstart/README/Skill/evidence wording alignment;
  - 2N-5 black-box scenarios for unavailable, declined, failed, blank, timeout, mismatch, scan-only, mixed, and baseline fallback cases
- **verification performed**: diff checks, changed-file scope check, new Node OCR tests, Python hash/ingest tests, related router/HWP/bootstrap/nethook regressions, contamination scans
- **scope compliance**: review-only; no code patch, no real OCR/rasterizer execution, no install/download, no generated artifacts, no product-complete or OCR-complete claim
- **recommendation**: start 2N-4M integration/documentation review
