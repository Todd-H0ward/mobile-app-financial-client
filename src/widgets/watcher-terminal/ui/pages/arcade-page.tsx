import { type Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { GAME_REWARDS, PLAYKIT_GAME_IDS } from '@/entities/minigame';
import { ownedPuzzles } from '@/entities/minigame/puzzle';
import {
  ARCADE_PAID_SITTINGS,
  arcadePaidRemaining,
  useUser,
} from '@/entities/user';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { formatMoney } from '@/shared/utils';

import { TerminalMenuRow, TerminalRule, TerminalText } from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ArcadePageProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ArcadePage = ({ onBack }: ArcadePageProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const time = useTimeSource();
  const paidLeft = user ? arcadePaidRemaining(user, time.now()) : 0;
  const puzzles = ownedPuzzles(user?.ownedItemIds ?? []);

  return (
    <ScrollView contentContainerStyle={styles.stack}>
      <TerminalText>
        {t('watcher.terminal.arcade.paidLeft', {
          left: paidLeft,
          total: ARCADE_PAID_SITTINGS,
        })}
      </TerminalText>
      <TerminalText isDim>{t('watcher.terminal.arcade.hint')}</TerminalText>
      <TerminalRule />
      <TerminalText>{t('watcher.terminal.arcade.trialsTitle')}</TerminalText>
      {PLAYKIT_GAME_IDS.map((gameId) => (
        <TerminalMenuRow
          key={gameId}
          label={`${t(`playkit.games.${gameId}.title`)} · +${formatMoney(GAME_REWARDS[gameId])}`}
          onPress={() => router.push(DYNAMIC_ROUTES.play(gameId))}
        />
      ))}
      <TerminalRule />
      <TerminalMenuRow
        label={t('financeGame.market')}
        onPress={() => router.push(STATIC_ROUTES.GAMES_MARKET as Href)}
      />
      <TerminalMenuRow
        label={t('financeGame.weekly')}
        onPress={() => router.push(STATIC_ROUTES.GAMES_WEEKLY as Href)}
      />
      <TerminalMenuRow
        label={t('financeGame.console')}
        onPress={() => router.push(STATIC_ROUTES.GAMES_CONSOLE as Href)}
      />
      <TerminalMenuRow
        label={t('games.snake.title')}
        onPress={() => router.push(STATIC_ROUTES.GAMES_SNAKE as Href)}
      />
      <TerminalMenuRow
        label={t('games.spacewar.title')}
        onPress={() => router.push(STATIC_ROUTES.GAMES_SPACEWAR as Href)}
      />
      <TerminalRule />
      <TerminalText>{t('games.puzzle.title')}</TerminalText>
      {puzzles.length === 0 ? (
        <TerminalText isDim>{t('games.puzzle.empty')}</TerminalText>
      ) : (
        puzzles.map((level) => (
          <TerminalMenuRow
            key={level.id}
            label={`${t(`games.puzzle.levels.${level.id}`, {
              defaultValue: level.id,
            })} · +${formatMoney(GAME_REWARDS.puzzle)}`}
            onPress={() => router.push(DYNAMIC_ROUTES.puzzle(level.id))}
          />
        ))
      )}
      <TerminalRule />
      <TerminalMenuRow label={t('watcher.terminal.back')} onPress={onBack} />
    </ScrollView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: SPACING.two },
});
