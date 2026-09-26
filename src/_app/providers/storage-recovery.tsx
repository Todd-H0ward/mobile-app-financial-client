import { type ReactNode, useState } from 'react';

import { useUserStore } from '@/entities/user';

import { STORAGE_KEYS } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import {
  quarantineStorage,
  reportStorageIssue,
  useStorageHealth,
} from '@/shared/model';
import { Button, Screen, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
interface StorageRecoveryProps {
  children: ReactNode;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
export const StorageRecovery = ({ children }: StorageRecoveryProps) => {
  const issue = useStorageHealth((state) => state.issue);
  const [isConfirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  if (!issue) return children;
  const retry = async () => {
    try {
      useStorageHealth.getState().clear();
      if (issue.retry) issue.retry();
      else await useUserStore.persist.rehydrate();
    } catch {
      reportStorageIssue(issue);
    }
  };
  const recover = async () => {
    if (!isConfirming) {
      setConfirming(true);
      return;
    }
    try {
      quarantineStorage(STORAGE_KEYS.USER);
      await useUserStore.persist.rehydrate();
      setConfirming(false);
    } catch {
      reportStorageIssue({ kind: 'read' });
    }
  };
  return (
    <Screen gap="three">
      <Screen.Title>{t('storageRecovery.title')}</Screen.Title>
      <Text>{t(`storageRecovery.${issue.kind}`)}</Text>
      <Button
        onPress={() => {
          void retry();
        }}
      >
        {t('storageRecovery.retry')}
      </Button>
      {issue.kind === 'read' ? (
        <>
          <Text>{t('storageRecovery.backup')}</Text>
          <Button
            variant="secondary"
            onPress={() => {
              void recover();
            }}
          >
            {t(
              isConfirming
                ? 'storageRecovery.confirm'
                : 'storageRecovery.newProfile',
            )}
          </Button>
          {isConfirming ? (
            <Button variant="ghost" onPress={() => setConfirming(false)}>
              {t('common.back')}
            </Button>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
};
export type { StorageRecoveryProps };
