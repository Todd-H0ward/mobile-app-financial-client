import { useRouter } from 'expo-router';

import { useDeleteUser, useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { toast } from '@/shared/ui';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Deleting the profile and starting over from the bottom of the pit — 2.5.12.
 *
 * It is the delete, not the reset: a reset keeps the names and the settings.
 * Erasing the key is the only honest way back to a first launch, which is
 * also why it asks first wherever it is used.
 */
export const useProfileRestart = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const deleteUser = useDeleteUser();

  return {
    hasProfile: user !== null,
    /** Name shown in the confirmation, so it is clear whose profile goes. */
    playerName: user?.playerName ?? '',
    /** Periods already lived through — the consequence, named before the tap. */
    finishedPeriods: user?.history.length ?? 0,

    restart: () => {
      deleteUser();
      // The entry screen makes the fresh guest profile, exactly as on a
      // first launch — replacing right here keeps a profile-less home screen
      // from flashing in between.
      router.replace(STATIC_ROUTES.ENTRY);
      toast(t('profileRestart.toastDeleted'));
    },
  };
};
