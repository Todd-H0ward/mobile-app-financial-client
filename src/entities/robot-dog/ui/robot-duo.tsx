import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { RobotDogSkin } from '../model';
import { DEFAULT_ROBOT_ASSEMBLY, type RobotAssembly } from '../model/assembly';

import { creatorImage } from './creator-assets';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
interface RobotDuoProps {
  skin: RobotDogSkin;
  assembly?: RobotAssembly;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
/** Offline stills: opening a terminal never starts a second 3D renderer. */
export const RobotDuo = ({
  skin,
  assembly = DEFAULT_ROBOT_ASSEMBLY,
}: RobotDuoProps) => (
  <Image
    source={creatorImage(skin, assembly)}
    contentFit="contain"
    accessible={false}
    cachePolicy="disk"
    style={styles.root}
  />
);

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({ root: { flex: 1, width: '100%' } });

export type { RobotDuoProps };
