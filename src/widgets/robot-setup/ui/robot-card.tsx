import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  ROBOT_DOG_ACTIONS,
  ROBOT_DOG_SKINS,
  type RobotDogAction,
  type RobotDogSkin,
} from '@/entities/robot-dog';
import { ROBOT_SKIN_PREVIEWS } from '@/entities/robot-dog/ui';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Card, Chip, PixelIcon, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotCardProps {
  skin: RobotDogSkin;
  action?: RobotDogAction;
  onSkinChange: (skin: RobotDogSkin) => void;
  onActionChange?: (action: RobotDogAction) => void;
}

interface SkinTileProps {
  skin: RobotDogSkin;
  isSelected: boolean;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Wide enough to read the coat, small enough that four fit a phone. */
const TILE_WIDTH = 104;
const TILE_HEIGHT = 72;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * One coat, shown rather than named.
 *
 * The name of a coat means nothing before you have seen it — «Карбон» is a
 * word, the picture is the choice. The label stays underneath for the screen
 * reader and for telling two dark coats apart.
 */
const SkinTile = ({ skin, isSelected, onPress }: SkinTileProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const label = t(`settings.skin.${skin}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Image
        source={ROBOT_SKIN_PREVIEWS[skin]}
        style={[
          styles.preview,
          {
            borderColor: isSelected ? theme.primary : theme.border,
            borderWidth: isSelected ? 3 : 1,
          },
        ]}
        contentFit="cover"
        transition={120}
      />
      {isSelected ? (
        <View style={[styles.selected, { backgroundColor: theme.surface }]}>
          <PixelIcon name="check20" size={20} />
        </View>
      ) : null}
      <Text
        variant={isSelected ? 'bodyBold' : 'body'}
        themeColor={isSelected ? 'primaryStrong' : 'textSecondary'}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The grown-up's controls for the dog: how it looks and what it does.
 *
 * Both are looks-only — nothing here touches the economy — which is why they
 * sit next to the interface switches and not behind the arithmetic gate.
 */
export const RobotCard = ({
  skin,
  action,
  onSkinChange,
  onActionChange,
}: RobotCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Card.Title>{t('settings.robot')}</Card.Title>
      <Card.Content style={styles.content}>
        <View style={styles.heading}>
          <Text variant="bodyBold">{t('settings.robotSkin')}</Text>
          <Text variant="small" themeColor="textMuted">
            {t('settings.petSkinSubtitle')}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tiles}
        >
          {ROBOT_DOG_SKINS.map((value) => (
            <SkinTile
              key={value}
              skin={value}
              isSelected={value === skin}
              onPress={() => onSkinChange(value)}
            />
          ))}
        </ScrollView>

        {onActionChange && (
          <>
            <View style={styles.heading}>
              <Text variant="bodyBold">{t('settings.robotAction')}</Text>
              <Text variant="small" themeColor="textMuted">
                {t('settings.petActionSubtitle')}
              </Text>
            </View>
            <View style={styles.actions}>
              {ROBOT_DOG_ACTIONS.map((value) => (
                <Chip
                  key={value}
                  variant={value === action ? 'selected' : 'neutral'}
                  onPress={() => onActionChange(value)}
                >
                  {t(`settings.action.${value}`)}
                </Chip>
              ))}
            </View>
          </>
        )}
        <Text variant="small" themeColor="textMuted">
          {t('settings.petTapHint')}
        </Text>
      </Card.Content>
    </Card>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
  content: {
    gap: SPACING.compact,
  },
  heading: { gap: 2 },
  preview: {
    borderRadius: RADII.m,
    height: TILE_HEIGHT,
    width: TILE_WIDTH,
  },
  selected: {
    borderRadius: RADII.xs,
    padding: SPACING.one,
    position: 'absolute',
    right: SPACING.one,
    top: SPACING.one,
  },
  tile: {
    alignItems: 'center',
    gap: SPACING.one,
  },
  tiles: {
    gap: SPACING.two,
    paddingVertical: SPACING.one,
  },
});

export type { RobotCardProps };
