import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        'test/**',
        'vitest.config.js'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    sequence: {
      shuffle: true
    }
  }
});
