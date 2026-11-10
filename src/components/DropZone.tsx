import React, { useState } from 'react';
import { FolderOpen, Plus, BookOpen, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DropZone: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const addFiles = useAppStore((state) => state.addFiles);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const t = useAppStore((state) => state.t());

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).map((f) => {
      let resolvedPath = (f as any).path;
      if (window.electronAPI?.getPathForFile) {
        try {
          const p = window.electronAPI.getPathForFile(f);
          if (p) resolvedPath = p;
        } catch {}
      }
      return {
        name: f.name,
        path: resolvedPath || f.name,
        size: f.size,
      };
    });

    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  const handleBrowseFiles = async () => {
    if (window.electronAPI?.selectFiles) {
      const files = await window.electronAPI.selectFiles();
      if (files && files.length > 0) {
        addFiles(files);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseFiles}
      className={`h-full flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer transition-all duration-200 border border-dashed relative ${
        isDragOver
          ? 'dark:bg-indigo-500/10 bg-indigo-500/10 border-indigo-500 dark:border-indigo-400'
          : 'dark:bg-[#13151C] bg-[#F8FAFC] dark:border-slate-800 border-slate-300/90 hover:dark:border-indigo-500/40 hover:border-indigo-400/70 shadow-sm'
      }`}
    >
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Clean Minimal Icon Button with Indigo Accent */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors border ${
            isDragOver
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'dark:bg-indigo-500/15 bg-indigo-500/10 dark:text-indigo-400 text-indigo-600 dark:border-indigo-500/30 border-indigo-200'
          }`}
        >
          <Plus className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold dark:text-slate-100 text-slate-800 mb-1 tracking-tight">
          {t.dropTitle}
        </h3>
        <p className="text-xs dark:text-slate-400 text-slate-500 mb-5 leading-relaxed">
          {t.dropSubtitle}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseFiles();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs active:scale-[0.98] transition-all shadow-sm"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{t.selectFiles}</span>
        </button>

        {/* Tip Explorer Shortcut */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab('tutorial');
          }}
          className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl dark:bg-slate-900/80 bg-[#E8EEF5] border dark:border-slate-800 border-slate-300/70 text-[11px] dark:text-slate-400 text-slate-600 hover:dark:text-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t.tipExplorer}</span>
          <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] dark:bg-slate-800 bg-[#F8FAFC] dark:text-indigo-300 text-indigo-600 border dark:border-slate-700 border-slate-300 font-semibold">
            Ctrl+Q
          </kbd>
          <span>{t.inExplorer}</span>
        </div>

        {/* Notice: Hardware Specs Impact on Conversion Speed */}
        <div className="mt-4 px-3.5 py-2 rounded-xl dark:bg-slate-900/40 bg-slate-200/50 border dark:border-slate-800/60 border-slate-300/60 text-[11px] leading-relaxed dark:text-slate-400 text-slate-600 text-center flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>{t.specNotice}</span>
        </div>
      </div>
    </div>
  );
};
