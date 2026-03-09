# Rifts V2 Project Bible

Date: 2026-03-09

Status:
- First draft
- Architecture direction, not final schema contract
- Intended to govern an incremental rebuild, not a stop-the-world rewrite

Purpose:
- Define the target architecture for the next version of the app.
- Preserve the rules and content work already completed in the current app.
- Create a model that can absorb future systems without collapsing back into ad hoc runtime patches.

This document is the governing design for:
- character creation
- character progression
- character sheet generation
- play-state tracking
- compendium growth
- future shared systems like GM tools, environmental effects, time, battle simulation, super powers, targeting, and multi-user vehicles

## 1. Why V2 Exists

The current app works and has become substantially better, but it reflects the history of how it was built:
- state mixes build choices, computed outcomes, migration shims, and live-play tracking
- multiple domains use partially different modeling styles
- some rules are structured and enforceable while others still live in prose or compatibility layers
- adding new capabilities tends to push more responsibility into the same context and sheet components

This is acceptable for a growing v1. It is not a stable foundation for the next stage.

The next stage is broader than OCC/RCC cleanup. The app is expected to grow into:
- deeper Rifts character support
- better campaign and GM support
- more action-aware play tools
- additional Palladium systems such as Heroes Unlimited super powers and Conversion Book integrations

V2 exists to make those additions normal instead of expensive.

## 2. Product Direction

V2 is not "a better sheet page."

V2 is a rules-and-state platform for Palladium-style play that should support:
- character build legality
- structured progression
- clear sheet output
- live play tracking
- campaign/world state
- GM-controlled environmental and temporal effects
- multiplayer/shared entities

The app should remain opinionated:
- enforce clear printed rules where possible
- expose GM-judgment areas explicitly
- avoid pretending to simulate every table ruling

## 3. Non-Negotiable Constraints

These are hard constraints for V2.

1. Do not discard current content work.
- Existing OCCs, RCCs, races, spells, psionics, skills, and equipment are valuable source material.
- V2 must ingest current content, even if the normalized target schema is different.

2. Do not rebuild around UI behavior.
- The UI must consume resolved data.
- The UI must not become the place where rules are invented or stitched together.

3. Build state and play state must be separate.
- Character creation choices are not the same as current combat/resource tracking.

4. The system must support future multi-actor and campaign-level state.
- Characters cannot be the only meaningful entity in the model.

5. The rules engine must be explainable.
- For any computed result, the app should be able to show where it came from.

6. V2 must be incrementally adoptable.
- The migration should be strangler-pattern, not "throw v1 away and start over."

## 4. Design Principles

1. Content is data.
- Compendium entries should be machine-readable first, prose second.

2. Choices are data.
- A saved character should primarily store what was chosen, not every derived consequence.

3. Resolution is pure.
- The resolver should be deterministic for a given compendium snapshot, build document, and play state.

4. Every rule belongs to a domain.
- Skills, powers, attacks, resources, effects, and progression are distinct concepts and should not be collapsed into one loose bucket.

5. Shared patterns should be modeled once.
- Skill choices, power choices, progression milestones, modifiers, attacks, and resource pools should not each invent their own private micro-language.

6. Future systems should extend the same architecture.
- GM world state, targeting, supers, vehicles, and battle simulation should plug into V2, not require V3.

## 5. Target Capability Envelope

V2 must be able to support the current app plus these future directions.

### Current parity targets

Must preserve:
- ancient vs modern W.P. handling
- repeatable/specialized skills
- OCC ability skills
- spell acquisition channels
- racial psionics
- RCC/OCC handoff
- dragon body MDC, attacks, psionics, spell progression
- grouped sheet skill display
- current equipment and vehicle tracking

### Planned future systems

Must be architecturally ready for:
- GM tools
- campaign/world state
- environmental modifiers that affect many actors
- time passage and scheduled changes
- action targeting
- spell and power targeting
- multi-user vehicles and crew roles
- battle simulation support
- super powers from Heroes Unlimited and Conversion Book 1
- additional power systems beyond magic and psionics

### Important implication

The architecture cannot assume:
- one actor equals one player character
- powers only come from OCC psionics or spells
- vehicles are single-owner gear
- only the sheet needs resolved data

## 6. Core V2 Layers

V2 should be built as explicit layers.

### A. Compendium Layer

Canonical content only.

Contains:
- races
- RCCs
- OCCs
- skills
- powers
- spells
- attacks
- equipment
- vehicles
- source references

Rules:
- no UI-specific fields
- no persisted player selections
- no sheet formatting strings when structured data is possible
- everything should validate cleanly against schema

### B. Character Build Layer

Player-authored choices only.

Contains:
- identity
- selected race
- selected RCC/OCC path
- rolled/assigned attributes
- chosen skills
- chosen powers
- chosen spells
- level-up choices
- selected packages/tracks/bundles

Does not contain:
- computed skill totals
- computed save totals
- expanded combat stats
- current PPE/ISP/MDC values

### C. Resolver Layer

Pure rules resolution.

Inputs:
- compendium snapshot
- character build

Outputs:
- resolved character
- validation results
- available next choices
- rule explanations

This is the core of the app.

### D. Play State Layer

Table-use tracking and consumable current values.

Contains:
- current PPE
- current ISP
- current HP/SDC/MDC pools
- armor condition
- ammunition / charges
- temporary pool changes
- cast/use log
- active vehicle selection

This is not character creation state.

### E. World State Layer

Campaign or GM-controlled context that affects one or many actors.

Contains:
- time
- location
- ambient magic/ley line state
- weather
- environmental hazards
- scene modifiers
- shared temporary effects
- encounter state
- actor relationships

This layer is the entry point for future GM tools.

### F. Action / Targeting Layer

A generic model for "something is being used on something."

Supports:
- spell casts
- psionic use
- attacks
- activated equipment
- vehicle systems
- environmental effects

This is the layer that future spell targets, vehicle crew actions, and battle simulation should use.

### G. Presentation Layer

Builder, sheet, GM views, combat views, vehicle views, campaign tools.

Rules:
- presentation consumes resolved models
- presentation can request actions and state changes
- presentation does not own rules semantics

## 7. First-Class Domain Objects

V2 should define these objects explicitly.

- `CompendiumRace`
- `CompendiumRcc`
- `CompendiumOcc`
- `CompendiumSkill`
- `CompendiumSpell`
- `CompendiumPower`
- `CompendiumAttack`
- `CompendiumEquipment`
- `CompendiumVehicle`
- `ChoiceSlot`
- `Grant`
- `Modifier`
- `ResourcePoolDefinition`
- `ProgressionTrack`
- `CharacterBuild`
- `ResolvedCharacter`
- `PlayState`
- `WorldState`
- `Actor`
- `VehicleCrewAssignment`
- `ActionDeclaration`
- `TargetReference`

Important modeling rule:
- `Actor` is broader than `Character`
- a vehicle, summoned being, NPC, mount, or environmental hazard may become a rules-relevant actor later

## 8. Rule Representation

V2 should stop scattering rules across unrelated ad hoc fields wherever possible.

The core rule language should be a typed grant/effect model, not a universal free-form DSL.

### Recommended grant families

- `grantSkill`
- `grantSkillChoice`
- `grantPower`
- `grantPowerChoice`
- `grantSpell`
- `grantSpellChoice`
- `grantAttack`
- `grantResource`
- `grantLanguage`
- `grantLiteracy`
- `grantPackage`
- `grantEquipment`
- `grantVehicleAccess`
- `unlockAtLevel`
- `applyModifier`

### Recommended modifier families

- attribute modifiers
- combat modifiers
- save modifiers
- skill modifiers
- power modifiers
- spell modifiers
- movement modifiers
- perception modifiers
- pool modifiers
- action-cost modifiers

### Why this matters

This same model should describe:
- OCC skill packages
- racial attacks
- super power packages
- vehicle crew stations
- environmental penalties
- ley line amplification
- timed GM effects

## 9. Resource and Pool Model

V2 should treat pools as first-class, typed objects.

Examples:
- HP
- SDC
- Body MDC
- Armor MDC
- Force Field MDC
- PPE
- ISP
- vehicle power/fuel if added later

Each pool should support:
- source definition
- max value
- current value
- formula explanation
- regeneration or recovery rules
- source ownership

This prevents special-case handling for body MDC, PPE, ISP, armor MDC, and future pool types.

## 10. Skill Model

V2 should preserve the distinction between:
- canonical skills
- skill instances
- OCC/racial ability-skills

### Canonical skills

Shared compendium entries:
- name
- category
- base formula
- repeatability
- specialization rules
- prerequisites
- tags

### Skill instances

Chosen or granted skills on a character:
- base skill reference
- specialization
- source
- applied bonuses
- derived total

### Ability-skills

OCC/racial mechanical abilities that resemble skills but are not part of normal skill economy.

Examples:
- `Eyeball a Fella`
- `Recognize Machine Quality`
- `Trail Blazing`

These should never be forced into the same bucket as globally selectable skills.

## 11. Powers Model

V2 must not assume one power system.

The model must support at least:
- psionics
- magic spells
- super powers
- racial innate powers
- device-granted powers
- vehicle systems

Recommended split:

- `PowerDefinition`
  - active capability with cost, range, duration, targeting, effects
- `PowerAcquisition`
  - why/how the actor has it
- `PowerList`
  - source catalog or package

This is the only sane way to support Heroes Unlimited style powers later without grafting them awkwardly into the spell/psionics pipeline.

## 12. Attacks and Actions

V2 should make natural attacks, weapon attacks, spells, and powers compatible at the action layer.

### Attack model

An attack should support:
- source
- scale
- damage expression
- range
- rate limits
- attack type
- action cost
- targeting rules

### Action model

An action should support:
- actor
- source ability/item/system
- declared mode
- targets
- costs
- modifiers from world state and actor state
- result log

This is what future battle simulation and spell targeting need.

## 13. World State and GM Tools

This must be a native V2 concern, not a later bolt-on.

### World state should support

- current campaign time
- elapsed time operations
- scene/location context
- environmental conditions
- ambient magic state
- special event flags
- shared encounter effects
- GM annotations

### Environmental effects should be able to affect

- one character
- many characters
- vehicles
- summons or NPCs
- the whole scene

Examples:
- on a ley line
- eclipse event
- underwater
- radiation
- dimensional distortion
- battlefield morale effect

### GM tools should eventually be able to

- set world conditions
- advance time
- apply scene-wide effects
- create encounter actors
- assign targets
- simulate action sequences

The key architectural lesson:
- GM state belongs to `WorldState`, not inside individual character documents

## 14. Multi-User Vehicles

Vehicles must become first-class shared entities.

The v1 model treats vehicles mostly like advanced gear. That is not enough for multi-user play.

V2 should model vehicles with:
- their own pools and systems
- crew stations
- role assignments
- controlled actions by station
- cargo/inventory
- damage state by location/system if needed later

Suggested concepts:
- `VehicleEntity`
- `VehicleCrewAssignment`
- `VehicleStation`
- `VehicleAction`

This supports:
- pilots
- gunners
- passengers
- crew-specific actions
- vehicle targeting and battle simulation

## 15. Time Model

Time passage should be a real system, not just a note field.

V2 should support:
- advancing rounds
- advancing minutes/hours/days
- scheduled recovery/regeneration
- timed spell effects
- ambient/event windows
- training/research clocks if ever desired

Recommended model:
- world state owns canonical time
- effects and recoveries reference elapsed time
- play state stores the last resolved timestamp for actor-specific regeneration if needed

This is necessary groundwork for:
- recovery
- spell durations
- battle sequencing
- GM tools

## 16. Targeting Model

Targeting should be generic and reusable.

V2 should support:
- self
- single actor
- multiple actors
- area/zone
- vehicle
- vehicle location/station/system
- item/object if needed later

This is important for:
- spell target selection
- psionic power targeting
- weapon fire
- environmental effects
- future combat sim

Do not hardcode spell target selection as a spell-only concern.

## 17. Supers and Additional Systems

Heroes Unlimited and Conversion Book 1 support should be treated as an architectural forcing function now.

That means V2 must not assume:
- powers are only psionic or magical
- class/race is the only source of abilities
- progression always follows OCC/RCC structure

Recommended approach:
- model super powers as another acquisition system on top of the same grant/effect core
- keep source/system tags so a character can meaningfully include content from multiple books

Examples of future acquisition sources:
- OCC
- RCC
- race
- psionics
- spellcasting
- super powers
- mutations
- cybernetics
- bio-systems
- devices
- vehicles

## 18. Character Document Model

V2 should persist at least two separate documents.

### CharacterBuild

Contains:
- identity
- source selections
- attributes
- choice selections
- progression choices
- package selections

### PlayState

Contains:
- current pools
- damage
- ammo
- active effects
- action log
- currently crewed vehicle

Optional later:
- `SheetPreferences`
- `LocalUiState`

Important rule:
- collapse state, panel preferences, and display options should not pollute build or play state

## 19. Resolver Stages

The resolver should have a stable, documented order.

Recommended sequence:

1. load compendium entities
2. resolve race / RCC / OCC base packages
3. apply selected bundles and tracks
4. collect first-level grants and required choices
5. apply level progression grants
6. resolve skills and skill instances
7. resolve powers
8. resolve spells
9. resolve attacks
10. resolve resource pools
11. apply modifiers
12. validate legality
13. generate explanations
14. build view models

This sequence matters because future systems like supers, environment, and vehicles will need deterministic interaction points.

## 20. Explainability

This should be a first-class feature in V2.

Every resolved value should be able to expose:
- sources
- modifiers
- formulas
- gating conditions
- unresolved GM decisions if any

Examples:
- why a skill total is 63%
- why a dragon has this body MDC
- why a spell is allowed
- why a power is unavailable
- why a vehicle station grants a particular action

Without this, the app will become increasingly hard to trust as rules depth grows.

## 21. Compatibility and Migration

V2 should be built with a migration adapter layer, not a data reset.

### Migration rule

Current published content remains authoritative source material during the transition.

### Migration strategy

1. Define the normalized V2 compendium schema.
2. Build adapters from current content files into V2 normalized entities.
3. Build the new resolver against normalized content.
4. Run parity fixtures against known current characters.
5. Cut UI surfaces over one at a time.
6. Retire compatibility shims only after parity is proven.

### Content sources to preserve

- OCC data
- race/RCC data
- spells
- psionics
- skills and metadata
- equipment
- vehicles

### Current app work that must be carried forward

- structured W.P. filtering
- structured repeatable skills
- structured racial psionics
- OCC ability skills
- structured spell acquisition
- dragon-specific fixes
- improved sheet organization

## 22. Proposed V2 Build Plan

### Phase 0: Architecture lock

Deliver:
- this bible
- V2 schema spec
- V2 migration plan

### Phase 1: Normalized compendium

Deliver:
- normalized entity shapes
- adapters from current content
- content validation pipeline

### Phase 2: New resolver core

Deliver:
- pure resolver package
- explanation/breakdown support
- parity fixtures for representative characters

### Phase 3: Character document split

Deliver:
- `CharacterBuild`
- `PlayState`
- migration from current saved characters

### Phase 4: Builder cutover

Deliver:
- resolver-driven choice slots
- builder screens consuming V2 resolver outputs

### Phase 5: Sheet cutover

Deliver:
- resolved sheet model
- separated play-state editing

### Phase 6: World and GM foundation

Deliver:
- `WorldState`
- environmental effects
- time advancement primitives

### Phase 7: Shared entities and vehicles

Deliver:
- first-class vehicles
- crew assignments
- shared action support

### Phase 8: Additional systems

Deliver:
- super power subsystem
- targeting framework
- combat/action simulation support

## 23. Testing Strategy

V2 needs more than unit tests.

Required test layers:
- schema validation
- compendium adapter tests
- resolver unit tests
- golden character parity tests
- migration tests for old saves
- UI smoke tests

Representative parity fixtures should include:
- Burster
- Ley Line Walker
- Mystic
- Shifter
- Techno-Wizard
- Rogue Scientist
- Vagabond
- Great Horned Dragon Hatchling
- Noro plus non-psionic OCC
- Elf
- Dwarf
- one heavy vehicle user

## 24. Out of Scope for Initial V2

Not required for the first V2 cut:
- full tactical combat engine
- universal temporary-effect automation
- economy simulation
- full teacher/training/reputation systems
- full NPC/monster bestiary support
- complete encounter simulation UI

These should remain possible, but they are not required for V2 foundation readiness.

## 25. Success Criteria

V2 is successful if:
- current content can be migrated without major data loss
- rules are easier to add than in v1
- build state and play state are cleanly separated
- characters, vehicles, and future actors can share common rules infrastructure
- the app can support GM world-state features without rewriting character logic
- the system can absorb super powers and targeting without inventing another architecture later

## 26. Immediate Follow-Up Documents

This bible should be followed by:

1. `rifts-v2-schema-spec.md`
- exact entity shapes
- grant/modifier types
- persisted document structures

2. `rifts-v2-migration-plan.md`
- mapping from current files and runtime systems into V2
- adapter strategy
- milestone and cutover order

3. `rifts-v2-parity-checklist.md`
- every current behavior that must survive migration
- including the OCC/RCC and sheet/runtime improvements already completed

## 27. Decision Summary

V2 should be:
- compendium-driven
- resolver-centered
- actor-aware
- world-state-aware
- action-capable
- migration-friendly

It should not be:
- another bigger React context
- a sheet-led rules engine
- a one-off rewrite that discards current data
- a character-only model with GM systems bolted on later
