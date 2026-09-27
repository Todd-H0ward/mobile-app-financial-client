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
  /** Button label; the sheet always speaks in full sentences. */
  label?: string;
  variant?: 'warning' | 'secondary';
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const HOLD_MS = 2000;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Wipe progress — requires a 2s hold, never a single tap (screen 26 / 2.5.12). */
export const RestartProfileButton = ({
  label,
  variant = 'warning',
}: RestartProfileButtonProps) => {
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
        variant={variant}
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
          {/* 2s hold so a stray tap cannot wipe (screen 26). */}
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
