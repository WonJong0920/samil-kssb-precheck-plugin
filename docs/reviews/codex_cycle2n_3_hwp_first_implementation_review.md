# Codex Cycle 2N-3 HWP-first Implementation Review

## Verdict

**CONDITIONAL PASS**

Cycle 2N-2 stays within the documented HWP-first narrow implementation scope. The implementation adds a source-only runner skeleton, a source-only no-egress hook, defensive artifact ignore patterns, and standalone tests without introducing OCR execution, tesseract.js, traineddata, rasterizers, portable Node, root package files, or provider finalization claims.

However, the committed `nethook.cjs` is not yet strong enough to support the next no-egress evidence claim. Static review found gaps in host extraction and DNS API coverage that can miss non-loopback outbound attempts for some Node call forms. This must be patched and tested before Cycle 2N-4 assisted retest or any `no_egress_verified=true` evidence based on this hook.

## Reviewed Scope

- Target HEAD after `git pull origin main`: `005590fa0d7cb57d58679c323204c098d771dc38`
- Base reviewed: `a2b8ff3121bfecd1550216bddc482d5cdce66e7e`
- Changed files:
  - `.gitignore`
  - `docs/current_status.md`
  - `docs/decision_log.md`
  - `src/intake/README.md`
  - `src/intake/runners/README.md`
  - `src/intake/runners/hwp_assisted_runner.py`
  - `src/intake/runners/nethook.cjs`
  - `tests/test_hwp_assisted_runner.py`
  - `tests/test_nethook.py`
- Primary source-of-truth documents read:
  - `docs/planning/cycle2n_1a_hwp_first_scope_decision.md`
  - `docs/reviews/codex_cycle2n_1_runner_provider_ux_design_review.md`
  - `docs/planning/cycle2n_0b_runner_provider_ux_design.md`
  - `docs/planning/cycle2n_0a_runner_provider_blindspot_pass.md`
  - `docs/current_status.md`
  - `docs/decision_log.md`
  - `docs/submission_packaging_policy.md`
- Boundary/code files read:
  - `src/skills/samil-kssb-precheck/SKILL.md`
  - `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`
  - `src/intake/README.md`
  - `src/intake/dei_producer.py`
  - `src/intake/aux_structure_scanner.py`
  - `src/validators/kssb_findings_validator.py`
  - `src/renderers/kssb_report_delivery.py`
  - `src/intake/runners/hwp_assisted_runner.py`
  - `src/intake/runners/nethook.cjs`
  - `src/intake/runners/README.md`
  - `tests/test_hwp_assisted_runner.py`
  - `tests/test_nethook.py`

## Implementation Assessment

The implementation follows the 2N-1A narrowed scope. `hwp_assisted_runner.py` is placed under `src/intake/runners/`, is documented as non-core/source-only, and is not referenced by schema, validator, renderer, delivery, or Skill files. The runner requires `--out-dir`, checks HWP/HWPX/DOCX extensions only, keeps OCR artifacts out of HWP-first output, and keeps approvals/logs under a repo-external tool-cache.

The runner correctly separates install approval and run approval. It refuses to call `exec_fn` without the relevant approval flag and returns Korean user guidance instead. Node absence falls back to installation guidance plus baseline/text-only flow and does not suggest portable Node.

The implementation also correctly avoids root `package.json`, `package-lock.json`, `node_modules`, `.mcp.json`, submission archives, generated `.intake.json`, `.ocr_text.json`, and `.aux_signals.json` artifacts.

## Scope Compliance Assessment

Scope compliance is mostly strong:

- HWP/HWPX/DOCX assisted path only.
- No OCR execution path in the runner.
- No tesseract.js, traineddata, rasterizer, pdfium, PyMuPDF, poppler, `@napi-rs/canvas`, or portable Node implementation added.
- No OS installer, PATH mutation, admin-right requirement, npm global, or npx path added.
- No claim of full L2 completion, OCR support, provider finalization, or L3 implementation in current-facing docs.

Search hits for OCR/tesseract/rasterizer/provider terms are historical, gated, or old ingest/OCR contract context rather than new HWP-first execution scope.

## Boundary / Architecture Assessment

The runner remains outside plugin core. Static search found no references from `src/validators`, `src/renderers`, `src/schemas`, or `src/skills` into `src/intake/runners` or `hwp_assisted_runner`. The runner imports only same-layer auxiliary scanner code when generating optional HWPX/DOCX aux signals and does not import validator, renderer, delivery, or schema code.

This is compatible with the 2L-4A runner/ingest split: the runner is a source-only auxiliary producer and the existing ingest boundary remains the handoff point.

## Approval Gate Assessment

The install/run gate design is appropriate:

- `--approve-install` is required before install command execution.
- `--approve-run` is required before parsing command execution.
- `--check` prints a plan and approval text without install/run.
- Korean approval text names Kordoc/version/location/prep egress/run no-egress/fallback, as required by the 3-layer provider-name policy.
- User-facing completion output names artifacts by filename only and does not expose provider name or absolute tool-cache path.

The command builder uses `npm install --prefix <tool-cache>/kordoc@3.13.0 --omit=optional ...`, matching the documented tool-cache strategy. Actual npm/Kordoc execution was intentionally not performed in this review.

## Tool-cache / Package Contamination Assessment

No repo package contamination was found:

- `package.json`: absent.
- `package-lock.json`: absent.
- `node_modules`: absent under repo scan.
- generated `*.intake.json`, `*.ocr_text.json`, `*.aux_signals.json`: absent under repo scan.
- `.gitignore` includes the three assisted runner artifact patterns.

One environment note: direct `npm -v` in this PowerShell session is blocked by execution policy because `npm.ps1` is selected. This review did not bypass that because npm install/provider execution is prohibited for this cycle. The actual runner path should verify npm invocation behavior during the approved 2N-4 environment check.

## no-egress / nethook Assessment

The hook covers important direct forms: direct `net.connect(port, host)` and `http.request(string URL)` were manually probed with Node and blocked before outbound connection. The runner provenance parser also requires `[NETHOOK-SUMMARY]` and `egressAttempts=0` before setting `no_egress_verified=true`, which is the right policy.

But the hook is not yet complete enough for the stated AVR-04 claim. See **C2N3-MAJ-01** below.

## Artifact / Ingest Contract Assessment

The artifact contract is consistent with HWP-first:

- `--out-dir` is required.
- output names are `<stem>.intake.json` and `<stem>.aux_signals.json`.
- `.ocr_text.json` is intentionally absent for this HWP-first path.
- HWPX/DOCX aux scanner integration writes the existing aux signal shape and failure is nonfatal.
- Tool-cache logs and approvals stay internal and are not passed to user-facing output.

Actual Kordoc output compatibility with the existing `dei_producer` contract was not tested, because real provider installation/execution is out of scope for this review. This remains an additional verification item for 2N-4.

## Test Quality Assessment

The tests are useful as standalone scripts and cover many important policy surfaces:

- approval gates;
- command builders;
- no root package assumptions;
- artifact naming;
- `.gitignore` patterns;
- Korean/space filename handling;
- runner/core separation;
- direct no-egress controls;
- worker hook propagation;
- runner summary parsing.

Limitations:

- The current environment cannot execute `python`, `py`, or `python3`; all resolve to WindowsApps stubs and fail with "system cannot access the file." Therefore Python tests were not executable in this Codex session.
- Static inspection shows the new tests, and the existing project tests, are standalone `main()` scripts rather than pytest-collectable tests. That is consistent with the repo's current test style, but `python -m pytest --collect-only ...` would not collect meaningful pytest test functions in a working Python environment.
- The nethook tests do not cover object options using `hostname`, DNS promises resolve variants, or broader `dns.resolve*` methods. Those are the important missed cases for the major finding.

## Verification Performed

- `git pull origin main`: already up to date.
- `git rev-parse HEAD`: `005590fa0d7cb57d58679c323204c098d771dc38`.
- `git diff --name-only a2b8ff3121bfecd1550216bddc482d5cdce66e7e..HEAD`: confirmed the 9 expected changed files.
- `git diff --check`: pass.
- `git status --short --branch`: clean before review doc creation.
- Repo artifact/package scans:
  - no root `package.json` / `package-lock.json`;
  - no repo `node_modules`;
  - no committed `*.intake.json`, `*.ocr_text.json`, `*.aux_signals.json`;
  - no submission archive or MCP package artifacts found by targeted scan.
- Static boundary searches:
  - no core/Skill imports of runner files;
  - no runner imports of validator/renderer/delivery.
- Node availability:
  - `node -v`: `v24.16.0`.
- Manual safe nethook probes:
  - direct `net.connect(53, "8.8.8.8")`: blocked with `NETHOOK_BLOCKED`, summary `egressAttempts=1`.
  - direct `http.request("http://93.184.216.34/")`: blocked with `NETHOOK_BLOCKED`, summary `egressAttempts=1`.

## Verification Not Performed

- `python tests/test_hwp_assisted_runner.py`
- `python tests/test_nethook.py`
- `python -m pytest --collect-only ...`
- existing Python regression tests

Reason: `python.exe`, `py.exe`, and `python3.exe` in this environment resolve to WindowsApps stubs and fail with access errors. No new Python installation was performed.

- Real npm install / Kordoc execution / provider run

Reason: explicitly prohibited for this review.

## Findings

### Critical

None.

### Major

**ID:** C2N3-MAJ-01

**Severity:** Major

**Location:** `src/intake/runners/nethook.cjs:47`, `src/intake/runners/nethook.cjs:56`, `src/intake/runners/nethook.cjs:62`, `src/intake/runners/nethook.cjs:73`, `tests/test_nethook.py:50`

**Issue:** The no-egress hook does not cover several Node outbound call forms that the design asks it to cover. `extractHostPort()` ignores `hostname` for `net.Socket.connect()` / `tls.connect()` option objects, so `net.connect({ hostname: "...", port: ... })` or similar TLS forms can be treated as `localhost` because the caller falls back from `undefined` to loopback. DNS coverage also only patches `dns.promises.lookup` and a small subset of callback `dns.resolve*` functions; promises variants such as `dns.promises.resolve4()` and other resolve-family functions are not patched.

**Impact:** A provider or dependency using these forms could attempt outbound resolution/connection while the hook summary still reports no observed egress. That would undermine the next 2N-4 no-egress evidence and any `no_egress_verified=true` claim.

**Recommendation:** Before 2N-4, patch host extraction to handle `host`, `hostname`, and `servername` consistently for net/tls option forms. Patch DNS coverage for the relevant callback and `dns.promises` resolve-family methods, or explicitly block/record unknown DNS call forms. Add regression tests for `hostname` option objects, TLS hostname/servername objects, `dns.promises.resolve4`, and any resolve variants included in the claimed surface. Do not run external network probes for bypass cases; tests should prove pre-call blocking using safe interception or throw-before-original patterns.

**Blocking:** Yes, before 2N-4 assisted retest or any no-egress evidence claim using this hook. No, for the narrower source-only runner boundary review if the fix is tracked before execution evidence.

### Minor

**ID:** C2N3-MIN-01

**Severity:** Minor

**Location:** `tests/test_hwp_assisted_runner.py:52`, `tests/test_nethook.py:44`

**Issue:** The new tests are standalone scripts, not pytest-collectable tests. This matches the existing repo test convention, but the review prompt also asks for pytest collection checks. Static inspection found no `def test_*` or `class Test*` functions in the new test files.

**Impact:** Direct `python tests/...` execution can still work in a proper Python environment, but a future pytest-only CI job would collect zero tests unless wrappers are added or CI commands explicitly call the scripts.

**Recommendation:** Either document the standalone test command as the supported path for these files or add minimal pytest wrapper functions that call `main()` and assert return code 0. This is not required before 2N-4 if the project continues to use standalone scripts, but it should be resolved before any pytest-based CI claim.

**Blocking:** No for 2N-4 if standalone script execution is the intended test mode; potentially yes before CI adoption.

### Observations

**ID:** C2N3-OBS-01

**Severity:** Observation

**Location:** `src/intake/runners/hwp_assisted_runner.py:129`

**Issue:** Kordoc CLI path and output shape are assumed from package layout and command flags (`dist/cli.js`, `--format json`, `-o`). This review did not install or run Kordoc by design.

**Impact:** The runner skeleton may be correct, but actual package layout and JSON shape still need environment evidence.

**Recommendation:** Verify with approved 2N-4 assisted retest before treating the runner as operational evidence.

**Blocking:** No before code patch; yes before user-facing assisted run evidence.

**ID:** C2N3-OBS-02

**Severity:** Observation

**Location:** local review environment

**Issue:** Python execution is unavailable in the current Codex environment due WindowsApps stubs; `npm` direct invocation in PowerShell is blocked by script execution policy.

**Impact:** This review could not reproduce the Python standalone test results. npm install was out of scope anyway, but approved future retest should record the exact shell/executable path used.

**Recommendation:** During 2N-4, confirm a working Python runner for regression tests and confirm npm invocation from the runner path, not just from PowerShell.

**Blocking:** No for this docs-only review; yes before relying on local regression or install evidence.

## Additional Verification Requests

Additional verification request:
- **ID:** C2N3-AVR-01
- **Timing:** A. before 2N-4 assisted retest
- **Why it matters:** The current no-egress hook misses some outbound API shapes.
- **What to check:** Patch and test `host`/`hostname`/`servername` extraction for net/tls option objects and callback/promises DNS resolve-family coverage.
- **Suggested owner:** Claude Code / Codex
- **Blocks next step?:** Yes, if the next step claims no-egress evidence.

Additional verification request:
- **ID:** C2N3-AVR-02
- **Timing:** B. during 2N-4 assisted retest
- **Why it matters:** The runner assumes Kordoc package layout and CLI flags without real package execution in 2N-2.
- **What to check:** Actual `kordoc@3.13.0 + pdfjs-dist@4.10.38` install under repo-external tool-cache, presence of expected CLI path, and JSON output shape consumable by `dei_producer`.
- **Suggested owner:** User / Claude Code / Codex
- **Blocks next step?:** Yes before treating assisted artifacts as valid input evidence.

Additional verification request:
- **ID:** C2N3-AVR-03
- **Timing:** B. during 2N-4 assisted retest
- **Why it matters:** The implementation claims Windows/UTF-8/Korean filename readiness, but Python tests could not run here and real provider execution was prohibited.
- **What to check:** PowerShell invocation with spaces and Korean filenames, UTF-8 stdout/stderr, and generated artifact names under a repo-external `--out-dir`.
- **Suggested owner:** Claude Code / Codex / Manual environment check
- **Blocks next step?:** Yes before 2N-5 black-box test.

Additional verification request:
- **ID:** C2N3-AVR-04
- **Timing:** B. during 2N-4 assisted retest
- **Why it matters:** Direct `npm` invocation is blocked by PowerShell policy in this environment, while the runner uses subprocess execution.
- **What to check:** The approved install path should record whether subprocess resolves `npm.cmd` correctly on Windows, and should fall back safely if npm is inaccessible.
- **Suggested owner:** User / Manual environment check / Claude Code
- **Blocks next step?:** No for source review; Yes before approved install evidence.

Additional verification request:
- **ID:** C2N3-AVR-05
- **Timing:** B. during 2N-4 assisted retest
- **Why it matters:** The standalone nethook tests use synthetic scripts; the actual provider may spawn child processes or workers differently.
- **What to check:** Real Kordoc run under `--require nethook.cjs`, including child/worker behavior, summary parsing, and `no_egress_verified` provenance.
- **Suggested owner:** Claude Code / Codex
- **Blocks next step?:** Yes before no-egress evidence claims.

Additional verification request:
- **ID:** C2N3-AVR-06
- **Timing:** A. before 2N-4 assisted retest
- **Why it matters:** Current review environment could not run Python tests.
- **What to check:** Establish a working Python command for repo regression tests or document why execution is delegated to another environment.
- **Suggested owner:** User / Manual environment check
- **Blocks next step?:** Yes before relying on regression status.

## Required Fixes Before Next Step

Before 2N-4 assisted retest or no-egress evidence:

1. Fix `nethook.cjs` host extraction and DNS coverage gaps described in C2N3-MAJ-01.
2. Add tests for the missed nethook forms without causing real outbound network traffic.
3. Re-run the new runner/nethook tests and existing regression tests in a working Python environment.
4. Record npm invocation behavior on Windows during approved installation planning or retest.

No code/schema/Skill/renderer/validator fix is required for scope compliance, approval gates, or package contamination.

## Items That Can Be Deferred

- Actual Kordoc package installation and output compatibility verification: defer to approved 2N-4 assisted retest.
- Kordoc 3.15.0 comparison: remains nonblocking for HWP-first 2N-4.
- Portable Node: remains gated and out of scope.
- OCR path, tesseract.js, traineddata, rasterizer, and rasterizer Gate B review: remain gated and out of scope.
- OS/kernel-level no-egress verification: nonblocking hardening beyond process/Node-level evidence.
- Pytest wrapper conversion: nonblocking if standalone script execution remains the project test convention.

## Recommendation For Next Step

Do not proceed directly to 2N-4 assisted retest using the current hook. First run a narrow 2N-3 patch cycle for C2N3-MAJ-01: complete the no-egress API coverage, add targeted regression tests, and rerun the standalone regression suite in a Python-capable environment. After that patch review passes, proceed to 2N-4 HWP-first assisted retest with real Kordoc install/run evidence under user approval.
