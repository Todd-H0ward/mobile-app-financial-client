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
  { id: 'ginger', fur: '#F0B86A', belly: '#FFF3E0', cheeks: '#F29B90' },
  { id: 'ash', fur: '#E6E0D6', belly: '#FFFEF9', cheeks: '#F0B8B0' },
  { id: 'lilac', fur: '#C894D8', belly: '#F7ECFA', cheeks: '#F0A0B8' },
  { id: 'mint', fur: '#7EC4A8', belly: '#E8F7F0', cheeks: '#F0A8A0' },
  { id: 'cocoa', fur: '#5C4A3E', belly: '#DCC8B6', cheeks: '#D08A80' },
  { id: 'peach', fur: '#F09890', belly: '#FFECE6', cheeks: '#E88898' },
  { id: 'sky', fur: '#8EBAD4', belly: '#EAF5FA', cheeks: '#F0A8A0' },
  { id: 'sand', fur: '#E0C878', belly: '#F8F4DC', cheeks: '#ECA888' },
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
