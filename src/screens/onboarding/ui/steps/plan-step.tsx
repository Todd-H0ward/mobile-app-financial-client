import { Pressable, StyleSheet, View } from 'react-native';

import { listDecisions } from '@/entities/onboarding';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { ProgressBar, Text } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

import type { OnboardingController } from '../../model';
import { DecisionBasket } from '../decision-basket';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PlanStepProps {
  onboarding: OnboardingController;
}

interface CoinStepperProps {
  /** Coins in this basket right now. */
  count: number;
  /** Disabled when nothing is left to lay out — the limit is physical. */
  isAddDisabled: boolean;
  label: string;
  onAdd: () => void;
  onRemove: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of a stepper key; hitSlop expands the target to 48dp. */
const KEY_SIZE = 36;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const CoinStepper = ({
  count,
  isAddDisabled,
  label,
  onAdd,
  onRemove,
}: CoinStepperProps) => {
  const theme = useTheme();

  const key = (
    sign: string,
    onPress: () => void,
    disabled: boolean,
    accessibilityLabel: string,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlopFor(KEY_SIZE)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: disabled ? theme.disabled : theme.surface,
          borderColor: theme.borderStrong,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="bodyBold" themeColor={disabled ? 'onDisabled' : 'text'}>
        {sign}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.stepper}>
      {key('−', onRemove, count === 0, `Убрать монету: ${label}`)}

      <Text variant="bodyBold" style={styles.count}>
        {count}
      </Text>

      {key('+', onAdd, isAddDisabled, `Добавить монету: ${label}`)}
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The rehearsal plan: ten coins laid out across the same three baskets.
 *
 * It follows the rules of the real budget screen (docs/budget.md) so that
 * screen arrives already familiar: the remainder is always visible, going over
 * the sum is impossible rather than corrected afterwards, and leaving coins
 * unassigned is allowed — the task is not to spend everything.
 */
export const PlanStep = ({ onboarding }: PlanStepProps) => {
  const { plan, planLeft, planTotal, addCoin, removeCoin } = onboarding;

  return (
    <View style={styles.root}>
      <View style={styles.remainder}>
        <Text variant="bodyBold">{`Осталось разложить: ${planLeft}`}</Text>
        <ProgressBar value={(planTotal - planLeft) / planTotal} />
        <Text variant="small" themeColor="textSecondary">
          Раскладывать всё до монеты не обязательно — остаток просто остаётся у
          тебя.
        </Text>
      </View>

      <View style={styles.baskets}>
        {listDecisions().map((decision) => (
          <DecisionBasket
            key={decision.id}
            direction={decision.id}
            title={decision.title}
            example={decision.example}
            isRow
            trailing={
              <CoinStepper
                count={plan[decision.id]}
                isAddDisabled={planLeft === 0}
                label={decision.title}
                onAdd={() => addCoin(decision.id)}
                onRemove={() => removeCoin(decision.id)}
              />
            }
          />
        ))}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    gap: SPACING.three,
  },
  baskets: {
    gap: SPACING.two,
  },
  count: {
    minWidth: 20,
    textAlign: 'center',
  },
  key: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 1.5,
    height: KEY_SIZE,
    justifyContent: 'center',
    width: KEY_SIZE,
  },
  remainder: {
    gap: SPACING.two,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { CoinStepperProps, PlanStepProps };
