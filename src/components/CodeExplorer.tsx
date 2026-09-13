import React, { useState } from "react";
import { BotFile } from "../types";
import {
  FileCode,
  Copy,
  Check,
  Download,
  Folder,
  FileText,
  Settings,
  Search,
  Zap,
  Terminal,
} from "lucide-react";

interface CodeExplorerProps {
  files: BotFile[];
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<BotFile>(files[0]);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Files" },
    { id: "config", label: "Configs (.env, package.json)" },
    { id: "source", label: "Entry & Deploy" },
    { id: "util", label: "Moderation Engine & Queue" },
    { id: "event", label: "Event Listeners" },
    { id: "command", label: "Slash Commands" },
  ];

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = async (content: string, path: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = (file: BotFile) => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = selectedFile.content.split("\n");

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search filenames, commands, or utilities..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Sidebar: File List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-zinc-800">Project Directory</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="divide-y divide-zinc-100 max-h-[620px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 transition-colors flex items-start space-x-3 ${
                    isSelected ? "bg-indigo-50/80 text-indigo-950" : "hover:bg-zinc-50/70 text-zinc-700"
                  }`}
                >
                  <div className="mt-0.5">
                    {file.category === "config" ? (
                      <Settings className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-amber-500"}`} />
                    ) : file.category === "command" ? (
                      <Terminal className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-blue-500"}`} />
                    ) : file.category === "util" ? (
                      <Zap className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-emerald-500"}`} />
                    ) : file.category === "doc" ? (
                      <FileText className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-purple-500"}`} />
                    ) : (
                      <FileCode className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-zinc-500"}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-mono font-medium truncate ${isSelected ? "text-indigo-900" : "text-zinc-800"}`}>
                        {file.path}
                      </p>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono ml-2">
                        {file.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {file.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Code Viewer */}
        <div className="lg:col-span-8 bg-zinc-900 rounded-xl border border-zinc-800 shadow-xs overflow-hidden flex flex-col">
          {/* Code Viewer Header */}
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-zinc-300 ml-2 font-semibold">
                {selectedFile.path}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                ({lines.length} lines • {selectedFile.content.length} bytes)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(selectedFile.content, selectedFile.path)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/60 shadow-2xs"
              >
                {copiedPath === selectedFile.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Content</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload(selectedFile)}
                title="Download this file directly"
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="bg-zinc-950/60 px-4 py-2 border-b border-zinc-800/80 text-xs text-zinc-400 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>{selectedFile.description}</span>
          </div>

          {/* Code Scroll Area */}
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto font-mono text-[12px] leading-relaxed p-4 selection:bg-indigo-600/40 selection:text-white scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            <table className="border-collapse w-full">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="hover:bg-zinc-800/40 group">
                    <td className="w-10 text-right pr-4 select-none text-zinc-600 group-hover:text-zinc-400 font-mono text-[11px] align-top">
                      {index + 1}
                    </td>
                    <td className="text-zinc-200 whitespace-pre font-mono">
                      {line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
