import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const SmartFormatPillBar: React.FC = () => {
  const queue = useAppStore((state) => state.queue);
  const setGlobalTargetFormat = useAppStore((state) => state.setGlobalTargetFormat);
  const isProcessing = useAppStore((state) => state.isProcessing);
  const t = useAppStore((state) => state.t());

  const activeQueue = queue.filter((i) => i.status === 'idle' || i.status === 'converting');
  if (activeQueue.length === 0) return null;

  const quickPresets = [
    { label: 'PDF', format: 'pdf' },
    { label: 'DOCX', format: 'docx' },
    { label: 'WEBP', format: 'webp' },
    { label: 'PNG', format: 'png' },
    { label: 'JPG', format: 'jpg' },
    { label: 'MP4', format: 'mp4' },
    { label: 'MP3', format: 'mp3' },
    { label: 'WAV', format: 'wav' },
  ];

  return (
    <div className="px-3.5 py-2.5 mb-3 rounded-xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between gap-3 shadow-sm">
      <span className="text-xs font-medium dark:text-slate-400 text-slate-600 flex-shrink-0">
        {t.convertAllTo}
      </span>

      <div className="flex items-center gap-1.5 flex-wrap">
        {quickPresets.map((preset) => (
          <button
            key={preset.format}
            disabled={isProcessing}
            onClick={() => setGlobalTargetFormat(preset.format)}
            className="px-2.5 py-1 rounded-lg border dark:border-slate-700/80 border-slate-300/80 dark:bg-[#1C202B] bg-[#E8EEF5] hover:dark:bg-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:text-white text-[11px] font-mono font-semibold dark:text-slate-200 text-slate-700 transition-colors active:scale-95 disabled:opacity-40"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};
