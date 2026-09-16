import { useState } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Sheet, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RoomHotspotProps {
  /** What the child taps, already translated — "Магазин". */
  label: string;
  /** What is going to be here, in a sentence. */
  text: string;
  /** Where on the scene it sits. Fractions of the room, as percentage strings. */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * A place in a room that will do something later, and says so now.
 *
 * An empty room reads as a broken room: a child taps the shop window, nothing
 * happens, and they learn the scene is a picture. A named plate that answers
 * "скоро" keeps the room honest — the same move the task card on the board
 * already makes.
 */
export const RoomHotspot = ({ label, text, style }: RoomHotspotProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.root,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : 1,
          },
          style,
        ]}
      >
        <Text variant="smallBold" numberOfLines={1}>
          {label}
        </Text>
      </Pressable>

      <Sheet.Modal isVisible={isOpen} onClose={() => setIsOpen(false)}>
        <Sheet.Title>{label}</Sheet.Title>
        <Sheet.Description>{text}</Sheet.Description>
        <Sheet.Actions>
          <Button isFullWidth onPress={() => setIsOpen(false)}>
            {t('rooms.soon.close')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.three,
    position: 'absolute',
  },
});

export type { RoomHotspotProps };
