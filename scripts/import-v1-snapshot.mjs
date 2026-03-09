import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { adaptV1Snapshot } from '../packages/compendium/src/index.ts'
import { resolveCharacterBuild } from '../packages/rules-engine/src/index.ts'
import { FIXTURE_CHARACTERS } from '../tests/fixtures/characters.ts'

const v1Root = process.env.RIFTS_V1_ROOT || '/home/pablo/rifts-app'

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function loadV1Skills(root) {
  const moduleUrl = pathToFileURL(path.join(root, 'src/data/skills.js')).href
  const mod = await import(moduleUrl)
  const normalizedSkills = typeof mod.getNormalizedSkills === 'function' ? mod.getNormalizedSkills() : []
  return normalizedSkills.map(skill => ({
    id: skill.id,
    name: skill.name,
    category: skill.category,
    base: skill.progression?.base_percent ?? null,
    perLevel: skill.progression?.per_level_percent ?? null,
    requires: [
      ...(skill.requirements?.skills_all ?? []),
      ...((skill.requirements?.skills_any ?? []).length ? [] : []),
    ],
    notes: skill.notes,
    metadata: {
      repeatable: skill.repeatable,
      specializationLabel: skill.specializationLabel,
      specializationOptions: null,
    },
  }))
}

async function main() {
  const races = await readJson(path.join(v1Root, 'src/data/published.races.json'))
  const occs = await readJson(path.join(v1Root, 'src/data/published.occs.json'))
  const skills = await loadV1Skills(v1Root)

  const registry = adaptV1Snapshot({ races, occs, skills })

  console.log(`Imported entities: ${registry.all.length}`)
  console.log(`Races: ${(registry.byKind.get('race') || []).length}`)
  console.log(`RCCs: ${(registry.byKind.get('rcc') || []).length}`)
  console.log(`OCCs: ${(registry.byKind.get('occ') || []).length}`)
  console.log(`Skills: ${(registry.byKind.get('skill') || []).length}`)

  for (const fixture of FIXTURE_CHARACTERS) {
    const resolved = resolveCharacterBuild({ registry, build: fixture })
    console.log(`\nFixture: ${fixture.id}`)
    console.log(`Name: ${resolved.name}`)
    console.log(`Pools: ${resolved.pools.map(pool => `${pool.label}:${pool.formula ?? pool.maxValue ?? '—'}`).join(', ') || 'none'}`)
    console.log(`Skills: ${resolved.skills.length}`)
    console.log(`Choices: ${resolved.availableChoices.length}`)
    console.log(`Validation: ${resolved.validation.length}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
