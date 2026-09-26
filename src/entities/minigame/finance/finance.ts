type FinanceGame = 'market' | 'weekly';
interface FinanceRound {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}
/** Monday-based UTC week, stable on every device without a server. */
export const financeWeek = (at: number) =>
  Math.floor((Math.floor(at / 86400000) + 3) / 7);
/** Fixed arithmetic from game, calendar and round. Leaving never rerolls a sum. */
export const financeRound = (
  game: FinanceGame,
  at: number,
  index: number,
): FinanceRound => {
  const seed = game === 'weekly' ? financeWeek(at) : Math.floor(at / 86400000);
  const a = 5 + ((((seed * 17 + index * 11) % 13) + 13) % 13);
  const b = 2 + ((((seed + index) % 4) + 4) % 4);
  let question: string, answer: number, explanation: string;
  if (game === 'market') {
    if (index === 0) {
      answer = a * b;
      question = `Одна деталь стоит ${a} монет. Сколько стоят ${b} детали?`;
      explanation = `Цена × количество: ${a} × ${b} = ${answer}.`;
    } else if (index === 1) {
      answer = a * b + b;
      question = `Корзина стоит ${a * b} монет, доставка — ${b}. Сколько заплатишь всего?`;
      explanation = `Доставку тоже учитываем: ${a * b} + ${b} = ${answer}.`;
    } else {
      answer = a * b;
      question = `У тебя ${a * b + a} монет, покупка стоит ${a}. Сколько останется?`;
      explanation = `${a * b + a} − ${a} = ${answer}. Остаток доступен для других целей.`;
    }
  } else {
    if (index === 0) {
      answer = a * 2;
      question = `На неделю есть ${a * 5} монет. На нужды нужно ${a * 3}. Сколько останется распределить?`;
      explanation = `${a * 5} − ${a * 3} = ${answer}. Сначала обеспечиваем нужды.`;
    } else if (index === 1) {
      answer = a;
      question = `После нужд осталось ${a * 3}. В копилку отложим ${a * 2}. Сколько можно выделить на желания?`;
      explanation = `${a * 3} − ${a * 2} = ${answer}. Отложенные деньги не входят в остаток кошелька.`;
    } else {
      answer = a * b;
      question = `Цель стоит ${a * (b + 2)}, уже накоплено ${a * 2}. Сколько ещё нужно?`;
      explanation = `${a * (b + 2)} − ${a * 2} = ${answer}. Пересматриваем план в конце недели.`;
    }
  }
  const values = [answer, answer + b, Math.max(0, answer - b)];
  const shift = (((seed + index) % 3) + 3) % 3;
  const options = [...values.slice(shift), ...values.slice(0, shift)].map(
    String,
  );
  return {
    question,
    options,
    correct: options.indexOf(String(answer)),
    explanation,
  };
};
export type { FinanceGame, FinanceRound };
