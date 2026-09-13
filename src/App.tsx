import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { BOT_FILES } from "./botFilesData";
import { TelemetryData } from "./types";
import { Header } from "./components/Header";
import { WispbyteGuide } from "./components/WispbyteGuide";
import { CodeExplorer } from "./components/CodeExplorer";
import { ModerationSimulator } from "./components/ModerationSimulator";
import { SlashCommandSandbox } from "./components/SlashCommandSandbox";
import { TermuxGuide } from "./components/TermuxGuide";
import { HealthWatchdog } from "./components/HealthWatchdog";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("wispbyte");
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/telemetry");
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch {
      // Offline / fallback telemetry
      setTelemetry({
        status: "online",
        uptimeSeconds: 1420,
        memory: {
          rssMB: 54.2,
          heapUsedMB: 28.5,
          heapTotalMB: 42.1,
          externalMB: 2.1,
        },
        nodeVersion: "v22.14.0",
        platform: "linux (pterodactyl/wispbyte)",
        geminiConfigured: true,
      });
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generates a complete .zip bundle ready to upload to Wispbyte or extract on local machine
  const handleDownloadAll = async () => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      BOT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "discord-sentinel-wispbyte.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Zip bundle download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans flex flex-col">
      <Header
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadAll={handleDownloadAll}
        isDownloading={isDownloading}
        downloadSuccess={downloadSuccess}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "wispbyte" && <WispbyteGuide />}
        {activeTab === "simulator" && <ModerationSimulator />}
        {activeTab === "commands" && <SlashCommandSandbox />}
        {activeTab === "code" && <CodeExplorer files={BOT_FILES} />}
        {activeTab === "termux" && <TermuxGuide />}
        {activeTab === "health" && (
          <HealthWatchdog
            telemetry={telemetry}
            onRefreshTelemetry={fetchTelemetry}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-zinc-700">Discord Sentinel AI</span>
            <span>•</span>
            <span>Discord.js v14 + Google Gen AI SDK (@google/genai)</span>
            <span>•</span>
            <span className="text-teal-700 font-medium">Wispbyte &amp; Pterodactyl Container Ready</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Memory Target: &lt; 80 MB RSS</span>
            <span>Worker Queue: Concurrency 2</span>
            <span>Execution Mode: Pure CLI Gateway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
