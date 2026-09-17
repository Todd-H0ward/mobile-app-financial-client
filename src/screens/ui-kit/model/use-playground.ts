import { useState } from 'react';

import type {
  PetColor,
  PetPattern,
  PetSpecies,
  PetStage,
} from '@/entities/pet';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Playground {
  /** Drives every `isLoading` on the screen at once. */
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  /** Drives every `isDisabled` / `disabled` on the screen at once. */
  isDisabled: boolean;
  setIsDisabled: (isDisabled: boolean) => void;
  /** Toggled by the `Switch` section; also feeds the disabled example. */
  isChecked: boolean;
  setIsChecked: (isChecked: boolean) => void;
  /** Live value of the `Slider` section, 0…100. */
  sliderValue: number;
  setSliderValue: (sliderValue: number) => void;
  /** Feeds `ProgressBar` and `MeterCard` so one drag moves all three. */
  meterValue: number;
  setMeterValue: (meterValue: number) => void;
  /** Text of the `Input` section, so the counter has something to count. */
  inputValue: string;
  setInputValue: (inputValue: string) => void;
    selectedChip: number | null;
  setSelectedChip: (selectedChip: number | null) => void;
    isRowDone: boolean;
  setIsRowDone: (isRowDone: boolean) => void;
    isRowSelected: boolean;
  setIsRowSelected: (isRowSelected: boolean) => void;
  isSheetVisible: boolean;
  setIsSheetVisible: (isSheetVisible: boolean) => void;
  /** Whether that sheet can be dragged or tapped away. */
  isSheetDismissible: boolean;
  setIsSheetDismissible: (isSheetDismissible: boolean) => void;
    isCollapsibleOpen: boolean;
  setIsCollapsibleOpen: (isCollapsibleOpen: boolean) => void;
  /**
   * Bumped to remount `SplashOverlay`, which plays once and then unmounts
   * itself — the only way to watch its animation a second time.
   */
  splashRun: number;
  replaySplash: () => void;
    petSpecies: PetSpecies;
  setPetSpecies: (petSpecies: PetSpecies) => void;
  petColor: PetColor;
  setPetColor: (petColor: PetColor) => void;
  petPattern: PetPattern;
  setPetPattern: (petPattern: PetPattern) => void;
  /** Its growth stage — scale, liveliness and the anchor table. */
  petStage: PetStage;
  setPetStage: (petStage: PetStage) => void;
  /** Body axis, 0…1. Together with `petSpirit` it decides the mood shown. */
  petComfort: number;
  setPetComfort: (petComfort: number) => void;
  /** Heart axis, 0…1. */
  petSpirit: number;
  setPetSpirit: (petSpirit: number) => void;
}

// ═══════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════

/**
 * Every switchable value on the UI-kit screen lives here rather than in the
 * sections, so a component is never hardcoded into one state and the screen
 * stays a playground instead of a gallery.
 */
export const usePlayground = (): Playground => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [sliderValue, setSliderValue] = useState(40);
  const [meterValue, setMeterValue] = useState(0.62);
  const [inputValue, setInputValue] = useState('');
  const [selectedChip, setSelectedChip] = useState<number | null>(1);
  const [isRowDone, setIsRowDone] = useState(false);
  const [isRowSelected, setIsRowSelected] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetDismissible, setIsSheetDismissible] = useState(true);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [splashRun, setSplashRun] = useState(0);
  const [petSpecies, setPetSpecies] = useState<PetSpecies>('cat');
  const [petColor, setPetColor] = useState<PetColor>('sand');
  const [petPattern, setPetPattern] = useState<PetPattern>('spots');
  const [petStage, setPetStage] = useState<PetStage>('teen');
  const [petComfort, setPetComfort] = useState(0.8);
  const [petSpirit, setPetSpirit] = useState(0.8);

  return {
    isLoading,
    setIsLoading,
    isDisabled,
    setIsDisabled,
    isChecked,
    setIsChecked,
    sliderValue,
    setSliderValue,
    meterValue,
    setMeterValue,
    inputValue,
    setInputValue,
    selectedChip,
    setSelectedChip,
    isRowDone,
    setIsRowDone,
    isRowSelected,
    setIsRowSelected,
    isSheetVisible,
    setIsSheetVisible,
    isSheetDismissible,
    setIsSheetDismissible,
    isCollapsibleOpen,
    setIsCollapsibleOpen,
    splashRun,
    replaySplash: () => setSplashRun((run) => run + 1),
    petSpecies,
    setPetSpecies,
    petColor,
    setPetColor,
    petPattern,
    setPetPattern,
    petStage,
    setPetStage,
    petComfort,
    setPetComfort,
    petSpirit,
    setPetSpirit,
  };
};

export type { Playground };
