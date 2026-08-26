import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} from "discord.js";

import { dispatchSparxLogin } from "../bot/sparxLoginBridge.js";

import logger from "../utils/logger.js";
import SavedAccountManager from "./SavedAccountManager.js";

export default class LoginService {

  constructor(app) {
  this.app = app;
  this.pendingLogins = new Map();

  this.savedAccountManager = new SavedAccountManager();
}

  parseCookies(input) {
  const value = String(input || "").trim();

  if (!value) {
    throw new Error("No cookies were provided.");
  }

  // Cookie Editor JSON export
  if (value.startsWith("[")) {
    const cookies = JSON.parse(value);

    if (!Array.isArray(cookies)) {
      throw new Error("Cookie JSON must be an array.");
    }

    return cookies;
  }

  // Cookie header:
  // name=value; name2=value2
  return value
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separator = part.indexOf("=");

      if (separator === -1) {
        throw new Error(`Invalid cookie: ${part}`);
      }

      return {
        name: part.slice(0, separator).trim(),
        value: part.slice(separator + 1).trim()
      };
    });
}

  setPlatformService(platformService) {
  this.platformService = platformService;
}

  async openCookieModal(interaction, platform) {
  const modal = new ModalBuilder()
    .setCustomId(`cookie_login_${platform}`)
    .setTitle(`🍪 ${platform} Cookie Login`);

  const cookiesInput = new TextInputBuilder()
    .setCustomId("cookies_input")
    .setLabel("Cookie Editor JSON")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('[{"name":"...","value":"...","domain":"..."}]')
    .setRequired(true)
    .setMaxLength(4000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(cookiesInput)
  );

  await interaction.showModal(modal);
}

  async handleCookieModal(interaction) {
  const platform = interaction.customId.replace("cookie_login_", "");

  try {
    const input = interaction.fields.getTextInputValue("cookies_input");

    const cookies = this.parseCookies(input);

    if (!cookies.length) {
      throw new Error("No cookies found.");
    }

    logger.info(
      {
        platform,
        cookieCount: cookies.length
      },
      "Cookie login submitted"
    );

    const payload = {
      adapter: platform,
      action: "login",
      platform,
      method: "cookies",
      cookies
    };

    await this.dispatchPlatformLogin(platform, payload);

    await interaction.reply({
      content: [
        "🍪 **Cookie login submitted successfully!**",
        "",
        `**Platform:** ${platform}`,
        `**Cookies detected:** ${cookies.length}`,
        "",
        "🔄 The platform adapter will now verify the session."
      ].join("\n"),
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error(
      {
        error: error.message,
        platform
      },
      "Cookie login failed"
    );

    await interaction.reply({
      content: `❌ **Cookie login failed:** ${error.message}`,
      flags: MessageFlags.Ephemeral
    });
  }
}

  async handleSavedAccounts(interaction, platform) {
      await interaction.reply({
        content: `💾 Fetching saved accounts for **${platform}**... Select an account from your saved `.concat(`.env profile.`),
        flags: MessageFlags.Ephemeral
      });
    }

  async dispatchPlatformLogin(platform, payload) {
      const normalizedPlatform = String(platform || '').trim();
      const basePayload = {
  action: 'login',
  platform: normalizedPlatform,
  ...payload
};
  
      if (this.platformService?.login) {
        logger.info({ platform: normalizedPlatform }, 'Dispatching login through PlatformService');
        return this.platformService.login(normalizedPlatform, basePayload, { source: 'discordBot' });
      }
  
      if (this.app?.engine) {
        logger.info({ platform: normalizedPlatform }, 'Falling back to sparxLoginBridge dispatch');
        return dispatchSparxLogin(this.app.engine, basePayload);
      }
  
      logger.warn({ platform: normalizedPlatform }, 'No platform service or engine available for login dispatch');
      return null;
    }

    async handleLoginModal(interaction) {
  const platform = interaction.customId.replace("school_login_", "");
  const school = interaction.fields.getTextInputValue("school");
  const login = interaction.fields.getTextInputValue("login");
  const password = interaction.fields.getTextInputValue("password");

  try {
    const payload = {
      adapter: "sparx",
      action: "login",
      platform,
      school,
      method: "password",
      username: login,
      password
    };

    await this.dispatchPlatformLogin(platform, payload);

    await interaction.reply({
      content:
`✅ Login request submitted successfully!

**Platform:** ${platform}
**School:** ${school}
**Username:** ${login}
**Password:** Received securely ✅`,
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error(
      { error: error.message, platform },
      "Failed to dispatch login"
    );

    await interaction.reply({
      content: `❌ Failed to submit login request: ${error.message}`,
      flags: MessageFlags.Ephemeral
    });
  }
}
}