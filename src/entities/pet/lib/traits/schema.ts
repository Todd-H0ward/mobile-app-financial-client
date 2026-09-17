import { isNonEmptyString, isRecord } from '@/shared/utils';

import type { TraitContent, TraitsFile } from '../../model/trait';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Enough for a real choice — one of each tradeoff shape. */
const MIN_TRAITS = 3;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const assertPositiveMultiplier = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${path}: positive finite number required`);
  }
  return value;
};

const assertTrait = (trait: unknown, path: string): TraitContent => {
  if (!isRecord(trait)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(trait.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isNonEmptyString(trait.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!isNonEmptyString(trait.blurb)) {
    throw new Error(`${path}.blurb: non-empty string required`);
  }

  let priceByCategory: Record<string, number> | undefined;
  if (trait.priceByCategory !== undefined) {
    if (!isRecord(trait.priceByCategory)) {
      throw new Error(`${path}.priceByCategory: object when present`);
    }
    priceByCategory = {};
    for (const [key, value] of Object.entries(trait.priceByCategory)) {
      if (!isNonEmptyString(key)) {
        throw new Error(`${path}.priceByCategory: non-empty keys`);
      }
      priceByCategory[key] = assertPositiveMultiplier(
        value,
        `${path}.priceByCategory.${key}`,
      );
    }
  }

  let decay: TraitContent['decay'];
  if (trait.decay !== undefined) {
    if (!isRecord(trait.decay)) {
      throw new Error(`${path}.decay: object when present`);
    }
    decay = {};
    if (trait.decay.comfort !== undefined) {
      decay.comfort = assertPositiveMultiplier(
        trait.decay.comfort,
        `${path}.decay.comfort`,
      );
    }
    if (trait.decay.spirit !== undefined) {
      decay.spirit = assertPositiveMultiplier(
        trait.decay.spirit,
        `${path}.decay.spirit`,
      );
    }
  }

  const hasPrice =
    priceByCategory != null && Object.keys(priceByCategory).length > 0;
  const hasDecay =
    decay != null && (decay.comfort != null || decay.spirit != null);
  if (!hasPrice && !hasDecay) {
    throw new Error(
      `${path}: need at least one price or decay modifier — docs/pet.md`,
    );
  }

  return {
    id: trait.id,
    title: trait.title,
    blurb: trait.blurb,
    ...(priceByCategory ? { priceByCategory } : {}),
    ...(decay ? { decay } : {}),
  };
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/traits.json` (or a fixture shaped like it).
 *
 * Traits shift prices and need speeds; a broken row here would silently
 * no-op on device. Fail in tests instead.
 */
export const assertTraitsContent = (data: unknown): TraitsFile => {
  if (!isRecord(data)) {
    throw new Error('traits content: must be an object');
  }
  if (!Array.isArray(data.traits)) {
    throw new Error('traits content: "traits" must be an array');
  }
  if (data.traits.length < MIN_TRAITS) {
    throw new Error(`traits content: need at least ${MIN_TRAITS} traits`);
  }

  const ids = new Set<string>();

  const traits = data.traits.map((trait, index) => {
    const parsed = assertTrait(trait, `traits[${index}]`);
    if (ids.has(parsed.id)) {
      throw new Error(`traits: duplicate id "${parsed.id}"`);
    }
    ids.add(parsed.id);
    return parsed;
  });

  return { traits };
};
