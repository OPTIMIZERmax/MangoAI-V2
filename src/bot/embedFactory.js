import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import logger from '../utils/logger.js';

/**
 * Discord Embed Builders for rich UI
 */
export class EmbedFactory {
  /**
   * Build progress bar
   */
  static buildProgressBar(progress, length = 20) {
    const filled = Math.round((progress / 100) * length);
    const empty = length - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${progress}%`;
  }

  /**
   * Build MangoAI Learning Platform embed - Clean & Professional
   */
  static buildLearningPlatformEmbed() {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🥭 MangoAI Learning Platform')
      .setDescription('**Your gateway to personalised AI tutoring assistance**\n\nOur verified AI tutors are available to help you across multiple fields of study. Connect with qualified assistance in real-time and solve your most challenging problems.')
      .addFields(
        {
          name: '✨ Key Features',
          value: '🔹 Personalised tutoring for all subjects\n🔹 Real-time expert assistance\n🔹 Solves top 5% most difficult problems\n🔹 Secure & confidential sessions',
          inline: false,
        },
        {
          name: '⚡ Quick Start',
          value: 'Press **Join Queue** below to connect with a tutor now',
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: '🥭 MangoAI • Powered by AI Tutors' });
    return embed;
  }

  /**
   * Build homework progress embed
   */
  static buildHomeworkEmbed(tasks, summary) {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🥭 MangoAI • Homework Progress')
      .setTimestamp();

    if (tasks.length === 0) {
      embed.setDescription('No active homework tasks. Create one with `!homework create`!');
      return embed;
    }

    // Add task details
    for (const task of tasks.slice(0, 10)) {
      const progressBar = this.buildProgressBar(task.progress);
      embed.addFields({
        name: `${task.subject} • ${task.name}`,
        value: `\`${progressBar}\`\n⏱️ Time: ${this._formatTime(task.totalTimeSpent)} | 📊 ${task.completedQuestions}/${task.totalQuestions} questions`,
        inline: false,
      });
    }

    // Add summary
    embed.addFields({
      name: '\u200b',
      value: '\u200b',
    });

    embed.addFields(
      {
        name: '📈 Overall Stats',
        value: `**Tasks**: ${summary.completedTasks}/${summary.totalTasks} completed\n**Progress**: ${summary.averageProgress}%`,
        inline: true,
      },
      {
        name: '⏱️ Total Time',
        value: `${this._formatTime(summary.totalTimeSpent)}`,
        inline: true,
      }
    );

    embed.setFooter({ text: '🥭 MangoAI • Smart homework completion' });
    return embed;
  }

  /**
   * Build premium info embed
   */
  static buildPremiumEmbed(tierInfo, tiers) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🥭 MangoAI • Premium Plans')
      .setDescription('Unlock unlimited homework power with MangoAI Premium.')
      .setTimestamp();

    for (const [tierName, tierData] of Object.entries(tiers)) {
      const isCurrentTier = tierInfo.tier === tierName;
      const badge = isCurrentTier ? '✅ CURRENT' : '';

      embed.addFields({
        name: `${tierData.name} ${badge}`,
        value: `**${tierData.price}**\n📊 ${tierData.questionsPerDay} questions/day\n${
          tierData.supportsPastPapers ? '📄 Past Papers: ✅' : '📄 Past Papers: ❌'
        }\n${tierData.supportsAutoSchedule ? '📅 Auto Schedule: ✅' : '📅 Auto Schedule: ❌'}`,
        inline: true,
      });
    }

    // Add current usage
    embed.addFields({
      name: '\u200b',
      value: '\u200b',
    });

    embed.addFields({
      name: '📊 Your Usage Today',
      value: `**${tierInfo.dailyUsage}/${tierInfo.tierInfo.questionsPerDay}** questions used`,
      inline: false,
    });

    if (tierInfo.isExpired && tierInfo.tier === 'TRIAL') {
      embed.setDescription('❌ **Your trial has expired!** Upgrade to MangoAI Premium for unlimited access.');
    }

    embed.setFooter({ text: '🥭 MangoAI • Premium membership' });
    return embed;
  }

  /**
   * Build past papers embed
   */
  static buildPastPapersEmbed(topic) {
    const embed = new EmbedBuilder()
      .setColor('#FF8C00')
      .setTitle('📄 Past Papers Hub')
      .setDescription(`Fresh revision resources for **${topic}** are ready to explore.`)
      .addFields(
        { name: '🧠 Latest papers', value: 'Open the latest paper collection for quick revision and exam prep.' },
        { name: '🔎 Search by subject', value: 'Use `!pastpapers <subject>` to target a specific topic or subject.' },
        { name: '⚡ Fast access', value: 'The buttons below make it easy to jump straight into the resources.' }
      )
      .setTimestamp();

    embed.setFooter({ text: '🥭 MangoAI • Past papers library' });
    return embed;
  }

  /**
   * Build trial embed
   */
  static buildTrialEmbed() {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🥭 MangoAI • Free Trial')
      .setDescription('Get 24 hours of unlimited access to all MangoAI features!')
      .addFields(
        {
          name: '✅ What You Get',
          value: '• Unlimited homework questions\n• Auto-scheduling\n• Past papers access\n• Multi-platform support',
        },
        {
          name: '⏰ Duration',
          value: '24 hours of full premium access',
        },
        {
          name: '💰 Upgrade?',
          value: 'Upgrade to MangoAI Premium for just **£10**!',
        }
      )
      .setTimestamp();

    embed.setFooter({ text: '🥭 MangoAI • Limited time offer' });
    return embed;
  }

  /**
   * Build schedule embed
   */
  static buildScheduleEmbed(schedules) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🥭 MangoAI • Auto-Schedules')
      .setDescription('Stay on top of your homework routine with MangoAI automated reminders.')
      .setTimestamp();

    if (schedules.length === 0) {
      embed.addFields({
        name: '⏰ No schedules yet',
        value: 'Create one to automate homework reminders at specific times and days.',
        inline: false,
      });
      embed.setFooter({ text: 'MangoAI • Smart scheduling' });
      return embed;
    }

    for (const schedule of schedules) {
      const status = schedule.isActive ? '✅ Active' : '⛔ Inactive';
      embed.addFields({
        name: `${schedule.name} • ${status}`,
        value: `**Platform**: ${schedule.platform}\n**Days**: ${schedule.daysOfWeek.join(', ')}\n**Time**: ${schedule.time}\n**Next run**: ${
          schedule.nextRun ? schedule.nextRun.toLocaleString() : 'N/A'
        }`,
        inline: false,
      });
    }

    embed.setFooter({ text: '🥭 MangoAI • Automated scheduling' });
    return embed;
  }

  /**
   * Build queue status embed
   */
  static buildQueueEmbed(queueStats) {
    const embed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🥭 MangoAI • Queue Status')
      .setDescription(`**Total in Queues**: ${queueStats.totalInQueues}`)
      .setTimestamp();

    for (const [platform, stats] of Object.entries(queueStats.platformStats)) {
      embed.addFields({
        name: `${platform}`,
        value: `**Position**: ${stats.count > 0 ? `#${stats.count + 1}` : 'Empty'}\n**Est. Wait**: ${stats.avgWait} minutes`,
        inline: true,
      });
    }

    embed.setFooter({ text: '🥭 MangoAI • Queue management' });
    return embed;
  }

  /**
   * Format time
   */
  static _formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

/**
 * Action Row Builders
 */
export class ActionRowFactory {
  static buildLearningPlatformButtons() {
    // Row 1: Join Queue buttons
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('platform_join_queue')
        .setLabel('Join Queue')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('platform_join_saved')
        .setLabel('Join with Saved Accounts')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('platform_join_group')
        .setLabel('Join with Group')
        .setStyle(ButtonStyle.Secondary)
    );

    // Row 2: Status and Info buttons
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('platform_check_queue')
        .setLabel('Check Queue')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('platform_tutorials')
        .setLabel('Tutorials')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('platform_view_slots')
        .setLabel('View Slots')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('platform_history')
        .setLabel('History')
        .setStyle(ButtonStyle.Secondary)
    );

    // Row 3: Settings and feedback
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('platform_settings')
        .setLabel('⚙️ Settings')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('platform_feedback')
        .setLabel('💬 Feedback & Suggestions')
        .setStyle(ButtonStyle.Secondary)
    );

    return [row1, row2, row3];
  }

  static buildAutoScheduleButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('schedule_create')
        .setLabel('➕ Create Schedule')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('schedule_manage')
        .setLabel('⚙️ Manage Schedules')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  static buildSupportTicketButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('support_create')
        .setLabel('📋 Create Ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('support_status')
        .setLabel('📊 Check Status')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  static buildQueueButtons(platform) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`queue_solo_${platform}`)
        .setLabel('Solo Queue')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`queue_saved_${platform}`)
        .setLabel('Saved Accounts')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`queue_group_${platform}`)
        .setLabel('Group Queue')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  static buildPremiumButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('trial_claim')
        .setLabel('🎁 Claim Free Trial')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('premium_buy')
        .setLabel('👑 Buy Premium (£10)')
        .setStyle(ButtonStyle.Primary)
    );
  }

  static buildScheduleButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('schedule_create')
        .setLabel('➕ Create Schedule')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('schedule_manage')
        .setLabel('⚙️ Manage Schedules')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  static buildHomeworkButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('homework_create')
        .setLabel('➕ Add Task')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('homework_view')
        .setLabel('📋 View Tasks')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('homework_schedule')
        .setLabel('🗓️ Schedule')
        .setStyle(ButtonStyle.Success)
    );
  }

  static buildPastPapersButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pastpapers_latest')
        .setLabel('Latest Past Paper')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('pastpapers_search')
        .setLabel('Search Past Papers')
        .setStyle(ButtonStyle.Secondary)
    );
  }
}

export default { EmbedFactory, ActionRowFactory };
