/**
 * 测试用的临时库。必须在 import repositories 之前设好 DIGITAL_SELF_DB，
 * 否则 db/client.ts 会连到真实的 data/digital-self.db。
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function useTempDb(): string {
  const dir = mkdtempSync(join(tmpdir(), "ds-test-"));
  const dbPath = join(dir, "test.db");
  process.env.DIGITAL_SELF_DB = dbPath;

  execFileSync("npx", ["drizzle-kit", "migrate"], {
    stdio: "pipe",
    env: { ...process.env, DIGITAL_SELF_DB: dbPath },
  });

  return dir;
}

export function dropTempDb(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
