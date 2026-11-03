import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export interface OfficeCapabilities {
  word: boolean;
  excel: boolean;
  powerpoint: boolean;
}

let cachedCapabilities: OfficeCapabilities | null = null;

function getScriptPath(): string {
  // In dev or prod unpacked
  const devPath = path.join(__dirname, 'officeHelper.ps1');
  if (fs.existsSync(devPath)) return devPath;

  const appPath = path.join(process.resourcesPath || '', 'app', 'dist-electron', 'officeHelper.ps1');
  if (fs.existsSync(appPath)) return appPath;

  const fallback = path.join(process.cwd(), 'electron', 'officeHelper.ps1');
  return fallback;
}

export async function checkOfficeCapabilities(): Promise<OfficeCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  const scriptPath = getScriptPath();
  return new Promise((resolve) => {
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scriptPath,
      '-Action',
      'check'
    ]);

    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(stdout.trim());
          cachedCapabilities = {
            word: !!parsed.word,
            excel: !!parsed.excel,
            powerpoint: !!parsed.powerpoint
          };
          resolve(cachedCapabilities);
          return;
        } catch {}
      }
      cachedCapabilities = { word: false, excel: false, powerpoint: false };
      resolve(cachedCapabilities);
    });

    child.on('error', () => {
      cachedCapabilities = { word: false, excel: false, powerpoint: false };
      resolve(cachedCapabilities);
    });
  });
}

export async function convertOfficeDocument(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  const ext = path.extname(inputPath).toLowerCase().replace('.', '');
  const target = targetFormat.toLowerCase();

  let action = '';
  if (['docx', 'doc', 'rtf', 'txt', 'odt'].includes(ext) && target === 'pdf') {
    action = 'docx-to-pdf';
  } else if (ext === 'pdf' && ['docx', 'doc'].includes(target)) {
    action = 'pdf-to-docx';
  } else if (['pptx', 'ppt', 'odp'].includes(ext) && target === 'pdf') {
    action = 'pptx-to-pdf';
  } else if (['xlsx', 'xls', 'csv', 'ods'].includes(ext) && target === 'pdf') {
    action = 'xlsx-to-pdf';
  }

  if (!action) {
    return {
      success: false,
      error: `Konversi dokumen dari .${ext} ke .${target} tidak didukung secara langsung.`
    };
  }

  if (onProgress) onProgress(20);

  const scriptPath = getScriptPath();
  return new Promise((resolve) => {
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scriptPath,
      '-Action',
      action,
      '-InputPath',
      inputPath,
      '-OutputPath',
      outputPath
    ]);

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
      if (onProgress) onProgress(60);
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        if (onProgress) onProgress(100);
        resolve({ success: true, outputPath });
      } else {
        resolve({
          success: false,
          error: stderr.trim() || stdout.trim() || 'Office automation gagal memproses berkas.'
        });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}
