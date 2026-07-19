import logger from '../utils/logger.js';

/**
 * Support Ticket System
 */
export class SupportTicket {
  constructor(userId, category, title, description) {
    this.id = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = userId;
    this.category = category; // 'general', 'bug', 'trial', 'premium', 'other'
    this.title = title;
    this.description = description;
    this.status = 'open'; // open, in-progress, resolved, closed
    this.priority = this._calculatePriority(category);
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.assignedTo = null;
    this.messages = [
      {
        author: 'user',
        content: description,
        timestamp: new Date(),
      },
    ];
    this.estimatedResponseTime = this._getEstimatedResponseTime();
  }

  _calculatePriority(category) {
    const priorityMap = {
      bug: 'high',
      premium: 'high',
      trial: 'medium',
      general: 'low',
      other: 'low',
    };
    return priorityMap[category] || 'low';
  }

  _getEstimatedResponseTime() {
    const now = new Date();
    const hour = now.getHours();

    // Slower support overnight (22:00 - 08:00)
    if (hour >= 22 || hour < 8) {
      return 'overnight (slower response)';
    }

    // During day hours
    return 'within 1-2 hours';
  }

  addMessage(author, content) {
    this.messages.push({
      author,
      content,
      timestamp: new Date(),
    });
    this.updatedAt = new Date();
  }

  resolve(resolution) {
    this.status = 'resolved';
    this.updatedAt = new Date();
    this.addMessage('support', resolution);
  }

  getStatus() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      status: this.status,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      messageCount: this.messages.length,
      estimatedResponse: this.estimatedResponseTime,
    };
  }
}

export class SupportManager {
  constructor() {
    this.tickets = new Map(); // ticketId -> ticket
    this.userTickets = new Map(); // userId -> ticketIds
    this.supportQueue = []; // queue of tickets needing response
  }

  /**
   * Create a new support ticket
   */
  createTicket(userId, category, title, description) {
    const ticket = new SupportTicket(userId, category, title, description);

    this.tickets.set(ticket.id, ticket);

    if (!this.userTickets.has(userId)) {
      this.userTickets.set(userId, []);
    }
    this.userTickets.get(userId).push(ticket.id);

    // Add to support queue
    this.supportQueue.push(ticket.id);
    // Sort by priority
    this._sortQueue();

    logger.info(
      { ticketId: ticket.id, userId, category, priority: ticket.priority },
      'Support ticket created'
    );

    return ticket;
  }

  /**
   * Get ticket by ID
   */
  getTicket(ticketId) {
    return this.tickets.get(ticketId);
  }

  /**
   * Get user's tickets
   */
  getUserTickets(userId) {
    const ticketIds = this.userTickets.get(userId) || [];
    return ticketIds.map(id => this.tickets.get(id)).filter(t => t);
  }

  /**
   * Get open tickets
   */
  getOpenTickets(userId) {
    return this.getUserTickets(userId).filter(t => t.status === 'open');
  }

  /**
   * Add message to ticket
   */
  addMessage(ticketId, author, content) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    ticket.addMessage(author, content);

    if (author === 'support') {
      ticket.status = 'in-progress';
    }

    return ticket;
  }

  /**
   * Update ticket status
   */
  updateStatus(ticketId, status) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    ticket.status = status;
    ticket.updatedAt = new Date();

    if (status === 'resolved' || status === 'closed') {
      this._removeFromQueue(ticketId);
    }

    logger.info({ ticketId, status }, 'Ticket status updated');
    return ticket;
  }

  /**
   * Resolve ticket
   */
  resolveTicket(ticketId, resolution) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    ticket.resolve(resolution);
    this._removeFromQueue(ticketId);

    logger.info({ ticketId }, 'Ticket resolved');
    return ticket;
  }

  /**
   * Get queue for support team
   */
  getQueue() {
    return this.supportQueue
      .map(id => this.tickets.get(id))
      .filter(t => t && (t.status === 'open' || t.status === 'in-progress'));
  }

  /**
   * Get next ticket to handle
   */
  getNextTicket() {
    for (const ticketId of this.supportQueue) {
      const ticket = this.tickets.get(ticketId);
      if (ticket && ticket.status === 'open') {
        ticket.status = 'in-progress';
        return ticket;
      }
    }
    return null;
  }

  /**
   * Get ticket statistics
   */
  getStats() {
    const stats = {
      totalTickets: this.tickets.size,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      byCategory: {},
      queueLength: this.supportQueue.length,
      avgResponseTime: this._calculateAvgResponseTime(),
    };

    for (const ticket of this.tickets.values()) {
      stats[ticket.status]++;

      if (!stats.byCategory[ticket.category]) {
        stats.byCategory[ticket.category] = 0;
      }
      stats.byCategory[ticket.category]++;
    }

    return stats;
  }

  /**
   * Sort queue by priority
   */
  _sortQueue() {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    this.supportQueue.sort((aId, bId) => {
      const ticketA = this.tickets.get(aId);
      const ticketB = this.tickets.get(bId);

      if (!ticketA || !ticketB) return 0;

      const priorityDiff = priorityOrder[ticketA.priority] - priorityOrder[ticketB.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by creation time (oldest first)
      return ticketA.createdAt - ticketB.createdAt;
    });
  }

  /**
   * Remove from queue
   */
  _removeFromQueue(ticketId) {
    const index = this.supportQueue.indexOf(ticketId);
    if (index > -1) {
      this.supportQueue.splice(index, 1);
    }
  }

  /**
   * Calculate average response time
   */
  _calculateAvgResponseTime() {
    let totalTime = 0;
    let count = 0;

    for (const ticket of this.tickets.values()) {
      if (ticket.messages.length > 1 && ticket.status !== 'open') {
        const responseTime = ticket.messages[1].timestamp - ticket.createdAt;
        totalTime += responseTime;
        count++;
      }
    }

    if (count === 0) return 'N/A';

    const avgMs = totalTime / count;
    const minutes = Math.round(avgMs / 60000);

    if (minutes < 60) return `${minutes}m`;
    return `${Math.round(minutes / 60)}h`;
  }

  /**
   * Format ticket for display
   */
  formatTicket(ticket) {
    return `
**Ticket #${ticket.id.split('_')[1]}**
Category: ${ticket.category}
Status: ${ticket.status}
Priority: ${ticket.priority}
Created: ${ticket.createdAt.toLocaleString()}
    `.trim();
  }
}

export default SupportManager;
