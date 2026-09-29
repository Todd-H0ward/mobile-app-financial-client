import type { SpriteName } from '@/entities/sprite';

import type { PlaykitGameId } from '../../lib/payout';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The picture each Overseer trial wears in the arcade list. */
export const GAME_COVER_SPRITES: Record<PlaykitGameId, SpriteName> = {
  conveyor: 'crate',
  scales: 'scales',
  cashier: 'register',
  jar: 'jar',
  pinball: 'gear',
  memory: 'cardBack',
  path: 'stairs',
  assemble: 'dogHead',
  laser: 'receipt',
  orbit: 'piggy',
};
