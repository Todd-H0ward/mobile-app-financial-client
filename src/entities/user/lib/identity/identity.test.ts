import { describe, expect, it } from 'vitest';

import { createInitialUser } from '../../model/initial-user';

import { applyIdentity } from './identity';

describe('local game identity', () => {
  it('normalizes both names while preserving all earned state', () => {
    const before = createInitialUser();
    before.robot.stage = 'complete';
    before.wallet.balance = 123;
    const after = applyIdentity(before, {
      playerName: '  Лунный   кот  ',
      robotName: ' Искра ',
      skin: 'arctic',
    });
    expect(after.playerName).toBe('Лунный кот');
    expect(after.robot).toEqual({ ...before.robot, name: 'Искра' });
    expect(after.settings.robotSkin).toBe('arctic');
    expect(after.wallet).toBe(before.wallet);
    expect(after.savings).toBe(before.savings);
    expect(after.platform).toBe(before.platform);
    expect(after.period).toBe(before.period);
  });

  it.each(['playerName', 'robotName'] as const)(
    'rejects an empty %s without mutating the save',
    (field) => {
      const before = createInitialUser();
      expect(
        applyIdentity(before, {
          playerName: 'Пилот',
          robotName: 'Искра',
          skin: 'factory',
          [field]: '  ',
        }),
      ).toBe(before);
    },
  );
});
