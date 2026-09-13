import React, { useState } from "react";
import {
  Server,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  FileCode,
  Shield,
  Layers,
  Cpu,
  RefreshCw,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import JSZip from "jszip";
import { BOT_FILES } from "../botFilesData";

export const WispbyteGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // Environment variable generator state
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2200);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all bot files to zip
      BOT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // If user supplied tokens in the form, create a populated .env
      const customEnv = `# Generated for Wispbyte Pterodactyl Container
DISCORD_TOKEN=${token || "your_discord_bot_token_here"}
CLIENT_ID=${clientId || "your_discord_client_application_id"}
GUILD_ID=${guildId || ""}
GEMINI_API_KEY=${geminiKey || "your_google_gemini_api_key"}
AI_MODERATION_ENABLED=true
AI_QUEUE_CONCURRENCY=2
MAX_STRIKES_BEFORE_TIMEOUT=3
STRIKE_TTL_MINUTES=60
NODE_ENV=production
`;
      zip.file(".env", customEnv);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "discord-sentinel-wispbyte.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to generate zip:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const compatibilityBadges = [
    {
      title: "Pure CLI Daemon (No Web Ports)",
      status: "100% Compatible",
      desc: "Zero HTTP/Express listeners. Wispbyte natively hosts long-running Discord WebSocket gateway bots without needing open public ports.",
    },
    {
      title: "Direct Entry Point (dist/index.js)",
      status: "100% Compatible",
      desc: "Configured package.json start script ('node dist/index.js') matches Pterodactyl container boot command seamlessly.",
    },
    {
      title: "Low-Memory RAM Optimization (<80MB)",
      status: "100% Compatible",
      desc: "Aggressive Discord.js cache sweepers (0 presence cache, 50 messages/channel) keep RAM well below free tier limits.",
    },
    {
      title: "Container Restart Defense",
      status: "100% Compatible",
      desc: "If Wispbyte reboots the container, the in-memory strikeStore re-initializes defensively to prevent null reference errors on incoming chat.",
    },
    {
      title: "Google Gen AI (@google/genai)",
      status: "100% Compatible",
      desc: "Gemini 2.5 Flash toxicity checks run in an async worker queue (concurrency: 2), preventing CPU throttling in shared environments.",
    },
    {
      title: "Pterodactyl Signal Lifecycle",
      status: "100% Compatible",
      desc: "Listens for SIGTERM and SIGINT to cleanly destroy Discord gateway connections when you stop or restart the server in the panel.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Compatibility Certification */}
      <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                Verified 100% Compatible
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-white">
                Wispbyte • Pterodactyl Node.js Egg
              </span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              Wispbyte Cloud Hosting Station
            </h2>
            <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
              This bot has been stripped of unnecessary HTTP port bindings, hardened against container restarts, and tuned for Node.js 18, 20, and 22 LTS containers running on Pterodactyl panels.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white text-sm font-semibold shadow-sm transition-all"
            >
              {zipSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Zip Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Wispbyte .zip Archive</span>
                </>
              )}
            </button>
            <a
              href="https://github.com/sennexed/UOI-bot-ai-moderation-13-sept"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-sm font-semibold shadow-2xs transition-colors"
            >
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span>View GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          </div>
        </div>
      </div>

      {/* 6-Point Compatibility Matrix */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Wispbyte Compatibility Checklist</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compatibilityBadges.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-200 bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h4 className="text-sm font-bold text-zinc-900">{item.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Status</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Wispbyte Deployment Guide */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <span>How to Deploy to Wispbyte (Pterodactyl Panel)</span>
          </h3>
          <p className="text-xs text-zinc-500">
            Follow these 5 simple steps in your Wispbyte server dashboard.
          </p>
        </div>

        <div className="space-y-6">
          {/* Method A: Git Sync via GitHub Repo */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Recommended Deployment: GitHub Repository
              </span>
              <span className="text-xs text-indigo-700 font-mono">
                sennexed/UOI-bot-ai-moderation-13-sept
              </span>
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed">
              If your Wispbyte server supports Git Auto-Deploy or terminal access, you can clone and build the bot in seconds:
            </p>
            <div className="relative rounded-lg bg-zinc-950 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
              <code>
                git clone https://github.com/sennexed/UOI-bot-ai-moderation-13-sept.git .<br />
                npm install<br />
                npm run build<br />
                npm run deploy-commands<br />
                npm start
              </code>
              <button
                onClick={() =>
                  handleCopy(
                    "git clone https://github.com/sennexed/UOI-bot-ai-moderation-13-sept.git .\nnpm install\nnpm run build\nnpm run deploy-commands\nnpm start",
                    "git-clone"
                  )
                }
                className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                title="Copy shell commands"
              >
                {copiedIndex === "git-clone" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Step 1: Panel Egg Selection */}
          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-zinc-900">
                Ensure Node.js 20 or 22 Egg is Selected
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                In your Wispbyte server settings (or when creating the server), choose the <strong>Node.js 20 (LTS)</strong> or <strong>Node.js 22</strong> container image. Discord.js v14 requires Node.js 18+.
              </p>
            </div>
          </div>

          {/* Step 2: Upload Files */}
          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-zinc-900">
                Upload Bot Files to the File Manager
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Either push updates to your GitHub repo and pull them, or click <strong>&quot;Download Wispbyte .zip Archive&quot;</strong> above, upload the zip into Wispbyte&apos;s File Manager, and click <strong>Unarchive</strong>.
              </p>
            </div>
          </div>

          {/* Step 3: Configure Environment Variables */}
          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-bold text-zinc-900">
                Set Environment Variables (.env or Startup Tab)
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                In the Wispbyte <strong>File Manager</strong>, create a file named <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">.env</code> (or set them under the <strong>Startup</strong> tab). Use the helper configurator below to generate your configuration!
              </p>
            </div>
          </div>

          {/* Step 4: Register Slash Commands */}
          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              4
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-zinc-900">
                Register Slash Commands with Discord Gateway
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                In the Wispbyte Console or Terminal, run the deploy command once to register <code className="text-indigo-600">/warn</code>, <code className="text-indigo-600">/timeout</code>, and <code className="text-indigo-600">/ban</code>:
              </p>
              <div className="relative rounded-lg bg-zinc-950 p-2.5 font-mono text-xs text-emerald-400 flex items-center justify-between">
                <code>npm run deploy-commands</code>
                <button
                  onClick={() => handleCopy("npm run deploy-commands", "cmd-deploy")}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 ml-2"
                >
                  {copiedIndex === "cmd-deploy" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 5: Start Server */}
          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              5
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-zinc-900">
                Click &quot;Start&quot; in the Wispbyte Console
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Click the <strong>Start</strong> button in your Pterodactyl console. The container executes <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">node dist/index.js</code> and logs your bot online with 0 port errors!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Wispbyte .env Configurator */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <span>Interactive Wispbyte .env Generator</span>
          </h3>
          <p className="text-xs text-zinc-500">
            Fill in your tokens to generate a clean, container-safe configuration block.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">
              DISCORD_TOKEN <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="MTE5MjM4..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50"
            />
            <span className="text-[11px] text-zinc-500">
              From Discord Developer Portal &gt; Bot &gt; Reset Token
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">
              GEMINI_API_KEY <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50"
            />
            <span className="text-[11px] text-zinc-500">
              From Google AI Studio (powers Layer 2 toxicity analysis)
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">
              CLIENT_ID (Application ID) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="123456789012345678"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50"
            />
            <span className="text-[11px] text-zinc-500">
              Required for registering slash commands
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">
              GUILD_ID <span className="text-zinc-400">(Optional for instant test server sync)</span>
            </label>
            <input
              type="text"
              placeholder="Leave blank for global sync"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50"
            />
            <span className="text-[11px] text-zinc-500">
              Server ID where slash commands update immediately
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Output for Wispbyte File Manager (.env)
            </span>
            <button
              onClick={() =>
                handleCopy(
                  `DISCORD_TOKEN=${token || "your_discord_bot_token_here"}\nCLIENT_ID=${clientId || "your_client_id_here"}\nGUILD_ID=${guildId || ""}\nGEMINI_API_KEY=${geminiKey || "your_gemini_api_key_here"}\nAI_MODERATION_ENABLED=true\nAI_QUEUE_CONCURRENCY=2\nMAX_STRIKES_BEFORE_TIMEOUT=3\nSTRIKE_TTL_MINUTES=60\nNODE_ENV=production`,
                  "copy-env"
                )
              }
              className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              {copiedIndex === "copy-env" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Configuration</span>
                </>
              )}
            </button>
          </div>

          <pre className="rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed border border-zinc-800">
            {`# ==============================================================================
# WISPBYTE PTERODACTYL CONTAINER CONFIGURATION
# ==============================================================================
DISCORD_TOKEN=${token || "your_discord_bot_token_here"}
CLIENT_ID=${clientId || "your_client_id_here"}
GUILD_ID=${guildId || ""}
GEMINI_API_KEY=${geminiKey || "your_gemini_api_key_here"}

# Performance & Queue Tuning for Free Tier Containers
AI_MODERATION_ENABLED=true
AI_QUEUE_CONCURRENCY=2
MAX_STRIKES_BEFORE_TIMEOUT=3
STRIKE_TTL_MINUTES=60
NODE_ENV=production`}
          </pre>
        </div>
      </div>

      {/* Simulated Wispbyte Console Log */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 sm:p-8 text-zinc-300 space-y-4 shadow-md font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-400 font-semibold ml-2">
              Wispbyte Pterodactyl Console Output (Simulated)
            </span>
          </div>
          <span className="text-emerald-400 text-[11px] font-semibold">● Process Running</span>
        </div>

        <div className="space-y-1.5 leading-relaxed text-zinc-300">
          <p className="text-zinc-500">container@pterodactyl~ node dist/index.js</p>
          <p className="text-indigo-400">=======================================================</p>
          <p className="text-emerald-400 font-bold">🤖 Discord Sentinel AI Bot is ONLINE!</p>
          <p>🏷️ Logged in as:      SentinelBot#1337 (ID: 12048590123)</p>
          <p>🌐 Serving Guilds:    3</p>
          <p className="text-amber-400">🚀 Runtime Target:    Wispbyte (Pterodactyl Node.js Container)</p>
          <p className="text-cyan-400">🧠 AI Engine:         Google Gen AI SDK (@google/genai)</p>
          <p className="text-teal-400">⚡ Execution Mode:    Pure Background CLI Gateway (No Web Ports)</p>
          <p className="text-indigo-400">=======================================================</p>
          <p className="text-zinc-400">📊 [Health Monitor] RSS: 54.2 MB | Heap: 28.5/42.1 MB | Queue Concurrency: 2</p>
        </div>
      </div>
    </div>
  );
};
