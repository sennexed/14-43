import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client server-side
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
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

// Layer 1 Local RegExp Patterns (Identical to bot/blacklist.ts)
const PHISHING_REGEX = /(?:discord(?:app)?\.(?:gifts?|nitro|claim|promo|drop|get|steam|free)|discorcl\.|dlscord\.|steamcommunity-.*\.(?:ru|xyz|top|link|online)|free-nitro|steam-nitro|steamgift)\b/i;
const INVITE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9_-]+/i;
const MASS_MENTION_REGEX = /(?:<@&?\d+>[\s,]*){5,}/i;
const CHAR_FLOOD_REGEX = /(.)\1{24,}/;
const ZALGO_REGEX = /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]{6,}/;
const SEVERE_SLUR_PATTERNS = [
  { regex: /\b(?:kys|kill\s*your\s*self|go\s*die)\b/i, reason: "Self-harm encouragement / death threat" },
  { regex: /\b(?:n[i!1]gg[e3a4]r|f[a4]gg?[o0]t|k[i!1]k[e3]|tr[a4]nn[y1]|c[u0]nt)\b/i, reason: "Prohibited hate speech / identity attack slur" },
];

function checkLayer1(content: string) {
  if (PHISHING_REGEX.test(content)) {
    return { rule: "PHISHING_SCAM_LINK", reason: "Dangerous phishing or deceptive gift link detected.", severity: "CRITICAL", suggestedAction: "DELETE" };
  }
  for (const { regex, reason } of SEVERE_SLUR_PATTERNS) {
    if (regex.test(content)) {
      return { rule: "PROHIBITED_SLUR_THREAT", reason, severity: "CRITICAL", suggestedAction: "DELETE" };
    }
  }
  if (INVITE_REGEX.test(content)) {
    return { rule: "UNAUTHORIZED_INVITE", reason: "Discord server invite links are prohibited.", severity: "MEDIUM", suggestedAction: "DELETE" };
  }
  if (MASS_MENTION_REGEX.test(content)) {
    return { rule: "MASS_MENTION_SPAM", reason: "Excessive user/role tagging detected.", severity: "HIGH", suggestedAction: "DELETE" };
  }
  if (ZALGO_REGEX.test(content)) {
    return { rule: "ZALGO_TEXT_DISRUPTION", reason: "Screen-disrupting Unicode character explosion.", severity: "MEDIUM", suggestedAction: "DELETE" };
  }
  if (CHAR_FLOOD_REGEX.test(content)) {
    return { rule: "CHARACTER_FLOOD", reason: "Excessive repetitive character spam.", severity: "LOW", suggestedAction: "WARN" };
  }
  return null;
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// System Health & Memory Telemetry (Simulates Termux Status Check)
app.get("/api/telemetry", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "online",
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMB: +(mem.rss / (1024 * 1024)).toFixed(2),
      heapUsedMB: +(mem.heapUsed / (1024 * 1024)).toFixed(2),
      heapTotalMB: +(mem.heapTotal / (1024 * 1024)).toFixed(2),
      externalMB: +(mem.external / (1024 * 1024)).toFixed(2),
    },
    nodeVersion: process.version,
    platform: process.platform,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Live Hybrid Moderation Simulator Endpoint
app.post("/api/moderate", async (req, res) => {
  const startTime = Date.now();
  const { content, authorTag = "DiscordUser#1337" } = req.body;

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Missing or invalid content string in body." });
    return;
  }

  // 1. Layer 1: Synchronous Local Blacklist Check
  const l1Match = checkLayer1(content);
  if (l1Match) {
    const elapsed = Date.now() - startTime;
    res.json({
      executedLayer: 1,
      layerName: "Layer 1: Local RegExp Filter",
      isViolating: true,
      category: l1Match.rule,
      confidenceScore: 1.0,
      reason: l1Match.reason,
      severity: l1Match.severity,
      suggestedAction: l1Match.suggestedAction,
      tokensUsed: 0,
      latencyMs: elapsed,
      decision: "BLOCKED_BY_REGEX",
      explanation: "Caught instantaneously by local pattern engine. 0 API tokens consumed, 0 network latency.",
    });
    return;
  }

  // 2. Layer 2: Asynchronous Gemini AI Contextual Evaluation
  try {
    const ai = getGemini();
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const systemPrompt = `You are an elite, contextual AI safety moderator for Discord servers.
Analyze incoming messages for:
- Severe toxicity, harassment, death threats, suicide encouragement
- Hate speech against protected identity groups
- Scams, crypto fraud, phishing
Nuance:
- Allow gamer banter ("ez", "I died to the boss again", "bro stop stealing my loot"), sarcasm, and casual clean profanity that is not aimed at demeaning or harming someone.
- Only flag violations when confidence >= 0.70.`;

    const aiResponse = await ai.models.generateContent({
      model,
      contents: `Author: ${authorTag}\nMessage: "${content}"`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isViolating: { type: Type.BOOLEAN },
            category: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            severity: { type: Type.STRING },
          },
          required: ["isViolating", "category", "confidenceScore", "reason", "suggestedAction", "severity"],
        },
      },
    });

    const elapsed = Date.now() - startTime;
    const parsed = JSON.parse(aiResponse.text || "{}");

    res.json({
      executedLayer: 2,
      layerName: "Layer 2: Gemini Contextual AI",
      isViolating: parsed.isViolating ?? false,
      category: parsed.category || "SAFE",
      confidenceScore: parsed.confidenceScore || 0,
      reason: parsed.reason || "Content assessed as benign and non-violating.",
      severity: parsed.severity || "NONE",
      suggestedAction: parsed.suggestedAction || "NONE",
      tokensUsed: 1,
      latencyMs: elapsed,
      decision: parsed.isViolating ? "FLAGGED_BY_GEMINI" : "PASSED_CLEAN",
      explanation: parsed.reason,
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error("[API Moderate] Gemini error:", error?.message || error);
    res.json({
      executedLayer: 2,
      layerName: "Layer 2: Gemini Contextual AI (Fallback)",
      isViolating: false,
      category: "SAFE",
      confidenceScore: 0,
      reason: `Gemini API fallback: ${error?.message || "Service unavailable"}. Content allowed safely.`,
      severity: "NONE",
      suggestedAction: "NONE",
      tokensUsed: 0,
      latencyMs: elapsed,
      decision: "PASSED_CLEAN",
      explanation: "Defaulted to safe due to API fallback; zero crashes occurred.",
    });
  }
});

// -----------------------------------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// -----------------------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Discord Sentinel Web Hub & API listening on http://0.0.0.0:${PORT}`);
  });
}

start();
