import type { Emotion } from '../model/emotions';

import { CANVAS, ellipse, path, type Shape } from './shapes';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CENTER = CANVAS / 2;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Where a species keeps its face, so one face builder serves all of them.
 * `eyeX` is the offset from the centre line; everything else is absolute.
 */
interface FaceLayout {
  eyeX: number;
  eyeY: number;
  eyeRx: number;
  eyeRy: number;
  mouthY: number;
  browY: number;
  overlay: [number, number];
}

interface FaceShapes {
  /** Blinking layer. */
  eyes: Shape[];
  /** Brows, nose and mouth — they ride with the head. */
  face: Shape[];
  overlay: Shape[];
}

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

const eyeShapes = (emotion: Emotion, layout: FaceLayout): Shape[] => {
  const { eyeX, eyeY, eyeRx, eyeRy } = layout;
  const sides = [-1, 1];

  switch (emotion.eyes) {
    case 'closed':
      // A downward arc reads as "closed", a flat line reads as "dead".
      return sides.map((side) => {
        const cx = CENTER + eyeX * side;

        return path(
          `M ${cx - eyeRx} ${eyeY} q ${eyeRx} ${eyeRy} ${eyeRx * 2} 0 q ${-eyeRx} ${eyeRy * 0.5} ${-eyeRx * 2} 0 z`,
          'ink',
        );
      });

    case 'arc':
      // The happy "^^" — the eyes smile, not just the mouth.
      return sides.map((side) => {
        const cx = CENTER + eyeX * side;

        return path(
          `M ${cx - eyeRx} ${eyeY + eyeRy * 0.4} q ${eyeRx} ${-eyeRy * 1.5} ${eyeRx * 2} 0 q ${-eyeRx} ${-eyeRy * 0.5} ${-eyeRx * 2} 0 z`,
          'ink',
        );
      });

    case 'half':
      return sides.flatMap((side) => [
        ellipse(CENTER + eyeX * side, eyeY, eyeRx, eyeRy, 'ink'),
        // The lid is painted in the fur colour so it works on any coat.
        ellipse(
          CENTER + eyeX * side,
          eyeY - eyeRy * 0.85,
          eyeRx * 1.3,
          eyeRy,
          'body',
        ),
      ]);

    case 'wide':
      return sides.flatMap((side) => [
        ellipse(CENTER + eyeX * side, eyeY, eyeRx * 1.25, eyeRy * 1.25, 'ink'),
        ellipse(
          CENTER + eyeX * side + eyeRx * 0.4,
          eyeY - eyeRy * 0.45,
          eyeRx * 0.42,
          eyeRy * 0.42,
          'white',
        ),
      ]);

    case 'sparkle':
      return sides.flatMap((side) => [
        ellipse(CENTER + eyeX * side, eyeY, eyeRx * 1.15, eyeRy * 1.15, 'ink'),
        ellipse(
          CENTER + eyeX * side + eyeRx * 0.35,
          eyeY - eyeRy * 0.4,
          eyeRx * 0.5,
          eyeRy * 0.5,
          'white',
        ),
        ellipse(
          CENTER + eyeX * side - eyeRx * 0.4,
          eyeY + eyeRy * 0.45,
          eyeRx * 0.25,
          eyeRy * 0.25,
          'white',
        ),
      ]);

    case 'dizzy':
      return sides.flatMap((side) => [
        ellipse(CENTER + eyeX * side, eyeY, eyeRx, eyeRy * 0.35, 'ink', {
          rotate: 32,
        }),
        ellipse(CENTER + eyeX * side, eyeY, eyeRx, eyeRy * 0.35, 'ink', {
          rotate: -32,
        }),
      ]);

    default:
      return sides.flatMap((side) => [
        ellipse(CENTER + eyeX * side, eyeY, eyeRx, eyeRy, 'ink'),
        ellipse(
          CENTER + eyeX * side + eyeRx * 0.35,
          eyeY - eyeRy * 0.4,
          eyeRx * 0.38,
          eyeRy * 0.38,
          'white',
        ),
      ]);
  }
};

const mouthShapes = (emotion: Emotion, layout: FaceLayout): Shape[] => {
  const y = layout.mouthY;

  switch (emotion.mouth) {
    case 'grin':
      return [
        path(`M 138 ${y - 2} q 12 18 24 0 q -12 8 -24 0 z`, 'ink'),
        ellipse(150, y + 5, 7, 4, 'blush'),
      ];

    case 'open':
      return [
        ellipse(150, y + 3, 9, 8, 'ink'),
        ellipse(150, y + 6, 5, 4, 'blush'),
      ];

    case 'tongue':
      return [
        path(`M 138 ${y - 2} q 12 16 24 0 q -12 7 -24 0 z`, 'ink'),
        ellipse(150, y + 8, 6, 5, 'blush'),
      ];

    case 'frown':
      return [path(`M 139 ${y + 6} q 11 -14 22 0 q -11 -7 -22 0 z`, 'ink')];

    case 'wobble':
      return [
        path(
          `M 138 ${y} q 6 -6 12 0 q 6 6 12 0 q -6 6 -12 0 q -6 -6 -12 0 z`,
          'ink',
        ),
      ];

    case 'flat':
      return [ellipse(150, y, 11, 2, 'ink')];

    case 'small':
      return [ellipse(150, y, 6, 3, 'ink')];

    default:
      return [path(`M 140 ${y - 1} q 10 12 20 0 q -10 6 -20 0 z`, 'ink')];
  }
};

const browShapes = (emotion: Emotion, layout: FaceLayout): Shape[] => {
  const { eyeX, browY } = layout;

  if (emotion.brows === 'none') return [];

  const tilt =
    emotion.brows === 'worried' ? -1 : emotion.brows === 'angry' ? 1 : 0;
  const lift = emotion.brows === 'raised' ? -6 : 0;

  return [-1, 1].map((side) => {
    const cx = CENTER + eyeX * side;
    const drop = tilt * 4 * side;

    return path(
      `M ${cx - 12} ${browY + lift + tilt * 3 * side} q 12 ${-6} 24 ${drop} q -12 ${-2} -24 ${-drop} z`,
      'ink',
      { opacity: 0.85 },
    );
  });
};

const overlayShapes = (emotion: Emotion, layout: FaceLayout): Shape[] => {
  const [x, y] = layout.overlay;

  switch (emotion.overlay) {
    case 'sleep':
      return [
        path(`M ${x} ${y} l 18 0 l -18 20 l 18 0`, 'ink', { opacity: 0.35 }),
        path(`M ${x + 22} ${y - 24} l 13 0 l -13 15 l 13 0`, 'ink', {
          opacity: 0.28,
        }),
      ];

    case 'cold':
      return [
        ellipse(x, y, 5, 5, 'white', { rotate: 45 }),
        ellipse(x + 26, y - 26, 4, 4, 'white', { rotate: 45 }),
        ellipse(x - 12, y - 34, 3, 3, 'white', { rotate: 45 }),
      ];

    case 'hearts':
      return [
        path(
          `M ${x} ${y} q 6 -10 12 0 q 6 -10 12 0 q 0 10 -12 18 q -12 -8 -12 -18 z`,
          'blush',
        ),
      ];

    case 'sparkles':
      return [
        ellipse(x, y, 6, 6, 'accent', { rotate: 45 }),
        ellipse(x + 24, y + 18, 4, 4, 'accent', { rotate: 45 }),
        ellipse(x - 14, y + 26, 3, 3, 'accent', { rotate: 45 }),
      ];

    case 'question':
      return [
        path(
          `M ${x} ${y} q 10 -14 18 -2 q 5 8 -4 13 q -5 3 -5 9 l -9 0 q 0 -10 6 -14 q 5 -4 2 -7 q -4 -4 -8 3 z`,
          'ink',
          { opacity: 0.5 },
        ),
        ellipse(x + 9, y + 28, 4, 4, 'ink', { opacity: 0.5 }),
      ];

    case 'note':
      return [
        ellipse(x, y + 18, 7, 5, 'accent', { rotate: -18 }),
        path(`M ${x + 5} ${y + 16} l 3 -22 l 4 3 l -3 20 z`, 'accent'),
      ];

    case 'drop':
      return [
        path(`M ${x} ${y} q 9 12 0 18 q -9 -6 0 -18 z`, 'accent', {
          opacity: 0.6,
        }),
      ];

    default:
      return [];
  }
};

/** Builds the whole face for one emotion. */
export const buildFace = (
  emotion: Emotion,
  layout: FaceLayout,
): FaceShapes => ({
  eyes: eyeShapes(emotion, layout),
  face: [
    ...browShapes(emotion, layout),
    ...mouthShapes(emotion, layout),
    ...(emotion.blush
      ? [-1, 1].map((side) =>
          ellipse(
            CENTER + layout.eyeX * 1.45 * side,
            layout.eyeY + 16,
            13,
            8,
            'blush',
            { opacity: 0.75 },
          ),
        )
      : []),
  ],
  overlay: overlayShapes(emotion, layout),
});

export type { FaceLayout, FaceShapes };
