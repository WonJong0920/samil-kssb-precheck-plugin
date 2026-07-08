"use strict";
/* Samil KSSB Precheck - HWP-first Assisted Runner (Node port, Cycle 2N-4D, source-only).
 *
 * 경계(2N-4C 계획·P0 probe 근거 — Python runner와 동일 원칙):
 * - plugin core가 아니며 Skill entrypoint도 아니다. core(schema/validator/renderer/delivery)는
 *   이 모듈을 참조하지 않는다. Skill이 사용자 승인 절차를 중개할 때만 안내되는 보조 도구다.
 * - **무승인 실행 금지**: 설치/실행은 명시적 승인 플래그(--approve-install/--approve-run) 없이는
 *   절대 수행되지 않는다. 승인 없는 호출은 한국어 승인 안내문을 출력하고 종료한다.
 * - **HWP-first 범위**: Kordoc 기반 HWP/HWPX/DOCX 구조·텍스트 경로만. OCR·tesseract.js·traineddata·
 *   rasterizer·portable Node(다운로드)는 범위 밖(gated).
 * - **CLI 계약은 Python runner(hwp_assisted_runner.py)와 동일**: 플래그·exit code·한국어 승인 문구·
 *   tool-cache 레이아웃·pin·prep_egress/approvals/run_log·provenance 규칙(요약 실관측+egress 0에만
 *   no_egress_verified=true). Node 내장 모듈만 사용한다(외부 의존성 0, repo package.json 미생성).
 *
 * Python runner와의 v1 의도적 차이(문서화 — runners/README.md):
 * - **aux_signals를 생성하지 않는다.** HWPX/DOCX 보조 구조 신호는 Python 경로
 *   (aux_structure_scanner.py) 전용이다 — Node 표준 모듈에는 zip/XML parser가 없어 좁은 이식 범위를
 *   벗어난다. 기존 설계상 aux 부재는 허용된다(intake 산출만으로 유효 — 건너뜀을 안내).
 * - **node 실행 파일은 자기 자신(process.execPath)으로 보장**된다(이 runner가 Node 위에서 돌므로
 *   node 부재 케이스가 구조적으로 없음). npm 부재 시에는 Python과 동일하게 안내 후 종료(exit 4).
 * - npm은 bare "npm"이 아니라 PATH+PATHEXT 해석 결과(Windows에서 npm.cmd)를 사용한다
 *   (P0 probe: bare npm은 PowerShell 정책이 npm.ps1을 차단 — AVR-04 계승).
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const KORDOC_VERSION = "3.13.0";
const PDFJS_VERSION = "4.10.38";
const NPM_SOURCE = "registry.npmjs.org";
// portable Node pin 후보(2N-4E/F — v24 LTS 계열, Gate D·2N-4·P0 실측 major. 사용자 결정 2).
// 최종 pin·기대 hash는 2N-4G evidence 사이클에서 확정(prepare_portable_node.ps1과 동일 값 유지 — parity 테스트).
const PORTABLE_NODE_VERSION = "24.16.0";

// HWP-first 지원 확장자(스캔/이미지 OCR 계열은 범위 밖).
const SUPPORTED_EXTENSIONS = new Set([".hwp", ".hwpx", ".docx"]);

// 종료 코드(Python runner와 동일 — 승인 대기·범위 밖 등은 오류가 아니라 상태다).
const EXIT_OK = 0;
const EXIT_USAGE = 2;
const EXIT_OUT_OF_SCOPE = 3;
const EXIT_NODE_MISSING = 4;
const EXIT_INSTALL_APPROVAL_REQUIRED = 5;
const EXIT_RUN_APPROVAL_REQUIRED = 6;
const EXIT_RUN_FAILED = 7;

const NETHOOK_SUMMARY_RE = /\[NETHOOK-SUMMARY\].*?egressAttempts=(\d+)/;

class RunnerError extends Error {}

// ---- 경로/탐지 ---------------------------------------------------------------

function defaultToolCache() {
  return path.join(os.homedir(), ".samil-kssb-precheck", "tools");
}

function kordocPrefix(toolCache) {
  return path.join(String(toolCache), `kordoc@${KORDOC_VERSION}`);
}

function kordocCliPath(toolCache) {
  return path.join(kordocPrefix(toolCache), "node_modules", "kordoc", "dist", "cli.js");
}

function nethookPath() {
  return path.join(__dirname, "nethook.cjs");
}

/** PATH+PATHEXT 기반 실행 파일 해석(shutil.which 대응).
 * Windows에서 npm은 npm.cmd로 해석된다(PATHEXT에 .PS1이 없어 npm.ps1은 자연 배제 —
 * PowerShell 정책 차단 위험 우회, P0/AVR-04). */
function which(cmd, env = process.env) {
  const pathVar = env.PATH || env.Path || "";
  const dirs = pathVar.split(path.delimiter).filter(Boolean);
  const isWin = process.platform === "win32";
  const exts = isWin
    ? (env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
    : [""];
  const lower = cmd.toLowerCase();
  const hasExt = isWin && exts.some((e) => lower.endsWith(e.toLowerCase()));
  for (const dir of dirs) {
    const candidates = hasExt || !isWin
      ? [path.join(dir, cmd)]
      : exts.map((e) => path.join(dir, cmd + e));
    if (!isWin) candidates.push(path.join(dir, cmd));
    for (const c of candidates) {
      try {
        if (fs.statSync(c).isFile()) return c;
      } catch {
        /* 없음 — 다음 후보 */
      }
    }
  }
  return null;
}

function portableNodeDir(toolCache) {
  return path.join(String(toolCache), `node@v${PORTABLE_NODE_VERSION}-win-x64`);
}

function portableNodeVersionProbe(nodeExe) {
  // 기설치 portable node.exe의 실제 버전 관측(자가 확인 — C2N4F-MAJ-01).
  // 실행 실패/timeout/비정상 출력은 null(= 사용 불가 상태)로 취급한다.
  try {
    const proc = spawnSync(String(nodeExe), ["--version"],
      { encoding: "utf8", timeout: 10000, windowsHide: true });
    if (proc.error || proc.status !== 0) return null;
    const v = (proc.stdout || "").trim();
    return v || null;
  } catch {
    return null;
  }
}

function portableNodePaths(toolCache, probeFn = portableNodeVersionProbe) {
  // 승인 하에 기설치된 portable Node(절대 경로) — 파일 존재만으로 인정하지 않는다(C2N4F-MAJ-01):
  // node.exe + 동봉 npm.cmd가 모두 있고, `node.exe --version` 실측이 pin과 정확히 일치해야 유효.
  // 버전 명령 실패·불일치·손상은 전부 미설치(missing/corrupt)로 취급 → 승인 안내/A안 흐름으로 수렴.
  const dir = portableNodeDir(toolCache);
  const node = path.join(dir, "node.exe");
  const npm = path.join(dir, "npm.cmd");
  if (!fs.existsSync(node) || !fs.existsSync(npm)) return null;
  let observed = null;
  try {
    observed = probeFn(node);
  } catch {
    observed = null;
  }
  if (observed !== `v${PORTABLE_NODE_VERSION}`) return null;
  return { node, npm };
}

function detectNode(whichFn = which, toolCache = defaultToolCache(),
                    probeFn = portableNodeVersionProbe) {
  // 탐지 우선순위(2N-4E §2): ① 시스템 Node/npm(둘 다 — 설치 제안 안 함) →
  // ② tool-cache portable(승인 기설치분, 절대 경로 + 버전 실측 일치) → ③ 부재(승인 안내 대상).
  // node는 최후에도 자기 자신(process.execPath)으로 보장(문서화된 Python과의 차이) — npm만 실질 게이트.
  const sysNode = whichFn("node");
  const sysNpm = whichFn("npm");
  if (sysNode && sysNpm) return { node: sysNode, npm: sysNpm, source: "system" };
  const portable = portableNodePaths(toolCache, probeFn);
  if (portable) return { node: portable.node, npm: portable.npm, source: "portable" };
  return { node: sysNode || process.execPath, npm: sysNpm, source: "missing" };
}

function checkKordoc(toolCache) {
  const pkg = path.join(kordocPrefix(toolCache), "node_modules", "kordoc", "package.json");
  if (!fs.existsSync(pkg)) return { installed: false, version_ok: false, cli: null };
  let version;
  try {
    version = JSON.parse(fs.readFileSync(pkg, "utf8")).version;
  } catch {
    return { installed: true, version_ok: false, cli: null };
  }
  const cli = kordocCliPath(toolCache);
  return {
    installed: true,
    version_ok: version === KORDOC_VERSION,
    cli: fs.existsSync(cli) ? cli : null,
  };
}

function isInsideRepo(p) {
  let cur = path.resolve(String(p));
  for (;;) {
    if (fs.existsSync(path.join(cur, ".git"))) return true;
    const parent = path.dirname(cur);
    if (parent === cur) return false;
    cur = parent;
  }
}

// ---- 명령 빌더 (실행하지 않음 — 실행은 승인 게이트 뒤에서만) --------------------

function buildInstallCommand(toolCache, npmExe = "npm") {
  const prefix = kordocPrefix(toolCache);
  return [
    npmExe, "install",
    "--prefix", prefix,
    "--omit=optional", // RH-B2: native optional 재유입 방지(필수)
    "--no-audit", "--no-fund",
    `kordoc@${KORDOC_VERSION}`,
    `pdfjs-dist@${PDFJS_VERSION}`,
  ];
}

function buildRunCommand(nodeExe, inputPath, outFile, toolCache) {
  const cmd = [
    nodeExe, "--require", nethookPath(),
    kordocCliPath(toolCache),
    String(inputPath),
    "--format", "json",
    "-o", String(outFile),
    "--silent",
  ];
  return [cmd, { NETHOOK_MODE: "block" }];
}

// ---- 승인 문구 (한국어 — Python runner와 동일 텍스트, U5 3층 정책) ---------------

function installApprovalMessage(toolCache) {
  const prefix = kordocPrefix(toolCache);
  return (
    "■ 로컬 판독 도구 설치 승인이 필요합니다\n" +
    `  - 설치 대상: Kordoc ${KORDOC_VERSION} (+ pdfjs-dist ${PDFJS_VERSION})\n` +
    `  - 출처: 공식 npm registry (${NPM_SOURCE})\n` +
    `  - 설치 위치: 로컬 전용 폴더 ${prefix} (이 저장소 밖 — 삭제는 폴더 제거로 완결)\n` +
    "  - 준비(설치) 단계에서만 네트워크 통신이 발생하며, 문서 분석 실행 단계는\n" +
    "    네트워크 차단(no-egress) 훅 아래에서 수행됩니다.\n" +
    "  - 설치를 거부해도 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.\n" +
    "  → 동의하시면 --approve-install 플래그와 함께 다시 실행하십시오."
  );
}

function runApprovalMessage(inputName) {
  return (
    "■ 문서 판독 실행 승인이 필요합니다\n" +
    `  - 대상 문서: ${inputName}\n` +
    "  - 실행은 네트워크 차단(no-egress) 훅 아래에서 로컬로만 수행됩니다.\n" +
    "  - 산출물은 지정한 --out-dir 폴더에만 생성됩니다.\n" +
    "  - 거부해도 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.\n" +
    "  → 동의하시면 --approve-run 플래그와 함께 다시 실행하십시오."
  );
}

function nodeMissingMessage() {
  const ps1 = path.join(__dirname, "prepare_portable_node.ps1");
  return (
    "■ Node.js/npm이 확인되지 않았습니다\n" +
    "  - 보조 판독 경로(HWP/HWPX/DOCX 구조 판독)에는 Node.js 실행 환경이 필요합니다.\n" +
    "  - Node.js는 공식 사이트(nodejs.org)에서 직접 설치하실 수 있습니다(이 도구가 대신 설치하지 않습니다).\n" +
    "  - (선택) 사용자 승인 하에 저장소 밖 로컬 전용 폴더로 portable 실행 환경을 준비할 수도 있습니다:\n" +
    `    powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}" -ApproveRuntime\n` +
    "    (공식 nodejs.org 배포 zip · SHA-256 이중 검증 · OS 설치 프로그램/PATH 영구 수정/관리자 권한 없음 ·\n" +
    "     제거는 폴더 삭제 — 승인 문구가 먼저 표시되며 거부하면 아무것도 설치되지 않습니다)\n" +
    "  - 지금은 기본 텍스트 기반 검토로 계속 진행합니다. 판독 불가 구간은 확인 불가로 표시되고\n" +
    "    고객 확인 질문으로 연결됩니다."
  );
}

function outOfScopeMessage(ext) {
  return (
    `■ 이 파일 형식(${ext})은 현재 보조 판독 경로의 범위 밖입니다\n` +
    "  - 이 경로는 HWP/HWPX/DOCX 문서만 다룹니다(스캔/이미지 문서의 OCR은 별도 단계 예정).\n" +
    "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다."
  );
}

// ---- 직렬화/기록 헬퍼 (Python json.dumps(sort_keys=True) 형식 정합) --------------

function sortedFlatJson(obj) {
  // 평탄 dict 전용 — Python 기본 구분자(", " / ": ")와 key 정렬을 맞춘 1행 JSON.
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}: ${JSON.stringify(obj[k])}`);
  return `{${parts.join(", ")}}`;
}

function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
}

function utcTimestamp(nowFn) {
  const d = nowFn ? nowFn() : new Date();
  return d.toISOString().slice(0, 19) + "Z";
}

// R1(2N-6 Phase 0 — 2N-5 Major): tool-cache/로그/폴더 쓰기 실패(권한 거부·읽기 전용·백신 차단 등)는
// stack trace·로컬 경로를 사용자 출력에 노출하지 않는 통제된 실패로 수렴한다 — RunnerError로 승격해
// main 래퍼/CLI 경계에서 한국어 안내 + 문서화된 exit 7로 종료. **메시지에는 어떤 경로도 넣지 않는다.**
const TOOLCACHE_WRITE_FAIL_MESSAGE =
  "■ 로컬 기록 폴더(tool-cache)에 기록할 수 없어 작업을 중단합니다\n" +
  "  - 폴더 권한·읽기 전용 설정·보안 프로그램(백신) 차단 여부를 확인한 뒤 다시 시도하십시오.\n" +
  "  - 쓰기 가능한 다른 위치를 --tool-cache 옵션으로 지정할 수도 있습니다.\n" +
  "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.";
const OUTDIR_WRITE_FAIL_MESSAGE =
  "■ 산출물 폴더(--out-dir)를 만들거나 기록할 수 없어 작업을 중단합니다\n" +
  "  - 폴더 권한·경로 오타·읽기 전용 설정을 확인한 뒤 다시 시도하십시오.\n" +
  "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.";

function guardedWrite(fn, failMessage = TOOLCACHE_WRITE_FAIL_MESSAGE) {
  try {
    return fn();
  } catch (e) {
    if (e instanceof RunnerError) throw e; // 이미 통제된 실패(예: 무결성 불일치)는 메시지 보존
    throw new RunnerError(failMessage);
  }
}

function appendPrepEgress(toolCache, action, status, commandSummary, opts = {}) {
  return guardedWrite(() => {
    const dir = String(toolCache);
    fs.mkdirSync(dir, { recursive: true });
    const log = path.join(dir, "prep_egress_log.jsonl");
    const entry = {
      timestamp: utcTimestamp(opts.now),
      action,
      provider: opts.provider || "kordoc",
      version: opts.version || KORDOC_VERSION,
      source: opts.source || NPM_SOURCE,
      command_summary: commandSummary,
      status,
    };
    fs.appendFileSync(log, sortedFlatJson(entry) + "\n", "utf8");
    return log;
  });
}

function recordApproval(toolCache, kind, target, opts = {}) {
  return guardedWrite(() => {
    const dir = String(toolCache);
    fs.mkdirSync(dir, { recursive: true });
    const p = path.join(dir, "approvals.json");
    let data = {};
    if (fs.existsSync(p)) {
      try {
        data = JSON.parse(fs.readFileSync(p, "utf8"));
      } catch {
        data = {};
      }
    }
    if (!data[kind] || typeof data[kind] !== "object") data[kind] = {};
    data[kind][target] = utcTimestamp(opts.now);
    fs.writeFileSync(p, JSON.stringify(sortDeep(data), null, 1), "utf8");
    return p;
  });
}

// ---- artifact / provenance -----------------------------------------------------

function artifactPaths(inputPath, outDir) {
  // v1: intake만 생성(aux_signals는 Python 경로 전용 — 상단 경계 주석·README 참조).
  const stem = path.basename(String(inputPath), path.extname(String(inputPath)));
  return { intake: path.join(String(outDir), `${stem}.intake.json`) };
}

function buildRunProvenance(childOutput, evidenceMode = false) {
  const m = NETHOOK_SUMMARY_RE.exec(childOutput || "");
  const hookObserved = m !== null;
  const egressAttempts = m ? parseInt(m[1], 10) : null;
  const verified = Boolean(hookObserved && egressAttempts === 0);
  if (evidenceMode && !verified) {
    throw new RunnerError(
      "evidence 모드: no-egress 훅 요약이 관측되지 않았거나 egress 시도가 있어 실패 처리합니다.");
  }
  return {
    provider: "kordoc",
    provider_version: KORDOC_VERSION,
    hook_observed: hookObserved,
    egress_attempts: egressAttempts,
    no_egress_verified: verified,
  };
}

function appendRunLog(toolCache, provenance, inputName, opts = {}) {
  return guardedWrite(() => {
    const dir = String(toolCache);
    fs.mkdirSync(dir, { recursive: true });
    const log = path.join(dir, "run_log.jsonl");
    const entry = { timestamp: utcTimestamp(opts.now), input: inputName, ...provenance };
    fs.appendFileSync(log, sortedFlatJson(entry) + "\n", "utf8");
    return log;
  });
}

// ---- 실행 오케스트레이션 (승인 게이트 뒤에서만 execFn 호출) ---------------------

function defaultExec(cmd, envExtra) {
  const env = { ...process.env, ...(envExtra || {}) };
  const proc = spawnSync(cmd[0], cmd.slice(1), { env, encoding: "utf8" });
  const output = (proc.stdout || "") + (proc.stderr || "");
  return [proc.status === null ? 1 : proc.status, output];
}

const USAGE =
  "사용법: node hwp_assisted_runner.cjs <문서 경로(HWP/HWPX/DOCX)> --out-dir <산출물 폴더> " +
  "[--tool-cache <경로>] [--check] [--approve-install] [--approve-run] [--evidence-mode]";

function parseArgs(argv) {
  const ns = {
    input: null,
    outDir: null,
    toolCache: defaultToolCache(),
    check: false,
    approveInstall: false,
    approveRun: false,
    evidenceMode: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out-dir") ns.outDir = argv[++i];
    else if (a === "--tool-cache") ns.toolCache = argv[++i];
    else if (a === "--check") ns.check = true;
    else if (a === "--approve-install") ns.approveInstall = true;
    else if (a === "--approve-run") ns.approveRun = true;
    else if (a === "--evidence-mode") ns.evidenceMode = true;
    else if (!a.startsWith("-") && ns.input === null) ns.input = a;
    else return null; // 알 수 없는 인자
  }
  if (!ns.input || !ns.outDir) return null;
  return ns;
}

function main(argv, opts = {}) {
  // R1: 기록/폴더 쓰기 실패를 포함한 모든 RunnerError는 프로그램적 호출에서도 throw로 새지 않고
  // 한국어 안내 + 문서화된 exit 7로 수렴한다(CLI 경계 catch는 최후 방어로 유지).
  try {
    return mainInner(argv, opts);
  } catch (e) {
    if (e instanceof RunnerError) {
      console.log(e.message);
      return EXIT_RUN_FAILED;
    }
    throw e;
  }
}

function mainInner(argv, opts = {}) {
  const whichFn = opts.which || which;
  const execFn = opts.execFn || defaultExec;

  const ns = parseArgs(argv || []);
  if (ns === null) {
    console.error(USAGE);
    return EXIT_USAGE;
  }

  const inputPath = ns.input;
  const toolCache = ns.toolCache;
  const outDir = ns.outDir;

  // 1) HWP-first 범위 확인
  const ext = path.extname(inputPath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    console.log(outOfScopeMessage(ext || "(확장자 없음)"));
    return EXIT_OUT_OF_SCOPE;
  }

  // 2) out-dir 안내(강제는 .gitignore 방어와 이중화)
  if (isInsideRepo(outDir)) {
    console.log("주의: --out-dir이 git 저장소 내부로 보입니다. 산출물은 저장소 밖 폴더를 권장합니다.");
  }

  // 3) Node/npm 확인 — 시스템 우선 → tool-cache portable 차선(버전 실측 일치 필수), 부재 시 B안 승인 안내
  const node = detectNode(whichFn, toolCache, opts.probeFn || portableNodeVersionProbe);
  if (!node.node || !node.npm) {
    console.log(nodeMissingMessage());
    return EXIT_NODE_MISSING;
  }

  const kd = checkKordoc(toolCache);
  const installNeeded = !(kd.installed && kd.version_ok && kd.cli);

  // 4) check/plan 모드 — 설치·실행 없이 계획만
  if (ns.check) {
    console.log("■ 점검 결과(plan 모드 — 설치/실행 없음)");
    console.log("  - Node/npm: 확인됨");
    console.log(`  - Kordoc ${KORDOC_VERSION}: ${installNeeded ? "설치 필요" : "준비됨"}`);
    if (installNeeded) {
      // C2N4D-MIN-01: plan 표시도 실제 실행과 동일한 resolved npm 경로(Windows: npm.cmd)를 쓴다
      // — bare "npm"은 PowerShell에서 npm.ps1 정책 차단 위험(P0/AVR-04), 사용자 복붙 오유도 방지.
      console.log(`  - 설치 명령(승인 후 실행): ${buildInstallCommand(toolCache, node.npm).join(" ")}`);
      console.log(installApprovalMessage(toolCache));
    }
    console.log(runApprovalMessage(path.basename(inputPath)));
    return EXIT_OK;
  }

  // 5) 설치 승인 게이트 — 무승인 설치 금지
  if (installNeeded) {
    if (!ns.approveInstall) {
      console.log(installApprovalMessage(toolCache));
      return EXIT_INSTALL_APPROVAL_REQUIRED;
    }
    const cmd = buildInstallCommand(toolCache, node.npm);
    recordApproval(toolCache, "install", `kordoc@${KORDOC_VERSION}`, opts);
    appendPrepEgress(toolCache, "install", "started",
      cmd.slice(0, 6).join(" ") + " ...", opts);
    const [rc] = execFn(cmd, {});
    appendPrepEgress(toolCache, "install", rc === 0 ? "ok" : `failed rc=${rc}`,
      cmd.slice(0, 6).join(" ") + " ...", opts);
    if (rc !== 0) {
      console.log("설치에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도하거나, 기본 텍스트 기반 검토로 계속하십시오.");
      return EXIT_RUN_FAILED;
    }
  }

  // 6) 실행 승인 게이트 — 무승인 실행 금지
  if (!ns.approveRun) {
    console.log(runApprovalMessage(path.basename(inputPath)));
    return EXIT_RUN_APPROVAL_REQUIRED;
  }

  guardedWrite(() => fs.mkdirSync(outDir, { recursive: true }), OUTDIR_WRITE_FAIL_MESSAGE);
  recordApproval(toolCache, "run", path.basename(inputPath), opts);
  const paths = artifactPaths(inputPath, outDir);
  const [cmd, envExtra] = buildRunCommand(node.node, inputPath, paths.intake, toolCache);
  const [rc, output] = execFn(cmd, envExtra);
  let provenance;
  try {
    provenance = buildRunProvenance(output, ns.evidenceMode);
  } catch (e) {
    if (!(e instanceof RunnerError)) throw e;
    // C2N4D-MAJ-01: evidence 모드 실패는 통제된 실패다 — 정직한 provenance(no_egress_verified=false)를
    // 기록하고, stack trace/로컬 경로 없이 한국어 문구 + 문서화된 exit 7로 종료한다.
    appendRunLog(toolCache, buildRunProvenance(output, false), path.basename(inputPath), opts);
    console.log(e.message);
    console.log("문서 판독 실행에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.");
    return EXIT_RUN_FAILED;
  }
  appendRunLog(toolCache, provenance, path.basename(inputPath), opts);
  if (rc !== 0) {
    console.log("문서 판독 실행에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.");
    return EXIT_RUN_FAILED;
  }

  // 7) v1: 보조 구조 신호(aux_signals)는 이 실행기 버전에서 생성하지 않는다(문서화된 차이).
  if (ext === ".hwpx" || ext === ".docx") {
    console.log("보조 구조 신호는 이 실행기 버전에서 생성하지 않습니다(문서 구조·텍스트 판독 결과만 생성).");
  }

  console.log("■ 판독 완료 — 산출물이 지정한 폴더에 생성되었습니다.");
  console.log(`  - ${path.basename(paths.intake)}`);
  console.log("  - 이 산출물은 검토 재료(초안 입력)이며, 최종 판단은 컨설턴트 검수를 따릅니다.");
  return EXIT_OK;
}

module.exports = {
  KORDOC_VERSION,
  PDFJS_VERSION,
  NPM_SOURCE,
  PORTABLE_NODE_VERSION,
  SUPPORTED_EXTENSIONS,
  EXIT_OK,
  EXIT_USAGE,
  EXIT_OUT_OF_SCOPE,
  EXIT_NODE_MISSING,
  EXIT_INSTALL_APPROVAL_REQUIRED,
  EXIT_RUN_APPROVAL_REQUIRED,
  EXIT_RUN_FAILED,
  NETHOOK_SUMMARY_RE,
  RunnerError,
  defaultToolCache,
  kordocPrefix,
  kordocCliPath,
  nethookPath,
  which,
  portableNodeDir,
  portableNodeVersionProbe,
  portableNodePaths,
  detectNode,
  checkKordoc,
  isInsideRepo,
  buildInstallCommand,
  buildRunCommand,
  installApprovalMessage,
  runApprovalMessage,
  nodeMissingMessage,
  TOOLCACHE_WRITE_FAIL_MESSAGE,
  OUTDIR_WRITE_FAIL_MESSAGE,
  guardedWrite,
  outOfScopeMessage,
  sortedFlatJson,
  appendPrepEgress,
  recordApproval,
  artifactPaths,
  buildRunProvenance,
  appendRunLog,
  parseArgs,
  main,
};

if (require.main === module) {
  // CLI 경계 방어(C2N4D-MAJ-01): RunnerError는 어떤 경로로도 stack trace/로컬 경로를
  // 사용자에게 노출하지 않고 문서화된 실패 코드(7)로 수렴한다.
  let code;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof RunnerError) {
      console.log(e.message);
      code = EXIT_RUN_FAILED;
    } else {
      throw e;
    }
  }
  process.exit(code);
}
