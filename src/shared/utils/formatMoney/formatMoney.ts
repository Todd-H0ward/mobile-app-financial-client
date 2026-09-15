/**
 * Formats an amount of coins for display: groups thousands and keeps at most
 * two decimals. `12480` → `12 480`, `12.345` → `12,35`.
 *
 * The separator is a non-breaking space and the decimal mark is a comma, since
 * the amount is always rendered in the `ru-RU` locale — a balance must never
 * wrap mid-number. A non-finite input returns an empty string rather than
 * `NaN`, so a broken computation shows nothing instead of leaking into the UI.
 *
 * @example
 * formatMoney(248); // '248'
 * formatMoney(-26); // '-26'
 */
export const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`;
};
