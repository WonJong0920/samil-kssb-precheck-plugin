/**
 * Samil KSSB Precheck - Delivery Orchestrator (Node port, Cycle 2N-6 Phase 2 N2).
 *
 * findings → **Node validator preflight(detect-only)** → **D94 hard stop**(error ≥ 1이면 보고서 미생성)
 * → Node renderer(HTML → Markdown, 재판정 없음) → **사용자-facing 전달 요약**을 잇는 얇은 배선기다.
 * `kssb_report_delivery.py`(Python — transitional reference)의 경계를 계승하되, D94에 따라
 * **preflight error 시 통제된 중단**을 구현한다(Python reference는 정책대로 무변경 — 경고 후 생성 계속).
 *
 * 경계:
 * - **재판정 없음**: 판정·근거·질문·권고를 만들지 않는다. validator는 detect-only, renderer는 형식 변환만.
 * - **로그 분리(사용자/내부)**: 사용자 요약에는 로컬 절대경로·계정명·raw validator 이슈(location 포함)·
 *   stack trace·내부 진단을 노출하지 않는다(건수만). 상세는 프로그램 반환값과 `--debug` stderr에만.
 * - **DOCX 없음**: 이 Node 경로의 산출 형식은 HTML → Markdown이다(DOCX는 N4 대상 — placeholder 없음).
 * - 외부 의존성 0 (Node 내장 모듈만).
 *
 * CLI 종료 코드: 0=성공 / 2=findings 로드 실패 / 3=렌더 불가(RenderError) /
 *               4=preflight hard stop(D94 — error ≥ 1, 산출물 미생성) / 1=예기치 못한 내부 실패(통제된 안내).
 */
"use strict";

const path = require("node:path");

const R = require(path.join(__dirname, "kssb_report_renderer.cjs"));
const V = require(path.join(__dirname, "..", "validators", "kssb_findings_validator.cjs"));

// 사용자-facing 요약에서 로컬 절대경로/계정명을 제거하는 방어 정규식(2차 안전망 — Python과 동일 패턴).
const _LOCAL_PATH_RE = new RegExp(
  String.raw`([A-Za-z]:[\\/][Uu]sers[\\/][^\\/\s]+|/(?:home|Users)/[^/\s]+|[A-Za-z]:[\\/][^\s]*)`, "g");

function _displayPath(p) {
  if (!p) return "";
  const resolved = path.resolve(String(p));
  const cwd = path.resolve(process.cwd());
  if (resolved === cwd) return "";
  if (resolved.startsWith(cwd + path.sep)) {
    return resolved.slice(cwd.length + 1).split(path.sep).join("/");
  }
  return path.basename(resolved);
}

function _redact(text) {
  return text.replace(_LOCAL_PATH_RE, "[REDACTED_LOCAL_PATH]");
}

function _issueCounts(issues) {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity] = (counts[i.severity] || 0) + 1;
  return counts;
}

function _s(v) {
  return v === null || v === undefined ? "" : String(v);
}

function _dict(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function _list(v) {
  return Array.isArray(v) ? v : [];
}

/** 성공 시 사용자-facing 전달 요약(안전). 로그·절대경로·계정명·validator raw 출력 없음. */
function buildUserSummary(findings, outputs, preflightCounts) {
  const meta = _dict(findings.report_meta);
  const title = _s(meta.report_title) || "KSSB 공시근거 사전검토 보고서 (초안)";

  const lines = [];
  lines.push(`■ ${title}`);
  lines.push("");
  lines.push("● 대표 문서");
  if (outputs.primary) {
    lines.push(`  - 파일명: ${path.basename(outputs.primary)}`);
    lines.push(`  - 위치(표시 경로): ${_displayPath(outputs.primary)}`);
    lines.push(`  - 형식: ${outputs.primary_format} (이 실행 경로의 산출 형식: HTML → Markdown)`);
  } else {
    lines.push("  - (대표 문서 생성 실패)");
  }
  const fbs = [];
  for (const fmt of ["html", "markdown"]) {
    const p = outputs[fmt];
    if (p && p !== outputs.primary) fbs.push(`${fmt}: ${path.basename(p)}`);
  }
  if (fbs.length) lines.push(`  - fallback: ${fbs.join(", ")}`);
  lines.push("  - 참고: DOCX 형식은 이 실행 경로에서 생성되지 않습니다.");

  lines.push("");
  lines.push("● 검토 전 자체 점검(preflight)");
  lines.push(`  - 구조/정합 점검 결과: error ${preflightCounts.error || 0}건, `
    + `warning ${preflightCounts.warning || 0}건 (세부는 내부 점검 기록으로 분리)`);
  if ((preflightCounts.warning || 0) > 0) {
    lines.push("  - warning은 보고서 생성을 막지 않지만, 컨설턴트 검수 시 내부 점검 기록 확인을 권장합니다.");
  }

  // 사람 검수 필요 항목 수
  let hr = 0;
  for (const a of _list(findings.kssb_areas)) {
    for (const it of _list(_dict(a).items)) {
      if (_dict(it).human_review_required) hr += 1;
    }
  }
  lines.push("");
  lines.push("● 사람 검수 안내");
  const boundary = _s(findings.human_review_boundary);
  if (boundary) lines.push(`  - ${boundary}`);
  else lines.push("  - 본 산출물은 컨설턴트 검수용 초안입니다. 최종 판단은 컨설턴트가 수행합니다.");
  if (hr) lines.push(`  - 사람 검수 대상(상충·해석 필요 등) 항목: ${hr}건`);

  lines.push("");
  lines.push("● 경계 고지");
  const disclaimer = _s(_dict(findings.report_meta).disclaimer);
  if (disclaimer) lines.push(`  - ${disclaimer}`);
  else lines.push("  - 본 도구는 감사·인증·준수 판단을 대체하지 않으며, 확인 불가 항목을 미공시로 단정하지 않습니다.");

  return _redact(lines.join("\n"));
}

/** D94 hard stop 시 사용자-facing 안내(안전 — raw 이슈·위치·경로 없음). */
function buildHardStopSummary(preflightCounts) {
  const lines = [];
  lines.push("■ 보고서 생성을 중단했습니다 (검토 전 자체 점검 실패)");
  lines.push("");
  lines.push(`  - 검토 전 자체 점검(preflight)에서 구조/정합 오류 ${preflightCounts.error || 0}건이 발견되었습니다.`);
  lines.push("  - findings를 보완한 뒤 다시 생성해 주십시오(오류가 있는 상태의 보고서는 생성하지 않습니다).");
  lines.push("  - 세부 오류 내역은 내부 점검 기록으로 분리되어 있습니다(작업 환경에서 확인).");
  return lines.join("\n");
}

/**
 * findings를 전달 산출물로 배선한다(D94 hard stop 포함).
 *
 * 반환:
 *   {
 *     "hard_stop": <boolean — preflight error ≥ 1로 중단했는지>,
 *     "user_summary": <안전한 사용자-facing 요약/중단 안내>,
 *     "outputs": <renderReport 결과(내부: 전체 경로 포함) 또는 {} (hard stop 시)>,
 *     "preflight": {"counts": {...}, "issues": [ {severity,code,location,message}, ... ]},  // 내부
 *     "internal_notes": [...]  // 내부(디버그)
 *   }
 * - user_summary만 사용자에게 노출한다. outputs/preflight/internal_notes는 내부용이다.
 * - hard stop 시 어떤 보고서 파일도 생성하지 않는다(out_dir 미생성 포함).
 */
function deliver(findings, outDir, options = {}) {
  const { baseName = null } = options;
  if (!(findings !== null && typeof findings === "object" && !Array.isArray(findings))) {
    throw new R.RenderError("findings 최상위가 JSON 객체가 아닙니다.");
  }

  // 1) preflight 검증(detect-only, Node validator — findings 미변경).
  const issues = V.validateFindings(findings);
  const counts = _issueCounts(issues);
  const preflight = { counts, issues: issues.map((i) => i.asDict()) };

  // 2) D94 hard stop: error ≥ 1이면 보고서를 생성하지 않는다(산출물 0).
  if ((counts.error || 0) >= 1) {
    return {
      hard_stop: true,
      user_summary: buildHardStopSummary(counts),
      outputs: {},
      preflight,
      internal_notes: [`preflight: ${JSON.stringify(counts)}`, "hard_stop: report generation blocked (D94)"],
    };
  }

  // 3) 대표 문서 렌더(재판정 없음). HTML → Markdown.
  const outputs = R.renderReport(findings, outDir, { baseName });

  // 4) 사용자-facing 요약(안전) 생성.
  const userSummary = buildUserSummary(findings, outputs, counts);

  return {
    hard_stop: false,
    user_summary: userSummary,
    outputs,
    preflight,
    internal_notes: [`preflight: ${JSON.stringify(counts)}`],
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = "사용법: node kssb_report_delivery.cjs <findings.json> [-o|--out <출력 폴더>] "
  + "[--base-name <이름>] [--debug]";

function main(argv) {
  const args = { findings: null, outDir: ".", baseName: null, debug: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--out" || a === "--out-dir") {
      const v = argv[++i];
      if (!v) { console.error(USAGE); return 2; }
      args.outDir = v;
    } else if (a === "--base-name") {
      const v = argv[++i];
      if (!v) { console.error(USAGE); return 2; }
      args.baseName = v;
    } else if (a === "--debug") args.debug = true;
    else if (!a.startsWith("-") && args.findings === null) args.findings = a;
    else { console.error(USAGE); return 2; }
  }
  if (!args.findings) { console.error(USAGE); return 2; }

  let findings;
  try {
    findings = R.loadFindings(args.findings);
  } catch (e) {
    console.error(`[error] findings 로드 실패: ${e.message}`);
    return 2;
  }

  let result;
  try {
    result = deliver(findings, args.outDir, { baseName: args.baseName });
  } catch (e) {
    if (e instanceof R.RenderError) {
      console.error(`[error] 전달 불가: ${e.message}`);
      return 3;
    }
    // 예기치 못한 내부 실패 — 사용자-facing에는 stack/경로를 노출하지 않는다(통제된 안내).
    console.error("[error] 보고서 생성 중 문제가 발생해 중단했습니다. 출력 폴더 경로·쓰기 권한을 확인한 뒤 다시 시도해 주십시오.");
    if (args.debug) console.error(`---- internal (debug) ----\n${e.stack || e.message}`);
    return 1;
  }

  // 사용자-facing 요약만 stdout으로.
  console.log(result.user_summary);

  // 내부 상세는 --debug 시에만 stderr로(사용자-facing과 분리).
  if (args.debug) {
    console.error("---- internal (debug) ----");
    console.error(JSON.stringify({
      outputs: result.outputs, preflight: result.preflight, internal_notes: result.internal_notes,
    }, null, 2));
  }

  return result.hard_stop ? 4 : 0;
}

module.exports = { deliver, buildUserSummary, buildHardStopSummary, main };

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
