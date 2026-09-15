import { useState } from 'react';

import { Button, Sheet } from '@/shared/ui';

import { useProfileRestart } from '../model/use-profile-restart';

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
  label = 'Пройти знакомство заново',
}: RestartOnboardingButtonProps) => {
  const { hasProfile, playerName, finishedPeriods, restart } =
    useProfileRestart();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const confirm = () => {
    setIsConfirmVisible(false);
    restart();
  };

  return (
    <>
      <Button
        size="m"
        variant="secondary"
        isFullWidth
        disabled={!hasProfile}
        onPress={() => setIsConfirmVisible(true)}
      >
        {label}
      </Button>

      <Sheet.Modal
        isVisible={isConfirmVisible}
        onClose={() => setIsConfirmVisible(false)}
      >
        <Sheet.Title>Удалить профиль?</Sheet.Title>
        <Sheet.Description>
          {playerName.length > 0
            ? `Профиль «${playerName}» удалится с устройства: монеты, копилка и история периодов (${finishedPeriods}) пропадут.`
            : 'Профиль удалится с устройства: монеты, копилка и история периодов пропадут.'}
        </Sheet.Description>
        <Sheet.Description>
          Вернуть его будет нельзя — знакомство начнётся с чистого листа.
        </Sheet.Description>

        <Sheet.Actions>
          <Button
            variant="ghost"
            isFullWidth
            onPress={() => setIsConfirmVisible(false)}
          >
            Оставить как есть
          </Button>
          <Button variant="accent" isFullWidth onPress={confirm}>
            Удалить и начать заново
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </>
  );
};

export type { RestartOnboardingButtonProps };
