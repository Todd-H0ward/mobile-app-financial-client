import { useUserStore } from '@/entities/user';

import { usePreferencesStore } from '@/shared/model';

// ═══════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════

/**
 * Convenience read-selector for the settings screen and any widget that
 * shows a settings value without being a feature itself.
 *
 * Write-side actions come through the dedicated features:
 * `change-language` for the language, `update-user` for the booleans.
 */
export const useSettings = () => {
  const languagePreference = usePreferencesStore(
    (state) => state.languagePreference,
  );

  const isAnimationEnabled = useUserStore(
    (state) => state.user?.settings.isAnimationEnabled ?? true,
  );

  const isSoundEnabled = useUserStore(
    (state) => state.user?.settings.isSoundEnabled ?? true,
  );

  const isDemoMode = useUserStore(
    (state) => state.user?.settings.isDemoMode ?? false,
  );

  const isParentGateEnabled = useUserStore(
    (state) => state.user?.settings.isParentGateEnabled ?? true,
  );

  return {
    languagePreference,
    isAnimationEnabled,
    isSoundEnabled,
    isDemoMode,
    isParentGateEnabled,
  };
};
