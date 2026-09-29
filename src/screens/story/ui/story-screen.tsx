import { useState } from 'react';

import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { storyImage } from '@/entities/story/ui';
import { useUser } from '@/entities/user';

import { MAX_CONTENT_WIDTH, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Text } from '@/shared/ui';

import { useStory } from '../model';

import { FinaleScreen } from './finale-screen';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
export const StoryScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useUser();
  const { cutscene, isKnownId, finish } = useStory();
  const [beatIndex, setBeatIndex] = useState(0);
  const [isSummaryVisible, setSummaryVisible] = useState(false);
  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (!isKnownId || !cutscene) return <Redirect href={STATIC_ROUTES.HOME} />;
  if (cutscene.id === 'finale' && user.platform.level < PLATFORM_LEVEL_COUNT)
    return <Redirect href={STATIC_ROUTES.HOME} />;
  if (isSummaryVisible) return <FinaleScreen onContinue={finish} />;
  const beat = cutscene.beats[Math.min(beatIndex, cutscene.beats.length - 1)];
  const isLast = beatIndex === cutscene.beats.length - 1;
  const complete = () =>
    cutscene.id === 'finale' ? setSummaryVisible(true) : finish();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text variant="machine">
          {t('story.frame', {
            index: beatIndex + 1,
            total: cutscene.beats.length,
          })}
        </Text>
        <Button variant="ghost" size="s" onPress={complete}>
          {t('story.skipLink')}
        </Button>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.frame,
            { borderColor: theme.bezel, backgroundColor: theme.sceneInk },
          ]}
        >
          <Image
            key={beat.id}
            source={storyImage(
              beat.id,
              user.settings.robotSkin,
              user.robot.assembly.ears,
              user.robot.assembly.face,
            )}
            contentFit="contain"
            cachePolicy="disk"
            accessibilityLabel={t(
              `story.${cutscene.id}.descriptions.${beat.id}`,
            )}
            style={StyleSheet.absoluteFill}
          />
          {beat.id === 'fall' && (
            <Text
              variant="display"
              style={[styles.sound, { color: theme.coin }]}
            >
              А-а-а!
            </Text>
          )}
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: theme.surfaceLight,
                borderColor: theme.sceneInk,
              },
            ]}
          >
            <Text
              variant="subtitle"
              style={{ color: theme.sceneInk }}
              accessibilityLiveRegion="polite"
            >
              {t(`story.${cutscene.id}.beats.${beat.id}`, {
                name: user.robot.name,
                defaultValue: beat.caption,
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        {beatIndex > 0 && (
          <Button variant="ghost" onPress={() => setBeatIndex((i) => i - 1)}>
            {t('common.back')}
          </Button>
        )}
        <Button
          onPress={() => (isLast ? complete() : setBeatIndex((i) => i + 1))}
        >
          {t(isLast ? 'story.letsGo' : 'story.next')}
        </Button>
      </View>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({
  actions: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.TWO,
    maxWidth: MAX_CONTENT_WIDTH,
    padding: SPACING.COMPACT,
    width: '100%',
  },
  bubble: {
    position: 'absolute',
    bottom: SPACING.THREE,
    left: SPACING.THREE,
    right: SPACING.THREE,
    borderWidth: 2,
    borderRadius: 18,
    padding: SPACING.COMPACT,
  },
  frame: {
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 3,
    maxWidth: MAX_CONTENT_WIDTH,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.TWO,
    maxWidth: MAX_CONTENT_WIDTH,
    padding: SPACING.COMPACT,
    width: '100%',
  },
  root: { flex: 1 },
  scroll: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.COMPACT,
  },
  sound: {
    position: 'absolute',
    right: SPACING.THREE,
    bottom: '27%',
    transform: [{ rotate: '-8deg' }],
  },
});
