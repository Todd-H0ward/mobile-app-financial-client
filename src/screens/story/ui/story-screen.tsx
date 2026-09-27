import { useState } from 'react';

import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_CONTENT_WIDTH, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  PixelIcon,
  RingsBackdrop,
  TerminalPanel,
  Text,
} from '@/shared/ui';

import { useStory } from '../model';

import { FinaleScreen } from './finale-screen';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Intro / finale cutscene (screen 03): the pit, subtitles in a terminal
 * below, a tap moves one frame on and "[ пропустить ]" is always visible.
 *
 * Until `assets/story/*.mp4` are wired, the beats of `content/story.json`
 * are the frames — the same exit a real video would use.
 */
export const StoryScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { cutscene, isAssetReady, isKnownId, finish } = useStory();
  const [beatIndex, setBeatIndex] = useState(0);

  if (!isKnownId || !cutscene) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  if (cutscene.id === 'finale') return <FinaleScreen onContinue={finish} />;

  const beats = cutscene.beats;
  const beat = beats[Math.min(beatIndex, beats.length - 1)];
  const isLast = beatIndex >= beats.length - 1;

  return (
    <View style={styles.root}>
      <RingsBackdrop centerY={0.55} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <View
            style={[styles.skip, { backgroundColor: theme.terminalScreen }]}
          >
            <Button variant="ghost" size="s" onPress={finish}>
              {t('story.skipLink')}
            </Button>
          </View>
        </View>

        <TerminalPanel frameStyle={styles.frame} style={styles.screen}>
          <Text variant="machine">
            {`> ${t('story.frame', {
              index: Math.min(beatIndex, beats.length - 1) + 1,
              total: beats.length,
            })}`}
          </Text>
          <Text style={styles.caption} accessibilityLiveRegion="polite">
            {isAssetReady
              ? t('story.videoReady')
              : beat
                ? t(`story.${cutscene.id}.beats.${beat.id}`, {
                    defaultValue: beat.caption,
                  })
                : t(`story.${cutscene.id}.title`, {
                    defaultValue: cutscene.title,
                  })}
          </Text>
          <View style={styles.footer}>
            <View style={styles.dots}>
              {beats.map((row, index) => (
                <View
                  key={row.id}
                  style={[
                    index === beatIndex ? styles.dotActive : styles.dot,
                    {
                      backgroundColor:
                        index === beatIndex
                          ? theme.phosphor
                          : theme.borderStrong,
                    },
                  ]}
                />
              ))}
            </View>
            <Button
              accessibilityLabel={t(isLast ? 'story.skip' : 'story.next')}
              onPress={() => (isLast ? finish() : setBeatIndex(beatIndex + 1))}
            >
              <PixelIcon name="arrow" tone="onAccent" />
            </Button>
          </View>
        </TerminalPanel>
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  caption: { fontSize: 18, lineHeight: 26 },
  dot: { borderRadius: 3, height: 6, width: 6 },
  dotActive: { borderRadius: 3, height: 6, width: 18 },
  dots: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frame: { alignSelf: 'center', maxWidth: MAX_CONTENT_WIDTH, width: '100%' },
  root: { flex: 1 },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.compact,
  },
  screen: { gap: SPACING.compact, padding: SPACING.three },
  skip: { borderRadius: 12 },
  top: { alignItems: 'flex-end' },
});
