# Cycle 2N-4G Portable Node Real-download Evidence

## Purpose

This evidence records the approved Cycle 2N-4G real-download probe for the Portable Node B path.

The probe verifies the official Node.js portable zip source, repo-pinned SHA-256 recording, SHASUMS256.txt cross-check, portable `node.exe` / `npm.cmd` usability, runner portable detection, and portable-node `nethook.cjs` observation.

This is evidence only. It does not declare Portable Node B broadly adopted, 2N-5 unblocked, L2 complete, OCR support complete, or provider finalization complete.

## Environment Summary

- Repo HEAD before this evidence commit: `c2a3f979f926e01dfc293fe42ca9c04defd3d1da`
- Branch: `main`
- Date: `2026-07-06`
- Pin: `24.16.0`
- Platform target: `win-x64`
- Tool-cache location in logs: redacted as `<TOOL_CACHE>` / `<USER_HOME>`
- Temp paths in logs: redacted as `<TEMP>`

## Official Remote Evidence

Approved network scope was limited to official `nodejs.org/dist/v<pin>/` access.

Observed command class:

```text
Invoke-WebRequest https://nodejs.org/dist/v24.16.0/SHASUMS256.txt
Invoke-WebRequest https://nodejs.org/dist/v24.16.0/node-v24.16.0-win-x64.zip
Get-FileHash -Algorithm SHA256 node-v24.16.0-win-x64.zip
```

Result:

- Exit code: `0`
- Official source: `https://nodejs.org/dist/v24.16.0`
- SHASUMS256.txt row:

```text
edaca9bd58ec8e92037dac4e877d52f6b8f430b81c18b57e264b4e2fb111cd56  node-v24.16.0-win-x64.zip
```

- Observed zip SHA-256: `edaca9bd58ec8e92037dac4e877d52f6b8f430b81c18b57e264b4e2fb111cd56`
- Zip size: `36,946,639` bytes
- Cross-check: PASS, observed zip SHA-256 equals the official SHASUMS256.txt row.

## Repo-pinned Hash Recording

`src/intake/runners/prepare_portable_node.ps1` now records:

```text
$PINNED_ZIP_SHA256_CONST = "edaca9bd58ec8e92037dac4e877d52f6b8f430b81c18b57e264b4e2fb111cd56"
```

The remote path still rejects `-PinnedZipSha256` override and uses only the repo-pinned constant. Local `SourceRoot` remains available for controlled fixture tests.

## Official Remote Bootstrap

Observed command class:

```text
powershell.exe -NoProfile -ExecutionPolicy Bypass -File src/intake/runners/prepare_portable_node.ps1 -ApproveRuntime -PinVersion 24.16.0
```

Result:

- Exit code: `0`
- Output summary:

```text
로컬 실행 환경 준비 완료
위치: <TOOL_CACHE>\node@v24.16.0-win-x64
확인된 버전: v24.16.0
```

Tool-cache verification:

- `node.exe` exists: `true`
- `npm.cmd` exists: `true`
- `node.exe --version`: `v24.16.0`
- `npm.cmd --version`: `11.13.0`

Prep log subset:

```json
[
  {
    "status": "started",
    "provider": "nodejs-portable",
    "version": "24.16.0",
    "source": "https://nodejs.org/dist/v24.16.0/",
    "command_summary": "prepare portable node (node-v24.16.0-win-x64.zip)"
  },
  {
    "status": "ok",
    "provider": "nodejs-portable",
    "version": "24.16.0",
    "source": "https://nodejs.org/dist/v24.16.0/",
    "command_summary": "prepare portable node (node-v24.16.0-win-x64.zip)"
  }
]
```

The runtime artifact is outside the repo under `<TOOL_CACHE>`. The zip and extracted runtime are not committed.

## Intentional Failure Path

A controlled local fixture run used the official downloaded zip/SHASUMS files from `<TEMP>` but supplied a bad expected SHA-256.

Observed command class:

```text
powershell.exe ... prepare_portable_node.ps1 -ApproveRuntime -PinVersion 24.16.0 -SourceRoot <TEMP_FIXTURE> -PinnedZipSha256 000...000 -ToolCache <TEMP_TOOL_CACHE>
```

Result:

- Exit code: `7`
- Output summary:

```text
로컬 실행 환경 준비에 실패했습니다(pinned-hash-mismatch). 기본 텍스트 기반 검토로 계속하십시오.
```

- Destination runtime exists after failure: `false`
- Prep log statuses:

```json
[
  { "status": "started", "provider": "nodejs-portable", "version": "24.16.0", "source": "<TEMP_FIXTURE>" },
  { "status": "failed pinned-hash-mismatch", "provider": "nodejs-portable", "version": "24.16.0", "source": "<TEMP_FIXTURE>" }
]
```

This confirms fail-fast before extraction on a pinned hash mismatch.

## Runner Detection

Observed command class:

```text
node -e "const R=require('./src/intake/runners/hwp_assisted_runner.cjs'); const d=R.detectNode(()=>null, '<TOOL_CACHE>'); ..."
```

Result:

```json
{"source":"portable","hasNode":true,"hasNpmCmd":true}
```

The probe intentionally suppressed system Node/npm detection so the runner had to validate the portable path. The detected portable path had already passed `node.exe --version == v24.16.0`.

## Portable Node + Nethook Observation

Clean no-egress run:

```text
portable-clean-run
[NETHOOK-SUMMARY] mode=block observedTotal=0 egressAttempts=0 workersCreated=0
```

Blocked-control run:

```text
blocked-code=undefined
[NETHOOK-SUMMARY] mode=block observedTotal=1 egressAttempts=1 workersCreated=0 log=["dns.lookup example.com:0"]
```

This separates the no-egress execution segment from the control segment that proves the hook observes and blocks outbound attempts.

## Test Execution

Executed checks:

```text
git diff --check
node --test tests/test_portable_node_bootstrap.test.cjs
node --test tests/test_hwp_assisted_runner_node.test.cjs
<PYTHON_ABSOLUTE_PATH> tests/test_hwp_assisted_runner.py
<PYTHON_ABSOLUTE_PATH> tests/test_nethook.py
```

Results:

- `git diff --check`: PASS, with existing LF/CRLF working-copy warnings only.
- `tests/test_portable_node_bootstrap.test.cjs`: PASS, `12/12`.
- `tests/test_hwp_assisted_runner_node.test.cjs`: PASS, `39/39`.
- `tests/test_hwp_assisted_runner.py`: PASS, `49/49`.
- `tests/test_nethook.py`: PASS, `29/29`.

## Repo Contamination Scan

Scanned for:

```text
node_modules
package.json
package-lock.json
*.intake.json
*.ocr_text.json
*.aux_signals.json
submission.zip
tool-cache
*.zip
*.msi
*.exe
```

Result: no repo matches outside `.git` and tracked source files. No runtime binary, zip, installer, `node_modules`, package/lock file, generated intake/OCR/aux artifact, or submission archive was added to the repo.

## Redaction

- User home path redacted as `<USER_HOME>`.
- Tool-cache path redacted as `<TOOL_CACHE>`.
- Temporary probe paths redacted as `<TEMP>` / `<TEMP_FIXTURE>` / `<TEMP_TOOL_CACHE>`.
- Raw PowerShell object metadata and local absolute paths are not reproduced in this evidence.

## Boundary Confirmation

- Real `nodejs.org` download: performed only for official Node.js portable zip and SHASUMS256.txt.
- `npm install`: not performed.
- Kordoc reinstall: not performed.
- OCR/rasterizer/tesseract execution: not performed.
- 2N-5 black-box test: not performed.
- Core/ingest/schema/validator/renderer/delivery/Skill/manifest/marketplace: unchanged.
- Portable Node B adoption, 2N-5 unblock, L2 complete, OCR support, and provider finalization: not declared.

## Conclusion

Cycle 2N-4G evidence confirms that the Portable Node B bootstrap can use the official `nodejs.org/dist/v24.16.0/` source, verify the repo-pinned SHA-256 against SHASUMS256.txt, place a working portable Node runtime outside the repo, expose `node.exe` and `npm.cmd`, support runner portable detection, and support portable-node `nethook.cjs` observation.

Remaining decisions are outside this evidence document: whether to adopt Portable Node B, whether 2N-5 should run in Codex-like or user/Claude shell conditions, and what further review is required before treating this as a user-facing runtime strategy.
