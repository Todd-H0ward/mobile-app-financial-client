import { useRouter } from 'expo-router';

import {
  canFinishPeriod,
  finishPeriod,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { ROUTES } from '@/shared/constants';
import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Ends the active period from home and opens the summary screen.
 *
 * Lives here — not in `period-summary` — so home never imports a sibling
 * screen slice sideways.
 */
export const useEndPeriod = () => {
  const router = useRouter();
  const time = useTimeSource();
  const user = useUser();
  const updateUser = useUpdateUser();

  return {
    canEnd: user ? canFinishPeriod(user) : false,
    endPeriod: () => {
      if (!user || !canFinishPeriod(user)) return;
      updateUser((current) => finishPeriod(current, time));
      router.replace(ROUTES.PERIOD_SUMMARY);
    },
  };
};
