import logger from '../utils/logger.js';

/**
 * Premium Tier System
 */
export const TIERS = {
  FREE: {
    name: 'Free',
    price: '£0',
    questionsPerDay: 5,
    daysTrialAccess: 1,
    supportsPastPapers: false,
    supportsAutoSchedule: false,
    maxSchedules: 0,
  },
  TRIAL: {
    name: 'Trial',
    price: '£0 (Limited)',
    questionsPerDay: 85,
    daysTrialAccess: 1, // Changed from days (configurable)
    supportsPastPapers: true,
    supportsAutoSchedule: true,
    maxSchedules: 1,
  },
  PREMIUM: {
    name: 'Premium',
    price: '£10 Lifetime',
    questionsPerDay: 1000,
    supportsPastPapers: true,
    supportsAutoSchedule: true,
    maxSchedules: 10,
    multiPlatformSupport: true,
    customTiming: true,
  },
};

export class PremiumManager {
  constructor() {
    this.users = new Map(); // userId -> tierData
    this.usage = new Map(); // userId -> { date, questionsUsed }
  }

  /**
   * Create user account
   */
  createUser(userId, tier = 'FREE') {
    const tierData = {
      userId,
      tier,
      startedAt: new Date(),
      expiresAt: tier === 'TRIAL' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // 24 hours for trial
      isPremium: tier === 'PREMIUM',
    };

    this.users.set(userId, tierData);
    logger.info({ userId, tier }, 'User created with tier');

    return tierData;
  }

  /**
   * Upgrade to premium
   */
  upgradeToPremium(userId) {
    const user = this.users.get(userId);
    if (!user) {
      return this.createUser(userId, 'PREMIUM');
    }

    user.tier = 'PREMIUM';
    user.isPremium = true;
    user.upgradedAt = new Date();
    user.expiresAt = null; // Lifetime

    logger.info({ userId }, 'User upgraded to premium');
    return user;
  }

  /**
   * Start free trial
   */
  startFreeTrial(userId) {
    const user = this.users.get(userId);
    if (!user) {
      return this.createUser(userId, 'TRIAL');
    }

    if (user.tier === 'TRIAL' || user.tier === 'PREMIUM') {
      return { error: 'User already has or had trial access' };
    }

    user.tier = 'TRIAL';
    user.trialStartedAt = new Date();
    user.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    logger.info({ userId }, 'Free trial started');
    return user;
  }

  /**
   * Check if trial expired
   */
  isTrialExpired(userId) {
    const user = this.users.get(userId);
    if (!user || user.tier !== 'TRIAL' || !user.expiresAt) {
      return false;
    }
    return new Date() > user.expiresAt;
  }

  /**
   * Check daily question limit
   */
  checkDailyLimit(userId) {
    const user = this.users.get(userId);
    if (!user) return false;

    const tier = TIERS[user.tier];
    const today = new Date().toDateString();

    const usage = this.usage.get(userId) || { date: today, questionsUsed: 0 };

    if (usage.date !== today) {
      usage.date = today;
      usage.questionsUsed = 0;
    }

    const canUse = usage.questionsUsed < tier.questionsPerDay;

    if (canUse) {
      usage.questionsUsed++;
      this.usage.set(userId, usage);
    }

    return { canUse, remaining: tier.questionsPerDay - usage.questionsUsed };
  }

  /**
   * Get user tier info
   */
  getUserTier(userId) {
    const user = this.users.get(userId);
    if (!user) {
      this.createUser(userId, 'FREE');
      return this.getUserTier(userId);
    }

    const tier = TIERS[user.tier];
    const usage = this.usage.get(userId) || { date: new Date().toDateString(), questionsUsed: 0 };

    return {
      ...user,
      tierInfo: tier,
      dailyUsage: usage.questionsUsed,
      dailyRemaining: tier.questionsPerDay - usage.questionsUsed,
      isExpired: this.isTrialExpired(userId),
    };
  }

  /**
   * Get all tier info
   */
  getAllTiers() {
    return TIERS;
  }
}

export default PremiumManager;
