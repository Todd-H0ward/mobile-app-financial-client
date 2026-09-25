import type { ReactNode } from 'react';

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
    <Screen gap="three">
      <Screen.Header>
        <Screen.Back />
        <Screen.Title>{title}</Screen.Title>
      </Screen.Header>
      <Text>{t('financeGame.round', { round: Math.min(3, round + 1) })}</Text>
      <Text
        accessibilityLabel={t('financeGame.round', {
          round: Math.min(3, round + 1),
        })}
      >
        {[0, 1, 2]
          .map((n) => (n < round ? '●' : n === round ? '◉' : '○'))
          .join('   ')}
      </Text>
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
  return (
    <Sheet.Modal isVisible={isVisible} isDismissible={false} onClose={onClose}>
      <Sheet.Title>{t('financeGame.debrief')}</Sheet.Title>
      <Text>{t('financeGame.comparison', { chosen, correct })}</Text>
      <Text>{explanation}</Text>
      <Button onPress={onClose}>{t('financeGame.understood')}</Button>
    </Sheet.Modal>
  );
};
export type { DebriefSheetProps, GameShellProps };
