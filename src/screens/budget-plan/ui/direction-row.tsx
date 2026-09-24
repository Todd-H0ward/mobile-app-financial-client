import { Pressable, StyleSheet, View } from 'react-native';

import { DIRECTION_LOOK } from '@/widgets/direction-look';

import type { BudgetDirection } from '@/entities/economy';

import { RADII, SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Shape, Slider, Text } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

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
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of a stepper key; hitSlop expands the target to 48dp. */
const KEY_SIZE = 36;
const ROW_MARKER_SIZE = 18;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const CoinStepper = ({
  value,
  isAddDisabled,
  label,
  accent,
  onAdd,
  onRemove,
}: {
  value: number;
  isAddDisabled: boolean;
  label: string;
  /** Direction accent — keys sit on a soft tint and need this to stay readable. */
  accent: ThemeColor;
  onAdd: () => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
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
          // Filled accent on the soft row tint — white + hairline border used
          // to dissolve into primarySoft / accentSoft / successSoft.
          backgroundColor: disabled ? theme.disabled : theme[accent],
          borderColor: disabled ? theme.borderStrong : theme[accent],
          opacity: pressed && !disabled ? 0.85 : 1,
        },
      ]}
    >
      <Text
        variant="bodyBold"
        themeColor={disabled ? 'onDisabled' : 'inverseText'}
      >
        {sign}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.stepper}>
      {key(
        '−',
        onRemove,
        value === 0,
        t('budgetPlan.stepperMinusA11y', { label }),
      )}
      <Text variant="bodyBold" themeColor="text" style={styles.count}>
        {value}
      </Text>
      {key(
        '+',
        onAdd,
        isAddDisabled,
        t('budgetPlan.stepperPlusA11y', { label }),
      )}
    </View>
  );
};

/**
 * One direction: look, slider capped by the remainder, and +/- steppers.
 *
 * The slider's max is `value + remainder`, so dragging cannot push the plan
 * over the wallet — the same physical limit the steppers enforce.
 */
export const DirectionRow = ({
  direction,
  value,
  remainder,
  onChange,
  onAdd,
  onRemove,
}: DirectionRowProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const look = DIRECTION_LOOK[direction];
  const title = t(`budgetPlan.directions.${direction}.title`);
  const example = t(`budgetPlan.directions.${direction}.example`);

  const max = value + remainder;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme[look.surface],
          borderColor: theme[look.accent],
        },
      ]}
    >
      <View style={styles.header}>
        <Shape
          variant={look.marker}
          size={ROW_MARKER_SIZE}
          color={theme[look.accent]}
        />
        <View style={styles.headerText}>
          <Text variant="bodyBold" themeColor={look.label}>
            {title}
          </Text>
          <Text variant="small" themeColor="textSecondary">
            {example}
          </Text>
        </View>
        <CoinStepper
          value={value}
          isAddDisabled={remainder === 0}
          label={title}
          accent={look.accent}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </View>

      <Slider
        value={value}
        min={0}
        max={Math.max(max, 0)}
        step={1}
        color={look.accent}
        isThumbFilled
        // White → deep → direction accent: readable on the soft row tint,
        // same accent family as the steppers above.
        track={[theme.surface, theme.surfaceDeep, theme[look.accent]]}
        onChange={onChange}
      />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  count: {
    minWidth: 28,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  headerText: {
    flex: 1,
    gap: SPACING.half,
  },
  key: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    height: KEY_SIZE,
    justifyContent: 'center',
    width: KEY_SIZE,
  },
  row: {
    borderRadius: RADII.l,
    borderWidth: 1.5,
    gap: SPACING.two,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.three,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { DirectionRowProps };
