import React, { useState, useEffect } from "react";
import {
  FileCode,
  Search,
  Save,
  Check,
  RefreshCw,
  Shield,
  FileText,
} from "lucide-react";
import {
  fetchFilesTree,
  readProjectFile,
  saveProjectFile,
  searchProjectCode,
} from "../api/client.js";

export const FileExplorer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"explorer" | "search">("explorer");

  // Explorer state
  const [files, setFiles] = useState<string[]>([]);
  const [loadingTree, setLoadingTree] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [savingFile, setSavingFile] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [fileFilter, setFileFilter] = useState<string>("");

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [isRegex, setIsRegex] = useState<boolean>(false);
  const [filePattern, setFilePattern] = useState<string>("");
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<string>("");

  const loadTree = async () => {
    setLoadingTree(true);
    try {
      const data = await fetchFilesTree(".", 4);
      setFiles(data.files || []);
      if (!selectedFile && data.files && data.files.length > 0) {
        // default to package.json or README.md if present
        const preferred = data.files.find((f) => f === "package.json" || f === "README.md") || data.files[0];
        handleSelectFile(preferred);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const handleSelectFile = async (filepath: string) => {
    setSelectedFile(filepath);
    setLoadingFile(true);
    setSaveSuccess(false);
    try {
      const res = await readProjectFile(filepath);
      setFileContent(res.content || "");
    } catch (err: any) {
      setFileContent(`Error loading file: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile || savingFile) return;
    setSavingFile(true);
    try {
      await saveProjectFile(selectedFile, fileContent, true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingFile(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await searchProjectCode(searchQuery, {
        case_sensitive: caseSensitive,
        is_regex: isRegex,
        file_pattern: filePattern || undefined,
      });
      setSearchResults(res.output || "No matches found.");
    } catch (err: any) {
      setSearchResults(`Search error: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.toLowerCase().includes(fileFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Filesystem & Code Search</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Safe Editing
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Browse project hierarchy, inspect code, search patterns with regex, and edit files safely with automatic rollback (.bak) snapshots.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex space-x-2 bg-surface-night p-1 rounded-lg border border-hairline-violet">
          <button
            onClick={() => setActiveSubTab("explorer")}
            className={`btn-cap px-3.5 py-1.5 rounded-md text-xs transition ${
              activeSubTab === "explorer"
                ? "bg-white text-ink-deep font-bold"
                : "text-on-dark-muted hover:text-white"
            }`}
          >
            File Explorer & Editor
          </button>
          <button
            onClick={() => setActiveSubTab("search")}
            className={`btn-cap px-3.5 py-1.5 rounded-md text-xs transition ${
              activeSubTab === "search"
                ? "bg-white text-ink-deep font-bold"
                : "text-on-dark-muted hover:text-white"
            }`}
          >
            Code Search
          </button>
        </div>
      </div>

      {activeSubTab === "explorer" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* File Tree Panel */}
          <div className="lg:col-span-4 bg-surface-night border border-hairline-violet rounded-xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Files ({filteredFiles.length})
              </span>
              <button
                onClick={loadTree}
                title="Refresh tree"
                className="text-on-dark-muted hover:text-white transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTree ? "animate-spin text-accent-lime" : ""}`} />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                placeholder="Filter files..."
                className="w-full bg-ink-deep border border-hairline-violet rounded-md px-3 py-1.5 text-xs text-white placeholder-on-dark-muted focus:outline-none focus:border-accent-lime font-mono"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[580px] space-y-1 font-mono text-xs pr-1">
              {loadingTree ? (
                <div className="py-12 text-center text-on-dark-muted">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-lime" />
                  <span>Scanning filesystem tree...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="py-12 text-center text-on-dark-muted">
                  <span>No matching files found</span>
                </div>
              ) : (
                filteredFiles.map((f) => {
                  const isSelected = selectedFile === f;
                  return (
                    <button
                      key={f}
                      onClick={() => handleSelectFile(f)}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2 transition truncate ${
                        isSelected
                          ? "bg-accent-lime text-ink-deep font-bold"
                          : "text-on-dark-light hover:bg-ink-deep hover:text-white"
                      }`}
                    >
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-ink-deep" : "text-accent-lime"}`} />
                      <span className="truncate">{f}</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-hairline-violet text-[10px] font-mono text-on-dark-muted flex items-center justify-between">
              <span>Tools: <code className="text-white">list_files</code>, <code className="text-white">read_file</code></span>
              <span className="text-accent-lime">Live</span>
            </div>
          </div>

          {/* File Editor Panel */}
          <div className="lg:col-span-8 bg-surface-night border border-hairline-violet rounded-xl flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="bg-ink-deep px-4 py-3 border-b border-hairline-violet flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-accent-lime shrink-0" />
                <span className="text-xs font-mono font-bold text-white truncate">
                  {selectedFile || "Select a file to inspect"}
                </span>
                {saveSuccess && (
                  <span className="bg-accent-lime text-ink-deep text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 shrink-0 animate-fade-in">
                    <Check className="w-3 h-3" />
                    <span>Saved & Backed Up (.bak)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleSaveFile}
                  disabled={savingFile || !selectedFile}
                  className="btn-cap bg-white text-ink-deep hover:bg-slate-100 font-bold px-3 py-1.5 rounded-md text-xs transition flex items-center space-x-1.5 disabled:opacity-50 shadow"
                >
                  <Save className="w-3.5 h-3.5 text-ink-deep" />
                  <span>{savingFile ? "Saving..." : "Save (Auto-Backup)"}</span>
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-4 bg-ink-deep/60">
              {loadingFile ? (
                <div className="py-24 text-center text-on-dark-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent-lime" />
                  <span>Reading file contents...</span>
                </div>
              ) : selectedFile ? (
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  rows={25}
                  className="w-full h-full bg-ink-deep border border-hairline-violet rounded-lg p-4 text-xs font-mono text-white placeholder-on-dark-muted focus:outline-none focus:border-accent-lime leading-relaxed resize-y select-text"
                />
              ) : (
                <div className="py-24 text-center text-on-dark-muted">
                  <FileCode className="w-12 h-12 mx-auto mb-2 opacity-30 text-on-dark-faint" />
                  <p>Select a file from the left column to read or safely edit.</p>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="bg-surface-night px-4 py-2 border-t border-hairline-violet text-[11px] font-mono text-on-dark-muted flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-accent-lime" />
                <span>Safety: Every write creates an instant restore point in .universal-dev-mcp/backups/</span>
              </span>
              <span>Tool: <code className="text-white">edit_file</code></span>
            </div>
          </div>
        </div>
      ) : (
        /* Code Search View */
        <div className="space-y-6">
          <form
            onSubmit={handleSearch}
            className="bg-surface-night border border-hairline-violet rounded-xl p-5 space-y-4"
          >
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-accent-lime absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Regex pattern or keyword to search across active project (e.g. createBackup, API_KEY)"
                  className="w-full bg-ink-deep border border-hairline-violet rounded-md pl-9 pr-4 py-2.5 text-xs text-white font-mono placeholder-on-dark-muted focus:outline-none focus:border-accent-lime"
                />
              </div>

              <input
                type="text"
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                placeholder="Glob filter (e.g. *.ts, src/**)"
                className="w-full md:w-56 bg-ink-deep border border-hairline-violet rounded-md px-3 py-2.5 text-xs text-white font-mono placeholder-on-dark-muted focus:outline-none focus:border-accent-lime"
              />

              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim()}
                className="btn-cap bg-accent-lime text-ink-deep hover:bg-opacity-90 font-bold px-5 py-2.5 rounded-md text-xs transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 whitespace-nowrap"
              >
                {searchLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-ink-deep" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-ink-deep" />
                )}
                <span>{searchLoading ? "Searching..." : "Search Code"}</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-on-dark-muted">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded border-hairline-violet bg-ink-deep text-accent-lime focus:ring-0"
                />
                <span>Case Sensitive</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="rounded border-hairline-violet bg-ink-deep text-accent-lime focus:ring-0"
                />
                <span>Regex Search</span>
              </label>
            </div>
          </form>

          {/* Search Results Display */}
          <div className="bg-surface-night border border-hairline-violet rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-ink-deep px-4 py-2.5 border-b border-hairline-violet flex items-center justify-between">
              <span className="text-xs font-mono text-white font-bold">Search Results</span>
              <span className="text-[11px] font-mono text-on-dark-muted">Tool: <code className="text-white">search_files</code></span>
            </div>
            <div className="p-4 font-mono text-xs overflow-auto max-h-[500px] min-h-[200px]">
              {searchLoading ? (
                <div className="py-12 text-center text-on-dark-muted">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-lime" />
                  <span>Scanning repository code...</span>
                </div>
              ) : searchResults ? (
                <pre className="text-on-dark-light whitespace-pre-wrap leading-relaxed select-text font-mono">
                  {searchResults}
                </pre>
              ) : (
                <div className="py-12 text-center text-on-dark-muted space-y-1">
                  <Search className="w-8 h-8 mx-auto opacity-30 text-on-dark-faint mb-2" />
                  <p>Enter a query above to search across all project files.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
