/* eslint-env node */

/*
 * ==========================================================
 * NEXUSAI • WELCOME & GOODBYE SYSTEM
 * ==========================================================
 *
 * Handles:
 *
 *  • New member welcome messages
 *  • Member departure messages
 *  • Dynamic welcome image generation
 *  • Dynamic goodbye image generation
 *  • Member-number / ordinal formatting
 *
 * This file is intentionally separate from discordBot.js
 * so the main bot class stays smaller and easier to maintain.
 *
 * ==========================================================
 */

import {
  EmbedBuilder,
  AttachmentBuilder
} from "discord.js";

import {
  createCanvas,
  loadImage
} from "@napi-rs/canvas";

/*
 * ==========================================================
 * CHANNEL CONFIGURATION
 * ==========================================================
 */

export const WELCOME_CHANNEL_ID =
  "1520540734065737959";

export const GOODBYE_CHANNEL_ID =
  "1521965788872052958";

/*
 * ==========================================================
 * BRAND CONFIGURATION
 * ==========================================================
 */

export const WELCOME_BRAND =
  "NexusAI";

export const WELCOME_MESSAGE =
  "I hope you have a great time without doing HW! 📚";

export const WELCOME_IMAGE_WIDTH =
  1200;

export const WELCOME_IMAGE_HEIGHT =
  450;

/*
 * ==========================================================
 * ORDINAL HELPER
 * ==========================================================
 */

export function getOrdinalSuffix(
  number
) {
  const remainder100 =
    number % 100;

  if (
    remainder100 >= 11 &&
    remainder100 <= 13
  ) {
    return "th";
  }

  switch (
    number % 10
  ) {
    case 1:
      return "st";

    case 2:
      return "nd";

    case 3:
      return "rd";

    default:
      return "th";
  }
}

/*
 * ==========================================================
 * MEMBER NUMBER
 * ==========================================================
 */

export function getMemberNumber(
  member
) {
  const count =
    Number(
      member?.guild?.memberCount
    );

  if (
    Number.isFinite(count) &&
    count > 0
  ) {
    return count;
  }

  return 0;
}

/*
 * ==========================================================
 * CANVAS HELPERS
 * ==========================================================
 */

/**
 * Draw a rounded rectangle.
 */
function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {
  const r =
    Math.min(
      radius,
      width / 2,
      height / 2
    );

  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    r
  );

  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    r
  );

  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    r
  );

  ctx.closePath();
}

/**
 * Draw centered text.
 */
function drawCenteredText(
  ctx,
  text,
  x,
  y
) {
  ctx.fillText(
    text,
    x,
    y
  );
}

/**
 * Try to load the member avatar.
 */
async function loadMemberAvatar(
  user
) {
  const avatarUrl =
    user.displayAvatarURL({
      extension:
        "png",

      size:
        256
    });

  try {
    return await loadImage(
      avatarUrl
    );
  } catch {
    return null;
  }
}

/*
 * ==========================================================
 * GENERATE WELCOME IMAGE
 * ==========================================================
 */

export async function createWelcomeCard(
  member
) {
  const width =
    WELCOME_IMAGE_WIDTH;

  const height =
    WELCOME_IMAGE_HEIGHT;

  const canvas =
    createCanvas(
      width,
      height
    );

  const ctx =
    canvas.getContext(
      "2d"
    );

  /*
   * --------------------------------------------------------
   * BACKGROUND
   * --------------------------------------------------------
   */

  const background =
    ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

  background.addColorStop(
    0,
    "#030303"
  );

  background.addColorStop(
    0.5,
    "#0b0b10"
  );

  background.addColorStop(
    1,
    "#030303"
  );

  ctx.fillStyle =
    background;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * --------------------------------------------------------
   * BLUE / PURPLE GLOW
   * --------------------------------------------------------
   */

  const glow =
    ctx.createRadialGradient(
      width / 2,
      20,
      20,
      width / 2,
      20,
      600
    );

  glow.addColorStop(
    0,
    "rgba(88,101,242,0.32)"
  );

  glow.addColorStop(
    0.45,
    "rgba(88,101,242,0.12)"
  );

  glow.addColorStop(
    1,
    "rgba(88,101,242,0)"
  );

  ctx.fillStyle =
    glow;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * --------------------------------------------------------
   * SUBTLE SIDE GLOW
   * --------------------------------------------------------
   */

  const sideGlow =
    ctx.createRadialGradient(
      width,
      height / 2,
      20,
      width,
      height / 2,
      450
    );

  sideGlow.addColorStop(
    0,
    "rgba(255,170,0,0.10)"
  );

  sideGlow.addColorStop(
    1,
    "rgba(255,170,0,0)"
  );

  ctx.fillStyle =
    sideGlow;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * --------------------------------------------------------
   * CARD BORDER
   * --------------------------------------------------------
   */

  roundedRect(
    ctx,
    10,
    10,
    width - 20,
    height - 20,
    28
  );

  ctx.strokeStyle =
    "rgba(255,255,255,0.08)";

  ctx.lineWidth =
    2;

  ctx.stroke();

  /*
   * --------------------------------------------------------
   * AVATAR
   * --------------------------------------------------------
   */

  const avatar =
    await loadMemberAvatar(
      member.user
    );

  const avatarX =
    width / 2;

  const avatarY =
    118;

  const avatarRadius =
    76;

  if (avatar) {
    /*
     * Outer glow.
     */
    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarX,
      avatarY,
      avatarRadius + 8,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "#5865F2";

    ctx.lineWidth =
      6;

    ctx.shadowColor =
      "#5865F2";

    ctx.shadowBlur =
      22;

    ctx.stroke();

    ctx.restore();

    /*
     * Avatar circle.
     */
    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarX,
      avatarY,
      avatarRadius,
      0,
      Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
      avatar,
      avatarX - avatarRadius,
      avatarY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );

    ctx.restore();
  }

  /*
   * --------------------------------------------------------
   * WELCOME
   * --------------------------------------------------------
   */

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "800 44px Arial";

  drawCenteredText(
    ctx,
    `Welcome ${member.user.displayName}!`,
    width / 2,
    275
  );

  /*
   * --------------------------------------------------------
   * MEMBER NUMBER
   * --------------------------------------------------------
   */

  const memberNumber =
    getMemberNumber(
      member
    );

  const ordinal =
    memberNumber > 0
      ? `${memberNumber.toLocaleString()}${getOrdinalSuffix(memberNumber)}`
      : "a new";

  ctx.fillStyle =
    "#b8b8c0";

  ctx.font =
    "600 25px Arial";

  drawCenteredText(
    ctx,
    `You are the ${ordinal} member of NexusAI`,
    width / 2,
    320
  );

  /*
   * --------------------------------------------------------
   * FUN MESSAGE
   * --------------------------------------------------------
   */

  ctx.fillStyle =
    "#888892";

  ctx.font =
    "500 21px Arial";

  drawCenteredText(
    ctx,
    WELCOME_MESSAGE,
    width / 2,
    365
  );

  /*
   * --------------------------------------------------------
   * BRAND
   * --------------------------------------------------------
   */

  ctx.fillStyle =
    "#5865F2";

  ctx.font =
    "800 18px Arial";

  drawCenteredText(
    ctx,
    "🥭 NEXUSAI",
    width / 2,
    412
  );

  /*
   * --------------------------------------------------------
   * PNG
   * --------------------------------------------------------
   */

  return canvas.toBuffer(
    "image/png"
  );
}

/*
 * ==========================================================
 * GENERATE GOODBYE IMAGE
 * ==========================================================
 */

export async function createGoodbyeCard(
  member
) {
  const width =
    WELCOME_IMAGE_WIDTH;

  const height =
    WELCOME_IMAGE_HEIGHT;

  const canvas =
    createCanvas(
      width,
      height
    );

  const ctx =
    canvas.getContext(
      "2d"
    );

  /*
   * Background.
   */

  const background =
    ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

  background.addColorStop(
    0,
    "#030303"
  );

  background.addColorStop(
    0.5,
    "#100507"
  );

  background.addColorStop(
    1,
    "#030303"
  );

  ctx.fillStyle =
    background;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * Red glow.
   */

  const glow =
    ctx.createRadialGradient(
      width / 2,
      25,
      20,
      width / 2,
      25,
      600
    );

  glow.addColorStop(
    0,
    "rgba(237,66,69,0.25)"
  );

  glow.addColorStop(
    0.45,
    "rgba(237,66,69,0.10)"
  );

  glow.addColorStop(
    1,
    "rgba(237,66,69,0)"
  );

  ctx.fillStyle =
    glow;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * Border.
   */

  roundedRect(
    ctx,
    10,
    10,
    width - 20,
    height - 20,
    28
  );

  ctx.strokeStyle =
    "rgba(255,255,255,0.08)";

  ctx.lineWidth =
    2;

  ctx.stroke();

  /*
   * Avatar.
   */

  const avatar =
    await loadMemberAvatar(
      member.user
    );

  const avatarX =
    width / 2;

  const avatarY =
    118;

  const avatarRadius =
    76;

  if (avatar) {
    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarX,
      avatarY,
      avatarRadius + 8,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "#ED4245";

    ctx.lineWidth =
      6;

    ctx.shadowColor =
      "#ED4245";

    ctx.shadowBlur =
      22;

    ctx.stroke();

    ctx.restore();

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarX,
      avatarY,
      avatarRadius,
      0,
      Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
      avatar,
      avatarX - avatarRadius,
      avatarY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );

    ctx.restore();
  }

  /*
   * Goodbye text.
   */

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "800 44px Arial";

  drawCenteredText(
    ctx,
    `Goodbye ${member.user.displayName}!`,
    width / 2,
    275
  );

  /*
   * Departure message.
   */

  ctx.fillStyle =
    "#b8b8c0";

  ctx.font =
    "600 25px Arial";

  drawCenteredText(
    ctx,
    "Thanks for being part of NexusAI",
    width / 2,
    320
  );

  /*
   * Farewell.
   */

  ctx.fillStyle =
    "#888892";

  ctx.font =
    "500 21px Arial";

  drawCenteredText(
    ctx,
    "We hope to see you again! 👋",
    width / 2,
    365
  );

  /*
   * Brand.
   */

  ctx.fillStyle =
    "#ED4245";

  ctx.font =
    "800 18px Arial";

  drawCenteredText(
    ctx,
    "🥭 NEXUSAI",
    width / 2,
    412
  );

  return canvas.toBuffer(
    "image/png"
  );
}

/*
 * ==========================================================
 * GET CHANNEL
 * ==========================================================
 */

async function getTextChannel(
  client,
  channelId
) {
  if (!client) {
    return null;
  }

  let channel =
    client.channels.cache.get(
      channelId
    );

  if (!channel) {
    channel =
      await client.channels
        .fetch(
          channelId
        )
        .catch(
          () => null
        );
  }

  if (
    !channel ||
    !channel.isTextBased()
  ) {
    return null;
  }

  return channel;
}

/*
 * ==========================================================
 * SEND WELCOME MESSAGE
 * ==========================================================
 */

export async function sendWelcomeMessage(
  client,
  member,
  logger
) {
  try {
    if (
      !member?.user ||
      !member?.guild
    ) {
      return null;
    }

    const channel =
      await getTextChannel(
        client,
        WELCOME_CHANNEL_ID
      );

    if (!channel) {
      logger?.warn?.(
        {
          channelId:
            WELCOME_CHANNEL_ID,

          userId:
            member.user.id,

          guildId:
            member.guild.id
        },
        "Welcome channel could not be found"
      );

      return null;
    }

    const memberNumber =
      getMemberNumber(
        member
      );

    const memberText =
      memberNumber > 0
        ? `You are the **${memberNumber.toLocaleString()}${getOrdinalSuffix(memberNumber)} member** in **NexusAI**!`
        : "Welcome to **NexusAI**!";

    const image =
      await createWelcomeCard(
        member
      );

    const attachment =
      new AttachmentBuilder(
        image,
        {
          name:
            "nexusai-welcome.png"
        }
      );

    const embed =
      new EmbedBuilder()
        .setColor(
          "#57F287"
        )

        .setTitle(
          "👋 Welcome to NexusAI!"
        )

        .setDescription(
          [
            `Welcome ${member}! 🥭`,
            "",
            memberText,
            "",
            "I hope you have a great time without doing HW! 📚"
          ].join(
            "\n"
          )
        )

        .setImage(
          "attachment://nexusai-welcome.png"
        )

        .setFooter({
          text:
            "🥭 NexusAI • Welcome"
        })

        .setTimestamp();

    const message =
      await channel.send({
        content:
          `👋 Welcome ${member}!`,

        embeds: [
          embed
        ],

        files: [
          attachment
        ]
      });

    logger?.info?.(
      {
        guildId:
          member.guild.id,

        userId:
          member.user.id,

        username:
          member.user.username,

        memberNumber,

        messageId:
          message.id
      },

      "👋 Welcome message sent"
    );

    return message;
  } catch (error) {
    logger?.error?.(
      {
        error:
          error?.message,

        stack:
          error?.stack,

        userId:
          member?.user?.id,

        guildId:
          member?.guild?.id
      },

      "Failed to send welcome message"
    );

    return null;
  }
}

/*
 * ==========================================================
 * SEND GOODBYE MESSAGE
 * ==========================================================
 */

export async function sendGoodbyeMessage(
  client,
  member,
  logger
) {
  try {
    if (
      !member?.user
    ) {
      return null;
    }

    const channel =
      await getTextChannel(
        client,
        GOODBYE_CHANNEL_ID
      );

    if (!channel) {
      logger?.warn?.(
        {
          channelId:
            GOODBYE_CHANNEL_ID,

          userId:
            member.user.id
        },

        "Goodbye channel could not be found"
      );

      return null;
    }

    const image =
      await createGoodbyeCard(
        member
      );

    const attachment =
      new AttachmentBuilder(
        image,
        {
          name:
            "nexusai-goodbye.png"
        }
      );

    const embed =
      new EmbedBuilder()
        .setColor(
          "#ED4245"
        )

        .setTitle(
          "👋 Goodbye from NexusAI"
        )

        .setDescription(
          [
            `**${member.user.username}** has left **NexusAI**.`,

            "",

            "Thanks for being part of the community.",

            "",

            "We hope to see you again someday! 👋"
          ].join(
            "\n"
          )
        )

        .setImage(
          "attachment://nexusai-goodbye.png"
        )

        .setFooter({
          text:
            "🥭 NexusAI • Goodbye"
        })

        .setTimestamp();

    const message =
      await channel.send({
        embeds: [
          embed
        ],

        files: [
          attachment
        ]
      });

    logger?.info?.(
      {
        guildId:
          member?.guild?.id,

        userId:
          member.user.id,

        username:
          member.user.username,

        messageId:
          message.id
      },

      "👋 Goodbye message sent"
    );

    return message;
  } catch (error) {
    logger?.error?.(
      {
        error:
          error?.message,

        stack:
          error?.stack,

        userId:
          member?.user?.id,

        guildId:
          member?.guild?.id
      },

      "Failed to send goodbye message"
    );

    return null;
  }
}

/*
 * ==========================================================
 * REGISTER DISCORD EVENTS
 * ==========================================================
 */

export function setupWelcomeEvents(
  client,
  logger
) {
  if (!client) {
    throw new Error(
      "Discord client is required."
    );
  }

  if (
    client.__nexusWelcomeEventsRegistered
  ) {
    return;
  }

  client.__nexusWelcomeEventsRegistered =
    true;

  client.on(
    "guildMemberAdd",
    async member => {
      await sendWelcomeMessage(
        client,
        member,
        logger
      );
    }
  );

  client.on(
    "guildMemberRemove",
    async member => {
      await sendGoodbyeMessage(
        client,
        member,
        logger
      );
    }
  );

  logger?.info?.(
    {
      welcomeChannelId:
        WELCOME_CHANNEL_ID,

      goodbyeChannelId:
        GOODBYE_CHANNEL_ID
    },

    "✅ NexusAI welcome/goodbye events registered"
  );
}

/*
 * ==========================================================
 * DEFAULT EXPORT
 * ==========================================================
 */

export default {
  WELCOME_CHANNEL_ID,
  GOODBYE_CHANNEL_ID,
  WELCOME_BRAND,
  WELCOME_MESSAGE,
  WELCOME_IMAGE_WIDTH,
  WELCOME_IMAGE_HEIGHT,
  TOS_VERSION: undefined,
  getOrdinalSuffix,
  getMemberNumber,
  createWelcomeCard,
  createGoodbyeCard,
  sendWelcomeMessage,
  sendGoodbyeMessage,
  setupWelcomeEvents
};