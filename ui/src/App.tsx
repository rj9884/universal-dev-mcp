import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar.js";
import { ProjectHub } from "./components/ProjectHub.js";
import { ActivityFeed } from "./components/ActivityFeed.js";
import { BackupCenter } from "./components/BackupCenter.js";
import { DevRadar } from "./components/DevRadar.js";
import { ApiPlayground } from "./components/ApiPlayground.js";
import { useActivityStream } from "./hooks/useActivityStream.js";
import { fetchServerInfo, ServerInfo } from "./api/client.js";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("projects");
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const { events, status: sseStatus, clear: clearEvents } = useActivityStream();

  useEffect(() => {
    fetchServerInfo().then(setServerInfo).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-ink-deep text-white flex flex-col starfield-bg selection:bg-accent-lime selection:text-ink-deep">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sseStatus={sseStatus}
        activityCount={events.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "projects" && <ProjectHub />}
        {activeTab === "activity" && <ActivityFeed events={events} onClear={clearEvents} />}
        {activeTab === "backups" && <BackupCenter />}
        {activeTab === "radar" && <DevRadar />}
        {activeTab === "playground" && <ApiPlayground />}
      </main>

      {/* Sentry Signature Lime Squiggly Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-16">
        <svg
          viewBox="0 0 1200 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full text-accent-lime stroke-current opacity-80"
          style={{ height: "8px" }}
        >
          <path
            d="M0 6 Q 30 0, 60 6 T 120 6 T 180 6 T 240 6 T 300 6 T 360 6 T 420 6 T 480 6 T 540 6 T 600 6 T 660 6 T 720 6 T 780 6 T 840 6 T 900 6 T 960 6 T 1020 6 T 1080 6 T 1140 6 T 1200 6"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Sentry Developer Tools Footer */}
      <footer className="border-t border-hairline-violet bg-surface-night/80 py-8 text-xs font-mono text-on-dark-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-accent-lime font-bold">⚡ Universal Dev MCP</span>
            <span>—</span>
            <span>{serverInfo?.name || "universal-dev-mcp"} v{serverInfo?.version || "1.0.0"}</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>{serverInfo?.tools_count || 17} Tools Active</span>
            <span>•</span>
            <span>Port 3333</span>
            <span>•</span>
            <span className="text-white">TypeScript & Sentry UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
