# Codex Cycle 2N-6 Phase 2 N4 Review — Node DOCX Writer

## Review Overview

- Role: Codex independent reviewer.
- Review scope: Phase 2 N4 Node DOCX writer / renderer integration only.
- Base commit: `792cd4826e8824ec365b874294eeb71dc289daaf`
- Target commit: `6ba4bc7da5c27ce01b2a4f7b7f94458bad41fa84`
- Target commit message: `feat: port docx writer to node with deterministic ooxml and content parity`

This review does not evaluate or approve N5 aux-scanner migration, hook/stage/config proposals, Phase 3 quality changes, product completion, OCR support completion, provider finalization, or overall 2N-5 completion.

## Verdict

**PASS**

The N4 change is properly scoped to the Node DOCX writer and delivery integration. It preserves the Python renderer/delivery references, provides sufficient DOCX structure/content parity against the Python reference, verifies deterministic ZIP/OOXML output and XML/ZIP safety, keeps D94 hard-stop artifact blocking intact for DOCX/HTML/Markdown, and leaves N1/N2/N3 boundaries green.

## Readiness

- Next step entry: **Ready**
- Required fixes before next step: **None**
- Phase 2 core Node migration closure: **N1~N4 can be treated as closed for the core path reviewed here**: Node validator, Node delivery/HTML/Markdown, Node DEI producer, and Node DOCX writer are implemented and reviewed. This does not decide N5, Phase 3, product completion, OCR completion, provider finalization, or submission readiness.

## Actual Changed Files

Diff range checked:

`792cd4826e8824ec365b874294eeb71dc289daaf..6ba4bc7da5c27ce01b2a4f7b7f94458bad41fa84`

Changed files:

- `docs/current_status.md`
- `docs/cycle2n_6_phase2_n4_docx_writer_node_completion_report.md`
- `docs/workflow_usage.md`
- `src/renderers/README.md`
- `src/renderers/kssb_report_delivery.cjs`
- `src/renderers/kssb_report_renderer.cjs`
- `tests/test_delivery_node.test.cjs`
- `tests/test_delivery_node_parity.test.cjs`
- `tests/test_docx_writer_node.test.cjs`
- `tests/test_docx_writer_node_parity.test.cjs`

The diff did not include Python renderer/delivery references, validators, Node/Python DEI producer, aux scanner, Skill docs, schema, manifest, marketplace, package files, runtime files, sample source files, generated report artifacts, or submission packages.

## Source-of-truth Reviewed

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/chatgpt_coordination_workflow.md`
- `docs/current_status.md`
- `docs/planning/post_2n5_final_remediation_plan_node_only.md`
- `docs/reviews/codex_cycle2n_6_phase2_n3_dei_producer_node_review.md`
- `docs/cycle2n_6_phase2_n4_docx_writer_node_completion_report.md`

## Additional Files Inspected

- `src/renderers/kssb_report_renderer.cjs`
- `src/renderers/kssb_report_delivery.cjs`
- `src/renderers/kssb_report_renderer.py`
- `src/renderers/kssb_report_delivery.py`
- `src/renderers/README.md`
- `docs/workflow_usage.md`
- `tests/test_docx_writer_node.test.cjs`
- `tests/test_docx_writer_node_parity.test.cjs`
- `tests/test_delivery_node.test.cjs`
- `tests/test_delivery_node_parity.test.cjs`
- related N1/N2/N3 and intake/runner regression surfaces listed below.

## Commands / Tests Executed

### Git / Diff Checks

- `git status --short --branch`
  - Result: clean `main...origin/main`
- `git rev-parse HEAD`
  - Result: `6ba4bc7da5c27ce01b2a4f7b7f94458bad41fa84`
- `git log --oneline -8`
  - Result: target commit is current HEAD.
- `git diff --check 792cd4826e8824ec365b874294eeb71dc289daaf..6ba4bc7da5c27ce01b2a4f7b7f94458bad41fa84`
  - Result: pass
- `git diff --name-only 792cd4826e8824ec365b874294eeb71dc289daaf..6ba4bc7da5c27ce01b2a4f7b7f94458bad41fa84`
  - Result: changed files match the reported N4 surface.
- Final pre-review `git diff --check`
  - Result: pass.

### N4 DOCX / Delivery Tests

- `node --test tests/test_docx_writer_node.test.cjs`
  - Result: 17/17 pass, 0 skipped.
- `node --test tests/test_docx_writer_node_parity.test.cjs`
  - Result: 7/7 pass, 0 skipped. Python reference was detected and used.
- `node --test tests/test_delivery_node.test.cjs`
  - Result: 19/19 pass.
- `node --test tests/test_delivery_node_parity.test.cjs`
  - Result: 6/6 pass, 0 skipped.

### N1 / N2 / N3 Regression

- `node --test tests/test_findings_validator_node.test.cjs`
  - Result: 43/43 pass.
- `node --test tests/test_findings_validator_parity.test.cjs`
  - Result: 35/35 pass, 0 skipped.
- `node --test tests/test_intake_dei_producer_node.test.cjs`
  - Result: 61/61 pass.
- `node --test tests/test_intake_dei_producer_parity.test.cjs`
  - Result: 46/46 pass, 0 skipped.
- Absolute Python 3.14 with UTF-8 env, `tests/test_findings_validator.py`
  - Result: 30/30 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/test_delivery_wiring.py`
  - Result: 34/34 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/smoke_test_renderer.py`
  - Result: 22/22 pass.

### Intake / OCR / Aux / Runner Regression

- Absolute Python 3.14 with UTF-8 env, `tests/test_intake_dei_producer.py`
  - Result: 83/83 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/test_ocr_canonical_hash_parity.py`
  - Result: 11/11 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/test_aux_structure_scanner.py`
  - Result: 26/26 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/test_nethook.py`
  - Result: 29/29 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/test_hwp_assisted_runner.py`
  - Result: 49/49 pass.
- `node --test tests/test_document_intake_router.test.cjs`
  - Result: 21/21 pass.
- `node --test tests/test_hwp_assisted_runner_node.test.cjs`
  - Result: 39/39 pass.
- `node --test tests/test_pdf_ocr_runner.test.cjs`
  - Result: 29/29 pass.
- `node --test tests/test_toolcache_write_failure.test.cjs`
  - Result: 8/8 pass.
- `node --test tests/test_portable_node_bootstrap.test.cjs`
  - Result: 11/11 pass.

### Independent DOCX ZIP/XML Probe

Generated one temporary DOCX from `R.docxBytes()` outside the repo and validated it with Python `zipfile` and `xml.etree.ElementTree`.

- Result: `zip_testzip=None xml_parts_ok entries=8`
- The temporary file was deleted after verification.

### Contamination / Overclaim Scans

Scanned for:

- `node_modules`
- `package.json`
- `package-lock.json`
- generated `*.intake.json`, `*.ocr_text.json`, `*.dei_candidate.json`, `*.findings.json`, `*.aux_signals.json`
- generated `*_KSSB_공시근거_사전검토보고서.{docx,html,md}`
- `submission.zip`
- runtime archives/installers/executables
- traineddata files
- repo-local tool-cache directories
- sample source artifacts

Result: no repo contamination found.

Searched N4 changed surfaces for overclaim phrases. Hits were only boundary/negation contexts or test-token scan lists. No user-facing product completion, OCR completion, L2/L3 completion, provider finalization, or 2N-5 pass claim was introduced.

## Tests Not Executed

- Word GUI/manual opening was not performed. Reason: GUI manual verification is outside the local automated review environment. This does not block the verdict because the Node DOCX parts are byte-identical to the known Python reference after decompression, the ZIP is valid under Python `zipfile.testzip()`, and all XML parts parse successfully.
- Real sample document execution, OCR execution, Kordoc reinstall, npm install, portable runtime download, generated report commit, and submission package generation were not executed because they are outside N4 review scope.

## N4 Scope Compliance

**PASS**

The implementation is limited to:

- adding Node DOCX writer functions to the existing Node renderer,
- wiring Node delivery to produce DOCX first,
- adding `--html-only` / `preferDocx` controls for parity and fallback cases,
- updating N2 delivery tests to reflect DOCX support,
- adding N4 DOCX and DOCX parity tests,
- minimally updating renderer/workflow/current-status documentation.

No N5 aux migration, hook/stage/config work, Phase 3 output-quality changes, Skill changes, schema changes, runner/provider changes, package changes, or generated artifacts are included.

## Python Reference Preservation

**PASS**

`src/renderers/kssb_report_renderer.py` and `src/renderers/kssb_report_delivery.py` are not changed in the N4 diff. Python reference tests remain green:

- validator reference: 30/30,
- delivery wiring: 34/34,
- renderer smoke: 22/22,
- DEI/intake: 83/83,
- OCR hash: 11/11,
- aux scanner: 26/26,
- nethook: 29/29,
- HWP runner: 49/49.

The intended D94 divergence remains documented and tested: Python delivery still generates after preflight errors, while Node delivery hard-stops.

## Node DOCX Writer Responsibility Coverage

**PASS**

The Node renderer now covers the Python DOCX responsibility surface:

- `buildDocumentXml()` for the report body and sections,
- OOXML support parts for content types, relationships, styles, settings, core/app props,
- deterministic `.docx` assembly via `buildDeterministicZip()`,
- `docxBytes()` as the low-level DOCX buffer API,
- `renderReport()` with DOCX -> HTML -> Markdown priority,
- XML escaping and XML control-character removal,
- filename sanitization and DOCX failure fallback.

The writer reads findings and formats them; it does not recalculate judgments or synthesize evidence, questions, recommendations, or findings fields.

## DOCX Structure / Content Parity

**PASS**

The parity tests compare Node-generated DOCX against Python `_docx_bytes()` by decompressing both containers and comparing all part contents byte-for-byte. Coverage includes:

- the official example findings,
- a variant with optional fields removed, question priority changed, and escape-sensitive text,
- a control-character variant.

All part names/order match and all 8 decompressed parts are byte-identical. This is a strong N4 gate because it verifies the actual OOXML content that Word consumes.

## Deterministic ZIP / OOXML

**PASS**

Determinism is covered by:

- repeated `docxBytes()` byte-identical output,
- repeated `renderReport()` DOCX files byte-identical,
- fixed ZIP timestamp (`1980-01-01`),
- fixed entry order,
- fixed core properties timestamp,
- DEFLATE level 9,
- no extra fields or data descriptors in the tested writer shape.

The independent ZIP/XML probe also confirmed the generated archive opens under `zipfile`, `testzip()` returns `None`, and all XML parts parse.

## XML / ZIP Safety

**PASS**

Tests and code review confirm:

- XML escape for `&`, `<`, `>`, and `"`,
- Python-compatible non-escaping of apostrophe,
- removal of XML 1.0 disallowed control characters,
- well-formed XML parts,
- CRC32 recalculation and usize checks,
- method 8 DEFLATE entries,
- fixed timestamps,
- safe filename sanitization.

## Allowed Container Byte Difference

**PASS**

The implementation honestly distinguishes:

- required parity: decompressed OOXML part content and structure,
- non-goal: whole-container byte parity against Python.

This is acceptable because Node and Python zlib may emit different DEFLATE streams for the same large payload while preserving identical decompressed content, CRC validity, and document semantics. Node itself is deterministic across repeated runs.

## Delivery DOCX Integration

**PASS**

Node delivery now uses `renderReport(findings, outDir, { preferDocx })` and produces DOCX/HTML/Markdown by default, with DOCX as `primary_format`. `--html-only` correctly sets `preferDocx:false` for internal/parity use. User summary reports DOCX priority and fallback file names without raw paths, stack traces, provider names, or raw validator locations.

## D94 Hard Stop DOCX Blocking

**PASS**

D94 hard stop remains before renderer execution. Tests verify that preflight errors produce:

- `hard_stop=true`,
- exit code 4 in CLI,
- `outputs={}`,
- no output directory in the non-existing-dir path,
- no `.docx`, `.html`, or `.md` even when the output directory already exists,
- sanitized user-facing message,
- raw issue details only under internal/debug output.

## Findings / Judgment Boundary

**PASS**

DOCX writer output preserves judgment labels, evidence quote text, question rows, and counts from input findings. It does not generate or change judgments, evidence anchors, questions, requested materials, missing-info fields, or recommendations. Renderer and delivery remain format/transport layers over a single findings source.

## N1 / N2 / N3 Regression

**PASS**

N1 validator, N2 delivery/HTML/Markdown, and N3 DEI producer regressions passed. No relevant code for validators or DEI was changed in the N4 diff. The N2 delivery tests were updated appropriately for DOCX primary output while preserving `preferDocx:false` parity coverage for HTML/Markdown.

## Dependency / Artifact Safety

**PASS**

No package manifest or lockfile was added. No `node_modules`, runtime binary, runtime archive, traineddata, tool-cache, generated report, intake/OCR/DEI/findings artifact, sample source file, or submission package was introduced. The DOCX writer uses only Node built-ins.

## No-overclaim / Leak Review

**PASS**

The generated DOCX body, core/app properties, HTML/Markdown outputs, and user summary tests cover overclaim and leak risks. Search hits in changed files are negation/boundary language or test-token lists. The implementation does not claim OCR support completion, provider finalization, L2/L3 completion, product completion, or 2N-5 pass.

## Phase 2 Core Closure Readiness

**PASS**

For the core Node path covered by Phase 2 N1~N4:

- N1 Node validator: reviewed PASS.
- N2 Node delivery + HTML/Markdown renderer: reviewed PASS.
- N3 Node DEI producer: reviewed PASS.
- N4 Node DOCX writer: this review PASS.

It is reasonable to treat N1~N4 core Node migration as closed for the reviewed surfaces. N5 aux scanner remains a separate decision, and Phase 3 quality work remains out of scope.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

#### C2N6-N4-OBS-01: Word GUI/manual-open verification remains a submission-polish item

Automated ZIP/XML/content parity is strong and sufficient for this review. A human Word/opening check before final submission would still be useful because it validates end-user application behavior beyond OOXML parser validity.

Blocking: No.

#### C2N6-N4-OBS-02: Workflow docs can now be consolidated around the Node path

`docs/workflow_usage.md` and renderer README now mention the Node DOCX path, but historical Python internal commands remain. Since N1~N4 are now available, a later documentation-alignment pass can reduce transitional Python emphasis without removing Python as parity/reference.

Blocking: No.

#### C2N6-N4-OBS-03: Keep N5 explicit rather than accidental

N5 aux-scanner handling is still undecided by design. It should be resolved by an explicit decision: either Node migration, documented Node-path limitation, or deferral. N4 PASS should not be read as N5 completion.

Blocking: No.

## Required Fixes Before Next Step

None.

## Carry-forward Items

- Decide N5 aux-scanner handling explicitly.
- Consider a docs alignment pass after the N5 decision to make the Node path the clearest internal execution path while preserving Python reference status.
- Keep the no-generated-artifact discipline during any black-box or submission-preflight cycles.
- Perform manual Word/opening smoke before final submission packaging if feasible.

## Final Recommendation

Proceed to the next decision point: Phase 2 core Node N1~N4 can be considered closed for the reviewed surfaces, and the project can move to N5 decision / Phase 3 planning as directed by ChatGPT/User. No N4 required fixes are needed.
