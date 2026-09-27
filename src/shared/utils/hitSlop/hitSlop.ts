import { HIT_SLOP_SIZE } from '@/shared/constants/a11y';

/** Extra hitSlop so a sub-48dp control still meets the a11y floor. */
export const hitSlopFor = (visualSize: number): number =>
  Math.max(0, Math.ceil((HIT_SLOP_SIZE - visualSize) / 2));
