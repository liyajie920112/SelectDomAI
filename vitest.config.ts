import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['tests/release/**/*.test.ts'],
          environment: 'node'
        }
      },
      {
        test: {
          name: 'dom',
          include: ['tests/extension/**/*.test.ts'],
          environment: 'jsdom'
        }
      }
    ]
  }
});
