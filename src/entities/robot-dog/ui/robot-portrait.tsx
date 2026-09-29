import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/shared/hooks';

import type { RobotDogSkin } from '../model';

import { ROBOT_CHOICE_IMAGES } from './choice-assets';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotPortraitProps {
  skin: RobotDogSkin;
  variant?: 'card' | 'portrait' | 'finale';
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const RobotPortrait = ({
  skin,
  variant = 'portrait',
}: RobotPortraitProps) => {
  const theme = useTheme();
  return (
    <Image
      source={ROBOT_CHOICE_IMAGES.coat[skin]}
      contentFit="cover"
      accessible={false}
      style={[styles.root, styles[variant], { borderColor: theme.sceneLight }]}
    />
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  card: { borderRadius: 12, height: 56, width: 56 },
  finale: { borderRadius: 80, borderWidth: 4, height: 160, width: 160 },
  portrait: { borderRadius: 60, borderWidth: 4, height: 120, width: 120 },
  root: { flexShrink: 0 },
});

export type { RobotPortraitProps };
