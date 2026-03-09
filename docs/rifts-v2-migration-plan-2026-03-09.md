# Rifts V2 Migration Plan

Date: 2026-03-09

Status:
- First concrete draft
- Supports Phase 1 and Phase 2 execution

Purpose:
- map current `rifts-app` content and runtime systems into V2
- define the adapter strategy
- define parity checkpoints
- prevent content loss during the move to the new architecture

## 1. Migration Strategy

The migration should be adapter-driven, not rewrite-driven.

That means:
- V1 remains the authoritative source corpus during transition.
- V2 normalizes data from v1 into its own contracts.
- The resolver works on normalized V2 entities.
- UI surfaces are cut over only after resolver parity exists.

This avoids:
- reauthoring all content by hand
- binding V2 to the old runtime model
- losing the rules corrections already made in v1

## 2. Source Systems in V1

Primary content sources in `rifts-app`:
- `src/data/published.races.json`
- `src/data/published.occs.json`
- `src/data/skills.js`
- `src/data/skills.v1.generated.js`
- `src/data/skills.metadata.generated.js`
- `src/data/spells*`
- `src/data/psionics*`
- `src/data/equipment*`

Primary runtime sources in `rifts-app`:
- `src/engine/*`
- `src/context/CharacterContext.jsx`
- `src/utils/effectiveOcc.js`
- `src/utils/skillGrants.js`

## 3. Migration Principle

Migrate in this order:

1. compendium contracts
2. compendium adapters
3. resolver
4. parity fixtures
5. builder
6. sheet
7. play-state tools
8. world/GM systems

Do not invert that order.

## 4. Entity Mapping

### Races

V1 source:
- `published.races.json`

V2 target:
- `CompendiumRace`

Important notes:
- some current v1 race entries are actually race entities with RCC handoff requirements
- V2 should preserve that as race compatibility metadata, not flatten it away

### RCCs and OCCs

V1 source:
- `published.occs.json`

V2 target:
- `CompendiumRcc`
- `CompendiumOcc`

Decision:
- map `kind: "RCC"` to `CompendiumRcc`
- map `kind: "OCC"` to `CompendiumOcc`

### Skills

V1 sources:
- `skills.js`
- generated skill payloads and metadata

V2 target:
- `CompendiumSkill`

Decision:
- the V2 adapter should preserve repeatability, specialization metadata, and category identity
- prerequisite semantics may need a curated pass after first import

### Spells

V1 source:
- spell data modules and OCC spell config

V2 target:
- `CompendiumSpell`

Decision:
- spell definitions and spell acquisition rules are separate migration concerns

### Powers

V1 source:
- psionics data modules
- OCC/race psionics blocks

V2 target:
- `CompendiumPower`

Decision:
- power definitions migrate separately from acquisition/progression packages

### Equipment and Vehicles

V1 source:
- equipment data modules

V2 target:
- `CompendiumEquipment`
- `CompendiumVehicle`

Decision:
- vehicles should become first-class entities in V2, even if v1 still treats them partly like advanced inventory

## 5. Runtime Mapping

### V1 mixed state

Current V1 state mixes:
- build choices
- play-state tracking
- migration shims
- runtime selections

### V2 split

The migration must separate this into:
- `CharacterBuild`
- `PlayState`
- later `WorldState`

This is a non-negotiable architectural move, not an optional cleanup.

## 6. Adapter Policy

Adapters should be:
- pure
- explicit
- lossy only when documented
- allowed to preserve unresolved detail in `notes`

Adapters should not:
- depend on React
- depend on the v1 runtime
- embed filesystem assumptions into package runtime

That means:
- local import scripts may read from the v1 repo
- core adapter functions should operate on passed-in raw content, not on hardcoded local paths

## 7. Adapter Sequencing

The first adapter slice covered:
- races
- RCCs
- OCCs
- skills

Reason:
- those four define most character legality and structure
- they also exercise grants, modifiers, requirements, pools, and compatibility

The current next adapter slice adds:
- canonical equipment catalog normalization
- first-class vehicle entities from the same source catalog
- `CharacterBuild` equipment selections and resolved loadout output

This slice still does not fully solve:
- spell definitions
- full psionic definitions
- OCC starting gear packages expressed only as prose
- vehicle crew station behavior

Those follow once the entity and resolver patterns are proven and the catalog import path is stable.

## 8. What Must Survive the Migration

The adapter layer must preserve these already-working v1 behaviors:
- ancient vs modern W.P. distinctions
- repeatable skills
- specialization-aware skill picks
- racial psionics
- OCC ability skill support
- spell acquisition channel metadata
- RCC/OCC race handoff
- dragon-specific resource and progression modeling
- equipment catalog identity, weapon modes, and armor/vehicle MDC pools

If a V2 adapter cannot preserve a behavior yet, it must mark that gap explicitly.

## 9. Known Transitional Simplifications

Allowed in early V2 adapters:
- preserve some hard-to-model prose as `notes`
- preserve some unresolved requirement nuance as `RequirementSet.notes`
- treat some v1 raw names as temporary ids until canonical id normalization is finished

Not allowed:
- silently dropping structured v1 mechanics
- rebuilding content manually when a direct adapter is feasible

## 10. Parity Fixtures

The migration plan depends on fixtures, not general confidence.

Initial fixture set:
- Burster
- Ley Line Walker
- Mystic
- Techno-Wizard
- Shifter
- Rogue Scientist
- Vagabond
- Great Horned Dragon Hatchling
- Noro + mundane OCC
- Elf
- Dwarf

Each fixture should eventually compare:
- base legality
- resolved resources
- resolved skills
- resolved powers/spells
- resolved attacks
- notable structured rules

## 11. Migration Milestones

### Milestone A
- schema contracts implemented
- first adapters implemented

### Milestone B
- normalized registries can load representative content

### Milestone C
- resolver can resolve a first fixture from normalized data

### Milestone D
- parity reports exist for first fixture set

### Milestone E
- first V2 builder flow consumes resolver choice slots

### Milestone F
- first V2 sheet consumes resolved actors and play state

## 12. Immediate Next Steps

1. implement first adapter functions in `packages/compendium`
2. add registry structures for normalized entities
3. create the first sample import path from v1 race/OCC/skill payloads
4. create parity fixture definitions in `tests/fixtures`
5. start the first resolver pass in `packages/rules-engine`
