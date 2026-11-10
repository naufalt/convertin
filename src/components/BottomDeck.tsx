import React from 'react';
import { Folder, Trash2, Play, Loader2 } from 'lucide-react';
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
  const t = useAppStore((state) => state.t());

  const activeCount = queue.filter((i) => i.status === 'idle' || i.status === 'converting').length;
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
    <footer className="h-14 px-5 flex items-center justify-between border-t dark:border-slate-800/80 border-slate-300/70 dark:bg-[#11131A] bg-[#E3E8F0] transition-colors select-none">
      {/* Left: Destination Selector */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-medium dark:text-slate-400 text-slate-600">
          {t.output}
        </span>

        <div className="flex items-center p-0.5 rounded-xl dark:bg-[#181B24] bg-[#D6DFEB] border dark:border-slate-800 border-slate-300/80">
          <button
            onClick={() => updateSettings({ saveToSourceFolder: true })}
            className={`text-xs px-3 py-1 rounded-lg transition-all font-medium ${
              settings.saveToSourceFolder
                ? 'dark:bg-indigo-600 bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm font-semibold'
                : 'dark:text-slate-400 text-slate-600 hover:dark:text-slate-200 hover:text-slate-900'
            }`}
          >
            {t.sourceFolder}
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
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition-all font-medium max-w-[220px] truncate ${
              !settings.saveToSourceFolder
                ? 'dark:bg-indigo-600 bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm font-semibold'
                : 'dark:text-slate-400 text-slate-600 hover:dark:text-slate-200 hover:text-slate-900'
            }`}
            title={settings.outputFolder || 'Choose custom output directory'}
          >
            <Folder className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {!settings.saveToSourceFolder && settings.outputFolder
                ? settings.outputFolder.split('\\').pop() || settings.outputFolder
                : t.custom}
            </span>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium dark:text-slate-400 text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clear}</span>
          </button>
        )}

        <button
          onClick={onStartConvertAll}
          disabled={isProcessing || idleCount === 0}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
            isProcessing || idleCount === 0
              ? 'dark:bg-slate-800/80 bg-slate-300/70 dark:text-slate-500 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm active:scale-[0.98]'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t.converting}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.convert} {idleCount > 0 ? `(${idleCount})` : ''}</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
