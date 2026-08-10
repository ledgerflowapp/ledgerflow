import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    globalSetup: ['./src/test-global-setup.ts'],
    globalTeardown: ['./src/test-global-teardown.ts'],
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80 }
    },
  },
})
