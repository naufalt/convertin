import React from 'react';
import {
  Cpu,
  HardDrive,
  Zap,
  Activity,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Command,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TelemetryStats } from '../types';

interface Props {
  telemetry: TelemetryStats;
}

export const SystemView: React.FC<Props> = ({ telemetry }) => {
  const system = useAppStore((state) => state.system);
  const queue = useAppStore((state) => state.queue);
  const t = useAppStore((state) => state.t());

  const totalCompleted = queue.filter((q) => q.status === 'completed').length;
  const totalConverting = queue.filter((q) => q.status === 'converting').length;

  const storageUsedGb = Math.max(0, telemetry.storageTotalGb - telemetry.storageFreeGb);
  const storagePercentage =
    telemetry.storageTotalGb > 0 ? Math.round((storageUsedGb / telemetry.storageTotalGb) * 100) : 0;
  const ramPercentage =
    telemetry.ramTotalGb > 0 ? Math.round((telemetry.ramUsedGb / telemetry.ramTotalGb) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800/80 border-slate-300/70">
        <div>
          <h2 className="text-base font-semibold dark:text-slate-100 text-slate-800">
            {t.sysTitle}
          </h2>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t.sysDesc}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium dark:bg-emerald-500/10 bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border dark:border-emerald-500/20 border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t.engineReady}
        </span>
      </div>

      {/* Prominent Device Specification Speed Notice */}
      <div className="p-4 rounded-2xl dark:bg-amber-500/10 bg-amber-500/10 border dark:border-amber-500/25 border-amber-500/30 flex items-start gap-3">
        <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-semibold text-amber-600 dark:text-amber-400">
            {t.specTipTitle}
          </div>
          <p className="dark:text-amber-200/90 text-amber-800/90 mt-1 leading-relaxed">
            {t.specTipBody}
          </p>
        </div>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* CPU / GPU Load */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 dark:text-indigo-400 text-indigo-600" />
              <span className="text-xs font-medium dark:text-slate-400 text-slate-600">
                {t.cpuLoad}
              </span>
            </div>
            <span className="text-sm font-mono font-bold dark:text-slate-100 text-slate-800">
              {telemetry.cpuUsage}%
            </span>
          </div>

          <div className="h-1.5 w-full dark:bg-slate-800 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${telemetry.cpuUsage}%` }}
            />
          </div>

          <div className="text-[11px] dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
            {system.nvencSupported ? (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>NVIDIA NVENC Hardware Acceleration</span>
              </>
            ) : (
              <span>Multi-core CPU Worker Threads</span>
            )}
          </div>
        </div>

        {/* Memory RAM */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium dark:text-slate-400 text-slate-600">
                {t.sysRam}
              </span>
            </div>
            <span className="text-sm font-mono font-bold dark:text-slate-100 text-slate-800">
              {ramPercentage}%
            </span>
          </div>

          <div className="h-1.5 w-full dark:bg-slate-800 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${ramPercentage}%` }}
            />
          </div>

          <div className="text-[11px] font-mono dark:text-slate-400 text-slate-500">
            {telemetry.ramUsedGb} GB used of {telemetry.ramTotalGb} GB
          </div>
        </div>

        {/* Disk Storage */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium dark:text-slate-400 text-slate-600">
                {t.diskStorage}
              </span>
            </div>
            <span className="text-xs font-mono font-bold dark:text-slate-100 text-slate-800">
              {telemetry.storageFreeGb} GB free
            </span>
          </div>

          <div className="h-1.5 w-full dark:bg-slate-800 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>

          <div className="text-[11px] font-mono dark:text-slate-400 text-slate-500">
            {storageUsedGb} GB used of {telemetry.storageTotalGb} GB
          </div>
        </div>
      </div>

      {/* Supported Engines & Formats Matrix */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
          {t.modulesTitle}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl dark:bg-[#1C202B] bg-[#E8EEF5] flex items-center justify-center flex-shrink-0 text-blue-500">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.docEngine}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5 leading-relaxed">
                {t.docEngineDesc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl dark:bg-[#1C202B] bg-[#E8EEF5] flex items-center justify-center flex-shrink-0 text-indigo-500">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.videoEngine}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5 leading-relaxed">
                {t.videoEngineDesc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl dark:bg-[#1C202B] bg-[#E8EEF5] flex items-center justify-center flex-shrink-0 text-emerald-500">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.imageEngine}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5 leading-relaxed">
                {t.imageEngineDesc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl dark:bg-[#1C202B] bg-[#E8EEF5] flex items-center justify-center flex-shrink-0 text-amber-500">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.audioEngine}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5 leading-relaxed">
                {t.audioEngineDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Session & Quick Shortcuts Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
              {t.sessionStats}
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
              {t.sessionStatsDesc}
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <div className="text-right">
              <div className="text-base font-bold text-emerald-500">{totalCompleted}</div>
              <div className="text-[10px] dark:text-slate-500 text-slate-400">Done</div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold dark:text-slate-100 text-slate-800">{totalConverting}</div>
              <div className="text-[10px] dark:text-slate-500 text-slate-400">Active</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl dark:bg-[#1C202B] bg-[#E8EEF5] flex items-center justify-center dark:text-slate-300 text-slate-700">
              <Command className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.radialTitle}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                {t.radialDesc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <kbd className="px-2 py-1 rounded-lg dark:bg-[#1C202B] bg-[#E8EEF5] dark:text-indigo-300 text-indigo-600 border dark:border-slate-700 border-slate-300 font-semibold">
              Ctrl+Q
            </kbd>
            <span className="text-slate-400">/</span>
            <kbd className="px-2 py-1 rounded-lg dark:bg-[#1C202B] bg-[#E8EEF5] dark:text-indigo-300 text-indigo-600 border dark:border-slate-700 border-slate-300 font-semibold">
              Alt+C
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
