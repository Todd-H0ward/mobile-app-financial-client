import { useState } from 'react';

import { useRouter } from 'expo-router';

import { useUserStore } from '@/entities/user';

import { Button, Card, Input, Screen, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const NAME_MAX_LENGTH = 12;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const OnboardingScreen = () => {
  const router = useRouter();
  const createUser = useUserStore((state) => state.createUser);
  const [playerName, setPlayerName] = useState('');

  const start = () => {
    createUser({
      playerName: playerName.trim(),
      createdAt: Date.now(),
    });

    router.replace('/home');
  };

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header
        title="Привет!"
        subtitle="Заведём профиль — он останется на этом устройстве"
      />

      <Card tone="surfaceSoft">
        <Card.Title>Как тебя зовут?</Card.Title>
        <Card.Content>
          <Input
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Имя"
            maxLength={NAME_MAX_LENGTH}
            isCounterVisible
            hint="Это имя увидишь только ты"
          />
        </Card.Content>
        <Card.Footer>
          <Button size="m" disabled={!playerName.trim()} onPress={start}>
            Начать
          </Button>
        </Card.Footer>
      </Card>

      <Text variant="small" themeColor="textSecondary">
        Аккаунт не нужен: профиль хранится только на устройстве и никуда не
        отправляется.
      </Text>
    </Screen>
  );
};
