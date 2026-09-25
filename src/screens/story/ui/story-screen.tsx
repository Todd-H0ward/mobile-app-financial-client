import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SPACING, STATIC_ROUTES, TERMINAL } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Text } from '@/shared/ui';

import { useStory } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Intro / finale cutscene slot.
 *
 * Until `assets/story/*.mp4` are wired, shows the caption beats from
 * `content/story.json` on a dark frame — skippable, same exit as a real
 * video would use.
 */
export const StoryScreen = () => {
  const { t } = useTranslation();
  const { cutscene, isAssetReady, isKnownId, finish } = useStory();

  if (!isKnownId || !cutscene) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen gap="three">
      <Screen.Header>
        <Screen.Heading>
          <Screen.Title>
            {t(`story.${cutscene.id}.title`, {
              defaultValue: cutscene.title,
            })}
          </Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <View style={styles.frame} accessibilityRole="image">
        {isAssetReady ? (
          <Text themeColor="textSecondary">{t('story.videoReady')}</Text>
        ) : (
          <View style={styles.stack}>
            <Text variant="small" themeColor="textSecondary">
              {t('story.placeholder')}
            </Text>
            {cutscene.beats.map((beat) => (
              <Text key={beat.id}>
                {t(`story.${cutscene.id}.beats.${beat.id}`, {
                  defaultValue: beat.caption,
                })}
              </Text>
            ))}
          </View>
        )}
      </View>

      <Button isFullWidth onPress={finish}>
        {t('story.skip')}
      </Button>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  frame: {
    backgroundColor: TERMINAL.void,
    borderRadius: 16,
    flex: 1,
    gap: SPACING.two,
    justifyContent: 'center',
    padding: SPACING.three,
  },
  stack: {
    gap: SPACING.two,
  },
});
