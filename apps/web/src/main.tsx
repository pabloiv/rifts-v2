import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import snapshotData from './demoSnapshot.generated.json'
import { createCompendiumRegistry } from '@rifts-v2/compendium'
import { resolveCharacterBuild } from '@rifts-v2/rules-engine'
import type {
  CharacterBuild,
  ChoiceSlot,
  CompendiumEntity,
  CompendiumEquipment,
  CompendiumOcc,
  CompendiumPower,
  CompendiumRace,
  CompendiumRcc,
  CompendiumSkill,
  CompendiumSpell,
  EquipmentSelection,
  ResolvedCharacter,
  SkillSelection,
  SpellSelection,
  ValidationIssue,
} from '@rifts-v2/schema'

type DemoSnapshot = {
  generatedAt: string
  entityCount: number
  entities: CompendiumEntity[]
  fixtures: CharacterBuild[]
}

type SurfaceMode = 'builder' | 'debug'
type BuildStepId = 'identity' | 'path' | 'attributes' | 'skills' | 'powers' | 'equipment' | 'review'

const BUILD_STEPS: Array<{ id: BuildStepId; label: string; blurb: string }> = [
  { id: 'identity', label: 'Identity', blurb: 'Name, level, and alignment.' },
  { id: 'path', label: 'Race and Class', blurb: 'Choose race, RCC, and OCC.' },
  { id: 'attributes', label: 'Attributes', blurb: 'Set the attribute line.' },
  { id: 'skills', label: 'Skills', blurb: 'Fill active skill slots.' },
  { id: 'powers', label: 'Powers and Magic', blurb: 'Pick psionics and spells when relevant.' },
  { id: 'equipment', label: 'Equipment', blurb: 'Build the starting loadout.' },
  { id: 'review', label: 'Review', blurb: 'Check the resolved character.' },
]

const demoSnapshot = snapshotData as DemoSnapshot
const registry = createCompendiumRegistry(demoSnapshot.entities)
const fixtureMap = new Map(demoSnapshot.fixtures.map(fixture => [fixture.id, fixture]))
const races = sortByName((registry.byKind.get('race') ?? []) as CompendiumRace[])
const rccs = sortByName((registry.byKind.get('rcc') ?? []) as CompendiumRcc[])
const occs = sortByName((registry.byKind.get('occ') ?? []) as CompendiumOcc[])
const powers = sortByName((registry.byKind.get('power') ?? []) as CompendiumPower[])
const spells = sortByName((registry.byKind.get('spell') ?? []) as CompendiumSpell[])
const equipmentCatalog = sortByName((registry.byKind.get('equipment') ?? []) as CompendiumEquipment[])
const entityStats = {
  races: races.length,
  rccs: rccs.length,
  occs: occs.length,
  skills: registry.byKind.get('skill')?.length ?? 0,
  powers: powers.length,
  spells: spells.length,
  attacks: registry.byKind.get('attack')?.length ?? 0,
  equipment: equipmentCatalog.length,
  vehicles: registry.byKind.get('vehicle')?.length ?? 0,
}

function App() {
  const [mode, setMode] = useState<SurfaceMode>(() => window.location.hash === '#debug' ? 'debug' : 'builder')
  const [activeFixtureId, setActiveFixtureId] = useState<string | null>(null)
  const [build, setBuild] = useState<CharacterBuild | null>(null)
  const [activeStep, setActiveStep] = useState<BuildStepId>('identity')

  useEffect(() => {
    const hash = mode === 'debug' ? '#debug' : ''
    window.history.replaceState(null, '', `${window.location.pathname}${hash}`)
  }, [mode])

  const resolved = build ? resolveCharacterBuild({ registry, build }) : null

  const startBlankBuild = () => {
    setActiveFixtureId(null)
    setBuild(createBlankBuild())
    setActiveStep('identity')
    setMode('builder')
  }

  const loadFixture = (fixtureId: string) => {
    const fixture = fixtureMap.get(fixtureId)
    if (!fixture) return
    setActiveFixtureId(fixtureId)
    setBuild(cloneBuild(fixture))
    setActiveStep('identity')
    setMode('builder')
  }

  if (!build) {
    return (
      <main style={styles.page}>
        <StartScreen
          onNewBuild={startBlankBuild}
          onLoadFixture={loadFixture}
          onOpenDebug={() => {
            const fallback = demoSnapshot.fixtures[0]
            if (fallback) {
              setActiveFixtureId(fallback.id)
              setBuild(cloneBuild(fallback))
            }
            setMode('debug')
          }}
        />
      </main>
    )
  }

  if (!resolved) return null

  return (
    <main style={styles.page}>
      <AppHeader
        mode={mode}
        build={build}
        activeFixtureId={activeFixtureId}
        onNewBuild={startBlankBuild}
        onLoadFixture={() => {
          setBuild(null)
          setActiveFixtureId(null)
          setMode('builder')
        }}
        onToggleMode={nextMode => setMode(nextMode)}
      />

      {mode === 'builder'
        ? (
          <BuilderShell
            build={build}
            resolved={resolved}
            activeStep={activeStep}
            activeFixtureId={activeFixtureId}
            onStepChange={setActiveStep}
            onChange={setBuild}
            onReset={() => {
              if (!activeFixtureId) {
                setBuild(createBlankBuild())
                setActiveStep('identity')
                return
              }
              const fixture = fixtureMap.get(activeFixtureId)
              if (fixture) {
                setBuild(cloneBuild(fixture))
                setActiveStep('identity')
              }
            }}
          />
          )
        : (
          <DebugSurface
            resolved={resolved}
            activeFixtureId={activeFixtureId}
            onLoadFixture={loadFixture}
          />
          )}
    </main>
  )
}

function StartScreen({
  onNewBuild,
  onLoadFixture,
  onOpenDebug,
}: {
  onNewBuild: () => void
  onLoadFixture: (_fixtureId: string) => void
  onOpenDebug: () => void
}) {
  return (
    <>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Rifts V2 Alpha</p>
          <h1 style={styles.title}>Character Builder</h1>
          <p style={styles.copy}>
            This alpha is now centered on a guided creation flow instead of a raw rules inspector.
            Start a new build, load a known example, and move through the process one decision at a time.
          </p>
          <div style={styles.heroActions}>
            <button type="button" style={styles.primaryButton} onClick={onNewBuild}>
              New Character
            </button>
            <button type="button" style={styles.secondaryButton} onClick={onOpenDebug}>
              Open Debug Surface
            </button>
          </div>
        </div>

        <div style={styles.heroMeta}>
          <div style={styles.metricBlock}>
            <span style={styles.metricLabel}>Snapshot</span>
            <span style={styles.metricValue}>{demoSnapshot.entityCount} entities</span>
          </div>
          <div style={styles.metricBlock}>
            <span style={styles.metricLabel}>Generated</span>
            <span style={styles.metricValue}>{formatTimestamp(demoSnapshot.generatedAt)}</span>
          </div>
        </div>
      </section>

      <section style={styles.startGrid}>
        <article style={styles.panel}>
          <h2 style={styles.panelTitle}>Load Example</h2>
          <p style={styles.panelCopy}>Use a parity character to see how the new flow handles real game content.</p>
          <div style={styles.fixtureList}>
            {demoSnapshot.fixtures.map(fixture => (
              <button
                key={fixture.id}
                type="button"
                onClick={() => onLoadFixture(fixture.id)}
                style={styles.fixtureButton}
              >
                <span style={styles.fixtureName}>{fixture.name}</span>
                <span style={styles.fixtureMeta}>
                  {fixture.raceId ?? 'No race'} / {fixture.rccId ?? fixture.occId ?? 'No class'} / level {fixture.level}
                </span>
              </button>
            ))}
          </div>
        </article>

        <article style={styles.panel}>
          <h2 style={styles.panelTitle}>Snapshot Scope</h2>
          <p style={styles.panelCopy}>This alpha is already resolving the same normalized compendium the future builder will consume.</p>
          <div style={styles.statGrid}>
            {Object.entries(entityStats).map(([label, value]) => (
              <div key={label} style={styles.statCard}>
                <span style={styles.statLabel}>{label.toUpperCase()}</span>
                <span style={styles.statValue}>{value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}

function AppHeader({
  mode,
  build,
  activeFixtureId,
  onNewBuild,
  onLoadFixture,
  onToggleMode,
}: {
  mode: SurfaceMode
  build: CharacterBuild
  activeFixtureId: string | null
  onNewBuild: () => void
  onLoadFixture: () => void
  onToggleMode: (_mode: SurfaceMode) => void
}) {
  return (
    <section style={styles.headerBar}>
      <div>
        <p style={styles.eyebrow}>Rifts V2 Alpha</p>
        <h1 style={styles.headerTitle}>{build.name || 'Untitled Character'}</h1>
        <p style={styles.headerMeta}>
          {build.raceId ?? 'No race'} / {build.rccId ?? build.occId ?? 'No class'} / level {build.level}
          {activeFixtureId ? ` / fixture ${activeFixtureId}` : ' / working build'}
        </p>
      </div>

      <div style={styles.headerActions}>
        <button type="button" style={styles.secondaryButton} onClick={onLoadFixture}>
          Home
        </button>
        <button type="button" style={styles.secondaryButton} onClick={onNewBuild}>
          New Character
        </button>
        <button
          type="button"
          style={mode === 'builder' ? styles.secondaryButton : styles.primaryButton}
          onClick={() => onToggleMode('builder')}
        >
          Builder
        </button>
        <button
          type="button"
          style={mode === 'debug' ? styles.primaryButton : styles.secondaryButton}
          onClick={() => onToggleMode('debug')}
        >
          Debug
        </button>
      </div>
    </section>
  )
}

function BuilderShell({
  build,
  resolved,
  activeStep,
  activeFixtureId,
  onStepChange,
  onChange,
  onReset,
}: {
  build: CharacterBuild
  resolved: ResolvedCharacter
  activeStep: BuildStepId
  activeFixtureId: string | null
  onStepChange: (_step: BuildStepId) => void
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
  onReset: () => void
}) {
  const stepIndex = BUILD_STEPS.findIndex(step => step.id === activeStep)
  const activeStepMeta = BUILD_STEPS[stepIndex] ?? BUILD_STEPS[0]!
  const previousStep = stepIndex > 0 ? BUILD_STEPS[stepIndex - 1] : null
  const nextStep = stepIndex >= 0 && stepIndex < BUILD_STEPS.length - 1 ? BUILD_STEPS[stepIndex + 1] : null

  return (
    <>
      <section style={styles.stepRail}>
        {BUILD_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepChange(step.id)}
            style={{
              ...styles.stepButton,
              ...(step.id === activeStep ? styles.stepButtonActive : {}),
            }}
          >
            <span style={styles.stepCount}>{index + 1}</span>
            <span>
              <strong style={styles.stepLabel}>{step.label}</strong>
              <span style={styles.stepBlurb}>{step.blurb}</span>
            </span>
          </button>
        ))}
      </section>

      <section style={styles.builderGrid}>
        <article style={styles.panelWide}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>{activeStepMeta.label}</h2>
              <p style={styles.panelCopy}>{activeStepMeta.blurb}</p>
            </div>
            <button type="button" style={styles.secondaryButton} onClick={onReset}>
              {activeFixtureId ? 'Reset to Fixture' : 'Reset Blank Build'}
            </button>
          </div>

          <BuildStepContent
            step={activeStep}
            build={build}
            resolved={resolved}
            onChange={onChange}
          />

          <div style={styles.stepFooter}>
            <button
              type="button"
              style={styles.secondaryButton}
              disabled={stepIndex === 0}
              onClick={() => {
                if (previousStep) onStepChange(previousStep.id)
              }}
            >
              Back
            </button>
            <button
              type="button"
              style={styles.primaryButton}
              disabled={stepIndex === BUILD_STEPS.length - 1}
              onClick={() => {
                if (nextStep) onStepChange(nextStep.id)
              }}
            >
              Next
            </button>
          </div>
        </article>

        <aside style={styles.panel}>
          <BuildSummary build={build} resolved={resolved} />
        </aside>
      </section>
    </>
  )
}

function BuildStepContent({
  step,
  build,
  resolved,
  onChange,
}: {
  step: BuildStepId
  build: CharacterBuild
  resolved: ResolvedCharacter
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  if (step === 'identity') {
    return <IdentityStep build={build} onChange={onChange} />
  }
  if (step === 'path') {
    return <PathStep build={build} resolved={resolved} onChange={onChange} />
  }
  if (step === 'attributes') {
    return <AttributesStep build={build} onChange={onChange} />
  }
  if (step === 'skills') {
    return <SkillsStep build={build} resolved={resolved} onChange={onChange} />
  }
  if (step === 'powers') {
    return <PowersStep build={build} resolved={resolved} onChange={onChange} />
  }
  if (step === 'equipment') {
    return <EquipmentStep build={build} onChange={onChange} />
  }
  return <ReviewStep build={build} resolved={resolved} />
}

function IdentityStep({
  build,
  onChange,
}: {
  build: CharacterBuild
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  return (
    <div style={styles.formGrid}>
      <label style={styles.field}>
        <span style={styles.fieldLabel}>Character Name</span>
        <input
          style={styles.input}
          value={build.name}
          onChange={event => onChange(current => current ? { ...current, name: event.target.value } : current)}
        />
      </label>

      <label style={styles.field}>
        <span style={styles.fieldLabel}>Level</span>
        <input
          style={styles.input}
          type="number"
          min={1}
          max={15}
          value={build.level}
          onChange={event => {
            const nextLevel = Math.max(1, Number(event.target.value) || 1)
            onChange(current => current ? { ...current, level: nextLevel } : current)
          }}
        />
      </label>

      <label style={styles.field}>
        <span style={styles.fieldLabel}>Alignment</span>
        <input
          style={styles.input}
          placeholder="Optional"
          value={build.alignment ?? ''}
          onChange={event => onChange(current => current ? {
            ...current,
            alignment: normalizeSelectValue(event.target.value),
          } : current)}
        />
      </label>
    </div>
  )
}

function PathStep({
  build,
  resolved,
  onChange,
}: {
  build: CharacterBuild
  resolved: ResolvedCharacter
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  const race = build.raceId ? registry.byId.get(build.raceId) as CompendiumRace | undefined : undefined
  const rcc = build.rccId ? registry.byId.get(build.rccId) as CompendiumRcc | undefined : undefined
  const occ = build.occId ? registry.byId.get(build.occId) as CompendiumOcc | undefined : undefined

  return (
    <>
      <div style={styles.formGrid}>
        <label style={styles.field}>
          <span style={styles.fieldLabel}>Race</span>
          <select
            style={styles.select}
            value={build.raceId ?? ''}
            onChange={event => onChange(current => current ? {
              ...current,
              raceId: normalizeSelectValue(event.target.value),
            } : current)}
          >
            <option value="">Choose race</option>
            {races.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>RCC</span>
          <select
            style={styles.select}
            value={build.rccId ?? ''}
            onChange={event => onChange(current => current ? {
              ...current,
              rccId: normalizeSelectValue(event.target.value),
            } : current)}
          >
            <option value="">None</option>
            {rccs.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>OCC</span>
          <select
            style={styles.select}
            value={build.occId ?? ''}
            onChange={event => onChange(current => current ? {
              ...current,
              occId: normalizeSelectValue(event.target.value),
            } : current)}
          >
            <option value="">None</option>
            {occs.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>
      </div>

      <div style={styles.cardGrid}>
        <EntityCard title="Race" entity={race ?? null} />
        <EntityCard title="RCC" entity={rcc ?? null} />
        <EntityCard title="OCC" entity={occ ?? null} />
      </div>

      <ValidationStrip issues={resolved.validation.filter(issue => issue.scope === 'build').slice(0, 4)} />
    </>
  )
}

function AttributesStep({
  build,
  onChange,
}: {
  build: CharacterBuild
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  return (
    <div style={styles.attributeGrid}>
      {Object.entries(build.attributes).map(([key, value]) => (
        <label key={key} style={styles.field}>
          <span style={styles.fieldLabel}>{key}</span>
          <input
            style={styles.input}
            type="number"
            min={1}
            max={30}
            value={value}
            onChange={event => {
              const nextValue = Math.max(1, Number(event.target.value) || 1)
              onChange(current => current ? {
                ...current,
                attributes: {
                  ...current.attributes,
                  [key]: nextValue,
                },
              } : current)
            }}
          />
        </label>
      ))}
    </div>
  )
}

function SkillsStep({
  build,
  resolved,
  onChange,
}: {
  build: CharacterBuild
  resolved: ResolvedCharacter
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  const skillChoices = resolved.availableChoices.filter(choice => choice.choiceFamily === 'skill')

  return (
    <>
      {skillChoices.length
        ? skillChoices.map(choice => (
          <SkillChoiceEditor
            key={choice.id}
            build={build}
            choice={choice}
            onChange={onChange}
          />
        ))
        : <p style={styles.emptyState}>This build has no open skill choices at the moment.</p>}

      <h3 style={styles.subTitle}>Resolved Skills</h3>
      <SectionTable
        columns={['Name', 'Category', 'Total', 'Source']}
        rows={resolved.skills.map(skill => [
          skill.specialization ? `${skill.name}: ${skill.specialization}` : skill.name,
          skill.category,
          skill.total != null ? `${skill.total}%` : '—',
          skill.sourceLabels?.join(', ') ?? '—',
        ])}
        emptyLabel="No resolved skills."
      />
    </>
  )
}

function PowersStep({
  build,
  resolved,
  onChange,
}: {
  build: CharacterBuild
  resolved: ResolvedCharacter
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  const powerChoices = resolved.availableChoices.filter(choice => choice.choiceFamily === 'power')
  const spellChoices = resolved.availableChoices.filter(choice => choice.choiceFamily === 'spell')

  return (
    <>
      <div style={styles.cardGrid}>
        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Psionics</h3>
          {powerChoices.length
            ? powerChoices.map(choice => (
              <PowerChoiceEditor
                key={choice.id}
                build={build}
                choice={choice}
                onChange={onChange}
              />
            ))
            : <p style={styles.emptyState}>No open power choices for this build.</p>}
        </article>

        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Spells</h3>
          {spellChoices.length
            ? spellChoices.map(choice => (
              <SpellChoiceEditor
                key={choice.id}
                build={build}
                choice={choice}
                onChange={onChange}
              />
            ))
            : <p style={styles.emptyState}>No open spell choices for this build.</p>}
        </article>
      </div>

      <div style={styles.cardGrid}>
        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Resolved Powers</h3>
          <SectionTable
            columns={['Name', 'Family', 'Source']}
            rows={resolved.powers.map(power => [
              power.name,
              power.powerFamily,
              power.sourceLabels?.join(', ') ?? '—',
            ])}
            emptyLabel="No resolved powers."
          />
        </article>

        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Resolved Spells</h3>
          <SectionTable
            columns={['Name', 'Level', 'Source']}
            rows={resolved.spells.map(spell => [
              spell.name,
              spell.level != null ? String(spell.level) : '—',
              spell.sourceLabels?.join(', ') ?? '—',
            ])}
            emptyLabel="No resolved spells."
          />
        </article>
      </div>
    </>
  )
}

function EquipmentStep({
  build,
  onChange,
}: {
  build: CharacterBuild
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  return (
    <>
      <div style={styles.panelHeader}>
        <div>
          <h3 style={styles.subTitle}>Loadout</h3>
          <p style={styles.panelCopy}>Starting gear prose is not normalized yet, so this alpha uses freeform equipment selection.</p>
        </div>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => onChange(current => current ? {
            ...current,
            equipmentSelections: [
              ...current.equipmentSelections,
              {
                selectionId: createSelectionId('equipment'),
                equipmentId: equipmentCatalog[0]?.id ?? '',
                quantity: 1,
                equippedSlotId: null,
              },
            ],
          } : current)}
        >
          Add Equipment
        </button>
      </div>

      <div style={styles.equipmentList}>
        {build.equipmentSelections.length
          ? build.equipmentSelections.map(selection => (
            <EquipmentEditorRow
              key={selection.selectionId}
              selection={selection}
              onChange={onChange}
            />
          ))
          : <p style={styles.emptyState}>No equipment selected yet.</p>}
      </div>
    </>
  )
}

function ReviewStep({
  build,
  resolved,
}: {
  build: CharacterBuild
  resolved: ResolvedCharacter
}) {
  return (
    <>
      <div style={styles.cardGrid}>
        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Overview</h3>
          <div style={styles.definitionList}>
            <Definition label="Name">{build.name}</Definition>
            <Definition label="Race">{build.raceId ?? 'None'}</Definition>
            <Definition label="RCC">{build.rccId ?? 'None'}</Definition>
            <Definition label="OCC">{build.occId ?? 'None'}</Definition>
            <Definition label="Level">{String(build.level)}</Definition>
            <Definition label="Attributes">{formatAttributes(build)}</Definition>
          </div>
        </article>

        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Validation</h3>
          <ValidationStrip issues={resolved.validation} />
        </article>
      </div>

      <div style={styles.cardGrid}>
        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Resources</h3>
          <SectionTable
            columns={['Pool', 'Formula / Max', 'Source']}
            rows={resolved.pools.map(pool => [
              pool.label,
              pool.formula ?? String(pool.maxValue ?? '—'),
              pool.sourceLabels?.join(', ') ?? '—',
            ])}
            emptyLabel="No resource pools."
          />
        </article>

        <article style={styles.subCard}>
          <h3 style={styles.subCardTitle}>Attacks</h3>
          <SectionTable
            columns={['Name', 'Family', 'Damage']}
            rows={resolved.attacks.map(attack => [
              attack.name,
              attack.attackFamily,
              attack.damage.formula,
            ])}
            emptyLabel="No resolved attacks."
          />
        </article>
      </div>

      <article style={styles.subCard}>
        <h3 style={styles.subCardTitle}>Skills</h3>
        <SectionTable
          columns={['Name', 'Category', 'Total', 'Source']}
          rows={resolved.skills.map(skill => [
            skill.specialization ? `${skill.name}: ${skill.specialization}` : skill.name,
            skill.category,
            skill.total != null ? `${skill.total}%` : '—',
            skill.sourceLabels?.join(', ') ?? '—',
          ])}
          emptyLabel="No resolved skills."
        />
      </article>
    </>
  )
}

function BuildSummary({
  build,
  resolved,
}: {
  build: CharacterBuild
  resolved: ResolvedCharacter
}) {
  const errorCount = resolved.validation.filter(issue => issue.severity === 'error').length
  const warningCount = resolved.validation.filter(issue => issue.severity === 'warning').length

  return (
    <>
      <h2 style={styles.panelTitle}>Current Character</h2>
      <div style={styles.definitionList}>
        <Definition label="Name">{build.name}</Definition>
        <Definition label="Race">{build.raceId ?? 'None'}</Definition>
        <Definition label="RCC">{build.rccId ?? 'None'}</Definition>
        <Definition label="OCC">{build.occId ?? 'None'}</Definition>
        <Definition label="Level">{String(build.level)}</Definition>
      </div>

      <h3 style={styles.subTitle}>Current Totals</h3>
      <div style={styles.selectionSummary}>
        <SummaryChip label="Skills" value={resolved.skills.length} />
        <SummaryChip label="Powers" value={resolved.powers.length} />
        <SummaryChip label="Spells" value={resolved.spells.length} />
        <SummaryChip label="Attacks" value={resolved.attacks.length} />
        <SummaryChip label="Gear" value={resolved.equipment.length} />
      </div>

      <h3 style={styles.subTitle}>Issues</h3>
      <div style={styles.selectionSummary}>
        <SummaryChip label="Errors" value={errorCount} />
        <SummaryChip label="Warnings" value={warningCount} />
      </div>

      <h3 style={styles.subTitle}>Open Choices</h3>
      <div style={styles.choiceList}>
        {resolved.availableChoices.length
          ? resolved.availableChoices.map(choice => <ChoiceCard key={choice.id} choice={choice} />)
          : <p style={styles.emptyState}>No open choice slots right now.</p>}
      </div>
    </>
  )
}

function DebugSurface({
  resolved,
  activeFixtureId,
  onLoadFixture,
}: {
  resolved: ResolvedCharacter
  activeFixtureId: string | null
  onLoadFixture: (_fixtureId: string) => void
}) {
  return (
    <>
      <section style={styles.startGrid}>
        <article style={styles.panel}>
          <h2 style={styles.panelTitle}>Debug Fixtures</h2>
          <p style={styles.panelCopy}>Internal resolver surface. Keep using the builder for normal testing.</p>
          <div style={styles.fixtureList}>
            {demoSnapshot.fixtures.map(fixture => (
              <button
                key={fixture.id}
                type="button"
                onClick={() => onLoadFixture(fixture.id)}
                style={{
                  ...styles.fixtureButton,
                  ...(fixture.id === activeFixtureId ? styles.fixtureButtonActive : {}),
                }}
              >
                <span style={styles.fixtureName}>{fixture.name}</span>
                <span style={styles.fixtureMeta}>
                  {fixture.raceId ?? 'No race'} / {fixture.rccId ?? fixture.occId ?? 'No class'} / level {fixture.level}
                </span>
              </button>
            ))}
          </div>
        </article>

        <article style={styles.panel}>
          <h2 style={styles.panelTitle}>Compendium Snapshot</h2>
          <div style={styles.statGrid}>
            {Object.entries(entityStats).map(([label, value]) => (
              <div key={label} style={styles.statCard}>
                <span style={styles.statLabel}>{label.toUpperCase()}</span>
                <span style={styles.statValue}>{value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={styles.debugGrid}>
        <article style={styles.panel}>
          <h2 style={styles.panelTitle}>Validation</h2>
          <ValidationStrip issues={resolved.validation} />

          <h3 style={styles.subTitle}>Available Choices</h3>
          <div style={styles.choiceList}>
            {resolved.availableChoices.length
              ? resolved.availableChoices.map(choice => <ChoiceCard key={choice.id} choice={choice} />)
              : <p style={styles.emptyState}>No open choices.</p>}
          </div>
        </article>

        <article style={styles.panelWide}>
          <h2 style={styles.panelTitle}>Resolved Output</h2>
          <SectionTable
            columns={['Name', 'Category', 'Value', 'Source']}
            rows={[
              ...resolved.pools.map(pool => [pool.label, 'Pool', pool.formula ?? String(pool.maxValue ?? '—'), pool.sourceLabels?.join(', ') ?? '—']),
              ...resolved.skills.map(skill => [
                skill.specialization ? `${skill.name}: ${skill.specialization}` : skill.name,
                'Skill',
                skill.total != null ? `${skill.total}%` : '—',
                skill.sourceLabels?.join(', ') ?? '—',
              ]),
              ...resolved.powers.map(power => [power.name, 'Power', power.powerFamily, power.sourceLabels?.join(', ') ?? '—']),
              ...resolved.spells.map(spell => [spell.name, 'Spell', spell.level != null ? String(spell.level) : '—', spell.sourceLabels?.join(', ') ?? '—']),
              ...resolved.attacks.map(attack => [attack.name, 'Attack', attack.damage.formula, attack.sourceLabels?.join(', ') ?? '—']),
              ...resolved.equipment.map(item => [item.name, 'Equipment', String(item.quantity), item.sourceLabels?.join(', ') ?? '—']),
            ]}
            emptyLabel="No resolved output."
          />
        </article>
      </section>
    </>
  )
}

function EntityCard({ title, entity }: { title: string; entity: CompendiumEntity | null }) {
  return (
    <article style={styles.subCard}>
      <h3 style={styles.subCardTitle}>{title}</h3>
      {entity
        ? (
          <>
            <p style={styles.entityName}>{entity.name}</p>
            <p style={styles.entitySummary}>{entity.summary ?? 'No summary yet.'}</p>
            {entity.tags?.length ? <p style={styles.entityMeta}>Tags: {entity.tags.join(', ')}</p> : null}
          </>
          )
        : <p style={styles.emptyState}>Nothing selected.</p>}
    </article>
  )
}

function SkillChoiceEditor({
  build,
  choice,
  onChange,
}: {
  build: CharacterBuild
  choice: ChoiceSlot
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  const options = getEntitiesForChoiceSlot(choice, 'skill') as CompendiumSkill[]
  const slotSelections = build.skillSelections.filter(selection => selection.sourceSlotId === choice.id)
  const rowCount = Math.max(choice.count, slotSelections.length || 1)

  return (
    <article style={styles.subCard}>
      <div style={styles.choiceHeader}>
        <strong>{choice.label}</strong>
        <span style={styles.choiceBadge}>{slotSelections.length}/{choice.count}</span>
      </div>
      <p style={styles.choiceMeta}>Source {choice.sourceLabel ?? '—'}</p>

      <div style={styles.choiceRows}>
        {Array.from({ length: rowCount }, (_, index) => {
          const selection = slotSelections[index] ?? null
          const skillEntity = selection ? asSkill(selection.skillId) : null
          const specializationRule = skillEntity?.specialization ?? null
          return (
            <div key={`${choice.id}-${selection?.selectionId ?? index}`} style={styles.choiceRow}>
              <select
                style={styles.select}
                value={selection?.skillId ?? ''}
                onChange={event => {
                  onChange(current => current ? setSkillSelectionForSlot(current, choice.id, index, event.target.value) : current)
                }}
              >
                <option value="">Open slot</option>
                {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>

              {selection && specializationRule
                ? <SkillSpecializationField selection={selection} skill={skillEntity!} onChange={onChange} />
                : <div />}

              {selection
                ? (
                  <button
                    type="button"
                    style={styles.inlineButton}
                    onClick={() => onChange(current => current ? removeSkillSelection(current, selection.selectionId) : current)}
                  >
                    Remove
                  </button>
                  )
                : <div />}
            </div>
          )
        })}
      </div>
    </article>
  )
}

function SkillSpecializationField({
  selection,
  skill,
  onChange,
}: {
  selection: SkillSelection
  skill: CompendiumSkill
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  const rule = skill.specialization
  if (!rule) return null

  if (rule.mode === 'option_set' && rule.options?.length) {
    return (
      <select
        style={styles.select}
        value={selection.specialization ?? ''}
        onChange={event => onChange(current => current ? updateSkillSelection(current, selection.selectionId, {
          specialization: normalizeSelectValue(event.target.value),
        }) : current)}
      >
        <option value="">Choose {rule.label}</option>
        {rule.options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    )
  }

  return (
    <input
      style={styles.input}
      placeholder={rule.label}
      value={selection.specialization ?? ''}
      onChange={event => onChange(current => current ? updateSkillSelection(current, selection.selectionId, {
        specialization: normalizeSelectValue(event.target.value),
      }) : current)}
    />
  )
}

function PowerChoiceEditor({
  build,
  choice,
  onChange,
}: {
  build: CharacterBuild
  choice: ChoiceSlot
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  const options = getEntitiesForChoiceSlot(choice, 'power') as CompendiumPower[]
  const slotSelections = build.powerSelections.filter(selection => selection.sourceSlotId === choice.id)
  const rowCount = Math.max(choice.count, slotSelections.length || 1)

  return (
    <div style={styles.choiceEditorCard}>
      <div style={styles.choiceHeader}>
        <strong>{choice.label}</strong>
        <span style={styles.choiceBadge}>{slotSelections.length}/{choice.count}</span>
      </div>
      <div style={styles.choiceRows}>
        {Array.from({ length: rowCount }, (_, index) => {
          const selection = slotSelections[index] ?? null
          return (
            <div key={`${choice.id}-${selection?.selectionId ?? index}`} style={styles.choiceRowSingle}>
              <select
                style={styles.select}
                value={selection?.powerId ?? ''}
                onChange={event => {
                  onChange(current => current ? setPowerSelectionForSlot(current, choice.id, index, event.target.value) : current)
                }}
              >
                <option value="">Open slot</option>
                {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>

              {selection
                ? (
                  <button
                    type="button"
                    style={styles.inlineButton}
                    onClick={() => onChange(current => current ? removePowerSelection(current, selection.selectionId) : current)}
                  >
                    Remove
                  </button>
                  )
                : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SpellChoiceEditor({
  build,
  choice,
  onChange,
}: {
  build: CharacterBuild
  choice: ChoiceSlot
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  const options = getEntitiesForChoiceSlot(choice, 'spell') as CompendiumSpell[]
  const slotSelections = build.spellSelections.filter(selection => selection.sourceSlotId === choice.id)
  const rowCount = Math.max(choice.count, slotSelections.length || 1)

  return (
    <div style={styles.choiceEditorCard}>
      <div style={styles.choiceHeader}>
        <strong>{choice.label}</strong>
        <span style={styles.choiceBadge}>{slotSelections.length}/{choice.count}</span>
      </div>
      <div style={styles.choiceRows}>
        {Array.from({ length: rowCount }, (_, index) => {
          const selection = slotSelections[index] ?? null
          return (
            <div key={`${choice.id}-${selection?.selectionId ?? index}`} style={styles.choiceRowSpell}>
              <select
                style={styles.select}
                value={selection?.spellId ?? ''}
                onChange={event => {
                  onChange(current => current ? setSpellSelectionForSlot(current, choice.id, index, event.target.value) : current)
                }}
              >
                <option value="">Open slot</option>
                {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>

              <input
                style={styles.input}
                placeholder="Acquisition source"
                value={selection?.acquisitionSource ?? ''}
                onChange={event => {
                  if (!selection) return
                  onChange(current => current ? updateSpellSelection(current, selection.selectionId, {
                    acquisitionSource: normalizeSelectValue(event.target.value),
                  }) : current)
                }}
              />

              {selection
                ? (
                  <button
                    type="button"
                    style={styles.inlineButton}
                    onClick={() => onChange(current => current ? removeSpellSelection(current, selection.selectionId) : current)}
                  >
                    Remove
                  </button>
                  )
                : <div />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EquipmentEditorRow({
  selection,
  onChange,
}: {
  selection: EquipmentSelection
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
}) {
  return (
    <div style={styles.equipmentRow}>
      <select
        style={styles.select}
        value={selection.equipmentId}
        onChange={event => onChange(current => current ? updateEquipmentSelection(current, selection.selectionId, {
          equipmentId: event.target.value,
        }) : current)}
      >
        <option value="">Choose equipment</option>
        {equipmentCatalog.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>

      <input
        style={styles.input}
        type="number"
        min={1}
        value={selection.quantity ?? 1}
        onChange={event => onChange(current => current ? updateEquipmentSelection(current, selection.selectionId, {
          quantity: Math.max(1, Number(event.target.value) || 1),
        }) : current)}
      />

      <input
        style={styles.input}
        placeholder="Equipped slot"
        value={selection.equippedSlotId ?? ''}
        onChange={event => onChange(current => current ? updateEquipmentSelection(current, selection.selectionId, {
          equippedSlotId: normalizeSelectValue(event.target.value),
        }) : current)}
      />

      <button
        type="button"
        style={styles.inlineButton}
        onClick={() => onChange(current => current ? {
          ...current,
          equipmentSelections: current.equipmentSelections.filter(item => item.selectionId !== selection.selectionId),
        } : current)}
      >
        Remove
      </button>
    </div>
  )
}

function ValidationStrip({ issues }: { issues: ValidationIssue[] }) {
  if (!issues.length) {
    return <p style={styles.goodState}>No validation issues.</p>
  }

  return (
    <div style={styles.validationList}>
      {issues.map(issue => (
        <div
          key={issue.id}
          style={{
            ...styles.validationItem,
            ...(issue.severity === 'error' ? styles.validationError : styles.validationWarning),
          }}
        >
          <strong>{issue.severity.toUpperCase()}</strong>
          <span>{issue.message}</span>
          {issue.notes?.length ? <span style={styles.validationNotes}>{issue.notes.join(' ')}</span> : null}
        </div>
      ))}
    </div>
  )
}

function Definition({ label, children }: { label: string; children: string }) {
  return (
    <div style={styles.definitionRow}>
      <span style={styles.definitionLabel}>{label}</span>
      <span style={styles.definitionValue}>{children}</span>
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.summaryChip}>
      <span style={styles.summaryChipLabel}>{label}</span>
      <span style={styles.summaryChipValue}>{value}</span>
    </div>
  )
}

function ChoiceCard({ choice }: { choice: ChoiceSlot }) {
  return (
    <div style={styles.choiceCard}>
      <div style={styles.choiceHeader}>
        <strong>{choice.label}</strong>
        <span style={styles.choiceBadge}>{choice.choiceFamily}</span>
      </div>
      <p style={styles.choiceMeta}>
        Count {choice.count} · Source {choice.sourceLabel ?? '—'}
      </p>
      {choice.filters?.length
        ? (
          <ul style={styles.choiceFilters}>
            {choice.filters.map(filter => (
              <li key={`${choice.id}-${filter.key}`}>{filter.key}: {filter.values.join(', ')}</li>
            ))}
          </ul>
          )
        : null}
    </div>
  )
}

function SectionTable({ columns, rows, emptyLabel }: { columns: string[]; rows: string[][]; emptyLabel: string }) {
  if (rows.length === 0) return <p style={styles.emptyState}>{emptyLabel}</p>

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map(column => <th key={column} style={styles.th}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${row[0]}-${cellIndex}`} style={styles.td}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function normalizeSelectValue(value: string): string | null {
  return value.trim() ? value : null
}

function createBlankBuild(): CharacterBuild {
  return {
    schemaVersion: '0.1.0',
    id: 'working-build',
    name: 'Working Build',
    raceId: 'human',
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
    notes: 'Blank alpha build.',
  }
}

function cloneBuild(build: CharacterBuild): CharacterBuild {
  return {
    ...build,
    attributes: { ...build.attributes },
    skillSelections: build.skillSelections.map(selection => ({ ...selection })),
    powerSelections: build.powerSelections.map(selection => ({ ...selection })),
    spellSelections: build.spellSelections.map(selection => ({ ...selection })),
    packageSelections: build.packageSelections.map(selection => ({ ...selection })),
    equipmentSelections: build.equipmentSelections.map(selection => ({ ...selection })),
    levelSelections: build.levelSelections.map(selection => ({
      level: selection.level,
      ...(selection.skillSelections ? { skillSelections: selection.skillSelections.map(item => ({ ...item })) } : {}),
      ...(selection.powerSelections ? { powerSelections: selection.powerSelections.map(item => ({ ...item })) } : {}),
      ...(selection.spellSelections ? { spellSelections: selection.spellSelections.map(item => ({ ...item })) } : {}),
      ...(selection.packageSelections ? { packageSelections: selection.packageSelections.map(item => ({ ...item })) } : {}),
    })),
  }
}

function createSelectionId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function sortByName<T extends { name: string }>(entities: T[]): T[] {
  return [...entities].sort((left, right) => left.name.localeCompare(right.name))
}

function asSkill(id: string): CompendiumSkill | null {
  const entity = registry.byId.get(id)
  return entity?.kind === 'skill' ? entity : null
}

function matchesSlotFilter(entity: CompendiumEntity, slot: ChoiceSlot): boolean {
  if (!slot.allowedEntityKinds.includes(entity.kind)) return false
  if (slot.allowedIds?.length && !slot.allowedIds.includes(entity.id) && !slot.allowedIds.includes(entity.name)) return false
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
    if (filter.key === 'spell_level_any' && entity.kind === 'spell') {
      const match = entity.level != null ? values.includes(String(entity.level)) : false
      return filter.mode === 'exclude' ? !match : match
    }
    if (filter.key === 'spell_level_max' && entity.kind === 'spell') {
      const maxLevel = Number(values[0] ?? NaN)
      const match = entity.level != null && Number.isFinite(maxLevel) ? entity.level <= maxLevel : false
      return filter.mode === 'exclude' ? !match : match
    }
    return true
  })
}

function getEntitiesForChoiceSlot(choice: ChoiceSlot, expectedKind: CompendiumEntity['kind']) {
  const entities = (registry.byKind.get(expectedKind) ?? []) as CompendiumEntity[]
  return sortByName(entities.filter(entity => matchesSlotFilter(entity, choice)))
}

function setSkillSelectionForSlot(build: CharacterBuild, slotId: string, slotIndex: number, nextSkillId: string) {
  const skillSelections = [...build.skillSelections]
  const slotMatches = skillSelections
    .map((selection, index) => ({ selection, index }))
    .filter(entry => entry.selection.sourceSlotId === slotId)
  const target = slotMatches[slotIndex]

  if (!nextSkillId) {
    if (!target) return build
    skillSelections.splice(target.index, 1)
    return {
      ...build,
      skillSelections,
    }
  }

  if (target) {
    const previousSkill = target.selection
    const nextSkill = asSkill(nextSkillId)
    const previousEntity = asSkill(previousSkill.skillId)
    const keepSpecialization = previousEntity?.id === nextSkill?.id ? previousSkill.specialization ?? null : null
    skillSelections[target.index] = {
      ...previousSkill,
      skillId: nextSkillId,
      specialization: keepSpecialization,
    }
    return {
      ...build,
      skillSelections,
    }
  }

  return {
    ...build,
    skillSelections: [
      ...skillSelections,
      {
        selectionId: createSelectionId('skill'),
        skillId: nextSkillId,
        sourceSlotId: slotId,
      },
    ],
  }
}

function updateSkillSelection(build: CharacterBuild, selectionId: string, patch: Partial<SkillSelection>) {
  return {
    ...build,
    skillSelections: build.skillSelections.map(selection => (
      selection.selectionId === selectionId
        ? { ...selection, ...patch }
        : selection
    )),
  }
}

function removeSkillSelection(build: CharacterBuild, selectionId: string) {
  return {
    ...build,
    skillSelections: build.skillSelections.filter(selection => selection.selectionId !== selectionId),
  }
}

function setPowerSelectionForSlot(build: CharacterBuild, slotId: string, slotIndex: number, nextPowerId: string) {
  const powerSelections = [...build.powerSelections]
  const slotMatches = powerSelections
    .map((selection, index) => ({ selection, index }))
    .filter(entry => entry.selection.sourceSlotId === slotId)
  const target = slotMatches[slotIndex]

  if (!nextPowerId) {
    if (!target) return build
    powerSelections.splice(target.index, 1)
    return {
      ...build,
      powerSelections,
    }
  }

  if (target) {
    powerSelections[target.index] = {
      ...target.selection,
      powerId: nextPowerId,
    }
    return {
      ...build,
      powerSelections,
    }
  }

  return {
    ...build,
    powerSelections: [
      ...powerSelections,
      {
        selectionId: createSelectionId('power'),
        powerId: nextPowerId,
        sourceSlotId: slotId,
      },
    ],
  }
}

function removePowerSelection(build: CharacterBuild, selectionId: string) {
  return {
    ...build,
    powerSelections: build.powerSelections.filter(selection => selection.selectionId !== selectionId),
  }
}

function setSpellSelectionForSlot(build: CharacterBuild, slotId: string, slotIndex: number, nextSpellId: string) {
  const spellSelections = [...build.spellSelections]
  const slotMatches = spellSelections
    .map((selection, index) => ({ selection, index }))
    .filter(entry => entry.selection.sourceSlotId === slotId)
  const target = slotMatches[slotIndex]

  if (!nextSpellId) {
    if (!target) return build
    spellSelections.splice(target.index, 1)
    return {
      ...build,
      spellSelections,
    }
  }

  if (target) {
    spellSelections[target.index] = {
      ...target.selection,
      spellId: nextSpellId,
    }
    return {
      ...build,
      spellSelections,
    }
  }

  return {
    ...build,
    spellSelections: [
      ...spellSelections,
      {
        selectionId: createSelectionId('spell'),
        spellId: nextSpellId,
        sourceSlotId: slotId,
      },
    ],
  }
}

function updateSpellSelection(build: CharacterBuild, selectionId: string, patch: Partial<SpellSelection>) {
  return {
    ...build,
    spellSelections: build.spellSelections.map(selection => (
      selection.selectionId === selectionId
        ? { ...selection, ...patch }
        : selection
    )),
  }
}

function removeSpellSelection(build: CharacterBuild, selectionId: string) {
  return {
    ...build,
    spellSelections: build.spellSelections.filter(selection => selection.selectionId !== selectionId),
  }
}

function updateEquipmentSelection(build: CharacterBuild, selectionId: string, patch: Partial<EquipmentSelection>) {
  return {
    ...build,
    equipmentSelections: build.equipmentSelections.map(selection => (
      selection.selectionId === selectionId
        ? { ...selection, ...patch }
        : selection
    )),
  }
}

function formatAttributes(build: CharacterBuild) {
  return Object.entries(build.attributes).map(([key, value]) => `${key} ${value}`).join(' · ')
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    margin: 0,
    padding: '28px',
    background: 'linear-gradient(180deg, #f6f0e3 0%, #d6e3e5 52%, #f2f6f7 100%)',
    color: '#152126',
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
  },
  hero: {
    maxWidth: 1440,
    margin: '0 auto 24px',
    padding: '28px 32px',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.84)',
    boxShadow: '0 18px 44px rgba(21, 33, 38, 0.12)',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  },
  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  eyebrow: {
    margin: '0 0 10px',
    fontSize: 12,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#8a5420',
  },
  title: {
    margin: '0 0 10px',
    fontSize: 44,
    lineHeight: 1.02,
  },
  headerTitle: {
    margin: '0 0 6px',
    fontSize: 34,
    lineHeight: 1.04,
  },
  headerMeta: {
    margin: 0,
    color: '#536366',
  },
  copy: {
    margin: 0,
    lineHeight: 1.6,
    fontSize: 17,
    maxWidth: 760,
  },
  heroMeta: {
    display: 'grid',
    gap: 12,
    alignContent: 'start',
  },
  headerBar: {
    maxWidth: 1440,
    margin: '0 auto 20px',
    padding: '20px 24px',
    borderRadius: 22,
    background: 'rgba(255,255,255,0.84)',
    boxShadow: '0 16px 38px rgba(21, 33, 38, 0.11)',
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    alignItems: 'center',
  },
  headerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  metricBlock: {
    padding: '16px 18px',
    borderRadius: 18,
    background: '#152126',
    color: '#f7f2e7',
  },
  metricLabel: {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#f0b56a',
  },
  metricValue: {
    display: 'block',
    marginTop: 8,
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  startGrid: {
    maxWidth: 1440,
    margin: '0 auto',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  },
  stepRail: {
    maxWidth: 1440,
    margin: '0 auto 20px',
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  stepButton: {
    border: 0,
    borderRadius: 18,
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.8)',
    boxShadow: '0 12px 28px rgba(21, 33, 38, 0.1)',
    textAlign: 'left',
    display: 'grid',
    gridTemplateColumns: '36px 1fr',
    gap: 12,
    cursor: 'pointer',
  },
  stepButtonActive: {
    background: '#152126',
    color: '#f7f2e7',
  },
  stepCount: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: '#f0b56a',
    color: '#152126',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
  },
  stepLabel: {
    display: 'block',
    marginBottom: 4,
  },
  stepBlurb: {
    display: 'block',
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 1.35,
  },
  builderGrid: {
    maxWidth: 1440,
    margin: '0 auto',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 0.9fr)',
    alignItems: 'start',
  },
  debugGrid: {
    maxWidth: 1440,
    margin: '20px auto 0',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'minmax(320px, 0.8fr) minmax(0, 1.2fr)',
  },
  panel: {
    minWidth: 0,
    padding: '22px 24px',
    borderRadius: 22,
    background: 'rgba(255,255,255,0.84)',
    boxShadow: '0 16px 38px rgba(21, 33, 38, 0.11)',
  },
  panelWide: {
    minWidth: 0,
    padding: '22px 24px',
    borderRadius: 22,
    background: 'rgba(255,255,255,0.84)',
    boxShadow: '0 16px 38px rgba(21, 33, 38, 0.11)',
  },
  subCard: {
    padding: '18px 18px 20px',
    borderRadius: 18,
    background: '#edf2ef',
  },
  subCardTitle: {
    margin: '0 0 12px',
    fontSize: 16,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#7e4d20',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 14,
  },
  panelTitle: {
    margin: '0 0 10px',
    fontSize: 21,
  },
  panelCopy: {
    margin: 0,
    color: '#536366',
    lineHeight: 1.5,
  },
  subTitle: {
    margin: '18px 0 10px',
    fontSize: 15,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7e4d20',
  },
  primaryButton: {
    border: 0,
    borderRadius: 14,
    padding: '10px 14px',
    background: '#152126',
    color: '#f7f2e7',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid rgba(21,33,38,0.18)',
    borderRadius: 14,
    padding: '10px 14px',
    background: '#f8faf9',
    color: '#152126',
    fontWeight: 700,
    cursor: 'pointer',
  },
  inlineButton: {
    border: '1px solid rgba(21,33,38,0.18)',
    borderRadius: 12,
    padding: '10px 12px',
    background: '#f8faf9',
    color: '#152126',
    fontWeight: 600,
    cursor: 'pointer',
  },
  fixtureList: {
    display: 'grid',
    gap: 10,
  },
  fixtureButton: {
    border: 0,
    borderRadius: 18,
    padding: '14px 16px',
    textAlign: 'left',
    background: '#e8ede8',
    color: '#152126',
    cursor: 'pointer',
  },
  fixtureButtonActive: {
    background: '#152126',
    color: '#f7f2e7',
  },
  fixtureName: {
    display: 'block',
    fontWeight: 700,
    marginBottom: 4,
  },
  fixtureMeta: {
    display: 'block',
    fontSize: 13,
    opacity: 0.8,
  },
  statGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
  },
  statCard: {
    padding: '14px 14px 16px',
    borderRadius: 16,
    background: '#152126',
    color: '#f7f2e7',
  },
  statLabel: {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#f0b56a',
  },
  statValue: {
    display: 'block',
    marginTop: 6,
    fontSize: 24,
    fontWeight: 700,
  },
  formGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  attributeGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  },
  field: {
    display: 'grid',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#7d633f',
  },
  input: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(21,33,38,0.14)',
    padding: '11px 12px',
    background: '#f9fbfa',
    color: '#152126',
    font: 'inherit',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(21,33,38,0.14)',
    padding: '11px 12px',
    background: '#f9fbfa',
    color: '#152126',
    font: 'inherit',
    boxSizing: 'border-box',
  },
  cardGrid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    marginTop: 16,
  },
  entityName: {
    margin: '0 0 6px',
    fontWeight: 700,
  },
  entitySummary: {
    margin: 0,
    lineHeight: 1.55,
    color: '#425459',
  },
  entityMeta: {
    margin: '10px 0 0',
    color: '#536366',
    fontSize: 13,
  },
  definitionList: {
    display: 'grid',
    gap: 8,
  },
  definitionRow: {
    display: 'grid',
    gridTemplateColumns: '92px 1fr',
    gap: 12,
    alignItems: 'start',
  },
  definitionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#7d633f',
  },
  definitionValue: {
    lineHeight: 1.45,
  },
  selectionSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryChip: {
    borderRadius: 999,
    padding: '10px 14px',
    background: '#edf2ef',
  },
  summaryChipLabel: {
    marginRight: 8,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6b5640',
  },
  summaryChipValue: {
    fontWeight: 700,
  },
  choiceEditorCard: {
    padding: '14px 16px',
    borderRadius: 16,
    background: '#edf2ef',
    marginBottom: 12,
  },
  choiceRows: {
    display: 'grid',
    gap: 10,
    marginTop: 12,
  },
  choiceRow: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.5fr) auto',
    alignItems: 'center',
  },
  choiceRowSingle: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
  },
  choiceRowSpell: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr) auto',
    alignItems: 'center',
  },
  equipmentList: {
    display: 'grid',
    gap: 12,
  },
  equipmentRow: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'minmax(0, 2fr) 120px minmax(0, 1fr) auto',
    alignItems: 'center',
  },
  noteList: {
    margin: 0,
    paddingLeft: 18,
    lineHeight: 1.55,
  },
  validationList: {
    display: 'grid',
    gap: 10,
  },
  validationItem: {
    display: 'grid',
    gap: 4,
    padding: '14px 16px',
    borderRadius: 16,
  },
  validationError: {
    background: '#f9e0dc',
    color: '#7c1e16',
  },
  validationWarning: {
    background: '#f6edd7',
    color: '#704d16',
  },
  validationNotes: {
    fontSize: 13,
    lineHeight: 1.5,
  },
  goodState: {
    margin: 0,
    padding: '14px 16px',
    borderRadius: 16,
    background: '#e3f2e5',
    color: '#135227',
  },
  choiceList: {
    display: 'grid',
    gap: 10,
  },
  choiceCard: {
    padding: '14px 16px',
    borderRadius: 16,
    background: '#edf2ef',
  },
  choiceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  choiceBadge: {
    borderRadius: 999,
    padding: '4px 10px',
    background: '#152126',
    color: '#f7f2e7',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  choiceMeta: {
    margin: '8px 0 0',
    fontSize: 13,
    color: '#5a6a6d',
  },
  choiceFilters: {
    margin: '8px 0 0',
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.5,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '0 0 10px',
    textAlign: 'left',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#7d633f',
    borderBottom: '1px solid rgba(21,33,38,0.12)',
  },
  td: {
    padding: '10px 0',
    verticalAlign: 'top',
    borderBottom: '1px solid rgba(21,33,38,0.08)',
    lineHeight: 1.45,
  },
  stepFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  emptyState: {
    margin: 0,
    color: '#5a6a6d',
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
