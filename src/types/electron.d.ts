import { TelemetryStats } from './index';

export interface ElectronAPI {
  selectFiles: () => Promise<Array<{ name: string; path: string; size: number }> | null>;
  selectFolder: () => Promise<string | null>;
  getSystemCapabilities: () => Promise<any>;
  getTelemetryStats: () => Promise<TelemetryStats>;
  probeFile: (filePath: string) => Promise<any>;
  startConversion: (payload: {
    id: string;
    inputPath: string;
    outputPath: string;
    targetFormat: string;
    mediaType: string;
    useNvenc: boolean;
  }) => Promise<{ success: boolean; error?: string; outputPath?: string }>;
  cancelConversion: (id: string) => Promise<boolean>;
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
