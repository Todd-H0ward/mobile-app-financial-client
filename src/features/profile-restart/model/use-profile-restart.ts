import { useRouter } from 'expo-router';

import { useDeleteUser, useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { toast } from '@/shared/ui';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Delete (not reset) — only way back to a first launch; 2.5.12. */
export const useProfileRestart = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const deleteUser = useDeleteUser();

  return {
    hasProfile: user !== null,
    /** Shown in the confirmation — whose profile goes. */
    playerName: user?.playerName ?? '',
    /** Periods lived — named before the wipe. */
    finishedPeriods: user?.history.length ?? 0,

    restart: () => {
      deleteUser();
      // Entry rebuilds the guest; replace avoids a profile-less home flash.
      router.replace(STATIC_ROUTES.ENTRY);
      toast(t('profileRestart.toastDeleted'));
    },
  };
};
