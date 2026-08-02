# MangoAI V2 migration plan

## 1. Architecture diagram

```text
src/
├── bot/
│   ├── discordBot.js            # thin lifecycle + event router only
│   ├── handlers/               # future interaction handlers
│   └── services/               # bot-facing orchestration helpers
├── services/
│   ├── LoginService.js         # login orchestration
│   ├── QueueService.js         # queue interactions
│   ├── ScheduleService.js      # schedule orchestration
│   └── TicketService.js        # ticket workflow
├── utils/                      # shared helpers
└── platforms/                  # legacy; keep only as compatibility shim during migration

packages/
├── mango-engine/               # source of truth for engine contracts/registry
│   └── core/
│       ├── adapters/
│       ├── contracts/
│       ├── errors/
│       └── registry/
└── adapters/
    ├── sparx/
    ├── sparxReader/
    ├── sparxScience/
    ├── seneca/
    ├── languagenut/
    └── bedrock/
```

## 2. Migration steps

### Phase 1 — Stabilize the target architecture
1. Treat packages/mango-engine as the canonical engine package.
2. Keep engine/core as the single source of truth and avoid introducing new engine copies under engine/.
3. Add a small compatibility layer in src/platforms only if existing imports still need to resolve during the transition.

### Phase 2 — Isolate bot responsibilities
1. Extract Discord-specific login flows from src/bot/discordBot.js into src/services/LoginService.js.
2. Extract queue interactions into src/services/QueueService.js.
3. Extract schedule triggering and management into src/services/ScheduleService.js.
4. Extract ticket creation/viewing logic into src/services/TicketService.js.
5. Refactor src/bot/discordBot.js so it only creates the Discord client, registers events, forwards interactions, and manages lifecycle.

### Phase 3 — Introduce adapter-based platform handling
1. Add a PlatformService that:
   - discovers registered adapters,
   - validates platform names,
   - executes login flows,
   - executes homework tasks,
   - exposes adapter capabilities.
2. Replace hardcoded platform maps such as the current platformMap in discordBot.js with AdapterRegistry lookup logic.
3. Move platform naming to adapter identifiers such as sparxMaths, sparxReader, sparxScience, seneca, languagenut, bedrock.

### Phase 4 — Preserve compatibility
1. Keep the Discord UI surface intact: buttons, modals, select menus, Components V2 containers, and MangoAI branding should remain unchanged.
2. Preserve the existing queue system and Sparx login bridge behavior while moving their orchestration behind services.
3. Keep the legacy src/platforms modules temporarily as shims if needed for runtime compatibility.

### Phase 5 — Reduce duplication
1. Consolidate imports to use packages/mango-engine/core and packages/adapters/*.
2. Remove duplicate engine usage paths once the new architecture is stable.
3. Update imports in src/index.js and bot modules to point to the new services and adapter registry flow.

## 3. Files that will change

### Bot and services
- src/bot/discordBot.js
- src/bot/commandHandler.js
- src/bot/sparxLoginBridge.js
- src/services/LoginService.js (new)
- src/services/QueueService.js (new)
- src/services/ScheduleService.js (new)
- src/services/TicketService.js (new)

### Application wiring
- src/index.js
- src/utils/config.js (if needed for service wiring)

### Platform and adapter migration
- src/platforms/plugin.js
- src/platforms/* (compatibility shims only, incremental)
- packages/adapters/sparx/src/* (adapter integration points)
- packages/adapters/* (new adapters as needed)

### Engine consolidation
- engine/core/* (deprecate or stop using)
- packages/mango-engine/core/* (canonical implementation)

## 4. Risks

1. Discord interaction compatibility risk
   - Buttons, modals, select menus, and Components V2 containers must continue to work exactly as before.

2. Runtime coupling to legacy platform modules
   - Some existing flows may still import src/platforms directly, so the migration should be incremental.

3. Adapter contract mismatch
   - The current adapter registry expects adapter instances that expose metadata and executeTask; older platform classes may not fit that contract without adaptation.

4. Hidden imports and side effects
   - The current bot file has embedded behavior that could be referenced indirectly by other modules.

5. Duplicate engine code confusion
   - Moving to a single engine source path must happen carefully to avoid breaking imports that still target engine/core.

## 5. Recommended implementation order

1. Create services and move business logic out of discordBot.js.
2. Introduce PlatformService and wire it to AdapterRegistry.
3. Update src/index.js to create the service layer and pass it into the bot.
4. Keep the Discord UI layer intact while swapping internal handlers to the new services.
5. Remove or deprecate legacy platform direct usage once adapter-based flows are stable.

## 6. Approval checkpoint

This plan keeps the current UX and runtime behavior intact while moving the codebase toward the adapter-driven architecture. It does not rewrite the whole system in one step.

After review, I can begin implementing the first phase: service extraction and the initial PlatformService wiring.
