/** Plain object only — `typeof === 'object'` also matches `null` and arrays. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
