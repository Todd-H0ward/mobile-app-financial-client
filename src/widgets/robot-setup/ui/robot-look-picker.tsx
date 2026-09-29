import { useEffect, useRef, useState } from 'react';

import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  ROBOT_DOG_SKINS,
  ROBOT_EARS,
  ROBOT_FACES,
  type RobotAssembly,
  type RobotDogSkin,
  type RobotEars,
  type RobotFace,
} from '@/entities/robot-dog';
import { ROBOT_CHOICE_IMAGES } from '@/entities/robot-dog/ui';
import { useIsMotionEnabled } from '@/entities/user';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { PixelIcon, Segmented, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type LookTab = 'coat' | 'ears' | 'face';

interface RobotLookPickerProps {
  skin: RobotDogSkin;
  assembly: RobotAssembly;
  onSkinChange: (skin: RobotDogSkin) => void;
  onEarsChange: (ears: RobotEars) => void;
  onFaceChange: (face: RobotFace) => void;
}

interface LookTileProps {
  source: number;
  label: string;
  isSelected: boolean;
  width: number;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const LOOK_TABS = [
  'coat',
  'ears',
  'face',
] as const satisfies readonly LookTab[];

/**
 * Tiles across the row: three whole ones and the edge of a fourth, which says "swipe" on the
 * seven coats. Ears and eyes use the same tile, so the picker keeps its height between tabs.
 */
const TILES_IN_VIEW = 3.3;
const TILE_GAP = SPACING.TWO;
const TILE_ASPECT = 1.45;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const LookTile = ({
  source,
  label,
  isSelected,
  width,
  onPress,
}: LookTileProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { opacity: pressed ? 0.75 : 1, width },
      ]}
    >
      <View
        style={[
          styles.tileFrame,
          {
            backgroundColor: theme.surfaceDeep,
            borderColor: isSelected ? theme.phosphor : theme.border,
          },
        ]}
      >
        <Image
          source={source}
          contentFit="cover"
          style={styles.tileImage}
          accessible={false}
          cachePolicy="disk"
        />
        {isSelected ? (
          <View style={[styles.tileCheck, { backgroundColor: theme.surface }]}>
            <PixelIcon name="check20" size={16} />
          </View>
        ) : null}
      </View>
      <Text
        variant={isSelected ? 'smallBold' : 'small'}
        themeColor={isSelected ? 'phosphor' : 'textSecondary'}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Coat, ears and eyes behind one switch — the same picker on the first screen and in settings. */
export const RobotLookPicker = ({
  skin,
  assembly,
  onSkinChange,
  onEarsChange,
  onFaceChange,
}: RobotLookPickerProps) => {
  const { t } = useTranslation();
  const isAnimated = useIsMotionEnabled();
  const [tab, setTab] = useState<LookTab>('coat');
  const [rowWidth, setRowWidth] = useState(0);
  const coatRow = useRef<ScrollView>(null);
  const ears = assembly.ears ?? 'floppy';
  const face = assembly.face ?? 'dots';
  const tileWidth =
    (rowWidth - TILE_GAP * Math.floor(TILES_IN_VIEW)) / TILES_IN_VIEW;

  // A random pick can land past the edge of the coat row — bring the lit tile into view.
  useEffect(() => {
    if (tab !== 'coat' || tileWidth <= 0) return;
    const index = ROBOT_DOG_SKINS.indexOf(skin);
    coatRow.current?.scrollTo({
      x: Math.max(
        0,
        index * (tileWidth + TILE_GAP) - (rowWidth - tileWidth) / 2,
      ),
      animated: isAnimated,
    });
  }, [isAnimated, rowWidth, skin, tab, tileWidth]);

  const tabOptions = LOOK_TABS.map((key) => ({
    value: key,
    label: t(`setup.look.${key}`),
  }));

  const tiles =
    tab === 'coat'
      ? ROBOT_DOG_SKINS.map((value) => (
          <LookTile
            key={value}
            source={ROBOT_CHOICE_IMAGES.coat[value]}
            label={t(`settings.skin.${value}`)}
            isSelected={skin === value}
            width={tileWidth}
            onPress={() => onSkinChange(value)}
          />
        ))
      : tab === 'ears'
        ? ROBOT_EARS.map((value) => (
            <LookTile
              key={value}
              source={ROBOT_CHOICE_IMAGES.ears[value]}
              label={t(`setup.look.${value}`)}
              isSelected={ears === value}
              width={tileWidth}
              onPress={() => onEarsChange(value)}
            />
          ))
        : ROBOT_FACES.map((value) => (
            <LookTile
              key={value}
              source={ROBOT_CHOICE_IMAGES.face[value]}
              label={t(`setup.look.${value}`)}
              isSelected={face === value}
              width={tileWidth}
              onPress={() => onFaceChange(value)}
            />
          ));

  return (
    <View style={styles.root}>
      <Segmented options={tabOptions} value={tab} onChange={setTab} />
      <View onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
        {rowWidth <= 0 ? null : tab === 'coat' ? (
          // One row in one order: all seven coats, the chosen one lit.
          <ScrollView
            ref={coatRow}
            horizontal
            accessibilityRole="radiogroup"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coatRow}
          >
            {tiles}
          </ScrollView>
        ) : (
          <View accessibilityRole="radiogroup" style={styles.row}>
            {tiles}
          </View>
        )}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  coatRow: {
    gap: TILE_GAP,
  },
  root: {
    gap: SPACING.COMPACT,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tile: {
    alignItems: 'center',
    gap: SPACING.ONE,
  },
  tileCheck: {
    borderRadius: RADII.xs,
    padding: SPACING.HALF,
    position: 'absolute',
    right: SPACING.ONE,
    top: SPACING.ONE,
  },
  tileFrame: {
    aspectRatio: TILE_ASPECT,
    borderRadius: RADII.m,
    borderWidth: 2,
    overflow: 'hidden',
    width: '100%',
  },
  tileImage: {
    height: '100%',
    width: '100%',
  },
});

export type { LookTileProps, RobotLookPickerProps };
