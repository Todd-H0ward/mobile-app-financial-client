import { useEffect } from 'react';

import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CONTENT_PADDING,
  LESSON_FADE_MS,
  SPACING,
  STATIC_ROUTES,
  TERMINAL,
} from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';

import { useLesson } from '../model';

import { Terminal } from './terminal';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * How long the terminal waits in the dark before it writes anything.
 *
 * The navigator's fade lands on black; this is the beat after it, so the
 * child sees the world go out and the machine come up as two moments rather
 * than one blur.
 */
const WAKE_DELAY_MS = LESSON_FADE_MS * 0.6;

/** How long the text takes to come up out of the dark. */
const WAKE_MS = 420;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** One paragraph of theory, with the machine counting them off. */
const Theory = ({
  paragraph,
  index,
  total,
  onNext,
}: {
  paragraph: string;
  index: number;
  total: number;
  onNext: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.body}>
      <Terminal.Line tone="amber" variant="label">
        {t('lesson.theoryOf', { index: index + 1, total })}
      </Terminal.Line>

      <Terminal>
        <Terminal.Line>{paragraph}</Terminal.Line>
      </Terminal>

      <Terminal.Key onPress={onNext}>
        {t(index + 1 < total ? 'lesson.next' : 'lesson.toTest')}
      </Terminal.Key>
    </View>
  );
};

/**
 * One question, answered once.
 *
 * The verdict stays on screen until the child moves on: a test that silently
 * advances is a test nobody learns from.
 */
const Test = ({
  question,
  options,
  index,
  total,
  verdict,
  answerIndex,
  onAnswer,
  onNext,
}: {
  question: string;
  options: string[];
  index: number;
  total: number;
  verdict: { chosen: number; isRight: boolean } | null;
  answerIndex: number;
  onAnswer: (option: number) => void;
  onNext: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.body}>
      <Terminal.Line tone="amber" variant="label">
        {t('lesson.questionOf', { index: index + 1, total })}
      </Terminal.Line>

      <Terminal.Line variant="heading" tone="text">
        {question}
      </Terminal.Line>

      <Terminal.Rule />

      <View style={styles.options}>
        {options.map((option, option_index) => (
          <Terminal.Choice
            key={option}
            index={option_index}
            isSpent={verdict !== null && option_index !== answerIndex}
            onPress={() => onAnswer(option_index)}
          >
            {option}
          </Terminal.Choice>
        ))}
      </View>

      {verdict === null ? null : (
        <>
          <Terminal.Line tone={verdict.isRight ? 'cyan' : 'amber'}>
            {t(verdict.isRight ? 'lesson.right' : 'lesson.wrong', {
              answer: options[answerIndex],
            })}
          </Terminal.Line>
          <Terminal.Key onPress={onNext}>
            {t(index + 1 < total ? 'lesson.nextQuestion' : 'lesson.toResult')}
          </Terminal.Key>
        </>
      )}
    </View>
  );
};

/** The readout at the end: the score, the verdict, and one way onward. */
const Result = ({
  correct,
  total,
  needed,
  isPassed,
  onRetry,
  onLeave,
}: {
  correct: number;
  total: number;
  needed: number;
  isPassed: boolean;
  onRetry: () => void;
  onLeave: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.body}>
      <Terminal.Line tone="amber" variant="label">
        {t('lesson.resultLabel')}
      </Terminal.Line>

      <Terminal>
        <Terminal.Line variant="heading" tone={isPassed ? 'cyan' : 'amber'}>
          {t('lesson.score', { correct, total })}
        </Terminal.Line>
        <Terminal.Rule />
        <Terminal.Line tone="dim">
          {t(isPassed ? 'lesson.passedText' : 'lesson.failedText', { needed })}
        </Terminal.Line>
      </Terminal>

      {isPassed ? null : (
        <Terminal.Key onPress={onRetry}>{t('lesson.retry')}</Terminal.Key>
      )}

      <Terminal.Key onPress={onLeave}>{t('lesson.back')}</Terminal.Key>
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The lesson behind one cell of the arena.
 *
 * Deliberately nothing like the rest of the app. The room the child lives in
 * is warm and rounded; this is the machine that hangs over the arena talking
 * to them, and it looks like the CRTs on the watchers' faces — dark, monospaced
 * and drawn with rules. The world dims out and this comes up in its place.
 */
export const LessonScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { cellId } = useLocalSearchParams<{ cellId: string }>();
  const lessonState = useLesson(cellId ?? '');

  /**
   * Back to the world, whether or not there is a world to go back to.
   *
   * A lesson is normally pushed over the arena, and `back` is right. But it
   * is also a route with an address, and opened at that address — a deep
   * link, a notification, a cold start — there is no screen underneath and
   * `back` is an error rather than a no-op.
   */
  const leave = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(STATIC_ROUTES.HOME);
  };

  const wake = useSharedValue(0);

  // Started from an effect, on the JS thread — a worklet may only call
  // worklets, and this is the rule that keeps Reanimated off the UI runtime
  // until the value is already moving (AGENTS.md).
  useEffect(() => {
    wake.value = withDelay(WAKE_DELAY_MS, withTiming(1, { duration: WAKE_MS }));
  }, [wake]);

  const wakeStyle = useAnimatedStyle(() => ({ opacity: wake.value }));

  const { lesson, stage } = lessonState;
  if (!lesson) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const question = lesson.questions[lessonState.index];

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.screen, wakeStyle]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: insets.bottom + SPACING.five,
              paddingTop: insets.top + SPACING.four,
            },
          ]}
        >
          <View style={styles.header}>
            <Terminal.Line tone="dim" variant="label">
              {t('lesson.header', { number: lessonState.number })}
            </Terminal.Line>
            <Terminal.Line variant="heading" tone="amber">
              {lesson.title.toUpperCase()}
            </Terminal.Line>
            <Terminal.Rule />
          </View>

          {stage === 'theory' ? (
            <Theory
              paragraph={lesson.theory[lessonState.index]}
              index={lessonState.index}
              total={lessonState.total}
              onNext={lessonState.next}
            />
          ) : null}

          {stage === 'test' && question ? (
            <Test
              question={question.question}
              options={question.options}
              index={lessonState.index}
              total={lessonState.total}
              verdict={lessonState.verdict}
              answerIndex={question.answerIndex}
              onAnswer={lessonState.answer}
              onNext={lessonState.next}
            />
          ) : null}

          {stage === 'result' ? (
            <Result
              correct={lessonState.correct}
              total={lesson.questions.length}
              needed={lessonState.needed}
              isPassed={lessonState.isPassed}
              onRetry={lessonState.retry}
              onLeave={leave}
            />
          ) : null}
        </ScrollView>
      </Animated.View>

      <Terminal.Scanlines />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  body: {
    gap: SPACING.three,
  },
  content: {
    gap: SPACING.four,
    paddingHorizontal: CONTENT_PADDING,
  },
  header: {
    gap: SPACING.one,
  },
  options: {
    gap: SPACING.two,
  },
  root: {
    backgroundColor: TERMINAL.void,
    flex: 1,
  },
  screen: {
    flex: 1,
  },
});
