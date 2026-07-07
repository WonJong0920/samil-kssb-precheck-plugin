"use strict";
/* Samil KSSB Precheck - Page-set OCR Runner (Cycle 2N-4L, source-only, 최소 구현).
 *
 * 역할(D91 page-set OCR architecture + Codex 2N-4K Gate B "ACCEPT WITH CONDITIONS" 이행):
 * - 기존 intake.json(Kordoc paginated 계약)의 needsOcr 신호에서 **OCR 대상 page-set을 산정**하고,
 *   승인 후 선택 페이지를 bounded 방식(page cap/batch/timeout/DPI)으로 rasterize+OCR 하여
 *   기존 ingest 계약 그대로의 **`<stem>.ocr_text.json`을 원자적으로 1회 방출**한다.
 * - **plugin core가 아니며 Skill entrypoint도 아니다.** OCR/native 패키지는 repo 밖 tool-cache의
 *   **별도 항목**에만 설치된다(Gate B 조건 1 — Kordoc 항목과 분리: Kordoc은 --omit=optional(RH-B2),
 *   이 경로는 rasterizer용 optional(@napi-rs/canvas)이 필수라 설치 정책이 상반됨). repo root
 *   package.json/core/Skill/validator/renderer/delivery/submission에 편입되지 않는다.
 * - **무승인 설치/실행 금지**(U7 — HWP/PDF 구조 판독 승인과 별개의 OCR 경로 승인). 승인 문구는
 *   npm registry와 raw.githubusercontent.com(traineddata) **두 출처를 분리 고지**한다(Gate B 조건 4).
 * - **pin+무결성 fail-fast**(Gate B 조건 2·3): 패키지 5종 exact version + skia native binary SHA-256 +
 *   traineddata 2종 SHA-256 — 어느 하나라도 불일치면 실행하지 않고 baseline 수렴.
 * - **실행은 nethook 아래 no-egress**(Gate B 조건 5): no_egress_verified=true는 요약 실관측 +
 *   egressAttempts=0에만. 훅은 프로세스 레벨이며 native raw syscall까지 증명하지 않는다(한계 보존).
 * - **OCR 텍스트의 경계**: 산출물은 기존 ingest의 ocr_supplement로만 합류하며(blocks 미혼입),
 *   confidence는 additive metadata일 뿐 — OCR 단독/confidence 근거로 confirmed 승격은 없다(조건 9).
 * - selected_pages 계약(2N-4I): 대상 = pageQuality[].needsOcr ∪ qualitySummary.ocrCandidatePages.
 *   mixed PDF는 그 집합, scan-only PDF는 전 페이지가 그 집합과 일치(관측 사실 — 2L-3C), user-range는
 *   **그 집합의 부분집합으로 제한**(밖이면 정중 거절 — ingest 페이지 정합 fail-fast와 무충돌).
 *   집합이 비면 OCR 불필요로 정중 종료(텍스트가 충분한 페이지를 임의로 확대하지 않는다).
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const R = require("./hwp_assisted_runner.cjs");

// ---- Gate B 조건 2: exact pin + hash 상수(2N-4K evidence에서 실측 기록된 값) ------

const OCR_PINS = Object.freeze({
  "tesseract.js": "7.0.0",
  "tesseract.js-core": "7.0.0",
  "pdfjs-dist": "4.10.38",
  "@napi-rs/canvas": "0.1.100",
  "@napi-rs/canvas-win32-x64-msvc": "0.1.100",
});
const SKIA_NATIVE_RELPATH = path.join(
  "node_modules", "@napi-rs", "canvas-win32-x64-msvc", "skia.win32-x64-msvc.node");
const SKIA_NATIVE_SHA256 =
  "0f76fb0648fbff832856f6ce202059fc3fa38be7ad925300e96935906ea11132";
const TRAINEDDATA = Object.freeze({
  eng: { sha256: "7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2", bytes: 4113088 },
  kor: { sha256: "6b85e11d9bbf07863b97b3523b1b112844c43e713df8b66418a081fd1060b3b2", bytes: 1677415 },
});
// traineddata 출처는 npm과 별개의 제3 출처다 — 승인 문구에 분리 고지(Gate B 조건 4).
const TRAINEDDATA_SOURCE_HOST = "raw.githubusercontent.com/tesseract-ocr/tessdata_fast";
const TRAINEDDATA_SOURCE_BASE =
  "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main";

const OCR_RUNTIME_DIRNAME = "ocr-runtime@tesseract.js-7.0.0";
const OCR_PROVIDER = "tesseract.js";
const OCR_LANGS = Object.freeze(["kor", "eng"]);

// bounded 실행 기본값(2N-4K 실측 제안 — 합성 fixture 근거라 보수적, 실 스캔 실측 후 재조정 대상).
const DEFAULT_DPI = 300;
const DEFAULT_PAGE_CAP = 50;
const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_PAGE_TIMEOUT_MS = 120000;
// silent-blank guard(Gate B 조건 6): 2N-4K 실측 잉크율(텍스트 페이지 0.035~0.039)과 백지 0을
// 구분하는 보수 임계값. 개별 blank 페이지는 additive 기록, 전 페이지 blank는 렌더 실패로 간주.
const INK_BLANK_THRESHOLD = 0.0005;

// ---- canonical hash (Python canonical_ocr_output_sha256과 parity — 규칙의 single
// source는 dei_producer.py이며, 이 구현은 golden parity 테스트로 묶인다) ------------

function pythonJsonDumps(v) {
  // Python json.dumps(sort_keys=True, ensure_ascii=False, separators=(",", ":")) 대응.
  // key는 이 계약에서 ASCII만 사용한다(비-ASCII key 정렬은 parity 미보장 — 계약 밖).
  if (v === null) return "null";
  if (v === true) return "true";
  if (v === false) return "false";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new R.RunnerError("non-finite number in ocr_text");
    return Number.isInteger(v) ? String(v) : JSON.stringify(v);
  }
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(pythonJsonDumps).join(",")}]`;
  if (typeof v === "object") {
    const keys = Object.keys(v).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${pythonJsonDumps(v[k])}`).join(",")}}`;
  }
  throw new R.RunnerError("unsupported type in ocr_text canonicalization");
}

function canonicalOcrOutputSha256(ocr) {
  const body = {};
  for (const k of Object.keys(ocr)) {
    if (k !== "output_sha256") body[k] = ocr[k];
  }
  return crypto.createHash("sha256").update(Buffer.from(pythonJsonDumps(body), "utf8")).digest("hex");
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function modelSha256() {
  // 두 traineddata pin을 결정적으로 요약한 provenance 문자열(ingest는 presence-only).
  const lines = OCR_LANGS.map((l) => `${l}:${TRAINEDDATA[l].sha256}`).sort().join("\n");
  return sha256Hex(Buffer.from(lines, "utf8"));
}

// ---- 경로/검증 --------------------------------------------------------------------

function ocrRuntimePrefix(toolCache) {
  return path.join(String(toolCache), OCR_RUNTIME_DIRNAME);
}

function traineddataDir(toolCache) {
  return path.join(ocrRuntimePrefix(toolCache), "traineddata");
}

function execScriptPath() {
  return path.join(__dirname, "pdf_ocr_exec.mjs");
}

/** Gate B 조건 2·3: 설치 상태의 exact pin + native/traineddata hash 실검증(불일치 목록 반환). */
function verifyOcrRuntime(toolCache) {
  const prefix = ocrRuntimePrefix(toolCache);
  const problems = [];
  if (!fs.existsSync(prefix)) return { ok: false, installed: false, problems: ["not installed"] };
  for (const [name, want] of Object.entries(OCR_PINS)) {
    const pj = path.join(prefix, "node_modules", ...name.split("/"), "package.json");
    if (!fs.existsSync(pj)) {
      problems.push(`package missing: ${name}`);
      continue;
    }
    let got;
    try {
      got = JSON.parse(fs.readFileSync(pj, "utf8")).version;
    } catch {
      got = null;
    }
    if (got !== want) problems.push(`version mismatch: ${name} expected ${want} got ${got}`);
  }
  const skia = path.join(prefix, SKIA_NATIVE_RELPATH);
  if (!fs.existsSync(skia)) {
    problems.push("native binary missing: skia.win32-x64-msvc.node");
  } else if (sha256Hex(fs.readFileSync(skia)) !== SKIA_NATIVE_SHA256) {
    problems.push("native binary hash mismatch: skia.win32-x64-msvc.node");
  }
  for (const lang of OCR_LANGS) {
    const f = path.join(traineddataDir(toolCache), `${lang}.traineddata`);
    if (!fs.existsSync(f)) {
      problems.push(`traineddata missing: ${lang}`);
    } else if (sha256Hex(fs.readFileSync(f)) !== TRAINEDDATA[lang].sha256) {
      problems.push(`traineddata hash mismatch: ${lang}`);
    }
  }
  return { ok: problems.length === 0, installed: true, problems };
}

// ---- selected_pages (2N-4I 계약 — ingest의 needsOcr 정합 fail-fast와 구조적으로 일치) -

function allowedOcrPages(intake) {
  // ingest(dei_producer)가 허용하는 집합과 동일 규칙: pageQuality.needsOcr ∪ ocrCandidatePages.
  const pages = new Set();
  const pq = Array.isArray(intake.pageQuality) ? intake.pageQuality : [];
  for (const q of pq) {
    if (q && typeof q === "object" && Number.isInteger(q.page) && q.needsOcr) pages.add(q.page);
  }
  const summary = intake.qualitySummary && typeof intake.qualitySummary === "object"
    ? intake.qualitySummary : {};
  for (const p of Array.isArray(summary.ocrCandidatePages) ? summary.ocrCandidatePages : []) {
    if (Number.isInteger(p)) pages.add(p);
  }
  return pages;
}

function parsePageRange(spec) {
  // "3,5-7" → [3,5,6,7]. malformed는 null.
  const out = new Set();
  for (const part of String(spec).split(",")) {
    const s = part.trim();
    if (!s) return null;
    const m = /^(\d+)(?:-(\d+))?$/.exec(s);
    if (!m) return null;
    const a = parseInt(m[1], 10);
    const b = m[2] === undefined ? a : parseInt(m[2], 10);
    if (a < 1 || b < a || b - a > 9999) return null;
    for (let i = a; i <= b; i++) out.add(i);
  }
  return [...out].sort((x, y) => x - y);
}

function selectPages(intake, userRangeSpec) {
  const allowed = allowedOcrPages(intake);
  if (userRangeSpec === null || userRangeSpec === undefined) {
    // mixed = needsOcr 집합 / scan-only = 전 페이지가 needsOcr(2L-3C 관측)라 자연히 all pages.
    return { selected: [...allowed].sort((a, b) => a - b), allowed };
  }
  const requested = parsePageRange(userRangeSpec);
  if (requested === null) return { error: "malformed", allowed };
  const outside = requested.filter((p) => !allowed.has(p));
  if (outside.length > 0) return { error: "outside", outside, allowed };
  return { selected: requested, allowed };
}

// ---- 승인 문구 (U5 3층: 승인 대화 provider 명시 / 완료 안내 미노출) -----------------

function ocrInstallApprovalMessage(toolCache) {
  const prefix = ocrRuntimePrefix(toolCache);
  return (
    "■ 스캔/이미지 페이지 판독(OCR) 도구 설치 승인이 필요합니다 (선택 사항)\n" +
    "  - 목적: 텍스트로 읽히지 않는 페이지를 문자 인식(OCR)해 검수용 보조 재료로 만듭니다.\n" +
    `  - 설치 대상: tesseract.js ${OCR_PINS["tesseract.js"]} + pdfjs-dist ${OCR_PINS["pdfjs-dist"]} + ` +
    `@napi-rs/canvas ${OCR_PINS["@napi-rs/canvas"]} (사전 빌드된 로컬 렌더링 구성요소 1개 포함 — SHA-256 검증)\n` +
    `  - 출처 1: 공식 npm registry (${R.NPM_SOURCE})\n` +
    `  - 출처 2: 언어 인식 데이터(한국어·영어) — ${TRAINEDDATA_SOURCE_HOST} (npm과 별개 출처)\n` +
    "  - 모든 다운로드 파일은 기록된 기대 SHA-256과 일치해야만 사용되며, 불일치 시 즉시 중단·정리됩니다.\n" +
    `  - 설치 위치: 로컬 전용 폴더 ${prefix} (이 저장소 밖 — 삭제는 폴더 제거로 완결)\n` +
    "  - 준비(설치·다운로드) 단계에서만 네트워크 통신이 발생하며, 판독 실행 단계는\n" +
    "    네트워크 차단(no-egress) 훅 아래에서 수행됩니다.\n" +
    "  - 설치를 거부해도 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.\n" +
    "  → 동의하시면 --approve-install 플래그와 함께 다시 실행하십시오."
  );
}

function ocrRunApprovalMessage(inputName, selected, opts) {
  return (
    "■ 스캔/이미지 페이지 판독(OCR) 실행 승인이 필요합니다 (선택 사항)\n" +
    `  - 대상 문서: ${inputName}\n` +
    `  - 판독 대상 페이지: ${selected.length}페이지 (문서의 '판독 필요' 신호가 있는 페이지만)\n` +
    `  - 실행 한도: 페이지 상한 ${opts.pageCap} · 페이지당 제한시간 ${Math.round(opts.pageTimeoutMs / 1000)}초 · ` +
    `해상도 ${opts.dpi}dpi\n` +
    "  - 실행은 네트워크 차단(no-egress) 훅 아래에서 로컬로만 수행됩니다.\n" +
    "  - 결과 텍스트는 문자 인식 산출물로, 정확도가 보증되지 않는 **검수용 보조 재료**입니다.\n" +
    "    이 텍스트만으로 근거가 확정되지 않으며 컨설턴트 검수를 반드시 거칩니다.\n" +
    "  - 거부해도 기본 텍스트 기반 검토는 계속 진행합니다(해당 페이지는 확인 불가로 표시).\n" +
    "  → 동의하시면 --approve-run 플래그와 함께 다시 실행하십시오."
  );
}

function noOcrTargetMessage() {
  return (
    "■ 문자 인식(OCR) 대상 페이지가 없습니다\n" +
    "  - 이 문서의 모든 페이지가 텍스트로 읽히는 것으로 확인되어 OCR이 필요하지 않습니다.\n" +
    "  - 기본 검토(및 구조 보강 판독 결과)로 계속 진행하십시오."
  );
}

// ---- 설치 (승인 게이트 뒤에서만 — prep egress 기록) --------------------------------

function npmExecArgv(nodeInfo) {
  // Windows에서 .cmd 직접 spawn은 Node 보안 변경(CVE-2024-27980 대응)으로 셸 없이는 EINVAL이다.
  // npm.cmd의 실체는 `node <dir>\node_modules\npm\bin\npm-cli.js` 호출이므로(시스템·portable 동일
  // 레이아웃 — 2N-4L 실측), JS 엔트리를 node로 직접 실행한다(셸 불요·공백 경로 안전).
  // 엔트리가 없는 배치(비표준)면 resolved npm을 그대로 쓴다(비-Windows 포함).
  const cli = path.join(path.dirname(String(nodeInfo.npm)),
    "node_modules", "npm", "bin", "npm-cli.js");
  if (fs.existsSync(cli)) return [nodeInfo.node, cli];
  return [String(nodeInfo.npm)];
}

function buildOcrInstallCommand(toolCache, npmArgv) {
  // Kordoc과 달리 --omit=optional을 쓰지 않는다: rasterizer(@napi-rs/canvas)가 optional 경로로
  // 해소되기 때문(Gate B 수용 조건 하의 의도된 차이 — 별도 tool-cache 항목으로 격리).
  return [
    ...(Array.isArray(npmArgv) ? npmArgv : [npmArgv]), "install",
    "--prefix", ocrRuntimePrefix(toolCache),
    "--no-audit", "--no-fund",
    `tesseract.js@${OCR_PINS["tesseract.js"]}`,
    `pdfjs-dist@${OCR_PINS["pdfjs-dist"]}`,
    `@napi-rs/canvas@${OCR_PINS["@napi-rs/canvas"]}`,
  ];
}

async function defaultFetchBuffer(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new R.RunnerError(`download failed: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function downloadTraineddata(toolCache, fetchFn, opts = {}) {
  // 제3 출처(고지된 raw.githubusercontent.com) — pinned hash fail-fast, 불일치 파일은 남기지 않는다.
  const dir = traineddataDir(toolCache);
  fs.mkdirSync(dir, { recursive: true });
  for (const lang of OCR_LANGS) {
    const url = `${TRAINEDDATA_SOURCE_BASE}/${lang}.traineddata`;
    R.appendPrepEgress(toolCache, "download", "started", `GET ${lang}.traineddata`, {
      ...opts, provider: OCR_PROVIDER, version: OCR_PINS["tesseract.js"],
      source: TRAINEDDATA_SOURCE_HOST,
    });
    let buf;
    try {
      buf = await fetchFn(url);
    } catch (e) {
      R.appendPrepEgress(toolCache, "download", "failed", `GET ${lang}.traineddata`, {
        ...opts, provider: OCR_PROVIDER, version: OCR_PINS["tesseract.js"],
        source: TRAINEDDATA_SOURCE_HOST,
      });
      throw e instanceof R.RunnerError ? e : new R.RunnerError("download failed");
    }
    if (sha256Hex(buf) !== TRAINEDDATA[lang].sha256) {
      R.appendPrepEgress(toolCache, "download", "failed hash-mismatch", `GET ${lang}.traineddata`, {
        ...opts, provider: OCR_PROVIDER, version: OCR_PINS["tesseract.js"],
        source: TRAINEDDATA_SOURCE_HOST,
      });
      throw new R.RunnerError(`traineddata hash mismatch: ${lang} (fail-fast — 파일을 저장하지 않습니다)`);
    }
    fs.writeFileSync(path.join(dir, `${lang}.traineddata`), buf);
    R.appendPrepEgress(toolCache, "download", "ok", `GET ${lang}.traineddata`, {
      ...opts, provider: OCR_PROVIDER, version: OCR_PINS["tesseract.js"],
      source: TRAINEDDATA_SOURCE_HOST,
    });
  }
}

function cleanupRuntimePrefix(toolCache) {
  // 검증 실패 시 부분 설치를 남기지 않는다(fail-fast → baseline 수렴).
  fs.rmSync(ocrRuntimePrefix(toolCache), { recursive: true, force: true });
}

// ---- 실행 (nethook block 하 별도 프로세스 — raster PNG는 디스크에 쓰지 않는다) ------

function defaultExec(cmd, envExtra) {
  const env = { ...process.env, ...(envExtra || {}) };
  const proc = spawnSync(cmd[0], cmd.slice(1), { env, encoding: "utf8" });
  const output = (proc.stdout || "") + (proc.stderr || "");
  return [proc.status === null ? 1 : proc.status, output];
}

function buildOcrRunProvenance(childOutput, evidenceMode = false) {
  const m = R.NETHOOK_SUMMARY_RE.exec(childOutput || "");
  const hookObserved = m !== null;
  const egressAttempts = m ? parseInt(m[1], 10) : null;
  const verified = Boolean(hookObserved && egressAttempts === 0);
  if (evidenceMode && !verified) {
    throw new R.RunnerError(
      "evidence 모드: no-egress 훅 요약이 관측되지 않았거나 egress 시도가 있어 실패 처리합니다.");
  }
  return {
    provider: OCR_PROVIDER,
    provider_version: OCR_PINS["tesseract.js"],
    hook_observed: hookObserved,
    egress_attempts: egressAttempts,
    no_egress_verified: verified,
  };
}

function buildOcrTextArtifact(execResult, provenance) {
  // 기존 ingest 계약(dei_producer._validate_ocr_text_contract) 그대로 + additive metadata.
  const pages = execResult.pages
    .slice()
    .sort((a, b) => a.page - b.page)
    .map((p) => ({
      page: p.page,
      text: String(p.text || ""),
      text_sha256: sha256Hex(Buffer.from(String(p.text || ""), "utf8")),
      // additive metadata(조건 9): 검수 우선순위 참고용일 뿐 판정·승격 근거가 아니다.
      confidence: typeof p.confidence === "number" ? Math.round(p.confidence * 100) / 100 : null,
      ink_ratio: typeof p.ink_ratio === "number" ? p.ink_ratio : null,
      blank_raster: Boolean(p.blank),
    }));
  const ocr = {
    provider: OCR_PROVIDER,
    provider_version: OCR_PINS["tesseract.js"],
    model: `tessdata_fast ${OCR_LANGS.join("+")}`,
    model_sha256: modelSha256(),
    model_files: Object.fromEntries(OCR_LANGS.map((l) => [l, TRAINEDDATA[l].sha256])),
    no_egress_verified: provenance.no_egress_verified,
    dpi: execResult.dpi,
    langs: [...OCR_LANGS],
    pages,
  };
  ocr.output_sha256 = canonicalOcrOutputSha256(ocr);
  return ocr;
}

function atomicWriteJson(finalPath, obj) {
  // partial artifact를 final처럼 남기지 않는다: 같은 폴더의 임시 파일에 완성본을 쓴 뒤 rename.
  const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 1), "utf8");
  fs.renameSync(tmp, finalPath);
}

// ---- CLI --------------------------------------------------------------------------

const USAGE =
  "사용법: node pdf_ocr_runner.cjs <PDF 경로> --intake <intake.json 경로> --out-dir <산출물 폴더> " +
  "[--tool-cache <경로>] [--pages <예: 3,5-7>] [--dpi 300|150] [--max-pages N] " +
  "[--check] [--approve-install] [--approve-run] [--evidence-mode]";

function parseArgs(argv) {
  const ns = {
    input: null, intake: null, outDir: null, toolCache: R.defaultToolCache(),
    pages: null, dpi: DEFAULT_DPI, pageCap: DEFAULT_PAGE_CAP,
    check: false, approveInstall: false, approveRun: false, evidenceMode: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intake") ns.intake = argv[++i];
    else if (a === "--out-dir") ns.outDir = argv[++i];
    else if (a === "--tool-cache") ns.toolCache = argv[++i];
    else if (a === "--pages") ns.pages = argv[++i];
    else if (a === "--dpi") ns.dpi = parseInt(argv[++i], 10);
    else if (a === "--max-pages") ns.pageCap = parseInt(argv[++i], 10);
    else if (a === "--check") ns.check = true;
    else if (a === "--approve-install") ns.approveInstall = true;
    else if (a === "--approve-run") ns.approveRun = true;
    else if (a === "--evidence-mode") ns.evidenceMode = true;
    else if (!a.startsWith("-") && ns.input === null) ns.input = a;
    else return null;
  }
  if (!ns.input || !ns.intake || !ns.outDir) return null;
  if (![300, 150].includes(ns.dpi)) return null;
  if (!Number.isInteger(ns.pageCap) || ns.pageCap < 1) return null;
  return ns;
}

async function main(argv, opts = {}) {
  const whichFn = opts.which || R.which;
  const execFn = opts.execFn || defaultExec;
  const fetchFn = opts.fetchFn || defaultFetchBuffer;
  // verifyFn 주입은 테스트 전용(programmatic opts — CLI로는 불가). 기본은 실검증이다(Gate B 조건 2·3).
  const verifyFn = opts.verifyFn || verifyOcrRuntime;

  const ns = parseArgs(argv || []);
  if (ns === null) {
    console.error(USAGE);
    return R.EXIT_USAGE;
  }

  // 1) 범위: PDF만(page-set OCR은 paginated 계약 전용 — document-level 포맷은 명시 범위 밖)
  const ext = path.extname(ns.input).toLowerCase();
  if (ext !== ".pdf") {
    console.log(
      `■ 이 파일 형식(${ext || "(확장자 없음)"})은 문자 인식(OCR) 경로의 범위 밖입니다\n` +
      "  - 이 경로는 PDF의 '판독 필요' 페이지만 다룹니다.\n" +
      "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.");
    return R.EXIT_OUT_OF_SCOPE;
  }

  // 2) intake 신호에서 page-set 산정(임의 확대 금지)
  let intake;
  try {
    intake = JSON.parse(fs.readFileSync(ns.intake, "utf8"));
  } catch {
    console.log("■ intake 산출물(intake.json)을 읽을 수 없습니다 — 구조 보강 판독을 먼저 수행하십시오.\n" +
      "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.");
    return R.EXIT_OUT_OF_SCOPE;
  }
  const sel = selectPages(intake, ns.pages);
  if (sel.error === "malformed") {
    console.error(USAGE);
    return R.EXIT_USAGE;
  }
  if (sel.error === "outside") {
    console.log(
      "■ 지정한 페이지 범위에 문자 인식(OCR) 대상이 아닌 페이지가 포함되어 있습니다\n" +
      `  - 대상 밖 페이지: ${sel.outside.join(", ")} (텍스트로 읽히는 페이지는 OCR로 대체하지 않습니다)\n` +
      "  - '판독 필요' 신호가 있는 페이지만 지정할 수 있습니다.");
    return R.EXIT_OUT_OF_SCOPE;
  }
  if (sel.selected.length === 0) {
    console.log(noOcrTargetMessage());
    return R.EXIT_OK;
  }
  if (sel.selected.length > ns.pageCap) {
    console.log(
      `■ 문자 인식(OCR) 대상이 ${sel.selected.length}페이지로 실행 상한(${ns.pageCap}페이지)을 초과합니다\n` +
      "  - --pages로 대상 구간을 나누어 실행하거나, --max-pages로 상한을 명시적으로 조정하십시오.\n" +
      "  - 기본 텍스트 기반 검토는 계속 진행할 수 있습니다.");
    return R.EXIT_OUT_OF_SCOPE;
  }

  if (R.isInsideRepo(ns.outDir)) {
    console.log("주의: --out-dir이 git 저장소 내부로 보입니다. 산출물은 저장소 밖 폴더를 권장합니다.");
  }

  // 3) 런타임 상태(npm은 설치 시에만 필요)
  const runtime = verifyFn(ns.toolCache);
  const boundedOpts = { pageCap: ns.pageCap, pageTimeoutMs: DEFAULT_PAGE_TIMEOUT_MS, dpi: ns.dpi };

  // 4) check/plan 모드
  if (ns.check) {
    console.log("■ 점검 결과(plan 모드 — 설치/실행 없음)");
    console.log(`  - 문자 인식(OCR) 대상 페이지: ${sel.selected.length}페이지 [${sel.selected.join(", ")}]`);
    console.log(`  - OCR 도구 상태: ${runtime.ok ? "준비됨(무결성 검증 통과)" : "설치/검증 필요"}`);
    if (!runtime.ok) console.log(ocrInstallApprovalMessage(ns.toolCache));
    console.log(ocrRunApprovalMessage(path.basename(ns.input), sel.selected, boundedOpts));
    return R.EXIT_OK;
  }

  // 5) 설치 승인 게이트(무결성 불일치도 재설치 대상 — fail-fast 후 승인 안내)
  if (!runtime.ok) {
    if (runtime.installed && runtime.problems.length) {
      // Gate B 조건 3: 어떤 mismatch도 그대로 실행하지 않는다 — 정리 후 재승인 안내.
      console.log("■ 설치된 OCR 도구가 기록된 버전/무결성 기준과 일치하지 않아 사용하지 않습니다");
      for (const p of runtime.problems.slice(0, 5)) console.log(`  - ${p}`);
      cleanupRuntimePrefix(ns.toolCache);
    }
    if (!ns.approveInstall) {
      console.log(ocrInstallApprovalMessage(ns.toolCache));
      return R.EXIT_INSTALL_APPROVAL_REQUIRED;
    }
    const node = R.detectNode(whichFn, ns.toolCache, opts.probeFn || R.portableNodeVersionProbe);
    if (!node.node || !node.npm) {
      console.log(R.nodeMissingMessage());
      return R.EXIT_NODE_MISSING;
    }
    const cmd = buildOcrInstallCommand(ns.toolCache, npmExecArgv(node));
    R.recordApproval(ns.toolCache, "install", OCR_RUNTIME_DIRNAME, opts);
    R.appendPrepEgress(ns.toolCache, "install", "started", cmd.slice(0, 6).join(" ") + " ...",
      { ...opts, provider: OCR_PROVIDER, version: OCR_PINS["tesseract.js"] });
    const [rc] = execFn(cmd, {});
    R.appendPrepEgress(ns.toolCache, "install", rc === 0 ? "ok" : `failed rc=${rc}`,
      cmd.slice(0, 6).join(" ") + " ...",
      { ...opts, provider: OCR_PROVIDER, version: OCR_PINS["tesseract.js"] });
    if (rc !== 0) {
      cleanupRuntimePrefix(ns.toolCache);
      console.log("설치에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도하거나, 기본 텍스트 기반 검토로 계속하십시오.");
      return R.EXIT_RUN_FAILED;
    }
    try {
      await downloadTraineddata(ns.toolCache, fetchFn, opts);
    } catch (e) {
      if (!(e instanceof R.RunnerError)) throw e;
      cleanupRuntimePrefix(ns.toolCache);
      console.log(e.message);
      console.log("언어 인식 데이터 준비에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.");
      return R.EXIT_RUN_FAILED;
    }
    const recheck = verifyFn(ns.toolCache);
    if (!recheck.ok) {
      // Gate B 조건 3: 설치 직후에도 pin/hash 전수 검증 — 불일치는 부분 설치 정리 후 중단.
      for (const p of recheck.problems.slice(0, 5)) console.log(`  - ${p}`);
      cleanupRuntimePrefix(ns.toolCache);
      console.log("설치 검증에 실패했습니다(버전/무결성 불일치). 기본 텍스트 기반 검토로 계속하십시오.");
      return R.EXIT_RUN_FAILED;
    }
  }

  // 6) 실행 승인 게이트
  if (!ns.approveRun) {
    console.log(ocrRunApprovalMessage(path.basename(ns.input), sel.selected, boundedOpts));
    return R.EXIT_RUN_APPROVAL_REQUIRED;
  }

  fs.mkdirSync(ns.outDir, { recursive: true });
  R.recordApproval(ns.toolCache, "run", `ocr:${path.basename(ns.input)}`, opts);

  // scratch(체크포인트·결과·OCR cache)는 repo 밖 임시 폴더 — 종료 시 항상 삭제.
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "kssb-ocr-"));
  try {
    const config = {
      pdfPath: path.resolve(ns.input),
      prefix: ocrRuntimePrefix(ns.toolCache),
      tdataDir: traineddataDir(ns.toolCache),
      pages: sel.selected,
      dpi: ns.dpi,
      batchSize: DEFAULT_BATCH_SIZE,
      perPageTimeoutMs: DEFAULT_PAGE_TIMEOUT_MS,
      inkBlankThreshold: INK_BLANK_THRESHOLD,
      scratchDir: scratch,
      resultPath: path.join(scratch, "exec_result.json"),
    };
    const configPath = path.join(scratch, "exec_config.json");
    fs.writeFileSync(configPath, JSON.stringify(config), "utf8");

    const cmd = [process.execPath, "--require", R.nethookPath(), execScriptPath(), configPath];
    const [rc, output] = execFn(cmd, { NETHOOK_MODE: "block" });

    let provenance;
    try {
      provenance = buildOcrRunProvenance(output, ns.evidenceMode);
    } catch (e) {
      if (!(e instanceof R.RunnerError)) throw e;
      R.appendRunLog(ns.toolCache, buildOcrRunProvenance(output, false),
        path.basename(ns.input), opts);
      console.log(e.message);
      console.log("문자 인식 실행에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.");
      return R.EXIT_RUN_FAILED;
    }
    R.appendRunLog(ns.toolCache, provenance, path.basename(ns.input), opts);

    if (rc !== 0 || !fs.existsSync(config.resultPath)) {
      // exec의 통제된 실패(3=blank guard, 4=timeout, 그 외) — 전부 baseline 수렴, 부분 산출물 없음.
      if (rc === 3) {
        console.log("문자 인식 결과가 비어 있습니다(전 페이지 백지 렌더 — 렌더링 실패로 간주하여 산출물을 만들지 않습니다).");
      } else if (rc === 4) {
        console.log("문자 인식이 페이지당 제한시간을 초과했습니다(부분 결과는 남기지 않습니다).");
      }
      console.log("문자 인식 실행에 실패했습니다. 기본 텍스트 기반 검토로 계속하십시오.");
      return R.EXIT_RUN_FAILED;
    }

    const execResult = JSON.parse(fs.readFileSync(config.resultPath, "utf8"));
    const ocr = buildOcrTextArtifact(execResult, provenance);
    const stem = path.basename(ns.input, path.extname(ns.input));
    const finalPath = path.join(ns.outDir, `${stem}.ocr_text.json`);
    atomicWriteJson(finalPath, ocr);

    console.log("■ 문자 인식 완료 — 산출물이 지정한 폴더에 생성되었습니다.");
    console.log(`  - ${path.basename(finalPath)} (${ocr.pages.length}페이지)`);
    console.log("  - 이 텍스트는 문자 인식 산출물로 정확도가 보증되지 않는 검수용 보조 재료입니다.");
    console.log("    근거 확정에 단독으로 사용되지 않으며, 컨설턴트 검수를 반드시 거칩니다.");
    return R.EXIT_OK;
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

module.exports = {
  OCR_PINS,
  SKIA_NATIVE_RELPATH,
  SKIA_NATIVE_SHA256,
  TRAINEDDATA,
  TRAINEDDATA_SOURCE_HOST,
  TRAINEDDATA_SOURCE_BASE,
  OCR_RUNTIME_DIRNAME,
  OCR_PROVIDER,
  OCR_LANGS,
  DEFAULT_DPI,
  DEFAULT_PAGE_CAP,
  DEFAULT_BATCH_SIZE,
  DEFAULT_PAGE_TIMEOUT_MS,
  INK_BLANK_THRESHOLD,
  USAGE,
  pythonJsonDumps,
  canonicalOcrOutputSha256,
  sha256Hex,
  modelSha256,
  ocrRuntimePrefix,
  traineddataDir,
  execScriptPath,
  verifyOcrRuntime,
  allowedOcrPages,
  parsePageRange,
  selectPages,
  ocrInstallApprovalMessage,
  ocrRunApprovalMessage,
  noOcrTargetMessage,
  npmExecArgv,
  buildOcrInstallCommand,
  downloadTraineddata,
  cleanupRuntimePrefix,
  buildOcrRunProvenance,
  buildOcrTextArtifact,
  atomicWriteJson,
  parseArgs,
  main,
};

if (require.main === module) {
  // CLI 경계 방어: RunnerError는 stack/로컬 경로 노출 없이 문서화된 실패 코드(7)로 수렴.
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((e) => {
      if (e instanceof R.RunnerError) {
        console.log(e.message);
        process.exit(R.EXIT_RUN_FAILED);
      }
      throw e;
    });
}
