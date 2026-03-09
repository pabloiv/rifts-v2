# Rifts V2 Master Plan

Date: 2026-03-09

Status:
- First draft
- Execution plan derived from the V2 project bible
- Intended to guide roadmap, repo structure, milestones, and sequencing

Primary source documents:
- [rifts-v2-project-bible-2026-03-09.md](/home/pablo/rifts-v2/docs/rifts-v2-project-bible-2026-03-09.md)
- [rifts-v2-schema-spec-2026-03-09.md](/home/pablo/rifts-v2/docs/rifts-v2-schema-spec-2026-03-09.md)
- [rifts-v2-migration-plan-2026-03-09.md](/home/pablo/rifts-v2/docs/rifts-v2-migration-plan-2026-03-09.md)

Purpose:
- Convert the V2 architecture into a buildable plan.
- Preserve what has already been achieved in v1.
- Sequence the work so V2 becomes useful early without locking the project into another ad hoc runtime.

## 1. Executive Summary

Rifts V2 should be built as a staged platform program, not as a "new sheet page" and not as a full rewrite done in isolation.

The correct strategy is:
- lock the architecture first
- define typed schemas and resolver stages
- build adapters from the current app's content
- prove parity on representative characters
- then cut over builder, sheet, and play-state surfaces in slices

This plan assumes:
- v1 remains live and continues to receive necessary fixes
- v2 becomes the new architecture target
- current content in `rifts-app` remains the reference corpus during migration

## 2. Program Goals

### Primary goals

1. Preserve current rules/content progress.
2. Replace mixed v1 state with clean V2 domain boundaries.
3. Build a resolver-centered system that is explainable and extensible.
4. Reach parity on current core character functionality.
5. Make future systems normal to add:
- GM tools
- world state
- time passage
- targeting
- shared vehicles
- super powers

### Non-goals for initial V2 foundation

- full tactical combat sim
- full encounter engine
- economy simulation
- universal every-case temporary effect engine
- complete NPC/monster tooling

## 3. Strategic Approach

V2 should follow a strangler pattern.

That means:
- keep v1 as the reference implementation and live product
- build V2 in a separate repo and architecture
- import and normalize v1 content instead of rewriting it by hand
- define parity checkpoints before UI cutover

This avoids two failure modes:
- rebuilding too much before proving rules parity
- dragging v1 architectural debt into v2 unchanged

## 4. Workstreams

The master plan is organized into eight workstreams.

### A. Architecture and Governance

Purpose:
- lock decisions early enough that implementation does not fork into competing models

Deliverables:
- project bible
- schema spec
- migration plan
- master plan
- parity checklist
- glossary/domain model reference

### B. Schema and Contracts

Purpose:
- define the target entity and document shapes

Deliverables:
- normalized compendium entity contracts
- `CharacterBuild`
- `PlayState`
- `WorldState`
- `ResolvedActor` / `ResolvedCharacter`
- grant/modifier contracts
- action/target contracts

### C. Compendium Normalization

Purpose:
- adapt current content into V2-ready entities

Deliverables:
- import adapters from v1 content files
- normalized compendium registry
- validation pipeline
- source-reference preservation
- equipment and vehicle catalog normalization as first-class entities

### D. Resolver Core

Purpose:
- create the pure rules engine over normalized entities and build documents

Deliverables:
- resolver stages
- pool resolution
- skill resolution
- power/spell resolution
- attacks
- modifier engine
- explanations/breakdowns
- legality validation

### E. Parity Harness

Purpose:
- prove V2 is correct before UI cutover

Deliverables:
- golden character fixtures
- parity comparison scripts
- known-gap ledger
- migration fixtures from v1 saved characters

### F. Web App and UX

Purpose:
- deliver the V2 builder/sheet/GM client on top of the new backend model

Deliverables:
- shell app
- builder screens
- sheet screens
- play-state editors
- GM/world-state screens later

### G. Future Systems Foundation

Purpose:
- establish the primitives required for later features without fully implementing them yet

Deliverables:
- world state model
- time model
- action/target model
- vehicle entity model
- support for additional power systems

### H. Cutover and Migration

Purpose:
- transition from reference-only V2 to primary app

Deliverables:
- content import pipeline
- save migration strategy
- cutover criteria
- deprecation plan for v1 runtime assumptions

## 5. Phased Delivery Plan

The work should ship in phases. These phases are ordered intentionally.

### Phase 0: Governance Lock

Goal:
- stop architectural drift before deeper implementation begins

Deliverables:
- finalize the bible
- write the master plan
- write the first real schema spec
- write the first real migration plan
- define parity fixture set

Exit criteria:
- no major unresolved argument about core layer boundaries
- no implementation work proceeds against contradictory models

### Phase 1: Minimum V2 Contracts

Goal:
- create typed contracts for the essential V2 entities

Deliverables:
- schema package with:
  - entity base types
  - compendium types
  - build document types
  - play-state types
  - resolved actor types
- initial grant/modifier taxonomy

Dependencies:
- Phase 0 complete

Exit criteria:
- contracts are stable enough that adapters and resolver code can be written against them

### Phase 2: Compendium Adapter Layer

Goal:
- ingest current v1 content into normalized V2 entities

Near-term target:
- keep equipment and vehicles inside the same normalization program as races/OCCs/skills, not as a later inventory subsystem

Deliverables:
- adapters for:
  - races
  - RCCs
  - OCCs
  - skills
  - spells
  - psionics
  - equipment
  - vehicles if available in v1
- validation of adapted entities

Dependencies:
- Phase 1 contracts

Exit criteria:
- representative content can be loaded into V2 normalized registries
- adapted data preserves source references and current structured rules

### Phase 3: Resolver Foundation

Goal:
- resolve a basic character end to end without UI-driven rules

Deliverables:
- entity loader
- package stack resolution
- grants application
- pool resolver
- skill instance resolver
- psionics/spell acquisition resolver basics
- attack resolver basics
- modifier engine
- explanation traces

Dependencies:
- Phase 2 compendium adapters

Exit criteria:
- a small set of known characters can be resolved headlessly from V2 build docs

### Phase 4: Parity Harness

Goal:
- prove correctness against v1 on representative characters

Deliverables:
- fixture set
- parity runner
- comparison reports
- explicit known-gap list

First fixture set:
- Burster
- Ley Line Walker
- Mystic
- Techno-Wizard
- Shifter
- Rogue Scientist
- Vagabond
- Great Horned Dragon Hatchling
- Noro with non-psionic OCC
- Elf
- Dwarf

Dependencies:
- Phase 3 resolver foundation

Exit criteria:
- parity is measurable, not anecdotal

### Phase 5: Builder Cut 1

Goal:
- deliver the first real V2 builder flow

Scope:
- race selection
- RCC/OCC selection
- attribute entry
- skill choice slots
- power/spell choice slots where already supported by resolver

Out of scope:
- polished feature-complete UI
- campaign tools

Dependencies:
- Phase 4 parity harness

Exit criteria:
- representative characters can be built in V2 using resolver-driven choices

### Phase 6: Sheet Cut 1

Goal:
- render the resolved actor cleanly from V2 data

Scope:
- vitals
- skills
- powers
- attacks
- resources
- play-state editing for current pools

Dependencies:
- Phase 5 builder cut

Exit criteria:
- V2 sheet is resolver-driven and usable for parity fixtures

### Phase 7: Build/Play State Split Completion

Goal:
- finish the separation that v1 never fully had

Deliverables:
- persisted `CharacterBuild`
- persisted `PlayState`
- migration helpers from v1 saved data where feasible

Dependencies:
- Builder + sheet both consuming V2 models

Exit criteria:
- build and play-state updates are no longer co-owned by the same loose state object

### Phase 8: World State Foundation

Goal:
- establish the GM/campaign layer without overbuilding it

Deliverables:
- `WorldState`
- environmental modifiers model
- time advancement primitives
- scene/ambient context

Dependencies:
- stable resolved actor and play-state models

Exit criteria:
- a GM-controlled environment can affect one or more resolved actors without custom patches

### Phase 9: Shared Vehicles and Actor Generalization

Goal:
- stop treating vehicles like advanced gear only

Deliverables:
- vehicle entities
- crew role model
- vehicle pools/systems
- actor references between characters and vehicles

Dependencies:
- action/target foundations and world-state model

Exit criteria:
- multiple actors can interact with one vehicle entity in a structured way

### Phase 10: Action and Targeting Foundation

Goal:
- create the reusable action model needed for spells, powers, attacks, and vehicle systems

Deliverables:
- `ActionDeclaration`
- `TargetReference`
- source/cost/range/target contracts
- action result/event log contracts

Dependencies:
- stable actors, world state, and resources

Exit criteria:
- action-capable systems can share a common execution surface

### Phase 11: Additional Power Systems

Goal:
- prove the architecture is not magic/psionics-only

Deliverables:
- super power support path
- source tags and acquisition rules for Heroes Unlimited / Conversion Book 1 style content

Dependencies:
- Phase 10 action/target model

Exit criteria:
- a third major power system can be represented without distorting the core model

## 6. Priority Order Inside the Phases

Within the first four phases, the exact order should be:

1. schema contracts
2. grant/modifier contracts
3. race/OCC/RCC adapters
4. skill and skill-instance model
5. pool model
6. psionics/spell model
7. attacks model
8. parity fixtures

Reason:
- skills and pools are used almost everywhere
- psionics/spells and attacks depend on the earlier foundations
- parity is only meaningful once those basics exist

## 7. Parity Policy

Parity should be explicit.

### Must-match behaviors from v1

- ancient vs modern W.P.
- repeatable skills
- structured language/literacy selections
- OCC ability skills
- spell acquisition channels
- racial psionics
- race/OCC handoff
- dragon MDC, psionics, skills, spells, and attacks
- grouped skills on the sheet
- current resource tracking behavior

### Allowed temporary V2 gaps

These can exist briefly if tracked explicitly:
- missing one-off prose notes with no current engine consumer
- unimplemented GM tools
- incomplete time/action systems
- incomplete shared vehicle station UX

### Not allowed

- regressions on currently working structured rules without a documented migration reason

## 8. Architecture-to-Implementation Mapping

The bible gives principles. This section states how they map to code.

### Compendium layer

Code location:
- `packages/compendium`

Responsibilities:
- normalized registries
- adapters from v1 data
- content validation

### Schema/contracts layer

Code location:
- `packages/schema`

Responsibilities:
- entity types
- document types
- grant/modifier contracts
- action/target contracts

### Resolver layer

Code location:
- `packages/rules-engine`

Responsibilities:
- resolution pipeline
- validation
- explanations
- available choice derivation

### Web app

Code location:
- `apps/web`

Responsibilities:
- builder UI
- sheet UI
- play-state UI
- future GM UI

## 9. Deliverables by Repository Area

### `packages/schema`

First real deliverables:
- entity contracts
- build/play/world state contracts
- resolved actor contracts
- grants/modifiers/action types

### `packages/compendium`

First real deliverables:
- import adapter interfaces
- v1 adapter for OCCs/races/skills
- normalized registry loaders

### `packages/rules-engine`

First real deliverables:
- package stack resolver
- pool resolver
- skill resolver
- power/spell resolver skeleton
- explanation trace model

### `apps/web`

First real deliverables:
- architecture dashboard
- fixture browser
- resolver inspection view
- later builder and sheet

## 10. Risks and Control Measures

### Risk 1: V2 becomes another abstract architecture exercise

Control:
- move immediately from master plan to schema spec and adapter implementation

### Risk 2: V2 accidentally reintroduces v1 state mixing

Control:
- enforce build/play/world separation in the schema before feature work

### Risk 3: Content migration stalls because schemas are too rigid

Control:
- allow an adapter normalization layer instead of demanding perfect source data at ingestion time

### Risk 4: Future systems distort the core model later

Control:
- bake in world-state, action, and multi-actor assumptions now

### Risk 5: Parity becomes subjective

Control:
- use fixture-based parity checks and a known-gap ledger

## 11. Recommended First Epics

These should become the first real tracked epics.

### Epic 1: V2 Schema Core

Goal:
- define the real contracts for entities and documents

Deliverables:
- schema types
- initial glossary
- grant/modifier taxonomy

### Epic 2: V1-to-V2 Compendium Adapter

Goal:
- prove existing content can be normalized without manual reauthoring

Deliverables:
- adapters for race/OCC/RCC/skill data
- validation scripts

### Epic 3: Resolver MVP

Goal:
- resolve one representative character from normalized data

Deliverables:
- pools
- skills
- powers
- validation

### Epic 4: Parity Fixture Harness

Goal:
- compare V2 outputs against known v1 behaviors

Deliverables:
- fixture format
- comparison runner
- report output

## 12. Immediate Next Actions

The next implementation tasks after this master plan should be:

1. replace the schema stub with a real schema document
2. define the initial grant and modifier taxonomy in code
3. implement the first normalized entity contracts in `packages/schema`
4. build the first adapter from v1 race/OCC data in `packages/compendium`
5. add the first fixture definitions in `tests/fixtures`

## 13. Completion Criteria for "V2 Foundation Ready"

V2 foundation should be considered ready when:
- schema contracts are stable
- compendium adapters load representative content
- resolver can resolve representative characters
- parity is measured on the first fixture set
- builder and sheet can consume resolved outputs without inventing rules

At that point, V2 stops being "architecture work" and becomes normal product development.
