import logger from '../utils/logger.js';
import { PlatformError } from '../utils/errorHandler.js';

/**
 * Base class for all platform plugins
 */
export class Platform {
  constructor(name, credentials = {}) {
    this.name = name;
    this.credentials = credentials;
    this.session = null;
    this.isInitialized = false;
    this.requestCounter = 0;
    this.lastRequestTime = null;
  }

  /**
   * Initialize platform connection
   */
  async initialize() {
    try {
      logger.info({ platform: this.name }, `Initializing ${this.name}`);
      this.isInitialized = true;
      return true;
    } catch (error) {
      throw new PlatformError(`Failed to initialize ${this.name}`, this.name, { error: error.message });
    }
  }

  /**
   * Authenticate with the platform
   */
  async authenticate() {
    throw new Error(`authenticate() must be implemented by ${this.name}`);
  }

  /**
   * Solve a question/task
   */
  async solveQuestion(question, context = {}) {
    throw new Error(`solveQuestion() must be implemented by ${this.name}`);
  }

  /**
   * Get question details
   */
  async getQuestion(questionId) {
    throw new Error(`getQuestion() must be implemented by ${this.name}`);
  }

  /**
   * Submit an answer
   */
  async submitAnswer(questionId, answer) {
    throw new Error(`submitAnswer() must be implemented by ${this.name}`);
  }

  /**
   * Get user progress
   */
  async getProgress() {
    throw new Error(`getProgress() must be implemented by ${this.name}`);
  }

  /**
   * Close/logout session
   */
  async close() {
    logger.info({ platform: this.name }, `Closing ${this.name}`);
    this.session = null;
    this.isInitialized = false;
  }

  /**
   * Validate credentials
   */
  validateCredentials() {
    if (!this.credentials.email || !this.credentials.password) {
      throw new PlatformError('Missing email or password', this.name);
    }
    return true;
  }

  /**
   * Rate limiting helper
   */
  async checkRateLimit(delayMs = 1000) {
    if (this.lastRequestTime) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < delayMs) {
        await new Promise(resolve => setTimeout(resolve, delayMs - timeSinceLastRequest));
      }
    }
    this.lastRequestTime = Date.now();
    this.requestCounter++;
  }
}

export default Platform;
