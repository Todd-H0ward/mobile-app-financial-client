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
  /** Open report, or null when the sheet is closed. */
  report: FeedbackReport | null;
  /** Diffs two saves and opens the sheet. */
  show: (input: ShowFeedbackInput) => void;
  /** Opens from a pre-built describeChange input (tests). */
  showDescribed: (input: DescribeChangeInput) => void;
  /** Opens a pre-built report. */
  showReport: (report: FeedbackReport) => void;
  /** Closes the sheet without changing the save. */
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

/** Opens feedback after a successful action. */
export const useShowFeedback = () => useFeedbackStore((state) => state.show);

/** Closes the feedback sheet. */
export const useDismissFeedback = () =>
  useFeedbackStore((state) => state.dismiss);

/** Current report for the host sheet. */
export const useFeedbackReport = () =>
  useFeedbackStore((state) => state.report);

export type { ShowFeedbackInput };
