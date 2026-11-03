import React, { useEffect, useState, useRef } from 'react';
import { Titlebar } from './components/Titlebar';
import { DropZone } from './components/DropZone';
import { QueueRow } from './components/QueueRow';
import { BottomDeck } from './components/BottomDeck';
import { SmartFormatPillBar } from './components/SmartFormatPillBar';
import { LogDrawer } from './components/LogDrawer';
import { HistoryView } from './components/HistoryView';
import { useAppStore } from './store/useAppStore';
import { QueueItem, TelemetryStats } from './types';
import {
  Upload,
  Plus,
  Cpu,
  Zap,
  Activity,
  HardDrive,
  CheckCircle2,
  Gauge,
  Layers,
} from 'lucide-react';

export const App: React.FC = () => {
  const queue = useAppStore((state) => state.queue);
  const settings = useAppStore((state) => state.settings);
  const system = useAppStore((state) => state.system);
  const isProcessing = useAppStore((state) => state.isProcessing);
  const theme = useAppStore((state) => state.theme);
  const addFiles = useAppStore((state) => state.addFiles);
  const setGlobalTargetFormat = useAppStore((state) => state.setGlobalTargetFormat);
  const setSystemCapabilities = useAppStore((state) => state.setSystemCapabilities);
  const updateProgress = useAppStore((state) => state.updateProgress);
  const updateStatus = useAppStore((state) => state.updateStatus);
  const setIsProcessing = useAppStore((state) => state.setIsProcessing);
  const showLogs = useAppStore((state) => state.showLogs);
  const addLog = useAppStore((state) => state.addLog);
  const activeTab = useAppStore((state) => state.activeTab);

  const [isWindowDragOver, setIsWindowDragOver] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryStats>({
    cpuUsage: 5,
    ramUsedGb: 4.2,
    ramTotalGb: 16.0,
    storageFreeGb: 120,
    storageTotalGb: 512,
    activeTasks: 0,
  });

  const processQueueRef = useRef<() => void>(() => {});

  // Sync theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    window.electronAPI?.notifyThemeChanged(theme);
  }, [theme]);

  // Periodic Telemetry Fetcher (CPU, RAM, Disk Storage)
  useEffect(() => {
    const fetchTelemetry = async () => {
      if (window.electronAPI?.getTelemetryStats) {
        try {
          const stats = await window.electronAPI.getTelemetryStats();
          if (stats) setTelemetry(stats);
        } catch {}
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, []);

  // Window drag & drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsWindowDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsWindowDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsWindowDragOver(false);

      if (e.dataTransfer && e.dataTransfer.files) {
        const droppedFiles = Array.from(e.dataTransfer.files).map((f) => {
          let resolvedPath = (f as any).path;
          if (window.electronAPI?.getPathForFile) {
            try {
              const p = window.electronAPI.getPathForFile(f);
              if (p) resolvedPath = p;
            } catch {}
          }
          return {
            name: f.name,
            path: resolvedPath || f.name,
            size: f.size,
          };
        });
        if (droppedFiles.length > 0) {
          addFiles(droppedFiles);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addFiles]);

  // IPC listeners
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSystemCapabilities().then((caps) => {
        setSystemCapabilities(caps);
      });

      const unsubProgress = window.electronAPI.onProgress((data) => {
        // Sync progress by task id or by matching active converting item
        const items = useAppStore.getState().queue;
        const targetItem = items.find((i) => i.id === data.id || i.status === 'converting');
        const activeId = targetItem ? targetItem.id : data.id;

        updateProgress(activeId, data.percent, data.eta, data.speed);
        // Realtime streaming logs for every progress step
        const extraInfo = [
          data.speed ? `Speed: ${data.speed}` : null,
          data.eta ? data.eta : null,
        ].filter(Boolean).join(' | ');

        if (data.percent % 10 === 0 || data.percent === 100 || data.percent === 25 || data.percent === 50) {
          addLog('info', `[${activeId.slice(0, 8)}] Progress: ${data.percent}% ${extraInfo ? `(${extraInfo})` : ''}`);
        }
      });

      const unsubAddFiles = window.electronAPI.onAddFiles((files) => {
        if (files && files.length > 0) {
          addFiles(files);
          addLog('info', `Added ${files.length} file(s) to queue`);
        }
      });

      const unsubRadialAction = window.electronAPI.onRadialConvertAction((targetFormat) => {
        setGlobalTargetFormat(targetFormat);
        // Mark items converting immediately in UI for radial triggered conversions
        const items = useAppStore.getState().queue;
        items.forEach((item) => {
          if (item.status === 'idle') {
            updateStatus(item.id, 'converting', undefined, undefined, { startTime: Date.now() });
          }
        });
      });

      const unsubRadialCompleted = window.electronAPI.onRadialTaskCompleted?.((data) => {
        const items = useAppStore.getState().queue;
        const match = items.find((i) => i.name === data.fileName);
        if (match) {
          updateStatus(match.id, 'completed', undefined, data.outputPath, {
            outputSize: data.outputSize,
            completedAt: new Date().toLocaleTimeString(),
          });
          addLog('success', `Completed (Radial): ${data.fileName} -> ${data.outputPath}`);
        }
      });

      return () => {
        unsubProgress();
        unsubAddFiles();
        unsubRadialAction();
        unsubRadialCompleted?.();
      };
    }
  }, [setSystemCapabilities, updateProgress, addFiles, setGlobalTargetFormat]);

  const processQueue = async () => {
    if (isProcessing) return;

    const idleItems = queue.filter((i) => i.status === 'idle');
    if (idleItems.length === 0) return;

    setIsProcessing(true);

    const maxParallel = settings.maxConcurrency || 2;
    let pendingIndex = 0;
    const itemsToProcess = [...idleItems];

    const runTask = async (item: QueueItem): Promise<void> => {
      const startTime = Date.now();
      updateStatus(item.id, 'converting', undefined, undefined, { startTime });
      addLog('info', `Started: ${item.name} (${(item.size / 1024).toFixed(1)} KB) -> [${item.targetFormat.toUpperCase()}]`);

      let outDir = settings.outputFolder;
      if (settings.saveToSourceFolder || !outDir) {
        const lastSlash = Math.max(item.path.lastIndexOf('\\'), item.path.lastIndexOf('/'));
        outDir = lastSlash !== -1 ? item.path.substring(0, lastSlash) : '';
      }

      const baseNameWithoutExt = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      const targetFileName = `${baseNameWithoutExt}.${item.targetFormat.toLowerCase()}`;
      const fullOutputPath = outDir ? `${outDir}\\${targetFileName}` : targetFileName;

      try {
        const result = await window.electronAPI.startConversion({
          id: item.id,
          inputPath: item.path,
          outputPath: fullOutputPath,
          targetFormat: item.targetFormat,
          mediaType: item.mediaType,
          useNvenc: system.nvencSupported && settings.useHardwareAcceleration,
        });

        const durationMs = Date.now() - startTime;
        const durationFormatted = (durationMs / 1000).toFixed(1) + 's';
        const completedAt = new Date().toLocaleTimeString();

        if (result.success) {
          updateStatus(item.id, 'completed', undefined, result.outputPath, {
            outputSize: result.outputSize,
            durationMs,
            completedAt,
          });
          const outSizeKb = result.outputSize ? `${(result.outputSize / 1024).toFixed(1)} KB` : 'done';
          addLog('success', `Completed in ${durationFormatted}: ${item.name} -> ${item.targetFormat.toUpperCase()} (${outSizeKb})`);
        } else {
          updateStatus(item.id, 'error', result.error, undefined, { durationMs, completedAt });
          addLog('error', `Failed [${item.name}] after ${durationFormatted}: ${result.error}`);
        }
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        const durationFormatted = (durationMs / 1000).toFixed(1) + 's';
        updateStatus(item.id, 'error', err?.message || 'Unexpected failure', undefined, { durationMs });
        addLog('error', `Exception [${item.name}] after ${durationFormatted}: ${err?.message || 'Unknown'}`);
      }

      if (pendingIndex < itemsToProcess.length) {
        const nextItem = itemsToProcess[pendingIndex++];
        await runTask(nextItem);
      }
    };

    const initialWorkers: Promise<void>[] = [];
    const poolSize = Math.min(maxParallel, itemsToProcess.length);

    for (let i = 0; i < poolSize; i++) {
      const item = itemsToProcess[pendingIndex++];
      initialWorkers.push(runTask(item));
    }

    await Promise.all(initialWorkers);
    setIsProcessing(false);
  };

  processQueueRef.current = processQueue;

  const handleAddMoreFiles = async () => {
    if (window.electronAPI?.selectFiles) {
      const files = await window.electronAPI.selectFiles();
      if (files && files.length > 0) {
        addFiles(files);
      }
    }
  };

  const totalCompleted = queue.filter((q) => q.status === 'completed').length;
  const totalConverting = queue.filter((q) => q.status === 'converting').length;

  const storageUsedGb = Math.max(0, telemetry.storageTotalGb - telemetry.storageFreeGb);
  const storagePercentage = telemetry.storageTotalGb > 0 ? Math.round((storageUsedGb / telemetry.storageTotalGb) * 100) : 0;
  const ramPercentage = telemetry.ramTotalGb > 0 ? Math.round((telemetry.ramUsedGb / telemetry.ramTotalGb) * 100) : 0;

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden dark:bg-md-darkSurface bg-md-surface dark:text-md-darkOnSurface text-md-onSurface font-sans transition-colors duration-150">
      <Titlebar />

      {isWindowDragOver && (
        <div className="absolute inset-0 z-50 dark:bg-md-darkSurface/95 bg-md-surface/95 border-2 border-md-primary dark:border-md-darkPrimary m-3 rounded-3xl flex flex-col items-center justify-center pointer-events-none transition-all shadow-xl">
          <div className="w-16 h-16 rounded-2xl dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary flex items-center justify-center mb-3 shadow">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>
          <span className="text-base font-semibold dark:text-md-darkOnSurface text-md-onSurface">Drop files to convert</span>
        </div>
      )}

      {/* Main Content: Convert Workspace vs History Tab */}
      {activeTab === 'history' ? (
        <HistoryView />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Workspace */}
          <main className="flex-1 p-5 overflow-hidden flex flex-col border-r dark:border-md-darkOutlineVariant/30 border-md-outlineVariant/30">
          {queue.length === 0 ? (
            <DropZone />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <SmartFormatPillBar />

              <div className="mb-2 flex items-center justify-between text-xs dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Tasks ({queue.length})</span>
                  <button
                    onClick={handleAddMoreFiles}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border dark:border-md-darkOutline/40 border-md-outline/40 dark:hover:bg-md-darkSurfaceVariant hover:bg-md-surfaceVariant transition-colors text-[11px]"
                  >
                    <Plus className="w-3 h-3" />
                    Add files
                  </button>
                </div>
                <span className="font-mono text-[11px]">Workers: {settings.maxConcurrency} parallel</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <QueueRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Live Hardware & Storage Telemetry Gimmick Panel */}
        <aside className="w-68 p-5 flex flex-col justify-between dark:bg-md-darkSurfaceVariant/15 bg-md-surfaceVariant/15 select-none overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b dark:border-md-darkOutlineVariant/30 border-md-outlineVariant/30">
              <Activity className="w-4 h-4 dark:text-md-darkPrimary text-md-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider dark:text-md-darkOnSurface text-md-onSurface">
                System Telemetry
              </span>
            </div>

            {/* Live CPU & GPU Engine Load Gauge */}
            <div className="p-3.5 rounded-2xl dark:bg-md-darkSurface bg-md-surface border dark:border-md-darkOutlineVariant/40 border-md-outlineVariant/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
                  Engine Load ({system.nvencSupported ? 'GPU' : 'CPU'})
                </span>
                <span className="text-xs font-mono font-bold dark:text-md-darkPrimary text-md-primary">
                  {telemetry.cpuUsage}%
                </span>
              </div>

              <div className="h-1.5 w-full dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant rounded-full overflow-hidden">
                <div
                  className="h-full dark:bg-md-darkPrimary bg-md-primary transition-all duration-300 rounded-full"
                  style={{ width: `${telemetry.cpuUsage}%` }}
                />
              </div>

              <div className="flex items-center gap-1.5 text-[10px] dark:text-md-darkOnSurfaceVariant/80 text-md-onSurfaceVariant/80 pt-0.5">
                {system.nvencSupported ? <Zap className="w-3 h-3 text-emerald-500" /> : <Cpu className="w-3 h-3 text-zinc-400" />}
                <span>{system.nvencSupported ? 'NVENC CUDA Accelerating' : 'Multi-core processing'}</span>
              </div>
            </div>

            {/* Live RAM & Memory Usage */}
            <div className="p-3.5 rounded-2xl dark:bg-md-darkSurface bg-md-surface border dark:border-md-darkOutlineVariant/40 border-md-outlineVariant/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
                  Memory (RAM)
                </span>
                <span className="text-[11px] font-mono dark:text-md-darkOnSurface text-md-onSurface font-semibold">
                  {telemetry.ramUsedGb} / {telemetry.ramTotalGb} GB
                </span>
              </div>

              <div className="h-1.5 w-full dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${ramPercentage}%` }}
                />
              </div>
            </div>

            {/* Storage Drive Capacity Gauge */}
            <div className="p-3.5 rounded-2xl dark:bg-md-darkSurface bg-md-surface border dark:border-md-darkOutlineVariant/40 border-md-outlineVariant/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-[11px] font-medium dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
                    Storage Disk (C:)
                  </span>
                </div>
                <span className="text-[11px] font-mono dark:text-md-darkOnSurface text-md-onSurface font-semibold">
                  {telemetry.storageFreeGb} GB free
                </span>
              </div>

              <div className="h-1.5 w-full dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-600 dark:bg-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>

              <div className="text-[10px] dark:text-md-darkOnSurfaceVariant/80 text-md-onSurfaceVariant/80 text-right">
                {storageUsedGb} GB used of {telemetry.storageTotalGb} GB
              </div>
            </div>

            {/* Conversion Metrics */}
            <div className="p-3.5 rounded-2xl dark:bg-md-darkSurface bg-md-surface border dark:border-md-darkOutlineVariant/40 border-md-outlineVariant/40 shadow-sm">
              <span className="text-[11px] font-medium dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
                Session Stats
              </span>
              <div className="grid grid-cols-2 gap-2 text-center pt-2">
                <div className="p-2 rounded-xl dark:bg-md-darkSurfaceVariant/30 bg-md-surfaceVariant/30">
                  <div className="text-base font-bold dark:text-md-darkPrimary text-md-primary">{totalCompleted}</div>
                  <div className="text-[10px] dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">Done</div>
                </div>
                <div className="p-2 rounded-xl dark:bg-md-darkSurfaceVariant/30 bg-md-surfaceVariant/30">
                  <div className="text-base font-bold dark:text-md-darkOnSurface text-md-onSurface">{totalConverting}</div>
                  <div className="text-[10px] dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Offline & Shortcuts Footer */}
          <div className="pt-3 border-t dark:border-md-darkOutlineVariant/20 border-md-outlineVariant/20 text-[10px] dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% Offline Engine</span>
            </div>
            <div className="font-mono text-[9.5px]">Trigger: Select file & press <span className="font-bold dark:text-md-darkPrimary text-md-primary">Ctrl+Q</span> or <span className="font-bold dark:text-md-darkPrimary text-md-primary">Alt+C</span></div>
          </div>
        </aside>
      </div>
      )}

      {/* Hidden Log Console Drawer */}
      {showLogs && <LogDrawer />}

      <BottomDeck onStartConvertAll={processQueue} />
    </div>
  );
};

export default App;
