import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export const SmartFormatPillBar: React.FC = () => {
  const queue = useAppStore((state) => state.queue);
  const setGlobalTargetFormat = useAppStore((state) => state.setGlobalTargetFormat);
  const isProcessing = useAppStore((state) => state.isProcessing);

  const [activeCategory, setActiveCategory] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  if (queue.length === 0) return null;

  const quickPresets = [
    { label: 'WEBP', format: 'webp', type: 'image' },
    { label: 'PDF', format: 'pdf', type: 'image' },
    { label: 'PNG', format: 'png', type: 'image' },
    { label: 'JPG', format: 'jpg', type: 'image' },
    { label: 'MP4', format: 'mp4', type: 'video' },
    { label: 'GIF', format: 'gif', type: 'video' },
    { label: 'MP3', format: 'mp3', type: 'audio' },
    { label: 'WAV', format: 'wav', type: 'audio' },
  ];

  const filteredPresets =
    activeCategory === 'all'
      ? quickPresets
      : quickPresets.filter((p) => p.type === activeCategory);

  return (
    <div className="p-3 mb-3 rounded-2xl dark:bg-md-darkSurfaceVariant/30 bg-md-surfaceVariant/30 border dark:border-md-darkOutlineVariant/30 border-md-outlineVariant/30">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold dark:text-md-darkOnSurface text-md-onSurface tracking-normal">
          Batch Target Format
        </span>

        {/* Material 3 Segmented Filter Buttons */}
        <div className="flex items-center rounded-lg border dark:border-md-darkOutline/40 border-md-outline/40 p-0.5 dark:bg-md-darkSurface bg-md-surface">
          {(['all', 'image', 'video', 'audio'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors capitalize ${
                activeCategory === cat
                  ? 'dark:bg-md-darkPrimary dark:text-md-darkOnPrimary bg-md-primary text-md-onPrimary shadow-sm'
                  : 'dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Material 3 Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {filteredPresets.map((preset) => (
          <button
            key={preset.format}
            disabled={isProcessing}
            onClick={() => setGlobalTargetFormat(preset.format)}
            className="px-3.5 py-1.5 rounded-lg border dark:border-md-darkOutline/40 border-md-outline/40 dark:bg-md-darkSurface bg-md-surface dark:hover:bg-md-darkSurfaceVariant hover:bg-md-surfaceVariant text-xs font-semibold dark:text-md-darkOnSurface text-md-onSurface transition-all active:scale-95 disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};
