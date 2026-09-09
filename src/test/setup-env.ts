/**
 * Vitest setupFiles：在任何测试模块被 import 之前设好隔离用的 env。
 *
 * 为什么需要这一层：
 * db/client.ts 和 media-repo.ts 都在**模块顶层**读 env
 * （`const DB_PATH = process.env...`）。如果测试文件用静态 import
 * 引入 repo / service，那些模块会在 beforeAll() 之前就执行完，
 * env 还没设，于是连上真实的 data/digital-self.db 和 data/media/。
 *
 * 这个坑踩过两次：先是 media.test.ts 把图片写进用户真实照片目录，
 * 修好后又漏了 services.test.ts，测试数据写进了用户真实数据库。
 * 靠「记得用动态 import」防守不可靠，所以在 setupFiles 里强制隔离 ——
 * setupFiles 早于测试文件的 import 求值，静态 import 也挡得住。
 */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "ds-vitest-"));

process.env.DIGITAL_SELF_DB = join(dir, "setup.db");
process.env.DIGITAL_SELF_MEDIA_ROOT = join(dir, "media");
