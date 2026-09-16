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
import { type PetSave, type UserSave, useUserStore } from '@/entities/user';

import { useTranslation } from '@/shared/i18n';
import { clamp, formatMoney } from '@/shared/utils';

/** The translator, exactly as `useTranslation()` hands it out. */
type Translate = ReturnType<typeof useTranslation>['t'];

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Whether the state row reaches for a warm color or a calm one. Never red. */
type MoodTone = 'calm' | 'attention';

/** Everything the pet card needs — `null` while the box is still closed. */
interface HomeHudPet {
  appearance: PetAppearance;
  emotion: EmotionKey;
  stage: PetStage;
  /** What a screen reader says. Built from the name and the mood. */
  accessibilityLabel: string;
  /** The mood, already translated — "доволен собой". */
  moodLabel: string;
  /** Which tone the state row reads in. */
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

/** Everything the home screen's HUD lays out, computed from one save read. */
interface HomeHud {
  /** Header subtitle: the pet's name once met, an onboarding line before. */
  subtitle: string;
  /** `null` while the box on the room screen is still closed. */
  pet: HomeHudPet | null;
  /** The grown-up's switch — the pet card passes it straight to the rig. */
  isAnimationEnabled: boolean;
  /** Coins on hand, ready for `CoinBadge`. */
  balance: number;
  /** Coins across every goal, not only the active one. */
  savingsTotal: number;
  goal: HomeHudGoal | null;
  /** The task slot's placeholder line — the engine is a later wave. */
  taskHint: string;
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
  title: content.title,
  progressLabel: t('home.goal.progress', {
    saved: formatMoney(saved),
    price: formatMoney(content.price),
  }),
  progress: content.price > 0 ? clamp(saved / content.price, 0, 1) : 0,
});

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * The home screen's state, as one object.
 *
 * One save read, one place that decides what the numbers mean — the screen
 * only lays the result out. Requirement 2.5.3 asks for the pet, the balance,
 * the savings, the active goal, the pet's state and the active task all on
 * screen together; this is where "together" is assembled.
 */
export const useHomeHud = (): HomeHud => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);

  const activeGoal = user ? findActiveGoal(user.savings) : null;

  return {
    subtitle:
      user && isPetMet(user.pet)
        ? t('home.atHome', { name: user.pet.name })
        : t('home.roomComingSoon'),
    pet: user && isPetMet(user.pet) ? buildPet(user.pet, t) : null,
    isAnimationEnabled: user?.settings.isAnimationEnabled ?? true,
    balance: user?.wallet.balance ?? 0,
    savingsTotal:
      user?.savings.goals.reduce((total, entry) => total + entry.saved, 0) ?? 0,
    goal: activeGoal
      ? buildGoal(activeGoal.content, activeGoal.saved, t)
      : null,
    taskHint: t('home.task.comingSoon'),
  };
};

export type { HomeHud, HomeHudGoal, HomeHudPet, MoodTone };
