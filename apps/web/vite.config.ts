import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    // The "mrt" chunk (material-react-table + date-pickers) stays a single large
    // vendor chunk on purpose: it is only pulled in by the lazy-loaded incidents
    // and work-orders routes, so it never blocks the initial paint.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('material-react-table') ||
            id.includes('@mui/x-date-pickers') ||
            id.includes('dayjs')
          )
            return 'mrt';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('@tanstack/react-query')) return 'query';
          return undefined;
        },
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'coverage/**'],
    coverage: {
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.spec.{ts,tsx}'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
