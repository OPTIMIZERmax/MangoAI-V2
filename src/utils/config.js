import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Discord
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    prefix: process.env.DISCORD_PREFIX || '!',
    channels: {
      learningPlatform: process.env.DISCORD_CHANNEL_LEARNING_ID || process.env.DISCORD_CHANNEL_HOMEWORK_ID || '',
      autoSchedule: process.env.DISCORD_CHANNEL_SCHEDULE_ID || '',
      supportTickets: process.env.DISCORD_CHANNEL_SUPPORT_ID || '',
    },
  },

  // AWS Bedrock
  bedrock: {
    region: process.env.AWS_REGION || 'us-east-1',
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },

  // Features
  features: {
    autoSolve: process.env.ENABLE_AUTO_SOLVE === 'true',
    persistSessions: process.env.ENABLE_SESSION_PERSISTENCE === 'true',
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '5'),
    taskTimeout: parseInt(process.env.TASK_TIMEOUT || '300000'),
  },

  // Platform Credentials
  platforms: {
    sparx: {
      email: process.env.SPARX_EMAIL || '',
      password: process.env.SPARX_PASSWORD || '',
    },
    educake: {
      email: process.env.EDUCAKE_EMAIL || '',
      password: process.env.EDUCAKE_PASSWORD || '',
    },
    drfrost: {
      email: process.env.DRFROST_EMAIL || '',
      password: process.env.DRFROST_PASSWORD || '',
    },
    seneca: {
      email: process.env.SENECA_EMAIL || '',
      password: process.env.SENECA_PASSWORD || '',
    },
    languagenut: {
      email: process.env.LANGUAGENUT_EMAIL || '',
      password: process.env.LANGUAGENUT_PASSWORD || '',
    },
    mango: {
      id: process.env.MANGO_LEARNING_PLATFORM_ID || '',
      name: process.env.MANGO_LEARNING_PLATFORM_NAME || '',
    },
  },

  // API Keys
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  },
};

export function validateConfig() {
  const errors = [];

  if (!config.discord.token) {
    errors.push('DISCORD_TOKEN is required');
  }

  if (config.features.autoSolve && !config.bedrock.region) {
    errors.push('AWS_REGION is required for auto-solve feature');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

export default config;
