import { describe, expect, it } from 'vitest';

import { compare } from '../compare';

import { pickRecoveryOptions } from './recovery';

// ═══════════════════════════════════════════
describe('pickRecoveryOptions', () => {
  it('offers habit + checkPlan when every direction landed on plan', () => {
    const rows = compare(
      { needs: 40, wants: 20, savings: 20 },
      { needs: 40, wants: 20, savings: 20 },
    );

    expect(pickRecoveryOptions(rows).map((row) => row.id)).toEqual([
      'keepHabit',
      'checkPlan',
    ]);
  });

  it('puts saveFirst first when wants ate the jar', () => {
    const rows = compare(
      { needs: 60, wants: 25, savings: 30 },
      { needs: 58, wants: 40, savings: 15 },
    );
    const options = pickRecoveryOptions(rows);

    expect(options.map((row) => row.id)).toEqual(['saveFirst', 'waitOnWant']);
    expect(options[0]?.destination).toBe('budgetPlan');
    expect(options[1]?.destination).toBe('home');
  });

  it('protects needs when that box went over', () => {
    const rows = compare(
      { needs: 10, wants: 0, savings: 0 },
      { needs: 12, wants: 0, savings: 0 },
    );
    const options = pickRecoveryOptions(rows);

    expect(options.map((row) => row.id)).toContain('protectNeeds');
    expect(options).toHaveLength(2);
  });

  it('never returns an empty list', () => {
    const rows = compare(
      { needs: 5, wants: 5, savings: 5 },
      { needs: 4, wants: 4, savings: 4 },
    );
    expect(pickRecoveryOptions(rows).length).toBeGreaterThan(0);
  });
});
