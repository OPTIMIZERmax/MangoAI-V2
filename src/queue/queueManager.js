import { Queue, Worker } from 'bullmq';
import logger from '../utils/logger.js';
import { QueueError } from '../utils/errorHandler.js';
import config from '../utils/config.js';

export class QueueManager {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.redisConfig = {
      host: new URL(config.redis.url).hostname,
      port: parseInt(new URL(config.redis.url).port || 6379),
    };
  }

  /**
   * Create a new queue
   */
  createQueue(queueName, options = {}) {
    try {
      const queue = new Queue(queueName, {
        connection: this.redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
        ...options,
      });

      this.queues.set(queueName, queue);
      logger.info({ queue: queueName }, 'Queue created');

      return queue;
    } catch (error) {
      throw new QueueError(`Failed to create queue ${queueName}: ${error.message}`);
    }
  }

  /**
   * Create a worker for a queue
   */
  createWorker(queueName, processor, options = {}) {
    try {
      const worker = new Worker(queueName, processor, {
        connection: this.redisConfig,
        concurrency: config.features.maxConcurrentTasks,
        ...options,
      });

      worker.on('completed', (job) => {
        logger.info({ jobId: job.id, queue: queueName }, 'Job completed');
      });

      worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, queue: queueName, error: err.message }, 'Job failed');
      });

      worker.on('error', (err) => {
        logger.error({ queue: queueName, error: err.message }, 'Worker error');
      });

      this.workers.set(`${queueName}_worker`, worker);
      logger.info({ queue: queueName }, 'Worker created');

      return worker;
    } catch (error) {
      throw new QueueError(`Failed to create worker for ${queueName}: ${error.message}`);
    }
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName, data, options = {}) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const job = await queue.add(queueName, data, {
        jobId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...options,
      });

      logger.info({ jobId: job.id, queue: queueName }, 'Job added to queue');
      return job;
    } catch (error) {
      throw new QueueError(`Failed to add job to ${queueName}: ${error.message}`);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(queueName, jobId) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const job = await queue.getJob(jobId);
      if (!job) return null;

      return {
        id: job.id,
        status: await job.getState(),
        progress: job.progress(),
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        data: job.data,
        result: job.returnvalue,
      };
    } catch (error) {
      throw new QueueError(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed');
      return {
        queue: queueName,
        ...counts,
      };
    } catch (error) {
      throw new QueueError(`Failed to get queue stats: ${error.message}`);
    }
  }

  /**
   * Clear a queue
   */
  async clearQueue(queueName) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await queue.clean(0, 100); // Clean with 0 grace period, max 100 jobs
      logger.info({ queue: queueName }, 'Queue cleared');
    } catch (error) {
      throw new QueueError(`Failed to clear queue: ${error.message}`);
    }
  }

  /**
   * Close all queues and workers
   */
  async close() {
    try {
      for (const worker of this.workers.values()) {
        await worker.close();
      }

      for (const queue of this.queues.values()) {
        await queue.close();
      }

      logger.info('All queues and workers closed');
    } catch (error) {
      logger.error({ error: error.message }, 'Error closing queues/workers');
    }
  }
}

export default QueueManager;
