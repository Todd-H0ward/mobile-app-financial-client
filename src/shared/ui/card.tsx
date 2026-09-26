import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { RADII, SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { GlassSurface } from './glass-surface';
import { Text, type TextProps } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CardRootProps {
  children?: ReactNode;
  tone?: ThemeColor;
  isSelected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

type CardTitleProps = TextProps;

interface CardContentProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface CardFooterProps {
  children?: ReactNode;
  /** Pushes the actions apart instead of stacking them on the right. */
  isSpread?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BORDER = 1;
const SELECTED_BORDER = 2.5;
const PADDING = SPACING.three;

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

const CardTitle = ({
  children,
  variant = 'subtitle',
  ...props
}: CardTitleProps) => {
  return (
    <Text variant={variant} {...props}>
      {children}
    </Text>
  );
};

const CardContent = ({ children, style }: CardContentProps) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

const CardFooter = ({ children, isSpread = false, style }: CardFooterProps) => {
  return (
    <View style={[styles.footer, isSpread && styles.footerSpread, style]}>
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * A surface with a border. Pass `onPress` and it becomes a button; without it
 * the card stays a plain view, so it never shows up in the a11y tree as one.
 *
 * @example
 * <Card onPress={choose} isSelected={isChosen}>
 *   <Card.Title>Робопёс</Card.Title>
 *   <Card.Content>
 *     <Text>Заряд на исходе, но доволен.</Text>
 *   </Card.Content>
 *   <Card.Footer>
 *     <Button size="s">Покормить</Button>
 *   </Card.Footer>
 * </Card>
 */
const CardRoot = ({
  children,
  tone = 'surface',
  isSelected = false,
  onPress,
  style,
}: CardRootProps) => {
  const theme = useTheme();

  const cardStyle: StyleProp<ViewStyle> = [
    styles.root,
    {
      borderColor: isSelected ? theme.primary : theme.border,
      borderWidth: isSelected ? SELECTED_BORDER : BORDER,
      // The thicker border eats into the content box, so the padding gives
      // back exactly what it took: selecting a row must not nudge its text.
      padding: PADDING - (isSelected ? SELECTED_BORDER : BORDER),
    },
    style,
  ];

  return (
    <GlassSurface
      tone={tone}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: isSelected } : undefined}
      style={cardStyle}
    >
      {children}
    </GlassSurface>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Card = Object.assign(CardRoot, {
  Title: CardTitle,
  Content: CardContent,
  Footer: CardFooter,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    borderRadius: RADII.l,
    gap: SPACING.two,
  },
  content: {
    gap: SPACING.one,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'flex-end',
  },
  footerSpread: {
    justifyContent: 'space-between',
  },
});

export type {
  CardContentProps,
  CardFooterProps,
  CardRootProps,
  CardTitleProps,
};
