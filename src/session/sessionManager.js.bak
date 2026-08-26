import logger from '../utils/logger.js';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sessionsDir = path.join(__dirname, '../../data/sessions');

// Ensure sessions directory exists
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

export class SessionManager {
  constructor(persistSessions = true) {
    this.sessions = new Map();
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour default TTL
    this.persistSessions = persistSessions;
  }

  /**
   * Create a new session
   */
  createSession(userId, platform, data = {}) {
    const sessionId = `${userId}_${platform}_${Date.now()}`;
    const session = {
      id: sessionId,
      userId,
      platform,
      createdAt: new Date(),
      lastActivity: new Date(),
      data,
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    this.cache.set(sessionId, session);

    if (this.persistSessions) {
      this._saveSession(session);
    }

    logger.info({ sessionId, userId, platform }, 'Session created');
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    let session = this.cache.get(sessionId);

    if (!session) {
      session = this.sessions.get(sessionId);
      if (session) {
        this.cache.set(sessionId, session);
      }
    }

    if (session) {
      session.lastActivity = new Date();
    }

    return session;
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId) {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  /**
   * Update session data
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    Object.assign(session, updates);
    session.lastActivity = new Date();

    this.sessions.set(sessionId, session);
    this.cache.set(sessionId, session);

    if (this.persistSessions) {
      this._saveSession(session);
    }

    return session;
  }

  /**
   * End a session
   */
  endSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.status = 'closed';
    session.closedAt = new Date();

    this.sessions.set(sessionId, session);
    this.cache.set(sessionId, session);

    if (this.persistSessions) {
      this._saveSession(session);
    }

    logger.info({ sessionId }, 'Session ended');
    return session;
  }

  /**
   * Load sessions from disk
   */
  loadSessions() {
    try {
      const files = fs.readdirSync(sessionsDir);
      let loadedCount = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(sessionsDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          this.sessions.set(data.id, data);
          this.cache.set(data.id, data);
          loadedCount++;
        }
      }

      logger.info({ loadedCount }, 'Sessions loaded from disk');
      return loadedCount;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to load sessions');
      return 0;
    }
  }

  /**
   * Clear expired sessions
   */
  clearExpiredSessions(maxAgeMs = 86400000) { // 24 hours default
    let clearedCount = 0;
    const now = Date.now();

    for (const [sessionId, session] of this.sessions) {
      const age = now - new Date(session.lastActivity).getTime();
      if (age > maxAgeMs) {
        this.sessions.delete(sessionId);
        this.cache.del(sessionId);
        clearedCount++;
      }
    }

    logger.info({ clearedCount }, 'Expired sessions cleared');
    return clearedCount;
  }

  /**
   * Save session to disk
   */
  _saveSession(session) {
    try {
      const filename = `${session.id}.json`;
      const filepath = path.join(sessionsDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(session, null, 2));
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to save session to disk');
    }
  }
}

export default SessionManager;
