import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import type { AnimationKey, PetStage } from '../model';
import { type EmotionKey, getEmotion } from '../model';
import type { PetAppearance } from '../model/look';

import { buildFace } from './face';
import { buildPalette } from './palette';
import { CANVAS, GROUP_ORDER, type GroupId, type Shape } from './shapes';
import { getSpecies } from './species';
import { useLayerStyle, usePetAnimation } from './use-pet-animation';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetViewProps {
  appearance: PetAppearance;
  /**
   * The face, which also picks the animation.
   *
   * Moods reach the renderer through `emotionFor`, which is the one place that
   * maps a mood to a face — the pet itself knows only faces.
   */
  emotion?: EmotionKey;
  /** Overrides the animation the emotion would play. */
  animation?: AnimationKey;
  stage?: PetStage;
  /** Rendered size in design points. */
  size?: number;
  /** Off means a still pet — use it for previews and long lists. */
  isAnimated?: boolean;
  /** What a screen reader says. The drawing is never the only carrier — 3.6. */
  accessibilityLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

interface LayerProps {
  shapes: Shape[];
  palette: Record<string, string>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const DEFAULT_SIZE = 200;

const STAGE_SCALE: Record<PetStage, number> = {
  baby: 0.86,
  teen: 1,
  adult: 1.12,
};

/** Which animated layer each drawing layer follows. */
const LAYER_DRIVER: Record<
  GroupId,
  'body' | 'head' | 'ears' | 'tail' | 'overlay' | null
> = {
  shadow: null,
  tail: 'tail',
  body: 'body',
  ears: 'ears',
  head: 'head',
  eyes: 'head',
  overlay: 'overlay',
};

/** The animation a still pet holds: the first frame of a calm breath. */
const STILL_ANIMATION: AnimationKey = 'breathe';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** One stacked SVG layer. Its geometry is constant — only its parent moves. */
const Layer = ({ shapes, palette }: LayerProps) => {
  if (shapes.length === 0) return null;

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox={`0 0 ${CANVAS} ${CANVAS}`}
    >
      <G>
        {shapes.map((shape, index) =>
          shape.kind === 'ellipse' ? (
            <Ellipse
              key={index}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              fill={palette[shape.fill]}
              opacity={shape.opacity}
              originX={shape.cx}
              originY={shape.cy}
              rotation={shape.rotate}
            />
          ) : (
            <Path
              key={index}
              d={shape.d}
              fill={palette[shape.fill]}
              opacity={shape.opacity}
            />
          ),
        )}
      </G>
    </Svg>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The pet.
 *
 * Layers are static SVGs stacked on top of each other; animations only move
 * their wrappers, and those transforms run on the UI thread. Nothing
 * recalculates geometry at runtime, so the pet costs the JS thread nothing
 * while it breathes, blinks or hops.
 */
export const PetView = ({
  appearance,
  emotion = 'calm',
  animation,
  stage = 'baby',
  size = DEFAULT_SIZE,
  isAnimated = true,
  accessibilityLabel,
  onPress,
  style,
}: PetViewProps) => {
  const palette = buildPalette(appearance);
  const species = getSpecies(appearance.species);
  const geometry = species.geometry(appearance);
  const face = getEmotion(emotion);
  const parts = buildFace(face, species.face);

  const { values, blink } = usePetAnimation(
    isAnimated
      ? (animation ?? (face.animation as AnimationKey))
      : STILL_ANIMATION,
  );

  const layerStyles = {
    body: useLayerStyle(values.body),
    head: useLayerStyle(values.head),
    ears: useLayerStyle(values.ears),
    tail: useLayerStyle(values.tail),
    overlay: useLayerStyle(values.overlay),
    eyes: useLayerStyle(values.head, blink),
  };

  const layers: Record<GroupId, Shape[]> = {
    ...geometry.shapes,
    head: [...geometry.shapes.head, ...parts.face],
    eyes: parts.eyes,
    overlay: parts.overlay,
  };

  const box = size * STAGE_SCALE[stage];

  const pet = (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? face.title}
      style={[{ height: box, width: box }, style]}
    >
      {GROUP_ORDER.map((group) => {
        const driver = LAYER_DRIVER[group];
        const pivot = geometry.pivots[group];

        if (!driver || !isAnimated) {
          return (
            <View key={group} style={StyleSheet.absoluteFill}>
              <Layer shapes={layers[group]} palette={palette} />
            </View>
          );
        }

        return (
          <Animated.View
            key={group}
            style={[
              StyleSheet.absoluteFill,
              // Ears swivel at their base and the tail at its root, so each
              // layer rotates around its own pivot rather than the canvas.
              pivot && {
                transformOrigin: [
                  `${(pivot[0] / CANVAS) * 100}%`,
                  `${(pivot[1] / CANVAS) * 100}%`,
                  0,
                ],
              },
              group === 'eyes' ? layerStyles.eyes : layerStyles[driver],
            ]}
          >
            <Layer shapes={layers[group]} palette={palette} />
          </Animated.View>
        );
      })}
    </View>
  );

  if (!onPress) return pet;

  return (
    <Pressable onPress={onPress} hitSlop={10}>
      {pet}
    </Pressable>
  );
};

export type { PetViewProps };
