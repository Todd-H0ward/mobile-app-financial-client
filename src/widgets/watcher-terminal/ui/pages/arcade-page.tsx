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
import { Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import {
  TerminalCard,
  type TerminalFrame,
  TerminalMenu,
  TerminalMenuRow,
  TerminalShell,
  TerminalText,
} from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ArcadePageProps {
  frame: TerminalFrame;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Mini-games (screen 23): paid sittings left, then every game in one list. */
export const ArcadePage = ({ frame }: ArcadePageProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const time = useTimeSource();
  const paidLeft = user ? arcadePaidRemaining(user, time.now()) : 0;
  const puzzles = ownedPuzzles(user?.ownedItemIds ?? []);

  return (
    <TerminalShell
      {...frame}
      label={t('watcher.terminal.pages.arcade.label')}
      title={t('watcher.terminal.pages.arcade.title')}
    >
      <ScrollView contentContainerStyle={styles.stack}>
        <TerminalCard>
          <TerminalText>
            {t('watcher.terminal.arcade.paidLeft', {
              left: paidLeft,
              total: ARCADE_PAID_SITTINGS,
            })}
          </TerminalText>
          <TerminalText isDim>{t('watcher.terminal.arcade.hint')}</TerminalText>
        </TerminalCard>

        <Text variant="smallBold">
          {t('watcher.terminal.arcade.trialsTitle')}
        </Text>
        <TerminalMenu>
          {PLAYKIT_GAME_IDS.map((gameId) => (
            <TerminalMenuRow
              key={gameId}
              label={t(`playkit.games.${gameId}.title`)}
              value={`+${formatMoney(GAME_REWARDS[gameId])}`}
              onPress={() => router.push(DYNAMIC_ROUTES.play(gameId))}
            />
          ))}
        </TerminalMenu>

        <TerminalMenu>
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
        </TerminalMenu>

        <Text variant="smallBold">{t('games.puzzle.title')}</Text>
        {puzzles.length === 0 ? (
          <TerminalText isDim>{t('games.puzzle.empty')}</TerminalText>
        ) : (
          <TerminalMenu>
            {puzzles.map((level) => (
              <TerminalMenuRow
                key={level.id}
                label={t(`games.puzzle.levels.${level.id}`, {
                  defaultValue: level.id,
                })}
                value={`+${formatMoney(GAME_REWARDS.puzzle)}`}
                onPress={() => router.push(DYNAMIC_ROUTES.puzzle(level.id))}
              />
            ))}
          </TerminalMenu>
        )}
      </ScrollView>
    </TerminalShell>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: SPACING.TWO, paddingBottom: SPACING.TWO },
});
