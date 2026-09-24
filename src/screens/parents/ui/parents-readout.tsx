import { useTranslation } from '@/shared/i18n';

import type { ParentsStatus } from '../model';

import { Terminal } from './terminal';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ParentsReadoutProps {
  /** `null` with no profile — the purpose block still prints. */
  status: ParentsStatus | null;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** What the game teaches, in the order the child meets it — 2.5.12 asks for it. */
const PURPOSE_KEYS = ['plan', 'priority', 'save'] as const;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The top of the grown-ups' section: where the child is, in five lines, and
 * what the app is for.
 *
 * 2.5.12 asks the section to show the app's goals next to the progress; they
 * live here rather than in a card further down so a grown-up reads them first.
 * Nothing here judges the child — counts and names only.
 */
export const ParentsReadout = ({ status }: ParentsReadoutProps) => {
  const { t } = useTranslation();

  return (
    <Terminal label={t('parents.terminal.label')}>
      {status && (
        <>
          <Terminal.Line isPrompt order={0}>
            {t('parents.terminal.statusTitle')}
          </Terminal.Line>
          <Terminal.Row
            order={1}
            name={t('parents.terminal.player')}
            value={status.playerName}
          />
          <Terminal.Row
            order={2}
            name={t('parents.terminal.robot')}
            value={status.robotName || '—'}
          />
          <Terminal.Row
            order={3}
            name={t('parents.terminal.period')}
            value={String(status.periodIndex)}
          />
          <Terminal.Row
            order={4}
            name={t('parents.terminal.finished')}
            value={String(status.finishedPeriods)}
          />
          <Terminal.Row
            order={5}
            name={t('parents.terminal.tasks')}
            value={String(status.tasksDone)}
          />
          <Terminal.Rule />
        </>
      )}

      <Terminal.Line isPrompt order={6}>
        {t('parents.terminal.purposeTitle')}
      </Terminal.Line>
      {PURPOSE_KEYS.map((key, index) => (
        <Terminal.Line key={key} tone="dim" order={7 + index}>
          {`${index + 1}. ${t(`parents.terminal.purpose.${key}`)}`}
        </Terminal.Line>
      ))}
      <Terminal.Line tone="dim" order={10}>
        {t('parents.terminal.role')}
      </Terminal.Line>
    </Terminal>
  );
};

export type { ParentsReadoutProps };
