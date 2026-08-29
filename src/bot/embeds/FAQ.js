import {
  EmbedBuilder
} from "discord.js";

/*
 * ==========================================================
 * NEXUSAI • FAQ
 * ==========================================================
 */

export const FAQ_CHANNEL_ID =
  "1535025670466310394";

export const FAQ_TITLE =
  "❓ NexusAI • Frequently Asked Questions";

export const FAQ_VERSION =
  "1.0";

export const FAQ_TEXT = [
  "Welcome to the **NexusAI FAQ**.",
  "",
  "Here are answers to some of the most common questions.",
  "",
  "### 🛡️ How do I verify?",
  "Go to the verification channel and click **Verify on Website**. Complete the security checks and connect your Discord account.",
  "",
  "### 👤 Why do I need to verify?",
  "Verification helps protect the server from bots, spam, automated accounts, and unwanted access.",
  "",
  "### 📅 Why does my Discord account need to be at least 30 days old?",
  "NexusAI requires Discord accounts to be at least **30 days old** before verification can be completed.",
  "",
  "### ✅ What happens after I verify?",
  "Once verification is successfully completed, the **Verified** role is assigned automatically and the **Unverified** role is removed.",
  "",
  "### 🔗 Where is verification completed?",
  "Verification is completed through the official NexusAI verification website.",
  "",
  "### 🔐 Does NexusAI need my Discord password?",
  "**No.** NexusAI will never ask for your Discord password or Discord authentication token.",
  "",
  "### 📚 What is NexusAI?",
  "NexusAI is an educational platform designed to provide learning tools, homework assistance, revision support, and other educational features.",
  "",
  "### 🎓 Can I use NexusAI at school?",
  "You are responsible for following your school's rules and acceptable-use policies. Please read the NexusAI Terms of Service before using the service.",
  "",
  "### 🆘 I am having a problem. What should I do?",
  "Please contact the NexusAI support team through the server's support system or create a support ticket.",
  "",
  "### 🥭 Who runs NexusAI?",
  "NexusAI is maintained by its creators, developers, and contributors.",
  "",
  "### 📌 Still need help?",
  "Contact the NexusAI support team and provide as much useful information as possible."
].join(
  "\n"
);

export function buildFAQEmbed() {
  return new EmbedBuilder()
    .setColor(
      "#5865F2"
    )
    .setTitle(
      FAQ_TITLE
    )
    .setDescription(
      FAQ_TEXT
    )
    .setFooter({
      text:
        `🥭 NexusAI • FAQ v${FAQ_VERSION}`
    })
    .setTimestamp();
}

export async function sendFAQPanel(
  client,
  logger
) {
  try {
    if (!client) {
      throw new Error(
        "Discord client is required."
      );
    }

    let channel =
      client.channels.cache.get(
        FAQ_CHANNEL_ID
      );

    if (!channel) {
      channel =
        await client.channels
          .fetch(
            FAQ_CHANNEL_ID
          )
          .catch(
            () => null
          );
    }

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      logger?.warn?.(
        {
          channelId:
            FAQ_CHANNEL_ID
        },
        "FAQ channel could not be found"
      );

      return null;
    }

    /*
     * Remove previous NexusAI FAQ panels so restarts
     * don't create duplicates.
     */
    try {
      const messages =
        await channel.messages.fetch({
          limit:
            100
        });

      const oldFAQPanels =
        messages.filter(
          message =>
            message.author?.id ===
              client.user?.id &&
            message.embeds?.some(
              embed =>
                embed.title ===
                FAQ_TITLE
            )
        );

      for (
        const message of
          oldFAQPanels.values()
      ) {
        await message
          .delete()
          .catch(
            () => {}
          );
      }
    } catch (error) {
      logger?.warn?.(
        {
          error:
            error?.message,

          channelId:
            FAQ_CHANNEL_ID
        },
        "Could not clean previous FAQ panels"
      );
    }

    const message =
      await channel.send({
        embeds: [
          buildFAQEmbed()
        ]
      });

    logger?.info?.(
      {
        channelId:
          FAQ_CHANNEL_ID,

        messageId:
          message.id,

        version:
          FAQ_VERSION
      },
      "✅ NexusAI FAQ panel sent"
    );

    return message;
  } catch (error) {
    logger?.error?.(
      {
        error:
          error?.message,

        stack:
          error?.stack
      },
      "Failed to send FAQ panel"
    );

    return null;
  }
}

export default {
  FAQ_CHANNEL_ID,
  FAQ_TITLE,
  FAQ_VERSION,
  FAQ_TEXT,
  buildFAQEmbed,
  sendFAQPanel
};