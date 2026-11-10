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
        return <FileVideo className="w-4 h-4 text-indigo-500" />;
      case 'audio':
        return <FileAudio className="w-4 h-4 text-emerald-500" />;
      case 'image':
        return <FileImage className="w-4 h-4 text-amber-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <FileQuestion className="w-4 h-4 text-slate-400" />;
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
    <div className="flex flex-col px-4 py-3 rounded-xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 transition-colors mb-2 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* File Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg dark:bg-[#1C202B] bg-[#E8EEF5] flex items-center justify-center flex-shrink-0 border dark:border-slate-700/50 border-slate-300/60">
            {getMediaIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold dark:text-slate-100 text-slate-800 truncate"
                title={item.name}
              >
                {item.name}
              </span>
              <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 flex-shrink-0">
                {formatFileSize(item.size)}
              </span>
            </div>

            {/* Status / Progress Subtitle */}
            <div className="mt-1">
              {item.status === 'converting' && (
                <div className="w-full flex items-center gap-3">
                  <div className="flex-1 h-1.5 dark:bg-slate-800 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(5, item.progress)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-indigo-500 tabular-nums">
                    {item.progress}%
                  </span>
                  <span className="text-[10px] font-mono dark:text-slate-400 text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {elapsedSec}s
                  </span>
                </div>
              )}

              {item.status === 'error' && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate" title={item.error}>
                    {item.error || 'Conversion failed'}
                  </span>
                </div>
              )}

              {item.status === 'idle' && (
                <span className="text-[11px] dark:text-slate-500 text-slate-500">
                  Ready
                </span>
              )}

              {item.status === 'completed' && (
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Done
                  </span>
                  <span className="dark:text-slate-400 text-slate-500">
                    {formatFileSize(item.outputSize || item.size)}
                  </span>
                  {item.outputSize && item.size > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded ${
                        item.outputSize < item.size
                          ? 'dark:bg-emerald-500/10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-600'
                      }`}
                    >
                      {item.outputSize < item.size
                        ? `-${Math.round((1 - item.outputSize / item.size) * 100)}%`
                        : `+${Math.round((item.outputSize / item.size - 1) * 100)}%`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Target format & controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400" />

          <select
            value={item.targetFormat}
            disabled={item.status === 'converting'}
            onChange={(e) => updateTargetFormat(item.id, e.target.value)}
            className="dark:bg-[#1C202B] bg-[#E8EEF5] dark:text-indigo-300 text-indigo-700 text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border dark:border-slate-700 border-slate-300 focus:outline-none focus:border-indigo-500 uppercase cursor-pointer"
          >
            {availableOutputs.map((fmt) => (
              <option
                key={fmt}
                value={fmt}
                className="dark:bg-[#13151C] bg-[#F8FAFC] dark:text-slate-200 text-slate-800 uppercase"
              >
                {fmt}
              </option>
            ))}
          </select>

          {item.status === 'completed' && (
            <button
              onClick={handleOpenOutput}
              title="Show in folder"
              className="w-7 h-7 rounded-lg flex items-center justify-center dark:bg-slate-800 bg-[#E8EEF5] dark:text-slate-300 text-slate-700 hover:dark:bg-slate-700 hover:bg-slate-300 transition-colors"
            >
              <Folder className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCancel}
            title={item.status === 'converting' ? 'Cancel' : 'Remove'}
            className="w-7 h-7 rounded-lg flex items-center justify-center dark:text-slate-400 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
