# Codex Review - Cycle 2K OCR / Scanned PDF / Image Analysis Capability Plan

## Review Overview

- Repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- Branch: `main`
- Target commit SHA: `29379faec3ea709fe2c8b16c35d5430acd745dfc`
- Base commit SHA: `6bfdb29175a61131128e4620a28bf8ca37dca1d3`
- Actual HEAD checked: `29379faec3ea709fe2c8b16c35d5430acd745dfc`
- Review date: 2026-07-03
- Reviewer role: Codex independent reviewer.
- Operating rules applied first: `AGENTS.md`, `docs/operating_principles.md`.
- Review purpose: verify whether `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md` safely reflects the OCR / scanned PDF / image analysis submission goal without conflicting with the existing Kordoc, Mistral, Gate A/B, and Version Strategy decisions.

## Verdict

**Verdict: CONDITIONAL PASS**

The Cycle 2K plan is directionally sound and remains a planning-only document. It preserves the existing Kordoc optional/local boundary, keeps Mistral OCR4 as a structure benchmark rather than an adopted API path, separates local OCR from cloud/self-host OCR through Gate D / Gate C / Gate C-SH, and avoids introducing code, dependencies, OCR execution, PDFs, raw logs, or generated artifacts.

The condition is that the submission scope language should be tightened before implementation-prep. The current document still frames **L0 + L1** as the submission MVP and **L2/L3** as later gate-backed extension. That is safe, but it is too conservative for the latest stated submission intent. The plan should explicitly distinguish:

- submission minimum / fallback: **L0 + L1**
- submission target if Gate D passes: **L0 + L1 + L2 + L3**
- later or separately gated scope: **L4 only after Gate C / Gate C-SH**

This is a documentation alignment issue, not an implementation failure.

## Critical / Major / Minor Findings

### Critical

None.

### Major

ID: C2K-MAJ-01  
Severity: Major  
Location: `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md:82-86`, `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md:107`  
Issue: The plan says the submission MVP can include L0 + L1 and describes L2/L3 as gate-backed follow-up expansion. That preserves safety, but it does not clearly encode the latest submission interpretation that L0 + L1 is the minimum/fallback while L2 + L3 should be treated as the submission target if Gate D passes.  
Impact: The next implementation-prep cycle could under-scope the OCR/scanned/image story and implement only detection/routing even when the intended target is to pursue local OCR and structure-candidate handling under Gate D. Conversely, README/SKILL/package wording could become ambiguous about whether L2/L3 are target implementation work or merely a future roadmap.  
Recommendation: Before implementation-prep, revise the plan/status language to make the three-tier contract explicit: minimum/fallback = L0 + L1, target = L0 + L1 + L2 + L3 after Gate D evidence, and L4 = later Gate C/C-SH scope. Keep the existing anti-overclaim rule that only implemented levels may be described as current product capability.  
Blocking: Yes, before implementation-prep scope selection; no, for continuing planning review.

### Minor

None.

## Whole-Structure Review

The whole structure is coherent:

- L0 remains the already validated text-PDF path using `kordoc@3.8.2 + pdfjs-dist@4.10.38`.
- L1 uses existing Kordoc signals for detection/routing and does not require OCR execution or a new provider gate.
- L2 introduces local OCR only behind Gate D.
- L3 adds image/chart/table structure candidate classification only as a human-review routing signal, not an automated KSSB judgment layer.
- L4 is explicitly separated into cloud and self-host paths through Gate C and Gate C-SH.

The plan does not weaken validator detect-only, renderer no re-judgment, delivery output separation, source-bound analysis, or human review boundaries. It also does not modify the earlier Cycle 2J Mistral benchmark document; it uses the new Cycle 2K document as an additive clarification, which is appropriate.

## MVP Minimum / Target / Fallback Scope Review

Conditionally aligned.

The plan correctly says L0 + L1 is a defensible MVP/fallback because it can handle scanned/image-heavy material by identifying pages, locations, quality signals, and review needs without claiming OCR or image understanding. However, the current phrasing does not yet make the latest target clear enough:

- **Minimum / fallback:** L0 + L1 is appropriate.
- **Target:** L0 + L1 + L2 + L3 should be stated as the intended submission target if Gate D passes and implementation evidence supports it.
- **Not current capability:** L2/L3 must not be described as implemented until they actually are.
- **Later scope:** L4 should remain Gate C/C-SH only.

This is the one condition for the review.

## Capability Ladder L0~L4 Integration Review

PASS with the Major scoping note above.

The ladder is technically and procedurally well integrated:

- L0 anchors the validated baseline and inherits Gate A/B/Version Strategy.
- L1 builds only on already observed document-quality and block-location signals.
- L2 introduces a new provider risk surface and routes it to Gate D.
- L3 is constrained to structure/candidate signals and prohibits chart numeric inference, image semantic inference, and KSSB sufficiency estimation.
- L4 is separated into cloud and self-host gates and does not inherit Gate A by assumption.

This is a good decomposition because each level adds one risk surface at a time.

## Kordoc Role and Gate D Review

PASS.

The plan accurately redefines Kordoc as an OCR-needed detection, page-quality, block/bbox/table/image extraction, and possible orchestration candidate, not as an OCR engine. That matches the earlier spike evidence and Version Strategy boundary.

Gate D is also appropriate:

- explicit user approval
- model/tool preparation egress separated from parsing no-egress
- Gate B re-review for native/LGPL dependencies
- determinism and reproducibility evidence
- non-sensitive scanned sample coverage

This avoids treating local OCR as a free extension of the already-passed text-PDF path.

## Mistral Benchmark / Gate C / Gate C-SH Review

PASS.

The Mistral OCR4 material is used as a structure benchmark only. The plan does not introduce Mistral API, SDK, notebook, upload, or cloud execution. It extracts useful design ideas such as typed blocks, bbox, confidence, raw OCR versus document intelligence separation, batch status, and human-in-the-loop handling.

Gate C remains the correct cloud OCR egress gate. Gate C-SH properly resolves the prior self-host ambiguity by requiring separate proof for deployment entitlement, licensing, provenance, offline/no-egress behavior, operational security, and deterministic version controls. Self-host is not treated as automatically equivalent to local no-egress Kordoc parsing.

## DEI / Evidence / Confidence / Bbox / Human-Review Boundary Review

PASS.

The plan keeps OCR/image outputs as DEI candidates and review signals, not as direct findings or renderer/validator inputs. It also keeps confidence as prioritization metadata rather than a judgment score. Low-confidence or unreadable regions route to `missing_info`, `customer_questions`, and requested materials.

Important prohibited moves are stated clearly:

- no chart numeric inference
- no image semantic inference
- no KSSB sufficiency estimation from visual content
- no unsupported evidence promotion
- no automatic compliance, audit, certification, or assurance conclusion

This remains source-bound and human-review-first.

## Submission and Artifact Safety Review

PASS.

The target diff is document-only:

- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/planning/cycle2k_document_intake_ocr_scanned_pdf_image_capability_plan.md`

No `src/**`, tests, schema, validator, renderer, delivery, Skill, manifest, marketplace, dependency/package file, MCP/app setting, PDF, DOCX/HTML generated report, raw log, converted artifact, `node_modules`, or `submission.zip` artifact was added.

Validation performed:

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --stat 6bfdb29175a61131128e4620a28bf8ca37dca1d3..29379faec3ea709fe2c8b16c35d5430acd745dfc`
- `git diff --name-status 6bfdb29175a61131128e4620a28bf8ca37dca1d3..29379faec3ea709fe2c8b16c35d5430acd745dfc`
- `git diff --check 6bfdb29175a61131128e4620a28bf8ca37dca1d3..29379faec3ea709fe2c8b16c35d5430acd745dfc`
- Targeted `rg` checks for changed runtime paths, dependency artifacts, submission artifacts, local paths, secrets, and boundary language.
- Required-file review for the Cycle 2K plan, Cycle 2J benchmark/review, Kordoc adapter design, Gate A/B evidence and reviews, Version Strategy, submission policy, current status, and decision log.

Runtime tests were not run because the target commit is planning/status documentation only and changes no runtime code, schema, validator, renderer, delivery wrapper, or test file.

## Required Fixes Before Implementation-Prep

1. Update the Cycle 2K plan or a follow-up clarification so the submission scope is unambiguous:
   - minimum/fallback = L0 + L1
   - target = L0 + L1 + L2 + L3 if Gate D passes
   - L4 = Gate C/C-SH later scope
2. Keep README/SKILL/user-facing wording tied only to implemented and verified levels.
3. Before L2/L3 implementation, require Gate D evidence and an explicit implementation-prep approval.
4. Preserve the existing Gate A/B/Version Strategy and optional/local external adapter posture.

## Recommended Next Step

Address `C2K-MAJ-01` with a short documentation clarification, then proceed to implementation-prep discussion for L1 and, if approved, Gate D preparation for L2/L3. Do not present OCR or image analysis as current working capability until the relevant levels are implemented and independently reviewed.
