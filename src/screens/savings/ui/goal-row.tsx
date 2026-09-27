import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { ListRow, PixelIcon, ProgressBar, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import type { SavingsGoalRow } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GoalRowProps {
  goal: SavingsGoalRow;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const GoalRow = ({ goal, onPress }: GoalRowProps) => {
  const { t } = useTranslation();

  const title = t(`savings.goals.${goal.id}.title`, {
    defaultValue: goal.title,
  });

  const subtitle = goal.isReached
    ? t('savings.reached')
    : t('savings.remaining', { count: formatMoney(goal.remaining) });

  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      isSelected={goal.isActive}
      isDone={goal.isReached}
      onPress={onPress}
      icon={
        <ListRow.Icon tone={goal.isActive ? 'primarySoft' : 'surfaceSoft'}>
          <PixelIcon name="piggy" size={24} />
        </ListRow.Icon>
      }
      trailing={
        <View style={styles.trailing}>
          <Text variant="smallBold">{formatMoney(goal.price)}</Text>
          <ProgressBar value={goal.progress} height={6} />
          <Text variant="small" themeColor="textMuted">
            {goal.progressLabel}
          </Text>
        </View>
      }
    />
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  trailing: {
    alignItems: 'flex-end',
    gap: SPACING.ONE,
    minWidth: 72,
  },
});

export type { GoalRowProps };
