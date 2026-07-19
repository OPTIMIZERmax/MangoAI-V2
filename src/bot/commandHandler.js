import logger from '../utils/logger.js';
import { EmbedFactory, ActionRowFactory } from './embedFactory.js';
import { EmbedBuilder } from 'discord.js';

/**
 * Discord Commands Handler
 */
export class CommandHandler {
  constructor(app) {
    this.app = app;
    this.commands = new Map();
    this.registerCommands();
  }

  registerCommands() {
    // Homework commands
    this.register('homework', this.handleHomework.bind(this));
    this.register('tasks', this.handleHomework.bind(this)); // Alias

    // Past papers commands
    this.register('pastpapers', this.handlePastPapers.bind(this));
    this.register('pastpaper', this.handlePastPapers.bind(this));

    // Premium commands
    this.register('premium', this.handlePremium.bind(this));
    this.register('trial', this.handleTrial.bind(this));

    // Queue commands
    this.register('queue', this.handleQueue.bind(this));
    this.register('join', this.handleJoinQueue.bind(this));

    // Schedule commands
    this.register('schedule', this.handleSchedule.bind(this));

    // Support commands
    this.register('support', this.handleSupport.bind(this));
    this.register('ticket', this.handleTicket.bind(this));

    // Other
    this.register('stats', this.handleStats.bind(this));
  }

  register(name, handler) {
    this.commands.set(name.toLowerCase(), handler);
  }

  /**
   * Handle homework command
   */
  async handleHomework(message, args) {
    const userId = message.author.id;
    const tracker = this.app.homeworkTracker || (this.app.homeworkTracker = new (await import('../session/homeworkTracker.js')).HomeworkTracker());

    const subcommand = args[0]?.toLowerCase();
    const buttons = ActionRowFactory.buildHomeworkButtons();

    if (subcommand === 'create') {
      const subject = args[1] || 'General';
      const name = args.slice(2).join(' ') || 'Homework Task';
      const questions = parseInt(args[args.length - 1]) || 85;

      const task = tracker.createTask(userId, subject, name, questions);
      const embed = EmbedFactory.buildHomeworkEmbed([task], { completedTasks: 0, totalTasks: 1, averageProgress: 0, totalQuestionsCompleted: 0, totalTimeSpent: 0 });
      return await this.postToChannelOrReply(message, { embeds: [embed], components: [buttons] }, 'homework');
    }

    const tasks = tracker.getActiveTasks(userId);
    const summary = tracker.getProgressSummary(userId);
    const embed = EmbedFactory.buildHomeworkEmbed(tasks, summary);
    return await this.postToChannelOrReply(message, { embeds: [embed], components: [buttons] }, 'homework');
  }

  /**
   * Handle premium command
   */
  async handlePremium(message) {
    const userId = message.author.id;
    const premiumManager = this.app.premiumManager || (this.app.premiumManager = new (await import('../session/premiumManager.js')).PremiumManager());

    const tierInfo = premiumManager.getUserTier(userId);
    const tiers = premiumManager.getAllTiers();

    const embed = EmbedFactory.buildPremiumEmbed(tierInfo, tiers);
    const buttons = ActionRowFactory.buildPremiumButtons();

    return await message.reply({ embeds: [embed], components: [buttons] });
  }

  /**
   * Handle trial command
   */
  async handleTrial(message, args) {
    const userId = message.author.id;
    const premiumManager = this.app.premiumManager || (this.app.premiumManager = new (await import('../session/premiumManager.js')).PremiumManager());

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'claim' || subcommand === 'start') {
      const result = premiumManager.startFreeTrial(userId);

      if (result.error) {
        return await message.reply(`❌ ${result.error}`);
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎉 Trial Started!')
        .setDescription('Your 24-hour premium trial is now active!')
        .addFields(
          { name: '✅ Features Unlocked', value: '• Unlimited questions\n• Auto-scheduling\n• Past papers\n• Multi-platform' },
          { name: '⏰ Expires', value: result.expiresAt.toLocaleString() }
        );

      return await message.reply({ embeds: [embed] });
    }

    const embed = EmbedFactory.buildTrialEmbed();
    const buttons = ActionRowFactory.buildPremiumButtons();

    return await message.reply({ embeds: [embed], components: [buttons] });
  }

  /**
   * Handle queue command
   */
  async handleQueue(message) {
    const queueSystem = this.app.queueSystem || (this.app.queueSystem = new (await import('../queue/queueSystem.js')).QueueSystem());

    const stats = queueSystem.getQueueStats();
    const embed = EmbedFactory.buildQueueEmbed(stats);

    const platforms = ['sparxMaths', 'educake', 'drfrost', 'seneca', 'languagenut'];
    const buttons = ActionRowFactory.buildQueueButtons(platforms[0]);

    return await message.reply({ embeds: [embed], components: [buttons] });
  }

  /**
   * Handle join queue command
   */
  async handleJoinQueue(message, args) {
    const userId = message.author.id;
    const platform = args[0] || 'sparxMaths';
    const queueSystem = this.app.queueSystem || (this.app.queueSystem = new (await import('../queue/queueSystem.js')).QueueSystem());

    const entry = queueSystem.joinQueue(userId, platform.toLowerCase(), 'solo');

    if (entry.error) {
      return await message.reply(`❌ ${entry.error} (Position: #${entry.position})`);
    }

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Joined Queue')
      .addFields(
        { name: 'Platform', value: platform, inline: true },
        { name: 'Position', value: `#${entry.position}`, inline: true },
        { name: 'Est. Wait', value: `${entry.estimatedWaitTime} minutes`, inline: true }
      );

    return await message.reply({ embeds: [embed] });
  }

  /**
   * Handle schedule command
   */
  async handleSchedule(message, args) {
    const userId = message.author.id;
    const scheduleManager = this.app.scheduleManager;

    if (!scheduleManager) {
      return await message.reply('Schedule manager is not available.');
    }

    const subcommand = args[0]?.toLowerCase();
    const buttons = ActionRowFactory.buildScheduleButtons();

    if (subcommand === 'create') {
      const platform = args[1] || 'sparxMaths';
      const time = args[2] || '18:00';
      const days = args.slice(3).length > 0 ? args.slice(3) : ['Monday', 'Wednesday', 'Friday'];

      const schedule = scheduleManager.createSchedule(userId, { platform, time, daysOfWeek: days });
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📅 Schedule Created')
        .setDescription(scheduleManager.formatScheduleInfo(schedule));

      return await this.postToChannelOrReply(message, { embeds: [embed], components: [buttons] }, 'schedule');
    }

    const schedules = scheduleManager.getUserSchedules(userId);
    const embed = EmbedFactory.buildScheduleEmbed(schedules);

    return await this.postToChannelOrReply(message, { embeds: [embed], components: [buttons] }, 'schedule');
  }

  /**
   * Handle stats command
   */
  async handlePastPapers(message, args) {
    const topic = args.join(' ') || 'Latest';
    const embed = EmbedFactory.buildPastPapersEmbed(topic);
    const buttons = ActionRowFactory.buildPastPapersButtons();
    return await this.postToChannelOrReply(message, { embeds: [embed], components: [buttons] }, 'pastPapers');
  }

  async handleStats(message) {
    const status = this.app.getStatus();

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📊 Bot Statistics')
      .addFields(
        { name: 'Status', value: status.isRunning ? '✅ Online' : '❌ Offline', inline: true },
        { name: 'Version', value: status.version, inline: true },
        { name: 'Uptime', value: this._formatUptime(status.uptime), inline: true },
        { name: 'Active Platforms', value: `${status.platformsRegistered}`, inline: true },
        { name: 'Active Sessions', value: `${status.sessionsActive}`, inline: true },
        { name: 'AI Requests', value: `${status.bedrockRequests}`, inline: true }
      );

    return await message.reply({ embeds: [embed] });
  }

  /**
   * Handle support command
   */
  async handleSupport(message, args) {
    const { SupportEmbedFactory, SupportActionRowFactory } = await import('./supportEmbeds.js');

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'status') {
      const stats = this.app.supportManager.getStats();
      const embed = SupportEmbedFactory.buildSupportQueueEmbed(stats);
      return await this.postToChannelOrReply(message, { embeds: [embed] }, 'support');
    }

    if (subcommand === 'mytickets') {
      const tickets = this.app.supportManager.getUserTickets(message.author.id);
      const embed = SupportEmbedFactory.buildUserTicketsEmbed(tickets);
      return await this.postToChannelOrReply(message, { embeds: [embed] }, 'support');
    }

    // Main support page
    const mainEmbed = SupportEmbedFactory.buildSupportMainEmbed();
    const buttons1 = SupportActionRowFactory.buildCategoryButtons();
    const buttons2 = SupportActionRowFactory.buildCategoryButtons2();

    return await this.postToChannelOrReply(message, {
      embeds: [mainEmbed],
      components: [buttons1, buttons2],
    }, 'support');
  }

  /**
   * Handle ticket command
   */
  async handleTicket(message, args) {
    const userId = message.author.id;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'create') {
      const category = args[1]?.toLowerCase() || 'general';
      const title = args[2] || 'Support Ticket';
      const description = args.slice(3).join(' ') || 'Please provide more details';

      const ticket = this.app.supportManager.createTicket(userId, category, title, description);

      const { SupportEmbedFactory, SupportActionRowFactory } = await import('./supportEmbeds.js');
      const embed = SupportEmbedFactory.buildTicketCreatedEmbed(ticket);
      const buttons = SupportActionRowFactory.buildTicketActionButtons(ticket.id);

      return await message.reply({ embeds: [embed], components: [buttons] });
    }

    if (subcommand === 'view') {
      const ticketId = args[1];
      const ticket = this.app.supportManager.getTicket(ticketId);

      if (!ticket) {
        return await message.reply('❌ Ticket not found');
      }

      if (ticket.userId !== userId) {
        return await message.reply('❌ You can only view your own tickets');
      }

      const { SupportEmbedFactory, SupportActionRowFactory } = await import('./supportEmbeds.js');
      const embed = SupportEmbedFactory.buildTicketStatusEmbed(ticket);
      const buttons = SupportActionRowFactory.buildTicketActionButtons(ticket.id);

      return await message.reply({ embeds: [embed], components: [buttons] });
    }

    if (subcommand === 'list') {
      const tickets = this.app.supportManager.getUserTickets(userId);
      const { SupportEmbedFactory } = await import('./supportEmbeds.js');
      const embed = SupportEmbedFactory.buildUserTicketsEmbed(tickets);

      return await message.reply({ embeds: [embed] });
    }

    return await message.reply(
      '**Ticket Commands:**\n`!ticket create [category] [title] [description]` - Create ticket\n`!ticket view [ticketId]` - View ticket\n`!ticket list` - List all your tickets'
    );
  }

  async postToChannelOrReply(message, payload, channelKey) {
    if (this.app?.bot && typeof this.app.bot.sendToConfiguredChannel === 'function') {
      const sent = await this.app.bot.sendToConfiguredChannel(channelKey, payload, message.channel).catch(() => null);
      if (sent) {
        return sent;
      }
    }

    return message.channel.send(payload);
  }

  _formatUptime(ms) {
    const seconds = Math.floor(ms) % 60;
    const minutes = Math.floor(ms / 60) % 60;
    const hours = Math.floor(ms / 3600) % 24;
    const days = Math.floor(ms / 86400);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  }
}

export default CommandHandler;
