import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\/content\//,
        replacement: `${fileURLToPath(new URL('./content', import.meta.url))}/`,
      },
      {
        find: /^@\/assets\//,
        replacement: `${fileURLToPath(new URL('./assets', import.meta.url))}/`,
      },
      {
        find: /^@\//,
        replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        external: [/react-native/, /expo-sqlite/, /expo-modules-core/],
      },
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/entities/economy/**/*.ts',
        'src/entities/minigame/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/index.ts',
        // Zustand persist store — needs native KV; pure scorers are covered.
        '**/*-store.ts',
      ],
      reporter: ['text', 'text-summary'],
      thresholds: {
        lines: 90,
        statements: 85,
        functions: 85,
        branches: 70,
      },
    },
  },
});
