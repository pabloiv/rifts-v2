export const SCHEMA_VERSION = '0.1.0'

export type Identifier = string

export type EntityKind =
  | 'race'
  | 'rcc'
  | 'occ'
  | 'skill'
  | 'spell'
  | 'power'
  | 'attack'
  | 'equipment'
  | 'vehicle'

export type ActorType =
  | 'character'
  | 'vehicle'
  | 'npc'
  | 'summon'
  | 'environment'
  | 'system'

export type GrantKind =
  | 'grant_skill'
  | 'grant_skill_choice'
  | 'grant_power'
  | 'grant_power_choice'
  | 'grant_spell'
  | 'grant_spell_choice'
  | 'grant_attack'
  | 'grant_resource'
  | 'grant_language'
  | 'grant_literacy'
  | 'grant_equipment'
  | 'grant_vehicle_access'
  | 'grant_package'
  | 'unlock_at_level'

export type ModifierOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'set_min'
  | 'set_max'

export type ResourcePoolType =
  | 'hp'
  | 'sdc'
  | 'mdc_body'
  | 'mdc_armor'
  | 'mdc_force_field'
  | 'ppe'
  | 'isp'
  | 'custom'

export type PoolOwnerScope =
  | 'actor'
  | 'equipment'
  | 'vehicle'
  | 'system'

export type PoolTrackingMode =
  | 'tracked'
  | 'derived'
  | 'external'

export type PowerFamily =
  | 'psionic'
  | 'magic'
  | 'super'
  | 'racial'
  | 'device'
  | 'vehicle'
  | 'other'

export type AttackFamily =
  | 'natural'
  | 'weapon'
  | 'spell'
  | 'power'
  | 'vehicle'
  | 'environment'

export type EquipmentFamily =
  | 'weapon'
  | 'armor'
  | 'gear'
  | 'consumable'
  | 'device'
  | 'vehicle_component'
  | 'other'

export type ChoiceFamily =
  | 'skill'
  | 'power'
  | 'spell'
  | 'package'
  | 'equipment'
  | 'vehicle'
  | 'attack'

export type TargetType =
  | 'self'
  | 'actor'
  | 'vehicle'
  | 'zone'
  | 'item'

export type SkillRepeatability =
  | 'single'
  | 'free_text'
  | 'option_set'
  | 'by_related_skill'

export type ModifierScope =
  | 'actor'
  | 'target'
  | 'world'
  | 'equipment'
  | 'vehicle'

export interface SourceRef {
  book: string
  page: number | null
  notes?: string
}

export interface CompendiumEntityBase {
  id: Identifier
  kind: EntityKind
  name: string
  source: SourceRef
  tags?: string[]
  summary?: string
}

export interface ConditionRef {
  id: string
  kind: string
  notes?: string[]
}

export interface RequirementSet {
  attributes?: Partial<Record<'IQ' | 'ME' | 'MA' | 'PS' | 'PP' | 'PE' | 'PB' | 'Spd', number>>
  skillIdsAll?: Identifier[]
  skillIdsAny?: Identifier[]
  raceIdsAny?: Identifier[]
  alignmentIdsAny?: string[]
  notes?: string[]
}

export interface SkillSpecializationRule {
  label: string
  mode: 'free_text' | 'option_set' | 'derived'
  options?: string[]
  optionSourceId?: string | null
}

export interface CostBlock {
  kind: 'ppe' | 'isp' | 'action' | 'ammo' | 'charge' | 'resource' | 'other'
  amount?: number | null
  formula?: string | null
  resourceId?: string | null
  notes?: string[]
}

export interface ActionCost {
  actions: number
  notes?: string[]
}

export interface DamageProfile {
  formula: string
  scale?: 'sdc' | 'mdc' | 'special'
  notes?: string[]
}

export interface MeasurementValue {
  value: number
  unit: string
}

export interface EquipmentSystemProfile {
  sensors?: string[]
  comms?: string[]
  environmental?: string[]
}

export interface EquipmentModeProfile {
  id: string
  label: string
  damage?: DamageProfile | null
  range?: string | null
  rateOfFire?: string | null
  payloadType?: string | null
  payloadCapacity?: number | null
  notes?: string[]
}

export interface TargetingRule {
  mode: 'self' | 'single_target' | 'multi_target' | 'area' | 'line' | 'cone' | 'vehicle_station' | 'special'
  targetTypes: TargetType[]
  notes?: string[]
}

export interface ActionProfile {
  id: string
  label: string
  targeting?: TargetingRule | null
  costs?: CostBlock[]
  actionCost?: ActionCost | null
  notes?: string[]
}

export interface SlotFilter {
  key: string
  values: string[]
  mode?: 'include' | 'exclude'
}

export interface ChoiceSlot {
  id: string
  choiceFamily: ChoiceFamily
  label: string
  count: number
  allowedEntityKinds: EntityKind[]
  allowedIds?: Identifier[]
  filters?: SlotFilter[]
  sourceLabel?: string
  requiredAtLevel?: number | null
}

export interface ModifierBase {
  id: string
  target: string
  operation: ModifierOperation
  value: number
  scope?: ModifierScope
  condition?: ConditionRef | null
  sourceLabel?: string
  notes?: string[]
}

export type Modifier = ModifierBase

export interface GrantBase {
  id: string
  kind: GrantKind
  sourceLabel?: string
  notes?: string[]
}

export interface SkillGrant extends GrantBase {
  kind: 'grant_skill'
  skillId: Identifier
  basePercent?: number | null
  fixedTotal?: boolean
}

export interface SkillChoiceGrant extends GrantBase {
  kind: 'grant_skill_choice'
  slot: ChoiceSlot
  basePercent?: number | null
  fixedTotal?: boolean
}

export interface PowerGrant extends GrantBase {
  kind: 'grant_power'
  powerId: Identifier
}

export interface PowerChoiceGrant extends GrantBase {
  kind: 'grant_power_choice'
  slot: ChoiceSlot
}

export interface SpellGrant extends GrantBase {
  kind: 'grant_spell'
  spellId: Identifier
}

export interface SpellChoiceGrant extends GrantBase {
  kind: 'grant_spell_choice'
  slot: ChoiceSlot
}

export interface AttackGrant extends GrantBase {
  kind: 'grant_attack'
  attackId: Identifier
}

export interface ResourceGrant extends GrantBase {
  kind: 'grant_resource'
  pool: ResourcePoolDefinition
}

export interface LanguageGrant extends GrantBase {
  kind: 'grant_language'
  language: string
  literacy?: boolean
  fixedPercent?: number | null
}

export interface LiteracyGrant extends GrantBase {
  kind: 'grant_literacy'
  language: string
  fixedPercent?: number | null
}

export interface EquipmentGrant extends GrantBase {
  kind: 'grant_equipment'
  equipmentId: Identifier
  quantity?: number
}

export interface VehicleAccessGrant extends GrantBase {
  kind: 'grant_vehicle_access'
  vehicleId: Identifier
  stationIds?: string[]
}

export interface PackageGrant extends GrantBase {
  kind: 'grant_package'
  packageId: Identifier
}

export interface UnlockAtLevelGrant extends GrantBase {
  kind: 'unlock_at_level'
  level: number
  grants: Grant[]
}

export type Grant =
  | SkillGrant
  | SkillChoiceGrant
  | PowerGrant
  | PowerChoiceGrant
  | SpellGrant
  | SpellChoiceGrant
  | AttackGrant
  | ResourceGrant
  | LanguageGrant
  | LiteracyGrant
  | EquipmentGrant
  | VehicleAccessGrant
  | PackageGrant
  | UnlockAtLevelGrant

export interface ResourcePoolDefinition {
  id: string
  poolType: ResourcePoolType
  label: string
  formula?: string | null
  fixedValue?: number | null
  perLevelFormula?: string | null
  ownerScope: PoolOwnerScope
  trackingMode: PoolTrackingMode
  notes?: string[]
}

export interface ProgressionTrack {
  id: string
  label: string
  levels: number[]
  grants?: Grant[]
  modifiers?: Modifier[]
  notes?: string[]
}

export interface RaceCompatibility {
  mode: 'any_occ' | 'restricted_occ' | 'rcc_required' | 'none'
  requiredRccId?: Identifier | null
  allowedOccIds?: Identifier[]
  disallowedOccIds?: Identifier[]
  notes?: string[]
}

export interface VehicleStationDefinition {
  id: string
  label: string
  role: 'pilot' | 'gunner' | 'crew' | 'passenger' | 'commander' | 'other'
  grants?: Grant[]
  actions?: ActionProfile[]
  notes?: string[]
}

export interface CompendiumRace extends CompendiumEntityBase {
  kind: 'race'
  grants: Grant[]
  modifiers: Modifier[]
  resourcePools?: ResourcePoolDefinition[]
  compatibility?: RaceCompatibility
  notes?: string[]
}

export interface PathCompendiumBase extends CompendiumEntityBase {
  grants: Grant[]
  modifiers: Modifier[]
  resourcePools?: ResourcePoolDefinition[]
  progression?: ProgressionTrack[]
  requirements?: RequirementSet
  notes?: string[]
}

export interface CompendiumRcc extends PathCompendiumBase {
  kind: 'rcc'
}

export interface CompendiumOcc extends PathCompendiumBase {
  kind: 'occ'
}

export interface CompendiumSkill extends CompendiumEntityBase {
  kind: 'skill'
  category: string
  baseFormula?: string | null
  repeatability: SkillRepeatability
  specialization?: SkillSpecializationRule | null
  prerequisites?: RequirementSet
  grants?: Grant[]
  modifiers?: Modifier[]
}

export interface CompendiumSpell extends CompendiumEntityBase {
  kind: 'spell'
  level: number | null
  cost?: CostBlock | null
  targeting?: TargetingRule | null
  castingTime?: string | null
  duration?: string | null
  range?: string | null
  notes?: string[]
}

export interface CompendiumPower extends CompendiumEntityBase {
  kind: 'power'
  powerFamily: PowerFamily
  cost?: CostBlock | null
  targeting?: TargetingRule | null
  action?: ActionProfile | null
  notes?: string[]
}

export interface CompendiumAttack extends CompendiumEntityBase {
  kind: 'attack'
  attackFamily: AttackFamily
  damage: DamageProfile
  range?: string | null
  actionCost?: ActionCost | null
  targeting?: TargetingRule | null
  notes?: string[]
}

export interface CompendiumEquipment extends CompendiumEntityBase {
  kind: 'equipment'
  equipmentFamily: EquipmentFamily
  subcategory?: string | null
  costCredits?: number | null
  mass?: MeasurementValue | null
  hands?: number | null
  eligibleSlots?: string[]
  wpCategory?: string | null
  systems?: EquipmentSystemProfile | null
  weaponModes?: EquipmentModeProfile[]
  resourcePools?: ResourcePoolDefinition[]
  grants?: Grant[]
  modifiers?: Modifier[]
  actions?: ActionProfile[]
  notes?: string[]
}

export interface CompendiumVehicle extends CompendiumEntityBase {
  kind: 'vehicle'
  vehicleFamily: string
  subcategory?: string | null
  costCredits?: number | null
  mass?: MeasurementValue | null
  crew?: number | null
  passengerCapacity?: number | null
  systems?: EquipmentSystemProfile | null
  resourcePools?: ResourcePoolDefinition[]
  stations?: VehicleStationDefinition[]
  actions?: ActionProfile[]
  modifiers?: Modifier[]
  notes?: string[]
}

export type CompendiumEntity =
  | CompendiumRace
  | CompendiumRcc
  | CompendiumOcc
  | CompendiumSkill
  | CompendiumSpell
  | CompendiumPower
  | CompendiumAttack
  | CompendiumEquipment
  | CompendiumVehicle

export interface AttributeAssignmentSet {
  IQ: number
  ME: number
  MA: number
  PS: number
  PP: number
  PE: number
  PB: number
  Spd: number
}

export interface SkillSelection {
  selectionId: string
  skillId: Identifier
  specialization?: string | null
  sourceSlotId?: string | null
}

export interface PowerSelection {
  selectionId: string
  powerId: Identifier
  sourceSlotId?: string | null
}

export interface SpellSelection {
  selectionId: string
  spellId: Identifier
  sourceSlotId?: string | null
  acquisitionSource?: string | null
}

export interface PackageSelection {
  selectionId: string
  packageId: Identifier
  sourceSlotId?: string | null
}

export interface EquipmentSelection {
  selectionId: string
  equipmentId: Identifier
  quantity?: number | null
  sourceSlotId?: string | null
  equippedSlotId?: string | null
  notes?: string[]
}

export interface LevelSelectionRecord {
  level: number
  skillSelections?: SkillSelection[]
  powerSelections?: PowerSelection[]
  spellSelections?: SpellSelection[]
  packageSelections?: PackageSelection[]
}

export interface CharacterBuild {
  schemaVersion: string
  id: string
  name: string
  raceId: Identifier | null
  rccId?: Identifier | null
  occId?: Identifier | null
  level: number
  alignment?: string | null
  attributes: AttributeAssignmentSet
  skillSelections: SkillSelection[]
  powerSelections: PowerSelection[]
  spellSelections: SpellSelection[]
  packageSelections: PackageSelection[]
  equipmentSelections: EquipmentSelection[]
  levelSelections: LevelSelectionRecord[]
  notes?: string
}

export interface InventoryStateRecord {
  itemId: Identifier
  quantity?: number
  currentPools?: Record<string, number>
  charges?: Record<string, number>
  notes?: string
}

export interface VehicleAssignmentRecord {
  vehicleId: Identifier
  stationId?: string | null
  actorIds?: Identifier[]
}

export interface ActionLogEntry {
  id: string
  actionId?: string | null
  label: string
  timestamp?: string | null
  notes?: string[]
}

export interface PlayState {
  schemaVersion: string
  actorId: Identifier
  currentPools: Record<string, number>
  inventoryState?: InventoryStateRecord[]
  vehicleAssignments?: VehicleAssignmentRecord[]
  actionLog?: ActionLogEntry[]
  notes?: string
}

export interface TimeState {
  campaignDay?: number | null
  round?: number | null
  timestampLabel?: string | null
}

export interface SceneState {
  id?: string
  label?: string
  locationId?: string | null
  ambientMagicState?: string | null
  notes?: string[]
}

export interface EnvironmentalCondition {
  id: string
  kind: string
  label: string
  modifiers?: Modifier[]
  notes?: string[]
}

export interface WorldEffectRecord {
  id: string
  label: string
  targetIds?: Identifier[]
  modifiers?: Modifier[]
  notes?: string[]
}

export interface WorldState {
  schemaVersion: string
  id: string
  time: TimeState
  scene?: SceneState | null
  environmentalConditions: EnvironmentalCondition[]
  activeEffects: WorldEffectRecord[]
  notes?: string
}

export interface TargetReference {
  targetType: TargetType
  targetId: Identifier
  locationId?: string | null
}

export interface ActionDeclaration {
  id: string
  actorId: Identifier
  sourceType: 'spell' | 'power' | 'attack' | 'equipment' | 'vehicle' | 'effect'
  sourceId: Identifier
  mode?: string | null
  costs?: CostBlock[]
  targets: TargetReference[]
  notes?: string[]
}

export interface ResolvedPool {
  id: string
  poolType: ResourcePoolType
  label: string
  maxValue?: number | null
  currentValue?: number | null
  formula?: string | null
  sourceLabels?: string[]
  notes?: string[]
}

export interface ResolvedSkill {
  selectionId?: string | null
  skillId: Identifier
  name: string
  category: string
  specialization?: string | null
  total?: number | null
  sourceLabels?: string[]
  notes?: string[]
}

export interface ResolvedPower {
  powerId: Identifier
  name: string
  powerFamily: PowerFamily
  sourceLabels?: string[]
  notes?: string[]
}

export interface ResolvedSpell {
  spellId: Identifier
  name: string
  level?: number | null
  acquisitionSource?: string | null
  sourceLabels?: string[]
  notes?: string[]
}

export interface ResolvedAttack {
  attackId: Identifier
  name: string
  attackFamily: AttackFamily
  damage: DamageProfile
  sourceLabels?: string[]
  notes?: string[]
}

export interface ResolvedEquipment {
  selectionId?: string | null
  equipmentId: Identifier
  name: string
  equipmentFamily: EquipmentFamily
  quantity: number
  subcategory?: string | null
  equippedSlotId?: string | null
  eligibleSlots?: string[]
  wpCategory?: string | null
  sourceLabels?: string[]
  notes?: string[]
}

export interface AppliedModifier extends ModifierBase {
  appliedValue: number
}

export interface ValidationIssue {
  id: string
  severity: 'info' | 'warning' | 'error'
  scope: 'build' | 'play' | 'world' | 'resolver'
  message: string
  notes?: string[]
}

export interface ExplanationRecord {
  id: string
  target: string
  label: string
  sourceLabels: string[]
  notes?: string[]
}

export interface ResolvedActor {
  actorId: Identifier
  actorType: ActorType
  name: string
  sourceRefs: SourceRef[]
  pools: ResolvedPool[]
  skills: ResolvedSkill[]
  powers: ResolvedPower[]
  spells: ResolvedSpell[]
  attacks: ResolvedAttack[]
  equipment: ResolvedEquipment[]
  modifiers: AppliedModifier[]
  availableChoices: ChoiceSlot[]
  validation: ValidationIssue[]
  explanations: ExplanationRecord[]
}

export type ResolvedCharacter = ResolvedActor & {
  actorType: 'character'
}

export function createEmptyCharacterBuild(): CharacterBuild {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: 'new-character',
    name: '',
    raceId: null,
    rccId: null,
    occId: null,
    level: 1,
    alignment: null,
    attributes: {
      IQ: 10,
      ME: 10,
      MA: 10,
      PS: 10,
      PP: 10,
      PE: 10,
      PB: 10,
      Spd: 10,
    },
    skillSelections: [],
    powerSelections: [],
    spellSelections: [],
    packageSelections: [],
    equipmentSelections: [],
    levelSelections: [],
    notes: '',
  }
}

export function createEmptyPlayState(actorId: Identifier): PlayState {
  return {
    schemaVersion: SCHEMA_VERSION,
    actorId,
    currentPools: {},
    inventoryState: [],
    vehicleAssignments: [],
    actionLog: [],
    notes: '',
  }
}

export function createEmptyWorldState(): WorldState {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: 'default-world',
    time: {},
    scene: null,
    environmentalConditions: [],
    activeEffects: [],
    notes: '',
  }
}
