import React, { useEffect, useState } from 'react';
import {
  Folder,
  Cpu,
  Layers,
  Sun,
  Moon,
  Check,
  Power,
  Code2,
  CupSoda,
  ExternalLink,
  Heart,
  Languages,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import qrisNgoods from '../assets/qris-ngoods.jpg';

export const SettingsView: React.FC = () => {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const system = useAppStore((state) => state.system);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = useAppStore((state) => state.t());

  const [startupEnabled, setStartupEnabled] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.getStartupEnabled) {
      window.electronAPI.getStartupEnabled().then((enabled) => {
        setStartupEnabled(!!enabled);
      });
    }
  }, []);

  const handleToggleStartup = async () => {
    const next = !startupEnabled;
    setStartupEnabled(next);
    if (window.electronAPI?.setStartupEnabled) {
      const res = await window.electronAPI.setStartupEnabled(next);
      if (!res.success) {
        setStartupEnabled(!next);
      }
    }
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI?.selectFolder) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        updateSettings({ outputFolder: folder, saveToSourceFolder: false });
      }
    }
  };

  const handleOpenExternal = (url: string) => {
    if (window.electronAPI?.openPath) {
      window.electronAPI.openPath(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none space-y-6">
      {/* Header */}
      <div className="pb-4 border-b dark:border-slate-800/80 border-slate-300/70">
        <h2 className="text-base font-semibold dark:text-slate-100 text-slate-800">
          {t.prefTitle}
        </h2>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
          {t.prefDesc}
        </p>
      </div>

      <div className="max-w-2xl space-y-3.5">
        {/* Language Selection */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl dark:bg-indigo-500/15 bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.langTitle}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                {t.langDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-xl dark:bg-slate-800/80 bg-[#E8EEF5] border dark:border-slate-700/60 border-slate-300/70">
            <button
              onClick={() => setLanguage('id')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === 'id'
                  ? 'dark:bg-[#13151C] bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bahasa Indonesia
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === 'en'
                  ? 'dark:bg-[#13151C] bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Start with Windows (Startup) */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl dark:bg-indigo-500/15 bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Power className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.startupTitle}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                {t.startupDesc}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleStartup}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              startupEnabled
                ? 'dark:bg-indigo-500/20 bg-indigo-600 dark:text-indigo-300 text-white dark:border-indigo-500/40 border-indigo-600 font-semibold shadow-sm'
                : 'dark:bg-slate-800 bg-[#E8EEF5] dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
            }`}
          >
            {startupEnabled && <Check className="w-3.5 h-3.5" />}
            <span>{startupEnabled ? t.enabled : t.disabled}</span>
          </button>
        </div>

        {/* Appearance Theme */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl dark:bg-slate-800 bg-[#E8EEF5] flex items-center justify-center dark:text-slate-300 text-slate-700">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.themeTitle}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                {t.themeDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-xl dark:bg-slate-800/80 bg-[#E8EEF5] border dark:border-slate-700/60 border-slate-300/70">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-[#F8FAFC] text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{t.themeLight}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-[#13151C] text-white shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{t.themeDark}</span>
            </button>
          </div>
        </div>

        {/* Output Destination */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl dark:bg-slate-800 bg-[#E8EEF5] flex items-center justify-center dark:text-slate-300 text-slate-700">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                  {t.outputTitle}
                </div>
                <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                  {t.outputDesc}
                </p>
              </div>
            </div>

            <div className="flex items-center p-1 rounded-xl dark:bg-slate-800/80 bg-[#E8EEF5] border dark:border-slate-700/60 border-slate-300/70">
              <button
                onClick={() => updateSettings({ saveToSourceFolder: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  settings.saveToSourceFolder
                    ? 'dark:bg-[#13151C] bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.sourceFolder}
              </button>
              <button
                onClick={handleSelectFolder}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !settings.saveToSourceFolder
                    ? 'dark:bg-[#13151C] bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.custom}
              </button>
            </div>
          </div>

          {!settings.saveToSourceFolder && (
            <div className="pt-2 border-t dark:border-slate-800/60 border-slate-200 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] dark:text-slate-400 text-slate-600 truncate max-w-md">
                {settings.outputFolder || 'No folder selected'}
              </span>
              <button
                onClick={handleSelectFolder}
                className="text-indigo-500 hover:underline font-medium text-xs"
              >
                Change Folder...
              </button>
            </div>
          )}
        </div>

        {/* Parallel Worker Concurrency */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl dark:bg-slate-800 bg-[#E8EEF5] flex items-center justify-center dark:text-slate-300 text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.workersTitle}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                {t.workersDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl dark:bg-slate-800/80 bg-[#E8EEF5] border dark:border-slate-700/60 border-slate-300/70">
            {[1, 2, 4].map((num) => (
              <button
                key={num}
                onClick={() => updateSettings({ maxConcurrency: num })}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  settings.maxConcurrency === num
                    ? 'dark:bg-[#13151C] bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {num}x
              </button>
            ))}
          </div>
        </div>

        {/* Hardware Acceleration */}
        <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl dark:bg-slate-800 bg-[#E8EEF5] flex items-center justify-center dark:text-slate-300 text-slate-700">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                {t.nvencTitle}
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                {system.nvencSupported ? t.nvencDescDetected : t.nvencDescFallback}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              updateSettings({ useHardwareAcceleration: !settings.useHardwareAcceleration })
            }
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              settings.useHardwareAcceleration
                ? 'dark:bg-indigo-500/20 bg-indigo-600 dark:text-indigo-300 text-white dark:border-indigo-500/40 border-indigo-600 font-semibold shadow-sm'
                : 'dark:bg-slate-800 bg-[#E8EEF5] dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
            }`}
          >
            {settings.useHardwareAcceleration && <Check className="w-3.5 h-3.5" />}
            <span>{settings.useHardwareAcceleration ? t.enabled : t.disabled}</span>
          </button>
        </div>

        {/* Developer Info & Support Matcha Section */}
        <div className="pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-500 text-slate-500 mb-2.5 px-1">
            {t.aboutDev}
          </div>

          <div className="p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-slate-800/80 border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl dark:bg-emerald-500/15 bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 border dark:border-emerald-500/20 border-emerald-500/20">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold dark:text-slate-100 text-slate-800">
                    {t.devName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md dark:bg-slate-800 bg-[#E8EEF5] dark:text-slate-300 text-slate-600 font-mono">
                    @naufalt
                  </span>
                </div>
                <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-1 leading-relaxed">
                  {t.devDesc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleOpenExternal('https://github.com/naufalt/convertin')}
                className="px-3 py-2 rounded-xl text-xs font-medium dark:bg-slate-800 bg-[#E8EEF5] hover:dark:bg-slate-700 hover:bg-slate-300/80 dark:text-slate-200 text-slate-700 border dark:border-slate-700 border-slate-300/80 transition-colors flex items-center gap-1.5"
                title="View GitHub Profile & Repository"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>

              <button
                onClick={() => setShowQrisModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                title="Scan QRIS Ngoods to Buy Me a Matcha"
              >
                <CupSoda className="w-3.5 h-3.5" />
                <span>{t.buyMatcha}</span>
                <Heart className="w-3 h-3 fill-current opacity-80" />
              </button>
            </div>
          </div>
        </div>

        {/* Available on Microsoft Store Banner */}
        <button
          type="button"
          onClick={() => handleOpenExternal('ms-windows-store://search/?query=ConvertIn')}
          className="w-full text-left p-4 rounded-2xl dark:bg-[#13151C] bg-[#F8FAFC] border dark:border-emerald-500/25 border-emerald-500/30 hover:dark:border-emerald-500/50 hover:border-emerald-500/50 flex items-start gap-3 shadow-sm transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold dark:text-slate-100 text-slate-800">
                  {t.msStoreSoonTitle}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-semibold font-mono">
                  AVAILABLE
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-1 leading-relaxed">
              {t.msStoreSoonDesc}
            </p>
          </div>
        </button>
      </div>

      {/* QRIS Ngoods Modal */}
      {showQrisModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQrisModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl dark:bg-[#13151C] bg-white border dark:border-slate-800 border-slate-200 shadow-2xl p-5 flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrisModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg dark:text-slate-400 text-slate-500 hover:dark:bg-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Close QRIS modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs mb-1">
              <CupSoda className="w-4 h-4" />
              <span>{t.buyMatcha}</span>
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 mb-3">
              QRIS a.n. <span className="font-semibold dark:text-slate-200 text-slate-700">Ngoods</span>
            </p>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner">
              <img
                src={qrisNgoods}
                alt="QRIS Ngoods"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            <p className="text-[10px] dark:text-slate-400 text-slate-500 mt-3 leading-relaxed">
              {language === 'id'
                ? 'Scan QRIS di atas dengan e-wallet atau mobile banking favorit Anda. Terima kasih!'
                : 'Scan the QRIS above with your favorite e-wallet or mobile banking app. Thank you!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
