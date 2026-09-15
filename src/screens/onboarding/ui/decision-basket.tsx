import type { ReactNode } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import type { BudgetDirection } from '@/entities/economy';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Shape, Text } from '@/shared/ui';

import { DIRECTION_LOOK } from '../lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface DecisionBasketProps {
  /** Which of the three this basket is. */
  direction: BudgetDirection;
  /** Its name: «Нужное», «Хочется», «Копилка». */
  title: string;
  /** Two or three things that belong here. */
  example: string;
  /** Tapping the basket puts the card in hand into it. */
  onPress?: () => void;
  /** Shown on the right — coins laid out, on the rehearsal-plan step. */
  trailing?: ReactNode;
  /** Announced by the screen reader on the whole basket. */
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const MARKER_SIZE = 18;
const MIN_HEIGHT = 64;

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
}: DecisionBasketProps) => {
  const theme = useTheme();
  const look = DIRECTION_LOOK[direction];

  const content = (
    <>
      <Shape
        variant={look.marker}
        size={MARKER_SIZE}
        color={theme[look.accent]}
      />

      <View style={styles.text}>
        <Text variant="bodyBold" themeColor={look.label}>
          {title}
        </Text>
        <Text variant="small" themeColor="textSecondary">
          {example}
        </Text>
      </View>

      {trailing}
    </>
  );

  const style = [
    styles.root,
    { backgroundColor: theme[look.surface], borderColor: theme[look.accent] },
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
      accessibilityLabel={accessibilityLabel ?? `${title}. ${example}`}
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
  root: {
    alignItems: 'center',
    borderRadius: RADII.l,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: SPACING.three,
    minHeight: MIN_HEIGHT,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.two,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    flex: 1,
    gap: SPACING.half,
  },
});

export type { DecisionBasketProps };
