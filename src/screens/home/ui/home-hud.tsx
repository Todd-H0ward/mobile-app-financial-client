import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Card,
  CoinBadge,
  PawIcon,
  PiggyIcon,
  ProgressBar,
  TasksIcon,
  Text,
} from '@/shared/ui';

import type { HomeHudGoal, MoodTone } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HomeHudProps {
  /** The mood row under the pet. Absent while the box is still closed. */
  moodLabel?: string;
  /** Which color the mood row reads in. Ignored when `moodLabel` is absent. */
  moodTone?: MoodTone;
  balance: number;
  savingsTotal: number;
  goal: HomeHudGoal | null;
  taskHint: string;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The pet's mood, under the box: an icon and a line, never a color alone.
 *
 * `moodTone` only ever picks between the muted reading color and `warning` —
 * amber, not the red docs/accessibility.md rules out for a low meter — so a
 * pet that is bored or uncomfortable draws the eye without alarming anyone.
 */
const HomeHudMood = ({ label, tone }: { label: string; tone: MoodTone }) => {
  const theme = useTheme();
  const color = tone === 'attention' ? theme.warning : undefined;

  return (
    <View style={styles.mood}>
      <PawIcon size={16} color={color} />
      <Text
        variant="small"
        themeColor={tone === 'attention' ? 'warningStrong' : 'textSecondary'}
      >
        {label}
      </Text>
    </View>
  );
};

/** Coins on hand and coins saved — the two stats requirement 2.5.3 asks for. */
const HomeHudStats = ({
  balance,
  savingsTotal,
}: {
  balance: number;
  savingsTotal: number;
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.stats}>
      <CoinBadge amount={balance} label={t('home.balance')} />
      <CoinBadge amount={savingsTotal} label={t('home.savings')} />
    </View>
  );
};

/** The active goal, with how far the jar has got. */
const HomeHudGoalCard = ({ goal }: { goal: HomeHudGoal | null }) => {
  const { t } = useTranslation();

  return (
    <Card tone="surfaceSoft">
      <View style={styles.goalHeading}>
        <PiggyIcon />
        <Card.Title>{goal ? goal.title : t('home.goal.none')}</Card.Title>
      </View>

      <Card.Content>
        {goal ? (
          <>
            <ProgressBar value={goal.progress} />
            <Text variant="small" themeColor="textMuted">
              {goal.progressLabel}
            </Text>
          </>
        ) : (
          <Text themeColor="textSecondary">{t('home.goal.noneHint')}</Text>
        )}
      </Card.Content>
    </Card>
  );
};

/** The task slot. Placeholder until the task engine lands — roadmap wave 1/14. */
const HomeHudTaskCard = ({ taskHint }: { taskHint: string }) => {
  const { t } = useTranslation();

  return (
    <Card tone="backgroundAlt">
      <View style={styles.goalHeading}>
        <TasksIcon />
        <Card.Title>{t('home.task.title')}</Card.Title>
      </View>

      <Card.Content>
        <Text themeColor="textSecondary">{taskHint}</Text>
      </Card.Content>
    </Card>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The home screen's HUD: state, balance, savings, goal and the task slot,
 * all visible at once — requirement 2.5.3. The pet itself is laid out by the
 * caller, since it needs its own centred stage; this only carries the row
 * under it.
 *
 * A single column, narrow enough to hold at 360dp: `HomeHudStats` wraps its
 * two badges rather than forcing them side by side, and every card below is
 * full width.
 */
export const HomeHud = ({
  moodLabel,
  moodTone = 'calm',
  balance,
  savingsTotal,
  goal,
  taskHint,
}: HomeHudProps) => (
  <View style={styles.root}>
    {moodLabel != null && <HomeHudMood label={moodLabel} tone={moodTone} />}

    <HomeHudStats balance={balance} savingsTotal={savingsTotal} />
    <HomeHudGoalCard goal={goal} />
    <HomeHudTaskCard taskHint={taskHint} />
  </View>
);

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    gap: SPACING.two,
  },
  goalHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.one,
  },
  mood: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: SPACING.half,
  },
  stats: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
    justifyContent: 'center',
  },
});

export type { HomeHudProps };
