import React, { useState } from "react";
import { Activity, Clock, CheckCircle2, AlertTriangle, ShieldCheck, ChevronDown, ChevronRight, Trash2, Search } from "lucide-react";
import { ActivityEventItem, clearActivity } from "../api/client.js";

interface ActivityFeedProps {
  events: ActivityEventItem[];
  onClear: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, onClear }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredEvents = events.filter((ev) => {
    if (filterType !== "all" && ev.type !== filterType) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      ev.toolName?.toLowerCase().includes(term) ||
      JSON.stringify(ev.arguments || {}).toLowerCase().includes(term) ||
      (ev.result || "").toLowerCase().includes(term) ||
      (ev.error || "").toLowerCase().includes(term)
    );
  });

  const handleClear = async () => {
    await clearActivity();
    onClear();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Live AI Activity Feed</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Real-time SSE
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Real-time telemetry stream capturing every action, file edit, and shell command called by Claude, Cursor, or LLMs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleClear}
            className="btn-cap bg-surface-night hover:bg-ink-deep text-on-dark-muted hover:text-accent-pink border border-hairline-violet px-3 py-1.5 rounded-md text-xs flex items-center space-x-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Feed</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-on-dark-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tool calls or arguments..."
            className="w-full bg-surface-night border border-hairline-violet rounded-md pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-on-dark-muted/60 focus:outline-none focus:border-accent-lime"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Events" },
            { id: "tool:complete", label: "Completed" },
            { id: "tool:error", label: "Errors" },
            { id: "backup:created", label: "Backups" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`btn-cap px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition ${
                filterType === f.id
                  ? "bg-accent-lime text-ink-deep font-bold"
                  : "bg-surface-night text-on-dark-muted hover:text-white border border-hairline-violet"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-surface-night border border-hairline-violet rounded-xl p-12 text-center text-on-dark-muted font-mono text-xs">
            <Activity className="w-8 h-8 text-on-dark-muted mx-auto mb-3 opacity-50" />
            <p>No activity recorded yet.</p>
            <p className="text-[11px] mt-1 text-on-dark-muted/70">
              When Claude, Cursor, or an API client executes an MCP tool, it will appear here in real time.
            </p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isExpanded = expandedId === ev.id;
            const isError = ev.type === "tool:error" || Boolean(ev.error);
            const isBackup = ev.type === "backup:created";
            const dateStr = new Date(ev.timestamp).toLocaleTimeString();

            return (
              <div
                key={ev.id}
                className={`bg-surface-night border rounded-xl transition overflow-hidden ${
                  isError
                    ? "border-accent-pink/50"
                    : isBackup
                    ? "border-accent-violet/60"
                    : "border-hairline-violet hover:border-hairline-cool/40"
                }`}
              >
                {/* Event Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="text-on-dark-muted">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>

                    {/* Status Icon */}
                    {isError ? (
                      <AlertTriangle className="w-4 h-4 text-accent-pink shrink-0" />
                    ) : isBackup ? (
                      <ShieldCheck className="w-4 h-4 text-accent-violet shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-accent-lime shrink-0" />
                    )}

                    {/* Tool Name or Action */}
                    <span className="font-mono font-bold text-sm text-white">
                      {ev.toolName || ev.type}
                    </span>

                    {/* Arguments preview */}
                    {ev.arguments && (
                      <span className="text-xs font-mono text-on-dark-muted truncate hidden sm:inline">
                        {JSON.stringify(ev.arguments).slice(0, 80)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 text-xs font-mono">
                    {ev.durationMs !== undefined && (
                      <span className="bg-ink-deep border border-hairline-violet text-on-dark-muted text-[11px] px-2 py-0.5 rounded flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-accent-lime" />
                        <span>{ev.durationMs}ms</span>
                      </span>
                    )}
                    <span className="text-on-dark-muted text-[11px]">{dateStr}</span>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="bg-ink-deep border-t border-hairline-violet p-4 space-y-3 font-mono text-xs">
                    {/* Arguments */}
                    {ev.arguments && (
                      <div>
                        <span className="text-on-dark-muted block text-[10px] uppercase font-bold tracking-wider mb-1">
                          Arguments
                        </span>
                        <pre className="bg-surface-night border border-hairline-violet rounded-md p-3 text-white overflow-x-auto text-[11px]">
                          {JSON.stringify(ev.arguments, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Result or Error */}
                    {ev.result && (
                      <div>
                        <span className="text-accent-lime block text-[10px] uppercase font-bold tracking-wider mb-1">
                          Output Result
                        </span>
                        <pre className="bg-surface-night border border-hairline-violet rounded-md p-3 text-white overflow-x-auto max-h-80 text-[11px] whitespace-pre-wrap">
                          {ev.result}
                        </pre>
                      </div>
                    )}

                    {ev.error && (
                      <div>
                        <span className="text-accent-pink block text-[10px] uppercase font-bold tracking-wider mb-1">
                          Error Details
                        </span>
                        <pre className="bg-surface-night border border-accent-pink/40 rounded-md p-3 text-accent-pink overflow-x-auto text-[11px]">
                          {ev.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
