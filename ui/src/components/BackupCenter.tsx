import React, { useState, useEffect } from "react";
import { ShieldCheck, RotateCcw, Check } from "lucide-react";
import { BackupItem, fetchBackups, fetchBackupDiff, restoreBackup } from "../api/client.js";

export const BackupCenter: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [diffData, setDiffData] = useState<{
    originalRel: string;
    currentExists: boolean;
    backupContent: string;
    currentContent: string;
  } | null>(null);
  const [diffLoading, setDiffLoading] = useState<boolean>(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const loadBackups = async () => {
    try {
      const data = await fetchBackups();
      setBackups(data);
      if (data.length > 0 && !selectedBackup) {
        handleSelectBackup(data[0]);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleSelectBackup = async (b: BackupItem) => {
    setSelectedBackup(b);
    setDiffLoading(true);
    try {
      const diff = await fetchBackupDiff(b.filename);
      setDiffData(diff);
    } catch {
      setDiffData(null);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleRestore = async (b: BackupItem) => {
    if (!confirm(`Restore "${b.originalRel}" from backup version? A new safety backup will be saved first.`)) {
      return;
    }
    const res = await restoreBackup(b.originalRel, b.filename);
    setRestoreMessage(res.result);
    setTimeout(() => setRestoreMessage(null), 5000);
    await loadBackups();
    if (selectedBackup) {
      handleSelectBackup(selectedBackup);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Backup & Diff Center</h1>
            <span className="bg-accent-violet text-white text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Safe Rollback
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Every file modified or deleted by an AI tool creates an automatic backup in <code className="text-accent-lime">.mcp-backups/</code>.
            Compare diffs and rollback with 1 click.
          </p>
        </div>

        {restoreMessage && (
          <div className="bg-accent-lime/20 border border-accent-lime text-accent-lime text-xs font-mono px-3 py-2 rounded-md flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{restoreMessage}</span>
          </div>
        )}
      </div>

      {backups.length === 0 ? (
        <div className="bg-surface-night border border-hairline-violet rounded-xl p-12 text-center text-on-dark-muted font-mono text-xs">
          <ShieldCheck className="w-8 h-8 text-on-dark-muted mx-auto mb-3 opacity-50" />
          <p>No backups found in .mcp-backups.</p>
          <p className="text-[11px] mt-1 text-on-dark-muted/70">
            Backups are created automatically whenever Claude, Cursor, or edit_file/patch_file alters a file.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-stretch">
          {/* Backups List Sidebar */}
          <div className="xl:col-span-4 bg-surface-night border border-hairline-violet rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline-violet mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-[0.2px]">
                  Timestamped Backups ({backups.length})
                </span>
                <button
                  onClick={loadBackups}
                  className="text-accent-lime hover:underline text-xs font-mono"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                {backups.map((b) => {
                  const isSelected = selectedBackup?.filename === b.filename;
                  const dateStr = new Date(b.modifiedAt).toLocaleString();

                  return (
                    <div
                      key={b.filename}
                      onClick={() => handleSelectBackup(b)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isSelected
                          ? "bg-ink-deep border-accent-lime shadow-[0_0_12px_rgba(194,239,78,0.15)] ring-1 ring-accent-lime/40"
                          : "bg-ink-deep/60 border-hairline-violet hover:border-hairline-cool/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white truncate" title={b.originalRel}>
                          {b.originalRel}
                        </span>
                        <span className="text-[10px] font-mono text-on-dark-faint bg-surface-night px-1.5 py-0.5 rounded border border-hairline-violet">
                          {(b.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 text-[11px] font-mono text-on-dark-muted">
                        <span className="text-[10px]">{dateStr}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(b);
                          }}
                          title="Restore this version"
                          className="btn-cap bg-surface-night hover:bg-white hover:text-ink-deep border border-hairline-violet text-accent-lime px-2.5 py-1 rounded text-[11px] flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-hairline-violet text-[11px] font-mono text-on-dark-faint">
              <span>Automatic rollback snapshots in <code className="text-white">.mcp-backups/</code></span>
            </div>
          </div>

          {/* Diff Viewer Pane */}
          <div className="xl:col-span-8 bg-surface-night border border-hairline-violet rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-hairline-violet pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-on-dark-muted block">
                    Side-by-Side Visual Diff
                  </span>
                  <span className="text-base font-bold text-white font-mono">
                    {selectedBackup ? selectedBackup.originalRel : "Select a backup"}
                  </span>
                </div>

                {selectedBackup && (
                  <button
                    onClick={() => handleRestore(selectedBackup)}
                    className="btn-cap bg-accent-lime text-ink-deep hover:bg-white font-bold px-4 py-2 rounded-md text-xs flex items-center space-x-1.5 shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Version</span>
                  </button>
                )}
              </div>

              {diffLoading ? (
                <div className="p-16 text-center text-xs font-mono text-on-dark-muted">
                  Loading diff...
                </div>
              ) : diffData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs overflow-y-auto max-h-[620px] min-h-[420px]">
                  {/* Backup Version */}
                  <div className="bg-ink-deep border border-hairline-violet rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-hairline-violet mb-2">
                      <span className="text-xs font-bold text-accent-pink flex items-center space-x-1">
                        <span>● Backup Version</span>
                      </span>
                      <span className="text-[10px] text-on-dark-muted">
                        {new Date(selectedBackup?.modifiedAt || 0).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-white text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1 select-text">
                      {diffData.backupContent || "(empty file)"}
                    </pre>
                  </div>

                  {/* Current Working Version */}
                  <div className="bg-ink-deep border border-hairline-violet rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-hairline-violet mb-2">
                      <span className="text-xs font-bold text-accent-lime flex items-center space-x-1">
                        <span>● Live Working File</span>
                      </span>
                      <span className="text-[10px] text-on-dark-muted">
                        {diffData.currentExists ? "On Disk" : "Deleted"}
                      </span>
                    </div>
                    <pre className="text-white text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1 select-text">
                      {diffData.currentContent || (diffData.currentExists ? "(empty file)" : "[File does not exist on disk]")}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-xs font-mono text-on-dark-muted">
                  Select a backup from the left to inspect content and differences.
                </div>
              )}
            </div>

            <div className="pt-3 mt-4 border-t border-hairline-violet flex items-center justify-between text-xs font-mono text-on-dark-muted">
              <span>Tool: <code className="text-white">restore_backup</code></span>
              <span className="text-accent-lime">1-Click atomic restore</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
