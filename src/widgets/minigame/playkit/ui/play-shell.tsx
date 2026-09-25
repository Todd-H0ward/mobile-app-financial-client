import type { ReactNode } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTS, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Sheet, Text, ThemedView } from '@/shared/ui';

import {
  RoundLamps,
  TrialCursor,
  TrialReadout,
  TrialScanlines,
} from './trial-chrome';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PlayShellProps {
  title: string;
  round: number;
  hint: string;
  children: ReactNode;
  action: string;
  onAction: () => void;
  isDisabled?: boolean;
}

interface PlayDebriefProps {
  isVisible: boolean;
  summary: string;
  explanation: string;
  onClose: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Overseer trial bay — full-bleed red CRT, not the warm room Screen.
 *
 * The face of the evil AI is the machine: scanlines, mono type, lamp rounds.
 */
export const PlayShell = ({
  title,
  round,
  hint,
  children,
  action,
  onAction,
  isDisabled,
}: PlayShellProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ThemedView
      variant="background"
      style={[
        styles.root,
        {
          backgroundColor: theme.overseerScreen,
          paddingTop: insets.top + SPACING.two,
          paddingBottom: insets.bottom + SPACING.two,
        },
      ]}
    >
      <TrialScanlines />
      <View style={styles.chrome}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backHit}
          >
            <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
              {t('playkit.ui.abort')}
            </Text>
          </Pressable>
          <RoundLamps round={round} />
        </View>

        <TrialReadout isPrompt>
          {t('playkit.ui.channel', { title })}
        </TrialReadout>
        <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
          {t('financeGame.round', { round: Math.min(3, round + 1) })}
        </Text>
        <Text style={[styles.hint, { color: theme.overseerLcd }]}>{hint}</Text>

        <View style={styles.stage}>{children}</View>

        <Pressable
          accessibilityRole="button"
          disabled={isDisabled}
          onPress={onAction}
          style={({ pressed }) => [
            styles.commit,
            {
              borderColor: isDisabled
                ? theme.overseerLcdDim
                : theme.overseerLcd,
              opacity: isDisabled ? 0.45 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.commitLabel, { color: theme.overseerLcd }]}>
            {`> ${action}`}
          </Text>
          {!isDisabled ? <TrialCursor /> : null}
        </Pressable>
      </View>
    </ThemedView>
  );
};

export const PlayDebrief = ({
  isVisible,
  summary,
  explanation,
  onClose,
}: PlayDebriefProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Sheet.Modal isVisible={isVisible} isDismissible={false} onClose={onClose}>
      <View
        style={[
          styles.debrief,
          {
            backgroundColor: theme.overseerScreen,
            borderColor: theme.overseerLcdDim,
          },
        ]}
      >
        <Text style={[styles.debriefTitle, { color: theme.overseerLcd }]}>
          {t('playkit.ui.debrief')}
        </Text>
        <Text style={[styles.mono, { color: theme.overseerLcd }]}>
          {summary}
        </Text>
        <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
          {explanation}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={[styles.commit, { borderColor: theme.overseerLcd }]}
        >
          <Text style={[styles.commitLabel, { color: theme.overseerLcd }]}>
            {`> ${t('financeGame.understood')}`}
          </Text>
          <TrialCursor />
        </Pressable>
      </View>
    </Sheet.Modal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  backHit: { minHeight: 44, justifyContent: 'center' },
  chrome: {
    flex: 1,
    gap: SPACING.two,
    paddingHorizontal: SPACING.three,
    zIndex: 1,
  },
  commit: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.one,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: SPACING.three,
  },
  commitLabel: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  debrief: {
    borderRadius: 8,
    borderWidth: 2,
    gap: SPACING.two,
    padding: SPACING.three,
  },
  debriefTitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hint: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 18,
  },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 20,
  },
  monoDim: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 1,
  },
  root: { flex: 1 },
  stage: { flex: 1, minHeight: 240 },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export type { PlayDebriefProps, PlayShellProps };
