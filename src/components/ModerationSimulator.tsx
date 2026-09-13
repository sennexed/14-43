import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CornerDownRight,
  Send,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { ModerationTestResult, SimulatedStrike } from "../types";

export const ModerationSimulator: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [authorTag, setAuthorTag] = useState("CoolGamer#4040");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<ModerationTestResult | null>(null);
  const [chatLog, setChatLog] = useState<Array<{
    id: string;
    author: string;
    text: string;
    result: ModerationTestResult;
    timestamp: string;
  }>>([]);
  const [strikes, setStrikes] = useState<Record<string, SimulatedStrike>>({
    "CoolGamer#4040": {
      userId: "3892019481029",
      userTag: "CoolGamer#4040",
      count: 0,
      lastStrikeTime: "Never",
      reasons: [],
      timedOut: false,
    },
  });

  const samplePresets = [
    {
      title: "Nitro Phishing Link",
      tag: "Layer 1 Instant (<0.2ms)",
      color: "border-rose-300 bg-rose-50 text-rose-800",
      text: "Claim 3 months of free Discord Nitro right now! https://discordapp.gifts/promo-drop-9281",
    },
    {
      title: "Severe Hate Slur / KYS",
      tag: "Layer 1 Instant",
      color: "border-rose-300 bg-rose-50 text-rose-800",
      text: "You are the worst player alive kys go die right now",
    },
    {
      title: "Discord Invite Spam",
      tag: "Layer 1 Invite Filter",
      color: "border-amber-300 bg-amber-50 text-amber-800",
      text: "Join my new anime gaming community here: discord.gg/super-awesome-hangout",
    },
    {
      title: "Targeted Harassment",
      tag: "Layer 2 Gemini Contextual",
      color: "border-purple-300 bg-purple-50 text-purple-800",
      text: "Nobody here likes you and we are going to find your real address and post it publicly unless you delete your account.",
    },
    {
      title: "Crypto / Ponzi Fraud",
      tag: "Layer 2 Gemini Contextual",
      color: "border-purple-300 bg-purple-50 text-purple-800",
      text: "Guaranteed 500% returns in 2 hours! Send 0.1 ETH to our smart contract vault today only.",
    },
    {
      title: "Friendly Gamer Banter",
      tag: "Gemini Safe Filter",
      color: "border-emerald-300 bg-emerald-50 text-emerald-800",
      text: "Bro this boss was literally killing me for 2 hours straight lmao, gg ez though we finally beat it!",
    },
    {
      title: "Standard Programming Chat",
      tag: "Clean Normal",
      color: "border-blue-300 bg-blue-50 text-blue-800",
      text: "Hey everyone, how do I configure NodeNext resolution with tsx in Termux?",
    },
  ];

  const handleTest = async (textToTest?: string) => {
    const content = textToTest || inputText;
    if (!content.trim()) return;

    setLoading(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, authorTag }),
      });

      const data: ModerationTestResult = await res.json();
      setTestResult(data);

      // Append to chat log
      setChatLog((prev) => [
        {
          id: Math.random().toString(),
          author: authorTag,
          text: content,
          result: data,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);

      // If violating, increment simulated strike
      if (data.isViolating) {
        setStrikes((prev) => {
          const existing = prev[authorTag] || {
            userId: "3892019481029",
            userTag: authorTag,
            count: 0,
            lastStrikeTime: "Never",
            reasons: [],
            timedOut: false,
          };

          const newCount = existing.count + 1;
          const isTimedOut = newCount >= 3;

          return {
            ...prev,
            [authorTag]: {
              ...existing,
              count: newCount,
              lastStrikeTime: new Date().toLocaleTimeString(),
              reasons: [...existing.reasons, data.reason],
              timedOut: isTimedOut,
            },
          };
        });
      }
    } catch (err) {
      console.error("Test failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentStrikeRecord = strikes[authorTag] || {
    userId: "3892019481029",
    userTag: authorTag,
    count: 0,
    lastStrikeTime: "None",
    reasons: [],
    timedOut: false,
  };

  const resetStrikes = () => {
    setStrikes({
      [authorTag]: {
        userId: "3892019481029",
        userTag: authorTag,
        count: 0,
        lastStrikeTime: "None",
        reasons: [],
        timedOut: false,
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Explanation Banner */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">
                Hybrid Dual-Layer Moderation Engine (Live Testing Matrix)
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5 max-w-3xl">
                Test how the Discord bot coordinates Layer 1 (instant zero-latency local RegExp filtering) and Layer 2 (asynchronous background Gemini 2.5 Flash contextual evaluation) without ever blocking the Gateway event loop.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg">
            <div className="text-xs">
              <span className="text-zinc-500">Target Member: </span>
              <span className="font-semibold text-zinc-900 font-mono">{authorTag}</span>
            </div>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-zinc-500">Strikes:</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                currentStrikeRecord.count >= 3
                  ? "bg-rose-100 text-rose-700"
                  : currentStrikeRecord.count > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                {currentStrikeRecord.count} / 3
              </span>
              {currentStrikeRecord.timedOut && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-600 text-white uppercase">
                  TIMED OUT
                </span>
              )}
            </div>
            <button
              onClick={resetStrikes}
              title="Reset Strikes for Member"
              className="p-1 hover:bg-zinc-200 rounded text-zinc-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
          Quick Preset Scenarios
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(preset.text);
                handleTest(preset.text);
              }}
              className="text-left p-2.5 rounded-lg border border-zinc-200 bg-white hover:border-indigo-400 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-900 group-hover:text-indigo-600">
                  {preset.title}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-mono ${preset.color}`}>
                  {preset.tag}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">
                "{preset.text}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box & Action */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        <label className="block text-xs font-semibold text-zinc-800">
          Simulate Incoming Discord Message
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
            placeholder="Type any message (gamer banter, link, insult, scam, or harmless question)..."
            className="flex-1 px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
          />
          <button
            onClick={() => handleTest()}
            disabled={loading || !inputText.trim()}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send to Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Pipeline Execution Breakdown */}
      {testResult && (
        <div className={`p-5 rounded-xl border transition-all ${
          testResult.isViolating
            ? "bg-rose-50/70 border-rose-200 text-rose-950"
            : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-zinc-200/60">
            <div className="flex items-center space-x-3">
              {testResult.isViolating ? (
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <XCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold">
                    {testResult.isViolating ? "Message Blocked / Policy Violation" : "Message Passed Cleanly"}
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono ${
                    testResult.executedLayer === 1
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                  }`}>
                    {testResult.layerName}
                  </span>
                </div>
                <p className="text-xs opacity-80 mt-0.5">
                  {testResult.explanation}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="bg-white/80 px-2.5 py-1.5 rounded-md border border-zinc-200/80">
                <span className="text-zinc-500">Latency: </span>
                <span className="font-bold">{testResult.latencyMs}ms</span>
              </div>
              <div className="bg-white/80 px-2.5 py-1.5 rounded-md border border-zinc-200/80">
                <span className="text-zinc-500">Tokens: </span>
                <span className="font-bold">{testResult.tokensUsed}</span>
              </div>
            </div>
          </div>

          {/* Detailed Decision Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/90 p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Violation Category</span>
              <p className="text-xs font-bold text-zinc-900 font-mono mt-0.5">{testResult.category}</p>
            </div>

            <div className="bg-white/90 p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Severity Rating</span>
              <p className={`text-xs font-bold font-mono mt-0.5 ${
                testResult.severity === "CRITICAL" ? "text-rose-600" : testResult.severity === "HIGH" ? "text-orange-600" : "text-zinc-700"
              }`}>
                {testResult.severity}
              </p>
            </div>

            <div className="bg-white/90 p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Confidence Score</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="w-16 h-2 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className={`h-full ${testResult.confidenceScore > 0.7 ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${testResult.confidenceScore * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-zinc-900">
                  {(testResult.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Enforced Action</span>
              <p className="text-xs font-bold text-indigo-700 font-mono mt-0.5">
                {testResult.isViolating ? (
                  testResult.suggestedAction === "TIMEOUT" || currentStrikeRecord.count >= 3
                    ? "DELETE + DM + TIMEOUT"
                    : "DELETE + DM + STRIKE"
                ) : (
                  "ALLOWED IN CHANNEL"
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Live Discord Channel Stream */}
      <div className="bg-zinc-900 text-zinc-200 rounded-xl border border-zinc-800 shadow-xs overflow-hidden">
        <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-zinc-400 font-bold">#</span>
            <span className="text-xs font-semibold text-zinc-100">general-chat (Simulated Discord Stream)</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {chatLog.length} recent messages
          </span>
        </div>

        <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
          {chatLog.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs font-mono">
              No simulated messages yet. Choose a scenario preset above or type a message to watch the bot respond!
            </div>
          ) : (
            chatLog.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all ${
                  item.result.isViolating
                    ? "bg-rose-950/40 border-rose-900/60 text-zinc-200"
                    : "bg-zinc-800/40 border-zinc-800 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-indigo-400 font-mono">{item.author}</span>
                    <span className="text-[10px] text-zinc-500">{item.timestamp}</span>
                  </div>
                  {item.result.isViolating ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-900/60 text-rose-300 font-mono border border-rose-800">
                      DELETED • STRIKE RECORDED
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-900/40 text-emerald-300 font-mono">
                      DELIVERED
                    </span>
                  )}
                </div>

                <p className={`text-xs mt-1 font-mono ${item.result.isViolating ? "line-through text-rose-300/80" : "text-zinc-200"}`}>
                  {item.text}
                </p>

                {item.result.isViolating && (
                  <div className="mt-2 text-[11px] text-rose-300 flex items-center space-x-1.5 bg-rose-950/80 px-2 py-1 rounded border border-rose-800/50">
                    <CornerDownRight className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>
                      <strong>Bot Guard ({item.result.layerName}):</strong> {item.result.reason}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
