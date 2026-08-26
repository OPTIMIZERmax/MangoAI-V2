/* eslint-env node */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
  AttachmentBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder
} from "discord.js";

import {
  ContainerFactory,
  EmbedFactory,
  ActionRowFactory
} from "./embedFactory.js";

import logger from "../utils/logger.js";
import config from "../utils/config.js";

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
 * ============================================================
 * VERIFICATION CONFIGURATION
 * ============================================================
 *
 * Verification panel is always sent to this channel.
 */
const VERIFICATION_CHANNEL_ID =
  "1519734400730796252";

/*
 * Set this in .env:
 *
 * VERIFIED_ROLE_ID=YOUR_VERIFIED_ROLE_ID
 */
const VERIFIED_ROLE_ID =
  process.env.VERIFIED_ROLE_ID ?? null;

export class DiscordBot {
  constructor() {
  this.client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences
    ]
  });

  // ========================================================
  // APPLICATION STATE
  // ========================================================

  this.commandHandler = null;
  this.app = null;
  this.platformService = null;
  this.loginService = null;

  this.activeSessions = new Map();
  this.pendingLogins = new Map();

 // ========================================================
// VERIFICATION STATE
// ========================================================

/*
 * userId -> {
 *   step: 1 | 2 | 3,
 *   answer: string | null,
 *   attempts: number,
 *   createdAt: number,
 *   expiresAt: number
 * }
 */
this.verificationSessions = new Map();

  // ========================================================
  // TIMERS
  // ========================================================

  this.scheduleLoop = null;
  this.presenceInterval = null;

  this.setupEventHandlers();
}

// ==========================================================
// DEPENDENCY INJECTION
// ==========================================================

setCommandHandler(handler) {
  this.commandHandler = handler;
}

setApp(app) {
  this.app = app;
}

setPlatformService(platformService) {
  this.platformService = platformService;
}

setLoginService(loginService) {
  this.loginService = loginService;
}

// ==========================================================
// EVENT HANDLERS
// ==========================================================

setupEventHandlers() {
  this.setupReadyHandler();
  this.setupInteractionHandler();
  this.setupMessageHandler();
  this.setupErrorHandler();
}

// ==========================================================
// READY
// ==========================================================

setupReadyHandler() {
  this.client.once("clientReady", async () => {
    try {
      const username =
        this.client.user?.username ??
        "Unknown";

      logger.info(
        { username },
        "Discord bot is ready"
      );

      this.setPresence();

      // ======================================================
      // VERIFICATION PANEL
      // ======================================================

      try {
        await this.sendVerificationPanel();
      } catch (error) {
        logger.error(
          {
            error: error?.message,
            stack: error?.stack
          },
          "Failed to send verification panel"
        );
      }

    } catch (error) {
      logger.error(
        {
          error: error?.message,
          stack: error?.stack
        },
        "Discord ready handler failed"
      );
    }
  });
}

  // ==========================================================
  // INTERACTION HANDLER
  // ==========================================================

  setupInteractionHandler() {
    this.client.on(
      "interactionCreate",
      async interaction => {
        try {
          // --------------------------------------------------
          // BUTTONS
          // --------------------------------------------------

          if (
            interaction.isButton()
          ) {
            await this.handleButtonInteraction(
              interaction
            );

            return;
          }

          // --------------------------------------------------
          // SELECT MENUS
          // --------------------------------------------------

          if (
            interaction.isStringSelectMenu()
          ) {
            await this.handleSelectMenuInteraction(
              interaction
            );

            return;
          }

          // --------------------------------------------------
          // MODALS
          // --------------------------------------------------

          if (
            interaction.isModalSubmit()
          ) {
            if (
              interaction.customId.startsWith(
                "school_login_"
              )
            ) {
              await this.handleLoginModal(
                interaction
              );

              return;
            }

                        if (
              interaction.customId.startsWith(
                "cookie_login_"
              )
            ) {
              await this.handleCookieModalSubmit(
                interaction
              );

              return;
            }
          }
        } catch (error) {
          logger.error(
            {
              error:
                error?.message,
              stack:
                error?.stack,
              customId:
                interaction?.customId,
              interactionType:
                interaction?.type,
              userId:
                interaction?.user?.id,
              username:
                interaction?.user?.username
            },
            "Interaction handler failed"
          );

          try {
            if (
              interaction.deferred ||
              interaction.replied
            ) {
              await interaction
                .followUp({
                  content:
                    "❌ Something went wrong while processing that action.",
                  flags:
                    MessageFlags.Ephemeral
                })
                .catch(() => {});
            } else {
              await interaction
                .reply({
                  content:
                    "❌ Something went wrong while processing that action.",
                  flags:
                    MessageFlags.Ephemeral
                })
                .catch(() => {});
            }
          } catch {
            // Ignore secondary interaction errors.
          }
        }
      }
    );
  }

  // ==========================================================
  // MESSAGE HANDLER
  // ==========================================================

  setupMessageHandler() {
    this.client.on(
      "messageCreate",
      async message => {
        try {
          if (
            message.author?.bot
          ) {
            return;
          }

          if (
            !message.content?.trim()
          ) {
            return;
          }

          // --------------------------------------------------
          // PLATFORM QUESTION CHANNELS
          // --------------------------------------------------

          const platformChannels = {
            "sparx-maths":
              "sparxMaths",

            "science-reader":
              "science",

            educake:
              "educake",

            drfrost:
              "drfrost",

            seneca:
              "seneca",

            languagenut:
              "languagenut"
          };

          const platform =
            platformChannels[
              message.channel?.name
            ];

          if (platform) {
            await this.handlePlatformQuestion(
              message,
              platform
            );

            return;
          }

          // --------------------------------------------------
          // PREFIX COMMANDS
          // --------------------------------------------------

          const prefix =
            config.discord.prefix;

          if (
            !prefix ||
            !message.content.startsWith(
              prefix
            )
          ) {
            return;
          }

          const content =
            message.content
              .slice(prefix.length)
              .trim();

          if (!content) {
            return;
          }

          const args =
            content.split(/\s+/);

          const command =
            args
              .shift()
              ?.toLowerCase();

          if (!command) {
            return;
          }

          await this.handleCommand(
            command,
            args,
            message
          );
        } catch (error) {
          logger.error(
            {
              error:
                error?.message,
              stack:
                error?.stack,
              messageId:
                message?.id,
              channelId:
                message?.channel?.id,
              authorId:
                message?.author?.id
            },
            "Message handler failed"
          );

          try {
            await this.replyToChannel(
              message,
              {
                content:
                  `❌ ${error?.message ?? "An unexpected error occurred."}`
              }
            );
          } catch {
            // Ignore secondary reply failures.
          }
        }
      }
    );
  }

  // ==========================================================
  // DISCORD CLIENT ERRORS
  // ==========================================================

  setupErrorHandler() {
    this.client.on(
      "error",
      error => {
        logger.error(
          {
            error:
              error?.message,
            name:
              error?.name,
            code:
              error?.code,
            status:
              error?.status,
            stack:
              error?.stack
          },
          "Discord client error"
        );
      }
    );
  }

  // ==========================================================
  // PLATFORM QUESTION HANDLER
  // ==========================================================

  async handlePlatformQuestion(
    message,
    platform
  ) {
    const question =
      message.content.trim();

    if (!question) {
      return;
    }

    const embed =
      new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(
          "🥭 NexusAI • Question Received"
        )
        .addFields(
          {
            name:
              "Platform",
            value:
              String(platform),
            inline:
              true
          },
          {
            name:
              "Student",
            value:
              message.author.username,
            inline:
              true
          },
          {
            name:
              "Question",
            value:
              question
          }
        )
        .setTimestamp()
        .setFooter({
          text:
            "NexusAI Learning Platform"
        });

    await message.channel.send({
      embeds: [
        embed
      ]
    });
  }

    // ==========================================================
  // WEBSITE VERIFICATION PANEL
  // ==========================================================
  //
  // Verification is handled by:
  //
  // Discord
  //   ↓
  // Components V2 panel
  //   ↓
  // Verify on Website
  //
  // Website
  //   ↓
  // Cloudflare Turnstile
  //   ↓
  // NexusAI Challenge
  //   ↓
  // Discord OAuth
  //
  // Cloudflare Worker
  //   ↓
  // 30-day account-age check
  //   ↓
  // Verified role
  //
  // The Discord bot NEVER assigns the Verified role.
  // ==========================================================

  async sendVerificationPanel() {
    const channel =
      this.client.channels.cache.get(
        VERIFICATION_CHANNEL_ID
      ) ??
      await this.client.channels
        .fetch(
          VERIFICATION_CHANNEL_ID
        )
        .catch(
          () => null
        );

    if (!channel) {
      logger.warn(
        {
          channelId:
            VERIFICATION_CHANNEL_ID
        },
        "Verification channel was not found"
      );

      return null;
    }

    if (
      !channel.isTextBased()
    ) {
      logger.warn(
        {
          channelId:
            VERIFICATION_CHANNEL_ID
        },
        "Verification channel is not text-based"
      );

      return null;
    }

    // ========================================================
    // CLEAN OLD VERIFICATION PANELS
    // ========================================================

    try {
      const messages =
        await channel.messages.fetch({
          limit:
            100
        });

      const oldPanels =
        messages.filter(
          message => {
            /*
             * NEVER delete messages belonging to users.
             */
            if (
              message.author?.id !==
              this.client.user?.id
            ) {
              return false;
            }

            /*
             * Old EmbedBuilder verification panel.
             */
            const oldEmbed =
              message.embeds?.some(
                embed =>
                  embed.title ===
                  "🛡️ NexusAI Verification"
              );

            /*
             * Old Discord verification buttons.
             */
            const oldVerificationButton =
              message.components?.some(
                row =>
                  row.components?.some(
                    component =>
                      [
                        "verification_start",
                        "verification_step1",
                        "verification_step2",
                        "verification_step3"
                      ].includes(
                        component.customId
                      )
                  )
              );

            /*
             * Old verification text.
             */
            const oldText =
              message.content?.includes(
                "Start Verification"
              ) ||
              message.content?.includes(
                "Verify on Website"
              );

            return (
              oldEmbed ||
              oldVerificationButton ||
              oldText
            );
          }
        );

      for (
        const message of
          oldPanels.values()
      ) {
        await message
          .delete()
          .catch(
            () => {}
          );
      }
    } catch (
      error
    ) {
      logger.warn(
        {
          error:
            error?.message,

          channelId:
            VERIFICATION_CHANNEL_ID
        },
        "Could not clean previous verification panels"
      );
    }

    // ========================================================
    // COMPONENTS V2 PANEL
    // ========================================================

    const container =
      new ContainerBuilder()
        .setAccentColor(
          0x5865F2
        )

        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(
              [
                "# 🛡️ NexusAI Verification",
                "",
                "Welcome to **NexusAI**!",
                "",
                "Before accessing the verified areas of the server, please complete our secure verification process."
              ].join(
                "\n"
              )
            )
        )

        .addSeparatorComponents()

        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(
              [
                "## 🔐 Verification Process",
                "",
                "① **Open the verification website**",
                "② **Complete Cloudflare Turnstile**",
                "③ **Complete the NexusAI security challenge**",
                "④ **Connect your Discord account**",
                "⑤ **Receive the Verified role automatically**"
              ].join(
                "\n"
              )
            )
        )

        .addSeparatorComponents()

        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder()
                .setContent(
                  [
                    "**Ready to verify?**",
                    "",
                    "Click the button below to open the secure NexusAI verification website."
                  ].join(
                    "\n"
                  )
                )
            )

            .setButtonAccessory(
              new ButtonBuilder()
                .setLabel(
                  "Verify on Website"
                )

                .setEmoji(
                  "🛡️"
                )

                .setStyle(
                  ButtonStyle.Link
                )

                .setURL(
                  VERIFICATION_WEBSITE_URL
                )
            )
        )

        .addSeparatorComponents()

        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(
              [
                "🔒 **Security**",
                "",
                "NexusAI will never ask for your Discord password, Discord token, or authentication credentials."
              ].join(
                "\n"
              )
            )
        );

    const message =
      await channel.send({
        components: [
          container
        ],

        flags:
          MessageFlags.IsComponentsV2
      });

    logger.info(
      {
        channelId:
          VERIFICATION_CHANNEL_ID,

        messageId:
          message.id
      },
      "✅ Website verification panel sent"
    );

    return message;
  }

    // ==========================================================
  // LOGIN TYPE MENU
  // ==========================================================

  async showLoginTypeMenu(
    interaction,
    platform
  ) {
    const embed =
      new EmbedBuilder()
        .setColor("#F4A300")
        .setAuthor({
          name:
            "🥭 NexusAI"
        })
        .setTitle(
          "🔐 Choose Your Login Method"
        )
        .setDescription(
          [
            `### ${
              platform?.emoji ??
              "🥭"
            } ${
              platform?.name ??
              platform
            }`,
            "",
            "Select the method you normally use to access your account.",
            "",
            "🔐 **Sparx Login**",
            "> Sign in with your **Sparx username and password**.",
            "",
            "🪟 **Microsoft Login**",
            "> Sign in using your **Microsoft school account**.",
            "",
            "━━━━━━━━━━━━━━━━━━━━",
            "🔒 Your credentials are handled securely."
          ].join("\n")
        )
        .setFooter({
          text:
            "🥭 NexusAI • Secure Account Login"
        })
        .setTimestamp();

    const select =
      new StringSelectMenuBuilder()
        .setCustomId(
          `login_type_${platform}`
        )
        .setPlaceholder(
          "🔐 Select a login method..."
        )
        .addOptions(
          {
            label:
              "Sparx Username & Password",
            description:
              "Use your normal Sparx login details",
            value:
              "password",
            emoji:
              "🔐"
          },
          {
            label:
              "Microsoft Account",
            description:
              "Use your school Microsoft account",
            value:
              "microsoft",
            emoji:
              "🪟"
          }
        );

    const row =
      new ActionRowBuilder()
        .addComponents(
          select
        );

    return interaction.reply({
      embeds: [
        embed
      ],
      components: [
        row
      ],
      flags:
        MessageFlags.Ephemeral
    });
  }

  // ==========================================================
  // LOGIN MODAL
  // ==========================================================

  async openLoginModal(
    interaction,
    platform,
    loginType = "password"
  ) {
    const modal =
      new ModalBuilder()
        .setCustomId(
          `school_login_${platform}_${loginType}`
        )
        .setTitle(
          loginType ===
          "microsoft"
            ? `${platform} • Microsoft Login`
            : `${platform} • Login`
        );

    const schoolInput =
      new TextInputBuilder()
        .setCustomId(
          "school"
        )
        .setLabel(
          "School"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setPlaceholder(
          "Enter your school name"
        )
        .setRequired(
          true
        );

    const usernameInput =
      new TextInputBuilder()
        .setCustomId(
          loginType ===
          "microsoft"
            ? "email"
            : "username"
        )
        .setLabel(
          loginType ===
          "microsoft"
            ? "Microsoft Email"
            : "Username"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setPlaceholder(
          loginType ===
          "microsoft"
            ? "example@outlook.com"
            : "Enter your Sparx username"
        )
        .setRequired(
          true
        );

    const passwordInput =
      new TextInputBuilder()
        .setCustomId(
          "password"
        )
        .setLabel(
          "Password"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setPlaceholder(
          "Enter your password"
        )
        .setRequired(
          true
        );

    modal.addComponents(
      new ActionRowBuilder()
        .addComponents(
          schoolInput
        ),

      new ActionRowBuilder()
        .addComponents(
          usernameInput
        ),

      new ActionRowBuilder()
        .addComponents(
          passwordInput
        )
    );

    logger.info(
      {
        platform,
        loginType
      },
      "Login modal opened"
    );

    return interaction.showModal(
      modal
    );
  }

  // ==========================================================
  // LOGIN MODAL SUBMISSION
  // ==========================================================

  async handleLoginModal(
    interaction
  ) {
    await interaction.deferReply({
      flags:
        MessageFlags.Ephemeral
    });

    const parts =
      interaction.customId.split(
        "_"
      );

    /*
     * Example:
     *
     * school_login_sparxMaths_password
     *
     * parts:
     * [school, login, sparxMaths, password]
     */

    const platform =
      parts
        .slice(2, -1)
        .join("_");

    const loginType =
      parts[
        parts.length - 1
      ];

    const school =
      interaction.fields
        .getTextInputValue(
          "school"
        );

    const password =
      interaction.fields
        .getTextInputValue(
          "password"
        );

    const username =
      loginType ===
      "microsoft"
        ? null
        : interaction.fields
            .getTextInputValue(
              "username"
            );

    const email =
      loginType ===
      "microsoft"
        ? interaction.fields
            .getTextInputValue(
              "email"
            )
        : null;

    logger.info(
      {
        platform,
        loginType,
        school,
        username,
        email,
        passwordReceived:
          Boolean(
            password
          )
      },
      "Login modal submitted"
    );

    try {
      if (
        !this.loginService ||
        typeof
          this.loginService
            .dispatchPlatformLogin !==
          "function"
      ) {
        throw new Error(
          "Login service is not available."
        );
      }

      const payload = {
        adapter:
          "sparx",

        action:
          "login",

        platform,

        school,

        method:
          loginType ===
          "microsoft"
            ? "microsoft"
            : "password",

        username,

        email,

        password,

        discordUserId:
          interaction.user.id,

        discordUsername:
          interaction.user.username,

        guildId:
          interaction.guild?.id ??
          null
      };

      await this.loginService
        .dispatchPlatformLogin(
          platform,
          payload
        );

      await interaction.editReply({
        content:
          [
            "✅ **Login request submitted successfully!**",
            "",
            `**Platform:** ${platform}`,
            `**Login Type:** ${
              loginType ===
              "microsoft"
                ? "Microsoft"
                : "Normal Sparx"
            }`,
            `**School:** ${school}`,
            loginType ===
            "microsoft"
              ? `**Email:** ${email}`
              : `**Username:** ${username}`,
            "",
            "🔐 Your credentials were received securely."
          ].join("\n")
      });
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,
          stack:
            error?.stack,
          platform,
          loginType,
          userId:
            interaction.user.id
        },
        "Failed to dispatch login"
      );

      await interaction.editReply({
        content:
          `❌ Failed to submit login request: ${
            error?.message ??
            "Unknown error"
          }`
      });
    }
  }

  // ==========================================================
  // COOKIE LOGIN
  // ==========================================================

  async handleCookieModalSubmit(
    interaction
  ) {
    if (
      this.loginService?.handleCookieModal
    ) {
      return this.loginService
        .handleCookieModal(
          interaction
        );
    }

    const platform =
      interaction.customId.replace(
        "cookie_login_",
        ""
      );

    let cookies;

    try {
      cookies =
        interaction.fields
          .getTextInputValue(
            "cookies_input"
          );
    } catch {
      cookies = "";
    }

    if (!cookies?.trim()) {
      return interaction.reply({
        content:
          "❌ No cookies were provided.",
        flags:
          MessageFlags.Ephemeral
      });
    }

    logger.info(
      {
        platform,
        userId:
          interaction.user.id
      },
      "Cookie session submitted"
    );

    return interaction.reply({
      content:
        [
          `🍪 Cookie session received for **${platform}**.`,
          "",
          "The session will be processed by the login service.",
          "",
          "🔒 Never post authentication cookies publicly."
        ].join("\n"),
      flags:
        MessageFlags.Ephemeral
    });
  }

  // ==========================================================
  // SAVED ACCOUNTS
  // ==========================================================

  async handleSavedAccounts(
    interaction,
    platform
  ) {
    if (
      this.loginService?.handleSavedAccounts
    ) {
      return this.loginService
        .handleSavedAccounts(
          interaction,
          platform
        );
    }

    return interaction.reply({
      content:
        `💾 Fetching saved accounts for **${platform}**...`,
      flags:
        MessageFlags.Ephemeral
    });
  }

  // ==========================================================
  // COMMAND HANDLER
  // ==========================================================

  async handleCommand(
    command,
    args,
    message
  ) {
    logger.info(
      {
        command,
        author:
          message.author?.username
      },
      "Command received"
    );

    /*
     * Give the application's command handler
     * first opportunity to process the command.
     */

    if (
      this.commandHandler &&
      this.commandHandler.commands?.has(
        command
      )
    ) {
      return this.commandHandler.commands.get(
        command
      )(message, args);
    }

    switch (
      command
    ) {
      case "help":
        return this.handleHelp(
          message
        );

      case "solve":
        return this.handleSolve(
          message,
          args
        );

      case "status":
        return this.handleStatus(
          message
        );

      case "ping":
  return this.replyToChannel(
    message,
    `🏓 Pong! ${this.client.ws.ping}ms`
  );

case "verify":
  return this.handleVerifyCommand(
    message
  );

default:
  return this.replyToChannel(
    message,
    "❓ Unknown command. Use `!help`"
  );
}
  }

  // ==========================================================
  // HELP
  // ==========================================================

  async handleHelp(
    message
  ) {
    const embed =
      new EmbedBuilder()
        .setColor(
          "#0099FF"
        )
        .setTitle(
          "📚 NexusAI Commands"
        )
        .addFields(
          {
            name:
              "Homework",
            value:
              [
                "`!homework` — View homework",
                "`!homework create [subject] [name]` — Create task",
                "`!tasks` — Homework alias"
              ].join("\n")
          },
          {
            name:
              "Premium",
            value:
              [
                "`!premium` — View premium tiers",
                "`!trial claim` — Start free trial"
              ].join("\n")
          },
          {
            name:
              "Queue",
            value:
              [
                "`!queue` — View queue",
                "`!join [platform]` — Join queue"
              ].join("\n")
          },
          {
            name:
              "Past Papers",
            value:
              [
                "`!pastpapers` — Latest papers",
                "`!pastpapers <subject>` — Search papers"
              ].join("\n")
          },
          {
            name:
              "Scheduler",
            value:
              [
                "`!schedule` — View schedules",
                "`!schedule create [platform] [time]` — Create schedule"
              ].join("\n")
          },
          {
            name:
              "Verification",
            value:
              "`!verify` — Start verification"
          },
          {
            name:
              "Information",
            value:
              [
                "`!stats` — Bot statistics",
                "`!status` — Bot status",
                "`!ping` — Check latency"
              ].join("\n")
          }
        )
        .setFooter({
          text:
            "🥭 NexusAI"
        })
        .setTimestamp();

    return this.replyToChannel(
      message,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // SOLVE
  // ==========================================================

  async handleSolve(
    message,
    args
  ) {
    if (
      args.length <
      2
    ) {
      return this.replyToChannel(
        message,
        "❌ Usage: `!solve <platform> <question>`"
      );
    }

    const platform =
      args[0].toLowerCase();

    const question =
      args
        .slice(1)
        .join(" ");

    return this.replyToChannel(
      message,
      [
        `🔄 Processing your request for **${platform}**...`,
        "",
        `**Question:** ${question}`
      ].join("\n")
    );
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async handleStatus(
    message
  ) {
    const guildSession =
      message.guild
        ? this.activeSessions.get(
            message.guild.id
          )
        : null;

    const embed =
      new EmbedBuilder()
        .setColor(
          "#00FF00"
        )
        .setTitle(
          "✅ NexusAI Status"
        )
        .addFields(
          {
            name:
              "Status",
            value:
              "Online",
            inline:
              true
          },
          {
            name:
              "Ping",
            value:
              `${this.client.ws.ping}ms`,
            inline:
              true
          },
          {
            name:
              "Uptime",
            value:
              this.formatUptime(
                this.client.uptime
              ),
            inline:
              true
          },
          {
            name:
              "Version",
            value:
              "2.0.0",
            inline:
              true
          },
          {
            name:
              "Auto Channels",
            value:
              guildSession
                ? "Enabled"
                : "Disabled",
            inline:
              true
          },
          {
            name:
              "Verification",
            value:
              VERIFIED_ROLE_ID
                ? "Configured"
                : "Role not configured",
            inline:
              true
          }
        )
        .setTimestamp();

    return this.replyToChannel(
      message,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // GUILD SESSION
  // ==========================================================

  async ensureGuildSession(
    _message
  ) {
    return null;
  }

  // ==========================================================
  // CHANNEL HELPERS
  // ==========================================================

  async getChannelByConfigKey(
    key
  ) {
    const channelId =
      config.discord.channels?.[
        key
      ];

    if (
      !channelId ||
      !this.client
    ) {
      return null;
    }

    let channel =
      this.client.channels.cache.get(
        channelId
      );

    if (!channel) {
      channel =
        await this.client.channels
          .fetch(
            channelId
          )
          .catch(
            () => null
          );
    }

    if (!channel) {
      logger.warn(
        {
          channelKey:
            key,
          channelId
        },
        "Configured Discord channel not found"
      );
    }

    return channel;
  }

  async sendToConfiguredChannel(
    key,
    payload,
    fallbackChannel = null
  ) {
    const channel =
      await this.getChannelByConfigKey(
        key
      );

    if (channel) {
      logger.info(
        {
          channelKey:
            key,
          channelId:
            channel.id
        },
        "Sending message to configured Discord channel"
      );

      return channel.send(
        payload
      );
    }

    if (fallbackChannel) {
      logger.info(
        {
          channelKey:
            key
        },
        "Falling back to current Discord channel"
      );

      return fallbackChannel.send(
        payload
      );
    }

    return null;
  }

  // ==========================================================
  // INTERACTION ACKNOWLEDGEMENT
  // ==========================================================

  async acknowledgeInteraction(
    interaction
  ) {
    try {
      if (
        !interaction.deferred &&
        !interaction.replied
      ) {
        await interaction.deferReply({
          flags:
            MessageFlags.Ephemeral
        });

        logger.debug(
          {
            customId:
              interaction.customId
          },
          "Interaction deferred"
        );
      }
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,
          customId:
            interaction?.customId
        },
        "Failed to acknowledge interaction"
      );
    }
  }

  // ==========================================================
  // PLATFORM DEFINITION
  // ==========================================================

  getPlatformDefinition(
    platformKey
  ) {
    const normalizedKey =
      String(
        platformKey ??
        ""
      ).trim();

    if (
      !normalizedKey
    ) {
      return null;
    }

    if (
      this.platformService?.getPlatform
    ) {
      const servicePlatform =
        this.platformService.getPlatform(
          normalizedKey
        );

      if (servicePlatform) {
        return servicePlatform;
      }
    }

    const fallbackMap = {
      sparxMaths: {
        name:
          "Sparx Maths",
        key:
          "sparxMaths",
        emoji:
          "<:SparxMaths:1515672129188790302>"
      },

      sparxReader: {
        name:
          "Sparx Reader",
        key:
          "sparxReader",
        emoji:
          "<:SparxReader:1515672202375204945>"
      },

      sparxScience: {
        name:
          "Sparx Science",
        key:
          "sparxScience",
        emoji:
          "<:SparxScience:1515672274051797072>"
      },

      languagenut: {
        name:
          "LanguageNut",
        key:
          "languagenut",
        emoji:
          "<:LanguageNut:1515672374878670858>"
      },

      bedrock: {
        name:
          "Bedrock",
        key:
          "bedrock",
        emoji:
          "<:Bedrock:1529265581273124935>"
      },

      seneca: {
        name:
          "Seneca",
        key:
          "seneca",
        emoji:
          "<:Seneca:1515672492512120963>"
      }
    };

    return (
      fallbackMap[
        normalizedKey
      ] ??
      null
    );
  }

    // ==========================================================
  // BUTTON INTERACTIONS
  // ==========================================================

  async handleButtonInteraction(
    interaction
  ) {
    const customId =
      interaction.customId ?? "";

    logger.info(
      {
        customId,
        userId:
          interaction.user?.id,
        username:
          interaction.user?.username
      },
      "Button interaction received"
    );

    // ========================================================
// OLD VERIFICATION BUTTON DEFENSE
// ========================================================
//
// These IDs may still exist on old Discord messages.
// They are intentionally rejected instead of starting
// the old Discord-side verification system.
//

if (
  [
    "verification_start",
    "verification_step1",
    "verification_step2",
    "verification_step3"
  ].includes(
    customId
  )
) {
  return this.respondToInteraction(
    interaction,
    {
      content:
        "🔗 Verification has moved to the NexusAI website. Please use the **Verify on Website** button in the verification channel.",

      flags:
        MessageFlags.Ephemeral
    }
  );
}

    // ========================================================
    // SPLIT BUTTON ID
    // ========================================================

    const parts =
      customId.split("_");

    const group =
      parts.shift();

    const action =
      parts.join("_");

    // ========================================================
    // JOIN QUEUE
    // ========================================================

    if (
      group === "platform" &&
      action === "join_queue"
    ) {
      return this.handleJoinQueueButton(
        interaction
      );
    }

    // ========================================================
    // HOMEWORK
    // ========================================================

    if (
      group === "homework"
    ) {
      await this.acknowledgeInteraction(
        interaction
      );

      return this.handleHomeworkButton(
        interaction,
        action
      );
    }

    // ========================================================
    // PAST PAPERS
    // ========================================================

    if (
      group === "pastpapers"
    ) {
      await this.acknowledgeInteraction(
        interaction
      );

      return this.handlePastPapersButton(
        interaction,
        action
      );
    }

    // ========================================================
    // PLATFORM
    // ========================================================

    if (
      group === "platform"
    ) {
      await this.acknowledgeInteraction(
        interaction
      );

      return this.handlePlatformButton(
        interaction,
        action
      );
    }

    // ========================================================
    // SCHEDULE
    // ========================================================

    if (
      group === "schedule"
    ) {
      await this.acknowledgeInteraction(
        interaction
      );

      return this.handleScheduleButton(
        interaction,
        action
      );
    }

    // ========================================================
    // SUPPORT
    // ========================================================

    if (
      group === "support"
    ) {
      await this.acknowledgeInteraction(
        interaction
      );

      return this.handleSupportButton(
        interaction,
        action
      );
    }

    // ========================================================
    // TICKETS
    // ========================================================

    if (
      group === "ticket"
    ) {
      await this.acknowledgeInteraction(
        interaction
      );

      return this.handleTicketButton(
        interaction,
        action
      );
    }

    // ========================================================
    // LOGIN
    // ========================================================

    if (
      group === "login"
    ) {
      const platform =
        this.getPlatformDefinition(
          action
        );

      if (!platform) {
        return this.respondToInteraction(
          interaction,
          {
            content:
              "❌ Unknown platform.",
            flags:
              MessageFlags.Ephemeral
          }
        );
      }

      return this.showLoginTypeMenu(
        interaction,
        platform
      );
    }

    // ========================================================
    // COOKIE SESSION
    // ========================================================

    if (
      group === "cookies"
    ) {
      if (
        !this.loginService
      ) {
        return this.respondToInteraction(
          interaction,
          {
            content:
              "❌ Login service is unavailable.",
            flags:
              MessageFlags.Ephemeral
          }
        );
      }

      if (
        typeof
          this.loginService
            .openCookieModal ===
        "function"
      ) {
        return this.loginService
          .openCookieModal(
            interaction,
            action
          );
      }

      return this.respondToInteraction(
        interaction,
        {
          content:
            "❌ Cookie login is not available.",
          flags:
            MessageFlags.Ephemeral
        }
      );
    }

    // ========================================================
    // SAVED ACCOUNT
    // ========================================================

    if (
      group === "saved"
    ) {
      return this.handleSavedAccounts(
        interaction,
        action
      );
    }

    // ========================================================
    // UNKNOWN
    // ========================================================

    return this.respondToInteraction(
      interaction,
      {
        content:
          "❌ Unknown button action.",
        flags:
          MessageFlags.Ephemeral
      }
    );
  }

  // ==========================================================
  // JOIN QUEUE BUTTON
  // ==========================================================

  async handleJoinQueueButton(
    interaction
  ) {
    const gifPath =
      path.join(
        __dirname,
        "../../standard.gif"
      );

    const hasGif =
      fs.existsSync(
        gifPath
      );

    try {
      const container =
        ContainerFactory.buildJoinQueueContainer(
          hasGif
        );

      const payload = {
        components: [
          container
        ],
        flags:
          MessageFlags.IsComponentsV2 |
          MessageFlags.Ephemeral
      };

      if (
        hasGif
      ) {
        payload.files = [
          new AttachmentBuilder(
            gifPath,
            {
              name:
                "standard.gif"
            }
          )
        ];
      }

      if (
        interaction.deferred ||
        interaction.replied
      ) {
        return interaction.editReply(
          payload
        );
      }

      return interaction.reply(
        payload
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,
          stack:
            error?.stack
        },
        "Join queue interaction failed"
      );

      return this.respondToInteraction(
        interaction,
        {
          content:
            `❌ Unable to open the queue: ${
              error?.message ??
              "Unknown error"
            }`,
          flags:
            MessageFlags.Ephemeral
        }
      );
    }
  }

  // ==========================================================
  // HOMEWORK BUTTON
  // ==========================================================

  async handleHomeworkButton(
    interaction,
    action
  ) {
    const embed =
      new EmbedBuilder()
        .setColor(
          "#5865F2"
        )
        .setTitle(
          "📚 Homework Tracker"
        )
        .setDescription(
          `Current homework status for **${
            interaction.user.username
          }**:`
        )
        .addFields(
          {
            name:
              "Sparx Maths",
            value:
              "All tasks up to date",
            inline:
              true
          },
          {
            name:
              "Sparx Reader",
            value:
              "1 reading task due",
            inline:
              true
          },
          {
            name:
              "Seneca",
            value:
              "No pending modules",
            inline:
              true
          }
        )
        .setFooter({
          text:
            "🥭 NexusAI Homework Manager"
        })
        .setTimestamp();

    return this.respondToInteraction(
      interaction,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // PAST PAPERS BUTTON
  // ==========================================================

  async handlePastPapersButton(
    interaction,
    action
  ) {
    const embed =
      new EmbedBuilder()
        .setColor(
          "#3BA55C"
        )
        .setTitle(
          "📄 Past Papers Library"
        )
        .setDescription(
          "Search for GCSE & A-Level past papers by subject:"
        )
        .addFields(
          {
            name:
              "Subjects Available",
            value:
              "Maths, Biology, Chemistry, Physics, Computer Science"
          },
          {
            name:
              "Commands",
            value:
              "Use `!pastpapers <subject>` for direct links."
          }
        )
        .setFooter({
          text:
            "🥭 NexusAI Study Resources"
        })
        .setTimestamp();

    return this.respondToInteraction(
      interaction,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // SCHEDULE BUTTON
  // ==========================================================

  async handleScheduleButton(
    interaction,
    action
  ) {
    const manager =
      this.app?.scheduleManager;

    if (
      manager
    ) {
      const schedules =
        manager.getUserSchedules(
          interaction.user.id
        );

      const embed =
        EmbedFactory.buildScheduleEmbed(
          schedules
        );

      const buttons =
        ActionRowFactory.buildScheduleButtons();

      return this.respondToInteraction(
        interaction,
        {
          embeds: [
            embed
          ],
          components: [
            buttons
          ]
        }
      );
    }

    const embed =
      new EmbedBuilder()
        .setColor(
          "#FAA61A"
        )
        .setTitle(
          "⏰ Auto-Schedule Manager"
        )
        .setDescription(
          "Automated auto-solver routines:"
        )
        .addFields(
          {
            name:
              "Active Schedules",
            value:
              "None configured yet."
          },
          {
            name:
              "Setup",
            value:
              "Use `!schedule create [platform] [time]`"
          }
        )
        .setFooter({
          text:
            "🥭 NexusAI Scheduler"
        })
        .setTimestamp();

    return this.respondToInteraction(
      interaction,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // SUPPORT BUTTON
  // ==========================================================

  async handleSupportButton(
    interaction,
    action
  ) {
    const embed =
      new EmbedBuilder()
        .setColor(
          "#ED4245"
        )
        .setTitle(
          "🆘 NexusAI Support"
        )
        .setDescription(
          "Need assistance?"
        )
        .addFields(
          {
            name:
              "Guides",
            value:
              "Check channel pins or run `!help`."
          },
          {
            name:
              "Tickets",
            value:
              "Click **Create Support Ticket** below."
          }
        )
        .setFooter({
          text:
            "🥭 NexusAI Support Desk"
        })
        .setTimestamp();

    return this.respondToInteraction(
      interaction,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // TICKET BUTTON
  // ==========================================================

  async handleTicketButton(
    interaction,
    action
  ) {
    const guild =
      interaction.guild;

    if (!guild) {
      return this.respondToInteraction(
        interaction,
        {
          content:
            "❌ Tickets can only be created inside a server."
        }
      );
    }

    try {
      const channel =
        await guild.channels.create({
          name:
            `ticket-${interaction.user.username}`
              .toLowerCase()
              .replace(
                /[^a-z0-9-]/g,
                "-"
              )
              .slice(
                0,
                90
              ),

          type:
            ChannelType.GuildText,

          permissionOverwrites: [
            {
              id:
                guild.id,

              deny: [
                PermissionFlagsBits.ViewChannel
              ]
            },

            {
              id:
                interaction.user.id,

              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            }
          ]
        });

      const embed =
        new EmbedBuilder()
          .setColor(
            "#5865F2"
          )
          .setTitle(
            `🎟️ Ticket Opened: ${
              interaction.user.username
            }`
          )
          .setDescription(
            "Please describe your issue below. A staff member will assist you shortly."
          )
          .setTimestamp();

      await channel.send({
        content:
          `<@${interaction.user.id}>`,
        embeds: [
          embed
        ]
      });

      return this.respondToInteraction(
        interaction,
        {
          content:
            `✅ Support ticket created! Head over to ${channel}.`
        }
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,
          stack:
            error?.stack
        },
        "Failed to create ticket channel"
      );

      return this.respondToInteraction(
        interaction,
        {
          content:
            "❌ Failed to create ticket channel. Make sure NexusAI has **Manage Channels** permission."
        }
      );
    }
  }

  // ==========================================================
  // PLATFORM BUTTON
  // ==========================================================

  async handlePlatformButton(
    interaction,
    action
  ) {
    const userId =
      interaction.user.id;

    /*
     * Ensure QueueSystem exists.
     */

    if (
      !this.app?.queueSystem
    ) {
      try {
        const {
          QueueSystem
        } = await import(
          "../queue/queueSystem.js"
        );

        if (
          this.app
        ) {
          this.app.queueSystem =
            new QueueSystem();
        }
      } catch (error) {
        logger.error(
          {
            error:
              error?.message
          },
          "Failed to initialize QueueSystem"
        );
      }
    }

    const queueSystem =
      this.app?.queueSystem;

    switch (
      action
    ) {
      // ======================================================
      // JOIN QUEUE
      // ======================================================

      case "join_queue":
        return this.handleJoinQueueButton(
          interaction
        );

      // ======================================================
      // PLATFORM ACCOUNT CONNECTION
      // ======================================================

      case "join_sparxMaths":
      case "join_sparxReader":
      case "join_sparxScience":
      case "join_languagenut":
      case "join_bedrock":
      case "join_seneca": {
        const selectedPlatform =
          action.replace(
            "join_",
            ""
          );

        if (
          !queueSystem
        ) {
          return this.respondToInteraction(
            interaction,
            {
              content:
                "❌ Queue system is unavailable."
            }
          );
        }

        const platform =
          this.getPlatformDefinition(
            selectedPlatform
          );

        if (
          !platform
        ) {
          return this.respondToInteraction(
            interaction,
            {
              content:
                "❌ Unknown platform."
            }
          );
        }

        this.pendingLogins.set(
          userId,
          {
            platform:
              platform.key,
            name:
              platform.name,
            createdAt:
              Date.now()
          }
        );

        /*
         * Automatically expire pending login state.
         */

        setTimeout(
          () => {
            this.pendingLogins.delete(
              userId
            );
          },
          300000
        );

        const embed =
          new EmbedBuilder()
            .setColor(
              "#F4A300"
            )
            .setTitle(
              `${
                platform.emoji
                  ? `${platform.emoji} `
                  : ""
              }${platform.name} • Account Connection`
            )
            .setDescription(
              [
                "## 🔐 Connect your account",
                "",
                "Connect **Sparx Maths** to NexusAI to get started.",
                "",
                "╭──────────────────────────────╮",
                "│ 🔑 **Username & Password**",
                "│ Sign in with your normal credentials.",
                "│",
                "│ 🍪 **Existing Session**",
                "│ Connect using an authenticated session.",
                "│",
                "│ 💾 **Saved Account**",
                "│ Quickly use an account you've saved.",
                "╰──────────────────────────────╯",
                "",
                "### 🛡️ Account Security",
                "Your login information is handled privately by NexusAI.",
                "",
                "🔒 **Private interaction** • Only you can see this panel."
              ].join("\n")
            )
            .setFooter({
              text:
                "🥭 NexusAI • Account Security"
            })
            .setTimestamp();

        const row =
          new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(
                  `login_${selectedPlatform}`
                )
                .setLabel(
                  "Sign In"
                )
                .setEmoji(
                  "🔑"
                )
                .setStyle(
                  ButtonStyle.Primary
                ),

              new ButtonBuilder()
                .setCustomId(
                  `cookies_${selectedPlatform}`
                )
                .setLabel(
                  "Session"
                )
                .setEmoji(
                  "🍪"
                )
                .setStyle(
                  ButtonStyle.Secondary
                ),

              new ButtonBuilder()
                .setCustomId(
                  `saved_${selectedPlatform}`
                )
                .setLabel(
                  "Saved Account"
                )
                .setEmoji(
                  "💾"
                )
                .setStyle(
                  ButtonStyle.Success
                )
            );

        return this.respondToInteraction(
          interaction,
          {
            embeds: [
              embed
            ],
            components: [
              row
            ]
          }
        );
      }

      // ======================================================
      // SETTINGS
      // ======================================================

      case "settings": {
        const embed =
          new EmbedBuilder()
            .setColor(
              "#5865F2"
            )
            .setTitle(
              "⚙️ NexusAI Settings"
            )
            .setDescription(
              "Configure your NexusAI experience:"
            )
            .addFields(
              {
                name:
                  "📋 Saved Accounts",
                value:
                  "Configure your platform accounts securely."
              },
              {
                name:
                  "🔔 Notifications",
                value:
                  "Homework updates are sent to configured channels."
              },
              {
                name:
                  "⏰ Auto-Schedule",
                value:
                  "Use the scheduler to automate reminders."
              }
            )
            .setTimestamp()
            .setFooter({
              text:
                "🥭 NexusAI • Settings"
            });

        return this.respondToInteraction(
          interaction,
          {
            embeds: [
              embed
            ]
          }
        );
      }

      // ======================================================
      // FEEDBACK
      // ======================================================

      case "feedback": {
        const embed =
          new EmbedBuilder()
            .setColor(
              "#FFD700"
            )
            .setTitle(
              "💬 Feedback & Suggestions"
            )
            .setDescription(
              "We value your feedback! Here's how to share:"
            )
            .addFields(
              {
                name:
                  "📝 Create a Ticket",
                value:
                  "`!ticket create feedback <your message>`"
              },
              {
                name:
                  "💡 Feature Requests",
                value:
                  "`!ticket create suggestion <your idea>`"
              },
              {
                name:
                  "🐛 Report a Bug",
                value:
                  "`!ticket create bug <description>`"
              }
            )
            .setFooter({
              text:
                "🥭 NexusAI • Your feedback shapes our future"
            })
            .setTimestamp();

        return this.respondToInteraction(
          interaction,
          {
            embeds: [
              embed
            ]
          }
        );
      }

      default:
        return this.respondToInteraction(
          interaction,
          {
            content:
              "❌ Unknown platform action."
          }
        );
    }
  }

  // ==========================================================
  // SELECT MENU HANDLER
  // ==========================================================

  async handleSelectMenuInteraction(
    interaction
  ) {
    const customId =
      interaction.customId ?? "";

    const selectedValue =
      interaction.values?.[0];

    logger.info(
      {
        customId,
        selectedValue,
        userId:
          interaction.user?.id
      },
      "Select menu interaction received"
    );

    // ========================================================
    // LOGIN TYPE
    // ========================================================

    if (
      customId.startsWith(
        "login_type_"
      )
    ) {
      return this.handleLoginTypeSelect(
        interaction
      );
    }

    // ========================================================
    // PLATFORM SELECT
    // ========================================================

    await this.acknowledgeInteraction(
      interaction
    );

    if (
      customId ===
      "platform_select"
    ) {
      if (
        !selectedValue
      ) {
        return this.respondToInteraction(
          interaction,
          {
            content:
              "❌ No platform was selected."
          }
        );
      }

      return this.handlePlatformButton(
        interaction,
        selectedValue
      );
    }

    // ========================================================
    // OTHER PLATFORM MENUS
    // ========================================================

    if (
      customId.startsWith(
        "platform_"
      )
    ) {
      const action =
        selectedValue ??
        customId.replace(
          "platform_",
          ""
        );

      return this.handlePlatformButton(
        interaction,
        action
      );
    }

    return this.respondToInteraction(
      interaction,
      {
        content:
          "❌ Select menu action not supported yet."
      }
    );
  }

  // ==========================================================
  // LOGIN TYPE SELECT
  // ==========================================================

  async handleLoginTypeSelect(
    interaction
  ) {
    const parts =
      interaction.customId.split(
        "_"
      );

    const platform =
      parts
        .slice(2)
        .join("_");

    const loginType =
      interaction.values?.[0];

    if (
      !loginType
    ) {
      return interaction.reply({
        content:
          "❌ Please select a login method.",
        flags:
          MessageFlags.Ephemeral
      });
    }

    if (
      ![
        "password",
        "microsoft"
      ].includes(
        loginType
      )
    ) {
      return interaction.reply({
        content:
          "❌ Invalid login method.",
        flags:
          MessageFlags.Ephemeral
      });
    }

    return this.openLoginModal(
      interaction,
      platform,
      loginType
    );
  }

  // ==========================================================
  // INTERACTION RESPONSE HELPER
  // ==========================================================

  async respondToInteraction(
    interaction,
    payload
  ) {
    try {
      if (
        interaction.deferred ||
        interaction.replied
      ) {
        return interaction.editReply(
          payload
        );
      }

      return interaction.reply(
        payload
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,
          stack:
            error?.stack,
          customId:
            interaction?.customId
        },
        "Failed to respond to interaction"
      );

      if (
        interaction.deferred ||
        interaction.replied
      ) {
        return interaction
          .followUp({
            content:
              "❌ Error processing action.",
            flags:
              MessageFlags.Ephemeral
          })
          .catch(() => {});
      }

      return null;
    }
  }

  // ==========================================================
  // LOGIN MODAL
  // ==========================================================

  async handleLoginModal(
    interaction
  ) {
    await interaction.deferReply({
      flags:
        MessageFlags.Ephemeral
    });

    try {
      const parts =
        interaction.customId.split(
          "_"
        );

      const platform =
        parts
          .slice(2, -1)
          .join("_");

      const loginType =
        parts[
          parts.length - 1
        ];

      const school =
        interaction.fields.getTextInputValue(
          "school"
        );

      const password =
        interaction.fields.getTextInputValue(
          "password"
        );

      const username =
        loginType ===
        "microsoft"
          ? null
          : interaction.fields.getTextInputValue(
              "username"
            );

      const email =
        loginType ===
        "microsoft"
          ? interaction.fields.getTextInputValue(
              "email"
            )
          : null;

      if (
        !this.loginService ||
        typeof this
          .loginService
          .dispatchPlatformLogin !==
          "function"
      ) {
        throw new Error(
          "Login service is unavailable."
        );
      }

      await this.loginService.dispatchPlatformLogin(
        platform,
        {
          adapter:
            "sparx",
          action:
            "login",
          platform,
          school,
          method:
            loginType ===
            "microsoft"
              ? "microsoft"
              : "password",
          username,
          email,
          password
        }
      );

      return interaction.editReply({
        content:
          [
            "✅ **Login request submitted successfully!**",
            "",
            `**Platform:** ${platform}`,
            `**Login Type:** ${
              loginType === "microsoft"
                ? "Microsoft"
                : "Normal Sparx"
            }`,
            `**School:** ${school}`,
            loginType ===
            "microsoft"
              ? `**Email:** ${email}`
              : `**Username:** ${username}`,
            "",
            "🔒 Your credentials were submitted through the private interaction."
          ].join("\n")
      });
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,
          stack:
            error?.stack
        },
        "Failed to dispatch login"
      );

      return interaction.editReply({
        content:
          `❌ Failed to submit login request: ${
            error?.message ??
            "Unknown error"
          }`
      });
    }
  }

  // ==========================================================
  // COOKIE LOGIN MODAL
  // ==========================================================

  async handleCookieModalSubmit(
    interaction
  ) {
    if (
      this.loginService &&
      typeof this
        .loginService
        .handleCookieModal ===
      "function"
    ) {
      return this.loginService.handleCookieModal(
        interaction
      );
    }

    const platform =
      interaction.customId.replace(
        "cookie_login_",
        ""
      );

    return interaction.reply({
      content:
        `🍪 Cookie session received for **${platform}**.`,
      flags:
        MessageFlags.Ephemeral
    });
  }

  // ==========================================================
  // SAVED ACCOUNTS
  // ==========================================================

  async handleSavedAccounts(
    interaction,
    platform
  ) {
    if (
      this.loginService &&
      typeof this
        .loginService
        .handleSavedAccounts ===
      "function"
    ) {
      return this.loginService.handleSavedAccounts(
        interaction,
        platform
      );
    }

    return interaction.reply({
      content:
        `💾 No saved-account service is currently available for **${platform}**.`,
      flags:
        MessageFlags.Ephemeral
    });
  }

  // ==========================================================
  // COMMANDS
  // ==========================================================

  async handleCommand(
    command,
    args,
    message
  ) {
    logger.info(
      {
        command,
        author:
          message.author.username
      },
      "Command received"
    );

    if (
      this.commandHandler &&
      this.commandHandler.commands.has(
        command
      )
    ) {
      return this.commandHandler
        .commands
        .get(command)(
          message,
          args
        );
    }

    switch (
      command
    ) {
      case "help":
        return this.handleHelp(
          message
        );

      case "solve":
        return this.handleSolve(
          message,
          args
        );

      case "status":
        return this.handleStatus(
          message
        );

      case "ping":
        return this.replyToChannel(
          message,
          `🏓 Pong! ${this.client.ws.ping}ms`
        );

      case "verify":
  return this.handleVerifyCommand(
    message
  );

      default:
        return this.replyToChannel(
          message,
          "❓ Unknown command. Use `!help`"
        );
    }
  }

  // ==========================================================
  // VERIFY COMMAND
  // ==========================================================

  async handleVerifyCommand(
  message
) {
  const accountAge =
    getDiscordAccountAge(
      message.author.id
    );

  /*
   * Defensive account-age check.
   *
   * The Cloudflare Worker performs the authoritative
   * check before assigning the Verified role.
   *
   * The Discord bot itself NEVER assigns the role.
   */

  if (
    accountAge &&
    accountAge.ageDays <
      MIN_DISCORD_ACCOUNT_AGE_DAYS
  ) {
    const remainingDays =
      Math.max(
        1,
        MIN_DISCORD_ACCOUNT_AGE_DAYS -
          accountAge.ageDays
      );

    return this.replyToChannel(
      message,
      {
        embeds: [
          new EmbedBuilder()
            .setColor(
              "#ED4245"
            )
            .setTitle(
              "🚫 Account Too New"
            )
            .setDescription(
              [
                "Sorry, this Discord account isn't old enough to access this server.",
                "",
                `**Account age:** ${accountAge.ageDays} day${
                  accountAge.ageDays === 1
                    ? ""
                    : "s"
                }`,
                "**Minimum required:** 30 days (1 month)",
                "",
                `Please try again in approximately ${remainingDays} day${
                  remainingDays === 1
                    ? ""
                    : "s"
                }.`
              ].join(
                "\n"
              )
            )
            .setFooter({
              text:
                "NexusAI • Server Security"
            })
            .setTimestamp()
        ]
      }
    );
  }

  /*
   * Eligible users are directed to the website.
   */
  return this.replyToChannel(
    message,
    {
      embeds: [
        new EmbedBuilder()
          .setColor(
            "#5865F2"
          )
          .setTitle(
            "🛡️ NexusAI Website Verification"
          )
          .setDescription(
            [
              "Verification is completed securely through the NexusAI verification website.",
              "",
              `🔗 **Verify here:** ${VERIFICATION_WEBSITE_URL}`,
              "",
              "The website performs Cloudflare Turnstile, the NexusAI security challenge, Discord authentication, and the final account-age verification."
            ].join(
              "\n"
            )
          )
          .setFooter({
            text:
              "🥭 NexusAI • Secure Website Verification"
          })
          .setTimestamp()
      ]
    }
  );
}

  // ==========================================================
  // HELP
  // ==========================================================

  async handleHelp(
    message
  ) {
    const embed =
      new EmbedBuilder()
        .setColor(
          "#0099FF"
        )
        .setTitle(
          "📚 NexusAI Commands"
        )
        .addFields(
          {
            name:
              "Homework",
            value:
              "`!homework` - View homework progress\n" +
              "`!tasks` - View tasks"
          },
          {
            name:
              "Premium",
            value:
              "`!premium` - View premium information\n" +
              "`!trial claim` - Start a trial"
          },
          {
            name:
              "Queue",
            value:
              "`!queue` - View queue status\n" +
              "`!join [platform]` - Join a queue"
          },
          {
            name:
              "Verification",
            value:
              "`!verify` - Check verification status"
          },
          {
            name:
              "Scheduler",
            value:
              "`!schedule` - Manage schedules"
          },
          {
            name:
              "General",
            value:
              "`!status` - Bot status\n" +
              "`!ping` - Check latency"
          }
        )
        .setTimestamp();

    return this.replyToChannel(
      message,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // SOLVE COMMAND
  // ==========================================================

  async handleSolve(
    message,
    args
  ) {
    if (
      args.length < 2
    ) {
      return this.replyToChannel(
        message,
        "❌ Usage: `!solve <platform> <question>`"
      );
    }

    const platform =
      args[0].toLowerCase();

    const question =
      args
        .slice(1)
        .join(" ");

    return this.replyToChannel(
      message,
      `🔄 Processing your request for **${platform}**...\nQuestion: ${question}`
    );
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async handleStatus(
    message
  ) {
    const guildSession =
      message.guild
        ? this.activeSessions.get(
            message.guild.id
          )
        : null;

    const embed =
      new EmbedBuilder()
        .setColor(
          "#00FF00"
        )
        .setTitle(
          "✅ NexusAI Status"
        )
        .addFields(
          {
            name:
              "Status",
            value:
              "Online",
            inline:
              true
          },
          {
            name:
              "Ping",
            value:
              `${this.client.ws.ping}ms`,
            inline:
              true
          },
          {
            name:
              "Uptime",
            value:
              this.formatUptime(
                this.client.uptime
              ),
            inline:
              true
          },
          {
            name:
              "Version",
            value:
              "2.0.0",
            inline:
              true
          },
          {
            name:
              "Auto Channels",
            value:
              guildSession
                ? "Enabled"
                : "Disabled",
            inline:
              true
          }
        )
        .setTimestamp();

    return this.replyToChannel(
      message,
      {
        embeds: [
          embed
        ]
      }
    );
  }

  // ==========================================================
  // SESSION HELPERS
  // ==========================================================

  async ensureGuildSession(
    message
  ) {
    return null;
  }

  isSessionChannel(
    channelId,
    guildSession
  ) {
    const session =
      guildSession ||
      (
        this.activeSessions.size
          ? Array.from(
              this.activeSessions.values()
            ).find(
              session =>
                Object.values(
                  session.channelIds ||
                    {}
                ).includes(
                  channelId
                )
            )
          : null
      );

    if (
      !session
    ) {
      return false;
    }

    return Object.values(
      session.channelIds ||
        {}
    ).includes(
      channelId
    );
  }

  async replyToChannel(
    message,
    payload
  ) {
    const guildSession =
      message.guild
        ? this.activeSessions.get(
            message.guild.id
          )
        : null;

    if (
      guildSession &&
      !this.isSessionChannel(
        message.channel.id,
        guildSession
      )
    ) {
      return this.routeReply(
        message,
        payload,
        guildSession
      );
    }

    return message.channel.send(
      payload
    );
  }

  async routeReply(
    message,
    payload,
    guildSession
  ) {
    const session =
      guildSession ||
      null;

    if (
      !session
    ) {
      return message.channel.send(
        payload
      );
    }

    const mainChannel =
      message.guild?.channels.cache.get(
        session.mainChannelId
      );

    if (
      mainChannel
    ) {
      return mainChannel.send(
        payload
      );
    }

    return message.channel.send(
      payload
    );
  }

  // ==========================================================
  // CHANNEL HELPERS
  // ==========================================================

  async getChannelByConfigKey(
    key
  ) {
    const channelId =
      config.discord.channels?.[
        key
      ];

    if (
      !channelId
    ) {
      return null;
    }

    let channel =
      this.client.channels.cache.get(
        channelId
      );

    if (
      !channel
    ) {
      channel =
        await this.client.channels
          .fetch(channelId)
          .catch(
            () => null
          );
    }

    return channel;
  }

  async sendToConfiguredChannel(
    key,
    payload,
    fallbackChannel = null
  ) {
    const channel =
      await this.getChannelByConfigKey(
        key
      );

    if (
      channel
    ) {
      logger.info(
        {
          channelKey:
            key,
          channelId:
            channel.id
        },
        "Sending message to configured Discord channel"
      );

      return channel.send(
        payload
      );
    }

    if (
      fallbackChannel
    ) {
      return fallbackChannel.send(
        payload
      );
    }

    return null;
  }

  // ==========================================================
  // INTERACTION ACKNOWLEDGEMENT
  // ==========================================================

  async acknowledgeInteraction(
    interaction
  ) {
    if (
      interaction.deferred ||
      interaction.replied
    ) {
      return;
    }

    try {
      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });
    } catch (error) {
      logger.debug(
        {
          error:
            error?.message
        },
        "Interaction acknowledgement failed"
      );
    }
  }

  // ==========================================================
  // PRESENCE
  // ==========================================================

  setPresence() {
    const activities = [
      {
        name:
          "📚 Homework Solutions",
        type:
          ActivityType.Watching
      },
      {
        name:
          "📈 Your Progress",
        type:
          ActivityType.Watching
      },
      {
        name:
          "✨ Students Learning",
        type:
          ActivityType.Watching
      },
      {
        name:
          "🧠 AI Tutoring",
        type:
          ActivityType.Watching
      },
      {
        name:
          "🥭 NexusAI 🎓",
        type:
          ActivityType.Playing
      },
      {
        name:
          "🤖 Smart Learning",
        type:
          ActivityType.Playing
      },
      {
        name:
          "⚡ Solving Problems",
        type:
          ActivityType.Playing
      },
      {
        name:
          "🎯 Education Magic",
        type:
          ActivityType.Playing
      }
    ];

    if (
      this.presenceInterval
    ) {
      clearInterval(
        this.presenceInterval
      );
    }

    const updatePresence =
      () => {
        try {
          const activity =
            activities[
              Math.floor(
                Math.random() *
                  activities.length
              )
            ];

          this.client.user?.setPresence({
            activities: [
              activity
            ],
            status:
              "online"
          });

          logger.info(
            {
              activity:
                activity.name,
              type:
                activity.type
            },
            "🎭 Bot presence updated"
          );
        } catch (error) {
          logger.error(
            {
              error:
                error?.message
            },
            "Failed to update presence"
          );
        }
      };

    updatePresence();

    this.presenceInterval =
      setInterval(
        updatePresence,
        30000
      );
  }

  // ==========================================================
  // SCHEDULE LOOP
  // ==========================================================

  async startScheduleLoop() {
    if (
      this.scheduleLoop
    ) {
      return;
    }

    this.scheduleLoop =
      setInterval(
        async () => {
          try {
            if (
              !this.app?.scheduleManager
            ) {
              return;
            }

            const schedules =
              this.app.scheduleManager.getSchedulesToRun();

            if (
              !schedules?.length
            ) {
              return;
            }

            for (
              const schedule of
                schedules
            ) {
              const channel =
                await this.getChannelByConfigKey(
                  "autoSchedule"
                );

              if (
                !channel
              ) {
                continue;
              }

              const embed =
                new EmbedBuilder()
                  .setColor(
                    "#5865F2"
                  )
                  .setTitle(
                    "📅 Auto Schedule Triggered"
                  )
                  .setDescription(
                    `Your scheduled homework job is ready for **${schedule.platform}**.`
                  )
                  .addFields(
                    {
                      name:
                        "Schedule",
                      value:
                        String(
                          schedule.name ??
                            "Unnamed"
                        ),
                      inline:
                        true
                    },
                    {
                      name:
                        "Platform",
                      value:
                        String(
                          schedule.platform ??
                            "Unknown"
                        ),
                      inline:
                        true
                    },
                    {
                      name:
                        "Next Run",
                      value:
                        schedule.nextRun
                          ? schedule.nextRun.toLocaleString()
                          : "N/A",
                      inline:
                        false
                    }
                  )
                  .setTimestamp();

              await channel
                .send({
                  embeds: [
                    embed
                  ]
                })
                .catch(
                  () => null
                );

              this.app.scheduleManager.markAsRun(
                schedule.id
              );
            }
          } catch (error) {
            logger.error(
              {
                error:
                  error?.message
              },
              "Schedule loop failed"
            );
          }
        },
        30000
      );
  }

  stopScheduleLoop() {
    if (
      this.scheduleLoop
    ) {
      clearInterval(
        this.scheduleLoop
      );

      this.scheduleLoop =
        null;
    }
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  async login() {
    try {
      await this.client.login(
        config.discord.token
      );

      logger.info(
        "Discord bot logged in successfully"
      );

      this.startScheduleLoop();
    } catch (error) {
      logger.error(
        {
          error:
            error?.message
        },
        "Failed to login to Discord"
      );

      throw error;
    }
  }

  // ==========================================================
  // CLOSE
  // ==========================================================

  async close() {
    try {
      this.stopScheduleLoop();

      if (
        this.presenceInterval
      ) {
        clearInterval(
          this.presenceInterval
        );

        this.presenceInterval =
          null;
      }

      if (
        this.verificationStates
      ) {
        this.verificationStates.clear();
      }

      if (
        this.pendingLogins
      ) {
        this.pendingLogins.clear();
      }

      if (
        this.client
      ) {
        await this.client.destroy();
      }

      logger.info(
        "Discord bot disconnected"
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message
        },
        "Error closing Discord bot"
      );
    }
  }
}

export default DiscordBot;