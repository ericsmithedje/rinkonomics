import { defineConfig } from 'vite';

export default defineConfig({
  base: '/rinkonomics/',
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
});
