import logger from '../utils/logger.js';
import { AdapterRegistry } from '../../packages/mango-engine/index.js';
import SparxAdapter from '../../packages/adapters/sparx/src/SparxAdapter.js';

export class PlatformService {
  constructor(app = null) {
    this.app = app;
    this.registry = app?.engine || new AdapterRegistry();
    this.platformDefinitions = this._buildPlatformDefinitions();
    this._ensureAdapterRegistration();
  }

  _buildPlatformDefinitions() {
    return new Map([
      ['sparxMaths', {
        id: 'sparx',
        key: 'sparxMaths',
        name: 'Sparx Maths',
        emoji: '<:SparxMaths:1515672129188790302>',
        capabilities: ['login', 'homework']
      }],
      ['sparxReader', {
        id: 'sparxReader',
        key: 'sparxReader',
        name: 'Sparx Reader',
        emoji: '<:SparxReader:1515672202375204945>',
        capabilities: ['login', 'homework']
      }],
      ['sparxScience', {
        id: 'sparxScience',
        key: 'sparxScience',
        name: 'Sparx Science',
        emoji: '<:SparxScience:1515672274051797072>',
        capabilities: ['login', 'homework']
      }],
      ['languagenut', {
        id: 'languagenut',
        key: 'languagenut',
        name: 'LanguageNut',
        emoji: '<:LanguageNut:1515672374878670858>',
        capabilities: ['login', 'homework']
      }],
      ['bedrock', {
        id: 'bedrock',
        key: 'bedrock',
        name: 'Bedrock',
        emoji: '<:Bedrock:1529265581273124935>',
        capabilities: ['login', 'homework']
      }],
      ['seneca', {
        id: 'seneca',
        key: 'seneca',
        name: 'Seneca',
        emoji: '<:Seneca:1515672492512120963>',
        capabilities: ['login', 'homework']
      }]
    ]);
  }

  _ensureAdapterRegistration() {
    if (!this.registry || typeof this.registry.register !== 'function') {
      logger.warn('PlatformService could not access AdapterRegistry; platform resolution will be limited.');
      return;
    }

    try {
      const existingIds = this.registry.registeredAdapters
        ? Array.from(this.registry.registeredAdapters.keys())
        : [];

      if (!existingIds.includes('sparx')) {
        const adapter = new SparxAdapter();
        this.registry.register(adapter);
        logger.info({ adapter: 'sparx' }, 'Registered Sparx adapter with AdapterRegistry');
      }
    } catch (error) {
      logger.warn({ error: error.message }, 'Unable to register default Sparx adapter with AdapterRegistry');
    }
  }

  normalizePlatform(platform) {
    if (!platform) return null;

    const value = String(platform).trim().toLowerCase();
    if (!value) return null;

    if (value === 'sparxmaths') return 'sparxMaths';
    if (value === 'sparxreader') return 'sparxReader';
    if (value === 'sparxscience') return 'sparxScience';
    return value;
  }

  resolveAdapterId(platform) {
    const normalized = this.normalizePlatform(platform);
    if (!normalized) return null;

    const definition = this.platformDefinitions.get(normalized);
    if (definition?.id) return definition.id;

    if (normalized === 'sparx') return 'sparx';
    if (normalized === 'sparxmaths') return 'sparx';
    if (normalized === 'sparxreader') return 'sparxReader';
    if (normalized === 'sparxscience') return 'sparxScience';
    return normalized;
  }

  getPlatform(platform) {
    const normalized = this.normalizePlatform(platform);
    if (!normalized) return null;

    const definition = this.platformDefinitions.get(normalized) || {
      id: this.resolveAdapterId(normalized),
      key: normalized,
      name: this._formatPlatformName(normalized),
      emoji: null,
      capabilities: []
    };

    return {
      id: definition.id,
      key: definition.key || normalized,
      name: definition.name || this._formatPlatformName(normalized),
      emoji: definition.emoji || null,
      capabilities: definition.capabilities || []
    };
  }

  listPlatforms() {
    return Array.from(this.platformDefinitions.values()).map((definition) => ({
      id: definition.id,
      key: definition.key,
      name: definition.name,
      emoji: definition.emoji,
      capabilities: definition.capabilities
    }));
  }

  getCapabilities(platform) {
    const definition = this.getPlatform(platform);
    if (!definition) return [];

    if (definition.capabilities?.length) {
      return definition.capabilities;
    }

    const adapter = this._getRegisteredAdapter(definition.id);
    return adapter?.metadata?.capabilities || [];
  }

  async login(platform, payload = {}, context = {}) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const loginPayload = {
      adapter: payload.adapter || 'sparx',
      action: payload.action || 'login',
      platform: normalizedPlatform || payload.platform,
      method: payload.method,
      username: payload.username,
      password: payload.password,
      school: payload.school,
      ...payload
    };

    const adapterId = this.resolveAdapterId(normalizedPlatform || payload.platform);

    if (this.registry && typeof this.registry.execute === 'function') {
      try {
        logger.info({ adapterId, platform: normalizedPlatform }, 'Executing login through AdapterRegistry');
        return await this.registry.execute(adapterId, loginPayload, context);
      } catch (error) {
        logger.warn({ error: error.message, adapterId, platform: normalizedPlatform }, 'AdapterRegistry login execution failed');
      }
    }

    logger.warn({ adapterId, platform: normalizedPlatform }, 'PlatformService falling back to legacy login handling');
    return null;
  }

  async execute(platform, task = {}, context = {}) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const adapterId = this.resolveAdapterId(normalizedPlatform);

    if (this.registry && typeof this.registry.execute === 'function') {
      try {
        logger.info({ adapterId, platform: normalizedPlatform }, 'Executing task through AdapterRegistry');
        return await this.registry.execute(adapterId, task, context);
      } catch (error) {
        logger.warn({ error: error.message, adapterId, platform: normalizedPlatform }, 'AdapterRegistry task execution failed');
      }
    }

    logger.warn({ adapterId, platform: normalizedPlatform }, 'PlatformService could not execute task through AdapterRegistry');
    return null;
  }

  _getRegisteredAdapter(adapterId) {
    if (!this.registry?.registeredAdapters) return null;
    return this.registry.registeredAdapters.get(adapterId)?.instance || null;
  }

  _formatPlatformName(platform) {
    return String(platform)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (char) => char.toUpperCase());
  }
}

export default PlatformService;
