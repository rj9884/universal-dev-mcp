import React from "react";
import { FolderGit2, Activity, ShieldCheck, Radio, Terminal, Sparkles, SlidersHorizontal } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sseStatus: "connected" | "connecting" | "offline";
  activityCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sseStatus,
  activityCount,
}) => {
  const tabs = [
    { id: "home", label: "Overview", icon: Sparkles },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "activity", label: "Activity", fullLabel: "Live Activity", icon: Activity, badge: activityCount > 0 ? activityCount : undefined },
    { id: "backups", label: "Backups", fullLabel: "Backups & Diffs", icon: ShieldCheck },
    { id: "radar", label: "Radar", fullLabel: "Dev Radar", icon: Radio },
    { id: "playground", label: "Playground", fullLabel: "Playground & CLI", icon: Terminal },
  ];

  return (
    <header className="bg-primary/95 border-b border-hairline-violet sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Brand Logo & Name */}
          <button
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-3 text-left focus:outline-none group shrink-0"
          >
            <div className="w-9 h-9 rounded-md bg-surface-night border border-hairline-violet flex items-center justify-center shadow-inner group-hover:border-accent-lime/60 transition-colors shrink-0">
              <span className="text-accent-lime font-mono font-bold text-lg group-hover:scale-110 transition-transform">⚡</span>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2 leading-none">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg group-hover:text-accent-lime transition-colors whitespace-nowrap">
                  UNIVERSAL DEV
                </span>
                <span className="bg-accent-lime text-ink-deep text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase tracking-[0.2px] shrink-0 leading-none">
                  MCP
                </span>
              </div>
              <p className="text-[10px] font-mono text-on-dark-muted hidden xl:block mt-1 whitespace-nowrap">
                Localhost Dev Tools Bridge
              </p>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-1 shrink min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.fullLabel || tab.label}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-md transition-colors relative whitespace-nowrap shrink-0 text-xs font-bold uppercase tracking-[0.2px] ${
                    isActive
                      ? "bg-on-dark-faint text-white border-b-2 border-accent-lime"
                      : "text-on-dark-muted hover:text-white hover:bg-surface-night/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-accent-lime" : ""}`} />
                  <span className="hidden sm:inline">
                    <span className="inline 2xl:hidden">{tab.label}</span>
                    <span className="hidden 2xl:inline">{tab.fullLabel || tab.label}</span>
                  </span>
                  {tab.badge !== undefined && (
                    <span className="bg-accent-pink text-ink-deep text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Connection Status & Mode Pill */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Quick Switch Button */}
            <button
              onClick={() => setActiveTab(activeTab === "home" ? "projects" : "home")}
              className="hidden xl:flex items-center space-x-1.5 bg-surface-night hover:bg-surface-card border border-hairline-violet px-3 py-1.5 rounded text-xs font-mono text-on-dark-muted hover:text-white transition-colors shrink-0 whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-accent-pink" />
              <span>{activeTab === "home" ? "Console View" : "Overview"}</span>
            </button>

            {/* SSE Status Pill */}
            <div className="flex items-center space-x-1.5 bg-surface-night px-2.5 py-1.5 rounded-[4px] border border-hairline-violet text-xs font-mono shrink-0 whitespace-nowrap">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  sseStatus === "connected"
                    ? "bg-accent-lime shadow-[0_0_8px_rgba(194,239,78,0.8)]"
                    : sseStatus === "connecting"
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-accent-pink"
                }`}
              />
              <span className="text-[11px] text-on-dark-muted uppercase font-bold tracking-[0.2px]">
                {sseStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
