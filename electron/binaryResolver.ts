import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface BinaryPaths {
  ffmpeg: string;
  ffprobe: string;
  magick: string;
}

export function resolveBinaries(): { paths: BinaryPaths; available: { ffmpeg: boolean; ffprobe: boolean; magick: boolean } } {
  const isDev = !app || !app.isPackaged;
  
  // Local project bin directory
  const devBinDir = path.join(process.cwd(), 'resources', 'bin');
  // Packaged bin directory
  const prodBinDir = (process as any).resourcesPath ? path.join((process as any).resourcesPath, 'bin') : devBinDir;
  
  const binDir = isDev ? devBinDir : prodBinDir;

  const ffmpegBundled = path.join(binDir, 'ffmpeg.exe');
  const ffprobeBundled = path.join(binDir, 'ffprobe.exe');
  const magickBundled = path.join(binDir, 'magick.exe');

  return {
    paths: {
      ffmpeg: fs.existsSync(ffmpegBundled) ? ffmpegBundled : 'ffmpeg',
      ffprobe: fs.existsSync(ffprobeBundled) ? ffprobeBundled : 'ffprobe',
      magick: fs.existsSync(magickBundled) ? magickBundled : 'magick',
    },
    available: {
      ffmpeg: fs.existsSync(ffmpegBundled),
      ffprobe: fs.existsSync(ffprobeBundled),
      magick: fs.existsSync(magickBundled),
    }
  };
}

export async function detectHardwareCapabilities() {
  const binaries = resolveBinaries();
  let hasNvidiaGpu = false;
  let nvencSupported = false;
  let ffmpegWorks = binaries.available.ffmpeg;
  let ffprobeWorks = binaries.available.ffprobe;
  let magickWorks = binaries.available.magick;

  if (!ffmpegWorks) {
    try {
      await execAsync('ffmpeg -version');
      ffmpegWorks = true;
    } catch {
      ffmpegWorks = false;
    }
  }

  if (!ffprobeWorks) {
    try {
      await execAsync('ffprobe -version');
      ffprobeWorks = true;
    } catch {
      ffprobeWorks = false;
    }
  }

  if (!magickWorks) {
    try {
      await execAsync('magick -version');
      magickWorks = true;
    } catch {
      magickWorks = false;
    }
  }

  try {
    const { stdout } = await execAsync('wmic path win32_VideoController get name');
    if (/nvidia/i.test(stdout)) {
      hasNvidiaGpu = true;
    }
  } catch {
    // fallback
  }

  if (ffmpegWorks) {
    try {
      const ffmpegBin = binaries.paths.ffmpeg;
      const { stdout } = await execAsync(`"${ffmpegBin}" -encoders`);
      if (stdout.includes('h264_nvenc')) {
        nvencSupported = hasNvidiaGpu;
      }
    } catch {
      nvencSupported = false;
    }
  }

  return {
    hasNvidiaGpu,
    hasFfmpeg: ffmpegWorks,
    hasFfprobe: ffprobeWorks,
    hasMagick: magickWorks,
    nvencSupported,
    ffmpegPath: binaries.paths.ffmpeg,
    magickPath: binaries.paths.magick,
  };
}
