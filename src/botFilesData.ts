export interface BotFile {
  path: string;
  name: string;
  description: string;
  category: "config" | "source" | "command" | "event" | "util" | "doc";
  language: string;
  content: string;
}

export const BOT_FILES: BotFile[] = [
  {
    path: "package.json",
    name: "package.json",
    description: "Project metadata, dependencies (discord.js, @google/genai, dotenv), and Termux low-memory start script.",
    category: "config",
    language: "json",
    content: `{
  "name": "discord-ai-moderator",
  "version": "1.0.0",
  "description": "Mobile-optimized hybrid AI and command moderation Discord bot for Termux",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node --max-old-space-size=128 dist/index.js",
    "deploy-commands": "tsx src/deploy-commands.ts",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "discord",
    "moderation",
    "gemini",
    "termux",
    "ai",
    "discord-js"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@google/genai": "^2.4.0",
    "discord.js": "^14.18.0",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "tsx": "^4.21.0",
    "typescript": "^5.8.2"
  }
}`
  },
  {
    path: "tsconfig.json",
    name: "tsconfig.json",
    description: "Lightweight TypeScript configuration tailored for modern Node.js ES Modules and minimal Termux RAM usage.",
    category: "config",
    language: "json",
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "noImplicitAny": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*"]
}`
  },
  {
    path: ".env",
    name: ".env",
    description: "Environment configuration template for Discord token, Client ID, and Google Gemini API keys.",
    category: "config",
    language: "bash",
    content: `# ==============================================================================
# DISCORD BOT CONFIGURATION
# ==============================================================================
# Get your bot token and application ID from: https://discord.com/developers/applications
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here

# Optional: Specific guild ID for instant slash command registration during development
# GUILD_ID=your_test_guild_id_here

# ==============================================================================
# GEMINI AI CONFIGURATION (LAYER 2 CONTEXTUAL MODERATION)
# ==============================================================================
# Get your Gemini API key from: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# ==============================================================================
# MODERATION & TERMUX POLICIES
# ==============================================================================
# Number of strikes before a user is automatically muted/timed out
MAX_STRIKES_BEFORE_TIMEOUT=3

# Automatic timeout duration in minutes
TIMEOUT_DURATION_MINUTES=10

# Strike expiration time in minutes (in-memory TTL)
STRIKE_TTL_MINUTES=60

# Max background AI queue concurrency (prevents CPU choking in Termux)
AI_QUEUE_CONCURRENCY=2`
  },
  {
    path: "src/index.ts",
    name: "src/index.ts",
    description: "Main bot entry point with Gateway intents, mobile-optimized cache limits, and process crash guards.",
    category: "source",
    language: "typescript",
    content: `import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Options,
  ChatInputCommandInteraction,
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

import { handleMessageCreate } from "./events/messageCreate.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";
import { startStatusLogger } from "./utils/statusLogger.js";

import * as timeoutCommand from "./commands/timeout.js";
import * as banCommand from "./commands/ban.js";
import * as warnCommand from "./commands/warn.js";

interface CommandModule {
  data: { name: string };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// 1. Mobile & Termux Optimized Client Initialization
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
  makeCache: Options.cacheWithLimits({
    MessageManager: 50, // Only keep 50 messages per channel
    PresenceManager: 0, // Disable presences to preserve substantial RAM
    UserManager: 100,
    GuildMemberManager: 100,
    ReactionManager: 0,
    StageInstanceManager: 0,
    VoiceStateManager: 0,
    ThreadMemberManager: 0,
  }),
  sweepers: {
    messages: {
      interval: 300,
      lifetime: 300,
    },
  },
});

// 2. Command Registry
const commands = new Collection<string, CommandModule>();
commands.set(timeoutCommand.data.name, timeoutCommand);
commands.set(banCommand.data.name, banCommand);
commands.set(warnCommand.data.name, warnCommand);

// 3. Event Listeners
client.once("ready", (c) => {
  console.log("\\n=======================================================");
  console.log(\`🤖 Discord Sentinel AI Bot is ONLINE!\`);
  console.log(\`🏷️ Logged in as:      \${c.user.tag} (ID: \${c.user.id})\`);
  console.log(\`🌐 Serving Guilds:    \${c.guilds.cache.size}\`);
  console.log(\`📱 Runtime Target:    Mobile / Termux (Low-Memory Optimized)\`);
  console.log(\`🧠 AI Engine:         Google Gen AI SDK (@google/genai)\`);
  console.log("=======================================================\\n");

  startStatusLogger(c);
});

client.on("messageCreate", async (message) => {
  try {
    await handleMessageCreate(message);
  } catch (err: any) {
    console.error("[Gateway Error] Unhandled error in messageCreate handler:", err?.message || err);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    await handleInteractionCreate(interaction, commands);
  } catch (err: any) {
    console.error("[Gateway Error] Unhandled error in interactionCreate handler:", err?.message || err);
  }
});

// 4. Crash Guards & Process Isolation for Termux
process.on("unhandledRejection", (reason: any) => {
  console.error("🚨 [Termux Guard] Unhandled Promise Rejection:", reason?.stack || reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("🚨 [Termux Guard] Uncaught Exception caught safely:", error.stack || error);
});

process.on("SIGINT", () => {
  console.log("\\n🛑 Gracefully shutting down Discord bot (SIGINT received)...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\\n🛑 Terminating Discord bot (SIGTERM received)...");
  client.destroy();
  process.exit(0);
});

// 5. Login
const token = process.env.DISCORD_TOKEN;
if (!token || token.trim() === "" || token === "your_discord_bot_token_here") {
  console.warn("⚠️  WARNING: DISCORD_TOKEN is not set or has placeholder value in .env.");
  console.warn("👉 Please edit your .env file and provide your real bot token before starting.");
} else {
  client.login(token).catch((err) => {
    console.error("❌ Failed to log into Discord:", err?.message || err);
  });
}`
  },
  {
    path: "src/utils/gemini.ts",
    name: "src/utils/gemini.ts",
    description: "Backend wrapper for @google/genai SDK with structured JSON schema and toxicity/harassment analysis.",
    category: "util",
    language: "typescript",
    content: `import { GoogleGenAI, Type } from "@google/genai";

export interface GeminiModerationResult {
  isViolating: boolean;
  category: "TOXICITY" | "HARASSMENT" | "HATE_SPEECH" | "SPAM" | "THREAT" | "SAFE";
  confidenceScore: number;
  reason: string;
  suggestedAction: "NONE" | "WARN" | "DELETE" | "TIMEOUT";
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const MODERATION_SYSTEM_INSTRUCTION = \`You are an elite, contextual AI safety moderator for Discord servers.
Your objective is to review incoming chat messages and flag genuine violations while avoiding false positives on casual gamer slang, humorous banter, and friendly self-deprecation.

Rules to enforce:
1. TOXICITY & HARASSMENT: Targeted attacks, vicious insults, encouraging self-harm, severe toxicity, doxxing threats.
2. HATE SPEECH: Slurs, dehumanizing rhetoric against protected identity groups.
3. THREATS: Credible threats of physical violence or real-life harm.
4. SPAM & SCAMS: Cryptocurrency pump-and-dumps, malicious phishing schemes, pyramid schemes, credential stealers.

Context Nuance:
- Allow friendly banter, gaming complaints ("this boss is killing me", "gg ez", "you stole my kill!"), and casual profanity that is not aimed at demeaning or harassing someone.
- Only mark 'isViolating: true' if confidenceScore >= 0.70.

Always respond strictly adhering to the JSON schema.\`;

export async function analyzeWithGemini(
  content: string,
  authorTag: string = "User"
): Promise<GeminiModerationResult> {
  const fallbackResult: GeminiModerationResult = {
    isViolating: false,
    category: "SAFE",
    confidenceScore: 0.0,
    reason: "Safe or analysis skipped",
    suggestedAction: "NONE",
    severity: "NONE",
  };

  if (!content || content.trim().length === 0) {
    return fallbackResult;
  }

  try {
    const ai = getGeminiClient();
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model,
      contents: \`Author: \${authorTag}\\nMessage: "\${content}"\`,
      config: {
        systemInstruction: MODERATION_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isViolating: {
              type: Type.BOOLEAN,
              description: "Whether the message violates community guidelines.",
            },
            category: {
              type: Type.STRING,
              description: "The primary category of violation, or SAFE if acceptable.",
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: "Confidence rating from 0.0 (clean) to 1.0 (extreme violation).",
            },
            reason: {
              type: Type.STRING,
              description: "Brief, professional explanation of why this was flagged or passed.",
            },
            suggestedAction: {
              type: Type.STRING,
              description: "Recommended moderation action: NONE, WARN, DELETE, or TIMEOUT.",
            },
            severity: {
              type: Type.STRING,
              description: "Severity level: NONE, LOW, MEDIUM, HIGH, or CRITICAL.",
            },
          },
          required: [
            "isViolating",
            "category",
            "confidenceScore",
            "reason",
            "suggestedAction",
            "severity",
          ],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) return fallbackResult;

    return JSON.parse(rawText) as GeminiModerationResult;
  } catch (error: any) {
    console.error(\`[Gemini Moderation] Non-fatal analysis error: \${error?.message || error}\`);
    return {
      ...fallbackResult,
      reason: "Gemini API unavailable or rate-limited; defaulted to safe.",
    };
  }
}`
  },
  {
    path: "src/utils/blacklist.ts",
    name: "src/utils/blacklist.ts",
    description: "Layer 1 synchronous RegExp filters to catch phishing, scam links, invites, zalgo, and slurs in <0.2ms.",
    category: "util",
    language: "typescript",
    content: `export interface BlacklistMatch {
  rule: string;
  reason: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
}

const PHISHING_REGEX = /(?:discord(?:app)?\\.(?:gifts?|nitro|claim|promo|drop|get|steam|free)|discorcl\\.|dlscord\\.|steamcommunity-.*\\.(?:ru|xyz|top|link|online)|free-nitro|steam-nitro|steamgift)\\b/i;
const INVITE_REGEX = /(?:https?:\\/\\/)?(?:www\\.)?(?:discord\\.(?:gg|io|me|li)|discord(?:app)?\\.com\\/invite)\\/[a-zA-Z0-9_-]+/i;
const MASS_MENTION_REGEX = /(?:<@&?\\d+>[\\s,]*){5,}/i;
const CHAR_FLOOD_REGEX = /(.)\\1{24,}/;
const ZALGO_REGEX = /[\\u0300-\\u036F\\u1DC0-\\u1DFF\\u20D0-\\u20FF\\uFE20-\\uFE2F]{6,}/;

const SEVERE_SLUR_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  {
    regex: /\\b(?:kys|kill\\s*your\\s*self|go\\s*die)\\b/i,
    reason: "Self-harm encouragement / death threat",
  },
  {
    regex: /\\b(?:n[i!1]gg[e3a4]r|f[a4]gg?[o0]t|k[i!1]k[e3]|tr[a4]nn[y1]|c[u0]nt)\\b/i,
    reason: "Prohibited hate speech / identity attack slur",
  },
];

export function checkLayer1Blacklist(rawContent: string): BlacklistMatch | null {
  if (!rawContent || rawContent.trim().length === 0) return null;
  const content = rawContent.trim();

  if (PHISHING_REGEX.test(content)) {
    return {
      rule: "PHISHING_SCAM_LINK",
      reason: "Dangerous phishing or deceptive gift link detected.",
      severity: "CRITICAL",
    };
  }

  for (const { regex, reason } of SEVERE_SLUR_PATTERNS) {
    if (regex.test(content)) {
      return {
        rule: "PROHIBITED_SLUR_THREAT",
        reason,
        severity: "CRITICAL",
      };
    }
  }

  if (INVITE_REGEX.test(content)) {
    return {
      rule: "UNAUTHORIZED_INVITE",
      reason: "Discord server invite links are prohibited.",
      severity: "MEDIUM",
    };
  }

  if (MASS_MENTION_REGEX.test(content)) {
    return {
      rule: "MASS_MENTION_SPAM",
      reason: "Excessive user/role tagging detected.",
      severity: "HIGH",
    };
  }

  if (ZALGO_REGEX.test(content)) {
    return {
      rule: "ZALGO_TEXT_DISRUPTION",
      reason: "Screen-disrupting Unicode character explosion.",
      severity: "MEDIUM",
    };
  }

  if (CHAR_FLOOD_REGEX.test(content)) {
    return {
      rule: "CHARACTER_FLOOD",
      reason: "Excessive repetitive character spam.",
      severity: "MEDIUM",
    };
  }

  return null;
}`
  },
  {
    path: "src/utils/strikeStore.ts",
    name: "src/utils/strikeStore.ts",
    description: "In-memory Map strike management with automated TTL expiration and 10-minute memory sweepers.",
    category: "util",
    language: "typescript",
    content: `export interface StrikeRecord {
  userId: string;
  guildId: string;
  count: number;
  lastStrikeTimestamp: number;
  history: Array<{
    timestamp: number;
    reason: string;
    layer: "LAYER_1_REGEX" | "LAYER_2_GEMINI" | "MANUAL_STAFF";
  }>;
}

class StrikeStore {
  private strikes: Map<string, StrikeRecord> = new Map();
  private readonly defaultTtlMs: number;
  private readonly maxStrikesBeforeAction: number;

  constructor() {
    const ttlMinutes = parseInt(process.env.STRIKE_TTL_MINUTES || "60", 10);
    this.defaultTtlMs = ttlMinutes * 60 * 1000;
    this.maxStrikesBeforeAction = parseInt(process.env.MAX_STRIKES_BEFORE_TIMEOUT || "3", 10);

    setInterval(() => this.pruneExpired(), 10 * 60 * 1000).unref();
  }

  private getKey(guildId: string, userId: string): string {
    return \`\${guildId}:\${userId}\`;
  }

  public addStrike(
    guildId: string,
    userId: string,
    reason: string,
    layer: "LAYER_1_REGEX" | "LAYER_2_GEMINI" | "MANUAL_STAFF"
  ): { record: StrikeRecord; thresholdReached: boolean } {
    const key = this.getKey(guildId, userId);
    const now = Date.now();
    let record = this.strikes.get(key);

    if (!record || (now - record.lastStrikeTimestamp > this.defaultTtlMs)) {
      record = {
        userId,
        guildId,
        count: 1,
        lastStrikeTimestamp: now,
        history: [{ timestamp: now, reason, layer }],
      };
    } else {
      record.count += 1;
      record.lastStrikeTimestamp = now;
      record.history.push({ timestamp: now, reason, layer });
      if (record.history.length > 5) record.history.shift();
    }

    this.strikes.set(key, record);
    const thresholdReached = record.count >= this.maxStrikesBeforeAction;
    return { record, thresholdReached };
  }

  public getStrikes(guildId: string, userId: string): StrikeRecord | null {
    const key = this.getKey(guildId, userId);
    const record = this.strikes.get(key);
    if (!record) return null;
    if (Date.now() - record.lastStrikeTimestamp > this.defaultTtlMs) {
      this.strikes.delete(key);
      return null;
    }
    return record;
  }

  public clearStrikes(guildId: string, userId: string): boolean {
    return this.strikes.delete(this.getKey(guildId, userId));
  }

  public pruneExpired(): number {
    const now = Date.now();
    let prunedCount = 0;
    for (const [key, record] of this.strikes.entries()) {
      if (now - record.lastStrikeTimestamp > this.defaultTtlMs) {
        this.strikes.delete(key);
        prunedCount++;
      }
    }
    return prunedCount;
  }

  public getActiveCount(): number {
    return this.strikes.size;
  }
}

export const strikeStore = new StrikeStore();`
  },
  {
    path: "src/utils/queue.ts",
    name: "src/utils/queue.ts",
    description: "Decoupled asynchronous worker queue with concurrency throttling to shield the event loop.",
    category: "util",
    language: "typescript",
    content: `export interface ModerationJob {
  id: string;
  messageId: string;
  channelId: string;
  guildId: string;
  authorId: string;
  authorTag: string;
  content: string;
  createdAt: number;
  execute: () => Promise<void>;
}

class ModerationTaskQueue {
  private queue: ModerationJob[] = [];
  private inFlight = 0;
  private readonly maxConcurrency: number;
  private readonly maxQueueLength = 50;
  private totalProcessed = 0;
  private totalDropped = 0;

  constructor() {
    this.maxConcurrency = parseInt(process.env.AI_QUEUE_CONCURRENCY || "2", 10);
  }

  public enqueue(job: ModerationJob): boolean {
    if (this.queue.length >= this.maxQueueLength) {
      this.totalDropped++;
      console.warn(\`[Queue Backpressure] Queue full (\${this.maxQueueLength}). Dropping message \${job.messageId}.\`);
      return false;
    }

    this.queue.push(job);
    queueMicrotask(() => this.processNext());
    return true;
  }

  private async processNext(): Promise<void> {
    if (this.inFlight >= this.maxConcurrency || this.queue.length === 0) return;
    const job = this.queue.shift();
    if (!job) return;

    this.inFlight++;
    try {
      await job.execute();
      this.totalProcessed++;
    } catch (err: any) {
      console.error(\`[Queue Error] Worker job \${job.id} failed:\`, err?.message || err);
    } finally {
      this.inFlight--;
      queueMicrotask(() => this.processNext());
    }
  }

  public getStats() {
    return {
      pending: this.queue.length,
      inFlight: this.inFlight,
      totalProcessed: this.totalProcessed,
      totalDropped: this.totalDropped,
    };
  }
}

export const moderationQueue = new ModerationTaskQueue();`
  },
  {
    path: "src/utils/statusLogger.ts",
    name: "src/utils/statusLogger.ts",
    description: "10-minute telemetric health watchdog monitoring Termux RSS memory, queue stats, and Discord activity.",
    category: "util",
    language: "typescript",
    content: `import { Client, ActivityType } from "discord.js";
import { strikeStore } from "./strikeStore.js";
import { moderationQueue } from "./queue.js";

export function startStatusLogger(client: Client): NodeJS.Timeout {
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  const logStatus = () => {
    try {
      const memory = process.memoryUsage();
      const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);
      
      const rssMB = parseFloat(formatMB(memory.rss));
      const heapUsedMB = parseFloat(formatMB(memory.heapUsed));
      const heapTotalMB = parseFloat(formatMB(memory.heapTotal));
      
      const uptimeSec = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      const uptimeString = \`\${hours}h \${minutes}m \${seconds}s\`;

      const guildsCount = client.guilds.cache.size;
      const cachedUsers = client.users.cache.size;
      const activeStrikes = strikeStore.getActiveCount();
      const queueStats = moderationQueue.getStats();

      console.log("\\n================ [ 10-MINUTE SYSTEM STATUS ] ================");
      console.log(\`⏱️ Uptime:            \${uptimeString}\`);
      console.log(\`📊 Servers / Users:    \${guildsCount} guilds | \${cachedUsers} cached users\`);
      console.log(\`🧠 Memory (Termux):   RSS: \${rssMB} MB | Heap: \${heapUsedMB}/\${heapTotalMB} MB\`);
      console.log(\`⚡ Strike Records:     \${activeStrikes} active in-memory\`);
      console.log(\`🤖 AI Queue Stats:     Processed: \${queueStats.totalProcessed} | In-Flight: \${queueStats.inFlight} | Dropped: \${queueStats.totalDropped}\`);
      
      if (rssMB > 160) {
        console.warn(\`⚠️ [MEM WARNING] RSS usage is high (\${rssMB} MB). Triggering GC.\`);
        if (typeof global.gc === "function") {
          global.gc();
          console.log(\`🧹 Manual GC executed. New Heap: \${formatMB(process.memoryUsage().heapUsed)} MB\`);
        }
      }
      console.log("============================================================\\n");

      if (client.user) {
        client.user.setPresence({
          activities: [
            {
              name: \`🛡️ Guarding \${guildsCount} Guilds | AI Active\`,
              type: ActivityType.Custom,
            },
          ],
          status: "online",
        });
      }
    } catch (error: any) {
      console.error("[Status Logger] Non-fatal error collecting metrics:", error?.message || error);
    }
  };

  setTimeout(logStatus, 5000);
  return setInterval(logStatus, TEN_MINUTES_MS);
}`
  },
  {
    path: "src/events/messageCreate.ts",
    name: "src/events/messageCreate.ts",
    description: "Hybrid event coordinator: Layer 1 sync blacklist deletion, and non-blocking background queue delegation.",
    category: "event",
    language: "typescript",
    content: `import { Message, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { checkLayer1Blacklist } from "../utils/blacklist.js";
import { analyzeWithGemini } from "../utils/gemini.js";
import { strikeStore } from "../utils/strikeStore.js";
import { moderationQueue } from "../utils/queue.js";

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot || message.system || !message.guild || !message.content) {
    return;
  }

  // Staff Exemption
  try {
    const member = message.member || (await message.guild.members.fetch(message.author.id).catch(() => null));
    if (
      member?.permissions.has(PermissionFlagsBits.Administrator) ||
      member?.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return;
    }
  } catch {}

  const { content, guild, author, channel } = message;
  const guildId = guild.id;
  const userId = author.id;

  // ============================================================================
  // LAYER 1: LIGHTNING-FAST LOCAL REGEXP BLACKLIST (Zero API cost, <0.2ms latency)
  // ============================================================================
  const layer1Match = checkLayer1Blacklist(content);

  if (layer1Match) {
    try {
      if (message.deletable) await message.delete();
    } catch (err: any) {
      console.warn(\`[Layer 1] Could not delete message from \${author.tag}: \${err?.message || err}\`);
    }

    const { record, thresholdReached } = strikeStore.addStrike(
      guildId,
      userId,
      layer1Match.reason,
      "LAYER_1_REGEX"
    );

    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(\`⚠️ Automated Moderation Alert: \${guild.name}\`)
        .setDescription(\`Your message was automatically removed for violating server policies.\`)
        .addFields(
          { name: "Reason", value: layer1Match.reason, inline: true },
          { name: "Rule Code", value: \`\`\${layer1Match.rule}\`\`, inline: true },
          { name: "Active Strikes", value: \`**\${record.count}** / \${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}\`, inline: true }
        )
        .setTimestamp();

      await author.send({ embeds: [dmEmbed] });
    } catch {}

    try {
      if ("send" in channel) {
        const alertMsg = await channel.send({
          content: \`🛡️ **\${author.username}**, your message was removed for violating community safety rules.\`,
        });
        setTimeout(() => alertMsg.delete().catch(() => {}), 5000);
      }
    } catch {}

    if (thresholdReached) {
      await enforceAutoTimeout(message, \`Exceeded strike limit (\${record.count} strikes) via Layer 1 filter.\`);
    }
    return;
  }

  // ============================================================================
  // LAYER 2: DECOUPLED ASYNCHRONOUS GEMINI AI CONTEXTUAL ANALYSIS
  // ============================================================================
  moderationQueue.enqueue({
    id: \`mod-\${message.id}-\${Date.now()}\`,
    messageId: message.id,
    channelId: channel.id,
    guildId: guild.id,
    authorId: author.id,
    authorTag: author.tag,
    content,
    createdAt: Date.now(),
    execute: async () => {
      const aiResult = await analyzeWithGemini(content, author.tag);

      if (!aiResult.isViolating || aiResult.confidenceScore < 0.70) return;

      console.log(\`[Layer 2 Gemini] Flagged message from \${author.tag}: [\${aiResult.category}] (\${(aiResult.confidenceScore * 100).toFixed(0)}% conf) - \${aiResult.reason}\`);

      if (aiResult.suggestedAction === "DELETE" || aiResult.suggestedAction === "TIMEOUT" || aiResult.severity === "HIGH" || aiResult.severity === "CRITICAL") {
        try {
          if (message.deletable) await message.delete();
        } catch (err: any) {
          console.warn(\`[Layer 2] Could not delete AI-flagged message: \${err?.message || err}\`);
        }
      }

      const { record, thresholdReached } = strikeStore.addStrike(
        guildId,
        userId,
        \`[\${aiResult.category}] \${aiResult.reason}\`,
        "LAYER_2_GEMINI"
      );

      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFEE75C)
          .setTitle(\`🤖 AI Safety Notice: \${guild.name}\`)
          .setDescription(\`Our contextual moderation system flagged your message.\`)
          .addFields(
            { name: "Category", value: aiResult.category, inline: true },
            { name: "Confidence", value: \`\${(aiResult.confidenceScore * 100).toFixed(0)}%\`, inline: true },
            { name: "Explanation", value: aiResult.reason },
            { name: "Strike Status", value: \`**\${record.count}** / \${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}\`, inline: true }
          )
          .setTimestamp();

        await author.send({ embeds: [dmEmbed] });
      } catch {}

      if (thresholdReached || aiResult.suggestedAction === "TIMEOUT" || aiResult.severity === "CRITICAL") {
        await enforceAutoTimeout(message, \`Automated safety timeout: \${aiResult.reason} (Category: \${aiResult.category})\`);
      }
    },
  });
}

async function enforceAutoTimeout(message: Message, reason: string): Promise<void> {
  try {
    const member = message.member || (await message.guild?.members.fetch(message.author.id).catch(() => null));
    if (!member || !member.moderatable) return;

    const timeoutMinutes = parseInt(process.env.TIMEOUT_DURATION_MINUTES || "10", 10);
    await member.timeout(timeoutMinutes * 60 * 1000, reason);

    try {
      await member.send({
        content: \`⏳ You have been timed out in **\${message.guild?.name}** for **\${timeoutMinutes} minutes**.\\nReason: \${reason}\`,
      });
    } catch {}
  } catch (err: any) {
    console.error(\`[Auto-Timeout Error] Failed to timeout \${message.author.tag}:\`, err?.message || err);
  }
}`
  },
  {
    path: "src/events/interactionCreate.ts",
    name: "src/events/interactionCreate.ts",
    description: "Slash command router with safe error catching and ephemeral error responses.",
    category: "event",
    language: "typescript",
    content: `import { Interaction, Collection, ChatInputCommandInteraction } from "discord.js";

export async function handleInteractionCreate(
  interaction: Interaction,
  commands: Collection<string, { execute: (interaction: ChatInputCommandInteraction) => Promise<void> }>
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(\`[Command Router] Unregistered command received: /\${interaction.commandName}\`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error: any) {
    console.error(\`[Command Error] Error in /\${interaction.commandName}:\`, error?.message || error);
    
    const responsePayload = {
      content: "⚠️ An internal error occurred while executing this command.",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(responsePayload).catch(() => {});
    } else {
      await interaction.reply(responsePayload).catch(() => {});
    }
  }
}`
  },
  {
    path: "src/commands/timeout.ts",
    name: "src/commands/timeout.ts",
    description: "Built-in /timeout slash command with ModerateMembers permission checks, hierarchy checks, and safe execution.",
    category: "command",
    language: "typescript",
    content: `import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Temporarily mute/timeout a disruptive user")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false)
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The server member to timeout")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("duration")
      .setDescription("Timeout duration (e.g., 5m, 10m, 1h, 1d, 7d)")
      .setRequired(true)
      .addChoices(
        { name: "60 Seconds", value: "60s" },
        { name: "5 Minutes", value: "5m" },
        { name: "10 Minutes", value: "10m" },
        { name: "1 Hour", value: "1h" },
        { name: "1 Day", value: "1d" },
        { name: "1 Week", value: "7d" }
      )
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Reason for this disciplinary timeout")
      .setRequired(false)
  );

function parseDuration(input: string): number | null {
  const match = input.match(/^(\\d+)([smhd])$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser("target", true);
  const durationStr = interaction.options.getString("duration", true);
  const reason = interaction.options.getString("reason") || "No reason specified by moderator";

  try {
    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: \`❌ Could not find **\${targetUser.tag}** in this server.\` });
      return;
    }

    if (member.id === interaction.user.id) {
      await interaction.editReply({ content: "❌ You cannot timeout yourself." });
      return;
    }
    if (member.id === interaction.guild?.ownerId) {
      await interaction.editReply({ content: "❌ You cannot timeout the server owner." });
      return;
    }

    const executorMember = interaction.member as GuildMember;
    if (
      executorMember &&
      member.roles.highest.position >= executorMember.roles.highest.position &&
      interaction.guild?.ownerId !== interaction.user.id
    ) {
      await interaction.editReply({
        content: \`❌ You cannot timeout **\${member.user.tag}** because their role is equal to or higher than yours.\`,
      });
      return;
    }

    if (!member.moderatable) {
      await interaction.editReply({
        content: \`❌ I cannot timeout **\${member.user.tag}**. Check my role hierarchy and 'Moderate Members' permissions.\`,
      });
      return;
    }

    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
      await interaction.editReply({ content: "❌ Invalid duration. Maximum timeout is 28 days." });
      return;
    }

    try {
      await member.send({
        content: \`⏳ You have been timed out in **\${interaction.guild?.name}** for **\${durationStr}**.\\n**Reason:** \${reason}\\n**Moderator:** \${interaction.user.tag}\`,
      });
    } catch {}

    await member.timeout(durationMs, \`\${reason} | By \${interaction.user.tag}\`);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("✅ User Timed Out")
      .setDescription(\`Successfully applied timeout to **\${member.user.tag}**.\`)
      .addFields(
        { name: "Target", value: \`<@\${member.id}> (\${member.id})\`, inline: true },
        { name: "Duration", value: durationStr, inline: true },
        { name: "Moderator", value: \`<@\${interaction.user.id}>\`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error("[Command /timeout Error]:", error?.message || error);
    await interaction.editReply({
      content: \`❌ An unexpected error occurred: \${error?.message || "Unknown error"}\`,
    });
  }
}`
  },
  {
    path: "src/commands/ban.ts",
    name: "src/commands/ban.ts",
    description: "Built-in /ban slash command enforcing BanMembers permissions, hierarchy checks, and message purging.",
    category: "command",
    language: "typescript",
    content: `import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Permanently ban a malicious user from the server")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .setDMPermission(false)
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The user to permanently ban")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Reason for the permanent ban")
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName("delete_days")
      .setDescription("Delete message history from past N days (0 to 7)")
      .setMinValue(0)
      .setMaxValue(7)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser("target", true);
  const reason = interaction.options.getString("reason") || "No reason specified by staff";
  const deleteDays = interaction.options.getInteger("delete_days") ?? 1;

  try {
    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

    if (member) {
      if (member.id === interaction.user.id) {
        await interaction.editReply({ content: "❌ You cannot ban yourself." });
        return;
      }
      if (member.id === interaction.guild?.ownerId) {
        await interaction.editReply({ content: "❌ You cannot ban the server owner." });
        return;
      }

      const executor = interaction.member as GuildMember;
      if (
        executor &&
        member.roles.highest.position >= executor.roles.highest.position &&
        interaction.guild?.ownerId !== interaction.user.id
      ) {
        await interaction.editReply({
          content: \`❌ You cannot ban **\${member.user.tag}** because their role is equal to or higher than yours.\`,
        });
        return;
      }

      if (!member.bannable) {
        await interaction.editReply({
          content: \`❌ I cannot ban **\${member.user.tag}**. Please verify my role permissions and position.\`,
        });
        return;
      }

      try {
        await targetUser.send({
          content: \`🔨 You have been banned from **\${interaction.guild?.name}**.\\n**Reason:** \${reason}\\n**Moderator:** \${interaction.user.tag}\`,
        });
      } catch {}
    }

    await interaction.guild?.members.ban(targetUser.id, {
      deleteMessageSeconds: deleteDays * 86400,
      reason: \`\${reason} | By \${interaction.user.tag}\`,
    });

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("🔨 User Banned")
      .setDescription(\`Successfully banned **\${targetUser.tag}** from the server.\`)
      .addFields(
        { name: "User", value: \`\${targetUser.tag} (\`\${targetUser.id}\`)\`, inline: true },
        { name: "Deleted History", value: \`\${deleteDays} days\`, inline: true },
        { name: "Moderator", value: \`<@\${interaction.user.id}>\`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error("[Command /ban Error]:", error?.message || error);
    await interaction.editReply({
      content: \`❌ Failed to execute ban: \${error?.message || "Unknown error"}\`,
    });
  }
}`
  },
  {
    path: "src/commands/warn.ts",
    name: "src/commands/warn.ts",
    description: "Built-in /warn slash command logging manual strikes and automatically triggering timeout at threshold.",
    category: "command",
    language: "typescript",
    content: `import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { strikeStore } from "../utils/strikeStore.js";

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Issue an official warning and log a strike against a member")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false)
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The user receiving this disciplinary warning")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Reason for this warning")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser("target", true);
  const reason = interaction.options.getString("reason", true);
  const guildId = interaction.guildId!;

  if (targetUser.id === interaction.user.id) {
    await interaction.editReply({ content: "❌ You cannot warn yourself." });
    return;
  }
  if (targetUser.bot) {
    await interaction.editReply({ content: "❌ You cannot warn automated bot accounts." });
    return;
  }

  try {
    const { record, thresholdReached } = strikeStore.addStrike(
      guildId,
      targetUser.id,
      reason,
      "MANUAL_STAFF"
    );

    let dmDelivered = true;
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle(\`⚠️ Official Warning: \${interaction.guild?.name}\`)
        .setDescription(\`You have received a formal disciplinary strike from staff.\`)
        .addFields(
          { name: "Reason", value: reason },
          { name: "Staff Member", value: interaction.user.tag, inline: true },
          { name: "Strike Count", value: \`**\${record.count}** / \${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}\`, inline: true }
        )
        .setFooter({ text: "Continued violations will result in automated timeout or ban." })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch {
      dmDelivered = false;
    }

    let actionEscalated = false;
    if (thresholdReached) {
      const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
      if (member?.moderatable) {
        const timeoutMinutes = parseInt(process.env.TIMEOUT_DURATION_MINUTES || "10", 10);
        await member.timeout(
          timeoutMinutes * 60 * 1000,
          \`Exceeded maximum allowed strikes (\${record.count})\`
        );
        actionEscalated = true;
      }
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle("⚠️ Warning Logged")
      .setDescription(\`Successfully logged a strike against **\${targetUser.tag}**.\`)
      .addFields(
        { name: "Target", value: \`<@\${targetUser.id}>\`, inline: true },
        { name: "Total Strikes", value: \`**\${record.count}** / \${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}\`, inline: true },
        { name: "DM Status", value: dmDelivered ? "Delivered" : "Blocked/Failed", inline: true },
        { name: "Reason", value: reason },
        { name: "Auto-Escalation", value: actionEscalated ? "🚨 Target timed out (Threshold reached)" : "None" }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [confirmEmbed] });
  } catch (error: any) {
    console.error("[Command /warn Error]:", error?.message || error);
    await interaction.editReply({
      content: \`❌ Error logging warning: \${error?.message || "Unknown error"}\`,
    });
  }
}`
  },
  {
    path: "src/deploy-commands.ts",
    name: "src/deploy-commands.ts",
    description: "Discord REST deployment script to register slash commands globally or to test guilds.",
    category: "source",
    language: "typescript",
    content: `import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { data as timeoutData } from "./commands/timeout.js";
import { data as banData } from "./commands/ban.js";
import { data as warnData } from "./commands/warn.js";

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error("❌ Missing DISCORD_TOKEN or CLIENT_ID in environment variables (.env).");
  process.exit(1);
}

const commands = [timeoutData.toJSON(), banData.toJSON(), warnData.toJSON()];
const rest = new REST({ version: "10" }).setToken(token);

async function deploy(): Promise<void> {
  try {
    console.log(\`📡 Registering \${commands.length} slash commands with Discord API...\`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(\`✅ Successfully deployed commands to Guild: \${guildId}\`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(\`✅ Successfully deployed commands globally across all servers!\`);
    }
  } catch (error: any) {
    console.error("❌ Failed to deploy commands:", error?.message || error);
    process.exit(1);
  }
}

deploy();`
  },
  {
    path: "README.md",
    name: "README.md",
    description: "Full Termux Android installation, background PM2 setup, wake lock, and troubleshooting guide.",
    category: "doc",
    language: "markdown",
    content: `# 🛡️ Discord Sentinel AI - Hybrid Moderation Bot for Termux

A high-performance, memory-optimized Discord.js v14 hybrid moderation bot engineered specifically to run 24/7 on an Android device inside **Termux** without choking memory or crashing.

## 🚀 Key Architectural Highlights
1. **Dual-Layer Moderation Matrix**:
   - **Layer 1 (<0.2ms)**: Local RegExp engine to immediately catch phishing links, scam tokens, Discord invites, zalgo, and severe slurs. Consumes **0 API tokens** and eliminates latency.
   - **Layer 2 (Decoupled Async)**: Contextual toxicity, harassment, and threat evaluation powered by the Google Gen AI SDK (@google/genai) using Gemini Flash.
2. **True Event Loop Decoupling**:
   - All AI calls are dispatched to a non-blocking background queue with worker concurrency limits. Slash commands never freeze or lag.
3. **Low-Memory In-Memory Strike Store**:
   - Eliminates heavy databases that waste RAM and disk I/O on mobile.
   - Native JavaScript Map with automatic TTL pruning and 10-minute sweepers.
4. **Discord.js Memory Pruning**:
   - Strips presence caches, message cache limited to 50 items, sweeps idle objects every 5 minutes.
   - Runs with \`--max-old-space-size=128\` (keeps footprint ~60-90MB).
5. **10-Minute Health & Status Watchdog**:
   - Regularly logs RSS, heap consumption, queue throughput, and active strikes to stdout.

## 📱 Termux Quick Start
\`\`\`bash
# 1. Update Termux & install Node.js
pkg update && pkg upgrade -y
pkg install nodejs-lts git -y

# 2. Acquire wake lock to keep Termux alive with screen off
termux-wake-lock

# 3. Clone / copy bot into folder
mkdir -p ~/discord-bot && cd ~/discord-bot

# 4. Install dependencies
npm install

# 5. Configure tokens
cp .env.example .env
nano .env

# 6. Deploy slash commands & start bot
npm run deploy-commands
npm run build && npm start
\`\`\`
`
  }
];
