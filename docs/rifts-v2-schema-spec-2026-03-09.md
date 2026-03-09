# Rifts V2 Schema Spec

Date: 2026-03-09

Status:
- Phase 1 draft
- First concrete contract pass
- Intended to drive `packages/schema`

Purpose:
- define the minimum usable V2 contracts
- lock the boundary between compendium data, build state, play state, world state, and resolved outputs
- define the first grant/modifier/action vocabulary that later systems will build on

This spec is deliberately broader than current implementation needs because V2 must be ready for:
- current character functionality
- future GM/world systems
- shared vehicles
- targeting
- additional power systems like super powers

## 1. Scope of This Phase

This phase defines:
- entity base contracts
- normalized compendium entity families
- character build documents
- play-state documents
- world-state documents
- resolved actor/resolved character contracts
- first-pass grant and modifier contracts
- first-pass action and target contracts

This phase does not define:
- final storage format
- final database schema
- final UI view models
- every narrow domain field required by every book/system

## 2. Core Separation

The most important architectural rule is the separation of five concepts:

1. `Compendium`
- canonical published/game content

2. `CharacterBuild`
- choices made by the player

3. `PlayState`
- current mutable table-use values

4. `WorldState`
- GM/campaign/scene context affecting many actors

5. `ResolvedActor`
- the computed output of applying rules to compendium + build + optional context

No document should try to be two of these at once.

## 3. Common Types

### `SourceRef`

Purpose:
- preserve book/source references for all canonical content

Fields:
- `book: string`
- `page: number | null`
- `notes?: string`

### `TaggedRecord`

Purpose:
- common tag support across compendium entities

Fields:
- `tags?: string[]`

### `Identifier`

Purpose:
- stable string ids for entities and references

Rule:
- ids must be globally stable within their entity family

## 4. Compendium Entity Families

### Shared base

All compendium entities inherit:
- `id`
- `kind`
- `name`
- `source`
- `tags`
- `summary?: string`

### Required entity kinds in Phase 1

- `race`
- `rcc`
- `occ`
- `skill`
- `spell`
- `power`
- `attack`
- `equipment`
- `vehicle`

### `CompendiumRace`

Represents a playable race/species entry.

Minimum fields:
- base entity fields
- `grants: Grant[]`
- `modifiers: Modifier[]`
- `resourcePools?: ResourcePoolDefinition[]`
- `compatibility?: RaceCompatibility`
- `notes?: string[]`

### `CompendiumRcc`

Represents an RCC rules package.

Minimum fields:
- base entity fields
- `grants: Grant[]`
- `modifiers: Modifier[]`
- `resourcePools?: ResourcePoolDefinition[]`
- `progression?: ProgressionTrack[]`
- `notes?: string[]`

### `CompendiumOcc`

Represents an OCC rules package.

Minimum fields:
- base entity fields
- `grants: Grant[]`
- `modifiers: Modifier[]`
- `resourcePools?: ResourcePoolDefinition[]`
- `progression?: ProgressionTrack[]`
- `requirements?: RequirementSet`
- `notes?: string[]`

### `CompendiumSkill`

Represents a canonical selectable or grantable skill.

Minimum fields:
- base entity fields
- `category: string`
- `baseFormula?: string | null`
- `repeatability: SkillRepeatability`
- `specialization?: SkillSpecializationRule | null`
- `prerequisites?: RequirementSet`
- `grants?: Grant[]`
- `modifiers?: Modifier[]`

### `CompendiumSpell`

Represents a spell definition, not how a character got it.

Minimum fields:
- base entity fields
- `level: number | null`
- `cost?: CostBlock | null`
- `targeting?: TargetingRule | null`
- `castingTime?: string | null`
- `duration?: string | null`
- `range?: string | null`
- `notes?: string[]`

### `CompendiumPower`

Represents psionic, super, racial, device, or other active powers.

Minimum fields:
- base entity fields
- `powerFamily: PowerFamily`
- `cost?: CostBlock | null`
- `targeting?: TargetingRule | null`
- `action?: ActionProfile | null`
- `notes?: string[]`

### `CompendiumAttack`

Represents a canonical attack definition.

Minimum fields:
- base entity fields
- `attackFamily: AttackFamily`
- `damage: DamageProfile`
- `range?: string | null`
- `actionCost?: ActionCost | null`
- `targeting?: TargetingRule | null`

### `CompendiumEquipment`

Represents an item, weapon, armor, device, consumable, or gear piece.

Minimum fields:
- base entity fields
- `equipmentFamily: EquipmentFamily`
- `resourcePools?: ResourcePoolDefinition[]`
- `grants?: Grant[]`
- `modifiers?: Modifier[]`
- `actions?: ActionProfile[]`

### `CompendiumVehicle`

Represents a vehicle as a first-class entity, not just a gear row.

Minimum fields:
- base entity fields
- `vehicleFamily: string`
- `resourcePools?: ResourcePoolDefinition[]`
- `stations?: VehicleStationDefinition[]`
- `actions?: ActionProfile[]`
- `modifiers?: Modifier[]`

## 5. Grants

Grants are the typed "you gain this" or "you may choose this" language for V2.

### Phase 1 grant families

- `grant_skill`
- `grant_skill_choice`
- `grant_power`
- `grant_power_choice`
- `grant_spell`
- `grant_spell_choice`
- `grant_attack`
- `grant_resource`
- `grant_language`
- `grant_literacy`
- `grant_equipment`
- `grant_vehicle_access`
- `grant_package`
- `unlock_at_level`

### `GrantBase`

Shared fields:
- `id: string`
- `kind: GrantKind`
- `sourceLabel?: string`
- `notes?: string[]`

### Skill-specific grants

Skill grants should distinguish:
- direct grants of a known skill
- a choice slot that yields a skill instance

This is required for:
- repeatable skills
- ancient/modern W.P. filters
- language/literacy text selections
- OCC/RCC/race package selections

### Package grants

`grant_package` exists because V2 must support:
- OCC/RCC tracks
- bundle-driven options
- future super power packages
- future vehicle crew stations or role packages

It should reference a package id, not embed arbitrary freeform logic.

## 6. Modifiers

Modifiers are typed effects that alter resolved output.

### Phase 1 modifier targets

Minimum supported categories:
- attributes
- combat
- saves
- skills
- perception
- movement
- resource pools
- action cost

### `ModifierBase`

Fields:
- `id: string`
- `target: string`
- `operation: ModifierOperation`
- `value: number`
- `scope?: ModifierScope`
- `condition?: ConditionRef | null`
- `sourceLabel?: string`
- `notes?: string[]`

### Operations

Phase 1 operations:
- `add`
- `subtract`
- `multiply`
- `set_min`
- `set_max`

### Conditions

Conditions should exist as references even if the first resolver only supports a subset.

This preserves growth paths for:
- environmental effects
- on-ley-line effects
- vehicle-station effects
- target-specific modifiers
- time-limited modifiers

## 7. Resource Pools

Resource pools are first-class definitions.

### `ResourcePoolDefinition`

Fields:
- `id: string`
- `poolType: ResourcePoolType`
- `label: string`
- `formula?: string | null`
- `fixedValue?: number | null`
- `perLevelFormula?: string | null`
- `ownerScope: PoolOwnerScope`
- `trackingMode: PoolTrackingMode`
- `notes?: string[]`

### Required pool types in Phase 1

- `hp`
- `sdc`
- `mdc_body`
- `mdc_armor`
- `mdc_force_field`
- `ppe`
- `isp`

This makes current dragon body MDC and future vehicle/system pools fit the same model.

## 8. Character Build

`CharacterBuild` is the player's authored document.

### `CharacterBuild`

Minimum fields:
- `schemaVersion`
- `id`
- `name`
- `raceId`
- `rccId?: string | null`
- `occId?: string | null`
- `level`
- `alignment?: string | null`
- `attributes: AttributeAssignmentSet`
- `skillSelections: SkillSelection[]`
- `powerSelections: PowerSelection[]`
- `spellSelections: SpellSelection[]`
- `packageSelections: PackageSelection[]`
- `levelSelections: LevelSelectionRecord[]`
- `notes?: string`

Important rules:
- no current mutable pool values
- no derived totals
- no rendered sheet strings

### `SkillSelection`

Minimum fields:
- `selectionId`
- `skillId`
- `specialization?: string | null`
- `sourceSlotId?: string | null`

### `PowerSelection`

Minimum fields:
- `selectionId`
- `powerId`
- `sourceSlotId?: string | null`

### `SpellSelection`

Minimum fields:
- `selectionId`
- `spellId`
- `sourceSlotId?: string | null`
- `acquisitionSource?: string | null`

### `PackageSelection`

Minimum fields:
- `selectionId`
- `packageId`
- `sourceSlotId?: string | null`

## 9. Play State

`PlayState` exists for mutable table use.

### `PlayState`

Minimum fields:
- `schemaVersion`
- `actorId`
- `currentPools: Record<string, number>`
- `inventoryState?: InventoryStateRecord[]`
- `vehicleAssignments?: VehicleAssignmentRecord[]`
- `actionLog?: ActionLogEntry[]`
- `notes?: string`

Important rule:
- if a value is "current" and intended to change during play, it belongs here, not in `CharacterBuild`

## 10. World State

`WorldState` is campaign/GM context.

### `WorldState`

Minimum fields:
- `schemaVersion`
- `id`
- `time: TimeState`
- `scene?: SceneState | null`
- `environmentalConditions: EnvironmentalCondition[]`
- `activeEffects: WorldEffectRecord[]`
- `notes?: string`

Phase 1 does not need a full GM UI, but it does need this contract so later GM systems have somewhere to live.

## 11. Actions and Targets

These contracts must exist early even if execution is minimal at first.

### `ActionDeclaration`

Minimum fields:
- `id`
- `actorId`
- `sourceType`
- `sourceId`
- `mode?: string | null`
- `costs?: CostBlock[]`
- `targets: TargetReference[]`
- `notes?: string[]`

### `TargetReference`

Minimum fields:
- `targetType`
- `targetId`
- `locationId?: string | null`

Target types in Phase 1:
- `self`
- `actor`
- `vehicle`
- `zone`
- `item`

This is sufficient groundwork for future spell targeting and vehicle interactions.

## 12. Resolved Output

V2 resolves actors, not only characters.

### `ResolvedActor`

Minimum fields:
- `actorId`
- `actorType`
- `name`
- `sourceRefs: SourceRef[]`
- `pools: ResolvedPool[]`
- `skills: ResolvedSkill[]`
- `powers: ResolvedPower[]`
- `spells: ResolvedSpell[]`
- `attacks: ResolvedAttack[]`
- `modifiers: AppliedModifier[]`
- `availableChoices: ChoiceSlot[]`
- `validation: ValidationIssue[]`
- `explanations: ExplanationRecord[]`

### `ResolvedCharacter`

Phase 1 alias:
- `ResolvedActor` with `actorType = 'character'`

## 13. Choice Slots

Choice slots are how the resolver tells the builder what may be selected next.

### `ChoiceSlot`

Minimum fields:
- `id`
- `choiceFamily`
- `label`
- `count`
- `allowedEntityKinds`
- `allowedIds?: string[]`
- `filters?: SlotFilter[]`
- `sourceLabel?: string`
- `requiredAtLevel?: number | null`

This allows the builder to stop inventing rule logic locally.

## 14. Phase 1 Type Families

These enums/unions should exist now:

- `EntityKind`
- `GrantKind`
- `ModifierOperation`
- `ResourcePoolType`
- `PoolOwnerScope`
- `PoolTrackingMode`
- `PowerFamily`
- `AttackFamily`
- `EquipmentFamily`
- `ActorType`
- `ChoiceFamily`
- `TargetType`

## 15. Out-of-Scope Details for This Spec

Still intentionally deferred:
- final database indexing strategy
- final API transport shapes
- fully normalized package catalog
- full combat event model
- exact supers schema
- exact GM UI view models

These should build on this contract set, not bypass it.

## 16. Code Mapping

This spec should be represented in:
- `packages/schema/src/index.ts`

Future likely split:
- `entities.ts`
- `grants.ts`
- `modifiers.ts`
- `documents.ts`
- `resolved.ts`
- `actions.ts`

But Phase 1 can begin with one exported schema surface if that keeps momentum up.

## 17. Exit Criteria for Phase 1

Phase 1 is complete when:
- the schema package contains these contracts in code
- the schema doc matches the code
- the compendium adapter can target these contracts
- the resolver can begin against these contracts without inventing new domain categories on the fly
