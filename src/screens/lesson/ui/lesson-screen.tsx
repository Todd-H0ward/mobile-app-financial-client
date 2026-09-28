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

const Theory = ({
  paragraph,
  index,
  total,
}: {
  paragraph: string;
  index: number;
  total: number;
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
    </View>
  );
};

const Test = ({
  question,
  options,
  index,
  total,
  verdict,
  answerIndex,
  explanation,
  onAnswer,
}: {
  question: string;
  options: string[];
  index: number;
  total: number;
  verdict: { chosen: number; isRight: boolean } | null;
  answerIndex: number;
  explanation?: string;
  onAnswer: (option: number) => void;
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
            isAnswered={verdict !== null}
            mark={
              verdict === null
                ? null
                : option_index === answerIndex
                  ? 'right'
                  : option_index === verdict.chosen
                    ? 'wrong'
                    : null
            }
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
        </>
      )}
    </View>
  );
};

const Result = ({
  correct,
  total,
  needed,
  isPassed,
}: {
  correct: number;
  total: number;
  needed: number;
  isPassed: boolean;
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
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const LessonScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { cellId } = useLocalSearchParams<{ cellId: string }>();
  const lessonState = useLesson(cellId ?? '');

  // Deep link / cold start may have no screen underneath — dismissTo home then.
  const leave = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.dismissTo(STATIC_ROUTES.HOME);
  };

  const { lesson, stage } = lessonState;
  if (!lesson) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const question = lesson.questions[lessonState.index];
  const primaryLabel =
    stage === 'theory'
      ? t(
          lessonState.index + 1 < lessonState.total
            ? 'lesson.next'
            : 'lesson.toTest',
        )
      : stage === 'scenario' && lessonState.verdict
        ? t('lesson.toTest')
        : stage === 'test' && lessonState.verdict
          ? t(
              lessonState.index + 1 < lessonState.total
                ? 'lesson.nextQuestion'
                : 'lesson.toResult',
            )
          : null;

  return (
    <Screen gap={SPACING.THREE}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Text variant="code" themeColor="phosphor">
            {`> ${t('lesson.header', {
              number: lessonState.number,
              total: lessonState.lessonCount,
            })}`}
          </Text>
          <Screen.Title>{lesson.title}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>
      {stage === 'theory' ? (
        <Theory
          paragraph={lesson.theory[lessonState.index]}
          index={lessonState.index}
          total={lessonState.total}
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
            <Terminal.Line>
              {lesson.scenario.actions[lessonState.verdict.chosen].consequence}
            </Terminal.Line>
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
        />
      ) : null}

      {stage === 'result' ? (
        <Result
          correct={lessonState.correct}
          total={lesson.questions.length}
          needed={lessonState.needed}
          isPassed={lessonState.isPassed}
        />
      ) : null}

      <Screen.Footer>
        {stage === 'result' ? (
          <>
            {lessonState.isPassed ? null : (
              <Terminal.Key onPress={lessonState.retry}>
                {t('lesson.retry')}
              </Terminal.Key>
            )}
            <Terminal.Key
              variant={lessonState.isPassed ? 'primary' : 'ghost'}
              onPress={leave}
            >
              {t('lesson.back')}
            </Terminal.Key>
          </>
        ) : (
          <>
            {primaryLabel ? (
              <Terminal.Key onPress={lessonState.next}>
                {primaryLabel}
              </Terminal.Key>
            ) : null}
            <Terminal.Key variant="ghost" onPress={leave}>
              {t('lesson.back')}
            </Terminal.Key>
          </>
        )}
      </Screen.Footer>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  body: {
    gap: SPACING.THREE,
  },
  options: {
    gap: SPACING.TWO,
  },
});
