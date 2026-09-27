import { useState } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import type { GateChallenge } from '@/entities/settings';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Screen, Text } from '@/shared/ui';

import { applyGateInput } from '../lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ParentGateProps {
  challenge: GateChallenge;
  onPass: () => void;
  onMiss: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Own keypad — system keyboard would jump the layout. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'erase', '0', 'ok'];
/** Second way in (2.5.12) — a long, deliberate hold. */
const HOLD_MS = 3000;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** No lockout / no stored PIN — stops wandering in, not an account (docs/privacy.md). */
export const ParentGate = ({ challenge, onPass, onMiss }: ParentGateProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [typed, setTyped] = useState('');
  const [isMissed, setIsMissed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  const question = t('parents.gate.question', {
    left: challenge.left,
    right: challenge.right,
  });

  const handleChange = (next: string) => {
    const result = applyGateInput(challenge, next);
    setTyped(result.typed);
    setIsMissed(result.isMissed);

    if (result.didPass) {
      onPass();
      return;
    }

    if (result.didMiss) {
      onMiss();
    }
  };

  const pressKey = (key: string) => {
    if (key === 'erase') {
      setTyped((current) => current.slice(0, -1));
      return;
    }
    if (key === 'ok') {
      // Short answer is a full try too: clear and ask a new sum.
      if (typed.length === 0) return;
      setTyped('');
      setIsMissed(true);
      onMiss();
      return;
    }
    handleChange(typed + key);
  };

  return (
    <Screen gap={SPACING.COMPACT} terminalVariant="adult">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label voice="adult">{t('parents.gate.label')}</Screen.Label>
          <Screen.Title>{t('parents.gate.heading')}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <Text themeColor="textSecondary">{t('parents.gate.leadKeypad')}</Text>

      <View
        accessible
        accessibilityLabel={`${question} ${typed}`}
        accessibilityLiveRegion="polite"
        style={[styles.sumBox, { borderColor: theme.border }]}
      >
        <Text variant="code" style={styles.sumText}>
          {`${challenge.left} × ${challenge.right} =`}
        </Text>
        <View
          style={[
            styles.answer,
            { borderColor: isMissed ? theme.warning : theme.phosphor },
          ]}
        >
          <Text variant="machine" style={styles.answerText}>
            {`${typed}_`}
          </Text>
        </View>
      </View>

      <View style={styles.feedback} accessibilityLiveRegion="polite">
        {isMissed ? (
          <Text variant="small" themeColor="warning">
            {`! ${t('parents.gate.miss')}`}
          </Text>
        ) : null}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={
              key === 'erase'
                ? t('parents.gate.erase')
                : key === 'ok'
                  ? t('parents.gate.ok')
                  : key
            }
            onPress={() => pressKey(key)}
            style={({ pressed }) => [
              styles.key,
              {
                backgroundColor: pressed ? theme.surfaceSoft : undefined,
                borderColor: theme.border,
              },
            ]}
          >
            <Text variant="code" style={styles.keyText}>
              {key === 'erase' ? '⌫' : key === 'ok' ? 'OK' : key}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('parents.gate.hold')}
        delayLongPress={HOLD_MS}
        onPressIn={() => setIsHolding(true)}
        onPressOut={() => setIsHolding(false)}
        onLongPress={onPass}
        style={[
          styles.hold,
          {
            backgroundColor: isHolding ? theme.surfaceSoft : undefined,
            borderColor: theme.borderStrong,
          },
        ]}
      >
        <Text variant="bodyBold" themeColor="textSecondary">
          {isHolding ? t('parents.gate.holding') : t('parents.gate.hold')}
        </Text>
      </Pressable>

      <Text variant="small" themeColor="textMuted">
        {t('parents.gate.note')}
      </Text>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  answer: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 72,
    paddingHorizontal: SPACING.TWO,
  },
  answerText: { fontSize: 28, lineHeight: 36 },
  feedback: { minHeight: 20 },
  hold: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderStyle: 'dashed',
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 52,
  },
  key: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    flexBasis: '30%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 56,
  },
  keyText: { fontFamily: FONTS.monoStrong, fontSize: 20, lineHeight: 26 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.TWO },
  sumBox: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.COMPACT,
    justifyContent: 'center',
    paddingVertical: SPACING.COMPACT,
  },
  sumText: { fontFamily: FONTS.monoStrong, fontSize: 32, lineHeight: 40 },
});

export type { ParentGateProps };
