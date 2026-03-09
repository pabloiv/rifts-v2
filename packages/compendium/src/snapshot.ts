import type { CompendiumEntity } from '@rifts-v2/schema'
import {
  adaptV1Equipment,
  adaptV1OccLike,
  adaptV1Race,
  adaptV1Skill,
  adaptV1Vehicle,
  type V1EquipmentRaw,
  type V1OccRaw,
  type V1RaceRaw,
  type V1SkillRaw,
} from './adapters/v1.ts'
import { createCompendiumRegistry } from './registry.ts'

export interface V1CompendiumSnapshot {
  races?: V1RaceRaw[]
  occs?: V1OccRaw[]
  skills?: V1SkillRaw[]
  equipment?: V1EquipmentRaw[]
}

export function adaptV1Snapshot(snapshot: V1CompendiumSnapshot) {
  const entities: CompendiumEntity[] = [
    ...(snapshot.races ?? []).map(adaptV1Race),
    ...(snapshot.occs ?? []).map(adaptV1OccLike),
    ...(snapshot.skills ?? []).map(adaptV1Skill),
    ...(snapshot.equipment ?? []).map(item => item.category === 'vehicle' ? adaptV1Vehicle(item) : adaptV1Equipment(item)),
  ]
  return createCompendiumRegistry(entities)
}
