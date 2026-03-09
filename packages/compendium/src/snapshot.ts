import type { CompendiumEntity } from '@rifts-v2/schema'
import {
  adaptV1Equipment,
  adaptV1OccLike,
  adaptV1OccLikeExtraEntities,
  adaptV1Power,
  adaptV1Race,
  adaptV1RaceExtraEntities,
  adaptV1Skill,
  adaptV1Spell,
  adaptV1Vehicle,
  type V1EquipmentRaw,
  type V1OccRaw,
  type V1PowerRaw,
  type V1RaceRaw,
  type V1SkillRaw,
  type V1SpellRaw,
} from './adapters/v1.ts'
import { createCompendiumRegistry } from './registry.ts'

export interface V1CompendiumSnapshot {
  races?: V1RaceRaw[]
  occs?: V1OccRaw[]
  skills?: V1SkillRaw[]
  equipment?: V1EquipmentRaw[]
  powers?: V1PowerRaw[]
  spells?: V1SpellRaw[]
}

export function adaptV1Snapshot(snapshot: V1CompendiumSnapshot) {
  const entities: CompendiumEntity[] = [
    ...(snapshot.races ?? []).flatMap(raw => [adaptV1Race(raw), ...adaptV1RaceExtraEntities(raw)]),
    ...(snapshot.occs ?? []).flatMap(raw => [adaptV1OccLike(raw), ...adaptV1OccLikeExtraEntities(raw)]),
    ...(snapshot.skills ?? []).map(adaptV1Skill),
    ...(snapshot.powers ?? []).map(adaptV1Power),
    ...(snapshot.spells ?? []).map(adaptV1Spell),
    ...(snapshot.equipment ?? []).map(item => item.category === 'vehicle' ? adaptV1Vehicle(item) : adaptV1Equipment(item)),
  ]
  return createCompendiumRegistry(entities)
}
