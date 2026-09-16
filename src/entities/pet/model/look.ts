import type { PetSpecies } from './appearance';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Coat markings. Named apart from the save's `PetPattern`: the save stores the
 * axis the child chose, this is what the renderer draws.
 */
type PetCoatPattern = 'plain' | 'belly' | 'tabby' | 'socks' | 'patch';

type PetEyes = 'round' | 'wide' | 'sleepy';

type PetEars = 'pointy' | 'round' | 'folded';

type PetTail = 'long' | 'fluffy' | 'short';

/** Everything the renderer needs to draw one pet — no logic, only looks. */
interface PetAppearance {
  species: PetSpecies;
  /** Main fur color. Every other tone is derived from it by `shade`. */
  fur: string;
  belly: string;
  cheeks: string;
  eyes: PetEyes;
  ears: PetEars;
  tail: PetTail;
  pattern: PetCoatPattern;
  /** Color of the pattern and of the head accessory. */
  accent: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Fur palette offered during customization — soft, no saturated colors. */
const FUR_PALETTE = [
  { id: 'ginger', fur: '#F2C88C', belly: '#FFF0DC', cheeks: '#F2A79E' },
  { id: 'ash', fur: '#E9E4DC', belly: '#FFFDF8', cheeks: '#F0BDB6' },
  { id: 'lilac', fur: '#C9A0DC', belly: '#F3E7F7', cheeks: '#F0A9C0' },
  { id: 'mint', fur: '#8FBFAE', belly: '#E6F3EE', cheeks: '#F0A9A2' },
  { id: 'cocoa', fur: '#6E5B4E', belly: '#D6C3B4', cheeks: '#C98F86' },
  { id: 'peach', fur: '#F0A9A2', belly: '#FFECE6', cheeks: '#E68FA0' },
  { id: 'sky', fur: '#9FC3D6', belly: '#E7F2F7', cheeks: '#F0A9A2' },
  { id: 'sand', fur: '#DCD3A8', belly: '#F6F2DE', cheeks: '#E9B6A0' },
] as const;

const ACCENT_PALETTE = [
  '#2E8FA6',
  '#E58A2B',
  '#6DA97C',
  '#C9A0DC',
  '#3F332C',
] as const;

const COAT_PATTERNS: PetCoatPattern[] = [
  'plain',
  'belly',
  'tabby',
  'socks',
  'patch',
];

const EYE_SHAPES: PetEyes[] = ['round', 'wide', 'sleepy'];

const EAR_SHAPES: PetEars[] = ['pointy', 'round', 'folded'];

const TAIL_SHAPES: PetTail[] = ['long', 'fluffy', 'short'];

const DEFAULT_APPEARANCE: PetAppearance = {
  species: 'cat',
  fur: FUR_PALETTE[0].fur,
  belly: FUR_PALETTE[0].belly,
  cheeks: FUR_PALETTE[0].cheeks,
  eyes: 'round',
  ears: 'pointy',
  tail: 'long',
  pattern: 'belly',
  accent: ACCENT_PALETTE[0],
};

export type { PetAppearance, PetCoatPattern, PetEars, PetEyes, PetTail };
export {
  ACCENT_PALETTE,
  COAT_PATTERNS,
  DEFAULT_APPEARANCE,
  EAR_SHAPES,
  EYE_SHAPES,
  FUR_PALETTE,
  TAIL_SHAPES,
};
