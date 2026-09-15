import { View, type ViewProps } from 'react-native';

import type { ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ThemedViewProps extends ViewProps {
  variant?: ThemeColor;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ThemedView = ({ style, variant, ...props }: ThemedViewProps) => {
  const theme = useTheme();

  return (
    <View
      style={[{ backgroundColor: theme[variant ?? 'background'] }, style]}
      {...props}
    />
  );
};

export type { ThemedViewProps };
