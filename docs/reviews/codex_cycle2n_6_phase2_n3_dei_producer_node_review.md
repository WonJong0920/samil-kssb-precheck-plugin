# Codex Cycle 2N-6 Phase 2 N3 Review — Node DEI Producer

## Review Overview

- Role: Codex independent reviewer.
- Review scope: Phase 2 N3 Node DEI producer port only.
- Latest reviewed HEAD: `284bc882d66776c5d21a5d12df6546509100e60e`
- N2 PASS baseline: `fd5e804d055226b86c8c216bcdfe201969ed4815`
- Interleaved external commit: `18de5ee1a768d1e75da2c103e376f9eb00757e53`
- N3 implementation commit: `fe3c1026d0b8761cfe89acbeddfb44f175cab22d`
- N3 report correction commit: `284bc882d66776c5d21a5d12df6546509100e60e`

Diff handling:

- N3 implementation diff reviewed as:
  `18de5ee1a768d1e75da2c103e376f9eb00757e53..fe3c1026d0b8761cfe89acbeddfb44f175cab22d`
- Report correction diff reviewed as:
  `fe3c1026d0b8761cfe89acbeddfb44f175cab22d..284bc882d66776c5d21a5d12df6546509100e60e`
- The interleaved external commit adds only
  `docs/reviews/claude_gpt_post_n4_hook_structure_proposal_review.md`; it is context-only and is not treated as part of the N3 implementation surface.

This review does not evaluate or approve N4 DOCX writer work, N5 aux-scanner migration, hook structure proposals, product completion, OCR support completion, provider finalization, or overall 2N-5 completion.

## Verdict

**PASS**

The N3 implementation is scoped to a Node port of the DEI producer, preserves the Python DEI producer as transitional reference, keeps the DEI output outside the findings/validator/renderer/delivery path, and provides strong Node-only plus Python parity coverage. No required fixes are needed before N4.

## Readiness

- N4 entry: **Ready**
- Required fixes before N4: **None**
- Carry-forward to N4:
  - Keep Python reference files unchanged except for explicit parity/reference decisions.
  - Preserve the N3 boundary that DEI candidates are evidence material, not findings.
  - Keep generated reports/artifacts outside the repo during DOCX writer testing.
  - When Node path is promoted after N4, align workflow docs that still describe transitional Python CLI surfaces.

## Actual Changed Files

N3 implementation diff:

- `docs/current_status.md`
- `docs/cycle2n_6_phase2_n3_dei_producer_node_completion_report.md`
- `src/intake/README.md`
- `src/intake/dei_producer.cjs`
- `tests/test_intake_dei_producer_node.test.cjs`
- `tests/test_intake_dei_producer_parity.test.cjs`

N3 report correction diff:

- `docs/cycle2n_6_phase2_n3_dei_producer_node_completion_report.md`

No Python DEI reference, schema, validator, renderer, delivery, runner, Skill, manifest, marketplace, package, lockfile, runtime, generated artifact, or submission package change was introduced by the N3 implementation diff.

## Source-of-truth Reviewed

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/chatgpt_coordination_workflow.md`
- `docs/current_status.md`
- `docs/planning/post_2n5_final_remediation_plan_node_only.md`
- `docs/reviews/codex_cycle2n_6_phase2_n2_delivery_html_md_review.md`
- `docs/cycle2n_6_phase2_n3_dei_producer_node_completion_report.md`

## Additional Files Inspected

- `src/intake/dei_producer.cjs`
- `src/intake/dei_producer.py`
- `src/intake/README.md`
- `tests/test_intake_dei_producer_node.test.cjs`
- `tests/test_intake_dei_producer_parity.test.cjs`
- related N1/N2, intake, OCR, aux, nethook, runner, and bootstrap regression tests listed below.

## Verification Performed

### Git / Diff Checks

- `git status --short --branch`
  - Result: clean `main...origin/main`
- `git log --oneline -8`
  - Result: latest HEAD is `284bc88 docs: record interleaved external commit in n3 report`
- `git diff --check 18de5ee1a768d1e75da2c103e376f9eb00757e53..fe3c1026d0b8761cfe89acbeddfb44f175cab22d`
  - Result: pass
- `git diff --name-only 18de5ee1a768d1e75da2c103e376f9eb00757e53..fe3c1026d0b8761cfe89acbeddfb44f175cab22d`
  - Result: N3 implementation files match the reported surface.
- `git diff --name-only fe3c1026d0b8761cfe89acbeddfb44f175cab22d..284bc882d66776c5d21a5d12df6546509100e60e`
  - Result: N3 completion report correction only.
- `git diff --name-only fd5e804d055226b86c8c216bcdfe201969ed4815..18de5ee1a768d1e75da2c103e376f9eb00757e53`
  - Result: interleaved external review doc only.
- Final `git diff --check`
  - Result: pass before creating this review.

### N3 Tests

- `node --test tests/test_intake_dei_producer_node.test.cjs`
  - Result: 61/61 pass, 0 skipped.
- `node --test tests/test_intake_dei_producer_parity.test.cjs`
  - Result: 46/46 pass, 0 skipped. Python reference was detected and executed.

### N1 / N2 Regression

- `node --test tests/test_findings_validator_node.test.cjs`
  - Result: 43/43 pass.
- `node --test tests/test_findings_validator_parity.test.cjs`
  - Result: 35/35 pass.
- `node --test tests/test_delivery_node.test.cjs`
  - Result: 18/18 pass.
- `node --test tests/test_delivery_node_parity.test.cjs`
  - Result: 6/6 pass.
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

### Contamination / Overclaim Scan

Scanned for package/runtime/generated artifact contamination:

- `package.json`
- `package-lock.json`
- `node_modules`
- `*.intake.json`
- `*.ocr_text.json`
- `*.dei_candidate.json`
- `*.findings.json`
- `*.aux_signals.json`
- generated `*_KSSB_공시근거_사전검토보고서.{docx,html,md}`
- `submission.zip`
- `*.traineddata`
- runtime archives/installers/executables
- repo-local `tool-cache` directories

Result: no repo contamination found.

Searched the N3 changed surface for overclaim phrases. Hits are negation/boundary contexts only, such as “제품 완성 아님”, “OCR 지원 완료 아님”, and “provider finalization 선언 없음”.

## Tests Not Executed

No required N3 or N3-adjacent regression listed in the prompt was skipped. Real sample document execution, OCR runtime execution, Kordoc reinstall, npm install, and generated report production were intentionally not executed because they are outside the N3 review scope.

## N3 Scope Compliance

**PASS**

N3 is limited to the Node DEI producer port, Node DEI tests, parity tests, and minimal intake/status/completion documentation. It does not start N4 DOCX writer work, N5 aux migration, hook structure work, runner/provider work, Skill changes, schema changes, validator/delivery changes, package changes, or generated output production.

## Python DEI Reference Preservation

**PASS**

`src/intake/dei_producer.py` is not changed in the N3 implementation diff. Its regression suite passes 83/83 checks. The Node parity suite uses the Python CLI as a live reference and reports 46/46 pass with 0 skips, which supports the claim that Python remains a preserved transitional reference.

## Node DEI Producer Responsibility Coverage

**PASS**

The Node implementation covers the Python reference responsibility surface:

- minimum paginated intake contract and fail-fast malformed-input behavior,
- document-level HWP/HWPX/DOCX variant,
- deterministic normalization of blocks, document quality, and review hints,
- optional OCR and aux additive ingest,
- OCR `text_sha256` and canonical `output_sha256` integrity checks,
- internal/debug CLI with success, IntakeError, argument error, and load-failure paths.

The module uses Node built-ins only and does not require core validator/renderer/delivery modules or runner modules. The tests assert these boundaries.

## Intake / OCR / Aux Contract Review

**PASS**

OCR text is kept in `ocr_supplement` and not mixed into normal `blocks`. Aux signals are placed in `aux_structure` and review/gap hints only. Document-level input rejects `ocr_text` because there is no page-level `needsOcr` signal to align OCR pages. Image base64 data is not carried into DEI blocks in document-level tests. These behaviors match the prior source-bound and no-overclaim decisions.

## Canonical Hash / Deterministic Output

**PASS**

The Node `canonicalOcrOutputSha256` implementation is independently implemented but bound by:

- Python golden fixtures F1/F2/F3,
- direct comparison with `pdf_ocr_runner.cjs`,
- parity cases where Python accepts Node-produced OCR hash artifacts.

Node tests also cover deterministic API/CLI output, key-order independence, uppercase hex normalization, text tampering rejection, and output hash mismatch rejection.

## Parity Quality

**PASS**

Parity is stronger than structural comparison:

- success cases compare full stdout text with only CRLF/LF normalization,
- rejection cases compare full IntakeError stderr text,
- argument-error paths compare exit semantics where parser wording intentionally differs,
- Python was detected and no parity tests were skipped.

This is sufficient for the N3 gate.

## Allowed Differences

**PASS**

The documented differences are narrow and honest:

- JS cannot distinguish JSON `5.0` from integer `5` after `JSON.parse`;
- pathological non-contract types such as Python bool/int quirks are not reproduced;
- load failure and argument parser wording differ, while exit code semantics remain controlled.

These differences are outside the normal runner-produced JSON contract and do not loosen the verified DEI contract for supported inputs.

## Findings / Judgment Boundary

**PASS**

The Node DEI producer does not generate findings, KSSB judgments, customer questions, missing-info lists, recommendations, or evidence anchors. Tests recursively scan for judgment-like keys across normal, merged, and document-level DEI outputs. The module is not wired directly into validator/renderer/delivery and does not bypass the Skill/findings step.

## N1 / N2 Regression Review

**PASS**

N1 validator and N2 delivery/HTML/Markdown renderer regressions remain green. N2's D94 hard stop and sanitized delivery behavior were not modified. The N3 DEI output is therefore reviewed as an upstream evidence-material surface, not as a direct renderer or validator input.

## Dependency / Package / Artifact Safety

**PASS**

No package manifest, lockfile, `node_modules`, runtime binary/archive, tool-cache, generated report, intake/OCR/DEI/findings artifact, sample source file, or submission package was added. The Node implementation uses built-in modules only.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

#### C2N6-N3-OBS-01: Keep transitional workflow docs aligned after N4

Some workflow surfaces still necessarily describe the transitional Python CLI path for DEI/delivery. This is acceptable during N3 because the Node path is not yet fully promoted and N4 DOCX is pending. After N4, update the user/internal workflow docs in one pass so the Node path does not remain hidden behind old transitional wording.

Blocking: No.

#### C2N6-N3-OBS-02: Maintain canonical hash golden coupling if the OCR artifact contract changes

The Node DEI producer and OCR runner intentionally duplicate the canonical hash function to preserve module independence. Current tests bind them with golden constants and direct comparison. Any future OCR artifact contract change should update all golden fixtures together.

Blocking: No.

#### C2N6-N3-OBS-03: N4 should preserve the no-artifact contamination pattern

N3 tests use temporary directories and leave no generated artifacts in the repo. N4 DOCX writer testing will be more artifact-prone, so it should keep the same cleanup and contamination-scan discipline.

Blocking: No.

## Required Fixes Before N4

None.

## Carry-forward Items

- N4 should define DOCX writer parity criteria before implementation review: structure, deterministic output, XML safety, and user-facing summary behavior rather than byte parity if byte parity is not realistic.
- Do not treat N3 PASS as product completion, OCR support completion, provider finalization, or 2N-5 completion.
- Keep N5 aux-scanner decision separate.

## Final Recommendation

Proceed to N4: Node DOCX writer implementation/review planning. N3 is sufficiently scoped, tested, and boundary-preserving, with no required fixes before N4.
