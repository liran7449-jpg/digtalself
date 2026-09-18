/**
 * 云端数据库连接串的唯一来源。
 *
 * 曾经有 4 个脚本各自把生产库的完整连接串（含密码）硬编码在第一行，
 * 而这些文件都提交到了 GitHub。仓库是私有的所以没有外泄，但凭证进了
 * git 历史 —— 删掉当前文件里的那行没有用，翻旧 commit 照样能拿到。
 * 唯一的彻底解法是在 Railway 换掉密码，让那串字符失效。
 *
 * 规范 §7：配置全部外置，禁止 hard code。
 *
 * 用法：
 *   CLOUD_DB_URL="postgresql://..." node scripts/xxx.mjs
 *
 * 连接串在 Railway → Postgres → Connect → Public Network 里拿。
 */

import postgres from "postgres";

export function requireCloudDbUrl() {
  const url = process.env.CLOUD_DB_URL;
  if (!url) {
    console.error("❌ 缺少 CLOUD_DB_URL 环境变量");
    console.error("");
    console.error("用法：");
    console.error('  CLOUD_DB_URL="postgresql://..." node scripts/<脚本名>');
    console.error("");
    console.error("连接串位置：Railway → Postgres → Connect → Public Network");
    process.exit(1);
  }
  return url;
}

/** 打印用的脱敏地址，密码换成 ***。 */
export function maskUrl(url) {
  return url.replace(/:[^:@]+@/, ":***@");
}

/** 连上云端库。ssl: prefer 是 Railway 的公网代理需要的。 */
export function connectCloud() {
  const url = requireCloudDbUrl();
  console.log(`☁️  ${maskUrl(url)}`);
  return postgres(url, { ssl: "prefer" });
}
