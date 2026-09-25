import type { BudgetFact, BudgetPlan } from '@/entities/budget';
import type { BudgetDirection } from '@/entities/economy';
import type {
  RobotDogAction,
  RobotDogSkin,
  RobotDogStage,
} from '@/entities/robot-dog';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Every value an enum-shaped save field may hold.
 *
 * They are runtime tuples, not bare unions, because `isUserSave` has to check
 * membership: a save is JSON, so `phase: "banana"` is as likely as a typo in a
 * hand-edited file, and a string check alone would let it reach the screens.
 *
 * Two sets live elsewhere for the same reason: the budget directions in
 * `entities/economy` and the robot's stages and coats in `entities/robot-dog`,
 * because the budget screens and the 3D scene need them without needing the
 * save. Plan/fact shapes live in
 * `entities/budget` — the leaf that owns the allocation rules.
 */

/** Phases the machine can actually be in. See docs/game-period.md. */
const PERIOD_PHASES = ['planning', 'active', 'summary'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Phase of the period state machine. See docs/game-period.md.
 *
 * Settlement is deliberately absent: it is the work `acknowledgeSummary` does
 * between `summary` and the next `planning`, never a state a save can hold.
 */
type PeriodPhase = (typeof PERIOD_PHASES)[number];

/** The robot dog: what it is called, how far it is built, how it feels. */
interface RobotSave {
  /** Three independently selected modules, each indexed 0…2. */
  assembly: import('@/entities/robot-dog').RobotAssembly;
  /**
   * Name the child gave it. Empty until the introduction asks for one — the
   * only free-text field besides the player's name, see privacy.md.
   */
  name: string;
  /**
   * Build stage, docs/robot-dog.md. Recomputed by the settlement step from the
   * period history, and only ever upwards — a mistake never takes it away.
   */
  stage: RobotDogStage;
  /** The battery: needs paid for. 0…1, eased — the mood never jumps. */
  charge: number;
  /** Everything else: goal proximity, tasks done, how the period ended. 0…1. */
  spirit: number;
}

/** One line of wallet history. Nothing is credited namelessly — 2.5.4. */
interface WalletEntry {
  /** Entry id. Unique within the save. */
  id: string;
  /** What it was: `task:change-counting`, `purchase:sweater`, `bonus:regularity`. */
  source: string;
  /** Amount in coins, always > 0. The sign lives in `kind`, not in the number. */
  amount: number;
  /** Money in or money out. */
  kind: 'earn' | 'spend';
  /** Budget direction the fact went to. `null` for income. */
  direction: BudgetDirection | null;
  /** Period the operation happened in. For the grown-up's report, 2.5.11. */
  periodIndex: number;
  /** Epoch ms, from `TimeSource.now()`. Shown, never used in a calculation. */
  at: number;
}

/** The wallet: balance and recent operations. */
interface WalletSave {
  /**
   * Balance in coins. Never below zero — 2.5.6.
   *
   * History is trimmed to `WALLET_HISTORY_LIMIT` from `entities/economy`: it
   * exists for the report, not as an archive, and the save must not grow
   * without a bound.
   */
  balance: number;
  /** Recent operations, newest first. */
  history: WalletEntry[];
  /**
   * How many entries have ever been credited or spent, never reset and never
   * trimmed along with `history`. It is what `WalletEntry.id` is built from,
   * so an id stays unique even once its entry has aged out of the array.
   */
  entryCount: number;
}

/** Progress towards one financial goal. Title and price live in content. */
interface SavingsGoalSave {
  /** Goal id from `content/goals.json`. No title, no price in the save — 3.2. */
  goalId: string;
  /** Put away towards this goal. Only a withdrawal lowers it — 2.5.7. */
  saved: number;
  /** Period the goal was reached in, or `null`. Feeds the robot's stages. */
  reachedInPeriod: number | null;
}

/** The savings jar: goals and what is put away in each. */
interface SavingsSave {
  /** Every goal, at least three — 2.5.7. Order follows the content file. */
  goals: SavingsGoalSave[];
  /** Goal shown on the home screen. `null` — none picked. */
  activeGoalId: string | null;
  /**
   * Deposits made during the current period. Above zero earns the regularity
   * bonus on settlement; reset when a new period starts.
   */
  depositsThisPeriod: number;
}

/** The current period: phase, plan, fact. See docs/game-period.md. */
interface PeriodSave {
  /** Period number, from 1. Grows monotonically, never resets. */
  index: number;
  /** Current phase. Only a transition changes it, never a screen. */
  phase: PeriodPhase;
  /** The plan: what the child set aside per direction. */
  plan: BudgetPlan;
  /** The fact: what actually went out per direction. */
  fact: BudgetFact;
  /** Epoch ms of entering this phase. For history, never for a calculation. */
  phaseEnteredAt: number;
}

/** A finished period. History (2.5.11) is built out of these. */
interface PeriodRecord {
  /** Number of the finished period. */
  index: number;
  /** The plan the period started with. */
  plan: BudgetPlan;
  /** The fact the period ended with. */
  fact: BudgetFact;
  /** No direction overspent. A stage condition, see docs/robot-dog.md. */
  isPlanKept: boolean;
  /** Goals reached during this very period. Another growth condition. */
  reachedGoalIds: string[];
  /** Epoch ms of the ending, from `TimeSource.now()`. */
  endedAt: number;
  /** Coins earned during the period (tasks, games, bonuses before settlement). */
  earned: number;
  /** Bonus (positive) or penalty (negative) applied at settlement. */
  adjustment: number;
  /** Robot charge after settlement decay, 0…1. */
  robotCharge: number;
  /** Robot spirit after settlement decay, 0…1. */
  robotSpirit: number;
}

/** Progress on chores for the current period — 2.5.8 / roadmap 1.16. */
interface TasksSave {
  /**
   * Task shown on the home HUD. `null` when every chore of the period is done
   * or none has been issued yet.
   */
  activeTaskId: string | null;
  /**
   * Task ids completed during the current period. Cleared on settlement so
   * the same catalogue opens again next period — docs/game-period.md.
   */
  completedThisPeriod: string[];
}

/** What the grown-up configured in their section, 2.5.12. */
interface SettingsSave {
  /** Arithmetic gate in front of the grown-up's section. */
  isParentGateEnabled: boolean;
  /** Sound. Turned off for a classroom or a bus. */
  isSoundEnabled: boolean;
  /** Animations. Turned off for a weak device and for 3.6. */
  isAnimationEnabled: boolean;
  /** Demo mode: swaps `TimeSource` and the starting profile, 2.5.13. */
  isDemoMode: boolean;
  /** The robot dog's coat. Purely looks — the stage is what the child earns. */
  robotSkin: RobotDogSkin;
  /**
   * What the dog does when nothing interrupts it.
   *
   * The child's taps and the robot's mood play over it, but this is where it
   * comes back to — and it is what the settings picker sets.
   */
  robotAction: RobotDogAction;
}

/** One irreversible purchase of a tier, saved with the progress it bought. */
interface PlatformReceipt {
  /** Idempotency key: platform:<target level>, never reused in this profile. */
  id: string;
  /** Purchased tier, 1…5. */
  level: number;
  /** Coins consumed from the dedicated savings jar, above zero. */
  amount: number;
  /** Coins in the jar immediately before the purchase. */
  savingsBefore: number;
  /** Coins in the jar immediately after the purchase, never below zero. */
  savingsAfter: number;
  /** Period in which the child confirmed the purchase. */
  periodIndex: number;
  /** Epoch ms, for the purchase history only. */
  at: number;
}

interface PlatformSave {
  /** Permanent purchased tier, 0…5; animations derive their position from it. */
  level: number;
  /** One receipt per purchased tier, oldest first; at most five entries. */
  receipts: PlatformReceipt[];
}

/**
 * One save for the whole app. Written in full on every change, read once at
 * startup. The profile is local and guest-only — no account, no sign-up,
 * see docs/privacy.md.
 */
interface ArcadeSave {
  /** Personal high scores; reset and demo isolation follow the profile. */
  scores: {
    /** Five highest apple counts, descending. */
    snake: number[];
    /** Five fastest clear times in ms, ascending. */
    spacewarMs: number[];
  };
  /** Monotonic session counter; never reused after a completion or restart. */
  sequence: number;
  /** Currently open session; null once consumed, even for an unpaid practice. */
  active: {
    /** Counter captured by the game screen when it starts. */
    id: number;
    /** Which game may claim this session. */
    gameId: 'puzzle' | 'snake' | 'spacewar' | 'market' | 'weekly';
  } | null;
  /** UTC day of the most recent paid sitting, -1 before the first reward. */
  paidDay: number;
  /** Last paid Monday-based UTC week; rollback never refreshes this limit. */
  paidWeek: number;
  /** Paid sittings on paidDay, 0…3 across all arcade games together. */
  paidCount: number;
}

/** Robot modules that give gameplay bonuses (reward multiplier, extra hints). */
interface ModulesSave {
  /** IDs of purchased modules, ordered by acquisition. */
  owned: string[];
  /** Current module tier: 0 (none), 1, 2, or 3. Derived from owned count. */
  tier: 0 | 1 | 2 | 3;
}

interface UserSave {
  /** Schema version. Bumped on every incompatible change. */
  version: number;
  /** Purchased platform progress and its savings transactions. */
  platform: PlatformSave;
  /** Shared arcade payout limit and durable session identity. */
  arcade: ArcadeSave;
  /** Completed arena cells, each segment-step-cell key recorded at most once. */
  completedLessonCells: string[];
  /**
   * Lesson ids finished on the arena.
   *
   * Cells are fixed at ninety discs; `lessons.json` may grow past that. Extra
   * lessons stack on the same discs, so progress is keyed by lesson id — the
   * cell key list is derived when every layer on a disc is done.
   */
  completedLessonIds: string[];
  /** The child's in-game name. Empty until the introduction asks for it. */
  playerName: string;
  /** Epoch ms the profile was created. For the grown-up's section. */
  createdAt: number;
  /** The robot dog: name, build stage, charge and spirit. */
  robot: RobotSave;
  /** The wallet: balance and recent operations with a source and an amount. */
  wallet: WalletSave;
  /** The savings jar: goals and what is put away in each. */
  savings: SavingsSave;
  /** Chores for the period: active focus and what is already done. */
  tasks: TasksSave;
  /** The current period: phase, plan, fact. See docs/game-period.md. */
  period: PeriodSave;
  /** Finished periods: plan, fact and outcome of each. For history, 2.5.11. */
  history: PeriodRecord[];
  /**
   * Catalogue `ownedId`s of everything bought that stays — toys, the console,
   * puzzles. Never shrinks; the arcade unlocks games off it.
   */
  ownedItemIds: string[];
  /** Robot modules: purchased modules and their combined tier. */
  modules: ModulesSave;
  /** What the grown-up configured: gate, sound, animations, demo mode. */
  settings: SettingsSave;
}

export type {
  ArcadeSave,
  BudgetFact,
  BudgetPlan,
  ModulesSave,
  PeriodPhase,
  PeriodRecord,
  PeriodSave,
  PlatformReceipt,
  PlatformSave,
  RobotSave,
  SavingsGoalSave,
  SavingsSave,
  SettingsSave,
  TasksSave,
  UserSave,
  WalletEntry,
  WalletSave,
};
export { PERIOD_PHASES };
