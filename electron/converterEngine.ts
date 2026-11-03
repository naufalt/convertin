import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import { resolveBinaries } from './binaryResolver';
import { PDFDocument } from 'pdf-lib';
import { Resvg } from '@resvg/resvg-js';
import { Worker } from 'node:worker_threads';
import Module from 'node:module';
import { convertOfficeDocument } from './officeEngine';
import { inspectPdfForDocxConversion } from './pdfInspector';

// Polyfill and intercept canvas for pdfjs-dist
const canvasModule = require('@napi-rs/canvas');
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === 'canvas') return canvasModule;
  return originalRequire.apply(this, arguments);
};
(global as any).DOMMatrix = canvasModule.DOMMatrix;
(global as any).Path2D = canvasModule.Path2D;
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

// Active child processes mapped by queue id
const activeProcesses = new Map<string, ChildProcess>();

export function cancelProcess(id: string): boolean {
  const proc = activeProcesses.get(id);
  if (proc) {
    try {
      proc.kill('SIGTERM');
      if (proc.pid) {
        process.kill(proc.pid);
      }
    } catch {
      // ignore
    }
    activeProcesses.delete(id);
    return true;
  }
  return false;
}

export function formatSecondsToTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getAutoIncrementedPath(targetPath: string): string {
  if (!fs.existsSync(targetPath)) return targetPath;

  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const base = path.basename(targetPath, ext);

  let counter = 1;
  let candidate = path.join(dir, `${base} (${counter})${ext}`);

  while (fs.existsSync(candidate)) {
    counter++;
    candidate = path.join(dir, `${base} (${counter})${ext}`);
  }

  return candidate;
}

export interface ConvertOptions {
  id: string;
  inputPath: string;
  outputPath: string;
  targetFormat: string;
  mediaType: string;
  useNvenc: boolean;
}

// Convert image directly to PDF using pdf-lib (100% offline)
async function convertImageToPdf(inputPath: string, outputPath: string): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const ext = path.extname(inputPath).toLowerCase().replace('.', '');

  let embeddedImage;
  if (ext === 'jpg' || ext === 'jpeg') {
    const fileBytes = fs.readFileSync(inputPath);
    embeddedImage = await pdfDoc.embedJpg(fileBytes);
  } else if (ext === 'png') {
    const fileBytes = fs.readFileSync(inputPath);
    embeddedImage = await pdfDoc.embedPng(fileBytes);
  } else if (ext === 'svg') {
    const svgContent = fs.readFileSync(inputPath);
    const resvg = new Resvg(svgContent);
    const pngBuffer = resvg.render().asPng();
    embeddedImage = await pdfDoc.embedPng(pngBuffer);
  } else {
    // Fallback convert to PNG via FFmpeg
    const binaries = resolveBinaries();
    const tempPng = path.join(path.dirname(outputPath), `temp_${Date.now()}.png`);
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(binaries.paths.ffmpeg, ['-y', '-i', inputPath, tempPng], { shell: false });
      proc.on('close', (c) => (c === 0 ? resolve() : reject(new Error('Failed to rasterize image to PNG'))));
      proc.on('error', reject);
    });

    const tempBytes = fs.readFileSync(tempPng);
    try {
      fs.unlinkSync(tempPng);
    } catch {
      // ignore
    }
    embeddedImage = await pdfDoc.embedPng(tempBytes);
  }

  const { width, height } = embeddedImage;
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

export async function executeConversion(
  options: ConvertOptions,
  mainWindow: BrowserWindow | null,
  onProgressUpdate?: (percent: number) => void
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  const { id, inputPath, outputPath: requestedOutputPath, targetFormat, mediaType, useNvenc } = options;
  const binaries = resolveBinaries();

  // Ensure unique destination path
  const finalOutputPath = getAutoIncrementedPath(requestedOutputPath);
  const outputDir = path.dirname(finalOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const inputExt = path.extname(inputPath).toLowerCase().replace('.', '');
  const targetExt = targetFormat.toLowerCase();

  // Special handler: Office Documents (docx, pptx, xlsx to PDF, or PDF to docx)
  const isOfficeInput = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'rtf', 'txt', 'csv'].includes(inputExt);
  const isOfficeTarget = ['docx', 'doc'].includes(targetExt);
  if ((isOfficeInput && targetExt === 'pdf') || (inputExt === 'pdf' && isOfficeTarget)) {
    try {
      // Pre-flight inspection for PDF to DOCX: Check if PDF has real text or is just scanned images
      if (inputExt === 'pdf' && isOfficeTarget) {
        mainWindow?.webContents.send('conversion-progress', { id, percent: 10 });
        const inspection = await inspectPdfForDocxConversion(inputPath);
        if (!inspection.isConvertibleToDocx) {
          return {
            success: false,
            error: inspection.reason || 'Berkas PDF ini murni berisi gambar/scan tanpa teks digital, sehingga tidak dapat dikonversi ke DOCX.'
          };
        }
      }

      mainWindow?.webContents.send('conversion-progress', { id, percent: 30 });
      const res = await convertOfficeDocument(inputPath, finalOutputPath, targetExt, (pct) => {
        mainWindow?.webContents.send('conversion-progress', { id, percent: pct });
        onProgressUpdate?.(pct);
      });
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memproses dokumen Office' };
    }
  }

  // Special handler: Image to PDF
  if (targetExt === 'pdf') {
    try {
      mainWindow?.webContents.send('conversion-progress', { id, percent: 50 });
      await convertImageToPdf(inputPath, finalOutputPath);
      mainWindow?.webContents.send('conversion-progress', { id, percent: 100 });
      return { success: true, outputPath: finalOutputPath };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to convert to PDF' };
    }
  }

  // Special handler: PDF as input format -> render in separate background Worker Thread
  // This keeps Electron Main Process & UI totally fluid and responsive (no freeze / no not responding)
  if (inputExt === 'pdf') {
    return new Promise((resolve) => {
      try {
        const workerFile = path.join(__dirname, 'pdfWorker.js');
        const worker = new Worker(workerFile, {
          workerData: {
            id,
            inputPath,
            finalOutputPath,
            targetExt,
            ffmpegPath: binaries.paths.ffmpeg,
          },
        });

        worker.on('message', (msg) => {
          if (msg.type === 'progress') {
            mainWindow?.webContents.send('conversion-progress', { id: msg.id, percent: msg.percent });
            onProgressUpdate?.(msg.percent);
          } else if (msg.type === 'done') {
            if (msg.success) {
              mainWindow?.webContents.send('conversion-progress', { id: msg.id, percent: 100 });
              resolve({ success: true, outputPath: msg.outputPath });
            } else {
              resolve({ success: false, error: msg.error || 'Failed to convert PDF' });
            }
          }
        });

        worker.on('error', (err) => {
          resolve({ success: false, error: err?.message || 'Worker thread exception' });
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            resolve({ success: false, error: `Worker stopped with exit code ${code}` });
          }
        });
      } catch (err: any) {
        resolve({ success: false, error: err?.message || 'Failed to launch background worker' });
      }
    });
  }

  // Special handler: SVG as input format
  if (inputExt === 'svg') {
    try {
      mainWindow?.webContents.send('conversion-progress', { id, percent: 40 });
      const svgContent = fs.readFileSync(inputPath);
      const resvg = new Resvg(svgContent);
      const pngBuffer = resvg.render().asPng();

      if (targetExt === 'png') {
        fs.writeFileSync(finalOutputPath, pngBuffer);
        mainWindow?.webContents.send('conversion-progress', { id, percent: 100 });
        return { success: true, outputPath: finalOutputPath };
      }

      // If other format (jpg, webp, ico, avif), write temp PNG and execute FFmpeg without shell: true
      const tempPng = path.join(outputDir, `temp_svg_${Date.now()}.png`);
      fs.writeFileSync(tempPng, pngBuffer);

      return await new Promise((resolve) => {
        const bin = binaries.paths.ffmpeg;
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

        const proc = spawn(bin, args, { shell: false });
        let stderr = '';
        proc.stderr?.on('data', (d) => {
          stderr += d.toString();
        });

        proc.on('close', (c) => {
          try {
            fs.unlinkSync(tempPng);
          } catch {}
          if (c === 0) {
            mainWindow?.webContents.send('conversion-progress', { id, percent: 100 });
            resolve({ success: true, outputPath: finalOutputPath });
          } else {
            resolve({ success: false, error: stderr.slice(-300) || `FFmpeg failed with exit code ${c}` });
          }
        });
        proc.on('error', (e) => {
          try {
            fs.unlinkSync(tempPng);
          } catch {}
          resolve({ success: false, error: e.message });
        });
      });
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to process SVG' };
    }
  }

  return new Promise((resolve) => {
    let proc: ChildProcess;
    let totalDurationSeconds = 0;

    const bin = binaries.paths.ffmpeg;
    const args: string[] = ['-y'];

    if (mediaType === 'image') {
      args.push('-i', inputPath);

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
    } else if (mediaType === 'video') {
      if (targetExt === 'gif') {
        args.push(
          '-i', inputPath,
          '-vf', 'fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
          finalOutputPath
        );
      } else if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(targetExt)) {
        args.push('-i', inputPath, '-vn');
        if (targetExt === 'mp3') args.push('-c:a', 'libmp3lame', '-q:a', '2');
        else if (targetExt === 'aac') args.push('-c:a', 'aac', '-b:a', '256k');
        else if (targetExt === 'wav') args.push('-c:a', 'pcm_s16le');
        args.push(finalOutputPath);
      } else {
        if (useNvenc) {
          args.push('-hwaccel', 'cuda', '-i', inputPath, '-c:v', 'h264_nvenc', '-preset', 'p4', '-b:v', '4M', '-c:a', 'aac', '-b:a', '192k', finalOutputPath);
        } else {
          args.push('-i', inputPath, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', '-b:a', '192k', finalOutputPath);
        }
      }
    } else if (mediaType === 'audio') {
      args.push('-i', inputPath);
      if (targetExt === 'mp3') args.push('-c:a', 'libmp3lame', '-q:a', '2');
      else if (targetExt === 'wav') args.push('-c:a', 'pcm_s16le');
      else if (targetExt === 'flac') args.push('-c:a', 'flac');
      else if (targetExt === 'aac') args.push('-c:a', 'aac', '-b:a', '256k');
      args.push(finalOutputPath);
    } else {
      args.push('-i', inputPath, finalOutputPath);
    }

    // Use shell: false so arguments with spaces are passed safely without command injection or splitting
    proc = spawn(bin, args, { shell: false });
    activeProcesses.set(id, proc);

    let stderrLines: string[] = [];

    proc.stderr?.on('data', (chunk) => {
      const line = chunk.toString();
      stderrLines.push(line);

      // Duration capture
      if (totalDurationSeconds === 0) {
        const durMatch = line.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        if (durMatch) {
          const hours = parseInt(durMatch[1], 10);
          const minutes = parseInt(durMatch[2], 10);
          const seconds = parseInt(durMatch[3], 10);
          const centis = parseInt(durMatch[4], 10);
          totalDurationSeconds = hours * 3600 + minutes * 60 + seconds + centis / 100;
        }
      }

      // Timestamp & speed update
      const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      const speedMatch = line.match(/speed=\s*([\d\.]+)x/);

      if (timeMatch && totalDurationSeconds > 0) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseInt(timeMatch[3], 10);
        const centis = parseInt(timeMatch[4], 10);
        const currentSeconds = hours * 3600 + minutes * 60 + seconds + centis / 100;

        const percent = Math.min(100, Math.round((currentSeconds / totalDurationSeconds) * 100));
        const speed = speedMatch ? `${speedMatch[1]}x` : undefined;

        let eta = '';
        if (speedMatch) {
          const speedNum = parseFloat(speedMatch[1]);
          if (speedNum > 0) {
            const remainingSec = Math.max(0, (totalDurationSeconds - currentSeconds) / speedNum);
            eta = formatSecondsToTime(remainingSec);
          }
        }

        mainWindow?.webContents.send('conversion-progress', {
          id,
          percent,
          speed,
          eta: eta ? `ETA: ${eta}` : undefined,
        });
        onProgressUpdate?.(percent);
      }
    });

    proc.on('close', (code) => {
      activeProcesses.delete(id);
      if (code === 0) {
        mainWindow?.webContents.send('conversion-progress', { id, percent: 100 });
        resolve({ success: true, outputPath: finalOutputPath });
      } else {
        const relevantErrors = stderrLines
          .join('\n')
          .split('\n')
          .filter((l) => !l.startsWith('ffmpeg version') && !l.startsWith('  built with') && !l.startsWith('  configuration:') && !l.startsWith('  libav'))
          .filter((l) => l.trim().length > 0);

        const cleanError = relevantErrors.slice(-3).join(' ') || `Conversion process exited with code ${code}`;
        resolve({ success: false, error: cleanError });
      }
    });

    proc.on('error', (err) => {
      activeProcesses.delete(id);
      resolve({ success: false, error: err.message });
    });
  });
}
