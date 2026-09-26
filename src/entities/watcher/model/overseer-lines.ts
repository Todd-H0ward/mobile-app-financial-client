import type { WatcherLine } from './dialogue';

/**
 * The Overseer — chores and the arcade. Soft help lives with the Keeper.
 */
export const OVERSEER_LINES: WatcherLine[] = [
  {
    id: 'overseer-planning',
    textKey: 'watcher.overseer.challenge',
    priority: 10,
    condition: { phases: ['planning'] },
    actions: [
      {
        kind: 'page',
        page: 'trials',
        labelKey: 'watcher.terminal.menu.trials',
      },
    ],
  },
  {
    id: 'overseer-active-task',
    textKey: 'watcher.overseer.active_task',
    priority: 30,
    condition: { phases: ['active'], hasActiveTask: true },
    actions: [
      {
        kind: 'page',
        page: 'trials',
        labelKey: 'watcher.terminal.menu.trials',
      },
      {
        kind: 'page',
        page: 'arcade',
        labelKey: 'watcher.terminal.menu.arcade',
      },
    ],
  },
  {
    id: 'overseer-no-task',
    textKey: 'watcher.overseer.no_task',
    priority: 20,
    condition: { phases: ['active'], hasActiveTask: false },
    actions: [
      {
        kind: 'page',
        page: 'trials',
        labelKey: 'watcher.terminal.menu.trials',
      },
      {
        kind: 'page',
        page: 'arcade',
        labelKey: 'watcher.terminal.menu.arcade',
      },
    ],
  },
  {
    id: 'overseer-low-charge',
    textKey: 'watcher.overseer.low_charge',
    priority: 40,
    condition: { maxCharge: 0.3 },
    actions: [
      {
        kind: 'page',
        page: 'trials',
        labelKey: 'watcher.terminal.menu.trials',
      },
    ],
  },
  {
    id: 'default',
    textKey: 'watcher.overseer.default',
    priority: 0,
    condition: {},
    actions: [
      {
        kind: 'page',
        page: 'trials',
        labelKey: 'watcher.terminal.menu.trials',
      },
      {
        kind: 'page',
        page: 'arcade',
        labelKey: 'watcher.terminal.menu.arcade',
      },
    ],
  },
];
