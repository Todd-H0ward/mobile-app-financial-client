import { useEffect } from 'react';

import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RobotTerminal } from '@/widgets/robot-profile';

import { RestartProfileButton } from '@/features/profile-restart';

import { PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { RobotPortrait } from '@/entities/robot-dog/ui';
import { hasSeenStory, useCreateUser, useUser } from '@/entities/user';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { Button, PixelIcon, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const EntryScreen = () => {
  const user = useUser();
  const createUser = useCreateUser();
  const time = useTimeSource();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) createUser({ createdAt: time.now() });
  }, [user, createUser, time]);

  if (!user) return null;
  if (!user.playerName || !user.robot.name)
    return <Redirect href={STATIC_ROUTES.SETUP} />;
  if (!hasSeenStory(user, 'intro'))
    return <Redirect href={DYNAMIC_ROUTES.story('intro')} />;

  return (
    <RobotTerminal
      variant="welcome"
      hero={
        <Image
          source={require('../../../../assets/images/launch-duo.jpg')}
          contentFit="cover"
          contentPosition={{ top: '62%', left: '50%' }}
          style={styles.hero}
          accessible={false}
        />
      }
    >
      <Screen.Heading style={styles.heading}>
        <Screen.Label>{t('returning.label')}</Screen.Label>
        <Screen.Title>{t('returning.title')}</Screen.Title>
      </Screen.Heading>
      <View
        style={[
          styles.profile,
          { backgroundColor: theme.surface, borderColor: theme.phosphor },
        ]}
      >
        <RobotPortrait skin={user.settings.robotSkin} variant="card" />
        <View style={styles.identity}>
          <Text variant="subtitle">{user.robot.name}</Text>
          <Text variant="small" themeColor="textMuted">
            {t('returning.progress', {
              level: user.platform.level,
              total: PLATFORM_LEVEL_COUNT,
              period: user.period.index,
            })}
          </Text>
        </View>
        <View style={styles.balance}>
          <Text variant="numberSmall">{formatMoney(user.wallet.balance)}</Text>
          <PixelIcon name="coin" tone="coin" />
        </View>
      </View>
      <Text variant="small" themeColor="textMuted">
        {t('returning.saved')}
      </Text>
      <View style={styles.actions}>
        <Button
          size="l"
          isFullWidth
          onPress={() => router.dismissTo(STATIC_ROUTES.HOME)}
        >
          {t('returning.continue')}
        </Button>
        <RestartProfileButton
          label={t('returning.newGame')}
          variant="secondary"
        />
      </View>
    </RobotTerminal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: { gap: SPACING.TWO, marginTop: 'auto', paddingTop: SPACING.FOUR },
  balance: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.ONE,
    marginLeft: 'auto',
  },
  heading: { flex: 0 },
  hero: { width: '100%', height: '100%', borderRadius: 16 },
  identity: { flexBasis: 100, flexGrow: 1, gap: SPACING.ONE },
  profile: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.COMPACT,
    padding: SPACING.COMPACT,
  },
});
