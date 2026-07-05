# Codex Review - Cycle 2L-4A L2 Adapter Boundary Design

## Verdict

PASS with nonblocking follow-up.

The Cycle 2L-4A design is sufficient as implementation-prep for Cycle 2L-4B. It keeps the provisional `Kordoc + tesseract.js + stdlib zip+xml auxiliary scanner` architecture reversible, separates out-of-band provider execution from repo-side stdlib ingest, and preserves the current Skill-first, source-bound, human-review, validator detect-only, and renderer no-rejudgment boundaries.

No Critical, Major, or Minor findings were identified.

## Critical / Major / Minor Findings

Critical: 0

Major: 0

Minor: 0

## Scope and Boundary Review

The target commit remains within the requested design / implementation-prep scope:

- The diff is limited to `docs/current_status.md`, `docs/decision_log.md`, and `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`.
- No L2/L3 implementation, provider finalization, package/lock update, manifest/marketplace update, MCP setup, OCR execution, model download, raw artifact, or submission package was added.
- The design explicitly states that L2/L3 are not current product capabilities and that implementation requires Codex review plus user/ChatGPT approval.
- Provider/scanner outputs remain upstream evidence material and review signals. They do not bypass the Skill, validator, renderer, delivery, or human-review path.
- KSSB judgment, audit, assurance, certification, and compliance conclusions remain outside scope.

The design is aligned with the 2L-3B Gate D PASS, 2L-3C provider comparison PASS with nonblocking follow-up, and 2L-3D auxiliary scanner PASS with nonblocking follow-up.

## Runner / Ingest Boundary Review

The runner / ingest split is appropriate:

- The plugin core does not execute Kordoc, tesseract.js, OCR providers, model downloads, or networked provider setup.
- Runner work is defined as user-local, out-of-band execution with preparation egress recorded separately from parsing/OCR no-egress execution.
- Repo-side ingest is stdlib-only, opt-in, and core-adjacent rather than core-coupled.
- The auxiliary scanner exception is reasonable because the proposed scanner is stdlib-only, deterministic, local-file-only, and does not require provider dependencies or network access.

Runner script repository placement is a nonblocking design choice. The safer implementation posture is:

- 2L-4B may proceed without runner scripts by implementing only ingest contracts first.
- If thin runner scripts are committed, they should be explicitly optional/dev-local, have no package/lock dependency impact, never be imported by core modules, not become the user-facing Skill entrypoint, and include tests or static checks that enforce the no-core-import boundary.

This is not a blocker for 2L-4B, but it should be closed before any committed runner wrapper is treated as part of the reviewed implementation surface.

## Artifact Contract Review

The three-artifact contract is suitable for L2 prep:

1. `intake.json`: Keeping the existing L1 contract unchanged preserves backward compatibility and avoids hidden schema evolution.
2. `ocr_text.json`: The required provider/model/hash/no-egress provenance, page text hashes, output hash, and `needsOcr` page alignment are sufficient for reproducibility and Gate D traceability. Page mismatch fail-fast is appropriate and should be tested.
3. `aux_signals.json`: The 2L-3D auxiliary signal model is narrow enough for document-level cross-checks and gap signals without becoming a second findings schema.

The design balances reproducibility and artifact safety: raw OCR text and provider outputs can exist locally as input artifacts for ingest, but repo policy continues to keep raw documents, raw XML/JSON, page images, OCR text, model files, venvs, and node_modules out of the repository.

No artifact contract appears overly broad for 2L-4B, provided tests enforce required provenance fields, deterministic serialization, and fail-fast behavior for malformed or mismatched artifacts.

## DEI Candidate / Review-Signal Mapping Review

The DEI mapping is sound:

- OCR text stays out of existing `blocks` and enters a separate optional `ocr_supplement` section. This preserves provenance and prevents low-confidence OCR text from being silently treated as normal text-layer extraction.
- `aux_structure` is document-level optional material, not findings output.
- `image_detection_gap`, `table_count_mismatch`, and `review_required_reason` remain review/gap signals routed through `review_priority_hints` and the existing `not_verifiable` + `missing_info` + `customer_questions` path.
- The design does not create judgment fields, evidence anchors, recommendations, or findings directly from provider output.
- Findings schema, validator, renderer, and delivery can remain unchanged because the new fields are upstream DEI optional sections.

Keeping `DEI_VERSION = "1"` is acceptable for this additive expansion if existing consumers ignore unknown optional fields and regression tests prove old intake output remains stable. A version bump is not required before 2L-4B, but the implementation review should confirm the compatibility claim with tests.

OCR-derived quote handling should be clarified during implementation: OCR quotes may be used only with visible OCR provenance and conservative judgment mapping, and they must not turn uncertain extraction into confirmed evidence without consultant review.

## Version / Dependency / No-Egress / Artifact Review

The strategy is adequate for implementation-prep:

- The pins `kordoc@3.13.0`, `pdfjs-dist@4.10.38`, `tesseract.js@7.0.0`, `tesseract.js-core@7.0.0`, and traineddata hashes follow the prior Gate A/B/D and Version Strategy evidence.
- Auto-upgrade prohibition and fail-fast handling for unverified versions are appropriate, especially given the observed `pdfjs-dist@6.x` incompatibility.
- Preparation egress and parsing/OCR no-egress are clearly separated.
- Runner dependencies remain outside the repo; ingest stays stdlib-only.
- Raw artifacts and local paths remain excluded from repo and submission policy by default.

The carried-forward items remain nonblocking for 2L-4B implementation-prep: Kordoc 3.15.0 source-aligned comparison, OS-level no-egress hardening, HWPX residual table mismatch classification, outline-style sample validation, and possible `defusedxml` hardening.

## Test Strategy Review

The proposed test strategy is sufficient for 2L-4B entry:

- Auxiliary scanner tests cover determinism, ZIP member allowlisting, bounded reads, path traversal rejection, no raw XML persistence, and no network imports.
- DEI merge tests cover no judgment generation, blocks immutability, OCR page mismatch fail-fast, aux flag routing into priority hints only, no bbox leakage into findings hints, and backward compatibility without optional sections.
- Existing validator, renderer, delivery, and intake regression tests remain part of the required green set.
- Synthetic small fixtures are the right repo-safe approach; real samples and generated artifacts should remain out-of-band evidence only.

The 2L-4B review should verify that these tests are actually implemented and that the implementation does not add external dependencies.

## 2L-4B Implementation Readiness

2L-4B may proceed.

The proposed implementation surface is appropriately limited:

- Add `src/intake/aux_structure_scanner.py`.
- Add `tests/test_aux_structure_scanner.py`.
- Minimally extend `src/intake/dei_producer.py` and `tests/test_intake_dei_producer.py`.
- Update `src/intake/README.md` and make narrow Skill/evidence-routing documentation adjustments if needed.
- Do not modify schema, validator, renderer, delivery, manifest, marketplace, package/lock files, `.mcp.json`, or submission artifacts.

The implementation review must confirm that provider output cannot flow directly into findings, validator, renderer, or delivery without Skill-mediated source-bound judgment and human review.

## Validation Performed

- Confirmed current HEAD: `6aab6dea3fa2c4eeec3da2147417e9c7881dcca0`.
- Reviewed `AGENTS.md` and `docs/operating_principles.md`.
- Reviewed the 2L-4A design document and the required 2L-3B/2L-3C/2L-3D reviews/evidence/status/decision/submission policy documents.
- Read current intake and Skill boundary files read-only: `src/intake/dei_producer.py`, `src/intake/README.md`, `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`, and `src/skills/samil-kssb-precheck/SKILL.md`.
- Checked target diff scope with `git show --stat --name-only HEAD`, `git diff --name-status HEAD^..HEAD`, and `git diff --stat HEAD^..HEAD`.
- Ran `git diff --check HEAD^..HEAD` with no whitespace errors.
- Scanned for committed PDFs, DOCX, JSONL logs, package files, `.mcp.json`, `node_modules`, and `submission.zip`; none were found.
- Scanned changed 2L-4A documents for unredacted local paths, cache/sandbox paths, API key/secret/token/private-key markers; none were found.

Tests were not run because the target commit is design/docs-only and does not change code or fixtures.

## Required Fixes Before Next Step, If Any

None.

## Nonblocking Follow-Up

- Decide whether thin runner scripts will be docs-only or committed as optional/dev-local wrappers. If committed, enforce no core import, no dependency/lock impact, no user-facing CLI regression, and no automatic execution.
- Keep `DEI_VERSION = "1"` only if 2L-4B tests prove additive backward compatibility.
- Add a minimal OCR-derived quote/provenance rule to `evidence_mapping_rules.md` if OCR text becomes an accepted DEI supplement.
- Carry forward Kordoc 3.15.0 source comparison, HWPX residual table mismatch review, outline-style sample validation, possible `defusedxml` hardening, and OS-level no-egress hardening as nonblocking evidence hardening tasks.

## Recommended Next Step

Proceed to user/ChatGPT approval for Cycle 2L-4B implementation. The implementation should start with the stdlib ingest and auxiliary scanner boundary, preserve current core schema/validator/renderer/delivery behavior, and require a separate Codex implementation review before L2 is promoted beyond provisional implementation status.
