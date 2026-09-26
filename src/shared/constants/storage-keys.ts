export const STORAGE_KEYS = {
  /** The whole profile: robot, wallet, savings, period, history, bought items. */
  USER: '@app:user',
  /** Device preferences: theme and language. Neither profile nor game state. */
  PREFERENCES: '@app:preferences',
  /** Legacy pre-v9 lesson key, read only during migration and removed on delete. */
  LESSONS: '@app:lessons',
  /** Legacy pre-v9 score key, read only during migration and removed on delete. */
  ARCADE_SCORES: '@app:arcade-scores',
};
