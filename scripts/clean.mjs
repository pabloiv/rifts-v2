import { rm } from 'node:fs/promises'

const targets = [
  new URL('../apps/web/dist', import.meta.url),
  new URL('../packages/schema/dist', import.meta.url),
  new URL('../packages/compendium/dist', import.meta.url),
  new URL('../packages/rules-engine/dist', import.meta.url),
]

await Promise.all(targets.map(async target => {
  try {
    await rm(target, { recursive: true, force: true })
  } catch {
    // Ignore missing paths.
  }
}))
