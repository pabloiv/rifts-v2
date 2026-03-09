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

function parseSkillRequirements(requirements = {}) {
  const requiresAll = []
  const requiresAny = []
  const requirementNotes = []
  const rawAll = Array.isArray(requirements.skills_all) ? requirements.skills_all : []
  const rawAny = Array.isArray(requirements.skills_any) ? requirements.skills_any : []

  for (const entry of rawAll) {
    if (typeof entry !== 'string' || !entry.trim()) continue
    const parts = entry.split(/\s+or\s+/i).map(part => part.trim()).filter(Boolean)
    if (parts.length > 1) {
      if (requiresAny.length === 0) requiresAny.push(...parts)
      else requirementNotes.push(`Additional alternate prerequisite group: ${entry}`)
      continue
    }
    requiresAll.push(entry)
  }

  for (const entry of rawAny) {
    if (typeof entry !== 'string' || !entry.trim()) continue
    requiresAny.push(entry)
  }

  return {
    requiresAll,
    requiresAny,
    requirementNotes,
  }
}

async function loadV1Skills(root) {
  const moduleUrl = pathToFileURL(path.join(root, 'src/data/skills.js')).href
  const mod = await import(moduleUrl)
  const normalizedSkills = typeof mod.getNormalizedSkills === 'function' ? mod.getNormalizedSkills() : []
  return normalizedSkills.map(skill => ({
    ...parseSkillRequirements(skill.requirements),
    id: skill.id,
    name: skill.name,
    category: skill.category,
    base: skill.progression?.base_percent ?? null,
    perLevel: skill.progression?.per_level_percent ?? null,
    notes: skill.notes,
    metadata: {
      repeatable: skill.repeatable,
      specializationLabel: skill.specializationLabel,
      specializationOptions: null,
    },
  }))
}

async function loadV1Equipment(root) {
  const moduleUrl = pathToFileURL(path.join(root, 'src/data/equipment.js')).href
  const mod = await import(moduleUrl)
  return Array.isArray(mod.EQUIPMENT) ? mod.EQUIPMENT : []
}

async function loadV1Powers(root) {
  const generatedUrl = pathToFileURL(path.join(root, 'src/data/psionics.v1.generated.js')).href
  const descriptionsUrl = pathToFileURL(path.join(root, 'src/data/psionics.longDescriptions.js')).href
  const generated = await import(generatedUrl)
  const descriptions = await import(descriptionsUrl)
  const powers = Array.isArray(generated.default?.powers) ? generated.default.powers : []
  const longDescriptions = descriptions.PSIONIC_LONG_DESCRIPTIONS ?? {}

  return powers.map(power => ({
    id: power.id,
    name: power.name,
    category: power.category ?? null,
    summary: power.summary ?? null,
    fullDesc: longDescriptions[power.id] ?? power.mechanics ?? power.summary ?? null,
    costLabel: power.isp?.text ?? null,
    costValue: power.isp?.kind === 'fixed' ? power.isp.fixed ?? null : null,
    range: power.range?.text ?? null,
    duration: power.duration?.text ?? null,
    saveType: power.saving_throw?.type ?? null,
  }))
}

async function loadV1Spells(root) {
  const moduleUrl = pathToFileURL(path.join(root, 'src/data/spells.js')).href
  const mod = await import(moduleUrl)
  const spells = Array.isArray(mod.SPELLS) ? mod.SPELLS : []
  return spells.map(spell => ({
    id: spell.id,
    name: spell.name,
    level: spell.level ?? null,
    ppeCost: spell.ppeCost ?? null,
    range: spell.range ?? null,
    duration: spell.duration ?? null,
    saveType: spell.saveType ?? null,
    saveDifficulty: spell.saveDifficulty ?? null,
    desc: spell.desc ?? null,
  }))
}

async function main() {
  const races = await readJson(path.join(v1Root, 'src/data/published.races.json'))
  const occs = await readJson(path.join(v1Root, 'src/data/published.occs.json'))
  const skills = await loadV1Skills(v1Root)
  const equipment = await loadV1Equipment(v1Root)
  const powers = await loadV1Powers(v1Root)
  const spells = await loadV1Spells(v1Root)

  const registry = adaptV1Snapshot({ races, occs, skills, equipment, powers, spells })

  console.log(`Imported entities: ${registry.all.length}`)
  console.log(`Races: ${(registry.byKind.get('race') || []).length}`)
  console.log(`RCCs: ${(registry.byKind.get('rcc') || []).length}`)
  console.log(`OCCs: ${(registry.byKind.get('occ') || []).length}`)
  console.log(`Skills: ${(registry.byKind.get('skill') || []).length}`)
  console.log(`Powers: ${(registry.byKind.get('power') || []).length}`)
  console.log(`Spells: ${(registry.byKind.get('spell') || []).length}`)
  console.log(`Equipment: ${(registry.byKind.get('equipment') || []).length}`)
  console.log(`Vehicles: ${(registry.byKind.get('vehicle') || []).length}`)

  for (const fixture of FIXTURE_CHARACTERS) {
    const resolved = resolveCharacterBuild({ registry, build: fixture })
    console.log(`\nFixture: ${fixture.id}`)
    console.log(`Name: ${resolved.name}`)
    console.log(`Pools: ${resolved.pools.map(pool => `${pool.label}:${pool.formula ?? pool.maxValue ?? '—'}`).join(', ') || 'none'}`)
    console.log(`Skills: ${resolved.skills.length}`)
    console.log(`Skill samples: ${resolved.skills.slice(0, 3).map(skill => `${skill.name}:${skill.total ?? '—'}`).join(', ') || 'none'}`)
    console.log(`Powers: ${resolved.powers.length}`)
    console.log(`Spells: ${resolved.spells.length}`)
    console.log(`Equipment: ${resolved.equipment.length}`)
    console.log(`Modifiers: ${resolved.modifiers.length}`)
    console.log(`Choices: ${resolved.availableChoices.length}`)
    console.log(`Validation: ${resolved.validation.length}`)
    if (resolved.validation.length) {
      console.log(`Validation messages: ${resolved.validation.map(issue => issue.message).join(' | ')}`)
    }
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
