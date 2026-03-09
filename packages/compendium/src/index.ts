import type { EntityKind } from '@rifts-v2/schema'

const ENTITY_LABELS: EntityKind[] = [
  'race',
  'rcc',
  'occ',
  'skill',
  'spell',
  'power',
  'equipment',
  'vehicle',
]

export function getCompendiumSummary() {
  return {
    entityTypes: ENTITY_LABELS.length,
    labels: ENTITY_LABELS,
  }
}
