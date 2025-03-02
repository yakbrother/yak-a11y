import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    threads: false, // Disable threading to avoid Puppeteer issues
    isolate: false, // Disable isolation to prevent mock issues
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
    testTimeout: 35000, // Increase timeout to match our navigation timeouts
    hookTimeout: 35000,
    sequence: {
      shuffle: false // Disable shuffling for predictable test order
    }
  }
});
