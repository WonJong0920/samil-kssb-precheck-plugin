# Codex Review - Cycle 2J Mistral OCR 4 Benchmark

## Review Overview

- Repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- Branch: `main`
- Target commit SHA: `5d2902e6146453e3a6c553ac9d12e6522ee4111e`
- Base commit SHA: `c5d22c38a6eea2622f57c334cf0f06d1b6bb9f1e`
- Actual HEAD checked: `5d2902e6146453e3a6c553ac9d12e6522ee4111e`
- Review date: 2026-07-03
- Reviewer role: Codex independent reviewer.
- Operating rules applied first: `AGENTS.md`, `docs/operating_principles.md`.
- Review purpose: verify whether `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md` safely benchmarks Mistral OCR 4 document-intelligence concepts without disrupting the existing Kordoc optional/local adapter, Gate A/B, Version Strategy, residual hardening, source-bound analysis, or submission packaging boundaries.

External public references were checked read-only:

- `https://mistral.ai/news/ocr-4/`
- `https://github.com/mistralai/cookbook/blob/main/mistral/ocr/batch_ocr.ipynb`
- `https://raw.githubusercontent.com/mistralai/cookbook/main/mistral/ocr/batch_ocr.ipynb`

## Verdict

**Verdict: PASS**

The Cycle 2J benchmark document is a safe planning supplement. It treats Mistral OCR 4 as a structural benchmark only, not as an implementation target, API integration, dependency, default feature, submission artifact, or marketplace capability. It preserves the existing 2I-3B gate structure and keeps future cloud OCR adoption behind a separate Gate C.

## Critical / Major / Minor Findings

### Critical

None.

### Major

None.

### Minor

ID: C2J-MISTRAL-MIN-01
Severity: Minor
Location: `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md:32`, `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md:68-93`
Issue: The document conservatively frames Mistral OCR as a cloud API / document-upload egress path. The public Mistral article also states that OCR 4 has enterprise self-hosting options. This does not weaken the current exclusion, but the self-host branch is not explicitly represented in the future gate language.
Impact: Low. The current document is safer than over-permissive because it blocks API/egress adoption. Future planning could otherwise conflate "Mistral public API" with every possible Mistral deployment mode.
Recommendation: If Mistral is revisited later, extend Gate C or add a sub-branch for self-hosted deployment review: deployment entitlement, license/commercial terms, model/container provenance, offline/no-egress proof, operational security, and deterministic/version controls. Do not treat self-host as automatically equivalent to the current Kordoc Gate A no-egress result.
Blocking: No.

## Whole-structure Review

PASS.

The benchmark document fits the existing product structure:

- The product remains a KSSB evidence precheck / consulting support tool, not an OCR product or compliance decision engine.
- Kordoc remains the current optional/local adapter candidate.
- Gate A no-egress, Gate B license/submission suitability, and Version Strategy confirmed are not replaced or weakened.
- Mistral OCR 4 is explicitly positioned as a structure benchmark only.
- The next step remains Codex Review -> user/ChatGPT judgment, not immediate implementation.

The document does not present Mistral as a core dependency, default feature, public marketplace feature, or submission artifact.

## Mistral Benchmark Scope Review

PASS.

The scope is appropriately constrained:

- It states that Mistral OCR 4 is not an actual adoption/execution target.
- It excludes API calls, Python/SDK installation, notebook execution, external document upload, and API-key handling.
- It separates confirmed public-link observations from unconfirmed items.
- It avoids treating benchmark numbers or confidence scores as KSSB judgment quality.

The public Mistral article supports the document's structural observations: OCR 4 discusses bounding boxes, typed block classification, inline confidence, markdown/structured outputs, API/Document AI use, Batch API, and human-in-the-loop verification uses. The public notebook supports the batch observations: JSONL-style request construction, `custom_id`, `/v1/ocr` batch job creation, job status counts, output download, and mapping results back to requests. The document correctly states that the notebook example demonstrates markdown output but not the full bbox/confidence schema.

## Kordoc / Gate A / Gate B / Version Strategy Integration Review

PASS.

The integration is coherent:

- Kordoc remains the local/offline path already tested through Gate A and Gate B.
- Mistral does not replace Kordoc's optional/local adapter plan.
- Gate A's no-egress result remains meaningful because Mistral cloud API is excluded.
- Gate B license/submission suitability remains scoped to the Kordoc v1 path.
- Version Strategy remains tied to `kordoc@3.8.2 + pdfjs-dist@4.10.x`.
- Residual hardening remains intact; Cycle 2J only adds planning concepts for future consideration.

No conflict with 2I-3B gate decisions was found.

## DEI / Evidence / Confidence / Bbox Review

PASS.

The DEI/evidence treatment is safe:

- Page/block structure and markdown are treated as intake material.
- Raw OCR and Document AI layers are used as an architectural analogy to the existing adapter/Skill split.
- Confidence is limited to consultant triage and review priority.
- Low confidence is routed toward `missing_info`, `customer_questions`, and requested materials rather than automatic negative judgment.
- Bbox, block type, and page anchors remain DEI location/type hints, not findings schema changes.
- Validator detect-only, renderer no re-judgment, Skill source-bound judgment, and human review boundaries are preserved.

This matches the project's core source-bound evidence-matching posture.

## Batch Concept Review

PASS.

The document correctly avoids turning Mistral Batch API into a cloud execution plan. It borrows only local deterministic concepts:

- stable request/document keys similar to `custom_id`,
- per-document/per-page status,
- explicit partial failure handling,
- result hashes for determinism/reproducibility.

These concepts align with Gate A determinism and RH-B1 inventory hashing. The document does not freeze a batch manifest schema or implementation spec.

## Gate C Review

PASS.

The proposed Gate C is appropriate for any future Mistral or cloud OCR adoption:

- explicit approval for document egress,
- privacy / DPA / legal / ToS review,
- API key handling outside the repo,
- cost, determinism, version, and availability review,
- local/offline-first posture,
- separation from Gate A no-egress.

Gate C does not replace Gate A; it marks cloud OCR as a different risk class. This is the correct structural distinction.

## Boundary and Artifact Safety Review

PASS.

The target diff is documentation-only:

- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/planning/cycle2j_mistral_ocr4_document_intelligence_benchmark.md`

No `src/**`, tests, schema, validator, renderer, delivery, Skill, manifest, marketplace, package/dependency file, MCP/client setting, API integration, Python notebook, raw OCR artifact, PDF, generated report, converted output, `node_modules`, lock file, API key, or `submission.zip` artifact is added in the target diff.

Focused searches found no committed package/lock files, `node_modules`, `.mcp.json`, `.app.json`, PDF, DOCX, JSONL, `submission.zip`, local absolute path, account name, API key, token, or private key. Matches for API, Python, SDK, upload, egress, dependency, and submission terms are exclusion, gate, or policy context.

Validation performed:

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --stat c5d22c38a6eea2622f57c334cf0f06d1b6bb9f1e..5d2902e6146453e3a6c553ac9d12e6522ee4111e`
- `git diff --name-status c5d22c38a6eea2622f57c334cf0f06d1b6bb9f1e..5d2902e6146453e3a6c553ac9d12e6522ee4111e`
- `git diff --check c5d22c38a6eea2622f57c334cf0f06d1b6bb9f1e..5d2902e6146453e3a6c553ac9d12e6522ee4111e`
- Required-file review for Cycle 2J benchmark, 2I-3B adapter design, Version Strategy, GatePrep, Gate A/B evidence and reviews, submission packaging policy, current status, and decision log.
- Read-only public-link check of Mistral OCR 4 announcement and Mistral OCR batch cookbook/raw notebook.
- Focused `rg` checks for boundary, artifact, credential, local path, implementation, egress, and dependency terms.

Runtime tests were not run because the target commit is documentation-only and changes no runtime code, schema, validator, renderer, delivery wrapper, or test file.

## Required Fixes Before Next Planning or Implementation-prep

None blocking.

Recommended before future Mistral/cloud OCR planning:

- Address `C2J-MISTRAL-MIN-01` by documenting how self-hosted OCR options would be gated separately from public API egress.
- Keep confidence as triage only and do not feed it into automatic KSSB judgment.
- Keep Mistral/API/Python/SDK/notebook/upload outside repo and outside the plugin unless a later Gate C cycle explicitly approves it.
- Keep Kordoc Gate A/B/Version Strategy as the current local/offline path.

## Recommended Next Step

Proceed to user/ChatGPT decision on whether Cycle 2J is only an architectural note or whether a later implementation-prep cycle should add DEI confidence, bbox hints, and local batch status/hash concepts. Do not implement Mistral API integration or cloud OCR without a separate Gate C review and approval.
