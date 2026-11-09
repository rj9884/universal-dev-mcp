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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backups List Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-on-dark-muted uppercase tracking-[0.2px] mb-2 flex items-center justify-between">
              <span>Timestamped Backups ({backups.length})</span>
              <button
                onClick={loadBackups}
                className="text-accent-lime hover:underline text-[10px]"
              >
                Refresh
              </button>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {backups.map((b) => {
                const isSelected = selectedBackup?.filename === b.filename;
                const dateStr = new Date(b.modifiedAt).toLocaleString();

                return (
                  <div
                    key={b.filename}
                    onClick={() => handleSelectBackup(b)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? "bg-surface-night border-accent-lime"
                        : "bg-surface-night/50 border-hairline-violet hover:border-hairline-cool/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white truncate" title={b.originalRel}>
                        {b.originalRel}
                      </span>
                      <span className="text-[10px] font-mono text-on-dark-muted">
                        {(b.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-on-dark-muted">
                      <span>{dateStr}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(b);
                        }}
                        title="Restore this version"
                        className="btn-cap bg-ink-deep hover:bg-white hover:text-ink-deep border border-hairline-violet text-accent-lime px-2 py-0.5 rounded text-[10px] flex items-center space-x-1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diff Viewer Pane */}
          <div className="lg:col-span-2 bg-surface-night border border-hairline-violet rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-hairline-violet pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-on-dark-muted block">
                  Diff Comparison
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {selectedBackup ? selectedBackup.originalRel : "Select a backup"}
                </span>
              </div>

              {selectedBackup && (
                <button
                  onClick={() => handleRestore(selectedBackup)}
                  className="btn-cap bg-accent-lime text-ink-deep hover:bg-white font-bold px-3 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-glow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Version</span>
                </button>
              )}
            </div>

            {diffLoading ? (
              <div className="p-12 text-center text-xs font-mono text-on-dark-muted">
                Loading diff...
              </div>
            ) : diffData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs overflow-y-auto max-h-[550px]">
                {/* Backup Version */}
                <div className="bg-ink-deep border border-hairline-violet rounded-lg p-3">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline-violet mb-2">
                    <span className="text-[11px] font-bold text-accent-violet">
                      Backup File Content
                    </span>
                    <span className="text-[10px] text-on-dark-muted">
                      {new Date(selectedBackup?.modifiedAt || 0).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-white text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {diffData.backupContent || "(empty file)"}
                  </pre>
                </div>

                {/* Current Working Version */}
                <div className="bg-ink-deep border border-hairline-violet rounded-lg p-3">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline-violet mb-2">
                    <span className="text-[11px] font-bold text-accent-lime">
                      Current Live Version
                    </span>
                    <span className="text-[10px] text-on-dark-muted">
                      {diffData.currentExists ? "On Disk" : "Deleted"}
                    </span>
                  </div>
                  <pre className="text-white text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {diffData.currentContent || (diffData.currentExists ? "(empty file)" : "[File does not exist on disk]")}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs font-mono text-on-dark-muted">
                Select a backup from the left to inspect content and differences.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
