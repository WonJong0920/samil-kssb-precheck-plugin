# Codex Cycle 2N-1 Runner / Provider UX Design Review

## Verdict

**CONDITIONAL PASS**

The Cycle 2N-0B / 2N-0B-A design is directionally sound and compatible with the existing plugin boundaries. It keeps the user-facing entrypoint as the Skill, keeps provider execution outside the plugin core, separates preparation egress from execution no-egress, preserves source-bound and human-review limits, and avoids claiming built-in OCR support or final provider selection.

However, full Cycle 2N-2 implementation should not start until the user-facing decision gates and a few implementation-entry checks are closed. The design itself identifies these as preconditions; this review treats them as required before 2N-2 unless the next implementation is explicitly narrowed to a smaller slice, such as HWP-only runner UX without OCR rasterization or portable Node.

## Reviewed Scope

- Target HEAD after `git pull origin main`: `e6a45c0db8a733d59a0314b0da4badd84877ac84`
- Primary documents:
  - `docs/planning/cycle2n_0a_runner_provider_blindspot_pass.md`
  - `docs/planning/cycle2n_0b_runner_provider_ux_design.md`
  - `docs/reviews/codex_cycle2m_6_remediation_review.md`
  - `docs/current_status.md`
  - `docs/decision_log.md`
  - `docs/submission_packaging_policy.md`
- Boundary files:
  - `src/skills/samil-kssb-precheck/SKILL.md`
  - `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`
  - `src/intake/README.md`
  - `src/intake/dei_producer.py`
  - `src/intake/aux_structure_scanner.py`
  - `src/validators/kssb_findings_validator.py`
  - `src/renderers/kssb_report_delivery.py`
- Additional context:
  - `docs/planning/cycle2l_4a_l2_adapter_boundary_design.md`
  - `docs/reviews/codex_cycle2l_4a_l2_adapter_boundary_design_review.md`
  - `docs/reviews/codex_cycle2l_3b_gate_d_evidence_review.md`
  - `docs/reviews/codex_cycle2l_3c_provider_comparison_review.md`

## Design Assessment

The design correctly moves from "runner forbidden" to "unapproved runner execution forbidden." This is compatible with prior Codex reviews if the runner remains opt-in, local, isolated from plugin core, and gated by explicit user approval before preparation or execution.

The design also correctly separates:

- HWP assisted path: Kordoc-only, lower risk, no OCR model/rasterizer requirement.
- OCR assisted path: Kordoc intake first, then rasterize only `needsOcr` pages, then tesseract.js OCR, then `ocr_text.json` ingestion.
- User-facing report: no provider names, raw paths, English internal statuses, or overclaiming.
- Internal evidence/provenance: provider/version/hash/no-egress details retained for reproducibility.

The strongest design choices are the repo-external tool-cache, no root `package.json`, `--omit=optional`, version pin/fail-fast posture, Python canonical hash injection, and `no_egress_verified=true` only when the Node hook actually ran.

## Boundary / Operating Principle Compatibility

The design remains Skill-first. The Skill may guide and mediate approval, but the runner does not become the user-facing entrypoint and must not bypass findings, validator, renderer, delivery, or human review.

The wording "사용자 승인 하의 로컬 보조 실행" is safer than "OCR 지원." It is still a capability claim, so product/README/SKILL wording must continue to say plugin core does not execute providers and the assisted path is opt-in local execution.

No current source file implements runner/provider execution. Current repo-side ingest still only consumes already-produced artifacts. That matches the 2L-5 ledger: L2 is partially implemented, with repo-side ingest boundary implemented+reviewed and provider execution/final selection pending.

## Security / No-Egress / Provenance Assessment

The preparation egress versus execution no-egress split is appropriate and inherited from Gate A/D. The proposed nethook rewrite is necessary because the Gate evidence hook is not currently committed.

`no_egress_verified` policy is correct: true only for executions actually covered by the hook. Running without the hook should produce false or fail the evidence mode, not silently claim no-egress.

Python-side `canonical_ocr_output_sha256()` injection is the safer design. It preserves the reviewed hash contract and avoids cross-language JSON canonicalization drift. This does not weaken integrity as long as the helper writes the hash after all OCR pages and page-level hashes are present, and tests cover stale-hash rejection.

Provenance path exclusion is correct. Tool-cache paths should stay in internal approval/prep logs only and must not enter findings, DEI fields consumed by Skill text, user summaries, or rendered reports.

## Tool-Cache / Package / Submission Assessment

The repo-external tool-cache is compatible with submission policy if:

- no generated tool-cache content is committed or bundled by default;
- runner scripts, if committed, are source-only and do not create package/lock files in repo;
- intermediate artifacts are forced to an explicit `--out-dir`, preferably outside the repo;
- `.gitignore` receives defensive patterns for `*.intake.json`, `*.ocr_text.json`, and `*.aux_signals.json` during implementation.

The no-root-`package.json` strategy is appropriate. `npm --prefix` under versioned tool-cache directories plus `--omit=optional` is the right way to reduce native dependency re-entry.

## Portable Node Assessment

Portable Node option B is plausible but not yet implementation-ready as a default. It is safer than an OS installer because it avoids PATH mutation, admin rights, registry changes, and global state. Still, it downloads and runs a local executable, so it needs explicit user approval, exact LTS pin, SHA256 verification, AV/failure fallback, and a documented removal path.

Option C, OS installer / permanent PATH modification, should remain excluded. Option A, baseline fallback when Node is absent or portable Node is declined/blocked, should remain the default safe path.

## Rasterizer Assessment

The design correctly treats rasterization as the main unresolved OCR supply-chain gap. `@napi-rs/canvas` is a reasonable first spike candidate because it aligns with the pdfjs stack, but it is native and therefore requires Gate B re-review before product-path adoption. Pure JS canvas polyfill is attractive if feasible, but feasibility is unproven. PyMuPDF should remain excluded from product path because of AGPL/native risk, and poppler should remain opportunistic only.

OCR path implementation should not proceed beyond design or spike until rasterizer choice, native acceptance, and Gate B re-review scope are closed.

## HWP Path Assessment

The HWP path is the strongest candidate for first 2N-2 implementation slice. Kordoc parsing was previously evidenced with no-egress, determinism, native 0 under `--omit=optional`, and HWP v5 coverage. It does not require traineddata, tesseract.js, or rasterization. It still requires user approval and tool-cache/version pinning, but it does not depend on the unresolved OCR rasterizer decision.

## OCR Path Assessment

The OCR path is conceptually sound: Kordoc intake first, `needsOcr` page selection, rasterize only those pages, tesseract.js OCR, `ocr_text.json` with provenance, and existing DEI ingest page-alignment fail-fast.

The path should remain gated until rasterizer spike, Node pin validation, nethook rewrite, and Korean filename/UTF-8 handling are proven. Partial success policy is reasonable: emit valid OCR pages and disclose failed/unread pages via §7 coverage limitations.

## User-Facing UX Assessment

The failure/decline UX is safe: baseline continues and limitations are disclosed. The approval copy must explicitly name providers and versions for informed consent, while generated reports and user summaries must keep provider names out. This 3-layer provider naming policy is necessary and compatible with §7.

The design should avoid making the user think installation or OCR is automatic. The approval flow should say the assisted path is optional and local, and that refusal is a normal path rather than an error.

## Findings

### Critical

None.

### Major

**ID:** C2N1-MAJ-01

**Severity:** Major

**Location:** `docs/planning/cycle2n_0b_runner_provider_ux_design.md` §15-§17

**Issue:** Full 2N-2 implementation readiness depends on unresolved user decisions and entry checks: U1-U8, portable Node option B policy, native rasterizer acceptance/Gate B scope, and nethook implementation spec.

**Impact:** Starting a broad 2N-2 implementation before closing these gates could accidentally widen scope into system setup, native dependency acceptance, or OCR execution claims that have not been approved.

**Recommendation:** Before 2N-2, either close the required decisions/checks or explicitly narrow 2N-2 to an HWP-only assisted runner slice that does not include portable Node or OCR rasterization.

**Blocking:** Yes, for full HWP+OCR+portable Node 2N-2 implementation. No, for a narrower HWP-only slice if documented.

### Minor

None.

### Observations

**ID:** C2N1-OBS-01

**Severity:** Observation

**Location:** `docs/planning/cycle2n_0b_runner_provider_ux_design.md` §8, §18

**Issue:** The nethook is specified at a design level, but no committed implementation exists yet.

**Impact:** This is expected for design review, but 2N-2 tests must prove worker-thread propagation and Korean/Windows path compatibility before `no_egress_verified=true` is trusted.

**Recommendation:** Carry this into 2N-2 implementation tests and 2N-4 assisted retest evidence.

**Blocking:** No for design review; yes before no-egress evidence claims.

**ID:** C2N1-OBS-02

**Severity:** Observation

**Location:** `docs/planning/cycle2n_0b_runner_provider_ux_design.md` §12

**Issue:** Rasterizer selection is not closed, and the preferred candidate is native.

**Impact:** This is the right caution, but OCR path timing must stay explicitly conditional.

**Recommendation:** Treat rasterizer spike/Gate B re-review as a gate for OCR path implementation, not for HWP path implementation.

**Blocking:** No for HWP path; yes for OCR path.

## Additional Verification Requests

Additional verification request:
- **ID:** C2N1-AVR-01
- **Timing:** A. before 2N-2 implementation
- **Why it matters:** U1-U8 determine whether 2N-2 is HWP-only, full assisted path, portable Node-enabled, and/or native-rasterizer-enabled.
- **What to check:** Record user decisions for tool-cache location, approval unit, runner commit/zip inclusion, provider-name policy, determinism mode, HWP/OCR split, portable Node option, and rasterizer direction.
- **Suggested owner:** User / ChatGPT
- **Blocks next step?:** Yes for full 2N-2; No if 2N-2 is narrowed and the out-of-scope decisions are deferred.

Additional verification request:
- **ID:** C2N1-AVR-02
- **Timing:** A. before 2N-2 implementation
- **Why it matters:** Portable Node downloads and executes a local binary even if it avoids OS installer/PATH changes.
- **What to check:** Exact Node LTS pin, nodejs.org zip and SHASUMS256 verification procedure, win-x64 scope, AV failure fallback, deletion/removal procedure, and whether submission policy allows a runner that can prepare a portable runtime outside the repo.
- **Suggested owner:** User / Claude Code / Codex
- **Blocks next step?:** Yes if portable Node B is in 2N-2 scope; No if A fallback is the only 2N-2 Node-absent behavior.

Additional verification request:
- **ID:** C2N1-AVR-03
- **Timing:** A. before 2N-2 implementation
- **Why it matters:** OCR path depends on a rasterizer, and the leading candidate is native.
- **What to check:** Whether native rasterizer use is acceptable, which candidate is selected for spike, and what Gate B re-review inventory/license/native criteria apply.
- **Suggested owner:** User / Claude Code / Codex
- **Blocks next step?:** Yes for OCR path; No for HWP path.

Additional verification request:
- **ID:** C2N1-AVR-04
- **Timing:** B. during 2N-2 implementation
- **Why it matters:** `no_egress_verified=true` is only meaningful if hook coverage is real.
- **What to check:** nethook blocks dns/net/tls/http/https and propagates to `worker_threads`; positive control for loopback allowance; remote outbound blocking; hook-applied execution records true and unhooked execution records false or fails evidence mode.
- **Suggested owner:** Claude Code / Codex
- **Blocks next step?:** Yes before 2N-4 assisted retest or any no-egress evidence claim.

Additional verification request:
- **ID:** C2N1-AVR-05
- **Timing:** B. during 2N-2 implementation
- **Why it matters:** Prior 2M-3 artifacts showed PowerShell/UTF-8 corruption, and samples include Korean filenames.
- **What to check:** Windows PowerShell invocation, UTF-8 file I/O, Korean filename arguments, paths with spaces, and stdout/stderr encoding for runner scripts.
- **Suggested owner:** Claude Code / Codex
- **Blocks next step?:** No for initial coding; Yes before 2N-5 black-box test.

Additional verification request:
- **ID:** C2N1-AVR-06
- **Timing:** B. during 2N-2 implementation
- **Why it matters:** Intermediate artifacts must not land in repo or leak local paths into findings.
- **What to check:** `--out-dir` required behavior, default guidance to repo-external path, `.gitignore` patterns for `*.intake.json`, `*.ocr_text.json`, `*.aux_signals.json`, and validator path-scan clean generated findings.
- **Suggested owner:** Claude Code / Codex
- **Blocks next step?:** Yes before 2N-4 assisted retest.

Additional verification request:
- **ID:** C2N1-AVR-07
- **Timing:** C. before 2N-4 assisted retest
- **Why it matters:** Gate D was observed on the existing Node environment, while portable Node B may use a different LTS pin.
- **What to check:** Re-run no-egress, hash/provenance, and basic OCR execution evidence on the actual Node runtime selected by 2N-2.
- **Suggested owner:** Claude Code / Codex / Manual environment check
- **Blocks next step?:** Yes before assisted OCR retest if runtime differs from prior Gate D environment.

## Required Fixes Before 2N-2 Implementation

- Close or explicitly scope out U1-U8 decisions before implementation starts.
- Decide whether 2N-2 is a narrow HWP-first implementation or a full HWP+OCR runner implementation.
- If portable Node B is in scope, finalize the LTS pin and hash-verification/removal policy.
- If OCR is in scope, complete rasterizer acceptance/spike plan and define Gate B re-review criteria.
- Finalize the nethook rewrite requirements before any execution path can claim no-egress.

## Items That Can Be Deferred

- Kordoc 3.15.0 source-aligned comparison, unless final provider selection is attempted.
- OS/kernel-level no-egress verification.
- Cloud/self-host OCR Gate C/C-SH.
- L3 chart/table/image semantic analysis.
- Final 2N-5 black-box test criteria, as long as 2N-2 and 2N-4 explicitly prepare the needed evidence.

## Recommendation For Next Step

Proceed after condition handling:

1. Record user/ChatGPT decisions for U1-U8.
2. Choose a 2N-2 scope. Recommended low-risk route: HWP-first runner UX plus tool-cache/check/approval skeleton, while keeping OCR rasterizer and portable Node as gated subpaths.
3. If OCR is included, run a separate rasterizer spike/Gate B preparation before implementation.
4. Implement with no root `package.json`, no provider finalization claim, no automatic execution, and no user-facing "OCR 지원" wording.
