import { describe, expect, it } from 'vitest';

import { createInitialUser } from '../../model/initial-user';

import { hasSeenStory, markStorySeen } from './story';

// ═══════════════════════════════════════════
describe('story progress', () => {
  it('starts with nothing seen', () => {
    const user = createInitialUser();
    expect(hasSeenStory(user, 'intro')).toBe(false);
    expect(hasSeenStory(user, 'finale')).toBe(false);
  });

  it('marks a cutscene once', () => {
    const user = createInitialUser();
    const afterIntro = markStorySeen(user, 'intro');
    expect(hasSeenStory(afterIntro, 'intro')).toBe(true);
    expect(hasSeenStory(afterIntro, 'finale')).toBe(false);
    expect(markStorySeen(afterIntro, 'intro')).toBe(afterIntro);
  });
});
