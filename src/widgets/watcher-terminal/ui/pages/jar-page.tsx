import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { listGoals } from '@/entities/goal';
import { progressFor, remainingFor } from '@/entities/savings';
import { setActiveGoal, useCommitUser, useUser } from '@/entities/user';

import { DYNAMIC_ROUTES, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, PixelIcon, ProgressBar, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import {
  TerminalCard,
  type TerminalFrame,
  TerminalMenu,
  TerminalMenuRow,
  TerminalShell,
} from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface JarPageProps {
  frame: TerminalFrame;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** One cell is ten coins, capped so a long goal still fits one line. */
const MAX_CELLS = 15;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The jar (concept E1): the chosen goal framed in green and labelled "✓ ЦЕЛЬ",
 * the others as plain rows. Depositing and withdrawing live on the goal's
 * own screen, where the cost of a withdrawal is spelled out.
 */
export const JarPage = ({ frame }: JarPageProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useUser();
  const commitUser = useCommitUser();
  const activeId = user?.savings.activeGoalId ?? null;

  const goals = listGoals().map((goal) => {
    const saved =
      user?.savings.goals.find((entry) => entry.goalId === goal.id)?.saved ?? 0;
    return {
      goal,
      saved,
      title: t(`savings.goals.${goal.id}.title`, { defaultValue: goal.title }),
    };
  });
  const active = goals.find((row) => row.goal.id === activeId) ?? null;
  const others = goals.filter((row) => row.goal.id !== activeId);

  const openGoal = (goalId: string) => {
    if (user && goalId !== activeId) {
      const result = setActiveGoal(user, goalId);
      if (result.ok) commitUser(user, result.user);
    }
    router.push(DYNAMIC_ROUTES.goal(goalId));
  };

  return (
    <TerminalShell
      {...frame}
      label={t('watcher.terminal.pages.jar.label')}
      title={t('watcher.terminal.pages.jar.title')}
      trailing={<HintButton screen="savings" />}
      footer={
        active ? (
          <Button
            isFullWidth
            disabled={user?.period.phase !== 'active'}
            onPress={() => openGoal(active.goal.id)}
          >
            {t('watcher.terminal.jar.deposit')}
          </Button>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.stack}>
        {active ? (
          <TerminalCard variant="selected">
            <View style={styles.head}>
              <View
                style={[styles.iconBox, { backgroundColor: theme.surfaceSoft }]}
              >
                <PixelIcon name="piggy" />
              </View>
              <View style={styles.headCopy}>
                <Text variant="bodyBold" style={styles.goalTitle}>
                  {active.title}
                </Text>
                <Text variant="small" themeColor="textMuted">
                  {t('watcher.terminal.jar.mainGoal')}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <PixelIcon name="check" size={12} tone="onAccent" />
                <Text
                  variant="code"
                  themeColor="onAccent"
                  style={styles.badgeText}
                >
                  {t('watcher.terminal.jar.goalBadge').toLocaleUpperCase()}
                </Text>
              </View>
            </View>
            <ProgressBar
              value={progressFor(active.saved, active.goal.price)}
              segmentCount={Math.min(
                MAX_CELLS,
                Math.max(1, Math.ceil(active.goal.price / 10)),
              )}
              height={10}
              trackColor="surfaceSoft"
            />
            <View style={styles.progressRow}>
              <Text variant="small" themeColor="textSecondary">
                {remainingFor(active.saved, active.goal.price) > 0
                  ? t('watcher.terminal.jar.left', {
                      count: formatMoney(
                        remainingFor(active.saved, active.goal.price),
                      ),
                    })
                  : t('watcher.terminal.jar.reached')}
              </Text>
              <Text variant="machine">
                {`${formatMoney(active.saved)} / ${formatMoney(active.goal.price)}`}
              </Text>
            </View>
          </TerminalCard>
        ) : (
          <Text themeColor="textSecondary">
            {t('watcher.terminal.jar.empty')}
          </Text>
        )}

        {others.length > 0 ? (
          <TerminalMenu>
            {others.map((row) => (
              <TerminalMenuRow
                key={row.goal.id}
                label={row.title}
                description={`${formatMoney(row.saved)} / ${formatMoney(row.goal.price)}`}
                onPress={() => openGoal(row.goal.id)}
              />
            ))}
          </TerminalMenu>
        ) : null}
      </ScrollView>
    </TerminalShell>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: SPACING.two,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, lineHeight: 16 },
  goalTitle: { fontSize: 17, lineHeight: 21 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  headCopy: { flex: 1, minWidth: 0 },
  iconBox: {
    alignItems: 'center',
    borderRadius: RADII.s,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stack: { gap: SPACING.two, paddingBottom: SPACING.two },
});

export type { JarPageProps };
