import {
  DEMO_RUN_PERIODS,
  runDemoPeriods,
  useResetUser,
  useSetDemoMode,
  useUpdateUser,
  useUser,
} from '@/entities/user';

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
  const user = useUser();
  const updateUser = useUpdateUser();
  const setDemoMode = useSetDemoMode();
  const resetUser = useResetUser();

  const isDemoMode = user?.settings.isDemoMode ?? false;
  const periodIndex = user?.period.index ?? 1;
  const finishedPeriods = user?.history.length ?? 0;

  const enable = () => {
    setDemoMode(true);
    toast('Включён тестовый профиль');
  };

  const disable = () => {
    setDemoMode(false);
    toast('Демо-режим выключен, профиль вернулся');
  };

  const runPeriods = () => {
    if (!isDemoMode) {
      toast('Прогон периодов доступен только в демо-режиме');
      return;
    }

    try {
      updateUser((current) => runDemoPeriods(current));
      toast(`Прогнано ${DEMO_RUN_PERIODS} периодов`);
    } catch {
      toast('Не удалось прогнать периоды', { variant: 'warning' });
    }
  };

  const resetProfile = () => {
    resetUser();
    toast('Профиль сброшен к исходному');
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
