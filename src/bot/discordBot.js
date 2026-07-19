import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, PermissionsBitField, ActivityType, AttachmentBuilder } from 'discord.js';
import { EmbedFactory, ActionRowFactory } from './embedFactory.js';
import logger from '../utils/logger.js';
import config from '../utils/config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
      ],
    });

    this.commandHandler = null;
    this.activeSessions = new Map();
    this.app = null;
    this.scheduleLoop = null;
    this.presenceInterval = null;
    this.setupEventHandlers();
  }

  setCommandHandler(handler) {
    this.commandHandler = handler;
  }

  setApp(app) {
    this.app = app;
  }

  setupEventHandlers() {
    this.client.once('ready', () => {
      logger.info({ username: this.client.user.username }, 'Discord bot is ready');
      this.setPresence();
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      if (!message.content.startsWith(config.discord.prefix)) return;

      const args = message.content.slice(config.discord.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      try {
        await this.handleCommand(command, args, message);
      } catch (error) {
        logger.error({ error: error.message, command }, 'Error handling command');
        await this.replyToChannel(message, {
          content: `❌ An error occurred: ${error.message}`,
        });
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      try {
        await this.handleButtonInteraction(interaction);
      } catch (error) {
        logger.error({ error: error.message, customId: interaction.customId }, 'Error handling button interaction');
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '❌ There was an error handling that button.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ There was an error handling that button.', ephemeral: true });
        }
      }
    });

    this.client.on('error', (error) => {
      logger.error({ error: error.message }, 'Discord client error');
    });
  }

  async handleCommand(command, args, message) {
    logger.info({ command, author: message.author.username }, 'Command received');

    // Use command handler if available
    if (this.commandHandler && this.commandHandler.commands.has(command)) {
      try {
        return await this.commandHandler.commands.get(command)(message, args);
      } catch (error) {
        logger.error({ error: error.message }, 'Command error');
        return await this.replyToChannel(message, `❌ Error: ${error.message}`);
      }
    }

    switch (command) {
      case 'help':
        await this.handleHelp(message);
        break;
      case 'solve':
        await this.handleSolve(message, args);
        break;
      case 'status':
        await this.handleStatus(message);
        break;
      case 'ping':
        await this.replyToChannel(message, `🏓 Pong! ${this.client.ws.ping}ms`);
        break;
      default:
        await this.replyToChannel(message, '❓ Unknown command. Use `!help` for available commands.');
    }
  }

  async handleHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Auto Completer Commands')
      .addFields(
        { name: '**Homework**', value: '`!homework` - View your homework progress\n`!homework create [subject] [name]` - Create new task\n`!tasks` - Alias for homework' },
        { name: '**Premium**', value: '`!premium` - View premium tiers\n`!trial claim` - Start free trial' },
        { name: '**Queue**', value: '`!queue` - View queue status\n`!join [platform]` - Join queue' },
        { name: '**Past Papers**', value: '`!pastpapers` - View the latest past papers\n`!pastpapers <subject>` - Search by subject' },
        { name: '**Scheduler**', value: '`!schedule` - View your schedules\n`!schedule create [platform] [time] [days...]` - Create schedule' },
        { name: '**Info**', value: '`!stats` - Bot statistics\n`!help` - This message\n`!ping` - Check latency' }
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

    await this.replyToChannel(message, `🔄 Processing your request for ${platform}...\nQuestion: ${question}`);
    // Processing logic would be implemented here
  }

  async handleStatus(message) {
    const guildSession = message.guild ? this.activeSessions.get(message.guild.id) : null;
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

  async ensureGuildSession(message) {
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
      logger.info({ channelKey: key, channelId: channel.id }, 'Sending message to configured Discord channel');
      return channel.send(payload);
    }

    if (fallbackChannel) {
      logger.info({ channelKey: key }, 'Falling back to current Discord channel');
      return fallbackChannel.send(payload);
    }

    return null;
  }

  async handleButtonInteraction(interaction) {
    await this.acknowledgeInteraction(interaction);

    const [group, action] = interaction.customId.split('_');

    if (group === 'homework') {
      return this.handleHomeworkButton(interaction, action);
    }

    if (group === 'pastpapers') {
      return this.handlePastPapersButton(interaction, action);
    }

    if (group === 'schedule') {
      return this.handleScheduleButton(interaction, action);
    }

    if (group === 'support') {
      return this.respondToInteraction(interaction, { content: 'Support buttons are not yet available here. Use the support page command.' });
    }

    if (group === 'ticket') {
      return this.respondToInteraction(interaction, { content: 'Ticket button actions will be available soon.' });
    }

    return this.respondToInteraction(interaction, { content: 'Button action not supported yet.' });
  }

  async handleHomeworkButton(interaction, action) {
    const userId = interaction.user.id;
    const tracker = this.app?.homeworkTracker;
    const buttons = ActionRowFactory.buildHomeworkButtons();

    if (!tracker) {
      return this.respondToInteraction(interaction, { content: 'Homework tracker is not available.' });
    }

    if (action === 'create') {
      return this.respondToInteraction(interaction, { content: 'Use `!homework create [subject] [name]` to add a new task, for example: `!homework create Math Algebra`.' });
    }

    if (action === 'view') {
      const tasks = tracker.getActiveTasks(userId);
      const summary = tracker.getProgressSummary(userId);
      const embed = EmbedFactory.buildHomeworkEmbed(tasks, summary);
      return this.respondToInteraction(interaction, { embeds: [embed], components: [buttons] });
    }

    if (action === 'schedule') {
      return this.respondToInteraction(interaction, { content: 'Use `!schedule create [platform] [time] [days...]` to configure automatic homework scheduling.' });
    }

    return this.respondToInteraction(interaction, { content: 'Unknown homework action.' });
  }

  async handlePastPapersButton(interaction, action) {
    if (action === 'latest') {
      const embed = EmbedFactory.buildPastPapersEmbed('Latest');
      let posted = false;

      const configuredChannel = await this.getChannelByConfigKey('pastPapers');
      if (configuredChannel) {
        try {
          await configuredChannel.send({ embeds: [embed] });
          posted = true;
        } catch (err) {
          logger.error({ err: err.message }, 'Failed to send past papers to configured channel');
        }
      }

      if (!posted) {
        try {
          if (interaction.channel) {
            await interaction.channel.send({ embeds: [embed] });
            posted = true;
          }
        } catch (err) {
          logger.error({ err: err.message }, 'Failed to send past papers to interaction channel');
        }
      }

      const replyMsg = posted
        ? 'Posted the latest past papers to the configured channel.'
        : 'Unable to post past papers to the configured channel or this channel.';

      return this.respondToInteraction(interaction, { content: replyMsg });
    }

    if (action === 'search') {
      return this.respondToInteraction(interaction, { content: 'Search past papers by typing `!pastpapers <subject>`.' });
    }

    return this.respondToInteraction(interaction, { content: 'Unknown past paper action.' });
  }

  async handleScheduleButton(interaction, action) {
    if (action === 'create') {
      return this.respondToInteraction(interaction, { content: 'Create a schedule with `!schedule create [platform] [time] [days...]`.' });
    }
    if (action === 'manage') {
      return this.respondToInteraction(interaction, { content: 'Manage schedules with `!schedule` and then update or delete the entries shown.' });
    }
    return this.respondToInteraction(interaction, { content: 'Unknown schedule action.' });
  }

  async acknowledgeInteraction(interaction) {
    if (interaction.deferred || interaction.replied) return;

    try {
      await interaction.deferReply({ flags: 64 });
    } catch (error) {
      logger.warn({ error: error.message }, 'Could not defer interaction reply');
    }
  }

  async respondToInteraction(interaction, payload) {
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(payload).catch(() => interaction.followUp(payload));
    }

    return interaction.reply({ ...payload, flags: 64 }).catch(() => null);
  }

  async startScheduleLoop() {
    if (this.scheduleLoop) return;
    this.scheduleLoop = setInterval(async () => {
      if (!this.app?.scheduleManager) return;
      const schedules = this.app.scheduleManager.getSchedulesToRun();
      if (!schedules.length) return;

      for (const schedule of schedules) {
        const channel = await this.getChannelByConfigKey('schedule');
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
    const guildSession = message.guild ? this.activeSessions.get(message.guild.id) : null;
    if (guildSession && !this.isSessionChannel(message.channel.id, guildSession)) {
      return this.routeReply(message, payload, guildSession);
    }

    return message.channel.send(payload);
  }

  async routeReply(message, payload, guildSession) {
    const session = guildSession || (message.guild ? this.activeSessions.get(message.guild.id) : null);
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
    const session = guildSession || (this.activeSessions.size ? Array.from(this.activeSessions.values()).find(s => Object.values(s.channelIds || {}).includes(channelId)) : null);
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

  /**
   * Set bot's presence/profile status
   */
  setPresence() {
    const activities = [
      { name: '📚 Homework Solutions', type: ActivityType.Watching },
      { name: '📈 Your Progress', type: ActivityType.Watching },
      { name: '✨ Students Learning', type: ActivityType.Watching },
      { name: '🧠 AI Tutoring', type: ActivityType.Watching },
      { name: '🥭 MangoAI 🎓', type: ActivityType.Playing },
      { name: '🤖 Smart Learning', type: ActivityType.Playing },
      { name: '⚡ Solving Problems', type: ActivityType.Playing },
      { name: '🎯 Education Magic', type: ActivityType.Playing },
    ];

    // Clear existing interval if any
    if (this.presenceInterval) clearInterval(this.presenceInterval);

    const updatePresence = () => {
      try {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        this.client.user.setPresence({
          activities: [activity],
          status: 'online',
        });
        logger.info({ activity: activity.name, type: activity.type }, '🎭 Bot presence updated');
      } catch (error) {
        logger.error({ error: error.message }, '❌ Failed to update presence');
      }
    };

    // Set initial presence
    updatePresence();

    // Rotate presence every 30 seconds
    this.presenceInterval = setInterval(updatePresence, 30000);
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

  /**
   * Clear all messages from a channel
   */
  async clearChannelMessages(channelKey) {
    const channel = await this.getChannelByConfigKey(channelKey);
    if (!channel) return;

    try {
      let deleted = 0;

      // Fetch and delete messages in batches
      while (true) {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size === 0) break;

        const deletePromises = messages.map(msg => msg.delete().catch(() => null));
        await Promise.all(deletePromises);
        deleted += deletePromises.length;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (deleted > 0) {
        logger.info({ channel: channelKey, messagesDeleted: deleted }, '🗑️ Cleared channel');
      }
    } catch (error) {
      logger.warn({ channel: channelKey, error: error.message }, 'Failed to clear channel');
    }
  }

  /**
   * Send startup messages to all configured channels
   */
  async sendStartupMessages() {
    try {
      const channels = config.discord.channels;
      
      logger.info('🗑️ Clearing all channels before refresh...');

      // Clear all configured channels first
      if (channels.learningPlatform) await this.clearChannelMessages('learningPlatform');
      if (channels.autoSchedule) await this.clearChannelMessages('autoSchedule');
      if (channels.supportTickets) await this.clearChannelMessages('supportTickets');

      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.info('📤 Sending fresh startup messages...');

      // Message for learning platform channel with GIF
      if (channels.learningPlatform) {
        const platformEmbed = EmbedFactory.buildLearningPlatformEmbed();
        const platformButtons = ActionRowFactory.buildLearningPlatformButtons();
        
        // Prepare GIF attachment if it exists
        let messagePayload = { embeds: [platformEmbed], components: platformButtons };
        try {
          const gifPath = path.join(__dirname, '../../standard.gif');
          const attachment = new AttachmentBuilder(gifPath, { name: 'standard.gif' });
          messagePayload.files = [attachment];
        } catch (err) {
          logger.warn({ error: err.message }, '⚠️ Could not load GIF file');
        }
        
        await this.sendToConfiguredChannel('learningPlatform', messagePayload).catch(err => 
          logger.warn({ channel: 'learningPlatform', error: err.message }, 'Failed to send startup message to learning platform channel')
        );
      }

      // Message for auto schedule channel
      if (channels.autoSchedule) {
        const scheduleEmbed = EmbedBuilder.from(EmbedFactory.buildScheduleEmbed([]))
          .setTitle('🥭 MangoAI • Auto-Schedule Manager')
          .setDescription('⏰ **Automate Your Study Schedule**\n\nSet up intelligent reminders and let MangoAI help you stay on track with your homework.')
          .setColor('#5865F2');
        const scheduleButtons = ActionRowFactory.buildAutoScheduleButtons();
        await this.sendToConfiguredChannel('autoSchedule', { embeds: [scheduleEmbed], components: [scheduleButtons] }).catch(err => 
          logger.warn({ channel: 'autoSchedule', error: err.message }, 'Failed to send startup message to auto-schedule channel')
        );
      }

      // Message for support tickets channel
      if (channels.supportTickets) {
        const supportEmbed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('🥭 MangoAI • Support & Help Center')
          .setDescription('**Get instant support from our team**\n\nHave questions? Create a support ticket and we\'ll help you ASAP.')
          .addFields(
            {
              name: '💬 How It Works',
              value: 'Click **Create Ticket** → Describe your issue → Get help quickly',
              inline: false,
            },
            {
              name: '⏱️ Response Times',
              value: '**Daytime:** 1-2 hours\n**Overnight:** Next morning',
              inline: false,
            }
          )
          .setTimestamp()
          .setFooter({ text: '🥭 MangoAI Support • Always here to help' });
        const supportButtons = ActionRowFactory.buildSupportTicketButtons();
        await this.sendToConfiguredChannel('supportTickets', { embeds: [supportEmbed], components: [supportButtons] }).catch(err => 
          logger.warn({ channel: 'supportTickets', error: err.message }, 'Failed to send startup message to support tickets channel')
        );
      }

      logger.info('✅ All channels refreshed and ready!');
    } catch (error) {
      logger.error({ error: error.message }, 'Error sending startup messages');
    }
  }

  async close() {
    try {
      await this.client.destroy();
      logger.info('Discord bot disconnected');
    } catch (error) {
      logger.error({ error: error.message }, 'Error closing Discord bot');
    }
  }
}

export default DiscordBot;
