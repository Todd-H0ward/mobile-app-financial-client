import { useMemo } from 'react';

import { WALLET_SOURCES } from '@/entities/economy';
import { type GoalContent, getGoalById } from '@/entities/goal';
import {
  appearanceFor,
  type EmotionKey,
  emotionFor,
  moodFor,
  type PetAppearance,
  type PetMoodName,
  type PetStage,
} from '@/entities/pet';
import { progressFor } from '@/entities/savings';
import { useIsMotionEnabled } from '@/entities/settings';
import { getTaskById } from '@/entities/task';
import {
  type PetSave,
  type UserSave,
  useHomeHudSource,
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

interface HomeHudPet {
  appearance: PetAppearance;
  emotion: EmotionKey;
  stage: PetStage;
  /** What a screen reader says. Built from the name and the mood. */
  accessibilityLabel: string;
  /** The mood, already translated — "доволен собой". */
  moodLabel: string;
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
  /** Header subtitle: the pet's name once met, an onboarding line before. */
  subtitle: string;
  /** `null` while the box on the room screen is still closed. */
  pet: HomeHudPet | null;
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
  /**
   * True once the pet's stage has outrun `celebratedStage` — home must
   * redirect to the growth ceremony before the child walks the rooms. A
   * demo run can raise the stage several periods before anyone was there to
   * see it happen; this is what still catches it.
   */
  isGrowthPending: boolean;
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
const MOOD_TONE: Record<PetMoodName, MoodTone> = {
  proud: 'calm',
  content: 'calm',
  bored: 'attention',
  uncomfortable: 'attention',
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
  [WALLET_SOURCES.heatingBill]: 'wallet.source.heatingBill',
  [WALLET_SOURCES.gamePuzzle]: 'wallet.source.gamePuzzle',
  [WALLET_SOURCES.gameSpacewar]: 'wallet.source.gameSpacewar',
  [WALLET_SOURCES.gameSnake]: 'wallet.source.gameSnake',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Whether the box on the room screen has been opened — the pet has a name. */
const isPetMet = (pet: PetSave): boolean => pet.name !== '';

/** The pet card, from a pet that has already been met. */
const buildPet = (pet: PetSave, t: Translate): HomeHudPet => {
  const mood = moodFor(pet.comfort, pet.spirit);
  const moodLabel = t(`pet.mood.${mood.name}`);

  return {
    appearance: appearanceFor(pet.species, pet.color, pet.pattern),
    emotion: emotionFor(mood),
    stage: pet.stage,
    accessibilityLabel: `${pet.name}, ${moodLabel}`,
    moodLabel,
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
 * One shallow save slice, memoized layout — balance ticks do not rebuild pet
 * appearance when the pet fields did not change. Requirement 2.5.3 asks for
 * the pet, the balance, the savings, the active goal, the pet's state and the
 * active task all on screen together; this is where "together" is assembled.
 */
export const useHomeHud = (): HomeHud => {
  const { t } = useTranslation();
  const source = useHomeHudSource();
  const isMotionEnabled = useIsMotionEnabled();

  return useMemo(() => {
    if (!source) {
      return {
        subtitle: t('home.roomComingSoon'),
        pet: null,
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
        isGrowthPending: false,
      };
    }

    const activeGoal = findActiveGoal(source.savings);

    return {
      subtitle: isPetMet(source.pet)
        ? t('home.atHome', { name: source.pet.name })
        : t('home.roomComingSoon'),
      pet: isPetMet(source.pet) ? buildPet(source.pet, t) : null,
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
      isGrowthPending: source.pet.stage !== source.pet.celebratedStage,
    };
  }, [source, t, isMotionEnabled]);
};

export type { HomeHud, HomeHudCredit, HomeHudGoal, HomeHudPet, MoodTone };
