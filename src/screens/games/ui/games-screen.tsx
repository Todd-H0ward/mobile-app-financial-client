import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GAME_REWARDS } from '@/entities/minigame';
import { ownedPuzzles } from '@/entities/minigame/puzzle';
import { useUser } from '@/entities/user';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, ListRow, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const GamesScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const levels = ownedPuzzles(user?.ownedItemIds ?? []);

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('games.title')}</Screen.Title>
          <Screen.Subtitle>{t('games.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
      </Screen.Header>

      <Button onPress={() => router.push(STATIC_ROUTES.GAMES_MARKET)}>
        {t('financeGame.market')}
      </Button>
      <Button onPress={() => router.push(STATIC_ROUTES.GAMES_WEEKLY)}>
        {t('financeGame.weekly')}
      </Button>
      <Button
        variant="secondary"
        onPress={() => router.push(STATIC_ROUTES.GAMES_CONSOLE)}
      >
        {t('financeGame.console')}
      </Button>
      <Text variant="subtitle">{t('games.puzzle.title')}</Text>

      {levels.length === 0 ? (
        <>
          <Text themeColor="textSecondary">{t('games.puzzle.empty')}</Text>
          <Button
            variant="secondary"
            isFullWidth
            onPress={() => router.push(DYNAMIC_ROUTES.shop('workshop'))}
          >
            {t('games.puzzle.goToys')}
          </Button>
          <Button
            variant="ghost"
            isFullWidth
            onPress={() => router.replace(STATIC_ROUTES.HOME)}
          >
            {t('common.back')}
          </Button>
        </>
      ) : (
        <View style={styles.list}>
          {levels.map((level, index) => {
            const title = t(`games.puzzle.levels.${level.id}`, {
              defaultValue: level.id,
            });

            return (
              <ListRow
                key={level.id}
                title={title}
                subtitle={`${level.difficulty} · #${index + 1}`}
                onPress={() => router.push(DYNAMIC_ROUTES.puzzle(level.id))}
                trailing={
                  <Text variant="smallBold">
                    +{formatMoney(GAME_REWARDS.puzzle)}
                  </Text>
                }
              />
            );
          })}
        </View>
      )}
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
});
