/*
 * ==========================================================
 * NEXUSAI TERMS OF SERVICE
 * ==========================================================
 *
 * Centralized Terms of Service configuration.
 *
 * Keep all TOS-related text and configuration in this file
 * so discordBot.js does not need to contain a large legal
 * text block.
 *
 * ==========================================================
 */

/**
 * TOS channel
 *
 * NexusAI will use this channel for the Terms of Service
 * panel.
 */
export const TOS_CHANNEL_ID =
  "1515668738249068554";

/**
 * Current TOS version.
 *
 * Increment this whenever the terms are materially changed.
 */
export const TOS_VERSION =
  "1.0";

/**
 * TOS title.
 */
export const TOS_TITLE =
  "📜 NexusAI • Terms of Service";

/**
 * TOS content.
 */
export const TOS_TEXT = [
  "By using **NexusAI**, you acknowledge that you have read and understood these terms.",
  "",

  "### 🎓 Educational Use",

  "NexusAI is an independent educational service intended to assist with learning, revision, and educational productivity.",

  "",

  "### ⚠️ School & Educational Institution Responsibility",

  "NexusAI, its creators, developers, maintainers, and contributors are not responsible for consequences arising from your use of the service at school, college, or another educational institution.",

  "",

  "This may include, but is not limited to:",

  "• Disciplinary action",
  "• Detention or suspension",
  "• Loss of school or account privileges",
  "• Academic consequences",
  "• School policy violations",
  "• Device or network restrictions",
  "• Account restrictions",
  "• Any other action taken by an educational institution",

  "",

  "You are responsible for understanding and following the rules, policies, and acceptable-use requirements of your school or educational institution.",

  "",

  "### 🔐 Account & Credential Security",

  "Never provide your Discord password, Discord authentication token, or other sensitive credentials to NexusAI or anyone claiming to represent NexusAI.",

  "",

  "You are responsible for protecting your accounts and for activity performed through them.",

  "",

  "### 🤖 AI & Automated Features",

  "NexusAI may provide automated or AI-generated information. You are responsible for reviewing information before relying on or acting upon it.",

  "",

  "NexusAI does not guarantee that generated answers, solutions, recommendations, or other automated outputs are always accurate or appropriate.",

  "",

  "### 🚫 Misuse",

  "You agree not to use NexusAI to violate applicable laws, school policies, platform rules, or the rights of other people.",

  "",

  "### 🛡️ Verification",

  "NexusAI verification is performed through the official NexusAI verification website and associated security systems.",

  "",

  "The Discord bot does not provide an alternative verification route. Attempts to bypass the verification process may result in access being denied.",

  "",

  "### 📌 Acceptance",

  "By accessing or using NexusAI, you acknowledge that you have read and understood these terms and accept responsibility for your own use of the service."
].join(
  "\n"
);

/**
 * Optional shorter text for the verification panel.
 *
 * This is intentionally much shorter than the full TOS.
 */
export const TOS_SHORT_TEXT = [
  "📜 **Terms of Service**",
  "",
  "By continuing to use NexusAI, you acknowledge the NexusAI Terms of Service.",
  "",
  "NexusAI and its creators/developers are not responsible for consequences arising from your use of the service at school or other educational institutions.",
  "",
  `Terms version: **${TOS_VERSION}**`
].join(
  "\n"
);