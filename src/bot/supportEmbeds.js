import {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle
} from 'discord.js';

/**
 * Support Embed Factory
 */
export class SupportEmbedFactory {
  static buildSupportMainEmbed() {
    const embed = new EmbedBuilder()
      .setColor('#1f1f2e')
      .setTitle('🥭 MangoAI • Rapid Support')
      .setDescription('Need help? MangoAI support is here to assist you ASAP!')
      .setImage('https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800&q=80')
      .addFields(
        {
          name: '📋 Ticket Rules',
          value: '• Describe your question in detail\n• Be polite and respectful\n• Support will assist you ASAP',
        },
        {
          name: '⏰ Support Hours',
          value: '**Daytime**: 1-2 hour response\n**Overnight**: Slower response expected',
        }
      )
      .setTimestamp();

    embed.setFooter({ text: '🥭 MangoAI • Customer support' });
    return embed;
  }

  static buildTicketCreatedEmbed(ticket) {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🥭 ✅ MangoAI Support Ticket Created')
      .addFields(
        { name: 'Ticket ID', value: `\`${ticket.id}\``, inline: false },
        { name: 'Category', value: ticket.category.toUpperCase(), inline: true },
        { name: 'Priority', value: ticket.priority.toUpperCase(), inline: true },
        {
          name: 'Estimated Response',
          value: ticket.estimatedResponseTime,
          inline: false,
        },
        {
          name: 'Your Question',
          value: ticket.description.substring(0, 500) + (ticket.description.length > 500 ? '...' : ''),
          inline: false,
        }
      )
      .setTimestamp();

    embed.setFooter({ text: '🥭 MangoAI • Support ticket' });
    return embed;
  }

  static buildTicketStatusEmbed(ticket) {
    const statusEmojis = {
      open: '🔴',
      'in-progress': '🟡',
      resolved: '🟢',
      closed: '⚫',
    };

    const embed = new EmbedBuilder()
      .setColor(this._getStatusColor(ticket.status))
      .setTitle(`${statusEmojis[ticket.status]} Ticket #${ticket.id.split('_')[1]}`)
      .addFields(
        { name: 'Status', value: ticket.status.toUpperCase(), inline: true },
        { name: 'Category', value: ticket.category.toUpperCase(), inline: true },
        { name: 'Priority', value: ticket.priority.toUpperCase(), inline: true },
        { name: 'Created', value: ticket.createdAt.toLocaleString(), inline: true },
        { name: 'Last Updated', value: ticket.updatedAt.toLocaleString(), inline: true },
        { name: 'Messages', value: `${ticket.messages.length}`, inline: true }
      );

    // Add conversation preview
    const recentMessages = ticket.messages.slice(-3);
    let conversationPreview = '';
    for (const msg of recentMessages) {
      const author = msg.author === 'user' ? '👤 You' : '🤝 Support';
      const preview = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
      conversationPreview += `${author}: ${preview}\n`;
    }

    embed.addFields({
      name: 'Recent Messages',
      value: conversationPreview || 'No messages yet',
      inline: false,
    });
embed.setFooter({
  text: '🥭 MangoAI • Support status'
});
    embed.set
    embed.setTimestamp();
    return embed;
  }

  static buildSupportQueueEmbed(stats) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🥭 MangoAI • Support Statistics')
      .addFields(
        { name: 'Total Tickets', value: `${stats.totalTickets}`, inline: true },
        { name: 'Open', value: `🔴 ${stats.open}`, inline: true },
        { name: 'In Progress', value: `🟡 ${stats.inProgress}`, inline: true },
        { name: 'Queue Length', value: `${stats.queueLength}`, inline: true },
        { name: 'Resolved', value: `🟢 ${stats.resolved}`, inline: true },
        { name: 'Avg Response', value: `${stats.avgResponseTime}`, inline: true }
      );

    // By category
    let categoryText = '';
    for (const [category, count] of Object.entries(stats.byCategory)) {
      categoryText += `**${category}**: ${count}\n`;
    }

    embed.addFields({
      name: 'By Category',
      value: categoryText || 'No tickets',
      inline: false,
    });

    embed.setTimestamp();
    return embed;
  }

  static buildUserTicketsEmbed(tickets) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📋 Your Support Tickets');

    if (tickets.length === 0) {
      embed.setDescription('No support tickets yet. Create one if you need help!');
      return embed;
    }

    for (const ticket of tickets.slice(0, 10)) {
      const statusEmoji = {
        open: '🔴',
        'in-progress': '🟡',
        resolved: '🟢',
        closed: '⚫',
      }[ticket.status];

      embed.addFields({
        name: `${statusEmoji} #${ticket.id.split('_')[1]} - ${ticket.title}`,
        value: `Category: ${ticket.category} | Status: ${ticket.status}\nCreated: ${ticket.createdAt.toLocaleString()}`,
        inline: false,
      });
    }

    embed.setTimestamp();
    return embed;
  }

  static _getStatusColor(status) {
    const colors = {
      open: '#FF0000',
      'in-progress': '#FFA500',
      resolved: '#00FF00',
      closed: '#808080',
    };
    return colors[status] || '#0099ff';
  }
}

/**
 * Support Action Rows
 */
export class SupportActionRowFactory {
  static buildCategoryButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('support_category_general')
        .setLabel('General Question')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('support_category_bug')
        .setLabel('Bug Report')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('support_category_trial')
        .setLabel('🎁 Free Trial')
        .setStyle(ButtonStyle.Success)
    );
  }

  static buildCategoryButtons2() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('support_category_premium')
        .setLabel('Premium Verification')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('support_category_addon')
        .setLabel('Add-on Purchase')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('support_category_transfer')
        .setLabel('Transfer Premium')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  static buildTicketActionButtons(ticketId) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_view_${ticketId}`)
        .setLabel('View Ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_reply_${ticketId}`)
        .setLabel('Add Reply')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketId}`)
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );
  }

  static buildSupportMainButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('support_create_ticket')
        .setLabel('📝 Create Support Ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('support_my_tickets')
        .setLabel('My Tickets')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('support_status')
        .setLabel('Support Status')
        .setStyle(ButtonStyle.Secondary)
    );
  }
}

export default { SupportEmbedFactory, SupportActionRowFactory };
