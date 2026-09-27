import type { UserSave } from '@/entities/user';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** How the display formats before/after numbers. */
type ChangeFormat = 'money' | 'percent' | 'count';

/** One measurable delta — numbers only; UI i18ns `labelKey`. */
interface ChangeLine {
  id: string;
  /** i18n key, usually `feedback.metrics.*`. */
  labelKey: string;
  before: number;
  after: number;
  format: ChangeFormat;
}

/** Picks title / default why keys. */
type FeedbackAction = 'purchase' | 'deposit' | 'withdraw' | 'task' | 'plan';

/** Snapshot for diffs — via `snapshotUser`, not the full profile. */
interface FeedbackSnapshot {
  balance: number;
  savingsTotal: number;
  factNeeds: number;
  factWants: number;
  factSavings: number;
  /** 0…1 */
  charge: number;
  /** 0…1 */
  spirit: number;
  /** Owned catalogue items. */
  ownedCount: number;
}

interface DescribeChangeInput {
  before: FeedbackSnapshot;
  after: FeedbackSnapshot;
  action: FeedbackAction;
  /** Content-authored why; wins over `whyKey` when set. */
  whyText?: string;
  /** Override default `feedback.why.<action>`. */
  whyKey?: string;
  /** Title / why interpolation params. */
  params?: Record<string, string | number>;
  /** Coins over plan on purchase — switches why to `purchaseOverPlan` when > 0. */
  overPlanBy?: number;
}

/** «Что изменилось» report — pure, no i18n/UI (2.5.9). */
interface FeedbackReport {
  action: FeedbackAction;
  titleKey: string;
  /** Null when `whyText` is used. */
  whyKey: string | null;
  whyText: string | null;
  params: Record<string, string | number>;
  /** Only lines that moved. */
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

/** Diff snapshots into readable lines; why comes from action context only. */
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
