import { useState } from 'react';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Playground {
  isTextureEnabled: boolean;
  setIsTextureEnabled: (isEnabled: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isDisabled: boolean;
  setIsDisabled: (isDisabled: boolean) => void;
  isChecked: boolean;
  setIsChecked: (isChecked: boolean) => void;
  /** 0…100. */
  sliderValue: number;
  setSliderValue: (sliderValue: number) => void;
  meterValue: number;
  setMeterValue: (meterValue: number) => void;
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
  isSheetDismissible: boolean;
  setIsSheetDismissible: (isSheetDismissible: boolean) => void;
  /** Real Segmented switch, not a static picture. */
  segment: 'need' | 'want' | 'save';
  setSegment: (segment: 'need' | 'want' | 'save') => void;
  /** Plan-row stepper, coins 0…50. */
  stepperValue: number;
  setStepperValue: (stepperValue: number) => void;
  /** Bump to remount SplashOverlay (plays once, then unmounts). */
  splashRun: number;
  replaySplash: () => void;
}

// ═══════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════

/** Shared switches so kit sections stay a playground, not hardcoded states. */
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
