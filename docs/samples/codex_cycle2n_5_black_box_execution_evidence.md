# Codex Cycle 2N-5 Black-box Execution Evidence

## Execution Verdict

**INCONCLUSIVE**

Core runner, validator, renderer, delivery, intake, and OCR contract regression tests passed, and one real sample PDF completed the approved Kordoc-first structural intake path through DEI production. However, full black-box acceptance could not be concluded because:

- the repo does not expose a deterministic CLI harness for `sample document -> source-bound findings -> delivery report`;
- OCR approved execution required external OCR runtime install/download approval and was not run;
- HWP/HWPX/DOCX approved execution required user-local tool-cache writes that were blocked by the Codex sandbox/approval quota in this session;
- two user-facing reliability risks were observed in Windows/Codex execution: Python stdout encoding without UTF-8 env, and uncaught tool-cache write permission failure leaking a stack trace/local path.

This is not a product completion, OCR support complete, provider finalization, L2/L3 complete, or 2N-5 pass declaration.

## Reviewed HEAD

- Expected/latest HEAD: `7275196d2de9910702a7a2389f8c0d7a66295e7d`
- Actual HEAD after `git pull origin main`: `7275196d2de9910702a7a2389f8c0d7a66295e7d`
- Pre-run `git status --short`: clean
- Pre-run `git diff --check`: clean

## Paths

- Repo root: `<REPO_ROOT>` = `C:\Users\user\Desktop\Samil KSSB Precheck Plugin`
- Sample root: `<SAMPLE_ROOT>` = `C:\Users\user\Desktop\sample`
- Run output root: `<RUN_ROOT>` = `C:\Users\user\AppData\Local\Temp\samil_kssb_2n5_blackbox_20260707_223650`
- Local home paths are redacted below as `<USER_HOME>` where not already part of the user-provided sample path.

Generated outputs are outside the repo under `<RUN_ROOT>`. No raw generated output, OCR output, traineddata, runtime archive, package file, `node_modules`, or `submission.zip` was committed.

## Execution Environment

| Item | Observation |
|---|---|
| OS | Microsoft Windows NT 10.0.19045.0 |
| Shell | Windows PowerShell 5.1.19041.7417 |
| Node | `v24.16.0` at `C:\Program Files\nodejs\node.exe` |
| npm | `11.13.0`; `where.exe npm` returned `C:\Program Files\nodejs\npm` and `C:\Program Files\nodejs\npm.cmd` |
| bare `python` | `where.exe python` found no executable |
| `py -0p` | failed: `py.exe` could not be accessed by the system |
| Python used | `<USER_HOME>\AppData\Local\Python\pythoncore-3.14-64\python.exe`, Python 3.14.5 |
| Other Python candidate | `<USER_HOME>\AppData\Local\Python\pythoncore-3.13-64\python.exe`, Python 3.13.14 |
| Python UTF-8 env | Needed for Korean stdout/report filenames in PowerShell: `PYTHONUTF8=1`, `PYTHONIOENCODING=utf-8` |

## Sample Inventory

| File | Type | Size bytes |
|---|---:|---:|
| `2021년도 한국동서발전 경영실적보고서.pdf` | PDF | 30,364,618 |
| `2024_SMReport_KR.pdf` | PDF | 156,435,106 |
| `gate-D smaple.ver2.pdf` | PDF | 1,156,885 |
| `HFG_ESG_KSSB_Report_KOR_2024.pdf` | PDF | 3,839,124 |
| `smaple.docx.docx` | DOCX | 81,493 |
| `smaple.hwp.hwp` | HWP | 103,936 |
| `smaple.hwpx.hwpx` | HWPX | 117,945 |
| `smaple.textrater.pdf` | PDF | 1,993,443 |

## Regression Test Results

| Command | Result |
|---|---|
| `node --test tests/test_document_intake_router.test.cjs` | PASS, 21/21 |
| `node --test tests/test_hwp_assisted_runner_node.test.cjs` | PASS, 39/39 |
| `node --test tests/test_pdf_ocr_runner.test.cjs` | PASS, 29/29 |
| `node --test tests/test_portable_node_bootstrap.test.cjs` | PASS, 11/11 |
| `<PY> tests/test_findings_validator.py` | PASS, 30/30 |
| `<PY> tests/smoke_test_renderer.py` | PASS, 22/22 |
| `<PY> tests/test_delivery_wiring.py` | PASS, 34/34 |
| `<PY> tests/test_intake_dei_producer.py` | PASS, 83/83 |
| `<PY> tests/test_aux_structure_scanner.py` | PASS, 26/26 |
| `<PY> tests/test_hwp_assisted_runner.py` | PASS, 49/49 |
| `<PY> tests/test_nethook.py` | PASS, 29/29 |
| `<PY> tests/test_ocr_canonical_hash_parity.py` | PASS, 11/11 |

## Scenario Matrix

| # | Scenario | Status | Evidence |
|---:|---|---|---|
| 1 | text PDF baseline | `BLOCKED_ENV` | No deterministic repo CLI exists for `sample PDF -> findings -> report`. Baseline fallback/approval messaging was observed, but an actual sample-based KSSB report was not generated. |
| 2 | text PDF Kordoc-first structural enhancement approved | `PASS` | `HFG_ESG_KSSB_Report_KOR_2024.pdf` ran through `document_intake_router.cjs --approve-run --evidence-mode` after sandbox escalation. Exit 0. Generated `HFG_ESG_KSSB_Report_KOR_2024.intake.json`. DEI producer then succeeded with UTF-8 env. |
| 3 | mixed PDF OCR not approved | `PASS` | HFG generated intake had 5 OCR candidate pages. `pdf_ocr_runner.cjs` without install approval returned exit 5 with explicit OCR install approval/fallback message. |
| 4 | mixed PDF needsOcr page-set OCR approved | `BLOCKED_APPROVAL` | OCR check identified target pages `[3, 29, 39, 51, 53]`, but OCR runtime was not installed/verified. External npm/traineddata download/install was not approved or run. |
| 5 | scan-only PDF full-page OCR approved | `BLOCKED_APPROVAL` | Scan-only sample exists (`gate-D smaple.ver2.pdf`), but approved OCR run was not attempted because OCR runtime install/download was blocked by approval scope. |
| 6 | OCR unavailable / declined / install failed / hash mismatch fallback | `PASS` | OCR not-approved path returned exit 5 with clear fallback. Hash mismatch/fail-fast behavior was covered by `tests/test_pdf_ocr_runner.test.cjs` 29/29. |
| 7 | blank guard / timeout / page cap | `PASS` | Using HFG intake, `--max-pages 2` rejected 5 OCR target pages with exit 3 and clear page-cap/fallback message. Blank/timeout paths were covered by OCR runner regression tests. |
| 8 | OCR target 0 pages | `PASS` | Repo-outside synthetic no-OCR intake fixture returned exit 0 and no OCR artifact. This was a runner behavior probe, not a sample-natural condition. |
| 9 | DOCX input | `BLOCKED_ENV` | `--check` on `smaple.docx.docx` passed and showed Kordoc ready + run approval message. Approved run was blocked by sandbox/approval quota for user-local tool-cache writes. |
| 10 | HWPX input | `BLOCKED_ENV` | `--check` on `smaple.hwpx.hwpx` passed and showed Kordoc ready + run approval message. Approved run was blocked by sandbox/approval quota. |
| 11 | HWP input | `BLOCKED_ENV` | `--check` on `smaple.hwp.hwp` passed and showed Kordoc ready + run approval message. Approved run was blocked by sandbox/approval quota. |
| 12 | portable Node accept / decline | `PASS` | Decline/no-approval path ran: `prepare_portable_node.ps1` exited 5 and created no files. Mock/negative/cleanup paths passed in `tests/test_portable_node_bootstrap.test.cjs` 11/11. Real download was intentionally not re-run. |
| 13 | unsupported or damaged file | `PASS` | Repo-outside temporary `.txt` probe returned exit 3 with clear out-of-scope + baseline continuation message. |
| 14 | delivery fallback | `PASS` | `kssb_report_delivery.py` generated DOCX/HTML/Markdown from official example findings. `tests/test_delivery_wiring.py` also covered forced DOCX failure -> HTML primary fallback. |
| 15 | repo contamination + generated-output no-overclaim check | `PASS` | Post-run repo clean except this evidence document before commit. No prohibited repo artifacts found. Generated example report had no unnegated overclaim/provider/internal path hits. |

Scenario result summary:

- `PASS`: 8
- `FAIL`: 0
- `BLOCKED`: 6
- `NOT_RUN`: 1 equivalent (`scenario 1` is in-scope but blocked by missing deterministic end-to-end harness, recorded as `BLOCKED_ENV`)

## Command Summary

Key black-box commands:

```powershell
node src\intake\runners\document_intake_router.cjs `
  "<SAMPLE_ROOT>\HFG_ESG_KSSB_Report_KOR_2024.pdf" `
  --out-dir "<RUN_ROOT>\s02_pdf_kordoc_check" --check

node src\intake\runners\document_intake_router.cjs `
  "<SAMPLE_ROOT>\HFG_ESG_KSSB_Report_KOR_2024.pdf" `
  --out-dir "<RUN_ROOT>\s02_pdf_kordoc_approved" --approve-run --evidence-mode

<PY> src\intake\dei_producer.py `
  "<RUN_ROOT>\s02_pdf_kordoc_approved\HFG_ESG_KSSB_Report_KOR_2024.intake.json" `
  --source-id hfg-2024-public --source-title "HFG ESG KSSB Report 2024"

node src\intake\runners\pdf_ocr_runner.cjs `
  "<SAMPLE_ROOT>\HFG_ESG_KSSB_Report_KOR_2024.pdf" `
  --intake "<RUN_ROOT>\s02_pdf_kordoc_approved\HFG_ESG_KSSB_Report_KOR_2024.intake.json" `
  --out-dir "<RUN_ROOT>\s04_pdf_ocr_check" --check

node src\intake\runners\pdf_ocr_runner.cjs `
  "<SAMPLE_ROOT>\HFG_ESG_KSSB_Report_KOR_2024.pdf" `
  --intake "<RUN_ROOT>\s02_pdf_kordoc_approved\HFG_ESG_KSSB_Report_KOR_2024.intake.json" `
  --out-dir "<RUN_ROOT>\s07_ocr_page_cap" --max-pages 2

<PY> src\renderers\kssb_report_delivery.py `
  src\schemas\kssb_findings_example.json `
  -o "<RUN_ROOT>\s14_delivery_example_utf8"
```

## Generated Output Locations

| Output | Location | Result |
|---|---|---|
| PDF structural intake | `<RUN_ROOT>\s02_pdf_kordoc_approved\HFG_ESG_KSSB_Report_KOR_2024.intake.json` | Created, 794,393 bytes |
| DEI candidate | `<RUN_ROOT>\s02_hfg.dei_candidate.json` | Created after UTF-8 env, 534,270 bytes |
| Delivery example DOCX/HTML/MD | `<RUN_ROOT>\s14_delivery_example_utf8\...` | Created DOCX 6,638 bytes, HTML 12,830 bytes, MD 9,588 bytes |
| OCR output | none | OCR runtime install/download was not approved; no `.ocr_text.json` was created |
| HWP-family outputs | none | Approved execution blocked by sandbox/approval quota; check mode only |

## Generated Output Quality Assessment

The official example findings delivery output included:

- report title and disclaimer;
- review overview;
- status summary;
- KSSB 4-area item results with evidence quotes/locations;
- missing information;
- customer questions and requested materials;
- recommendations;
- limitations and human review boundary;
- DOCX primary plus HTML/Markdown fallback.

The output is suitable as a consultant-review draft for the example findings. It does not prove sample-specific report quality because no actual sample-derived findings report was generated.

## No-overclaim / Leak Check

Generated example report scan:

- No hits for unnegated `OCR support complete`, `provider finalization`, `L2 complete`, `L3 complete`, `product complete`, `2N-5 passed`, provider names, `tool-cache`, `node_modules`, `AppData`, or raw local paths.
- `준수 확정` appeared only in negated boundary context: "KSSB 준수 확정·감사의견·인증이 아니다."
- No raw stack trace or test harness/cycle terms appeared in the generated user-facing report.

Runner prompt outputs may intentionally mention provider names and tool-cache paths in approval dialogs, which is allowed by the current UX policy. They were not present in the generated report.

## Findings

### Major: approved runner can leak stack trace/local path on tool-cache write denial

The first approved PDF Kordoc execution without sandbox escalation failed while writing the default user-local tool-cache `approvals.json`:

- exit code: 1
- stack trace printed;
- local repo path and user-home tool-cache path printed;
- failure happened before normal fallback copy could be shown.

This was triggered by Codex sandbox restrictions, but the UX implication is broader: if approval/run log writes fail due to permission, AV, read-only home, or similar environment constraints, the runner should fail closed with a controlled Korean fallback message and no stack trace/local path leak.

Blocking for 2N-5 close: **yes**, if 2N-5 is expected to certify user-facing failure behavior in restricted environments.

### Major: no deterministic sample-document-to-report harness

The repo has strong component boundaries, but the black-box scenario "public report file -> KSSB precheck report" cannot be fully executed through a deterministic repo CLI. Findings generation is the Skill/LLM judgment step, while delivery requires a findings JSON input.

Observed coverage:

- sample PDF -> Kordoc intake: PASS;
- sample Kordoc intake -> DEI candidate: PASS with UTF-8 env;
- example findings -> delivery report: PASS;
- sample document -> source-bound findings -> delivery report: **not executed**.

This prevents a conclusive 2N-5 acceptance verdict.

Blocking for 2N-5 close: **yes**, unless ChatGPT/user explicitly accepts a manual Skill-run protocol as the black-box harness.

### Major: Windows Python stdout requires UTF-8 environment

Without `PYTHONUTF8=1` / `PYTHONIOENCODING=utf-8`:

- `kssb_report_delivery.py` succeeded but stdout and displayed file names appeared mojibake in PowerShell;
- `dei_producer.py` failed with `UnicodeEncodeError: 'cp949' codec can't encode character '\u2248'`.

With both env vars set, delivery and DEI output were correct.

Blocking for 2N-5 close: **yes**, for reliable Windows/Codex execution documentation; either script-level UTF-8 handling or explicit quickstart/test harness env instructions are needed.

### Observation: OCR candidate summary can be counterintuitive

HFG Kordoc intake had 5 OCR candidate pages (`3,29,39,51,53`) while `qualitySummary.needsOcr` printed `False`. The OCR runner correctly used `ocrCandidatePages` union logic, so execution behavior remained safe. This is not a blocker, but evidence consumers should rely on target page list rather than the summary boolean alone.

## OCR / Kordoc Approval and Fallback Behavior

- Kordoc structural enhancement was already installed/ready. Approved PDF structural run completed under no-egress evidence mode after sandbox escalation.
- Kordoc run prompt clearly stated OCR is not executed in structural intake.
- OCR runtime was not installed/verified. The runner clearly required separate install approval, separated npm registry and traineddata sources, and did not install or run without approval.
- OCR page cap and zero-target branches exited without creating OCR output.
- Portable Node no-approval path exited 5 and created no files.

## Repo Contamination Check

Before writing this evidence document:

- `git status --short`: clean
- `git diff --name-only`: empty
- `git diff --check`: clean
- scan found no repo `node_modules`, package/lock file, repo tool-cache, `.intake.json`, `.ocr_text.json`, `.aux_signals.json`, `submission.zip`, traineddata, runtime archive, or image artifact.

After writing this evidence document, the only intended repo change is:

- `docs/samples/codex_cycle2n_5_black_box_execution_evidence.md`

## Required Fixes Before Real-use Sample Testing / 2N-5 Close

1. Add controlled failure handling for tool-cache approval/run log write failures, with no stack trace/local path leakage and baseline fallback guidance.
2. Define the accepted black-box harness for `sample document -> findings -> delivery report`: either a documented manual Skill-run protocol with evidence capture, or a deterministic test fixture/harness that produces source-bound findings from sample-derived materials.
3. Standardize Windows Python UTF-8 execution for 2N-5 scripts, either by script-level stdout handling or by mandatory `PYTHONUTF8=1` / `PYTHONIOENCODING=utf-8` in the execution instructions.
4. If OCR approved scenarios are required for 2N-5 closure, run a separate approved OCR install/execution evidence cycle or explicitly scope them as blocked/not required for this acceptance pass.
5. If HWP/HWPX/DOCX approved scenarios are required, rerun them in an environment that can write user-local tool-cache logs without Codex sandbox escalation failure.

## Recommended Next Step

Do not declare 2N-5 passed from this run. Recommended branch:

1. Patch/handle the two user-facing execution hazards: tool-cache write failure and Python UTF-8 execution.
2. Decide the official black-box harness for sample-derived findings/report generation.
3. Rerun 2N-5 with that harness, and separately decide whether approved OCR and HWP-family runs are mandatory or may remain blocked by approval/environment.

## Scope Compliance

This run did not modify code, tests, Skill documents, validator, renderer, delivery, schema, manifest, marketplace, sample originals, or existing status/planning documents. It did not run npm install, portable runtime download, traineddata download, Kordoc reinstall, full OCR execution, rasterizer execution, or submission packaging.

## Final Report

- verdict: `INCONCLUSIVE`
- reviewed HEAD: `7275196d2de9910702a7a2389f8c0d7a66295e7d`
- sample root: `<SAMPLE_ROOT>`
- changed surface: evidence report only
- PASS scenarios: 8
- FAIL scenarios: 0
- BLOCKED scenarios: 6
- NOT_RUN/blocked in-scope: 1
- generated output quality: example findings delivery output is consultant-review usable; sample-derived full report not generated
- required fixes: controlled tool-cache permission failure, black-box sample-to-findings harness, UTF-8 execution rule, approved OCR/HWP rerun decision
- recommendation: patch/clarify before declaring 2N-5 close; rerun focused acceptance after harness and environment decisions
