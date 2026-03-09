import type {
  ActionProfile,
  ChoiceSlot,
  CompendiumEquipment,
  CompendiumOcc,
  CompendiumRace,
  CompendiumRcc,
  CompendiumSkill,
  CompendiumVehicle,
  DamageProfile,
  EquipmentModeProfile,
  EquipmentSystemProfile,
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

type V1WeaponPayloadRaw = {
  type?: string
  capacity?: number | null
}

type V1WeaponModeRaw = {
  modeId?: string
  label?: string
  scale?: string
  damage?: string
  range?: string
  rof?: string
  payload?: V1WeaponPayloadRaw | null
}

type V1MeasurementRaw = {
  value?: number
  unit?: string
}

type V1EquipmentSystemsRaw = {
  sensors?: string[]
  comms?: string[]
  environmental?: string[]
}

type V1EquipmentFrameRaw = {
  class?: string
  size?: string
  crew?: number
  passengers?: number
}

type V1ProtectionRaw = {
  armorRating?: number
  type?: string
  mdc?: number
}

type V1MovementRaw = {
  type?: string
  speed?: number
  unit?: string
}

type V1CarryCapacityRaw = {
  maxWeight?: V1MeasurementRaw
}

type V1EquipmentCapacityRaw = {
  carry?: V1CarryCapacityRaw
}

export interface V1EquipmentRaw {
  id: string
  name: string
  category?: string
  subcategory?: string
  tags?: string[]
  source?: V1Source
  desc?: string
  cost?: {
    credits?: number
  }
  mass?: V1MeasurementRaw
  hands?: number
  eligibleSlots?: string[]
  wpCategory?: string
  weaponModes?: V1WeaponModeRaw[]
  systems?: V1EquipmentSystemsRaw
  frame?: V1EquipmentFrameRaw
  protection?: V1ProtectionRaw
  movement?: V1MovementRaw[]
  capacity?: V1EquipmentCapacityRaw
  notes?: string | null
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

function mapDamageScale(raw?: string): DamageProfile['scale'] {
  const normalized = raw?.trim().toLowerCase()
  if (normalized === 'sdc') return 'sdc'
  if (normalized === 'mdc') return 'mdc'
  return 'special'
}

function mapMeasurement(raw?: V1MeasurementRaw): { value: number; unit: string } | null {
  if (!raw) return null
  if (typeof raw.value !== 'number' || !Number.isFinite(raw.value) || !raw.unit) return null
  return {
    value: raw.value,
    unit: raw.unit,
  }
}

function mapEquipmentSystems(raw?: V1EquipmentSystemsRaw): EquipmentSystemProfile | null {
  if (!raw) return null
  const systems: EquipmentSystemProfile = {}
  if (raw.sensors?.length) systems.sensors = raw.sensors
  if (raw.comms?.length) systems.comms = raw.comms
  if (raw.environmental?.length) systems.environmental = raw.environmental
  return Object.keys(systems).length > 0 ? systems : null
}

function mapWeaponModes(rawId: string, modes?: V1WeaponModeRaw[]): {
  weaponModes: EquipmentModeProfile[]
  actions: ActionProfile[]
} {
  if (!Array.isArray(modes) || modes.length === 0) return { weaponModes: [], actions: [] }
  const weaponModes: EquipmentModeProfile[] = []
  const actions: ActionProfile[] = []

  modes.forEach((mode, index) => {
    const id = mode.modeId ?? `${rawId}-mode-${index + 1}`
    const label = mode.label ?? `Mode ${index + 1}`
    const damage = mode.damage
      ? (() => {
        const next: DamageProfile = {
          formula: mode.damage,
        }
        const scale = mapDamageScale(mode.scale)
        if (scale) next.scale = scale
        return next
      })()
      : null

    const weaponMode: EquipmentModeProfile = {
      id,
      label,
    }
    if (damage) weaponMode.damage = damage
    if (mode.range) weaponMode.range = mode.range
    if (mode.rof) weaponMode.rateOfFire = mode.rof
    if (mode.payload?.type) weaponMode.payloadType = mode.payload.type
    if (typeof mode.payload?.capacity === 'number') weaponMode.payloadCapacity = mode.payload.capacity
    weaponModes.push(weaponMode)

    const notes: string[] = []
    if (mode.damage) notes.push(`Damage: ${mode.damage}`)
    if (mode.range) notes.push(`Range: ${mode.range}`)
    if (mode.rof) notes.push(`Rate of Fire: ${mode.rof}`)
    if (mode.payload?.type) {
      const capacityText = typeof mode.payload.capacity === 'number' ? ` ${mode.payload.capacity}` : ''
      notes.push(`Payload: ${mode.payload.type}${capacityText}`)
    }
    actions.push({
      id: `${rawId}-${id}`,
      label,
      ...(notes.length ? { notes } : {}),
    })
  })

  return { weaponModes, actions }
}

function mapEquipmentFamily(category?: string, subcategory?: string): CompendiumEquipment['equipmentFamily'] {
  if (category === 'weapon') return 'weapon'
  if (category === 'armor') return 'armor'
  if (category === 'consumable') return 'consumable'
  if (subcategory === 'electronics' || subcategory === 'optics') return 'device'
  return 'gear'
}

function mapEquipmentNotes(raw: V1EquipmentRaw): string[] | undefined {
  const notes: string[] = []
  if (raw.notes) notes.push(raw.notes)
  if (typeof raw.protection?.armorRating === 'number') {
    notes.push(`Armor Rating: ${raw.protection.armorRating}`)
  }
  if (raw.protection?.type) notes.push(`Protection Type: ${raw.protection.type}`)
  if (raw.movement?.length) {
    notes.push(...raw.movement.flatMap(move => {
      if (!move.type || !Number.isFinite(move.speed) || !move.unit) return []
      return [`${move.type}: ${move.speed} ${move.unit}`]
    }))
  }
  if (raw.frame?.class) notes.push(`Frame Class: ${raw.frame.class}`)
  if (raw.frame?.size) notes.push(`Frame Size: ${raw.frame.size}`)
  if (raw.capacity?.carry?.maxWeight) {
    const carry = mapMeasurement(raw.capacity.carry.maxWeight)
    if (carry) notes.push(`Carry Capacity: ${carry.value} ${carry.unit}`)
  }
  return notes.length > 0 ? notes : undefined
}

function mapEquipmentProtectionPools(raw: V1EquipmentRaw): ResourcePoolDefinition[] {
  const mdc = raw.protection?.mdc
  if (typeof mdc !== 'number' || !Number.isFinite(mdc) || mdc <= 0) return []
  const isVehicle = raw.category === 'vehicle'
  return [{
    id: `${raw.id}-${isVehicle ? 'vehicle-mdc' : 'armor-mdc'}`,
    poolType: isVehicle ? 'mdc_body' : 'mdc_armor',
    label: isVehicle ? 'Vehicle M.D.C.' : 'Armor M.D.C.',
    fixedValue: mdc,
    ownerScope: isVehicle ? 'vehicle' : 'equipment',
    trackingMode: 'tracked',
  }]
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

export function adaptV1Equipment(raw: V1EquipmentRaw): CompendiumEquipment {
  const mappedModes = mapWeaponModes(raw.id, raw.weaponModes)
  const equipment: CompendiumEquipment = {
    id: raw.id,
    kind: 'equipment',
    name: raw.name,
    source: mapSource(raw.source),
    equipmentFamily: mapEquipmentFamily(raw.category, raw.subcategory),
  }

  if (raw.tags?.length) equipment.tags = raw.tags
  if (raw.desc) equipment.summary = raw.desc
  if (raw.subcategory) equipment.subcategory = raw.subcategory
  if (typeof raw.cost?.credits === 'number') equipment.costCredits = raw.cost.credits
  const mass = mapMeasurement(raw.mass)
  if (mass) equipment.mass = mass
  if (typeof raw.hands === 'number') equipment.hands = raw.hands
  if (raw.eligibleSlots?.length) equipment.eligibleSlots = raw.eligibleSlots
  if (raw.wpCategory) equipment.wpCategory = raw.wpCategory
  const systems = mapEquipmentSystems(raw.systems)
  if (systems) equipment.systems = systems
  if (mappedModes.weaponModes.length) equipment.weaponModes = mappedModes.weaponModes
  if (mappedModes.actions.length) equipment.actions = mappedModes.actions
  const resourcePools = mapEquipmentProtectionPools(raw)
  if (resourcePools.length) equipment.resourcePools = resourcePools
  const notes = mapEquipmentNotes(raw)
  if (notes) equipment.notes = notes
  return equipment
}

export function adaptV1Vehicle(raw: V1EquipmentRaw): CompendiumVehicle {
  const mappedModes = mapWeaponModes(raw.id, raw.weaponModes)
  const vehicle: CompendiumVehicle = {
    id: raw.id,
    kind: 'vehicle',
    name: raw.name,
    source: mapSource(raw.source),
    vehicleFamily: raw.subcategory ?? 'general',
  }

  if (raw.tags?.length) vehicle.tags = raw.tags
  if (raw.desc) vehicle.summary = raw.desc
  if (raw.subcategory) vehicle.subcategory = raw.subcategory
  if (typeof raw.cost?.credits === 'number') vehicle.costCredits = raw.cost.credits
  const mass = mapMeasurement(raw.mass)
  if (mass) vehicle.mass = mass
  if (typeof raw.frame?.crew === 'number') vehicle.crew = raw.frame.crew
  if (typeof raw.frame?.passengers === 'number') vehicle.passengerCapacity = raw.frame.passengers
  const systems = mapEquipmentSystems(raw.systems)
  if (systems) vehicle.systems = systems
  const resourcePools = mapEquipmentProtectionPools(raw)
  if (resourcePools.length) vehicle.resourcePools = resourcePools
  if (mappedModes.actions.length) vehicle.actions = mappedModes.actions
  const notes = mapEquipmentNotes(raw)
  if (notes) vehicle.notes = notes
  return vehicle
}
