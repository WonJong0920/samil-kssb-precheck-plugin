// Samil KSSB Precheck - Page-set OCR 실행 스크립트(Cycle 2N-4L, source-only).
//
// pdf_ocr_runner.cjs가 승인 게이트 뒤에서 `node --require nethook.cjs`(NETHOOK_MODE=block)로만
// 기동한다 — 단독 사용자-facing 진입점이 아니다. 모든 입력(패키지·traineddata·표준 폰트)은
// tool-cache의 로컬 파일이며 실행 중 네트워크가 필요 없다(no-egress 훅 하 완주가 계약).
//
// artifact 방어: 래스터 이미지는 **디스크에 쓰지 않는다**(canvas → PNG Buffer → OCR 직행).
// 체크포인트(pages.jsonl)와 결과(exec_result.json)는 runner가 만든 repo 밖 scratch에만 생성되고
// runner가 종료 시 scratch 전체를 삭제한다. 최종 ocr_text.json은 runner가 원자적으로 방출한다.
//
// exit: 0=성공 / 3=blank-raster guard(전 페이지 백지 — 렌더 실패 간주) / 4=페이지 timeout / 1=기타.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
// prefix 직속 anchor에서 해석 → tool-cache의 node_modules만 본다(repo/전역 오염 없음).
const requireFromPrefix = createRequire(path.join(config.prefix, "_resolve_anchor.js"));

const pdfjs = await import(pathToFileURL(
  path.join(config.prefix, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href);
const { createCanvas } = requireFromPrefix("@napi-rs/canvas");
const { createWorker } = requireFromPrefix("tesseract.js");

// Gate B 조건 6: 로컬 standardFontDataUrl 고정(미지정 시 표준 폰트 텍스트가 무오류 백지 렌더 —
// 2N-4K 실측). 스캔 이미지 페이지는 폰트와 무관하지만 혼합 PDF의 텍스트 성분 보존에 필요.
const STD_FONTS = path.join(config.prefix, "node_modules", "pdfjs-dist", "standard_fonts") + path.sep;

function inkRatio(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data;
  let ink = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) ink++;
  }
  return Number((ink / (w * h)).toFixed(5));
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`PAGE_TIMEOUT ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const checkpointPath = path.join(config.scratchDir, "pages.jsonl");
const doc = await pdfjs.getDocument({
  data: new Uint8Array(fs.readFileSync(config.pdfPath)),
  standardFontDataUrl: STD_FONTS,
}).promise;

const results = [];
let timedOut = false;

// batch 단위 worker 재사용(2N-4K: createWorker init ~0.3s 상각) — batch 종료마다 반드시 terminate.
for (let i = 0; i < config.pages.length && !timedOut; i += config.batchSize) {
  const batch = config.pages.slice(i, i + config.batchSize);
  const worker = await createWorker([...config.langs || ["kor", "eng"]], 1, {
    langPath: config.tdataDir,
    gzip: false,
    cachePath: config.scratchDir,
  });
  try {
    for (const pageNo of batch) {
      const t0 = process.hrtime.bigint();
      const page = await doc.getPage(pageNo);
      const vp = page.getViewport({ scale: config.dpi / 72 });
      const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const ink = inkRatio(ctx, canvas.width, canvas.height);
      const rasterMs = Math.round(Number(process.hrtime.bigint() - t0) / 1e6);
      page.cleanup();

      let entry;
      if (ink < config.inkBlankThreshold) {
        // 개별 백지 페이지는 additive로 기록만(실제 빈 스캔 페이지일 수 있음) — OCR 생략.
        entry = { page: pageNo, text: "", confidence: null, ink_ratio: ink,
          blank: true, raster_ms: rasterMs, ocr_ms: 0 };
      } else {
        const png = await canvas.encode("png"); // Buffer만 — 디스크 미기록
        const t1 = process.hrtime.bigint();
        let data;
        try {
          ({ data } = await withTimeout(worker.recognize(png),
            config.perPageTimeoutMs, `p${pageNo}`));
        } catch (e) {
          if (String(e && e.message).startsWith("PAGE_TIMEOUT")) {
            timedOut = true;
            break;
          }
          throw e;
        }
        entry = {
          page: pageNo,
          text: data.text || "",
          confidence: typeof data.confidence === "number" ? data.confidence : null,
          ink_ratio: ink,
          blank: false,
          raster_ms: rasterMs,
          ocr_ms: Math.round(Number(process.hrtime.bigint() - t1) / 1e6),
        };
      }
      results.push(entry);
      fs.appendFileSync(checkpointPath, JSON.stringify(entry) + "\n", "utf8");
    }
  } finally {
    await worker.terminate();
  }
}
await doc.destroy();

if (timedOut) process.exit(4);
if (results.length > 0 && results.every((r) => r.blank)) process.exit(3);

fs.writeFileSync(config.resultPath, JSON.stringify({
  dpi: config.dpi,
  pages: results,
}), "utf8");
process.exit(0);
