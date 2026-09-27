import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Screen, Text } from '@/shared/ui';

import { useLesson } from '../model';

import { Terminal } from './terminal';

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
  explanation,
  onAnswer,
  onNext,
}: {
  question: string;
  options: string[];
  index: number;
  total: number;
  verdict: { chosen: number; isRight: boolean } | null;
  answerIndex: number;
  explanation?: string;
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
          {explanation ? <Terminal.Line>{explanation}</Terminal.Line> : null}
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

      <Terminal.Key variant={isPassed ? 'primary' : 'ghost'} onPress={onLeave}>
        {t('lesson.back')}
      </Terminal.Key>
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Lessons share the same readable terminal as the rest of the game. */
export const LessonScreen = () => {
  const router = useRouter();
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

  const { lesson, stage } = lessonState;
  if (!lesson) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const question = lesson.questions[lessonState.index];

  return (
    <Screen
      gap="three"
      terminalVariant={
        stage === 'test' || stage === 'scenario' ? 'overseer' : 'keeper'
      }
    >
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Text
            variant="code"
            themeColor={
              stage === 'test' || stage === 'scenario'
                ? 'overseerLcd'
                : 'primary'
            }
          >
            {stage === 'test' || stage === 'scenario' ? '// ' : '> '}
            {t('lesson.header', { number: lessonState.number })}
          </Text>
          <Screen.Title>{lesson.title}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>
      {stage === 'theory' ? (
        <Theory
          paragraph={lesson.theory[lessonState.index]}
          index={lessonState.index}
          total={lessonState.total}
          onNext={lessonState.next}
        />
      ) : null}

      {stage === 'scenario' && lesson.scenario ? (
        <View style={styles.body}>
          <Terminal.Line tone="amber">{lesson.learningObjective}</Terminal.Line>
          <Terminal.Line>{lesson.scenario.situation}</Terminal.Line>
          {lesson.scenario.actions.map((action, index) => (
            <Terminal.Key
              key={action.title}
              onPress={() => lessonState.answer(index)}
            >
              {action.title}
            </Terminal.Key>
          ))}
          {lessonState.verdict ? (
            <>
              <Terminal.Line>
                {
                  lesson.scenario.actions[lessonState.verdict.chosen]
                    .consequence
                }
              </Terminal.Line>
              <Terminal.Key onPress={lessonState.next}>
                {t('lesson.toTest')}
              </Terminal.Key>
            </>
          ) : null}
        </View>
      ) : null}
      {stage === 'test' && question ? (
        <Test
          question={question.question}
          options={question.options}
          index={lessonState.index}
          total={lessonState.total}
          verdict={lessonState.verdict}
          answerIndex={question.answerIndex}
          explanation={question.explanation}
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
      ) : (
        <Terminal.Key variant="ghost" onPress={leave}>
          {t('lesson.back')}
        </Terminal.Key>
      )}
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  body: {
    gap: SPACING.three,
  },
  options: {
    gap: SPACING.two,
  },
});
