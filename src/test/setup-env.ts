/**
 * Vitest setupFiles：在任何测试模块被 import 之前，把 DATABASE_URL
 * 指向一个专用测试库。
 *
 * 为什么必须在这一层：
 * db/client.ts 和 media-repo.ts 都在**模块顶层**读 env
 * （`const DATABASE_URL = process.env...`）。测试文件里哪怕是动态
 * import，一旦有别的静态 import 链先把它们拉起来，env 还没设，
 * 连接就固定在真实库上了。setupFiles 早于测试文件的 import 求值，
 * 是唯一挡得住的位置。
 *
 * 这个坑踩过三次，每次都是静默的：
 * 1. media.test.ts 把图片写进用户真实照片目录
 * 2. services.test.ts 把测试数据写进用户真实 SQLite 库
 * 3. 2026-09-18：守卫查的还是 SQLite 时代的 DIGITAL_SELF_DB，
 *    代码早就迁到 Postgres 了。守卫全绿，同时把 19 条测试 moment
 *    写进了用户的开发库。守卫检查的变量和代码实际使用的变量必须是
 *    同一个，否则守卫只是装饰。
 *
 * 所以现在的规则：测试库名必须以 _test 结尾，由 test-setup.ts 的
 * assertIsolated() 硬校验。不满足就拒绝跑，不是警告。
 */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * 测试库地址。
 *
 * 默认指向本地 docker compose 那个 Postgres 实例上的 digitalself_test 库
 * （和开发库 digitalself 同实例、不同库，互不影响）。
 * CI 或别的环境可以用 TEST_DATABASE_URL 覆盖，但库名仍须以 _test 结尾。
 */
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:localdev123@localhost:5432/digitalself_test";

process.env.DATABASE_URL = TEST_DB_URL;

// 媒体文件仍然写临时目录，不需要数据库
const dir = mkdtempSync(join(tmpdir(), "ds-vitest-"));
process.env.DIGITAL_SELF_MEDIA_ROOT = join(dir, "media");
