"use strict";
/* Samil KSSB Precheck - Document Intake Router (Cycle 2N-4J, source-only skeleton).
 *
 * 역할(2N-4I 전략 D91 — "Kordoc-first when available and approved. Baseline fallback when
 * unavailable, declined, or failed."):
 * - **문서 계열(family) 판별과 라우팅 소유권**을 이 모듈이 갖는다(C2N4I-OBS-02/C2N4I4M-OBS-01 —
 *   HWP-계열과 PDF의 의미를 한 runner 안에서 뭉개지 않는다).
 *   - **PDF** → Kordoc-first enhanced intake 경로(권장·승인 기반 선택). 텍스트 PDF도 대상이다 —
 *     목적은 표·섹션·페이지 위치·도표 주변 맥락 보강(KSSB 판단 엔진 아님, 산출물은 기존
 *     ingest boundary(dei_producer.py)의 paginated 계약으로 합류).
 *   - **HWP/HWPX/DOCX** → 기존 hwp_assisted_runner.cjs로 **무변경 위임**(원 argv 그대로 —
 *     2N-4D-A PASS 상태의 계약·문구·exit code를 이 모듈이 재정의하지 않는다).
 *   - 그 외 → 정중한 범위 밖 안내(기본 텍스트 검토 계속).
 * - **무승인 실행 금지·승인 분리(U3)·prep egress 기록↔실행 no-egress(nethook)·tool-cache pin**은
 *   기존 runner의 exported primitives를 재사용한다(게이트 재구현 금지 — 이 모듈은 분기와 문구만 소유).
 * - **2N-4J 범위 밖(gated)**: OCR 실행·tesseract.js·traineddata·rasterizer·page-set OCR은 이 모듈이
 *   수행하지 않는다(2N-4K spike·2N-4L 구현에서 별도 승인·리뷰 후). 스캔/이미지 페이지는 intake의
 *   판독 필요 신호로만 드러난다 — 이 router는 그것을 해석·실행하지 않는다.
 * - CLI 계약은 기존 runner와 동일 플래그·exit code를 쓴다(사용자 학습 비용 최소화).
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const R = require("./hwp_assisted_runner.cjs");

// 문서 계열(family) — 라우팅 소유권 명시(HWP-계열 집합은 기존 runner가 단일 소스).
const FAMILY_PDF = "pdf";
const FAMILY_HWP = "hwp-family";
const FAMILY_OUT_OF_SCOPE = "out-of-scope";

const PDF_EXTENSIONS = new Set([".pdf"]);

function detectFamily(inputPath) {
  const ext = path.extname(String(inputPath)).toLowerCase();
  if (PDF_EXTENSIONS.has(ext)) return { family: FAMILY_PDF, ext };
  if (R.SUPPORTED_EXTENSIONS.has(ext)) return { family: FAMILY_HWP, ext };
  return { family: FAMILY_OUT_OF_SCOPE, ext };
}

// ---- 문구 (한국어 — U5 3층 정책: 승인 대화에는 provider명 명시, 완료 안내에는 미노출) ----

function routerOutOfScopeMessage(ext) {
  return (
    `■ 이 파일 형식(${ext})은 문서 인테이크 경로의 범위 밖입니다\n` +
    "  - 이 경로는 PDF(구조 보강 판독)와 HWP/HWPX/DOCX(구조 판독) 문서만 다룹니다.\n" +
    "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다."
  );
}

function pdfEnhancedIntakeIntro() {
  return (
    "■ PDF 구조 보강 판독(enhanced intake) — 권장·승인 기반 선택 경로\n" +
    "  - 텍스트로 읽히는 PDF라도 표·섹션·페이지 위치·도표 주변 맥락을 함께 판독하면\n" +
    "    근거 표시 품질이 좋아집니다.\n" +
    "  - 거부해도 기본 텍스트 기반 검토는 그대로 진행됩니다."
  );
}

function pdfInstallApprovalMessage(toolCache) {
  const prefix = R.kordocPrefix(toolCache);
  return (
    "■ PDF 구조 보강 판독 도구 설치 승인이 필요합니다 (권장 — 선택 사항)\n" +
    "  - 목적: 텍스트 PDF에서도 표·섹션·페이지 위치·도표 주변 맥락을 보강해 근거 표시 품질을 높입니다.\n" +
    `  - 설치 대상: Kordoc ${R.KORDOC_VERSION} (+ pdfjs-dist ${R.PDFJS_VERSION})\n` +
    `  - 출처: 공식 npm registry (${R.NPM_SOURCE})\n` +
    `  - 설치 위치: 로컬 전용 폴더 ${prefix} (이 저장소 밖 — 삭제는 폴더 제거로 완결)\n` +
    "  - 준비(설치) 단계에서만 네트워크 통신이 발생하며, 문서 분석 실행 단계는\n" +
    "    네트워크 차단(no-egress) 훅 아래에서 수행됩니다.\n" +
    "  - 설치를 거부해도 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.\n" +
    "  → 동의하시면 --approve-install 플래그와 함께 다시 실행하십시오."
  );
}

function pdfRunApprovalMessage(inputName) {
  return (
    "■ PDF 구조 보강 판독 실행 승인이 필요합니다 (권장 — 선택 사항)\n" +
    `  - 대상 문서: ${inputName}\n` +
    "  - 실행은 네트워크 차단(no-egress) 훅 아래에서 로컬로만 수행됩니다.\n" +
    "  - 산출물은 지정한 --out-dir 폴더에만 생성됩니다.\n" +
    "  - 이 단계에서 OCR은 실행되지 않습니다(스캔/이미지 페이지는 '판독 필요' 신호로만 표시 —\n" +
    "    별도 단계 예정).\n" +
    "  - 거부해도 기본 텍스트 기반 검토는 계속 진행합니다.\n" +
    "  → 동의하시면 --approve-run 플래그와 함께 다시 실행하십시오."
  );
}

function pdfRuntimeUnavailableMessage() {
  const ps1 = path.join(__dirname, "prepare_portable_node.ps1");
  return (
    "■ Node.js/npm이 확인되지 않았습니다 — PDF 구조 보강 판독을 건너뜁니다\n" +
    "  - PDF 구조 보강 판독(권장·선택 경로)에는 Node.js 실행 환경이 필요합니다.\n" +
    "  - Node.js는 공식 사이트(nodejs.org)에서 직접 설치하실 수 있습니다(이 도구가 대신 설치하지 않습니다).\n" +
    "  - (선택) 사용자 승인 하에 저장소 밖 로컬 전용 폴더로 portable 실행 환경을 준비할 수도 있습니다:\n" +
    `    powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}" -ApproveRuntime\n` +
    "    (공식 nodejs.org 배포 zip · SHA-256 이중 검증 · OS 설치 프로그램/PATH 영구 수정/관리자 권한 없음 ·\n" +
    "     제거는 폴더 삭제 — 승인 문구가 먼저 표시되며 거부하면 아무것도 설치되지 않습니다)\n" +
    "  - 지금은 기본 텍스트 기반 검토로 계속 진행합니다. 표·섹션 등 구조 보강 없이 텍스트 근거만 사용하며,\n" +
    "    판독 불가 구간은 확인 불가로 표시되고 고객 확인 질문으로 연결됩니다."
  );
}

function pdfCompletionMessage(intakeName) {
  return (
    "■ 판독 완료 — 산출물이 지정한 폴더에 생성되었습니다.\n" +
    `  - ${intakeName}\n` +
    "  - 표·섹션·페이지 위치 등 구조 신호가 포함된 검토 재료(초안 입력)입니다.\n" +
    "    최종 판단은 컨설턴트 검수를 따릅니다.\n" +
    "  - 스캔/이미지로 보이는 페이지는 '판독 필요' 신호로만 표시됩니다 — 이 단계에서 OCR은\n" +
    "    실행되지 않습니다(별도 단계 예정)."
  );
}

// ---- PDF Kordoc-first 흐름 (게이트·기록·provenance는 기존 runner primitives 재사용) ----

function defaultExec(cmd, envExtra) {
  const env = { ...process.env, ...(envExtra || {}) };
  const proc = spawnSync(cmd[0], cmd.slice(1), { env, encoding: "utf8" });
  const output = (proc.stdout || "") + (proc.stderr || "");
  return [proc.status === null ? 1 : proc.status, output];
}

function pdfKordocFirstMain(ns, opts = {}) {
  const whichFn = opts.which || R.which;
  const execFn = opts.execFn || defaultExec;
  const inputPath = ns.input;
  const toolCache = ns.toolCache;
  const outDir = ns.outDir;

  // 1) out-dir 안내(기존 runner와 동일한 이중 방어)
  if (R.isInsideRepo(outDir)) {
    console.log("주의: --out-dir이 git 저장소 내부로 보입니다. 산출물은 저장소 밖 폴더를 권장합니다.");
  }

  // 2) 실행 환경 확인 — unavailable이면 baseline fallback으로 정직하게 수렴(무단 설치 없음)
  const node = R.detectNode(whichFn, toolCache, opts.probeFn || R.portableNodeVersionProbe);
  if (!node.node || !node.npm) {
    console.log(pdfRuntimeUnavailableMessage());
    return R.EXIT_NODE_MISSING;
  }

  const kd = R.checkKordoc(toolCache);
  const installNeeded = !(kd.installed && kd.version_ok && kd.cli);

  // 3) check/plan 모드 — 설치·실행 없이 계획만
  if (ns.check) {
    console.log("■ 점검 결과(plan 모드 — 설치/실행 없음)");
    console.log(pdfEnhancedIntakeIntro());
    console.log("  - Node/npm: 확인됨");
    console.log(`  - Kordoc ${R.KORDOC_VERSION}: ${installNeeded ? "설치 필요" : "준비됨"}`);
    if (installNeeded) {
      // 표시도 실제 실행과 동일한 resolved npm 경로(C2N4D-MIN-01 정책 계승 — bare npm 표시 금지)
      console.log(`  - 설치 명령(승인 후 실행): ${R.buildInstallCommand(toolCache, node.npm).join(" ")}`);
      console.log(pdfInstallApprovalMessage(toolCache));
    }
    console.log(pdfRunApprovalMessage(path.basename(inputPath)));
    return R.EXIT_OK;
  }

  // 4) 설치 승인 게이트 — declined는 실패가 아니라 baseline 계속(무승인 설치 금지)
  if (installNeeded) {
    if (!ns.approveInstall) {
      console.log(pdfInstallApprovalMessage(toolCache));
      return R.EXIT_INSTALL_APPROVAL_REQUIRED;
    }
    const cmd = R.buildInstallCommand(toolCache, node.npm);
    R.recordApproval(toolCache, "install", `kordoc@${R.KORDOC_VERSION}`, opts);
    R.appendPrepEgress(toolCache, "install", "started",
      cmd.slice(0, 6).join(" ") + " ...", opts);
    const [rc] = execFn(cmd, {});
    R.appendPrepEgress(toolCache, "install", rc === 0 ? "ok" : `failed rc=${rc}`,
      cmd.slice(0, 6).join(" ") + " ...", opts);
    if (rc !== 0) {
      console.log("설치에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도하거나, 기본 텍스트 기반 검토로 계속하십시오.");
      return R.EXIT_RUN_FAILED;
    }
  }

  // 5) 실행 승인 게이트 — 무승인 실행 금지
  if (!ns.approveRun) {
    console.log(pdfRunApprovalMessage(path.basename(inputPath)));
    return R.EXIT_RUN_APPROVAL_REQUIRED;
  }

  R.guardedWrite(() => fs.mkdirSync(outDir, { recursive: true }), R.OUTDIR_WRITE_FAIL_MESSAGE);
  R.recordApproval(toolCache, "run", path.basename(inputPath), opts);
  const paths = R.artifactPaths(inputPath, outDir);
  const [cmd, envExtra] = R.buildRunCommand(node.node, inputPath, paths.intake, toolCache);
  const [rc, output] = execFn(cmd, envExtra);
  let provenance;
  try {
    provenance = R.buildRunProvenance(output, ns.evidenceMode);
  } catch (e) {
    if (!(e instanceof R.RunnerError)) throw e;
    // evidence 모드 실패는 통제된 실패(C2N4D-MAJ-01 계승) — 정직한 provenance를 기록하고
    // stack trace/로컬 경로 없이 한국어 문구 + 문서화된 exit 7로 종료한다.
    R.appendRunLog(toolCache, R.buildRunProvenance(output, false), path.basename(inputPath), opts);
    console.log(e.message);
    console.log("문서 판독 실행에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.");
    return R.EXIT_RUN_FAILED;
  }
  R.appendRunLog(toolCache, provenance, path.basename(inputPath), opts);
  if (rc !== 0) {
    console.log("문서 판독 실행에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.");
    return R.EXIT_RUN_FAILED;
  }

  console.log(pdfCompletionMessage(path.basename(paths.intake)));
  return R.EXIT_OK;
}

// ---- 진입점 ----------------------------------------------------------------------

const USAGE =
  "사용법: node document_intake_router.cjs <문서 경로(PDF/HWP/HWPX/DOCX)> --out-dir <산출물 폴더> " +
  "[--tool-cache <경로>] [--check] [--approve-install] [--approve-run] [--evidence-mode]";

function main(argv, opts = {}) {
  // R1(2N-6 Phase 0): 기록/폴더 쓰기 실패 등 RunnerError는 프로그램적 호출에서도 throw로 새지
  // 않고 한국어 안내 + exit 7로 수렴(HWP-계열 위임 경로는 R.main이 자체적으로 동일 계약을 보장).
  try {
    return mainInner(argv, opts);
  } catch (e) {
    if (e instanceof R.RunnerError) {
      console.log(e.message);
      return R.EXIT_RUN_FAILED;
    }
    throw e;
  }
}

function mainInner(argv, opts = {}) {
  const ns = R.parseArgs(argv || []);
  if (ns === null) {
    console.error(USAGE);
    return R.EXIT_USAGE;
  }
  const fam = detectFamily(ns.input);
  if (fam.family === FAMILY_HWP) {
    // HWP/HWPX/DOCX는 기존 assisted runner에 원 argv 그대로 위임 — 의미·문구·계약 무변경.
    return R.main(argv, opts);
  }
  if (fam.family === FAMILY_PDF) {
    return pdfKordocFirstMain(ns, opts);
  }
  console.log(routerOutOfScopeMessage(fam.ext || "(확장자 없음)"));
  return R.EXIT_OUT_OF_SCOPE;
}

module.exports = {
  FAMILY_PDF,
  FAMILY_HWP,
  FAMILY_OUT_OF_SCOPE,
  PDF_EXTENSIONS,
  USAGE,
  detectFamily,
  routerOutOfScopeMessage,
  pdfEnhancedIntakeIntro,
  pdfInstallApprovalMessage,
  pdfRunApprovalMessage,
  pdfRuntimeUnavailableMessage,
  pdfCompletionMessage,
  pdfKordocFirstMain,
  main,
};

if (require.main === module) {
  // CLI 경계 방어(기존 runner와 동일 정책): RunnerError는 stack trace/로컬 경로 노출 없이
  // 문서화된 실패 코드(7)로 수렴한다.
  let code;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof R.RunnerError) {
      console.log(e.message);
      code = R.EXIT_RUN_FAILED;
    } else {
      throw e;
    }
  }
  process.exit(code);
}
