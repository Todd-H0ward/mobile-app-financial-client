import {
  DEMO_RUN_PERIODS,
  runDemoPeriods,
  useResetUser,
  useSetDemoMode,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { isDemoTimeSource, useTimeSource } from '@/shared/lib';
import { toast } from '@/shared/ui';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Demo-mode controls for the grown-up (2.5.13).
 *
 * Pure transitions live in `entities/user/lib/demo`, parking the child's save
 * is the store's job; this hook only wires the two together and names each
 * change with a toast (2.5.9).
 */
export const useDemoMode = () => {
  const user = useUser();
  // The clock comes from the provider, never from the module: in demo mode it
  // is the demo clock, and `runPeriods` refuses to run against any other.
  const time = useTimeSource();
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
    if (!isDemoTimeSource(time)) {
      toast('Прогон периодов доступен только в демо-режиме');
      return;
    }

    try {
      updateUser((current) => runDemoPeriods(current, time));
      toast(`Прогнано ${DEMO_RUN_PERIODS} периодов`);
    } catch {
      // The run guards itself against a runaway state machine. A grown-up
      // pressing a button deserves a message, not a red screen.
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
