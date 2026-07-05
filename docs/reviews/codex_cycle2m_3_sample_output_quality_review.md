# Codex Cycle 2M-3 Sample Output Quality Review

## Verdict

**PASS with nonblocking follow-up**

Claude deep quality review can proceed using the generated Track A artifacts in `<LOCAL_SAMPLE_OUTPUT_DIR>`. The current plugin boundary produced DOCX/HTML/Markdown reports for all 8 discovered sample files, with validator error 0 and DOCX XML parse success for all authoritative UTF-8 rerun outputs.

Track B was not executed because Kordoc/tesseract.js were not available without installation, and no user-approved installation was performed. This is not treated as a Cycle 2M-3 blocker because the user explicitly separated runner design/implementation into Cycle 2N. It is, however, required before any black-box test that expects OCR/HWP assisted behavior.

## Provider Availability / Approval Status

- Kordoc: not found on PATH and not resolvable from the current Node module resolution without installation.
- tesseract.js: not found on PATH and not resolvable from the current Node module resolution without installation.
- native `tesseract`: not found on PATH.
- Node/npm: present (`node v24.16.0`, `npm 11.13.0`), but no usable Kordoc/tesseract.js installation was found.
- User-approved install performed: **No**.
- Track B status: **blocked - provider unavailable / no install approval**.
- No repo `package.json`, lockfile, provider dependency, runner, MCP, raw OCR artifact, original sample, or generated report was committed.

## Sample Discovery Table

Sample folder discovery was dynamic. No file count or file name was hard-coded.

| # | File | Format | Pages | Extracted chars | Zero-text pages | Track A result | Assisted path need |
|---:|---|---|---:|---:|---:|---|---|
| 1 | 2021년도 한국동서발전 경영실적보고서.pdf | PDF | 359 | 383,319 | 35 | baseline text available | Mixed PDF zero-text pages need OCR for complete coverage |
| 2 | 2024_SMReport_KR.pdf | PDF | 126 | 161,301 | 1 | baseline text available | Mixed PDF zero-text page needs OCR for complete coverage |
| 3 | gate-D smaple.ver2.pdf | PDF | 9 | 0 | 9 | out-of-band required | scanned/image-only PDF needs OCR |
| 4 | HFG_ESG_KSSB_Report_KOR_2024.pdf | PDF | 53 | 62,401 | 1 | baseline text available | Mixed PDF zero-text page needs OCR for complete coverage |
| 5 | smaple.docx.docx | DOCX | 1 | 9,245 | 0 | baseline text available | not required for baseline smoke; aux_structure generated |
| 6 | smaple.hwp.hwp | HWP | 0 | 0 | 0 | unsupported | Kordoc or equivalent HWP v5 provider needed |
| 7 | smaple.hwpx.hwpx | HWPX | 1 | 14,128 | 0 | baseline text available | not required for baseline smoke; aux_structure generated |
| 8 | smaple.textrater.pdf | PDF | 11 | 12,847 | 0 | baseline text available | not required for baseline smoke |

## Track A Baseline Execution Result

Track A measured the current plugin boundary without plugin-side OCR:

- Sample files discovered: **8**
- Baseline text available: **6**
- Track A out-of-band required: **1** (`gate-D smaple.ver2.pdf`, scanned/image-only)
- Track A unsupported: **1** (`smaple.hwp.hwp`, HWP v5)
- Assisted path needed for full coverage: **5** files
- Reports generated from conservative findings: **8/8**
- DOCX XML parse success: **8/8**
- Validator error files: **0/8**

The generated findings are deliberately conservative. For text-readable files, quotes were selected from extracted text and mapped as partial evidence only. For scanned/unsupported files, the reports use `not_verifiable` with `missing_info` and `customer_questions`, which is the expected baseline behavior.

## Track B User-approved Assisted Execution Result

Track B was not run:

- Kordoc/tesseract.js were not available without installation.
- No install approval was requested or performed during this review.
- No provider command was executed for OCR/document conversion.
- No OCR text, provider cache, model, node_modules, package/lock, or runner artifact was added to the repo.

This review collected evidence that Track B is needed, but did not implement or design the Track B runner. Runner design/implementation is deferred to Cycle 2N.

## Generated Artifacts for Claude Review

Primary generated artifacts are outside the repo at `<LOCAL_SAMPLE_OUTPUT_DIR>`:

- `baseline_measurement_manifest.md/json`
- `report_generation_results_utf8.md/json`
- `quote_verification_utf8.json`
- `assisted_path_evidence.md`
- `README_FOR_CLAUDE.md`
- Per-file `*_utf8/` directories containing:
  - `findings.json`
  - `validator_issues.json`
  - `delivery_user_summary.txt`
  - `delivery_internal.json`
  - generated DOCX/HTML/Markdown reports under `reports/`

Note: a first transient generation attempt through PowerShell stdin produced non-UTF8 Korean labels and was superseded. The authoritative generated reports are the `_utf8` directories and `report_generation_results_utf8.*`.

## Deep Technical Output Quality Review

- Findings schema compatibility: authoritative UTF-8 rerun passed validator preflight with error 0 for all 8 files.
- Renderer/delivery operation: DOCX/HTML/Markdown were generated for all 8 files.
- DOCX compatibility: `word/document.xml` parsed for all 8 DOCX files.
- Fallback contract: HTML and Markdown were also generated for all files; primary was DOCX.
- Output path safety: user-facing summaries show filenames/display paths, while internal absolute output paths remain in internal JSON only.
- Source-bound behavior: readable quotes were selected from extracted text; scanned/unsupported files did not fabricate quotes.
- OCR boundary: no OCR provider was run; OCR-required files are marked as assisted-path needed or out-of-band required.
- Product boundary: generated findings retain consultant-draft and non-audit/non-certification/non-compliance-finalization disclaimers.

Quote verification on authoritative UTF-8 outputs:

- 20 evidence anchors total.
- 19 anchors were verified in extracted text.
- 1 short HFG anchor, `"(1) 온실가스 배출에 대한 조직경계"`, did not match the normalized extracted-text check and should be inspected by Claude/human review before treating it as an accepted quote.

## Per-file Quality Findings

| File | Report | Validator | Anchors | Quality finding |
|---|---|---|---:|---|
| 2021년도 한국동서발전 경영실적보고서.pdf | generated | E0/W0/I1 | 4 | Baseline text exists, but 35 zero-text pages mean Track A is incomplete for page coverage. |
| 2024_SMReport_KR.pdf | generated | E0/W0/I1 | 4 | Baseline text exists; one zero-text page needs assisted follow-up for complete coverage. |
| gate-D smaple.ver2.pdf | generated | E0/W0/I1 | 0 | Correctly routed as scanned/image-only; Track A cannot analyze content without OCR. |
| HFG_ESG_KSSB_Report_KOR_2024.pdf | generated | E0/W0/I1 | 4 | One anchor needs manual quote verification due normalization mismatch; one zero-text page needs assisted follow-up. |
| smaple.docx.docx | generated | E0/W0/I1 | 2 | Baseline text path works; aux_structure generated successfully. |
| smaple.hwp.hwp | generated | E0/W0/I1 | 0 | HWP v5 unsupported in Track A; Kordoc/equivalent provider needed. |
| smaple.hwpx.hwpx | generated | E0/W0/I1 | 2 | Baseline HWPX text path works; aux_structure generated successfully. |
| smaple.textrater.pdf | generated | E0/W0/I1 | 4 | Text-layer PDF path works; no assisted path needed for baseline smoke. |

## Validator / Renderer / Delivery Results

Repo regression checks:

- `git diff --check`: PASS
- `python tests/test_findings_validator.py`: PASS, 26/26
- `python tests/smoke_test_renderer.py`: PASS, 22/22
- `python tests/test_delivery_wiring.py`: PASS, 33/33
- `python tests/test_intake_dei_producer.py`: PASS, 56/56
- `python tests/test_aux_structure_scanner.py`: PASS, 26/26

Generated sample outputs:

- Reports attempted: 8
- Reports generated: 8
- Validator error files: 0
- DOCX XML parse success: 8
- Track B processed: 0
- Per-file validator info: one `schema.optional_skipped` info per file because `jsonschema` was not installed; no dependency was installed.

## Preflight Error Classification

- A. findings 구성 결함: none in authoritative UTF-8 rerun.
- B. 원문 인용 유래 금지표현 오탐 가능성: none observed.
- C. 로컬 경로 노출: none observed in user-facing summaries.
- D. 실제 금지표현 또는 경계 위반: none observed.
- E. unsupported/out-of-band 경로를 제대로 표시한 정상 차단: observed for scanned PDF, mixed zero-text PDF pages, and HWP v5.
- F. provider 설치/승인/실행 경로 문제: Track B blocked because provider unavailable and no install approval.
- G. 기타: non-authoritative first run had PowerShell stdin encoding corruption; superseded by UTF-8 rerun.

## Unsupported / Out-of-band Required Files

Assisted path evidence collected:

- `gate-D smaple.ver2.pdf`: 9 pages, 0 extracted chars, 9 zero-text pages. Requires OCR such as tesseract.js for usable text.
- `smaple.hwp.hwp`: unsupported by Track A baseline extraction. Requires Kordoc or equivalent HWP v5 provider.
- `2021년도 한국동서발전 경영실적보고서.pdf`: baseline text exists, but 35 pages have no extractable text.
- `2024_SMReport_KR.pdf`: baseline text exists, but 1 page has no extractable text.
- `HFG_ESG_KSSB_Report_KOR_2024.pdf`: baseline text exists, but 1 page has no extractable text.

## Track A vs Track B Comparison

Track A is sufficient to prove the current plugin boundary can accept conservative findings, run detect-only validation, render DOCX/HTML/Markdown, and avoid fabricating OCR content.

Track A is not sufficient to prove full document intake quality for scanned PDFs, HWP v5, or mixed PDFs with zero-text pages. Track B is needed to test user-approved local provider assisted behavior, but that path remained blocked in this review because providers were unavailable without installation.

## Cross-sample Quality Risks

- The current sample output generation demonstrates technical pipeline viability, not full consultant-grade KSSB analysis depth.
- Mixed PDFs can look "processed" in Track A while still hiding zero-text pages; output quality review must flag incomplete page coverage.
- HWP v5 remains unsupported without Kordoc/equivalent assisted path.
- OCR-derived evidence must remain low-confidence and cannot be used alone to promote `confirmed`.
- Quote verification should be part of Claude/human deep review, especially for short headings or normalized PDF extraction fragments.
- Generated output folders contain internal JSON with absolute paths as internal/debug material; repo review documents must use `<LOCAL_SAMPLE_OUTPUT_DIR>`.

## Recommended Fixes Before Claude Deep Review, If Any

No required code or repo fix before Claude deep quality review.

Claude should use only the authoritative UTF-8 artifacts and inspect the single HFG quote-verification mismatch before drawing quality conclusions from that anchor.

## Recommended Fixes Before Black-box User Test

- Cycle 2N should define the user-approved local assisted path without claiming built-in OCR support.
- Confirm provider installation/availability policy and provenance capture before OCR/HWP black-box scenarios.
- Re-run the 5 assisted-needed files once Kordoc/tesseract.js are available under user approval.
- Keep Track B outputs clearly labeled as user-approved local provider assisted outputs, not plugin built-in OCR.

## Recommended Next Step

Proceed to Claude deep quality review using `<LOCAL_SAMPLE_OUTPUT_DIR>` artifacts. In parallel or next, start Cycle 2N planning for the user-approved local provider assisted runner boundary, keeping provider execution, runner integration, and provider finalization outside the current plugin core until separately reviewed.
