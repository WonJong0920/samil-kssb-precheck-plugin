# Codex Review - Cycle 2L-4B Provisional L2 Ingest Implementation

## Verdict

PASS with nonblocking follow-up.

Cycle 2L-4B is sufficient as a **provisional L2 repo-side ingest implementation**. It implements the 2L-4A boundary in the intended narrow form: stdlib-only auxiliary structure scanning, additive DEI merge for `ocr_supplement` and `aux_structure`, no provider runner, no provider finalization, and no changes to findings schema, validator, renderer, delivery, manifest, marketplace, package, lock, or MCP configuration.

L2 final promotion is not yet complete. A separate closure/promotion step should decide whether remaining nonblocking hardening items, especially OCR hash-integrity verification and runner policy, are required before calling L2 implemented+reviewed.

## Critical / Major / Minor Findings

Critical: 0

Major: 0

Minor: 1

### C2L4B-MIN-01

Severity: Minor

Location: `src/intake/dei_producer.py` (`_validate_ocr_text_contract`), `tests/test_intake_dei_producer.py`

Issue: `ocr_text` provenance requires `text_sha256` and `output_sha256` fields, but the ingest validator only checks presence/non-empty strings. It does not recompute page text hashes or the overall output hash. The test fixture also uses a placeholder `text_sha256`, confirming the current contract is presence-only.

Impact: This does not break the runner/ingest boundary or provisional L2 ingest behavior, but it weakens the reproducibility/integrity value of the OCR artifact contract before final promotion or runner integration.

Recommendation: Before L2 final promotion or committed runner wrappers, either implement stdlib hash verification for `ocr_text.pages[].text` and the output-hash canonicalization rule, or explicitly document that ingest treats hashes as runner-provided provenance metadata and validates only presence.

Blocking: No. Nonblocking follow-up for final promotion / runner integration.

## Implementation Boundary Review

The implementation stays within the 2L-4A boundary:

- `src/intake/aux_structure_scanner.py` is a repo-side stdlib ingest module, not a provider runner.
- `src/intake/dei_producer.py` accepts already-created `ocr_text` and `aux_signals` artifacts; it does not run OCR, Kordoc, models, network calls, or external tools.
- No runner scripts were committed, matching the safer 2L-4A review posture of implementing ingest contracts first.
- `ocr_supplement` and `aux_structure` are optional additive DEI sections. Without them, existing L1 output remains compatible and `DEI_VERSION` stays `"1"`.
- Provider/scanner material does not flow directly into findings, validator, renderer, or delivery.
- Skill and evidence-rule changes keep OCR and auxiliary structure signals as review material, not as current final capability claims.

This is a provisional implementation only. It does not finalize the L2 provider and does not promote L2 to final implemented+reviewed status by itself.

## Code Review Summary

`src/intake/aux_structure_scanner.py`:

- Uses only stdlib imports: `re`, `xml.etree.ElementTree`, `zipfile`, `collections.Counter`, and `pathlib.Path`.
- Detects HWPX/DOCX by ZIP layout, not filename extension.
- Applies zip-slip rejection, member read allowlists, per-member and total read budgets, and fail-fast XML parsing.
- Counts document-level signals only: image resources/relationships/instances, table totals/top-level/nested, heading/caption candidates, chart relationships, and review-required reasons.
- Does not output raw XML, image bytes, paragraph text, or semantic/KSSB judgments.

`src/intake/dei_producer.py`:

- Keeps the existing intake contract and malformed-input fail-fast behavior.
- Adds optional `ocr_text` validation with required provenance fields and OCR page alignment against `needsOcr` / `ocrCandidatePages`.
- Adds optional `aux_signals` validation with doc format and nonnegative count checks.
- Keeps OCR text out of existing `blocks`; it appears only under `ocr_supplement` with `extraction_quality="low"`.
- Places auxiliary counts under `aux_structure`; gap signals become `review_priority_hints` only.
- Does not create judgment fields, evidence anchors, customer questions, recommendations, findings, or renderer/validator input.

Documents:

- `src/intake/README.md` clearly frames 2L-4B as provisional repo-side ingest, not provider execution.
- `evidence_mapping_rules.md` adds the needed OCR provenance / conservative mapping language.
- `SKILL.md` keeps OCR execution outside plugin functionality and treats `ocr_supplement` / `aux_structure` as evidence material and review signals only.

## Test Execution and Results

Initial sandboxed `python` execution failed because `python.exe` resolved to the WindowsApps stub and was inaccessible. Retrying with approved shell execution found Python 3.14.5 and ran the repo's script-style tests directly. I did not use `python -m pytest` because these test files are self-contained scripts with internal check runners rather than pytest test functions.

Executed:

- `git diff --check HEAD^..HEAD` — PASS.
- `python tests/test_aux_structure_scanner.py` — PASS, 26/26.
- `python tests/test_intake_dei_producer.py` — PASS, 50/50.
- `python tests/test_findings_validator.py` — PASS, 26/26.
- `python tests/smoke_test_renderer.py` — PASS, 22/22.
- `python tests/test_delivery_wiring.py` — PASS, 33/33.

Coverage is sufficient for provisional 2L-4B:

- aux scanner determinism, format detection, count accuracy, zip-slip rejection, bounded read, malformed ZIP/XML fail-fast, raw XML/body text non-persistence, no network import, and no core import.
- DEI additive merge compatibility, `DEI_VERSION="1"` retention, blocks immutability, OCR text non-mixing, provenance preservation, low-confidence OCR marking, aux gap hints, no judgment-key leakage, deterministic merge, page mismatch fail-fast, malformed OCR/aux artifacts rejection.
- Existing validator, renderer, and delivery regression surfaces remain green.

## Artifact / Dependency / Secret Safety

Artifact and dependency posture is acceptable:

- Target diff changes only the intended files: intake implementation/docs, Skill/evidence-rule docs, tests, status, and decision log.
- `git diff --name-only HEAD^..HEAD -- src/schemas src/validators src/renderers .agents src/.codex-plugin package.json package-lock.json .mcp.json .app.json` returned no changes.
- `git ls-files` scan found no committed PDF/DOCX/JSONL, package files, `node_modules`, `.mcp.json`, `.app.json`, or `submission.zip`.
- `rg` import scan confirms the new intake modules use stdlib imports only and do not import network modules or core validator/renderer/delivery modules.
- Sensitive-pattern scan found no secrets, tokens, API keys, private keys, or unredacted local absolute paths. The only path-related hit was an intentional SKILL policy sentence forbidding `plugin/cache/sandbox` exposure.
- No provider install, OCR execution, model download, raw XML/JSON/OCR text/page-image artifact, generated report, venv, node_modules, or submission package was added.

## Next-Step Readiness

L2 provisional implementation can be recognized.

L2 final promotion should wait for a separate closure/promotion decision because:

- This review is implementation verification, not final capability promotion.
- Provider finalization remains explicitly out of scope.
- OCR hash-integrity handling should be decided before runner integration or final L2 promotion.
- Prior nonblocking hardening items remain open.

Provider finalization status: not finalized. `Kordoc + tesseract.js + stdlib aux scanner` remains provisional and reversible.

## Required Fixes Before Next Step, If Any

None before the next review/coordination step.

No Critical or Major blockers were found.

## Nonblocking Follow-Up

- Resolve C2L4B-MIN-01 before final L2 promotion or runner integration: verify OCR text/output hashes or document them as metadata-only provenance.
- Decide runner script policy: keep docs-only or commit optional/dev-local wrappers with no core import, no dependency/lock impact, and no user-facing CLI regression.
- Carry forward Kordoc 3.15.0 source-aligned comparison before final provider selection.
- Carry forward HWPX residual table mismatch review, outline-style sample validation, optional `defusedxml` hardening, and OS-level no-egress hardening.
- Keep OCR-derived quotes conservative: source-marked, human-review-required, and not automatically promoted to confirmed evidence.

## Recommended Next Step

Proceed to ChatGPT/user coordination for a 2L-4B closure/promotion decision or a narrow patch/hardening cycle if hash-integrity verification is required before promotion. Do not claim final L2 support or final provider selection until that closure/promotion review is complete.
