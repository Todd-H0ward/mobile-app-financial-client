import { clamp } from '@/shared/utils';

import type { UserSave } from '../../model';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Sets the thermostat, 0…1. Pure — settlement reads it via `buildBill`.
 *
 * The child never sees the percentage: the heating screen shows "chilly /
 * warm" and the coins due this period (docs/house.md).
 */
export const setTemperature = (
  user: UserSave,
  temperature: number,
): UserSave => ({
  ...user,
  home: {
    ...user.home,
    temperature: clamp(
      Number.isFinite(temperature) ? temperature : user.home.temperature,
      0,
      1,
    ),
  },
});
