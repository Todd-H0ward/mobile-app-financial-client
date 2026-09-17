import { StyleSheet, View } from 'react-native';

import { formatArcadeTime } from '@/entities/minigame/console';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ArcadeRecordsKind = 'snake' | 'spacewar';

interface ArcadeRecordsBoardProps {
  kind: ArcadeRecordsKind;
  /** Snake: apple counts. Spacewar: clear times in ms. */
  scores: readonly number[];
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** LCD high-score list for one console game. */
export const ArcadeRecordsBoard = ({
  kind,
  scores,
}: ArcadeRecordsBoardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Text
        variant="smallBold"
        style={{ color: theme.arcadeLcd, marginBottom: SPACING.two }}
      >
        {t('games.console.records')}
      </Text>
      {scores.length === 0 ? (
        <Text variant="small" style={{ color: theme.arcadeLcdDim }}>
          {t('games.console.recordsHint')}
        </Text>
      ) : (
        <View style={styles.list}>
          {scores.map((score, index) => (
            <Text
              key={`${kind}-${index}-${score}`}
              variant="smallBold"
              style={{ color: theme.arcadeLcd }}
            >
              {index + 1}.{' '}
              {kind === 'spacewar' ? formatArcadeTime(score) : score}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  list: {
    gap: SPACING.one,
  },
  root: {
    gap: SPACING.one,
  },
});

export type { ArcadeRecordsBoardProps, ArcadeRecordsKind };
