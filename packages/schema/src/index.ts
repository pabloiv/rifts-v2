export type EntityKind =
  | 'race'
  | 'rcc'
  | 'occ'
  | 'skill'
  | 'spell'
  | 'power'
  | 'equipment'
  | 'vehicle'

export interface SourceRef {
  book: string
  page: number | null
}

export interface CompendiumEntityBase {
  id: string
  kind: EntityKind
  name: string
  source: SourceRef
  tags?: string[]
}

export interface CharacterBuild {
  id: string
  name: string
  raceId: string | null
  pathId: string | null
  level: number
}

export interface PlayState {
  actorId: string
  currentPools: Record<string, number>
}

export interface ResolvedCharacter {
  actorId: string
  status: 'scaffold'
  notes: string
}
