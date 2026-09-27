import { ScrollView, StyleSheet } from 'react-native';

import type { WatcherDialogAction, WatcherLine } from '@/entities/watcher';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, PixelIcon, type PixelIconName } from '@/shared/ui';

import {
  TerminalCard,
  type TerminalFrame,
  TerminalMenu,
  TerminalMenuRow,
  TerminalShell,
  TerminalText,
} from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GreetingPageProps {
  frame: TerminalFrame;
  line: WatcherLine;
  onAction: (action: WatcherDialogAction) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PAGE_ICON: Record<string, PixelIconName> = {
  plan: 'plan',
  shop: 'wrench',
  jar: 'piggy',
  report: 'plan',
  trials: 'face',
  arcade: 'coin',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const iconFor = (action: WatcherDialogAction): PixelIconName | undefined => {
  if (action.kind === 'page') return PAGE_ICON[action.page];
  if (action.route.includes('history')) return 'clock';
  if (action.route.includes('glossary')) return 'book';
  if (action.route.includes('end-period')) return 'check';
  return undefined;
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The watcher's own menu (screen 08): the situational line in a frame, then
 * one list of everything this watcher can open. The cross closes the talk.
 */
export const GreetingPage = ({ frame, line, onAction }: GreetingPageProps) => {
  const { t } = useTranslation();
  const page =
    frame.watcher === 'overseer' ? 'greetingOverseer' : 'greetingKeeper';

  return (
    <TerminalShell
      {...frame}
      label={t(`watcher.terminal.pages.${page}.label`)}
      title={t(`watcher.terminal.pages.${page}.title`)}
      trailing={
        <Button
          variant="icon"
          accessibilityLabel={t('common.close')}
          onPress={frame.onLeave}
        >
          <PixelIcon name="close" />
        </Button>
      }
    >
      <ScrollView contentContainerStyle={styles.stack}>
        <TerminalCard>
          <TerminalText>{t(line.textKey)}</TerminalText>
        </TerminalCard>
        <TerminalMenu>
          {line.actions.map((action) => (
            <TerminalMenuRow
              key={
                action.kind === 'page'
                  ? `page-${action.page}`
                  : `route-${action.route}`
              }
              icon={iconFor(action)}
              label={t(action.labelKey)}
              onPress={() => onAction(action)}
            />
          ))}
        </TerminalMenu>
      </ScrollView>
    </TerminalShell>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: SPACING.two, paddingBottom: SPACING.two },
});

export type { GreetingPageProps };
