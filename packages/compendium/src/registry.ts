import type { CompendiumEntity, EntityKind, Identifier } from '@rifts-v2/schema'

export interface CompendiumRegistry {
  all: CompendiumEntity[]
  byId: Map<Identifier, CompendiumEntity>
  byKind: Map<EntityKind, CompendiumEntity[]>
}

export function createCompendiumRegistry(entities: CompendiumEntity[]): CompendiumRegistry {
  const byId = new Map<Identifier, CompendiumEntity>()
  const byKind = new Map<EntityKind, CompendiumEntity[]>()

  for (const entity of entities) {
    byId.set(entity.id, entity)
    const existing = byKind.get(entity.kind) ?? []
    existing.push(entity)
    byKind.set(entity.kind, existing)
  }

  return {
    all: entities,
    byId,
    byKind,
  }
}
