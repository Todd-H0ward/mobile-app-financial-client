import { useState } from 'react';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Playground {
  /** Drives every `isLoading` on the screen at once. */
  isTextureEnabled: boolean;
  setIsTextureEnabled: (isEnabled: boolean) => void;
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
  /** Feeds `ProgressBar` and the sliders, so one drag moves them all. */
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
  /** Chosen tab of the `Segmented` section — a real switch, not a picture. */
  segment: 'need' | 'want' | 'save';
  setSegment: (segment: 'need' | 'want' | 'save') => void;
  /** Stepper value of the plan row example, in coins, 0…50. */
  stepperValue: number;
  setStepperValue: (stepperValue: number) => void;
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
  const [isTextureEnabled, setIsTextureEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [sliderValue, setSliderValue] = useState(40);
  const [meterValue, setMeterValue] = useState(0.62);
  const [inputValue, setInputValue] = useState('');
  const [selectedChip, setSelectedChip] = useState<number | null>(1);
  const [segment, setSegment] = useState<'need' | 'want' | 'save'>('need');
  const [stepperValue, setStepperValue] = useState(20);
  const [isRowDone, setIsRowDone] = useState(false);
  const [isRowSelected, setIsRowSelected] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetDismissible, setIsSheetDismissible] = useState(true);
  const [splashRun, setSplashRun] = useState(0);

  return {
    isTextureEnabled,
    setIsTextureEnabled,
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
    segment,
    setSegment,
    stepperValue,
    setStepperValue,
    splashRun,
    replaySplash: () => setSplashRun((run) => run + 1),
  };
};

export type { Playground };
