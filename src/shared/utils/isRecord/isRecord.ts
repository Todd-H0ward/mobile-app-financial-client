/**
 * Whether a value is a plain object that can be indexed by string.
 *
 * `typeof value === 'object'` alone is not enough: `null` and every array pass
 * it, and both then blow up (or silently lie) the moment a field is read. The
 * usual caller is a parser of something that came from outside the app —
 * storage, a file, a response — where "it is an object" has to be proven before
 * anything is read off it.
 *
 * @example
 * isRecord(JSON.parse(raw)); // false for `null`, `[]`, `7`, `"{}"`
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
