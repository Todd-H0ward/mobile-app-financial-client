import { useMemo, useState } from 'react';

import { useShowFeedback } from '@/features/feedback';

import { type CatalogueItem, listInsulationItems } from '@/entities/catalogue';
import { priceFor } from '@/entities/pet';
import {
  applyPurchase,
  buildBill,
  canAfford,
  type HeatingBill,
  type InsulationPayback,
  insulationPayback,
  setTemperature,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { hapticSuccess, useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HeatingInsulationRow {
  item: CatalogueItem;
  /** Already unlocked on the home. */
  isOwned: boolean;
  payback: InsulationPayback;
  canAfford: boolean;
}

interface HeatingController {
  temperature: number;
  bill: HeatingBill;
  /** Bill at thermostat = 1 with current insulation — right end of the slider. */
  maxBillTotal: number;
  /** True while the period is `active` — insulation buys only then. */
  canBuy: boolean;
  insulation: readonly HeatingInsulationRow[];
  /** Live draft while dragging — does not touch the save. */
  setThermostat: (value: number) => void;
  /** Persist the draft when the finger lifts. */
  commitThermostat: (value: number) => void;
  buyInsulation: (item: CatalogueItem) => void;
  /** Item waiting for a confirm sheet, if any. */
  pending: CatalogueItem | null;
  confirmBuy: () => void;
  dismissPending: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Thermostat steps match `buildBill`'s tenths. */
const TEMP_STEP = 0.1;

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Thermostat, live bill and insulation list — docs/house.md.
 *
 * The draft temperature lives in React state while dragging; the save is
 * written only on `commitThermostat`. Persisting on every `onChange` made the
 * thumb hitch behind SQLite (zustand `persist`).
 */
export const useHeating = (): HeatingController | null => {
  const user = useUser();
  const updateUser = useUpdateUser();
  const time = useTimeSource();
  const showFeedback = useShowFeedback();
  const [pending, setPending] = useState<CatalogueItem | null>(null);
  /** `undefined` until the child moves the dial — then overrides the save. */
  const [draftTemperature, setDraftTemperature] = useState<number | undefined>(
    undefined,
  );

  const temperature = draftTemperature ?? user?.home.temperature ?? 0;
  const insulationIds = user?.home.insulationIds ?? [];
  const traitIds = user?.pet.traitIds ?? [];
  const canBuy = user?.period.phase === 'active';
  const wallet = user?.wallet;

  const bill = useMemo(
    () => buildBill(temperature, insulationIds),
    [temperature, insulationIds],
  );

  const maxBillTotal = useMemo(
    () => buildBill(1, insulationIds).total,
    [insulationIds],
  );

  const insulation = useMemo((): HeatingInsulationRow[] => {
    if (!wallet) return [];
    return listInsulationItems().map((raw) => {
      const item = {
        ...raw,
        price: priceFor(raw.price, raw.category, traitIds),
      };
      const id = item.insulationId ?? '';
      const isOwned = insulationIds.includes(id);
      return {
        item,
        isOwned,
        payback: insulationPayback(item.price, temperature, insulationIds),
        canAfford: canAfford(wallet, item.price),
      };
    });
  }, [insulationIds, temperature, traitIds, wallet]);

  if (!user) return null;

  const setThermostat = (value: number) => {
    setDraftTemperature(value);
  };

  const commitThermostat = (value: number) => {
    setDraftTemperature(value);
    updateUser((current) => setTemperature(current, value));
  };

  const buyInsulation = (item: CatalogueItem) => {
    if (!canBuy) return;
    setPending(item);
  };

  const dismissPending = () => setPending(null);

  const confirmBuy = () => {
    if (!pending || !user) return;
    const item = pending;
    setPending(null);

    const before = user;
    const result = applyPurchase(user, item.id, time);
    if (!result.ok) return;

    updateUser(() => result.user);
    hapticSuccess();

    const feedback = {
      before,
      after: result.user,
      action: 'purchase' as const,
      overPlanBy: result.overPlanBy,
      params: { item: result.item.title },
    };
    setTimeout(() => {
      showFeedback(feedback);
    }, 0);
  };

  return {
    temperature,
    bill,
    maxBillTotal,
    canBuy,
    insulation,
    setThermostat,
    commitThermostat,
    buyInsulation,
    pending,
    confirmBuy,
    dismissPending,
  };
};

export type { HeatingController, HeatingInsulationRow };
export { TEMP_STEP };
