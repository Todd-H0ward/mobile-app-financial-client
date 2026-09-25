import type { WatcherLine } from './dialogue';

/**
 * The Keeper — plan, workshop and closing the day. Chores belong to the Overseer.
 */
export const KEEPER_LINES: WatcherLine[] = [
  {
    id: 'keeper-plan',
    textKey: 'watcher.keeper.plan',
    priority: 40,
    condition: { phases: ['planning'] },
    actions: [{ labelKey: 'action.budget_plan', route: '/budget-plan' }],
  },
  {
    id: 'keeper-active',
    textKey: 'watcher.keeper.shop',
    priority: 20,
    condition: { phases: ['active'] },
    actions: [
      { labelKey: 'action.shop', route: '/shop' },
      { labelKey: 'action.end_period', route: '/end-period' },
    ],
  },
  {
    id: 'keeper-low-charge',
    textKey: 'watcher.keeper.low_charge',
    priority: 35,
    condition: { phases: ['active'], maxCharge: 0.3 },
    actions: [
      { labelKey: 'action.shop', route: '/shop' },
      { labelKey: 'action.end_period', route: '/end-period' },
    ],
  },
  {
    id: 'keeper-needs-unmet',
    textKey: 'watcher.keeper.needs_unmet',
    priority: 30,
    condition: { phases: ['active'], areNeedsMet: false },
    actions: [
      { labelKey: 'action.shop', route: '/shop' },
      { labelKey: 'action.end_period', route: '/end-period' },
    ],
  },
  {
    id: 'keeper-report',
    textKey: 'watcher.keeper.report',
    priority: 50,
    condition: { phases: ['summary'] },
    actions: [{ labelKey: 'action.period_summary', route: '/period-summary' }],
  },
  {
    id: 'default',
    textKey: 'watcher.keeper.default',
    priority: 0,
    condition: {},
    actions: [
      { labelKey: 'action.budget_plan', route: '/budget-plan' },
      { labelKey: 'action.shop', route: '/shop' },
    ],
  },
];
