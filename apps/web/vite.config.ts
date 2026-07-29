import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'coverage/**'],
    coverage: {
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.spec.{ts,tsx}'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 65,
        functions: 50,
        lines: 65,
        statements: 65,
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
