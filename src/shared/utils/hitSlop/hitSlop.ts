import { HIT_SLOP_SIZE } from '@/shared/constants/a11y';

/**
 * Uniform `hitSlop` so a control whose visual size is under 48dp still meets
 * the accessibility floor without growing the layout — see docs/accessibility.md.
 *
 * Pass the smaller axis (usually height).
 *
 * @example
 * hitSlopFor(40); // 4 — expands a 40dp button to a 48dp target
 */
export const hitSlopFor = (visualSize: number): number =>
  Math.max(0, Math.ceil((HIT_SLOP_SIZE - visualSize) / 2));
