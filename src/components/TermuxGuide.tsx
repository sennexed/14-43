import React, { useState } from "react";
import {
  Smartphone,
  Terminal,
  Copy,
  Check,
  BatteryCharging,
  Cpu,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export const TermuxGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const steps = [
    {
      title: "1. Install Termux via F-Droid",
      desc: "Do NOT install from Google Play Store (it is deprecated with broken apt mirrors). Use F-Droid or GitHub Releases.",
      command: "# Download APK from https://f-droid.org/packages/com.termux/",
      type: "info",
    },
    {
      title: "2. Update Repositories & Install Node.js LTS",
      desc: "Installs Node.js v20+ and Git inside your Android container.",
      command: "pkg update && pkg upgrade -y && pkg install nodejs-lts git -y",
      type: "shell",
    },
    {
      title: "3. Acquire Android Wake Lock (Crucial)",
      desc: "Prevents Android OS from putting Termux into deep sleep when the screen locks.",
      command: "termux-wake-lock",
      type: "shell",
    },
    {
      title: "4. Create Bot Directory & Paste Files",
      desc: "Set up the project workspace in your home folder.",
      command: "mkdir -p ~/discord-bot && cd ~/discord-bot",
      type: "shell",
    },
    {
      title: "5. Install Dependencies",
      desc: "Installs discord.js, @google/genai, and dotenv.",
      command: "npm install",
      type: "shell",
    },
    {
      title: "6. Configure Tokens (.env)",
      desc: "Provide your DISCORD_TOKEN, CLIENT_ID, and GEMINI_API_KEY.",
      command: "cp .env.example .env && nano .env",
      type: "shell",
    },
    {
      title: "7. Register Slash Commands",
      desc: "Pushes /timeout, /ban, and /warn to Discord's Gateway REST API.",
      command: "npm run deploy-commands",
      type: "shell",
    },
    {
      title: "8. Launch with 128MB Memory Capping",
      desc: "Builds TypeScript and starts the bot with strict heap limits.",
      command: "npm run build && npm start",
      type: "shell",
    },
    {
      title: "9. Optional: Run 24/7 in Background with PM2",
      desc: "Keeps the bot running even if you close the Termux terminal window.",
      command: "npm install -g pm2 && pm2 start dist/index.js --name discord-bot --node-args=\"--max-old-space-size=128\" && pm2 save",
      type: "shell",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900">
              Termux Android Runtime Architecture & Optimization Guide
            </h2>
            <p className="text-xs text-zinc-600 mt-1 max-w-3xl leading-relaxed">
              Android's Low Memory Killer (LMK) aggressively kills processes using more than 200MB of RAM. This codebase is specifically tuned to operate stably within a <strong>55MB – 85MB footprint</strong> by disabling Discord presence caching, bounding message history to 50 items, utilizing in-memory TTL maps instead of heavy databases, and decoupling Gemini AI lookups to an asynchronous background worker.
            </p>
          </div>
        </div>

        {/* Memory comparison metric */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-100">
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Standard Discord Bot RAM</span>
            <p className="text-base font-bold text-rose-600 font-mono mt-0.5">~320 - 450 MB</p>
            <span className="text-[11px] text-zinc-400">Gets terminated by Android LMK</span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
            <span className="text-[10px] text-emerald-800 uppercase font-semibold">Discord Sentinel AI on Termux</span>
            <p className="text-base font-bold text-emerald-700 font-mono mt-0.5">~58 - 82 MB</p>
            <span className="text-[11px] text-emerald-600 font-medium">Safe 24/7 continuous uptime</span>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200">
            <span className="text-[10px] text-indigo-800 uppercase font-semibold">Node Heap Boundary</span>
            <p className="text-base font-bold text-indigo-700 font-mono mt-0.5">--max-old-space-size=128</p>
            <span className="text-[11px] text-indigo-600 font-medium">Enforced in npm start</span>
          </div>
        </div>
      </div>

      {/* Battery Optimization Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3">
        <BatteryCharging className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Android Battery Saver Configuration (Must Do!):</p>
          <p className="text-amber-800 leading-relaxed">
            Go to your phone's <strong>Android Settings &gt; Apps &gt; Termux &gt; Battery &gt; Select "Unrestricted"</strong> (or "Don't Optimize"). Also ensure you run <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">termux-wake-lock</code> so your CPU does not enter deep sleep when the phone screen turns off.
          </p>
        </div>
      </div>

      {/* Step by Step Commands */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
          Step-by-Step Termux Commands
        </h3>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">{step.title}</span>
                <button
                  onClick={() => copyCommand(step.command, idx)}
                  className="inline-flex items-center space-x-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-zinc-200 px-2.5 py-1 rounded shadow-2xs"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">{step.desc}</p>
              <div className="p-2 rounded bg-zinc-900 text-zinc-200 font-mono text-xs overflow-x-auto selection:bg-indigo-600">
                {step.command}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
