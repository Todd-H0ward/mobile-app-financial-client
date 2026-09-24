import type { UserSave } from '@/entities/user';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** How the display formats before/after numbers. */
type ChangeFormat = 'money' | 'percent' | 'count';

/**
 * One measurable thing that moved — numbers only, never copy.
 * The UI maps `labelKey` through i18n.
 */
interface ChangeLine {
  id: string;
  /** i18n key, usually `feedback.metrics.*`. */
  labelKey: string;
  before: number;
  after: number;
  format: ChangeFormat;
}

/** What the child just did — picks the title / default why keys. */
type FeedbackAction = 'purchase' | 'deposit' | 'withdraw' | 'task' | 'plan';

/**
 * Numbers `describeChange` cares about. Built from a save via `snapshotUser`
 * so the helper stays free of the full profile shape.
 */
interface FeedbackSnapshot {
  balance: number;
  savingsTotal: number;
  factNeeds: number;
  factWants: number;
  factSavings: number;
  /** Robot charge 0…1. */
  charge: number;
  /** Robot spirit 0…1. */
  spirit: number;
  /** How many bought items the child owns — toys, the console. */
  ownedCount: number;
}

interface DescribeChangeInput {
  before: FeedbackSnapshot;
  after: FeedbackSnapshot;
  action: FeedbackAction;
  /**
   * Ready-made why text from content (task explanation, item influence).
   * Wins over `whyKey` when set.
   */
  whyText?: string;
  /** Override the default `feedback.why.<action>` key. */
  whyKey?: string;
  /** Params for title / why interpolation (item name, reward, …). */
  params?: Record<string, string | number>;
  /**
   * Purchase pushed fact over plan by this many coins — switches the why
   * key to `purchaseOverPlan` when > 0.
   */
  overPlanBy?: number;
}

/**
 * Structured «что изменилось и почему» — 2.5.9 / roadmap 1.18.
 * Pure: no i18n, no UI.
 */
interface FeedbackReport {
  action: FeedbackAction;
  titleKey: string;
  /** i18n key for the why paragraph, or null when `whyText` is used. */
  whyKey: string | null;
  /** Content-authored why, when the catalogue / task already wrote it. */
  whyText: string | null;
  params: Record<string, string | number>;
  /** Only lines that actually moved. */
  changes: ChangeLine[];
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const pushIfChanged = (
  lines: ChangeLine[],
  line: Omit<ChangeLine, 'before' | 'after'> & {
    before: number;
    after: number;
  },
): void => {
  if (line.before === line.after) return;
  lines.push(line);
};

const defaultWhyKey = (action: FeedbackAction, overPlanBy: number): string => {
  if (action === 'purchase' && overPlanBy > 0) {
    return 'feedback.why.purchaseOverPlan';
  }
  return `feedback.why.${action}`;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export const snapshotUser = (user: UserSave): FeedbackSnapshot => ({
  balance: user.wallet.balance,
  savingsTotal: user.savings.goals.reduce((sum, row) => sum + row.saved, 0),
  factNeeds: user.period.fact.needs,
  factWants: user.period.fact.wants,
  factSavings: user.period.fact.savings,
  charge: user.robot.charge,
  spirit: user.robot.spirit,
  ownedCount: user.ownedItemIds.length,
});

/**
 * Diffs two snapshots into the lines a child can read: balance, jar, fact,
 * charge, spirit, owned items. The why comes from the action context —
 * never invented here.
 */
export const describeChange = (input: DescribeChangeInput): FeedbackReport => {
  const { before, after, action } = input;
  const params = { ...(input.params ?? {}) };
  if (input.overPlanBy != null && input.overPlanBy > 0) {
    params.over = input.overPlanBy;
  }

  const changes: ChangeLine[] = [];

  pushIfChanged(changes, {
    id: 'balance',
    labelKey: 'feedback.metrics.balance',
    before: before.balance,
    after: after.balance,
    format: 'money',
  });

  pushIfChanged(changes, {
    id: 'savings',
    labelKey: 'feedback.metrics.savings',
    before: before.savingsTotal,
    after: after.savingsTotal,
    format: 'money',
  });

  pushIfChanged(changes, {
    id: 'factNeeds',
    labelKey: 'feedback.metrics.factNeeds',
    before: before.factNeeds,
    after: after.factNeeds,
    format: 'money',
  });

  pushIfChanged(changes, {
    id: 'factWants',
    labelKey: 'feedback.metrics.factWants',
    before: before.factWants,
    after: after.factWants,
    format: 'money',
  });

  pushIfChanged(changes, {
    id: 'factSavings',
    labelKey: 'feedback.metrics.factSavings',
    before: before.factSavings,
    after: after.factSavings,
    format: 'money',
  });

  pushIfChanged(changes, {
    id: 'charge',
    labelKey: 'feedback.metrics.charge',
    before: before.charge,
    after: after.charge,
    format: 'percent',
  });

  pushIfChanged(changes, {
    id: 'spirit',
    labelKey: 'feedback.metrics.spirit',
    before: before.spirit,
    after: after.spirit,
    format: 'percent',
  });

  pushIfChanged(changes, {
    id: 'owned',
    labelKey: 'feedback.metrics.owned',
    before: before.ownedCount,
    after: after.ownedCount,
    format: 'count',
  });

  const whyText = input.whyText?.trim() ? input.whyText.trim() : null;
  const whyKey = whyText
    ? null
    : (input.whyKey ?? defaultWhyKey(action, input.overPlanBy ?? 0));

  return {
    action,
    titleKey: `feedback.title.${action}`,
    whyKey,
    whyText,
    params,
    changes,
  };
};

export type {
  ChangeFormat,
  ChangeLine,
  DescribeChangeInput,
  FeedbackAction,
  FeedbackReport,
  FeedbackSnapshot,
};
