import type { ThemeColor } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One series of a chart: the numbers, what to call them, what colour to use. */
interface ChartSeries {
  /** Values, oldest first. An empty series draws nothing and never throws. */
  values: number[];
  color: ThemeColor;
  /** Name for the legend. Omit it and the series has no legend entry. */
  label?: string;
}

/** A point on the drawing surface, in chart units. */
interface ChartPoint {
  x: number;
  y: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The drawing surface every chart is laid out in, then scaled to its box.
 *
 * A fixed viewBox rather than measured pixels: the maths below stays plain
 * numbers, and the SVG scales itself to whatever width the card gives it.
 */
const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;

/** Room for the value labels on the left and the tick labels underneath. */
const PADDING_LEFT = 34;
const PADDING_RIGHT = 8;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 4;

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

/** The tallest value any series reaches. Never below 1, so a flat zero draws. */
export const chartCeiling = (series: ChartSeries[]): number =>
  Math.max(1, ...series.flatMap((one) => one.values));

/** How many points the longest series has. */
export const chartLength = (series: ChartSeries[]): number =>
  Math.max(0, ...series.map((one) => one.values.length));

/**
 * Where one value sits on the surface.
 *
 * `y` is flipped on the way out — SVG counts downwards, a chart counts up, and
 * doing it here keeps every caller free of the inversion.
 */
export const chartPoint = (
  value: number,
  index: number,
  count: number,
  ceiling: number,
): ChartPoint => {
  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  // One point sits in the middle rather than on the left edge: a single
  // reading is not the beginning of a trend, it is the whole of it.
  const step = count > 1 ? plotWidth / (count - 1) : 0;
  const x =
    count > 1 ? PADDING_LEFT + index * step : PADDING_LEFT + plotWidth / 2;

  const share = Math.min(Math.max(value, 0), ceiling) / ceiling;

  return { x, y: PADDING_TOP + plotHeight * (1 - share) };
};

/** The `d` of a polyline through every point, or `''` for an empty series. */
export const chartLine = (points: ChartPoint[]): string =>
  points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

/**
 * The same line closed down to the baseline, for the tint under it.
 *
 * The fill is what makes a line chart readable at a glance on a phone: the eye
 * reads area faster than it reads slope.
 */
export const chartArea = (points: ChartPoint[]): string => {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';

  const baseline = CHART_HEIGHT - PADDING_BOTTOM;

  return `${chartLine(points)} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
};

export type { ChartPoint, ChartSeries };
export {
  CHART_HEIGHT,
  CHART_WIDTH,
  PADDING_BOTTOM,
  PADDING_LEFT,
  PADDING_RIGHT,
  PADDING_TOP,
};
