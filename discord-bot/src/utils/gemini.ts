import { GoogleGenAI, Type } from "@google/genai";

/**
 * Result structure returned by the Layer 2 Gemini moderation analysis.
 */
export interface GeminiModerationResult {
  isViolating: boolean;
  category: "TOXICITY" | "HARASSMENT" | "HATE_SPEECH" | "SPAM" | "THREAT" | "SAFE";
  confidenceScore: number; // 0.0 to 1.0
  reason: string;
  suggestedAction: "NONE" | "WARN" | "DELETE" | "TIMEOUT";
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

let aiClient: GoogleGenAI | null = null;

/**
 * Lazily retrieves or initializes the GoogleGenAI client.
 */
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

const MODERATION_SYSTEM_INSTRUCTION = `You are an elite, contextual AI safety moderator for Discord servers.
Your objective is to review incoming chat messages and flag genuine violations while avoiding false positives on casual gamer slang, humorous banter, and friendly self-deprecation.

Rules to enforce:
1. TOXICITY & HARASSMENT: Targeted attacks, vicious insults, encouraging self-harm, severe toxicity, doxxing threats.
2. HATE SPEECH: Slurs, dehumanizing rhetoric against protected identity groups (race, religion, gender, sexual orientation, disability).
3. THREATS: Credible threats of physical violence or real-life harm.
4. SPAM & SCAMS: Cryptocurrency pump-and-dumps, malicious phishing schemes, pyramid schemes, credential stealers.

Context Nuance:
- Allow friendly banter, gaming complaints ("this boss is killing me", "gg ez", "you stole my kill!"), and casual profanity that is not aimed at demeaning or harassing someone.
- Only mark 'isViolating: true' if confidenceScore >= 0.70.

Always respond strictly adhering to the JSON schema.`;

/**
 * Evaluates a message using Gemini 2.5/Flash contextual AI.
 * Wrapped in strict error handling to ensure zero unhandled rejections on mobile/Termux.
 */
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
      contents: `Author: ${authorTag}\nMessage: "${content}"`,
      config: {
        systemInstruction: MODERATION_SYSTEM_INSTRUCTION,
        temperature: 0.1, // Low temperature for consistent deterministic moderation decisions
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
    if (!rawText) {
      return fallbackResult;
    }

    const parsed = JSON.parse(rawText) as GeminiModerationResult;
    return parsed;
  } catch (error: any) {
    // Log concisely without blowing up the Termux console
    console.error(`[Gemini Moderation] Non-fatal analysis error: ${error?.message || error}`);
    return {
      ...fallbackResult,
      reason: "Gemini API unavailable or rate-limited; defaulted to safe.",
    };
  }
}
