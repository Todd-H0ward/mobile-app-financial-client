import type { ReactNode } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import { DIRECTION_LOOK } from '@/widgets/direction-look';

import type { BudgetDirection } from '@/entities/economy';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Shape, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface DecisionBasketProps {
  direction: BudgetDirection;
  /** Its name: «Нужное», «Хочется», «Копилка». */
  title: string;
  /** Two or three things that belong here. */
  example: string;
  /** Tapping the basket puts the card in hand into it. */
  onPress?: () => void;
  /**
   * Extra content rendered below the text — coins on the plan step.
   * Not shown when the basket is in the greeting (box) layout.
   */
  trailing?: ReactNode;
  /** Announced by the screen reader on the whole basket. */
  accessibilityLabel?: string;
  /**
   * Switches the basket to a compact horizontal row used on plan/sorting
   * steps. Default (`false`) renders the child-friendly vertical box used
   * on the greeting step.
   */
  isRow?: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BOX_SHAPE_SIZE = 36;
const ROW_MARKER_SIZE = 18;
const MIN_ROW_HEIGHT = 64;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const DecisionBasket = ({
  direction,
  title,
  example,
  onPress,
  trailing,
  accessibilityLabel,
  isRow = false,
}: DecisionBasketProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const look = DIRECTION_LOOK[direction];

  const basketTitle = t(`onboarding.decisions.${direction}.title`, {
    defaultValue: title,
  });
  const basketExample = t(`onboarding.decisions.${direction}.example`, {
    defaultValue: example,
  });

  const content = isRow ? (
    <>
      <Shape
        variant={look.marker}
        size={ROW_MARKER_SIZE}
        color={theme[look.accent]}
      />
      <View style={styles.rowText}>
        <Text variant="bodyBold" themeColor={look.label}>
          {basketTitle}
        </Text>
        <Text variant="small" themeColor="textSecondary">
          {basketExample}
        </Text>
      </View>
      {trailing}
    </>
  ) : (
    <>
      <Shape
        variant={look.marker}
        size={BOX_SHAPE_SIZE}
        color={theme[look.accent]}
      />
      <Text variant="bodyBold" themeColor={look.label} style={styles.boxTitle}>
        {basketTitle}
      </Text>
      <Text
        variant="small"
        themeColor="textSecondary"
        style={styles.boxExample}
      >
        {basketExample}
      </Text>
    </>
  );

  const style = isRow
    ? [
        styles.row,
        {
          backgroundColor: theme[look.surface],
          borderColor: theme[look.accent],
        },
      ]
    : [
        styles.box,
        {
          backgroundColor: theme[look.surface],
          borderColor: theme[look.accent],
        },
      ];

  if (!onPress) {
    return (
      <View style={style} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? `${basketTitle}. ${basketExample}`
      }
      onPress={onPress}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  /** Vertical box — greeting step. */
  box: {
    alignItems: 'center',
    borderRadius: RADII.xl,
    borderWidth: 2,
    flex: 1,
    gap: SPACING.one,
    paddingHorizontal: SPACING.two,
    paddingVertical: SPACING.three,
  },
  boxExample: {
    textAlign: 'center',
  },
  boxTitle: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  /** Horizontal row — plan / sorting steps. */
  row: {
    alignItems: 'center',
    borderRadius: RADII.l,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: SPACING.three,
    minHeight: MIN_ROW_HEIGHT,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.two,
  },
  rowText: {
    flex: 1,
    gap: SPACING.half,
  },
});

export type { DecisionBasketProps };
