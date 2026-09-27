import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GAME_REWARDS, PLAYKIT_GAME_IDS } from '@/entities/minigame';
import { ownedPuzzles } from '@/entities/minigame/puzzle';
import { useUser } from '@/entities/user';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, ListRow, PixelIcon, Screen, Text } from '@/shared/ui';
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
    <Screen gap="three" terminalVariant="overseer">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Text variant="code" themeColor="overseerLcd">
            {`// ${t('scene.watchers.overseer.name')}`}
          </Text>
          <Screen.Title>{t('games.title')}</Screen.Title>
          <Screen.Subtitle>{t('games.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
      </Screen.Header>

      <Text variant="subtitle">{t('playkit.section')}</Text>
      {PLAYKIT_GAME_IDS.map((gameId) => (
        <ListRow
          key={gameId}
          icon={
            <ListRow.Icon>
              <PixelIcon name="face" size={24} tone="overseerLcd" />
            </ListRow.Icon>
          }
          title={t(`playkit.games.${gameId}.title`)}
          subtitle={t(`playkit.games.${gameId}.blurb`)}
          onPress={() => router.push(DYNAMIC_ROUTES.play(gameId))}
          trailing={
            <Text variant="smallBold">
              +{formatMoney(GAME_REWARDS[gameId])}
            </Text>
          }
        />
      ))}

      <Button
        variant="secondary"
        onPress={() => router.push(STATIC_ROUTES.GAMES_MARKET)}
      >
        {t('financeGame.market')}
      </Button>
      <Button
        variant="secondary"
        onPress={() => router.push(STATIC_ROUTES.GAMES_WEEKLY)}
      >
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
            onPress={() =>
              router.dismissTo(DYNAMIC_ROUTES.watcher('keeper', 'shop'))
            }
          >
            {t('games.puzzle.goToys')}
          </Button>
          <Button
            variant="ghost"
            isFullWidth
            onPress={() => router.dismissTo(STATIC_ROUTES.HOME)}
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
