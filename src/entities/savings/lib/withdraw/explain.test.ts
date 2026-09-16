import { describe, expect, it } from 'vitest';

import { explainWithdraw } from './explain';

// ═══════════════════════════════════════════
describe('explainWithdraw', () => {
  it('names remaining before and after the take', () => {
    // Scooter 140, saved 95 → 45 left; take 12 → 57 left (docs/economy.md shape).
    const explain = explainWithdraw({
      amount: 12,
      saved: 95,
      price: 140,
      goalTitle: 'Самокат',
      plannedDeposit: 40,
    });

    expect(explain.remainingBefore).toBe(45);
    expect(explain.remainingAfter).toBe(57);
    expect(explain.periodsAfter).toBe(2);
    expect(explain.goalTitle).toBe('Самокат');
  });

  it('omits the period guess when the plan has no savings line', () => {
    const explain = explainWithdraw({
      amount: 10,
      saved: 30,
      price: 60,
      goalTitle: 'Краски',
      plannedDeposit: 0,
    });

    expect(explain.periodsAfter).toBeNull();
  });
});
