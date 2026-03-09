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
  CompendiumRace,
  CompendiumRcc,
  CompendiumSkill,
  EquipmentSelection,
  ResolvedCharacter,
  SkillSelection,
} from '@rifts-v2/schema'

type DemoSnapshot = {
  generatedAt: string
  entityCount: number
  entities: CompendiumEntity[]
  fixtures: CharacterBuild[]
}

const demoSnapshot = snapshotData as DemoSnapshot
const registry = createCompendiumRegistry(demoSnapshot.entities)
const fixtureMap = new Map(demoSnapshot.fixtures.map(fixture => [fixture.id, fixture]))
const races = sortByName((registry.byKind.get('race') ?? []) as CompendiumRace[])
const rccs = sortByName((registry.byKind.get('rcc') ?? []) as CompendiumRcc[])
const occs = sortByName((registry.byKind.get('occ') ?? []) as CompendiumOcc[])
const equipmentCatalog = sortByName((registry.byKind.get('equipment') ?? []) as CompendiumEquipment[])
const entityStats = {
  races: races.length,
  rccs: rccs.length,
  occs: occs.length,
  skills: registry.byKind.get('skill')?.length ?? 0,
  powers: registry.byKind.get('power')?.length ?? 0,
  spells: registry.byKind.get('spell')?.length ?? 0,
  attacks: registry.byKind.get('attack')?.length ?? 0,
  equipment: equipmentCatalog.length,
  vehicles: registry.byKind.get('vehicle')?.length ?? 0,
}

function App() {
  const defaultFixture = demoSnapshot.fixtures[0] ?? null
  const [activeFixtureId, setActiveFixtureId] = useState(defaultFixture?.id ?? '')
  const [build, setBuild] = useState<CharacterBuild | null>(defaultFixture ? cloneBuild(defaultFixture) : null)

  useEffect(() => {
    const fixture = fixtureMap.get(activeFixtureId) ?? defaultFixture
    setBuild(fixture ? cloneBuild(fixture) : null)
  }, [activeFixtureId, defaultFixture])

  const resolved = build ? resolveCharacterBuild({ registry, build }) : null

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Rifts V2 Alpha</p>
          <h1 style={styles.title}>Fixture Viewer and Limited Editor</h1>
          <p style={styles.copy}>
            This is the first browser-testable V2 surface. It loads a committed normalized snapshot,
            lets you start from a known fixture, and edits a live build document against the new resolver.
          </p>
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

      <section style={styles.topGrid}>
        <article style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Fixture Set</h2>
              <p style={styles.panelCopy}>Load a known parity case or start a fresh working build.</p>
            </div>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => {
                setActiveFixtureId('')
                setBuild(createBlankBuild())
              }}
            >
              New Blank Build
            </button>
          </div>
          <div style={styles.fixtureList}>
            {demoSnapshot.fixtures.map(fixture => {
              const selected = fixture.id === activeFixtureId
              return (
                <button
                  key={fixture.id}
                  type="button"
                  onClick={() => setActiveFixtureId(fixture.id)}
                  style={{
                    ...styles.fixtureButton,
                    ...(selected ? styles.fixtureButtonActive : {}),
                  }}
                >
                  <span style={styles.fixtureName}>{fixture.name}</span>
                  <span style={styles.fixtureMeta}>
                    {fixture.raceId ?? 'No race'} / {fixture.rccId ?? fixture.occId ?? 'No class'} / level {fixture.level}
                  </span>
                </button>
              )
            })}
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

      {build && resolved
        ? (
          <>
            <BuildEditor
              build={build}
              resolved={resolved}
              onChange={setBuild}
              onReset={() => {
                const fixture = fixtureMap.get(activeFixtureId) ?? defaultFixture
                setBuild(fixture ? cloneBuild(fixture) : null)
              }}
            />
            <ResolvedView build={build} resolved={resolved} />
          </>
          )
        : <section style={styles.panel}><p style={styles.copy}>No fixture loaded.</p></section>}
    </main>
  )
}

function BuildEditor({
  build,
  resolved,
  onChange,
  onReset,
}: {
  build: CharacterBuild
  resolved: ResolvedCharacter
  onChange: React.Dispatch<React.SetStateAction<CharacterBuild | null>>
  onReset: () => void
}) {
  const skillChoices = resolved.availableChoices.filter(choice => choice.choiceFamily === 'skill')

  return (
    <section style={styles.editorGrid}>
      <article style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>Editable Build</h2>
            <p style={styles.panelCopy}>
              Narrow alpha editor over the V2 build document. Powers and spells still come from the loaded fixture.
            </p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={onReset}>
            Reset to Fixture
          </button>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Name</span>
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
            <span style={styles.fieldLabel}>Race</span>
            <select
              style={styles.select}
              value={build.raceId ?? ''}
              onChange={event => onChange(current => current ? {
                ...current,
                raceId: normalizeSelectValue(event.target.value),
              } : current)}
            >
              <option value="">No race</option>
              {races.map(race => <option key={race.id} value={race.id}>{race.name}</option>)}
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
              {rccs.map(rcc => <option key={rcc.id} value={rcc.id}>{rcc.name}</option>)}
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
              {occs.map(occ => <option key={occ.id} value={occ.id}>{occ.name}</option>)}
            </select>
          </label>
        </div>

        <h3 style={styles.subTitle}>Attributes</h3>
        <p style={styles.panelCopy}>{formatAttributes(build)}</p>

        <h3 style={styles.subTitle}>Selections</h3>
        <div style={styles.selectionSummary}>
          <SummaryChip label="Skills" value={build.skillSelections.length} />
          <SummaryChip label="Equipment" value={build.equipmentSelections.length} />
          <SummaryChip label="Powers" value={build.powerSelections.length} />
          <SummaryChip label="Spells" value={build.spellSelections.length} />
        </div>
      </article>

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Skill Choices</h2>
        {skillChoices.length
          ? skillChoices.map(choice => (
            <SkillChoiceEditor
              key={choice.id}
              build={build}
              choice={choice}
              onChange={onChange}
            />
          ))
          : <p style={styles.emptyState}>No active skill choice slots for this build.</p>}
      </article>

      <article style={styles.panelWide}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>Equipment Loadout</h2>
            <p style={styles.panelCopy}>Freeform alpha loadout editor over normalized equipment entities.</p>
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
            : <p style={styles.emptyState}>No equipment selected.</p>}
        </div>
      </article>
    </section>
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
    <div style={styles.choiceEditorCard}>
      <div style={styles.choiceHeader}>
        <strong>{choice.label}</strong>
        <span style={styles.choiceBadge}>{slotSelections.length}/{choice.count}</span>
      </div>
      <p style={styles.choiceMeta}>
        Source {choice.sourceLabel ?? '—'}
      </p>

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
                  const nextSkillId = event.target.value
                  onChange(current => current ? setSkillSelectionForSlot(current, choice.id, index, nextSkillId) : current)
                }}
              >
                <option value="">Open slot</option>
                {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>

              {selection && specializationRule
                ? <SkillSpecializationField selection={selection} skill={skillEntity!} onChange={onChange} />
                : null}

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
                : null}
            </div>
          )
        })}
      </div>
    </div>
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

function ResolvedView({ build, resolved }: { build: CharacterBuild; resolved: ResolvedCharacter }) {
  return (
    <section style={styles.viewerGrid}>
      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Build Snapshot</h2>
        <div style={styles.definitionList}>
          <Definition label="Build">{build.id}</Definition>
          <Definition label="Name">{build.name}</Definition>
          <Definition label="Race">{build.raceId ?? 'None'}</Definition>
          <Definition label="RCC">{build.rccId ?? 'None'}</Definition>
          <Definition label="OCC">{build.occId ?? 'None'}</Definition>
          <Definition label="Level">{String(build.level)}</Definition>
          <Definition label="Attributes">{formatAttributes(build)}</Definition>
        </div>

        <h3 style={styles.subTitle}>Selections</h3>
        <div style={styles.selectionSummary}>
          <SummaryChip label="Skills" value={build.skillSelections.length} />
          <SummaryChip label="Powers" value={build.powerSelections.length} />
          <SummaryChip label="Spells" value={build.spellSelections.length} />
          <SummaryChip label="Equipment" value={build.equipmentSelections.length} />
        </div>

        <h3 style={styles.subTitle}>Explanation</h3>
        {resolved.explanations.flatMap(explanation => explanation.notes ?? []).length
          ? (
            <ul style={styles.noteList}>
              {resolved.explanations.flatMap(explanation => explanation.notes ?? []).map(note => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            )
          : <p style={styles.emptyState}>No explanation notes yet.</p>}
      </article>

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Validation</h2>
        {resolved.validation.length
          ? (
            <div style={styles.validationList}>
              {resolved.validation.map(issue => (
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
          : <p style={styles.goodState}>No validation issues.</p>}

        <h3 style={styles.subTitle}>Available Choices</h3>
        <div style={styles.choiceList}>
          {resolved.availableChoices.length
            ? resolved.availableChoices.map(choice => <ChoiceCard key={choice.id} choice={choice} />)
            : <p style={styles.emptyState}>No open choices for this build.</p>}
        </div>
      </article>

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Resources and Modifiers</h2>
        <SectionTable
          columns={['Pool', 'Formula / Max', 'Source']}
          rows={resolved.pools.map(pool => [
            pool.label,
            pool.formula ?? String(pool.maxValue ?? '—'),
            pool.sourceLabels?.join(', ') ?? '—',
          ])}
          emptyLabel="No resource pools."
        />

        <h3 style={styles.subTitle}>Modifiers</h3>
        <SectionTable
          columns={['Target', 'Operation', 'Value', 'Source']}
          rows={resolved.modifiers.map(modifier => [
            modifier.target,
            modifier.operation,
            String(modifier.appliedValue),
            modifier.sourceLabel ?? '—',
          ])}
          emptyLabel="No modifiers."
        />
      </article>

      <article style={styles.panelWide}>
        <h2 style={styles.panelTitle}>Skills</h2>
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

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Powers</h2>
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

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Spells</h2>
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

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Attacks</h2>
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

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Equipment</h2>
        <SectionTable
          columns={['Name', 'Family', 'Qty', 'Slot']}
          rows={resolved.equipment.map(item => [
            item.name,
            item.equipmentFamily,
            String(item.quantity),
            item.equippedSlotId ?? item.eligibleSlots?.join(', ') ?? '—',
          ])}
          emptyLabel="No resolved equipment."
        />
      </article>
    </section>
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

function cloneBuild(build: CharacterBuild): CharacterBuild {
  return {
    ...build,
    attributes: { ...build.attributes },
    skillSelections: build.skillSelections.map(selection => ({ ...selection })),
    powerSelections: build.powerSelections.map(selection => ({ ...selection })),
    spellSelections: build.spellSelections.map(selection => ({ ...selection })),
    packageSelections: build.packageSelections.map(selection => ({ ...selection })),
    equipmentSelections: build.equipmentSelections.map(selection => ({ ...selection })),
    levelSelections: build.levelSelections.map(selection => {
      const cloned = { level: selection.level }
      return {
        ...cloned,
        ...(selection.skillSelections ? { skillSelections: selection.skillSelections.map(item => ({ ...item })) } : {}),
        ...(selection.powerSelections ? { powerSelections: selection.powerSelections.map(item => ({ ...item })) } : {}),
        ...(selection.spellSelections ? { spellSelections: selection.spellSelections.map(item => ({ ...item })) } : {}),
        ...(selection.packageSelections ? { packageSelections: selection.packageSelections.map(item => ({ ...item })) } : {}),
      }
    }),
  }
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

function updateSkillSelection(
  build: CharacterBuild,
  selectionId: string,
  patch: Partial<SkillSelection>,
) {
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

function updateEquipmentSelection(
  build: CharacterBuild,
  selectionId: string,
  patch: Partial<EquipmentSelection>,
) {
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
    background: 'rgba(255,255,255,0.8)',
    boxShadow: '0 18px 44px rgba(21, 33, 38, 0.12)',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: '2.2fr 1fr',
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
  copy: {
    margin: 0,
    lineHeight: 1.6,
    fontSize: 17,
    maxWidth: 740,
  },
  heroMeta: {
    display: 'grid',
    gap: 12,
    alignContent: 'start',
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
  topGrid: {
    maxWidth: 1440,
    margin: '0 auto 20px',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: '1.05fr 1.45fr',
  },
  editorGrid: {
    maxWidth: 1440,
    margin: '0 auto 20px',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  viewerGrid: {
    maxWidth: 1440,
    margin: '0 auto',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  panel: {
    minWidth: 0,
    padding: '22px 24px',
    borderRadius: 22,
    background: 'rgba(255,255,255,0.82)',
    boxShadow: '0 16px 38px rgba(21, 33, 38, 0.11)',
  },
  panelWide: {
    minWidth: 0,
    padding: '22px 24px',
    borderRadius: 22,
    background: 'rgba(255,255,255,0.82)',
    boxShadow: '0 16px 38px rgba(21, 33, 38, 0.11)',
    gridColumn: '1 / -1',
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
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
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
