import { createElement } from 'react';

import { describe, expect, it } from 'vitest';

import { isTextOnly } from './isTextOnly';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

const element = createElement('span', null, 'иконка');

describe('isTextOnly', () => {
  it('sees a plain string', () => {
    expect(isTextOnly('Купить')).toBe(true);
  });

  it('sees an interpolated string — the case that crashed the button', () => {
    expect(isTextOnly(['Размер ', 'L'])).toBe(true);
  });

  it('counts a number as text', () => {
    expect(isTextOnly(42)).toBe(true);
    expect(isTextOnly(['Осталось ', 15])).toBe(true);
  });

  it('rejects an element', () => {
    expect(isTextOnly(element)).toBe(false);
  });

  it('rejects text mixed with an element', () => {
    expect(isTextOnly([element, 'Купить'])).toBe(false);
  });

  it('ignores the children React drops itself', () => {
    expect(isTextOnly([null, 'Купить', undefined, false])).toBe(true);
  });

  it('treats empty children as text — an empty label is not a crash', () => {
    expect(isTextOnly(null)).toBe(true);
    expect(isTextOnly([])).toBe(true);
  });
});
