import type { TraitContent } from '../../model/trait';

import { assertTraitsContent } from './schema';

import TRAITS_CONTENT from '@/content/traits.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const TRAITS = assertTraitsContent(TRAITS_CONTENT).traits;

export const listTraits = (): readonly TraitContent[] => TRAITS;

export const getTraitById = (id: string): TraitContent | undefined =>
  TRAITS.find((trait) => trait.id === id);
