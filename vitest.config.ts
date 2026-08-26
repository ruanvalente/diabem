import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
    },
  },
  test: {
    globals: true,
    include: ["lib/**/*.test.ts"],
    setupFiles: ["lib/__tests__/setup.ts"],
  },
});
