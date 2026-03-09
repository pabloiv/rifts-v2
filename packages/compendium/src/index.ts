import type { CompendiumEntity, EntityKind } from '@rifts-v2/schema'
import { createCompendiumRegistry } from './registry.ts'

export {
  adaptV1Equipment,
  adaptV1OccLike,
  adaptV1Race,
  adaptV1Skill,
  adaptV1Vehicle,
} from './adapters/v1.ts'
export type {
  V1EquipmentRaw,
  V1OccRaw,
  V1RaceRaw,
  V1SkillRaw,
} from './adapters/v1.ts'
export { createCompendiumRegistry } from './registry.ts'
export type { CompendiumRegistry } from './registry.ts'
export { adaptV1Snapshot } from './snapshot.ts'
export type { V1CompendiumSnapshot } from './snapshot.ts'

const ENTITY_LABELS: EntityKind[] = [
  'race',
  'rcc',
  'occ',
  'skill',
  'spell',
  'power',
  'attack',
  'equipment',
  'vehicle',
]

export function getCompendiumSummary() {
  return {
    entityTypes: ENTITY_LABELS.length,
    labels: ENTITY_LABELS,
  }
}

export function createEmptyCompendium() {
  return createCompendiumRegistry([] satisfies CompendiumEntity[])
}
