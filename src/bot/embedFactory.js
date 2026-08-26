import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
} from 'discord.js';

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
        .setColor('#fffb00')
        .setTitle('❌ Unknown Platform')
        .setDescription('This platform is not supported.')
        .setFooter({
          text: '🥭 NexusAI V2'
        });
    }

    return new EmbedBuilder()
      .setColor('#fffb00')
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
        text: '🥭 NexusAI V2'
      });
  }

  static buildHomeworkEmbed(tasks, summary) {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🥭 NexusAI • Homework Progress')
      .setTimestamp();

    if (tasks.length === 0) {
      embed.setDescription('No active homework tasks. Create one with `!homework create`!');
      return embed;
    }

    for (const task of tasks.slice(0, 10)) {
      const progressBar = this.buildProgressBar(task.progress);
      embed.addFields({
        name: `${task.subject} • ${task.name}`,
        value: `\`${progressBar}\`\n⏱️ Time: ${this._formatTime(task.totalTimeSpent)} | 📊 ${task.completedQuestions}/${task.totalQuestions} questions`,
        inline: false,
      });
    }

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

    embed.setFooter({ text: '🥭 NexusAI • Smart homework completion' });
    return embed;
  }

  static buildPremiumEmbed(tierInfo, tiers) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🥭 NexusAI • Premium Plans')
      .setDescription('Unlock unlimited homework power with NexusAI Premium.')
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
      embed.setDescription('❌ **Your trial has expired!** Upgrade to NexusAI Premium for unlimited access.');
    }

    embed.setFooter({ text: '🥭 NexusAI • Premium membership' });
    return embed;
  }

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

    embed.setFooter({ text: '🥭 NexusAI • Past papers library' });
    return embed;
  }

  static buildTrialEmbed() {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🥭 NexusAI • Free Trial')
      .setDescription('Get 24 hours of unlimited access to all NexusAI features!')
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
          value: 'Upgrade to NexusAI Premium for just **£10**!',
        }
      )
      .setTimestamp();

    embed.setFooter({ text: '🥭 NexusAI • Limited time offer' });
    return embed;
  }

  static buildScheduleEmbed(schedules) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🥭 NexusAI • Auto-Schedules')
      .setDescription('Stay on top of your homework routine with NexusAI automated reminders.')
      .setTimestamp();

    if (schedules.length === 0) {
      embed.addFields({
        name: '⏰ No schedules yet',
        value: 'Create one to automate homework reminders at specific times and days.',
        inline: false,
      });
      embed.setFooter({ text: 'NexusAI • Smart scheduling' });
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

    embed.setFooter({ text: '🥭 NexusAI • Automated scheduling' });
    return embed;
  }

  static buildQueueEmbed(queueStats) {
    const embed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🥭 NexusAI • Queue Status')
      .setDescription(`**Total in Queues**: ${queueStats.totalInQueues}`)
      .setTimestamp();

    for (const [platform, stats] of Object.entries(queueStats.platformStats)) {
      embed.addFields({
        name: `${platform}`,
        value: `**Position**: ${stats.count > 0 ? `#${stats.count + 1}` : 'Empty'}\n**Est. Wait**: ${stats.avgWait} minutes`,
        inline: true,
      });
    }

    embed.setFooter({ text: '🥭 NexusAI • Queue management' });
    return embed;
  }

  static _formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

export class ContainerFactory {

  static buildLearningHomeContainer(hasGif = true) {
  const section = new SectionBuilder()
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      "# NexusAI Learning Platform\n\n" +
      "[**FAQ ↗**](https://discord.com/channels/1022541804966527066/1535025670466310394)\n" +
      "Your gateway to personalised AI tutoring assistance.\n" +
      "Our verified tutors are available to help you across multiple fields of study.\n" +
      "Press the Join Queue button below to connect with a qualified tutor.\n\n" +
      "**__Notes__**\n" +
      "> • Get personalised help for all your questions\n" +
      "> • Connect with experienced tutors in real-time\n" +
      "> • Solves the top 5% most difficult problems\n" +
      "> • Secure and confidential tutoring sessions"
    )
  );

  if (hasGif) {
    section.setThumbnailAccessory(
      new ThumbnailBuilder({
        media: {
          url: "attachment://standard.gif"
        }
      })
    );
  }


  const queueRow = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("platform_join_queue")
        .setLabel("Join Queue")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("platform_saved_queue")
        .setLabel("Saved Account")
        .setEmoji("💾")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("platform_check_queue")
        .setLabel("Check Queue")
        .setEmoji("📊")
        .setStyle(ButtonStyle.Secondary)

    );


  const learningRow = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("platform_tutorials")
        .setLabel("Tutorials")
        .setEmoji("🎓")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("platform_slots")
        .setLabel("View Slots")
        .setEmoji("🎟️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("platform_history")
        .setLabel("History")
        .setEmoji("📜")
        .setStyle(ButtonStyle.Secondary)

    );


  const accountRow = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("settings")
        .setLabel("Settings")
        .setEmoji("⚙️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("feedback")
        .setLabel("Feedback")
        .setEmoji("💬")
        .setStyle(ButtonStyle.Secondary)

    );


  return new ContainerBuilder()
    .setAccentColor(16032512)
    .addSectionComponents(section)
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("👇 **Choose an option below**")
    )
    .addActionRowComponents(
      queueRow,
      learningRow,
      accountRow
    );
}

static buildJoinQueueContainer(hasGif = true) {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# Choose a Platform\n\n" +
        "> Select the service you want to join.\n" +
        "> NexusAI will open the correct login flow for that platform."
      )
    );

  if (hasGif) {
    section.setThumbnailAccessory(
      new ThumbnailBuilder({
        media: {
          url: "attachment://standard.gif"
        }
      })
    );
  }

  return new ContainerBuilder()
    .setAccentColor(16032512)

    .addSectionComponents(section)

    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )

    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "👇 **Select a platform below**\n" +
        "> Each platform includes its own login and account connection flow."
      )
    )

    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("platform_select")
          .setPlaceholder("Select a Platform")

          .addOptions(

            // ====================================================
            // SENTENCEBUILDERS
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("SentenceBuilders")
              .setDescription(
                "Build language skills with vocabulary and sentence practice"
              )
              .setValue("join_sentenceBuilders")
              .setEmoji({
                id: "1541485141741019186",
                name: "SentenceBuilders"
              }),

            // ====================================================
            // BEDROCK
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Bedrock")
              .setDescription(
                "Improve English literacy, reading and vocabulary skills"
              )
              .setValue("join_bedrock")
              .setEmoji({
                id: "1529265581273124935",
                name: "Bedrock"
              }),

            // ====================================================
            // LANGUAGENUT
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("LanguageNut")
              .setDescription(
                "Practise languages with interactive homework and activities"
              )
              .setValue("join_languagenut")
              .setEmoji({
                id: "1515672374878670858",
                name: "LanguageNut"
              }),

            // ====================================================
            // SPARX MATHS
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Sparx Maths")
              .setDescription(
                "Personalised maths homework, practice and revision"
              )
              .setValue("join_sparxMaths")
              .setEmoji({
                id: "1515672129188790302",
                name: "SparxMaths"
              }),

            // ====================================================
            // DRFROST
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("DrFrost")
              .setDescription(
                "Maths homework, practice questions and revision"
              )
              .setValue("join_drfrost")
              .setEmoji({
                id: "1515671761448992809",
                name: "DrFrost"
              }),

            // ====================================================
            // MATHSWATCH
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("MathsWatch")
              .setDescription(
                "Learn maths with videos, questions and assignments"
              )
              .setValue("join_mathswatch")
              .setEmoji({
                id: "1541488165460770906",
                name: "MathsWatch"
              }),

            // ====================================================
            // SPARX READER
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Sparx Reader")
              .setDescription(
                "Reading practice, comprehension and English skills"
              )
              .setValue("join_sparxReader")
              .setEmoji({
                id: "1515672202375204945",
                name: "SparxReader"
              }),

            // ====================================================
            // SPARX SCIENCE
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Sparx Science")
              .setDescription(
                "Personalised science homework, practice and revision"
              )
              .setValue("join_sparxScience")
              .setEmoji({
                id: "1515672274051797072",
                name: "SparxScience"
              }),

            // ====================================================
            // EDUCAKE
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Educake")
              .setDescription(
                "Science quizzes, homework and revision practice"
              )
              .setValue("join_educake")
              .setEmoji({
                id: "1515671948082806874",
                name: "Educake"
              }),

            // ====================================================
            // TASSOMAI
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Tassomai")
              .setDescription(
                "Daily revision, knowledge checks and exam preparation"
              )
              .setValue("join_tassomai")
              .setEmoji({
                id: "1541487443927113798",
                name: "Tassomai"
              }),

            // ====================================================
            // CENTURY
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Century")
              .setDescription(
                "Personalised learning, revision and targeted practice"
              )
              .setValue("join_century")
              .setEmoji({
                id: "1541487877685383398",
                name: "Century"
              }),

            // ====================================================
            // CAROUSEL
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Carousel")
              .setDescription(
                "Interactive lessons, assignments and revision activities"
              )
              .setValue("join_carousel")
              .setEmoji({
                id: "1541487306677035139",
                name: "Carousel"
              }),

            // ====================================================
            // SENECA
            // ====================================================

            new StringSelectMenuOptionBuilder()
              .setLabel("Seneca")
              .setDescription(
                "Revision courses, learning activities and exam preparation"
              )
              .setValue("join_seneca")
              .setEmoji({
                id: "1515672492512120963",
                name: "Seneca"
              })
          )
      )
    );
}



  static buildQueuePlatformContainer() {
  return new ContainerBuilder()
    .setAccentColor(16032512)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# 🥭 NexusAI Learning Platform\n\n" +
        "> Select an action below to manage your learning queue.\n\n" +
        "Choose what you want to do:"
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("queue_join")
          .setLabel("Join Queue")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("queue_saved")
          .setLabel("Saved Accounts")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("queue_group")
          .setLabel("Group Queue")
          .setStyle(ButtonStyle.Secondary)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("queue_check")
          .setLabel("Check Queue")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("queue_slots")
          .setLabel("View Slots")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("queue_history")
          .setLabel("History")
          .setStyle(ButtonStyle.Secondary)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("queue_settings")
          .setLabel("Settings")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("queue_tutorials")
          .setLabel("Tutorials")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("queue_feedback")
          .setLabel("Feedback")
          .setStyle(ButtonStyle.Secondary)
      )
    );
}

  static buildSupportContainer() {
  const container = new ContainerBuilder()
    .setAccentColor(0xED4245)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# 🥭 NexusAI Support Center\n\n" +
        "> Need help with NexusAI?\n" +
        "> Create a support ticket and our team will assist you.\n\n" +
        "### 🎫 Support\n" +
        "• Private support tickets\n" +
        "• Account assistance\n" +
        "• Bug reports\n" +
        "• General help"
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "👇 **Choose an option below**"
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("support_create")
          .setLabel("Create Ticket")
          .setEmoji({ name: "🎫" })
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("support_status")
          .setLabel("Ticket Status")
          .setEmoji({ name: "📊" })
          .setStyle(ButtonStyle.Secondary)
      )
    );

  return container;
}

  static buildScheduleContainer() {
  return new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# 🗓️ NexusAI Auto Schedule\n\n" +
        "> Create automatic homework reminders.\n" +
        "> Keep your homework running automatically.\n\n" +
        "Use the button below to manage your schedules."
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("schedule_create")
          .setLabel("Create Schedule")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("schedule_manage")
          .setLabel("Manage Schedules")
          .setStyle(ButtonStyle.Secondary)
      )
    );
}

  static buildLearningPlatformActionRows() {
    const selectMenuRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("platform_select")
        .setPlaceholder("Select a Platform")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Sparx Maths").setValue("join_sparxMaths").setEmoji({ name: "📚" }),
          new StringSelectMenuOptionBuilder().setLabel("Sparx Reader").setValue("join_sparxReader").setEmoji({ name: "📖" }),
          new StringSelectMenuOptionBuilder().setLabel("Sparx Science").setValue("join_sparxScience").setEmoji({ name: "🔬" })
        )
    );

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("platform_join_queue")
        .setLabel("Join Queue")
        .setStyle(ButtonStyle.Danger)
        .setEmoji({ name: 'GET_OUT', id: '1531029730541830175' })
    );

    return [selectMenuRow, buttonRow];
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

export class ActionRowFactory {

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

export class ScheduleEmbedFactory {
  static buildScheduleEmbed() {
    return new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🥭 NexusAI • Auto Schedule')
      .setDescription(
        'Create automatic homework reminders and manage your learning routine.'
      )
      .addFields(
        {
          name: '⏰ Features',
          value:
            '• Automated reminders\n' +
            '• Platform scheduling\n' +
            '• Homework planning'
        },
        {
          name: 'Getting Started',
          value:
            'Press the button below to create your first schedule.'
        }
      )
      .setFooter({
        text: '🥭 NexusAI • Smart Scheduling'
      })
      .setTimestamp();
  }
}


export class SupportEmbedFactory {
  static buildSupportEmbed() {
    return new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('🥭 NexusAI • Support Center')
      .setDescription(
        'Need help? Create a support ticket and our team will assist you.'
      )
      .addFields(
        {
          name: '🎫 Tickets',
          value:
            'Create a private support ticket with the button below.'
        },
        {
          name: '📚 Help',
          value:
            'Use `!help` for available commands.'
        }
      )
      .setFooter({
        text: '🥭 NexusAI Support'
      })
      .setTimestamp();
  }
}

export default {
  EmbedFactory,
  ActionRowFactory,
  ContainerFactory,
  ScheduleEmbedFactory,
  SupportEmbedFactory,
  platformLoginData
};
