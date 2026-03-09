import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import snapshotData from './demoSnapshot.generated.json'
import { createCompendiumRegistry } from '@rifts-v2/compendium'
import { resolveCharacterBuild } from '@rifts-v2/rules-engine'
import type { CharacterBuild, ChoiceSlot, CompendiumEntity, ResolvedCharacter } from '@rifts-v2/schema'

type DemoSnapshot = {
  generatedAt: string
  entityCount: number
  entities: CompendiumEntity[]
  fixtures: CharacterBuild[]
}

const demoSnapshot = snapshotData as DemoSnapshot
const registry = createCompendiumRegistry(demoSnapshot.entities)
const fixtureMap = new Map(demoSnapshot.fixtures.map(fixture => [fixture.id, fixture]))
const entityStats = {
  races: registry.byKind.get('race')?.length ?? 0,
  rccs: registry.byKind.get('rcc')?.length ?? 0,
  occs: registry.byKind.get('occ')?.length ?? 0,
  skills: registry.byKind.get('skill')?.length ?? 0,
  powers: registry.byKind.get('power')?.length ?? 0,
  spells: registry.byKind.get('spell')?.length ?? 0,
  attacks: registry.byKind.get('attack')?.length ?? 0,
  equipment: registry.byKind.get('equipment')?.length ?? 0,
  vehicles: registry.byKind.get('vehicle')?.length ?? 0,
}

function App() {
  const [activeFixtureId, setActiveFixtureId] = useState(demoSnapshot.fixtures[0]?.id ?? '')
  const build = fixtureMap.get(activeFixtureId) ?? demoSnapshot.fixtures[0]
  const resolved = build ? resolveCharacterBuild({ registry, build }) : null

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Rifts V2 Alpha</p>
          <h1 style={styles.title}>Fixture Viewer</h1>
          <p style={styles.copy}>
            This is the first browser-testable V2 surface. It resolves committed fixtures against the
            normalized compendium snapshot and shows the output the next builder and sheet will consume.
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
          <h2 style={styles.panelTitle}>Fixture Set</h2>
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
        ? <ResolvedView build={build} resolved={resolved} />
        : <section style={styles.panel}><p style={styles.copy}>No fixture loaded.</p></section>}
    </main>
  )
}

function ResolvedView({ build, resolved }: { build: CharacterBuild; resolved: ResolvedCharacter }) {
  return (
    <section style={styles.viewerGrid}>
      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Build</h2>
        <div style={styles.definitionList}>
          <Definition label="Fixture">{build.id}</Definition>
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
        <ul style={styles.noteList}>
          {resolved.explanations.flatMap(explanation => explanation.notes ?? []).map(note => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </article>

      <article style={styles.panel}>
        <h2 style={styles.panelTitle}>Validation</h2>
        {resolved.validation.length
          ? (
            <div style={styles.validationList}>
              {resolved.validation.map(issue => (
                <div key={issue.id} style={{
                  ...styles.validationItem,
                  ...(issue.severity === 'error' ? styles.validationError : styles.validationWarning),
                }}>
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
            : <p style={styles.emptyState}>No open choices for this fixture.</p>}
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
    maxWidth: 1320,
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
    maxWidth: 1320,
    margin: '0 auto 20px',
    display: 'grid',
    gap: 20,
    gridTemplateColumns: '1.05fr 1.45fr',
  },
  viewerGrid: {
    maxWidth: 1320,
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
  panelTitle: {
    margin: '0 0 14px',
    fontSize: 21,
  },
  subTitle: {
    margin: '18px 0 10px',
    fontSize: 15,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7e4d20',
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
