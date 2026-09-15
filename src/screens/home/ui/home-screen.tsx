import { useRouter } from 'expo-router';

import { Button, Card, Screen, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const HomeScreen = () => {
  const router = useRouter();

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header
        title="Лапка"
        subtitle="Комната питомца появится в первой волне"
      />

      <Card tone="surfaceSoft">
        <Card.Title>Разработка</Card.Title>
        <Card.Content>
          <Text themeColor="textSecondary">
            Витрина дизайн-системы: все компоненты и их состояния на одном
            экране.
          </Text>
        </Card.Content>
        <Card.Footer>
          <Button size="m" onPress={() => router.push('/ui-kit')}>
            Открыть UI-кит
          </Button>
        </Card.Footer>
      </Card>
    </Screen>
  );
};
