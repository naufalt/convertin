import { parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import Module from 'node:module';

// Polyfill and intercept canvas for pdfjs-dist in background worker thread
const canvasModule = require('@napi-rs/canvas');
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === 'canvas') return canvasModule;
  return originalRequire.apply(this, arguments);
};
(global as any).DOMMatrix = canvasModule.DOMMatrix;
(global as any).Path2D = canvasModule.Path2D;
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

interface WorkerPayload {
  id: string;
  inputPath: string;
  finalOutputPath: string;
  targetExt: string;
  ffmpegPath: string;
}

async function runPdfWorker(payload: WorkerPayload) {
  const { id, inputPath, finalOutputPath, targetExt, ffmpegPath } = payload;
  const outputDir = path.dirname(finalOutputPath);

  parentPort?.postMessage({ type: 'progress', id, percent: 5 });

  const fileBytes = fs.readFileSync(inputPath);
  parentPort?.postMessage({ type: 'progress', id, percent: 12 });

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(fileBytes),
    disableFontFace: true,
  }).promise;

  parentPort?.postMessage({ type: 'progress', id, percent: 20 });

  const page = await doc.getPage(1);
  const rawVp = page.getViewport({ scale: 1.0 });

  // Intelligent scaling & downsampling for huge files (e.g. 50MB+ vector mockups)
  const maxDim = Math.max(rawVp.width, rawVp.height);
  let scale = 1.5;
  if (maxDim > 4000) {
    scale = 0.5; // huge banner/Figma mockups: scale down to avoid OOM
  } else if (maxDim > 2000) {
    scale = 0.8;
  } else if (maxDim > 1200) {
    scale = 1.0;
  }

  const viewport = page.getViewport({ scale });
  const width = Math.max(1, Math.floor(viewport.width));
  const height = Math.max(1, Math.floor(viewport.height));

  const canvas = canvasModule.createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  parentPort?.postMessage({ type: 'progress', id, percent: 25 });

  // Real-time render progress: hook into operator rendering loop
  let tick = 0;
  let lastReported = 25;
  const renderTask = page.render({
    canvasContext: ctx,
    viewport: viewport
  });

  renderTask.onContinue = (continueRender: () => void) => {
    tick++;
    // Gradual smooth progress from 25% to 88%
    const calculated = Math.min(88, Math.round(25 + (tick / (tick + 25)) * 63));
    if (calculated > lastReported) {
      lastReported = calculated;
      parentPort?.postMessage({ type: 'progress', id, percent: calculated });
    }
    continueRender();
  };

  await renderTask.promise;

  parentPort?.postMessage({ type: 'progress', id, percent: 90 });

  const pngBuf = canvas.toBuffer('image/png');
  parentPort?.postMessage({ type: 'progress', id, percent: 96 });

  if (targetExt === 'png') {
    fs.writeFileSync(finalOutputPath, pngBuf);
    parentPort?.postMessage({ type: 'done', id, success: true, outputPath: finalOutputPath });
    return;
  }

  // Convert to target image format via FFmpeg child process
  const tempPng = path.join(outputDir, `temp_worker_pdf_${Date.now()}.png`);
  fs.writeFileSync(tempPng, pngBuf);

  const args = ['-y', '-i', tempPng];
  if (targetExt === 'ico') {
    args.push('-vf', 'scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2:color=black@0');
  } else if (targetExt === 'webp') {
    args.push('-c:v', 'libwebp', '-quality', '85');
  } else if (targetExt === 'avif') {
    args.push('-c:v', 'libsvtav1', '-crf', '30');
  } else if (['jpg', 'jpeg'].includes(targetExt)) {
    args.push('-q:v', '2');
  }
  args.push(finalOutputPath);

  const proc = spawn(ffmpegPath, args, { shell: false });
  let stderr = '';
  proc.stderr?.on('data', (d) => {
    stderr += d.toString();
  });

  proc.on('close', (c) => {
    try {
      fs.unlinkSync(tempPng);
    } catch {}
    if (c === 0) {
      parentPort?.postMessage({ type: 'done', id, success: true, outputPath: finalOutputPath });
    } else {
      parentPort?.postMessage({ type: 'done', id, success: false, error: stderr.slice(-300) || `FFmpeg failed with exit code ${c}` });
    }
  });

  proc.on('error', (err) => {
    try {
      fs.unlinkSync(tempPng);
    } catch {}
    parentPort?.postMessage({ type: 'done', id, success: false, error: err.message });
  });
}

if (workerData) {
  runPdfWorker(workerData).catch((err) => {
    parentPort?.postMessage({ type: 'done', id: workerData.id, success: false, error: err?.message || 'Worker thread error' });
  });
}

