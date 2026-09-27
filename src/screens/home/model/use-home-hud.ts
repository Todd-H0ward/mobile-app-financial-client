import { useMemo } from 'react';

import { PLATFORM_GOAL_ID, WALLET_SOURCES } from '@/entities/economy';
import { type GoalContent, getGoalById } from '@/entities/goal';
import {
  moodFor,
  type RobotDogMoodName,
  type RobotDogStage,
} from '@/entities/robot-dog';
import { progressFor } from '@/entities/savings';
import { getTaskById } from '@/entities/task';
import {
  type RobotSave,
  rewardForUserTask,
  type UserSave,
  useHomeHudSource,
  useIsMotionEnabled,
  type WalletEntry,
} from '@/entities/user';

import { useTranslation } from '@/shared/i18n';
import { formatMoney } from '@/shared/utils';

type Translate = ReturnType<typeof useTranslation>['t'];

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Whether the state row reaches for a warm color or a calm one. Never red. */
type MoodTone = 'calm' | 'attention';

interface HomeHudRobot {
  name: string;
  stage: RobotDogStage;
  /** What a screen reader says — name, mood and why (2.5.10). */
  accessibilityLabel: string;
  /** The mood itself, for anything that reacts rather than reads it out. */
  moodName: RobotDogMoodName;
  moodLabel: string;
  /** Why, already translated — "нечего делать". Never empty. */
  moodReasonLabel: string;
  moodTone: MoodTone;
}

interface HomeHudGoal {
  title: string;
  progressLabel: string;
  /** 0…1, clamped — feeds the bar directly. */
  progress: number;
}

interface HomeHudCredit {
  amount: number;
  /** Why, already translated — "стартовый кошелёк", never a bare number. */
  reasonLabel: string;
}

interface HomeHudTrial {
  id: string;
  title: string;
  meta: string;
}

interface HomeHud {
  robot: HomeHudRobot | null;
  /** User switch + system Reduce Motion. */
  isAnimationEnabled: boolean;
  balance: number;
  /** Coins across every goal, not only the active one. */
  savingsTotal: number;
  /** Coins still needed in the lift jar; never below zero. */
  liftRemaining: number;
  goal: HomeHudGoal | null;
  /** The coins that landed most recently — 2.5.4's "источник и сумма", shown. */
  lastCredit: HomeHudCredit | null;
  /** 1-based period number, for the planning card's machine line. */
  periodIndex: number;
  /** Picked and not yet finished; `null` hides the card. */
  activeTrial: HomeHudTrial | null;
  taskTitle: string;
  taskHint: string;
  isPlanning: boolean;
  isActive: boolean;
  isSummary: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Two tones only — docs/accessibility.md bans alarming red for a low meter. */
const MOOD_TONE: Record<RobotDogMoodName, MoodTone> = {
  proud: 'calm',
  content: 'calm',
  bored: 'attention',
  tired: 'attention',
  sad: 'attention',
};

/** Rule-shaped sources only — `task:` / `purchase:` resolve from content. */
const CREDIT_REASON_KEY: Record<string, string> = {
  [WALLET_SOURCES.startingWallet]: 'wallet.source.startingWallet',
  [WALLET_SOURCES.regularityBonus]: 'wallet.source.regularityBonus',
  [WALLET_SOURCES.gamePuzzle]: 'wallet.source.gamePuzzle',
  [WALLET_SOURCES.gameSpacewar]: 'wallet.source.gameSpacewar',
  [WALLET_SOURCES.gameSnake]: 'wallet.source.gameSnake',
  'game:market': 'financeGame.market',
  'game:weekly': 'financeGame.weekly',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const buildRobot = (robot: RobotSave, t: Translate): HomeHudRobot => {
  const mood = moodFor(robot.charge, robot.spirit);
  const moodLabel = t(`robot.mood.${mood.name}`);
  const moodReasonLabel = t(`robot.reason.${mood.reason}`);
  const name = robot.name || t('robot.unnamed');

  return {
    name,
    moodName: mood.name,
    stage: robot.stage,
    accessibilityLabel: `${name}, ${moodLabel}, ${moodReasonLabel}`,
    moodLabel,
    moodReasonLabel,
    moodTone: MOOD_TONE[mood.name],
  };
};

const findActiveGoal = (
  savings: UserSave['savings'],
): { content: GoalContent; saved: number } | null => {
  const content = savings.activeGoalId
    ? getGoalById(savings.activeGoalId)
    : undefined;
  const saved = savings.goals.find(
    (entry) => entry.goalId === savings.activeGoalId,
  )?.saved;

  return content && saved !== undefined ? { content, saved } : null;
};

const buildGoal = (
  content: GoalContent,
  saved: number,
  t: Translate,
): HomeHudGoal => ({
  title: t(`savings.goals.${content.id}.title`, {
    defaultValue: content.title,
  }),
  progressLabel: t('home.goal.progress', {
    saved: formatMoney(saved),
    price: formatMoney(content.price),
  }),
  progress: progressFor(saved, content.price),
});

/** The last coin the child was given, named — "стартовый кошелёк", never a bare "+50" */
const buildLastCredit = (entry: WalletEntry, t: Translate): HomeHudCredit => {
  if (entry.source.startsWith('task:')) {
    const task = getTaskById(entry.source.slice('task:'.length));
    return {
      amount: entry.amount,
      reasonLabel: task
        ? t('wallet.source.task', {
            title: t(`tasks.items.${task.id}.title`, {
              defaultValue: task.title,
            }),
          })
        : t('wallet.source.unknown'),
    };
  }

  return {
    amount: entry.amount,
    reasonLabel: t(CREDIT_REASON_KEY[entry.source] ?? 'wallet.source.unknown'),
  };
};

const buildTaskHint = (tasks: UserSave['tasks'], t: Translate): string => {
  if (tasks.activeTaskId) {
    const task = getTaskById(tasks.activeTaskId);
    if (task) {
      return t(`tasks.items.${task.id}.brief`, { defaultValue: task.brief });
    }
  }

  if (tasks.completedThisPeriod.length > 0) {
    return t('home.task.allDone');
  }

  return t('home.task.comingSoon');
};

const buildActiveTrial = (
  tasks: UserSave['tasks'],
  modules: UserSave['modules'],
  t: Translate,
): HomeHudTrial | null => {
  const id = tasks.activeTaskId;
  if (!id || tasks.completedThisPeriod.includes(id)) return null;
  const task = getTaskById(id);
  if (!task) return null;

  return {
    id,
    title: t(`tasks.items.${task.id}.title`, { defaultValue: task.title }),
    meta: t('home.hud.trialMeta', {
      theme: t(`tasks.themes.${task.theme}`),
      count: rewardForUserTask({ modules }, task),
    }),
  };
};

const buildTaskTitle = (tasks: UserSave['tasks'], t: Translate): string => {
  if (tasks.activeTaskId) {
    const task = getTaskById(tasks.activeTaskId);
    if (task) {
      return t(`tasks.items.${task.id}.title`, { defaultValue: task.title });
    }
  }

  return t('home.task.title');
};

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Memoized shallow slice — balance ticks must not rebuild unchanged mood. */
export const useHomeHud = (): HomeHud => {
  const { t } = useTranslation();
  const source = useHomeHudSource();
  const isMotionEnabled = useIsMotionEnabled();

  return useMemo(() => {
    if (!source) {
      return {
        robot: null,
        isAnimationEnabled: isMotionEnabled,
        balance: 0,
        savingsTotal: 0,
        liftRemaining: getGoalById(PLATFORM_GOAL_ID)?.price ?? 0,
        goal: null,
        lastCredit: null,
        periodIndex: 1,
        activeTrial: null,
        taskTitle: t('home.task.title'),
        taskHint: t('home.task.comingSoon'),
        isPlanning: false,
        isActive: false,
        isSummary: false,
      };
    }

    const activeGoal = findActiveGoal(source.savings);

    return {
      robot: buildRobot(source.robot, t),
      isAnimationEnabled: isMotionEnabled,
      balance: source.balance,
      savingsTotal: source.savings.goals.reduce(
        (total: number, entry: { saved: number }) => total + entry.saved,
        0,
      ),
      liftRemaining: Math.max(
        0,
        (getGoalById(PLATFORM_GOAL_ID)?.price ?? 0) -
          (source.savings.goals.find((goal) => goal.goalId === PLATFORM_GOAL_ID)
            ?.saved ?? 0),
      ),
      goal: activeGoal
        ? buildGoal(activeGoal.content, activeGoal.saved, t)
        : null,
      lastCredit: source.lastEarn ? buildLastCredit(source.lastEarn, t) : null,
      periodIndex: source.periodIndex,
      activeTrial:
        source.phase === 'active'
          ? buildActiveTrial(source.tasks, source.modules, t)
          : null,
      taskTitle: buildTaskTitle(source.tasks, t),
      taskHint: buildTaskHint(source.tasks, t),
      isPlanning: source.phase === 'planning',
      isActive: source.phase === 'active',
      isSummary: source.phase === 'summary',
    };
  }, [source, t, isMotionEnabled]);
};

export type {
  HomeHud,
  HomeHudCredit,
  HomeHudGoal,
  HomeHudRobot,
  HomeHudTrial,
  MoodTone,
};
