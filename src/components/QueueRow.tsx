import React, { useState, useEffect } from 'react';
import {
  FileVideo,
  FileAudio,
  FileImage,
  FileText,
  FileQuestion,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  Folder,
  Clock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { QueueItem } from '../types';
import { getSupportedOutputs } from '../utils/matrix';
import { useAppStore } from '../store/useAppStore';

interface Props {
  item: QueueItem;
}

export const QueueRow: React.FC<Props> = ({ item }) => {
  const removeQueueItem = useAppStore((state) => state.removeQueueItem);
  const updateTargetFormat = useAppStore((state) => state.updateTargetFormat);

  const availableOutputs = getSupportedOutputs(item.extension);

  // Live timer for elapsed conversion time
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  useEffect(() => {
    let timer: any = null;
    if (item.status === 'converting' && item.startTime) {
      setElapsedSec(Math.floor((Date.now() - item.startTime) / 1000));
      timer = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - (item.startTime || Date.now())) / 1000));
      }, 500);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [item.status, item.startTime]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getMediaIcon = () => {
    switch (item.mediaType) {
      case 'video':
        return <FileVideo className="w-5 h-5 dark:text-md-darkPrimary text-md-primary" />;
      case 'audio':
        return <FileAudio className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <FileQuestion className="w-5 h-5 dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant" />;
    }
  };

  const handleOpenOutput = () => {
    if (item.outputPath && window.electronAPI?.showItemInFolder) {
      window.electronAPI.showItemInFolder(item.outputPath);
    }
  };

  const handleCancel = () => {
    if (item.status === 'converting') {
      window.electronAPI?.cancelConversion(item.id);
    }
    removeQueueItem(item.id);
  };

  return (
    <div className="flex flex-col p-3.5 rounded-2xl dark:bg-md-darkSurfaceVariant/40 bg-md-surfaceVariant/40 border dark:border-md-darkOutlineVariant/30 border-md-outlineVariant/40 transition-colors mb-2.5 space-y-2">
      <div className="flex items-center justify-between">
        {/* File Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <div className="w-10 h-10 rounded-xl dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant flex items-center justify-center flex-shrink-0 shadow-sm">
            {getMediaIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold dark:text-md-darkOnSurface text-md-onSurface truncate"
                title={item.name}
              >
                {item.name}
              </span>
              <span className="text-[10px] font-mono dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
                {formatFileSize(item.size)}
              </span>
            </div>

            {/* Subtitle / Status indicator */}
            <div className="mt-1 flex items-center gap-2">
              {item.status === 'converting' && (
                <div className="w-full flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 dark:bg-md-darkSurface bg-md-surface rounded-full overflow-hidden p-0.5 border dark:border-white/5 border-black/5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-md-darkPrimary dark:to-purple-400 transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                        style={{ width: `${Math.max(4, item.progress)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono dark:text-md-darkPrimary text-md-primary font-bold flex-shrink-0 tabular-nums">
                      {item.progress}%
                    </span>
                  </div>

                  {/* Realtime Timers: Elapsed & ETA */}
                  <div className="flex items-center gap-3 text-[10px] font-mono dark:text-zinc-400 text-zinc-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>Elapsed: {elapsedSec}s</span>
                    </div>
                    {item.eta && (
                      <div className="flex items-center gap-1 font-semibold dark:text-emerald-400 text-emerald-600">
                        <span>• {item.eta}</span>
                      </div>
                    )}
                    {item.speed && (
                      <span className="opacity-70">• {item.speed}</span>
                    )}
                  </div>
                </div>
              )}

              {item.status === 'error' && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[320px]" title={item.error}>
                    {item.error || 'Conversion error'}
                  </span>
                </div>
              )}

              {item.status === 'idle' && (
                <span className="text-[10px] dark:text-md-darkOnSurfaceVariant/80 text-md-onSurfaceVariant/80 font-mono">
                  Ready to convert
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Target format select & remove */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5 dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant" />

          <select
            value={item.targetFormat}
            disabled={item.status === 'converting'}
            onChange={(e) => updateTargetFormat(item.id, e.target.value)}
            className="dark:bg-md-darkSurface bg-md-surface dark:text-md-darkPrimary text-md-primary text-xs font-semibold px-3 py-1.5 rounded-xl border dark:border-md-darkOutline/40 border-md-outline/40 focus:outline-none focus:ring-1 focus:ring-md-primary uppercase cursor-pointer"
          >
            {availableOutputs.map((fmt) => (
              <option key={fmt} value={fmt} className="dark:bg-md-darkSurface bg-md-surface dark:text-md-darkOnSurface text-md-onSurface uppercase">
                {fmt}
              </option>
            ))}
          </select>

          {item.status === 'completed' && (
            <button
              onClick={handleOpenOutput}
              title="Show converted file in folder"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors"
            >
              <Folder className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleCancel}
            title={item.status === 'converting' ? 'Cancel' : 'Remove'}
            className="w-8 h-8 rounded-full flex items-center justify-center dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant hover:bg-rose-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Completed Info Box: Before & After comparison, Size reduction, and Timestamp */}
      {item.status === 'completed' && (
        <div className="pt-2 mt-1 border-t dark:border-white/5 border-black/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Converted</span>
            </span>

            {/* Before vs After Tag */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md dark:bg-black/20 bg-zinc-200 text-zinc-700 dark:text-zinc-300">
              <span>{item.extension.toUpperCase()} ({formatFileSize(item.size)})</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
              <span className="font-bold dark:text-md-darkPrimary text-md-primary">
                {item.targetFormat.toUpperCase()} ({formatFileSize(item.outputSize || item.size)})
              </span>
            </div>

            {/* Size delta percentage */}
            {item.outputSize && item.size > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  item.outputSize < item.size
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {item.outputSize < item.size
                  ? `-${Math.round((1 - item.outputSize / item.size) * 100)}%`
                  : `+${Math.round((item.outputSize / item.size - 1) * 100)}%`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[10px]">
            {item.durationMs && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{(item.durationMs / 1000).toFixed(1)}s</span>
              </div>
            )}
            {item.completedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{item.completedAt}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
