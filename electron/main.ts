import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  globalShortcut,
  clipboard,
  screen,
  Tray,
  Menu,
  nativeImage,
  Notification,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { exec } from 'node:child_process';
import { detectHardwareCapabilities } from './binaryResolver';
import { executeConversion, cancelProcess, ConvertOptions } from './converterEngine';
import { probeMediaFile } from './probeEngine';
import { setupUpdateManager } from './updateManager';

// Ensure Windows notification App User Model ID is registered
if (process.platform === 'win32' && app) {
  app.setAppUserModelId('com.convertin.desktop');
}

let mainWindow: BrowserWindow | null = null;
let radialWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let currentAppTheme: 'dark' | 'light' = 'dark';
let activeConversionCount = 0;
let currentTrayStatusText = 'Convertin // Ready';
let lastFinishedOutputPath: string | null = null;

function getAppTrayIcon(): Electron.NativeImage {
  const icoPath = path.join(process.cwd(), 'resources', 'icons', 'app_tray.ico');
  if (fs.existsSync(icoPath)) {
    const icon = nativeImage.createFromPath(icoPath);
    return icon.resize({ width: 16, height: 16 });
  }

  const iconBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0YuksAAAAZ0lEQVQ4y2NgGPzgPxomM+AMf2gAmwFImsDmg5QyYBOg2wQ1vBCvgZg0wAzA61i8BqDrxbqBmACmR0IqgC6A7iN0N5DkMlwGsLkPlwFI8gM+N1A8/zOQZgDRBmDFg1A7w8DA8B9dfgwA93xQe1eK2e0AAAAASUVORK5CYII=';
  return nativeImage.createFromDataURL(`data:image/png;base64,${iconBase64}`);
}

function updateTrayMenu() {
  if (!tray) return;

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: currentTrayStatusText,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
  ];

  if (lastFinishedOutputPath && fs.existsSync(lastFinishedOutputPath)) {
    template.push(
      {
        label: `Show in Folder (${path.basename(lastFinishedOutputPath)})`,
        click: () => {
          if (lastFinishedOutputPath) shell.showItemInFolder(lastFinishedOutputPath);
        },
      },
      {
        label: `Open File (${path.basename(lastFinishedOutputPath)})`,
        click: () => {
          if (lastFinishedOutputPath) shell.openPath(lastFinishedOutputPath);
        },
      }
    );
  }

  template.push({ type: 'separator' }, {
    label: 'Exit',
    click: () => {
      isQuitting = true;
      app.quit();
    },
  });

  tray.setContextMenu(Menu.buildFromTemplate(template));
  tray.setToolTip(currentTrayStatusText);
}

function initTray() {
  if (tray) return;

  const icon = getAppTrayIcon();
  tray = new Tray(icon);
  updateTrayMenu();

  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createMainWindow() {
  const appIcon = getAppTrayIcon();
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 880,
    minHeight: 560,
    frame: false,
    resizable: true,
    icon: appIcon,
    backgroundColor: currentAppTheme === 'dark' ? '#141218' : '#FEF7FF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Setup OTA update handlers for main window
  setupUpdateManager(mainWindow);

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createRadialWindow() {
  radialWindow = new BrowserWindow({
    width: 360,
    height: 360,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    resizable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const url = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}#radial`
    : `file://${path.join(__dirname, '../dist/index.html')}#radial`;

  radialWindow.loadURL(url);

  radialWindow.on('blur', () => {
    radialWindow?.hide();
  });
}

function showRadialAtCursor(files: Array<{ name: string; path: string; size: number }>) {
  if (!radialWindow) return;
  const point = screen.getCursorScreenPoint();
  const width = 360;
  const height = 360;
  const x = Math.round(point.x - width / 2);
  const y = Math.round(point.y - height / 2);

  radialWindow.setPosition(x, y);
  radialWindow.show();
  radialWindow.focus();
  radialWindow.webContents.send('radial:set-files', { files, theme: currentAppTheme });
}

function triggerRadialMenu() {
  const vbsPath = path.join(os.tmpdir(), `conv_key_${Date.now()}.vbs`);
  fs.writeFileSync(vbsPath, 'Set w = CreateObject("WScript.Shell")\nw.SendKeys "^c"\n');

  exec(`wscript.exe "${vbsPath}"`, () => {
    try {
      fs.unlinkSync(vbsPath);
    } catch {}

    setTimeout(() => {
      let candidatePaths: string[] = [];

      try {
        const rawBuffer = clipboard.readBuffer('FileNameW');
        if (rawBuffer && rawBuffer.length > 0) {
          const filePath = rawBuffer.toString('ucs2').replace(/\0+$/, '');
          if (filePath && fs.existsSync(filePath)) {
            candidatePaths.push(filePath);
          }
        }
      } catch {}

      if (candidatePaths.length === 0) {
        const text = clipboard.readText();
        if (text) {
          candidatePaths = text
            .split(/\r?\n/)
            .map((l) => l.trim().replace(/^"|"$/g, ''))
            .filter((l) => l.length > 0 && fs.existsSync(l));
        }
      }

      if (candidatePaths.length > 0) {
        const files = candidatePaths.map((p) => {
          const stats = fs.statSync(p);
          return { name: path.basename(p), path: p, size: stats.size };
        });
        showRadialAtCursor(files);
      }
    }, 180);
  });
}

function handleFilesFromArgs(argv: string[]) {
  const fileArgs = argv
    .slice(1)
    .filter((arg) => !arg.startsWith('--') && !arg.startsWith('-') && fs.existsSync(arg) && fs.statSync(arg).isFile());

  if (fileArgs.length > 0) {
    const files = fileArgs.map((p) => {
      const stats = fs.statSync(p);
      return { name: path.basename(p), path: p, size: stats.size };
    });
    setTimeout(() => {
      showRadialAtCursor(files);
    }, 400);
  }
}

function updateTrayProgress(percent: number, file: string) {
  if (tray) {
    tray.setToolTip(`Convertin // ${percent}% - ${file}`);
    currentTrayStatusText = `Converting: ${file} (${percent}%)`;
    updateTrayMenu();
  }
}

// Background Conversion Executor directly from Radial Menu
async function runBackgroundRadialConversion(files: any[], targetFormat: string) {
  console.log('[RadialConvert] Starting conversion for files:', files, 'to format:', targetFormat);

  let caps;
  try {
    caps = await detectHardwareCapabilities();
  } catch {
    caps = { nvencSupported: false };
  }

  for (const file of files) {
    activeConversionCount++;
    const baseName = path.parse(file.name).name;
    const targetFileName = `${baseName}.${targetFormat.toLowerCase()}`;
    const outputDir = path.dirname(file.path);
    const outputPath = path.join(outputDir, targetFileName);

    const ext = path.extname(file.path).toLowerCase().replace('.', '');
    const isVideo = ['mp4', 'mkv', 'mov', 'avi', 'flv', 'webm', 'wmv'].includes(ext);
    const isAudio = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext);
    const isDoc = ['pdf'].includes(ext);
    const mediaType = isVideo ? 'video' : isAudio ? 'audio' : isDoc ? 'document' : 'image';

    currentTrayStatusText = `Converting: ${file.name} -> ${targetFormat.toUpperCase()}...`;
    updateTrayMenu();

    const taskId = `radial-${file.name}`;

    try {
      const result = await executeConversion(
        {
          id: taskId,
          inputPath: file.path,
          outputPath,
          targetFormat,
          mediaType,
          useNvenc: !!caps.nvencSupported,
        },
        mainWindow,
        (percent) => {
          updateTrayProgress(percent, file.name);
        }
      );

      activeConversionCount = Math.max(0, activeConversionCount - 1);
      console.log('[RadialConvert] Result:', result);

      if (result.success && result.outputPath) {
        lastFinishedOutputPath = result.outputPath;
        currentTrayStatusText = `Finished: ${path.basename(result.outputPath)}`;
        updateTrayMenu();

        let outputSize: number | undefined;
        try {
          outputSize = fs.statSync(result.outputPath).size;
        } catch {}

        // Notify main window queue of completion
        if (mainWindow) {
          mainWindow.webContents.send('radial:task-completed', {
            fileName: file.name,
            outputPath: result.outputPath,
            outputSize,
          });
        }

        // Native Windows Notification popup
        try {
          if (Notification.isSupported()) {
            const notif = new Notification({
              title: 'Conversion Completed! 🎉',
              body: `${file.name} -> ${targetFormat.toUpperCase()}\nSaved in source folder.`,
              icon: getAppTrayIcon(),
            });
            notif.on('click', () => {
              if (result.outputPath) shell.showItemInFolder(result.outputPath);
            });
            notif.show();
          }
        } catch (notifErr) {
          console.error('[NotificationError]', notifErr);
        }
      } else {
        currentTrayStatusText = `Failed: ${file.name}`;
        updateTrayMenu();

        // Notify main window queue of failure
        if (mainWindow) {
          mainWindow.webContents.send('radial:task-completed', {
            fileName: file.name,
            error: result.error || 'Konversi gagal',
          });
        }

        try {
          if (Notification.isSupported()) {
            new Notification({
              title: 'Conversion Failed',
              body: result.error || 'Unknown error occurred.',
              icon: getAppTrayIcon(),
            }).show();
          }
        } catch {}
      }
    } catch (err: any) {
      activeConversionCount = Math.max(0, activeConversionCount - 1);
      currentTrayStatusText = `Error converting ${file.name}`;
      updateTrayMenu();
      console.error('[RadialConvertError]', err);
    }
  }

  setTimeout(() => {
    if (activeConversionCount === 0) {
      currentTrayStatusText = 'Convertin // Idle';
      updateTrayMenu();
    }
  }, 4000);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    handleFilesFromArgs(commandLine);
  });

  app.whenReady().then(() => {
    initTray();
    createMainWindow();
    createRadialWindow();

    globalShortcut.register('CommandOrControl+Q', () => {
      triggerRadialMenu();
    });

    globalShortcut.register('CommandOrControl+Space', () => {
      triggerRadialMenu();
    });

    globalShortcut.register('Alt+C', () => {
      triggerRadialMenu();
    });

    handleFilesFromArgs(process.argv);
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.on('window:minimize', () => {
  mainWindow?.hide();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.hide();
});

ipcMain.on('radial:close', () => {
  radialWindow?.hide();
});

ipcMain.on('app:theme-changed', (_event, theme: 'dark' | 'light') => {
  currentAppTheme = theme;
  if (mainWindow) {
    mainWindow.setBackgroundColor(theme === 'dark' ? '#141218' : '#FEF7FF');
  }
});

// Convert directly in Background without opening the main window!
ipcMain.handle('radial:convert-now', async (_event, payload: { files: any[]; targetFormat: string }) => {
  radialWindow?.hide();

  // If user opens the main window or it's currently open, sync tasks & live progress to UI
  if (mainWindow) {
    mainWindow.webContents.send('app:add-files', payload.files);
    mainWindow.webContents.send('radial:apply-target-and-convert', payload.targetFormat);
  }

  if (payload.files && payload.files.length > 0) {
    runBackgroundRadialConversion(payload.files, payload.targetFormat);
  }
});

ipcMain.handle('system:getCapabilities', async () => {
  return await detectHardwareCapabilities();
});

ipcMain.handle('system:getTelemetryStats', async () => {
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;

  const ramUsedGb = parseFloat((usedMemBytes / (1024 ** 3)).toFixed(1));
  const ramTotalGb = parseFloat((totalMemBytes / (1024 ** 3)).toFixed(1));

  let storageFreeGb = 0;
  let storageTotalGb = 0;

  try {
    const stats = fs.statfsSync(process.cwd());
    const totalBytes = stats.blocks * stats.bsize;
    const freeBytes = stats.bfree * stats.bsize;
    storageTotalGb = Math.round(totalBytes / (1024 ** 3));
    storageFreeGb = Math.round(freeBytes / (1024 ** 3));
  } catch {}

  const baseCpu = 4 + Math.round(Math.random() * 3);
  const activeCpu = activeConversionCount > 0 ? Math.min(95, activeConversionCount * 42 + Math.round(Math.random() * 8)) : baseCpu;

  return {
    cpuUsage: activeCpu,
    ramUsedGb,
    ramTotalGb,
    storageFreeGb,
    storageTotalGb,
    activeTasks: activeConversionCount,
  };
});

ipcMain.handle('dialog:selectFiles', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Media or Files to Convert',
    properties: ['openFile', 'multiSelections'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths.map((p) => {
    const stats = fs.statSync(p);
    return {
      name: path.basename(p),
      path: p,
      size: stats.size,
    };
  });
});

ipcMain.handle('dialog:selectFolder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Destination Folder',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('media:probe', async (_event, filePath: string) => {
  return await probeMediaFile(filePath);
});

ipcMain.handle('media:convert', async (_event, payload: ConvertOptions) => {
  activeConversionCount++;
  const baseName = path.basename(payload.inputPath);
  currentTrayStatusText = `Converting: ${baseName} -> ${payload.targetFormat.toUpperCase()} (0%)`;
  updateTrayMenu();

  try {
    const res = await executeConversion(payload, mainWindow, (percent) => {
      updateTrayProgress(percent, baseName);
    });
    let outputSize: number | undefined = undefined;
    if (res.success && res.outputPath && fs.existsSync(res.outputPath)) {
      lastFinishedOutputPath = res.outputPath;
      currentTrayStatusText = `Finished: ${path.basename(res.outputPath)}`;
      updateTrayMenu();
      try {
        outputSize = fs.statSync(res.outputPath).size;
      } catch {}
    } else {
      currentTrayStatusText = `Failed: ${baseName}`;
      updateTrayMenu();
    }
    return { ...res, outputSize };
  } finally {
    activeConversionCount = Math.max(0, activeConversionCount - 1);
    setTimeout(() => {
      if (activeConversionCount === 0) {
        currentTrayStatusText = 'Convertin // Ready';
        updateTrayMenu();
      }
    }, 4000);
  }
});

ipcMain.handle('media:cancel', async (_event, id: string) => {
  const res = cancelProcess(id);
  activeConversionCount = Math.max(0, activeConversionCount - 1);
  return res;
});

ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
  await shell.openPath(targetPath);
});

ipcMain.handle('shell:showItemInFolder', async (_event, targetPath: string) => {
  shell.showItemInFolder(targetPath);
});
