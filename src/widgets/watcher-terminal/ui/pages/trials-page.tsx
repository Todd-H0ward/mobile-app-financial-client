import { useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  listTasks,
  rewardForTask,
  TASK_THEMES,
  type TaskTheme,
} from '@/entities/task';
import {
  selectTask,
  type UserSave,
  useCommitUser,
  useUser,
  useUserStore,
} from '@/entities/user';

import { DYNAMIC_ROUTES, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { ChamferCard, Chip, PixelIcon, Text } from '@/shared/ui';
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

interface TrialsPageProps {
  frame: TerminalFrame;
  onArcade: () => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isSamePeriod = (
  current: UserSave | null,
  rendered: UserSave | null,
): current is UserSave =>
  current !== null &&
  rendered !== null &&
  current.createdAt === rendered.createdAt &&
  current.settings.isDemoMode === rendered.settings.isDemoMode &&
  current.period.index === rendered.period.index;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The Overseer's trials (screen 20). An open trial wears his cut-corner frame,
 * a finished one is a calm card with "✓". The brief's three themes are the
 * filters; mini-games sit apart, as extra income.
 */
export const TrialsPage = ({ frame, onArcade }: TrialsPageProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useUser();
  const commitUser = useCommitUser();
  const [filter, setFilter] = useState<TaskTheme | null>(null);
  const canPlay = user?.period.phase === 'active';
  const tasks = listTasks();

  const openTask = (taskId: string) => {
    const current = useUserStore.getState().user;
    if (!isSamePeriod(current, user)) return;
    if (current.period.phase !== 'active') return;
    const result = selectTask(current, taskId);
    if (result.ok) commitUser(current, result.user);
    router.push(DYNAMIC_ROUTES.task(taskId));
  };

  return (
    <TerminalShell
      {...frame}
      label={t('watcher.terminal.pages.trials.label')}
      title={t('watcher.terminal.pages.trials.title')}
    >
      <ScrollView contentContainerStyle={styles.stack}>
        {!canPlay ? (
          <TerminalCard>
            <View style={styles.row}>
              <PixelIcon name="lock" size={12} tone="textDisabled" />
              <Text variant="code" themeColor="textMuted">
                {t('home.hud.planFirst')}
              </Text>
            </View>
            <Text themeColor="textSecondary">
              {t('watcher.terminal.trials.planFirst')}
            </Text>
          </TerminalCard>
        ) : null}

        <View style={styles.filters}>
          <Chip
            variant={filter === null ? 'selected' : 'neutral'}
            onPress={() => setFilter(null)}
          >
            {t('watcher.terminal.trials.filterAll', { count: tasks.length })}
          </Chip>
          {TASK_THEMES.map((themeId) => (
            <Chip
              key={themeId}
              variant={filter === themeId ? 'selected' : 'neutral'}
              onPress={() => setFilter(themeId)}
            >
              {t(`tasks.filters.${themeId}`)}
            </Chip>
          ))}
        </View>

        {tasks.map((task, index) => {
          if (filter && task.theme !== filter) return null;
          const isDone =
            user?.tasks.completedThisPeriod.includes(task.id) ?? false;
          const isActive = user?.tasks.activeTaskId === task.id;
          const title = t(`tasks.items.${task.id}.title`, {
            defaultValue: task.title,
          });
          const meta = [
            t('watcher.terminal.trials.number', { index: index + 1 }),
            t(`tasks.filters.${task.theme}`),
            isActive ? t('watcher.terminal.trials.active') : null,
          ]
            .filter(Boolean)
            .join(' · ')
            .toLocaleUpperCase();

          if (isDone) {
            return (
              <TerminalCard key={task.id} style={styles.row}>
                <View style={styles.copy}>
                  <Text
                    variant="code"
                    themeColor="textMuted"
                    style={styles.meta}
                  >
                    {meta}
                  </Text>
                  <Text themeColor="textSecondary">{title}</Text>
                </View>
                <PixelIcon name="check" size={12} />
              </TerminalCard>
            );
          }

          return (
            <Pressable
              key={task.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canPlay }}
              accessibilityLabel={`${title}, +${rewardForTask(task)}`}
              disabled={!canPlay}
              onPress={() => openTask(task.id)}
            >
              {({ pressed }) => (
                <ChamferCard
                  fillColor={pressed ? theme.surfaceSoft : undefined}
                  borderTone={canPlay ? 'overseerLcd' : 'border'}
                  style={styles.row}
                >
                  <View style={styles.copy}>
                    <Text
                      variant="code"
                      themeColor={canPlay ? 'overseerLcd' : 'textMuted'}
                      style={styles.meta}
                    >
                      {meta}
                    </Text>
                    <Text variant="bodyBold">{title}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text variant="machine">
                      {`+${formatMoney(rewardForTask(task))}`}
                    </Text>
                    <PixelIcon name="coin" size={12} tone="coin" />
                  </View>
                </ChamferCard>
              )}
            </Pressable>
          );
        })}

        <Text variant="smallBold" style={styles.section}>
          {t('watcher.terminal.trials.minigames')}
        </Text>
        <TerminalMenu>
          <TerminalMenuRow
            icon="coin"
            label={t('watcher.terminal.trials.minigamesOpen')}
            onPress={onArcade}
          />
        </TerminalMenu>
      </ScrollView>
    </TerminalShell>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  copy: { flex: 1, gap: 2, minWidth: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.two },
  meta: { fontSize: 12, letterSpacing: 1, lineHeight: 16 },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.two },
  section: { marginTop: SPACING.one },
  stack: { gap: SPACING.two, paddingBottom: SPACING.two },
});

export type { TrialsPageProps };
