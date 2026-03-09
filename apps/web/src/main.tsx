import React from 'react'
import ReactDOM from 'react-dom/client'
import { getCompendiumSummary } from '@rifts-v2/compendium'
import { createStarterResolvedCharacter } from '@rifts-v2/rules-engine'

const summary = getCompendiumSummary()
const starter = createStarterResolvedCharacter()

function App() {
  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <p style={styles.eyebrow}>Rifts V2</p>
        <h1 style={styles.title}>New Architecture Scaffold</h1>
        <p style={styles.copy}>
          This repo is the clean-room workspace for the next version of the app.
          The current goal is to separate schema, compendium, and rules resolution
          before migrating feature parity from v1.
        </p>
      </section>

      <section style={styles.grid}>
        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Compendium</h2>
          <p style={styles.metric}>{summary.entityTypes} entity families</p>
          <p style={styles.cardCopy}>Current placeholder families: {summary.labels.join(', ')}</p>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Resolver</h2>
          <p style={styles.metric}>{starter.status}</p>
          <p style={styles.cardCopy}>{starter.notes}</p>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Next Docs</h2>
          <p style={styles.cardCopy}>
            See <code>docs/</code> for the project bible, schema spec, and migration plan.
          </p>
        </article>
      </section>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    margin: 0,
    padding: '48px 24px 64px',
    background: 'linear-gradient(180deg, #f3efe4 0%, #d9e4ea 100%)',
    color: '#14212b',
    fontFamily: '"Segoe UI", sans-serif',
  },
  panel: {
    maxWidth: 840,
    margin: '0 auto 32px',
    padding: '24px 28px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.72)',
    boxShadow: '0 14px 40px rgba(20, 33, 43, 0.12)',
  },
  eyebrow: {
    margin: '0 0 10px',
    fontSize: 12,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#7a4d1d',
  },
  title: {
    margin: '0 0 12px',
    fontSize: 42,
    lineHeight: 1.05,
  },
  copy: {
    margin: 0,
    maxWidth: 720,
    fontSize: 18,
    lineHeight: 1.6,
  },
  grid: {
    maxWidth: 840,
    margin: '0 auto',
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  card: {
    padding: 20,
    borderRadius: 18,
    background: '#14212b',
    color: '#f7f3ea',
    boxShadow: '0 10px 30px rgba(20, 33, 43, 0.18)',
  },
  cardTitle: {
    margin: '0 0 10px',
    fontSize: 18,
  },
  metric: {
    margin: '0 0 10px',
    fontSize: 28,
    fontWeight: 700,
    color: '#f4b266',
  },
  cardCopy: {
    margin: 0,
    lineHeight: 1.5,
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
