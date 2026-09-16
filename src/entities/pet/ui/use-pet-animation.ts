import { useEffect, useMemo } from 'react';

import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  type AnimatedLayer,
  type AnimationKey,
  BREATH_DEPTH,
  BREATH_PERIOD_MS,
  type Channel,
  getAnimation,
  type Keyframe,
  REST,
  type Track,
} from '../model/animations';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type LayerValues = Record<Channel, SharedValue<number>>;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const LAYERS: AnimatedLayer[] = ['body', 'head', 'ears', 'tail', 'overlay'];

const CHANNELS: Channel[] = [
  'translateX',
  'translateY',
  'rotate',
  'scale',
  'scaleY',
];

const EASING = Easing.inOut(Easing.sin);

/** Blink cadence: long open stretch, quick shut, quick open. */
const BLINK_OPEN_MS = 2800;
const BLINK_CLOSE_MS = 70;

/** How long a layer the new animation does not touch takes to reach rest. */
const RELEASE_MS = 260;

/** How long a still pet takes to settle when animation is switched off. */
const SETTLE_MS = 180;

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

/**
 * Builds one track's keyframes.
 *
 * A looping track is closed back to its rest value instead of being reversed:
 * `withRepeat(withSequence(…), -1, true)` is not supported by Reanimated and
 * throws inside the UI runtime, which on iOS is a native abort rather than a
 * red screen — the app simply dies and the simulator looks hung.
 *
 * Deliberately **not** a worklet: descriptors are assembled on the JS thread
 * and handed to Reanimated, which runs them on the UI thread itself.
 */
export const buildKeyframes = (track: Track, loop: boolean): Keyframe[] => {
  const keyframes = [...track.keyframes];

  if (!loop) return keyframes;

  const last = keyframes[keyframes.length - 1];
  if (!last) return keyframes;

  const [lastValue, lastDuration] = last;

  return lastValue === REST[track.channel]
    ? keyframes
    : [...keyframes, [REST[track.channel], lastDuration]];
};

const buildSequence = (track: Track, loop: boolean) => {
  const steps = buildKeyframes(track, loop).map(([value, duration]) =>
    withTiming(value, { duration, easing: EASING }),
  );

  return steps.length === 1 ? steps[0] : withSequence(...steps);
};

/** One set of channels for a layer. Shared values are stable across renders. */
const useLayerValues = (): LayerValues => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const scaleY = useSharedValue(1);

  return useMemo(
    () => ({ translateX, translateY, rotate, scale, scaleY }),
    [translateX, translateY, rotate, scale, scaleY],
  );
};

// ═══════════════════════════════════════════
// MODEL
// ═══════════════════════════════════════════

/**
 * Plays an animation from the catalogue.
 *
 * Every value lives on the UI thread and drives a native transform, so the JS
 * thread does nothing per frame — the pet keeps moving even while the app is
 * busy rendering a list or writing the save.
 */
export const usePetAnimation = (animation: AnimationKey, isAnimated = true) => {
  // Hooks must be unconditional, so the full grid is allocated up front.
  const body = useLayerValues();
  const head = useLayerValues();
  const ears = useLayerValues();
  const tail = useLayerValues();
  const overlay = useLayerValues();
  const blink = useSharedValue(1);
  const breath = useSharedValue(0);

  const values: Record<AnimatedLayer, LayerValues> = useMemo(
    () => ({ body, head, ears, tail, overlay }),
    [body, head, ears, tail, overlay],
  );

  // Read on the JS thread and captured as a number: the style below is a
  // worklet, and a worklet may only call worklets.
  const breathDepth = isAnimated
    ? (getAnimation(animation).breathDepth ?? BREATH_DEPTH)
    : 0;

  useEffect(() => {
    const definition = getAnimation(animation);

    if (!isAnimated) {
      // A still pet is legible on its own: the face carries the state, and
      // motion is never its only carrier — docs/accessibility.md.
      for (const layer of LAYERS) {
        for (const channel of CHANNELS) {
          const value = values[layer][channel];
          cancelAnimation(value);
          value.value = withTiming(REST[channel], { duration: SETTLE_MS });
        }
      }

      cancelAnimation(blink);
      blink.value = withTiming(1, { duration: SETTLE_MS });
      cancelAnimation(breath);
      breath.value = withTiming(0, { duration: SETTLE_MS });

      return;
    }

    const touched = new Set<string>();

    for (const track of definition.tracks) {
      const value = values[track.layer][track.channel];
      touched.add(`${track.layer}.${track.channel}`);

      cancelAnimation(value);

      // No snap to rest first: `withTiming` starts from wherever the value is,
      // so the first step of the new track interpolates out of the old pose
      // instead of teleporting through it. Later repetitions start from rest
      // anyway, because `buildKeyframes` closes the loop there.
      const sequence = buildSequence(track, definition.loop);

      // `reverse` stays false — see `buildKeyframes`.
      value.value = definition.loop
        ? withRepeat(sequence, -1, false)
        : sequence;
    }

    // Anything this animation does not touch eases back to rest, so switching
    // moods never leaves a layer stuck in the previous pose.
    for (const layer of LAYERS) {
      for (const channel of CHANNELS) {
        if (touched.has(`${layer}.${channel}`)) continue;

        const value = values[layer][channel];
        cancelAnimation(value);
        value.value = withTiming(REST[channel], { duration: RELEASE_MS });
      }
    }

    cancelAnimation(blink);
    blink.value = definition.blink
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: BLINK_OPEN_MS }),
            withTiming(0.05, { duration: BLINK_CLOSE_MS }),
            withTiming(1, { duration: BLINK_CLOSE_MS }),
          ),
          -1,
          false,
        )
      : withTiming(1, { duration: 120 });

    // Breathing rides over the pose rather than being one of its tracks: a pet
    // that stopped breathing while it hopped would read as a puppet. It is the
    // one loop that never restarts on a mood change.
    cancelAnimation(breath);
    breath.value = withRepeat(
      withTiming(1, {
        duration: (definition.breathPeriodMs ?? BREATH_PERIOD_MS) / 2,
        easing: EASING,
      }),
      -1,
      true,
    );
  }, [animation, isAnimated, values, blink, breath]);

  return { values, blink, breath, breathDepth };
};

/**
 * The chest, over everything else.
 *
 * `depth` is a plain number captured on the JS thread — a worklet may only call
 * worklets, so nothing is looked up from the catalogue inside the style.
 */
export const useBreathStyle = (breath: SharedValue<number>, depth: number) =>
  useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * depth }],
  }));

/** Turns a layer's channels into a style; `blinking` squashes the eye layer. */
export const useLayerStyle = (
  layer: LayerValues,
  blinking?: SharedValue<number>,
) =>
  useAnimatedStyle(() => ({
    transform: [
      { translateX: layer.translateX.value },
      { translateY: layer.translateY.value },
      { rotate: `${layer.rotate.value}deg` },
      { scale: layer.scale.value },
      { scaleY: (blinking ? blinking.value : 1) * layer.scaleY.value },
    ],
  }));

export type { LayerValues };
