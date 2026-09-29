import { describe, expect, it } from 'vitest';

import { pixelPaths, pixelSize } from './pixelPaths';

const PALETTE = { a: 'red', b: 'blue' };

describe('pixelPaths', () => {
  it('merges a horizontal run into one rectangle', () => {
    const [path] = pixelPaths(['aaa'], PALETTE);
    expect(path?.ink).toBe('a');
    expect(path?.d.match(/M/g)).toHaveLength(1);
  });

  it('keeps one path per ink, in order of first use', () => {
    const paths = pixelPaths(['ab', 'ba'], PALETTE);
    expect(paths.map((path) => path.color)).toEqual(['red', 'blue']);
    expect(paths[0]?.d.match(/M/g)).toHaveLength(2);
  });

  it('leaves `.` and unknown inks transparent', () => {
    expect(pixelPaths(['.z.'], PALETTE)).toEqual([]);
  });

  it('places runs on their own row and column', () => {
    const [path] = pixelPaths(['..', '.a'], PALETTE);
    expect(path?.d.startsWith('M1 1h')).toBe(true);
  });
});

describe('pixelSize', () => {
  it('measures the widest row and every row', () => {
    expect(pixelSize(['a', 'abc', ''])).toEqual({ width: 3, height: 3 });
  });

  it('never reports a zero-sized grid', () => {
    expect(pixelSize([])).toEqual({ width: 1, height: 1 });
  });
});
