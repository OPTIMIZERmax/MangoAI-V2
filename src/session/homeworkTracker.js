import logger from '../utils/logger.js';

/**
 * Homework Task Tracker
 */
export class HomeworkTracker {
  constructor() {
    this.tasks = new Map(); // userId -> tasks
    this.subjects = ['Biology', 'Physics', 'Chemistry', 'Mathematics', 'English', 'History', 'Geography'];
  }

  /**
   * Create a new homework task
   */
  createTask(userId, subject, taskName, questionCount = 85) {
    if (!this.tasks.has(userId)) {
      this.tasks.set(userId, []);
    }

    const task = {
      id: `task_${Date.now()}`,
      userId,
      subject,
      name: taskName,
      totalQuestions: questionCount,
      completedQuestions: 0,
      progress: 0,
      startedAt: new Date(),
      completedAt: null,
      status: 'active', // active, completed, failed
      averageTimePerQuestion: 0,
      totalTimeSpent: 0,
    };

    this.tasks.get(userId).push(task);
    logger.info({ taskId: task.id, userId, subject }, 'Homework task created');

    return task;
  }

  /**
   * Update task progress
   */
  updateProgress(userId, taskId, completedCount, timeSpent) {
    const userTasks = this.tasks.get(userId);
    if (!userTasks) return null;

    const task = userTasks.find(t => t.id === taskId);
    if (!task) return null;

    task.completedQuestions = completedCount;
    task.progress = Math.round((completedCount / task.totalQuestions) * 100);
    task.totalTimeSpent = timeSpent;
    task.averageTimePerQuestion = Math.round(timeSpent / Math.max(completedCount, 1));

    if (task.progress === 100) {
      task.status = 'completed';
      task.completedAt = new Date();
    }

    return task;
  }

  /**
   * Get user's tasks
   */
  getUserTasks(userId) {
    return this.tasks.get(userId) || [];
  }

  /**
   * Get user's active tasks
   */
  getActiveTasks(userId) {
    return (this.tasks.get(userId) || []).filter(t => t.status === 'active');
  }

  /**
   * Get task by ID
   */
  getTask(userId, taskId) {
    const userTasks = this.tasks.get(userId);
    return userTasks ? userTasks.find(t => t.id === taskId) : null;
  }

  /**
   * Get progress summary
   */
  getProgressSummary(userId) {
    const userTasks = this.tasks.get(userId) || [];

    const summary = {
      totalTasks: userTasks.length,
      completedTasks: userTasks.filter(t => t.status === 'completed').length,
      activeTasks: userTasks.filter(t => t.status === 'active').length,
      totalQuestionsCompleted: userTasks.reduce((sum, t) => sum + t.completedQuestions, 0),
      totalTimeSpent: userTasks.reduce((sum, t) => sum + t.totalTimeSpent, 0),
      averageProgress: Math.round(
        userTasks.reduce((sum, t) => sum + t.progress, 0) / Math.max(userTasks.length, 1)
      ),
      tasksBySubject: {},
    };

    // Group by subject
    for (const task of userTasks) {
      if (!summary.tasksBySubject[task.subject]) {
        summary.tasksBySubject[task.subject] = [];
      }
      summary.tasksBySubject[task.subject].push(task);
    }

    return summary;
  }

  /**
   * Format time nicely
   */
  formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }
}

export default HomeworkTracker;
