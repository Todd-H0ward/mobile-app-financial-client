import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { PixelIcon } from './pixel-icon';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CoinProps {
  /** Diameter in design points; multiples of 12 keep the pixel grid crisp. */
  size?: number;
  /** Kept for callers; the terminal's coin never shimmers or flickers. */
  isActive?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Coin = ({ size = 24, style, accessibilityLabel }: CoinProps) => (
  <View
    accessible={accessibilityLabel != null}
    accessibilityRole="image"
    accessibilityLabel={accessibilityLabel}
    style={[styles.root, style]}
  >
    <PixelIcon name="coin" size={size} tone="coin" />
  </View>
);

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({ root: { flexShrink: 0 } });

export type { CoinProps };
