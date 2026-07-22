/* eslint-env browser */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
  AttachmentBuilder
} from 'discord.js';

import {
  EmbedFactory,
  ActionRowFactory
} from './embedFactory.js';

import logger from '../utils/logger.js';
import config from '../utils/config.js';

import path from 'path';
import fs from 'fs';

import {
  fileURLToPath
} from 'url';


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


    this.setupEventHandlers();

  }





  setCommandHandler(handler) {

    this.commandHandler = handler;

  }





  setApp(app) {

    this.app = app;

  }





  setupEventHandlers() {



    this.client.once(
      'clientReady',
      () => {


        logger.info(

          {
            username: this.client.user.username
          },

          'Discord bot is ready'

        );


        this.setPresence();


      }
    );





    this.client.on(
      'messageCreate',
      async (message) => {



        if (message.author.bot)

          return;




        /*
        ==================================
        SENAI PLATFORM CHANNELS
        ==================================
        */



        const platformChannels = {


          "sparx-maths": "sparxMaths",

          "science-reader": "science",

          "educake": "educake",

          "drfrost": "drfrost",

          "seneca": "seneca",

          "languagenut": "languagenut"


        };





        const platform =
          platformChannels[
            message.channel.name
          ];





        if (platform) {


          return this.handlePlatformQuestion(

            message,

            platform

          );


        }





        /*
        ==================================
        PREFIX COMMANDS
        ==================================
        */





        if (

          !message.content.startsWith(
            config.discord.prefix
          )

        )

          return;






        const args =

          message.content

            .slice(
              config.discord.prefix.length
            )

            .trim()

            .split(/ +/);






        const command =

          args.shift()
            ?.toLowerCase();






        if (!command)

          return;






        try {


          await this.handleCommand(

            command,

            args,

            message

          );



        } catch (error) {


          logger.error(

            {
              error: error.message,

              command

            },

            'Error handling command'

          );





          await this.replyToChannel(

            message,

            {

              content:

                `❌ ${error.message}`

            }

          );


        }



      }

    );





    this.client.on(
      'interactionCreate',
      async (interaction) => {



        if (

          !interaction.isButton()

        )

          return;





        try {


          await this.handleButtonInteraction(

            interaction

          );



        } catch (error) {



          logger.error(

            {

              error: error.message,

              customId: interaction.customId

            },

            'Button error'

          );






          if (

            interaction.replied ||

            interaction.deferred

          ) {



            await interaction.followUp({

              content:

                '❌ Button error',

              ephemeral: true

            });




          } else {



            await interaction.reply({

              content:

                '❌ Button error',

              ephemeral: true

            });


          }



        }



      }

    );






    this.client.on(
      'error',
      (error) => {



        logger.error(

          {

            error: error.message

          },

          'Discord client error'

        );



      }

    );


  }

    async handlePlatformQuestion(
    message,
    platform
  ) {


    const question =
      message.content.trim();



    if (!question)
      return;




    const embed =
      new EmbedBuilder()

        .setColor('#5865F2')

        .setTitle(
          '🥭 MangoAI • Question Received'
        )

        .addFields(

          {
            name: 'Platform',
            value: platform,
            inline: true
          },


          {
            name: 'Student',
            value: message.author.username,
            inline: true
          },


          {
            name: 'Question',
            value: question
          }

        )

        .setTimestamp()

        .setFooter({

          text:
            'SENAI Learning Platform'

        });





    await message.channel.send({

      embeds: [
        embed
      ]

    });



    /*
      AI SOLVER CONNECTION HERE

      Example:

      const answer =
        await this.app.ai.solve(
          platform,
          question
        );


      await message.channel.send(answer);

    */


  }





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

      'Command received'

    );




    if (

      this.commandHandler &&

      this.commandHandler.commands.has(command)

    ) {


      return await this.commandHandler
        .commands
        .get(command)(
          message,
          args
        );


    }





    switch (command) {


      case 'help':

        return this.handleHelp(
          message
        );



      case 'solve':

        return this.handleSolve(
          message,
          args
        );



      case 'status':

        return this.handleStatus(
          message
        );



      case 'ping':

        return this.replyToChannel(

          message,

          `🏓 Pong! ${this.client.ws.ping}ms`

        );



      default:

        return this.replyToChannel(

          message,

          '❓ Unknown command. Use `!help`'

        );


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



    await this.replyToChannel(

      message,

      {
        embeds: [
          embed
        ]
      }

    );

  }





  async handleSolve(
    message,
    args
  ) {


    if (args.length < 2) {


      return await this.replyToChannel(

        message,

        '❌ Usage: `!solve <platform> <question>`'

      );


    }




    const platform =
      args[0].toLowerCase();



    const question =
      args.slice(1).join(' ');





    await this.replyToChannel(

      message,

      `🔄 Processing your request for ${platform}...\nQuestion: ${question}`

    );


  }





  async handleStatus(message) {


    const guildSession = message.guild ?

      this.activeSessions.get(
        message.guild.id
      ) :

      null;




    const embed = new EmbedBuilder()

      .setColor('#00ff00')

      .setTitle('✅ Bot Status')

      .addFields(

        {
          name: 'Status',
          value: 'Online'
        },

        {
          name: 'Ping',
          value:
            `${this.client.ws.ping}ms`
        },

        {
          name: 'Uptime',
          value:
            this.formatUptime(
              this.client.uptime
            )
        },

        {
          name: 'Version',
          value: '2.0.0'
        },

        {
          name: 'Auto Channels',
          value:
            guildSession ?
              'Enabled' :
              'Disabled'
        }

      )

      .setTimestamp();



    await this.replyToChannel(

      message,

      {
        embeds: [
          embed
        ]
      }

    );


  }





  async ensureGuildSession(_message) {

    return null;

  }





  async getChannelByConfigKey(key) {


    const channelId =
      config.discord.channels?.[key];



    if (!channelId || !this.client)

      return null;




    let channel =
      this.client.channels.cache.get(
        channelId
      );



    if (!channel) {


      channel =
        await this.client.channels.fetch(
          channelId
        )
        .catch(
          () => null
        );


    }





    if (!channel) {


      logger.warn(

        {
          channelKey: key,

          channelId

        },

        'Configured Discord channel not found'

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
          channelKey: key,

          channelId: channel.id

        },

        'Sending message to configured Discord channel'

      );



      return channel.send(
        payload
      );


    }





    if (fallbackChannel) {


      logger.info(

        {
          channelKey: key

        },

        'Falling back to current Discord channel'

      );



      return fallbackChannel.send(
        payload
      );


    }





    return null;


  }





  async handleButtonInteraction(
    interaction
  ) {


    await this.acknowledgeInteraction(
      interaction
    );



    const parts =
      interaction.customId.split('_');



    const group =
      parts.shift();



    const action =
      parts.join('_');





    if (group === 'homework') {


      return this.handleHomeworkButton(

        interaction,

        action

      );


    }





    if (group === 'pastpapers') {


      return this.handlePastPapersButton(

        interaction,

        action

      );


    }





    if (group === 'platform') {


      return this.handlePlatformButton(

        interaction,

        action

      );


    }





    if (group === 'schedule') {


      return this.handleScheduleButton(

        interaction,

        action

      );


    }





    if (group === 'support') {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Support buttons are not yet available here. Use the support page command.'

        }

      );


    }





    if (group === 'ticket') {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Ticket button actions will be available soon.'

        }

      );


    }





    return this.respondToInteraction(

      interaction,

      {

        content:
          'Button action not supported yet.'

      }

    );


  }





  async handleHomeworkButton(
    interaction,
    action
  ) {


    const userId =
      interaction.user.id;



    const tracker =
      this.app?.homeworkTracker;



    const buttons =
      ActionRowFactory.buildHomeworkButtons();





    if (!tracker) {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Homework tracker is not available.'

        }

      );


    }





    if (action === 'create') {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Use `!homework create [subject] [name]` to add a new task, for example: `!homework create Math Algebra`.'

        }

      );


    }





    if (action === 'view') {


      const tasks =
        tracker.getActiveTasks(
          userId
        );



      const summary =
        tracker.getProgressSummary(
          userId
        );



      const embed =
        EmbedFactory.buildHomeworkEmbed(

          tasks,

          summary

        );



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





    if (action === 'schedule') {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Use `!schedule create [platform] [time] [days...]` to configure automatic homework scheduling.'

        }

      );


    }





    return this.respondToInteraction(

      interaction,

      {

        content:
          'Unknown homework action.'

      }

    );


  }

    async handlePastPapersButton(
    interaction,
    action
  ) {


    if (action === 'latest') {


      const embed =
        EmbedFactory.buildPastPapersEmbed(
          'Latest'
        );



      let posted = false;




      const configuredChannel =
        await this.getChannelByConfigKey(
          'pastPapers'
        );



      if (configuredChannel) {


        try {


          await configuredChannel.send({

            embeds: [
              embed
            ]

          });



          posted = true;



        } catch (err) {


          logger.error(

            {
              err: err.message
            },

            'Failed to send past papers to configured channel'

          );


        }


      }





      if (!posted) {


        try {


          if (interaction.channel) {


            await interaction.channel.send({

              embeds: [
                embed
              ]

            });



            posted = true;


          }



        } catch (err) {


          logger.error(

            {
              err: err.message
            },

            'Failed to send past papers to interaction channel'

          );


        }


      }





      const replyMsg =
        posted ?

          'Posted the latest past papers to the configured channel.' :

          'Unable to post past papers to the configured channel or this channel.';





      return this.respondToInteraction(

        interaction,

        {

          content:
            replyMsg

        }

      );


    }





    if (action === 'search') {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Search past papers by typing `!pastpapers <subject>`.'

        }

      );


    }





    return this.respondToInteraction(

      interaction,

      {

        content:
          'Unknown past paper action.'

      }

    );


  }





  async handleScheduleButton(
    interaction,
    action
  ) {


    if (action === 'create') {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Create a schedule with `!schedule create [platform] [time] [days...]`.'

        }

      );


    }





    if (action === 'manage') {


      return this.respondToInteraction(

        interaction,

        {

          content:
            'Manage schedules with `!schedule` and then update or delete the entries shown.'

        }

      );


    }





    return this.respondToInteraction(

      interaction,

      {

        content:
          'Unknown schedule action.'

      }

    );


  }





  async handlePlatformButton(
    interaction,
    action
  ) {


    const userId =
      interaction.user.id;

    // Use app queueSystem if available, otherwise create a local one on the bot
    if (!this.app?.queueSystem) {
      const { QueueSystem } = await import('../queue/queueSystem.js');
      if (this.app) this.app.queueSystem = new QueueSystem();
    }
    const queueSystem = this.app?.queueSystem;





    switch (action) {



      case 'join_queue': {
  const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
  } = await import("discord.js");

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("📚 Select a Platform")
    .setDescription("Choose the homework platform you want to join.")
    .addFields(
      {
        name: "<:SparxMaths:1515672129188790302> Sparx Maths",
        value: "🟢 Online",
        inline: true
      },
      {
        name: "<:SparxReader:1515672202375204945> Sparx Reader",
        value: "🟢 Online",
        inline: true
      },
      {
        name: "<:SparxScience:1515672274051797072> Sparx Science",
        value: "🟢 Online",
        inline: true
      },
      {
        name: "<:LanguageNut:1515672374878670858> LanguageNut",
        value: "🟢 Online",
        inline: true
      },
      {
        name: "<:Bedrock:1529265581273124935> Bedrock",
        value: "🟢 Online",
        inline: true
      },
      {
        name: "<:Seneca:1515672492512120963> Seneca",
        value: "🟢 Online",
        inline: true
      }
    );

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("platform_join_sparxMaths")
      .setLabel("Sparx Maths")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("platform_join_sparxReader")
      .setLabel("Sparx Reader")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("platform_join_sparxScience")
      .setLabel("Sparx Science")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("platform_join_languagenut")
      .setLabel("LanguageNut")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("platform_join_bedrock")
      .setLabel("Bedrock")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("platform_join_seneca")
      .setLabel("Seneca")
      .setStyle(ButtonStyle.Success)
  );

  return this.respondToInteraction(interaction, {
    embeds: [embed],
    components: [row1, row2]
  });
}

case "join_sparxMaths":
case "join_sparxReader":
case "join_sparxScience":
case "join_languagenut":
case "join_bedrock":
case "join_seneca": {

    const selectedPlatform =
        action.replace("join_", "");

    if (!queueSystem) {

        return this.respondToInteraction(
            interaction,
            {
                content: 'Queue system is not available.'
            }
        );

    }

    const platformMap = {
        sparxMaths: {
            name: 'Sparx Maths',
            key: 'sparxMaths'
        },
        sparxReader: {
            name: 'Sparx Reader',
            key: 'sparxReader'
        },
        sparxScience: {
            name: 'Sparx Science',
            key: 'sparxScience'
        },
        languagenut: {
            name: 'LanguageNut',
            key: 'languagenut'
        },
        bedrock: {
            name: 'Bedrock',
            key: 'bedrock'
        },
        seneca: {
            name: 'Seneca',
            key: 'seneca'
        }
    };

    const platform = platformMap[selectedPlatform];

    if (!platform) {

        return this.respondToInteraction(
            interaction,
            {
                content: '❌ Unknown platform.'
            }
        );

    }

    const entry = queueSystem.joinQueue(
        userId,
        platform.key
    );

    if (entry.error) {

        return this.respondToInteraction(
            interaction,
            {
                content: `❌ ${entry.error}`
            }
        );

    }

    return this.respondToInteraction(
        interaction,
        {
            content: `✅ You joined the **${platform.name}** queue successfully.\n\nUse **Check Queue** to view your position.`
        }
    );

}

      case 'join_group': {


        return this.respondToInteraction(

          interaction,

          {

            content:
              'Group queue feature coming soon!'

          }

        );


      }

      case 'join_sparxMaths':
case 'join_sparxReader':
case 'join_sparxScience':
case 'join_languagenut':
case 'join_bedrock':
case 'join_seneca': {

    if (!queueSystem) {
        return this.respondToInteraction(interaction, {
            content: 'Queue system is not available.'
        });
    }

    const selectedPlatform = action.replace("join_", "");

    const platformMap = {
        sparxMaths: {
            name: 'Sparx Maths',
            key: 'sparxMaths'
        },
        sparxReader: {
            name: 'Sparx Reader',
            key: 'sparxReader'
        },
        sparxScience: {
            name: 'Sparx Science',
            key: 'sparxScience'
        },
        languagenut: {
            name: 'LanguageNut',
            key: 'languagenut'
        },
        bedrock: {
            name: 'Bedrock',
            key: 'bedrock'
        },
        seneca: {
            name: 'Seneca',
            key: 'seneca'
        }
    };

    const platform = platformMap[selectedPlatform];

    if (!platform) {
        return this.respondToInteraction(interaction, {
            content: '❌ Unknown platform.'
        });
    }

    const entry = queueSystem.joinQueue(
        userId,
        platform.key
    );

    if (entry.error) {
        return this.respondToInteraction(interaction, {
            content: `❌ ${entry.error}`
        });
    }

    return this.respondToInteraction(interaction, {
        content:
            `✅ You joined the **${platform.name}** queue.\n\nPress **Check Queue** to see your position.`
    });

}
      case 'check_queue': {

  if (!queueSystem) {

    return this.respondToInteraction(
      interaction,
      {
        content:
          'Queue system is not available.'
      }
    );

  }


  const stats =
    queueSystem.getQueueStats();


  const embed =
    EmbedFactory.buildQueueEmbed(
      stats
    );


  return this.respondToInteraction(
    interaction,
    {
      embeds: [
        embed
      ]
    }
  );

}

      case 'tutorials': {


        const tutorialEmbed =
          new EmbedBuilder()

            .setColor('#5865F2')

            .setTitle('📚 MangoAI Tutorials')

            .setDescription(
              'Learn how to use MangoAI effectively:'
            )

            .addFields(

              {
                name: '1️⃣ Getting Started',
                value:
                  'Use !help to see all available commands.'
              },

              {
                name: '2️⃣ Homework',
                value:
                  'Use !homework create [subject] [name] to add tasks.'
              },

              {
                name: '3️⃣ Queue',
                value:
                  'Press **Join Queue** or use !join <platform>.'
              },

              {
                name: '4️⃣ Schedule',
                value:
                  'Use !schedule create [platform] [time] [days].'
              },

              {
                name: '5️⃣ Premium',
                value:
                  'Use !trial claim for a free trial or !premium to upgrade.'
              }

            )

            .setTimestamp()

            .setFooter({

              text:
                '🥭 MangoAI • Learn & Succeed'

            });





        return this.respondToInteraction(

          interaction,

          {

            embeds: [
              tutorialEmbed
            ]

          }

        );


      }





      case 'view_slots': {


        const slotsEmbed =
          new EmbedBuilder()

            .setColor('#00FF00')

            .setTitle('🕐 Available Slots')

            .setDescription(
              'Current tutor availability:'
            )

            .addFields(

              {
                name: 'Sparx Maths',
                value:
                  '🟢 Available',
                inline: true
              },

              {
                name: 'Educake',
                value:
                  '🟢 Available',
                inline: true
              },

              {
                name: 'Dr Frost',
                value:
                  '🟢 Available',
                inline: true
              },

              {
                name: 'Seneca',
                value:
                  '🟢 Available',
                inline: true
              },

              {
                name: 'LanguageNut',
                value:
                  '🟢 Available',
                inline: true
              }

            )

            .setTimestamp()

            .setFooter({

              text:
                '🥭 MangoAI • Slots update in real-time'

            });





        return this.respondToInteraction(

          interaction,

          {

            embeds: [
              slotsEmbed
            ]

          }

        );


      }

            case 'history': {


        const tracker =
          this.app?.homeworkTracker;




        if (!tracker) {


          return this.respondToInteraction(

            interaction,

            {

              content:
                'Homework tracker is not available.'

            }

          );


        }





        const tasks =
          tracker.getActiveTasks(
            userId
          );





        const summary =
          tracker.getProgressSummary(
            userId
          );





        const embed =
          EmbedFactory.buildHomeworkEmbed(

            tasks,

            summary

          );





        return this.respondToInteraction(

          interaction,

          {

            embeds: [
              embed
            ]

          }

        );


      }







      case 'settings': {


        const settingsEmbed =
          new EmbedBuilder()

            .setColor('#5865F2')

            .setTitle('⚙️ MangoAI Settings')

            .setDescription(
              'Configure your MangoAI experience:'
            )

            .addFields(

              {

                name:
                  '📋 Saved Accounts',

                value:
                  'Configure your platform accounts in the .env file.'

              },


              {

                name:
                  '🔔 Notifications',

                value:
                  'Homework updates are sent to this channel.'

              },


              {

                name:
                  '⏰ Auto-Schedule',

                value:
                  'Use !schedule create to set up automatic reminders.'

              }


            )

            .setTimestamp()

            .setFooter({

              text:
                '🥭 MangoAI • Settings'

            });





        return this.respondToInteraction(

          interaction,

          {

            embeds: [
              settingsEmbed
            ]

          }

        );


      }







      case 'feedback': {


        const feedbackEmbed =
          new EmbedBuilder()

            .setColor('#FFD700')

            .setTitle('💬 Feedback & Suggestions')

            .setDescription(
              'We value your feedback! Here\'s how to share:'
            )

            .addFields(

              {

                name:
                  '📝 Create a Ticket',

                value:
                  'Use !ticket create feedback <your message>'

              },


              {

                name:
                  '💡 Feature Requests',

                value:
                  'Use !ticket create suggestion <your idea>'

              },


              {

                name:
                  '🐛 Report a Bug',

                value:
                  'Use !ticket create bug <description>'

              }


            )

            .setTimestamp()

            .setFooter({

              text:
                '🥭 MangoAI • Your feedback shapes our future'

            });





        return this.respondToInteraction(

          interaction,

          {

            embeds: [
              feedbackEmbed
            ]

          }

        );


      }







      default: {


        return this.respondToInteraction(

          interaction,

          {

            content:
              'Unknown platform action.'

          }

        );


      }


    }


  }

    async acknowledgeInteraction(interaction) {

  if (
    interaction.deferred ||
    interaction.replied
  )
    return;


  try {

    await interaction.deferReply({
      ephemeral: true
    });


  } catch (error) {

    logger.warn(
      {
        error: error.message
      },
      'Could not defer interaction reply'
    );

  }

}







  async respondToInteraction(

    interaction,

    payload

  ) {



    if (

      interaction.deferred ||

      interaction.replied

    ) {



      return interaction.editReply(

        payload

      )

      .catch(

        () =>

          interaction.followUp(

            payload

          )

      );


    }





    return interaction.reply(
  {
    ...payload,
    ephemeral: true
  }
)

    .catch(

      () => null

    );


  }







  async startScheduleLoop() {



    if (this.scheduleLoop)

      return;





    this.scheduleLoop = setInterval(

      async () => {



        if (!this.app?.scheduleManager)

          return;





        const schedules =

          this.app.scheduleManager

            .getSchedulesToRun();





        if (!schedules.length)

          return;





        for (

          const schedule of schedules

        ) {



          const channel =

            await this.getChannelByConfigKey(

              'autoSchedule'

            );





          if (!channel)

            continue;





          const embed =

            new EmbedBuilder()

              .setColor('#5865F2')

              .setTitle(

                '📅 Auto Schedule Triggered'

              )

              .setDescription(

                `Your scheduled homework job is ready for **${schedule.platform}**.`

              )

              .addFields(

                {

                  name:
                    'Schedule',

                  value:
                    schedule.name,

                  inline:
                    true

                },


                {

                  name:
                    'Platform',

                  value:
                    schedule.platform,

                  inline:
                    true

                },


                {

                  name:
                    'Next Run',

                  value:
                    schedule.nextRun

                      ? schedule.nextRun.toLocaleString()

                      : 'N/A',

                  inline:
                    false

                }


              )

              .setTimestamp();





          await channel.send(

            {

              embeds:
                [
                  embed
                ]

            }

          )

          .catch(

            () => null

          );





          this.app.scheduleManager

            .markAsRun(

              schedule.id

            );


        }



      },

      30000

    );


  }







  stopScheduleLoop() {



    if (this.scheduleLoop) {


      clearInterval(

        this.scheduleLoop

      );


      this.scheduleLoop = null;


    }


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

      (

        message.guild

          ? this.activeSessions.get(

              message.guild.id

            )

          : null

      );





    if (!session) {


      return message.channel.send(

        payload

      );


    }





    const mainChannel =

      message.guild.channels.cache.get(

        session.mainChannelId

      );





    if (mainChannel) {


      return mainChannel.send(

        payload

      );


    }





    return message.channel.send(

      payload

    );


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

            )

            .find(

              s =>

                Object.values(

                  s.channelIds || {}

                )

                .includes(

                  channelId

                )

            )

          : null

      );





    if (!session)

      return false;





    return Object.values(

      session.channelIds || {}

    )

    .includes(

      channelId

    );


  }







  formatUptime(ms) {



    if (!ms)

      return 'N/A';





    const seconds =

      Math.floor(

        ms / 1000

      ) % 60;





    const minutes =

      Math.floor(

        ms / (1000 * 60)

      ) % 60;





    const hours =

      Math.floor(

        ms / (1000 * 60 * 60)

      ) % 24;





    return `${hours}h ${minutes}m ${seconds}s`;


  }

    async login() {


    try {


      await this.client.login(

        config.discord.token

      );



      logger.info(

        'Discord bot logged in successfully'

      );



      this.startScheduleLoop();



    } catch (error) {


      logger.error(

        {

          error:
            error.message

        },

        'Failed to login to Discord'

      );



      throw error;


    }


  }







  setPresence() {



    const activities = [


      {

        name:
          '📚 Homework Solutions',

        type:
          ActivityType.Watching

      },


      {

        name:
          '📈 Your Progress',

        type:
          ActivityType.Watching

      },


      {

        name:
          '✨ Students Learning',

        type:
          ActivityType.Watching

      },


      {

        name:
          '🧠 AI Tutoring',

        type:
          ActivityType.Watching

      },


      {

        name:
          '🥭 MangoAI 🎓',

        type:
          ActivityType.Playing

      },


      {

        name:
          '🤖 Smart Learning',

        type:
          ActivityType.Playing

      },


      {

        name:
          '⚡ Solving Problems',

        type:
          ActivityType.Playing

      },


      {

        name:
          '🎯 Education Magic',

        type:
          ActivityType.Playing

      }


    ];





    if (this.presenceInterval)

      clearInterval(

        this.presenceInterval

      );





    const updatePresence = () => {



      try {



        const activity =

          activities[

            Math.floor(

              Math.random() *

              activities.length

            )

          ];





        this.client.user.setPresence(

          {

            activities:

              [

                activity

              ],


            status:

              'online'


          }

        );





        logger.info(

          {

            activity:

              activity.name,


            type:

              activity.type

          },

          '🎭 Bot presence updated'

        );





      } catch (error) {



        logger.error(

          {

            error:

              error.message

          },

          '❌ Failed to update presence'

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

    async clearChannelMessages(

    channelKey

  ) {



    const channel =

      await this.getChannelByConfigKey(

        channelKey

      );





    if (!channel)

      return;





    try {



      let deleted = 0;





      while (channel) {



        const messages =

          await channel.messages.fetch(

            {

              limit:

                100

            }

          );





        if (messages.size === 0)

          break;





        const deletePromises =

          messages.map(

            msg =>

              msg.delete()

                .catch(

                  () => null

                )

          );





        await Promise.all(

          deletePromises

        );





        deleted +=

          deletePromises.length;





        await new Promise(

          resolve =>

            setTimeout(

              resolve,

              500

            )

        );


      }





      if (deleted > 0) {



        logger.info(

          {

            channel:

              channelKey,


            messagesDeleted:

              deleted

          },

          '🗑️ Cleared channel'

        );


      }





    } catch (error) {



      logger.warn(

        {

          channel:

            channelKey,


          error:

            error.message

        },

        'Failed to clear channel'

      );


    }


  }







  async sendStartupMessages() {



    try {



      const channels =

        config.discord.channels;





      logger.info(

        '🗑️ Clearing all channels before refresh...'

      );





      if (channels.learningPlatform)

        await this.clearChannelMessages(

          'learningPlatform'

        );





      if (channels.autoSchedule)

        await this.clearChannelMessages(

          'autoSchedule'

        );





      if (channels.supportTickets)

        await this.clearChannelMessages(

          'supportTickets'

        );





      await new Promise(

        resolve =>

          setTimeout(

            resolve,

            1000

          )

      );





      logger.info(

        '📤 Sending fresh startup messages...'

      );





      if (channels.learningPlatform) {



        const platformEmbed =

          EmbedFactory.buildLearningPlatformEmbed();





        const platformButtons =

          ActionRowFactory.buildLearningPlatformButtons();

        const gifPath =

          path.join(

            __dirname,

            '../../standard.gif'

          );

        let payload =

          {

            embeds:

              [

                platformEmbed

              ],


            components:

              platformButtons

          };


        if (

          fs.existsSync(

            gifPath

          )

        ) {

          const gifAttachment =

            new AttachmentBuilder(

              gifPath,

              {

                name:

                  'standard.gif'

              }

            );

          payload.files =

            [

              gifAttachment

            ];


        }

        await this.sendToConfiguredChannel(

          'learningPlatform',

          payload

        )

        .catch(

          err =>

            logger.warn(

              {

                channel:

                  'learningPlatform',


                error:

                  err.message

              },

              'Failed to send startup message to learning platform channel'

            )

        );


      }

            if (channels.autoSchedule) {


        const scheduleEmbed =

          EmbedFactory.buildScheduleEmbed(

            []

          )

          .setTitle(

            '🥭 MangoAI • Auto-Schedule Manager'

          )

          .setDescription(

            '⏰ **Automate Your Study Schedule**\n\n' +

            'Set up intelligent reminders and let MangoAI ' +

            'help you stay on track with your homework.'

          )

          .setColor(

            '#5865F2'

          );
        
         

        const scheduleButtons =

          ActionRowFactory.buildAutoScheduleButtons();





        await this.sendToConfiguredChannel(

          'autoSchedule',

          {

            embeds:

              [

                scheduleEmbed

              ],


            components:

  [
    scheduleButtons
  ]

          }

        )

        .catch(

          err =>

            logger.warn(

              {

                channel:

                  'autoSchedule',


                error:

                  err.message

              },

              'Failed to send startup message to auto-schedule channel'

            )

        );


      }





      if (channels.supportTickets) {



        const supportEmbed =

          new EmbedBuilder()

            .setColor(

              '#FF6B6B'

            )

            .setTitle(

              '🥭 MangoAI • Support & Help Center'

            )

            .setDescription(

              '**Get instant support from our team**\n\n' +

              'Have questions? Create a support ticket ' +

              'and we\'ll help you ASAP.'

            )

            .addFields(

              {

                name:

                  '💬 How It Works',


                value:

                  'Click **Create Ticket** → Describe your issue → Get help quickly',


                inline:

                  false

              },


              {

                name:

                  '⏱️ Response Times',


                value:

                  '**Daytime:** 1-2 hours\n**Overnight:** Next morning',


                inline:

                  false

              }

            )

            .setTimestamp()

            .setFooter(

              {

                text:

                  '🥭 MangoAI Support • Always here to help'

              }

            );





        const supportButtons =

          ActionRowFactory.buildSupportTicketButtons();





        await this.sendToConfiguredChannel(

          'supportTickets',

          {

            embeds:

              [

                supportEmbed

              ],


            components:

  [
    supportButtons
  ]

          }

        )

        .catch(

          err =>

            logger.warn(

              {

                channel:

                  'supportTickets',


                error:

                  err.message

              },

              'Failed to send startup message to support tickets channel'

            )

        );


      }





      logger.info(

        '✅ All channels refreshed and ready!'

      );





    } catch (error) {



      logger.error(

        {

          error:

            error.message

        },

        'Error sending startup messages'

      );


    }


  }

    async close() {


    try {


      await this.client.destroy();



      logger.info(

        'Discord bot disconnected'

      );



    } catch (error) {


      logger.error(

        {

          error:

            error.message

        },

        'Error closing Discord bot'

      );


    }


  }


}





export default DiscordBot;
