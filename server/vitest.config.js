import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    hookTimeout: 120000,
    testTimeout: 120000,
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    pool: "forks",
  },
});
