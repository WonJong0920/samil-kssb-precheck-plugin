# Codex Review - Cycle 2I-3B Optional Intake Adapter Design

## 1. Review Overview

- Repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- Branch: `main`
- Target commit SHA: `8121413cd2ebe6675232ad93484d2b0c3cca3610`
- Base commit SHA: `3fd0f92f666aefadd33843ff9cef4b86aa2f6fbb`
- Actual HEAD checked: `8121413cd2ebe6675232ad93484d2b0c3cca3610`
- Review date: 2026-07-03
- Reviewer role: Codex independent reviewer.
- Operating rules applied first: `AGENTS.md`, `docs/operating_principles.md`.
- Review purpose: verify whether `docs/planning/cycle2i_3b_optional_intake_adapter_design.md` safely translates the Kordoc spike evidence into an optional/pluggable external intake adapter design without crossing into implementation, dependency adoption, OCR, MCP setup, or plugin-core coupling.

## 2. Verdict

**Verdict: PASS**

Readiness: **준비됨**

Next-step readiness: **다음 gate 착수 또는 구현 전 준비 논의 가능**. This means Gate A/B/version-strategy preparation may proceed. It does not mean implementation, bundling, Kordoc default enablement, OCR/formula enablement, schema adoption, or submission packaging inclusion is approved.

The design correctly keeps Kordoc outside plugin core as an external preprocessing implementation behind an adapter-interface contract. It protects Skill-first, validator detect-only, renderer no-rejudgment, delivery separation, source-bound, and human-review boundaries. It also converts the three 2I-3A evidence-review minors into explicit implementation gates: hard no-egress verification, transitive/native license review, version constraints, and scanned/OCR exclusion unless separately evidenced.

## 3. Findings: Critical / Major / Minor

### Critical

None.

### Major

None.

### Minor

None.

## 4. Design Boundary Review

PASS.

The core architectural decision is sound:

- `docs/planning/cycle2i_3b_optional_intake_adapter_design.md:25-36` defines Kordoc as one replaceable implementation behind an external intake adapter contract, not a runtime dependency.
- `:38-50` separates External Intake Adapter, DEI, Skill, validator, renderer, and delivery responsibilities.
- `:49-50` states that adapter output does not feed renderer/delivery/validator directly and that core must work without Kordoc, Node, or pdfjs.

This is the right response to the 2I-3A evidence: Kordoc showed intake value, but runtime, version, egress, and license risks remain too high for core coupling.

## 5. Adapter Interface Review

PASS.

The interface is intentionally high-level and implementation-free:

- Input is local document paths only, with remote URL/cloud fetch forbidden.
- Output is normalized DEI-candidate JSON, not findings and not a renderer input.
- The output contract lists location, block, text/table, quality, warning, OCR-need, candidate-area, confidence, and reviewer-note material.
- Failure behavior is explicit: parsing failure, version mismatch, or egress risk must fail fast and trigger fallback rather than silently producing partial low-quality material.

This is enough for next gate/design work while avoiding premature schema/code commitments.

## 6. DEI / Evidence Anchor Mapping Review

PASS.

The DEI -> `evidence_anchor` mapping preserves the no-judgment boundary:

- `blocks[].pageNumber` and outline feed `page_or_section`.
- Text/table cells feed `quote`.
- Source file maps through `source_documents` to `source_id`.
- Quality and `needsOcr` signals support missing-info/customer-question routing.
- `relevance_note` remains Skill/human authored.
- bbox loss is acknowledged as an acceptable compression into page/section location.

The design explicitly keeps schema unchanged and treats `kssb_candidate_area` / `evidence_confidence` as material signals only. This prevents the adapter from becoming an automated judgment layer.

## 7. Gate Review: no-egress / license / version constraints

PASS.

The implementation gates are sufficient and trace back to the evidence review:

- Gate A requires network-disabled or outbound-blocked parsing rerun and evidence before sensitive use, default enablement, or any no-egress claim.
- Gate B requires transitive/native dependency license review and submission-packaging alignment before bundling/default calling.
- The version strategy records the observed compatible combination `kordoc@3.8.2 + pdfjs-dist@4.10.x`, forbids automatic latest upgrades, and requires fail-fast behavior for unverified versions.

These gates are appropriately blocking for implementation/adoption, while still allowing gate-preparation discussion.

## 8. v1 Scope Review: OCR / formula / scanned-PDF exclusion

PASS.

The v1 exclusion is appropriate. The evidence did not validate a true scanned/image-only sample, and OCR/formula features have egress/model-download risk. The design therefore limits v1 to text-PDF/table intake and consumes `needs_ocr` / `ocrCandidatePages` only as signals for "확인 불가 -> 요청자료".

This protects source-bound analysis and avoids treating OCR as already approved or validated.

## 9. Fallback / Human Review Boundary Review

PASS.

The fallback path is aligned with existing project principles:

- Adapter absent, parse failure, version mismatch, or egress risk returns to the current limited-text / missing-info / customer-question flow.
- Low-confidence table/numeric material is not promoted to quantitative evidence.
- Human review remains responsible for final interpretation and evidence selection.
- Core continues to operate without the adapter.

This keeps Kordoc as optional evidence material rather than a compliance, audit, certification, or judgment engine.

## 10. Scope / Artifact Safety Review

PASS.

The target diff changes only documentation:

- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`

No source code, tests, schema, validator, renderer, delivery wrapper, Skill, manifest, marketplace, package/dependency files, `.mcp.json`, `.app.json`, client setting, raw log, PDF, converted JSON/MD output, generated report, or `submission.zip` was added in the target diff.

Focused searches found no actual local absolute path, account name, company-identifying sample filename, token, API key, private key, or secret in the new design/status/decision text. Matches for Kordoc installation, MCP, OCR, PDF rerun, no-egress, license, dependency, and path terms are prohibition, gate, historical, or policy context.

Tests were not run because this commit is documentation-only and changes no runtime code, schema, validator, renderer, delivery wrapper, or test file.

Validation performed:

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --stat 3fd0f92f666aefadd33843ff9cef4b86aa2f6fbb..8121413cd2ebe6675232ad93484d2b0c3cca3610`
- `git diff --name-only 3fd0f92f666aefadd33843ff9cef4b86aa2f6fbb..8121413cd2ebe6675232ad93484d2b0c3cca3610`
- `git diff --check 3fd0f92f666aefadd33843ff9cef4b86aa2f6fbb..8121413cd2ebe6675232ad93484d2b0c3cca3610`
- Reviewed required files:
  - `docs/planning/cycle2i_3b_optional_intake_adapter_design.md`
  - `docs/reviews/codex_cycle2i_3a_kordoc_spike_evidence_review.md`
  - `docs/samples/kordoc_spike_evidence_2026-07-03.md`
  - `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md`
  - `docs/current_status.md`
  - `docs/decision_log.md`
- Focused `rg` checks for dependency/package files, raw artifacts, secrets/local paths, Kordoc install/MCP/OCR/PDF-rerun wording, adapter boundaries, gates, fallback, and no-rejudgment terms.

## 11. Required Fixes Before Next Step

None before **gate preparation / implementation-prep discussion**.

Required before implementation:

- Complete and record Gate A hard no-egress rerun.
- Complete and record Gate B transitive/native license review.
- Freeze a version-constraint and compatibility-check strategy for `kordoc` and `pdfjs-dist`.
- Keep OCR/formula/scanned-PDF outside v1 unless separately approved and evidenced.
- Confirm opt-in/local-only adapter posture and no default package/submission inclusion.

## 12. Recommended Next Step

Proceed to ChatGPT/user discussion on Gate A/B/version-strategy preparation. If those gates pass, open a separate approved implementation cycle for a minimal opt-in external adapter contract. The next implementation cycle should still avoid core hard dependency, default Kordoc bundling, OCR/formula enablement, MCP/client setting commits, and renderer/validator/delivery responsibility changes.
