import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolveBinaries } from './binaryResolver';

const execAsync = promisify(exec);

export interface ProbeResult {
  format?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  codecs?: { video?: string; audio?: string };
}

export async function probeMediaFile(filePath: string): Promise<ProbeResult> {
  const binaries = resolveBinaries();
  const bin = binaries.paths.ffprobe;

  const cmd = `"${bin}" -v quiet -print_format json -show_format -show_streams "${filePath}"`;

  try {
    const { stdout } = await execAsync(cmd);
    const data = JSON.parse(stdout);

    const format = data.format?.format_name;
    const duration = data.format?.duration ? parseFloat(data.format.duration) : undefined;

    let width: number | undefined;
    let height: number | undefined;
    let videoCodec: string | undefined;
    let audioCodec: string | undefined;

    if (Array.isArray(data.streams)) {
      for (const stream of data.streams) {
        if (stream.codec_type === 'video' && !videoCodec) {
          videoCodec = stream.codec_name;
          width = stream.width;
          height = stream.height;
        } else if (stream.codec_type === 'audio' && !audioCodec) {
          audioCodec = stream.codec_name;
        }
      }
    }

    return {
      format,
      duration,
      dimensions: width && height ? { width, height } : undefined,
      codecs: {
        video: videoCodec,
        audio: audioCodec,
      },
    };
  } catch (error) {
    // If ffprobe is not available or file is image, return basic fallback
    return {};
  }
}

