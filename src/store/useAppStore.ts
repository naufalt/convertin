import { create } from 'zustand';
import { QueueItem, Settings, SystemCapabilities, LogEntry } from '../types';
import { detectMediaType, getDefaultTargetFormat } from '../utils/matrix';
import { Language, translations } from '../utils/i18n';

interface AppState {
  queue: QueueItem[];
  settings: Settings;
  system: SystemCapabilities;
  isProcessing: boolean;
  theme: 'dark' | 'light';
  language: Language;
  logs: LogEntry[];
  showLogs: boolean;
  activeTab: 'convert' | 'history' | 'tutorial' | 'system' | 'settings';
  sidebarCollapsed: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  setLanguage: (lang: Language) => void;
  t: () => typeof translations['id'];
  setActiveTab: (tab: 'convert' | 'history' | 'tutorial' | 'system' | 'settings') => void;
  toggleShowLogs: () => void;
  addLog: (level: LogEntry['level'], message: string) => void;
  clearLogs: () => void;
  addFiles: (files: { name: string; path: string; size: number }[]) => void;
  removeQueueItem: (id: string) => void;
  clearQueue: () => void;
  updateTargetFormat: (id: string, format: string) => void;
  setGlobalTargetFormat: (format: string) => void;
  updateProgress: (id: string, progress: number, eta?: string, speed?: string) => void;
  updateStatus: (
    id: string,
    status: QueueItem['status'],
    error?: string,
    outputPath?: string,
    extra?: { outputSize?: number; durationMs?: number; completedAt?: string; startTime?: number }
  ) => void;
  updateMetadata: (id: string, metadata: QueueItem['metadata']) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  setSystemCapabilities: (caps: SystemCapabilities) => void;
  setIsProcessing: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  queue: [],
  theme: 'dark',
  language: 'id',
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Convertin Engine initialized. Ready for conversion.',
    },
  ],
  showLogs: false,
  activeTab: 'convert',
  sidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setLanguage: (lang) => {
    localStorage.setItem('convertin_lang', lang);
    set({ language: lang });
  },

  t: () => {
    const lang = get().language;
    return translations[lang] || translations.id;
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  settings: {
    outputFolder: '',
    saveToSourceFolder: true,
    maxConcurrency: 2,
    useHardwareAcceleration: true,
  },
  system: {
    hasNvidiaGpu: false,
    hasFfmpeg: false,
    hasFfprobe: false,
    hasMagick: false,
    nvencSupported: false,
  },
  isProcessing: false,

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    set({ theme: next });
  },

  setTheme: (t) => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    set({ theme: t });
  },

  toggleShowLogs: () => set((state) => ({ showLogs: !state.showLogs })),

  addLog: (level, message) => {
    const newEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    set((state) => ({ logs: [newEntry, ...state.logs].slice(0, 300) }));
  },

  clearLogs: () => set({ logs: [] }),

  addFiles: (files) => {
    const existingPaths = new Set(get().queue.map((q) => q.path));
    const newItems: QueueItem[] = [];

    for (const f of files) {
      if (existingPaths.has(f.path)) continue;
      const ext = f.name.split('.').pop() || '';
      const mediaType = detectMediaType(ext);
      
      newItems.push({
        id: crypto.randomUUID(),
        name: f.name,
        path: f.path,
        size: f.size,
        extension: ext,
        mediaType,
        targetFormat: getDefaultTargetFormat(ext),
        status: 'idle',
        progress: 0,
      });
    }

    set((state) => ({ queue: [...state.queue, ...newItems] }));
  },

  removeQueueItem: (id) => {
    set((state) => ({ queue: state.queue.filter((item) => item.id !== id) }));
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  updateTargetFormat: (id, format) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, targetFormat: format } : item
      ),
    }));
  },

  setGlobalTargetFormat: (format) => {
    set((state) => ({
      queue: state.queue.map((item) => {
        if (item.status === 'idle') {
          return { ...item, targetFormat: format };
        }
        return item;
      }),
    }));
  },

  updateProgress: (id, progress, eta, speed) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, progress, eta, speed } : item
      ),
    }));
  },

  updateStatus: (id, status, error, outputPath, extra) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status, error, outputPath, ...extra } : item
      ),
    }));
  },

  updateMetadata: (id, metadata) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, metadata } : item
      ),
    }));
  },

  updateSettings: (partial) => {
    set((state) => ({ settings: { ...state.settings, ...partial } }));
  },

  setSystemCapabilities: (caps) => {
    set({ system: caps });
  },

  setIsProcessing: (val) => {
    set({ isProcessing: val });
  },
}));
