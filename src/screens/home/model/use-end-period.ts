import { useRouter } from 'expo-router';

import {
  canFinishPeriod,
  type EndPeriodStatus,
  endPeriodStatus,
  useUser,
} from '@/entities/user';

import { ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Opens the End day confirm screen from home.
 *
 * Freeze (`finishPeriod`) runs on that screen — home only navigates, so the
 * child always sees the soft warning before the phase changes (0.3-R).
 */
export const useEndPeriod = () => {
  const router = useRouter();
  const user = useUser();

  const status: EndPeriodStatus = user ? endPeriodStatus(user) : 'disabled';

  return {
    status,
    openConfirm: () => {
      if (!user || !canFinishPeriod(user)) return;
      router.push(ROUTES.END_PERIOD);
    },
  };
};
