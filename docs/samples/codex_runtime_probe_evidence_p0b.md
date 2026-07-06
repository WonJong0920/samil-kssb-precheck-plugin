# Codex Runtime Probe Evidence P0-B

## Probe purpose

This document records a no-install follow-up probe for the Codex execution environment. P0 established that `python`, `py`, and `python3` resolve to WindowsApps aliases/stubs and fail to execute, while absolute-path execution outside PATH works.

P0-B tests whether the real python.org/pymanager layout under `<USER_HOME>\AppData\Local\Python\` can be invoked directly by absolute path and whether the standard regression suites run under that path.

This document is evidence only. It does not adopt a runtime path into product code, runner configuration, Skill docs, or user-facing workflow.

## Execution environment summary

- Date: 2026-07-06
- Pull status before probe: `git pull origin main` returned already up to date.
- Repo HEAD after pull / probe baseline: `3abade893767e2251c8252c46a666e0d87ffc8dc`
- Shell: Windows PowerShell 5.1
- OS: Microsoft Windows NT 10.0.19045.0
- Architecture: AMD64
- Node check: `node v24.16.0`
- npm check: `npm.cmd 11.13.0`
- Download/install/runtime adoption: not performed

## Candidate path execution matrix

| Candidate | Found | `--version` rc/result | `-c "import sys; print(sys.executable)"` rc/result | Notes |
|---|---:|---|---|---|
| `<USER_HOME>\AppData\Local\Python\pythoncore-*\python.exe` | yes: `pythoncore-3.14-64` | rc 0 / `Python 3.14.5` | rc 0 / `<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe` | Real executable path. Selected as `$PY` for regression runs. |
| `<USER_HOME>\AppData\Local\Python\bin\python.exe` | yes | rc 0 / `Python 3.14.5` | rc 0 / `<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe` | Shim works and dispatches to the same core executable. |

## Regression suite results

Environment set before running suites:

- `PYTHONUTF8=1`
- `PYTHONIOENCODING=utf-8`
- `$PY=<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe`

| Suite | rc | Last summary line |
|---|---:|---|
| `tests/test_intake_dei_producer.py` | 0 | `83/83 checks passed` |
| `tests/test_aux_structure_scanner.py` | 0 | `26/26 checks passed` |
| `tests/test_hwp_assisted_runner.py` | 0 | `49/49 checks passed` |
| `tests/test_nethook.py` | 0 | `29/29 checks passed` |
| `tests/test_findings_validator.py` | 0 | `총 30건 중 실패 0건` |
| `tests/smoke_test_renderer.py` | 0 | `총 22건 중 실패 0건` |
| `tests/test_delivery_wiring.py` | 0 | `총 34건 중 실패 0건` |

All seven requested regression suites passed when invoked through the real absolute Python path.

## S0 evidence-level judgment

P0-B provides positive evidence that S0 absolute-path Python invocation is viable in this Codex session:

- The WindowsApps alias/stub failure from P0 remains relevant for `python`/`py`/`python3` command names.
- The real pymanager/core executable is available outside those aliases.
- Invoking that executable by absolute path succeeds.
- The shim path under `<USER_HOME>\AppData\Local\Python\bin\python.exe` also succeeds, but reports the core executable as `sys.executable`.
- Standard project regression suites run successfully under the core absolute path with UTF-8 environment variables set.

This is not runtime adoption. Follow-up work would still need an explicit decision before product docs, runner code, test instructions, or black-box execution contracts rely on this path.

## Implications for S0/S1/S2/S3

| Strategy | P0-B evidence impact |
|---|---|
| S0 absolute-path Python | Now supported by direct evidence for this machine/session if the project intentionally passes the real core path or an equivalent resolved path. |
| S1 Node migration | Still useful for reducing Python dependence and improving runner portability, but no longer required solely because Codex cannot execute any Python. |
| S2 portable Python | Still an approval-gated fallback for environments without a usable real Python executable; not needed for this session's immediate Python execution blocker. |
| S3 staged hybrid | Still a reasonable frame: use S0 for immediate Codex-side Python regression checks, keep S1/S2 as separate design choices rather than emergency workarounds. |

## Network/download/install confirmation

The following were not performed:

- portable Python download
- portable Node download
- `pip`
- `npm install`
- Kordoc reinstall or rerun
- external URL access
- OCR/rasterizer/tesseract.js/traineddata execution
- tool-cache creation/modification
- runtime adoption

## Redaction handling

Local host-specific paths were redacted in this document:

- user home path: `<USER_HOME>`
- real Python core path: `<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe`
- Python shim path: `<USER_HOME>\AppData\Local\Python\bin\python.exe`

No raw local account path is reproduced in this evidence document.

## Repo contamination scan

Checks run before writing the evidence document:

- `git diff --check`
- `git status --short`
- `git diff --name-only`
- `rg --files` filters for `package.json`, `package-lock.json`, `node_modules`, `*.intake.json`, `*.ocr_text.json`, `*.aux_signals.json`, `submission.zip`, `*.exe`, `*.msi`, `*.tar.gz`
- `rg --files | rg "(tool-cache|node_modules|package-lock\.json|submission\.zip|\.intake\.json|\.ocr_text\.json|\.aux_signals\.json)$"`

Result before writing this document:

- no modified or untracked files
- no package files, lock files, `node_modules`, tool-cache, generated intake/OCR/aux artifacts, runtime archives/installers, or `submission.zip`

Final repo contamination status is expected to contain only this evidence document.

## P0-B conclusion

The real Python 3.14.5 executable is present and usable by absolute path in the Codex session. This resolves the immediate question left open by P0: the failure is not that Python is universally unexecutable in Codex, but that the default command names hit WindowsApps aliases/stubs.

Evidence supports using S0 absolute-path Python invocation for immediate Codex-side regression checks on this machine, subject to an explicit follow-up decision about whether and how to document or automate that invocation. No install, download, runtime adoption, tool-cache change, Kordoc execution, OCR execution, or generated artifact commit was performed.
