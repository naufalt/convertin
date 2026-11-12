import React, { useState } from 'react';
import { Minus, Square, X, DownloadCloud } from 'lucide-react';
import { UpdateModal } from './UpdateModal';
import { APP_ICON_BASE64 } from '../assets/appIconBase64';
import { useAppStore } from '../store/useAppStore';

export const Titlebar: React.FC = () => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const t = useAppStore((state) => state.t());

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => window.electronAPI?.maximizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <header className="h-12 px-4 flex items-center justify-between select-none app-drag transition-colors duration-150 border-b dark:border-slate-800/80 border-slate-300/70 dark:bg-[#11131A] bg-[#E3E8F0]">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="w-7 h-7 rounded-xl dark:bg-[#181B24] bg-[#F8FAFC] p-1 border dark:border-slate-800 border-slate-300/80 flex items-center justify-center shadow-sm">
          <img
            src={APP_ICON_BASE64}
            alt="Convertin"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight dark:text-slate-100 text-slate-800">
            Convertin
          </span>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="text-[10px] px-2 py-0.5 rounded-md dark:bg-[#181B24] bg-[#F8FAFC] dark:text-indigo-300 text-indigo-600 font-mono hover:dark:bg-slate-800 hover:bg-white transition-colors border dark:border-slate-800 border-slate-300/70 font-semibold"
            title="Check for updates"
          >
            v3.0.1
          </button>
        </div>
      </div>

      {/* Center Drag Handle Indicator */}
      <div className="flex-1 h-full flex items-center justify-center pointer-events-none">
        <div className="w-10 h-1 rounded-full dark:bg-slate-800 bg-slate-300/90" />
      </div>

      {/* Right: Update & Window Controls */}
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={() => setShowUpdateModal(true)}
          className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-medium dark:text-slate-400 text-slate-600 hover:dark:bg-slate-800/70 hover:bg-slate-300/60 transition-colors"
          title={t.updates}
        >
          <DownloadCloud className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t.updates}</span>
        </button>

        <div className="w-px h-3.5 dark:bg-slate-800 bg-slate-300 mx-1" />

        <button
          onClick={handleMinimize}
          className="w-7 h-7 rounded-lg flex items-center justify-center dark:text-slate-400 text-slate-600 hover:dark:bg-slate-800 hover:bg-slate-300/60 transition-colors"
          title={t.minimize}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 rounded-lg flex items-center justify-center dark:text-slate-400 text-slate-600 hover:dark:bg-slate-800 hover:bg-slate-300/60 transition-colors"
          title={t.maximize}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center dark:text-slate-400 text-slate-600 hover:bg-rose-500 hover:text-white transition-colors"
          title={t.close}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <UpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
    </header>
  );
};
