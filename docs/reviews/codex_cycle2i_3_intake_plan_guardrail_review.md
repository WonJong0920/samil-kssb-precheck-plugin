# Codex Review - Cycle 2I-3 Intake Plan / Minimal Guardrail

## 1. Review Overview

- Repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- Branch: `main`
- Target commit SHA: `f184764fef6cfeefbaea0f7a47dbd26175b931cd`
- Base commit SHA: `999b9f3564fd1816db6dc3e511f80babfc4fda4d`
- Actual HEAD checked: `f184764fef6cfeefbaea0f7a47dbd26175b931cd`
- Review date: 2026-07-02
- Reviewer role: Codex independent reviewer.
- Operating rules applied first: `AGENTS.md`, `docs/operating_principles.md`.
- Review purpose: verify whether Cycle 2I-3 correctly separates document-intake/evidence-quality planning from implementation, keeps DEI as an upstream design concept, limits Kordoc/OCR/PDF work to later feasibility, and implements only the minimal validator path-exposure guardrail.

## 2. Verdict

**Verdict: PASS**

Readiness: **준비됨**

Cycle 2I-3 satisfies its stated goal. The planning document correctly frames PDF/table/image/scanned-document quality as an upstream intake problem, keeps Document Evidence Index as a non-schema design concept, and defers Kordoc/OCR/PDF execution to 2I-3A. The code change is narrowly limited to extending the validator's existing detect-only path-exposure pattern list. Renderer, delivery, schema, manifest, marketplace, and Skill files are unchanged.

2I-3A feasibility discussion can proceed.

## 3. Findings: Critical / Major / Minor

### Critical

None.

### Major

None.

### Minor

ID: C2I3-MIN-01  
Severity: Minor  
Location: `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md:7`, `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md:130`  
Issue: The planning document preface still says "이번 push는 계획 문서(설계)만 포함" and that the minimal validator guardrail is "검토 후 착수 대기(미구현)", while §11 now says the guardrail is implemented and points to the completion report.  
Impact: The implementation and status documents are clear, but this stale preface can confuse readers about whether the target commit is planning-only or planning plus guardrail implementation.  
Recommendation: In the next documentation cleanup, update the preface to describe the current state as "initially planning-only; later guardrail implemented" or remove the stale push-specific sentence.  
Blocking: No. `docs/current_status.md`, `docs/decision_log.md` D43/D44, and the completion report correctly distinguish the planning step from the subsequent minimal guardrail implementation.

## 4. Planning Scope Review

PASS.

The plan separates the remaining issue into the right layers:

- Intake/evidence quality: PDF text extraction, table reconstruction, image/scanned documents, page/section fidelity, and quote authenticity are framed as upstream intake or human-review problems.
- Validator: structure, source-bound contract checks, prohibited terms, and local/internal path exposure are detect-only preflight concerns.
- Renderer/delivery: no rewriting of findings body content; renderer stays no-rejudgment and delivery stays user-summary/log separation.

Document Evidence Index is appropriately kept as a planning concept:

- `docs/planning/cycle2i_3_document_intake_evidence_quality_plan.md:44-75` defines DEI as upstream material, not renderer input.
- It explicitly says findings schema is not changed and DEI must not create judgments.
- The proposed mapping to `evidence_anchor` is conceptual, not a code/schema commitment.

Kordoc/OCR/PDF work is also properly deferred:

- The plan states no Kordoc install, MCP setup, npx/npm/pip, OCR provider, external vision call, PDF rerun, intake engine implementation, or submission packaging is included.
- Kordoc remains a 2I-3A feasibility candidate subject to user approval, local/offline behavior, license review, reproducibility evidence, and pluggable/non-hard-dependency constraints.

## 5. Minimal Validator Guardrail Review

PASS.

The validator change is minimal and detect-only:

- `src/validators/kssb_findings_validator.py:81-94` extends `_PATH_PATTERNS` only.
- Existing traversal remains unchanged: `_walk_strings()` walks all string leaves, and `_check_prohibited_and_paths()` appends `Issue("error", "path.internal_exposure", ...)` without mutating findings.
- `validate_findings()` continues to return only a list of issues and keeps its detect-only contract.

The new patterns are generally reasonable for their purpose:

- `/home/` for POSIX user-home paths.
- `/var/folders/` for macOS temp paths.
- `[\\/]Temp[\\/]` for Windows-style temp directories outside AppData.
- `%TEMP%`, `%TMP%`, `%USERPROFILE%`, `%APPDATA%`, `%LOCALAPPDATA%` for Windows env-var path references.

Residual non-blocking risk: `/home/` is a broad substring heuristic and could theoretically flag a public URL path containing `/home/`. The schema's `source_documents` object does not define a URL field, and the valid example remains clean, so this is acceptable for now. If false positives appear during 2I-3A intake testing, make the pattern context-aware rather than removing the guardrail.

Renderer/delivery/schema boundaries are preserved. `git diff --name-only ... -- src/renderers src/schemas .agents src/.codex-plugin src/skills` returned no files.

## 6. Test Coverage Review

Performed:

- `git status --short` -> clean before review document creation.
- `git diff --stat 999b9f3564fd1816db6dc3e511f80babfc4fda4d..f184764fef6cfeefbaea0f7a47dbd26175b931cd`
- `python src/validators/kssb_findings_validator.py src/schemas/kssb_findings_example.json` with `PYTHONIOENCODING=utf-8` -> `error 0`, `warning 0`, `info 1` (`jsonschema` optional check skipped because not installed).
- `python tests/test_findings_validator.py` -> 26/26 PASS.
- `python tests/smoke_test_renderer.py` -> 22/22 PASS.
- `python tests/test_delivery_wiring.py` -> 33/33 PASS.
- Tracked-file scan found no `submission.zip`, PDF, generated DOCX/HTML/Markdown report artifact, `.mcp.json`, `.app.json`, or raw log artifact.
- Focused `rg` checks reviewed stale plan wording, forbidden-scope wording, Kordoc/OCR/PDF boundaries, and validator/test locations.

Not performed:

- `jsonschema` full validation was not performed because `jsonschema` is not installed and no dependency installation is allowed.
- Kordoc install, MCP setup, OCR provider use, actual PDF rerun, sample-report analysis, and `submission.zip` generation were intentionally not performed.

Coverage assessment:

`tests/test_findings_validator.py:146-174` covers `/home/<user>/`, `/var/folders/`, `%TEMP%`, `%USERPROFILE%`, `\Temp\`, valid-example no-false-positive behavior, and detect-only immutability on path-containing findings. Combined with existing path/prohibited/structure tests and unchanged renderer/delivery smoke tests, this is sufficient for a minimal guardrail review.

## 7. Boundary / Risk Review

PASS.

- Detect-only: preserved. The validator returns issues and does not change findings.
- Renderer no-rejudgment: preserved because renderer files were not changed.
- Delivery output separation: preserved because delivery files were not changed and delivery tests still pass.
- Schema boundary: preserved. DEI is not introduced as schema/code.
- Skill-first/product boundary: preserved. No Python CLI is promoted as the user-facing entrypoint; no audit/certification/compliance replacement language is introduced.
- Forbidden scope: no Kordoc install, MCP setup, OCR provider, PDF rerun, intake engine, submission.zip, manifest/marketplace change, or generated report artifact is included.

Remaining risks for 2I-3A:

- Substring path scanning is heuristic and cannot catch every encoded or obfuscated path.
- Path guardrail detects findings contamination after it happens; preventing path entry at ingestion remains an intake-layer task.
- Quote/page/table/scan authenticity remains outside validator capability and must be handled by intake design plus human review.

## 8. Required Fixes Before 2I-3A

None.

The stale planning preface should be cleaned up eventually, but it does not block 2I-3A feasibility discussion because the completion report, current status, and decision log accurately record the implemented guardrail.

## 9. Recommended Next Step

Proceed to Cycle 2I-3A discussion after ChatGPT/user confirmation.

Recommended focus: controlled Kordoc feasibility planning under explicit user approval, local/offline and license checks, sample-type reproducibility, no repo-committed MCP/client settings, and DEI-to-findings mapping evidence that improves quote/location quality without becoming an automated judgment layer.

ChatGPT / User confirmation is required before the next work cycle.
