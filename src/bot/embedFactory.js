import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize
} from 'discord.js';

export class ContainerFactory {
  static buildLearningPlatformContainer() {
    const container = new ContainerBuilder()
      .setAccentColor(16032512) // #F4A300 decimal value
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("# Choose a Platform\n\n> Select the service you want to join.\n> MangoAI will open the correct login flow for that platform.")
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("👇 **Select a platform below**")
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("platform_select")
            .setPlaceholder("Select a Platform")
            .addOptions(
              new StringSelectMenuOptionBuilder().setLabel("Sparx Maths").setValue("join_sparxMaths").setEmoji({ name: "📚" }),
              new StringSelectMenuOptionBuilder().setLabel("Sparx Reader").setValue("join_sparxReader").setEmoji({ name: "📖" }),
              new StringSelectMenuOptionBuilder().setLabel("Sparx Science").setValue("join_sparxScience").setEmoji({ name: "🔬" })
            )
        )
      );

    return [container];
  }
}

export const platformLoginData = {
  sparxMaths: {
    name: "Sparx Maths",
    emoji: "<:SparxMaths:1515672129188790302>",
    description: "Login to your Sparx Maths account."
  },
  sparxReader: {
    name: "Sparx Reader",
    emoji: "<:SparxReader:1515672202375204945>",
    description: "Login to your Sparx Reader account."
  },
  sparxScience: {
    name: "Sparx Science",
    emoji: "<:SparxScience:1515672274051797072>",
    description: "Login to your Sparx Science account."
  },
  languagenut: {
    name: "LanguageNut",
    emoji: "<:LanguageNut:1515672374878670858>",
    description: "Login to your LanguageNut account."
  },
  bedrock: {
    name: "Bedrock",
    emoji: "<:Bedrock:1529265581273124935>",
    description: "Login to your Bedrock account."
  },
  seneca: {
    name: "Seneca",
    emoji: "<:Seneca:1515672492512120963>",
    description: "Login to your Seneca account."
  }
};

/**
 * Discord Embed Builders for rich UI
 */
export class EmbedFactory {
  static buildProgressBar(progress, length = 20) {
    const filled = Math.round((progress / 100) * length);
    const empty = length - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${progress}%`;
  }

  static buildLoginEmbed(platform) {
  const data = platformLoginData[platform];

  if (!data) {
    return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Unknown Platform')
      .setDescription('This platform is not supported.')
      .setFooter({
        text: '🥭 MangoAI V2'
      });
  }

  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`${data.emoji} ${data.name} Login`)
    .setDescription(
      `**Login**\n\n` +
      `${data.description}\n\n` +
      `Choose how you want to connect your account:\n\n` +
      `🔑 **Login**\nEnter your username and password.\n\n` +
      `🍪 **Login with Cookies**\nUse your saved session cookies.\n\n` +
      `💾 **Saved Accounts**\nSelect from your previously saved accounts.`
    )
    .addFields(
      {
        name: 'Platform',
        value: `${data.emoji} ${data.name}`,
        inline: true
      },
      {
        name: 'Status',
        value: '🟢 Online',
        inline: true
      }
    )
    .setTimestamp()
    .setFooter({
      text: '🥭 MangoAI V2'
    });
}
  
  /**
   * Build MangoAI Learning Platform embed - Clean & Professional
   */
  static buildLearningPlatformEmbed() {
    return new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('MangoAI Learning Platform')
      .setDescription(
        '**[FAQ ↗](https://discord.com)**\n\n' +
        '> Your gateway to personalised AI\n' +
        '> tutoring assistance.\n' +
        '> \n' +
        '> Our verified tutors are available to\n' +
        '> help you across multiple fields of\n' +
        '> study.\n\n' +
        'Press the `Join Queue` button below to connect with a qualified tutor.\n\n' +
        '__**Notes**__\n' +
        '• Get personalised help for all your questions\n' +
        '• Connect with experienced tutors in real-time\n' +
        '• Solves the top 5% most difficult problems\n' +
        '• Secure and confidential tutoring sessions'
      )
      .setThumbnail('attachment://standard.gif');
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
    // Row 1
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('platform_join_queue')
        .setLabel('Join Queue')
        .setStyle(ButtonStyle.Secondary), // Changed to Gray
      new ButtonBuilder()
        .setCustomId('platform_join_saved')
        .setLabel('Saved Accounts')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('platform_join_group')
        .setLabel('Group Queue')
        .setStyle(ButtonStyle.Secondary)
    );

    // Row 2
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
        .setStyle(ButtonStyle.Secondary)
    );

    // Row 3
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('platform_history')
        .setLabel('History')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('platform_settings')
        .setLabel('Settings')
        .setStyle(ButtonStyle.Secondary), // Changed to Gray
      new ButtonBuilder()
        .setCustomId('platform_feedback')
        .setLabel('Feedback')
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

  static buildLoginButtons(platform) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`login_${platform}`)
        .setLabel('🔑 Login')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`cookies_${platform}`)
        .setLabel('🍪 Cookies')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`saved_${platform}`)
        .setLabel('💾 Saved Accounts')
        .setStyle(ButtonStyle.Success)
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

export default {
  EmbedFactory,
  ActionRowFactory,
  platformLoginData
};
