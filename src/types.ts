export interface BotFile {
  path: string;
  name: string;
  description: string;
  category: "config" | "source" | "command" | "event" | "util" | "doc";
  language: string;
  content: string;
}

export interface ModerationTestResult {
  executedLayer: 1 | 2;
  layerName: string;
  isViolating: boolean;
  category: string;
  confidenceScore: number;
  reason: string;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedAction: "NONE" | "WARN" | "DELETE" | "TIMEOUT";
  tokensUsed: number;
  latencyMs: number;
  decision: "BLOCKED_BY_REGEX" | "FLAGGED_BY_GEMINI" | "PASSED_CLEAN";
  explanation: string;
}

export interface SimulatedStrike {
  userId: string;
  userTag: string;
  count: number;
  lastStrikeTime: string;
  reasons: string[];
  timedOut: boolean;
}

export interface TelemetryData {
  status: string;
  uptimeSeconds: number;
  memory: {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
  };
  nodeVersion: string;
  platform: string;
  geminiConfigured: boolean;
}
