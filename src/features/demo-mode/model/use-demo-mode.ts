import {
  DEMO_RUN_PERIODS,
  runDemoPeriods,
  toggleDemoMode,
  useUser,
  useUserStore,
} from '@/entities/user';

import { demoTimeSource } from '@/shared/lib';
import { toast } from '@/shared/ui';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Demo-mode controls for the grown-up (2.5.13).
 *
 * Pure transitions live in `entities/user/lib/demo`; this hook only wires them
 * to the store and names each change with a toast (2.5.9).
 */
export const useDemoMode = () => {
  const user = useUser();
  const updateUser = useUserStore((state) => state.updateUser);
  const resetUser = useUserStore((state) => state.resetUser);

  const isDemoMode = user?.settings.isDemoMode ?? false;
  const periodIndex = user?.period.index ?? 1;
  const finishedPeriods = user?.history.length ?? 0;

  const enable = () => {
    updateUser(toggleDemoMode);
    toast('Включён тестовый профиль');
  };

  const disable = () => {
    updateUser(toggleDemoMode);
    toast('Демо-режим выключен');
  };

  const runPeriods = () => {
    updateUser((current) => runDemoPeriods(current, demoTimeSource));
    toast(`Прогнано ${DEMO_RUN_PERIODS} периодов`);
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
