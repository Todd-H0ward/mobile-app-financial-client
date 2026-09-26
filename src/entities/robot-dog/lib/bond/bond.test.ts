import { describe, expect, it } from 'vitest';

import { bondReaction } from './bond';

describe('bondReaction', () => {
  it('gives hearts on a stroke when the dog is content', () => {
    expect(bondReaction('content', 'stroke')).toEqual({
      action: 'joy',
      burst: 'hearts',
    });
  });

  it('stays soft when tired is stroked', () => {
    expect(bondReaction('tired', 'stroke')).toEqual({
      action: 'sad',
      burst: 'steam',
    });
  });

  it('treats a kick as play when proud', () => {
    expect(bondReaction('proud', 'kick')).toEqual({
      action: 'joy',
      burst: 'sparks',
    });
  });

  it('flinches on a kick otherwise', () => {
    expect(bondReaction('sad', 'kick')).toEqual({
      action: 'sad',
      burst: 'sparks',
    });
  });
});
