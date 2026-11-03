import React, { useState } from 'react';
import { Terminal, Trash2, X, AlertCircle, CheckCircle, Info, AlertTriangle, Copy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const LogDrawer: React.FC = () => {
  const logs = useAppStore((state) => state.logs);
  const clearLogs = useAppStore((state) => state.clearLogs);
  const toggleShowLogs = useAppStore((state) => state.toggleShowLogs);
  const [filter, setFilter] = useState<'all' | 'error' | 'info'>('all');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'error') return l.level === 'error' || l.level === 'warn';
    if (filter === 'info') return l.level === 'info' || l.level === 'success';
    return true;
  });

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-64 border-t dark:border-md-darkOutlineVariant/50 border-md-outlineVariant flex flex-col dark:bg-[#110F14] bg-[#F7F2FA] transition-all font-mono text-xs select-text">
      {/* Header Bar */}
      <div className="h-9 px-4 flex items-center justify-between border-b dark:border-md-darkOutlineVariant/30 border-md-outlineVariant/40 dark:bg-md-darkSurface bg-md-surface select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 dark:text-md-darkPrimary text-md-primary" />
          <span className="font-semibold text-xs dark:text-md-darkOnSurface text-md-onSurface">Engine Console / Logs</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/10 dark:bg-white/5 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded ${filter === 'all' ? 'dark:bg-md-darkPrimary dark:text-md-darkOnPrimary bg-md-primary text-md-onPrimary' : 'opacity-70'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded ${filter === 'error' ? 'bg-rose-600 text-white' : 'opacity-70'}`}
            >
              Errors
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-2 py-0.5 rounded ${filter === 'info' ? 'bg-indigo-600 text-white' : 'opacity-70'}`}
            >
              Info
            </button>
          </div>

          <button
            onClick={handleCopyLogs}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="Copy logs to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={clearLogs}
            className="p-1 rounded hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleShowLogs}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Close log viewer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-40 text-[11px]">
            No logs captured yet.
          </div>
        ) : (
          filteredLogs.map((log) => {
            let color = 'text-zinc-400 dark:text-zinc-400';
            let Icon = Info;
            if (log.level === 'error') {
              color = 'text-rose-600 dark:text-rose-400 font-semibold';
              Icon = AlertCircle;
            } else if (log.level === 'warn') {
              color = 'text-amber-600 dark:text-amber-400';
              Icon = AlertTriangle;
            } else if (log.level === 'success') {
              color = 'text-emerald-600 dark:text-emerald-400';
              Icon = CheckCircle;
            }

            return (
              <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed break-all hover:bg-black/5 dark:hover:bg-white/5 px-1 py-0.5 rounded">
                <span className="opacity-40 text-[10px] select-none flex-shrink-0 mt-0.5">[{log.timestamp}]</span>
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${color}`} />
                <span className={color}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

