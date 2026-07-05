# Codex Review - Cycle 2L-3D HWPX/DOCX Auxiliary Structure Scanner Review

## Verdict

PASS with nonblocking follow-up.

The Cycle 2L-3D evidence is sufficient to carry `stdlib zip+xml auxiliary scanner` into L2 implementation-prep as a provisional auxiliary layer alongside the 2L-3C candidate architecture (`Kordoc + tesseract.js`). It remains review evidence only, does not implement L2/L3, does not finalize a provider, and preserves the DEI / Skill / validator / renderer / human-review boundaries.

No Critical, Major, or Minor findings were identified.

## Critical / Major / Minor Findings

Critical: 0

Major: 0

Minor: 0

## Scope and Boundary Review

The 2L-3D document stays within auxiliary scanner review evidence:

- It explicitly says it is not L2 implementation, provider finalization, or product-code addition.
- It records scanner findings as DEI candidate material and review signals, not KSSB judgment.
- It does not connect document-analysis results to audit, assurance, certification, or compliance conclusions.
- It maintains the current rule that provider/scanner outputs must not bypass the Skill, validator, renderer, or human-review path.
- Current status and decision log keep L2/L3 implementation and provider finalization prohibited until later approval and review.

The target commit is docs-only: `docs/current_status.md`, `docs/decision_log.md`, and `docs/samples/hwpx_docx_auxiliary_structure_scanner_review_2026-07-05.md`.

## stdlib zip+xml Auxiliary Scanner Review

The evidence supports recommending a stdlib zip+xml scanner as an auxiliary layer candidate:

- It directly addresses the 2L-3C follow-up around DOCX image gaps, HWPX heading gaps, and caption limitations.
- DOCX image detection is materially improved by splitting resources, relationships, and drawing instances.
- Table counts are usefully decomposed into raw tags, top-level tables, nested tables, and mismatches.
- Caption candidates based on style use are useful review signals, especially because both Kordoc and python-docx miss them in the tested path.
- The HWPX heading analysis is careful: the sample defines outline styles but does not use them in body paragraphs, so Kordoc `heading 0` is not over-labeled as a defect for this sample.
- The scanner is stdlib-only, deterministic, no-install, native-free, and has no network-code path in the described implementation model.

This result is strong enough for L2 adapter design to include a reversible auxiliary scanner boundary. The scanner should remain a cross-check / gap-signal producer, not a final semantic interpreter.

## python-docx Review

The evidence justifies excluding python-docx from the product path:

- It requires `lxml`, which brings native `.pyd` binaries and reintroduces the native class that RH-B2 has been keeping out of the core path.
- Its `inline_shapes` count undercounts the image instances compared with the stdlib scan.
- Its basic paragraph traversal misses table-cell paragraph/caption candidates unless additional traversal code is written.
- It does not support HWPX.
- The tested stdlib scanner provides equal or better signals for this review purpose with no new dependency.

python-docx may remain a local development/cross-check tool, but it should not be part of the L2 product/provider architecture without a fresh native/license/security decision.

## Other Candidate Tools / Better Implementation Approaches

The candidate-tool judgments are appropriate:

- `defusedxml` is best treated as an XML hardening candidate, not a required dependency at this evidence stage.
- direct `lxml` and `docx2python` share the native lxml concern and are not better MVP choices.
- `olefile` is outside the HWPX/DOCX auxiliary scanner scope; HWP v5 remains covered by Kordoc in the current provisional architecture.

Implementation-prep suggestion, without implementing now:

- Keep the auxiliary scanner as a narrow stdlib module with allowlisted ZIP members, namespace-aware XML parsing, deterministic sorting, bounded file/member sizes, path traversal rejection, and no raw XML/image extraction output.
- Consider `defusedxml` only if the threat model requires XML entity hardening beyond stdlib behavior; if adopted, review dependency/license and keep it optional or explicitly justified.
- Add contract tests for no raw XML persistence, deterministic output, no network imports, no findings-schema mutation, and no direct renderer/validator ingestion.

These are nonblocking prep/design recommendations, not required fixes to the evidence.

## Auxiliary Signal Model Review

The proposed signal model is suitable as a document-level auxiliary signal set, with a necessary split:

Signals that can be DEI candidate document-level material:

- `image_resource_count`
- `image_relationship_count`
- `image_instance_count`
- `table_tag_count`
- `table_top_level_count`
- `nested_table_count`
- `heading_style_candidate_count`
- `heading_recovery_candidate`
- `caption_candidate_count`
- `chart_relationship_count`

Signals that should remain review/gap routing signals:

- `image_detection_gap`
- `table_count_mismatch`
- `review_required_reason`
- provider absent-vs-auxiliary present situations such as caption candidates or image gaps

The model can be handled at the L2 adapter boundary without changing the findings schema if these signals remain upstream DEI/review material. They should route uncertain or missing extraction to `not_verifiable`, `missing_info`, and customer questions where needed, but must not become direct judgment rules.

## Safety / Dependency / Artifact Review

Safety posture is adequate for evidence and L2 prep:

- Raw XML, raw JSON, extracted images, original files, scanner scripts, venv, node_modules, package/lock files, and submission.zip were not committed.
- The only recorded preparation egress is `pip install python-docx` in a repo-external venv for comparison; the recommended stdlib path has zero install/egress.
- The target diff does not modify `src/**`, tests, schema, validator, renderer, delivery, Skill, manifest, marketplace, package, lock, `.mcp.json`, or `.app.json`.
- The scan found references to local paths, venv, node_modules, raw artifacts, `.pyd`, and submission.zip only in policy/evidence context, not actual tracked artifacts.
- No unredacted local absolute path, account name, email, phone number, token, API key, private key, or sensitive source filename was found in the changed evidence/status/decision files.

No artifact or dependency scope violation was identified.

## Next-Step Readiness

L2 implementation-prep may proceed with this provisional architecture:

- Kordoc for primary multi-format structure extraction and needs-OCR routing.
- tesseract.js for Gate D-proven scanned OCR fallback.
- stdlib zip+xml auxiliary scanner for HWPX/DOCX image/table/caption/heading cross-checks and gap signals.

This architecture should remain provisional, reversible, and bounded. L2/L3 implementation and provider finalization still require separate approval and independent review.

Nonblocking follow-ups:

- Classify the remaining HWPX table mismatch of 2.
- Test an HWPX sample that actually uses outline styles in body paragraphs.
- Decide whether `defusedxml` hardening is necessary for the eventual trust boundary.
- Carry forward 2L-3C follow-ups: Kordoc 3.15.0 source-aligned comparison and pdfjs 4.10.x pin/fail-fast posture.

None of these follow-ups block L2 implementation-prep.

## Required Fixes Before Next Step, If Any

None.

## Recommended Next Step

Proceed to user/ChatGPT decision for L2 implementation-prep. The prep cycle should design the adapter boundary, optional auxiliary signal fields, review/gap routing, and tests while keeping:

- findings schema unchanged unless a separate decision is made;
- scanner/provider outputs out of renderer/validator direct paths;
- product claims limited until implementation evidence and Codex review pass;
- all raw documents, extracted XML/images, temporary venvs, and provider artifacts outside the repo.
