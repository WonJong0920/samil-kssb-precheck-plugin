# Codex Review — Cycle 2I Baseline Analysis and Remediation Plan

## 1. Review Overview

- Repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- Branch: `main`
- Target commit: `5a7cc23beba6dbb044d2dc67aedbe4c103f6ae90`
- Actual HEAD checked: `5a7cc23beba6dbb044d2dc67aedbe4c103f6ae90`
- Review purpose: independently verify whether the Cycle 2I-0 baseline problem analysis and remediation implementation plan are sound enough to move toward Cycle 2I-1 / controlled Kordoc feasibility work.
- Reviewer role: Codex independent reviewer. No implementation, no Kordoc install, no PDF rerun, no OCR, no MCP setup.
- Review date: 2026-07-02

## 2. Reviewed Commit / Files

Required files reviewed:

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/cycle2i_baseline_execution_output_problem_analysis.md`
- `docs/planning/cycle2i_remediation_implementation_plan.md`
- `docs/workflow_usage.md`
- `docs/architecture.md`
- `src/skills/samil-kssb-precheck/SKILL.md`

Additional files / areas reviewed:

- `src/schemas/kssb_findings.schema.json`
- `src/schemas/kssb_findings_example.json`
- `src/renderers/`
- `src/validators/`
- `docs/submission_packaging_policy.md`
- `docs/reference_review.md`
- `.agents/plugins/marketplace.json`
- `src/.codex-plugin/plugin.json`
- Public Kordoc README: `https://github.com/chrisryugj/kordoc`

## 3. Verdict

**Verdict: CONDITIONAL PASS**

The baseline analysis and remediation plan are directionally sound and preserve the project boundaries. However, one repository hygiene issue found during autonomous path scanning should be corrected before the next implementation cycle: a legacy reference document still contains an actual local Windows user path.

Readiness: **조건부 준비됨**

## 4. Summary

The two Cycle 2I-0 documents correctly separate execution-stage failures from report-quality issues. They identify the main practical blockers observed in Run A / Run B: missing DOCX/HTML representative output, unseparated execution logs, local path exposure risk, weak PDF/table intake, and insufficient user-facing evidence location cues.

The remediation sequence is appropriate: fix output wiring and log/path separation first, improve report wording and evidence anchors next, then handle document intake/OCR/table fallback design. Kordoc is correctly kept as a feasibility spike, not a hard dependency.

Kordoc public README review supports the plan's premise at a high level: the project advertises CLI/MCP use, Node.js 18+, document-to-Markdown parsing across HWP/HWPX/PDF/XLS/XLSX/DOCX, PDF table reconstruction, and MCP tools such as `parse_document` / `parse_table`. The plan does not overcommit to these claims and requires license, egress, determinism, sample-quality, and mapping evidence before adoption.

## 5. Findings

### Critical

None.

### Major

ID: C2I-RP-M01  
Severity: Major  
Location: `docs/reference_review.md:8`  
Issue: A legacy reference document contains an actual local Windows user path (`C:\Users\user\Desktop\Samil KSSB Precheck Plugin`). Cycle 2I documents themselves use `[REDACTED]` or `C:/Users/<계정>/...` placeholders, but the broader repo still has a tracked account-specific path.  
Impact: This conflicts with the strengthened Cycle 2I path/privacy policy and may fail a later submission preflight scan for local absolute paths or account identifiers. It does not invalidate the Cycle 2I plan, but it is a repo hygiene blocker before implementation proceeds under the new no-local-path rule.  
Recommendation: In a follow-up documentation patch, redact the account-specific path in `docs/reference_review.md` to a neutral placeholder or remove it if no longer needed. Also consider checking legacy docs for similar local-path artifacts before packaging.  
Blocking: Yes, before the next implementation cycle under the stricter Cycle 2I local-path policy. Not blocking this review document itself.

### Minor

ID: C2I-RP-m01  
Severity: Minor  
Location: `docs/decision_log.md:1`  
Issue: The document title still says `Cycle 1 ~ 2H` even though the body now includes D39 and D40 for Cycle 2I-0 / Addendum.  
Impact: Minor traceability mismatch. The section index below the title is correct, so readers can still follow the decisions.  
Recommendation: Update the title to include Cycle 2I in the next documentation patch.  
Blocking: No.

ID: C2I-RP-m02  
Severity: Minor  
Location: `docs/planning/cycle2i_remediation_implementation_plan.md:67-75`  
Issue: The Kordoc feasibility evidence list is appropriate, but it does not explicitly require recording the exact package version / README retrieval date used for feasibility conclusions. Kordoc is an active external dependency candidate, so its public claims may change.  
Impact: Non-blocking, but later evidence could be harder to reproduce if feasibility work relies only on "public README" without a pinned observed version/date.  
Recommendation: In the later feasibility evidence template or spike instructions, record package version, command source, README retrieval date, and whether the tested artifact matches the documented public README.  
Blocking: No.

## 6. Baseline Problem Analysis Review

The baseline problem analysis is substantially accurate.

- Run A / Run B are distinguished by document type: KSSB-like report versus general sustainability report.
- Execution problems are separated from output-quality problems.
- DOCX/HTML non-generation is correctly treated as a workflow wiring/output delivery problem, not a judgment logic failure.
- The analysis correctly identifies execution-log leakage, local path exposure risk, ad hoc Node/zlib extraction, large-PDF fragility, and table/OCR limitations.
- The observed difference between Run A's more favorable evidence results and Run B's partial/unverifiable results is plausibly tied to source document structure, consistent with source-bound behavior.
- Product boundary is preserved: the analysis does not assert audit, assurance, certification, or compliance conclusions.

No Critical or Major issue was found in the baseline analysis itself.

## 7. Remediation Implementation Plan Review

The remediation plan is appropriate for the current architecture.

- 2I-1 first is justified: output wiring, log separation, path non-exposure, and representative document generation are the most immediate user-facing failures and can use the existing renderer without new dependencies.
- 2I-2 next is justified: internal code labels, missing Korean item labels, weak quote/location display, and question specificity are output quality issues after representative output exists.
- 2I-3 later is justified: PDF intake/OCR/table extraction is higher-risk and dependency-sensitive.
- 2I-3A as a separate Kordoc feasibility spike is appropriate: it avoids hard-coupling the plugin to an external tool before egress, license, determinism, performance, and mapping evidence exist.
- The plan keeps Skill-first intact: the user-facing entry remains the Skill; validator and renderer remain internal components.
- The plan does not propose schema, renderer, validator, Skill, marketplace, or manifest changes during this review cycle.

No implementation scope creep was found in the plan.

## 8. Kordoc Feasibility Plan Review

Kordoc is correctly framed as an optional intake candidate.

Public README observations used for this review:

- Kordoc describes document-to-Markdown parsing for HWP 3.x/5.x, HWPX, HWPML, PDF, XLS/XLSX, and DOCX.
- It documents AI agent integration through MCP and a `npx -y kordoc setup` flow.
- It advertises PDF table reconstruction and tools including `parse_document`, `parse_pages`, and `parse_table`.
- It lists MIT licensing for the project and third-party components in the README, but this review did not perform a code or license audit.

Plan fit:

- The plan does not install, run, or set up Kordoc.
- It explicitly requires user approval before local MCP/CLI installation.
- It forbids repo-committed `.mcp.json` / local client settings.
- It treats OCR providers as separately gated and forbidden before explicit approval.
- It requires egress/no-external-transfer review before using the tool on sensitive materials.
- It preserves fallback behavior when Kordoc is absent.

This is the right posture for the current cycle.

## 9. Document Evidence Index Review

The Document Evidence Index proposal is compatible with the current findings-first architecture.

- It is upstream of findings, not a renderer input and not a schema replacement.
- It provides evidence candidates, location signals, extraction quality, warnings, and OCR-needed flags.
- It maps cleanly to existing `evidence_anchors` concepts: `source_id`, `page_or_section`, `quote`, and `relevance_note`.
- It explicitly says the index does not create judgments.
- The proposed `kssb_candidate_area` and `evidence_confidence` fields are useful but should remain clearly non-decisional.
- Renderer no re-judgment remains intact because renderer continues to consume only findings.

No structural conflict was found.

## 10. Security / Privacy / Local Environment Review

Positive observations:

- Cycle 2I analysis redacts baseline local paths with `[REDACTED]`.
- The plan prohibits committing local paths, account names, MCP settings, tokens, and temporary paths.
- Kordoc setup, MCP setup, OCR provider use, and external egress are gated.
- `git diff HEAD~1..HEAD` shows only `docs/current_status.md`, `docs/decision_log.md`, and the new planning document changed in the target commit.
- `git ls-files` did not show tracked `submission.zip`, PDFs, generated DOCX/HTML, `.mcp.json`, or actual log files.
- Ignored local artifacts exist (`log-hooks/`, `logs/claude-code/`, `logs/codex/`, `__pycache__/`) but are not tracked.

Risk:

- A legacy tracked document contains an actual user-specific local path (`docs/reference_review.md:8`). See Major finding C2I-RP-M01.

Validation performed:

- Confirmed actual HEAD matches target SHA.
- Confirmed working tree was clean before review edits.
- Reviewed required files and related architecture/schema/renderer/validator docs/code.
- Used `git show --stat`, `git diff HEAD~1..HEAD`, `git ls-files`, and `rg` scans for forbidden artifacts and local path tokens.
- Parsed JSON files with Node built-in JSON parser: `src/schemas/kssb_findings.schema.json`, `src/schemas/kssb_findings_example.json`, `.agents/plugins/marketplace.json`, `src/.codex-plugin/plugin.json`.
- Reviewed Kordoc public README via browser only.

Validation not performed:

- `python -m json.tool` could not be run because `python.exe` was blocked in the sandbox environment. Node JSON parsing was used instead.
- No Kordoc install, `npx`, MCP setup, OCR provider, or PDF rerun was performed, per instruction.
- No validator/renderer smoke tests were run because this review is planning-focused and Python was unavailable without escalation.

## 11. Required Fixes Before Next Implementation Cycle

1. Redact or neutralize the actual local user path in `docs/reference_review.md:8`.
2. Update `docs/decision_log.md` title from `Cycle 1 ~ 2H` to a title that includes Cycle 2I.

The first item is blocking for moving into the next implementation cycle under the strengthened local-path policy. The second is non-blocking but should be bundled with the same documentation cleanup.

## 12. Recommended Next Step

Proceed only after the required documentation cleanup above:

- Start Cycle 2I-1 focused on execution wiring/output separation, representative document generation from findings, and path/log non-exposure.
- Keep Kordoc as a separately approved feasibility spike; do not install or configure it as part of 2I-1.

## 13. Final Reviewer Notes

The plan correctly identifies that the next practical bottleneck is not more judgment logic, but making the existing Skill → findings → validator → renderer contract actually produce a representative user-facing document without leaking execution internals.

Kordoc appears relevant to the intake/table problem, but the plan is appropriately cautious. It should remain a candidate until local/offline behavior, egress, license, determinism, large-PDF behavior, and evidence-anchor mapping are demonstrated.

ChatGPT / User confirmation is required before the next work cycle.
