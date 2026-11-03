export const CONVERSION_MATRIX = {
  video: {
    inputs: ['mp4', 'mkv', 'mov', 'avi', 'flv', 'webm', 'wmv', 'ts', '3gp', 'm4v'],
    outputs: ['mp4', 'mkv', 'webm', 'mov', 'gif', 'mp3', 'wav', 'aac'],
    defaultOutput: 'mp4',
    codecs: {
      h264_cpu: '-c:v libx264 -crf 22 -preset medium',
      h264_nvenc: '-c:v h264_nvenc -preset p4 -b:v 4M',
      h265_nvenc: '-c:v hevc_nvenc -preset p5 -cq 26',
      vp9: '-c:v libvpx-vp9 -crf 30 -b:v 0',
      gif_optimized: '-vf "fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"'
    }
  },
  audio: {
    inputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'],
    outputs: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'opus'],
    defaultOutput: 'mp3',
    codecs: {
      mp3: '-c:a libmp3lame -q:a 2',
      wav: '-c:a pcm_s16le',
      flac: '-c:a flac',
      aac: '-c:a aac -b:a 256k'
    }
  },
  image: {
    inputs: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp', 'tiff', 'svg', 'ico', 'heic'],
    outputs: ['jpg', 'png', 'webp', 'avif', 'ico', 'pdf'],
    defaultOutput: 'png',
    presets: {
      jpg: '-quality 90',
      webp_lossy: '-quality 85',
      webp_lossless: '-define webp:lossless=true'
    }
  },
  document: {
    inputs: ['pdf'],
    outputs: ['png', 'jpg', 'webp'],
    defaultOutput: 'png'
  }
};

export function detectMediaType(extension: string): 'video' | 'audio' | 'image' | 'document' | 'unknown' {
  const ext = extension.toLowerCase().replace(/^\./, '');
  if (CONVERSION_MATRIX.video.inputs.includes(ext)) return 'video';
  if (CONVERSION_MATRIX.audio.inputs.includes(ext)) return 'audio';
  if (CONVERSION_MATRIX.image.inputs.includes(ext)) return 'image';
  if (CONVERSION_MATRIX.document.inputs.includes(ext)) return 'document';
  return 'unknown';
}

export function getSupportedOutputs(extension: string): string[] {
  const type = detectMediaType(extension);
  if (type === 'video') return CONVERSION_MATRIX.video.outputs;
  if (type === 'audio') return CONVERSION_MATRIX.audio.outputs;
  if (type === 'image') return CONVERSION_MATRIX.image.outputs;
  if (type === 'document') return CONVERSION_MATRIX.document.outputs;
  return [];
}

export function getDefaultTargetFormat(extension: string): string {
  const ext = extension.toLowerCase().replace(/^\./, '');
  const type = detectMediaType(ext);
  if (type === 'video') {
    return ext === 'mp4' ? 'mkv' : 'mp4';
  }
  if (type === 'audio') {
    return ext === 'mp3' ? 'wav' : 'mp3';
  }
  if (type === 'image') {
    return ext === 'png' ? 'jpg' : 'png';
  }
  if (type === 'document') {
    return 'png';
  }
  return 'png';
}
