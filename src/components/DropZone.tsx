import React, { useState } from 'react';
import {
  Upload,
  FolderOpen,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Presentation,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DropZone: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const addFiles = useAppStore((state) => state.addFiles);

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
      className={`relative h-full flex flex-col items-center justify-between p-7 rounded-3xl transition-all duration-200 border ${
        isDragOver
          ? 'dark:bg-emerald-950/20 bg-emerald-50/50 border-2 border-emerald-500 shadow-xl'
          : 'dark:bg-[#16141E]/80 bg-white/70 border-black/5 dark:border-white/5 shadow-sm hover:border-black/10 dark:hover:border-white/10'
      }`}
    >
      {/* Top Welcome Bar / Status Pills (CleanMyMac style) */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold tracking-wide uppercase dark:text-emerald-400 text-emerald-600">
            Offline Engine Ready
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full dark:bg-white/5 bg-black/5 dark:text-zinc-400 text-zinc-600 border dark:border-white/5 border-black/5 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>NVENC GPU & CPU Multi-Thread</span>
          </span>
        </div>
      </div>

      {/* Main Center Action Area: Prominent App Icon & Drag Zone */}
      <div className="flex flex-col items-center max-w-md text-center my-auto">
        <div className="relative group cursor-pointer" onClick={handleBrowseFiles}>
          <div className="w-24 h-24 rounded-3xl dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 bg-gradient-to-br from-zinc-100 to-zinc-200 p-2 shadow-xl border dark:border-white/10 border-black/5 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
            <img
              src="/app-icon.png"
              alt="Convertin"
              className="w-20 h-20 object-contain drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-md-primary dark:bg-md-darkPrimary text-white dark:text-black flex items-center justify-center shadow-lg border-2 dark:border-[#16141E] border-white">
            <Upload className="w-4 h-4" />
          </div>
        </div>

        <h3 className="text-xl font-bold dark:text-white text-zinc-900 mt-5 mb-1.5 tracking-tight">
          Drop Files to Convert
        </h3>
        <p className="text-xs dark:text-zinc-400 text-zinc-600 mb-5 leading-relaxed max-w-sm">
          Convert video, audio, image, and office documents (Word, PPT, Excel, PDF) instantly without internet.
        </p>

        {/* Primary Action Button */}
        <button
          onClick={handleBrowseFiles}
          className="flex items-center gap-2 px-7 py-3 rounded-2xl dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary font-semibold text-xs shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Browse Files or Folders</span>
        </button>
      </div>

      {/* Bottom Capability Cards (3uTools / CleanMyMac style feature shelf) */}
      <div className="w-full grid grid-cols-4 gap-2 pt-4 border-t dark:border-white/5 border-black/5">
        <div className="p-2.5 rounded-2xl dark:bg-white/[0.02] bg-black/[0.02] border dark:border-white/5 border-black/5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Presentation className="w-4 h-4" />
          </div>
          <div className="text-left overflow-hidden">
            <div className="text-[11px] font-semibold dark:text-zinc-200 text-zinc-800 truncate">
              Office to PDF
            </div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-400 truncate">
              DOCX, PPTX, XLSX
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-2xl dark:bg-white/[0.02] bg-black/[0.02] border dark:border-white/5 border-black/5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="text-left overflow-hidden">
            <div className="text-[11px] font-semibold dark:text-zinc-200 text-zinc-800 truncate">
              Video & Audio
            </div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-400 truncate">
              MP4, MKV, MP3, WAV
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-2xl dark:bg-white/[0.02] bg-black/[0.02] border dark:border-white/5 border-black/5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="text-left overflow-hidden">
            <div className="text-[11px] font-semibold dark:text-zinc-200 text-zinc-800 truncate">
              Images & Vector
            </div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-400 truncate">
              WEBP, AVIF, PNG, SVG
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-2xl dark:bg-white/[0.02] bg-black/[0.02] border dark:border-white/5 border-black/5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-left overflow-hidden">
            <div className="text-[11px] font-semibold dark:text-zinc-200 text-zinc-800 truncate">
              PDF Engine
            </div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-400 truncate">
              PDF to DOCX & Images
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
