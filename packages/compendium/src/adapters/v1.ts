import type {
  ChoiceSlot,
  CompendiumOcc,
  CompendiumRace,
  CompendiumRcc,
  CompendiumSkill,
  Grant,
  Modifier,
  RequirementSet,
  ResourcePoolDefinition,
  SkillRepeatability,
} from '@rifts-v2/schema'

type V1Source = {
  book?: string
  page?: number | null
}

type V1SaveBonus = {
  vs?: string
  bonus?: number
}

type V1SelectionGrant = {
  id?: string
  type?: string
  name?: string
  count?: number
  selectionMode?: string
  options?: string[]
  optionCategory?: string
  notes?: string | string[]
  bonus?: number
  basePercent?: number
  fixedTotal?: boolean
  valuePrefix?: string
}

type V1GrantedSkill = {
  name?: string
  basePercent?: number
  bonus?: number
  fixedTotal?: boolean
} | V1SelectionGrant

export interface V1RaceRaw {
  id: string
  name: string
  kind?: string
  desc?: string
  tags?: string[]
  source?: V1Source
  pools?: {
    sdc?: { formula?: string; note?: string }
    mdc?: { formula?: string; note?: string }
    isp?: { formula?: string; note?: string }
    ppe?: { formula?: string; note?: string }
  }
  skills?: {
    granted?: V1GrantedSkill[]
  }
  modifiers?: {
    saves?: V1SaveBonus[]
    combat?: Record<string, number>
  }
  occCompatibility?: {
    mode?: string
    rccOccId?: string
  }
  abilities?: string[]
}

export interface V1OccRaw {
  id: string
  name: string
  kind?: string
  desc?: string
  tags?: string[]
  source?: V1Source
  requirements?: {
    attributes?: Record<string, number>
    notes?: string
  }
  resources?: {
    hp?: { perLevel?: string | null }
    sdc?: { base?: string | null }
    ppe?: { base?: string | null }
    isp?: { base?: string | null }
  }
  bonuses?: {
    saves?: V1SaveBonus[]
    combat?: Record<string, number>
    perception?: number
  }
  skills?: {
    granted?: V1GrantedSkill[]
  }
  notes?: string[]
}

export interface V1SkillRaw {
  id: string
  name: string
  category?: string
  base?: number | null
  perLevel?: number | null
  requires?: string[]
  notes?: string
  metadata?: {
    repeatable?: string
    specializationLabel?: string
    specializationOptions?: string[]
  }
}

function mapSource(source?: V1Source) {
  return {
    book: source?.book ?? 'Unknown',
    page: source?.page ?? null,
  }
}

function asNotes(value?: string | string[] | null): string[] | undefined {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value]
  return undefined
}

function setIfPresent<T extends object, K extends keyof T>(target: T, key: K, value: T[K] | undefined) {
  if (value !== undefined) target[key] = value
}

function mapSaveTarget(vs?: string): string | null {
  if (!vs) return null
  const normalized = String(vs).toLowerCase()
  if (normalized === 'magic') return 'saves.magic'
  if (normalized === 'psionics') return 'saves.psionics'
  if (normalized === 'poison') return 'saves.poison'
  if (normalized === 'disease') return 'saves.disease'
  if (normalized === 'insanity') return 'saves.insanity'
  if (normalized === 'horror factor') return 'saves.hf'
  return `saves.${normalized.replace(/\s+/g, '_')}`
}

function mapV1SavesToModifiers(prefix: string, saves?: V1SaveBonus[]): Modifier[] {
  if (!Array.isArray(saves)) return []
  return saves.flatMap((entry, index) => {
    const target = mapSaveTarget(entry?.vs)
    const value = Number(entry?.bonus)
    if (!target || !Number.isFinite(value) || value === 0) return []
    return [{
      id: `${prefix}-save-${index}`,
      target,
      operation: 'add',
      value,
      sourceLabel: prefix,
    } satisfies Modifier]
  })
}

function mapV1CombatToModifiers(prefix: string, combat?: Record<string, number>): Modifier[] {
  if (!combat || typeof combat !== 'object') return []
  return Object.entries(combat).flatMap(([key, value]) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric === 0) return []
    return [{
      id: `${prefix}-combat-${key}`,
      target: `combat.${key}`,
      operation: 'add',
      value: numeric,
      sourceLabel: prefix,
    } satisfies Modifier]
  })
}

function mapV1ResourcePools(
  prefix: string,
  pools?: V1RaceRaw['pools'] | V1OccRaw['resources'],
): ResourcePoolDefinition[] {
  if (!pools || typeof pools !== 'object') return []
  const mapped: ResourcePoolDefinition[] = []

  const append = (
    id: string,
    poolType: ResourcePoolDefinition['poolType'],
    label: string,
    formula?: string | null,
    note?: string | null,
  ) => {
    if (!formula && !note) return
    const pool: ResourcePoolDefinition = {
      id: `${prefix}-${id}`,
      poolType,
      label,
      ownerScope: 'actor',
      trackingMode: 'tracked',
    }
    if (formula) pool.formula = formula
    if (note) pool.notes = [note]
    mapped.push(pool)
  }

  const readPoolValues = (value: unknown) => {
    if (!value || typeof value !== 'object') return { formula: null, note: null }
    const candidate = value as { formula?: string; base?: string | null; note?: string }
    return {
      formula: candidate.formula ?? candidate.base ?? null,
      note: candidate.note ?? null,
    }
  }

  if ('sdc' in pools) {
    const values = readPoolValues(pools.sdc)
    append('sdc', 'sdc', 'S.D.C.', values.formula, values.note)
  }
  if ('mdc' in pools) {
    const values = readPoolValues(pools.mdc)
    append('mdc-body', 'mdc_body', 'Body M.D.C.', values.formula, values.note)
  }
  if ('ppe' in pools) {
    const values = readPoolValues(pools.ppe)
    append('ppe', 'ppe', 'P.P.E.', values.formula, values.note)
  }
  if ('isp' in pools) {
    const values = readPoolValues(pools.isp)
    append('isp', 'isp', 'I.S.P.', values.formula, values.note)
  }

  return mapped
}

function makeChoiceSlot(grant: V1SelectionGrant): ChoiceSlot {
  const slot: ChoiceSlot = {
    id: grant.id ?? `slot-${Math.random().toString(36).slice(2, 8)}`,
    choiceFamily: 'skill',
    label: grant.name ?? 'Choice',
    count: grant.count ?? 1,
    allowedEntityKinds: ['skill'],
  }
  if (Array.isArray(grant.options) && grant.options.length > 0) slot.allowedIds = grant.options
  if (grant.optionCategory) {
    slot.filters = [{ key: 'category', values: [grant.optionCategory], mode: 'include' }]
  }
  return slot
}

function mapV1GrantedSkills(prefix: string, granted?: V1GrantedSkill[]): Grant[] {
  if (!Array.isArray(granted)) return []
  const mapped: Grant[] = []
  granted.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    if ('type' in entry && entry.type === 'selection') {
      const notes = asNotes(entry.notes)
      const grant = {
        id: entry.id ?? `${prefix}-skill-choice-${index}`,
        kind: 'grant_skill_choice',
        slot: makeChoiceSlot(entry),
        basePercent: typeof entry.basePercent === 'number' ? entry.basePercent : null,
        fixedTotal: Boolean(entry.fixedTotal),
        ...(notes ? { notes } : {}),
      } satisfies Grant
      mapped.push(grant)
      return
    }
    if (!('name' in entry) || !entry.name) return
    const notes = typeof entry.bonus === 'number' ? [`V1 bonus: +${entry.bonus}%`] : undefined
    const grant = {
      id: `${prefix}-skill-${index}`,
      kind: 'grant_skill',
      skillId: entry.name,
      basePercent: typeof entry.basePercent === 'number' ? entry.basePercent : null,
      fixedTotal: Boolean(entry.fixedTotal),
      ...(notes ? { notes } : {}),
    } satisfies Grant
    mapped.push(grant)
  })
  return mapped
}

function mapV1Requirements(raw?: V1OccRaw['requirements']): RequirementSet | undefined {
  if (!raw) return undefined
  const next: RequirementSet = {}
  if (raw.attributes && Object.keys(raw.attributes).length > 0) {
    next.attributes = raw.attributes as NonNullable<RequirementSet['attributes']>
  }
  if (raw.notes) next.notes = [raw.notes]
  return Object.keys(next).length > 0 ? next : undefined
}

function mapV1Repeatability(raw?: string): SkillRepeatability {
  if (raw === 'free_text') return 'free_text'
  if (raw === 'option_set') return 'option_set'
  if (raw === 'by_related_skill') return 'by_related_skill'
  return 'single'
}

export function adaptV1Race(raw: V1RaceRaw): CompendiumRace {
  const race: CompendiumRace = {
    id: raw.id,
    kind: 'race',
    name: raw.name,
    source: mapSource(raw.source),
    grants: mapV1GrantedSkills(raw.id, raw.skills?.granted),
    modifiers: [
      ...mapV1SavesToModifiers(raw.id, raw.modifiers?.saves),
      ...mapV1CombatToModifiers(raw.id, raw.modifiers?.combat),
    ],
  }
  if (raw.tags?.length) race.tags = raw.tags
  if (raw.desc) race.summary = raw.desc
  const resourcePools = mapV1ResourcePools(raw.id, raw.pools)
  if (resourcePools.length) race.resourcePools = resourcePools
  const notes = [...(raw.abilities ?? [])]
  if (notes.length) race.notes = notes
  if (raw.occCompatibility) {
    race.compatibility = {
      mode: raw.occCompatibility.rccOccId ? 'rcc_required' : 'any_occ',
      requiredRccId: raw.occCompatibility.rccOccId ?? null,
    }
  }
  return race
}

export function adaptV1OccLike(raw: V1OccRaw): CompendiumOcc | CompendiumRcc {
  const shared = {
    id: raw.id,
    name: raw.name,
    source: mapSource(raw.source),
    grants: mapV1GrantedSkills(raw.id, raw.skills?.granted),
    modifiers: [
      ...mapV1SavesToModifiers(raw.id, raw.bonuses?.saves),
      ...mapV1CombatToModifiers(raw.id, raw.bonuses?.combat),
      ...(typeof raw.bonuses?.perception === 'number'
        ? [{
          id: `${raw.id}-perception`,
          target: 'perception.base',
          operation: 'add',
          value: raw.bonuses.perception,
          sourceLabel: raw.id,
        } satisfies Modifier]
        : []),
    ],
  }

  const resourcePools = mapV1ResourcePools(raw.id, raw.resources)
  const notes = [...(raw.notes ?? [])]
  const entity: CompendiumOcc | CompendiumRcc = raw.kind === 'RCC'
    ? {
      ...shared,
      kind: 'rcc',
    }
    : {
      ...shared,
      kind: 'occ',
    }

  if (raw.tags?.length) setIfPresent(entity, 'tags', raw.tags)
  if (raw.desc) setIfPresent(entity, 'summary', raw.desc)
  if (resourcePools.length) setIfPresent(entity, 'resourcePools', resourcePools)
  const requirements = mapV1Requirements(raw.requirements)
  if (requirements) setIfPresent(entity, 'requirements', requirements)
  if (notes.length) setIfPresent(entity, 'notes', notes)
  return entity
}

export function adaptV1Skill(raw: V1SkillRaw): CompendiumSkill {
  const skill: CompendiumSkill = {
    id: raw.id,
    kind: 'skill',
    name: raw.name,
    source: {
      book: 'Imported from v1 skill catalog',
      page: null,
    },
    category: raw.category ?? 'Uncategorized',
    repeatability: mapV1Repeatability(raw.metadata?.repeatable),
  }
  if (typeof raw.base === 'number' && typeof raw.perLevel === 'number') {
    skill.baseFormula = `${raw.base}% + ${raw.perLevel}%/level`
  }
  if (raw.notes) skill.summary = raw.notes
  if (raw.metadata?.specializationLabel) {
    const specialization: NonNullable<CompendiumSkill['specialization']> = {
      label: raw.metadata.specializationLabel,
      mode: raw.metadata.specializationOptions?.length ? 'option_set' : 'free_text',
    }
    if (raw.metadata.specializationOptions?.length) {
      specialization.options = raw.metadata.specializationOptions
    }
    skill.specialization = specialization
  }
  if (raw.requires?.length) {
    skill.prerequisites = {
      skillIdsAll: raw.requires,
    }
  }
  return skill
}
