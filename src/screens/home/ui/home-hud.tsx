import { Pressable, StyleSheet, View } from 'react-native';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  CoinBadge,
  PawIcon,
  PiggyIcon,
  ProgressBar,
  TasksIcon,
  Text,
} from '@/shared/ui';

import type { HomeHudCredit, HomeHudGoal, MoodTone } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HomeHudStatsProps {
  balance: number;
  savingsTotal: number;
  onOpenSavings?: () => void;
}

interface HomeHudLastCreditProps {
  /** Hidden while the wallet has no history at all. */
  credit: HomeHudCredit | null;
}

interface HomeHudMoodProps {
  label: string;
  tone: MoodTone;
}

interface HomeHudBoardProps {
  goal: HomeHudGoal | null;
  taskTitle: string;
  taskHint: string;
  onOpenSavings?: () => void;
  onOpenTasks?: () => void;
}

interface HomeHudPlanBannerProps {
  onPress: () => void;
}

interface HomeHudEndBannerProps {
  /** `disabled` | `ready` | `warn` — three HUD states from 0.3-R. */
  status: 'disabled' | 'ready' | 'warn';
  onPress: () => void;
  /**
   * When the day cannot end yet (no live plan), a tap should open the plan
   * screen instead of doing nothing — opacity alone does not teach why.
   */
  onDisabledPress?: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const HomeHudStats = ({
  balance,
  savingsTotal,
  onOpenSavings,
}: HomeHudStatsProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.stats}>
      <CoinBadge amount={balance} label={t('home.balance')} coinSize={18} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.savings')}
        disabled={!onOpenSavings}
        onPress={onOpenSavings}
      >
        <CoinBadge
          amount={savingsTotal}
          label={t('home.savings')}
          coinSize={18}
        />
      </Pressable>
    </View>
  );
};

/**
 * The most recent credit, named — 2.5.4: a coin is never shown alone.
 *
 * "+50 стартовый кошелёк" rather than a bare "+50" — the same pairing the
 * settlement report and the history screen will read off `WalletEntry` later.
 */
export const HomeHudLastCredit = ({ credit }: HomeHudLastCreditProps) => {
  if (!credit) return null;

  return (
    <CoinBadge
      amount={credit.amount}
      variant="delta"
      label={credit.reasonLabel}
    />
  );
};

/**
 * The pet's state, under the pet: an icon and a line, never a colour alone.
 *
 * `tone` only ever picks between the muted reading colour and `warning` —
 * amber, not the red docs/accessibility.md rules out for a low meter — so a
 * pet that is bored or uncomfortable draws the eye without alarming anyone.
 */
export const HomeHudMood = ({ label, tone }: HomeHudMoodProps) => {
  const theme = useTheme();
  const isAttention = tone === 'attention';

  return (
    <View
      style={[
        styles.mood,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <PawIcon size={16} color={isAttention ? theme.warning : undefined} />
      <Text
        variant="small"
        themeColor={isAttention ? 'warningStrong' : 'textSecondary'}
      >
        {label}
      </Text>
    </View>
  );
};

/**
 * The goal and the task, along the bottom of the room.
 *
 * Two lines rather than two cards: 2.5.3 wants both visible at the same time
 * as the pet, and a card stack tall enough to read would bury the scene the
 * child is standing in.
 */
export const HomeHudBoard = ({
  goal,
  taskTitle,
  taskHint,
  onOpenSavings,
  onOpenTasks,
}: HomeHudBoardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.board,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={goal ? goal.title : t('home.goal.none')}
        disabled={!onOpenSavings}
        onPress={onOpenSavings}
        style={styles.boardRow}
      >
        <PiggyIcon size={20} color={theme.textSecondary} />

        <View style={styles.boardText}>
          <Text variant="smallBold" numberOfLines={1}>
            {goal ? goal.title : t('home.goal.none')}
          </Text>

          {goal ? (
            <ProgressBar
              value={goal.progress}
              height={6}
              accessibilityLabel={t('home.goal.progressA11y', {
                percent: Math.round(goal.progress * 100),
              })}
            />
          ) : (
            <Text variant="small" themeColor="textMuted" numberOfLines={1}>
              {t('home.goal.noneHint')}
            </Text>
          )}
        </View>

        {goal && (
          <Text variant="small" themeColor="textMuted">
            {goal.progressLabel}
          </Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={taskTitle}
        disabled={!onOpenTasks}
        onPress={onOpenTasks}
        style={styles.boardRow}
      >
        <TasksIcon size={20} color={theme.textSecondary} />

        <View style={styles.boardText}>
          <Text variant="smallBold" numberOfLines={1}>
            {taskTitle}
          </Text>
          <Text variant="small" themeColor="textMuted" numberOfLines={1}>
            {taskHint}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

/**
 * Opens the budget plan while the period is still in `planning`.
 *
 * Spending waits on a confirmed plan — the banner is the door into that step,
 * and it disappears the moment `startPeriod` runs.
 */
export const HomeHudPlanBanner = ({ onPress }: HomeHudPlanBannerProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.planBannerAction')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.planBanner,
        {
          backgroundColor: theme.primarySoft,
          borderColor: theme.primary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.planBannerText}>
        <Text variant="bodyBold" themeColor="primaryStrong">
          {t('home.planBannerTitle')}
        </Text>
        <Text variant="small" themeColor="textSecondary">
          {t('home.planBannerBody')}
        </Text>
      </View>
      <Text variant="smallBold" themeColor="primary">
        {t('home.planBannerAction')}
      </Text>
    </Pressable>
  );
};

/**
 * Opens the End day confirm screen (0.3-R / 2.5.5).
 *
 * Three states: unavailable without a live plan, ready when needs are covered,
 * warn when they are not — soft amber, never a red alarm or a hard block.
 * Disabled still explains why and can send the child to make a plan.
 */
export const HomeHudEndBanner = ({
  status,
  onPress,
  onDisabledPress,
}: HomeHudEndBannerProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const isDisabled = status === 'disabled';
  const isWarn = status === 'warn';
  const titleKey = isDisabled
    ? 'home.endBannerDisabledTitle'
    : isWarn
      ? 'home.endBannerWarnTitle'
      : 'home.endBannerTitle';
  const bodyKey = isDisabled
    ? 'home.endBannerDisabledBody'
    : isWarn
      ? 'home.endBannerWarnBody'
      : 'home.endBannerBody';
  const actionKey = isDisabled
    ? 'home.endBannerDisabledAction'
    : 'home.endBannerAction';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(actionKey)}
      accessibilityState={{ disabled: false }}
      onPress={isDisabled ? onDisabledPress : onPress}
      style={({ pressed }) => [
        styles.planBanner,
        {
          backgroundColor: isDisabled
            ? theme.surface
            : isWarn
              ? theme.warningSoft
              : theme.accentSoft,
          borderColor: isDisabled
            ? theme.border
            : isWarn
              ? theme.warning
              : theme.accent,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.planBannerText}>
        <Text
          variant="bodyBold"
          themeColor={
            isDisabled ? 'textMuted' : isWarn ? 'warningStrong' : 'accentStrong'
          }
        >
          {t(titleKey)}
        </Text>
        <Text variant="body" themeColor="textSecondary">
          {t(bodyKey)}
        </Text>
      </View>
      <Text
        variant="smallBold"
        themeColor={isDisabled ? 'primary' : isWarn ? 'warning' : 'accent'}
      >
        {t(actionKey)}
      </Text>
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  board: {
    borderRadius: RADII.l,
    borderWidth: 1,
    gap: SPACING.two,
    padding: SPACING.two,
  },
  boardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  boardText: {
    flex: 1,
    gap: 3,
  },
  mood: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.half,
    paddingHorizontal: SPACING.two,
    paddingVertical: 3,
  },
  planBanner: {
    alignItems: 'center',
    borderRadius: RADII.l,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: SPACING.two,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.two,
  },
  planBannerText: {
    flex: 1,
    gap: SPACING.half,
  },
  stats: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.one,
  },
});

export type {
  HomeHudBoardProps,
  HomeHudEndBannerProps,
  HomeHudLastCreditProps,
  HomeHudMoodProps,
  HomeHudPlanBannerProps,
  HomeHudStatsProps,
};
