import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { getGoalById } from '@/entities/goal';
import { progressFor, remainingFor } from '@/entities/savings';
import { useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { formatMoney } from '@/shared/utils';

import { TerminalMenuRow, TerminalRule, TerminalText } from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface JarPageProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const JarPage = ({ onBack }: JarPageProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const activeId = user?.savings.activeGoalId;
  const goalSave = user?.savings.goals.find((goal) => goal.goalId === activeId);
  const goal = activeId ? getGoalById(activeId) : undefined;
  const saved = goalSave?.saved ?? 0;
  const price = goal?.price ?? 0;
  const progress = progressFor(saved, price);
  const left = remainingFor(saved, price);

  return (
    <View style={styles.stack}>
      <TerminalText>
        {goal
          ? t(`goals.${goal.id}.title`, { defaultValue: goal.title })
          : t('watcher.terminal.jar.empty')}
      </TerminalText>
      {goal ? (
        <>
          <TerminalText>
            {t('watcher.terminal.jar.progress', {
              saved: formatMoney(saved),
              price: formatMoney(price),
              percent: Math.round(progress * 100),
            })}
          </TerminalText>
          <TerminalText isDim>
            {t('watcher.terminal.jar.remaining', {
              count: formatMoney(left),
            })}
          </TerminalText>
        </>
      ) : null}
      <TerminalRule />
      <TerminalMenuRow
        label={t('watcher.terminal.jar.open')}
        onPress={() => router.push(STATIC_ROUTES.SAVINGS as Href)}
      />
      <TerminalMenuRow label={t('watcher.terminal.back')} onPress={onBack} />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: SPACING.two },
});
