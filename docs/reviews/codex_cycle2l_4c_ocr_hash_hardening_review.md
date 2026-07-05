# Codex Review - Cycle 2L-4C OCR Hash Integrity Hardening

## Verdict

PASS.

Cycle 2L-4C sufficiently resolves `C2L4B-MIN-01`. The patch narrows itself to OCR hash-integrity hardening in the DEI ingest boundary: `pages[].text_sha256` is recomputed from page text, `output_sha256` is checked against a deterministic canonical JSON hash, mismatches fail fast with `IntakeError`, and `model_sha256` remains explicitly presence-only because ingest cannot access the external model file.

This review does not promote L2 to final implemented+reviewed status and does not finalize the provider. It only confirms that the 2L-4B nonblocking minor is closed enough for the next closure/promotion decision step.

## Findings

Critical: 0

Major: 0

Minor: 0

No blocking or nonblocking patch findings were identified.

## Patch Review Summary

`C2L4B-MIN-01` is resolved:

- `src/intake/dei_producer.py` now imports only stdlib `hashlib` in addition to existing stdlib modules.
- `pages[].text_sha256` is recomputed as SHA-256 of the UTF-8 page text and compared case-insensitively.
- `canonical_ocr_output_sha256()` excludes only top-level `output_sha256`, serializes with `sort_keys=True`, `ensure_ascii=False`, and compact separators, then hashes the UTF-8 bytes.
- `output_sha256` mismatch raises `IntakeError` before merge.
- Key order independence is tested with a reordered artifact.
- Placeholder fixture hashes were replaced with actual computed values.
- Negative tests now cover page text tampering with stale `text_sha256` and bad `output_sha256`.

`model_sha256` presence-only handling is acceptable for this ingest-only layer. The docstring, current status, and decision log explain that the model file is out-of-band runner provenance and cannot be recomputed by `dei_producer.py`.

The existing L2 boundary is preserved:

- No runner implementation was added.
- No OCR provider was installed, executed, or finalized.
- No L2 final promotion was claimed.
- No schema, validator, renderer, delivery, manifest, marketplace, package, lock, MCP, or app configuration changed.

## Test Execution

Initial sandboxed `python` execution failed because `python.exe` resolved to the WindowsApps stub and was inaccessible. I reran the same script-style tests with approved shell execution.

Executed:

- `git diff --check HEAD^..HEAD` - PASS.
- `python tests/test_intake_dei_producer.py` - PASS, 56/56.
- `python tests/test_aux_structure_scanner.py` - PASS, 26/26.
- `python tests/test_findings_validator.py` - PASS, 26/26.
- `python tests/smoke_test_renderer.py` - PASS, 22/22.
- `python tests/test_delivery_wiring.py` - PASS, 33/33.

The new intake producer tests specifically verify normal hash acceptance, stale page-text hash rejection, output-hash rejection, key-order independent canonical hashing, reordered artifact acceptance, and uppercase hash acceptance.

## Scope / Artifact Safety

Scope is acceptable:

- Target commit changes only `src/intake/dei_producer.py`, `tests/test_intake_dei_producer.py`, `docs/current_status.md`, and `docs/decision_log.md`.
- `git diff --name-only HEAD^..HEAD -- src/schemas src/validators src/renderers .agents src/.codex-plugin package.json package-lock.json .mcp.json .app.json` returned no changes.
- `git ls-files` scan found no committed package files, `node_modules`, `.mcp.json`, `.app.json`, PDF/DOCX/JSONL artifacts, or `submission.zip`.
- Sensitive-pattern scan found no secrets, tokens, API keys, private keys, or unredacted local absolute paths in the patch-relevant files. The only path-related hits were prior review text describing sandbox behavior.

## Required Fixes Before Next Step, If Any

None.

## Recommended Next Step

Proceed to ChatGPT/user coordination for the next closure or promotion decision. L2 final promotion and provider finalization should remain separate decisions and should not be inferred from this narrow hash-hardening PASS alone.
