// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface InkPath {
  /** The character the rows use for this ink. */
  ink: string;
  /** Fill colour, straight from the palette. */
  color: string;
  /** SVG path data in grid units: one pixel is 1×1. */
  d: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TRANSPARENT = '.';

/**
 * How far each run overlaps its right and bottom neighbours, in pixels.
 * react-native-svg has no `shape-rendering: crispEdges`, so at a scale that
 * is not a whole number two antialiased edges meet as a hairline seam.
 */
const BLEED = 0.04;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * One path per ink, each horizontal run of a colour one rectangle — a 16×16
 * sprite becomes a handful of paths instead of up to 256 `Rect` nodes. `.`
 * and any character missing from the palette stay transparent.
 */
export const pixelPaths = (
  rows: readonly string[],
  palette: Readonly<Record<string, string>>,
): InkPath[] => {
  const byInk = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ink = row[x] as string;
      let run = 1;
      while (row[x + run] === ink) run += 1;
      if (ink !== TRANSPARENT && palette[ink] !== undefined) {
        const width = run + BLEED;
        byInk.set(
          ink,
          `${byInk.get(ink) ?? ''}M${x} ${y}h${width}v${1 + BLEED}h-${width}z`,
        );
      }
      x += run;
    }
  });
  return [...byInk].map(([ink, d]) => ({
    ink,
    color: palette[ink] as string,
    d,
  }));
};

/** Grid size of a picture: the longest row by the number of rows. */
export const pixelSize = (
  rows: readonly string[],
): { width: number; height: number } => ({
  width: Math.max(1, ...rows.map((row) => row.length)),
  height: Math.max(1, rows.length),
});

export type { InkPath };
