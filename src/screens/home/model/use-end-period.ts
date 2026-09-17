import { useRouter } from 'expo-router';

import {
  canFinishPeriod,
  type EndPeriodStatus,
  endPeriodStatus,
  useUserStore,
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
 *
 * The selector returns a string status, so wallet ticks that leave the phase
 * and plan untouched do not re-render the banner.
 */
export const useEndPeriod = () => {
  const router = useRouter();
  const status: EndPeriodStatus = useUserStore((state) => {
    const user = state.user;
    if (!user) return 'disabled';
    return endPeriodStatus(user);
  });

  return {
    status,
    openConfirm: () => {
      const user = useUserStore.getState().user;
      if (!user || !canFinishPeriod(user)) return;
      router.push(ROUTES.END_PERIOD);
    },
  };
};
