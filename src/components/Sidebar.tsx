import React from 'react';
import {
  Layers,
  History,
  BookOpen,
  Activity,
  Sliders,
  Terminal,
  Sun,
  Moon,
  ShieldCheck,
  Languages,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Sidebar: React.FC = () => {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const queue = useAppStore((state) => state.queue);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const showLogs = useAppStore((state) => state.showLogs);
  const toggleShowLogs = useAppStore((state) => state.toggleShowLogs);
  const logsCount = useAppStore((state) => state.logs.length);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = useAppStore((state) => state.t());
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  const activeCount = queue.filter((i) => i.status === 'idle' || i.status === 'converting').length;
  const historyCount = queue.filter((i) => i.status === 'completed' || i.status === 'error').length;

  const navItems = [
    {
      id: 'convert' as const,
      label: t.converter,
      icon: Layers,
      badge: activeCount > 0 ? activeCount : undefined,
    },
    {
      id: 'history' as const,
      label: t.history,
      icon: History,
      badge: historyCount > 0 ? historyCount : undefined,
    },
    {
      id: 'tutorial' as const,
      label: t.howToUse,
      icon: BookOpen,
    },
    {
      id: 'system' as const,
      label: t.systemInfo,
      icon: Activity,
    },
    {
      id: 'settings' as const,
      label: t.preferences,
      icon: Sliders,
    },
  ];

  return (
    <aside
      className={`relative flex-shrink-0 flex flex-col justify-between p-3 select-none border-r dark:border-slate-800/80 border-slate-300/70 dark:bg-[#11131A] bg-[#E3E8F0] transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Primary Navigation */}
      <div className="space-y-1">
        {/* Workspace Label & Collapse/Expand Button */}
        <div className="flex items-center justify-between px-2 py-1.5 min-h-[32px]">
          {!sidebarCollapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-500 text-slate-500 truncate transition-opacity duration-200">
              {t.workspace}
            </span>
          )}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:dark:bg-slate-800/60 hover:bg-slate-300/60 transition-colors ${
              sidebarCollapsed ? 'mx-auto' : ''
            }`}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
              } py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'dark:bg-[#1C202B] bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm border dark:border-indigo-500/30 border-slate-300/90 font-semibold'
                  : 'dark:text-slate-400 text-slate-600 hover:dark:bg-slate-800/40 hover:bg-slate-300/50 hover:dark:text-slate-200 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 relative">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'dark:text-indigo-400 text-indigo-600'
                      : 'dark:text-slate-500 text-slate-500'
                  }`}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

                {/* Dot badge when collapsed */}
                {sidebarCollapsed && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </div>

              {!sidebarCollapsed && item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold ${
                    isActive
                      ? 'dark:bg-indigo-500/20 bg-indigo-500/10 dark:text-indigo-300 text-indigo-600'
                      : 'dark:bg-slate-800 bg-slate-300/80 dark:text-slate-400 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Quick Utilities & Offline Badge */}
      <div className="space-y-2 pt-3 border-t dark:border-slate-800/80 border-slate-300/70">
        {/* Language Quick Switcher */}
        <button
          onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          } py-2 rounded-xl text-xs font-medium dark:text-slate-400 text-slate-600 hover:dark:bg-slate-800/40 hover:bg-slate-300/50 transition-colors`}
          title={`Switch Language (${language.toUpperCase()})`}
        >
          <div className="flex items-center gap-2.5">
            <Languages className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            {!sidebarCollapsed && <span>Language</span>}
          </div>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded dark:bg-slate-800 bg-slate-300/80 dark:text-slate-300 text-slate-700 font-bold">
              {language}
            </span>
          )}
        </button>

        {/* Console Logs Toggle */}
        <button
          onClick={toggleShowLogs}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          } py-2 rounded-xl text-xs font-medium transition-colors ${
            showLogs
              ? 'dark:bg-slate-800 bg-[#F8FAFC] dark:text-white text-slate-900 shadow-sm'
              : 'dark:text-slate-400 text-slate-600 hover:dark:bg-slate-800/40 hover:bg-slate-300/50'
          }`}
          title={t.engineConsole}
        >
          <div className="flex items-center gap-2.5 relative">
            <Terminal className="w-4 h-4 dark:text-slate-500 text-slate-500 flex-shrink-0" />
            {!sidebarCollapsed && <span>{t.engineConsole}</span>}
            {sidebarCollapsed && logsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-500" />
            )}
          </div>
          {!sidebarCollapsed && logsCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded dark:bg-slate-800 bg-slate-300/80 dark:text-slate-400 text-slate-700">
              {logsCount}
            </span>
          )}
        </button>

        {/* Theme Switcher Row */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          } py-2 rounded-xl text-xs font-medium dark:text-slate-400 text-slate-600 hover:dark:bg-slate-800/40 hover:bg-slate-300/50 transition-colors`}
          title={`${t.appearance}: ${theme}`}
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            ) : (
              <Sun className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            {!sidebarCollapsed && <span>{t.appearance}</span>}
          </div>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded dark:bg-slate-800 bg-slate-300/80 dark:text-slate-300 text-slate-700">
              {theme}
            </span>
          )}
        </button>

        {/* Minimalist Offline Status Pill */}
        <div
          className={`rounded-xl dark:bg-[#161922] bg-[#DCE3EC] border dark:border-slate-800/80 border-slate-300/80 flex items-center ${
            sidebarCollapsed
              ? 'justify-center p-2'
              : 'justify-between px-3 py-2.5'
          }`}
          title={t.offlineStatus}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-[11px] font-medium dark:text-slate-300 text-slate-700 truncate">
                {t.offlineStatus}
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          )}
        </div>
      </div>
    </aside>
  );
};
