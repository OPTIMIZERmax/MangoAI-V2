import logger from '../utils/logger.js';

/**
 * Queue Management System
 */
export class QueueSystem {
  constructor() {
    this.queues = new Map(); // platform -> queue
    this.users = new Map(); // userId -> { position, joinedAt, platform }
  }

  /**
   * Join queue
   */
  joinQueue(userId, platform, type = 'solo', savedAccounts = [], question = null) {
    if (!this.queues.has(platform)) {
      this.queues.set(platform, []);
    }

    const queue = this.queues.get(platform);

    // Check if user already in queue
    const existing = queue.find(u => u.userId === userId);
    if (existing) {
      return { error: 'Already in queue', position: existing.position };
    }

    const queueEntry = {
      userId,
      position: queue.length + 1,
      joinedAt: new Date(),
      type, // 'solo', 'saved-accounts', 'group'
      savedAccounts,
      status: 'waiting', // waiting, processing, completed
      estimatedWaitTime: this._calculateWaitTime(queue),
      question,
    };

    queue.push(queueEntry);
    logger.info({ userId, platform, position: queueEntry.position }, 'User joined queue');

    return queueEntry;
  }

  /**
   * Leave queue
   */
  leaveQueue(userId, platform) {
    if (!this.queues.has(platform)) return false;

    const queue = this.queues.get(platform);
    const index = queue.findIndex(u => u.userId === userId);

    if (index === -1) return false;

    queue.splice(index, 1);

    // Update positions
    for (let i = index; i < queue.length; i++) {
      queue[i].position = i + 1;
    }

    logger.info({ userId, platform }, 'User left queue');
    return true;
  }

  /**
   * Get queue position
   */
  getQueuePosition(userId, platform) {
    if (!this.queues.has(platform)) return null;

    const queue = this.queues.get(platform);
    const user = queue.find(u => u.userId === userId);

    return user || null;
  }

  /**
   * Get queue for platform
   */
  getQueue(platform) {
    return this.queues.get(platform) || [];
  }

  /**
   * Get all queues status
   */
  getQueuesStatus() {
    const status = {};

    for (const [platform, queue] of this.queues) {
      status[platform] = {
        platform,
        totalInQueue: queue.length,
        users: queue.map((u, idx) => ({
          position: idx + 1,
          userId: u.userId,
          type: u.type,
          waitTime: u.estimatedWaitTime,
        })),
      };
    }

    return status;
  }

  /**
   * Process next user in queue
   */
  processNext(platform) {
    if (!this.queues.has(platform)) return null;

    const queue = this.queues.get(platform);
    if (queue.length === 0) return null;

    const user = queue.shift();
    user.status = 'processing';
    user.processedAt = new Date();

    // Recalculate positions
    for (let i = 0; i < queue.length; i++) {
      queue[i].position = i + 1;
    }

    logger.info({ userId: user.userId, platform }, 'Processing user from queue');

    return user;
  }

  /**
   * Mark user as completed
   */
  markCompleted(userId, platform) {
    // User already removed from queue when processing
    logger.info({ userId, platform }, 'User queue processing completed');
    return true;
  }

  /**
   * Calculate wait time (rough estimate)
   */
  _calculateWaitTime(queue) {
    // Rough estimate: 2 minutes per task in queue
    return queue.length * 2;
  }

  /**
   * Get queue stats
   */
  getQueueStats() {
    const stats = {
      totalQueues: this.queues.size,
      totalInQueues: 0,
      platformStats: {},
    };

    for (const [platform, queue] of this.queues) {
      stats.totalInQueues += queue.length;
      stats.platformStats[platform] = {
        count: queue.length,
        avgWait: this._calculateWaitTime(queue),
      };
    }

    return stats;
  }
}

export default QueueSystem;
