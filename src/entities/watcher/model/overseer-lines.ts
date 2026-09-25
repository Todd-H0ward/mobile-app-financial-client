import type { WatcherLine } from './dialogue';

/**
 * The Overseer — chores and the arcade. Plan and workshop belong to the Keeper.
 */
export const OVERSEER_LINES: WatcherLine[] = [
  {
    id: 'overseer-planning',
    textKey: 'watcher.overseer.challenge',
    priority: 10,
    condition: { phases: ['planning'] },
    actions: [{ labelKey: 'action.tasks', route: '/tasks' }],
  },
  {
    id: 'overseer-active-task',
    textKey: 'watcher.overseer.active_task',
    priority: 30,
    condition: { phases: ['active'], hasActiveTask: true },
    actions: [
      { labelKey: 'action.tasks', route: '/tasks' },
      { labelKey: 'action.games', route: '/games' },
    ],
  },
  {
    id: 'overseer-no-task',
    textKey: 'watcher.overseer.no_task',
    priority: 20,
    condition: { phases: ['active'], hasActiveTask: false },
    actions: [
      { labelKey: 'action.tasks', route: '/tasks' },
      { labelKey: 'action.games', route: '/games' },
    ],
  },
  {
    id: 'overseer-low-charge',
    textKey: 'watcher.overseer.low_charge',
    priority: 40,
    condition: { maxCharge: 0.3 },
    actions: [{ labelKey: 'action.tasks', route: '/tasks' }],
  },
  {
    id: 'default',
    textKey: 'watcher.overseer.default',
    priority: 0,
    condition: {},
    actions: [{ labelKey: 'action.tasks', route: '/tasks' }],
  },
];
