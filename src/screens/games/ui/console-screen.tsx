import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ConsoleDevice, ConsoleVolumeButton } from '@/widgets/minigame/console';

import { GAME_REWARDS } from '@/entities/minigame';
import { isConsoleOwned } from '@/entities/minigame/console';
import { useUser } from '@/entities/user';

import { RADII, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Console lobby — pick Spacewar or snake; records live on each game screen.
 */
export const ConsoleScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useUser();
  const furnitureIds = user?.home.furnitureIds ?? [];

  if (!isConsoleOwned(furnitureIds)) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen gap="two" isTabBarVisible={false} isScrollable={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('games.console.title')}</Screen.Title>
          <Screen.Subtitle>{t('games.console.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
      </Screen.Header>

      <ConsoleDevice
        style={styles.device}
        controls={
          <View style={styles.shellHint}>
            <ConsoleVolumeButton
              accessibilityLabel={t('games.console.menu')}
              face={theme.arcadeDpadFace}
              depth={theme.arcadeDpad}
              size={56}
            >
              <Text variant="title">＋</Text>
            </ConsoleVolumeButton>
            <View style={styles.fakeFaces}>
              <ConsoleVolumeButton
                accessibilityLabel="B"
                face={theme.arcadeButtonB}
                depth={theme.arcadeShellDeep}
                size={40}
                isRound
              >
                <Text variant="smallBold" themeColor="inverseText">
                  B
                </Text>
              </ConsoleVolumeButton>
              <ConsoleVolumeButton
                accessibilityLabel="A"
                face={theme.arcadeButtonA}
                depth={theme.arcadeShellDeep}
                size={52}
                isRound
              >
                <Text variant="smallBold" themeColor="inverseText">
                  A
                </Text>
              </ConsoleVolumeButton>
            </View>
          </View>
        }
      >
        <View style={styles.screenBody}>
          <Text
            variant="smallBold"
            style={{ color: theme.arcadeLcd, marginBottom: SPACING.two }}
          >
            {t('games.console.menu')}
          </Text>

          <View style={styles.list}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(STATIC_ROUTES.GAMES_SPACEWAR)}
              style={[
                styles.cart,
                {
                  backgroundColor: theme.arcadeScreenGlow,
                  borderColor: theme.arcadeLcdDim,
                },
              ]}
            >
              <Text variant="subtitle" style={{ color: theme.arcadeLcd }}>
                {t('games.spacewar.title')}
              </Text>
              <Text variant="small" style={{ color: theme.arcadeLcdDim }}>
                {t('games.spacewar.blurb')}
              </Text>
              <Text variant="smallBold" style={{ color: theme.arcadeButtonA }}>
                +{formatMoney(GAME_REWARDS.spacewar)}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(STATIC_ROUTES.GAMES_SNAKE)}
              style={[
                styles.cart,
                {
                  backgroundColor: theme.arcadeScreenGlow,
                  borderColor: theme.arcadeLcdDim,
                },
              ]}
            >
              <Text variant="subtitle" style={{ color: theme.arcadeLcd }}>
                {t('games.snake.title')}
              </Text>
              <Text variant="small" style={{ color: theme.arcadeLcdDim }}>
                {t('games.snake.blurb')}
              </Text>
              <Text variant="smallBold" style={{ color: theme.arcadeButtonA }}>
                +{formatMoney(GAME_REWARDS.snake)}
              </Text>
            </Pressable>
          </View>
        </View>
      </ConsoleDevice>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  cart: {
    borderRadius: RADII.m,
    borderWidth: 1,
    gap: SPACING.one,
    padding: SPACING.three,
  },
  device: {
    flex: 1,
    minHeight: 0,
  },
  fakeFaces: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  list: {
    gap: SPACING.two,
  },
  screenBody: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
  shellHint: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.two,
  },
});
