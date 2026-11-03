import React from 'react';
import {
  History,
  Trash2,
  Folder,
  FileCheck,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const HistoryView: React.FC = () => {
  const queue = useAppStore((state) => state.queue);
  const clearQueue = useAppStore((state) => state.clearQueue);
  const removeQueueItem = useAppStore((state) => state.removeQueueItem);

  const completedItems = queue.filter((i) => i.status === 'completed' || i.status === 'error');

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleOpenFolder = (pathStr?: string) => {
    if (pathStr && window.electronAPI?.showItemInFolder) {
      window.electronAPI.showItemInFolder(pathStr);
    }
  };

  const handleOpenFile = (pathStr?: string) => {
    if (pathStr && window.electronAPI?.openPath) {
      window.electronAPI.openPath(pathStr);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 select-none">
      {/* Header and Summary Bar */}
      <div className="flex items-center justify-between pb-4 border-b dark:border-md-darkOutlineVariant/30 border-md-outlineVariant/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl dark:bg-md-darkPrimaryContainer bg-md-primaryContainer flex items-center justify-center dark:text-md-darkOnPrimaryContainer text-md-onPrimaryContainer">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold dark:text-md-darkOnSurface text-md-onSurface">
              Conversion History
            </h2>
            <p className="text-[11px] dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
              {completedItems.length} task(s) recorded in this session
            </p>
          </div>
        </div>

        {completedItems.length > 0 && (
          <button
            onClick={clearQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium dark:text-rose-400 text-rose-600 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
        {completedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-2">
            <History className="w-12 h-12 stroke-[1.5]" />
            <div className="text-sm font-medium">No conversion history yet</div>
            <p className="text-xs max-w-xs">
              Finished conversion tasks with their before/after details, file size savings, and timestamps will appear here.
            </p>
          </div>
        ) : (
          completedItems.map((item) => {
            const isSuccess = item.status === 'completed';
            const sizeDiff = item.outputSize && item.size > 0 ? item.outputSize - item.size : 0;
            const sizePercent = item.outputSize && item.size > 0 ? Math.round((item.outputSize / item.size - 1) * 100) : 0;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl dark:bg-md-darkSurfaceVariant/40 bg-md-surfaceVariant/40 border dark:border-md-darkOutlineVariant/30 border-md-outlineVariant/40 flex flex-col gap-3 transition-colors hover:border-md-primary/40 dark:hover:border-md-darkPrimary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold dark:text-md-darkOnSurface text-md-onSurface truncate" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold dark:bg-black/20 bg-zinc-200 text-zinc-600 dark:text-zinc-300">
                          {item.extension.toUpperCase()} → {item.targetFormat.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[11px] font-mono opacity-80">
                        <span>Original: {formatFileSize(item.size)}</span>
                        {item.outputSize && (
                          <>
                            <span>→ Converted: {formatFileSize(item.outputSize)}</span>
                            <span
                              className={`font-bold ${
                                sizeDiff <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              ({sizeDiff <= 0 ? `${sizePercent}%` : `+${sizePercent}%`})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isSuccess && item.outputPath && (
                      <>
                        <button
                          onClick={() => handleOpenFile(item.outputPath)}
                          title="Open Converted File"
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open</span>
                        </button>
                        <button
                          onClick={() => handleOpenFolder(item.outputPath)}
                          title="Show In Folder"
                          className="px-2.5 py-1 rounded-lg text-xs font-medium dark:bg-white/5 bg-black/5 hover:bg-black/10 dark:hover:bg-white/10 dark:text-zinc-300 text-zinc-700 transition-colors flex items-center gap-1"
                        >
                          <Folder className="w-3 h-3" />
                          <span>Folder</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => removeQueueItem(item.id)}
                      title="Remove from history"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Metadata: Duration & Timestamp */}
                <div className="pt-2 border-t dark:border-white/5 border-black/5 flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-3">
                    {item.durationMs && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>Duration: {(item.durationMs / 1000).toFixed(1)}s</span>
                      </div>
                    )}
                    {item.completedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Completed at {item.completedAt}</span>
                      </div>
                    )}
                  </div>

                  {item.outputPath && (
                    <span className="truncate max-w-[280px]" title={item.outputPath}>
                      {item.outputPath}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

