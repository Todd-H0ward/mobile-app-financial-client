export {
  createDemoProfile,
  DEMO_RUN_PERIODS,
  enterDemoMode,
  exitDemoMode,
  runDemoPeriods,
} from './demo';
export type { WalletHistoryRow, WalletSourceRef } from './history';
export {
  describeWalletSource,
  getLastPeriod,
  listPeriodHistory,
  listWalletHistory,
} from './history';
export {
  acknowledgeSummary,
  canFinishPeriod,
  finishPeriod,
  growthFacts,
  startPeriod,
} from './period';
export type { PlayerNameStatus } from './player-name';
export {
  isPlayerNameValid,
  normalizePlayerName,
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
  validatePlayerName,
} from './player-name';
export type { PurchaseFail, PurchaseOk, PurchaseResult } from './purchase';
export { applyPurchase } from './purchase';
export type {
  GrowthReport,
  ParentsReport,
  PeriodEarnings,
  ThemeTally,
} from './report';
export { buildParentsReport } from './report';
export { resetUser } from './reset';
export type { SavingsFail, SavingsOk, SavingsResult } from './savings';
export { applyDeposit, applyWithdraw, setActiveGoal } from './savings';
export type {
  ShortageExplain,
  ShortageExplainInput,
  ShortageJarOption,
  ShortageTaskOption,
  ShortageWaitOption,
} from './shortage';
export { explainShortage } from './shortage';
export type { SimOptions, SimPeriod, SimProfile, SimRun } from './simulate';
export { simulate } from './simulate';
export type { TaskFail, TaskOk, TaskResult } from './tasks';
export {
  applyCompleteTask,
  issueNextTask,
  selectTask,
} from './tasks';
export type {
  CreditInput,
  DebitFail,
  DebitInput,
  DebitOk,
  DebitResult,
} from './wallet';
export {
  canAfford,
  creditWallet,
  debitWallet,
  startingWallet,
} from './wallet';
