import {
  DEMO_RUN_PERIODS,
  runDemoPeriods,
  useResetUser,
  useSetDemoMode,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { useTranslation } from '@/shared/i18n';
import { toast } from '@/shared/ui';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Demo-mode controls for the grown-up (2.5.13 / 0.3-R).
 *
 * Demo is a test profile + reset + FSM run — no accelerated clock.
 */
export const useDemoMode = () => {
  const { t } = useTranslation();
  const user = useUser();
  const updateUser = useUpdateUser();
  const setDemoMode = useSetDemoMode();
  const resetUser = useResetUser();

  const isDemoMode = user?.settings.isDemoMode ?? false;
  const periodIndex = user?.period.index ?? 1;
  const finishedPeriods = user?.history.length ?? 0;

  const enable = () => {
    setDemoMode(true);
    toast(t('demoMode.toastEnabled'));
  };

  const disable = () => {
    setDemoMode(false);
    toast(t('demoMode.toastDisabled'));
  };

  const runPeriods = () => {
    if (!isDemoMode) {
      toast(t('demoMode.toastRunOnlyInDemo'));
      return;
    }

    try {
      updateUser((current) => runDemoPeriods(current));
      toast(t('demoMode.toastRunDone', { count: DEMO_RUN_PERIODS }));
    } catch {
      toast(t('demoMode.toastRunFailed'), { variant: 'warning' });
    }
  };

  const resetProfile = () => {
    resetUser();
    toast(t('demoMode.toastReset'));
  };

  return {
    isDemoMode,
    periodIndex,
    finishedPeriods,
    enable,
    disable,
    runPeriods,
    resetProfile,
  };
};
