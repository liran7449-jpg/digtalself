import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    /**
     * 必须在测试模块 import 之前设好隔离 env。
     * db/client.ts 与 media-repo.ts 在模块顶层读 env，静态 import
     * 会在 beforeAll 之前就连上真实库 / 真实照片目录（踩过两次）。
     * setupFiles 早于测试文件的 import 求值，是唯一挡得住的位置。
     */
    setupFiles: ["src/test/setup-env.ts"],
    // repository 测试共用一个进程内的 SQLite 连接，并行会互相干扰
    fileParallelism: false,
  },
});
