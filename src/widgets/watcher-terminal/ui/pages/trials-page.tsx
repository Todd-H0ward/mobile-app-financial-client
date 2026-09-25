import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { listTasks, rewardForTask } from '@/entities/task';
import {
  selectTask,
  type UserSave,
  useCommitUser,
  useUser,
  useUserStore,
} from '@/entities/user';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { formatMoney } from '@/shared/utils';

import { TerminalMenuRow, TerminalRule, TerminalText } from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TrialsPageProps {
  onBack: () => void;
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

export const TrialsPage = ({ onBack }: TrialsPageProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const commitUser = useCommitUser();
  const canPlay = user?.period.phase === 'active';

  const openTask = (taskId: string) => {
    const current = useUserStore.getState().user;
    if (!isSamePeriod(current, user)) return;
    if (current.period.phase === 'planning') {
      router.push(STATIC_ROUTES.HOME);
      return;
    }
    if (current.period.phase !== 'active') return;
    const result = selectTask(current, taskId);
    if (result.ok) commitUser(current, result.user);
    router.push(DYNAMIC_ROUTES.task(taskId));
  };

  return (
    <ScrollView contentContainerStyle={styles.stack}>
      {!canPlay ? (
        <TerminalText isDim>
          {t('watcher.terminal.trials.planFirst')}
        </TerminalText>
      ) : (
        <TerminalText>{t('watcher.terminal.trials.pick')}</TerminalText>
      )}
      <TerminalRule />
      {listTasks().map((task) => {
        const isDone =
          user?.tasks.completedThisPeriod.includes(task.id) ?? false;
        const isActive = user?.tasks.activeTaskId === task.id;
        const title = t(`tasks.items.${task.id}.title`, {
          defaultValue: task.title,
        });
        const suffix = isDone
          ? t('tasks.done')
          : `+${formatMoney(rewardForTask(task))}`;
        const mark = isActive ? '* ' : '';
        return (
          <TerminalMenuRow
            key={task.id}
            label={`${mark}${title} · ${suffix}`}
            onPress={() => {
              if (!canPlay || isDone) return;
              openTask(task.id);
            }}
          />
        );
      })}
      <TerminalRule />
      <TerminalMenuRow label={t('watcher.terminal.back')} onPress={onBack} />
    </ScrollView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: SPACING.two },
});
