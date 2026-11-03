import React from 'react';
import { Folder, FolderCheck, Trash2, Play, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface Props {
  onStartConvertAll: () => void;
}

export const BottomDeck: React.FC<Props> = ({ onStartConvertAll }) => {
  const queue = useAppStore((state) => state.queue);
  const settings = useAppStore((state) => state.settings);
  const isProcessing = useAppStore((state) => state.isProcessing);
  const clearQueue = useAppStore((state) => state.clearQueue);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const idleCount = queue.filter((i) => i.status === 'idle').length;

  const handleSelectFolder = async () => {
    if (window.electronAPI?.selectFolder) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        updateSettings({ outputFolder: folder, saveToSourceFolder: false });
      }
    }
  };

  return (
    <footer className="h-16 px-6 flex items-center justify-between border-t dark:border-md-darkOutlineVariant/40 border-md-outlineVariant/50 dark:bg-md-darkSurface bg-md-surface transition-colors">
      {/* High-visibility Destination Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold dark:text-md-darkOnSurface text-md-onSurface">
          <FolderCheck className="w-4 h-4 dark:text-md-darkPrimary text-md-primary" />
          <span>Save Output:</span>
        </div>

        {/* Segmented Highlighted Pill */}
        <div className="flex items-center p-1 rounded-2xl dark:bg-black/20 bg-zinc-100 border dark:border-white/10 border-black/10 shadow-inner">
          <button
            onClick={() => updateSettings({ saveToSourceFolder: true })}
            className={`text-xs px-3.5 py-1.5 rounded-xl transition-all font-medium ${
              settings.saveToSourceFolder
                ? 'dark:bg-md-darkPrimary dark:text-md-darkOnPrimary bg-md-primary text-md-onPrimary shadow font-semibold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-black'
            }`}
          >
            Same as Source
          </button>

          <button
            onClick={() => {
              if (settings.saveToSourceFolder) {
                updateSettings({ saveToSourceFolder: false });
                if (!settings.outputFolder) {
                  handleSelectFolder();
                }
              } else {
                handleSelectFolder();
              }
            }}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl transition-all font-medium max-w-[260px] truncate ${
              !settings.saveToSourceFolder
                ? 'dark:bg-md-darkPrimary dark:text-md-darkOnPrimary bg-md-primary text-md-onPrimary shadow font-semibold'
                : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-black'
            }`}
            title={settings.outputFolder || 'Click to choose custom directory'}
          >
            <Folder className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {!settings.saveToSourceFolder && settings.outputFolder
                ? settings.outputFolder.split('\\').pop() || settings.outputFolder
                : 'Custom Folder...'}
            </span>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={clearQueue}
          disabled={isProcessing || queue.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant hover:bg-rose-500/10 hover:text-rose-500 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All</span>
        </button>

        <button
          onClick={onStartConvertAll}
          disabled={isProcessing || idleCount === 0}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold shadow transition-all ${
            isProcessing || idleCount === 0
              ? 'dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant dark:text-md-darkOnSurfaceVariant/50 text-md-onSurfaceVariant/50 cursor-not-allowed'
              : 'dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary hover:shadow-md active:scale-95'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Converting...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Convert ({idleCount})</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
