import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { Sprite } from '@/entities/sprite/ui';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Sheet, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
interface GameShellProps {
  title: string;
  round: number;
  children: ReactNode;
  action: string;
  onAction: () => void;
  isDisabled?: boolean;
}
interface DebriefSheetProps {
  isVisible: boolean;
  chosen: string;
  correct: string;
  explanation: string;
  onClose: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
export const GameShell = ({
  title,
  round,
  children,
  action,
  onAction,
  isDisabled,
}: GameShellProps) => {
  const { t } = useTranslation();
  return (
    <Screen backdrop="arena" gap={SPACING.THREE}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Title>{title}</Screen.Title>
      </Screen.Header>
      <Text>{t('financeGame.round', { round: Math.min(3, round + 1) })}</Text>
      <View
        style={styles.rounds}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.min(3, round + 1), min: 1, max: 3 }}
      >
        {[0, 1, 2].map((n) => (
          <Sprite
            key={n}
            name={n < round ? 'coin' : n === round ? 'bolt' : 'coin'}
            size={24}
            style={n > round ? styles.upcoming : undefined}
          />
        ))}
      </View>
      {children}
      <Button disabled={isDisabled} onPress={onAction}>
        {action}
      </Button>
    </Screen>
  );
};
export const DebriefSheet = ({
  isVisible,
  chosen,
  correct,
  explanation,
  onClose,
}: DebriefSheetProps) => {
  const { t } = useTranslation();
  // The dog only ever looks thoughtful at a miss — nothing here is a failure.
  const isRight = chosen === correct;

  return (
    <Sheet.Modal isVisible={isVisible} isDismissible={false} onClose={onClose}>
      <View style={styles.face}>
        <Sprite name={isRight ? 'dogJoy' : 'dogThink'} size={64} />
      </View>
      <Sheet.Title>{t('financeGame.debrief')}</Sheet.Title>
      <Text>{t('financeGame.comparison', { chosen, correct })}</Text>
      <Text>{explanation}</Text>
      <Button onPress={onClose}>{t('financeGame.understood')}</Button>
    </Sheet.Modal>
  );
};
// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
  },
  rounds: {
    flexDirection: 'row',
    gap: SPACING.TWO,
  },
  upcoming: {
    opacity: 0.3,
  },
});

export type { DebriefSheetProps, GameShellProps };
