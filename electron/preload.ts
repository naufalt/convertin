import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file: File) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch {}
    return (file as any).path || file.name;
  },
  selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  getSystemCapabilities: () => ipcRenderer.invoke('system:getCapabilities'),
  getTelemetryStats: () => ipcRenderer.invoke('system:getTelemetryStats'),
  probeFile: (filePath: string) => ipcRenderer.invoke('media:probe', filePath),
  startConversion: (payload: any) => ipcRenderer.invoke('media:convert', payload),
  cancelConversion: (id: string) => ipcRenderer.invoke('media:cancel', id),
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  closeRadial: () => ipcRenderer.send('radial:close'),
  notifyThemeChanged: (theme: string) => ipcRenderer.send('app:theme-changed', theme),
  radialConvertNow: (files: any[], targetFormat: string) =>
    ipcRenderer.invoke('radial:convert-now', { files, targetFormat }),

  onProgress: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('conversion-progress', handler);
    return () => {
      ipcRenderer.removeListener('conversion-progress', handler);
    };
  },
  onAddFiles: (callback: (files: any[]) => void) => {
    const handler = (_event: any, files: any[]) => callback(files);
    ipcRenderer.on('app:add-files', handler);
    return () => {
      ipcRenderer.removeListener('app:add-files', handler);
    };
  },
  onRadialSetFiles: (callback: (data: { files: any[]; theme: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('radial:set-files', handler);
    return () => {
      ipcRenderer.removeListener('radial:set-files', handler);
    };
  },
  onRadialConvertAction: (callback: (targetFormat: string) => void) => {
    const handler = (_event: any, target: string) => callback(target);
    ipcRenderer.on('radial:apply-target-and-convert', handler);
    return () => {
      ipcRenderer.removeListener('radial:apply-target-and-convert', handler);
    };
  },
  onRadialTaskCompleted: (callback: (data: { fileName: string; outputPath: string; outputSize?: number }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('radial:task-completed', handler);
    return () => {
      ipcRenderer.removeListener('radial:task-completed', handler);
    };
  }
});
