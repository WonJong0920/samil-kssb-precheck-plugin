# Codex Review — B5 Packaging Readiness Audit / Scope Review

## Review Target

- Target HEAD: `3073769c65a6e3efc2b94f5c8b9ffa51c9b60853`
- Review type: packaging readiness audit / scope review
- Scope: current repo state after B3 evidence closure

## Verdict

**PASS**

B3 is closed enough to enter B5, and the B5 remediation scope is sufficiently clear. The audit identifies several required B5 remediation items before B6 final submission review, but none require redefining B5 or blocking B5 start.

This PASS does **not** mean packaging readiness is complete. It means the B5 work can begin with a clear scope, priority order, and no need for another pre-B5 planning correction.

## Readiness

- B3 closure to B5 entry: ready.
- B5 remediation start: ready.
- B6 final submission review: not ready until the required B5 remediation items below are completed and independently reviewed.

## Source-of-Truth Inspected

- `AGENTS.md`
- `docs/operating_principles.md`
- `docs/current_status.md`
- `docs/decision_log.md`
- `docs/planning/b5_packaging_readiness_prep_notes.md`
- `docs/reviews/codex_b3_provenance_supplement_review.md`
- `docs/reviews/codex_b3_node_runtime_and_real_ux_evidence_review.md`
- `docs/submission_packaging_policy.md`
- `src/.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`
- `src/skills/samil-kssb-precheck/SKILL.md`

## Additional Files Inspected

- `README.md`
- `docs/workflow_usage.md`
- `docs/user_quickstart_pre_2n_5.md`
- `src/validators/README.md`
- `src/renderers/README.md`
- `.gitignore`
- `src/skills/samil-kssb-precheck/completion_checklist.md`
- `src/skills/samil-kssb-precheck/evidence_mapping_rules.md`
- `src/skills/samil-kssb-precheck/report_template.md`
- `src/skills/samil-kssb-precheck/customer_question_rules.md`
- `src/intake/README.md`
- `src/reference/python_engine/README.md`

## Commands / Checks Executed

- `git status --short --branch`
  - Result: clean, `main...origin/main`.
- `git rev-parse HEAD`
  - Result: `3073769c65a6e3efc2b94f5c8b9ffa51c9b60853`.
- `rg -n "docs/" src`
  - Result: repo-root `docs/` references remain in Skill/supporting docs under `src/`.
- `rg -n "src/(validators|renderers|schemas|intake)" src`
  - Result: installed-plugin-facing docs still contain repo-root `src/` path prefixes.
- `rg -n "kssb_.*\\.py|\\.py" README.md docs src`
  - Result: Python is generally described as golden parity/reference in current user-facing docs; historical docs contain old references. Some packaging/preflight examples remain Python-era.
- `git ls-files src`
  - Result: plugin bundle surface confirmed under `src/`.
- `git ls-files | Select-String -Pattern '(submission\\.zip|run_manifest\\.json|outputs/|\\.docx$|\\.pdf$|node_modules|package-lock\\.json|package\\.json)$'`
  - Result: no tracked generated/source/package artifacts matching those patterns.

No code, packaging command, OCR, Kordoc, runner, or sample rerun was executed.

## Packaging / Readiness Blockers

### Critical

None.

### Major

#### B5-MAJ-01 — Installed plugin bundle is not self-contained for key contract references

`marketplace.json` sets `source.path` to `./src`, so the installed plugin root is `src/`. Repo-root `docs/` is not inside that installed plugin bundle. Yet the installed Skill/support files reference repo-root docs, especially:

- `docs/findings_schema_contract.md`
- `docs/workflow_usage.md`
- `docs/blackbox_protocol.md`

This was observed in B3b real UX: the agent could not use the contract doc as packaged and fell back to bundled schema/validator/renderer files. Runtime code remains self-contained, but the installed Skill knowledge surface is not. This is the highest-priority B5 required remediation before B6.

Required B5 direction:

- Either copy or relocate the minimum contract material into the plugin bundle under `src/`, or rewrite Skill/support references to bundled equivalents.
- Separate "submission repo docs included in zip" from "installed plugin source bundle" explicitly; those are different surfaces.
- Keep historical/development-only docs references out of the installed Skill path unless clearly marked as repo-only.

#### B5-MAJ-02 — Installed-plugin path examples still use repo-root `src/` prefixes

Inside the installed plugin, paths such as `src/validators/...`, `src/renderers/...`, `src/schemas/...`, and `src/intake/...` are misleading because the plugin root is already `src/`. The files are present in the bundle, but the path hints are repo-root-oriented and create agent/user friction.

Required B5 direction:

- Normalize installed Skill/support docs to plugin-root paths where they are instructions to the agent.
- If a path is intentionally repo-root/development-only, mark it as such.
- Prioritize `SKILL.md`, `report_template.md`, `completion_checklist.md`, and `evidence_mapping_rules.md`; README/root docs can keep repo-root links when speaking about the repository.

#### B5-MAJ-03 — Submission packaging policy final preflight is still Python-era

`docs/submission_packaging_policy.md` still lists final preflight commands such as:

- `python -m json.tool ...`
- `python src/validators/kssb_findings_validator.py ...`
- `python tests/test_findings_validator.py`
- `python tests/smoke_test_renderer.py`

Current runtime is Node for validator/delivery/renderer/DEI, with Python retained as golden parity reference. The policy's final preflight section therefore under-represents the Node runtime closure and could mislead final packaging work.

Required B5 direction:

- Update final preflight to put Node runtime checks first, including `node --test tests/*.test.cjs` and representative Node delivery/render/preflight commands.
- Preserve Python reference checks as optional/reference parity, not the primary runtime gate.
- Keep D94 hard-stop and trace manifest opt-in evidence expectations aligned with `docs/blackbox_protocol.md`.

### Minor

#### B5-MIN-01 — Encoding/re-read narration and final-agent local path exposure should be addressed as installed Skill UX polish

B3b showed two user-facing rough edges: encoding/re-read narration and local absolute path exposure in the agent's final chat. Delivery itself already sanitizes `user_summary`, but the installed Skill should also instruct the agent not to narrate internal file re-reading or local output paths/account names.

This should be included in B5 because it is Skill/package UX, not renderer implementation.

#### B5-MIN-02 — PDF input expectations should be minimally visible in the installed plugin surface

The root README and quickstart explain PDF/HWP/OCR expectations well, but those repo-root docs are outside the installed `./src` plugin bundle. Because real users naturally provide PDFs, a compact installed-skill note should clarify:

- text-readable PDFs are baseline input,
- structure/OCR assistance is approval-based and optional,
- unsupported or unreadable portions become limitations/questions,
- no automatic OCR is performed by core.

Do not turn this into intake/runner implementation work in B5.

#### B5-MIN-03 — Validator/renderer README examples should be runtime-first

`src/validators/README.md` and `src/renderers/README.md` correctly preserve Python as reference, but some usage blocks still list Python examples prominently. This is lower risk than `SKILL.md` because these are developer/internal docs, but B5 should align examples around Node runtime first and Python reference second.

#### B5-MIN-04 — Version bump and runtime/dependency declaration should be a decision point, not an automatic patch

`plugin.json` remains at `0.1.0` and does not declare runtime dependencies. That is not currently a blocker because earlier decisions intentionally avoided unsupported manifest fields, and the repo has no `package.json`/external Node dependencies. B5 should decide conservatively:

- If only docs/Skill references change, a version bump may be useful for installed-plugin cache clarity but is not mechanically required by repo evidence alone.
- Do not add runtime/dependency fields unless current Codex plugin manifest documentation/schema supports them.

## Required B5 Remediation Scope

Required before B6:

1. **Plugin bundle self-containment and path normalization**
   - Fix repo-root `docs/` references from installed Skill/support docs.
   - Fix or clearly qualify `src/` path prefixes inside installed plugin docs.
   - Ensure the installed Skill can find the contract/rules it names without relying on repo-root docs.

2. **Submission packaging policy Node alignment**
   - Update final preflight to Node-runtime-first.
   - Preserve Python checks as golden parity/reference.
   - Reconfirm `submission.zip`, generated outputs, source PDFs, logs, `run_manifest.json`, and package artifacts exclusion/conditional-inclusion rules.

3. **Minimal installed Skill UX guardrails**
   - Suppress encoding/re-read/internal file-processing narration.
   - Prevent local absolute path/account-name exposure in agent final narration.
   - Add minimal PDF input expectation/fallback wording if it is not already in the installed-bundle surface after self-containment.

4. **Manifest/marketplace sanity decision**
   - Reconfirm `plugin.json` and `marketplace.json` parse and remain aligned.
   - Decide whether to bump `version`.
   - Avoid unverified manifest fields.

## Recommended Remediation Grouping

Recommended sequence:

1. **B5-A: Plugin bundle self-containment**
   - Copy/relocate minimal contract material or rewrite references.
   - Normalize installed-plugin paths.
   - Include minimal PDF/input expectation if the chosen bundled contract surface needs it.
   - This should be first because it addresses the real B3b installed-plugin failure mode.

2. **B5-B: Skill UX polish**
   - Encoding/re-read narration suppression.
   - Local absolute path/account-name redaction guidance for final agent narration.
   - Optional item-count narration guidance.
   - Keep it to Skill/support text; no renderer or delivery implementation.

3. **B5-C: Packaging policy and internal README alignment**
   - Node-runtime final preflight in `submission_packaging_policy.md`.
   - Runtime-first examples in validator/renderer README.
   - Reconfirm artifact/log/generated-output policy and manifest/marketplace/version decision.

4. **B5-D: Packaging readiness verification review**
   - A final docs/package-surface review before B6 to confirm the three remediation groups did not introduce overclaim, dangling paths, or package artifacts.

Each group should be implemented as a separate narrow cycle with Codex review. Combining all items into one broad patch would make installed-surface regressions harder to isolate.

## Carry-Forward Items

- Future real UX/black-box evidence should capture input and output bytes/SHA-256 at execution time.
- Logs original submission mode remains final packaging-stage decision, likely zip-only unless sensitivity scans support repo inclusion.
- Codex install verification remains user-direct evidence and should not be fabricated by agents.
- OCR/provider finalization, assisted-runner UX, and full black-box acceptance remain outside this B5 audit scope unless a concrete packaging doc references them incorrectly.

## Items Not To Include In B5

- Renderer/report quality upgrades beyond documentation/Skill wording.
- Human-review table implementation or report layout changes.
- Validator rule changes.
- OCR/Kordoc/tesseract/rasterizer execution or runner implementation.
- `submission.zip` generation.
- Source sample PDF/report artifact commits.
- `package.json`, `package-lock.json`, or `node_modules` creation.
- Public Plugin Directory claims.
- Product-complete, 2N-5-pass, OCR-complete, provider-finalization, or submission-ready declarations.

Final report quality improvements should be split into a later **B5-Q** or equivalent quality-polish cycle after packaging readiness is structurally clean. B5 should stabilize packaging/installability and user-facing scope, not change output rendering behavior.

## B6 Readiness Conditions

B6 final submission review should wait until:

- No installed-bundle `docs/` references remain unresolved, or all such references are explicitly repo-only/development-only and not required by Skill operation.
- Installed-plugin paths are plugin-root correct or clearly labeled as repo-root examples.
- `submission_packaging_policy.md` is Node-runtime-first and aligned with trace manifest / D94 / generated artifact policy.
- `plugin.json` and `marketplace.json` parse and remain aligned with `source.path=./src`.
- Version/runtime-declaration choice is recorded.
- `.gitignore` and packaging policy still prevent source PDFs, generated reports, `run_manifest.json`, package artifacts, `node_modules`, and `submission.zip` from entering repo by accident.
- Skill/user-facing docs preserve source-bound, human-review, no-overclaim, no local-path, and no unofficial-product boundaries.
- B5 remediation patches have their own Codex reviews.

## Recommendation

Proceed with B5 remediation using the grouped sequence above. Treat plugin bundle self-containment (`B3-MAJ-02`) as the first required fix. Defer report quality enhancement to a separate post-B5 quality cycle. Do not proceed to B6 until B5 remediation has been implemented and independently reviewed.
