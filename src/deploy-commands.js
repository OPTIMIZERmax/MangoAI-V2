import "dotenv/config";
import { REST, Routes } from "discord.js";
import commands from "./bot/commands.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) {
  console.error("Missing DISCORD_TOKEN in your environment.");
  process.exit(1);
}

if (!clientId) {
  console.error("Missing DISCORD_CLIENT_ID in your environment.");
  process.exit(1);
}

if (!guildId) {
  console.error("Missing DISCORD_GUILD_ID in your environment.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

const route = guildId
  ? Routes.applicationGuildCommands(clientId, guildId)
  : Routes.applicationCommands(clientId);

try {
  await rest.put(route, {
    body: commands
  });

  console.log(
    guildId
      ? `Deployed ${commands.length} slash command(s) to guild ${guildId}.`
      : `Deployed ${commands.length} global slash command(s).`
  );
} catch (error) {
  console.error("Failed to deploy commands:", error);
  process.exit(1);
}
