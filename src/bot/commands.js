import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Show the bot status"),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Start verification flow"),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete recent messages in this channel")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName("addprize")
    .setDescription("Dev only: add a reward to the arcade")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Prize name")
        .setRequired(true)
        .setMaxLength(80)
    )
    .addIntegerOption((option) =>
      option
        .setName("cost")
        .setDescription("How many arcade points the prize costs")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000000)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("What the prize includes")
        .setRequired(true)
        .setMaxLength(300)
    )
].map((command) => command.toJSON());

export default commands;