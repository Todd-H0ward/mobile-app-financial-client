import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const localesDir = dirname(fileURLToPath(import.meta.url));

const loadLocale = (name: 'en' | 'ru'): Json =>
  JSON.parse(readFileSync(join(localesDir, `${name}.json`), 'utf8')) as Json;

/** Dot-path keys for every leaf — objects only, arrays stay as one leaf. */
const leafKeys = (value: Json, prefix = ''): string[] => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return leafKeys(child, path);
  });
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('i18n en ↔ ru key parity', () => {
  const en = loadLocale('en');
  const ru = loadLocale('ru');
  const enKeys = new Set(leafKeys(en));
  const ruKeys = new Set(leafKeys(ru));

  it('has the same leaf keys in both locales', () => {
    const missingInRu = [...enKeys].filter((key) => !ruKeys.has(key)).sort();
    const missingInEn = [...ruKeys].filter((key) => !enKeys.has(key)).sort();

    expect(
      missingInRu,
      'keys present in en.json but missing in ru.json',
    ).toEqual([]);
    expect(
      missingInEn,
      'keys present in ru.json but missing in en.json',
    ).toEqual([]);
  });

  it('keeps every leaf a non-empty string', () => {
    const walk = (value: Json, path: string): string[] => {
      if (typeof value === 'string') {
        return value.trim() === '' ? [path] : [];
      }
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return [];
      }
      return Object.entries(value).flatMap(([key, child]) =>
        walk(child, path ? `${path}.${key}` : key),
      );
    };

    expect(walk(en, '')).toEqual([]);
    expect(walk(ru, '')).toEqual([]);
  });
});
