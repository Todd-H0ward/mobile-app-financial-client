import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { Sprite } from '@/entities/sprite/ui';

import { SPACING, TERMINAL_VARIANT } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Sheet, Text } from '@/shared/ui';

import { RoundLamps } from './trial-chrome';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PlayShellProps {
  title: string;
  round: number;
  hint: string;
  children: ReactNode;
  action: string;
  onAction: () => void;
  isDisabled?: boolean;
}

interface PlayDebriefProps {
  isVisible: boolean;
  /** Picks the dog's face: joy for a hit, a thinking look for a miss. */
  isCorrect: boolean;
  summary: string;
  explanation: string;
  onClose: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const PlayShell = ({
  title,
  round,
  hint,
  children,
  action,
  onAction,
  isDisabled,
}: PlayShellProps) => {
  const { t } = useTranslation();
  return (
    <Screen
      backdrop="arena"
      terminalVariant={TERMINAL_VARIANT.OVERSEER}
      gap={SPACING.THREE}
    >
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Text
            variant="machine"
            themeColor="overseerLcd"
          >{`// ${t('scene.watchers.overseer.name')}`}</Text>
          <Screen.Title>{title}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>
      <View style={styles.round}>
        <Text variant="small" themeColor="textSecondary">
          {t('financeGame.round', { round: Math.min(3, round + 1) })}
        </Text>
        <RoundLamps round={round} />
      </View>
      <Text themeColor="textSecondary">{hint}</Text>
      <View style={styles.stage}>{children}</View>
      <Button isFullWidth disabled={isDisabled} onPress={onAction}>
        {action}
      </Button>
    </Screen>
  );
};

export const PlayDebrief = ({
  isVisible,
  isCorrect,
  summary,
  explanation,
  onClose,
}: PlayDebriefProps) => {
  const { t } = useTranslation();
  return (
    <Sheet.Modal isVisible={isVisible} isDismissible={false} onClose={onClose}>
      <View style={styles.face}>
        <Sprite name={isCorrect ? 'dogJoy' : 'dogThink'} size={64} />
      </View>
      <Text variant="machine">{`> ${t('scene.watchers.keeper.name')}`}</Text>
      <Sheet.Title>{t('playkit.ui.debrief')}</Sheet.Title>
      <Text variant="bodyBold">{summary}</Text>
      <Sheet.Description>{explanation}</Sheet.Description>
      <Sheet.Actions>
        <Button isFullWidth onPress={onClose}>
          {t('financeGame.understood')}
        </Button>
      </Sheet.Actions>
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
  round: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
    justifyContent: 'space-between',
  },
  stage: { flex: 1, minHeight: 240 },
});

export type { PlayDebriefProps, PlayShellProps };
