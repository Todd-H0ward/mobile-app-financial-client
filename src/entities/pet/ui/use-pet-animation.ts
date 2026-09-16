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
export const usePetAnimation = (animation: AnimationKey) => {
  // Hooks must be unconditional, so the full grid is allocated up front.
  const body = useLayerValues();
  const head = useLayerValues();
  const ears = useLayerValues();
  const tail = useLayerValues();
  const overlay = useLayerValues();
  const blink = useSharedValue(1);

  const values: Record<AnimatedLayer, LayerValues> = useMemo(
    () => ({ body, head, ears, tail, overlay }),
    [body, head, ears, tail, overlay],
  );

  useEffect(() => {
    const definition = getAnimation(animation);
    const touched = new Set<string>();

    for (const track of definition.tracks) {
      const value = values[track.layer][track.channel];
      touched.add(`${track.layer}.${track.channel}`);

      cancelAnimation(value);
      value.value = REST[track.channel];

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
  }, [animation, values, blink]);

  return { values, blink };
};

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
