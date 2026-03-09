# Rifts V2

Rifts V2 is the next-generation architecture for the character, compendium, rules, and play-state systems currently explored in `rifts-app`.

This repository starts as a clean, migration-friendly workspace with four initial goals:

- preserve and normalize current compendium work from v1
- build a new typed resolver around explicit domain objects
- separate build state from play state
- leave room for future systems like GM tools, time, targeting, shared vehicles, and super powers

## Workspace layout

- `apps/web`
  - the new web client
- `packages/schema`
  - shared type definitions and core document/entity contracts
- `packages/compendium`
  - normalized content registry and adapters
- `packages/rules-engine`
  - pure resolution pipeline over compendium + character build
- `docs`
  - architecture, schema, and migration documents

## Initial priorities

1. Lock the schema and migration direction.
2. Build adapters from the current app's content.
3. Stand up the new resolver with parity fixtures.
4. Cut the builder and sheet over in slices.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
```
