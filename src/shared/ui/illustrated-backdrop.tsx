import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
interface IllustratedBackdropProps {
  source: ImageSource | number;
  variant?: 'clear' | 'muted';
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
export const IllustratedBackdrop = ({
  source,
  variant = 'clear',
}: IllustratedBackdropProps) => {
  const theme = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <Image
        source={source}
        contentFit="cover"
        accessible={false}
        style={StyleSheet.absoluteFill}
      />
      {variant === 'muted' && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
        />
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
});

export type { IllustratedBackdropProps };
