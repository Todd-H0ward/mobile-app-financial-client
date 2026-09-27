import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RobotTerminal } from '@/widgets/robot-profile';

import { PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { RobotPortrait } from '@/entities/robot-dog/ui';
import { useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface FinaleScreenProps {
  onContinue: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const FinaleScreen = ({ onContinue }: FinaleScreenProps) => {
  const user = useUser();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (user.platform.level < PLATFORM_LEVEL_COUNT)
    return <Redirect href={STATIC_ROUTES.HOME} />;
  // the remaining jar alone would misleadingly show zero immediately after reaching the surface
  const saved =
    user.savings.goals.reduce((sum, goal) => sum + goal.saved, 0) +
    user.platform.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const stats = [
    { label: 'periods', value: user.period.index - 1 },
    { label: 'saved', value: saved },
    {
      label: 'plans',
      value: user.history.filter((period) => period.isPlanKept).length,
    },
  ];
  return (
    <RobotTerminal
      variant="finale"
      hero={
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: theme.phosphor }]}>
            <Text variant="smallBold" themeColor="onAccent">
              {t('finale.surface', { level: PLATFORM_LEVEL_COUNT })}
            </Text>
          </View>
          <RobotPortrait skin={user.settings.robotSkin} variant="finale" />
        </View>
      }
    >
      <Screen.Heading style={styles.heading}>
        <Screen.Label>{t('finale.label')}</Screen.Label>
        <Screen.Title style={styles.title}>
          {t('finale.title', { name: user.robot.name })}
        </Screen.Title>
      </Screen.Heading>
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[styles.stat, { borderColor: theme.border }]}
          >
            <Text variant="machine" style={styles.number}>
              {formatMoney(stat.value)}
            </Text>
            <Text variant="small" themeColor="textMuted">
              {t(`finale.${stat.label}`)}
            </Text>
          </View>
        ))}
      </View>
      <Text themeColor="textSecondary">{t('finale.body')}</Text>
      <View style={styles.actions}>
        <Button size="l" isFullWidth onPress={onContinue}>
          {t('finale.continue')}
        </Button>
        <Button
          variant="ghost"
          isFullWidth
          onPress={() => router.push(STATIC_ROUTES.HISTORY)}
        >
          {t('finale.history')}
        </Button>
      </View>
    </RobotTerminal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: { gap: SPACING.ONE, marginTop: 'auto', paddingTop: SPACING.COMPACT },
  badge: {
    borderRadius: 8,
    paddingHorizontal: SPACING.COMPACT,
    paddingVertical: SPACING.TWO,
  },
  heading: { flex: 0 },
  hero: { alignItems: 'center', gap: SPACING.THREE },
  number: { fontSize: 20, lineHeight: 28 },
  stat: {
    borderRadius: 12,
    borderWidth: 2,
    flexBasis: 80,
    flexGrow: 1,
    gap: SPACING.HALF,
    padding: SPACING.TWO,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.ONE },
  title: { fontSize: 28, lineHeight: 32 },
});

export type { FinaleScreenProps };
