import logger from './logger.js';

export class AppError extends Error {
  constructor(message, code, statusCode = 500, context = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class PlatformError extends AppError {
  constructor(message, platform, context = {}) {
    super(message, `PLATFORM_${platform.toUpperCase()}_ERROR`, 400, context);
    this.platform = platform;
  }
}

export class SessionError extends AppError {
  constructor(message, context = {}) {
    super(message, 'SESSION_ERROR', 400, context);
  }
}

export class AIError extends AppError {
  constructor(message, context = {}) {
    super(message, 'AI_ERROR', 503, context);
  }
}

export class QueueError extends AppError {
  constructor(message, context = {}) {
    super(message, 'QUEUE_ERROR', 500, context);
  }
}

export function handleError(error, context = {}) {
  const errorData = {
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    context: { ...error.context, ...context },
  };

  if (error instanceof AppError) {
    logger.error(errorData, `[${error.code}] ${error.message}`);
  } else {
    logger.error({
      ...errorData,
      stack: error.stack,
      originalError: error.toString(),
    }, 'Unhandled error');
  }

  return errorData;
}

export function logErrorSummary(error) {
  const summary = {
    code: error.code || 'UNKNOWN',
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  logger.info(summary, 'Error summary');
  return summary;
}
