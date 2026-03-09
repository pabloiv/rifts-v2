# Rifts V2 Alpha Roadmap

Date: 2026-03-09

Status:
- Working roadmap for the first browser-testable V2
- Aligned with the V2 project bible, master plan, schema spec, and migration plan
- Intended to minimize intervention while keeping the build sequence explicit
- Current implementation state:
  - `M1 Resolver Core`: complete
  - `M2 Powers and Magic`: complete for normalized import plus resolver output
  - `M3 Combat Surface`: complete
  - `M4 Fixture Viewer App`: complete
  - `M5 Editable Alpha`: next

Related documents:
- [rifts-v2-project-bible-2026-03-09.md](/home/pablo/rifts-v2/docs/rifts-v2-project-bible-2026-03-09.md)
- [rifts-v2-master-plan-2026-03-09.md](/home/pablo/rifts-v2/docs/rifts-v2-master-plan-2026-03-09.md)
- [rifts-v2-schema-spec-2026-03-09.md](/home/pablo/rifts-v2/docs/rifts-v2-schema-spec-2026-03-09.md)
- [rifts-v2-migration-plan-2026-03-09.md](/home/pablo/rifts-v2/docs/rifts-v2-migration-plan-2026-03-09.md)

## Goal

Reach a first V2 build that can be tested in a browser against real imported Rifts content.

This alpha does not need full parity. It does need to prove that the V2 architecture can:
- import the current compendium corpus
- resolve real characters through typed rules
- expose legality and explanation output
- present a minimal but useful browser surface for inspection

## Alpha Definition

The first meaningful alpha is complete when V2 can:
- load a normalized snapshot from `rifts-app`
- resolve at least six representative fixtures
- show pools, skills, modifiers, equipment, attacks, powers, and spells where supported
- show validation issues and explanation records
- allow limited interactive editing of a character build document in the browser

## Milestones

### M1. Resolver Core

Scope:
- level-aware grant resolution
- progression modifier resolution
- basic legality checks
- basic skill total computation
- equipment/loadout resolution

Exit criteria:
- resolver handles level-sensitive sources
- illegal skill picks fail with understandable validation
- imported fixtures show different outcomes at different levels

Status:
- In progress
- Current slice includes progression modifiers, skill prerequisite validation, slot legality checks, and basic skill totals

### M2. Powers and Magic

Scope:
- import psionic power catalog
- import spell catalog
- resolve direct race/OCC/RCC powers and spells
- carry forward acquisition metadata from V1

Exit criteria:
- `Noro`, `Mystic`, `Ley Line Walker`, and dragon fixtures show real resolved powers and/or spells
- choice slots for power/spell picks appear in the resolver output

Status:
- Complete for alpha foundation
- Canonical powers and spells are imported
- custom OCC powers/spells are normalized as V2 entities
- race/OCC/RCC power and spell grants now resolve in the rules engine
- fixture coverage includes direct racial powers and selected Mystic powers/spells

### M3. Combat Surface

Scope:
- normalize natural attacks
- resolve direct attacks from races/OCCs/RCCs
- expose weapon attack modes from equipment as resolved attacks or action-ready entries

Exit criteria:
- dragon fixture shows natural attacks
- armed mundane fixture shows usable weapon modes in the resolved output

Status:
- Complete for alpha foundation
- natural attacks are imported as attack entities and granted through source content
- equipped weapons expose resolved attack rows from weapon modes
- parity snapshot now shows attack counts and attack samples

### M4. Fixture Viewer App

Scope:
- replace the scaffold web page with a simple resolver UI
- fixture selector
- compendium summary
- resolved output panels
- validation panel
- explanation panel

Exit criteria:
- browser UI can inspect imported fixture characters without editing JSON by hand

Status:
- Complete for alpha foundation
- committed demo snapshot generation is in place for browser-safe testing
- the web app now resolves imported fixtures in-browser and shows:
  - compendium summary
  - validation output
  - available choices
  - resources and modifiers
  - skills
  - powers
  - spells
  - attacks
  - equipment

### M5. Editable Alpha

Scope:
- minimal build editor for:
  - name
  - race
  - RCC/OCC
  - level
  - skill selections
  - equipment selections
- local re-resolution on edit

Exit criteria:
- a mundane character can be created and adjusted entirely inside V2

## Representative Alpha Fixtures

These are the target fixtures for alpha confidence:
- Great Horned Dragon Hatchling
- Noro + Operator
- Ley Line Walker
- Mystic
- Rogue Scientist
- Burster

Secondary fixtures:
- one intentionally invalid builder case
- one equipment-heavy mundane case

## Out of Scope For Alpha

Not required before first testing:
- full play-state editing
- GM world state tools
- battle simulation
- vehicle stations and multi-user vehicle logic
- super powers
- spell target selection UI
- full OCC starting gear normalization from prose

## Current Immediate Sequence

1. Build `M5` limited editor on top of the fixture viewer and current resolver output.
2. Keep parity fixtures current as the editable build document grows.

## Success Standard

The first testable alpha is good enough when:
- it is obviously narrower than V1
- it is obviously cleaner and easier to reason about than V1
- it can resolve a handful of representative characters correctly enough to expose the architecture’s strengths
- adding the next systems feels like extension, not rework
