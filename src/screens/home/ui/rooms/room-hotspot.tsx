import { useState } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { HIT_SLOP_SIZE, RADII, SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Sheet, Text } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Soft plate colour — so four shopfronts on one street read as four
 * different doors, not four copies of the same label.
 */
type RoomHotspotTone = 'primary' | 'accent' | 'success' | 'coin';

interface RoomHotspotProps {
  /** What the child taps, already translated — "Магазин". */
  label: string;
  /** What is going to be here, in a sentence — used when `onPress` is absent. */
  text: string;
  /**
   * Opens the real destination. When set, the plate no longer shows the
   * "soon" sheet — the room has something to do.
   */
  onPress?: () => void;
  /** Soft colour of the plate. Defaults to plain surface. */
  tone?: RoomHotspotTone;
  /** Where on the scene it sits. Fractions of the room, as percentage strings. */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TONE_COLORS: Record<
  RoomHotspotTone,
  { background: ThemeColor; border: ThemeColor; text: ThemeColor }
> = {
  accent: {
    background: 'accentSoft',
    border: 'accent',
    text: 'accentStrong',
  },
  coin: {
    background: 'coinSoft',
    border: 'coinBorder',
    text: 'warningStrong',
  },
  primary: {
    background: 'primarySoft',
    border: 'primary',
    text: 'primaryStrong',
  },
  success: {
    background: 'successSoft',
    border: 'success',
    text: 'successStrong',
  },
};

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
export const RoomHotspot = ({
  label,
  text,
  onPress,
  tone,
  style,
}: RoomHotspotProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const colors = tone ? TONE_COLORS[tone] : null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={hitSlopFor(HIT_SLOP_SIZE)}
        onPress={() => {
          if (onPress) {
            onPress();
            return;
          }
          setIsOpen(true);
        }}
        style={({ pressed }) => [
          styles.root,
          {
            backgroundColor: colors ? theme[colors.background] : theme.surface,
            borderColor: colors ? theme[colors.border] : theme.border,
            opacity: pressed ? 0.85 : 1,
          },
          style,
        ]}
      >
        <Text
          variant="smallBold"
          numberOfLines={1}
          themeColor={colors?.text ?? 'text'}
        >
          {label}
        </Text>
      </Pressable>

      {!onPress && (
        <Sheet.Modal isVisible={isOpen} onClose={() => setIsOpen(false)}>
          <Sheet.Title>{label}</Sheet.Title>
          <Sheet.Description>{text}</Sheet.Description>
          <Sheet.Actions>
            <Button isFullWidth onPress={() => setIsOpen(false)}>
              {t('rooms.soon.close')}
            </Button>
          </Sheet.Actions>
        </Sheet.Modal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: HIT_SLOP_SIZE,
    paddingHorizontal: SPACING.three,
    position: 'absolute',
  },
});

export type { RoomHotspotProps, RoomHotspotTone };
