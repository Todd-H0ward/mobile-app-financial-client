/**
 * Whether a value is a non-empty string.
 *
 * Use this to rule out `undefined`, `null`, numbers and the empty string
 * in one guard — the usual need when parsing data that came from outside
 * the app (storage, a file, a remote response) where both the type and
 * the content have to be proven before the value is used.
 *
 * @example
 * isNonEmptyString('hello'); // true
 * isNonEmptyString('');      // false
 * isNonEmptyString(42);      // false
 */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;
