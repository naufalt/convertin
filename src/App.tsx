import React, { useEffect, useState, useRef } from 'react';
import { Titlebar } from './components/Titlebar';
import { Sidebar } from './components/Sidebar';
import { DropZone } from './components/DropZone';
import { QueueRow } from './components/QueueRow';
import { BottomDeck } from './components/BottomDeck';
import { SmartFormatPillBar } from './components/SmartFormatPillBar';
import { LogDrawer } from './components/LogDrawer';
import { HistoryView } from './components/HistoryView';
import { TutorialView } from './components/TutorialView';
import { SystemView } from './components/SystemView';
import { SettingsView } from './components/SettingsView';
import { useAppStore } from './store/useAppStore';
import { QueueItem, TelemetryStats } from './types';
import { Upload, Plus } from 'lucide-react';

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

  // Active queue: items that are waiting (idle) or currently converting
  const activeQueue = queue.filter((i) => i.status === 'idle' || i.status === 'converting');

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

  // Periodic Telemetry Fetcher
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
    const interval = setInterval(fetchTelemetry, 2000);
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
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
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
        const items = useAppStore.getState().queue;
        const targetItem = items.find((i) => i.id === data.id || i.status === 'converting');
        const activeId = targetItem ? targetItem.id : data.id;

        updateProgress(activeId, data.percent, data.eta, data.speed);
        const extraInfo = [data.speed ? `Speed: ${data.speed}` : null, data.eta ? data.eta : null]
          .filter(Boolean)
          .join(' | ');

        if (
          data.percent % 10 === 0 ||
          data.percent === 100 ||
          data.percent === 25 ||
          data.percent === 50
        ) {
          addLog(
            'info',
            `[${activeId.slice(0, 8)}] Progress: ${data.percent}% ${extraInfo ? `(${extraInfo})` : ''}`
          );
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
          if (data.error) {
            updateStatus(match.id, 'error', data.error, undefined, {
              completedAt: new Date().toLocaleTimeString(),
            });
            addLog('error', `Failed (Radial): ${data.fileName} - ${data.error}`);
          } else {
            updateStatus(match.id, 'completed', undefined, data.outputPath, {
              outputSize: data.outputSize,
              completedAt: new Date().toLocaleTimeString(),
            });
            addLog('success', `Completed (Radial): ${data.fileName} -> ${data.outputPath}`);
          }
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
      addLog(
        'info',
        `Started: ${item.name} (${(item.size / 1024).toFixed(1)} KB) -> [${item.targetFormat.toUpperCase()}]`
      );

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
          const outSizeKb = result.outputSize
            ? `${(result.outputSize / 1024).toFixed(1)} KB`
            : 'done';
          addLog(
            'success',
            `Completed in ${durationFormatted}: ${item.name} -> ${item.targetFormat.toUpperCase()} (${outSizeKb})`
          );
        } else {
          updateStatus(item.id, 'error', result.error, undefined, { durationMs, completedAt });
          addLog('error', `Failed [${item.name}] after ${durationFormatted}: ${result.error}`);
        }
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        const durationFormatted = (durationMs / 1000).toFixed(1) + 's';
        updateStatus(item.id, 'error', err?.message || 'Unexpected failure', undefined, {
          durationMs,
        });
        addLog(
          'error',
          `Exception [${item.name}] after ${durationFormatted}: ${err?.message || 'Unknown'}`
        );
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

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden dark:bg-[#0C0D12] bg-[#EEF1F6] dark:text-slate-100 text-slate-800 font-sans transition-colors duration-150">
      <Titlebar />

      {isWindowDragOver && (
        <div className="absolute inset-0 z-50 dark:bg-[#0C0D12]/90 bg-[#EEF1F6]/90 border-2 border-dashed border-indigo-500 m-3 rounded-2xl flex flex-col items-center justify-center pointer-events-none transition-all">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold dark:text-slate-100 text-slate-800">
            Drop files anywhere to add
          </span>
        </div>
      )}

      {/* Main Layout: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'tutorial' && <TutorialView />}
          {activeTab === 'system' && <SystemView telemetry={telemetry} />}
          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'convert' && (
            <>
              <main className="flex-1 p-6 overflow-hidden flex flex-col">
                {queue.length === 0 ? (
                  <DropZone />
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Queue Header */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-semibold dark:text-slate-100 text-slate-800">
                          Conversion Queue
                        </h2>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md dark:bg-slate-800 bg-slate-300/70 dark:text-slate-300 text-slate-700 font-semibold" title={`${activeQueue.length} pending / active in queue`}>
                          {activeQueue.length}
                        </span>
                      </div>

                      <button
                        onClick={handleAddMoreFiles}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border dark:border-slate-800 border-slate-300 dark:bg-[#13151C] bg-[#F8FAFC] hover:dark:bg-slate-800 hover:bg-white transition-colors text-xs font-medium dark:text-slate-200 text-slate-700 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Add Files</span>
                      </button>
                    </div>

                    <SmartFormatPillBar />

                    {/* Queue List */}
                    <div className="flex-1 overflow-y-auto pr-1">
                      {queue.map((item) => (
                        <QueueRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </main>

              <BottomDeck onStartConvertAll={processQueue} />
            </>
          )}
        </div>
      </div>

      {/* Collapsible Engine Console */}
      {showLogs && <LogDrawer />}
    </div>
  );
};

export default App;
