import logger from '../utils/logger.js';

/**
 * Auto-Schedule Manager
 */
export class ScheduleManager {
  constructor() {
    this.schedules = new Map(); // userId -> schedules
    this.jobs = new Map(); // scheduleId -> job info
  }

  /**
   * Create a new schedule
   */
  createSchedule(userId, config) {
    if (!this.schedules.has(userId)) {
      this.schedules.set(userId, []);
    }

    const schedule = {
      id: `schedule_${Date.now()}`,
      userId,
      name: config.name || 'Homework Help',
      platform: config.platform, // sparxMaths, educake, etc
      daysOfWeek: config.daysOfWeek || ['Monday', 'Wednesday', 'Friday'], // Days to run
      time: config.time || '18:00', // Time to run (HH:MM format)
      autoJoinQueue: config.autoJoinQueue !== false, // Auto join queue at specified time
      timezone: config.timezone || 'GMT',
      isActive: true,
      createdAt: new Date(),
      lastRun: null,
      nextRun: null,
    };

    this.schedules.get(userId).push(schedule);
    this._calculateNextRun(schedule);

    logger.info({ scheduleId: schedule.id, userId, platform: config.platform }, 'Schedule created');

    return schedule;
  }

  /**
   * Calculate next run time
   */
  _calculateNextRun(schedule) {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    // Find next occurrence of this day/time
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      checkDate.setHours(hours, minutes, 0, 0);

      const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });

      if (schedule.daysOfWeek.includes(dayName) && checkDate > now) {
        schedule.nextRun = checkDate;
        return checkDate;
      }
    }
  }

  /**
   * Get user schedules
   */
  getUserSchedules(userId) {
    return this.schedules.get(userId) || [];
  }

  /**
   * Get active schedules
   */
  getActiveSchedules(userId) {
    return (this.schedules.get(userId) || []).filter(s => s.isActive);
  }

  /**
   * Update schedule
   */
  updateSchedule(userId, scheduleId, updates) {
    const schedules = this.schedules.get(userId) || [];
    const schedule = schedules.find(s => s.id === scheduleId);

    if (!schedule) return null;

    Object.assign(schedule, updates);
    if (updates.time || updates.daysOfWeek) {
      this._calculateNextRun(schedule);
    }

    logger.info({ scheduleId, userId }, 'Schedule updated');
    return schedule;
  }

  /**
   * Delete schedule
   */
  deleteSchedule(userId, scheduleId) {
    const schedules = this.schedules.get(userId) || [];
    const index = schedules.findIndex(s => s.id === scheduleId);

    if (index !== -1) {
      schedules.splice(index, 1);
      logger.info({ scheduleId, userId }, 'Schedule deleted');
      return true;
    }

    return false;
  }

  /**
   * Disable/Enable schedule
   */
  toggleSchedule(userId, scheduleId) {
    const schedules = this.schedules.get(userId) || [];
    const schedule = schedules.find(s => s.id === scheduleId);

    if (!schedule) return null;

    schedule.isActive = !schedule.isActive;
    logger.info({ scheduleId, isActive: schedule.isActive }, 'Schedule toggled');

    return schedule;
  }

  /**
   * Get schedules that should run now
   */
  getSchedulesToRun() {
    const schedulesToRun = [];
    const now = new Date();

    for (const userSchedules of this.schedules.values()) {
      for (const schedule of userSchedules) {
        if (schedule.isActive && schedule.nextRun && schedule.nextRun <= now) {
          schedulesToRun.push(schedule);
        }
      }
    }

    return schedulesToRun;
  }

  /**
   * Mark schedule as run
   */
  markAsRun(scheduleId) {
    for (const [, schedules] of this.schedules) {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
        schedule.lastRun = new Date();
        this._calculateNextRun(schedule);
        return schedule;
      }
    }
    return null;
  }

  /**
   * Format schedule info
   */
  formatScheduleInfo(schedule) {
    return `
📅 **${schedule.name}**
• Platform: ${schedule.platform}
• Days: ${schedule.daysOfWeek.join(', ')}
• Time: ${schedule.time} ${schedule.timezone}
• Next Run: ${schedule.nextRun ? schedule.nextRun.toLocaleString() : 'N/A'}
• Status: ${schedule.isActive ? '✅ Active' : '⛔ Inactive'}
    `.trim();
  }
}

export default ScheduleManager;
