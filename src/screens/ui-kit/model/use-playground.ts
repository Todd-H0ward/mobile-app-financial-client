import { useState } from 'react';

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
  /** Index of the selected chip, or `null` when nothing is chosen. */
  selectedChip: number | null;
  setSelectedChip: (selectedChip: number | null) => void;
  /** Whether the example list row is struck through. */
  isRowDone: boolean;
  setIsRowDone: (isRowDone: boolean) => void;
  /** Whether the example list row carries the selected border. */
  isRowSelected: boolean;
  setIsRowSelected: (isRowSelected: boolean) => void;
  /** Open state of `Sheet.Modal`. */
  isSheetVisible: boolean;
  setIsSheetVisible: (isSheetVisible: boolean) => void;
  /** Whether that sheet can be dragged or tapped away. */
  isSheetDismissible: boolean;
  setIsSheetDismissible: (isSheetDismissible: boolean) => void;
  /** Open state of the controlled `Collapsible` example. */
  isCollapsibleOpen: boolean;
  setIsCollapsibleOpen: (isCollapsibleOpen: boolean) => void;
  /**
   * Bumped to remount `SplashOverlay`, which plays once and then unmounts
   * itself — the only way to watch its animation a second time.
   */
  splashRun: number;
  replaySplash: () => void;
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
  };
};

export type { Playground };
