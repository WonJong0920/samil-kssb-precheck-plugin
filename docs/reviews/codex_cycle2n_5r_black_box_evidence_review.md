# Codex Cycle 2N-5R Black-box Evidence Review

## Review Overview

- Role: Codex independent evidence reviewer.
- Reviewed execution commit: `b85ff9888bd548e4d8922941a20e69ac74e63f1f`
- Reviewed evidence path: `docs/samples/codex_cycle2n_5r_black_box_execution_evidence.md`
- Previous gates: Phase 0 PASS, Phase 1 PASS.
- Execution subject: Claude Code.
- Review subject: post-run 2N-5R evidence and supporting repo/runtime artifacts.

This review does not declare product completion, OCR support completion, L2/L3 completion, provider finalization, or public submission readiness. The verdict applies only to the 2N-5R black-box evidence review gate.

## Verdict

**PASS**

2N-5R evidence satisfies the black-box protocol expectations. The prior 2N-5 Major issues did not recur in the reviewed evidence, D93 approval-path scenarios are represented, sample/artifact hashes were independently recomputed, quote/source anchoring was independently rechecked, and no blocking overclaim, path leak, stack trace leak, repo contamination, or generated artifact commit was found.

## Readiness

- Phase 2 entry: **Ready**
- Required fixes before Phase 2: **None**
- Carry-forward: keep preserving run-log and tool-cache provenance snippets or hashes for future reviews, because some provenance is external to `RUN_ROOT`.

## Source-of-truth Reviewed

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/blackbox_protocol.md`
- `docs/samples/codex_cycle2n_5r_black_box_execution_evidence.md`
- `docs/current_status.md`
- `docs/decision_log.md` entries D93 and D94
- `docs/reviews/codex_cycle2n_6_phase0_review.md`
- `docs/reviews/codex_cycle2n_6_phase1_review.md`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`
- `src/skills/samil-kssb-precheck/kssb_requirement_catalog.md`
- `src/skills/samil-kssb-precheck/customer_question_rules.md`

## Additional Files / Artifacts Reviewed

- `docs/samples/codex_cycle2n_5r_black_box_execution_evidence.md`
- `src/validators/kssb_findings_validator.py`
- `tests/test_toolcache_write_failure.test.cjs`
- `tests/test_document_intake_router.test.cjs`
- `tests/test_hwp_assisted_runner_node.test.cjs`
- `tests/test_pdf_ocr_runner.test.cjs`
- `tests/test_findings_validator.py`
- `RUN_ROOT` artifacts under `<TEMP>/samil_kssb_2n5r_blackbox_20260708`
- Tool-cache approval/prep/run logs under `<USER_HOME>/.samil-kssb-precheck/tools`

## Changed Files Review

Diff range checked:

`fa1000358aeb1ec11ed624d4ece16d3e970312c9..b85ff9888bd548e4d8922941a20e69ac74e63f1f`

Changed files:

- `docs/current_status.md`
- `docs/samples/codex_cycle2n_5r_black_box_execution_evidence.md`

No code, test, schema, package, runtime, sample source, or generated output file was added in the reviewed execution commit.

## Verification Performed

### Git / Static Checks

- `git status --short --branch`: clean branch, `main...origin/main`.
- `git log -1 --oneline`: reviewed HEAD `b85ff98 docs: record 2n-5r black-box execution evidence`.
- `git diff --check fa1000358aeb1ec11ed624d4ece16d3e970312c9..b85ff9888bd548e4d8922941a20e69ac74e63f1f`: pass.
- `git diff --name-only fa1000358aeb1ec11ed624d4ece16d3e970312c9..b85ff9888bd548e4d8922941a20e69ac74e63f1f`: evidence plus current status only.

### Regression / Guardrail Tests

- `node --test tests/test_toolcache_write_failure.test.cjs`: 8/8 pass.
- `node --test tests/test_document_intake_router.test.cjs`: 21/21 pass.
- `node --test tests/test_hwp_assisted_runner_node.test.cjs`: 39/39 pass.
- `node --test tests/test_pdf_ocr_runner.test.cjs`: 29/29 pass.
- Absolute Python 3.14 with UTF-8 env, `tests/test_findings_validator.py`: 30/30 pass.

### RUN_ROOT Access

RUN_ROOT was accessible at the redacted path recorded in evidence:

`<TEMP>/samil_kssb_2n5r_blackbox_20260708`

It contained the expected intake, OCR, DEI, findings, validation, and DOCX/HTML/Markdown delivery artifacts. This allowed direct hash recomputation and quote/source verification rather than document-only review.

### Sample Hash Recalculation

The five sample hashes and byte counts were independently recomputed from the external sample directory and matched the evidence:

- HFG PDF: bytes `3839124`, SHA-256 `6930f45255913a1faca6c591923626c6f29f5ecdc5e851bcf78ec9d6a8ec5c62`
- HWP: bytes `103936`, SHA-256 `445f82d6427446d39b5f5254a3c7d4c25a9981564f3b972892776f2e0249d982`
- HWPX: bytes `117945`, SHA-256 `094b9df5928d9fba042839489a79c1ac239aa2c3ac9ad7c2d2fd700dde4a358c`
- DOCX: bytes `81493`, SHA-256 `9567636d8d91e5e52fcaae3e4dbe719cc8e9ec734110a45726240c5ef0423580`
- Gate-D scan PDF: bytes `1156885`, SHA-256 `238de8be151da74023a5e1287e104a30a19c7c7a40aaa80749ceeb3cc843c5a3`

### Artifact Hash Recalculation

The major RUN_ROOT artifact hashes were independently recomputed and matched the evidence, including:

- PDF Kordoc intake JSON: `cf093615b0cfe6c4a9e88963289541b126260147b960c7988d7f08fd645c9a28`
- Mixed PDF OCR JSON: `e7a66a4f2288838b04ea60c85595d3cc4d19a8694d62bebe64dac1e196980783`
- HWP/HWPX/DOCX intake JSON artifacts: matched evidence hashes.
- Scan-only intake/OCR JSON artifacts: matched evidence hashes.
- DEI candidate artifacts: matched evidence hashes.
- Findings JSON: `2539047caa07f150303779ced562a0df498098d8eca234eb3c58ee7dd57f8ea0`
- Report DOCX/HTML/Markdown artifacts: matched evidence hashes.

### Findings / Preflight Recheck

The generated findings file contained:

- 4 KSSB areas.
- 10 finding items.
- 8 `evidence_confirmed` items.
- 2 `partial_evidence_needs_supplement` items.
- 19 total evidence anchors.
- 2 customer questions, both on partial items.

Validator re-run on the RUN_ROOT findings returned:

- errors: 0
- warnings: 0
- info: 1 (`jsonschema` not installed fallback notice)

This is consistent with the evidence statement that preflight produced no blocking errors or warnings.

### Quote / Source Independent Recheck

I independently parsed `hfg.findings.json` and `hfg.dei_candidate.json`, normalized whitespace, and searched all evidence anchor quotes against DEI block text/table content.

- Evidence anchors checked: 19
- Rediscovered in source DEI: 19
- Missing: 0

Random sample recheck with seed `20260708` returned five anchor indices: `0`, `1`, `13`, `17`, `18`. All five quotes were rediscovered in matching source blocks with page/location hints consistent with the findings:

- `gov-01#0`, p.12
- `gov-01#1`, p.9
- `metric-02#1`, p.27
- `target-01#0`, p.36
- `target-01#1`, p.36

This satisfies the Phase 1 carry-forward requirement for independent quote/source recheck.

### No-overclaim / Leak / Contamination Recheck

Generated DOCX/HTML/Markdown reports were scanned for:

- product completion / OCR completion / L2-L3 completion / provider finalization claims
- internal cycle/tooling terms
- provider names
- local path / user-home / tool-cache / stack trace markers
- audit opinion / assurance / compliance finality wording

Only negation-context matches were found in the report body, such as statements that the draft does not replace KSSB compliance finalization, audit opinion, or assurance. No blocking overclaim or path leak was found.

Repo contamination scan found no committed:

- sample source documents
- generated `*.intake.json`, `*.ocr_text.json`, `*.dei_candidate.json`, `*.findings.json`, or `*.aux_signals.json`
- generated DOCX/HTML/Markdown reports
- `node_modules`
- `package.json` / `package-lock.json`
- `tool-cache`
- runtime archives/installers
- `submission.zip`

## D93 OCR / HWP Approval-path Review

**PASS**

The evidence records all D93-required approved real execution paths:

- Text PDF Kordoc-first intake succeeded.
- Mixed PDF page-set OCR executed for the five selected pages.
- Scan-only PDF OCR executed for all 9 pages.
- HWP, HWPX, and DOCX assisted intake executed through the Node runner path.
- Tool-cache approvals and run logs record install/run approvals, hook observation, zero egress attempts during protected runs, and `no_egress_verified=true`.

The evidence distinguishes preparation egress from protected run no-egress and does not present OCR/HWP capability as complete product support.

## Python Runner `.py` Non-use Review

**PASS**

The reviewed evidence records that HWP/PDF assisted intake and OCR execution used Node runner paths. The legacy Python HWP runner `.py` was not used for HWP-family execution. Python use was limited to transitional components already in scope:

- `dei_producer.py`
- `kssb_report_delivery.py`
- findings validator / preflight

The evidence records absolute Python 3.14 execution with UTF-8 environment variables and does not claim portable Python adoption or broader Python runtime resolution.

## Scenario 1 Baseline Review

**PASS**

Scenario 1 connects the expected black-box chain:

sample document -> assisted intake -> DEI -> findings -> quote/source check -> preflight -> delivery -> no-overclaim/leak/contamination scan

The evidence is explicit that findings generation involved Skill/LLM judgment, not a deterministic parser. This preserves the source-bound and human-review boundary.

DOCX primary delivery was generated alongside HTML and Markdown. Preflight reported zero errors and zero warnings. The findings distribution is plausible and source-bound, with partial findings driving customer questions rather than unsupported completion claims.

## 2N-5 Major Recurrence Review

### Major 1: tool-cache/write failure -> stack trace / local path leak

**Not recurring.**

The exact failure mode did not naturally occur in 2N-5R execution, but Phase 0 controlled-failure tests were rerun and passed. The successful 2N-5R evidence also shows protected approved runs proceeding without user-facing stack traces or local path leaks.

### Major 2: missing sample -> findings -> report harness

**Resolved in reviewed evidence.**

Scenario 1 demonstrates a complete end-to-end chain with sample identity, generated findings, preflight result, report delivery, hash traceability, and quote/source recheck.

### Major 3: Windows Python UTF-8 crash

**Resolved in reviewed evidence.**

Absolute Python 3.14 with UTF-8 environment variables was used for the transitional Python steps. The validator test suite passed, DEI/delivery outputs were produced, and the generated Korean reports were readable enough for no-overclaim and quote/source review.

## Role / Boundary Review

**PASS**

The evidence keeps the roles separated:

- Claude Code is the execution subject.
- Codex is the post-run independent reviewer.
- `PASS_CANDIDATE` is used for evidence status before Codex review.
- The evidence does not claim final 2N-5 PASS before this review.
- The evidence does not claim OCR complete, L2/L3 complete, provider finalization, product completion, audit opinion, assurance, or compliance finalization.

D94 is also correctly handled: the future Node delivery hard-stop policy is not misrepresented as a current Python delivery behavior.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

#### C2N5R-OBS-01: Preserve external run-log evidence when possible

The review could access tool-cache approval/prep/run logs and verify D93 provenance directly. Some provenance is not embedded in the RUN_ROOT Kordoc intake JSON itself, so future evidence cycles should continue preserving relevant redacted run-log excerpts or hashes when external tool-cache state may be cleaned before review.

Blocking: No.

#### C2N5R-OBS-02: Keep evidence/user-facing output separation explicit

Tool-cache and evidence logs necessarily contain technical provenance and redacted internal paths. Generated user-facing reports did not expose those details. Future reviews should keep this separation explicit so evidence traceability does not get confused with customer-facing output quality.

Blocking: No.

#### C2N5R-OBS-03: Continue documenting Skill/LLM findings generation honestly

The evidence correctly states that findings generation is Skill/LLM judgment, not deterministic parser output. This should remain explicit in Phase 2 and future black-box runs.

Blocking: No.

## Required Fixes Before Phase 2

None.

## Carry-forward Items

- Preserve redacted run-log/provenance evidence or hashes for future reviews if external tool-cache logs may be unavailable.
- Keep generated reports free of provider/tool/runtime/internal path details.
- Keep findings generation described as Skill/LLM-assisted and source-bound rather than deterministic or compliance-final.

## Final Recommendation

Proceed to Phase 2. The 2N-5R evidence is sufficient for this gate, with no required fixes before Phase 2.
