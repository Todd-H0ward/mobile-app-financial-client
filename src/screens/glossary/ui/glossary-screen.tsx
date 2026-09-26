import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { ListRow, Screen, Sheet } from '@/shared/ui';

import { useGlossary } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Child-facing glossary — terms from `content/glossary.json` (2.5.11).
 */
export const GlossaryScreen = () => {
  const { t } = useTranslation();
  const { terms } = useGlossary();
  const [openId, setOpenId] = useState<string | null>(null);

  const open = terms.find((term) => term.id === openId) ?? null;

  return (
    <Screen gap="three">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('glossary.title')}</Screen.Title>
          <Screen.Subtitle>{t('glossary.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="glossary" />
      </Screen.Header>

      <View style={styles.list}>
        {terms.map((term) => {
          const title = t(`glossary.terms.${term.id}.title`, {
            defaultValue: term.title,
          });
          return (
            <ListRow
              key={term.id}
              title={title}
              onPress={() => setOpenId(term.id)}
            />
          );
        })}
      </View>

      <Sheet.Modal isVisible={open != null} onClose={() => setOpenId(null)}>
        <Sheet.Title>
          {open
            ? t(`glossary.terms.${open.id}.title`, {
                defaultValue: open.title,
              })
            : ''}
        </Sheet.Title>
        <Sheet.Description>
          {open
            ? t(`glossary.terms.${open.id}.definition`, {
                defaultValue: open.definition,
              })
            : ''}
        </Sheet.Description>
      </Sheet.Modal>
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
