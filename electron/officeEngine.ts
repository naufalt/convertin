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
  // 1. Packed app: process.resourcesPath/app/dist-electron/officeHelper.ps1
  const appPath = path.join(process.resourcesPath || '', 'app', 'dist-electron', 'officeHelper.ps1');
  if (fs.existsSync(appPath)) return appPath;

  // 2. Unpacked / dev in dist-electron directory
  const devPath = path.join(__dirname, 'officeHelper.ps1');
  if (fs.existsSync(devPath)) return devPath;

  // 3. Fallback to electron/ directory
  const electronPath = path.join(process.cwd(), 'electron', 'officeHelper.ps1');
  if (fs.existsSync(electronPath)) return electronPath;

  return appPath;
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

    const timeout = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      cachedCapabilities = { word: false, excel: false, powerpoint: false };
      resolve(cachedCapabilities);
    }, 5000);

    child.on('close', (code) => {
      clearTimeout(timeout);
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
      clearTimeout(timeout);
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
    let resolved = false;

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

    // Safety timeout: 45 seconds maximum for office COM automation
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          child.kill('SIGTERM');
        } catch {}
        resolve({
          success: false,
          error:
            'Proses konversi Office memakan waktu terlalu lama atau menunggu konfirmasi dialog pop-up dari Microsoft Word. Pastikan Microsoft Office tidak sedang menampilkan dialog lisensi / aktivasi.'
        });
      }
    }, 45000);

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
      if (onProgress) onProgress(65);
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (resolved) return;
      resolved = true;

      const trimmedErr = stderr.trim();
      if (code === 0 && fs.existsSync(outputPath)) {
        if (onProgress) onProgress(100);
        resolve({ success: true, outputPath });
      } else {
        let userFriendlyError = trimmedErr || stdout.trim() || 'Office automation gagal memproses berkas.';
        if (userFriendlyError.includes('E_ACCESSDENIED') || userFriendlyError.includes('80070005')) {
          userFriendlyError =
            'Akses Word COM Ditolak oleh Windows (HRESULT 80070005). Microsoft Word membutuhkan izin Administrator atau sedang dikunci oleh proses background lain.';
        }
        resolve({
          success: false,
          error: userFriendlyError
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (resolved) return;
      resolved = true;
      resolve({ success: false, error: err.message });
    });
  });
}
