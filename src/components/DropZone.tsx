import React, { useState } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
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
      className={`h-full flex flex-col items-center justify-center p-8 rounded-3xl transition-all duration-150 ${
        isDragOver
          ? 'dark:bg-md-darkPrimaryContainer/20 bg-md-primaryContainer/30 border-2 border-md-primary dark:border-md-darkPrimary'
          : 'dark:bg-md-darkSurfaceVariant/20 bg-md-surfaceVariant/25 border-2 border-dashed dark:border-md-darkOutlineVariant border-md-outlineVariant hover:border-md-primary dark:hover:border-md-darkPrimary'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm text-center">
        {/* Material 3 Floating Action Bubble */}
        <div
          className={`w-16 h-16 mb-5 rounded-2xl flex items-center justify-center transition-all ${
            isDragOver
              ? 'dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary shadow-lg'
              : 'dark:bg-md-darkSurfaceVariant bg-md-surfaceVariant dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant'
          }`}
        >
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold dark:text-md-darkOnSurface text-md-onSurface mb-1">
          Drag and drop files here
        </h3>
        <p className="text-xs dark:text-md-darkOnSurfaceVariant text-md-onSurfaceVariant mb-6 leading-relaxed">
          Convert videos, audios, images, vectors, and documents instantly and 100% offline.
        </p>

        {/* Material 3 Filled Button */}
        <button
          onClick={handleBrowseFiles}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary font-medium text-xs shadow hover:shadow-md transition-all active:scale-95"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Browse files</span>
        </button>

        <span className="mt-8 text-[11px] font-mono dark:text-md-darkOnSurfaceVariant/70 text-md-onSurfaceVariant/70">
          Shortcut: Press Ctrl+Q in Explorer for instant donut wheel
        </span>
      </div>
    </div>
  );
};
