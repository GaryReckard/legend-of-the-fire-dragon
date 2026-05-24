import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // happy-dom is faster than jsdom and gives us a real window/localStorage
    // so save/load and input-related code can be tested without a browser.
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
    globals: false,
  },
});
