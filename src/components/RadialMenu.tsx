import React, { useEffect, useState } from 'react';
import { getSupportedOutputs, detectMediaType } from '../utils/matrix';
import { X, FileText, Image, Film, Music } from 'lucide-react';

export const RadialMenu: React.FC = () => {
  const [files, setFiles] = useState<Array<{ name: string; path: string; size: number }>>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electronAPI?.closeRadial();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (window.electronAPI) {
      const unsub = window.electronAPI.onRadialSetFiles((data) => {
        setFiles(data.files);
        if (data.theme) {
          setTheme(data.theme as 'dark' | 'light');
        }
      });
      return () => unsub();
    }
  }, []);

  const firstFile = files[0];
  const ext = firstFile?.name.split('.').pop() || '';
  const mediaType = detectMediaType(ext);
  const options = getSupportedOutputs(ext).slice(0, 6);

  const handleSelectFormat = (format: string) => {
    window.electronAPI?.radialConvertNow(files, format);
  };

  const handleClose = () => {
    window.electronAPI?.closeRadial();
  };

  if (!firstFile) return null;

  const total = options.length;
  const radius = 110;
  const centerX = 180;
  const centerY = 180;

  const isDark = theme === 'dark';

  return (
    <div
      onClick={handleClose}
      className={`w-[360px] h-[360px] relative select-none flex items-center justify-center bg-transparent animate-in zoom-in-90 duration-150 font-sans ${
        isDark ? 'dark' : ''
      }`}
    >
      {/* Center Circle Core */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-30 w-32 h-32 rounded-full border shadow-2xl flex flex-col items-center justify-center text-center p-3 transition-colors ${
          isDark
            ? 'bg-[#1C1B1F] border-[#49454F] text-[#E6E0E9]'
            : 'bg-[#FEF7FF] border-[#CAC4D0] text-[#1D1B20]'
        }`}
      >
        <button
          onClick={handleClose}
          className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow ${
            isDark ? 'bg-[#313033] hover:bg-rose-600 text-zinc-300' : 'bg-zinc-200 hover:bg-rose-500 text-zinc-700 hover:text-white'
          }`}
          title="Dismiss (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="w-9 h-9 flex items-center justify-center mb-1">
          <img
            src="/app-icon.png"
            alt="App Icon"
            className="w-8 h-8 object-contain drop-shadow"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <span className="text-[11px] font-semibold truncate max-w-[95px]" title={firstFile.name}>
          {firstFile.name}
        </span>
        <span className={`text-[9px] font-mono mt-0.5 ${isDark ? 'text-[#CAC4D0]' : 'text-zinc-500'}`}>
          {files.length > 1 ? `+${files.length - 1} files` : `${(firstFile.size / 1024).toFixed(0)} KB`}
        </span>
      </div>

      {/* Radial Petals */}
      {options.map((format, idx) => {
        const angle = (idx * (2 * Math.PI)) / total - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle) - 42;
        const y = centerY + radius * Math.sin(angle) - 26;
        const isHovered = hoveredIndex === idx;

        return (
          <button
            key={format}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectFormat(format);
            }}
            style={{ left: `${x}px`, top: `${y}px` }}
            className={`absolute w-[84px] h-[52px] rounded-2xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-lg ${
              isHovered
                ? isDark
                  ? 'scale-110 bg-[#D0BCFF] text-[#381E72] font-bold shadow-xl z-20'
                  : 'scale-110 bg-[#6750A4] text-white font-bold shadow-xl z-20'
                : isDark
                ? 'bg-[#2B2930] hover:bg-[#36343B] text-[#E6E0E9] border border-[#49454F] z-10'
                : 'bg-white hover:bg-zinc-100 text-[#1D1B20] border border-[#CAC4D0] z-10'
            }`}
          >
            <span className="font-mono text-xs uppercase font-bold tracking-wider">
              {format}
            </span>
            <span
              className={`text-[9px] uppercase tracking-normal ${
                isHovered
                  ? isDark ? 'text-[#381E72]/80 font-medium' : 'text-white/80 font-medium'
                  : isDark ? 'text-[#CAC4D0]' : 'text-zinc-500'
              }`}
            >
              Convert
            </span>
          </button>
        );
      })}
    </div>
  );
};
