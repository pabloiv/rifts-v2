import type {
  CharacterBuild,
  ChoiceSlot,
  CompendiumEquipment,
  CompendiumEntity,
  CompendiumOcc,
  CompendiumRace,
  CompendiumRcc,
  Grant,
  ResolvedAttack,
  ResolvedCharacter,
  ResolvedEquipment,
  ResolvedPool,
  ResolvedPower,
  ResolvedSkill,
  ResolvedSpell,
  ResourcePoolDefinition,
  ValidationIssue,
} from '@rifts-v2/schema'
import type { CompendiumRegistry } from '@rifts-v2/compendium'

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

function collectPools(sourceLabel: string, pools?: ResourcePoolDefinition[]): ResolvedPool[] {
  if (!Array.isArray(pools)) return []
  return pools.map(pool => ({
    id: pool.id,
    poolType: pool.poolType,
    label: pool.label,
    formula: pool.formula ?? null,
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

function collectDirectSkills(
  registry: CompendiumRegistry,
  sourceLabel: string,
  grants: Grant[],
): ResolvedSkill[] {
  return grants.flatMap(grant => {
    if (grant.kind !== 'grant_skill') return []
    const entity = findEntityByIdOrName(registry, grant.skillId)
    if (entity?.kind !== 'skill') {
      return [{
        skillId: grant.skillId,
        name: grant.skillId,
        category: 'Unknown',
        total: grant.basePercent ?? null,
        sourceLabels: [sourceLabel],
        ...(grant.notes ? { notes: grant.notes } : {}),
      }]
    }
    return [{
      skillId: entity.id,
      name: entity.name,
      category: entity.category,
      total: grant.basePercent ?? null,
      sourceLabels: [sourceLabel],
      ...(grant.notes ? { notes: grant.notes } : {}),
    }]
  })
}

function collectSelectedSkills(registry: CompendiumRegistry, build: CharacterBuild): ResolvedSkill[] {
  return build.skillSelections.flatMap(selection => {
    const entity = findEntityByIdOrName(registry, selection.skillId)
    if (entity?.kind !== 'skill') return []
    return [{
      selectionId: selection.selectionId,
      skillId: entity.id,
      name: entity.name,
      category: entity.category,
      specialization: selection.specialization ?? null,
      total: null,
      sourceLabels: [selection.sourceSlotId ?? 'build'],
    }]
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
  return issues
}

export interface ResolveCharacterInput {
  registry: CompendiumRegistry
  build: CharacterBuild
}

export function resolveCharacterBuild({ registry, build }: ResolveCharacterInput): ResolvedCharacter {
  const race = asRace(findEntityByIdOrName(registry, build.raceId ?? ''))
  const rcc = asRcc(findEntityByIdOrName(registry, build.rccId ?? ''))
  const occ = asOcc(findEntityByIdOrName(registry, build.occId ?? ''))

  const sources = [race, rcc, occ].filter((source): source is CompendiumRace | CompendiumRcc | CompendiumOcc => source !== null)
  const modifiers = sources.flatMap(source => source.modifiers)
  const pools = sources.flatMap(source => collectPools(source.name, source.resourcePools))
  const directSkills = sources.flatMap(source => collectDirectSkills(registry, source.name, source.grants))
  const selectedSkills = collectSelectedSkills(registry, build)
  const directEquipment = sources.flatMap(source => collectDirectEquipment(registry, source.name, source.grants))
  const selectedEquipment = collectSelectedEquipment(registry, build)
  const availableChoices = sources.flatMap(source => collectChoiceSlots(source.name, source.grants))
  const validation = collectValidationIssues(registry, build, race, rcc, occ)

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
        notes: ['Resolved race/RCC/OCC grants, resource pools, direct skills, equipment loadout, and choice slots.'],
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
        label: 'Scaffold ready',
        sourceLabels: ['rules-engine'],
        notes: ['Resolver placeholder ready for the first normalized compendium and migration adapter pass.'],
      },
    ],
  }
}
