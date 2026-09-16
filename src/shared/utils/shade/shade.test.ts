import { describe, expect, it } from 'vitest';

import { shade } from './shade';

describe('shade', () => {
  it('leaves a color alone at zero', () => {
    expect(shade('#E8C48A', 0)).toBe('#e8c48a');
  });

  it('mixes towards black for a negative amount', () => {
    expect(shade('#808080', -0.5)).toBe('#404040');
    expect(shade('#FFFFFF', -1)).toBe('#000000');
  });

  it('mixes towards white for a positive one', () => {
    expect(shade('#808080', 0.5)).toBe('#c0c0c0');
    expect(shade('#000000', 1)).toBe('#ffffff');
  });

  it('clamps an amount that walked off the end', () => {
    expect(shade('#E8C48A', -5)).toBe('#000000');
    expect(shade('#E8C48A', 5)).toBe('#ffffff');
  });

  it('understands the short spelling', () => {
    expect(shade('#FFF', -1)).toBe('#000000');
  });

  it('hands back a color it cannot read, rather than taking a screen down', () => {
    expect(shade('rebeccapurple', -0.2)).toBe('rebeccapurple');
    expect(shade('', 0.2)).toBe('');
  });
});
