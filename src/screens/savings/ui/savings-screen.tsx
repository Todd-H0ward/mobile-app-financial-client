import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { goalPath, SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { CoinBadge, Screen, Text } from '@/shared/ui';

import { useSavings } from '../model';

import { GoalRow } from './goal-row';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Savings showcase — every goal with progress (2.5.7 / roadmap 1.14).
 *
 * Tapping a row opens that goal's jar screen for deposit and withdraw.
 */
export const SavingsScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const savings = useSavings();

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('savings.title')}</Screen.Title>
          <Screen.Subtitle>{t('savings.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="savings" />
      </Screen.Header>

      <View style={styles.stats}>
        <CoinBadge
          amount={savings.balance}
          label={t('savings.balance')}
          coinSize={18}
        />
        <CoinBadge
          amount={savings.totalSaved}
          label={t('savings.total')}
          coinSize={18}
        />
      </View>

      <Text themeColor="textSecondary">{t('savings.pickHint')}</Text>

      <View style={styles.list}>
        {savings.goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            onPress={() => {
              if (!goal.isActive) savings.setActive(goal.id);
              router.push(goalPath(goal.id));
            }}
          />
        ))}
      </View>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  list: {
    gap: SPACING.two,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
});
