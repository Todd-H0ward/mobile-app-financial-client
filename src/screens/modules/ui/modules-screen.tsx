import { useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  getCatalogueItem,
  MODULE_SLOTS,
  type ModuleSlot,
} from '@/entities/catalogue';
import type { SpriteName } from '@/entities/sprite';
import { Sprite } from '@/entities/sprite/ui';
import { listTasks } from '@/entities/task';
import {
  rewardForUserTask,
  setModuleInstalled,
  useCommitUser,
  useUser,
} from '@/entities/user';

import {
  DYNAMIC_ROUTES,
  SCREEN_PRESENTATION,
  SPACING,
  STATIC_ROUTES,
  TERMINAL_VARIANT,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  PixelIcon,
  type PixelIconName,
  Screen,
  Segmented,
  Text,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SLOTS: ModuleSlot[] = ['head', 'body', 'legs'];
const ICONS: Record<ModuleSlot, PixelIconName> = {
  head: 'face',
  body: 'gear',
  legs: 'wrench',
};

/** The bare part of the dog each slot sits on. */
const PART_SPRITES: Record<ModuleSlot, SpriteName> = {
  head: 'dogHead',
  body: 'dogBody',
  legs: 'dogLegs',
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ModulesScreen = () => {
  const user = useUser();
  const commitUser = useCommitUser();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [slot, setSlot] = useState<ModuleSlot>('head');
  const [isSelected, setSelected] = useState(
    user?.modules.installed.includes(MODULE_SLOTS.head) ?? false,
  );
  const [message, setMessage] = useState<string | null>(null);
  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  const id = MODULE_SLOTS[slot];
  const item = getCatalogueItem(id);
  if (!item) return <Redirect href={STATIC_ROUTES.HOME} />;
  const isOwned = user.modules.owned.includes(id);
  const isInstalled = user.modules.installed.includes(id);
  const preview = setModuleInstalled(user, id, isSelected);
  const example = listTasks()[0];
  const chooseSlot = (next: ModuleSlot) => {
    setSlot(next);
    setSelected(user.modules.installed.includes(MODULE_SLOTS[next]));
    setMessage(null);
  };
  const install = () => {
    const next = setModuleInstalled(user, id, isSelected);
    if (commitUser(user, next))
      setMessage(t(isSelected ? 'equipment.installed' : 'equipment.removed'));
  };

  return (
    <Screen
      presentation={SCREEN_PRESENTATION.SHEET}
      gap={SPACING.COMPACT}
      terminalVariant={TERMINAL_VARIANT.KEEPER}
    >
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label>
            {t('equipment.label', {
              slot: t(`equipment.slots.${slot}`).toLocaleLowerCase(),
            })}
          </Screen.Label>
          <Screen.Title>{t('equipment.title')}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>
      <View style={styles.blueprint}>
        {SLOTS.map((part) => {
          const moduleItem = getCatalogueItem(MODULE_SLOTS[part]);
          const isPartInstalled = user.modules.installed.includes(
            MODULE_SLOTS[part],
          );
          const isCurrent = part === slot;
          return (
            <Pressable
              key={part}
              accessibilityRole="button"
              accessibilityState={{ selected: isCurrent }}
              accessibilityLabel={t(`equipment.slots.${part}`)}
              onPress={() => chooseSlot(part)}
              style={[
                styles.part,
                {
                  backgroundColor: isCurrent
                    ? theme.surfaceSoft
                    : theme.surface,
                  borderColor: isCurrent ? theme.phosphor : theme.border,
                },
              ]}
            >
              <Sprite
                name={PART_SPRITES[part]}
                size={56}
                style={isCurrent ? undefined : styles.dim}
              />
              <View style={styles.badge}>
                {isPartInstalled && moduleItem?.sprite ? (
                  <Sprite name={moduleItem.sprite} size={24} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Segmented
        options={SLOTS.map((part) => ({
          value: part,
          label: t(`equipment.slots.${part}`),
          icon: ICONS[part],
        }))}
        value={slot}
        onChange={chooseSlot}
      />
      <View style={styles.options}>
        {[true, false].map((value) => (
          <Pressable
            key={String(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === isSelected }}
            onPress={() => {
              setSelected(value);
              setMessage(null);
            }}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor:
                  pressed || value === isSelected
                    ? theme.surfaceSoft
                    : theme.surface,
                borderColor:
                  value === isSelected ? theme.phosphor : theme.border,
              },
            ]}
          >
            {value && item.sprite ? (
              <Sprite name={item.sprite} size={40} />
            ) : (
              <Sprite
                name={PART_SPRITES[slot]}
                size={40}
                style={value ? undefined : styles.dim}
              />
            )}
            <Text variant="bodyBold">
              {value
                ? t(`shop.items.${id}.title`, { defaultValue: item.title })
                : t('equipment.base')}
            </Text>
            <Text variant="small" themeColor="textMuted">
              {value
                ? t(isOwned ? 'equipment.owned' : 'equipment.price', {
                    amount: formatMoney(item.price),
                  })
                : t('equipment.free')}
            </Text>
            {value === isSelected ? (
              <PixelIcon name="check20" size={20} />
            ) : null}
          </Pressable>
        ))}
      </View>
      <View
        style={[
          styles.effect,
          { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
        ]}
      >
        <Text variant="small" themeColor="textSecondary">
          {isSelected
            ? t(`equipment.effect.${slot}`)
            : t('equipment.baseEffect')}
        </Text>
        {example && (isOwned || !isSelected) ? (
          <Text variant="small">
            {t('equipment.example', {
              task: t(`tasks.items.${example.id}.title`, {
                defaultValue: example.title,
              }),
              before: rewardForUserTask(user, example),
              after: rewardForUserTask(preview, example),
            })}
          </Text>
        ) : null}
      </View>
      <Text variant="small" themeColor="textMuted">
        {t('equipment.explanation')}
      </Text>
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          variant="small"
          themeColor="phosphor"
        >
          {message}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {isSelected && !isOwned ? (
          <Button
            isFullWidth
            onPress={() =>
              router.dismissTo(DYNAMIC_ROUTES.watcher('keeper', 'shop'))
            }
          >
            {t('equipment.buy')}
          </Button>
        ) : (
          <Button
            isFullWidth
            disabled={isSelected === isInstalled}
            onPress={install}
          >
            {t(isSelected ? 'equipment.install' : 'equipment.remove')}
          </Button>
        )}
      </View>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: { paddingTop: SPACING.TWO },
  badge: {
    height: 24,
    position: 'absolute',
    right: SPACING.ONE,
    top: SPACING.ONE,
    width: 24,
  },
  blueprint: {
    flexDirection: 'row',
    gap: SPACING.TWO,
    justifyContent: 'center',
  },
  dim: {
    opacity: 0.45,
  },
  effect: {
    borderRadius: 12,
    borderWidth: 1,
    gap: SPACING.TWO,
    padding: SPACING.COMPACT,
  },
  option: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    gap: SPACING.TWO,
    padding: SPACING.COMPACT,
  },
  options: { flexDirection: 'row', gap: SPACING.TWO },
  part: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.TWO,
  },
});
