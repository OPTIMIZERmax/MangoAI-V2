import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

console.log("Discord client created");

console.log("Token exists:",
  Boolean(process.env.DISCORD_TOKEN)
);

client.destroy();

console.log("✅ Discord.js working");