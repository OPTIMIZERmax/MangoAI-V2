import logger from "./utils/logger.js";
import {
  config,
  validateConfig
} from "./utils/config.js";

import {
  startFileServer
} from "./utils/fileServer.js";

import {
  DiscordBot
} from "./bot/discordBot.js";

import SessionManager from "./session/sessionManager.js";
import QueueManager from "./queue/queueManager.js";
import BedrockSolver from "./ai/bedrockSolver.js";
import HomeworkTracker from "./session/homeworkTracker.js";
import PremiumManager from "./session/premiumManager.js";
import ScheduleManager from "./session/scheduleManager.js";
import QueueSystem from "./queue/queueSystem.js";
import SupportManager from "./session/supportManager.js";

import PlatformService from "./services/PlatformService.js";
import LoginService from "./services/LoginService.js";

import {
  SparxMaths
} from "./platforms/sparxMaths/index.js";

import {
  EducAke
} from "./platforms/educake/index.js";

import {
  DrFrost
} from "./platforms/drfrost/index.js";

import {
  Seneca
} from "./platforms/seneca/index.js";

import {
  LanguageNut
} from "./platforms/languagenut/index.js";

import {
  AdapterRegistry
} from "../packages/mango-engine/index.js";

import {
  handleError
} from "./utils/errorHandler.js";

/**
 * Main Application Class
 */
class UltimateAutoCompleter {
  constructor() {
    // ========================================================
    // CORE COMPONENTS
    // ========================================================

    this.bot = null;

    this.sessionManager = null;
    this.queueManager = null;
    this.bedrockSolver = null;
    this.homeworkTracker = null;
    this.premiumManager = null;
    this.scheduleManager = null;
    this.queueSystem = null;
    this.supportManager = null;

    // ========================================================
    // PLATFORM / ENGINE SERVICES
    // ========================================================

    this.platforms = new Map();

    this.engine = null;
    this.platformService = null;
    this.loginService = null;

    // ========================================================
    // APPLICATION STATE
    // ========================================================

    this.isRunning = false;
    this.shutdownStarted = false;
  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  async initialize() {
    try {
      console.log("INIT START");

      logger.info(
        "Initializing Ultimate Auto Completer..."
      );

      // ------------------------------------------------------
      // VALIDATE CONFIGURATION
      // ------------------------------------------------------

      validateConfig();

      // ------------------------------------------------------
      // CREATE MANAGERS
      // ------------------------------------------------------

      console.log(
        "Creating SessionManager"
      );

      this.sessionManager =
        new SessionManager(
          config.features.persistSessions
        );

      console.log(
        "Creating QueueManager"
      );

      this.queueManager =
        new QueueManager();

      console.log(
        "Creating BedrockSolver"
      );

      this.bedrockSolver =
        new BedrockSolver();

      console.log(
        "Creating HomeworkTracker"
      );

      this.homeworkTracker =
        new HomeworkTracker();

      console.log(
        "Creating PremiumManager"
      );

      this.premiumManager =
        new PremiumManager();

      console.log(
        "Creating ScheduleManager"
      );

      this.scheduleManager =
        new ScheduleManager();

      console.log(
        "Creating QueueSystem"
      );

      this.queueSystem =
        new QueueSystem();

      console.log(
        "Creating SupportManager"
      );

      this.supportManager =
        new SupportManager();

      console.log(
        "All managers created"
      );

      // ------------------------------------------------------
      // PLATFORM REGISTRATION
      // ------------------------------------------------------

      this.initializePlatforms();

      console.log(
        "PLATFORMS OK"
      );

      // ------------------------------------------------------
      // MANGO ENGINE
      // ------------------------------------------------------

      this.engine =
        new AdapterRegistry();

      this.platformService =
        new PlatformService(
          this
        );

      // ------------------------------------------------------
      // LOGIN SERVICE
      // ------------------------------------------------------

      this.loginService =
        new LoginService(
          this
        );

      this.loginService.setPlatformService(
        this.platformService
      );

      // ------------------------------------------------------
      // DISCORD BOT
      // ------------------------------------------------------

      this.bot =
        new DiscordBot();

      this.bot.setApp(
        this
      );

      this.bot.setPlatformService(
        this.platformService
      );

      this.bot.setLoginService(
        this.loginService
      );

      console.log(
        "DISCORDBOT OK"
      );

      logger.info(
        "✅ All components initialized successfully"
      );

      return true;
    } catch (error) {
      const errorData =
        handleError(
          error,
          {
            context:
              "initialization"
          }
        );

      logger.error(
        errorData
      );

      throw error;
    }
  }

  // ==========================================================
  // PLATFORM INITIALIZATION
  // ==========================================================

  initializePlatforms() {
    const platformConfigs = [
      {
        name:
          "sparxMaths",

        Class:
          SparxMaths
      },

      {
        name:
          "educake",

        Class:
          EducAke
      },

      {
        name:
          "drfrost",

        Class:
          DrFrost
      },

      {
        name:
          "seneca",

        Class:
          Seneca
      },

      {
        name:
          "languagenut",

        Class:
          LanguageNut
      }
    ];

    for (
      const {
        name,
        Class
      } of platformConfigs
    ) {
      try {
        const platform =
          new Class({});

        this.platforms.set(
          name,
          platform
        );

        logger.info(
          {
            platform:
              name
          },
          "Platform registered"
        );
      } catch (error) {
        logger.error(
          {
            platform:
              name,

            error:
              error?.message,

            stack:
              error?.stack
          },
          "Failed to initialize platform"
        );

        throw error;
      }
    }
  }

  // ==========================================================
  // START APPLICATION
  // ==========================================================

  async start() {
    try {
      console.log(
        "START FUNCTION ENTERED"
      );

      await this.initialize();

      console.log(
        "INITIALIZE FINISHED"
      );

      // ------------------------------------------------------
      // LOAD SESSIONS
      // ------------------------------------------------------

      if (
        config.features.persistSessions
      ) {
        try {
          this.sessionManager.loadSessions();

          logger.info(
            "Sessions loaded from disk"
          );
        } catch (error) {
          logger.error(
            {
              error:
                error?.message,

              stack:
                error?.stack
            },
            "Failed to load persisted sessions"
          );
        }
      }

      // ------------------------------------------------------
      // FILE SERVER
      // ------------------------------------------------------

      startFileServer(
        3001
      );

      logger.info(
        {
          port:
            3001
        },
        "📸 File server started"
      );

      // ------------------------------------------------------
      // DISCORD
      // ------------------------------------------------------

      if (
        config.discord.token
      ) {
        try {
          await this.bot.login();

          console.log(
            "DISCORD LOGIN FINISHED"
          );

          logger.info(
            "✅ Discord bot connected"
          );

          /*
           * Verification is intentionally NOT started here.
           *
           * DiscordBot's clientReady handler is responsible
           * for sending the single Components V2 verification
           * panel.
           *
           * This prevents duplicate verification panels and
           * removes the old startup verification system.
           */
        } catch (error) {
          logger.warn(
            {
              error:
                error?.message,

              stack:
                error?.stack
            },
            "⚠️ Discord bot connection failed - running without bot"
          );

          /*
           * Do not destroy the initialized bot object unless
           * absolutely necessary. Other parts of the app may
           * still reference it.
           */
        }
      } else {
        logger.warn(
          "⚠️ DISCORD_TOKEN not set - Discord features disabled"
        );

        this.bot =
          null;
      }

      // ------------------------------------------------------
      // APPLICATION IS READY
      // ------------------------------------------------------

      this.isRunning =
        true;

      logger.info(
        "🚀 Ultimate Auto Completer is now running!"
      );

      // ------------------------------------------------------
      // GRACEFUL SHUTDOWN
      // ------------------------------------------------------

      this.setupShutdownHandlers();
    } catch (error) {
      const errorData =
        handleError(
          error,
          {
            context:
              "startup"
          }
        );

      logger.error(
        errorData
      );

      await this.shutdown();

      process.exit(1);
    }
  }

  // ==========================================================
  // SHUTDOWN HANDLERS
  // ==========================================================

  setupShutdownHandlers() {
    /*
     * Prevent installing duplicate signal handlers if
     * start() is ever called more than once.
     */
    if (
      this._shutdownHandlersInstalled
    ) {
      return;
    }

    this._shutdownHandlersInstalled =
      true;

    const signals = [
      "SIGINT",
      "SIGTERM"
    ];

    for (
      const signal of
        signals
    ) {
      process.once(
        signal,
        async () => {
          logger.info(
            {
              signal
            },
            "Shutdown signal received"
          );

          await this.shutdown();

          process.exit(
            0
          );
        }
      );
    }

    process.once(
      "uncaughtException",
      async error => {
        logger.error(
          {
            error:
              error?.message,

            stack:
              error?.stack
          },
          "Uncaught exception"
        );

        await this.shutdown();

        process.exit(
          1
        );
      }
    );

    process.once(
      "unhandledRejection",
      async (
        reason
      ) => {
        logger.error(
          {
            reason
          },
          "Unhandled promise rejection"
        );

        await this.shutdown();

        process.exit(
          1
        );
      }
    );
  }

  // ==========================================================
  // GRACEFUL SHUTDOWN
  // ==========================================================

  async shutdown() {
    if (
      this.shutdownStarted
    ) {
      return;
    }

    this.shutdownStarted =
      true;

    try {
      logger.info(
        "Shutting down..."
      );

      // ------------------------------------------------------
      // DISCORD BOT
      // ------------------------------------------------------

      if (
        this.bot
      ) {
        try {
          await this.bot.close();
        } catch (error) {
          logger.error(
            {
              error:
                error?.message,

              stack:
                error?.stack
            },
            "Failed to close Discord bot"
          );
        }
      }

      // ------------------------------------------------------
      // QUEUE MANAGER
      // ------------------------------------------------------

      if (
        this.queueManager
      ) {
        try {
          await this.queueManager.close();
        } catch (error) {
          logger.error(
            {
              error:
                error?.message
            },
            "Failed to close QueueManager"
          );
        }
      }

      // ------------------------------------------------------
      // PLATFORM SERVICE
      // ------------------------------------------------------

      if (
        this.platformService
      ) {
        try {
          await this.platformService.shutdown();
        } catch (error) {
          logger.error(
            {
              error:
                error?.message
            },
            "Failed to shutdown PlatformService"
          );
        }
      }

      // ------------------------------------------------------
      // PLATFORMS
      // ------------------------------------------------------

      for (
        const [
          name,
          platform
        ] of this.platforms
      ) {
        try {
          if (
            platform?.isInitialized &&
            typeof platform.close ===
              "function"
          ) {
            await platform.close();
          }
        } catch (error) {
          logger.error(
            {
              platform:
                name,

              error:
                error?.message
            },
            "Failed to close platform"
          );
        }
      }

      this.isRunning =
        false;

      logger.info(
        "✅ Graceful shutdown completed"
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,

          stack:
            error?.stack
        },
        "Error during shutdown"
      );
    }
  }

  // ==========================================================
  // GET PLATFORM
  // ==========================================================

  getPlatform(
    platformName
  ) {
    if (
      !platformName
    ) {
      return null;
    }

    const normalizedName =
      String(
        platformName
      )
        .trim()
        .toLowerCase();

    return this.platforms.get(
      normalizedName
    ) ??
      this.platforms.get(
        platformName
      ) ??
      null;
  }

  // ==========================================================
  // APPLICATION STATUS
  // ==========================================================

  getStatus() {
    return {
      isRunning:
        this.isRunning,

      platformsRegistered:
        this.platforms.size,

      sessionsActive:
        this.sessionManager?.sessions
          ?.size ??
        0,

      bedrockRequests:
        this.bedrockSolver?.requestCount ??
        0,

      version:
        "2.0.0",

      uptime:
        process.uptime()
    };
  }
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

async function main() {
  console.log(
    "1. MAIN STARTED"
  );

  const app =
    new UltimateAutoCompleter();

  console.log(
    "2. APP CREATED"
  );

  await app.start();

  console.log(
    "3. APP START FINISHED"
  );
}

main().catch(
  error => {
    logger.error(
      {
        error:
          error?.message,

        stack:
          error?.stack
      },
      "Fatal error"
    );

    process.exit(
      1
    );
  }
);

export default UltimateAutoCompleter;