import { describe, expect, it } from 'vitest';

import {
  CHART_HEIGHT,
  CHART_WIDTH,
  chartArea,
  chartCeiling,
  chartLength,
  chartLine,
  chartPoint,
  PADDING_BOTTOM,
  PADDING_LEFT,
  PADDING_RIGHT,
  PADDING_TOP,
} from './chart';

// ═══════════════════════════════════════════
// 1. The scale
// ═══════════════════════════════════════════

describe('chartCeiling', () => {
  it('takes the tallest value across every series', () => {
    expect(
      chartCeiling([
        { values: [1, 9, 4], color: 'success' },
        { values: [12], color: 'accent' },
      ]),
    ).toBe(12);
  });

  it('never drops below one, so a flat zero still has a surface', () => {
    expect(chartCeiling([{ values: [0, 0], color: 'success' }])).toBe(1);
    expect(chartCeiling([])).toBe(1);
  });
});

describe('chartLength', () => {
  it('counts the longest series', () => {
    expect(
      chartLength([
        { values: [1, 2], color: 'success' },
        { values: [1, 2, 3], color: 'accent' },
      ]),
    ).toBe(3);
  });

  it('is zero with nothing to draw', () => {
    expect(chartLength([])).toBe(0);
  });
});

// ═══════════════════════════════════════════
// 2. Placing a value
// ═══════════════════════════════════════════

describe('chartPoint', () => {
  it('puts the ceiling at the top and zero at the bottom', () => {
    expect(chartPoint(10, 0, 2, 10).y).toBe(PADDING_TOP);
    expect(chartPoint(0, 0, 2, 10).y).toBe(CHART_HEIGHT - PADDING_BOTTOM);
  });

  it('runs left to right across the plot', () => {
    expect(chartPoint(1, 0, 3, 10).x).toBe(PADDING_LEFT);
    expect(chartPoint(1, 2, 3, 10).x).toBe(CHART_WIDTH - PADDING_RIGHT);
  });

  it('centres a lone reading instead of pinning it to the left edge', () => {
    const only = chartPoint(5, 0, 1, 10);

    expect(only.x).toBeGreaterThan(PADDING_LEFT);
    expect(only.x).toBeLessThan(CHART_WIDTH - PADDING_RIGHT);
  });

  it('clamps a value past the ceiling instead of drawing off the top', () => {
    expect(chartPoint(999, 0, 2, 10).y).toBe(PADDING_TOP);
    expect(chartPoint(-5, 0, 2, 10).y).toBe(CHART_HEIGHT - PADDING_BOTTOM);
  });

  it('spaces the points evenly', () => {
    const [a, b, c] = [0, 1, 2].map((i) => chartPoint(1, i, 3, 10).x);

    expect((b ?? 0) - (a ?? 0)).toBeCloseTo((c ?? 0) - (b ?? 0));
  });
});

// ═══════════════════════════════════════════
// 3. The path
// ═══════════════════════════════════════════

describe('chartLine', () => {
  it('starts with a move and continues with lines', () => {
    const d = chartLine([
      { x: 0, y: 1 },
      { x: 2, y: 3 },
      { x: 4, y: 5 },
    ]);

    expect(d).toBe('M 0 1 L 2 3 L 4 5');
  });

  it('draws nothing from nothing', () => {
    expect(chartLine([])).toBe('');
  });
});

describe('chartArea', () => {
  it('closes the line down to the baseline', () => {
    const d = chartArea([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);

    expect(d.startsWith('M 10 20 L 30 40')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain(`L 30 ${CHART_HEIGHT - PADDING_BOTTOM}`);
    expect(d).toContain(`L 10 ${CHART_HEIGHT - PADDING_BOTTOM}`);
  });

  it('draws nothing from nothing', () => {
    expect(chartArea([])).toBe('');
  });
});
