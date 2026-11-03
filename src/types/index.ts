export type MediaType = 'video' | 'audio' | 'image' | 'document' | 'unknown';

export interface FileMetadata {
  format?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  codecs?: { video?: string; audio?: string };
  size: number;
}

export type ConversionStatus = 'idle' | 'converting' | 'completed' | 'error' | 'cancelled';

export interface QueueItem {
  id: string;
  name: string;
  path: string;
  size: number;
  extension: string;
  mediaType: MediaType;
  metadata?: FileMetadata;
  targetFormat: string;
  status: ConversionStatus;
  progress: number;
  eta?: string;
  speed?: string;
  outputPath?: string;
  outputSize?: number;
  startTime?: number;
  durationMs?: number;
  completedAt?: string;
  error?: string;
}

export interface SystemCapabilities {
  hasNvidiaGpu: boolean;
  hasFfmpeg: boolean;
  hasFfprobe: boolean;
  hasMagick: boolean;
  nvencSupported: boolean;
  ffmpegPath?: string;
  magickPath?: string;
}

export interface TelemetryStats {
  cpuUsage: number; // percentage
  ramUsedGb: number;
  ramTotalGb: number;
  storageFreeGb: number;
  storageTotalGb: number;
  activeTasks: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface Settings {
  outputFolder: string;
  saveToSourceFolder: boolean;
  maxConcurrency: number;
  useHardwareAcceleration: boolean;
}
