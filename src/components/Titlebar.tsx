import React from 'react';
import { Minus, Square, X, Sun, Moon, Terminal, LayoutGrid, History } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Titlebar: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const showLogs = useAppStore((state) => state.showLogs);
  const toggleShowLogs = useAppStore((state) => state.toggleShowLogs);
  const logsCount = useAppStore((state) => state.logs.length);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const queue = useAppStore((state) => state.queue);
  const historyCount = queue.filter((i) => i.status === 'completed' || i.status === 'error').length;

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => window.electronAPI?.maximizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <header className="h-12 px-4 flex items-center justify-between select-none app-drag transition-colors duration-150 border-b dark:border-md-darkOutlineVariant/40 border-md-outlineVariant/50 dark:bg-md-darkSurface bg-md-surface">
      {/* Brand Identity: 3D App Icon */}
      <div className="flex items-center gap-2.5 no-drag">
        <img
          src="/app-icon.png"
          alt="Convertin"
          className="w-7 h-7 object-contain drop-shadow"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-normal dark:text-md-darkOnSurface text-md-onSurface">
            Convertin
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant font-mono">
            v2.0
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs: Convert vs History */}
      <div className="no-drag flex items-center p-1 rounded-2xl dark:bg-black/25 bg-zinc-200/70 border dark:border-white/5 border-black/5">
        <button
          onClick={() => setActiveTab('convert')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'convert'
              ? 'dark:bg-md-darkPrimary dark:text-md-darkOnPrimary bg-md-primary text-md-onPrimary shadow-sm'
              : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-black'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Convert</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'dark:bg-md-darkPrimary dark:text-md-darkOnPrimary bg-md-primary text-md-onPrimary shadow-sm'
              : 'dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-black'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
          {historyCount > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'history' ? 'bg-black/20 text-white' : 'dark:bg-white/10 bg-black/10'
              }`}
            >
              {historyCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Actions: Theme, Logs, & Window Controls */}
      <div className="no-drag flex items-center gap-1">
        {/* Toggle Logs Button */}
        <button
          onClick={toggleShowLogs}
          className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-mono transition-colors ${
            showLogs
              ? 'dark:bg-md-darkPrimary dark:text-md-darkOnPrimary bg-md-primary text-md-onPrimary shadow-sm'
              : 'dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant dark:hover:bg-md-darkSurfaceVariant hover:bg-md-surfaceVariant'
          }`}
          title="Toggle Hidden Engine Logs"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Logs</span>
          {logsCount > 0 && (
            <span className="text-[9px] px-1 rounded-full bg-black/20 dark:bg-white/20">
              {logsCount}
            </span>
          )}
        </button>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant dark:hover:bg-md-darkSurfaceVariant hover:bg-md-surfaceVariant transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-px h-4 dark:bg-md-darkOutlineVariant bg-md-outlineVariant mx-1" />

        <button
          onClick={handleMinimize}
          className="w-8 h-8 rounded-full flex items-center justify-center dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant dark:hover:bg-md-darkSurfaceVariant hover:bg-md-surfaceVariant transition-colors"
          title="Minimize to Tray"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 rounded-full flex items-center justify-center dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant dark:hover:bg-md-darkSurfaceVariant hover:bg-md-surfaceVariant transition-colors"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant hover:bg-rose-500 hover:text-white transition-colors"
          title="Close to Tray"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
