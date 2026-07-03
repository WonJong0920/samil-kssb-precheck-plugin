# Codex Cycle 2L-2 L1 Implementation Review

## Verdict

**CONDITIONAL PASS**

Cycle 2L-2 stays within the intended L1 implementation boundary: it adds an optional intake-to-DEI producer outside plugin core, updates Skill routing guidance, adds focused tests, and does not modify schema, validator, renderer, delivery, manifest, marketplace, or dependency files. The implemented direction is sound.

However, L1 should **not** be promoted to `implemented+reviewed` until malformed intake handling is tightened. The producer currently accepts an empty intake object and returns an empty, apparently valid DEI candidate. That contradicts the 2L-1 rule and completion-report claim that parsing failure / required-key absence must fail explicitly rather than silently producing partial output.

## Critical / Major / Minor Findings

### Critical

None.

### Major

ID: C2L2-MAJ-01  
Severity: Major  
Location: `src/intake/dei_producer.py:46`, `src/intake/dei_producer.py:142`, `src/intake/dei_producer.py:146`  
Issue: The intake validation is too permissive. `_require()` rejects non-dicts and `success: false`, but it does not require `success` to be present/true or require the minimal Kordoc/intake structure expected by the L1 contract. `build_dei_candidate()` then defaults missing `blocks`, `metadata`, `qualitySummary`, `pageQuality`, `outline`, and `warnings` to empty structures. A direct probe confirmed that `build_dei_candidate({}, "doc-1")` returns a DEI object with `page_count: 0`, empty `blocks`, and empty `review_priority_hints` instead of raising `IntakeError`.  
Impact: Malformed or wrong-file intake can silently become "no evidence/no priority hints" rather than an explicit failure. That weakens the "failure explicit / no quiet partial output" rule from 2L-1 and can create false negatives in L1 routing, especially before real local Kordoc outputs are wired into 2L-3+ workflows.  
Recommendation: Before ledger promotion, define and enforce the minimal acceptable intake shape for L1. At minimum, require an explicit successful parse state and enough document structure to distinguish a valid but evidence-poor document from malformed input. Add negative tests for missing `success`, missing/non-list `blocks`, and any other fields considered required by the contract. If a scanned-only valid output can have no blocks, document that case explicitly and require `pageQuality`/`qualitySummary` signals instead.  
Blocking: Yes, for L1 `implemented+reviewed` ledger promotion and 2L-3 handoff.

### Minor

ID: C2L2-MIN-01  
Severity: Minor  
Location: `src/skills/samil-kssb-precheck/evidence_mapping_rules.md:17`, `src/skills/samil-kssb-precheck/evidence_mapping_rules.md:55`  
Issue: The new L1 routing section says location should go into findings `evidence_anchor.page_or_section`, while the earlier rule says `not_verifiable` findings have no evidence anchors and instead connect to customer questions. The intended boundary is understandable from the surrounding text, but the wording can be read as instructing the Skill to add an evidence anchor to `not_verifiable` items.  
Impact: A future Skill run could try to create an anchor for an unreadable area without a real quote, which would either fail validation or blur the "no anchor for confirmation-impossible items" convention.  
Recommendation: Clarify that unreadable/low-confidence location hints should be carried in `missing_info` and/or the related customer question/requested material; `evidence_anchor.page_or_section` should remain for actual evidence anchors on readable evidence.  
Blocking: No, but it should be cleaned up with the Major patch.

ID: C2L2-MIN-02  
Severity: Minor  
Location: `docs/decision_log.md:681`  
Issue: `git diff --check HEAD^..HEAD` reports trailing whitespace on the newly added `- **Decision**:` line.  
Impact: No behavioral impact, but it leaves the target diff with a mechanical cleanliness warning.  
Recommendation: Remove the trailing whitespace in the same follow-up patch.  
Blocking: No.

## L1 Implementation Boundary Review

PASS with the Major condition above.

The target diff is scoped to:

- `src/intake/dei_producer.py`
- `src/intake/README.md`
- `tests/test_intake_dei_producer.py`
- `src/skills/samil-kssb-precheck/SKILL.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`
- status/completion/decision docs

I found no code changes under `src/schemas`, `src/validators`, `src/renderers`, plugin manifest, marketplace, package/dependency files, or `.gitignore`. The implementation does not install or run OCR providers, does not download models, does not open native/egress paths, and does not move into L2/L3/Gate D work.

The small internal `_main()` in `dei_producer.py` is documented as an internal/debug conversion entrypoint and does not appear in the Skill as the user-facing workflow. It does not execute OCR or external tools. This does not by itself create a Python CLI regression, provided the Skill remains the user entrypoint and docs keep the current wording.

## DEI Producer Review

CONDITIONAL PASS.

Positive observations:

- The module uses only the Python standard library.
- It does not import validator, renderer, delivery, schema, Kordoc, Node, OCR, network, or subprocess modules.
- It produces a DEI-candidate dict rather than findings.
- It does not create `judgment_code`, `judgment_label`, `missing_info`, `customer_questions`, recommendations, or report-ready findings fields.
- It preserves paragraph text and table cells from the input rather than synthesizing KSSB conclusions.
- It separates DEI-level bbox hints from findings-side page/section hints.
- It is deterministic for the tested input.

The blocking weakness is input validation. The current defaults make malformed intake indistinguishable from a valid empty/poor-quality document unless downstream code adds its own checks. That is the only issue preventing L1 ledger promotion.

## Skill Routing Review

PASS with Minor C2L2-MIN-01.

`SKILL.md` and `evidence_mapping_rules.md` preserve the intended boundaries:

- Optional intake/DEI is described as core-outside and source material only.
- OCR text extraction and chart/table/figure structure classification are explicitly not current functionality.
- Low-confidence, skipped-image, or OCR-needed regions route to the existing `not_verifiable + missing_info + customer_questions` path.
- Priority/quality signals are triage hints, not judgments.
- Product boundary and audit/certification/compliance replacement disclaimers remain intact.

The only wording risk is the location-hint ambiguity around `evidence_anchor.page_or_section` for `not_verifiable` items.

## Test Coverage Review

CONDITIONAL PASS.

Executed tests:

- `python tests/test_intake_dei_producer.py` -> 14/14 PASS
- `python tests/test_findings_validator.py` -> 26/26 PASS
- `python tests/smoke_test_renderer.py` -> 22/22 PASS
- `python tests/test_delivery_wiring.py` -> 33/33 PASS

Initial sandboxed Python execution failed with a local `python.exe` access restriction, so I reran the same tests through the approved execution path. No new tracked files were left in the working tree.

The new intake test covers determinism, judgment-field absence, source text preservation, table-cell preservation, priority hints, bbox separation, parse failure, source-id failure, and core import isolation. It does not cover malformed/missing intake structure beyond `success: false` and missing `source_id`; this is the coverage gap behind C2L2-MAJ-01.

## Artifact and Scope Safety Review

PASS with Minor C2L2-MIN-02.

Checks performed:

- `git rev-parse HEAD` matched `045e617217df8b5740eba08aa5d5b21386d89527`.
- `git show --stat --name-only HEAD` and `git diff --name-status HEAD^..HEAD` matched the reported 2L-2 scope.
- `git diff --name-only HEAD^..HEAD -- src/schemas src/validators src/renderers src/.codex-plugin .agents .gitignore package.json package-lock.json pnpm-lock.yaml yarn.lock .mcp.json .app.json` returned no changed files.
- Repository scan found no tracked `submission.zip`, `.mcp.json`, `.app.json`, package/lock file, PDF, DOCX, JSONL, notebook, or `node_modules` artifact.
- Sensitive/path scan found no unredacted local path, account name, API key, token, private key, or raw artifact exposure in the target implementation files; matches were policy/history/disclaimer contexts.
- `git status --short --branch` was clean after test execution.

`git diff --check HEAD^..HEAD` reported one trailing-whitespace issue in `docs/decision_log.md:681`.

## Codex Independent Risk Review

The implementation is not too broad: it does not cross into Gate D, L2, L3, OCR, native, or egress work. It is also not too narrow for L1: it provides a real, testable DEI producer and Skill routing guidance for the L1 fallback story.

The only blocking risk is silent acceptance of malformed intake. If left unfixed, L1 could be marked reviewed even though the producer can convert the wrong shape of input into a clean-looking empty DEI. That is exactly the kind of quiet partial output the preceding design tried to avoid.

No current evidence suggests schema evolution is necessary for L1. The schema-free path remains viable if the producer fails fast on malformed inputs and keeps DEI as upstream material rather than renderer/validator input.

## Required Fixes Before L1 Ledger Promotion

1. Fix C2L2-MAJ-01 by enforcing a minimal intake contract and adding negative tests for malformed/missing intake structure.
2. Re-run at least the intake test plus existing validator/renderer/delivery regression tests.
3. Record the fix in a patch completion note and get a Codex patch review before changing L1 to `implemented+reviewed`.

C2L2-MIN-01 and C2L2-MIN-02 can be cleaned up in the same patch; they are not independently blocking.

## Recommended Next Step

Prepare a narrow Cycle 2L-2 patch that only tightens DEI producer input validation, adds the missing negative tests, clarifies the not-verifiable location-hint wording, and removes the trailing whitespace. After a passing patch review, L1 can be promoted to `implemented+reviewed` and the project can proceed to Cycle 2L-3 Gate D preparation/execution.
