# Codex Review - Cycle 2I-3A Kordoc Spike Evidence

## 1. Review Overview

- Repo: `https://github.com/WonJong0920/samil-kssb-precheck-plugin`
- Branch: `main`
- Target commit SHA: `b1ee21e2d555d8055cabcdac99d24212a32af78a`
- Base commit SHA: `c40956bb958d3f790e95892e6514766948b1a6e2`
- Actual HEAD checked: `b1ee21e2d555d8055cabcdac99d24212a32af78a`
- Review date: 2026-07-03
- Reviewer role: Codex independent reviewer.
- Operating rules applied first: `AGENTS.md`, `docs/operating_principles.md`.
- Review purpose: independently verify whether `docs/samples/kordoc_spike_evidence_2026-07-03.md` provides enough evidence from the local Kordoc feasibility spike to support the next decision, while preserving the optional/pluggable intake boundary.

## 2. Verdict

**Verdict: PASS**

Readiness: **준비됨**

Next-step readiness: **optional/pluggable intake adapter 설계 논의 가능**. This does not mean Kordoc should become a plugin hard dependency, bundled dependency, submission artifact, or production intake engine yet.

The evidence is sufficient to show that Kordoc has real intake-quality value over the baseline for text PDFs: table reconstruction, page/bbox/outline/page-quality signals, `needsOcr`/warning signals, deterministic repeat runs, and large-PDF stability were recorded for two non-sensitive public-report sample types. The evidence also correctly records hard-dependency blockers: Node runtime, `pdfjs-dist` peer dependency/version sensitivity, OCR/formula egress risk, transitive/native dependency license risk, and non-hardened no-egress verification.

Because those risks are explicitly identified, the safe next step is design discussion for an optional external adapter only. Actual implementation, bundling, Kordoc adoption, OCR enablement, or submission packaging inclusion still requires separate approval and evidence.

## 3. Findings: Critical / Major / Minor

### Critical

None.

### Major

None.

### Minor

ID: C2I3A-EV-MIN-01
Severity: Minor
Location: `docs/samples/kordoc_spike_evidence_2026-07-03.md:36-43`
Issue: No-egress is recorded as a positive observation, not a hardened verification. The evidence explicitly says network blocking / outbound observation was not guaranteed in the environment.
Impact: This is acceptable for adapter design discussion, but not enough for sensitive-document use, default enablement, or any claim that Kordoc parsing is verified no-egress.
Recommendation: Before implementation or any real customer/sensitive input use, rerun representative parsing under network-disabled or outbound-blocked conditions and record connection-monitor results.
Blocking: No for optional adapter design discussion. Yes before operational adoption.

ID: C2I3A-EV-MIN-02
Severity: Minor
Location: `docs/samples/kordoc_spike_evidence_2026-07-03.md:21-34`, `:89-94`
Issue: The spike found material dependency risk: PDF parsing requires a separate `pdfjs-dist` peer dependency, latest `pdfjs-dist@6.1.200` failed, `pdfjs-dist@4.10.38` succeeded, and transitive/native dependencies need license review.
Impact: This argues against hard dependency adoption and means any later adapter must pin or check compatible versions and avoid bundling until license/package implications are reviewed.
Recommendation: Treat `kordoc@3.8.2 + pdfjs-dist@4.10.x` as the observed compatible combination for design purposes only. Before implementation, document version constraints and transitive-license handling.
Blocking: No for design discussion. Yes before packaging or hard integration.

ID: C2I3A-EV-MIN-03
Severity: Minor
Location: `docs/samples/kordoc_spike_evidence_2026-07-03.md:47-53`, `:97`
Issue: The dedicated scanned/image-only sample type was not obtained, so OCR-needed behavior for a true scanned PDF remains unproven.
Impact: The value case for text-PDF/table intake remains strong, but OCR/scan handling should not be considered validated.
Recommendation: Keep OCR and scanned-PDF support outside adapter v1 scope unless a non-sensitive scanned sample is tested under the same evidence process.
Blocking: No for text-PDF adapter design discussion.

## 4. Evidence Completeness Review

PASS.

The evidence substantially follows the runbook template:

- Environment is generalized and records OS, Node/npm major versions, execution outside the repo, and local user execution.
- Reproducibility records `kordoc@3.8.2`, CLI command shape, official npm source, README/repo check date, and public README consistency.
- Dependency behavior is recorded with important negative and positive cases: base `kordoc` without `pdfjs-dist` fails for PDF; `pdfjs-dist@6.1.200` fails; `pdfjs-dist@4.10.38` succeeds.
- License records distinguish Kordoc's MIT license from unresolved transitive dependency/license implications.
- No-egress is not overstated: it is explicitly described as observed, not hard guaranteed.
- Type-by-type results capture table count, output size, timing, page/location/quality signals, determinism, and limitations.
- DEI mapping observations identify usable fields, generated-vs-human responsibilities, and accepted losses such as `bbox` lacking a findings-schema destination.
- Redaction confirmation records removal of local paths, accounts, hostnames, tokens, private file names, raw logs, PDFs, and conversion artifacts.

The evidence is not sufficient for production adoption, but it is sufficient for the narrower next decision: whether to discuss an optional/pluggable adapter design.

## 5. Intake Quality / Baseline Improvement Review

PASS.

The baseline improvement claim is reasonably supported:

- Type 1: 53-page KSSB-like text PDF produced 796 blocks, 49 reconstructed tables, page/bbox/outline/page-quality signals, `needs_ocr` candidate pages, and deterministic output over two runs.
- Type 2: 126-page / about 156 MB sustainability-report text PDF produced 199 tables, stable output over two runs, warnings, `needs_ocr` candidates, and no reported crash/memory blow-up.
- Baseline comparison describes naive pdfjs text extraction losing table columns and metadata, while Kordoc produced Markdown table structure and location/quality signals.

This is enough to establish intake value for text PDFs and table-heavy reports. It is not enough to claim end-to-end KSSB analysis quality, automatic evidence correctness, or scanned-PDF/OCR readiness.

## 6. Security / No-egress / Redaction Review

PASS with non-blocking residual risk.

The evidence is candid about security scope:

- It records that forced network blocking and outbound observation were not guaranteed.
- It records that no remote download/model fetch was observed during parsing and that egress-capable functions (`--formula-ocr`, model checks, setup, MCP server) were not used.
- It requires a later user rerun under network-disabled/firewall conditions.
- It states that local paths, accounts, hostnames, tokens, API keys, passwords, private keys, MCP/client setting paths, and identifying private file names were not exposed.

Focused searches did not reveal actual local absolute paths, account names, tokens, API keys, private keys, raw logs, PDFs, converted JSON/MD outputs, `.mcp.json`, or submission artifacts in the reviewed diff. Matches for those terms are policy, risk, placeholder, or redaction text.

## 7. License / Dependency Risk Review

PASS for design discussion; not yet sufficient for adoption.

The evidence handles license/dependency risk appropriately:

- Kordoc package/license is recorded as MIT.
- The evidence avoids treating top-level MIT as sufficient for all usage.
- Transitive/native dependencies are named as unresolved review items.
- `pdfjs-dist` version sensitivity is not hidden; it is central to the conclusion that Kordoc is not suitable as a plugin hard dependency.

Before any adapter implementation that invokes Kordoc by default, the project should record version constraints, dependency installation expectations, and transitive-license/package implications. Before any submission packaging inclusion, this must be reconciled with `docs/submission_packaging_policy.md`.

## 8. DEI / Evidence Anchor Mapping Review

PASS.

The evidence keeps Kordoc/DEI in the upstream evidence-material layer:

- `blocks[].pageNumber`, outline, text/table cells, `qualitySummary.needsOcr`, `ocrCandidatePages`, `pageQuality`, warnings, and bbox are treated as evidence-quality signals.
- `relevance_note` is explicitly not generated by Kordoc and remains Skill/human-authored.
- The evidence states that Kordoc/DEI does not create judgments, that final judgment and evidence selection remain with the Skill, and that schema is unchanged.

This avoids renderer re-judgment and avoids turning Kordoc into an automated compliance/evidence decision engine.

## 9. Adoption Boundary Review

PASS.

The conclusion is appropriate: Kordoc has demonstrated value as an optional/pluggable external intake candidate, while remaining unsuitable as a plugin core hard dependency.

The target commit changes only:

- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/samples/kordoc_spike_evidence_2026-07-03.md`

No source code, tests, schema, validator, renderer, delivery wrapper, Skill, manifest, marketplace, package manager files, `.mcp.json`, `.app.json`, raw logs, PDFs, converted outputs, generated reports, or `submission.zip` were added in the target diff.

## 10. Required Fixes Before Next Step

None before **optional/pluggable intake adapter design discussion**.

Required before implementation/adoption:

- Hard no-egress rerun with network disabled or outbound-blocked observation.
- Transitive dependency and native-binary license/package review.
- Compatible version constraint strategy for `kordoc` and `pdfjs-dist`.
- Dedicated non-sensitive scanned/image-only sample if scanned-PDF/OCR-needed behavior is in scope.
- Explicit decision that any adapter remains opt-in/local and does not change plugin core dependency or submission packaging by default.

## 11. Recommended Next Step

Proceed to ChatGPT/user discussion on an **optional/pluggable external intake adapter design**. The design should be document-only or interface-level at first: no Kordoc bundling, no hard dependency, no OCR/formula enablement, no MCP/client setting commit, and no schema/renderer/validator changes until a separate approved implementation cycle.

Validation performed:

- `git status --short --branch`
- `git rev-parse HEAD`
- `git diff --stat c40956bb958d3f790e95892e6514766948b1a6e2..b1ee21e2d555d8055cabcdac99d24212a32af78a`
- `git diff --name-only c40956bb958d3f790e95892e6514766948b1a6e2..b1ee21e2d555d8055cabcdac99d24212a32af78a`
- Reviewed required files:
  - `docs/samples/kordoc_spike_evidence_2026-07-03.md`
  - `docs/planning/cycle2i_3a_kordoc_local_spike_runbook.md`
  - `docs/reviews/codex_cycle2i_3a_kordoc_local_spike_runbook_review.md`
  - `docs/current_status.md`
  - `docs/decision_log.md`
- Focused `rg` checks for dependency files, raw artifacts, local path/secret tokens, no-egress/license/OCR/DEI/adoption-boundary wording, and changed-file scope.

Tests were not run because the target commit is evidence/status documentation only and changes no runtime code, schema, validator, renderer, delivery wrapper, or test file.
