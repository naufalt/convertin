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
    <div className="h-56 border-t dark:border-zinc-800 border-zinc-200 flex flex-col dark:bg-[#0D0D10] bg-zinc-50 transition-all font-mono text-xs select-text">
      {/* Header Bar */}
      <div className="h-9 px-4 flex items-center justify-between border-b dark:border-zinc-800/80 border-zinc-200 dark:bg-zinc-900/60 bg-white select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-semibold text-xs dark:text-zinc-200 text-zinc-800 font-sans">
            Engine Console
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-600">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center dark:bg-zinc-800 bg-zinc-100 rounded-lg p-0.5 text-[10px] font-sans font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === 'all'
                  ? 'dark:bg-zinc-900 bg-white dark:text-white text-zinc-900 shadow-sm'
                  : 'dark:text-zinc-400 text-zinc-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === 'error'
                  ? 'bg-rose-500 text-white'
                  : 'dark:text-zinc-400 text-zinc-500'
              }`}
            >
              Errors
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === 'info'
                  ? 'bg-indigo-600 text-white'
                  : 'dark:text-zinc-400 text-zinc-500'
              }`}
            >
              Info
            </button>
          </div>

          <button
            onClick={handleCopyLogs}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title={copied ? 'Copied!' : 'Copy logs'}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={clearLogs}
            className="p-1 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleShowLogs}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="Close console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center dark:text-zinc-600 text-zinc-400 text-[11px] font-sans">
            No logs captured yet.
          </div>
        ) : (
          filteredLogs.map((log) => {
            let color = 'text-zinc-600 dark:text-zinc-400';
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
              <div
                key={log.id}
                className="flex items-start gap-2 text-[11px] leading-relaxed break-all hover:bg-black/5 dark:hover:bg-white/5 px-1.5 py-0.5 rounded"
              >
                <span className="opacity-40 text-[10px] select-none flex-shrink-0 mt-0.5">
                  [{log.timestamp}]
                </span>
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
