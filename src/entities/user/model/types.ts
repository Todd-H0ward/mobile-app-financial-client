// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One of the three budget directions. The same three words on every screen. */
type BudgetDirection = 'needs' | 'wants' | 'savings';

/** What the child set aside per direction. Coins, whole numbers, >= 0. */
interface BudgetPlan {
  /** Must-haves: food, heating. */
  needs: number;
  /** Nice-to-haves: toys, room decorations. */
  wants: number;
  /** Put away towards a financial goal. */
  savings: number;
}

/** What actually went out. Same shape, so comparing is a subtraction. */
type BudgetFact = BudgetPlan;

/** Phase of the period state machine. See docs/game-period.md. */
type PeriodPhase = 'planning' | 'active' | 'summary' | 'settlement';

/** Pet species — the appearance axis you read from the silhouette alone. */
type PetSpecies = 'cat' | 'dog' | 'capybara';

/** Coat — three contrasting colors, never shades of one. */
type PetColor = 'sand' | 'graphite' | 'mint';

/** Pattern on top of the coat: the third axis, spare capacity past the nine. */
type PetPattern = 'solid' | 'spots' | 'stripes';

/** Growth stage. Never goes backwards — 2.2 forbids wiping progress. */
type PetStage = 'baby' | 'teen' | 'adult';

/** The pet: how it looks, what it is called, how it feels. */
interface PetSave {
  /** Species. Picked during onboarding, never changes afterwards. */
  species: PetSpecies;
  /** Coat. Picked during onboarding, never changes afterwards. */
  color: PetColor;
  /** Pattern. Picked during onboarding, never changes afterwards. */
  pattern: PetPattern;
  /** Name the child gave it. The only free-text field in the app, see privacy.md. */
  name: string;
  /** Character traits (wave 2). They shift prices and rates; ids from content. */
  traitIds: string[];
  /** Growth stage. Recomputed in `settlement`, and only upwards. */
  stage: PetStage;
  /** Body: fed and warm. 0…1, with inertia — the mood eases, never jumps. */
  comfort: number;
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
}

/** Progress towards one financial goal. Title and price live in content. */
interface SavingsGoalSave {
  /** Goal id from `content/goals.json`. No title, no price in the save — 3.2. */
  goalId: string;
  /** Put away towards this goal. Only a withdrawal lowers it — 2.5.7. */
  saved: number;
  /** Period the goal was reached in, or `null`. Feeds the pet's growth. */
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
   * bonus in `settlement`; reset when a new period starts.
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
  /** No direction overspent. A growth condition for the pet, see pet.md. */
  isPlanKept: boolean;
  /** Goals reached during this very period. Another growth condition. */
  reachedGoalIds: string[];
  /** Epoch ms of the ending, from `TimeSource.now()`. */
  endedAt: number;
}

/** The home: warmth, one-off improvements and furnishing. */
interface HomeSave {
  /**
   * Thermostat position, 0…1. Shown to the child as "chilly / warm" plus the
   * price per period — the percentage is never shown, see house.md.
   */
  temperature: number;
  /** Insulation bought, ids from the catalogue. Lowers every later bill. */
  insulationIds: string[];
  /** Furniture bought, ids from the catalogue. Changes the room, nothing else. */
  furnitureIds: string[];
  /**
   * Period the bill has already been issued for. Guards against double
   * charging: the bill is issued once per period, even if `settlement` runs
   * a second time.
   */
  lastBilledPeriod: number;
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
}

/**
 * One save for the whole app. Written in full on every change, read once at
 * startup. The profile is local and guest-only — no account, no sign-up,
 * see docs/privacy.md.
 */
interface UserSave {
  /** Schema version. Bumped on every incompatible change. */
  version: number;
  /** The child's in-game name. Set during onboarding, 2.5.1. */
  playerName: string;
  /** Epoch ms the profile was created. For the grown-up's section. */
  createdAt: number;
  /** The pet: species, coat, pattern, name, traits, stage. */
  pet: PetSave;
  /** The wallet: balance and recent operations with a source and an amount. */
  wallet: WalletSave;
  /** The savings jar: goals and what is put away in each. */
  savings: SavingsSave;
  /** The current period: phase, plan, fact. See docs/game-period.md. */
  period: PeriodSave;
  /** Finished periods: plan, fact and outcome of each. For history, 2.5.11. */
  history: PeriodRecord[];
  /** The home: temperature, insulation bought, furniture. */
  home: HomeSave;
  /** What the grown-up configured: gate, sound, animations, demo mode. */
  settings: SettingsSave;
}

export type {
  BudgetDirection,
  BudgetFact,
  BudgetPlan,
  HomeSave,
  PeriodPhase,
  PeriodRecord,
  PeriodSave,
  PetColor,
  PetPattern,
  PetSave,
  PetSpecies,
  PetStage,
  SavingsGoalSave,
  SavingsSave,
  SettingsSave,
  UserSave,
  WalletEntry,
  WalletSave,
};
