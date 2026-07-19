import logger from './utils/logger.js';
import { config, validateConfig } from './utils/config.js';
import { startFileServer } from './utils/fileServer.js';
import DiscordBot from './bot/discordBot.js';
import SessionManager from './session/sessionManager.js';
import QueueManager from './queue/queueManager.js';
import BedrockSolver from './ai/bedrockSolver.js';
import { SparxMaths } from './platforms/sparxMaths/index.js';
import { EducAke } from './platforms/educake/index.js';
import { DrFrost } from './platforms/drfrost/index.js';
import { Seneca } from './platforms/seneca/index.js';
import { LanguageNut } from './platforms/languagenut/index.js';
import { handleError } from './utils/errorHandler.js';
import HomeworkTracker from './session/homeworkTracker.js';
import PremiumManager from './session/premiumManager.js';
import ScheduleManager from './session/scheduleManager.js';
import QueueSystem from './queue/queueSystem.js';
import SupportManager from './session/supportManager.js';
import CommandHandler from './bot/commandHandler.js';

/**
 * Main Application Class
 */
class UltimateAutoCompleter {
  constructor() {
    this.bot = null;
    this.sessionManager = null;
    this.queueManager = null;
    this.bedrockSolver = null;
    this.homeworkTracker = null;
    this.premiumManager = null;
    this.scheduleManager = null;
    this.queueSystem = null;
    this.supportManager = null;
    this.commandHandler = null;
    this.platforms = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    try {
      logger.info('Initializing Ultimate Auto Completer...');

      // Validate configuration
      validateConfig();

      // Initialize components
      this.sessionManager = new SessionManager(config.features.persistSessions);
      this.queueManager = new QueueManager();
      this.bedrockSolver = new BedrockSolver();
      this.homeworkTracker = new HomeworkTracker();
      this.premiumManager = new PremiumManager();
      this.scheduleManager = new ScheduleManager();
      this.queueSystem = new QueueSystem();
      this.supportManager = new SupportManager();

      // Initialize platforms
      this.initializePlatforms();

      // Initialize Discord bot
      this.bot = new DiscordBot();
      this.commandHandler = new CommandHandler(this);
      this.bot.setCommandHandler(this.commandHandler);
      this.bot.setApp(this);

      logger.info('✅ All components initialized successfully');
      return true;
    } catch (error) {
      const errorData = handleError(error, { context: 'initialization' });
      throw error;
    }
  }

  /**
   * Initialize all platform plugins
   */
  initializePlatforms() {
    const platformConfigs = [
      { name: 'sparxMaths', Class: SparxMaths },
      { name: 'educake', Class: EducAke },
      { name: 'drfrost', Class: DrFrost },
      { name: 'seneca', Class: Seneca },
      { name: 'languagenut', Class: LanguageNut },
    ];

    for (const { name, Class } of platformConfigs) {
      const credentials = config.platforms[name] || {};
      const platform = new Class(credentials);
      this.platforms.set(name, platform);
      logger.info({ platform: name }, 'Platform registered');
    }
  }

  /**
   * Start the application
   */
  async start() {
    try {
      await this.initialize();

      // Load previous sessions if persistence is enabled
      if (config.features.persistSessions) {
        this.sessionManager.loadSessions();
      }

      // Start file server for serving media files (GIFs, images, etc.)
      startFileServer(3001);

      // Connect Discord bot (optional)
      if (config.discord.token) {
        try {
          await this.bot.login();
          logger.info('✅ Discord bot connected');

          // Send startup messages to configured channels
          await this.bot.sendStartupMessages();
        } catch (error) {
          logger.warn({ error: error.message }, '⚠️  Discord bot connection failed - running without bot');
          this.bot = null;
        }
      } else {
        logger.warn('⚠️  DISCORD_TOKEN not set - running without bot. Set it in .env to enable Discord features.');
        this.bot = null;
      }

      this.isRunning = true;
      logger.info('🚀 Ultimate Auto Completer is now running!');

      // Setup graceful shutdown
      this.setupShutdownHandlers();
    } catch (error) {
      handleError(error, { context: 'startup' });
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Setup shutdown handlers
   */
  setupShutdownHandlers() {
    const signals = ['SIGINT', 'SIGTERM'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info({ signal }, 'Shutdown signal received');
        await this.shutdown();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error({ error: error.message, stack: error.stack }, 'Uncaught exception');
      this.shutdown().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled promise rejection');
      this.shutdown().then(() => process.exit(1));
    });
  }

  /**
   * Gracefully shutdown the application
   */
  async shutdown() {
    try {
      logger.info('Shutting down...');

      if (this.bot) {
        await this.bot.close();
      }

      if (this.queueManager) {
        await this.queueManager.close();
      }

      // Close all platform sessions
      for (const platform of this.platforms.values()) {
        if (platform.isInitialized) {
          await platform.close();
        }
      }

      this.isRunning = false;
      logger.info('✅ Graceful shutdown completed');
    } catch (error) {
      logger.error({ error: error.message }, 'Error during shutdown');
    }
  }

  /**
   * Get platform instance
   */
  getPlatform(platformName) {
    return this.platforms.get(platformName.toLowerCase());
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      platformsRegistered: this.platforms.size,
      sessionsActive: this.sessionManager.sessions.size,
      bedrockRequests: this.bedrockSolver.requestCount,
      version: '2.0.0',
      uptime: process.uptime(),
    };
  }
}

/**
 * Main entry point
 */
async function main() {
  const app = new UltimateAutoCompleter();
  await app.start();
}

main().catch((error) => {
  logger.error({ error: error.message, stack: error.stack }, 'Fatal error');
  process.exit(1);
});

export default UltimateAutoCompleter;
