import { MODULE_IDS } from '@/entities/catalogue';

import type { UserSave } from '../../model/types';

/** Fitting owned electronics is free and never replaces the chosen 3D appearance. */
export const setModuleInstalled = (
  user: UserSave,
  id: string,
  isInstalled: boolean,
): UserSave => {
  if (!MODULE_IDS.includes(id) || !user.modules.owned.includes(id)) return user;
  if (user.modules.installed.includes(id) === isInstalled) return user;
  return {
    ...user,
    modules: {
      ...user.modules,
      installed: isInstalled
        ? [...user.modules.installed, id]
        : user.modules.installed.filter((value) => value !== id),
    },
  };
};
