import React from "react";
import { Shield, Smartphone, Cpu, Download, Check, Sparkles, Terminal, Server } from "lucide-react";
import { TelemetryData } from "../types";

interface HeaderProps {
  telemetry: TelemetryData | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadAll: () => void;
  isDownloading: boolean;
  downloadSuccess: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  activeTab,
  setActiveTab,
  onDownloadAll,
  isDownloading,
  downloadSuccess,
}) => {
  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Brand & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Discord Sentinel AI</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Discord.js v14
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  Wispbyte 100% Ready
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Termux Ready
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Hybrid AI + Command Moderation Bot • Decoupled Gemini 2.5 Flash Queue • Wispbyte &amp; Mobile Low-RAM Architecture
              </p>
            </div>
          </div>

          {/* Telemetry Indicator & Action */}
          <div className="flex items-center flex-wrap gap-2.5">
            {telemetry && (
              <div className="hidden sm:flex items-center space-x-3 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs">
                <div className="flex items-center space-x-1.5 text-zinc-600">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>RSS: <strong>{telemetry.memory.rssMB} MB</strong></span>
                  <span className="text-zinc-400">/ 128 MB</span>
                </div>
                <div className="h-3 w-px bg-zinc-200" />
                <div className="flex items-center space-x-1.5 text-zinc-600">
                  <Server className="w-3.5 h-3.5 text-teal-600" />
                  <span>Node: <strong>{telemetry.nodeVersion}</strong></span>
                </div>
                <div className="h-3 w-px bg-zinc-200" />
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-zinc-700 font-medium">Gateway Active</span>
                </div>
              </div>
            )}

            <button
              onClick={onDownloadAll}
              disabled={isDownloading}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Files Prepared!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export All Bot Files</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-t border-zinc-100 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: "wispbyte", label: "Wispbyte Cloud Deploy", icon: Server, badge: "Pterodactyl", highlight: true },
            { id: "simulator", label: "Live Moderation Matrix", icon: Sparkles, badge: "Interactive" },
            { id: "commands", label: "Slash Commands Sandbox", icon: Shield },
            { id: "code", label: "File Explorer & Codebase", icon: Terminal, count: "14 Files" },
            { id: "termux", label: "Termux Android Guide", icon: Smartphone },
            { id: "health", label: "10-Min Status Watchdog", icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-zinc-400"}`} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-md">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    tab.highlight 
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                      : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
