# Codex Cycle 2N-3B nethook Coverage Patch Review

## Verdict

**PASS with nonblocking follow-up**

Cycle 2N-3A adequately resolves **C2N3-MAJ-01** for the HWP-first 2N-4 assisted retest gate. The patch broadens `nethook.cjs` host extraction and DNS coverage to the exact surfaces called out in the Codex 2N-3 review, keeps `no_egress_verified=true` strict, preserves worker-thread propagation, and documents the remaining `dgram` / `child_process` / native raw-syscall limits as scope boundaries rather than silently claiming OS-level isolation.

2N-4 may proceed, provided the existing runtime/evidence checks remain part of that retest: actual Kordoc package layout, actual Kordoc execution under the hook, Windows npm invocation, Python runner availability, PowerShell/UTF-8/Korean filename handling, and generated artifact handling.

## Reviewed Scope

- Target HEAD after `git pull origin main`: `d8d5993b3085172d684fb74095dd48ff2138a798`
- Base reviewed: `9ae7cdca81c3d84aa532aca3e928122c1ec62303`
- Actual changed files:
  - `docs/current_status.md`
  - `docs/decision_log.md`
  - `src/intake/runners/README.md`
  - `src/intake/runners/nethook.cjs`
  - `tests/test_hwp_assisted_runner.py`
  - `tests/test_nethook.py`

The changed file set matches the reported patch scope. No schema, validator, renderer, delivery, Skill, manifest, marketplace, package, lock, OCR, rasterizer, portable Node, or provider-finalization files were changed.

Primary files read:

- `docs/reviews/codex_cycle2n_3_hwp_first_implementation_review.md`
- `docs/planning/cycle2n_1a_hwp_first_scope_decision.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `src/intake/runners/nethook.cjs`
- `src/intake/runners/hwp_assisted_runner.py`
- `src/intake/runners/README.md`
- `tests/test_nethook.py`
- `tests/test_hwp_assisted_runner.py`

## Patch Assessment

The patch is narrow and well targeted. It modifies only the no-egress hook, the runner README, the two runner tests, and status/decision documentation.

The core correction is in `src/intake/runners/nethook.cjs`:

- DNS coverage is centralized through `DNS_RESOLVE_FAMILY` and `patchDnsFunctions()`.
- The patch applies the same lookup/resolve-family coverage to callback `dns`, `dns.promises`, `dns.Resolver.prototype`, and `dns.promises.Resolver.prototype`.
- `extractHostPort()` now handles `hostname`, `host`, and `servername` consistently for object-form `net` / `tls` calls.
- HTTP(S) handling now prefers `hostname`, then `host`, then `servername`, and accepts URL objects.
- Local IPC path handling is explicitly normalized to loopback/allowed, while remote hostnames continue to be blocked.

The patch does not loosen the runner provenance condition. `hwp_assisted_runner.py` still marks `no_egress_verified=true` only when the hook summary is observed and `egressAttempts=0`.

## C2N3-MAJ-01 Resolution Assessment

**Resolved.**

The prior Major identified two concrete gaps:

1. `net.Socket.connect()` / `tls.connect()` option objects using `hostname` or `servername` could be treated as loopback.
2. DNS promises and broader resolve-family methods were not covered.

The patch addresses both in code and tests:

- `nethook.cjs` now extracts `hostname || host || servername` for object calls.
- The DNS resolve-family list includes callback/promises/Resolver coverage.
- `tests/test_nethook.py` adds coverage for:
  - `net.connect({ host })`
  - `net.connect({ hostname })`
  - `tls.connect({ hostname })`
  - `tls.connect({ servername })`
  - `http.request({ hostname })`
  - `http.request(new URL(...))`
  - `https.request({ hostname })`
  - callback DNS resolve methods
  - promises DNS resolve methods
  - callback and promises Resolver instances
  - local IPC and loopback allowed cases

Manual Node probes in this review confirmed representative patched forms are blocked before network egress.

## no-egress / nethook Assessment

The current hook is appropriate for the project’s stated Gate A/D-style **process / Node runtime level** no-egress evidence. The remaining limits are explicit and consistent with prior evidence scope:

- `dgram` direct UDP is not covered.
- `child_process` spawned processes are not automatically hooked.
- native addon raw syscalls are not covered.
- OS/kernel firewall-level enforcement is not claimed.

Those limits are acceptable for 2N-4 HWP-first assisted retest because the Kordoc HWP path is expected to remain in a JS/Node process without OCR/native runner expansion. They must still be checked in the real Kordoc retest: if Kordoc spawns child processes, uses native binaries, or opens unexpected APIs, that becomes 2N-4 evidence, not a remaining patch blocker.

HTTP(S) composite argument edge cases are not an immediate blocker. The patch tests URL object and options-object forms, and lower-level net/tls hooks remain a second line of defense for remote connection attempts. A future hardening pass may add more explicit tests for URL-plus-options override forms, but this is not required before 2N-4.

## Test Quality Assessment

The test expansion is meaningful and aligned with the previous finding. `tests/test_nethook.py` now targets the exact missing API forms and keeps the “throw before original network call” testing style. It also adds pytest wrapper functions while preserving standalone script execution.

Limitations:

- This Codex environment still cannot execute `python`, `py`, or `python3`; they resolve to WindowsApps stubs and fail with access errors.
- `pytest` is not available as a command in this environment.
- Therefore, the Python standalone and pytest test commands could not be executed here.

Mitigation:

- Static review confirmed the pytest wrappers are present.
- Node `v24.16.0` is available.
- Manual safe Node probes verified representative patched no-egress forms.

## Scope and Boundary Assessment

No HWP-first scope expansion was found:

- No npm install.
- No Kordoc install or execution.
- No OCR execution.
- No tesseract.js, traineddata, rasterizer, portable Node, OS installer, or PATH change.
- No package/lock/node_modules generated.
- No tool-cache generated by this review.
- No generated reports, sample reruns, or submission archives.
- No L2 full completion, OCR support, provider finalization, or L3 implementation claim.

The README accurately frames the nethook coverage and limits without overstating it as OS/kernel no-egress.

## Verification Performed

- `git pull origin main`: already up to date.
- `git rev-parse HEAD`: `d8d5993b3085172d684fb74095dd48ff2138a798`.
- `git diff --name-only 9ae7cdca81c3d84aa532aca3e928122c1ec62303..HEAD`: matched reported patch files.
- `git diff --check`: pass.
- `git status --short --branch`: clean before review doc creation.
- `node -v`: `v24.16.0`.
- Manual Node probe: `net.connect({ hostname: "8.8.8.8", port: 53 })` and `tls.connect({ servername: "example.com", port: 443 })` were blocked, summary `egressAttempts=2`.
- Manual Node probe: `http.request(new URL(...))` and `https.request({ hostname, port })` were blocked, summary `egressAttempts=2`.
- Manual Node probe: `dns.promises.resolve4`, `new dns.promises.Resolver().resolve6`, and `dns.resolveMx` were blocked, summary `egressAttempts=3`.
- Manual Node probe: local IPC/loopback object forms were allowed with `egressAttempts=0`.
- Manual Node probe: empty process summary emitted `egressAttempts=0`.
- Repo contamination checks:
  - root `package.json`: absent.
  - root `package-lock.json`: absent.
  - repo `node_modules`: absent.
  - committed `*.intake.json`, `*.ocr_text.json`, `*.aux_signals.json`: absent.
- Targeted scope-wording scan found only current gated/historical/no-overclaim contexts.

## Verification Not Performed

- `python tests/test_nethook.py`
- `python tests/test_hwp_assisted_runner.py`
- `python -m pytest --collect-only tests/test_nethook.py tests/test_hwp_assisted_runner.py`
- existing Python regression tests

Reason: `python.exe`, `py.exe`, and `python3.exe` resolve to WindowsApps stubs and fail with “system cannot access the file”; pytest is not available. No Python installation was performed.

- npm install / Kordoc install / Kordoc execution / OCR / rasterizer / portable Node

Reason: explicitly prohibited for this review.

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Observations

**ID:** C2N3B-OBS-01

**Severity:** Observation

**Location:** `src/intake/runners/README.md:21`, `src/intake/runners/nethook.cjs:47`

**Issue:** `dgram`, `child_process`, and native raw syscalls remain outside the hook.

**Impact:** This is acceptable for current HWP-first Node-runtime evidence because the limitation is explicit and matches Gate A/D scope, but real Kordoc 2N-4 evidence must confirm the provider does not use an uncovered execution path.

**Recommendation:** During 2N-4, record whether the actual Kordoc run stays in the hooked Node process and whether any child process/native execution is observed.

**Blocking:** No before 2N-4; yes if actual Kordoc evidence reveals an uncovered path.

**ID:** C2N3B-OBS-02

**Severity:** Observation

**Location:** review environment

**Issue:** Python/pytest tests could not be executed in this Codex session.

**Impact:** The patch is reviewable by static and Node-level verification, but full repo regression still needs a working Python runtime before relying on local execution evidence.

**Recommendation:** Establish or document the Python command used for 2N-4 regression and runner execution.

**Blocking:** No for this patch review; yes for practical 2N-4 execution if no Python runtime is available.

## Additional Verification Requests

Additional verification request:
- **ID:** C2N3B-AVR-01
- **Timing:** during 2N-4
- **Why it matters:** The hook patch covers the synthetic Node API forms, but actual Kordoc behavior must be observed.
- **What to check:** Run real Kordoc under `--require nethook.cjs`; confirm `[NETHOOK-SUMMARY]` appears, `egressAttempts=0`, no child process/native uncovered path is used, and runner provenance records `no_egress_verified=true` only for that covered run.
- **Suggested owner:** Claude Code / Codex / Manual environment check
- **Blocks next step?:** Yes before accepting 2N-4 no-egress evidence.

Additional verification request:
- **ID:** C2N3B-AVR-02
- **Timing:** during 2N-4
- **Why it matters:** The runner assumes Kordoc package layout and CLI flags.
- **What to check:** Approved `kordoc@3.13.0 + pdfjs-dist@4.10.38` install under repo-external tool-cache, expected CLI path, JSON output shape, and ingest compatibility with `dei_producer`.
- **Suggested owner:** User / Claude Code / Codex
- **Blocks next step?:** Yes before using assisted artifacts as evidence.

Additional verification request:
- **ID:** C2N3B-AVR-03
- **Timing:** during 2N-4
- **Why it matters:** Python execution is unavailable in this Codex review environment, while the runner and regression tests are Python scripts.
- **What to check:** Confirm a working Python command, run `tests/test_nethook.py`, `tests/test_hwp_assisted_runner.py`, and the existing regression scripts, or document the execution environment used.
- **Suggested owner:** User / Manual environment check / Claude Code
- **Blocks next step?:** Yes before practical assisted retest completion.

Additional verification request:
- **ID:** C2N3B-AVR-04
- **Timing:** during 2N-4
- **Why it matters:** PowerShell selects `npm.ps1` in some contexts, which can be blocked by execution policy.
- **What to check:** Confirm the runner’s subprocess install path resolves a usable npm executable on Windows, preferably `npm.cmd`, and that failure falls back safely without repo package contamination.
- **Suggested owner:** User / Manual environment check / Claude Code
- **Blocks next step?:** Yes before approved install evidence.

Additional verification request:
- **ID:** C2N3B-AVR-05
- **Timing:** during 2N-4
- **Why it matters:** Assisted retest must prove the Windows path/encoding claims, not just the hook patch.
- **What to check:** PowerShell invocation with spaces and Korean filenames, UTF-8 stdout/stderr, repo-external `--out-dir`, and artifact filenames/content encoding.
- **Suggested owner:** Claude Code / Codex / Manual environment check
- **Blocks next step?:** Yes before 2N-5 black-box test.

Additional verification request:
- **ID:** C2N3B-AVR-06
- **Timing:** nonblocking
- **Why it matters:** HTTP(S) URL-plus-options override forms are not explicitly tested, although lower-level net/tls hooks should still block remote sockets.
- **What to check:** Add explicit hardening tests for `http.request(url, options)` / `https.request(url, options)` host override behavior if future provider evidence shows such forms are used.
- **Suggested owner:** Claude Code / Codex
- **Blocks next step?:** No.

## Required Fixes Before 2N-4

None for the nethook coverage patch.

Operational preconditions remain for the 2N-4 retest itself: working Python execution, approved Kordoc install/run, npm invocation confirmation, real nethook summary evidence, and Windows/UTF-8/Korean filename checks.

## Items That Can Be Deferred

- OS/kernel-level no-egress hardening.
- `dgram` direct UDP coverage unless actual provider evidence shows use.
- child-process propagation unless actual provider evidence shows Kordoc spawns subprocesses.
- native raw syscall protection unless native provider paths are introduced.
- OCR/tesseract.js/traineddata/rasterizer path.
- portable Node path.
- Kordoc 3.15.0 comparison.
- Additional HTTP(S) URL-plus-options hardening test, unless provider evidence makes it relevant.

## Recommendation for Next Step

Proceed to **Cycle 2N-4 HWP-first assisted retest** with the 2N-4 evidence plan intact. The retest should not treat this patch review as proof that Kordoc itself has already run safely; it only confirms that the previously identified nethook coverage blocker has been resolved enough to begin the approved real Kordoc evidence cycle.
