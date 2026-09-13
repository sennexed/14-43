import {
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

/**
 * Converts shorthand duration string to milliseconds.
 */
function parseDuration(input: string): number | null {
  const match = input.match(/^(\d+)([smhd])$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // Defer reply immediately so Discord never times out if network jitters on mobile
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser("target", true);
  const durationStr = interaction.options.getString("duration", true);
  const reason = interaction.options.getString("reason") || "No reason specified by moderator";

  try {
    // 1. Fetch guild member object
    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      await interaction.editReply({
        content: `❌ Could not find **${targetUser.tag}** in this server.`,
      });
      return;
    }

    // 2. Hierarchy Check 1: User cannot timeout themselves or the server owner
    if (member.id === interaction.user.id) {
      await interaction.editReply({ content: "❌ You cannot timeout yourself." });
      return;
    }
    if (member.id === interaction.guild?.ownerId) {
      await interaction.editReply({ content: "❌ You cannot timeout the server owner." });
      return;
    }

    // 3. Hierarchy Check 2: Executing moderator vs target member role position
    const executorMember = interaction.member as GuildMember;
    if (
      executorMember &&
      member.roles.highest.position >= executorMember.roles.highest.position &&
      interaction.guild?.ownerId !== interaction.user.id
    ) {
      await interaction.editReply({
        content: `❌ You cannot timeout **${member.user.tag}** because their role is equal to or higher than yours.`,
      });
      return;
    }

    // 4. Hierarchy Check 3: Bot's role position vs target member
    if (!member.moderatable) {
      await interaction.editReply({
        content: `❌ I cannot timeout **${member.user.tag}**. Check my role hierarchy and 'Moderate Members' permissions.`,
      });
      return;
    }

    // 5. Parse Duration
    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
      await interaction.editReply({
        content: "❌ Invalid duration. Maximum allowable Discord timeout is 28 days.",
      });
      return;
    }

    // 6. Notify the user via DM first (before communication is blocked)
    try {
      await member.send({
        content: `⏳ You have been timed out in **${interaction.guild?.name}** for **${durationStr}**.\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`,
      });
    } catch {
      // DMs blocked; safe to continue
    }

    // 7. Execute the timeout safely
    await member.timeout(durationMs, `${reason} | By ${interaction.user.tag}`);

    // 8. Confirm in interaction response
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("✅ User Timed Out")
      .setDescription(`Successfully applied timeout to **${member.user.tag}**.`)
      .addFields(
        { name: "Target", value: `<@${member.id}> (${member.id})`, inline: true },
        { name: "Duration", value: durationStr, inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error("[Command /timeout Error]:", error?.message || error);
    await interaction.editReply({
      content: `❌ An unexpected error occurred while applying timeout: ${error?.message || "Unknown error"}`,
    });
  }
}
