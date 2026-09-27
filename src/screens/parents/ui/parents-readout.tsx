import { StyleSheet, View } from 'react-native';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Card, PixelIcon, type PixelIconName, Text } from '@/shared/ui';

import type { ParentsStatus } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ParentsReadoutProps {
  status: ParentsStatus | null;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The three skills, wearing the signs the child sees in the game. */
const PURPOSES: { key: 'plan' | 'priority' | 'save'; icon: PixelIconName }[] = [
  { key: 'plan', icon: 'plan' },
  { key: 'priority', icon: 'battery' },
  { key: 'save', icon: 'piggy' },
];

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The top of the grown-ups' section (4b): three numbers and what the app is
 * for. 2.5.12 asks for the goals next to the progress, so they come first.
 * Nothing here judges the child — counts and names only.
 */
export const ParentsReadout = ({ status }: ParentsReadoutProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const tiles = status
    ? [
        {
          key: 'finished',
          value: String(status.finishedPeriods),
          label: t('parents.terminal.tileFinished'),
        },
        {
          key: 'tasks',
          value: String(status.tasksDone),
          label: t('parents.terminal.tileTasks'),
        },
        {
          key: 'period',
          value: String(status.periodIndex),
          label: t('parents.terminal.tilePeriod'),
        },
      ]
    : [];

  return (
    <View style={styles.root}>
      {status ? (
        <Text variant="subtitle">
          {t('parents.terminal.team', {
            robot: status.robotName || '—',
            player: status.playerName,
          })}
        </Text>
      ) : null}

      {tiles.length > 0 ? (
        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <View
              key={tile.key}
              accessible
              accessibilityLabel={`${tile.value} ${tile.label}`}
              style={[styles.tile, { borderColor: theme.border }]}
            >
              <Text variant="machine" style={styles.tileValue}>
                {tile.value}
              </Text>
              <Text variant="small" themeColor="textMuted">
                {tile.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Card>
        <Text variant="bodyBold">{t('parents.terminal.purposeTitle')}</Text>
        {PURPOSES.map(({ key, icon }) => (
          <View key={key} style={styles.purpose}>
            <PixelIcon name={icon} />
            <Text themeColor="textSecondary" style={styles.purposeText}>
              <Text variant="bodyBold">
                {`${t(`parents.terminal.purposeLead.${key}`)} `}
              </Text>
              {t(`parents.terminal.purpose.${key}`)}
            </Text>
          </View>
        ))}
        <Text variant="small" themeColor="textMuted">
          {t('parents.terminal.role')}
        </Text>
      </Card>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  purpose: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  purposeText: { flex: 1 },
  root: { gap: SPACING.compact },
  tile: {
    borderRadius: RADII.m,
    borderWidth: 2,
    flex: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: SPACING.two,
  },
  tileValue: { fontSize: 22, lineHeight: 28 },
  tiles: { flexDirection: 'row', gap: SPACING.two },
});

export type { ParentsReadoutProps };
