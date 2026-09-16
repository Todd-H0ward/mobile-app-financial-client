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
// HELPERS
// ═══════════════════════════════════════════

/** One open eye: sclera → iris → pupil → two highlights. */
const openEye = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  scale = 1,
): Shape[] => {
  const sx = rx * scale;
  const sy = ry * scale;

  return [
    ellipse(cx, cy, sx * 1.12, sy * 1.18, 'white'),
    ellipse(cx, cy + sy * 0.06, sx * 0.88, sy * 0.92, 'iris'),
    ellipse(cx, cy + sy * 0.1, sx * 0.42, sy * 0.52, 'ink'),
    ellipse(cx + sx * 0.32, cy - sy * 0.38, sx * 0.28, sy * 0.28, 'white'),
    ellipse(cx - sx * 0.28, cy + sy * 0.28, sx * 0.12, sy * 0.12, 'white', {
      opacity: 0.85,
    }),
  ];
};

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
          `M ${cx - eyeRx} ${eyeY} q ${eyeRx} ${eyeRy * 1.1} ${eyeRx * 2} 0 q ${-eyeRx} ${eyeRy * 0.45} ${-eyeRx * 2} 0 z`,
          'ink',
        );
      });

    case 'arc':
      // The happy "^^" — the eyes smile, not just the mouth.
      return sides.map((side) => {
        const cx = CENTER + eyeX * side;

        return path(
          `M ${cx - eyeRx * 1.1} ${eyeY + eyeRy * 0.35} q ${eyeRx * 1.1} ${-eyeRy * 1.65} ${eyeRx * 2.2} 0 q ${-eyeRx} ${-eyeRy * 0.45} ${-eyeRx * 2.2} 0 z`,
          'ink',
        );
      });

    case 'half':
      return sides.flatMap((side) => {
        const cx = CENTER + eyeX * side;

        return [
          ...openEye(cx, eyeY, eyeRx, eyeRy, 1),
          // Lid painted in fur so it works on any coat.
          ellipse(cx, eyeY - eyeRy * 0.95, eyeRx * 1.35, eyeRy * 1.05, 'body'),
        ];
      });

    case 'wide':
      return sides.flatMap((side) =>
        openEye(CENTER + eyeX * side, eyeY, eyeRx, eyeRy, 1.28),
      );

    case 'sparkle':
      return sides.flatMap((side) => {
        const cx = CENTER + eyeX * side;
        const base = openEye(cx, eyeY, eyeRx, eyeRy, 1.18);

        return [
          ...base,
          ellipse(
            cx - eyeRx * 0.35,
            eyeY + eyeRy * 0.4,
            eyeRx * 0.18,
            eyeRy * 0.18,
            'white',
          ),
        ];
      });

    case 'dizzy':
      return sides.flatMap((side) => [
        ellipse(CENTER + eyeX * side, eyeY, eyeRx * 1.1, eyeRy * 0.32, 'ink', {
          rotate: 35,
        }),
        ellipse(CENTER + eyeX * side, eyeY, eyeRx * 1.1, eyeRy * 0.32, 'ink', {
          rotate: -35,
        }),
      ]);

    default:
      return sides.flatMap((side) =>
        openEye(CENTER + eyeX * side, eyeY, eyeRx, eyeRy),
      );
  }
};

const mouthShapes = (emotion: Emotion, layout: FaceLayout): Shape[] => {
  const y = layout.mouthY;

  switch (emotion.mouth) {
    case 'grin':
      return [
        path(`M 136 ${y - 2} q 14 20 28 0 q -14 9 -28 0 z`, 'ink'),
        ellipse(150, y + 6, 8, 5, 'blush'),
      ];

    case 'open':
      return [
        ellipse(150, y + 4, 10, 9, 'ink'),
        ellipse(150, y + 7, 6, 4, 'blush'),
      ];

    case 'tongue':
      return [
        path(`M 136 ${y - 2} q 14 18 28 0 q -14 8 -28 0 z`, 'ink'),
        ellipse(150, y + 9, 7, 6, 'blush'),
      ];

    case 'frown':
      return [path(`M 137 ${y + 7} q 13 -16 26 0 q -13 -8 -26 0 z`, 'ink')];

    case 'wobble':
      return [
        path(
          `M 136 ${y} q 7 -7 14 0 q 7 7 14 0 q -7 7 -14 0 q -7 -7 -14 0 z`,
          'ink',
        ),
      ];

    case 'flat':
      return [ellipse(150, y, 12, 2.5, 'ink')];

    case 'small':
      return [ellipse(150, y, 7, 3.5, 'ink')];

    default:
      return [path(`M 138 ${y - 1} q 12 14 24 0 q -12 7 -24 0 z`, 'ink')];
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
      `M ${cx - 13} ${browY + lift + tilt * 3 * side} q 13 ${-7} 26 ${drop} q -13 ${-2} -26 ${-drop} z`,
      'ink',
      { opacity: 0.9 },
    );
  });
};

const overlayShapes = (emotion: Emotion, layout: FaceLayout): Shape[] => {
  const [x, y] = layout.overlay;

  switch (emotion.overlay) {
    case 'sleep':
      return [
        path(`M ${x} ${y} l 18 0 l -18 20 l 18 0`, 'ink', { opacity: 0.4 }),
        path(`M ${x + 22} ${y - 24} l 13 0 l -13 15 l 13 0`, 'ink', {
          opacity: 0.32,
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
        path(
          `M ${x + 20} ${y - 22} q 4 -7 8 0 q 4 -7 8 0 q 0 7 -8 12 q -8 -5 -8 -12 z`,
          'blush',
          { opacity: 0.7 },
        ),
      ];

    case 'sparkles':
      return [
        ellipse(x, y, 7, 7, 'accent', { rotate: 45 }),
        ellipse(x + 24, y + 18, 4.5, 4.5, 'accent', { rotate: 45 }),
        ellipse(x - 14, y + 26, 3.5, 3.5, 'accent', { rotate: 45 }),
      ];

    case 'question':
      return [
        path(
          `M ${x} ${y} q 10 -14 18 -2 q 5 8 -4 13 q -5 3 -5 9 l -9 0 q 0 -10 6 -14 q 5 -4 2 -7 q -4 -4 -8 3 z`,
          'ink',
          { opacity: 0.55 },
        ),
        ellipse(x + 9, y + 28, 4, 4, 'ink', { opacity: 0.55 }),
      ];

    case 'note':
      return [
        ellipse(x, y + 18, 7, 5, 'accent', { rotate: -18 }),
        path(`M ${x + 5} ${y + 16} l 3 -22 l 4 3 l -3 20 z`, 'accent'),
      ];

    case 'drop':
      return [
        path(`M ${x} ${y} q 9 12 0 18 q -9 -6 0 -18 z`, 'accent', {
          opacity: 0.65,
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
            CENTER + layout.eyeX * 1.5 * side,
            layout.eyeY + 18,
            15,
            9,
            'blush',
            { opacity: 0.8 },
          ),
        )
      : []),
  ],
  overlay: overlayShapes(emotion, layout),
});

export type { FaceLayout, FaceShapes };
