import type { WatcherLine } from './dialogue';

/**
 * The Keeper — plan, jar, workshop, day close and the report.
 *
 * Actions open terminal pages; chores and the arcade belong to the Overseer.
 */
export const KEEPER_LINES: WatcherLine[] = [
  {
    id: 'keeper-plan',
    textKey: 'watcher.keeper.plan',
    priority: 40,
    condition: { phases: ['planning'] },
    actions: [
      { kind: 'page', page: 'plan', labelKey: 'watcher.terminal.menu.plan' },
      { kind: 'page', page: 'jar', labelKey: 'watcher.terminal.menu.jar' },
    ],
  },
  {
    id: 'keeper-active',
    textKey: 'watcher.keeper.shop',
    priority: 20,
    condition: { phases: ['active'] },
    actions: [
      { kind: 'page', page: 'shop', labelKey: 'watcher.terminal.menu.shop' },
      { kind: 'page', page: 'jar', labelKey: 'watcher.terminal.menu.jar' },
      {
        kind: 'route',
        route: '/end-period',
        labelKey: 'action.end_period',
      },
    ],
  },
  {
    id: 'keeper-low-charge',
    textKey: 'watcher.keeper.low_charge',
    priority: 35,
    condition: { phases: ['active'], maxCharge: 0.3 },
    actions: [
      { kind: 'page', page: 'shop', labelKey: 'watcher.terminal.menu.shop' },
      { kind: 'page', page: 'jar', labelKey: 'watcher.terminal.menu.jar' },
      {
        kind: 'route',
        route: '/end-period',
        labelKey: 'action.end_period',
      },
    ],
  },
  {
    id: 'keeper-needs-unmet',
    textKey: 'watcher.keeper.needs_unmet',
    priority: 30,
    condition: { phases: ['active'], areNeedsMet: false },
    actions: [
      { kind: 'page', page: 'shop', labelKey: 'watcher.terminal.menu.shop' },
      { kind: 'page', page: 'jar', labelKey: 'watcher.terminal.menu.jar' },
      {
        kind: 'route',
        route: '/end-period',
        labelKey: 'action.end_period',
      },
    ],
  },
  {
    id: 'keeper-report',
    textKey: 'watcher.keeper.report',
    priority: 50,
    condition: { phases: ['summary'] },
    actions: [
      {
        kind: 'page',
        page: 'report',
        labelKey: 'watcher.terminal.menu.report',
      },
      {
        kind: 'route',
        route: '/history',
        labelKey: 'action.history',
      },
    ],
  },
  {
    id: 'default',
    textKey: 'watcher.keeper.default',
    priority: 0,
    condition: {},
    actions: [
      { kind: 'page', page: 'plan', labelKey: 'watcher.terminal.menu.plan' },
      { kind: 'page', page: 'shop', labelKey: 'watcher.terminal.menu.shop' },
      { kind: 'page', page: 'jar', labelKey: 'watcher.terminal.menu.jar' },
      {
        kind: 'page',
        page: 'report',
        labelKey: 'watcher.terminal.menu.report',
      },
    ],
  },
];
