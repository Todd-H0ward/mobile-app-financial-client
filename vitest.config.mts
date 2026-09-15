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
  },
});
