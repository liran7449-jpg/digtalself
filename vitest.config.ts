import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // repository 测试共用一个进程内的 SQLite 连接，并行会互相干扰
    fileParallelism: false,
  },
});
