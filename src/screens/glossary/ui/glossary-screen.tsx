import { useState } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { PixelIcon, type PixelIconName, Screen, Text } from '@/shared/ui';

import { useGlossary } from '../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** A word tied to a sign in the game wears that sign. */
const TERM_ICON: Record<string, PixelIconName> = {
  plan: 'plan',
  needs: 'battery',
  wants: 'gear',
  savings: 'piggy',
  goal: 'piggy',
  balance: 'coin',
  period: 'clock',
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Child-facing glossary — terms from `content/glossary.json` (2.5.11).
 * Screen 15: a word opens in place, so the list never loses its reader.
 */
export const GlossaryScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { terms } = useGlossary();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Screen presentation="sheet" gap="compact">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label>{t('glossary.label')}</Screen.Label>
          <Screen.Title>{t('glossary.wordsTitle')}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="glossary" />
      </Screen.Header>

      <View style={styles.list}>
        {terms.map((term) => {
          const title = t(`glossary.terms.${term.id}.title`, {
            defaultValue: term.title,
          });
          const isOpen = term.id === openId;
          const icon = TERM_ICON[term.id];
          return (
            <Pressable
              key={term.id}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityHint={t('glossary.expandA11y')}
              onPress={() => setOpenId(isOpen ? null : term.id)}
              style={({ pressed }) => [
                styles.term,
                {
                  backgroundColor: pressed ? theme.surfaceSoft : theme.surface,
                  borderColor: isOpen ? theme.phosphor : theme.border,
                },
              ]}
            >
              <View style={styles.termHead}>
                {icon ? (
                  <PixelIcon
                    name={icon}
                    tone={icon === 'coin' ? 'coin' : 'phosphor'}
                  />
                ) : null}
                <Text variant="bodyBold" style={styles.termTitle}>
                  {title}
                </Text>
                <Text variant="machine">{isOpen ? '−' : '+'}</Text>
              </View>
              {isOpen ? (
                <Text themeColor="textSecondary">
                  {t(`glossary.terms.${term.id}.definition`, {
                    defaultValue: term.definition,
                  })}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
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
  term: {
    borderRadius: RADII.m,
    borderWidth: 2,
    gap: SPACING.two,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: SPACING.compact,
  },
  termHead: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  termTitle: { flex: 1 },
});
