/**
 * Layer 1 Local RegExp Blacklist
 * 
 * Lightning-fast synchronous inspection to catch blatant violations in <0.2ms
 * without calling external APIs or burning Gemini quota.
 */

export interface BlacklistMatch {
  rule: string;
  reason: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
}

// 1. Known Phishing / Free Nitro / Scam Domains
const PHISHING_REGEX = /(?:discord(?:app)?\.(?:gifts?|nitro|claim|promo|drop|get|steam|free)|discorcl\.|dlscord\.|steamcommunity-.*\.(?:ru|xyz|top|link|online)|free-nitro|steam-nitro|steamgift)\b/i;

// 2. Unauthorized Discord Server Invite links
const INVITE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9_-]+/i;

// 3. Mass Mention Spam (> 5 user/role mentions in a single message)
const MASS_MENTION_REGEX = /(?:<@&?\d+>[\s,]*){5,}/i;

// 4. Repetitive Character Flooding / Spam (e.g. aaaaaaaaaaaaaaaaaaaaaaaa 25+ chars)
const CHAR_FLOOD_REGEX = /(.)\1{24,}/;

// 5. Zalgo / Excessive Combining Diacritics that lag mobile screens
const ZALGO_REGEX = /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]{6,}/;

// 6. Blatant Severe Harassment / Slurs (with common leetspeak substitutions)
const SEVERE_SLUR_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  {
    regex: /\b(?:kys|kill\s*your\s*self|go\s*die)\b/i,
    reason: "Self-harm encouragement / death threat"
  },
  {
    regex: /\b(?:n[i!1]gg[e3a4]r|f[a4]gg?[o0]t|k[i!1]k[e3]|tr[a4]nn[y1]|c[u0]nt)\b/i,
    reason: "Prohibited hate speech / identity attack slur"
  }
];

/**
 * Executes Layer 1 local pattern matching on the message content.
 * Returns match details if an instant rule is triggered, or null if clean.
 */
export function checkLayer1Blacklist(rawContent: string): BlacklistMatch | null {
  if (!rawContent || rawContent.trim().length === 0) {
    return null;
  }

  const content = rawContent.trim();

  // 1. Phishing & Scam check
  if (PHISHING_REGEX.test(content)) {
    return {
      rule: "PHISHING_SCAM_LINK",
      reason: "Dangerous phishing or deceptive gift link detected.",
      severity: "CRITICAL",
    };
  }

  // 2. Prohibited slurs / severe threats
  for (const { regex, reason } of SEVERE_SLUR_PATTERNS) {
    if (regex.test(content)) {
      return {
        rule: "PROHIBITED_SLUR_THREAT",
        reason,
        severity: "CRITICAL",
      };
    }
  }

  // 3. Unauthorized Discord Invite links
  if (INVITE_REGEX.test(content)) {
    return {
      rule: "UNAUTHORIZED_INVITE",
      reason: "Discord server invite links are prohibited.",
      severity: "MEDIUM",
    };
  }

  // 4. Mass Mentions
  if (MASS_MENTION_REGEX.test(content)) {
    return {
      rule: "MASS_MENTION_SPAM",
      reason: "Excessive user/role tagging detected.",
      severity: "HIGH",
    };
  }

  // 5. Zalgo / Unicode disruption
  if (ZALGO_REGEX.test(content)) {
    return {
      rule: "ZALGO_TEXT_DISRUPTION",
      reason: "Screen-disrupting Unicode character explosion.",
      severity: "MEDIUM",
    };
  }

  // 6. Character flood
  if (CHAR_FLOOD_REGEX.test(content)) {
    return {
      rule: "CHARACTER_FLOOD",
      reason: "Excessive repetitive character spam.",
      severity: "LOW" as any,
    };
  }

  return null;
}
