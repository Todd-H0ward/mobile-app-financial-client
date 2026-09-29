/** Shared arcade rules — sittings, payouts, the game catalogue. */

export { GAME_COVER_SPRITES } from './art';
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
