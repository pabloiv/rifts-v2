import type { ResolvedCharacter } from '@rifts-v2/schema'

export function createStarterResolvedCharacter(): ResolvedCharacter {
  return {
    actorId: 'starter',
    actorType: 'character',
    name: 'Starter Character',
    sourceRefs: [],
    pools: [],
    skills: [],
    powers: [],
    spells: [],
    attacks: [],
    modifiers: [],
    availableChoices: [],
    validation: [],
    explanations: [
      {
        id: 'resolver-scaffold',
        target: 'resolver',
        label: 'Scaffold ready',
        sourceLabels: ['rules-engine'],
        notes: ['Resolver placeholder ready for the first normalized compendium and migration adapter pass.'],
      },
    ],
  }
}
