import { describe, expect, it } from 'vitest';

import { compare } from '../compare';

import { explainSummary } from './explain';

// ═══════════════════════════════════════════
describe('explainSummary', () => {
  it('celebrates when every direction landed on plan', () => {
    const rows = compare(
      { needs: 40, wants: 20, savings: 20 },
      { needs: 40, wants: 20, savings: 20 },
    );
    const explain = explainSummary(rows);

    expect(explain.storyKey).toBe('allOnPlan');
    expect(explain.tipKeys.length).toBeGreaterThan(0);
  });

  it('links wants overspend to savings underspend', () => {
    const rows = compare(
      { needs: 60, wants: 25, savings: 30 },
      { needs: 58, wants: 40, savings: 15 },
    );
    const explain = explainSummary(rows);

    expect(explain.storyKey).toBe('wantsAteSavings');
    expect(explain.overspent).toContain('wants');
    expect(explain.underspent).toContain('savings');
    expect(explain.tipKeys).toContain('saveFirst');
  });

  it('always offers at least one recovery tip', () => {
    const rows = compare(
      { needs: 10, wants: 0, savings: 0 },
      { needs: 12, wants: 0, savings: 0 },
    );
    expect(explainSummary(rows).tipKeys.length).toBeGreaterThan(0);
  });
});
