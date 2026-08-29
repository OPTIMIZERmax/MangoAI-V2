import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

dotenv.config({
  path: path.join(__dirname, '../../.env')
});

export const config = {
  // ==========================================================
  // DISCORD
  // ==========================================================

  discord: {
    token:
      process.env.DISCORD_TOKEN || '',

    developerRoleId:
      process.env.DEV_ROLE_ID || '1510305056468238558',

    arcadeChannelId:
      process.env.ARCADE_CHANNEL_ID || '1541427001435361321',

    channels: {
      learningPlatform:
        process.env.DISCORD_CHANNEL_LEARNING_ID ||
        process.env.DISCORD_CHANNEL_HOMEWORK_ID ||
        '',

      autoSchedule:
        process.env.DISCORD_CHANNEL_SCHEDULE_ID ||
        '',

      supportTickets:
        process.env.DISCORD_CHANNEL_SUPPORT_ID ||
        '',

      pastPapers:
        process.env.DISCORD_CHANNEL_PAST_PAPERS_ID ||
        '',

      homework:
        process.env.DISCORD_CHANNEL_HOMEWORK_ID ||
        process.env.DISCORD_CHANNEL_LEARNING_ID ||
        '',
    },
  },

  // ==========================================================
  // VERIFICATION
  // ==========================================================

  verification: {
    enabled:
      process.env.VERIFICATION_ENABLED === 'true',

    channelId:
      process.env.VERIFICATION_CHANNEL_ID || '',

    roleId:
      process.env.VERIFICATION_ROLE_ID || '',

    timeoutMs:
      parseInt(
        process.env.VERIFICATION_TIMEOUT_MS ||
          '300000',
        10
      ),

    maxAttempts:
      parseInt(
        process.env.VERIFICATION_MAX_ATTEMPTS ||
          '3',
        10
      ),
  },

  // ==========================================================
  // AWS BEDROCK
  // ==========================================================

  bedrock: {
    region:
      process.env.AWS_REGION ||
      'us-east-1',

    modelId:
      process.env.BEDROCK_MODEL_ID ||
      'anthropic.claude-3-haiku-20240307-v1:0',
  },

  // ==========================================================
  // REDIS
  // ==========================================================

  redis: {
    url:
      process.env.REDIS_URL ||
      'redis://localhost:6379',
  },

  // ==========================================================
  // LOGGING
  // ==========================================================

  logging: {
    level:
      process.env.LOG_LEVEL ||
      'info',

    file:
      process.env.LOG_FILE ||
      'logs/app.log',
  },

  // ==========================================================
  // FEATURES
  // ==========================================================

  features: {
    autoSolve:
      process.env.ENABLE_AUTO_SOLVE === 'true',

    persistSessions:
      process.env.ENABLE_SESSION_PERSISTENCE === 'true',

    refreshStartupChannels:
      process.env.REFRESH_STARTUP_CHANNELS === 'true',

    maxConcurrentTasks:
      parseInt(
        process.env.MAX_CONCURRENT_TASKS || '5',
        10
      ),

    taskTimeout:
      parseInt(
        process.env.TASK_TIMEOUT || '300000',
        10
      ),
  },

  // ==========================================================
  // PLATFORM CREDENTIALS
  // ==========================================================

  platforms: {
    sparx: {
      username: '',
      password: '',
      type: 'Normal',
    },

    educake: {
      email:
        process.env.EDUCAKE_EMAIL || '',

      password:
        process.env.EDUCAKE_PASSWORD || '',
    },

    drfrost: {
      email:
        process.env.DRFROST_EMAIL || '',

      password:
        process.env.DRFROST_PASSWORD || '',
    },

    seneca: {
      email:
        process.env.SENECA_EMAIL || '',

      password:
        process.env.SENECA_PASSWORD || '',
    },

    languagenut: {
      email:
        process.env.LANGUAGENUT_EMAIL || '',

      password:
        process.env.LANGUAGENUT_PASSWORD || '',
    },

    mango: {
      id:
        process.env.MANGO_LEARNING_PLATFORM_ID ||
        '',

      name:
        process.env.MANGO_LEARNING_PLATFORM_NAME ||
        '',
    },
  },

  // ==========================================================
  // API KEYS
  // ==========================================================

  apiKeys: {
    gemini:
      process.env.GEMINI_API_KEYS?.split(',') || [process.env.GEMINI_API_KEY || ''],

    openai:
      process.env.OPENAI_API_KEY || '',
  },
};

// ============================================================
// CONFIG VALIDATION
// ============================================================

export function validateConfig() {
  const errors = [];

  // ----------------------------------------------------------
  // Discord
  // ----------------------------------------------------------

  if (!config.discord.token) {
    errors.push(
      'DISCORD_TOKEN is required'
    );
  }

  // ----------------------------------------------------------
  // Verification
  // ----------------------------------------------------------

  if (
    config.verification.enabled &&
    !config.verification.channelId
  ) {
    errors.push(
      'VERIFICATION_CHANNEL_ID is required when verification is enabled'
    );
  }

  if (
    config.verification.enabled &&
    !config.verification.roleId
  ) {
    errors.push(
      'VERIFICATION_ROLE_ID is required when verification is enabled'
    );
  }

  // ----------------------------------------------------------
  // Verification timeout
  // ----------------------------------------------------------

  if (
    !Number.isFinite(
      config.verification.timeoutMs
    ) ||
    config.verification.timeoutMs <= 0
  ) {
    errors.push(
      'VERIFICATION_TIMEOUT_MS must be a positive number'
    );
  }

  // ----------------------------------------------------------
  // Verification attempts
  // ----------------------------------------------------------

  if (
    !Number.isInteger(
      config.verification.maxAttempts
    ) ||
    config.verification.maxAttempts < 1
  ) {
    errors.push(
      'VERIFICATION_MAX_ATTEMPTS must be an integer greater than 0'
    );
  }

  // ----------------------------------------------------------
  // Auto-solve
  // ----------------------------------------------------------

  if (
    config.features.autoSolve &&
    !config.bedrock.region
  ) {
    errors.push(
      'AWS_REGION is required for auto-solve feature'
    );
  }

  // ----------------------------------------------------------
  // Concurrent tasks
  // ----------------------------------------------------------

  if (
    !Number.isInteger(
      config.features.maxConcurrentTasks
    ) ||
    config.features.maxConcurrentTasks < 1
  ) {
    errors.push(
      'MAX_CONCURRENT_TASKS must be an integer greater than 0'
    );
  }

  // ----------------------------------------------------------
  // Task timeout
  // ----------------------------------------------------------

  if (
    !Number.isInteger(
      config.features.taskTimeout
    ) ||
    config.features.taskTimeout <= 0
  ) {
    errors.push(
      'TASK_TIMEOUT must be a positive integer'
    );
  }

  // ----------------------------------------------------------
  // Final validation
  // ----------------------------------------------------------

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}`
    );
  }

  return true;
}

export default config;