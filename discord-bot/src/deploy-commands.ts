import { REST, Routes } from "discord.js";
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
    console.log(`📡 Registering ${commands.length} slash commands with Discord API...`);

    if (guildId) {
      // Guild-specific (instant update, perfect for testing)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`✅ Successfully deployed commands to Guild: ${guildId}`);
    } else {
      // Global deployment
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log(`✅ Successfully deployed commands globally across all servers!`);
    }
  } catch (error: any) {
    console.error("❌ Failed to deploy commands:", error?.message || error);
    process.exit(1);
  }
}

deploy();
