import type { ResolvedCharacter } from '@rifts-v2/schema'

export function createStarterResolvedCharacter(): ResolvedCharacter {
  return {
    actorId: 'starter',
    status: 'scaffold',
    notes: 'Resolver placeholder ready for the first normalized compendium and migration adapter pass.',
  }
}
