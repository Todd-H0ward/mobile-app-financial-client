import type { PetPattern, PetSpecies } from './appearance';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The states the pet can be in. Requirement 2.5.10 asks for at least three.
 *
 * Five, because two axes make four corners plus a middle, and because
 * docs/pet.md names «сытый, но скучающий» as the case one number cannot
 * express. Named after the axes, not after the causes: *why* the pet is
 * `uncomfortable` — cold or hungry — is the `reason`, and the reason is what is
 * spoken aloud.
 */
const PET_MOOD_NAMES = [
  'proud',
  'content',
  'bored',
  'uncomfortable',
  'sad',
] as const;

/**
 * Causes a mood can be explained by — the «краткое объяснение причины» of
 * 2.5.10, as ids. The wording is content's job, never this slice's.
 *
 * The first four are body causes (the `comfort` axis), the rest heart causes
 * (`spirit`). None of them may ever mention the family's money — see house.md.
 */
const PET_REASONS = [
  'fed',
  'warm',
  'hungry',
  'cold',
  'goal-near',
  'tasks-done',
  'plan-kept',
  'goal-far',
  'nothing-to-do',
  'plan-broken',
] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Ear shape — one of the three things that carry the silhouette. */
type PetEarShape = 'pointed' | 'floppy' | 'round';

/** Tail shape. `none` is the capybara, and an absent tail is a silhouette too. */
type PetTailShape = 'long' | 'stub' | 'none';

/** How the pattern is stamped onto the coat. */
type PetPatternKind = 'none' | 'spots' | 'stripes';

/** Proportions a renderer needs before it knows any color. */
interface PetSilhouette {
  /** Ear shape. Readable at icon size — 2.5.2. */
  earShape: PetEarShape;
  /** Tail shape. */
  tailShape: PetTailShape;
  /** Body width ÷ body height. Above 1 is a barrel, below 1 is upright. */
  bodyRatio: number;
  /** Head height ÷ box height, 0…1. The stage scales it, the species sets it. */
  headRatio: number;
}

/** The pattern layer, as counts a renderer can loop over. */
interface PetPatternMarks {
  /** What to draw. `none` means skip the layer entirely. */
  kind: PetPatternKind;
  /** How many marks. 0 when `kind` is `none`. */
  count: number;
  /** Mark size as a fraction of box height, 0…1. 0 when `kind` is `none`. */
  size: number;
}

/**
 * Everything about how one pet looks, minus motion. Derived from
 * species + coat + pattern only — never from the theme: a coat that changed at
 * night would make one pet read as two, and 2.5.2 is judged on screenshots.
 */
interface PetSkin {
  /** Species this skin was built for. Carried so a renderer can pick a body. */
  species: PetSpecies;
  /** Pattern axis this skin was built for. */
  pattern: PetPattern;
  /** Proportions: ears, tail, body ratio, head ratio. */
  silhouette: PetSilhouette;
  /** Main body fill. A color from `PET_PALETTE`, never written by a renderer. */
  coat: string;
  /** Shaded side of the body. Darker than `coat`. */
  shade: string;
  /** Belly, muzzle, paw tips. Lighter than `coat`. */
  belly: string;
  /** Fill of the spots or stripes. Unused when `marks.kind` is `none`. */
  ink: string;
  /** Outline of the silhouette. The same for every pet. */
  outline: string;
  /** Pupils. */
  eye: string;
  /** Cheeks and inner ear. */
  blush: string;
  /** The pattern layer: what, how many, how big. */
  marks: PetPatternMarks;
}

/** The two axes the state is computed from, docs/pet.md. */
interface PetAxes {
  /** Body: fed and warm. 0…1, eased — it never jumps within one settlement. */
  comfort: number;
  /** Everything else: goal proximity, tasks done, how the period ended. 0…1. */
  spirit: number;
}

/** One of the five states. */
type PetMoodName = (typeof PET_MOOD_NAMES)[number];

/** A cause id. The screen turns it into the pet's line; this slice never does. */
type PetReason = (typeof PET_REASONS)[number];

/** Which axis decided the mood. `both` — the two agreed. */
type PetMoodAxis = 'comfort' | 'spirit' | 'both';

/**
 * The specific causes the caller knows about, when it knows them.
 *
 * The axes are two numbers, so they cannot tell «холодно» from «голодно» on
 * their own. Settlement knows which need fell and hands it down here; without
 * it the mood still names a cause, just a coarser one — a pet is never mute.
 */
interface PetMoodCauses {
  /** Why the body feels the way it does. Used when the mood is comfort-driven. */
  comfort?: PetReason;
  /** Why the heart does. Used when the mood is spirit-driven. */
  spirit?: PetReason;
}

/** A state with its cause attached — the pair requirement 2.5.10 asks for. */
interface PetMood {
  name: PetMoodName;
  /** The named cause, the thing that is spoken aloud. Never absent. */
  reason: PetReason;
  /** Which axis produced it — the screen highlights that meter. */
  axis: PetMoodAxis;
  /** How far past the threshold, 0…1. Drives how strongly the pose reads. */
  intensity: number;
}

/**
 * One frame's worth of pose, as plain numbers.
 *
 * Every field is a number on purpose: a Reanimated renderer interpolates
 * between two `PetPose` values on the UI thread, and a worklet may only call
 * worklets (AGENTS.md). The derivation runs on the JS thread and hands the UI
 * thread nothing but numbers.
 */
interface PetPose {
  /** Whole-body scale. 1 is the resting size of the adult stage. Above 0. */
  bodyScale: number;
  /** Body lean, degrees. Positive leans right. */
  bodyTilt: number;
  /** Head tilt, degrees. Positive drops the muzzle — a lowered head. */
  headTilt: number;
  /** Ear angle, degrees. 0 upright, negative drooped. */
  earAngle: number;
  /** Tail angle, degrees. Positive lifted, negative tucked. */
  tailAngle: number;
  /** Eyelids, 0…1. 1 wide open, 0 shut. Below ~0.5 reads as sleepy. */
  eyeOpenness: number;
  /** Breathing scale delta, 0…1, added to `bodyScale` at the top of a breath. */
  breathAmplitude: number;
  /** A full inhale and exhale, ms. Above 0 — the renderer divides by it. */
  breathPeriodMs: number;
  /** Idle hop height as a fraction of box height, 0…1. 0 means no hop. */
  bounce: number;
}

/** A point on the pet, as fractions of its bounding box. */
interface PetAnchor {
  /** 0 is the left edge of the box, 1 the right. Multiply by rendered width. */
  x: number;
  /** 0 is the top edge, 1 the bottom. Multiply by rendered height. */
  y: number;
}

/**
 * Named attachment points, in box fractions so one table serves every size.
 *
 * Fractions rather than design points because the pet is drawn at several sizes
 * — home card, pet screen, growth scene, UI kit — and a table of points would
 * need one copy per size, and the copies would drift apart.
 */
interface PetAnchors {
  /** Where the speech bubble's tail touches the pet — beside the muzzle. */
  speech: PetAnchor;
  /** Where a hat or an accessory sits — top of the head, on the midline. */
  accessory: PetAnchor;
  /** Where food meets the mouth. A bowl animates to this point. */
  food: PetAnchor;
  /** Where hearts and particles are born — the chest. */
  heart: PetAnchor;
  /** Centre of the ground shadow. `y` is 1 by definition: the feet line. */
  ground: PetAnchor;
}

export type {
  PetAnchor,
  PetAnchors,
  PetAxes,
  PetEarShape,
  PetMood,
  PetMoodAxis,
  PetMoodCauses,
  PetMoodName,
  PetPatternKind,
  PetPatternMarks,
  PetPose,
  PetReason,
  PetSilhouette,
  PetSkin,
  PetTailShape,
};
export { PET_MOOD_NAMES, PET_REASONS };
