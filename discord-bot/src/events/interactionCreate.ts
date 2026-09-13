import { Interaction, Collection, ChatInputCommandInteraction } from "discord.js";

export async function handleInteractionCreate(
  interaction: Interaction,
  commands: Collection<string, { execute: (interaction: ChatInputCommandInteraction) => Promise<void> }>
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[Command Router] Unregistered command received: /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error: any) {
    console.error(`[Command Error] Error in /${interaction.commandName}:`, error?.message || error);
    
    // Prevent unhandled rejection if interaction failed or timed out
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
}
