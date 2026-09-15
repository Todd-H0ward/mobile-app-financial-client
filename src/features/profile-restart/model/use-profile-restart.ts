import { useRouter } from 'expo-router';

import { useUser, useUserStore } from '@/entities/user';

import { toast } from '@/shared/ui';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Deleting the profile and walking onboarding again — 2.5.12.
 *
 * It is the delete, not the reset: a reset keeps the name, the looks and the
 * settings, so the child never sees onboarding again. Erasing the key is the
 * only honest way back to the first screen, which is also why it asks first
 * wherever it is used.
 */
export const useProfileRestart = () => {
  const router = useRouter();
  const user = useUser();
  const deleteUser = useUserStore((state) => state.deleteUser);

  return {
    /** Whether there is anything to delete. */
    hasProfile: user !== null,
    /** Name shown in the confirmation, so it is clear whose profile goes. */
    playerName: user?.playerName ?? '',
    /** Periods already lived through — the consequence, named before the tap. */
    finishedPeriods: user?.history.length ?? 0,

    restart: () => {
      deleteUser();
      // `EntryScreen` would send us there anyway, but replacing right here
      // keeps the empty home screen from flashing between the two.
      router.replace('/onboarding');
      toast('Профиль удалён — знакомство начинается заново');
    },
  };
};
