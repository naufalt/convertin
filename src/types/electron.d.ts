import { TelemetryStats } from './index';

export interface ElectronAPI {
  selectFiles: () => Promise<Array<{ name: string; path: string; size: number }> | null>;
  selectFolder: () => Promise<string | null>;
  getSystemCapabilities: () => Promise<any>;
  getTelemetryStats: () => Promise<TelemetryStats>;
  getStartupEnabled?: () => Promise<boolean>;
  setStartupEnabled?: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; error?: string }>;
  probeFile: (filePath: string) => Promise<any>;
  startConversion: (payload: {
    id: string;
    inputPath: string;
    outputPath: string;
    targetFormat: string;
    mediaType: string;
    useNvenc: boolean;
  }) => Promise<{ success: boolean; error?: string; outputPath?: string; outputSize?: number }>;
  cancelConversion: (id: string) => Promise<boolean>;
  getPathForFile?: (file: File) => string;
  onRadialTaskCompleted?: (callback: (data: any) => void) => () => void;
  openPath: (path: string) => Promise<void>;
  showItemInFolder: (path: string) => Promise<void>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  closeRadial: () => void;
  notifyThemeChanged: (theme: string) => void;
  radialConvertNow: (files: Array<{ name: string; path: string; size: number }>, targetFormat: string) => Promise<void>;
  onProgress: (callback: (data: { id: string; percent: number; speed?: string; eta?: string }) => void) => () => void;
  onAddFiles: (callback: (files: Array<{ name: string; path: string; size: number }>) => void) => () => void;
  onRadialSetFiles: (callback: (data: { files: Array<{ name: string; path: string; size: number }>; theme: string }) => void) => () => void;
  onRadialConvertAction: (callback: (targetFormat: string) => void) => () => void;

  // OTA Updater
  checkForUpdates?: () => Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseName: string;
    releaseNotes: string;
    downloadUrl?: string;
    fileName?: string;
    publishedAt?: string;
  }>;
  downloadUpdate?: (downloadUrl: string) => Promise<{ success: boolean; error?: string }>;
  installUpdate?: () => Promise<{ success: boolean; error?: string }>;
  openReleasePage?: () => Promise<void>;
  onUpdateDownloadProgress?: (callback: (data: { percent: number; receivedBytes: number; totalBytes: number }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
