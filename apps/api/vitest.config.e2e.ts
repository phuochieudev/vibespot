import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // DB Neon (gói free) có thể mất vài giây để thức dậy ở lần kết nối đầu.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
