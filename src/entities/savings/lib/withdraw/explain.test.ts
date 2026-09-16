import { describe, expect, it } from 'vitest';

import { explainWithdraw } from './explain';

// ═══════════════════════════════════════════
describe('explainWithdraw', () => {
  it('recalculates remaining and periods before and after the take', () => {
    // Scooter 140, saved 95 → 45 left (~2 periods at 40); take 50 → 95 left (~3).
    const explain = explainWithdraw({
      amount: 50,
      saved: 95,
      price: 140,
      goalTitle: 'Самокат',
      plannedDeposit: 40,
    });

    expect(explain.savedBefore).toBe(95);
    expect(explain.savedAfter).toBe(45);
    expect(explain.remainingBefore).toBe(45);
    expect(explain.remainingAfter).toBe(95);
    expect(explain.periodsBefore).toBe(2);
    expect(explain.periodsAfter).toBe(3);
    expect(explain.progressAfter).toBeLessThan(explain.progressBefore);
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

    expect(explain.periodsBefore).toBeNull();
    expect(explain.periodsAfter).toBeNull();
  });

  it('matches the economy.md shape: farther from the goal after a take', () => {
    // «До самоката останется 85 вместо 45» — remaining grows when you withdraw.
    const explain = explainWithdraw({
      amount: 40,
      saved: 95,
      price: 140,
      goalTitle: 'Самокат',
      plannedDeposit: 40,
    });

    expect(explain.remainingBefore).toBe(45);
    expect(explain.remainingAfter).toBe(85);
    expect(explain.periodsAfter).toBe(3);
  });
});
