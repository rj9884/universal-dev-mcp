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
    { id: "activity", label: "Live Activity", icon: Activity, badge: activityCount > 0 ? activityCount : undefined },
    { id: "backups", label: "Backups & Diffs", icon: ShieldCheck },
    { id: "radar", label: "Dev Radar", icon: Radio },
    { id: "playground", label: "Playground & CLI", icon: Terminal },
  ];

  return (
    <header className="bg-primary/95 border-b border-hairline-violet sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <button
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-3 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-md bg-surface-night border border-hairline-violet flex items-center justify-center shadow-inner group-hover:border-accent-lime/60 transition-colors">
              <span className="text-accent-lime font-mono font-bold text-lg group-hover:scale-110 transition-transform">⚡</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-lg group-hover:text-accent-lime transition-colors">
                  UNIVERSAL DEV
                </span>
                <span className="bg-accent-lime text-ink-deep text-xs font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
                  MCP
                </span>
              </div>
              <p className="text-[11px] font-mono text-on-dark-muted hidden sm:block">
                Bridge AI tools to localhost
              </p>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn-cap flex items-center space-x-2 px-3 py-2 rounded-md transition-colors relative ${
                    isActive
                      ? "bg-on-dark-faint text-white border-b-2 border-accent-lime"
                      : "text-on-dark-muted hover:text-white hover:bg-surface-night/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-accent-lime" : ""}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="bg-accent-pink text-ink-deep text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Connection Status & Mode Pill */}
          <div className="flex items-center space-x-3">
            {/* Quick Switch Button */}
            <button
              onClick={() => setActiveTab(activeTab === "home" ? "projects" : "home")}
              className="hidden lg:flex items-center space-x-1.5 bg-surface-night hover:bg-surface-card border border-hairline-violet px-3 py-1.5 rounded text-xs font-mono text-on-dark-muted hover:text-white transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-accent-pink" />
              <span>{activeTab === "home" ? "Console View" : "Overview"}</span>
            </button>

            {/* SSE Status Pill */}
            <div className="flex items-center space-x-1.5 bg-surface-night px-2.5 py-1.5 rounded-[4px] border border-hairline-violet text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
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
