import type {
  CharacterBuild,
  ChoiceSlot,
  CompendiumEntity,
  CompendiumEquipment,
  CompendiumOcc,
  CompendiumRace,
  CompendiumRcc,
  CompendiumSkill,
  Grant,
  Modifier,
  ProgressionTrack,
  RequirementSet,
  ResolvedAttack,
  ResolvedCharacter,
  ResolvedEquipment,
  ResolvedPool,
  ResolvedPower,
  ResolvedSkill,
  ResolvedSpell,
  ResourcePoolDefinition,
  SkillChoiceGrant,
  SkillGrant,
  ValidationIssue,
} from '@rifts-v2/schema'
import type { CompendiumRegistry } from '@rifts-v2/compendium'

type SourceEntity = CompendiumRace | CompendiumRcc | CompendiumOcc

type SourceContext = {
  source: SourceEntity
  grants: Grant[]
  progressionModifiers: Modifier[]
}

const SKILL_PERCENT_CAP = 98

function findEntityByIdOrName(registry: CompendiumRegistry, idOrName: string): CompendiumEntity | null {
  return registry.byId.get(idOrName) ?? registry.byName.get(idOrName) ?? null
}

function asRace(entity: CompendiumEntity | null): CompendiumRace | null {
  return entity?.kind === 'race' ? entity : null
}

function asRcc(entity: CompendiumEntity | null): CompendiumRcc | null {
  return entity?.kind === 'rcc' ? entity : null
}

function asOcc(entity: CompendiumEntity | null): CompendiumOcc | null {
  return entity?.kind === 'occ' ? entity : null
}

function asEquipment(entity: CompendiumEntity | null): CompendiumEquipment | null {
  return entity?.kind === 'equipment' ? entity : null
}

function asSkill(entity: CompendiumEntity | null): CompendiumSkill | null {
  return entity?.kind === 'skill' ? entity : null
}

function clampSkillPercent(value: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(SKILL_PERCENT_CAP, Math.max(0, value))
}

function resolveIqSkillBonus(build: CharacterBuild): number {
  const iq = build.attributes.IQ ?? 0
  return iq >= 16 ? (iq - 15) * 5 : 0
}

function getEffectiveLevel(build: CharacterBuild): number {
  return Math.max(1, Number(build.level) || 1)
}

function resolveActiveGrants(grants: Grant[], level: number): Grant[] {
  return grants.flatMap(grant => {
    if (grant.kind !== 'unlock_at_level') return [grant]
    if (level < grant.level) return []
    return resolveActiveGrants(grant.grants, level)
  })
}

function resolveProgressionModifiers(source: SourceEntity, level: number): Modifier[] {
  if (source.kind === 'race' || !source.progression?.length) return []
  return source.progression.flatMap((track: ProgressionTrack) => {
    const isActive = track.levels.some(trackLevel => trackLevel <= level)
    if (!isActive || !track.modifiers?.length) return []
    return track.modifiers.map(modifier => ({
      ...modifier,
      sourceLabel: modifier.sourceLabel ?? `${source.id}:${track.id}`,
    }))
  })
}

function collectSourceContexts(sources: SourceEntity[], level: number): SourceContext[] {
  return sources.map(source => ({
    source,
    grants: resolveActiveGrants(source.grants, level),
    progressionModifiers: resolveProgressionModifiers(source, level),
  }))
}

function collectPools(sourceLabel: string, pools?: ResourcePoolDefinition[]): ResolvedPool[] {
  if (!Array.isArray(pools)) return []
  return pools.map(pool => ({
    id: pool.id,
    poolType: pool.poolType,
    label: pool.label,
    formula: pool.formula ?? null,
    maxValue: pool.fixedValue ?? null,
    sourceLabels: [sourceLabel],
    ...(pool.notes ? { notes: pool.notes } : {}),
  }))
}

function collectChoiceSlots(sourceLabel: string, grants: Grant[]): ChoiceSlot[] {
  return grants.flatMap(grant => {
    if (
      grant.kind !== 'grant_skill_choice'
      && grant.kind !== 'grant_power_choice'
      && grant.kind !== 'grant_spell_choice'
    ) return []
    return [{
      ...grant.slot,
      sourceLabel: grant.sourceLabel ?? sourceLabel,
    }]
  })
}

function toKnownSkillRefs(registry: CompendiumRegistry, build: CharacterBuild, sourceContexts: SourceContext[]): Set<string> {
  const refs = new Set<string>()
  for (const context of sourceContexts) {
    for (const grant of context.grants) {
      if (grant.kind !== 'grant_skill') continue
      refs.add(grant.skillId)
      const entity = asSkill(findEntityByIdOrName(registry, grant.skillId))
      if (entity) refs.add(entity.name)
    }
  }
  for (const selection of build.skillSelections) {
    refs.add(selection.skillId)
    const entity = asSkill(findEntityByIdOrName(registry, selection.skillId))
    if (entity) refs.add(entity.name)
  }
  return refs
}

function resolveSkillGrantLike(
  skill: CompendiumSkill,
  grant: Pick<SkillGrant | SkillChoiceGrant, 'basePercent' | 'bonus' | 'perLevelPercent' | 'fixedTotal'> | null,
  build: CharacterBuild,
): { total: number | null; base: number | null; perLevel: number | null } {
  const base = grant?.basePercent ?? skill.basePercent ?? null
  const perLevel = grant?.perLevelPercent ?? skill.perLevelPercent ?? null
  if (grant?.fixedTotal) {
    return {
      total: clampSkillPercent(base),
      base,
      perLevel,
    }
  }
  if (typeof base !== 'number') {
    return {
      total: null,
      base,
      perLevel,
    }
  }
  const iqBonus = resolveIqSkillBonus(build)
  const progressionGain = typeof perLevel === 'number' ? (getEffectiveLevel(build) - 1) * perLevel : 0
  const grantBonus = grant?.bonus ?? 0
  return {
    total: clampSkillPercent(base + progressionGain + iqBonus + grantBonus),
    base,
    perLevel,
  }
}

function resolveSelectedSkillGrant(sourceContexts: SourceContext[], sourceSlotId: string | null | undefined): SkillChoiceGrant | null {
  if (!sourceSlotId) return null
  for (const context of sourceContexts) {
    for (const grant of context.grants) {
      if (grant.kind !== 'grant_skill_choice') continue
      if (grant.slot.id === sourceSlotId) return grant
    }
  }
  return null
}

function matchesSlotFilter(entity: CompendiumEntity, slot: ChoiceSlot): boolean {
  if (!slot.allowedEntityKinds.includes(entity.kind)) return false
  if (slot.allowedIds?.length && !slot.allowedIds.includes(entity.id) && !slot.allowedIds.includes(entity.name)) {
    return false
  }
  if (!slot.filters?.length) return true

  return slot.filters.every(filter => {
    const values = filter.values ?? []
    if (filter.key === 'category' && entity.kind === 'skill') {
      const match = values.includes(entity.category)
      return filter.mode === 'exclude' ? !match : match
    }
    if (filter.key === 'subcategory' && 'subcategory' in entity) {
      const subcategory = entity.subcategory ?? null
      const match = subcategory ? values.includes(subcategory) : false
      return filter.mode === 'exclude' ? !match : match
    }
    if (filter.key === 'tag') {
      const tags = entity.tags ?? []
      const match = values.some(value => tags.includes(value))
      return filter.mode === 'exclude' ? !match : match
    }
    return true
  })
}

function requirementsMet(requirements: RequirementSet | undefined, knownSkillRefs: Set<string>): boolean {
  if (!requirements) return true
  const allMet = (requirements.skillIdsAll ?? []).every(skillRef => knownSkillRefs.has(skillRef))
  const anyMet = !requirements.skillIdsAny?.length || requirements.skillIdsAny.some(skillRef => knownSkillRefs.has(skillRef))
  return allMet && anyMet
}

function buildResolvedSkill(
  skill: CompendiumSkill,
  build: CharacterBuild,
  sourceLabel: string,
  options: {
    selectionId?: string | null
    specialization?: string | null
    grant?: SkillGrant | SkillChoiceGrant | null
  } = {},
): ResolvedSkill {
  const resolved = resolveSkillGrantLike(skill, options.grant ?? null, build)
  return {
    ...(options.selectionId ? { selectionId: options.selectionId } : {}),
    skillId: skill.id,
    name: skill.name,
    category: skill.category,
    ...(options.specialization ? { specialization: options.specialization } : {}),
    total: resolved.total,
    sourceLabels: [sourceLabel],
    notes: [
      ...(typeof resolved.base === 'number' ? [`Base: ${resolved.base}%`] : []),
      ...(typeof resolved.perLevel === 'number' ? [`Per level: +${resolved.perLevel}%`] : []),
      ...(options.grant?.bonus ? [`Source bonus: +${options.grant.bonus}%`] : []),
      ...(skill.prerequisites?.notes ?? []),
    ],
  }
}

function collectDirectSkills(
  registry: CompendiumRegistry,
  build: CharacterBuild,
  context: SourceContext,
): ResolvedSkill[] {
  return context.grants.flatMap(grant => {
    if (grant.kind !== 'grant_skill') return []
    const entity = asSkill(findEntityByIdOrName(registry, grant.skillId))
    if (!entity) {
      return [{
        skillId: grant.skillId,
        name: grant.skillId,
        category: 'Unknown',
        total: grant.basePercent ?? null,
        sourceLabels: [context.source.name],
        ...(grant.notes ? { notes: grant.notes } : {}),
      }]
    }
    return [buildResolvedSkill(entity, build, context.source.name, { grant })]
  })
}

function collectSelectedSkills(
  registry: CompendiumRegistry,
  build: CharacterBuild,
  sourceContexts: SourceContext[],
): ResolvedSkill[] {
  return build.skillSelections.flatMap(selection => {
    const entity = asSkill(findEntityByIdOrName(registry, selection.skillId))
    if (!entity) return []
    const sourceGrant = resolveSelectedSkillGrant(sourceContexts, selection.sourceSlotId)
    const sourceLabel = sourceGrant?.sourceLabel
      ?? sourceContexts.find(context => context.grants.some(grant => grant.kind === 'grant_skill_choice' && grant.slot.id === selection.sourceSlotId))?.source.name
      ?? selection.sourceSlotId
      ?? 'build'
    return [buildResolvedSkill(entity, build, sourceLabel, {
      selectionId: selection.selectionId,
      specialization: selection.specialization ?? null,
      grant: sourceGrant,
    })]
  })
}

function collectDirectEquipment(
  registry: CompendiumRegistry,
  sourceLabel: string,
  grants: Grant[],
): ResolvedEquipment[] {
  return grants.flatMap(grant => {
    if (grant.kind !== 'grant_equipment') return []
    const entity = asEquipment(findEntityByIdOrName(registry, grant.equipmentId))
    if (!entity) {
      return [{
        equipmentId: grant.equipmentId,
        name: grant.equipmentId,
        equipmentFamily: 'other',
        quantity: grant.quantity ?? 1,
        sourceLabels: [sourceLabel],
        ...(grant.notes ? { notes: grant.notes } : {}),
      }]
    }
    const item: ResolvedEquipment = {
      equipmentId: entity.id,
      name: entity.name,
      equipmentFamily: entity.equipmentFamily,
      quantity: grant.quantity ?? 1,
      sourceLabels: [sourceLabel],
    }
    if (entity.subcategory) item.subcategory = entity.subcategory
    if (entity.eligibleSlots?.length) item.eligibleSlots = entity.eligibleSlots
    if (entity.wpCategory) item.wpCategory = entity.wpCategory
    if (entity.notes?.length) item.notes = entity.notes
    return [item]
  })
}

function collectSelectedEquipment(registry: CompendiumRegistry, build: CharacterBuild): ResolvedEquipment[] {
  return build.equipmentSelections.flatMap(selection => {
    const entity = asEquipment(findEntityByIdOrName(registry, selection.equipmentId))
    if (!entity) return []
    const item: ResolvedEquipment = {
      selectionId: selection.selectionId,
      equipmentId: entity.id,
      name: entity.name,
      equipmentFamily: entity.equipmentFamily,
      quantity: selection.quantity ?? 1,
      sourceLabels: [selection.sourceSlotId ?? 'build'],
    }
    if (entity.subcategory) item.subcategory = entity.subcategory
    if (selection.equippedSlotId) item.equippedSlotId = selection.equippedSlotId
    if (entity.eligibleSlots?.length) item.eligibleSlots = entity.eligibleSlots
    if (entity.wpCategory) item.wpCategory = entity.wpCategory
    const notes = selection.notes?.length ? selection.notes : entity.notes
    if (notes?.length) item.notes = notes
    return [item]
  })
}

function dedupeSkills(skills: ResolvedSkill[]): ResolvedSkill[] {
  const seen = new Set<string>()
  return skills.filter(skill => {
    const key = `${skill.selectionId ?? ''}:${skill.skillId}:${skill.specialization ?? ''}:${skill.sourceLabels?.join('|') ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dedupeEquipment(items: ResolvedEquipment[]): ResolvedEquipment[] {
  const seen = new Set<string>()
  return items.filter(item => {
    const key = `${item.selectionId ?? ''}:${item.equipmentId}:${item.equippedSlotId ?? ''}:${item.sourceLabels?.join('|') ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function collectValidationIssues(
  registry: CompendiumRegistry,
  build: CharacterBuild,
  race: CompendiumRace | null,
  rcc: CompendiumRcc | null,
  occ: CompendiumOcc | null,
  sourceContexts: SourceContext[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!build.raceId) {
    issues.push({
      id: 'missing-race',
      severity: 'warning',
      scope: 'build',
      message: 'No race selected.',
    })
  } else if (!race) {
    issues.push({
      id: 'unknown-race',
      severity: 'error',
      scope: 'build',
      message: `Race not found in registry: ${build.raceId}`,
    })
  }
  if (build.rccId && !rcc) {
    issues.push({
      id: 'unknown-rcc',
      severity: 'error',
      scope: 'build',
      message: `RCC not found in registry: ${build.rccId}`,
    })
  }
  if (build.occId && !occ) {
    issues.push({
      id: 'unknown-occ',
      severity: 'error',
      scope: 'build',
      message: `OCC not found in registry: ${build.occId}`,
    })
  }

  if (race?.compatibility?.mode === 'rcc_required' && race.compatibility.requiredRccId && build.rccId !== race.compatibility.requiredRccId) {
    issues.push({
      id: 'race-rcc-mismatch',
      severity: 'error',
      scope: 'build',
      message: `${race.name} requires RCC ${race.compatibility.requiredRccId}.`,
    })
  }

  if (occ?.requirements?.attributes) {
    for (const [attribute, minimum] of Object.entries(occ.requirements.attributes)) {
      const current = build.attributes[attribute as keyof CharacterBuild['attributes']]
      if ((current ?? 0) < minimum) {
        issues.push({
          id: `occ-attr-${attribute}`,
          severity: 'error',
          scope: 'build',
          message: `${occ.name} requires ${attribute} ${minimum}+ (current ${current ?? 0}).`,
        })
      }
    }
  }

  for (const selection of build.equipmentSelections) {
    const entity = findEntityByIdOrName(registry, selection.equipmentId)
    if (!entity) {
      issues.push({
        id: `unknown-equipment-${selection.selectionId}`,
        severity: 'error',
        scope: 'build',
        message: `Equipment not found in registry: ${selection.equipmentId}`,
      })
      continue
    }
    if (entity.kind !== 'equipment') {
      issues.push({
        id: `invalid-equipment-${selection.selectionId}`,
        severity: 'error',
        scope: 'build',
        message: `Build selection is not an equipment entity: ${selection.equipmentId}`,
      })
    }
  }

  const knownSkillRefs = toKnownSkillRefs(registry, build, sourceContexts)
  const slotSelectionCounts = new Map<string, number>()

  for (const selection of build.skillSelections) {
    const entity = findEntityByIdOrName(registry, selection.skillId)
    if (!entity) {
      issues.push({
        id: `unknown-skill-${selection.selectionId}`,
        severity: 'error',
        scope: 'build',
        message: `Skill not found in registry: ${selection.skillId}`,
      })
      continue
    }
    if (entity.kind !== 'skill') {
      issues.push({
        id: `invalid-skill-${selection.selectionId}`,
        severity: 'error',
        scope: 'build',
        message: `Build selection is not a skill entity: ${selection.skillId}`,
      })
      continue
    }

    if (selection.sourceSlotId) {
      slotSelectionCounts.set(selection.sourceSlotId, (slotSelectionCounts.get(selection.sourceSlotId) ?? 0) + 1)
      const grant = resolveSelectedSkillGrant(sourceContexts, selection.sourceSlotId)
      if (!grant) {
        issues.push({
          id: `missing-skill-slot-${selection.selectionId}`,
          severity: 'error',
          scope: 'build',
          message: `No active skill choice slot found for ${selection.sourceSlotId}.`,
        })
      } else if (!matchesSlotFilter(entity, grant.slot)) {
        issues.push({
          id: `illegal-skill-slot-${selection.selectionId}`,
          severity: 'error',
          scope: 'build',
          message: `${entity.name} is not a legal choice for slot ${grant.slot.label}.`,
        })
      }
    }

    if (!requirementsMet(entity.prerequisites, knownSkillRefs)) {
      const issue: ValidationIssue = {
        id: `skill-prereq-${selection.selectionId}`,
        severity: 'error',
        scope: 'build',
        message: `${entity.name} prerequisites are not satisfied.`,
      }
      if (entity.prerequisites?.notes?.length) issue.notes = entity.prerequisites.notes
      issues.push(issue)
    }
  }

  for (const context of sourceContexts) {
    for (const grant of context.grants) {
      if (grant.kind !== 'grant_skill_choice') continue
      const used = slotSelectionCounts.get(grant.slot.id) ?? 0
      if (used > grant.slot.count) {
        issues.push({
          id: `overfill-slot-${grant.slot.id}`,
          severity: 'error',
          scope: 'build',
          message: `${grant.slot.label} allows ${grant.slot.count} selections, but ${used} were chosen.`,
        })
      }
    }
  }

  return issues
}

export interface ResolveCharacterInput {
  registry: CompendiumRegistry
  build: CharacterBuild
}

export function resolveCharacterBuild({ registry, build }: ResolveCharacterInput): ResolvedCharacter {
  const level = getEffectiveLevel(build)
  const race = asRace(findEntityByIdOrName(registry, build.raceId ?? ''))
  const rcc = asRcc(findEntityByIdOrName(registry, build.rccId ?? ''))
  const occ = asOcc(findEntityByIdOrName(registry, build.occId ?? ''))

  const sources = [race, rcc, occ].filter((source): source is SourceEntity => source !== null)
  const sourceContexts = collectSourceContexts(sources, level)
  const modifiers = sourceContexts.flatMap(context => [...context.source.modifiers, ...context.progressionModifiers])
  const pools = sourceContexts.flatMap(context => collectPools(context.source.name, context.source.resourcePools))
  const directSkills = sourceContexts.flatMap(context => collectDirectSkills(registry, build, context))
  const selectedSkills = collectSelectedSkills(registry, build, sourceContexts)
  const directEquipment = sourceContexts.flatMap(context => collectDirectEquipment(registry, context.source.name, context.grants))
  const selectedEquipment = collectSelectedEquipment(registry, build)
  const availableChoices = sourceContexts.flatMap(context => collectChoiceSlots(context.source.name, context.grants))
  const validation = collectValidationIssues(registry, build, race, rcc, occ, sourceContexts)

  return {
    actorId: build.id,
    actorType: 'character',
    name: build.name || 'Unnamed Character',
    sourceRefs: sources.map(source => source.source),
    pools,
    skills: dedupeSkills([...directSkills, ...selectedSkills]),
    powers: [] satisfies ResolvedPower[],
    spells: [] satisfies ResolvedSpell[],
    attacks: [] satisfies ResolvedAttack[],
    equipment: dedupeEquipment([...directEquipment, ...selectedEquipment]),
    modifiers: modifiers.map(modifier => ({
      ...modifier,
      appliedValue: modifier.value,
    })),
    availableChoices,
    validation,
    explanations: [
      {
        id: 'resolver-phase-1',
        target: 'character',
        label: 'Phase 1 resolver',
        sourceLabels: sources.map(source => source.name),
        notes: [
          `Resolved sources through level ${level}.`,
          'Applied direct grants, unlocked progression modifiers, equipment loadout, and choice slots.',
          'Computed base skill totals using imported base percent, per-level growth, source bonuses, and IQ bonus.',
        ],
      },
    ],
  }
}

export function createStarterResolvedCharacter(): ResolvedCharacter {
  return {
    actorId: 'starter',
    actorType: 'character',
    name: 'Starter Character',
    sourceRefs: [],
    pools: [],
    skills: [],
    powers: [],
    spells: [],
    attacks: [],
    equipment: [],
    modifiers: [],
    availableChoices: [],
    validation: [],
    explanations: [
      {
        id: 'resolver-scaffold',
        target: 'resolver',
        label: 'Resolver scaffold ready',
        sourceLabels: ['rules-engine'],
        notes: ['Resolver now supports level-based grants, legality checks, and basic skill total computation.'],
      },
    ],
  }
}
