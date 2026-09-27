import { StyleSheet, View } from 'react-native';

import { DIRECTION_LOOK } from '@/widgets/direction-look';

import type { BudgetDirection } from '@/entities/economy';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, PixelIcon, Slider, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface DirectionRowProps {
  direction: BudgetDirection;
  /** Coins in this direction right now. */
  value: number;
  /** Coins not assigned elsewhere — the slider's physical ceiling. */
  remainder: number;
  onChange: (value: number) => void;
  onAdd: () => void;
  onRemove: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** All three boxes use one phosphor; their icons carry the category. */
export const DirectionRow = ({
  direction,
  value,
  remainder,
  onChange,
  onAdd,
  onRemove,
}: DirectionRowProps) => {
  const { t } = useTranslation();
  const look = DIRECTION_LOOK[direction];
  const title = t(`budgetPlan.directions.${direction}.title`);

  return (
    <Card>
      <Card.Content style={styles.root}>
        <View style={styles.header}>
          <PixelIcon name={look.icon} size={24} />
          <View style={styles.headerText}>
            <Text variant="bodyBold">{title}</Text>
            <Text variant="small" themeColor="textSecondary">
              {t(`budgetPlan.directions.${direction}.example`)}
            </Text>
          </View>
        </View>
        <View style={styles.stepper}>
          <Text variant="title" themeColor="primary" style={styles.count}>
            {value}
          </Text>
          <Button
            variant="secondary"
            disabled={value === 0}
            accessibilityLabel={t('budgetPlan.stepperMinusA11y', {
              label: title,
            })}
            onPress={onRemove}
            style={styles.key}
          >
            −
          </Button>
          <Button
            variant="secondary"
            disabled={remainder === 0}
            accessibilityLabel={t('budgetPlan.stepperPlusA11y', {
              label: title,
            })}
            onPress={onAdd}
            style={styles.key}
          >
            +
          </Button>
        </View>
        <Slider
          value={value}
          min={0}
          max={Math.max(value + remainder, 0)}
          step={1}
          color="primary"
          isThumbFilled
          onChange={onChange}
        />
      </Card.Content>
    </Card>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  count: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  headerText: {
    flex: 1,
    gap: SPACING.one,
  },
  key: {
    minWidth: 48,
  },
  root: {
    gap: SPACING.two,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { DirectionRowProps };
