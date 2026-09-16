import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
} from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

import { type PetSkinLayer, skinLayerFor } from '../lib';
import { anchorsFor } from '../lib/anchors';
import { poseFor } from '../lib/pose';
import {
  anchorPoint,
  type PetRig,
  type RigPivot,
  rigFor,
  VIEW_BOX,
} from '../lib/rig';
import type {
  PetAnchors,
  PetMood,
  PetMoodName,
  PetSkin,
  PetSpecies,
  PetStage,
} from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetProps {
  /** How it looks: colors, silhouette, pattern. From `skinFor`. */
  skin: PetSkin;
  /** Growth stage: scale, liveliness and which anchor table applies. */
  stage: PetStage;
  /** What it feels. The rig turns it into a pose itself. */
  mood: PetMood;
  /** Side of the box, in design points. */
  size?: number;
  /**
   * Whether it breathes and eases between poses.
   *
   * The caller reads `settings.isAnimationEnabled` and passes it down:
   * `entities/pet` may not import `entities/user`, which owns a store and is
   * not a leaf. With it off the pet holds an instant, fully legible pose —
   * animation is never the only carrier of a state, see docs/accessibility.md.
   */
  isAnimated?: boolean;
  /** What a screen reader says. Built from species and mood by default. */
  accessibilityLabel?: string;
  /** Only `<Pet.At>` children. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface PetAtProps {
  /** Which attachment point to hang the child on. */
  anchor: keyof PetAnchors;
  children?: ReactNode;
}

/** What `Pet.At` needs to place a child without doing any arithmetic itself. */
interface PetContextValue {
  /** The attachment table of the pet being drawn. */
  anchors: PetAnchors;
  /** The size that pet is drawn at, in design points. */
  size: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Default side of the box. Big enough for the silhouette to read. */
const DEFAULT_SIZE = 160;

/** How long a mood takes to reach the body. */
const POSE_DURATION = 420;

const POSE_EASING = Easing.inOut(Easing.quad);

const BREATH_EASING = Easing.inOut(Easing.sin);

/** Outline width, in viewBox units. */
const STROKE = 2;

/** The pet named aloud. Moves to content when the pet's lines are written. */
const SPECIES_LABEL: Record<PetSpecies, string> = {
  cat: 'Кот',
  dog: 'Пёс',
  capybara: 'Капибара',
};

/** The state named aloud — a screen reader must not depend on the drawing. */
const MOOD_LABEL: Record<PetMoodName, string> = {
  proud: 'доволен собой',
  content: 'спокоен',
  bored: 'скучает',
  uncomfortable: 'ему неуютно',
  sad: 'грустит',
};

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

const PetContext = createContext<PetContextValue | null>(null);

const usePetContext = () => {
  const context = useContext(PetContext);

  if (!context) {
    throw new Error('Pet.At must be used inside Pet');
  }

  return context;
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * One channel of the pose as a shared value that eases to its target.
 *
 * The easing happens here rather than through `lerpPose`, which is not a
 * worklet and must never be called from an animated style: the UI thread only
 * ever sees numbers Reanimated itself interpolates.
 */
const usePoseChannel = (target: number, isAnimated: boolean) => {
  const value = useSharedValue(target);

  useEffect(() => {
    // Started from the JS thread, as every animation in this app is.
    value.value = isAnimated
      ? withTiming(target, { duration: POSE_DURATION, easing: POSE_EASING })
      : target;
  }, [target, isAnimated, value]);

  return value;
};

/** Where a layer turns around, in design points. */
const originOf = (pivot: RigPivot, size: number): number[] => [
  pivot.x * size,
  pivot.y * size,
  0,
];

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

/**
 * Hangs a child on one of the pet's attachment points.
 *
 * The box is zero-sized and centred on the point, so whatever goes in is
 * centred on it too and no caller ever multiplies a fraction by a size.
 */
const PetAt = ({ anchor, children }: PetAtProps) => {
  const { anchors, size } = usePetContext();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.at, anchorPoint(anchors[anchor], size)]}
    >
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** The body, its belly and the pattern clipped to the coat. */
const PetBody = ({
  rig,
  layer,
  size,
  clipId,
}: {
  rig: PetRig;
  layer: PetSkinLayer;
  size: number;
  clipId: string;
}) => (
  <Svg
    width={size}
    height={size}
    viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
    style={styles.layer}
  >
    <Defs>
      <ClipPath id={clipId}>
        <Ellipse
          cx={rig.body.cx}
          cy={rig.body.cy}
          rx={rig.body.rx}
          ry={rig.body.ry}
        />
      </ClipPath>
    </Defs>

    <Ellipse
      cx={rig.body.cx}
      cy={rig.body.cy}
      rx={rig.body.rx}
      ry={rig.body.ry}
      fill={layer.fills.body}
      stroke={layer.fills.outline}
      strokeWidth={STROKE}
    />

    {/* Clipped, so a mark near the edge is cut by the coat instead of hanging off it. */}
    <G clipPath={`url(#${clipId})`}>
      <Ellipse
        cx={rig.belly.cx}
        cy={rig.belly.cy}
        rx={rig.belly.rx}
        ry={rig.belly.ry}
        fill={layer.fills.belly}
      />

      {layer.marks.map((mark) => (
        <Ellipse
          key={`${mark.cx}:${mark.cy}`}
          cx={mark.cx}
          cy={mark.cy}
          rx={mark.rx}
          ry={mark.ry}
          fill={layer.fills.mark}
        />
      ))}
    </G>
  </Svg>
);

/** The head shape, with the cheeks that never blink. */
const PetHead = ({
  rig,
  layer,
  size,
}: {
  rig: PetRig;
  layer: PetSkinLayer;
  size: number;
}) => (
  <Svg
    width={size}
    height={size}
    viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
    style={styles.layer}
  >
    <Ellipse
      cx={rig.head.cx}
      cy={rig.head.cy}
      rx={rig.head.rx}
      ry={rig.head.ry}
      fill={layer.fills.head}
      stroke={layer.fills.outline}
      strokeWidth={STROKE}
    />

    {[rig.cheeks.left, rig.cheeks.right].map((cheek) => (
      <Ellipse
        key={cheek.cx}
        cx={cheek.cx}
        cy={cheek.cy}
        rx={cheek.rx}
        ry={cheek.ry}
        fill={layer.fills.cheek}
      />
    ))}
  </Svg>
);

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The pet, drawn from its own contract: silhouette and colors from `PetSkin`,
 * motion from the pose its mood produces, attachment points from `anchorsFor`.
 *
 * SVG draws the shape and plain `Animated.View`s move it: each hinged part is
 * its own full-box layer in one viewBox, so the layers overlap correctly while
 * the rotation happens where Reanimated is at its most predictable.
 *
 * No color here comes from the theme. A coat that changed at night would make
 * one pet read as two, and requirement 2.5.2 is judged on two screenshots.
 */
const PetRoot = ({
  skin,
  stage,
  mood,
  size = DEFAULT_SIZE,
  isAnimated = true,
  accessibilityLabel,
  children,
  style,
}: PetProps) => {
  const clipId = useId();

  // The skeleton depends on the species alone, the coat on the skin: two
  // memos, so switching a coat in the picker does not rebuild the anatomy.
  const rig = useMemo(() => rigFor(skin.silhouette), [skin.silhouette]);
  const layer = useMemo(() => skinLayerFor(rig, skin), [rig, skin]);
  const pose = useMemo(
    () => poseFor(stage, mood),
    // The pose depends on what the mood *is*, not on the caller's object.
    [stage, mood],
  );
  const anchors = useMemo(
    () => anchorsFor(skin.species, stage),
    [skin.species, stage],
  );

  const scale = usePoseChannel(pose.bodyScale, isAnimated);
  const bodyTilt = usePoseChannel(pose.bodyTilt, isAnimated);
  const headTilt = usePoseChannel(pose.headTilt, isAnimated);
  const earAngle = usePoseChannel(pose.earAngle, isAnimated);
  const tailAngle = usePoseChannel(pose.tailAngle, isAnimated);
  const eyeOpenness = usePoseChannel(pose.eyeOpenness, isAnimated);
  const swell = usePoseChannel(pose.breathAmplitude, isAnimated);
  const hop = usePoseChannel(pose.bounce * size, isAnimated);

  /**
   * One oscillator for the whole idle: the chest swells and the pet lifts on
   * the same breath, which is what keeps a hop from looking mechanical.
   */
  const breath = useSharedValue(0);

  useEffect(() => {
    if (!isAnimated) {
      breath.value = 0;
      return;
    }

    breath.value = withRepeat(
      withTiming(1, {
        duration: pose.breathPeriodMs / 2,
        easing: BREATH_EASING,
      }),
      -1,
      true,
    );
  }, [isAnimated, pose.breathPeriodMs, breath]);

  const bodyOrigin = originOf(rig.pivots.body, size);
  const headOrigin = originOf(rig.pivots.head, size);
  const earOrigin = originOf(rig.pivots.ear, size);
  const tailOrigin = originOf(rig.pivots.tail, size);
  const eyeOrigin = originOf(rig.pivots.eye, size);

  const rootStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -breath.value * hop.value },
      { scale: scale.value * (1 + breath.value * swell.value) },
    ],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bodyTilt.value}deg` }],
  }));

  const headStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${headTilt.value}deg` }],
  }));

  const earStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${earAngle.value}deg` }],
  }));

  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tailAngle.value}deg` }],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeOpenness.value }],
  }));

  const contextValue = useMemo<PetContextValue>(
    () => ({ anchors, size }),
    [anchors, size],
  );

  const label =
    accessibilityLabel ??
    `${SPECIES_LABEL[skin.species]}, ${MOOD_LABEL[mood.name]}`;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.root, { height: size, width: size }, style]}
    >
      <Animated.View style={[styles.layer, rootStyle]}>
        {rig.tail != null && (
          <Animated.View
            style={[styles.layer, { transformOrigin: tailOrigin }, tailStyle]}
          >
            <Svg
              width={size}
              height={size}
              viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
              style={styles.layer}
            >
              <Path
                d={rig.tail}
                fill={layer.fills.limb}
                stroke={layer.fills.outline}
                strokeWidth={STROKE}
              />
            </Svg>
          </Animated.View>
        )}

        <Animated.View
          style={[styles.layer, { transformOrigin: bodyOrigin }, bodyStyle]}
        >
          <PetBody rig={rig} layer={layer} size={size} clipId={clipId} />
        </Animated.View>

        <Animated.View
          style={[styles.layer, { transformOrigin: headOrigin }, headStyle]}
        >
          {/* Ears first, so their base hides under the skull. */}
          <Animated.View
            style={[styles.layer, { transformOrigin: earOrigin }, earStyle]}
          >
            <Svg
              width={size}
              height={size}
              viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
              style={styles.layer}
            >
              {[rig.ears.left, rig.ears.right].map((ear) => (
                <Path
                  key={ear}
                  d={ear}
                  fill={layer.fills.limb}
                  stroke={layer.fills.outline}
                  strokeWidth={STROKE}
                />
              ))}
            </Svg>
          </Animated.View>

          <PetHead rig={rig} layer={layer} size={size} />

          <Animated.View
            style={[styles.layer, { transformOrigin: eyeOrigin }, eyeStyle]}
          >
            <Svg
              width={size}
              height={size}
              viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
              style={styles.layer}
            >
              {[rig.eyes.left, rig.eyes.right].map((eye) => (
                <Ellipse
                  key={eye.cx}
                  cx={eye.cx}
                  cy={eye.cy}
                  rx={eye.rx}
                  ry={eye.ry}
                  fill={layer.fills.eye}
                />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <PetContext.Provider value={contextValue}>{children}</PetContext.Provider>
    </View>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Pet = Object.assign(PetRoot, {
  At: PetAt,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  at: {
    alignItems: 'center',
    height: 0,
    justifyContent: 'center',
    position: 'absolute',
    width: 0,
  },
  layer: {
    ...StyleSheet.absoluteFill,
  },
});

export type { PetAtProps, PetProps };
