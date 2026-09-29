import { Fragment } from 'react';

import { StyleSheet, View } from 'react-native';

import type { FinanceArt } from '@/entities/minigame/finance';
import { Sprite } from '@/entities/sprite/ui';

import { SPACING } from '@/shared/constants';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface QuestionArtProps {
  art: readonly FinanceArt[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** A row wider than this wraps on a phone; the count is in the text anyway. */
const MAX_COPIES = 6;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** The question drawn: groups of sprites joined by a plus. Decorative. */
export const QuestionArt = ({ art }: QuestionArtProps) => {
  return (
    <View
      style={styles.root}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {art.map((group, index) => (
        <Fragment key={`${group.sprite}-${index}`}>
          {index > 0 ? <Text variant="subtitle">+</Text> : null}
          <View style={styles.group}>
            {Array.from(
              { length: Math.min(MAX_COPIES, group.count) },
              (_, copy) => (
                <Sprite key={copy} name={group.sprite} size={40} />
              ),
            )}
          </View>
        </Fragment>
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: SPACING.HALF,
  },
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
    justifyContent: 'center',
  },
});

export type { QuestionArtProps };
