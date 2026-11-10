import React, { useState, useMemo } from 'react';
import {
  History,
  Trash2,
  Folder,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const ITEMS_PER_PAGE = 6;

export const HistoryView: React.FC = () => {
  const queue = useAppStore((state) => state.queue);
  const clearQueue = useAppStore((state) => state.clearQueue);
  const removeQueueItem = useAppStore((state) => state.removeQueueItem);
  const t = useAppStore((state) => state.t());

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const completedItems = useMemo(
    () => queue.filter((i) => i.status === 'completed' || i.status === 'error'),
    [queue]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return completedItems;
    const q = searchQuery.toLowerCase().trim();
    return completedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.extension.toLowerCase().includes(q) ||
        item.targetFormat.toLowerCase().includes(q) ||
        (item.outputPath && item.outputPath.toLowerCase().includes(q))
    );
  }, [completedItems, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safePage]);

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
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800/80 border-slate-300/70">
        <div>
          <h2 className="text-base font-semibold dark:text-slate-100 text-slate-800">
            {t.historyTitle}
          </h2>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {completedItems.length} {t.historyDesc}
          </p>
        </div>

        {completedItems.length > 0 && (
          <button
            onClick={clearQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearHistory}</span>
          </button>
        )}
      </div>

      {/* Search Bar (Shown when there is history) */}
      {completedItems.length > 0 && (
        <div className="pt-3 pb-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t.searchHistoryPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 dark:text-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
        {completedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center dark:text-slate-500 text-slate-500 space-y-2">
            <History className="w-10 h-10 stroke-[1.5] opacity-50" />
            <div className="text-sm font-medium dark:text-slate-300 text-slate-700">
              {t.noHistory}
            </div>
            <p className="text-xs max-w-xs">{t.noHistoryDesc}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center dark:text-slate-500 text-slate-500 space-y-2">
            <Search className="w-9 h-9 stroke-[1.5] opacity-40 text-slate-400" />
            <div className="text-sm font-medium dark:text-slate-300 text-slate-700">
              {t.noSearchResults}
            </div>
            <p className="text-xs max-w-xs dark:text-slate-400 text-slate-500">
              "{searchQuery}"
            </p>
          </div>
        ) : (
          paginatedItems.map((item) => {
            const isSuccess = item.status === 'completed';
            const sizeDiff = item.outputSize && item.size > 0 ? item.outputSize - item.size : 0;
            const sizePercent =
              item.outputSize && item.size > 0 ? Math.round((item.outputSize / item.size - 1) * 100) : 0;

            return (
              <div
                key={item.id}
                className="px-4 py-3 rounded-xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between gap-4 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSuccess
                        ? 'dark:bg-emerald-500/10 bg-emerald-500/10 text-emerald-500'
                        : 'dark:bg-rose-500/10 bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold dark:text-slate-100 text-slate-800 truncate"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold dark:bg-[#1C202B] bg-[#E8EEF5] dark:text-indigo-300 text-indigo-700">
                        {item.extension.toUpperCase()} → {item.targetFormat.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] font-mono dark:text-slate-400 text-slate-500">
                      <span>{formatFileSize(item.size)}</span>
                      {item.outputSize && (
                        <>
                          <span>→ {formatFileSize(item.outputSize)}</span>
                          <span
                            className={`font-semibold ${
                              sizeDiff <= 0 ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          >
                            ({sizeDiff <= 0 ? `${sizePercent}%` : `+${sizePercent}%`})
                          </span>
                        </>
                      )}
                      {item.durationMs && (
                        <span className="flex items-center gap-1 opacity-75">
                          <Clock className="w-3 h-3" />
                          {(item.durationMs / 1000).toFixed(1)}s
                        </span>
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
                        title={t.openFile}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium dark:bg-[#1C202B] bg-[#E8EEF5] hover:dark:bg-slate-700 hover:bg-slate-300 dark:text-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{t.openFile}</span>
                      </button>
                      <button
                        onClick={() => handleOpenFolder(item.outputPath)}
                        title={t.showFolder}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium dark:bg-[#1C202B] bg-[#E8EEF5] hover:dark:bg-slate-700 hover:bg-slate-300 dark:text-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Folder className="w-3 h-3" />
                        <span>{t.showFolder}</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => removeQueueItem(item.id)}
                    title="Remove"
                    className="p-1.5 rounded-lg dark:text-slate-500 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {filteredItems.length > ITEMS_PER_PAGE && (
        <div className="pt-3 mt-1 border-t dark:border-slate-800/80 border-slate-300/70 flex items-center justify-between text-xs dark:text-slate-400 text-slate-600">
          <div>
            <span>
              {t.page} <strong className="dark:text-slate-200 text-slate-800">{safePage}</strong> {t.of}{' '}
              <strong className="dark:text-slate-200 text-slate-800">{totalPages}</strong>
            </span>
            <span className="ml-2 opacity-60">
              ({filteredItems.length} items)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2.5 py-1 rounded-lg border dark:border-slate-800 border-slate-300/80 dark:bg-[#13151C] bg-[#F8FAFC] hover:dark:bg-slate-800 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[11px]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t.prev}</span>
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-2.5 py-1 rounded-lg border dark:border-slate-800 border-slate-300/80 dark:bg-[#13151C] bg-[#F8FAFC] hover:dark:bg-slate-800 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[11px]"
            >
              <span>{t.next}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
