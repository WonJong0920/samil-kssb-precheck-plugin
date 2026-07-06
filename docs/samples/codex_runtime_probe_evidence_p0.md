# Codex Runtime Probe Evidence P0

## P0 purpose

This document records a no-install runtime probe for the Codex execution environment. The probe supports the Cycle 2N-4C recommendation to measure the actual runtime surface before choosing S0/S1/S2/S3.

This probe does not select a final runtime strategy. It only records observed evidence for follow-up branching.

## Execution environment summary

- Date: 2026-07-06
- Repo HEAD before probe: `aea964dc6fdf26657778b492df94b2e0393d65af`
- Shell: Windows PowerShell 5.1
- OS: Microsoft Windows NT 10.0.19045.0
- Architecture: AMD64
- Network/download/install class: not executed
- Runtime adoption: not executed

## No-install probe results

### Command resolution matrix

| Command | Resolution result | Execution result | Notes |
|---|---|---|---|
| `git` | `<GIT_DIR>\git.exe` | `git version 2.54.0.windows.1` | Usable. |
| `powershell` | `<SYSTEM32>\WindowsPowerShell\v1.0\powershell.exe` | Current shell active | Usable. |
| `python` | `<USER_HOME>\AppData\Local\Microsoft\WindowsApps\python.exe` | Failed: system cannot access file | WindowsApps alias/stub, not a usable Python runtime in this session. |
| `py` | `<USER_HOME>\AppData\Local\Microsoft\WindowsApps\py.exe` | Failed: system cannot access file | WindowsApps alias/stub, not usable. |
| `python3` | `<USER_HOME>\AppData\Local\Microsoft\WindowsApps\python3.exe` | Failed: system cannot access file | WindowsApps alias/stub, not usable. |
| `where.exe python` | no match | n/a | Confirms no normal PATH executable visible to `where.exe`. |
| `where.exe py` | no match | n/a | Confirms launcher is not visible as a normal PATH executable. |
| `node` | `<SYSTEM_NODE_DIR>\node.exe` | `v24.16.0` | Usable. |
| `npm` | `<SYSTEM_NODE_DIR>\npm.ps1` first in PowerShell | Failed: PowerShell execution policy blocks script | Avoid bare `npm` in PowerShell commands. |
| `npm.cmd` | `<SYSTEM_NODE_DIR>\npm.cmd` | `11.13.0` | Usable; safer Windows invocation form. |

Additional checked locations:

- `<PROGRAM_FILES>\Python*`: no directory found.
- `<USER_HOME>\AppData\Local\Programs\Python*`: no directory found.
- PATH contains `<SYSTEM_NODE_DIR>`, `<USER_HOME>\AppData\Local\Microsoft\WindowsApps`, `<USER_HOME>\AppData\Roaming\npm`, and `<USER_HOME>\AppData\Local\Python\bin`.

## Python execution possibility

Observed Python commands are WindowsApps aliases/stubs and fail at execution time. No normal Python executable was found in the checked common install locations.

P0 judgment:

- S0 absolute-path Python may still be possible if the user or a future probe supplies a real Python executable path outside the WindowsApps aliases.
- In the current Codex session, Python is not usable via `python`, `py`, or `python3`.
- Python-dependent Codex-side tests remain blocked unless a real absolute Python path, portable Python, or an alternate runtime path is approved.

## Node/npm execution possibility

Node is usable through the system installation:

- `node -v` succeeded with `v24.16.0`.
- `npm.cmd -v` succeeded with `11.13.0`.
- Bare `npm` in PowerShell resolved to `npm.ps1` and was blocked by execution policy.

P0 judgment:

- Node-based runner probes or future `node:test` migration work are feasible in this Codex session without installing a runtime.
- Windows PowerShell commands should use `npm.cmd` or an explicit npm executable path rather than bare `npm`.

## PATH-outside executable execution possibility

The probe created a temporary script outside the repo under `<TEMP>`, executed it by absolute path, and removed it.

Observed result:

- Temp script absolute path: `P0_CMD_OK`
- System executable absolute path (`<SYSTEM32>\cmd.exe`): `P0_SYSTEM_CMD_OK`
- Cleanup: confirmed removed

P0 judgment:

- Absolute-path script/executable invocation outside PATH works in the Codex session.
- This supports S0 if a real Python executable path is supplied and supports repo-outside tool-cache invocation in principle.

## Repo-outside tool-cache execution possibility

The probe created a fake repo-outside tool-cache directory under `<TEMP>`, wrote a small `.cmd` script in a nested `bin` directory, executed it by absolute path, and removed it.

Observed result:

- Temp tool-cache script absolute path: `P0_TOOLCACHE_OK`
- Cleanup: confirmed removed

P0 judgment:

- Repo-outside tool-cache script execution is possible in principle.
- This does not prove that downloaded portable runtime binaries will be allowed by OS policy, antivirus, or sandbox rules. That remains an approved install/download probe item.

## Network/download/install confirmation

The following were not performed:

- portable Node download
- portable Python download
- Kordoc reinstall
- `npm install`
- external URL download
- runtime adoption or hash pinning
- OCR/rasterizer/tesseract.js/traineddata execution

## Redaction handling

Local host-specific paths were redacted in this document:

- user home path: `<USER_HOME>`
- temporary directory root: `<TEMP>`
- system Node installation: `<SYSTEM_NODE_DIR>`
- system directories: `<SYSTEM32>`, `<PROGRAM_FILES>`
- Git installation directory: `<GIT_DIR>`

Raw command output contained local account paths, but this evidence document does not reproduce them verbatim.

## Repo contamination scan

Before writing this evidence document, the repo was clean. The contamination scan found no newly created runtime/package/generated artifacts.

Commands run:

- `git diff --check`
- `git status --short`
- `git diff --name-only`
- `rg --files` filters for `package.json`, `package-lock.json`, `node_modules`, `*.intake.json`, `*.ocr_text.json`, `*.aux_signals.json`, `submission.zip`, `*.exe`, `*.msi`, `*.tar.gz`
- `rg --files | rg "(tool-cache|node_modules|package-lock\.json|submission\.zip|\.intake\.json|\.ocr_text\.json|\.aux_signals\.json)$"`

Result:

- No package files, lock files, `node_modules`, tool-cache, generated intake/OCR/aux artifacts, runtime archives/installers, or `submission.zip` were present in repo changes.

## 2N-5 environment definition issues

P0 indicates two separable execution definitions:

1. **Codex-like environment**
   - Python commands are blocked by WindowsApps alias/stub behavior.
   - Node is available and npm is usable via `npm.cmd`.
   - Python-based validator/renderer/delivery/intake tests cannot be independently executed by Codex unless S0/S2 or another Python access path is resolved.

2. **Claude/user shell environment**
   - Prior cycles have recorded Python execution success in a different local execution context.
   - 2N-5 black-box execution can proceed there if the project explicitly accepts that Codex review may remain limited to document/artifact inspection or Node-runnable checks until runtime parity is resolved.

P0 does not decide which definition governs 2N-5. That remains a user/ChatGPT decision.

## S0/S1/S2/S3 branching evidence

| Strategy | P0 evidence impact |
|---|---|
| S0 absolute-path Python | Plausible only if a real Python executable path is supplied. Current PATH aliases are not usable. Absolute-path execution itself works. |
| S1 Node single-runtime migration | More attractive for Codex-reviewable runner/tests because Node is available now. `npm.cmd` should be preferred on Windows. |
| S2 portable Python embeddable | Realistic fallback for preserving Python code without migration, but requires separate approved download/hash/adoption evidence. Not executed in P0. |
| S3 staged hybrid | Still the most balanced route: resolve immediate reviewability with P0 findings, prefer Node where low-risk, keep core Python migration or portable Python behind separate approvals. |

## Additional user approval required before next probe

The following require explicit follow-up approval and were not performed:

- portable Node download and hash verification
- portable Python download and hash verification
- Kordoc reinstall or `npm install`
- placing a real runtime under repo-outside tool-cache
- adopting any runtime into the workflow
- network-enabled probe for approved download behavior

## P0 conclusion

P0 confirms that the current Codex session has a real Python runtime blocker, not merely a missing PATH entry visible to PowerShell. Python aliases resolve to WindowsApps stubs and fail to execute.

Node is available and usable. npm is usable through `npm.cmd`, while bare PowerShell `npm` is blocked by script execution policy.

Absolute-path execution outside PATH works, including a repo-outside temp tool-cache style path. This supports future S0 or tool-cache strategies in principle, but real downloaded runtimes still require separate approved evidence.

Recommended branching material:

- Treat S0 as conditional on obtaining a verified non-WindowsApps Python absolute path.
- Treat S1 runner-side Node migration as the strongest immediate path for Codex-reviewable runner tests.
- Keep S2 portable Python as an approval-gated fallback when preserving Python implementation is more important than runtime simplification.
- Keep S3 staged hybrid as the recommended decision frame until 2N-5 execution environment is explicitly chosen.
