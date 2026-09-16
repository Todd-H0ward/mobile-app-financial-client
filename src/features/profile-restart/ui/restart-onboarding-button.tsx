import { useState } from 'react';

import { useTranslation } from '@/shared/i18n';
import { Button, Sheet } from '@/shared/ui';

import { useProfileRestart } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RestartOnboardingButtonProps {
  /** Label of the button itself. The sheet always speaks in full sentences. */
  label?: string;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Deletes the profile and opens onboarding — 2.5.12.
 *
 * The confirmation names what goes before it goes: this is the one action in
 * the app that wipes progress, and it must never happen on a single tap.
 */
export const RestartOnboardingButton = ({
  label,
}: RestartOnboardingButtonProps) => {
  const { t } = useTranslation();
  const { hasProfile, playerName, finishedPeriods, restart } =
    useProfileRestart();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const confirm = () => {
    setIsConfirmVisible(false);
    restart();
  };

  const buttonLabel = label ?? t('profileRestart.buttonLabel');

  return (
    <>
      <Button
        size="m"
        variant="secondary"
        isFullWidth
        disabled={!hasProfile}
        onPress={() => setIsConfirmVisible(true)}
      >
        {buttonLabel}
      </Button>

      <Sheet.Modal
        isVisible={isConfirmVisible}
        onClose={() => setIsConfirmVisible(false)}
      >
        <Sheet.Title>{t('profileRestart.modalTitle')}</Sheet.Title>
        <Sheet.Description>
          {playerName.length > 0
            ? t('profileRestart.modalDescWithName', {
                playerName,
                finishedPeriods,
              })
            : t('profileRestart.modalDescWithoutName')}
        </Sheet.Description>
        <Sheet.Description>
          {t('profileRestart.modalWarning')}
        </Sheet.Description>

        <Sheet.Actions>
          <Button
            variant="ghost"
            isFullWidth
            onPress={() => setIsConfirmVisible(false)}
          >
            {t('profileRestart.keepAsIs')}
          </Button>
          <Button variant="accent" isFullWidth onPress={confirm}>
            {t('profileRestart.confirm')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </>
  );
};

export type { RestartOnboardingButtonProps };
