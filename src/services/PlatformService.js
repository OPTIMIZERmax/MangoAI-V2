import logger from '../utils/logger.js';
import { AdapterRegistry } from '../../packages/mango-engine/index.js';
import SparxAdapter from '../../packages/adapters/sparx/src/SparxAdapter.js';

export class PlatformService {
  constructor(app = null) {
    this.app = app;

    this.registry =
      app?.engine ||
      new AdapterRegistry();

    this.platformDefinitions =
      this._buildPlatformDefinitions();

    /*
     * Register adapters during startup.
     *
     * Browser-backed adapters are initialized only when
     * a user starts work on that platform.
     */
    this.adapterInitialization =
      this._initializeAdapters();

    /*
     * Stores in-progress adapter initialization promises.
     *
     * This prevents multiple simultaneous requests from
     * trying to initialize the same adapter more than once.
     */
    this.adapterReady = new Map();
  }

  // ---------------------------------------------------------------------------
  // Platform definitions
  // ---------------------------------------------------------------------------

  _buildPlatformDefinitions() {
    return new Map([
      [
        'sparxMaths',
        {
          id: 'sparx',
          key: 'sparxMaths',
          name: 'Sparx Maths',
          emoji:
            '<:SparxMaths:1515672129188790302>',
          capabilities: [
            'login',
            'homework'
          ]
        }
      ],

      [
        'sparxReader',
        {
          id: 'sparxReader',
          key: 'sparxReader',
          name: 'Sparx Reader',
          emoji:
            '<:SparxReader:1515672202375204945>',
          capabilities: [
            'login',
            'homework'
          ]
        }
      ],

      [
        'sparxScience',
        {
          id: 'sparxScience',
          key: 'sparxScience',
          name: 'Sparx Science',
          emoji:
            '<:SparxScience:1515672274051797072>',
          capabilities: [
            'login',
            'homework'
          ]
        }
      ],

      [
        'languagenut',
        {
          id: 'languagenut',
          key: 'languagenut',
          name: 'LanguageNut',
          emoji:
            '<:LanguageNut:1515672374878670858>',
          capabilities: [
            'login',
            'homework'
          ]
        }
      ],

      [
        'bedrock',
        {
          id: 'bedrock',
          key: 'bedrock',
          name: 'Bedrock',
          emoji:
            '<:Bedrock:1529265581273124935>',
          capabilities: [
            'login',
            'homework'
          ]
        }
      ],

      [
        'seneca',
        {
          id: 'seneca',
          key: 'seneca',
          name: 'Seneca',
          emoji:
            '<:Seneca:1515672492512120963>',
          capabilities: [
            'login',
            'homework'
          ]
        }
      ]
    ]);
  }

  // ---------------------------------------------------------------------------
  // Adapter lifecycle
  // ---------------------------------------------------------------------------

  async _initializeAdapters() {
    if (
      !this.registry?.register
    ) {
      logger.warn(
        'PlatformService could not access AdapterRegistry.'
      );

      return;
    }

    if (
      this.registry.registeredAdapters?.has(
        'sparx'
      )
    ) {
      logger.info(
        {
          adapter:
            'sparx'
        },
        'Sparx adapter already registered'
      );

      return;
    }

    try {
      logger.info(
        {
          adapter:
            'sparx'
        },
        'Creating Sparx adapter'
      );

      const adapter =
        new SparxAdapter();

      this.registry.register(
        adapter
      );

      logger.info(
        {
          adapter:
            'sparx'
        },
        'Registered Sparx adapter'
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,

          stack:
            error?.stack
        },
        'Failed to initialize Sparx adapter'
      );

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Platform helpers
  // ---------------------------------------------------------------------------

  normalizePlatform(platform) {
    if (!platform) {
      return null;
    }

    /*
     * Accept either a normal string:
     *
     *   "sparxMaths"
     *
     * or a platform definition object:
     *
     *   {
     *     id: "sparx",
     *     key: "sparxMaths",
     *     name: "Sparx Maths"
     *   }
     *
     * This prevents accidental conversion to:
     *
     *   "[object Object]"
     */
    if (
      typeof platform ===
      'object'
    ) {
      platform =
        platform.key ??
        platform.id ??
        platform.name ??
        null;
    }

    if (
      typeof platform !==
      'string'
    ) {
      return null;
    }

    const value =
      platform
        .trim()
        .toLowerCase();

    if (!value) {
      return null;
    }

    const aliases = {
      sparx:
        'sparxMaths',

      sparxmaths:
        'sparxMaths',

      'sparx maths':
        'sparxMaths',

      sparxreader:
        'sparxReader',

      'sparx reader':
        'sparxReader',

      sparxscience:
        'sparxScience',

      'sparx science':
        'sparxScience',

      languagenut:
        'languagenut',

      'language nut':
        'languagenut',

      bedrock:
        'bedrock',

      seneca:
        'seneca'
    };

    return (
      aliases[value] ??
      platform.trim()
    );
  }

  resolveAdapterId(platform) {
    const normalized =
      this.normalizePlatform(
        platform
      );

    if (!normalized) {
      return null;
    }

    const definition =
      this.platformDefinitions.get(
        normalized
      );

    if (
      definition?.id
    ) {
      return definition.id;
    }

    const aliases = {
      sparx:
        'sparx',

      sparxmaths:
        'sparx',

      sparxreader:
        'sparxReader',

      sparxscience:
        'sparxScience',

      languagenut:
        'languagenut',

      bedrock:
        'bedrock',

      seneca:
        'seneca'
    };

    return (
      aliases[
        normalized.toLowerCase()
      ] ??
      normalized
    );
  }

  getPlatform(platform) {
    const normalized =
      this.normalizePlatform(
        platform
      );

    if (!normalized) {
      return null;
    }

    const definition =
      this.platformDefinitions.get(
        normalized
      ) || {
        id:
          this.resolveAdapterId(
            normalized
          ),

        key:
          normalized,

        name:
          this._formatPlatformName(
            normalized
          ),

        emoji:
          null,

        capabilities: []
      };

    return {
      id:
        definition.id,

      key:
        definition.key ||
        normalized,

      name:
        definition.name ||
        this._formatPlatformName(
          normalized
        ),

      emoji:
        definition.emoji ||
        null,

      capabilities:
        definition.capabilities ||
        []
    };
  }

  listPlatforms() {
    return Array.from(
      this.platformDefinitions.values()
    );
  }

  getCapabilities(platform) {
    const definition =
      this.getPlatform(
        platform
      );

    if (!definition) {
      return [];
    }

    if (
      definition.capabilities?.length
    ) {
      return definition.capabilities;
    }

    const adapter =
      this._getRegisteredAdapter(
        definition.id
      );

    return (
      adapter?.metadata
        ?.capabilities ||
      []
    );
  }

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  async login(
    platform,
    payload = {},
    context = {}
  ) {
    await this.adapterInitialization;

    const normalizedPlatform =
      this.normalizePlatform(
        platform
      );

    const adapterId =
      this.resolveAdapterId(
        normalizedPlatform
      );

    if (!adapterId) {
      throw new Error(
        'A platform is required.'
      );
    }

    /*
     * Diagnostic logging.
     *
     * This makes it immediately obvious if an object
     * accidentally reaches the platform service.
     */
    logger.info(
      {
        receivedPlatform:
          typeof platform ===
          'object'
            ? {
                id:
                  platform?.id,

                key:
                  platform?.key,

                name:
                  platform?.name
              }
            : platform,

        normalizedPlatform,

        adapterId
      },
      'Resolved platform for login'
    );

    const loginPayload = {
      adapter:
        payload?.adapter ||
        adapterId,

      action:
        payload?.action ||
        'login',

      platform:
        normalizedPlatform,

      method:
        payload?.method,

      username:
        payload?.username,

      password:
        payload?.password,

      school:
        payload?.school,

      ...payload,

      /*
       * Keep the canonical values authoritative even if
       * the incoming payload contains stale platform data.
       */
      platform:
        normalizedPlatform
    };

    const loginContext = {
      reportProgress:
        async (
          progress,
          message
        ) => {
          logger.info(
            {
              progress,
              message
            },
            'Login progress'
          );
        },

      ...context
    };

    try {
      await this._ensureAdapterReady(
        adapterId
      );

      logger.info(
        {
          adapterId,
          platform:
            normalizedPlatform
        },
        'Executing login'
      );

      return await this.registry.execute(
        adapterId,
        loginPayload,
        loginContext
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,

          stack:
            error?.stack,

          adapterId,

          platform:
            normalizedPlatform
        },
        'Login execution failed'
      );

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // General task execution
  // ---------------------------------------------------------------------------

  async execute(
    platform,
    task = {},
    context = {}
  ) {
    await this.adapterInitialization;

    const normalizedPlatform =
      this.normalizePlatform(
        platform
      );

    const adapterId =
      this.resolveAdapterId(
        normalizedPlatform
      );

    if (!adapterId) {
      throw new Error(
        'A platform is required.'
      );
    }

    try {
      await this._ensureAdapterReady(
        adapterId
      );

      logger.info(
        {
          adapterId,

          platform:
            normalizedPlatform
        },
        'Executing platform task'
      );

      return await this.registry.execute(
        adapterId,
        {
          ...task,

          platform:
            normalizedPlatform
        },
        context
      );
    } catch (error) {
      logger.error(
        {
          error:
            error?.message,

          stack:
            error?.stack,

          adapterId,

          platform:
            normalizedPlatform
        },
        'Platform task execution failed'
      );

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  _getRegisteredAdapter(
    adapterId
  ) {
    return (
      this.registry
        ?.registeredAdapters
        ?.get(adapterId)
        ?.instance ||
      null
    );
  }

  async _ensureAdapterReady(
    adapterId
  ) {
    const adapter =
      this._getRegisteredAdapter(
        adapterId
      );

    if (!adapter) {
      throw new Error(
        `No adapter is installed for '${adapterId}'.`
      );
    }

    if (
      adapter.state ===
      'READY'
    ) {
      return;
    }

    /*
     * Initialize only once.
     *
     * Multiple simultaneous login requests share the
     * same initialization promise.
     */
    if (
      !this.adapterReady.has(
        adapterId
      )
    ) {
      this.adapterReady.set(
        adapterId,
        adapter.initialize()
      );
    }

    try {
      await this.adapterReady.get(
        adapterId
      );
    } catch (error) {
      this.adapterReady.delete(
        adapterId
      );

      throw error;
    }
  }

  async shutdown() {
    await this.adapterInitialization;

    const adapterIds =
      Array.from(
        this.registry
          ?.registeredAdapters
          ?.keys?.() ||
          []
      );

    await Promise.allSettled(
      adapterIds.map(
        adapterId =>
          this.registry.shutdown(
            adapterId
          )
      )
    );

    this.adapterReady.clear();
  }

  _formatPlatformName(
    platform
  ) {
    return String(
      platform
    )
      .replace(
        /([a-z])([A-Z])/g,
        '$1 $2'
      )
      .replace(
        /^./,
        char =>
          char.toUpperCase()
      );
  }
}

export default PlatformService;