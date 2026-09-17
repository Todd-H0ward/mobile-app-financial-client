import { create } from 'zustand';

import type { UserSave } from '@/entities/user';

import {
  type DescribeChangeInput,
  describeChange,
  type FeedbackAction,
  type FeedbackReport,
  snapshotUser,
} from '../lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ShowFeedbackInput {
  before: UserSave;
  after: UserSave;
  action: FeedbackAction;
  whyText?: string;
  whyKey?: string;
  params?: Record<string, string | number>;
  overPlanBy?: number;
}

interface FeedbackStore {
    report: FeedbackReport | null;
  show: (input: ShowFeedbackInput) => void;
  showDescribed: (input: DescribeChangeInput) => void;
  showReport: (report: FeedbackReport) => void;
  dismiss: () => void;
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════

/**
 * Ephemeral «что изменилось» sheet — not persisted. One report at a time;
 * a newer action replaces the previous one (2.5.9).
 */
export const useFeedbackStore = create<FeedbackStore>((set) => ({
  report: null,

  show: ({ before, after, ...meta }) =>
    set({
      report: describeChange({
        before: snapshotUser(before),
        after: snapshotUser(after),
        ...meta,
      }),
    }),

  showDescribed: (input) => set({ report: describeChange(input) }),

  showReport: (report) => set({ report }),

  dismiss: () => set({ report: null }),
}));

export const useShowFeedback = () => useFeedbackStore((state) => state.show);

export const useDismissFeedback = () =>
  useFeedbackStore((state) => state.dismiss);

export const useFeedbackReport = () =>
  useFeedbackStore((state) => state.report);

export type { ShowFeedbackInput };
