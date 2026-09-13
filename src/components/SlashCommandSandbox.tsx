import React, { useState } from "react";
import {
  Slash,
  Clock,
  Ban,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  UserCheck,
  Send,
} from "lucide-react";

export const SlashCommandSandbox: React.FC = () => {
  const [activeCommand, setActiveCommand] = useState<"timeout" | "ban" | "warn">("timeout");
  const [targetUsername, setTargetUsername] = useState("TrollUser_99");
  const [reason, setReason] = useState("Violating server rules and spamming raid invites");
  const [duration, setDuration] = useState("10m");
  const [deleteDays, setDeleteDays] = useState(1);
  const [userRoleHierarchy, setUserRoleHierarchy] = useState<"higher" | "equal" | "lower">("lower");
  const [botRoleHierarchy, setBotRoleHierarchy] = useState<"higher" | "lower">("higher");
  const [executionOutput, setExecutionOutput] = useState<{
    success: boolean;
    title: string;
    description: string;
    fields: Array<{ name: string; value: string }>;
    ephemeral: boolean;
    errorReason?: string;
  } | null>(null);

  const handleExecute = () => {
    // 1. Role hierarchy checks
    if (userRoleHierarchy === "higher" || userRoleHierarchy === "equal") {
      setExecutionOutput({
        success: false,
        title: "❌ Permission Hierarchy Denied",
        description: `You cannot moderate **${targetUsername}** because their role is equal to or higher than yours.`,
        fields: [{ name: "Executor Role", value: "Staff" }, { name: "Target Role", value: "Senior / Admin" }],
        ephemeral: true,
        errorReason: "Discord permission hierarchy violation.",
      });
      return;
    }

    if (botRoleHierarchy === "lower") {
      setExecutionOutput({
        success: false,
        title: "❌ Bot Role Lower Than Target",
        description: `The bot cannot moderate **${targetUsername}** because the bot's highest role is lower than the target's role.`,
        fields: [{ name: "Required Action", value: "Move the Bot role above the target's role in Server Settings > Roles" }],
        ephemeral: true,
        errorReason: "Bot hierarchy lower than target member.",
      });
      return;
    }

    // Command specific execution
    if (activeCommand === "timeout") {
      setExecutionOutput({
        success: true,
        title: "✅ Member Timed Out",
        description: `Successfully applied a temporary communication timeout to **${targetUsername}**.`,
        fields: [
          { name: "Target", value: targetUsername },
          { name: "Duration", value: duration },
          { name: "Moderator", value: "You (Admin#0001)" },
          { name: "Reason", value: reason },
          { name: "DM Notice", value: "Dispatched to user safely" },
        ],
        ephemeral: false,
      });
    } else if (activeCommand === "ban") {
      setExecutionOutput({
        success: true,
        title: "🔨 Member Permanently Banned",
        description: `Successfully banned **${targetUsername}** and purged recent message history.`,
        fields: [
          { name: "Target", value: targetUsername },
          { name: "Deleted Messages", value: `${deleteDays} day(s)` },
          { name: "Moderator", value: "You (Admin#0001)" },
          { name: "Reason", value: reason },
        ],
        ephemeral: false,
      });
    } else {
      // warn
      setExecutionOutput({
        success: true,
        title: "⚠️ Disciplinary Warning Logged",
        description: `Logged an in-memory strike against **${targetUsername}** and sent a formal warning DM.`,
        fields: [
          { name: "Target", value: targetUsername },
          { name: "Strike Increment", value: "+1 (In-Memory StrikeStore)" },
          { name: "Reason", value: reason },
          { name: "Threshold Action", value: "Active (Auto-timeout at 3 strikes)" },
        ],
        ephemeral: false,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">
            Native Discord Slash Commands Interactive Simulator
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Test the permission checks, role hierarchy validation, and embed dispatch routines built into the bot commands.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            PermissionFlagsBits.ModerateMembers
          </span>
          <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            PermissionFlagsBits.BanMembers
          </span>
        </div>
      </div>

      {/* Command Selector Tabs */}
      <div className="flex space-x-2">
        {[
          { id: "timeout", label: "/timeout", desc: "Mute member with duration choices", icon: Clock },
          { id: "ban", label: "/ban", desc: "Permanently ban member & purge history", icon: Ban },
          { id: "warn", label: "/warn", desc: "Log strike and trigger auto-escalation", icon: AlertTriangle },
        ].map((cmd) => {
          const Icon = cmd.icon;
          const isSelected = activeCommand === cmd.id;
          return (
            <button
              key={cmd.id}
              onClick={() => {
                setActiveCommand(cmd.id as any);
                setExecutionOutput(null);
              }}
              className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-zinc-500"}`} />
                <span className={`text-xs font-bold font-mono ${isSelected ? "text-indigo-950" : "text-zinc-900"}`}>
                  {cmd.label}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 truncate">
                {cmd.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Simulator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Command Parameters & Permissions Config
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Target User
              </label>
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {activeCommand === "timeout" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Duration (Discord Choice)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="60s">60 Seconds</option>
                  <option value="5m">5 Minutes</option>
                  <option value="10m">10 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="1d">1 Day</option>
                  <option value="7d">1 Week</option>
                </select>
              </div>
            )}

            {activeCommand === "ban" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Purge History (Days)
                </label>
                <select
                  value={deleteDays}
                  onChange={(e) => setDeleteDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value={0}>Don't delete any</option>
                  <option value={1}>Past 24 Hours</option>
                  <option value={3}>Past 3 Days</option>
                  <option value={7}>Past 7 Days</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Moderation Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Simulated Hierarchy Condition */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
            <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
              Discord Role Hierarchy Simulator
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-600 mb-1">Your Role vs Target:</label>
                <select
                  value={userRoleHierarchy}
                  onChange={(e) => setUserRoleHierarchy(e.target.value as any)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-zinc-200 rounded-md"
                >
                  <option value="lower">You are HIGHER than target (Valid)</option>
                  <option value="equal">You are EQUAL to target (Blocked)</option>
                  <option value="higher">You are LOWER than target (Blocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">Bot Role Position:</label>
                <select
                  value={botRoleHierarchy}
                  onChange={(e) => setBotRoleHierarchy(e.target.value as any)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-zinc-200 rounded-md"
                >
                  <option value="higher">Bot role is HIGHER (member.moderatable = true)</option>
                  <option value="lower">Bot role is LOWER (member.moderatable = false)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleExecute}
            className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center space-x-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Execute /{activeCommand} Command</span>
          </button>
        </div>

        {/* Discord Interaction Preview Pane */}
        <div className="lg:col-span-5 bg-zinc-900 text-zinc-200 p-4 rounded-xl border border-zinc-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-mono font-bold text-zinc-300">Discord Interaction Response Preview</span>
            <span className="text-[10px] text-zinc-500 font-mono">ephemeral: {executionOutput?.ephemeral ? "true" : "false"}</span>
          </div>

          {!executionOutput ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">
              Click "Execute /{activeCommand}" to view the simulated Discord reply embed and permission validations.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Interaction User Tag */}
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[10px]">
                  B
                </div>
                <span className="font-bold text-zinc-200 font-mono">Discord Sentinel</span>
                <span className="text-[9px] bg-indigo-700 text-white px-1 rounded uppercase font-bold">BOT</span>
                <span className="text-[10px] text-zinc-500">Today at {new Date().toLocaleTimeString()}</span>
              </div>

              {/* Embed Box */}
              <div className={`p-3.5 rounded-lg border-l-4 bg-zinc-950/80 border border-zinc-800 ${
                executionOutput.success ? "border-l-emerald-500" : "border-l-rose-500"
              }`}>
                <h4 className={`text-xs font-bold font-mono ${
                  executionOutput.success ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {executionOutput.title}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 font-mono">
                  {executionOutput.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-zinc-800/80">
                  {executionOutput.fields.map((field, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">{field.name}</span>
                      <span className="text-zinc-200 font-mono font-medium">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
