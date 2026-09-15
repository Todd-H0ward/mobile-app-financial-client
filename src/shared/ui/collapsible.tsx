import {
  createContext,
  type PropsWithChildren,
  type ReactElement,
  useContext,
  useMemo,
  useState,
} from 'react';

import { SymbolView } from 'expo-symbols';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HIT_SLOP_SIZE, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { isTextOnly } from '@/shared/utils';

import { Text } from './text';
import { ThemedView } from './themed-view';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CollapsibleRootProps extends PropsWithChildren {
  isDefaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

interface CollapsibleTriggerProps {
  children: string | ReactElement;
  style?: StyleProp<ViewStyle>;
}

interface CollapsibleContentProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

interface CollapsibleContextValue {
  isOpen: boolean;
  toggle: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CONTENT_ANIMATION_DURATION = 200;

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

const useCollapsibleContext = () => {
  const context = useContext(CollapsibleContext);

  if (!context) {
    throw new Error('Component must be used within Collapsible.Provider');
  }

  return context;
};

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

const CollapsibleTrigger = ({ children, style }: CollapsibleTriggerProps) => {
  const theme = useTheme();
  const { isOpen, toggle } = useCollapsibleContext();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      onPress={toggle}
      style={({ pressed }) => [
        styles.heading,
        pressed && styles.pressed,
        style,
      ]}
    >
      <ThemedView variant="surface" style={styles.chevron}>
        <SymbolView
          name={{
            ios: 'chevron.right',
            android: 'chevron_right',
            web: 'chevron_right',
          }}
          size={14}
          weight="bold"
          tintColor={theme.text}
          style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
        />
      </ThemedView>

      {isTextOnly(children) ? <Text variant="body">{children}</Text> : children}
    </Pressable>
  );
};

/** Rendered only while open, so its children stay unmounted until needed. */
const CollapsibleContent = ({ children, style }: CollapsibleContentProps) => {
  const { isOpen } = useCollapsibleContext();

  if (!isOpen) return null;

  return (
    <Animated.View entering={FadeIn.duration(CONTENT_ANIMATION_DURATION)}>
      <ThemedView variant="surface" style={[styles.content, style]}>
        {children}
      </ThemedView>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const CollapsibleRoot = ({
  children,
  isDefaultOpen = false,
  isOpen: controlledOpen,
  onOpenChange,
  style,
}: CollapsibleRootProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(isDefaultOpen);

  const isControlled = controlledOpen != null;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const contextValue = useMemo<CollapsibleContextValue>(
    () => ({
      isOpen,
      toggle: () => {
        if (!isControlled) setUncontrolledOpen((current) => !current);

        onOpenChange?.(!isOpen);
      },
    }),
    [isControlled, isOpen, onOpenChange],
  );

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <ThemedView style={style}>{children}</ThemedView>
    </CollapsibleContext.Provider>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
    // Full-width row stays ≥ 48dp tall so the chevron alone is not the target.
    minHeight: HIT_SLOP_SIZE,
  },
  pressed: {
    opacity: 0.7,
  },
  chevron: {
    alignItems: 'center',
    borderRadius: 12,
    height: SPACING.four,
    justifyContent: 'center',
    width: SPACING.four,
  },
  content: {
    borderRadius: SPACING.three,
    marginLeft: SPACING.four,
    marginTop: SPACING.three,
    padding: SPACING.four,
  },
});

export type {
  CollapsibleContentProps,
  CollapsibleRootProps,
  CollapsibleTriggerProps,
};
