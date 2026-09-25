import type { PeriodPhase } from '@/entities/user';

interface WatcherLineCondition {
  /** Period phases where this line is shown. Empty = any phase. */
  phases?: PeriodPhase[];
  /** Min charge threshold (0…1). */
  minCharge?: number;
  /** Max charge threshold (0…1). */
  maxCharge?: number;
  /** Whether there's an active task. */
  hasActiveTask?: boolean;
  /** Whether needs are met in budget. */
  areNeedsMet?: boolean;
}

interface WatcherDialogAction {
  /** i18n key for button text. */
  labelKey: string;
  /** Route to navigate to. */
  route: string;
}

interface WatcherLine {
  /** Unique line id. */
  id: string;
  /** i18n key for the line text. */
  textKey: string;
  /** Priority: higher = preferred when multiple match (0-100). */
  priority: number;
  /** When this line should appear. */
  condition: WatcherLineCondition;
  /** Actions available with this line. */
  actions: WatcherDialogAction[];
}

interface WatcherGameState {
  /** Current period phase. */
  phase: PeriodPhase;
  /** Current charge (0…1). */
  charge: number;
  /** Current spirit (0…1). */
  spirit: number;
  /** Whether there's an active task. */
  hasActiveTask: boolean;
  /** Whether needs are met in budget. */
  areNeedsMet: boolean;
  /** Current balance. */
  balance: number;
  /** Current period index. */
  periodIndex: number;
  /** Current platform level. */
  platformLevel: number;
  /** Current module tier. */
  moduleTier: number;
}

export type {
  WatcherDialogAction,
  WatcherGameState,
  WatcherLine,
  WatcherLineCondition,
};
