/**
 * A name as it goes into the save: outer spaces gone, inner runs collapsed,
 * length capped.
 *
 * The rule is the same wherever a child invents a name — for themselves, for
 * the pet — so it lives here once and each slice brings only its own limit.
 * Framework-agnostic and domain-free: it knows about strings, not about pets.
 *
 * @param raw raw input string
 * @param maxLength longest result, in characters
 *
 * @example
 * normalizeName('  Мур   зик ', 12); // 'Мур зик'
 */
export const normalizeName = (raw: string, maxLength: number): string =>
  raw.trim().replace(/\s+/g, ' ').slice(0, maxLength);
