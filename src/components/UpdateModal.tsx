import React, { useState, useEffect } from 'react';
import {
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCw,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheckOnMount?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  autoCheckOnMount = false
}) => {
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [readyToInstall, setReadyToInstall] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseName: string;
    releaseNotes: string;
    downloadUrl?: string;
    fileName?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkForUpdates = async () => {
    if (!window.electronAPI?.checkForUpdates) return;
    setChecking(true);
    setErrorMessage(null);
    try {
      const res = await window.electronAPI.checkForUpdates();
      setUpdateInfo(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengecek pembaruan.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkForUpdates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (autoCheckOnMount) {
      checkForUpdates();
    }
  }, [autoCheckOnMount]);

  useEffect(() => {
    if (window.electronAPI?.onUpdateDownloadProgress) {
      const unsubscribe = window.electronAPI.onUpdateDownloadProgress((data) => {
        setDownloadPercent(data.percent);
      });
      return unsubscribe;
    }
  }, []);

  const handleStartDownload = async () => {
    if (!updateInfo?.downloadUrl || !window.electronAPI?.downloadUpdate) {
      if (window.electronAPI?.openReleasePage) {
        await window.electronAPI.openReleasePage();
      }
      return;
    }

    setDownloading(true);
    setDownloadPercent(0);
    setErrorMessage(null);

    const res = await window.electronAPI.downloadUpdate(updateInfo.downloadUrl);
    setDownloading(false);
    if (res.success) {
      setReadyToInstall(true);
    } else {
      setErrorMessage(res.error || 'Gagal mengunduh update.');
    }
  };

  const handleInstallAndRestart = async () => {
    if (window.electronAPI?.installUpdate) {
      await window.electronAPI.installUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl dark:bg-[#1C1A24] bg-white border dark:border-white/10 border-black/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/5 border-black/5 dark:bg-white/[0.02] bg-black/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center dark:bg-md-darkPrimary/20 bg-md-primary/10 text-md-primary dark:text-md-darkPrimary">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold dark:text-white text-zinc-900 leading-tight">
                Pembaruan Convertin
              </h3>
              <p className="text-[11px] font-mono dark:text-zinc-400 text-zinc-500">
                Versi saat ini: v{updateInfo?.currentVersion || '2.0.0'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center dark:text-zinc-400 text-zinc-500 hover:dark:bg-white/10 hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-4">
          {checking ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-md-primary dark:text-md-darkPrimary" />
              <p className="text-xs font-medium dark:text-zinc-300 text-zinc-600">
                Memeriksa rilis terbaru di GitHub...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="p-3.5 rounded-2xl dark:bg-rose-950/30 bg-rose-50 border dark:border-rose-900/40 border-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs dark:text-rose-200 text-rose-800 leading-relaxed">
                {errorMessage}
              </div>
            </div>
          ) : updateInfo?.hasUpdate ? (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-2xl dark:bg-md-darkPrimary/10 bg-md-primary/5 border dark:border-md-darkPrimary/20 border-md-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-md-primary dark:text-md-darkPrimary">
                    Versi Baru Tersedia
                  </span>
                  <div className="text-base font-bold dark:text-white text-zinc-900">
                    v{updateInfo.latestVersion}
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-md-primary dark:text-md-darkPrimary" />
              </div>

              {/* Release Notes */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500 mb-1 block">
                  Catatan Rilis
                </label>
                <div className="max-h-36 overflow-y-auto p-3 rounded-2xl dark:bg-black/30 bg-zinc-100 dark:text-zinc-300 text-zinc-700 text-xs font-mono whitespace-pre-wrap leading-relaxed border dark:border-white/5 border-black/5">
                  {updateInfo.releaseNotes}
                </div>
              </div>

              {/* Download Progress */}
              {downloading && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between text-xs font-mono dark:text-zinc-300 text-zinc-700">
                    <span>Mengunduh update...</span>
                    <span className="font-semibold">{downloadPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full dark:bg-white/10 bg-black/10 overflow-hidden">
                    <div
                      className="h-full bg-md-primary dark:bg-md-darkPrimary transition-all duration-200"
                      style={{ width: `${downloadPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {readyToInstall && (
                <div className="p-3 rounded-2xl dark:bg-emerald-950/40 bg-emerald-50 border dark:border-emerald-800/40 border-emerald-200 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium dark:text-emerald-300 text-emerald-800">
                    Pembaruan siap dipasang. Klik tombol di bawah untuk memasang dan membuka kembali Convertin.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center gap-2.5 text-center">
              <div className="w-10 h-10 rounded-full dark:bg-emerald-950/50 bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold dark:text-white text-zinc-900">
                  Convertin Sudah Versi Terbaru
                </h4>
                <p className="text-xs dark:text-zinc-400 text-zinc-500 mt-0.5">
                  Anda sedang menjalankan versi v{updateInfo?.currentVersion || '2.0.0'}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t dark:border-white/5 border-black/5 dark:bg-white/[0.02] bg-black/[0.02] flex items-center justify-between">
          <button
            onClick={checkForUpdates}
            disabled={checking || downloading}
            className="flex items-center gap-1.5 text-xs font-medium dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-black transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Periksa Ulang</span>
          </button>

          <div className="flex items-center gap-2">
            {updateInfo?.hasUpdate ? (
              readyToInstall ? (
                <button
                  onClick={handleInstallAndRestart}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold dark:bg-emerald-500 bg-emerald-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  Restart & Pasang Sekarang
                </button>
              ) : downloading ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-2xl text-xs font-semibold dark:bg-white/10 bg-black/10 dark:text-zinc-400 text-zinc-600 cursor-not-allowed flex items-center gap-1.5"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunduh ({downloadPercent}%)</span>
                </button>
              ) : updateInfo.downloadUrl ? (
                <button
                  onClick={handleStartDownload}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Download Update</span>
                </button>
              ) : (
                <button
                  onClick={() => window.electronAPI?.openReleasePage?.()}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold dark:bg-md-darkPrimary bg-md-primary dark:text-md-darkOnPrimary text-md-onPrimary hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
                >
                  <span>Buka Halaman Rilis</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-2xl text-xs font-semibold dark:bg-white/10 bg-black/5 dark:text-white text-zinc-800 hover:dark:bg-white/15 hover:bg-black/10 transition-colors"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

