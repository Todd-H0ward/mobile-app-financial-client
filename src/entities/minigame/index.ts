/**
 * Shared arcade rules — sittings, payouts, the game catalogue.
 *
 * Per-game rules live behind their own entry points so a leaf import does not
 * drag every mechanic in:
 *
 * - `@/entities/minigame/puzzle` — jigsaw geometry, board session, levels
 *
 * Scenes and shells sit in `@/widgets/minigame` / `@/widgets/minigame/puzzle`.
 */

export type { GameId, PayoutInput } from './lib/payout';
export { GAME_REWARDS, payoutFor, WRONG_ROUND_SHARE } from './lib/payout';
