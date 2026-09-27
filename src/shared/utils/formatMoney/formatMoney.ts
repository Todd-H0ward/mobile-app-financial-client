/** `ru-RU` with NBSP grouping; non-finite → '' so NaN never reaches the UI. */
export const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`;
};
