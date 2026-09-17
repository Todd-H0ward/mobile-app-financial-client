import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Sheet, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import type { FeedbackReport } from '../lib';

import { ChangeRow } from './change-row';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface FeedbackSheetProps {
  report: FeedbackReport | null;
  isVisible: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Params may carry raw coin amounts — format money-looking keys so the
 * child never sees a bare "48" where a coin total belongs.
 */
const formatParams = (
  params: Record<string, string | number>,
): Record<string, string | number> => {
  const next: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      typeof value === 'number' &&
      (key === 'amount' ||
        key === 'reward' ||
        key === 'over' ||
        key === 'price' ||
        key === 'balance' ||
        key === 'needs' ||
        key === 'wants' ||
        key === 'savings')
    ) {
      next[key] = formatMoney(value);
    } else {
      next[key] = value;
    }
  }
  return next;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * «Что изменилось и почему» after an action — 2.5.9 / roadmap 1.18.
 *
 * Numbers side by side, then the rule named. Never shame, never a wipe.
 */
export const FeedbackSheet = ({
  report,
  isVisible,
  onClose,
}: FeedbackSheetProps) => {
  const { t } = useTranslation();

  if (!report || !isVisible) return null;

  const params = formatParams(report.params);
  const why =
    report.whyText ?? (report.whyKey ? t(report.whyKey, params) : null);

  return (
    <Sheet.Modal isVisible onClose={onClose}>
      <Sheet.Title>{t(report.titleKey, params)}</Sheet.Title>

      {report.changes.length > 0 ? (
        <View style={styles.changes}>
          <Text variant="bodyBold">{t('feedback.whatChanged')}</Text>
          {report.changes.map((line) => (
            <ChangeRow key={line.id} line={line} />
          ))}
        </View>
      ) : null}

      {why ? (
        <View style={styles.why}>
          <Text variant="bodyBold">{t('feedback.whyHeading')}</Text>
          <Sheet.Description>{why}</Sheet.Description>
        </View>
      ) : null}

      <Sheet.Actions>
        <Button variant="primary" isFullWidth onPress={onClose}>
          {t('feedback.close')}
        </Button>
      </Sheet.Actions>
    </Sheet.Modal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  changes: {
    gap: SPACING.two,
    width: '100%',
  },
  why: {
    gap: SPACING.one,
    width: '100%',
  },
});

export type { FeedbackSheetProps };
