# Codex Cycle 2N-4B HWP-family Ingest Contract Review

## Verdict

**PASS with nonblocking follow-up**

Cycle 2N-4B safely extends the existing DEI ingest boundary for observed Kordoc HWP/HWPX/DOCX artifacts without weakening the existing PDF paginated path. The implementation uses an explicit document-level variant only for `fileType in {"hwp", "hwpx", "docx"}` when both `pageQuality` and `qualitySummary` are absent, keeps missing page/quality signals explicit rather than synthesized, rejects unsupported `ocr_text` merge for document-level artifacts, and prevents inline image base64 from entering DEI.

No required fix blocks Cycle 2N-5. The next black-box test should specifically check that user-facing reports do not fabricate page coordinates, do not interpret `needs_ocr=false` as a quality guarantee when `quality_signal="not_reported"`, and do not expose provider artifacts or image/base64 data.

## Reviewed scope

- Target HEAD after `git pull origin main`: `90ac740a16ff1c182dc3a0e4473f132f63b03708`
- Base reviewed: `fe2b081d0ed9f5f51315b6e7b1e1c13d1c0403e4`
- Actual changed files:
  - `docs/current_status.md`
  - `docs/decision_log.md`
  - `docs/planning/cycle2n_4b_hwp_family_ingest_contract_decision.md`
  - `src/intake/README.md`
  - `src/intake/dei_producer.py`
  - `src/intake/runners/README.md`
  - `tests/test_intake_dei_producer.py`

The actual diff matches the reported scope. No schema, validator, renderer, delivery, Skill, manifest, marketplace, runner implementation, nethook, package, lock, or `.gitignore` file changed in this patch.

Primary files read:

- `docs/planning/cycle2n_4b_hwp_family_ingest_contract_decision.md`
- `docs/planning/cycle2n_4_hwp_first_assisted_retest_report.md`
- `docs/reviews/codex_cycle2n_3b_nethook_coverage_patch_review.md`
- `docs/planning/cycle2n_1a_hwp_first_scope_decision.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/README.md`
- `src/intake/dei_producer.py`
- `src/intake/runners/README.md`
- `tests/test_intake_dei_producer.py`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`

## Contract assessment

The contract extension is placed at the correct layer: `dei_producer.py`, not the runner. That preserves the Kordoc artifact as provider output and avoids fabricating PDF-shaped fields in the runner.

The document-level branch is narrow and deterministic:

- `is_document_level_intake()` requires a dict, an observed HWP-family `fileType`, and absence of both `pageQuality` and `qualitySummary`.
- Non-HWP-family artifacts, including malformed PDFs, remain on the existing paginated contract and still fail fast when `pageQuality` / `qualitySummary` are missing.
- HWP-family artifacts that later include `pageQuality` are routed to the stricter paginated path, which is a safe failure mode rather than silent weakening.

The document-level validator rejects malformed or evidence-empty artifacts:

- `success` must be exactly true.
- `metadata` must be an object.
- `blocks` must be a non-empty list.
- At least one block must contain nonblank text or a table.
- `outline` / `warnings`, if present, must remain lists.

That is sufficient for the observed Kordoc HWP/HWPX/DOCX artifacts and does not turn arbitrary malformed input into an empty DEI.

## Source-bound / fail-fast / no-overclaim assessment

The patch keeps source-bound behavior:

- Missing page-quality signals are not synthesized. They are represented as `doc_quality.pagination="document_level"`, `page_count_basis`, and `quality_signal="not_reported"`.
- DOCX `pageCount` absence becomes `page_count=0` plus `page_count_basis="not_reported"` rather than a guessed page count.
- `p.<n>` is intentionally avoided for document-level location hints. The producer uses `doc-level` or `doc-level · <section>` from heading order.
- Provider raw `pageNumber` is preserved only as the raw `page` field and is not used as a human-facing page coordinate.
- `ocr_text` merge is explicitly rejected for document-level intake because there is no `needsOcr` page signal to align against.
- Inline image data and top-level image base64 are excluded from DEI; image blocks carry only filename text.

Fail-fast behavior is preserved:

- `fileType="pdf"` with missing `pageQuality` still fails.
- missing `fileType` with missing `pageQuality` still fails.
- empty blocks, `success=false`, missing metadata, contentless blocks, and HWP-family artifacts with present-but-empty `pageQuality` all fail.

No overclaim was found in current-facing docs. The status and decision log keep the extension as a reviewed-pending ingest contract change and do not claim full L2 completion, OCR support, provider finalization, L3 implementation, audit assurance, certification, or compliance conclusion.

## PDF path regression assessment

Static review and tests support the claim that the PDF paginated path is unaffected:

- `build_dei_candidate()` returns to the new branch only when `is_document_level_intake()` is true.
- Otherwise it executes the existing `_validate_intake_contract()` paginated path.
- Tests assert that paginated output does not receive document-level additive keys.
- Tests assert that PDF-shaped malformed input still fails on missing `pageQuality`.

I could not re-run the Python tests in this Codex session due local Python execution failure, but the code path separation is clear and the target tests cover the relevant regression.

## HWP/HWPX/DOCX document-level assessment

The document-level handling is appropriate for the observed Kordoc HWP-family output shape:

- HWP/HWPX provider-reported `pageCount=1` is retained as provider-reported, while the docs warn it is not a physical page count.
- DOCX missing page count is recorded as not reported, not guessed.
- Heading order is used to form section hints without pretending there are physical page coordinates.
- Block extraction quality is conservatively capped at `medium` because page-quality signal is unavailable.
- `page_quality_signal_unavailable` becomes a review hint, not a judgment.
- Aux signals still merge only as `aux_structure` and gap/review hints, preserving the 2L-4B boundary.

The remaining risk is interpretive rather than structural: existing Skill/evidence rules still emphasize `p.<n> · <section>` for confirmed/partial anchors. Because findings `page_or_section` is a free text field and the new DEI hint is explicit, this does not block 2N-5, but 2N-5 should verify report wording and a later documentation polish should align the Skill/evidence rules with `doc-level` hints if HWP-family output is accepted.

## Test assessment

Tests added or strengthened in `tests/test_intake_dei_producer.py` cover the important contract edges:

- HWP document-level acceptance and `DEI_VERSION` stability.
- PDF paginated path unchanged.
- provider-reported vs not-reported page count basis.
- no `p.<n>` document-level hint.
- heading-order section tracking.
- base64 image data exclusion.
- conservative extraction quality.
- `page_quality_signal_unavailable` hint.
- judgment-key absence.
- malformed HWP-family cases.
- `ocr_text` rejection for document-level intake.
- aux merge and determinism.

Executed in this Codex review:

- `git pull origin main`: already up to date.
- `git rev-parse HEAD`: `90ac740a16ff1c182dc3a0e4473f132f63b03708`.
- `git diff --name-only fe2b081d0ed9f5f51315b6e7b1e1c13d1c0403e4..HEAD`: matches reported files.
- `git diff --stat fe2b081d0ed9f5f51315b6e7b1e1c13d1c0403e4..HEAD`: 7 files, 604 insertions, 20 deletions.
- `git diff --check`: pass.
- `git status --short --branch`: clean before review doc creation.
- `node -v`: `v24.16.0`.
- Scope/artifact scans found no committed root package files, lock files, `node_modules`, generated intake/OCR/aux artifacts, submission archive, `.mcp.json`, or `.app.json`.
- Targeted stale/overclaim search found only gated, historical, policy, or test-fixture contexts.

Attempted but not executed successfully in this Codex review:

- `python tests/test_intake_dei_producer.py`
- `python tests/test_aux_structure_scanner.py`
- `python tests/test_nethook.py`

Reason: `python.exe` and `py.exe` resolve to inaccessible WindowsApps stubs in this session, and no alternate Python install was found under the checked common locations. No Python installation or environment modification was performed.

The 2N-4B completion document reports local standalone test success for intake 83/83 plus aux, runner, nethook, validator, renderer, and delivery regressions. This review could not independently execute those Python tests, so 2N-5 should retain a Python regression run as a practical preflight.

## Findings

### Critical

None.

### Major

None.

### Minor

**ID:** C2N4B-MIN-01

**Severity:** Minor

**Location:** `src/skills/samil-kssb-precheck/evidence_mapping_rules.md:57`, `src/intake/dei_producer.py:184`, `src/intake/dei_producer.py:449`

**Issue:** The new document-level DEI path intentionally emits `doc-level` / `doc-level · <section>` location hints, but the existing Skill evidence rule for readable anchors still names the `p.<n> · <section>` convention.

**Impact:** The schema allows free text, and the producer avoids false page coordinates, so this is not a contract blocker. However, 2N-5 black-box output should verify that reports do not fabricate page numbers and that users can understand document-level locations.

**Recommendation:** During or after 2N-5, align Skill/evidence guidance to explicitly permit `doc-level · <section>` for non-paginated HWP/HWPX/DOCX intake while keeping bbox and unavailable-page hints out of `evidence_anchor`.

**Blocking:** No before 2N-5.

### Observations

**ID:** C2N4B-OBS-01

**Severity:** Observation

**Location:** review environment

**Issue:** Python regression tests could not be executed in this Codex session because Python resolves to inaccessible WindowsApps stubs.

**Impact:** Static/code review supports the PASS verdict, but executable regression evidence should remain part of 2N-5 preflight in an environment with working Python.

**Recommendation:** Re-run the standalone Python regression set before or during 2N-5 and record the command used.

**Blocking:** No for this review; yes for practical 2N-5 evidence if no Python runtime is available.

**ID:** C2N4B-OBS-02

**Severity:** Observation

**Location:** `src/intake/dei_producer.py:465`, `src/intake/dei_producer.py:471`

**Issue:** The document-level path keeps `needs_ocr=false` while also marking `quality_signal="not_reported"` and emitting a `page_quality_signal_unavailable` hint.

**Impact:** This preserves the existing boolean contract and avoids guessing OCR needs, but user-facing reports must not read `needs_ocr=false` as "OCR was unnecessary" for HWP-family artifacts.

**Recommendation:** In 2N-5, inspect the generated user-facing limitations/questions for HWP/HWPX/DOCX cases and confirm page-quality absence is disclosed.

**Blocking:** No before 2N-5.

## Required fixes before 2N-5

None.

## Additional verification requests

Additional verification request:

- **ID:** C2N4B-AVR-01
- **Timing:** before or during 2N-5
- **What to check:** Run `python tests/test_intake_dei_producer.py`, `python tests/test_aux_structure_scanner.py`, `python tests/test_hwp_assisted_runner.py`, `python tests/test_nethook.py`, `python tests/test_findings_validator.py`, `python tests/smoke_test_renderer.py`, and `python tests/test_delivery_wiring.py` in the working project environment.
- **Why it matters:** This Codex session could not execute Python, and 2N-5 should not rely only on static review.
- **Blocks 2N-5?:** No for entering 2N-5 planning/execution, but yes before treating 2N-5 evidence as complete.

Additional verification request:

- **ID:** C2N4B-AVR-02
- **Timing:** during 2N-5 black-box output review
- **What to check:** Confirm HWP/HWPX/DOCX outputs use `doc-level` / section hints or equivalent non-page wording and do not fabricate `p.<n>` coordinates.
- **Why it matters:** Source-bound location wording is the main user-facing risk of non-paginated intake.
- **Blocks 2N-5?:** No; this is a core target of the 2N-5 black-box test.

Additional verification request:

- **ID:** C2N4B-AVR-03
- **Timing:** during 2N-5 black-box output review
- **What to check:** Confirm `quality_signal="not_reported"` and `page_quality_signal_unavailable` lead to coverage limitations, missing info, or customer questions as appropriate, not to an "OCR not needed" overclaim.
- **Why it matters:** `needs_ocr=false` is a contract compatibility value, not a quality guarantee.
- **Blocks 2N-5?:** No; verify as part of 2N-5.

Additional verification request:

- **ID:** C2N4B-AVR-04
- **Timing:** during 2N-5 artifact handling
- **What to check:** Confirm generated out-dir `images/`, inline image/base64 source artifacts, and intake JSON remain repo-external and are not copied into findings, reports, logs, or commits.
- **Why it matters:** Kordoc HWP-family artifacts include image material with original-document sensitivity.
- **Blocks 2N-5?:** No; required for accepting 2N-5 artifact safety evidence.

Additional verification request:

- **ID:** C2N4B-AVR-05
- **Timing:** during 2N-5 black-box output review
- **What to check:** Confirm PDF sample behavior still follows the paginated path and does not receive `pagination`, `page_count_basis`, or `quality_signal` document-level fields.
- **Why it matters:** 2N-4B must not regress the existing PDF baseline.
- **Blocks 2N-5?:** No; verify as part of 2N-5.

## Recommendation for next step

Proceed to **Cycle 2N-5 black-box test** using the HWP-family document-level ingest contract, with the verification requests above included in the test evidence review. Do not claim L2 full completion, OCR support, provider finalization, or L3 implementation from this PASS; the reviewed surface is the document-level ingest contract extension only.
