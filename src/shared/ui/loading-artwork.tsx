import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';

import { IllustratedBackdrop } from './illustrated-backdrop';
import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
interface LoadingArtworkProps {
  status: string;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
/** Brand artwork shared by launch and scene loading; the spinner never claims fake progress. */
export const LoadingArtwork = ({ status }: LoadingArtworkProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.root, { backgroundColor: theme.launchBackground }]}>
      <IllustratedBackdrop
        source={require('../../../assets/images/launch-duo.jpg')}
      />
      <View style={styles.content}>
        <Text variant="display" style={styles.title}>
          {t('app.name')}
        </Text>
        <View
          style={[
            styles.status,
            {
              backgroundColor: theme.terminalScreen,
              borderColor: theme.borderStrong,
            },
          ]}
          accessibilityRole="progressbar"
          accessibilityLabel={status}
        >
          <ActivityIndicator color={theme.phosphor} />
          <Text variant="machine">{status}</Text>
        </View>
        <Text variant="small" themeColor="textSecondary">
          {t('app.offline')}
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.FOUR,
    padding: SPACING.FOUR,
  },
  root: { flex: 1, justifyContent: 'flex-end', paddingBottom: SPACING.SIX },
  status: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    gap: SPACING.COMPACT,
    padding: SPACING.THREE,
  },
  title: { textAlign: 'center' },
});

export type { LoadingArtworkProps };
