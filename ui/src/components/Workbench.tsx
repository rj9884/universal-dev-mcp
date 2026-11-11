import React, { useState } from "react";
import { Terminal, FileCode, Radio, Cpu, ShieldCheck, Layers } from "lucide-react";
import { ConsoleRunner } from "./ConsoleRunner.js";
import { FileExplorer } from "./FileExplorer.js";
import { DevRadar } from "./DevRadar.js";
import { ApiPlayground } from "./ApiPlayground.js";
import { BackupCenter } from "./BackupCenter.js";
import { FeaturesHub } from "./FeaturesHub.js";

interface WorkbenchProps {
  initialSubTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const Workbench: React.FC<WorkbenchProps> = ({
  initialSubTab = "console",
  onNavigateTab,
}) => {
  const [activeTool, setActiveTool] = useState<string>(initialSubTab);

  const tools = [
    { id: "console", label: "Terminal Runner", icon: Terminal, desc: "Execute allowlisted build, test, and shell commands" },
    { id: "explorer", label: "File Explorer", icon: FileCode, desc: "Browse files, edit safely with auto-backups, and search code" },
    { id: "radar", label: "Dev Radar", icon: Radio, desc: "Scan running dev servers and inspect DOM page structure" },
    { id: "api", label: "API Tester", icon: Cpu, desc: "Test local REST endpoints with custom payloads & headers" },
    { id: "backups", label: "Backups & Diffs", icon: ShieldCheck, desc: "Inspect visual diffs and restore previous file versions" },
    { id: "catalog", label: "All 17 Tools", icon: Layers, desc: "Browse the complete Model Context Protocol tools catalog" },
  ];

  const handleCatalogNavigate = (target: string) => {
    if (target === "projects" && onNavigateTab) {
      onNavigateTab("projects");
      return;
    }
    if (target === "activity" && onNavigateTab) {
      onNavigateTab("activity");
      return;
    }
    if (target === "console" || target === "explorer" || target === "radar" || target === "backups" || target === "playground") {
      setActiveTool(target === "playground" ? "api" : target);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Sleek Tool Selector Bar */}
      <div className="bg-surface-night/90 border border-hairline-violet rounded-xl p-2 backdrop-blur-md">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white text-ink-deep shadow-md font-bold"
                    : "text-on-dark-muted hover:text-white hover:bg-ink-deep"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-ink-deep" : "text-accent-lime"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Workbench Canvas */}
      <div className="w-full">
        {activeTool === "console" && <ConsoleRunner />}
        {activeTool === "explorer" && <FileExplorer />}
        {activeTool === "radar" && <DevRadar />}
        {activeTool === "api" && <ApiPlayground />}
        {activeTool === "backups" && <BackupCenter />}
        {activeTool === "catalog" && <FeaturesHub onNavigate={handleCatalogNavigate} />}
      </div>
    </div>
  );
};
