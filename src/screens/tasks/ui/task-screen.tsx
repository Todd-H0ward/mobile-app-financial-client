import { useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import {
  type BasketPayload,
  type ChangePayload,
  type DialogPayload,
  listTasks,
  type PriorityPayload,
  type QuizPayload,
  scoreBasket,
  scoreChange,
  scoreDialog,
  scorePriority,
  scoreQuiz,
} from '@/entities/task';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  ChamferCard,
  PixelIcon,
  Screen,
  Sheet,
  Text,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useTaskPlay } from '../model';

import {
  BasketMechanic,
  ChangeMechanic,
  DialogMechanic,
  PriorityMechanic,
  QuizMechanic,
} from './mechanics';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TaskScreenProps {
  taskId: string;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const moveId = (
  ids: readonly string[],
  itemId: string,
  delta: -1 | 1,
): string[] => {
  const index = ids.indexOf(itemId);
  if (index < 0) return [...ids];
  const next = index + delta;
  if (next < 0 || next >= ids.length) return [...ids];
  const copy = [...ids];
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const TaskScreen = ({ taskId }: TaskScreenProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const play = useTaskPlay(taskId);

  const [optionId, setOptionId] = useState<string | null>(null);
  const [basketIds, setBasketIds] = useState<string[]>([]);
  const [orderIds, setOrderIds] = useState<string[] | null>(null);
  const [choiceId, setChoiceId] = useState<string | null>(null);

  if (!play) {
    return <Redirect href={DYNAMIC_ROUTES.watcher('overseer', 'trials')} />;
  }

  const { task } = play;
  const taskIndex = listTasks().findIndex((row) => row.id === task.id) + 1;
  const title = t(`tasks.items.${task.id}.title`, { defaultValue: task.title });
  const brief = t(`tasks.items.${task.id}.brief`, { defaultValue: task.brief });

  const priorityOrder =
    orderIds ??
    (task.mechanic === 'priority'
      ? (task.payload as PriorityPayload).items.map((item) => item.id)
      : []);

  const canSubmit = (() => {
    if (!play.canPlay) return false;
    switch (task.mechanic) {
      case 'quiz':
      case 'change':
        return optionId != null;
      case 'basket':
        return basketIds.length > 0;
      case 'priority':
        return priorityOrder.length > 0;
      case 'dialog':
        return choiceId != null;
      default:
        return false;
    }
  })();

  const submit = () => {
    if (!canSubmit) return;

    let didComplete = false;

    if (task.mechanic === 'quiz' && optionId != null) {
      const score = scoreQuiz(task.payload as QuizPayload, optionId);
      didComplete = play.complete(score.rewardShare, score.isCorrect);
    } else if (task.mechanic === 'change' && optionId != null) {
      const score = scoreChange(task.payload as ChangePayload, optionId);
      didComplete = play.complete(score.rewardShare, score.isCorrect);
    } else if (task.mechanic === 'basket') {
      const score = scoreBasket(task.payload as BasketPayload, basketIds);
      didComplete = play.complete(score.rewardShare, score.isCorrect);
    } else if (task.mechanic === 'priority') {
      const score = scorePriority(
        task.payload as PriorityPayload,
        priorityOrder,
      );
      didComplete = play.complete(score.rewardShare, score.isCorrect);
    } else if (task.mechanic === 'dialog') {
      const score = scoreDialog();
      didComplete = play.complete(score.rewardShare, score.isCorrect);
    }

    if (didComplete) {
      if (router.canGoBack()) router.back();
      else router.dismissTo(STATIC_ROUTES.HOME);
    }
  };

  return (
    <Screen presentation="sheet" gap={SPACING.THREE} terminalVariant="overseer">
      <Screen.Header>
        <Screen.Heading>
          <Text
            variant="machine"
            themeColor="overseerLcd"
            style={styles.overseerLabel}
          >
            {`// ${t('tasks.trialLabel', {
              index: taskIndex,
              theme: t(`tasks.filters.${task.theme}`),
            }).toLocaleUpperCase()}`}
          </Text>
        </Screen.Heading>
        <HintButton screen="tasks" />
        <Button
          variant="icon"
          accessibilityLabel={t('common.close')}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.dismissTo(STATIC_ROUTES.HOME);
          }}
        >
          <PixelIcon name="close" />
        </Button>
      </Screen.Header>

      <ChamferCard
        variant="topRight"
        fillTone="overseerSurface"
        style={styles.brief}
      >
        <Text variant="title" style={styles.briefTitle}>
          {title}
        </Text>
        <Text>{brief}</Text>
      </ChamferCard>

      {!play.canPlay && (
        <Text themeColor="textSecondary">
          {play.isDone ? t('tasks.alreadyDone') : t('tasks.planFirstBanner')}
        </Text>
      )}

      {task.mechanic === 'quiz' && (
        <QuizMechanic
          payload={task.payload as QuizPayload}
          selectedId={optionId}
          onSelect={setOptionId}
        />
      )}

      {task.mechanic === 'change' && (
        <ChangeMechanic
          payload={task.payload as ChangePayload}
          selectedId={optionId}
          onSelect={setOptionId}
        />
      )}

      {task.mechanic === 'basket' && (
        <BasketMechanic
          payload={task.payload as BasketPayload}
          selectedIds={basketIds}
          onToggle={(id) => {
            setBasketIds((current) =>
              current.includes(id)
                ? current.filter((row) => row !== id)
                : [...current, id],
            );
          }}
        />
      )}

      {task.mechanic === 'priority' && (
        <PriorityMechanic
          payload={task.payload as PriorityPayload}
          orderedIds={priorityOrder}
          onMoveUp={(id) => setOrderIds(moveId(priorityOrder, id, -1))}
          onMoveDown={(id) => setOrderIds(moveId(priorityOrder, id, 1))}
        />
      )}

      {task.mechanic === 'dialog' && (
        <DialogMechanic
          payload={task.payload as DialogPayload}
          selectedId={choiceId}
          onSelect={setChoiceId}
        />
      )}

      <View style={styles.reward}>
        <Text variant="small" themeColor="textSecondary">
          {t('tasks.reward')}
        </Text>
        <View style={styles.rewardValue}>
          <Text variant="machine">
            {t('tasks.rewardUpTo', { count: formatMoney(play.reward) })}
          </Text>
          <PixelIcon name="coin" tone="coin" />
        </View>
      </View>

      <Button
        variant="primary"
        size="l"
        isFullWidth
        disabled={!canSubmit}
        onPress={submit}
      >
        {t('tasks.submit')}
      </Button>

      <Sheet.Modal
        isVisible={play.sheet === 'planning'}
        onClose={play.dismissSheet}
      >
        <Sheet.Title>{t('tasks.planFirstTitle')}</Sheet.Title>
        <Sheet.Description>{t('tasks.planFirstBody')}</Sheet.Description>
        <Sheet.Actions>
          <Button variant="ghost" isFullWidth onPress={play.dismissSheet}>
            {t('tasks.cancel')}
          </Button>
          <Button
            variant="primary"
            isFullWidth
            onPress={() => {
              play.dismissSheet();
              router.dismissTo(DYNAMIC_ROUTES.watcher('keeper', 'plan'));
            }}
          >
            {t('tasks.goPlan')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </Screen>
  );
};

export const TaskRouteScreen = ({ taskId }: { taskId: string }) => {
  if (!taskId) {
    return <Redirect href={DYNAMIC_ROUTES.watcher('overseer', 'trials')} />;
  }

  return <TaskScreen taskId={taskId} />;
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  brief: { gap: SPACING.ONE, paddingHorizontal: 14, paddingVertical: 14 },
  briefTitle: { fontSize: 20, lineHeight: 25 },
  overseerLabel: { letterSpacing: 1 },
  reward: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardValue: { alignItems: 'center', flexDirection: 'row', gap: 6 },
});

export type { TaskScreenProps };
