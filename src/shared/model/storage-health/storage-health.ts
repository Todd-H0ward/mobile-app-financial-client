import { create } from 'zustand';

interface StorageIssue {
  /** Read failures block startup; write failures retain the previous snapshot. */
  kind: 'read' | 'write';
  /** Retry the exact rejected write; reads are retried by the application host. */
  retry?: () => void;
}
interface StorageHealth {
  /** Transient error; never written to the failing storage. */
  issue: StorageIssue | null;
  /** Clear only after a successful retry or explicit recovery. */
  clear: () => void;
}
export const useStorageHealth = create<StorageHealth>((set) => ({
  issue: null,
  clear: () => set({ issue: null }),
}));
export const reportStorageIssue = (issue: StorageIssue) =>
  useStorageHealth.setState({ issue });
export type { StorageIssue };
