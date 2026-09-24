import { useMemo } from 'react';

import { WALLET_SOURCES } from '@/entities/economy';
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
  /** Build stage — what the scene will dress the dog in. */
  stage: RobotDogStage;
  /** What a screen reader says — name, mood and why (2.5.10). */
  accessibilityLabel: string;
  /** The mood itself, for anything that reacts rather than reads it out. */
  moodName: RobotDogMoodName;
  /** The mood, already translated — "скучает". */
  moodLabel: string;
  /** Why, already translated — "нечего делать". Never empty. */
  moodReasonLabel: string;
  moodTone: MoodTone;
}

/** The goal shown on the home screen — `null` when none is chosen. */
interface HomeHudGoal {
  title: string;
  /** "32 из 120", ready for the caption under the bar. */
  progressLabel: string;
  /** 0…1, clamped — feeds the bar directly. */
  progress: number;
}

/** The most recent credit — `null` for a wallet with no history at all. */
interface HomeHudCredit {
  /** Coins credited. Fed straight to `CoinBadge`, which adds its own "+". */
  amount: number;
  /** Why, already translated — "стартовый кошелёк", never a bare number. */
  reasonLabel: string;
}

interface HomeHud {
  /** The robot's mood and stage. Always there — the dog stands in the pit. */
  robot: HomeHudRobot | null;
  /** User switch + system Reduce Motion. */
  isAnimationEnabled: boolean;
  balance: number;
  /** Coins across every goal, not only the active one. */
  savingsTotal: number;
  goal: HomeHudGoal | null;
  /** The coins that landed most recently — 2.5.4's "источник и сумма", shown. */
  lastCredit: HomeHudCredit | null;
  /** Active chore title on the board — catalogue name once issued. */
  taskTitle: string;
  /** Active chore brief, or an all-done / soon line. */
  taskHint: string;
  /**
   * True while the period is still in `planning` — the banner that opens the
   * budget screen. Hidden once the plan is confirmed.
   */
  isPlanning: boolean;
  /**
   * True while the period is `active` — the banner that opens the summary.
   * Hidden in every other phase.
   */
  isActive: boolean;
  /**
   * True while the period is `summary` — home must redirect to the summary
   * screen; the child cannot walk the rooms until they have seen the totals.
   */
  isSummary: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Which tone a mood reads in.
 *
 * Two tones, never a third: docs/accessibility.md bans an alarming red for a
 * low meter, so "attention" still has to read as warm, not as a warning.
 */
const MOOD_TONE: Record<RobotDogMoodName, MoodTone> = {
  proud: 'calm',
  content: 'calm',
  bored: 'attention',
  tired: 'attention',
  sad: 'attention',
};

/**
 * The i18n key for each source `WALLET_SOURCES` currently names.
 *
 * `task:<id>` and `purchase:<id>` sources carry their own title from content
 * once the engine and the catalogue exist, so they never belong in a static
 * table like this one — only the rule-shaped sources do.
 */
const CREDIT_REASON_KEY: Record<string, string> = {
  [WALLET_SOURCES.startingWallet]: 'wallet.source.startingWallet',
  [WALLET_SOURCES.regularityBonus]: 'wallet.source.regularityBonus',
  [WALLET_SOURCES.gamePuzzle]: 'wallet.source.gamePuzzle',
  [WALLET_SOURCES.gameSpacewar]: 'wallet.source.gameSpacewar',
  [WALLET_SOURCES.gameSnake]: 'wallet.source.gameSnake',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** The robot card: mood with its cause, and the build stage. */
const buildRobot = (robot: RobotSave, t: Translate): HomeHudRobot => {
  const mood = moodFor(robot.charge, robot.spirit);
  const moodLabel = t(`robot.mood.${mood.name}`);
  const moodReasonLabel = t(`robot.reason.${mood.reason}`);
  const name = robot.name || t('robot.unnamed');

  return {
    moodName: mood.name,
    stage: robot.stage,
    accessibilityLabel: `${name}, ${moodLabel}, ${moodReasonLabel}`,
    moodLabel,
    moodReasonLabel,
    moodTone: MOOD_TONE[mood.name],
  };
};

/** The active goal's content and what has been put away for it so far. */
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

/** The goal card, from a goal that is actually chosen and in the catalogue. */
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

/**
 * The last coin the child was given, named — "стартовый кошелёк", never a
 * bare "+50". `entry.source` outside the static table still resolves: it
 * falls back to a generic line rather than showing nothing.
 */
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

/** Active chore line for the HUD — title and brief, or an all-done / soon line. */
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

/** Active chore title for the board row. */
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

/**
 * The home screen's state, as one object.
 *
 * One shallow save slice, memoized — balance ticks do not rebuild the
 * robot's mood when its fields did not change. Requirement 2.5.3 asks for the
 * character, the balance, the savings, the active goal, the character's state
 * and the active task all on screen together; this is where "together" is
 * assembled.
 */
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
        goal: null,
        lastCredit: null,
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
      goal: activeGoal
        ? buildGoal(activeGoal.content, activeGoal.saved, t)
        : null,
      lastCredit: source.lastEarn ? buildLastCredit(source.lastEarn, t) : null,
      taskTitle: buildTaskTitle(source.tasks, t),
      taskHint: buildTaskHint(source.tasks, t),
      isPlanning: source.phase === 'planning',
      isActive: source.phase === 'active',
      isSummary: source.phase === 'summary',
    };
  }, [source, t, isMotionEnabled]);
};

export type { HomeHud, HomeHudCredit, HomeHudGoal, HomeHudRobot, MoodTone };
