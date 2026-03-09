# Rifts V1 Builder UX Contract

Date: 2026-03-09

Purpose:
- capture the existing V1 builder flow as the product contract for V2
- assume V1 is functionally correct unless there is a specific, grounded reason to change something
- prevent V2 from inventing a new UX under the banner of architecture work

Primary references:
- [CharacterBuilder.jsx](/home/pablo/rifts-app/src/components/character/CharacterBuilder.jsx)
- [Step1Identity.jsx](/home/pablo/rifts-app/src/components/character/steps/Step1Identity.jsx)
- [Step2Race.jsx](/home/pablo/rifts-app/src/components/character/steps/Step2Race.jsx)
- [Step3OCC.jsx](/home/pablo/rifts-app/src/components/character/steps/Step3OCC.jsx)
- [Step4Attributes.jsx](/home/pablo/rifts-app/src/components/character/steps/Step4Attributes.jsx)
- [Step5Skills.jsx](/home/pablo/rifts-app/src/components/character/steps/Step5Skills.jsx)
- [Step6Powers.jsx](/home/pablo/rifts-app/src/components/character/steps/Step6Powers.jsx)
- [Step7Equipment.jsx](/home/pablo/rifts-app/src/components/character/steps/Step7Equipment.jsx)
- [Step7Sheet.jsx](/home/pablo/rifts-app/src/components/character/steps/Step7Sheet.jsx)
- [CharacterSummary.jsx](/home/pablo/rifts-app/src/components/ui/CharacterSummary.jsx)
- [CharacterBuilderPage.jsx](/home/pablo/rifts-app/src/pages/CharacterBuilderPage.jsx)

## Core Product Assumption

V1 already has the right builder shape.

V2 should preserve:
- the sequence of decisions
- the step semantics
- the amount of information shown at each point
- the directness of the controls
- the persistent sense of current build state

V2 should not:
- replace the flow with a generic wizard
- expose resolver internals as primary UX
- merge steps just because the schema is more normalized
- create new abstractions the player has to learn

## The Actual V1 Flow

The builder is an 8-step process in [CharacterBuilder.jsx](/home/pablo/rifts-app/src/components/character/CharacterBuilder.jsx):

1. `IDENTITY`
2. `RACE`
3. `O.C.C.`
4. `ATTRIBUTES`
5. `SKILLS`
6. `POWERS`
7. `EQUIPMENT`
8. `SHEET`

Important behavior:
- step nav is always visible
- the user can jump freely between steps
- later steps depend on earlier choices, but navigation is not artificially locked
- every step has explicit `BACK` / `NEXT`
- earlier selections recompute later availability

This is the correct high-level V2 flow unless a concrete rule or usability problem requires deviation.

## Global UX Contract

### 1. Builder First, Debug Second

The main surface is a player-facing builder.

Debug or parity tools may exist, but they are secondary utilities and must not define the product UX.

### 2. One Domain Decision Per Step

Each step corresponds to a real character creation domain:
- identity
- race
- OCC/RCC path
- attributes
- skills
- powers/magic
- equipment
- final sheet

This is better than generic steps because it matches how players think about the game.

### 3. Earlier Choices Drive Later Choices

The builder must make the dependency chain obvious:
- race affects OCC/RCC rules and attribute dice
- OCC/RCC affects skills and powers
- attributes affect legality and bonuses
- skills affect later totals and sometimes prerequisites
- powers and equipment depend on prior identity/path selections

V1 already communicates this clearly in both sequence and computation.

### 4. Persistent Build Context

V1 keeps a compact current-build summary visible before the sheet in [CharacterSummary.jsx](/home/pablo/rifts-app/src/components/ui/CharacterSummary.jsx).

That summary is part of the UX contract:
- the user should always feel oriented
- they should not need to leave the step to remember what has been chosen

### 5. Save/Edit Are First-Class

V1 treats the builder as a real editing surface, not a temporary wizard, in [CharacterBuilderPage.jsx](/home/pablo/rifts-app/src/pages/CharacterBuilderPage.jsx):
- load existing character
- jump to requested step
- save current state
- continue editing

V2 should preserve this mindset.

## Step Contract

## Step 1: Identity

Reference:
- [Step1Identity.jsx](/home/pablo/rifts-app/src/components/character/steps/Step1Identity.jsx)

What it does:
- asks for character name
- asks for alignment
- uses large, direct controls
- moves immediately to race

What makes it work:
- very low friction
- no debug info
- no unnecessary metadata
- alignment is chosen visually with short descriptive cards

V2 contract:
- keep this simple
- do not add campaign metadata, source profiles, notes, or other setup noise here unless required

Grounded improvement opportunity:
- only small presentational improvements, if any
- no structural redesign needed

## Step 2: Race

Reference:
- [Step2Race.jsx](/home/pablo/rifts-app/src/components/character/steps/Step2Race.jsx)

What it does:
- left side: filtered compact list
- right side: deep preview panel
- selection is explicit and obvious
- import is available but secondary

What the detail panel shows:
- race type and tags
- MDC/RCC badges
- description and bonuses
- attribute dice behavior
- pool formulas
- abilities
- senses
- immunities/resistances
- natural attacks
- innate powers

What makes it work:
- the user can browse quickly without losing detail
- the detail pane answers “what does this race actually mean?”
- the race step teaches later rules without forcing the player to leave the flow

V2 contract:
- preserve the browse-on-left/detail-on-right pattern
- preserve the specific kinds of information surfaced here
- preserve RCC signaling at the race step

Grounded improvement opportunity:
- compatibility preview could be made clearer for races that force RCC behavior or restrict OCCs
- but the two-pane browse/detail model should stay

## Step 3: O.C.C.

Reference:
- [Step3OCC.jsx](/home/pablo/rifts-app/src/components/character/steps/Step3OCC.jsx)

What it does:
- branches correctly for RCC-only races
- uses the same browse/detail pattern as race
- filters to compatible OCCs when race restrictions apply
- keeps the chosen OCC explicit

Important behavior:
- if the race is RCC-only, there is no fake OCC choice
- the app tells the player the RCC is auto-assigned

What makes it work:
- the builder respects the rules structure instead of flattening everything into one “class” picker
- compatibility is enforced, but still legible

V2 contract:
- preserve the RCC branch
- preserve race-restricted OCC filtering
- preserve the detailed OCC preview panel

Grounded improvement opportunity:
- compatibility explanations can be made more explicit, but not by collapsing RCC/OCC distinctions

## Step 4: Attributes

Reference:
- [Step4Attributes.jsx](/home/pablo/rifts-app/src/components/character/steps/Step4Attributes.jsx)

What it does:
- shows one clear place to roll all attributes
- applies race dice and exceptional handling
- supports the human house rule as an explicit mode
- shows racial and OCC attribute bonuses in context
- lets the user see both base and modified totals

What makes it work:
- rolling and editing are in the same place
- bonuses are visible where they matter
- the step still feels like “attributes,” not a general-purpose math console

V2 contract:
- keep attribute rolling and assignment inside a dedicated attribute step
- keep race/OCC bonus visibility local to the attribute display
- keep validation tied to actual character requirements, not detached summaries

Grounded improvement opportunity:
- requirement feedback could be more explicit for OCC minima
- but the step should remain focused on attribute generation and resulting totals

## Step 5: Skills

Reference:
- [Step5Skills.jsx](/home/pablo/rifts-app/src/components/character/steps/Step5Skills.jsx)

What it does:
- handles automatic skills, racial skills, OCC-related picks, secondary picks, HTH purchases, and special grants in one place
- shows percentages and bonuses with context
- exposes only the choices relevant to the build
- uses grouping instead of a generic searchable data browser

What makes it work:
- the user thinks in terms of skill buckets, not raw choice slots
- automatic vs chosen skills are distinguished clearly
- the step reflects Rifts structure rather than abstract schema objects

V2 contract:
- present skills by real game buckets:
  - granted/base
  - racial
  - OCC related
  - secondary
  - HTH interactions where applicable
- never expose raw slot IDs or naked resolver concepts to the player
- specialization/repeatable-skill UX must feel like “picking a skill,” not editing a record

Grounded improvement opportunity:
- repeatable skill inputs can be cleaner than V1
- W.P. ancient/modern filtering can be made more obvious
- but the bucketed skill step itself should remain

## Step 6: Powers

Reference:
- [Step6Powers.jsx](/home/pablo/rifts-app/src/components/character/steps/Step6Powers.jsx)

What it does:
- adapts to class/race reality:
  - no powers
  - random psionics
  - fixed racial psionics
  - structured psionic packages
  - spell packages
  - mixed psionics and magic
- shows a status box explaining source, result, resource, and next action
- uses category pickers and detail panes when needed

What makes it work:
- the step is conditional and contextual, not a generic “select powers” page
- it explains why the character has powers or does not
- it handles Rifts edge cases without forcing every character through the same UI

V2 contract:
- preserve the adaptive nature of this step
- preserve psionics vs magic distinction
- preserve the source/result/next explanation pattern

Grounded improvement opportunity:
- class/race source labeling can be even clearer
- but the main lesson is that this step must be rules-shaped, not schema-shaped

## Step 7: Equipment

Reference:
- [Step7Equipment.jsx](/home/pablo/rifts-app/src/components/character/steps/Step7Equipment.jsx)

What it does:
- provides a dedicated equipment workspace, not a small subpanel
- has robust browsing/filtering
- supports inventory, containers, vehicles, slots, and protection/ammo/use state

What makes it work:
- equipment is treated as a real phase of character assembly
- it gives enough room for browsing and loadout management
- it acknowledges that gear in Rifts is substantial, not an afterthought

V2 contract:
- equipment remains its own major step
- the step must support browse + inspect + add + organize
- vehicles and containers are part of the equipment domain, not side features

Grounded improvement opportunity:
- starting equipment packages should become more guided as content normalization improves
- but the overall equipment workspace should remain substantial

## Step 8: Sheet

Reference:
- [Step7Sheet.jsx](/home/pablo/rifts-app/src/components/character/steps/Step7Sheet.jsx)

What it does:
- final readout of the resolved character
- still editable for play-state style values
- includes save/reset and level-up entry points
- acts as the handoff from builder to playable sheet

What makes it work:
- it feels like arriving at the character, not just finishing a form
- it separates build flow from play-facing reference

V2 contract:
- the final step should remain a character sheet/review destination
- it must feel like a finished artifact, not a debugging table

Grounded improvement opportunity:
- improve clarity and structure using V2’s cleaner resolver data
- but keep the “final playable sheet” role intact

## Cross-Cutting V1 Patterns That Must Survive

### Two-Pane Selection Where Browsing Matters

Race and OCC work because they combine:
- fast scanning
- detailed preview
- explicit selection state

V2 should reuse this pattern for:
- race
- OCC/RCC
- possibly powers/spells where category browsing matters

### Explicit Action Language

V1 uses concrete labels like:
- `NEXT: SELECT RACE`
- `SELECT THIS O.C.C.`
- `ROLL ALL ATTRIBUTES`

This is better than abstract labels because it tells the user exactly what the next move is.

### Rule Explanations Inside the Step

V1 uses info boxes inside the relevant step rather than sending the user to a separate explanation page.

That is the correct approach for V2:
- explain in context
- keep the user moving

### Flexible Navigation Without Losing Sequence

V1 preserves a recommended order without hard-locking the user.

That is important:
- sequence teaches the process
- flexible nav supports editing

V2 should keep both.

## Grounded Improvement Rules For V2

An improvement is allowed only if it satisfies at least one of these:

- fixes a concrete V1 usability problem
- makes an existing V1 rule clearer
- is required by V2’s normalized architecture
- supports a feature already known to be needed, such as repeatable skills or clearer race/OCC handoff

An improvement is not allowed if it is only:
- more generic
- more abstract
- more “modern”
- more schema-aligned at the expense of player understanding

## Immediate V2 Product Direction

V2 should now be treated as:
- V1 flow
- V2 engine
- V1-or-better usability

That means the next UI implementation work should be:

1. rebuild the V2 step shell to mirror V1 exactly
2. rebuild `Identity`, `Race`, and `O.C.C.` using V1 interaction patterns
3. rebuild `Attributes` with V1 semantics
4. rebuild `Skills`, `Powers`, `Equipment`, and `Sheet` in the same order
5. keep `/debug` as an internal surface only

## Conclusion

The main lesson from this audit is simple:

V1 is not something to “rethink” at the UX layer.

It is the operational baseline. V2 should replace the architecture under it, preserve the builder flow users already understand, and only improve areas where there is a specific, defensible reason.
