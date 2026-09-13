import {
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
    // 1. Record strike in lightweight in-memory store
    const { record, thresholdReached } = strikeStore.addStrike(
      guildId,
      targetUser.id,
      reason,
      "MANUAL_STAFF"
    );

    // 2. DM the user
    let dmDelivered = true;
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle(`⚠️ Official Warning: ${interaction.guild?.name}`)
        .setDescription(`You have received a formal disciplinary strike from staff.`)
        .addFields(
          { name: "Reason", value: reason },
          { name: "Staff Member", value: interaction.user.tag, inline: true },
          { name: "Strike Count", value: `**${record.count}** / ${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}`, inline: true }
        )
        .setFooter({ text: "Continued violations will result in automated timeout or ban." })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch {
      dmDelivered = false;
    }

    // 3. Check if auto-action should trigger
    let actionEscalated = false;
    if (thresholdReached) {
      const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
      if (member?.moderatable) {
        const timeoutMinutes = parseInt(process.env.TIMEOUT_DURATION_MINUTES || "10", 10);
        await member.timeout(
          timeoutMinutes * 60 * 1000,
          `Exceeded maximum allowed strikes (${record.count})`
        );
        actionEscalated = true;
      }
    }

    // 4. Staff confirmation response
    const confirmEmbed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle("⚠️ Warning Logged")
      .setDescription(`Successfully logged a strike against **${targetUser.tag}**.`)
      .addFields(
        { name: "Target", value: `<@${targetUser.id}>`, inline: true },
        { name: "Total Strikes", value: `**${record.count}** / ${process.env.MAX_STRIKES_BEFORE_TIMEOUT || 3}`, inline: true },
        { name: "DM Status", value: dmDelivered ? "Delivered" : "Blocked/Failed", inline: true },
        { name: "Reason", value: reason },
        { name: "Auto-Escalation", value: actionEscalated ? "🚨 Target timed out (Threshold reached)" : "None" }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [confirmEmbed] });
  } catch (error: any) {
    console.error("[Command /warn Error]:", error?.message || error);
    await interaction.editReply({
      content: `❌ Error logging warning: ${error?.message || "Unknown error"}`,
    });
  }
}
