import { clamp } from '@/shared/utils';

import type { PetMood, PetMoodName, PetPose, PetStage } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The resting pose of a grown pet that feels nothing in particular. */
const POSE_NEUTRAL: PetPose = {
  bodyScale: 1,
  bodyTilt: 0,
  headTilt: 0,
  earAngle: 0,
  tailAngle: 0,
  eyeOpenness: 1,
  breathAmplitude: 0.02,
  breathPeriodMs: 3200,
  bounce: 0,
};

/** Where each state pulls the body, at full intensity. */
const POSE_BY_MOOD: Record<PetMoodName, PetPose> = {
  proud: {
    bodyScale: 1.04,
    bodyTilt: 0,
    headTilt: -6,
    earAngle: 8,
    tailAngle: 28,
    eyeOpenness: 1,
    breathAmplitude: 0.035,
    breathPeriodMs: 2600,
    bounce: 0.06,
  },
  content: POSE_NEUTRAL,
  bored: {
    bodyScale: 0.99,
    bodyTilt: 4,
    headTilt: 6,
    earAngle: -14,
    tailAngle: -4,
    eyeOpenness: 0.45,
    breathAmplitude: 0.018,
    breathPeriodMs: 4200,
    bounce: 0,
  },
  uncomfortable: {
    bodyScale: 0.94,
    bodyTilt: -3,
    headTilt: 10,
    earAngle: -20,
    tailAngle: -16,
    eyeOpenness: 0.7,
    breathAmplitude: 0.045,
    breathPeriodMs: 2200,
    bounce: 0,
  },
  sad: {
    bodyScale: 0.92,
    bodyTilt: 0,
    headTilt: 14,
    earAngle: -26,
    tailAngle: -24,
    eyeOpenness: 0.55,
    breathAmplitude: 0.012,
    breathPeriodMs: 4800,
    bounce: 0,
  },
};

/**
 * What growing up does to the drawing.
 *
 * A baby is small and busy, an adult big and calm — the stage change is the
 * loudest reward in the game (docs/pet.md), so it has to read from across the
 * room, not only in a side-by-side comparison.
 */
const STAGE_POSE: Record<PetStage, { scale: number; liveliness: number }> = {
  baby: { liveliness: 1.3, scale: 0.72 },
  teen: { liveliness: 1.1, scale: 0.88 },
  adult: { liveliness: 0.85, scale: 1 },
};

/**
 * How much of a mood's pose shows when it has only just crossed its threshold.
 *
 * Without a floor, a barely-bored pet would be drawn exactly like a content
 * one, and 2.5.10's "distinguishable states" would hold on paper only.
 */
const MOOD_POSE_FLOOR = 0.5;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Straight line between two numbers.
 *
 * The end is returned as itself rather than computed: `from + (to - from) * 1`
 * drifts by a float's last bits, which is enough to make a finished transition
 * miss the pose it was heading for.
 */
const mix = (from: number, to: number, t: number) =>
  t === 1 ? to : from + (to - from) * t;

// ═══════════════════════════════════════════
// POSE
// ═══════════════════════════════════════════

/**
 * The pose a pet holds at this stage in this state.
 *
 * Plain numbers out, by design: a Reanimated renderer interpolates between two
 * of these on the UI thread, and a worklet may only call worklets — so the
 * deciding happens here, on the JS thread, and the UI thread gets values.
 */
export const poseFor = (stage: PetStage, mood: PetMood): PetPose => {
  const target = POSE_BY_MOOD[mood.name];
  const { scale, liveliness } = STAGE_POSE[stage];
  const t =
    MOOD_POSE_FLOOR + clamp(mood.intensity, 0, 1) * (1 - MOOD_POSE_FLOOR);

  return {
    bodyScale: mix(POSE_NEUTRAL.bodyScale, target.bodyScale, t) * scale,
    bodyTilt: mix(POSE_NEUTRAL.bodyTilt, target.bodyTilt, t),
    headTilt: mix(POSE_NEUTRAL.headTilt, target.headTilt, t),
    earAngle: mix(POSE_NEUTRAL.earAngle, target.earAngle, t) * liveliness,
    tailAngle: mix(POSE_NEUTRAL.tailAngle, target.tailAngle, t) * liveliness,
    eyeOpenness: clamp(
      mix(POSE_NEUTRAL.eyeOpenness, target.eyeOpenness, t),
      0,
      1,
    ),
    breathAmplitude: clamp(
      mix(POSE_NEUTRAL.breathAmplitude, target.breathAmplitude, t) * liveliness,
      0,
      1,
    ),
    breathPeriodMs: Math.round(
      mix(POSE_NEUTRAL.breathPeriodMs, target.breathPeriodMs, t) / liveliness,
    ),
    bounce: clamp(
      mix(POSE_NEUTRAL.bounce, target.bounce, t) * liveliness,
      0,
      1,
    ),
  };
};

/**
 * A pose partway between two others, field by field.
 *
 * JS thread only — this is not a worklet. A renderer crossfading two poses on
 * the UI thread feeds these objects' numbers to Reanimated's own `interpolate`
 * instead of calling this from inside an animated style.
 *
 * @param t 0 gives `from`, 1 gives `to` (clamped)
 */
export const lerpPose = (from: PetPose, to: PetPose, t: number): PetPose => {
  const at = clamp(t, 0, 1);

  return {
    bodyScale: mix(from.bodyScale, to.bodyScale, at),
    bodyTilt: mix(from.bodyTilt, to.bodyTilt, at),
    headTilt: mix(from.headTilt, to.headTilt, at),
    earAngle: mix(from.earAngle, to.earAngle, at),
    tailAngle: mix(from.tailAngle, to.tailAngle, at),
    eyeOpenness: mix(from.eyeOpenness, to.eyeOpenness, at),
    breathAmplitude: mix(from.breathAmplitude, to.breathAmplitude, at),
    breathPeriodMs: Math.round(mix(from.breathPeriodMs, to.breathPeriodMs, at)),
    bounce: mix(from.bounce, to.bounce, at),
  };
};

export { MOOD_POSE_FLOOR, POSE_BY_MOOD, POSE_NEUTRAL, STAGE_POSE };
