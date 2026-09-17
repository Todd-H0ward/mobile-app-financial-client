import { PERIOD_NEED_DECAY } from '@/entities/economy';

import { clamp } from '@/shared/utils';

import { getTraitById } from './catalogue';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Floor so a stack of discounts never makes a free item. */
const MIN_PRICE = 1;

/** Decay stays on the 0…1 axis and never vanishes or eats the pet in one step. */
const DECAY_MIN = 0.01;
const DECAY_MAX = 0.5;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const multiplyCategory = (
  traitIds: readonly string[],
  category: string,
): number => {
  let factor = 1;
  for (const id of traitIds) {
    const trait = getTraitById(id);
    const mod = trait?.priceByCategory?.[category];
    if (mod != null) factor *= mod;
  }
  return factor;
};

const multiplyDecay = (
  traitIds: readonly string[],
  axis: 'comfort' | 'spirit',
): number => {
  let factor = 1;
  for (const id of traitIds) {
    const trait = getTraitById(id);
    const mod = trait?.decay?.[axis];
    if (mod != null) factor *= mod;
  }
  return factor;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Catalogue price after trait multipliers for this category.
 *
 * Unknown ids are ignored (migration / typo). Always at least one coin.
 */
export const priceFor = (
  basePrice: number,
  category: string,
  traitIds: readonly string[],
): number => {
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return MIN_PRICE;
  }
  const scaled = basePrice * multiplyCategory(traitIds, category);
  return Math.max(MIN_PRICE, Math.round(scaled));
};

/**
 * Period need decay after trait multipliers.
 *
 * Same helper the settlement uses — shop never invents its own rates.
 */
export const needDecayFor = (
  traitIds: readonly string[],
): { comfort: number; spirit: number } => ({
  comfort: clamp(
    PERIOD_NEED_DECAY.comfort * multiplyDecay(traitIds, 'comfort'),
    DECAY_MIN,
    DECAY_MAX,
  ),
  spirit: clamp(
    PERIOD_NEED_DECAY.spirit * multiplyDecay(traitIds, 'spirit'),
    DECAY_MIN,
    DECAY_MAX,
  ),
});
