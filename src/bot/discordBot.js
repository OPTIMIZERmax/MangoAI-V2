/* eslint-env node */

import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActivityType,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';

import {
  EmbedFactory,
  ActionRowFactory,
  ContainerFactory
} from './embedFactory.js';

import logger from '../utils/logger.js';
import config from '../utils/config.js';
import { dispatchSparxLogin } from './sparxLoginBridge.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

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

    this.commandHandler = null;
    this.activeSessions = new Map();
    this.app = null;
    this.scheduleLoop = null;
    this.presenceInterval = null;
    this.pendingLogins = new Map();

    this.setupEventHandlers();
  }

  setCommandHandler(handler) {
    this.commandHandler = handler;
  }

  setApp(app) {
    this.app = app;
  }

  setupEventHandlers() {
    this.client.once('clientReady', () => {
      logger.info(
        { username: this.client.user.username },
        'Discord bot is ready'
      );
      this.setPresence();
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      /* ==================================
         SENAI PLATFORM CHANNELS
         ================================== */
      const platformChannels = {
        "sparx-maths": "sparxMaths",
        "science-reader": "science",
        "educake": "educake",
        "drfrost": "drfrost",
        "seneca": "seneca",
        "languagenut": "languagenut"
      };

      const platform = platformChannels[message.channel.name];
      if (platform) {
        return this.handlePlatformQuestion(message, platform);
      }

      /* ==================================
         PREFIX COMMANDS
         ================================== */
      if (!message.content.startsWith(config.discord.prefix)) return;

      const args = message.content
        .slice(config.discord.prefix.length)
        .trim()
        .split(/ +/);

      const command = args.shift()?.toLowerCase();
      if (!command) return;

      try {
        await this.handleCommand(command, args, message);
      } catch (error) {
        logger.error(
          { error: error.message, command },
          'Error handling command'
        );

        await this.replyToChannel(message, {
          content: `❌ ${error.message}`
        });
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      try {
        // BUTTONS
        if (interaction.isButton()) {
          if (interaction.customId.startsWith("login_")) {
            const platform = interaction.customId.replace("login_", "");
            return this.openLoginModal(interaction, platform);
          }

          if (interaction.customId.startsWith("cookies_")) {
            const platform = interaction.customId.replace("cookies_", "");
            return this.openCookieModal(interaction, platform);
          }

          if (interaction.customId.startsWith("saved_")) {
            const platform = interaction.customId.replace("saved_", "");
            return this.handleSavedAccounts(interaction, platform);
          }

          return this.handleButtonInteraction(interaction);
        }

        // MODALS
        if (interaction.isModalSubmit()) {
          if (interaction.customId.startsWith("cookie_login_")) {
            return this.handleCookieModalSubmit(interaction);
          }
          return this.handleLoginModal(interaction);
        }

        // SELECT MENUS
        if (interaction.isStringSelectMenu()) {
          if (interaction.customId === "platform_select" || interaction.customId.startsWith("platform_")) {
            return this.handleSelectMenuInteraction(interaction);
          }

          return this.handleLoginTypeSelect(interaction);
        }
      } catch (error) {
        logger.error(
          { error: error.message, customId: interaction.customId },
          'Interaction error'
        );

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '❌ Something went wrong.',
            flags: MessageFlags.Ephemeral
          }).catch(() => {});
        } else {
          await interaction.reply({
            content: '❌ Button error',
            flags: MessageFlags.Ephemeral
          });
        }
      }
    });

    this.client.on('error', (error) => {
      logger.error({ error: error.message }, 'Discord client error');
    });
  }

  async handlePlatformQuestion(message, platform) {
    const question = message.content.trim();
    if (!question) return;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🥭 MangoAI • Question Received')
      .addFields(
        { name: 'Platform', value: platform, inline: true },
        { name: 'Student', value: message.author.username, inline: true },
        { name: 'Question', value: question }
      )
      .setTimestamp()
      .setFooter({ text: 'MangoAI Learning Platform' });

    await message.channel.send({ embeds: [embed] });
  }

  async handleLoginModal(interaction) {
    const platform = interaction.customId.replace("school_login_", "");
    const school = interaction.fields.getTextInputValue("school");
    const login = interaction.fields.getTextInputValue("login");
    const password = interaction.fields.getTextInputValue("password");

    try {
      const payload = {
        school,
        method: 'password',
        username: login,
        password
      };

      if (this.app?.engine) {
        await dispatchSparxLogin(this.app.engine, payload);
      } else if (this.app?.bot?.app?.engine) {
        await dispatchSparxLogin(this.app.bot.app.engine, payload);
      } else {
        logger.warn({ platform }, 'No engine dispatcher available for Sparx login bridge');
      }

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
      logger.error({ error: error.message, platform }, 'Failed to dispatch Sparx login');
      await interaction.reply({
        content: `❌ Failed to submit Sparx login request: ${error.message}`,
        flags: MessageFlags.Ephemeral
      });
    }
  }

  async handleCookieModalSubmit(interaction) {
    const platform = interaction.customId.replace("cookie_login_", "");
    const cookies = interaction.fields.getTextInputValue("cookies_input");

    await interaction.reply({
      content: `🍪 Cookie session stored for **${platform}**. Automated tasks will use this session token.`,
      flags: MessageFlags.Ephemeral
    });
  }

  async handleSavedAccounts(interaction, platform) {
    await interaction.reply({
      content: `💾 Fetching saved accounts for **${platform}**... Select an account from your saved `.concat(`.env profile.`),
      flags: MessageFlags.Ephemeral
    });
  }

  async handleLoginTypeSelect(interaction) {
    const [type, platform, login] = interaction.customId.split("_");
    const choice = interaction.values[0];

    await interaction.update({
      content:
`🔑 Login method selected:

**Platform:** ${platform}
**Account:** ${login}
**Method:** ${choice}

Processing login request...`,
      components: []
    });
  }

  async handleCommand(command, args, message) {
    logger.info({ command, author: message.author.username }, 'Command received');

    if (this.commandHandler && this.commandHandler.commands.has(command)) {
      return await this.commandHandler.commands.get(command)(message, args);
    }

    switch (command) {
      case 'help':
        return this.handleHelp(message);
      case 'solve':
        return this.handleSolve(message, args);
      case 'status':
        return this.handleStatus(message);
      case 'ping':
        return this.replyToChannel(message, `🏓 Pong! ${this.client.ws.ping}ms`);
      default:
        return this.replyToChannel(message, '❓ Unknown command. Use `!help`');
    }
  }

  async handleHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Auto Completer Commands')
      .addFields(
        {
          name: '**Homework**',
          value:
            '`!homework` - View your homework progress\n' +
            '`!homework create [subject] [name]` - Create new task\n' +
            '`!tasks` - Alias for homework'
        },
        {
          name: '**Premium**',
          value:
            '`!premium` - View premium tiers\n' +
            '`!trial claim` - Start free trial'
        },
        {
          name: '**Queue**',
          value:
            '`!queue` - View queue status\n' +
            '`!join [platform]` - Join queue'
        },
        {
          name: '**Past Papers**',
          value:
            '`!pastpapers` - View the latest past papers\n' +
            '`!pastpapers <subject>` - Search by subject'
        },
        {
          name: '**Scheduler**',
          value:
            '`!schedule` - View your schedules\n' +
            '`!schedule create [platform] [time] [days...]` - Create schedule'
        },
        {
          name: '**Info**',
          value:
            '`!stats` - Bot statistics\n' +
            '`!help` - This message\n' +
            '`!ping` - Check latency'
        }
      )
      .setTimestamp();

    await this.replyToChannel(message, { embeds: [embed] });
  }

  async handleSolve(message, args) {
    if (args.length < 2) {
      return await this.replyToChannel(message, '❌ Usage: `!solve <platform> <question>`');
    }

    const platform = args[0].toLowerCase();
    const question = args.slice(1).join(' ');

    await this.replyToChannel(
      message,
      `🔄 Processing your request for ${platform}...\nQuestion: ${question}`
    );
  }

  async handleStatus(message) {
    const guildSession = message.guild
      ? this.activeSessions.get(message.guild.id)
      : null;

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Bot Status')
      .addFields(
        { name: 'Status', value: 'Online' },
        { name: 'Ping', value: `${this.client.ws.ping}ms` },
        { name: 'Uptime', value: this.formatUptime(this.client.uptime) },
        { name: 'Version', value: '2.0.0' },
        { name: 'Auto Channels', value: guildSession ? 'Enabled' : 'Disabled' }
      )
      .setTimestamp();

    await this.replyToChannel(message, { embeds: [embed] });
  }

  async ensureGuildSession(_message) {
    return null;
  }

  async getChannelByConfigKey(key) {
    const channelId = config.discord.channels?.[key];
    if (!channelId || !this.client) return null;

    let channel = this.client.channels.cache.get(channelId);
    if (!channel) {
      channel = await this.client.channels.fetch(channelId).catch(() => null);
    }

    if (!channel) {
      logger.warn({ channelKey: key, channelId }, 'Configured Discord channel not found');
    }

    return channel;
  }

  async sendToConfiguredChannel(key, payload, fallbackChannel = null) {
    const channel = await this.getChannelByConfigKey(key);

    if (channel) {
      logger.info(
        { channelKey: key, channelId: channel.id },
        'Sending message to configured Discord channel'
      );
      return channel.send(payload);
    }

    if (fallbackChannel) {
      logger.info({ channelKey: key }, 'Falling back to current Discord channel');
      return fallbackChannel.send(payload);
    }

    return null;
  }

  async acknowledgeInteraction(interaction, isV2Override = null) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        const isV2 = isV2Override !== null 
          ? isV2Override 
          : (
              interaction.customId === 'platform_join_queue' ||
              interaction.customId === 'join_queue' ||
              interaction.values?.includes('join_queue') ||
              interaction.values?.includes('platform_join_queue')
            );

        const flags = isV2 
          ? (MessageFlags.Ephemeral | MessageFlags.IsComponentsV2)
          : MessageFlags.Ephemeral;

        await interaction.deferReply({ flags });
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to acknowledge interaction');
    }
  }

  async handleButtonInteraction(interaction) {
    const parts = interaction.customId.split('_');
    const group = parts.shift();
    const action = parts.join('_');

    const isV2 = (group === 'platform' && action === 'join_queue');
    await this.acknowledgeInteraction(interaction, isV2);

    if (group === 'homework') {
      return this.handleHomeworkButton(interaction, action);
    }

    if (group === 'pastpapers') {
      return this.handlePastPapersButton(interaction, action);
    }

    if (group === 'platform') {
      return this.handlePlatformButton(interaction, action);
    }

    if (group === 'schedule') {
      return this.handleScheduleButton(interaction, action);
    }

    if (group === 'support') {
      return this.handleSupportButton(interaction, action);
    }

    if (group === 'ticket') {
      return this.handleTicketButton(interaction, action);
    }

    return this.respondToInteraction(interaction, {
      content: 'Button action not supported yet.'
    });
  }

  async handleHomeworkButton(interaction, action) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📚 Homework Tracker')
      .setDescription(`Current homework status for **${interaction.user.username}**:`)
      .addFields(
        { name: 'Sparx Maths', value: 'All tasks up to date', inline: true },
        { name: 'Sparx Reader', value: '1 Reading task due', inline: true },
        { name: 'Seneca', value: 'No pending modules', inline: true }
      )
      .setFooter({ text: '🥭 MangoAI Homework Manager' });

    return this.respondToInteraction(interaction, { embeds: [embed] });
  }

  async handlePastPapersButton(interaction, action) {
    const embed = new EmbedBuilder()
      .setColor('#3BA55C')
      .setTitle('📄 Past Papers Library')
      .setDescription('Search for GCSE & A-Level past papers by subject:')
      .addFields(
        { name: 'Subjects Available', value: 'Maths, Biology, Chemistry, Physics, Computer Science' },
        { name: 'Commands', value: 'Use `!pastpapers <subject>` for direct links.' }
      )
      .setFooter({ text: '🥭 MangoAI Study Resources' });

    return this.respondToInteraction(interaction, { embeds: [embed] });
  }

  async handleScheduleButton(interaction, action) {
    const embed = new EmbedBuilder()
      .setColor('#FAA61A')
      .setTitle('⏰ Auto-Schedule Manager')
      .setDescription('Automated auto-solver routines:')
      .addFields(
        { name: 'Active Schedules', value: 'None configured yet.' },
        { name: 'Setup', value: 'Use `!schedule create [platform] [time]`' }
      )
      .setFooter({ text: '🥭 MangoAI Scheduler' });

    return this.respondToInteraction(interaction, { embeds: [embed] });
  }

  async handleSupportButton(interaction, action) {
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('🆘 MangoAI Support')
      .setDescription('Need assistance?')
      .addFields(
        { name: 'Guides', value: 'Check channel pins or run `!help`.' },
        { name: 'Tickets', value: 'Click **Create Support Ticket** below.' }
      )
      .setFooter({ text: '🥭 MangoAI Support Desk' });

    return this.respondToInteraction(interaction, { embeds: [embed] });
  }

  async handleTicketButton(interaction, action) {
    const guild = interaction.guild;
    if (!guild) {
      return this.respondToInteraction(interaction, {
        content: 'Tickets can only be created inside a server.'
      });
    }

    try {
      const channel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🎟️ Ticket Opened: ${interaction.user.username}`)
        .setDescription('Please describe your issue below. A staff member will assist you shortly.')
        .setTimestamp();

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });

      return this.respondToInteraction(interaction, {
        content: `✅ Support ticket created! Head over to ${channel}.`
      });
    } catch (err) {
      logger.error({ error: err.message }, 'Failed to create ticket channel');
      return this.respondToInteraction(interaction, {
        content: '❌ Failed to create ticket channel. Ensure bot has permission to manage channels.'
      });
    }
  }

  async handleSelectMenuInteraction(interaction) {
    const { customId, values } = interaction;
    const selectedValue = values?.[0];

    const isV2 = (selectedValue === 'join_queue');
    await this.acknowledgeInteraction(interaction, isV2);

    if (customId === 'platform_select') {
      if (!selectedValue) {
        return this.respondToInteraction(interaction, {
          content: '❌ No platform was selected. Please try again.'
        });
      }
      
      return this.handlePlatformButton(interaction, selectedValue);
    }

    if (customId.startsWith('platform_')) {
      const action = selectedValue || customId.replace('platform_', '');
      return this.handlePlatformButton(interaction, action);
    }

    return this.respondToInteraction(interaction, {
      content: 'Select menu action not supported yet.'
    });
  }

  async handlePlatformButton(interaction, action) {
    const userId = interaction.user.id;

    if (!this.app?.queueSystem) {
      const { QueueSystem } = await import('../queue/queueSystem.js');
      if (this.app) this.app.queueSystem = new QueueSystem();
    }
    const queueSystem = this.app?.queueSystem;

    switch (action) {
      case 'join_queue': {
        const gifPath = path.join(__dirname, '../../standard.gif');
        const hasGif = fs.existsSync(gifPath);
        const files = hasGif ? [new AttachmentBuilder(gifPath, { name: 'standard.gif' })] : [];

        const container = ContainerFactory.buildLearningPlatformContainer(hasGif);

        return this.respondToInteraction(interaction, {
          components: [container],
          files,
          flags: MessageFlags.IsComponentsV2
        });
      }

      case "join_sparxMaths":
      case "join_sparxReader":
      case "join_sparxScience":
      case "join_languagenut":
      case "join_bedrock":
      case "join_seneca": {
        const selectedPlatform = action.replace("join_", "");

        if (!queueSystem) {
          return this.respondToInteraction(interaction, {
            content: 'Queue system is not available.'
          });
        }

        const platformMap = {
          sparxMaths: { name: "Sparx Maths", key: "sparxMaths", emoji: "<:SparxMaths:1515672129188790302>" },
          sparxReader: { name: "Sparx Reader", key: "sparxReader", emoji: "<:SparxReader:1515672202375204945>" },
          sparxScience: { name: "Sparx Science", key: "sparxScience", emoji: "<:SparxScience:1515672274051797072>" },
          languagenut: { name: "LanguageNut", key: "languagenut", emoji: "<:LanguageNut:1515672374878670858>" },
          bedrock: { name: "Bedrock", key: "bedrock", emoji: "<:Bedrock:1529265581273124935>" },
          seneca: { name: "Seneca", key: "seneca", emoji: "<:Seneca:1515672492512120963>" }
        };

        const platform = platformMap[selectedPlatform];

        if (!platform) {
          return this.respondToInteraction(interaction, {
            content: '❌ Unknown platform.'
          });
        }

        this.pendingLogins.set(userId, {
          platform: platform.key,
          name: platform.name,
          createdAt: Date.now()
        });

        setTimeout(() => {
          this.pendingLogins.delete(userId);
        }, 300000);

        const embed = new EmbedBuilder()
          .setColor("#F4A300")
          .setTitle(`${platform.emoji} ${platform.name} Login`)
          .setDescription(
            "**Login by simply inputting your username and password, logging in with cookies, or choosing one of your saved accounts.**"
          )
          .setFooter({ text: "🥭 MangoAI" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`login_${selectedPlatform}`)
            .setLabel("Login")
            .setEmoji("🔑")
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId(`cookies_${selectedPlatform}`)
            .setLabel("Login with Cookies")
            .setEmoji("🍪")
            .setStyle(ButtonStyle.Secondary),

          new ButtonBuilder()
            .setCustomId(`saved_${selectedPlatform}`)
            .setLabel("Saved Accounts")
            .setEmoji("💾")
            .setStyle(ButtonStyle.Success)
        );

        return this.respondToInteraction(interaction, {
          embeds: [embed],
          components: [row]
        });
      }

      case 'settings': {
        const settingsEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('⚙️ MangoAI Settings')
          .setDescription('Configure your MangoAI experience:')
          .addFields(
            { name: '📋 Saved Accounts', value: 'Configure your platform accounts in the .env file.' },
            { name: '🔔 Notifications', value: 'Homework updates are sent to this channel.' },
            { name: '⏰ Auto-Schedule', value: 'Use !schedule create to set up automatic reminders.' }
          )
          .setTimestamp()
          .setFooter({ text: '🥭 MangoAI • Settings' });

        return this.respondToInteraction(interaction, {
          embeds: [settingsEmbed]
        });
      }

      case 'feedback': {
        const feedbackEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('💬 Feedback & Suggestions')
          .setDescription('We value your feedback! Here\'s how to share:')
          .addFields(
            { name: '📝 Create a Ticket', value: 'Use !ticket create feedback <your message>' },
            { name: '💡 Feature Requests', value: 'Use !ticket create suggestion <your idea>' },
            { name: '🐛 Report a Bug', value: 'Use !ticket create bug <description>' }
          )
          .setTimestamp()
          .setFooter({ text: '🥭 MangoAI • Your feedback shapes our future' });

        return this.respondToInteraction(interaction, {
          embeds: [feedbackEmbed]
        });
      }

      default: {
        return this.respondToInteraction(interaction, {
          content: 'Unknown platform action.'
        });
      }
    }
  }

  async respondToInteraction(interaction, payload) {
    try {
      if (interaction.deferred || interaction.replied) {
        const { flags, ...editPayload } = payload;
        return await interaction.editReply(editPayload);
      }

      let flags = MessageFlags.Ephemeral;
      if (payload.flags !== undefined) {
        flags = payload.flags;
      }

      return await interaction.reply({
        ...payload,
        flags
      });
    } catch (error) {
      logger.error(
        { error: error.message, customId: interaction.customId },
        'Failed to respond to interaction'
      );

      if (interaction.deferred || interaction.replied) {
        return await interaction.followUp({
          content: '❌ Error processing action.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  }

  async startScheduleLoop() {
    if (this.scheduleLoop) return;

    this.scheduleLoop = setInterval(async () => {
      if (!this.app?.scheduleManager) return;

      const schedules = this.app.scheduleManager.getSchedulesToRun();
      if (!schedules.length) return;

      for (const schedule of schedules) {
        const channel = await this.getChannelByConfigKey('autoSchedule');
        if (!channel) continue;

        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📅 Auto Schedule Triggered')
          .setDescription(`Your scheduled homework job is ready for **${schedule.platform}**.`)
          .addFields(
            { name: 'Schedule', value: schedule.name, inline: true },
            { name: 'Platform', value: schedule.platform, inline: true },
            { name: 'Next Run', value: schedule.nextRun ? schedule.nextRun.toLocaleString() : 'N/A', inline: false }
          )
          .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => null);

        this.app.scheduleManager.markAsRun(schedule.id);
      }
    }, 30000);
  }

  stopScheduleLoop() {
    if (this.scheduleLoop) {
      clearInterval(this.scheduleLoop);
      this.scheduleLoop = null;
    }
  }

  async replyToChannel(message, payload) {
    const guildSession = message.guild
      ? this.activeSessions.get(message.guild.id)
      : null;

    if (guildSession && !this.isSessionChannel(message.channel.id, guildSession)) {
      return this.routeReply(message, payload, guildSession);
    }

    return message.channel.send(payload);
  }

  async routeReply(message, payload, guildSession) {
    const session = guildSession || (
      message.guild ? this.activeSessions.get(message.guild.id) : null
    );

    if (!session) {
      return message.channel.send(payload);
    }

    const mainChannel = message.guild.channels.cache.get(session.mainChannelId);

    if (mainChannel) {
      return mainChannel.send(payload);
    }

    return message.channel.send(payload);
  }

  isSessionChannel(channelId, guildSession) {
    const session = guildSession || (
      this.activeSessions.size
        ? Array.from(this.activeSessions.values()).find(s =>
            Object.values(s.channelIds || {}).includes(channelId)
          )
        : null
    );

    if (!session) return false;

    return Object.values(session.channelIds || {}).includes(channelId);
  }

  formatUptime(ms) {
    if (!ms) return 'N/A';

    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  async login() {
    try {
      await this.client.login(config.discord.token);
      logger.info('Discord bot logged in successfully');
      this.startScheduleLoop();
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to login to Discord');
      throw error;
    }
  }

  setPresence() {
    const activities = [
      { name: '📚 Homework Solutions', type: ActivityType.Watching },
      { name: '📈 Your Progress', type: ActivityType.Watching },
      { name: '✨ Students Learning', type: ActivityType.Watching },
      { name: '🧠 AI Tutoring', type: ActivityType.Watching },
      { name: '🥭 MangoAI 🎓', type: ActivityType.Playing },
      { name: '🤖 Smart Learning', type: ActivityType.Playing },
      { name: '⚡ Solving Problems', type: ActivityType.Playing },
      { name: '🎯 Education Magic', type: ActivityType.Playing }
    ];

    if (this.presenceInterval) clearInterval(this.presenceInterval);

    const updatePresence = () => {
      try {
        const activity = activities[Math.floor(Math.random() * activities.length)];

        this.client.user.setPresence({
          activities: [activity],
          status: 'online'
        });

        logger.info({ activity: activity.name, type: activity.type }, '🎭 Bot presence updated');
      } catch (error) {
        logger.error({ error: error.message }, '❌ Failed to update presence');
      }
    };

    updatePresence();
    this.presenceInterval = setInterval(updatePresence, 30000);
  }

  async clearChannelMessages(channelKey) {
    const channel = await this.getChannelByConfigKey(channelKey);
    if (!channel) return;

    try {
      let deletedCount = 0;

      while (true) {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size === 0) break;

        const fourteenDaysAgo = Date.now() - 1209600000;

        const youngMessages = messages.filter(
          msg => msg.createdTimestamp > fourteenDaysAgo
        );
        const oldMessages = messages.filter(
          msg => msg.createdTimestamp <= fourteenDaysAgo
        );

        if (youngMessages.size > 0) {
          const deletedBatch = await channel.bulkDelete(youngMessages, true);
          deletedCount += deletedBatch.size;
        }

        if (oldMessages.size > 0) {
          for (const msg of oldMessages.values()) {
            await msg.delete().catch(() => {});
            deletedCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (youngMessages.size === 0 && oldMessages.size === 0) break;
      }

      if (deletedCount > 0) {
        logger.info(
          { channel: channelKey, messagesDeleted: deletedCount },
          '🗑️ Cleared channel'
        );
      }
    } catch (error) {
      logger.warn(
        { channel: channelKey, error: error.message },
        'Failed to clear channel'
      );
    }
  }

  async sendStartupMessages() {
    try {
      const channels = config.discord.channels;

      logger.info('🗑️ Clearing all channels before refresh...');

      if (channels.learningPlatform) await this.clearChannelMessages('learningPlatform');
      if (channels.autoSchedule) await this.clearChannelMessages('autoSchedule');
      if (channels.supportTickets) await this.clearChannelMessages('supportTickets');

      // LEARNING PLATFORM CHANNEL
      if (channels.learningPlatform) {
        const gifPath = path.join(__dirname, '../../standard.gif');
        const hasGif = fs.existsSync(gifPath);

        // Build embed using your static method
        const platformEmbed = EmbedFactory.buildLearningPlatformEmbed();

        // Row 1: Join Queue (Blue), Saved Accounts (Grey), Group Queue (Grey)
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('platform_join_queue').setLabel('Join Queue').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('platform_saved_accounts').setLabel('Saved Accounts').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('platform_group_queue').setLabel('Group Queue').setStyle(ButtonStyle.Secondary)
        );

        // Row 2: Check Queue (Grey), Tutorials (Grey), View Slots (Grey)
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('platform_check_queue').setLabel('Check Queue').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('platform_tutorials').setLabel('Tutorials').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('platform_view_slots').setLabel('View Slots').setStyle(ButtonStyle.Secondary)
        );

        // Row 3: History (Grey), Settings (Blue), Feedback (Grey)
        const row3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('platform_history').setLabel('History').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('platform_settings').setLabel('Settings').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('platform_feedback').setLabel('Feedback').setStyle(ButtonStyle.Secondary)
        );

        const payload = {
          embeds: [platformEmbed],
          components: [row1, row2, row3]
        };

        if (hasGif) {
          payload.files = [new AttachmentBuilder(gifPath, { name: 'standard.gif' })];
        }

        await this.sendToConfiguredChannel('learningPlatform', payload)
          .catch(err => logger.warn({ channel: 'learningPlatform', error: err.message }, 'Failed to send startup message'));
      }

      logger.info('✅ All channels refreshed and ready!');
    } catch (error) {
      logger.error({ error: error.message }, 'Error sending startup messages');
    }
  }

  async openLoginModal(interaction, platform) {
    const modal = new ModalBuilder()
      .setCustomId(`school_login_${platform}`)
      .setTitle("Login with your school credentials");

    const school = new TextInputBuilder()
      .setCustomId("school")
      .setLabel("School")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Your school name")
      .setRequired(true);

    const login = new TextInputBuilder()
      .setCustomId("login")
      .setLabel("Username / Email")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Email / Username")
      .setRequired(true);

    const password = new TextInputBuilder()
      .setCustomId("password")
      .setLabel("Password")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Password")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(school),
      new ActionRowBuilder().addComponents(login),
      new ActionRowBuilder().addComponents(password)
    );

    await interaction.showModal(modal);
  }

  async openCookieModal(interaction, platform) {
    const modal = new ModalBuilder()
      .setCustomId(`cookie_login_${platform}`)
      .setTitle(`Login with Cookies: ${platform}`);

    const cookiesInput = new TextInputBuilder()
      .setCustomId("cookies_input")
      .setLabel("Session Cookies JSON / Header")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Paste session cookies here...")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(cookiesInput));
    await interaction.showModal(modal);
  }

  async close() {
    try {
      await this.client.destroy();
      logger.info("Discord bot disconnected");
    } catch (error) {
      logger.error({ error: error.message }, "Error closing Discord bot");
    }
  }
}

export default DiscordBot;