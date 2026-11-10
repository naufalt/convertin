import React, { useState } from 'react';
import {
  BookOpen,
  MousePointerClick,
  FolderOpen,
  Zap,
  Bell,
  CheckCircle2,
  ArrowRight,
  Layers,
  Command,
} from 'lucide-react';
import { APP_ICON_BASE64 } from '../assets/appIconBase64';
import { useAppStore } from '../store/useAppStore';

export const TutorialView: React.FC = () => {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const t = useAppStore((state) => state.t());
  const [selectedMockFormat, setSelectedMockFormat] = useState<string>('PDF');
  const [mockConverted, setMockConverted] = useState(false);

  const mockFormats = ['PDF', 'DOCX', 'WEBP', 'PNG', 'MP4', 'MP3'];
  const radius = 88;
  const centerX = 140;
  const centerY = 140;

  const handleMockClick = (fmt: string) => {
    setSelectedMockFormat(fmt);
    setMockConverted(true);
    setTimeout(() => setMockConverted(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800/80 border-slate-200/90">
        <div>
          <h2 className="text-base font-semibold dark:text-slate-100 text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>{t.tutTitle}</span>
          </h2>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t.tutDesc}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('convert')}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span>{t.tryConverter}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Feature Highlight: Radial Shortcut (Ctrl + Q) with Live Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center p-5 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 shadow-sm">
        {/* Left Steps Description */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg dark:bg-indigo-500/15 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[11px] font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>{t.radialFeatureBadge}</span>
          </div>

          <h3 className="text-sm font-bold dark:text-slate-100 text-slate-800">
            {t.radialFeatureHeading}
          </h3>

          <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
            {t.radialFeatureBody}
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-xl dark:bg-slate-900/70 bg-[#EEF2F6] border dark:border-slate-800 border-slate-200/80">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                  {t.step1Title}
                </div>
                <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-0.5">
                  {t.step1Desc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl dark:bg-slate-900/70 bg-[#EEF2F6] border dark:border-slate-800 border-slate-200/80">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="text-xs font-semibold dark:text-slate-200 text-slate-800 flex items-center gap-2">
                  <span>{t.step2Title}</span>
                  <kbd className="px-2 py-0.5 rounded dark:bg-slate-800 bg-white dark:text-indigo-300 text-indigo-600 border dark:border-slate-700 border-slate-300 font-mono text-[11px]">
                    Ctrl + Q
                  </kbd>
                  <span className="text-[10px] opacity-60">or</span>
                  <kbd className="px-2 py-0.5 rounded dark:bg-slate-800 bg-white dark:text-indigo-300 text-indigo-600 border dark:border-slate-700 border-slate-300 font-mono text-[11px]">
                    Alt + C
                  </kbd>
                </div>
                <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-0.5">
                  {t.step2Desc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl dark:bg-slate-900/70 bg-[#EEF2F6] border dark:border-slate-800 border-slate-200/80">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                  {t.step3Title}
                </div>
                <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-0.5">
                  {t.step3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Interactive Visual Mockup of Radial Wheel */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl dark:bg-[#0D0F14] bg-[#E8EEF5] border dark:border-slate-800/90 border-slate-300/70 relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-2 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.interactivePreview}</span>
          </div>

          {/* Simulated Radial Wheel Container */}
          <div className="w-[280px] h-[280px] relative flex items-center justify-center">
            {/* Center Circle Core */}
            <div className="relative z-20 w-24 h-24 rounded-full dark:bg-[#181B24] bg-[#F8FAFC] border dark:border-slate-700 border-slate-300 shadow-lg flex flex-col items-center justify-center text-center p-2">
              <img
                src={APP_ICON_BASE64}
                alt="Convertin"
                className="w-7 h-7 object-contain mb-1"
              />
              <span className="text-[10px] font-semibold dark:text-slate-200 text-slate-800 truncate max-w-[76px]">
                report.docx
              </span>
              <span className="text-[9px] font-mono dark:text-slate-400 text-slate-500">
                420 KB
              </span>
            </div>

            {/* Radial Petals */}
            {mockFormats.map((fmt, idx) => {
              const angle = (idx * (2 * Math.PI)) / mockFormats.length - Math.PI / 2;
              const x = centerX + radius * Math.cos(angle) - 34;
              const y = centerY + radius * Math.sin(angle) - 20;
              const isSelected = selectedMockFormat === fmt;

              return (
                <button
                  key={fmt}
                  onClick={() => handleMockClick(fmt)}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  className={`absolute w-[68px] h-[40px] rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-md border ${
                    isSelected
                      ? 'scale-105 bg-indigo-600 text-white border-indigo-500 font-bold z-20'
                      : 'dark:bg-[#1E222D] bg-[#F8FAFC] hover:dark:bg-slate-800 hover:bg-white dark:text-slate-200 text-slate-700 dark:border-slate-700 border-slate-300/80 z-10'
                  }`}
                >
                  <span className="font-mono text-[11px] font-bold">{fmt}</span>
                  <span className="text-[8px] opacity-75">Convert</span>
                </button>
              );
            })}
          </div>

          {/* Simulated Toast Feedback */}
          <div className="h-7 flex items-center justify-center">
            {mockConverted ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Converted report.docx → report.{selectedMockFormat.toLowerCase()}!</span>
              </div>
            ) : (
              <span className="text-[11px] dark:text-slate-500 text-slate-500">
                Pop-up appears at your cursor when pressing <strong className="text-indigo-500">Ctrl+Q</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Method 2: Standard Batch Drag & Drop Guide */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
          {t.batchGuideTitle}
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 space-y-2">
            <div className="w-8 h-8 rounded-xl dark:bg-indigo-500/15 bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
              {t.batchStep1Title}
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed">
              {t.batchStep1Desc}
            </p>
          </div>

          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 space-y-2">
            <div className="w-8 h-8 rounded-xl dark:bg-indigo-500/15 bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
              {t.batchStep2Title}
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed">
              {t.batchStep2Desc}
            </p>
          </div>

          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 space-y-2">
            <div className="w-8 h-8 rounded-xl dark:bg-emerald-500/15 bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
              {t.batchStep3Title}
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed">
              {t.batchStep3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
