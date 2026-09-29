import type { SpriteName } from '@/entities/sprite';

import type { PlaykitGameId } from '../lib/payout';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type BinId = 'needs' | 'wants' | 'savings';

interface ConveyorRound {
  kind: 'conveyor';
  /** Label shown on the travelling item. */
  item: string;
  /** Picture of the travelling item. */
  itemSprite: SpriteName;
  correctBin: BinId;
  explanation: string;
}

interface ScalesRound {
  kind: 'scales';
  /** Target coins on the needs pan. */
  targetNeeds: number;
  /** Target on wants. */
  targetWants: number;
  explanation: string;
}

interface CashierRound {
  kind: 'cashier';
  price: number;
  paid: number;
  /** Exact change required. */
  change: number;
  explanation: string;
}

interface JarRound {
  kind: 'jar';
  /** Indices (0…4) that are real coins to catch. */
  goodSlots: number[];
  /** Picture per slot: a coin on every good slot, a «хотелка» elsewhere. */
  slotSprites: SpriteName[];
  explanation: string;
}

interface PinballRound {
  kind: 'pinball';
  /** Target pocket index 0…2. */
  target: number;
  explanation: string;
}

interface MemoryRound {
  kind: 'memory';
  /** Six face-down cards: three pairs of matching labels. */
  cards: string[];
  /** Pair mate index for each card. */
  mates: number[];
  /** Picture per card: a coin on a price, the goods on the other half. */
  cardSprites: SpriteName[];
  explanation: string;
}

interface PathRound {
  kind: 'path';
  /** 3×3 grid: true = safe cell. */
  safe: boolean[];
  /** Ordered safe indices that form the climb. */
  solution: number[];
  explanation: string;
}

interface AssembleRound {
  kind: 'assemble';
  /** Slot labels in order. */
  slots: string[];
  /** Shuffled part labels; index → correct slot. */
  parts: string[];
  /** Correct slot index for each part. */
  map: number[];
  /** Picture per part, in `parts` order. */
  partSprites: SpriteName[];
  explanation: string;
}

interface LaserRound {
  kind: 'laser';
  lines: string[];
  /** Picture per receipt line, in `lines` order. */
  lineSprites: SpriteName[];
  /** Indices that are waste and must be marked. */
  waste: number[];
  explanation: string;
}

interface OrbitRound {
  kind: 'orbit';
  /** Window start/end in 0…1 around the circle where release succeeds. */
  windowStart: number;
  windowEnd: number;
  explanation: string;
}

type PlaykitRound =
  | ConveyorRound
  | ScalesRound
  | CashierRound
  | JarRound
  | PinballRound
  | MemoryRound
  | PathRound
  | AssembleRound
  | LaserRound
  | OrbitRound;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Conveyor cargo: label and picture, by the bin it belongs in. */
const CONVEYOR_ITEMS: Record<BinId, readonly [string, SpriteName][]> = {
  needs: [
    ['Заряд', 'bolt'],
    ['Батарея', 'battery'],
    ['Ремонт', 'wrench'],
  ],
  wants: [
    ['Наклейка', 'sticker'],
    ['Антенна', 'antenna'],
    ['Скин', 'paint'],
  ],
  savings: [
    ['Монета в банку', 'jar'],
    ['На ярус', 'stairs'],
    ['Отложить', 'piggy'],
  ],
};

/** What lands in the jar instead of a coin — every one of them a «хотелка». */
const JAR_FAKES: readonly SpriteName[] = [
  'candy',
  'sticker',
  'iceCream',
  'gift',
];

/** Memory pairs: a price and the goods it buys. */
const MEMORY_PAIRS: readonly (readonly [string, string, SpriteName])[] = [
  ['10', 'Хлеб', 'bread'],
  ['25', 'Заряд', 'bolt'],
  ['40', 'Модуль', 'chip'],
  ['15', 'Наклейка', 'sticker'],
  ['50', 'Ярус', 'stairs'],
];

const ASSEMBLE_SLOTS: readonly (readonly [string, SpriteName])[] = [
  ['Голова', 'dogHead'],
  ['Корпус', 'dogBody'],
  ['Лапы', 'dogLegs'],
];

const LASER_LINES: readonly (readonly [string, SpriteName])[] = [
  ['Заряд батареи', 'battery'],
  ['Мороженое', 'iceCream'],
  ['Наклейка-единорог', 'sticker'],
  ['Ремонт антенны', 'antenna'],
  ['Игрушка-сюрприз', 'gift'],
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Day-stable seed so leaving and returning keeps the same round. */
export const playkitDay = (at: number): number => Math.floor(at / 86_400_000);

const mix = (day: number, game: string, index: number): number => {
  let h = day * 374_761 + index * 668_265 + game.length * 97;
  for (let i = 0; i < game.length; i += 1)
    h = (h * 31 + game.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const pick = <T>(seed: number, list: readonly T[]): T =>
  list[seed % list.length] as T;

// ═══════════════════════════════════════════
// ROUNDS
// ═══════════════════════════════════════════

export const playkitRound = (
  gameId: PlaykitGameId,
  at: number,
  index: number,
): PlaykitRound => {
  const seed = mix(playkitDay(at), gameId, index);

  if (gameId === 'conveyor') {
    const bins: BinId[] = ['needs', 'wants', 'savings'];
    const correctBin = bins[seed % 3] as BinId;
    const [item, itemSprite] = pick(seed >> 3, CONVEYOR_ITEMS[correctBin]);
    return {
      kind: 'conveyor',
      item,
      itemSprite,
      correctBin,
      explanation:
        correctBin === 'needs'
          ? 'Заряд — нужное: без него пёс устаёт.'
          : correctBin === 'wants'
            ? 'Украшения — желаемое: можно купить позже.'
            : 'В копилку — накопления на следующий ярус.',
    };
  }

  if (gameId === 'scales') {
    const targetNeeds = 2 + (seed % 4);
    const targetWants = 1 + ((seed >> 2) % 3);
    return {
      kind: 'scales',
      targetNeeds,
      targetWants,
      explanation: `Весы сходятся при ${targetNeeds} на заряде и ${targetWants} на модулях.`,
    };
  }

  if (gameId === 'cashier') {
    const price = 5 + (seed % 12);
    const paid = price + 1 + ((seed >> 3) % 9);
    const change = paid - price;
    return {
      kind: 'cashier',
      price,
      paid,
      change,
      explanation: `Сдача: ${paid} − ${price} = ${change}.`,
    };
  }

  if (gameId === 'jar') {
    const goodSlots: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      if ((seed >> i) % 3 !== 0) goodSlots.push(i);
    }
    if (goodSlots.length === 0) goodSlots.push(seed % 5);
    const slotSprites = [0, 1, 2, 3, 4].map((slot) =>
      goodSlots.includes(slot) ? 'coin' : pick(seed + slot, JAR_FAKES),
    );
    return {
      kind: 'jar',
      goodSlots,
      slotSprites,
      explanation: 'В банку кладём только настоящие монеты, не «хотелки».',
    };
  }

  if (gameId === 'pinball') {
    const target = seed % 3;
    return {
      kind: 'pinball',
      target,
      explanation: `Лунка ${target + 1} — зарплата за этот раунд.`,
    };
  }

  if (gameId === 'memory') {
    const chosen = [0, 1, 2].map(
      (i) => MEMORY_PAIRS[(seed + i) % MEMORY_PAIRS.length]!,
    );
    const cards: string[] = [];
    const mates: number[] = [];
    const order = [0, 1, 2, 3, 4, 5].sort(
      (a, b) => ((seed >> a) & 7) - ((seed >> b) & 7),
    );
    const cardSprites: SpriteName[] = [];
    const placed = new Array<string>(6);
    const placedSprites = new Array<SpriteName>(6);
    const mateOf = new Array<number>(6);
    order.forEach((slot, i) => {
      const [price, goods, sprite] = chosen[Math.floor(i / 2)]!;
      const isPrice = i % 2 === 0;
      placed[slot] = isPrice ? price : goods;
      placedSprites[slot] = isPrice ? 'coin' : sprite;
    });
    for (let i = 0; i < 3; i += 1) {
      const a = order[i * 2]!;
      const b = order[i * 2 + 1]!;
      mateOf[a] = b;
      mateOf[b] = a;
    }
    for (let i = 0; i < 6; i += 1) {
      cards.push(placed[i]!);
      cardSprites.push(placedSprites[i]!);
      mates.push(mateOf[i]!);
    }
    return {
      kind: 'memory',
      cards,
      mates,
      cardSprites,
      explanation: 'Цена и товар — одна пара. Так читают чек.',
    };
  }

  if (gameId === 'path') {
    // Fixed climb pattern with one trap per row, seeded.
    const trapCol = [seed % 3, (seed >> 2) % 3, (seed >> 4) % 3];
    const safe = Array.from({ length: 9 }, (_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      return col !== trapCol[row];
    });
    const solution: number[] = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const i = row * 3 + col;
        if (safe[i]) {
          solution.push(i);
          break;
        }
      }
    }
    return {
      kind: 'path',
      safe,
      solution,
      explanation: 'Обходи ловушки — путь вверх по ярусам.',
    };
  }

  if (gameId === 'assemble') {
    const slots = ASSEMBLE_SLOTS.map(([slot]) => slot);
    const parts = [...slots].sort(
      (a, b) => ((seed + a.charCodeAt(0)) % 5) - ((seed + b.charCodeAt(0)) % 5),
    );
    const map = parts.map((part) => slots.indexOf(part));
    const partSprites = map.map(
      (slot): SpriteName => ASSEMBLE_SLOTS[slot]?.[1] ?? 'dogBody',
    );
    return {
      kind: 'assemble',
      slots,
      parts,
      map,
      partSprites,
      explanation: 'Каждая деталь — в свой слот. Модуль собран.',
    };
  }

  if (gameId === 'laser') {
    const lines = LASER_LINES.map(([line]) => line);
    const waste = [1, 2, 4].map((i) => (i + seed) % lines.length);
    const unique = [...new Set(waste)].slice(0, 2);
    return {
      kind: 'laser',
      lines,
      lineSprites: LASER_LINES.map(([, sprite]) => sprite),
      waste: unique,
      explanation: 'Лишние траты — желаемое. Отметь их, нужное оставь.',
    };
  }

  // orbit
  const windowStart = (seed % 70) / 100;
  return {
    kind: 'orbit',
    windowStart,
    windowEnd: Math.min(0.99, windowStart + 0.18),
    explanation: 'Отпусти монету, когда она над копилкой.',
  };
};

export type {
  AssembleRound,
  BinId,
  CashierRound,
  ConveyorRound,
  JarRound,
  LaserRound,
  MemoryRound,
  OrbitRound,
  PathRound,
  PinballRound,
  PlaykitRound,
  ScalesRound,
};
