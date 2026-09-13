import {
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

    // Hierarchy checks if target is currently a member
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
          content: `❌ You cannot ban **${member.user.tag}** because their role is equal to or higher than yours.`,
        });
        return;
      }

      if (!member.bannable) {
        await interaction.editReply({
          content: `❌ I cannot ban **${member.user.tag}**. Please verify my role permissions and position.`,
        });
        return;
      }

      // Send DM notification before ban
      try {
        await targetUser.send({
          content: `🔨 You have been banned from **${interaction.guild?.name}**.\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`,
        });
      } catch {}
    }

    // Execute Guild Ban
    await interaction.guild?.members.ban(targetUser.id, {
      deleteMessageSeconds: deleteDays * 86400,
      reason: `${reason} | By ${interaction.user.tag}`,
    });

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("🔨 User Banned")
      .setDescription(`Successfully banned **${targetUser.tag}** from the server.`)
      .addFields(
        { name: "User", value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
        { name: "Deleted History", value: `${deleteDays} days`, inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error("[Command /ban Error]:", error?.message || error);
    await interaction.editReply({
      content: `❌ Failed to execute ban: ${error?.message || "Unknown error"}`,
    });
  }
}
