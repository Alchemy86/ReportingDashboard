import { SheriffConfig } from '@softarc/sheriff-core';

/**
 * Sheriff enforces module boundaries across the standalone architecture.
 *
 * Tagging (by folder under src/app):
 *   core/                 -> 'core'             shared infrastructure (services, guards, interceptors)
 *   shared/               -> 'shared'           dumb/reusable UI + utilities (no business logic)
 *   features/<feature>/   -> 'feature:<feature>'  isolated business domains
 *   everything else       -> virtual 'root'     app shell (app.ts, app.config.ts, app.routes.ts, main.ts)
 *
 * Dependency rules (what each tag may import — external/node_modules deps are always allowed):
 *   root        -> core, shared, any feature        (the shell lazy-loads features)
 *   feature:*   -> itself, core, shared             (features cannot import each other)
 *   core        -> core, shared
 *   shared      -> shared only                      (never reaches up into core/features)
 *
 * Barrel-less: modules need no `index.ts`; files inside an `internal/` folder are
 * encapsulated (not importable from outside their module).
 */
export const config: SheriffConfig = {
  version: 1,
  enableBarrelLess: true,
  modules: {
    'src/app': {
      core: 'core',
      shared: 'shared',
      'features/<feature>': 'feature:<feature>',
    },
  },
  depRules: {
    // 'root' is the virtual module holding files outside any tagged module.
    root: ['core', 'shared', 'feature:*'],
    noTag: ['core', 'shared', 'feature:*'],

    'feature:*': ({ from, to }) => from === to || ['core', 'shared'].includes(to),
    core: ['core', 'shared'],
    shared: 'shared',
  },
};
