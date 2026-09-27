import { useRouter } from 'expo-router';

import {
  canFinishPeriod,
  type EndPeriodStatus,
  endPeriodStatus,
  useUserStore,
} from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Home only navigates — soft warning must show before phase changes (0.3-R). */
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
      router.push(STATIC_ROUTES.END_PERIOD);
    },
  };
};
