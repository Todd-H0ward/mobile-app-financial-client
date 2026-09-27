import { useState } from 'react';

import { Pressable, StyleSheet } from 'react-native';

import { RADII } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Sheet, Text } from '@/shared/ui';

import { useProfileRestart } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RestartProfileButtonProps {
  /** Label of the button itself. The sheet always speaks in full sentences. */
  label?: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const HOLD_MS = 2000;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Deletes the profile and starts a fresh one — 2.5.12.
 *
 * The confirmation names what goes before it goes: this is the one action in
 * the app that wipes progress, and it must never happen on a single tap — it
 * takes a two-second hold (screen 26).
 */
export const RestartProfileButton = ({ label }: RestartProfileButtonProps) => {
  const { t } = useTranslation();
  const { hasProfile, playerName, finishedPeriods, restart } =
    useProfileRestart();
  const theme = useTheme();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  const confirm = () => {
    setIsConfirmVisible(false);
    restart();
  };

  const buttonLabel = label ?? t('profileRestart.buttonLabel');

  return (
    <>
      <Button
        size="m"
        variant="warning"
        isFullWidth
        disabled={!hasProfile}
        onPress={() => setIsConfirmVisible(true)}
      >
        {buttonLabel}
      </Button>

      <Sheet.Modal
        variant="warning"
        isVisible={isConfirmVisible}
        onClose={() => setIsConfirmVisible(false)}
      >
        <Sheet.Label variant="warning">{t('profileRestart.label')}</Sheet.Label>
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
          {/* Screen 26: a deliberate two-second hold, so a stray tap can
              never wipe a profile. The safe choice is the filled one. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profileRestart.confirm')}
            accessibilityHint={t('profileRestart.hold')}
            delayLongPress={HOLD_MS}
            onPressIn={() => setIsHolding(true)}
            onPressOut={() => setIsHolding(false)}
            onLongPress={confirm}
            style={[
              styles.hold,
              {
                backgroundColor: isHolding ? theme.warningSoft : undefined,
                borderColor: theme.warning,
              },
            ]}
          >
            <Text variant="bodyBold" themeColor="warning">
              {isHolding
                ? t('profileRestart.holding')
                : t('profileRestart.hold')}
            </Text>
          </Pressable>
          <Button isFullWidth onPress={() => setIsConfirmVisible(false)}>
            {t('profileRestart.cancel')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  hold: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 52,
  },
});

export type { RestartProfileButtonProps };
