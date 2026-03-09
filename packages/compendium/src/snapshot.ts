import type { CompendiumEntity } from '@rifts-v2/schema'
import { adaptV1OccLike, adaptV1Race, adaptV1Skill, type V1OccRaw, type V1RaceRaw, type V1SkillRaw } from './adapters/v1.ts'
import { createCompendiumRegistry } from './registry.ts'

export interface V1CompendiumSnapshot {
  races?: V1RaceRaw[]
  occs?: V1OccRaw[]
  skills?: V1SkillRaw[]
}

export function adaptV1Snapshot(snapshot: V1CompendiumSnapshot) {
  const entities: CompendiumEntity[] = [
    ...(snapshot.races ?? []).map(adaptV1Race),
    ...(snapshot.occs ?? []).map(adaptV1OccLike),
    ...(snapshot.skills ?? []).map(adaptV1Skill),
  ]
  return createCompendiumRegistry(entities)
}
