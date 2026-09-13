import { Message, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { checkLayer1Blacklist } from "../utils/blacklist.js";
import { analyzeWithGemini } from "../utils/gemini.js";
import { strikeStore } from "../utils/strikeStore.js";
import { moderationQueue } from "../utils/queue.js";

/**
 * Handles incoming messages through the Hybrid Dual-Layer Moderation Pipeline.
 * 
 * - Layer 1 (Sync): Instant local RegExp inspection (<0.2ms).
 * - Layer 2 (Async Decoupled): Background Gemini AI contextual toxicity analysis.
 */
export async function handleMessageCreate(message: Message): Promise<void> {
  // 1. Guard Clauses: Skip bots, system webhooks, direct messages, or empty text
  if (message.author.bot || message.system || !message.guild || !message.content) {
    return;
  }

  // 2. Staff Exemption: Exempt users with administrative or moderation permissions
  try {
    const member = message.member || (await message.guild.members.fetch(message.author.id).catch(() => null));
    if (
      member?.permissions.has(PermissionFlagsBits.Administrator) ||
      member?.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return;
    }
  } catch {
    // If fetching member fails, proceed with safe checks
  }

  const { content, guild, author, channel } = message;
  const guildId = guild.id;
  const userId = author.id;

  // ============================================================================
  // LAYER 1: LIGHTNING-FAST LOCAL REGEXP BLACKLIST (Zero API cost, <0.2ms latency)
  // ============================================================================
  const layer1Match = checkLayer1Blacklist(content);

  if (layer1Match) {
    // 1. Delete violating message safely
    try {
      if (message.deletable) {
        await message.delete();
      }
    } catch (err: any) {
      console.warn(`[Layer 1] Could not delete message from ${author.tag}: ${err?.message || err}`);
    }

    // 2. Record Strike in lightweight in-memory store
    const { record, thresholdReached } = strikeStore.addStrike(
      guildId,
      userId,
      layer1Match.reason,
      "LAYER_1_REGEX"
    );

    // 3. Send Informative Direct Message to offender
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(`⚠️ Automated Moderation Alert: ${guild.name}`)
        .setDescription(`Your message was automatically removed for violating server policies.`)
        .addFields(
          { name: "Reason", value: layer1Match.reason, inline: true },
          { name: "Rule Code", value: `\`${layer1Match.rule}\``, inline: true },
          { name: "Active Strikes", value: `**${record.count}** / ${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}`, inline: true }
        )
        .setTimestamp();

      await author.send({ embeds: [dmEmbed] });
    } catch {
      // User may have DMs closed; silently handle to prevent crashing
    }

    // 4. Temporary Channel Notice (Self-deleting after 5 seconds to prevent channel clutter)
    try {
      if ("send" in channel) {
        const alertMsg = await channel.send({
          content: `🛡️ **${author.username}**, your message was removed for violating community safety rules.`,
        });
        setTimeout(() => alertMsg.delete().catch(() => {}), 5000);
      }
    } catch {}

    // 5. Escalate to Timeout if strike threshold exceeded
    if (thresholdReached) {
      await enforceAutoTimeout(
        message,
        `Exceeded strike limit (${record.count} strikes) via Layer 1 filter.`
      );
    }

    // Stop pipeline immediately—no Gemini tokens or queue space wasted!
    return;
  }

  // ============================================================================
  // LAYER 2: DECOUPLED ASYNCHRONOUS GEMINI AI CONTEXTUAL ANALYSIS
  // ============================================================================
  // Offload to background queue so gateway thread & slash commands NEVER lag.
  moderationQueue.enqueue({
    id: `mod-${message.id}-${Date.now()}`,
    messageId: message.id,
    channelId: channel.id,
    guildId: guild.id,
    authorId: author.id,
    authorTag: author.tag,
    content,
    createdAt: Date.now(),
    execute: async () => {
      // Background AI Execution Worker
      const aiResult = await analyzeWithGemini(content, author.tag);

      // Only act on genuine violations meeting confidence threshold
      if (!aiResult.isViolating || aiResult.confidenceScore < 0.70) {
        return;
      }

      console.log(`[Layer 2 Gemini] Flagged message from ${author.tag}: [${aiResult.category}] (${(aiResult.confidenceScore * 100).toFixed(0)}% conf) - ${aiResult.reason}`);

      // 1. Delete message if suggested or severe
      if (aiResult.suggestedAction === "DELETE" || aiResult.suggestedAction === "TIMEOUT" || aiResult.severity === "HIGH" || aiResult.severity === "CRITICAL") {
        try {
          if (message.deletable) {
            await message.delete();
          }
        } catch (err: any) {
          console.warn(`[Layer 2] Could not delete AI-flagged message: ${err?.message || err}`);
        }
      }

      // 2. Add strike in-memory
      const { record, thresholdReached } = strikeStore.addStrike(
        guildId,
        userId,
        `[${aiResult.category}] ${aiResult.reason}`,
        "LAYER_2_GEMINI"
      );

      // 3. DM user with AI explanation
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFEE75C)
          .setTitle(`🤖 AI Safety Notice: ${guild.name}`)
          .setDescription(`Our contextual moderation system flagged your message.`)
          .addFields(
            { name: "Category", value: aiResult.category, inline: true },
            { name: "Confidence", value: `${(aiResult.confidenceScore * 100).toFixed(0)}%`, inline: true },
            { name: "Explanation", value: aiResult.reason },
            { name: "Strike Status", value: `**${record.count}** / ${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}`, inline: true }
          )
          .setTimestamp();

        await author.send({ embeds: [dmEmbed] });
      } catch {
        // DM failed (DMs blocked); ignore
      }

      // 4. Enforce timeout if recommended by Gemini or strike threshold reached
      if (thresholdReached || aiResult.suggestedAction === "TIMEOUT" || aiResult.severity === "CRITICAL") {
        await enforceAutoTimeout(
          message,
          `Automated safety timeout: ${aiResult.reason} (Category: ${aiResult.category})`
        );
      }
    },
  });
}

/**
 * Safely applies an automated timeout to a guild member.
 */
async function enforceAutoTimeout(message: Message, reason: string): Promise<void> {
  try {
    const member = message.member || (await message.guild?.members.fetch(message.author.id).catch(() => null));
    if (!member) return;

    // Check if target is moderatable by this bot (role hierarchy check)
    if (!member.moderatable) {
      console.warn(`[Auto-Timeout] Cannot timeout ${member.user.tag}: bot lacks permission or role hierarchy is lower.`);
      return;
    }

    const timeoutMinutes = parseInt(process.env.TIMEOUT_DURATION_MINUTES || "10", 10);
    const durationMs = timeoutMinutes * 60 * 1000;

    await member.timeout(durationMs, reason);
    console.log(`[Auto-Timeout] Successfully muted ${member.user.tag} for ${timeoutMinutes}m. Reason: ${reason}`);

    // Optional: send DM about timeout
    try {
      await member.send({
        content: `⏳ You have been timed out in **${message.guild?.name}** for **${timeoutMinutes} minutes**.\nReason: ${reason}`,
      });
    } catch {}
  } catch (err: any) {
    console.error(`[Auto-Timeout Error] Failed to timeout ${message.author.tag}:`, err?.message || err);
  }
}
