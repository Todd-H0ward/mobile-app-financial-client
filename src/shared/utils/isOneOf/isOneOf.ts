/**
 * Whether a value is one of the allowed strings, narrowing it to that union.
 *
 * The guard to reach for whenever an enum-shaped value arrives from outside the
 * app — a save, a content file, a remote response. A plain `typeof === 'string'`
 * check would let `phase: "banana"` through to the screens, which is exactly the
 * crash this prevents; the narrowing then lets the value be used as the union
 * without a cast.
 *
 * @example
 * isOneOf(value, PERIOD_PHASES); // value is PeriodPhase
 */
export const isOneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value);
