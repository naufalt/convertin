import React, { useState } from 'react';
import {
  Upload,
  FolderOpen,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { APP_ICON_BASE64 } from '../assets/appIconBase64';

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
      className={`h-full flex flex-col justify-between p-8 rounded-3xl transition-all duration-200 border ${
        isDragOver
          ? 'dark:bg-md-darkPrimaryContainer/20 bg-md-primaryContainer/30 border-2 border-md-primary dark:border-md-darkPrimary'
          : 'dark:bg-[#181622] bg-white border-black/5 dark:border-white/5 shadow-sm'
      }`}
    >
      {/* Top Engine Banner */}
      <div className="flex items-center justify-between pb-4 border-b dark:border-white/5 border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-300 text-zinc-700">
            Offline Engine Active
          </span>
        </div>

        <div className="text-[11px] font-mono dark:text-zinc-400 text-zinc-500 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>GPU NVENC & CPU Workers</span>
        </div>
      </div>

      {/* Center Clean Action Area */}
      <div className="flex flex-col items-center max-w-md mx-auto text-center my-auto py-6">
        {/* Prominent App Icon */}
        <div
          onClick={handleBrowseFiles}
          className="cursor-pointer mb-5 p-2 rounded-3xl dark:bg-white/5 bg-zinc-100 border dark:border-white/10 border-black/5 shadow-sm hover:scale-105 active:scale-95 transition-transform"
          title="Click to browse files"
        >
          <img
            src={APP_ICON_BASE64}
            alt="Convertin"
            className="w-20 h-20 object-contain drop-shadow"
          />
        </div>

        <h3 className="text-xl font-bold dark:text-white text-zinc-900 mb-2 tracking-tight">
          Drop files to start converting
        </h3>
        <p className="text-xs dark:text-zinc-400 text-zinc-600 mb-6 leading-relaxed max-w-sm">
          Convert video, audio, image, and office documents (Word, PowerPoint, Excel, PDF) safely without internet connection.
        </p>

        <button
          onClick={handleBrowseFiles}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary font-semibold text-xs shadow hover:shadow-md hover:brightness-105 active:scale-95 transition-all"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Browse Files</span>
        </button>

        <span className="mt-6 text-[11px] font-mono dark:text-zinc-500 text-zinc-400">
          Explorer shortcut: Select files and press <kbd className="px-1.5 py-0.5 rounded dark:bg-white/10 bg-black/5 font-semibold text-md-primary dark:text-md-darkPrimary">Ctrl+Q</kbd>
        </span>
      </div>

      {/* Bottom Clean Utility Shelf (CleanMyMac & 3uTools style) */}
      <div className="grid grid-cols-4 gap-3 pt-4 border-t dark:border-white/5 border-black/5">
        <div className="p-3 rounded-2xl dark:bg-white/[0.03] bg-zinc-50 border dark:border-white/5 border-black/5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold dark:text-zinc-200 text-zinc-800">
              Office Documents
            </span>
          </div>
          <p className="text-[11px] font-mono dark:text-zinc-400 text-zinc-500">
            DOCX, PPTX, XLSX to PDF
          </p>
        </div>

        <div className="p-3 rounded-2xl dark:bg-white/[0.03] bg-zinc-50 border dark:border-white/5 border-black/5">
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold dark:text-zinc-200 text-zinc-800">
              Video Converter
            </span>
          </div>
          <p className="text-[11px] font-mono dark:text-zinc-400 text-zinc-500">
            MP4, MKV, MOV, WebM, GIF
          </p>
        </div>

        <div className="p-3 rounded-2xl dark:bg-white/[0.03] bg-zinc-50 border dark:border-white/5 border-black/5">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold dark:text-zinc-200 text-zinc-800">
              Images & Vector
            </span>
          </div>
          <p className="text-[11px] font-mono dark:text-zinc-400 text-zinc-500">
            WEBP, AVIF, PNG, JPG, SVG
          </p>
        </div>

        <div className="p-3 rounded-2xl dark:bg-white/[0.03] bg-zinc-50 border dark:border-white/5 border-black/5">
          <div className="flex items-center gap-2 mb-1">
            <Music className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold dark:text-zinc-200 text-zinc-800">
              Audio & Extraction
            </span>
          </div>
          <p className="text-[11px] font-mono dark:text-zinc-400 text-zinc-500">
            MP3, WAV, FLAC, AAC, OGG
          </p>
        </div>
      </div>
    </div>
  );
};
