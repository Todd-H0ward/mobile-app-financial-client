// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type NounCategory = 'one' | 'few' | 'many';

/** The word as it follows a number. English only needs `one` and `many`. */
type NounForms = Partial<Record<NounCategory, string>>;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** "1 200" or "1 200" (from `formatMoney`) back to 1200 — the text itself is kept for display. */
const toNumber = (value: unknown): number =>
  typeof value === 'number'
    ? value
    : Number.parseFloat(
        String(value)
          .replace(/[^\d.,-]/g, '')
          .replace(',', '.'),
      );

/**
 * Russian agreement: 1, 21, 101 монета · 2–4, 22–24 монеты · 0, 5–20, 11–14 монет. A fraction
 * takes the genitive singular — "2,5 периода" — which is the `few` form. Hand-rolled rather
 * than `Intl.PluralRules`, so it does not depend on the engine's ICU data.
 */
const categoryFor = (count: number, language: string): NounCategory => {
  if (!Number.isFinite(count)) return 'many';
  const whole = Math.abs(count);
  if (!Number.isInteger(whole))
    return language.startsWith('ru') ? 'few' : 'many';
  if (!language.startsWith('ru')) return whole === 1 ? 'one' : 'many';

  const lastTwo = whole % 100;
  const last = whole % 10;
  if (last === 1 && lastTwo !== 11) return 'one';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'few';
  return 'many';
};

/** The number and the word in agreement with it: `21 монета`, `3 периода`, `1 coin`. */
export const formatNoun = (
  value: unknown,
  language: string,
  forms: NounForms,
): string => {
  const category = categoryFor(toNumber(value), language);
  const word = forms[category] ?? forms.many ?? forms.few ?? forms.one;
  return word ? `${String(value)} ${word}` : String(value);
};

export type { NounCategory, NounForms };
