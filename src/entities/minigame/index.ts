/**
 * Shared arcade rules — sittings, payouts, the game catalogue.
 *
 * Per-game rules live behind their own entry points so a leaf import does not
 * drag every mechanic in:
 *
 * - `@/entities/minigame/puzzle` — jigsaw geometry, board session, levels
 * - `@/entities/minigame/console` — console ownership
 * - `@/entities/minigame/snake` — snake grid session
 * - `@/entities/minigame/spacewar` — short space shoot-out
 * - `@/entities/minigame/playkit` — Overseer gesture games (conveyor…orbit)
 *
 * Scenes sit in `@/widgets/minigame/<game>`.
 */

export type {
  ClassicGameId,
  GameId,
  PayoutInput,
  PlaykitGameId,
} from './lib/payout';
export {
  GAME_REWARDS,
  isPlaykitGameId,
  PLAYKIT_GAME_IDS,
  payoutFor,
  WRONG_ROUND_SHARE,
} from './lib/payout';
