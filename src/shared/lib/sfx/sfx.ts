import type { SoundId } from '@/shared/constants/sounds';

type SfxId = SoundId;

/** Player handle — shared stays free of expo-audio. */
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

let isAppActive = (): boolean => true;

let players: SfxPlayerMap = {};
let generation = 0;
let lastPlayedAt = 0;
let lastPlayedId: SfxId | null = null;

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

export const registerSfxPlayers = (next: SfxPlayerMap): void => {
  players = next;
  lastPlayedId = null;
  lastPlayedAt = 0;
};

export const stopSfx = (): void => {
  generation += 1;
  for (const player of Object.values(players)) {
    player?.pause();
  }
};

/** No-op when sound is off, backgrounded, or the player is missing. */
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
