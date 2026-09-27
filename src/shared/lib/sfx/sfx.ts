import type { SoundId } from '@/shared/constants/sounds';

/** Cue ids matching files in `assets/audio/*.wav` — see `SOUNDS`. */
type SfxId = SoundId;

/** Minimal player surface used by GameAudioImpl — keeps shared free of expo-audio. */
interface SfxPlayer {
  pause: () => void;
  play: () => void;
  seekTo: (seconds: number) => Promise<unknown>;
}

type SfxPlayerMap = Partial<Record<SfxId, SfxPlayer>>;

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

/** Bound from Providers — shared must not import the user store. */
let isSoundAllowed = (): boolean => true;

/** True while the app is foregrounded; GameAudioImpl flips this on AppState. */
let isAppActive = (): boolean => true;

let players: SfxPlayerMap = {};
let generation = 0;
let lastPlayedAt = 0;
let lastPlayedId: SfxId | null = null;

/** Ignore a second fire of the same cue within this window (ms). */
const DEBOUNCE_MS = 40;

// ═══════════════════════════════════════════
// API
// ═══════════════════════════════════════════

export const bindSfxSoundGate = (gate: () => boolean): void => {
  isSoundAllowed = gate;
};

export const bindSfxAppActive = (gate: () => boolean): void => {
  isAppActive = gate;
};

/** Called once from GameAudioImpl after all players are created. */
export const registerSfxPlayers = (next: SfxPlayerMap): void => {
  players = next;
  lastPlayedId = null;
  lastPlayedAt = 0;
};

/** Stop every registered player and invalidate in-flight seeks. */
export const stopSfx = (): void => {
  generation += 1;
  for (const player of Object.values(players)) {
    player?.pause();
  }
};

/**
 * Play a short cue. No-op when sound is off, the app is backgrounded, or the
 * player for `id` was never registered (Expo Go without the native module).
 */
export const playSfx = (id: SfxId): void => {
  if (!isSoundAllowed() || !isAppActive()) return;
  const player = players[id];
  if (!player) return;

  const now = Date.now();
  if (id === lastPlayedId && now - lastPlayedAt < DEBOUNCE_MS) return;
  lastPlayedId = id;
  lastPlayedAt = now;

  stopSfx();
  const request = generation;
  void player
    .seekTo(0)
    .then(() => {
      if (request === generation) player.play();
    })
    .catch(() => {});
};

export type { SfxId, SfxPlayer, SfxPlayerMap };
