import { describe, expect, it } from 'vitest';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';

import { celebrateStage, hasPendingGrowth } from './growth';

const withStages = (
  stage: UserSave['pet']['stage'],
  celebratedStage: UserSave['pet']['stage'],
): UserSave => ({
  ...createInitialUser(),
  pet: { ...createInitialUser().pet, stage, celebratedStage },
});

describe('hasPendingGrowth', () => {
  it('is false for a freshly created baby', () => {
    expect(hasPendingGrowth(createInitialUser())).toBe(false);
  });

  it('is true once the stage has moved ahead of what was celebrated', () => {
    expect(hasPendingGrowth(withStages('teen', 'baby'))).toBe(true);
  });

  it('is false again once celebrated catches up', () => {
    expect(hasPendingGrowth(withStages('teen', 'teen'))).toBe(false);
  });

  it('stays true across more than one stage — a demo run can skip celebrating teen', () => {
    expect(hasPendingGrowth(withStages('adult', 'baby'))).toBe(true);
  });
});

describe('celebrateStage', () => {
  it('catches celebratedStage up to the current stage', () => {
    const user = withStages('teen', 'baby');

    expect(celebrateStage(user).pet.celebratedStage).toBe('teen');
  });

  it('leaves stage itself untouched', () => {
    const user = withStages('teen', 'baby');

    expect(celebrateStage(user).pet.stage).toBe('teen');
  });

  it('is idempotent once caught up', () => {
    const user = withStages('adult', 'adult');

    expect(celebrateStage(user)).toEqual(user);
  });
});
