import { COLORS } from '@/shared/constants';

import { useColorScheme } from './use-color-scheme';

export const useTheme = () => COLORS[useColorScheme()];
