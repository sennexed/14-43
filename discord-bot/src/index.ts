import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Options,
  ChatInputCommandInteraction,
} from "discord.js";
import dotenv from "dotenv";

// Load environment variables early
dotenv.config();

// Handlers & Utilities
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";
import { startStatusLogger } from "./utils/statusLogger.js";
import { strikeStore } from "./utils/strikeStore.js";

// Commands
import * as timeoutCommand from "./commands/timeout.js";
import * as banCommand from "./commands/ban.js";
import * as warnCommand from "./commands/warn.js";

interface CommandModule {
  data: { name: string };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// ==============================================================================
// 1. MOBILE & TERMUX OPTIMIZED CLIENT INITIALIZATION
// ==============================================================================
// We configure aggressive cache limits and sweeper intervals to keep memory
// usage below 100MB on Android devices without starving CPU cycles.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
  makeCache: Options.cacheWithLimits({
    // Aggressively cap in-memory Discord.js structures for Termux
    MessageManager: 50, // Keep only 50 messages per channel in RAM
    PresenceManager: 0, // Disable presence cache to save substantial RAM
    UserManager: 100, // Bound user cache
    GuildMemberManager: 100, // Bound member cache
    ReactionManager: 0, // No reaction caching needed
    StageInstanceManager: 0,
    VoiceStateManager: 0,
    ThreadMemberManager: 0,
  }),
  sweepers: {
    // Sweep messages older than 5 minutes every 5 minutes
    messages: {
      interval: 300,
      lifetime: 300,
    },
  },
});

// ==============================================================================
// 2. COMMAND REGISTRY
// ==============================================================================
const commands = new Collection<string, CommandModule>();
commands.set(timeoutCommand.data.name, timeoutCommand);
commands.set(banCommand.data.name, banCommand);
commands.set(warnCommand.data.name, warnCommand);

// ==============================================================================
// 3. EVENT LISTENERS
// ==============================================================================
client.once("ready", (c) => {
  console.log("\n=======================================================");
  console.log(`🤖 Discord Sentinel AI Bot is ONLINE!`);
  console.log(`🏷️ Logged in as:      ${c.user.tag} (ID: ${c.user.id})`);
  console.log(`🌐 Serving Guilds:    ${c.guilds.cache.size}`);
  console.log(`🚀 Runtime Target:    Wispbyte (Pterodactyl Node.js Container)`);
  console.log(`🧠 AI Engine:         Google Gen AI SDK (@google/genai)`);
  console.log(`⚡ Execution Mode:    Pure Background CLI Gateway (No Web Ports)`);
  console.log("=======================================================\n");

  // Start the 10-minute telemetric health monitor & status updater
  startStatusLogger(c);
});

// Primary Message Gateway: Handles Layer 1 (instant) & dispatches Layer 2 (queue)
// Wrapped with container reboot validation to prevent null reference errors on fresh memory
client.on("messageCreate", async (message) => {
  try {
    // Guard against malformed gateway payloads or empty events
    if (!message || !message.author || !message.guild) return;

    // CONTAINER RESTART DEFENSE & MEMORY VALIDATION:
    // If the Wispbyte container restarts and wipes the in-memory map,
    // ensure strikeStore and cache lookups are resilient so incoming chat messages never throw null errors.
    try {
      if (strikeStore && typeof strikeStore.getStrikes === "function") {
        strikeStore.getStrikes(message.guild.id, message.author.id);
      }
    } catch (storeValidationErr: any) {
      console.warn(
        "⚠️ [Memory Defense] Strike store map re-initialized after container restart:",
        storeValidationErr?.message || storeValidationErr
      );
    }

    await handleMessageCreate(message);
  } catch (err: any) {
    console.error("[Gateway Error] Unhandled error in messageCreate handler:", err?.message || err);
  }
});

// Slash Commands Gateway: Non-blocking command dispatcher
client.on("interactionCreate", async (interaction) => {
  try {
    await handleInteractionCreate(interaction, commands);
  } catch (err: any) {
    console.error("[Gateway Error] Unhandled error in interactionCreate handler:", err?.message || err);
  }
});

// ==============================================================================
// 4. CRASH GUARDS & PROCESS ISOLATION FOR TERMUX
// ==============================================================================
// Mobile Android processes will die if unhandled rejections leak.
// These catch-all hooks ensure the Node event loop stays resilient.
process.on("unhandledRejection", (reason: any) => {
  console.error("🚨 [Termux Guard] Unhandled Promise Rejection:", reason?.stack || reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("🚨 [Termux Guard] Uncaught Exception caught safely:", error.stack || error);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Gracefully shutting down Discord bot (SIGINT received)...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Terminating Discord bot (SIGTERM received)...");
  client.destroy();
  process.exit(0);
});

// ==============================================================================
// 5. LOGIN
// ==============================================================================
const token = process.env.DISCORD_TOKEN;
if (!token || token.trim() === "" || token === "your_discord_bot_token_here") {
  console.warn("⚠️  WARNING: DISCORD_TOKEN is not set or has placeholder value in .env.");
  console.warn("👉 Please edit your .env file and provide your real bot token before starting.");
} else {
  client.login(token).catch((err) => {
    console.error("❌ Failed to log into Discord:", err?.message || err);
  });
}
