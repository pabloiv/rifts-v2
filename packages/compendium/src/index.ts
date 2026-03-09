import type { CompendiumEntity, EntityKind } from '@rifts-v2/schema'
import { createCompendiumRegistry } from './registry'

export {
  adaptV1OccLike,
  adaptV1Race,
  adaptV1Skill,
} from './adapters/v1'
export type {
  V1OccRaw,
  V1RaceRaw,
  V1SkillRaw,
} from './adapters/v1'
export { createCompendiumRegistry } from './registry'
export type { CompendiumRegistry } from './registry'

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
