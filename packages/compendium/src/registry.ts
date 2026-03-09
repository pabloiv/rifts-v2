import type { CompendiumEntity, EntityKind, Identifier } from '@rifts-v2/schema'

export interface CompendiumRegistry {
  all: CompendiumEntity[]
  byId: Map<Identifier, CompendiumEntity>
  byName: Map<string, CompendiumEntity>
  byKind: Map<EntityKind, CompendiumEntity[]>
}

export function createCompendiumRegistry(entities: CompendiumEntity[]): CompendiumRegistry {
  const byId = new Map<Identifier, CompendiumEntity>()
  const byName = new Map<string, CompendiumEntity>()
  const byKind = new Map<EntityKind, CompendiumEntity[]>()

  for (const entity of entities) {
    byId.set(entity.id, entity)
    byName.set(entity.name, entity)
    const existing = byKind.get(entity.kind) ?? []
    existing.push(entity)
    byKind.set(entity.kind, existing)
  }

  return {
    all: entities,
    byId,
    byName,
    byKind,
  }
}
