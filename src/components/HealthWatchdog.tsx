import React, { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  RefreshCw,
  Database,
  Shield,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { TelemetryData } from "../types";

interface HealthWatchdogProps {
  telemetry: TelemetryData | null;
  onRefreshTelemetry: () => void;
}

export const HealthWatchdog: React.FC<HealthWatchdogProps> = ({
  telemetry,
  onRefreshTelemetry,
}) => {
  const [secondsUntilNextLog, setSecondsUntilNextLog] = useState(600);
  const [logHistory, setLogHistory] = useState<Array<{
    timestamp: string;
    rssMB: number;
    heapUsedMB: number;
    activeStrikes: number;
    queueProcessed: number;
    status: string;
  }>>([
    {
      timestamp: "10:00:00",
      rssMB: 54.2,
      heapUsedMB: 28.1,
      activeStrikes: 2,
      queueProcessed: 14,
      status: "HEALTHY (GC Normal)",
    },
    {
      timestamp: "10:10:00",
      rssMB: 57.8,
      heapUsedMB: 31.4,
      activeStrikes: 3,
      queueProcessed: 42,
      status: "HEALTHY (Sweepers active)",
    },
    {
      timestamp: "10:20:00",
      rssMB: 61.3,
      heapUsedMB: 33.2,
      activeStrikes: 2,
      queueProcessed: 89,
      status: "HEALTHY (Cache bound: 50 msg)",
    },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextLog((prev) => (prev <= 1 ? 600 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 mt-0.5">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900">
              10-Minute Health &amp; Memory Watchdog (src/utils/statusLogger.ts)
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5 max-w-2xl">
              Continuously profiles memory allocation, monitors strike records, sweeps stale data, and reports health logs to prevent Android OOM terminations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-zinc-500">Next Scheduled Sweep: </span>
            <span className="font-bold text-indigo-600">{formatCountdown(secondsUntilNextLog)}</span>
          </div>
          <button
            onClick={onRefreshTelemetry}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
            title="Poll Current Process Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Termux RSS Memory</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-zinc-900 font-mono">
            {telemetry?.memory.rssMB ?? 58.2} <span className="text-xs font-normal text-zinc-500">MB</span>
          </p>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${Math.min(100, ((telemetry?.memory.rssMB ?? 58.2) / 128) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Enforced cap: 128 MB</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>V8 Heap Allocation</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-zinc-900 font-mono">
            {telemetry?.memory.heapUsedMB ?? 32.4} <span className="text-xs font-normal text-zinc-500">/ {telemetry?.memory.heapTotalMB ?? 45.1} MB</span>
          </p>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (((telemetry?.memory.heapUsedMB ?? 32.4) / (telemetry?.memory.heapTotalMB ?? 45.1)) * 100)
                )}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Automatic TTL pruning active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>In-Memory Strike Store</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-zinc-900 font-mono">
            Map&lt;Guild:User&gt;
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            60-min sliding TTL expiration. No heavy SQLite or Redis overhead.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Worker Queue Concurrency</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-zinc-900 font-mono">
            Max 2 Concurrent
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Limits CPU usage in background to protect battery.
          </p>
        </div>
      </div>

      {/* Log Output Simulation */}
      <div className="bg-zinc-950 text-zinc-200 rounded-xl border border-zinc-800 shadow-xs overflow-hidden font-mono text-xs">
        <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-zinc-200">Terminal Telemetry Stream (Termux stdout)</span>
          </div>
          <span>Refreshes every 10 minutes</span>
        </div>

        <div className="p-4 space-y-3 leading-relaxed">
          <div className="text-zinc-500">
            ================ [ 10-MINUTE SYSTEM STATUS ] ================
          </div>
          <div className="text-zinc-300">
            ⏱️ Uptime: 4h 12m 38s
          </div>
          <div className="text-zinc-300">
            📊 Servers / Users: 12 guilds | 148 cached users
          </div>
          <div className="text-emerald-400 font-bold">
            🧠 Memory (Termux): RSS: {telemetry?.memory.rssMB ?? "58.20"} MB | Heap: {telemetry?.memory.heapUsedMB ?? "32.40"}/{telemetry?.memory.heapTotalMB ?? "45.10"} MB
          </div>
          <div className="text-zinc-300">
            ⚡ Strike Records: 3 active in-memory (60m TTL)
          </div>
          <div className="text-indigo-300">
            🤖 AI Queue Stats: Processed: 124 | In-Flight: 0 | Dropped: 0
          </div>
          <div className="text-zinc-500">
            ============================================================
          </div>
        </div>
      </div>
    </div>
  );
};
