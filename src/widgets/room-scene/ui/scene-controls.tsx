import { Pressable, StyleSheet, View } from 'react-native';

import { ROOM_IDS, type RoomId } from '@/entities/room';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

import type { SceneView } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneControlsProps {
  view: SceneView;
  onSelect: (view: SceneView) => void;
}

interface SceneControlProps {
  label: string;
  accessibilityLabel: string;
  isSelected: boolean;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * One stop on the turntable.
 *
 * The swipe is the fast way round and the buttons are the discoverable one —
 * a gesture cannot be the only way to reach a room (3.6).
 */
const SceneControl = ({
  label,
  accessibilityLabel,
  isSelected,
  onPress,
}: SceneControlProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        {
          backgroundColor: isSelected ? theme.primary : theme.surface,
          borderColor: isSelected ? theme.primaryStrong : theme.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        variant="smallBold"
        themeColor={isSelected ? 'inverseText' : 'textSecondary'}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const SceneControls = ({ view, onSelect }: SceneControlsProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.surfaceDeep }]}>
      <SceneControl
        label={t('scene.top')}
        accessibilityLabel={t('scene.topA11y')}
        isSelected={view === 'top'}
        onPress={() => onSelect('top')}
      />

      {ROOM_IDS.map((room: RoomId) => (
        <SceneControl
          key={room}
          label={t(`rooms.name.${room}`)}
          accessibilityLabel={t('scene.roomA11y', {
            room: t(`rooms.name.${room}`),
          })}
          isSelected={view === room}
          onPress={() => onSelect(room)}
        />
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    borderRadius: RADII.pill,
    flexDirection: 'row',
    gap: SPACING.one,
    padding: SPACING.one,
  },
  control: {
    alignItems: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: SPACING.three,
  },
});

export type { SceneControlsProps };
