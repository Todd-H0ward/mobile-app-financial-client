// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type EyeShape =
  | 'open'
  | 'wide'
  | 'half'
  | 'closed'
  | 'arc'
  | 'sparkle'
  | 'dizzy';

type MouthShape =
  | 'smile'
  | 'grin'
  | 'flat'
  | 'small'
  | 'open'
  | 'frown'
  | 'wobble'
  | 'tongue';

type BrowShape = 'none' | 'worried' | 'angry' | 'raised';

type OverlayKind =
  | 'none'
  | 'sleep'
  | 'cold'
  | 'hearts'
  | 'sparkles'
  | 'question'
  | 'note'
  | 'drop';

/** A full face, assembled from parts that read in greyscale. */
interface Emotion {
  id: string;
  title: string;
  eyes: EyeShape;
  mouth: MouthShape;
  brows: BrowShape;
  blush: boolean;
  overlay: OverlayKind;
  /** Which body animation plays while this face is on. */
  animation: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The emotion catalogue. Every entry differs by shape, not by colour, so the
 * pet stays readable in greyscale — and none of them is an alarm state.
 */
const EMOTIONS = {
  happy: {
    id: 'happy',
    title: 'Радость',
    eyes: 'arc',
    mouth: 'grin',
    brows: 'none',
    blush: true,
    overlay: 'sparkles',
    animation: 'hop',
  },
  calm: {
    id: 'calm',
    title: 'Спокоен',
    eyes: 'open',
    mouth: 'smile',
    brows: 'none',
    blush: false,
    overlay: 'none',
    animation: 'breathe',
  },
  curious: {
    id: 'curious',
    title: 'Любопытство',
    eyes: 'wide',
    mouth: 'small',
    brows: 'raised',
    blush: false,
    overlay: 'question',
    animation: 'tilt',
  },
  sleepy: {
    id: 'sleepy',
    title: 'Сонный',
    eyes: 'half',
    mouth: 'small',
    brows: 'none',
    blush: false,
    overlay: 'none',
    animation: 'sway',
  },
  asleep: {
    id: 'asleep',
    title: 'Спит',
    eyes: 'closed',
    mouth: 'small',
    brows: 'none',
    blush: false,
    overlay: 'sleep',
    animation: 'sleep',
  },
  hungry: {
    id: 'hungry',
    title: 'Голоден',
    eyes: 'open',
    mouth: 'open',
    brows: 'worried',
    blush: false,
    overlay: 'drop',
    animation: 'sniff',
  },
  cold: {
    id: 'cold',
    title: 'Мёрзнет',
    eyes: 'half',
    mouth: 'wobble',
    brows: 'worried',
    blush: false,
    overlay: 'cold',
    animation: 'shiver',
  },
  lonely: {
    id: 'lonely',
    title: 'Скучает',
    eyes: 'open',
    mouth: 'frown',
    brows: 'worried',
    blush: false,
    overlay: 'none',
    animation: 'droop',
  },
  dirty: {
    id: 'dirty',
    title: 'Испачкался',
    eyes: 'half',
    mouth: 'flat',
    brows: 'worried',
    blush: false,
    overlay: 'drop',
    animation: 'shake',
  },
  sad: {
    id: 'sad',
    title: 'Грустит',
    eyes: 'half',
    mouth: 'frown',
    brows: 'worried',
    blush: false,
    overlay: 'none',
    animation: 'droop',
  },
  excited: {
    id: 'excited',
    title: 'Восторг',
    eyes: 'sparkle',
    mouth: 'grin',
    brows: 'raised',
    blush: true,
    overlay: 'sparkles',
    animation: 'bounce',
  },
  loved: {
    id: 'loved',
    title: 'Любит',
    eyes: 'arc',
    mouth: 'smile',
    brows: 'none',
    blush: true,
    overlay: 'hearts',
    animation: 'wiggle',
  },
  surprised: {
    id: 'surprised',
    title: 'Удивлён',
    eyes: 'wide',
    mouth: 'open',
    brows: 'raised',
    blush: false,
    overlay: 'none',
    animation: 'jump',
  },
  playful: {
    id: 'playful',
    title: 'Играет',
    eyes: 'arc',
    mouth: 'tongue',
    brows: 'none',
    blush: true,
    overlay: 'note',
    animation: 'wiggle',
  },
  proud: {
    id: 'proud',
    title: 'Гордится',
    eyes: 'arc',
    mouth: 'smile',
    brows: 'raised',
    blush: false,
    overlay: 'sparkles',
    animation: 'puff',
  },
  dizzy: {
    id: 'dizzy',
    title: 'Ошалел',
    eyes: 'dizzy',
    mouth: 'wobble',
    brows: 'none',
    blush: true,
    overlay: 'question',
    animation: 'sway',
  },
  eating: {
    id: 'eating',
    title: 'Ест',
    eyes: 'half',
    mouth: 'open',
    brows: 'none',
    blush: true,
    overlay: 'none',
    animation: 'chew',
  },
  washing: {
    id: 'washing',
    title: 'Моется',
    eyes: 'closed',
    mouth: 'small',
    brows: 'none',
    blush: false,
    overlay: 'drop',
    animation: 'shake',
  },
} as const satisfies Record<string, Emotion>;

type EmotionKey = keyof typeof EMOTIONS;

const EMOTION_KEYS = Object.keys(EMOTIONS) as EmotionKey[];

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

export const getEmotion = (key: EmotionKey): Emotion => EMOTIONS[key];

export type {
  BrowShape,
  Emotion,
  EmotionKey,
  EyeShape,
  MouthShape,
  OverlayKind,
};
export { EMOTION_KEYS, EMOTIONS };
